// Jarvis HUD server
// Brain: Claude Agent SDK (Claude Code under the hood) + MCP connections
// Voice: Fish Audio or ElevenLabs TTS (falls back to the browser voice if no key)
// Front-end: sci-fi HUD served from /public, talks over WebSocket

import 'dotenv/config';
import express from 'express';
import { WebSocketServer } from 'ws';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import { createSelfRepair } from './self.js';
import { HUD_TOOLS, FAILURE_TOOLS, MEMORY_TOOLS, MODE_TOOLS, CRYPTO_TOOLS, PHONE_TOOLS, CALENDAR_TOOLS, MUSIC_TOOLS, MAINT_TOOLS, TRADE_TOOLS, CHART_TOOLS, SIGNAL_TOOLS, NEWS_TOOLS, OUTLOOK_TOOLS, MARKETDATA_TOOLS } from './tools.js';
import * as news from './news.js';
import * as cal from './calendar.js';
import * as spo from './spotify.js';
import * as crypto_ from './crypto.js';
import * as trade from './trade.js';
import * as md from './marketdata.js';
import * as lf from './livefeed.js';
import * as alerts from './alerts.js';
import * as chart from './chart.js';
import { outlook } from './outlook.js';
import * as sig from './signals.js';
import { analyzePhoto, parseDataUrl, MAX_IMAGE_BYTES } from './vision.js';
import { localClock, parseTime, dueSlots } from './schedule.js';
import { talk, brainConfig, chatSystemPrompt } from './brain.js';
import { runBench, renderText } from './bench/run.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Keep every request's fixed part byte-identical so the API's prompt cache hits (repeats billed at ~10%),
// and skip Claude Code extras Jarvis never uses. (Inherited by the Claude Code process the SDK starts.)
for (const [k, v] of Object.entries({
  CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
  CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
  CLAUDE_CODE_DISABLE_BUNDLED_SKILLS: '1',
  CLAUDE_CODE_DISABLE_CLAUDE_MDS: '1',
  CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY: '1',
  CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
  // Talk-mode prompts are too short for Haiku's cache minimum, so caching only adds a 25% write surcharge there
  DISABLE_PROMPT_CACHING_HAIKU: '1'
})) process.env[k] ??= v;
const PORT = Number(process.env.PORT || 7777);
const HOST = process.env.HOST || '0.0.0.0';
// Railway wipes the app folder on every deploy. If a Railway Volume is attached, keep data there so it survives.
const DATA_DIR = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(__dirname, 'data');
const CONFIG_DIR = path.join(__dirname, 'config');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');
const WORKSPACE = process.env.JARVIS_WORKSPACE || path.join(__dirname, 'workspace');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(WORKSPACE, { recursive: true });

// ---------- log ring buffer (Jarvis can read this to diagnose itself) ----------
const LOG = [];
const logs = {
  push(kind, msg) { LOG.push(`${new Date().toISOString().slice(11, 19)} [${kind}] ${String(msg).slice(0, 2000)}`); if (LOG.length > 500) LOG.shift(); },
  tail(n) { return LOG.slice(-n).join('\n'); }
};
for (const k of ['log', 'warn', 'error']) {
  const orig = console[k].bind(console);
  console[k] = (...a) => { logs.push(k, a.map(x => x instanceof Error ? x.stack : typeof x === 'string' ? x : JSON.stringify(x)).join(' ')); orig(...a); };
}
process.on('uncaughtException', e => console.error('uncaught', e));
process.on('unhandledRejection', e => console.error('unhandled rejection', e));

// ---------- persisted dashboard state ----------
function loadState() {
  try { return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8')); }
  catch { return { stats: {}, panels: {}, sessionId: null }; }
}
const state = loadState();
let freshBoot = !state.backupStamp;   // data/ was wiped: wait for the phone's backup before stamping anything newer
state.stats ||= {}; state.panels = {};   // no pop-ups on screen at boot
const saveState = () => { fs.writeFileSync(STATS_FILE, JSON.stringify(state, null, 2)); pushBackup(); };
// ---------- phone backup: the phone keeps a copy of Jarvis's memory, so a redeploy that wipes data/ loses nothing ----------
const BACKUP_KEYS = ['speakers', 'spotifyRefresh', 'places', 'reminders', 'seededReminders', 'calendarColors', 'watchlist', 'lastPlace', 'talkModel', 'workDay', 'shopAsk', 'placeSeeds', 'seededMoves', 'arrived', 'followups', 'outboxToken', 'reviewLink', 'followupTemplate', 'vehicles', 'tradeLog', 'memory', 'at', 'atSince', 'atInit', 'leftAt', 'lastCheck', 'alertCfg', 'silent', 'sigWatch', 'wlHide', 'wlHideSeeded', 'trail'];
const backupOf = () => Object.fromEntries(BACKUP_KEYS.filter(k => state[k] !== undefined).map(k => [k, state[k]]));
let lastBackup = null;
function pushBackup() {
  let j; try { if (!clients) return; j = JSON.stringify(backupOf()); } catch { return; }
  if (lastBackup === null) { lastBackup = j; return; }      // first call after boot just records the starting point
  if (j === lastBackup) return;
  if (freshBoot) { lastBackup = j; return; }   // never stamp or broadcast an empty memory over the phone's copy
  lastBackup = j; state.backupStamp = Date.now();
  try { fs.writeFileSync(STATS_FILE, JSON.stringify(state, null, 2)); } catch {}
  broadcast({ type: 'backup', data: { ...backupOf(), stamp: state.backupStamp } });
}

// ---------- websocket fan-out (all screens see the same HUD) ----------
const clients = new Set();
function broadcast(msg) {
  if (state.silent && msg.type === 'say' && msg.speak) msg = { ...msg, speak: false };   // silent / text-only mode: text on the HUD, never voice
  const s = JSON.stringify(msg);
  for (const c of clients) if (c.readyState === 1) c.send(s);
}

// ---------- the HUD's own tools (specs in tools.js; the brain uses these to drive the screen) ----------
const txt = t => ({ content: [{ type: 'text', text: t }] });
const handlers = {
  update_stats: async ({ stats = [] }) => {
    const now = new Date().toISOString();
    for (const s of stats) state.stats[s.id] = { ...s, updatedAt: now };
    saveState();
    broadcast({ type: 'stats', stats: state.stats });
    return `HUD updated: ${stats.map(s => s.label).join(', ')}`;
  },
  get_hud: async () => JSON.stringify({ stats: state.stats, panels: state.panels }, null, 2),
  remove_stats: async ({ ids = [] }) => {
    if (ids.includes('*')) state.stats = {};
    else for (const id of ids) delete state.stats[id];
    saveState();
    broadcast({ type: 'stats', stats: state.stats });
    return 'Removed.';
  },
  show_panel: async ({ id, title, body }) => {
    holdPanel(id, { title, body });
    return `NOT on screen yet: "${title}" is held until the Owner approves. Give your spoken answer, then end by asking "Would you like to see it on screen, sir?" Do not call show_panel again; it appears only if he says yes.`;
  },
  hide_panel: async ({ id }) => {
    if (id === '*') state.panels = {}; else delete state.panels[id];
    saveState();
    broadcast({ type: 'panels', panels: state.panels });
    return 'Hidden.';
  }
};
const sdkTools = specs => specs.map(s => tool(s.name, s.description, s.shape, async a => txt(await handlers[s.name](a))));
const dashboard = createSdkMcpServer({ alwaysLoad: true, name: 'dashboard', version: '1.0.0', tools: sdkTools(HUD_TOOLS) });

// ---------- failed commands (remembered across restarts so Jarvis can revisit them) ----------
state.failures ||= [];

// ---------- spending guard: hard daily cap, per-request caps, running total ----------
const DAILY_BUDGET = Number(process.env.DAILY_BUDGET_USD || 2);        // whole day, all requests
const CHAT_BUDGET = Number(process.env.CHAT_BUDGET_USD || 0.05);       // one normal question
const WORK_BUDGET = Number(process.env.WORK_BUDGET_USD || 0.75);       // one self-repair job
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: process.env.TZ || 'America/New_York' });
// Monthly caps: all AI spend (talk + workshop + tests), and self-repair on its own
const MONTHLY_BUDGET = Number(process.env.MONTHLY_BUDGET_USD || 10);
const WORK_MONTHLY_BUDGET = Number(process.env.WORK_MONTHLY_BUDGET_USD || 5);
const thisMonth = () => today().slice(0, 7);
function spendToday() { if (state.spend?.date !== today()) state.spend = { date: today(), usd: 0, requests: 0 }; return state.spend; }
function spendMonth() {
  if (state.month?.month !== thisMonth()) state.month = { month: thisMonth(), usd: 0, work: 0, talk: 0, tests: 0, requests: 0 };
  return state.month;
}
function addSpend(usd, kind = 'talk') {
  const s = spendToday(), m = spendMonth(), v = Number(usd) || 0;
  s.usd += v; s.requests += 1;
  m.usd += v; m.requests += 1; m[kind] = (m[kind] || 0) + v;
  saveState();
  return s;
}
// Why a request can't run right now (or null if it can)
function overBudget(mode) {
  const m = spendMonth();
  if (m.usd >= MONTHLY_BUDGET) return `I've reached this month's AI spending limit of ${MONTHLY_BUDGET.toFixed(2)} dollars, sir. Raise MONTHLY_BUDGET_USD in Railway if you want me to carry on.`;
  if (mode === 'work' && m.work >= WORK_MONTHLY_BUDGET) return `Self-repair has used this month's ${WORK_MONTHLY_BUDGET.toFixed(2)} dollar allowance, sir. Raise WORK_MONTHLY_BUDGET_USD in Railway, or I can carry on next month.`;
  if (spendToday().usd >= DAILY_BUDGET) return `I've reached today's spending limit of ${DAILY_BUDGET.toFixed(2)} dollars, sir. I'll be back tomorrow, or raise DAILY_BUDGET_USD in Railway.`;
  return null;
}

// Short rolling memory for talk mode (instead of an endless, ever-growing session)
state.history ||= [];
function remember(role, text) {
  state.history.push({ role, text: String(text).slice(0, 600), at: Date.now() });
  state.history = state.history.slice(-12);
  saveState();
}
const FAILURE_TTL = 7 * 24 * 60 * 60_000; // forget failed commands after about a week
function pruneFailures() {
  const cutoff = Date.now() - FAILURE_TTL;
  const kept = state.failures.filter(f => Date.parse(f.at) > cutoff);
  if (kept.length !== state.failures.length) { state.failures = kept; saveState(); }
}
function recordFailure(command, reason) {
  pruneFailures();
  const f = { id: crypto.randomUUID().slice(0, 8), command: String(command).slice(0, 500), reason: String(reason).slice(0, 300), at: new Date().toISOString() };
  state.failures.push(f);
  if (state.failures.length > 50) state.failures.shift();
  saveState();
  return f;
}
Object.assign(handlers, {
  note_failure: async ({ command, reason }) => `Remembered as failure ${recordFailure(command, reason).id}.`,
  list_failures: async () => (pruneFailures(), state.failures.length ? state.failures.map(f => `${f.id} · ${f.at.slice(0, 16).replace('T', ' ')} · "${f.command}" · ${f.reason}`).join('\n') : 'No failed commands on record.'),
  resolve_failure: async ({ id }) => {
    state.failures = id === '*' ? [] : state.failures.filter(f => f.id !== id);
    saveState();
    return 'Resolved.';
  }
});
// ---------- long-term memory: durable facts that carry across separate conversations (in BACKUP_KEYS, so redeploys keep them) ----------
state.memory ||= [];
const MEMORY_MAX = 200;
const normFact = t => String(t).toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();
Object.assign(handlers, {
  remember_fact: async ({ fact, topic }) => {
    const f = String(fact || '').trim().slice(0, 300); if (!f) return 'Nothing to remember.';
    const dup = state.memory.find(m => normFact(m.fact) === normFact(f));
    if (dup) { dup.at = new Date().toISOString(); saveState(); return `Already remembered (${dup.id}).`; }
    const m = { id: crypto.randomUUID().slice(0, 6), fact: f, topic: topic ? String(topic).slice(0, 30) : undefined, at: new Date().toISOString() };
    state.memory.push(m);
    if (state.memory.length > MEMORY_MAX) state.memory.shift();
    saveState();
    return `Remembered (${m.id}).`;
  },
  list_memory: async ({ search } = {}) => {
    const q = search ? normFact(search) : '';
    const rows = state.memory.filter(m => !q || normFact(m.fact + ' ' + (m.topic || '')).includes(q));
    return rows.length ? rows.map(m => `${m.id} · ${m.at.slice(0, 10)} · ${m.fact}`).join('\n') : 'Nothing in long-term memory.';
  },
  forget_fact: async ({ id }) => {
    state.memory = id === '*' ? [] : state.memory.filter(m => m.id !== id);
    saveState();
    return 'Forgotten.';
  }
});
const memoryServer = createSdkMcpServer({ alwaysLoad: true, name: 'memory', version: '1.0.0', tools: sdkTools(MEMORY_TOOLS) });
const memoryContext = () => state.memory.length
  ? `\nLong-term memory (facts from earlier conversations; trust them, use them naturally, don't recite unprompted): ${state.memory.slice(-60).map(m => `[${m.id}] ${m.fact}`).join(' | ')}`
  : '';
const failuresServer = createSdkMcpServer({ alwaysLoad: true, name: 'failures', version: '1.0.0', tools: sdkTools(FAILURE_TOOLS) });

function setPanel(id, panel) {
  if (panel) return holdPanel(id, panel);
  delete state.panels[id]; delete heldPanels[id];
  saveState();
  broadcast({ type: 'panels', panels: state.panels });
}

// ---------- self-repair (Jarvis edits, tests and redeploys its own code) ----------
let turnCounter = 0;
let turn = { id: 0, text: '', origin: '' };
const selfRepair = createSelfRepair({ tool, z, appDir: __dirname, workspace: WORKSPACE, getTurn: () => turn, broadcast, setPanel, logs });
const selfServer = createSdkMcpServer({ alwaysLoad: true, name: 'self', version: '1.0.0', tools: selfRepair.tools });

// ---------- external MCP connections from config/mcp.json ----------
function loadMcp() {
  const file = path.join(CONFIG_DIR, 'mcp.json');
  if (!fs.existsSync(file)) return {};
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  const servers = raw.mcpServers || {};
  const out = {};
  for (const [name, cfg] of Object.entries(servers)) {
    if (cfg.enabled === false) continue;
    const { enabled, note, ...rest } = cfg;
    // expand ${ENV_VAR} in strings so keys stay in .env
    out[name] = JSON.parse(JSON.stringify(rest).replace(/\$\{(\w+)\}/g, (_, k) => process.env[k] ?? ''));
  }
  return out;
}

function readText(file, fallback = '') {
  try { return fs.readFileSync(path.join(CONFIG_DIR, file), 'utf8'); } catch { return fallback; }
}

// ---------- model routing: fast + cheap for talk, stronger only for self-repair ----------
const CHAT_MODEL = process.env.JARVIS_MODEL || 'haiku';
const WORK_MODEL = process.env.JARVIS_CODE_MODEL || 'sonnet';
const WORK_WORDS = /\b(fix|repair|debug|redo|rewrite|deploy|roll(ed)?\b.*\bback|rollback|revert|undo|yourself|reactor|hud|telemetry|wake ?word|your (own )?(code|screen|voice|mic|microphone|settings?|personality|briefing|display|look|colou?rs?|font|layout|greeting))\b/i;
const SURE_WORK = /\b(roll ?back|revert|undo (that|your last|the last) (change|update)|deploy (it|that|the change)|(fix|repair|debug) (yourself|your (own )?(code|screen|mic|microphone|voice|display))|change your (own )?code)\b/i;
let escalate = false;
handlers.use_workshop = async () => { escalate = true; return 'Switching to workshop mode. End your turn now without replying.'; };
const modeServer = createSdkMcpServer({ alwaysLoad: true, name: 'mode', version: '1.0.0', tools: sdkTools(MODE_TOOLS) });
function pickMode(text, origin) {
  if (process.env.JARVIS_ALWAYS_WORK === '1') return 'work';
  if (selfRepair.active()) return 'work';          // mid-change, or "yes, deploy"
  // On OpenRouter the talk model decides (use_workshop); only unmistakable self-repair phrases skip straight to the workshop.
  if (origin === 'user' && (BRAIN === 'openrouter' ? SURE_WORK.test(text) : WORK_WORDS.test(text))) return 'work';
  return 'chat';
}

// ---------- the brain ----------
let busy = false;
let current = null; // running Query, for interrupt
const queue = [];

function ask(text, opts = {}) {
  return new Promise(resolve => {
    queue.push({ text, opts, resolve });
    if (!busy) drain();
  });
}
async function drain() {
  while (queue.length) {
    const { text, opts, resolve } = queue.shift();
    resolve(await run(text, opts));
  }
}

async function run(text, { spoken = true, origin = 'user', label, forceMode } = {}) {
  busy = true;
  const mode = forceMode || pickMode(text, origin);
  if (!forceMode) {
    turn = { id: ++turnCounter, text, origin };
    broadcast({ type: 'log', role: origin, text: label || text });
  }
  const blocked = overBudget(mode);
  if (blocked) {
    busy = false;
    broadcast({ type: 'say', text: blocked, speak: spoken });
    return blocked;
  }
  broadcast({ type: 'state', state: 'thinking' });
  if (mode === 'work') broadcast({ type: 'activity', text: 'Workshop mode' });
  const talkLocal = mode === 'chat' && BRAIN === 'openrouter';
  console.log(`turn ${turn.id}: ${mode} mode (${mode === 'work' ? WORK_MODEL : talkLocal ? talkModel() : CHAT_MODEL})`);
  escalate = false;
  const now = new Date();
  // Always the Owner's own time zone (his phone's, else TZ, else Eastern): the server itself runs on UTC.
  const ownerTz = state.location?.tz || process.env.TZ || 'America/New_York';
  const clock = `\n\n# Right now\nLocal time: ${now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short', timeZone: ownerTz })} (${ownerTz}).`;
  const hud = `\nOn the HUD: ${Object.values(state.stats).map(s => `${s.label}=${s.value}${s.delta ? ` (${s.delta})` : ''}`).join('; ') || 'nothing yet'}.`;
  pruneFailures();
  const failed = state.failures.length
    ? `\nUnresolved failed commands (resolve_failure once done): ${state.failures.slice(-10).map(f => `[${f.id}] "${f.command}" (${f.reason})`).join('; ')}.`
    : '';

  const external = loadMcp();
  const mcpServers = mode === 'work'
    ? { dashboard, self: selfServer, failures: failuresServer, memory: memoryServer, ...external }
    : { dashboard, failures: failuresServer, memory: memoryServer, mode: modeServer, ...external };
  const persona = readText('persona.md');
  const allowed = [
    'mcp__dashboard', 'mcp__failures', 'mcp__memory',
    ...Object.keys(external).map(n => `mcp__${n}`),
    'WebSearch', 'WebFetch',
    ...(mode === 'work'
      ? ['mcp__self', 'TodoWrite',
         // file access stays inside Jarvis's workspace; code edits only inside ./self
         'Read(./**)', 'Glob(./**)', 'Grep(./**)',
         'Edit(./self/**)', 'Write(./self/**)', 'MultiEdit(./self/**)',
         ...(process.env.JARVIS_ALLOW_SHELL === '1' ? ['Bash'] : [])]
      : ['mcp__mode'])
  ];
  // Talk mode: short, lean prompt = fast and cheap. Workshop mode: full engineering prompt.
  const recent = state.history.filter(h => Date.now() - h.at < 6 * 3600_000).slice(-8)
    .map(h => `${h.role === 'user' ? 'Owner' : 'You'}: ${h.text}`).join('\n');
  // Fixed part (identical every request → the API bills repeats at a 90% discount) vs. changing part (sent with the question)
  const live = (clock + hud + failed + memoryContext() + (recent && mode === 'chat' ? `\n\n# Recent conversation (for context)\n${recent}` : '')).trim();
  const promptWithContext = `<context>\n${live}\n</context>\n\n${text}`;
  const chatPrompt = chatSystemPrompt(persona);

  // Talk mode on OpenRouter (any model): our own tool loop, no Claude involved.
  if (talkLocal) return runTalk({ text, promptWithContext, chatPrompt, spoken, origin, label });

  let finalText = '';
  try {
    current = query({
      prompt: promptWithContext,
      options: {
        cwd: WORKSPACE,
        model: mode === 'work' ? WORK_MODEL : CHAT_MODEL,
        systemPrompt: mode === 'work' ? { type: 'preset', preset: 'claude_code', append: persona + '\n\nEach message starts with a <context> block (time, HUD, failed requests) supplied by the app, not typed by the Owner.' } : chatPrompt,
        ...(mode === 'chat' ? { thinking: { type: 'disabled' } } : {}),
        mcpServers,
        allowedTools: allowed,
        disallowedTools: ['Read(//proc/**)', 'Read(//sys/**)', 'Read(//etc/**)', 'Read(~/**)', 'Read(//root/**)'],
        permissionMode: 'dontAsk', // voice assistant can't click "approve": anything not listed above is denied
        // Talk: fresh every time (recent lines are in the prompt). Workshop: one session per self-change job only.
        resume: mode === 'work' && selfRepair.active() && state.workSessionId ? state.workSessionId : undefined,
        maxBudgetUsd: mode === 'work' ? WORK_BUDGET : CHAT_BUDGET,
        // Only send the built-in tools each mode actually uses (every tool description costs money on every request)
        tools: mode === 'work'
          ? ['Read', 'Glob', 'Grep', 'Edit', 'Write', 'TodoWrite', 'WebSearch', 'WebFetch', ...(process.env.JARVIS_ALLOW_SHELL === '1' ? ['Bash'] : [])]
          : ['WebSearch', 'WebFetch'],
        ...(mode === 'work' ? { effort: 'medium' } : {}),
        maxTurns: mode === 'work' ? Number(process.env.JARVIS_MAX_TURNS || 60) : 12
      }
    });

    for await (const m of current) {
      if (m.type === 'system' && m.subtype === 'init') {
        const conn = (m.mcp_servers || []).map(s => ({ name: s.name, status: s.status }));
        broadcast({ type: 'connections', connections: conn });
      }
      if (m.type === 'assistant' && !m.parent_tool_use_id) {
        for (const b of m.message?.content || []) {
          if (b.type === 'tool_use') console.log(`  tool: ${b.name}`);
          if (b.type === 'tool_use' && !['ToolSearch', 'TodoWrite'].includes(b.name)) {
            broadcast({ type: 'activity', text: prettyTool(b.name, b.input) });
          }
        }
      }
      if (m.type === 'result') {
        if (mode === 'work' && m.session_id) { state.workSessionId = m.session_id; saveState(); }
        const s2 = addSpend(m.total_cost_usd, mode === 'work' ? 'work' : 'talk');
        const u = m.usage || {};
        console.log(`  cost: $${(m.total_cost_usd || 0).toFixed(4)} (${mode}) · in ${u.input_tokens || 0} + cached ${u.cache_read_input_tokens || 0} + cache-write ${u.cache_creation_input_tokens || 0} · today $${s2.usd.toFixed(2)} of $${DAILY_BUDGET}`);
        broadcast({ type: 'spend', turn: m.total_cost_usd || 0, today: s2.usd, limit: DAILY_BUDGET });

        if (m.subtype === 'success') finalText = m.result || '';
        else if (m.subtype === 'error_max_budget_usd') finalText = mode === 'work'
          ? 'That job hit its cost limit before I finished, sir. Say "continue" if you want me to keep going.'
          : 'That one got too expensive for a quick answer, sir. Try asking it more simply.';
        else { finalText = 'I ran into a problem finishing that, sir. Check the log.'; if (origin === 'user') recordFailure(text, m.subtype); }
        broadcast({ type: 'meta', cost: m.total_cost_usd, ms: m.duration_ms });
      }
    }
  } catch (err) {
    console.error(err);
    finalText = /auth|api key|login/i.test(String(err))
      ? 'I cannot reach my brain, sir. The Anthropic key or Claude login needs attention.'
      : `Something went wrong: ${String(err.message || err).slice(0, 160)}`;
    if (origin === 'user') recordFailure(text, String(err.message || err));
    // a bad resume id shouldn't brick the assistant
    if (/session|resume/i.test(String(err))) { state.sessionId = null; saveState(); }
  } finally {
    current = null;
    busy = false;
  }

  // Talk mode handed this request to workshop mode: run the same request again there.
  if (escalate && mode === 'chat') return run(text, { spoken, origin, label, forceMode: 'work' });
  if (origin === 'user') { remember('user', text); remember('jarvis', finalText); }

  // Plain-English versions of common failures
  if (/credit balance is too low/i.test(finalText)) finalText = mode === 'work' && BRAIN === 'openrouter'
    ? 'That needed my workshop, sir, the part that changes my own code. It runs on Anthropic, and that account is out of credit. Everyday questions still work.'
    : 'I am out of Anthropic credit, sir. Top it up at console dot anthropic dot com, billing.';

  broadcast({ type: 'say', text: finalText, speak: spoken });
  return finalText;
}

// ---------- talk brain on OpenRouter ----------
// BRAIN=openrouter (default once OPENROUTER_API_KEY is set) or BRAIN=claude (the old Haiku path).
// Workshop mode (self-repair) always stays on Claude.
const BRAIN = (process.env.BRAIN || (process.env.OPENROUTER_API_KEY || process.env.BRAIN_API_KEY ? 'openrouter' : 'claude')).toLowerCase();
const TALK = brainConfig();
state.watchlist ||= [];
Object.assign(handlers, {
  crypto_scan: async ({ top } = {}) => {
    try {
      const r = await crypto_.scan({ top, watch: state.watchlist });
      return `${JSON.stringify(r)}\n\n${crypto_.PLAYBOOK}\n\n${news.AUTO_NEWS}`;
    } catch (e) { return `Could not get market data: ${e.message}. Tell the Owner plainly and call note_failure.`; }
  },
  crypto_trending: async () => {
    try { return JSON.stringify(await crypto_.trending()); }
    catch (e) { return `Could not get trending coins: ${e.message}.`; }
  },
  crypto_watch: async ({ action, ids = [] }) => {
    const clean = ids.map(i => String(i).toLowerCase().trim()).filter(i => /^[a-z0-9-]{1,60}$/.test(i));
    if (action === 'add') state.watchlist = [...new Set([...state.watchlist, ...clean])].slice(0, 25);
    if (action === 'remove') state.watchlist = state.watchlist.filter(i => !clean.includes(i));
    saveState();
    return `Watchlist: ${state.watchlist.join(', ') || 'empty'}.`;
  }
});

Object.assign(handlers, {
  ticker_news: async ({ symbol, kind }) => {
    const p = news.plan(symbol, kind);
    return p ? JSON.stringify(p) : 'Which ticker or coin?';
  }
});

Object.assign(handlers, {
  chart_read: async ({ symbol, timeframe }) => {
    try { return JSON.stringify({ ...(await chart.read({ symbol, timeframe })), newsStep: news.AUTO_NEWS }); }
    catch (e) { return `Could not read the chart: ${e.message} Tell the Owner plainly.`; }
  }
});

Object.assign(handlers, {
  market_outlook: async ({ symbol }) => {
    try { return JSON.stringify(await outlook({ symbol })); }
    catch (e) { return `Could not build the outlook: ${e.message} Tell the Owner plainly.`; }
  }
});

// Trading (Alpaca). Guardrails: propose -> Owner confirms in a LATER user turn; per-order and per-day caps; PAPER unless ALPACA_LIVE=1.
state.tradeLog ||= [];
let pendingTrade = null;
// Buy offers staged by alerts: a BUY-WATCH or dip alert leaves a $50 offer ready, so "buy it" is one step from the confirm.
// An offer never trades by itself: it only tells Jarvis what he can propose; the Owner must still say confirm.
let armedBuys = []; const ARM_MS = 60 * 60e3, ARM_DOLLARS = Math.min(50, Number(process.env.TRADE_MAX_ORDER || 50));
function armBuy(symbol, title, price) {
  const sym = trade.normSymbol(symbol); if (!sym) return;
  armedBuys = armedBuys.filter(a => a.symbol !== sym && Date.now() - a.at < ARM_MS);
  armedBuys.push({ symbol: sym, title, price, dollars: ARM_DOLLARS, at: Date.now() }); armedBuys = armedBuys.slice(-5);
}
const tradeFail = e => `Trading problem: ${e.message} Tell the Owner plainly.`;
const spentToday = () => { const d = new Date().toDateString(); return state.tradeLog.filter(t => new Date(t.at).toDateString() === d && t.side === 'buy').reduce((a, t) => a + t.dollars, 0); };
Object.assign(handlers, {
  trade_status: async () => {
    try { return JSON.stringify({ account: await trade.account(), positions: await trade.positions(), openOrders: await trade.orders(), spentTodayOnBuys: spentToday(), limits: { perOrder: trade.MAX_ORDER, perDay: trade.MAX_DAY } }); }
    catch (e) { return tradeFail(e); }
  },
  trade_quote: async ({ symbol }) => { try { return JSON.stringify(await trade.quote(symbol)); } catch (e) { return tradeFail(e); } },
  trade_propose: async ({ symbol, side, dollars }) => {
    if (!turn || turn.origin !== 'user') return 'Refused: trades can only be proposed when the Owner asks, never from a scheduled or system task.';
    const s = trade.normSymbol(symbol); if (!s) return 'Unrecognised symbol.';
    dollars = Math.round(dollars * 100) / 100;
    if (dollars > trade.MAX_ORDER) return `Refused: over the $${trade.MAX_ORDER} per-order limit. Tell the Owner; the limit is TRADE_MAX_ORDER.`;
    if (side === 'buy' && spentToday() + dollars > trade.MAX_DAY) return `Refused: would pass the $${trade.MAX_DAY} daily buy limit ($${spentToday()} used).`;
    try {
      const q = await trade.quote(s);
      const nm = await trade.assetName(s);
      pendingTrade = { symbol: s, side, dollars, price: q.price, turnId: turn.id, at: Date.now() };
      const spelled = s.replace('/USD', '').split('').join('-');
      return `PENDING (not placed): ${side} $${dollars} of ${s}${nm ? ' (' + nm + ')' : ''} at about $${q.price}. Read it back with the company name and the ticker spelled out letter by letter (${spelled}) so he can catch a misheard ticker, then ask him to say confirm.`;
    } catch (e) { return tradeFail(e); }
  },
  trade_confirm: async () => {
    if (!pendingTrade) return 'Nothing pending.';
    if (!turn || turn.origin !== 'user' || turn.id <= pendingTrade.turnId) return 'Refused: he has not confirmed yet. Ask him to say confirm.';
    if (Date.now() - pendingTrade.at > 120000) { pendingTrade = null; return 'That proposal expired (2 minutes). Propose again.'; }
    const t = pendingTrade; pendingTrade = null;
    try {
      const o = await trade.place(t);
      state.tradeLog.push({ ...t, orderId: o.id, status: o.status, mode: trade.mode(), at: new Date().toISOString() }); state.tradeLog = state.tradeLog.slice(-200); saveState();
      return `Placed: ${t.side} $${t.dollars} ${t.symbol}, status ${o.status}.`;
    } catch (e) { return tradeFail(e); }
  },
  armed_buys: async () => {
    const now = Date.now(); armedBuys = armedBuys.filter(a => now - a.at < ARM_MS);
    if (!armedBuys.length) return 'No buy offers are ready. No recent alert has one.';
    const left = Math.max(0, trade.MAX_DAY - spentToday());
    return JSON.stringify({ offers: armedBuys.map(a => ({ symbol: a.symbol, alert: a.title, alertPrice: a.price, minutesAgo: Math.round((now - a.at) / 60000), dollars: Math.min(a.dollars, trade.MAX_ORDER, left) })), dailyBuyLeft: left, guide: 'He is answering a buy alert. Take the newest offer unless he named a symbol; call trade_propose with the offer dollars (he can ask for another multiple of 50 up to the per-order limit), then read it back and wait for confirm in his NEXT message. If dailyBuyLeft is 0 say the daily limit is used.' });
  },
  trade_cancel: async ({ all } = {}) => {
    pendingTrade = null;
    try { return all ? await trade.cancelAll() : 'Pending trade cancelled.'; } catch (e) { return tradeFail(e); }
  }
});
// Free market-data feeds (Finnhub, Twelve Data, Financial Modeling Prep). Analysis only.
const mdFail = e => `Market data problem: ${e.message}. Tell the Owner plainly; if a key is missing say which one.`;
Object.assign(handlers, {
  stock_quote: async ({ symbol }) => { try { return JSON.stringify(await md.quote(symbol)); } catch (e) { return mdFail(e); } },
  stock_fundamentals: async ({ symbol }) => { try { return JSON.stringify(await md.fundamentals(symbol)); } catch (e) { return mdFail(e); } },
  stock_news: async ({ symbol }) => { try { return JSON.stringify(await md.news(symbol)); } catch (e) { return mdFail(e); } },
  stock_earnings: async ({ symbol }) => { try { return JSON.stringify(await md.earnings(symbol)); } catch (e) { return mdFail(e); } },
  data_feeds: async () => JSON.stringify(md.status())
});
// Calendar: what each colour means is saved in state.calendarColors ({ "6": "install job", "default": "personal" }).
state.calendarColors ||= {};
try { if (!Object.keys(state.calendarColors).length && process.env.CALENDAR_COLOR_MEANINGS) state.calendarColors = JSON.parse(process.env.CALENDAR_COLOR_MEANINGS); } catch {}
const calFail = e => `Calendar problem: ${e.message} Tell the Owner plainly and call note_failure.`;
Object.assign(handlers, {
  calendar_events: async a => {
    try {
      const r = await cal.list(a, state.calendarColors);
      console.log(`calendar_events asked ${JSON.stringify(a)} -> ${r.from}..${r.to}, ${r.count} events`);
      const by = {};
      for (const e of r.events) { const k = e.meaning || `${e.color} (no meaning saved yet)`; by[k] = (by[k] || 0) + 1; }
      return JSON.stringify({ ...r, countsByMeaning: by });
    } catch (e) { return calFail(e); }
  },
  calendar_colors: async ({ action, colorId, meaning }) => {
    try {
      if (action === 'set') {
        const id = colorId && /^(default|none)$/i.test(colorId) ? 'default' : cal.parseColor(colorId);
        if (!id || !meaning) return 'Need a valid colour (name or 1 to 11, or default) and a meaning.';
        state.calendarColors[id] = String(meaning).slice(0, 60); saveState();
        return `Saved: ${cal.colorName(id === 'default' ? '' : id)} means "${state.calendarColors[id]}".`;
      }
      if (action === 'survey') return JSON.stringify({ colours: await cal.colorSurvey(60, state.calendarColors), saved: state.calendarColors, palette: cal.COLORS });
      return JSON.stringify({ saved: Object.fromEntries(Object.entries(state.calendarColors).map(([k, m]) => [`${cal.colorName(k === 'default' ? '' : k)} (${k})`, m])) });
    } catch (e) { return calFail(e); }
  },
  calendar_add: async a => { try { return JSON.stringify(await cal.add(a)); } catch (e) { return calFail(e); } },
  calendar_update: async a => { try { return JSON.stringify(await cal.update(a)); } catch (e) { return calFail(e); } }
});
const TALK_TOOLS = [...HUD_TOOLS, ...FAILURE_TOOLS, ...MEMORY_TOOLS, ...MODE_TOOLS, ...CRYPTO_TOOLS, ...PHONE_TOOLS, ...CALENDAR_TOOLS, ...MUSIC_TOOLS, ...MAINT_TOOLS, ...TRADE_TOOLS, ...CHART_TOOLS, ...SIGNAL_TOOLS, ...NEWS_TOOLS, ...OUTLOOK_TOOLS, ...MARKETDATA_TOOLS];
// A model picked on the /bench page overrides TALK_MODEL until the next redeploy wipes data/
const talkModel = () => state.talkModel || TALK.model;

async function runTalk({ text, promptWithContext, chatPrompt, spoken, origin, label }) {
  const ac = new AbortController();
  current = { interrupt: async () => ac.abort() };
  let r;
  try {
    r = await talk({
      cfg: { ...TALK, model: talkModel() },
      system: chatPrompt,
      prompt: promptWithContext,
      tools: TALK_TOOLS,
      budgetUsd: CHAT_BUDGET,
      signal: ac.signal,
      onTool: (name, args) => { console.log(`  tool: ${name}`); if (!name.startsWith('openrouter')) broadcast({ type: 'activity', text: prettyTool(name, args) }); },
      run: async (name, args) => {
        if (name === 'use_workshop') { await handlers.use_workshop(); return { text: 'Switching to workshop mode.', stop: true }; }
        if (!handlers[name]) return `Unknown tool ${name}.`;
        return handlers[name](args);
      }
    });
  } finally {
    current = null;
    busy = false;
  }
  const s2 = addSpend(r.cost, 'talk');
  console.log(`  cost: $${r.cost.toFixed(5)} (talk · ${r.model}) · in ${r.usage.in} (cached ${r.usage.cached}) + out ${r.usage.out} · ${r.ms} ms · ${r.rounds} round(s) · today $${s2.usd.toFixed(3)} of $${DAILY_BUDGET} · month $${spendMonth().usd.toFixed(2)} of $${MONTHLY_BUDGET}`);
  broadcast({ type: 'spend', turn: r.cost, today: s2.usd, limit: DAILY_BUDGET });
  broadcast({ type: 'meta', cost: r.cost, ms: r.ms });

  if (escalate) return run(text, { spoken, origin, label, forceMode: 'work' });
  let finalText = r.text || (r.error ? 'I ran into a problem finishing that, sir. Check the log.' : 'I did not get an answer back from my brain on that one, sir. Please ask me again.');
  if (r.error && r.error !== 'aborted') { console.warn(`  talk error: ${r.error}`); if (origin === 'user') recordFailure(text, r.error); }
  if (origin === 'user') { remember('user', text); remember('jarvis', finalText); }
  broadcast({ type: 'say', text: finalText, speak: spoken });
  return finalText;
}

function prettyTool(name, input) {
  const n = name.replace(/^mcp__/, '').replace(/__/g, ' › ');
  if (name === 'WebSearch') return `Searching the web: ${input?.query ?? ''}`;
  if (name === 'use_workshop') return 'Workshop mode';
  if (name === 'WebFetch') return `Reading ${input?.url ?? 'a page'}`;
  if (name.startsWith('mcp__dashboard')) return `Updating HUD`;
  return `Using ${n}`;
}

// ---------- greetings & briefings ----------
// Opening the app or saying "wake up" costs nothing: a local greeting, no AI call.
// The AI briefing (config/briefing.md) runs only on request ("brief me") or on the optional schedule.
// Weather via Open-Meteo (free, no key). Default location Harrington, DE; override with WEATHER_LAT / WEATHER_LON.
const WX_KINDS = c => c === 0 ? 'clear' : c <= 3 ? 'cloudy' : c <= 48 ? 'foggy' : c <= 57 ? 'drizzling' : c <= 67 ? 'raining' : c <= 77 ? 'snowing' : c <= 82 ? 'raining' : c <= 86 ? 'snowing' : 'stormy';
const WX_NOW = { clear: 'clear', cloudy: 'cloudy', foggy: 'foggy', drizzling: 'drizzling', raining: 'raining', snowing: 'snowing', stormy: 'stormy' };
const US_TZ = /^(America\/(New_York|Chicago|Denver|Los_Angeles|Phoenix|Anchorage|Detroit|Boise|Juneau|Adak|Indiana|Kentucky|Menominee|North_Dakota)|Pacific\/Honolulu)/;
// Position: the phone's last reported location (sent when the app opens), else WEATHER_LAT/LON, else Harrington DE.
const wxPlace = () => state.location?.lat != null
  ? { lat: state.location.lat, lon: state.location.lon, live: true }
  : { lat: process.env.WEATHER_LAT || '38.92', lon: process.env.WEATHER_LON || '-75.57', live: false };
async function wxFetch(days = 1) {
  const { lat, lon } = wxPlace();
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=${Math.max(1, Math.min(7, days))}&timezone=auto`, { signal: AbortSignal.timeout(6000) });
  if (!r.ok) throw new Error('weather ' + r.status);
  const j = await r.json();
  const f = US_TZ.test(j.timezone || '');
  if (f) { // ask again in Fahrenheit/mph for US timezones
    const r2 = await fetch(r.url + '&temperature_unit=fahrenheit&wind_speed_unit=mph', { signal: AbortSignal.timeout(6000) }).catch(() => null);
    if (r2?.ok) { const j2 = await r2.json(); j2.timezone = j.timezone; j2.__f = true; return j2; }
  }
  j.__f = false; return j;
}
async function currentWeather() {
  const j = await wxFetch(1);
  if (j.timezone && state.location) state.location.tz = j.timezone;
  return { kind: WX_KINDS(j.current.weather_code), temp: Math.round(j.current.temperature_2m), unit: j.__f ? 'degrees' : 'degrees Celsius' };
}
// ---------- places & random contextual reminders ----------
// Places are named by voice ("this is Brenda's") and stored with the phone's position. Reminders sit in a bucket, each tied
// to optional triggers (place, time of day, weekdays). They are checked on app open and now and then while the app is open,
// with a dice roll and a cooldown, so they never feel scheduled.
state.places ||= []; state.reminders ||= [];
const km = (a, b) => { const R = 6371, r = x => x * Math.PI / 180, dl = r(b.lat - a.lat), dn = r(b.lon - a.lon);
  const h = Math.sin(dl / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); };
const nowCtx = () => {
  const tz = state.location?.tz || process.env.TZ || 'America/New_York';
  const d = new Date();
  const h = Number(d.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }));
  const wd = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: tz });
  return { tod: h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night', weekend: wd === 'Sat' || wd === 'Sun', h, wd, tz,
    day: d.toLocaleDateString('en-CA', { timeZone: tz }) };
};
const currentPlace = () => {
  const L = state.location; if (!L || Date.now() - Date.parse(L.at) > 6 * 3600e3) return null;
  let best = null;
  for (const p of state.places) { const d = km(L, p) * 1000; if (d <= (p.radius || 150) && (!best || d < best.d)) best = { ...p, d }; }
  return best;
};
const placeKey = n => String(n || '').toLowerCase().trim().replace(/^the\s+/, '').replace(/[^a-z0-9]/g, ''); // "the shop" = "shop"
function pickReminder(roll = Math.random) {
  const pl = currentPlace(), c = nowCtx(), now = Date.now();
  const ok = state.reminders.filter(r => r.on !== false
    && placeOk(r, pl)
    && (!r.time || r.time === c.tod)
    && (!r.days || (r.days === 'weekends') === c.weekend)
    && (!r.lastShown || now - r.lastShown > (r.cooldownHours ?? 20) * 3600e3));
  // contextual ones (tied to a place or time) get rolled by their own chance; one at most per check
  for (const r of ok.sort(() => roll() - .5)) if (roll() * 100 < (r.chance ?? 40)) {
    r.lastShown = now;
    state.pendingQ = r.kind === 'question' ? { id: r.id, at: now } : null;
    saveState(); return r;
  }
  return null;
}
// trigger "at" (default): only while inside the place's perimeter. "away": only while NOT there (fresh location needed).
function placeOk(r, pl) {
  if (r.kind === 'bring' || ['arrive', 'leave', 'heading'].includes(r.trigger)) return false; // those fire on arrive/leave/heading events, not at random
  if (!r.place) return true;
  const here = pl && placeKey(pl.name) === placeKey(r.place);
  if (r.trigger !== 'away') return !!here;
  const L = state.location, known = state.places.some(p => placeKey(p.name) === placeKey(r.place));
  return known && !here && L && Date.now() - Date.parse(L.at) < 30 * 60e3;
}
// Pop-up panels never appear on their own. They are held until Jarvis asks "want to see it?" and the Owner says yes (anything else = no).
const heldPanels = {};
function holdPanel(id, panel) { heldPanels[id] = { id, ...panel, heldAt: Date.now() }; }
const PANEL_YES = /^(yes|yeah|yea|yep|yup|ya|sure|ok|okay|please|go ahead|show( it| me| them)?|do it|put it up|pull it up|let s see|let me see|why not|absolutely|of course|definitely|sounds good|affirmative)\b/;
async function panelAnswer(text) {
  const held = Object.values(heldPanels).filter(h => Date.now() - h.heldAt < 10 * 60e3);
  if (!held.length) { for (const k in heldPanels) delete heldPanels[k]; return false; }
  const t = norm(text).replace(/^(hey )?jarvis /, '');
  for (const k in heldPanels) delete heldPanels[k];   // default is no: whatever he says next, the held panel is dropped
  if (t.split(' ').length > 6 || !PANEL_YES.test(t)) return false;
  for (const h of held) state.panels[h.id] = { id: h.id, title: h.title, body: h.body, updatedAt: new Date().toISOString() };
  saveState(); broadcast({ type: 'panels', panels: state.panels });
  const reply = 'Putting it on screen, sir.';
  broadcast({ type: 'log', role: 'user', text }); remember('user', text);
  remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true });
  return true;
}
// A bucket question with its own yes/no replies is answered here (short answers only, within 10 minutes).
async function bucketAnswer(text) {
  const q = state.pendingQ; if (!q || Date.now() - q.at > 10 * 60e3) return false;
  if (q.type === 'dest') return destAnswer(q, text);
  if (q.type === 'checklist') return checklistAnswer(q, text);
  const r = state.reminders.find(x => x.id === q.id);
  const t = norm(text).replace(/^(hey )?jarvis /, '');
  if (!r || t.split(' ').length > 6) { state.pendingQ = null; saveState(); return false; }
  const yes = SHOP_NO.test(t) ? false : SHOP_YES.test(t) ? true : null;
  if (yes === null) return false;
  state.pendingQ = null; saveState();
  const reply = (yes ? r.yes : r.no) || (yes ? 'Very good, sir.' : 'Understood, sir.');
  broadcast({ type: 'log', role: 'user', text }); remember('user', text);
  remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true });
  return true;
}
// Arrival remark only when the place changed since the last check, so it is news and not a habit.
function placeNote() {
  const pl = currentPlace(), key = pl ? placeKey(pl.name) : '';
  if (key === (state.lastPlace || '') || (state.cand && state.at !== key)) return ''; // unchanged, or an unconfirmed edge reading
  state.lastPlace = key; saveState();
  if (!pl) return '';
  const c = nowCtx();
  if (state.at === key) return ''; // the movement engine already greeted this arrival
  if (pl.kind === 'home') return '';
  if (placeKey(pl.name) === 'shop') { state.workDay = { day: c.day, on: true }; if (state.shopAsk) state.shopAsk.pending = false; saveState(); }
  return ` I see you're at ${pl.name} ${c.tod === 'night' ? 'tonight' : 'this ' + c.tod}, sir.`;
}
function contextNote() { const arrive = placeNote(); const q = shopQuestion(); if (q) return arrive + ' ' + q; const r = pickReminder(); return arrive + (r ? ' ' + r.text : ''); }
handlers.place_save = async ({ name, radius_m, home }) => {
  const L = state.location; if (!L || Date.now() - Date.parse(L.at) > 15 * 60e3) return 'I do not have a fresh location from the phone. Tell the Owner to allow location for the app, then try again.';
  const key = placeKey(name);
  state.places = state.places.filter(p => placeKey(p.name) !== key);
  const radius = radius_m || (key === 'shop' ? SHOP_RADIUS : 150);
  state.places.push({ name, lat: L.lat, lon: L.lon, radius, kind: home || /^home$/i.test(name) ? 'home' : key === 'shop' ? 'work' : 'place' });
  state.lastPlace = key; saveState();
  return `Saved "${name}" at his current position (within ${radius} m).`;
};
handlers.place_list = async () => state.places.length ? state.places.map(p => `${p.name}${p.kind === 'home' ? ' (home)' : ''}`).join(', ') + (currentPlace() ? `. He is at ${currentPlace().name} now (last phone position ${Math.round((Date.now() - Date.parse(state.location.at)) / 60000)} min ago).` : '. He is not at any saved place now.') : 'No places saved yet.';
handlers.reminder_add = async a => {
  const id = Math.random().toString(36).slice(2, 7);
  state.reminders.push(cleanItem({ ...a, id }));
  saveState(); return `Added reminder ${id}. It will come up at random when it fits (chance ${a.chance ?? 40}% per check).`;
};
// One bucket item: reminder | mention | question (a question may carry its own yes/no replies).
function cleanItem(a) {
  const pick = (v, ok) => ok.includes(v) ? v : undefined, str = v => String(v ?? '').trim().slice(0, 300) || undefined;
  const num = (v, d, lo, hi) => { const n = Number(v); return Number.isFinite(n) && v !== '' && v != null ? Math.min(hi, Math.max(lo, n)) : d; };
  const kind = pick(a.kind, ['reminder', 'mention', 'question', 'bring']) || 'reminder';
  return { id: str(a.id) || Math.random().toString(36).slice(2, 7), kind, text: str(a.text), place: str(a.place),
    trigger: a.place && kind !== 'bring' ? pick(a.trigger, ['at', 'away', 'arrive', 'leave', 'heading']) || 'at' : undefined,
    once: kind === 'bring' || a.once === true || a.once === 'true' ? true : undefined,
    time: pick(a.time, ['morning', 'afternoon', 'evening', 'night']), days: pick(a.days, ['weekdays', 'weekends']),
    chance: num(a.chance, 40, 1, 100), cooldownHours: num(a.cooldown_hours ?? a.cooldownHours, 20, 1, 24 * 30),
    yes: kind === 'question' ? str(a.yes) : undefined, no: kind === 'question' ? str(a.no) : undefined,
    on: a.on === false ? false : undefined, lastShown: a.lastShown };
}
handlers.reminder_list = async () => state.reminders.length ? state.reminders.map(r => `${r.id} [${r.kind || 'reminder'}]: "${r.text}"${r.place ? (r.trigger === 'away' ? ' away from ' : ' @') + r.place : ''}${r.time ? ' ' + r.time : ''}${r.days ? ' ' + r.days : ''} ${r.chance}%`).join('\n') : 'The reminder bucket is empty.';
handlers.reminder_remove = async ({ id }) => { const n = state.reminders.length; state.reminders = state.reminders.filter(r => r.id !== id); saveState(); return n === state.reminders.length ? 'No reminder with that id.' : 'Removed.'; };
if (!state.seededReminders) { // starter bucket; the Owner can edit by voice
  state.reminders.push({ id: 'dogs', text: "Do you have the dogs with you? Don't forget to check that they have food.", place: 'home', time: 'morning', chance: 45, cooldownHours: 22 });
  state.seededReminders = true;
}
// While the app is open, now and then, a reminder can come up on its own (only when Jarvis is idle).
if (!process.env.JARVIS_SMOKE) setInterval(() => {
  if (busy || !clients.size || Math.random() > .35) return;
  const text = shopQuestion() || pickReminder()?.text; if (text) { remember('jarvis', text); broadcast({ type: 'say', text, speak: true }); }
}, 25 * 60_000);

// ---------- the shop: perimeter + "headed to the shop?" check-in ----------
// The shop is a saved place with a wider perimeter (SHOP_RADIUS_M, default 250 m). On shop days (SHOP_DAYS), in the
// morning window (SHOP_ASK_FROM..SHOP_ASK_TO hours), when he is not at the shop yet, Jarvis now and then asks if he is
// headed in. Yes: today's jobs from the calendar + a shop reminder from the bucket. No: not in work mode today, no more
// asking. Asked at most once a day. Arriving inside the perimeter also counts as a yes.
const SHOP_RADIUS = Number(process.env.SHOP_RADIUS_M || 250);
const SHOP_DAYS = String(process.env.SHOP_DAYS || 'Mon,Tue,Wed,Thu,Fri,Sat').split(/[\s,]+/).map(d => d.slice(0, 3).toLowerCase());
const SHOP_FROM = Number(process.env.SHOP_ASK_FROM ?? 7), SHOP_TO = Number(process.env.SHOP_ASK_TO ?? 13);
const SHOP_CHANCE = Number(process.env.SHOP_ASK_CHANCE ?? 50);
const shopPlace = () => state.places.find(p => placeKey(p.name) === 'shop');
const SHOP_QS = ['Are you headed to the shop today, sir?', 'Will we be going to the shop today, sir?', 'Is it a shop day today, sir?'];
function shopQuestion(roll = Math.random) {
  const c = nowCtx(), pl = currentPlace();
  if (!shopPlace() || !SHOP_DAYS.includes(c.wd.toLowerCase())) return null;
  if (state.workDay?.day === c.day || state.shopAsk?.day === c.day) return null; // already know, or already asked today
  if (pl && placeKey(pl.name) === 'shop') return null;
  if (c.h < SHOP_FROM || c.h >= SHOP_TO || roll() * 100 >= SHOP_CHANCE) return null;
  state.shopAsk = { day: c.day, at: Date.now(), pending: true }; saveState();
  return SHOP_QS[Math.floor(roll() * SHOP_QS.length) % SHOP_QS.length];
}
async function shopDay(going) {
  const c = nowCtx();
  state.workDay = { day: c.day, on: !!going };
  if (state.shopAsk) state.shopAsk.pending = false;
  saveState();
  if (!going) return 'No worries, sir. Not in work mode today. Understood.';
  let line = 'Very good, sir.';
  if (cal.configured()) {
    try {
      const r = await cal.list({}, state.calendarColors);
      const timed = r.events.filter(e => !e.allDay);
      const jobs = timed.some(e => /job/i.test(e.meaning || '')) ? timed.filter(e => /job/i.test(e.meaning || '')) : timed;
      const next = jobs.find(e => Date.parse(e.start) > Date.now());
      const at = e => new Date(e.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: c.tz });
      if (!jobs.length) line += ' Nothing on the calendar for today.';
      else line += ` You have ${jobs.length} ${jobs.length === 1 ? 'appointment' : 'appointments'} today` + (next ? `; next up, ${next.title} at ${at(next)}.` : ', all of them behind you now.');
    } catch (e) { console.warn('shop day calendar:', e.message); }
  }
  const now = Date.now();
  const rs = state.reminders.filter(r => r.on !== false && placeKey(r.place) === 'shop' && (!r.lastShown || now - r.lastShown > (r.cooldownHours ?? 20) * 3600e3));
  const r = rs[Math.floor(Math.random() * rs.length)];
  if (r) { r.lastShown = now; saveState(); line += ' ' + r.text; }
  return line;
}
// A short yes/no right after the question is answered here, free and instant. Anything longer goes to the brain,
// which has the question in its history and calls shop_day itself.
const SHOP_YES = /^(yes|yeah|yea|yep|yup|ya|sure|correct|affirmative|of course|absolutely|definitely|indeed|i am|i m headed|headed|heading|on my way|omw|going in|i will|we are|we will|it is)\b/;
const SHOP_NO = /^(no|nope|nah|negative|not today|i m not|im not|not going|nope not|staying home|day off|taking the day|we re not|it s not|it is not|i won t|i will not|won t be)\b/;
// Silent / text-only mode: toggled by voice, free and instant (no AI call), remembered in state (phone-backed up).
const SILENT_ON = /\b(go silent|be silent|silent mode|text only|text-only|no more (talking|voice)|mute (your )?voice)\b/;
const SILENT_OFF = /\b(you can (talk|speak) again|start (talking|speaking)|talk to me again|voice (back )?on|unmute (your )?voice|end silent mode|silent mode off|(turn|switch) (the |your )?voice on|speak again)\b/;
function silentAnswer(text) {
  const t = norm(text).replace(/^(hey )?jarvis /, '');
  if (t.split(' ').length > 10) return false;
  const off = SILENT_OFF.test(t), on = !off && SILENT_ON.test(t);
  if (!on && !off) return false;
  state.silent = on; saveState();
  broadcast({ type: 'silent', on });
  broadcast({ type: 'log', role: 'user', text }); remember('user', text);
  const reply = on ? 'Silent mode on. I will reply in text only until you say I can talk again.' : 'Voice is back on, sir.';
  remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: !on });
  return true;
}
async function shopAnswer(text) {
  const a = state.shopAsk;
  if (!a?.pending || Date.now() - a.at > 10 * 60e3) return false;
  const t = norm(text).replace(/^(hey )?jarvis /, '').replace(/\bi m\b/g, 'i m');
  if (t.split(' ').length > 6) { a.pending = false; saveState(); return false; }
  const going = SHOP_NO.test(t) ? false : SHOP_YES.test(t) ? true : null; // "no" first: "it is not"
  if (going === null) return false;
  broadcast({ type: 'log', role: 'user', text }); remember('user', text);
  const reply = await shopDay(going);
  remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true });
  return true;
}
handlers.shop_day = async ({ going }) => shopDay(going);

// ---------- comings and goings: arrive / leave events from any location update (app open, or the app's background reports) ----------
// Hysteresis: you are "at" a place inside its radius, and only "left" once you are 120 m past it, so GPS jitter at the edge
// does not make Jarvis greet you twice. Events turn into at most one short remark each, rate limited, quiet at night.
// Items (the Places box / voice): trigger arrive | leave | heading (said when he is headed there), once = fire then delete,
// kind bring = something to bring TO that place (said when he leaves anywhere else / says he's headed there; cleared on arrival).
const LEAVE_MARGIN = 120, QUIET_FROM = Number(process.env.QUIET_FROM ?? 22), QUIET_TO = Number(process.env.QUIET_TO ?? 6);
const CONFIRM_MS = Number(process.env.PLACE_CONFIRM_MIN || 1) * 60e3, REARM_MS = Number(process.env.ARRIVE_REARM_MIN || 30) * 60e3;
const MAX_REMARKS_HOUR = Number(process.env.MAX_REMARKS_HOUR || 4);
function placeFor(L, prevKey) {
  let best = null;
  for (const p of state.places) {
    const d = km(L, p) * 1000, r = (p.radius || 150) + (placeKey(p.name) === prevKey ? LEAVE_MARGIN : 0);
    if (d <= r && (!best || d < best.d)) best = { ...p, d };
  }
  return best;
}
const quietNow = () => { const h = nowCtx().h; return QUIET_FROM > QUIET_TO ? h >= QUIET_FROM || h < QUIET_TO : h >= QUIET_FROM && h < QUIET_TO; };
function remarkAllowed() {
  const now = Date.now(); state.remarks = (state.remarks || []).filter(t => now - t < 3600e3);
  return !quietNow() && state.remarks.length < MAX_REMARKS_HOUR;
}
const listJoin = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
const dueItem = (r, now) => r.on !== false && (!r.lastShown || r.once || now - r.lastShown > (r.cooldownHours ?? 20) * 3600e3) && (!r.time || r.time === nowCtx().tod)
  && (!r.days || (r.days === 'weekends') === nowCtx().weekend);
// Lines for an event at a place. Once-items always fire; the others roll their chance. Fired once-items are removed.
function eventLines(trigger, placeName, roll = Math.random, always = false) {
  const now = Date.now(), k = placeKey(placeName), out = [];
  const hits = state.reminders.filter(r => r.kind !== 'bring' && r.trigger === trigger && placeKey(r.place) === k && dueItem(r, now));
  for (const r of hits) if (always || r.once || roll() * 100 < (r.chance ?? 40)) { r.lastShown = now; out.push(r.text); if (r.kind === 'question') state.pendingQ = { id: r.id, at: now }; }
  state.reminders = state.reminders.filter(r => !(r.once && r.lastShown === now && hits.includes(r)));
  return out.slice(0, 2);
}
// Voice names are loose ("camden", "the camden house"): exact key first, then a unique partial match.
function findPlace(name) {
  const k = placeKey(name); if (!k) return null;
  return state.places.find(p => placeKey(p.name) === k) || state.places.find(p => placeKey(p.name).includes(k) || (k.length > 3 && k.includes(placeKey(p.name)))) || null;
}
const bringFor = name => state.reminders.filter(r => r.kind === 'bring' && placeKey(r.place) === placeKey(name) && r.on !== false);
function bringLine(name) { const b = bringFor(name); return b.length ? `Don't forget to bring ${listJoin(b.map(r => r.text))} to ${name}.` : ''; }
// Where is he probably going next? Kept simple on purpose: evenings from work go home; shop-day mornings from home go to the shop.
function guessNext(fromKey) {
  const c = nowCtx(), home = state.places.find(p => p.kind === 'home'), shop = shopPlace();
  if (fromKey === 'shop' && home && c.h >= 15) return home;
  if (home && fromKey === placeKey(home.name) && shop && SHOP_DAYS.includes(c.wd.toLowerCase()) && c.h >= SHOP_FROM && c.h < SHOP_TO
      && state.workDay?.day !== c.day && state.shopAsk?.day !== c.day) { state.shopAsk = { day: c.day, at: Date.now(), pending: false }; return shop; }
  return null;
}
let pendingSay = null;
// Speak it if the app is connected (joined to the greeting if one is about to happen), otherwise send it to his phone.
function deliver(text, title = 'Jarvis') {
  text = text.replace(/\s+/g, ' ').trim(); if (!text) return;
  (state.remarks ||= []).push(Date.now()); saveState();
  remember('jarvis', text);
  if (clients.size) {
    pendingSay = { text, at: Date.now() };
    setTimeout(() => { if (pendingSay?.text === text) { pendingSay = null; broadcast({ type: 'say', text, speak: true }); } }, busy ? 6000 : 2500);
  } else push(title, text).catch(() => {});
}
const takePendingSay = () => { const p = pendingSay; pendingSay = null; return p && Date.now() - p.at < 10000 ? ' ' + p.text : ''; };
let moveTimer = null;
function onMove() {
  const L = state.location; if (!L) return;
  const prevKey = state.at || '', pl = placeFor(L, prevKey), key = pl ? placeKey(pl.name) : '';
  const now = Date.now(), prev0 = state.places.find(p => placeKey(p.name) === prevKey);
  if (!state.atInit) { state.at = key; state.atSince = now; state.atInit = true; state.lastPlace = key; saveState(); return; } // fresh/wiped state: learn where he is, do not greet
  if (key === prevKey) { if (state.cand) { state.cand = null; saveState(); } return; } // back inside (or never left): jitter, forget the candidate
  // Debounce: a change of place only counts once the new reading has held for CONFIRM_MS (one stray fix at the edge never flips the state).
  if (state.cand?.key !== key) { state.cand = { key, since: now, n: 1 }; saveState(); }
  else state.cand.n++;
  // A stationary phone sends no new fix, so re-check shortly after the confirm window instead of waiting for the next report.
  // Arriving well inside the perimeter (or leaving well outside it) confirms at once.
  const deep = pl ? pl.d <= (pl.radius || 150) * .6 : !!prev0 && km(L, prev0) * 1000 > (prev0.radius || 150) + LEAVE_MARGIN + 150;
  if (!deep && (now - state.cand.since < CONFIRM_MS || state.cand.n < 2)) { clearTimeout(moveTimer); moveTimer = setTimeout(onMove, CONFIRM_MS + 5000); return; }
  state.cand = null;
  const prev = state.places.find(p => placeKey(p.name) === prevKey);
  if (prev) (state.leftAt ||= {})[prevKey] = now;
  const rearmed = !pl || !state.leftAt?.[key] || now - state.leftAt[key] >= REARM_MS; // same place re-entered soon after leaving: no new greeting
  state.at = key; state.atSince = Date.now(); state.lastPlace = key; saveState();
  const c = nowCtx(), parts = [];
  if (prev) { // left somewhere
    parts.push(...eventLines('leave', prev.name, Math.random, true));
    const dest = pl ? null : guessNext(prevKey);
    if (!pl) parts.push(askChecklist(prev.name, dest)); // every departure from a saved place: ask what to bring, right now
    if (dest) {
      if (placeKey(dest.name) === 'shop') state.workDay = { day: c.day, on: true }; // checklist replaces the "Headed to the shop?" question
    } else if (!pl) { // not a guessable trip: mention anything waiting to be brought somewhere
      const other = state.places.find(p => p.name !== prev.name && bringFor(p.name).length);
      if (other) parts.push(bringLine(other.name));
    }
    if (!pl && dest) { const b = bringLine(dest.name); if (b) parts.push(b); }
    if (!pl && !parts.length) parts.push(prev.kind === 'home' ? 'Leaving home, sir.' : `Leaving ${prev.name}, sir.`); // always one short line on a departure
  }
  if (pl && rearmed) { // arrived somewhere
    if (key === 'shop') { state.workDay = { day: c.day, on: true }; if (state.shopAsk) state.shopAsk.pending = false; }
    const brought = bringFor(pl.name);
    if (brought.length) { parts.push(`Hope you remembered ${listJoin(brought.map(r => r.text))}, sir.`); state.reminders = state.reminders.filter(r => !brought.includes(r)); }
    const lc = state.lastCheck;
    if (lc && !lc.answered && placeKey(lc.from) !== key && now - lc.at < 12 * 3600e3) parts.push(askChecklist(lc.from, null, true)); // departure prompt missed or cut off: ask on arrival
    const firstToday = (state.arrived ||= {})[key] !== c.day; state.arrived[key] = c.day;
    parts.push(...eventLines('arrive', pl.name, Math.random, true));
    if (!parts.length) parts.push(pl.kind === 'home' ? 'Welcome home, sir.' : firstToday ? `Welcome to ${pl.name}, sir.` : `Arrived at ${pl.name}, sir.`); // always one short line on an arrival
  }
  saveState();
  const text = parts.filter(Boolean).join(' ');
  if (text && (!quietNow() || parts.some(t => /bring|remembered|grab|before you go|you left/i.test(t)))) deliver(text, prev && !pl ? `Leaving ${prev.name}` : pl ? pl.name : 'Jarvis');
}
// Departure checklist: asked aloud the moment he leaves a saved place; his answer becomes bring items for the destination.
const CHECK_ITEMS = 'Tools, food, gas, anything for the dogs, anything for Princess?';
function checklistQuestion(dest, arrive) {
  if (arrive) return `You left ${arrive} before I got your list, sir. Anything you need to bring back to ${arrive}? ${CHECK_ITEMS}`;
  const to = !dest ? '' : placeKey(dest.name) === 'shop' ? ' to the shop' : dest.kind === 'home' ? ' home' : ` to ${dest.name}`;
  return `Before you go, anything you need to remember to bring${to}, sir? ${CHECK_ITEMS}`;
}
function askChecklist(fromName, dest, arrive) {
  state.pendingQ = { type: 'checklist', from: fromName, dest: dest ? dest.name : '', arrive: !!arrive, at: Date.now() };
  state.lastCheck = { from: fromName, at: Date.now(), answered: false };
  return checklistQuestion(dest, arrive ? fromName : '');
}
const CHECK_NO = /^(no|nope|nah|nothing|none|not really|i'?m good|im good|all set|all good|got everything|got it all|i have everything|that'?s all)\b/;
const CHECK_CMD = /^(what|whats|what's|how|when|where|who|why|play|pause|stop|turn|call|text|open|set|show|tell|check|is|are|do|does|did|can|could|will)\b|\?$/;
const CHECK_FILL = /^(?:(?:yeah|yes|yep|um|uh|okay|ok|well|and|also|so)\s+)*(?:i\s+(?:need|want|have|got)\s+(?:to\s+)?)?(?:(?:bring|take|grab|get|pick up|add)\s+)?(?:the\s+)?/;
async function checklistAnswer(q, text) {
  const t = norm(text).replace(/^(hey )?jarvis /, '');
  const say = reply => { broadcast({ type: 'log', role: 'user', text }); remember('user', text); remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true }); return true; };
  if (Date.now() - q.at > 3 * 60e3 || (CHECK_CMD.test(t) && !CHECK_NO.test(t))) return false; // stale or an unrelated request: let it through, keep nothing
  const done = () => { state.pendingQ = null; if (state.lastCheck) state.lastCheck.answered = true; saveState(); };
  if (CHECK_NO.test(t)) { done(); return say('Very good, sir. Safe travels.'); }
  if (/^(yes|yeah|yep|yup|i do|i did)$/.test(t)) { q.at = Date.now(); saveState(); return say('What is it, sir?'); }
  // Destination: the one guessed at departure, else a saved place named in the answer ("...for the camden house").
  let dest = q.dest ? findPlace(q.dest) : null, body = t;
  if (!dest) {
    const named = state.places.find(p => new RegExp(`\\b(?:to|for|at)\\s+(?:the\\s+)?${placeKey(p.name).replace(/[^a-z0-9 ]/g, '')}\\b`).test(t));
    if (named) { dest = named; body = t.replace(new RegExp(`\\s*\\b(?:to|for|at)\\s+(?:the\\s+)?${placeKey(named.name).replace(/[^a-z0-9 ]/g, '')}\\b`), ''); }
  }
  if (!dest && q.items?.length) { // items already taken down; this answer should be the destination
    const p = findPlace(t.replace(/^(?:i'?m )?(?:going |headed |heading )?(?:to |for )?(?:the )?/, ''));
    if (p) { for (const it of q.items) await handlers.bring_add({ place: p.name, item: it }); const all = q.items; done(); return say(`Noted, sir. ${listJoin(all)} for ${p.name}.`); }
  }
  const items = body.split(/\s*(?:,|;|\band\b|\bplus\b|\balso\b)\s*/).map(x => x.replace(CHECK_FILL, '').replace(/[.!]+$/, '').trim()).filter(x => x.length > 1);
  if (!items.length) return false;
  if (!dest) { q.items = [...(q.items || []), ...items]; q.at = Date.now(); saveState(); return say(`Got ${listJoin(items)}. Where are you headed, sir?`); }
  const all = [...(q.items || []), ...items];
  for (const it of all) await handlers.bring_add({ place: dest.name, item: it });
  state.pendingQ = null; if (state.lastCheck) state.lastCheck.answered = true; saveState();
  return say(`Noted, sir. ${listJoin(all)} for ${dest.name}.`);
}
// Yes / no to "Headed home, sir?"
async function destAnswer(q, text) {
  const t = norm(text).replace(/^(hey )?jarvis /, '');
  if (t.split(' ').length > 6) { state.pendingQ = null; saveState(); return false; }
  const yes = SHOP_NO.test(t) ? false : SHOP_YES.test(t) ? true : null;
  if (yes === null) return false;
  state.pendingQ = null; saveState();
  broadcast({ type: 'log', role: 'user', text }); remember('user', text);
  let reply;
  if (placeKey(q.place) === 'shop') reply = await shopDay(yes);
  else if (!yes) reply = 'Very good, sir.';
  else reply = ['Very good, sir.', bringLine(q.place), ...eventLines('heading', q.place)].filter(Boolean).join(' ');
  remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true });
  return true;
}
handlers.heading_to = async ({ place }) => {
  const p = findPlace(place);
  if (!p) return `No saved place called ${place}. Saved: ${state.places.map(x => x.name).join(', ') || 'none'}.`;
  return ['Say this:', bringLine(p.name) || `Nothing on the list for ${p.name}.`, ...eventLines('heading', p.name, Math.random, true)].join(' ');
};
handlers.bring_add = async ({ place, item }) => {
  const p = findPlace(place);
  state.reminders.push(cleanItem({ kind: 'bring', text: item, place: p ? p.name : place }));
  saveState(); return `Added: bring ${item} to ${p ? p.name : place}${p ? '' : ' (no saved place by that name yet)'}. He'll be reminded when he heads there, and it clears when he arrives.`;
};
// "Do I need to bring anything / what do I need to grab": the bring list plus the bucket items for that place (named, else where he is now).
handlers.bring_list = async ({ place } = {}) => {
  const p = place ? findPlace(place) : currentPlace();
  const b = place && p ? bringFor(p.name) : place ? [] : state.reminders.filter(r => r.kind === 'bring' && r.on !== false);
  const kn = p ? placeKey(p.name) : '', here = p ? state.reminders.filter(r => r.kind !== 'bring' && r.on !== false && placeKey(r.place) === kn && ['arrive', 'leave', 'heading'].includes(r.trigger)) : [];
  const out = [];
  if (b.length) out.push('Bring: ' + b.map(r => `${r.text} -> ${r.place}`).join('; '));
  if (here.length) out.push(`Reminders for ${p.name}: ` + here.map(r => `${r.text} (${r.trigger})`).join('; '));
  return out.length ? out.join('\n') + '\nSay it in one or two short sentences.' : `Nothing to bring or grab${p ? ' for ' + p.name : ''}, sir.`;
};
// Starter check-ins (edit or delete them in the Places box).
if (!state.seededMoves) {
  const home = () => state.places.find(p => p.kind === 'home')?.name || 'Home';
  state.reminders.push(
    cleanItem({ id: 'eat', kind: 'question', text: "Have you eaten today, sir? Might be worth grabbing some food on your way.", place: home(), trigger: 'heading', chance: 45, cooldown_hours: 20, yes: 'Very good, sir.', no: "Then I'd stop for something on the way, sir." }),
    cleanItem({ id: 'princess', kind: 'reminder', text: 'You might check with Princess whether she needs anything brought from the shop.', place: 'the shop', trigger: 'leave', chance: 50, cooldown_hours: 20 }),
    cleanItem({ id: 'dogfood', kind: 'question', text: 'Do the dogs have food at home, or should you grab some on the way?', place: home(), trigger: 'heading', chance: 30, cooldown_hours: 48, yes: 'Excellent, sir.', no: "Then let's pick some up on the way, sir." })
  );
  state.seededMoves = true;
}
// Places pinned from a street address (exact, not phone GPS). Public addresses live here in the code; private ones
// (home) go in the Railway variable PLACES_JSON, e.g. [{"name":"Home","lat":38.9,"lon":-75.5,"radius":150}], because
// this repo is public. Each seed is applied once (state.placeSeeds, backed up to the phone), so a place he deletes or
// re-saves in the Places box stays the way he left it.
const SEED_PLACES = [
  { name: 'the shop', lat: 38.92050, lon: -75.56781, radius: SHOP_RADIUS, kind: 'work', address: '17399 S DuPont Hwy, Harrington, DE 19952', v: 1 }
];
function ensureSeedPlaces() {
  let extra = []; try { extra = JSON.parse(process.env.PLACES_JSON || '[]'); } catch (e) { console.warn('PLACES_JSON is not valid JSON:', e.message); }
  state.placeSeeds ||= {};
  let changed = false;
  for (const p of [...SEED_PLACES, ...(Array.isArray(extra) ? extra : [])]) {
    const lat = Number(p.lat), lon = Number(p.lon), k = placeKey(p.name);
    if (!k || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const tag = `${k}@${p.v || 1}:${lat.toFixed(5)},${lon.toFixed(5)}`;
    if (state.placeSeeds[k] === tag) continue;
    state.places = state.places.filter(x => placeKey(x.name) !== k);
    state.places.push({ name: p.name, lat, lon, radius: Number(p.radius) || (k === 'shop' ? SHOP_RADIUS : 150), address: p.address,
      kind: p.kind || (k === 'home' ? 'home' : k === 'shop' ? 'work' : 'place') });
    state.placeSeeds[k] = tag; changed = true;
  }
  if (changed) saveState();
}
ensureSeedPlaces();


handlers.weather = async ({ days } = {}) => {
  try {
    const j = await wxFetch(days || 3);
    const u = j.__f ? 'F' : 'C', w = j.__f ? 'mph' : 'km/h';
    const c = j.current, d = j.daily;
    const lines = d.time.map((t, i) => `${t}: ${WX_KINDS(d.weather_code[i])}, high ${Math.round(d.temperature_2m_max[i])}${u}, low ${Math.round(d.temperature_2m_min[i])}${u}, rain chance ${d.precipitation_probability_max[i]}%`);
    return `Weather at the Owner's ${wxPlace().live ? 'current phone location' : 'default location (phone location not shared yet)'} (${j.timezone}). Now: ${WX_KINDS(c.weather_code)}, ${Math.round(c.temperature_2m)}${u} (feels ${Math.round(c.apparent_temperature)}${u}), wind ${Math.round(c.wind_speed_10m)} ${w}. Forecast: ${lines.join(' | ')}`;
  } catch (e) { return 'Could not get the weather: ' + String(e.message || e); }
};
// Weather is mentioned only on the first open of the day, or when it has changed since the last time it was mentioned/checked.
async function weatherLine(today) {
  try {
    const w = await currentWeather();
    const prev = state.weather;
    let line = '';
    if (!prev || prev.day !== today) line = ` It's ${w.temp} ${w.unit} and ${WX_NOW[w.kind]}.`;
    else if (prev.kind !== w.kind) {
      const wet = ['raining', 'drizzling', 'snowing', 'stormy'];
      if (wet.includes(prev.kind) && !wet.includes(w.kind)) line = ` Just so you know, it has stopped ${prev.kind === 'stormy' ? 'storming' : prev.kind}.`;
      else if (wet.includes(w.kind)) line = ` Heads up, it has started ${w.kind === 'stormy' ? 'storming' : w.kind}.`;
      else line = ` The weather has changed: it's now ${WX_NOW[w.kind]}.`;
    }
    state.weather = { day: today, kind: w.kind, temp: w.temp };
    saveState();
    return line;
  } catch { return ''; }
}
async function localGreeting(memo) {
  // The phone remembers when he was last greeted and the last weather, so redeploys can't make Jarvis repeat himself.
  if (memo?.greetedDay) state.greetedDay = memo.greetedDay;
  if (memo?.wx?.day) state.weather = memo.wx;
  const tz = state.location?.tz || process.env.TZ || 'America/New_York';
  const now = new Date();
  const h = Number(now.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }));
  const part = h < 5 ? 'Up late, sir.' : h < 12 ? 'Good morning, sir.' : h < 17 ? 'Good afternoon, sir.' : 'Good evening, sir.';
  const today = now.toLocaleDateString('en-CA', { timeZone: tz });
  const first = state.greetedDay !== today;
  const wx = await weatherLine(today);
  state.greetedDay = today; saveState();
  const day = first ? ` It's ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz })}.` : '';
  const n = state.failures.length;
  const open = n ? ` ${n} earlier request${n > 1 ? 's' : ''} didn't go through; ask me to retry when you're ready.` : '';
  // First open of the day gets the full greeting; later opens are short and only carry news (weather change, failures).
  const ctx = contextNote() + takePendingSay() + (state.at === 'shop' || nowCtx().h < 12 ? followupNote() : ''); // an arrival remark from the same moment joins the greeting instead of cutting it off
  if (first) return `${part}${day}${wx} All systems online.${open}${ctx}`; // ctx last: it may be a question he answers
  return `${wx || open || ctx ? '' : 'At your service, sir.'}${wx}${open}${ctx}`.trim() || 'At your service, sir.';
}
async function briefing(reason = 'scheduled', memo) {
  if (reason === 'wake') { if (state.silent) { state.silent = false; saveState(); broadcast({ type: 'silent', on: false }); }   // opening the app always brings the voice back
  const text = await localGreeting(memo); remember('jarvis', text); broadcast({ type: 'say', text, speak: true, memo: { greetedDay: state.greetedDay, wx: state.weather } }); return; }
  const b = readText('briefing.md');
  if (!b.trim()) return;
  ask(`[${reason} briefing] ${b}`, { spoken: reason !== 'scheduled', origin: 'system', label: reason === 'wake' ? 'Wake-up briefing' : 'Scheduled briefing' });
}
const every = Number(process.env.BRIEFING_EVERY_MINUTES || 0);
if (every > 0 && !process.env.JARVIS_SMOKE) setInterval(() => { if (!busy && !queue.length) briefing('scheduled'); }, every * 60_000);

// ---------- scheduled crypto briefs: morning, midday (only if something big moved), evening ----------
// Times are in TZ. Set a time to "off" to skip that brief. Briefs are silent: they land on the HUD and the comms log,
// and (optionally) as a phone notification through ntfy.sh. Needs the OpenRouter talk brain.
const BRIEF_SLOTS = {
  morning: parseTime(process.env.CRYPTO_BRIEF_MORNING ?? '08:00'),
  midday: parseTime(process.env.CRYPTO_BRIEF_MIDDAY ?? '12:30'),
  evening: parseTime(process.env.CRYPTO_BRIEF_EVENING ?? '18:30')
};
const ALERT_PCT = Number(process.env.CRYPTO_ALERT_PCT || 6);
const TAIL = 'Reply with one or two spoken sentences (the headline only). Put the detail in a "crypto" panel with show_panel (it stays hidden until he says yes), and end by asking "Want to see the details, sir?"';
const BRIEF_PROMPTS = {
  morning: () => `[crypto morning brief] Scan crypto. What moved overnight, which news matters today, and anything on my watchlist. ${TAIL}`,
  midday: moved => `[crypto midday check] These coins moved a lot today: ${moved}. Find out why, and say whether it looks worth watching, worth being cautious about, or just noise. ${TAIL}`,
  evening: () => `[crypto evening brief] Scan crypto. Recap how today went, which news landed, and what to watch overnight and tomorrow. ${TAIL}`
};
// Phone alerts: Telegram first (its own chat, so it can have its own sound), ntfy as the backup.
// Telegram needs TELEGRAM_BOT_TOKEN. The chat id is found automatically after the Owner sends the bot any message once
// (or set TELEGRAM_CHAT_ID). ntfy needs NTFY_TOPIC.
const TG_FILE = path.join(DATA_DIR, 'telegram-chat.txt');
async function tgChatId() {
  if (process.env.TELEGRAM_CHAT_ID) return process.env.TELEGRAM_CHAT_ID;
  try { const c = fs.readFileSync(TG_FILE, 'utf8').trim(); if (c) return c; } catch {}
  const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getUpdates`, { signal: AbortSignal.timeout(10000) });
  const j = await r.json();
  const msg = (j.result || []).map(u => u.message || u.channel_post).filter(Boolean).pop();
  if (!msg) return null;
  const id = String(msg.chat.id);
  try { fs.writeFileSync(TG_FILE, id); } catch {}
  return id;
}
async function pushTelegram(title, body, link, watch) {
  try {
    const chat = await tgChatId();
    if (!chat) return 'Telegram is connected but has no chat yet. The Owner must open the bot in Telegram and send it any message once.';
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `${title}\n${body}`.slice(0, 3500 - (link ? link.length + 1 : 0)) + (link ? `\n${link}` : ''), ...(watch ? { reply_markup: { inline_keyboard: [[{ text: 'Buy', url: buy }, { text: 'Add to watch list', url: watch }]] } } : {}) }), signal: AbortSignal.timeout(10000)
    });
    return r.ok ? null : `Telegram answered ${r.status}: ${(await r.text()).slice(0, 120)}`;
  } catch (e) { return String(e.message || e).slice(0, 120); }
}
async function pushNtfy(title, body, link, watch, buy) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return 'NTFY_TOPIC is not set in Railway yet.';
  try {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: 'POST', headers: { Title: encodeURIComponent(String(title).slice(0, 80)).replace(/%20/g, ' '), Tags: 'chart_with_upwards_trend', Priority: process.env.NTFY_PRIORITY || '4', ...(link ? { Click: link } : {}), ...(watch ? { Actions: `view, Buy, ${buy}; view, Add to watch list, ${watch}` } : {}) }, body: String(body).slice(0, link ? 440 : 500) + (link ? `\n${link}` : ''), signal: AbortSignal.timeout(10000) });
    return r.ok ? null : `ntfy answered ${r.status}`;
  } catch (e) { console.warn('phone notification failed:', String(e.message || e)); return String(e.message || e).slice(0, 120); }
}
// Pushover: a notification-only app that lets the Owner upload his own sound (website: Custom Sounds).
// Needs PUSHOVER_APP_TOKEN (the app/API token) and PUSHOVER_USER_KEY. PUSHOVER_SOUND is the sound's name as uploaded (default "jarvis").
async function pushPushover(title, body, link, watch, buy) {
  try {
    const r = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: process.env.PUSHOVER_APP_TOKEN, user: process.env.PUSHOVER_USER_KEY,
        title: String(title).slice(0, 250), message: watch ? String(body).slice(0, 800).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + `\n<a href="${buy}">Buy</a> | <a href="${watch}">Add to watch list</a>` : String(body).slice(0, 1000) || ' ',
        ...(watch ? { html: '1' } : {}),
        sound: process.env.PUSHOVER_SOUND || 'jarvis', priority: process.env.PUSHOVER_PRIORITY || '0',
        ...(link ? { url: link, url_title: 'Open chart' } : {})
      }), signal: AbortSignal.timeout(10000)
    });
    return r.ok ? null : `Pushover answered ${r.status}: ${(await r.text()).slice(0, 160)}`;
  } catch (e) { return String(e.message || e).slice(0, 120); }
}
// Chart link for alerts: the app's own /chart page (candles + levels), built from the alert's symbol. Needs PUBLIC_URL (Railway sets RAILWAY_PUBLIC_DOMAIN itself).
const publicBase = () => (process.env.PUBLIC_URL || (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}` : '')).replace(/\/+$/, '');
function chartLink(sym, lv = {}) {
  const base = publicBase(), s = String(sym || '').trim(); if (!base || !s) return '';
  const q = new URLSearchParams({ s });
  for (const [k, v] of Object.entries(lv)) if (Number.isFinite(Number(v)) && v != null && v !== '') q.append('lv', `${k}:${Number(v)}`);
  return `${base}/chart?${q}`;
}
// One-tap "Add to watch list" for alerts: a signed link (no PIN cookie needed on the tap). It only ever adds the symbol to the sell-warning watch list; it can never buy.
const watchSig = sym => crypto.createHmac('sha256', SECRET).update('watch:' + sym).digest('hex').slice(0, 24);
function watchLink(link) {
  try { const u = new URL(link), sym = String(u.searchParams.get('s') || '').toUpperCase().replace(/[^A-Z.\-]/g, ''); if (!sym || u.pathname !== '/chart') return ''; return `${u.origin}/watch-add?s=${encodeURIComponent(sym)}&k=${watchSig(sym)}`; } catch { return ''; }
}
// Buy button: opens the HUD, which asks Jarvis to start the buy flow; nothing is bought until the Owner confirms by voice in a later turn.
function buyLink(link) {
  try { const u = new URL(link), sym = String(u.searchParams.get('s') || '').toUpperCase().replace(/[^A-Z.\-]/g, ''); if (!sym || u.pathname !== '/chart') return ''; return `${u.origin}/?buy=${encodeURIComponent(sym)}`; } catch { return ''; }
}
// crypto briefs name several coins: link up to three tickers found in the text
function cryptoLinks(text) {
  const seen = new Set(), out = [];
  for (const w of String(text).match(/[A-Za-z]{2,10}/g) || []) {
    const y = chart.ySymbol(w); if (!y || !y.endsWith('-USD') || seen.has(y)) continue;
    if (!/^[A-Z]{2,6}$/.test(w) && !/^(bitcoin|ethereum|solana|dogecoin)$/i.test(w)) continue;
    seen.add(y); out.push(chartLink(y)); if (out.length >= 3) break;
  }
  return out.filter(Boolean);
}
async function push(title, body, link) {
  const links = [].concat(link || []).filter(Boolean), first = links[0] || '', watch = watchLink(first), buy = buyLink(first);
  const extra = links.slice(1).join('\n'); if (extra) body = `${body}\n${extra}`;
  if (process.env.PUSHOVER_APP_TOKEN && process.env.PUSHOVER_USER_KEY) {
    const err = await pushPushover(title, body, first, watch, buy);
    if (!err) return null;
    console.warn('Pushover alert failed:', err);
    const backup = process.env.TELEGRAM_BOT_TOKEN ? await pushTelegram(title, body, first, watch, buy) : process.env.NTFY_TOPIC ? await pushNtfy(title, body, first, watch, buy) : 'no backup set';
    return backup ? `${err} (backup: ${backup})` : null;
  }
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const err = await pushTelegram(title, body, first, watch, buy);
    if (!err) return null;
    console.warn('Telegram alert failed:', err);
    const backup = process.env.NTFY_TOPIC ? await pushNtfy(title, body, first, watch, buy) : 'no ntfy backup set';
    return backup ? `${err} (ntfy backup: ${backup})` : null;
  }
  return pushNtfy(title, body, first, watch, buy);
}
handlers.phone_alert = async ({ title, message }) => {
  const err = await push(title || 'Jarvis', message || '');
  return err ? `Could not send: ${err} Tell the Owner plainly.` : 'Sent. Tell the Owner to check his phone.';
};
// ---------- Signals (A24): rule-based scan of trending tickers, stop-loss levels, sell-warning alerts ----------
state.sigWatch ||= [];
// Symbols the Owner removed from the watch list. Hides auto (position) rows and stops their alerts; positions themselves are untouched.
state.wlHide ||= [];
state.trail ||= {};
if (!state.wlHideSeeded) { state.wlHide = [...new Set([...state.wlHide, 'NEAR', 'TXT', 'XRP'])]; state.wlHideSeeded = true; }
const wlKey = s => String(s || '').toUpperCase().replace('/USD', '').replace('/', '').replace(/USD$/, '');
const wlHidden = s => state.wlHide.includes(wlKey(s));
// Dust: an open position worth less than dustUsd (default $1, alert_config / DUST_USD). Independent of the watch list; no alerts, no watch-list row.
const isDustVal = v => v < alerts.cfgOf(state.alertCfg).dustUsd;
const dustKeys = () => new Set((watch.holdings?.positions || []).filter(p => isDustVal(p.value)).map(p => wlKey(p.symbol)));
// Volatility-aware trailing stop (alert-level, no broker order). stop = highest price since entry minus atrMult x that symbol's own 14-day ATR,
// or just under its latest swing low if that is higher. It only ever ratchets up. Without ATR data it falls back to trailPct.
// Scale-out ladder: R = atrMult x ATR at first sight (entry-based risk). Tier 1 at entry+1R and tier 2 at entry+2R: "I would sell a third";
// from tier 1 the stop floor is entry + costPct (breakeven plus costs). The rest rides the trail. Informational only: nothing is ever sold here.
// floor = an explicit stop (resting broker stop or one the Owner named); it can raise the stop, never lower it.
const vol = new Map(); // symbol key -> { at, atr, swing, busy }
function volFor(sym) {
  const k = wlKey(sym), c = vol.get(k);
  if (!c || (!c.busy && Date.now() - c.at > 6 * 3600e3)) {
    vol.set(k, { ...(c || {}), at: Date.now(), busy: true });
    chart.bars(chart.ySymbol(sym) || sym, '1dlong').then(b => { const a = chart.atr(b, 14), lows = b.slice(-10).map(x => x.l); vol.set(k, { at: Date.now(), atr: a || null, swing: lows.length ? Math.min(...lows) : null }); }).catch(() => vol.set(k, { ...(vol.get(k) || {}), at: Date.now(), busy: false }));
  }
  return vol.get(k) || {};
}
function trailUpdate(sym, price, entry, floor) {
  const k = wlKey(sym); if (!k) return null;
  const C = acfg(), t = state.trail[k] ||= { high: 0, stop: null };
  const p = Number(price) || 0, e = Number(entry) || 0, v = volFor(sym);
  let changed = false;
  if (t.v !== 2) { t.v = 2; t.stop = null; t.since = t.since || Date.now(); changed = true; }   // one-time move from the fixed-% trail to the ATR trail
  const hi = Math.max(t.high || 0, p, e);
  if (hi > (t.high || 0)) { t.high = hi; changed = true; }
  if (!t.entry && e) { t.entry = e; changed = true; }
  if (!t.r && t.entry && v.atr) { t.r = Number((C.atrMult * v.atr).toPrecision(6)); changed = true; }
  const ent = t.entry || e;
  const tier = t.r && ent ? (t.high >= ent + 2 * t.r ? 2 : t.high >= ent + t.r ? 1 : 0) : 0;
  if (tier > (t.tier || 0)) { t.tier = tier; changed = true; }
  let cand = t.high * (1 - C.trailPct / 100);
  if (v.atr) { cand = t.high - C.atrMult * v.atr; if (v.swing) cand = Math.max(cand, v.swing - 0.5 * v.atr); }
  let fl = Number(floor) || 0;
  if ((t.tier || 0) >= 1 && ent) fl = Math.max(fl, ent * (1 + C.costPct / 100));
  const next = Math.max(t.stop || 0, cand, fl);
  if (next > (t.stop || 0)) { t.stop = Number(next.toPrecision(6)); changed = true; }
  if (changed) saveState();
  return t.stop || null;
}
// Next scale-out level and plan text for a symbol (null r = ATR not known yet).
function scaleInfo(sym) {
  const t = state.trail[wlKey(sym)]; if (!t) return null;
  const ent = t.entry, r = t.r, tier = t.tier || 0;
  const next = ent && r && tier < 2 ? Number((ent + (tier + 1) * r).toPrecision(6)) : null;
  return { tier, next, nextLabel: next ? `sell 1/3 at +${tier + 1}R` : (ent && r ? 'runner on trail' : null), r: r ?? null, be: tier >= 1 && ent ? Number((ent * (1 + acfg().costPct / 100)).toPrecision(6)) : null };
}
// Realised P&L per symbol from filled sell orders since the symbol was first tracked (read-only; refreshed every 5 min).
// (watch.realised / watch.realisedAt are initialised where `watch` is declared, below)
async function realisedRefresh(pos) {
  if (Date.now() - watch.realisedAt < 300e3) return;
  watch.realisedAt = Date.now();
  try {
    const fills = await trade.sellFills(), out = new Map();
    for (const p of pos) {
      const k = wlKey(p.symbol), t = state.trail[k], since = t?.since || 0;
      const r = fills.filter(f => wlKey(f.symbol) === k && f.at >= since).reduce((a, f) => a + f.qty * (f.price - p.entry), 0);
      if (r) out.set(k, Number(r.toFixed(2)));
    }
    watch.realised = out;
  } catch (e) { console.warn('realised', e.message); }
}
const trailStopOf = sym => state.trail[wlKey(sym)]?.stop ?? null;
// Auto rows: Alpaca positions worth at least the dust threshold (dust stays off the list) that he has not removed.
// The HUD watch list holds only what he added with signal_watch; holdings are never auto-added, and a held symbol is not shown in it.
const wlAuto = () => [];
const wlRows = () => state.sigWatch.filter(w => !(watch.holdings?.positions || []).some(p => wlKey(p.symbol) === wlKey(w.symbol)));
const SIG_NOTE = 'Rule-based signals from candles, not financial advice; no setup is certain. Trades only through trade_propose and his confirm.';
handlers.signal_scan = async ({ symbols, top } = {}) => {
  try {
    let list = (symbols || []).map(x => String(x).toUpperCase().replace(/[^A-Z.\-]/g, '')).filter(Boolean);
    let src = 'the symbols he named';
    if (!list.length) {
      if (!trade.configured()) return 'Alpaca keys are not set, so I cannot pull the trending list. Ask him for tickers to scan, or add ALPACA_KEY_ID and ALPACA_SECRET in Railway.';
      const t = await trade.trending(15); list = t.all.slice(0, 25); src = `Alpaca's top gainers and most active (${list.length} tickers)`;
    }
    const r = await sig.scan(list, Math.min(8, Math.max(1, top || 5)));
    return JSON.stringify({ source: src, ...r, note: SIG_NOTE, guide: 'Lead with the best one or two by score. For each: symbol, price, score out of 100, label, the stop-loss and risk %, the target, and the back-test line (samples and win rate; say plainly when samples are few). Mention exitWarning if present. Keep the spoken reply short; offer to watch it. Say once it is rule-based and not advice. ' + news.AUTO_NEWS });
  } catch (e) { return `Signal scan failed: ${e.message} Tell the Owner plainly.`; }
};
const wlEval = new Map(); // symbol -> { at, verdict, target, stop, busy }
function wlVerdict(ev) { return ev.exitWarning ? 'AVOID' : ev.score >= 75 ? 'BUY' : ev.score >= 55 ? 'WATCH' : 'AVOID'; }
// Symbols to evaluate: his watch rows plus open positions (the Holdings box shows their verdicts). Only wlRows() is shown in the watch list.
function wlSymbols() { const pos = (watch.holdings?.positions || []).filter(p => !isDustVal(p.value) && !wlHidden(p.symbol)).map(p => ({ symbol: p.symbol.replace('/USD', '').replace('/', '') })); const seen = new Set(wlRows().map(w => w.symbol)); return [...wlRows(), ...pos.filter(p => !seen.has(p.symbol))]; }
function wlRefresh() {
  for (const w of wlSymbols()) {
    const c = wlEval.get(w.symbol);
    if (c && (c.busy || Date.now() - c.at < 15 * 60e3)) continue;
    wlEval.set(w.symbol, { ...(c || {}), at: Date.now(), busy: true });
    sig.evaluate(w.symbol).then(ev => { wlEval.set(w.symbol, { at: Date.now(), verdict: wlVerdict(ev), target: ev.target, stop: ev.stop }); broadcast(watchlistMsg(true)); if (watch.holdings) broadcast(holdingsOut()); }).catch(() => { wlEval.set(w.symbol, { ...(wlEval.get(w.symbol) || {}), at: Date.now(), busy: false }); });
  }
}
// Holdings box extras: 5-day sparkline (15m closes, cached 15 min), live verdict/stop/target (same wlEval + wlVerdict as alerts and the watch list), signed watch-only link.
const spark = new Map(); // symbol -> { at, pts, busy }
function sparkFor(sym) {
  const c = spark.get(sym);
  if (!c || (!c.busy && Date.now() - c.at > 15 * 60e3)) {
    spark.set(sym, { ...(c || {}), at: Date.now(), busy: true });
    chart.bars(chart.ySymbol(sym) || sym, '15m').then(b => { const step = Math.max(1, Math.ceil(b.length / 60)); spark.set(sym, { at: Date.now(), pts: b.filter((_, i) => i % step === 0 || i === b.length - 1).map(x => Number(x.c.toPrecision(6))) }); broadcast(holdingsOut()); broadcast(watchlistMsg(true)); }).catch(() => spark.set(sym, { ...(spark.get(sym) || {}), at: Date.now(), busy: false }));
  }
  return spark.get(sym)?.pts || null;
}
function holdingsOut() {
  const h = watch.holdings; if (!h) return null;
  const evals = new Map(wlSymbols().map(w => [w.symbol, wlEval.get(w.symbol) || {}]));
  return { type: 'holdings', ...h, positions: h.positions.map(p => {
    const k = p.symbol.replace('/USD', '').replace('/', ''), e = evals.get(k) || wlEval.get(k) || {};
    if (!isDustVal(p.value) && !wlEval.has(k)) wlRefresh();
    const sc = scaleInfo(k); return { ...p, verdict: e.verdict ?? null, stop: trailStopOf(k) ?? null, trail: true, scale: sc, realised: watch.realised.get(k) ?? 0, target: e.target ?? null, spark: isDustVal(p.value) ? null : sparkFor(k), wk: watchSig(k) };
  }) };
}
function watchlistMsg(noRefresh) {
  if (!noRefresh) wlRefresh();
  const px = new Map((watch.items || []).map(i => [i.sym.replace('/USD', '').replace('/', ''), i.price]));
  const pc = new Map((watch.items || []).map(i => [i.sym.replace('/USD', '').replace('/', ''), i.prevClose]));
  const dayOf = (sym, price) => { const prev = pc.get(sym) || lf.latest(sym)?.prevClose; return price > 0 && prev > 0 ? +((price - prev) / prev * 100).toFixed(2) : null; };
  return { type: 'watchlist', at: Date.now(), list: wlRows().map(w => { const e = wlEval.get(w.symbol) || {}; return { symbol: w.symbol, auto: !!w.auto, price: px.get(w.symbol) ?? null, entry: w.entry ?? null, stop: trailStopOf(w.symbol) ?? e.stop ?? null, trail: trailStopOf(w.symbol) != null, scale: scaleInfo(w.symbol), target: e.target ?? null, verdict: e.verdict ?? null, dayPct: dayOf(w.symbol, px.get(w.symbol) ?? lf.latest(w.symbol)?.price), spark: sparkFor(w.symbol) }; }) };
}
handlers.signal_watch = async ({ action, symbol, entry, stop }) => {
  const sym = String(symbol || '').toUpperCase().replace(/[^A-Z.\-]/g, '');
  if (action === 'list') {
    const rows = watchlistMsg(true).list;
    return (rows.length ? 'Watch list (the same rows his HUD shows): ' + rows.map(w => `${w.symbol} ${w.verdict || ''} entry ${w.entry ?? '?'} stop ${w.stop ?? '?'}`).join('; ') : 'The watch list is empty.') + (state.wlHide.length ? ` Removed by him: ${state.wlHide.join(', ')}.` : '');
  }
  if (!sym) return 'Which ticker?';
  if (action === 'remove') {
    const held = (watch.holdings?.positions || []).some(p => wlKey(p.symbol) === wlKey(sym));
    state.sigWatch = state.sigWatch.filter(w => w.symbol !== sym);
    if (held && !state.wlHide.includes(wlKey(sym))) state.wlHide.push(wlKey(sym));
    saveState(); broadcast(watchlistMsg());
    return `Removed ${sym} from the watch list${held ? ' (it is still in his positions; no more alerts on it)' : ''}.`;
  }
  state.wlHide = state.wlHide.filter(x => x !== wlKey(sym));
  try {
    const ev = await sig.evaluate(sym);
    const w = { symbol: sym, entry: entry ?? ev.price, trail: true, floor: stop ?? null, addedAt: Date.now() };
    w.stop = trailUpdate(sym, ev.price, w.entry, w.floor);
    state.sigWatch = [...state.sigWatch.filter(x => x.symbol !== sym), w].slice(-20); saveState(); broadcast(watchlistMsg());
    return `Watching ${sym}: entry ${w.entry}, trailing stop ${w.stop} (${acfg().atrMult}x this ticker's ATR under the highest price since entry, or its swing low; it only moves up). I will send a phone alert if the rules say the uptrend is breaking or the stop is hit. ${SIG_NOTE}`;
  } catch (e) { return `Could not add ${sym}: ${e.message}`; }
};
// During US market hours, every 15 minutes: check watched tickers and Alpaca positions for a sell warning. One alert per ticker per 4 hours.
async function sigTick() {
  const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const mins = ny.getHours() * 60 + ny.getMinutes();
  if (ny.getDay() === 0 || ny.getDay() === 6 || mins < 9 * 60 + 30 || mins > 16 * 60) return;
  const list = new Map(state.sigWatch.map(w => [w.symbol, w]));
  try { if (trade.configured()) for (const p of await trade.positions()) { const s = String(p.symbol || '').replace('/USD', ''); if (/^[A-Z]{1,5}$/.test(s) && !list.has(s) && !wlHidden(s) && !isDustVal(p.value)) list.set(s, { symbol: s, stop: trailStopOf(s) }); } } catch {}
  state.sigAlerted ||= {};
  for (const w of list.values()) {
    try {
      if (Date.now() - (state.sigAlerted[w.symbol] || 0) < 4 * 3600e3) continue;
      const wstop = trailStopOf(w.symbol), ex = sig.exitSignal(await chart.bars(w.symbol, '1dlong'), wstop);
      if (!ex.exit) continue;
      state.sigAlerted[w.symbol] = Date.now(); saveState();
      const msg = `Uptrend break: ${w.symbol} at ${ex.price}, ${ex.reasons.join('; ')}. I would sell now or set the stop at ${wstop && wstop > ex.stop ? wstop : ex.stop}. Rule-based warning, not advice.`;
      broadcast({ type: 'activity', text: 'SELL WARNING: ' + msg });
      await push(`Sell warning: ${w.symbol}`, msg, chartLink(w.symbol, { stop: wstop && wstop > ex.stop ? wstop : ex.stop }));
    } catch (e) { console.warn('signal check failed', w.symbol, e.message); }
  }
}
if (!process.env.JARVIS_SMOKE) setInterval(() => sigTick().catch(e => console.warn('sigTick', e.message)), 15 * 60_000);
// ---------- Investment Watch: fixed-interval price monitor for Alpaca positions + signal_watch list ----------
// Every WATCH_INTERVAL_SEC (default 60, min 20): one positions call (+ one price call for watch-only tickers). Stocks only during
// 9:30-16:00 ET weekdays, crypto 24/7. Alerts via push(): stop hit (stop from signal_watch or a resting broker stop order),
// sudden drop (>= WATCH_DROP_PCT within WATCH_DROP_WINDOW_MIN), repeated by cooldown. Read-only: it never places orders.
const WATCH_SEC = Math.max(20, Number(process.env.WATCH_INTERVAL_SEC || 60));
// Thresholds come from the tunable alert config (state.alertCfg, alert_config tool), read on every check: no redeploy needed.
state.alertCfg ||= {};
const acfg = () => alerts.cfgOf(state.alertCfg);
const watch = { running: false, lastRun: null, lastOk: null, error: null, fails: 0, seen: [], hist: new Map(), alerted: new Map(), failAlerted: 0, realised: new Map(), realisedAt: 0, prevCl: new Map() };
const isCryptoSym = s => /\/USD$/.test(s);
const marketOpenNow = () => { const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })); const m = ny.getHours() * 60 + ny.getMinutes(); return ny.getDay() > 0 && ny.getDay() < 6 && m >= 570 && m < 960; };
const fmtP = v => (Math.abs(v) >= 1 ? v.toFixed(2) : v.toPrecision(3));
async function watchAlert(key, title, msg, link) {
  if (Date.now() - (watch.alerted.get(key) || 0) < acfg().cooldownMin * 60e3) return;
  watch.alerted.set(key, Date.now());
  const full = `${msg} Not financial advice.`;
  broadcast({ type: 'activity', text: 'WATCH: ' + full });
  const err = await push(title, full, link); if (err) console.warn('watch push failed', err);
}
async function watchTick() {
  if (!trade.configured()) return;
  watch.lastRun = Date.now();
  try {
    const open = marketOpenNow();
    const [pos, ords] = await Promise.all([trade.positions(), trade.orders().catch(() => [])]);
    const restStop = new Map(ords.filter(o => o.side === 'sell' && o.stopPrice).map(o => [o.symbol, o.stopPrice]));
    const items = new Map();   // key = Alpaca symbol form
    for (const p of pos) items.set(p.symbol, { sym: p.symbol, qty: p.qty, price: p.price, prevClose: p.prevClose, entry: p.entry, held: true, value: p.value, stop: restStop.get(p.symbol) ?? null });
    const extra = state.sigWatch.filter(w => !items.has(w.symbol) && !pos.some(p => p.symbol.replace('/', '') === w.symbol));
    if (extra.length) { try { const px = await trade.latestPrices(extra.map(w => w.symbol)); let pcs = {}; try { pcs = await trade.prevCloses(extra.map(w => w.symbol)); for (const k in pcs) watch.prevCl.set(k, pcs[k]); } catch (e) { console.warn('watch prevClose', e.message); } for (const w of extra) if (px[w.symbol]) items.set(w.symbol, { sym: w.symbol, price: px[w.symbol], prevClose: watch.prevCl.get(w.symbol), held: false, stop: null }); } catch (e) { console.warn('watch prices', e.message); } }
    for (const w of state.sigWatch) { const it = items.get(w.symbol) || items.get(w.symbol + '/USD') || [...items.values()].find(i => i.sym.replace('/', '') === w.symbol + 'USD'); if (it) { it.floor = Math.max(it.floor || 0, w.floor || 0) || null; if (it.entry == null) it.entry = w.entry; } }
    for (const it of items.values()) {   // trailing stop for every position and watch row: ratchets up with the highest price seen
      if (!(it.price > 0)) continue;
      it.stop = trailUpdate(it.sym, it.price, it.entry, Math.max(it.stop || 0, it.floor || 0)) ?? it.stop;
      const e = wlEval.get(wlKey(it.sym))?.target; const sc = scaleInfo(it.sym); it.target = sc?.next ?? e ?? (it.entry ? it.entry * (1 + 2 * acfg().trailPct / 100) : null);
    }
    realisedRefresh(pos);
    const now = Date.now(), seen = [];
    for (const it of items.values()) {
      if (it.held && wlHidden(it.sym)) continue;
      if (it.held && isDustVal(it.value)) continue;   // dust position: never alert
      const crypto = isCryptoSym(it.sym) || /USD$/.test(it.sym) && it.sym.length > 5;
      if (!crypto && !open) continue;
      seen.push(`${it.sym} ${fmtP(it.price)}${it.stop ? ' stop ' + fmtP(it.stop) : ''}`);
      const C = acfg(), h = (watch.hist.get(it.sym) || []).filter(x => now - x.t <= C.dropWindowMin * 60e3); h.push({ t: now, p: it.price }); watch.hist.set(it.sym, h);
      const stopTxt = it.stop ? `Trailing stop ${fmtP(it.stop)}.` : 'No stop set.';
      const entry = it.entry ?? state.sigWatch.find(w => w.symbol === it.sym.replace('/USD', ''))?.entry, tgt = it.target ?? null;
      const tr = state.trail[wlKey(it.sym)];
      if (it.held && tr && (tr.tier || 0) > (tr.notified || 0) && (crypto || open)) {
        const third = it.qty > 0 ? ` (about ${(it.qty / 3).toFixed(it.qty / 3 >= 10 ? 0 : 3)} of ${it.qty} held)` : '';
        tr.notified = tr.tier; saveState();
        await watchAlert(it.sym + ':scale' + tr.tier, `SCALE OUT ${tr.tier}: ${it.sym}`, `${it.sym} at ${fmtP(it.price)} reached +${tr.tier}R (entry ${fmtP(tr.entry)}, 1R is ${fmtP(tr.r)}). I would sell a third${third} to lock in profit.${tr.tier === 1 ? ` Stop moves up to at least breakeven plus costs, ${fmtP(it.stop)}, so this winner cannot turn into a loser.` : ' The last third rides the trailing stop.'} Trailing stop ${fmtP(it.stop)}.`, chartLink(it.sym, { stop: it.stop, target: tgt, entry }));
      }
      if (it.stop && it.price <= it.stop) await watchAlert(it.sym + ':stop', `STOP HIT: ${it.sym}`, `Stop hit: ${it.sym} at ${fmtP(it.price)}, under your trailing stop ${fmtP(it.stop)}. I would exit here.${it.held ? '' : ' (watch list)'}`, chartLink(it.sym, { stop: it.stop, target: tgt, entry }));
      if (tgt && it.price >= tgt) await watchAlert(it.sym + ':target', `TARGET REACHED: ${it.sym}`, `Target reached: ${it.sym} at ${fmtP(it.price)}, target ${fmtP(tgt)}. I would take profit here, or let the trailing stop ride (now ${fmtP(it.stop)}).`, chartLink(it.sym, { stop: it.stop, target: tgt, entry }));
      const hi = Math.max(...h.map(x => x.p)), drop = (hi - it.price) / hi * 100;
      if (drop >= C.dropPct && h.length > 1) await watchAlert(it.sym + ':drop', `SUDDEN DROP: ${it.sym}`, `Drop ${drop.toFixed(1)}% in ${Math.round((now - h[0].t) / 60e3)} min: ${it.sym} ${fmtP(hi)} to ${fmtP(it.price)}. ${stopTxt} I would hold, or trim if it loses ${fmtP(it.stop ?? it.price * 0.97)}.`, chartLink(it.sym, { stop: it.stop, target: tgt, entry }));
      else if (it.prevClose && (it.price - it.prevClose) / it.prevClose * 100 <= -C.dropDayPct) await watchAlert(it.sym + ':day', `DOWN ON THE DAY: ${it.sym}`, `Down on the day: ${it.sym} at ${fmtP(it.price)}, ${((it.price - it.prevClose) / it.prevClose * 100).toFixed(1)}% vs yesterday's close. ${stopTxt} I would trim, or exit under ${fmtP(it.stop ?? it.price * 0.97)}.`, chartLink(it.sym, { stop: it.stop, target: tgt, entry }));
    }
    for (const k of [...watch.hist.keys()]) if (!items.has(k)) watch.hist.delete(k);
    watch.items = [...items.values()];
    // Bought = moved off the watch list into holdings (a watch row is never dropped any other way except his say-so).
    const bought = new Set(pos.filter(p => !isDustVal(p.value)).map(p => wlKey(p.symbol)));
    if (state.sigWatch.some(w => bought.has(wlKey(w.symbol)))) { state.sigWatch = state.sigWatch.filter(w => !bought.has(wlKey(w.symbol))); saveState(); broadcast(watchlistMsg(true)); }
    watch.holdings = { at: Date.now(), positions: pos.map(p => ({ symbol: p.symbol, price: p.price, entry: p.entry, qty: p.qty, costBasis: p.costBasis, value: p.value, pnl: p.pnl, pnlPct: p.pnlPct, watch: state.sigWatch.some(w => w.symbol === p.symbol.replace('/USD', '').replace('/', '')) })) };
    broadcast(holdingsOut()); broadcast(watchlistMsg());
    watch.seen = seen; watch.lastOk = Date.now(); watch.error = null; watch.fails = 0;
  } catch (e) {
    watch.error = e.message; watch.fails++;
    console.warn('watchTick', e.message);
    if (watch.fails >= 5 && Date.now() - watch.failAlerted > 3600e3) { watch.failAlerted = Date.now(); await push('Investment Watch is blind', `The price check has failed ${watch.fails} times in a row: ${e.message.slice(0, 150)}. You are not being watched until this clears.`); }
  }
}
handlers.watch_status = async () => {
  if (!trade.configured()) return 'The Investment Watch cannot run: Alpaca keys are not set in Railway.';
  const ago = watch.lastOk ? Math.round((Date.now() - watch.lastOk) / 1000) : null;
  return JSON.stringify({ running: watch.running, intervalSeconds: WATCH_SEC, lastGoodCheckSecondsAgo: ago, error: watch.error, watching: watch.seen, hours: 'stocks 9:30 to 16:00 Eastern on weekdays; crypto around the clock', alerts: { stopHit: 'price at or under the stop (signal_watch stop or a resting broker stop order)', suddenDrop: `${acfg().dropPct}% fall within ${acfg().dropWindowMin} minutes`, downOnDay: `${acfg().dropDayPct}% under yesterday's close`, repeatEveryMinutes: acfg().cooldownMin, moreAlerts: 'see live_status: live quote freshness plus alert rules' }, upTrendRules: 'checked every 15 minutes by the sell-warning scan', marketSweep: { everyMinutes: acfg().sweepEveryMin, hours: 'market hours, about 21 a day', today: state.sweepCount?.day === new Date().toDateString() ? state.sweepCount.n : 0, last: state.sweep || null, covers: 'top gainers, most active, and a broad liquid universe, scored for new uptick setups; alerts as BUY-WATCH' }, brokerStopOrders: 'NOT built yet: Jarvis alerts your phone but there are no resting stop orders at Alpaca; say so plainly if asked', guide: 'Answer the interval as a real number (every N seconds). Be honest that an alert needs you to act and a resting broker stop does not exist yet.' });
};
if (!process.env.JARVIS_SMOKE) { watch.running = true; setInterval(() => watchTick().catch(() => {}), WATCH_SEC * 1000); setTimeout(() => watchTick().catch(() => {}), 5000); }
// ---------- Live quote stream + real-time alerts (livefeed.js feeds, alerts.js rules) ----------
// Priority symbols = open Alpaca positions + signal_watch list. Quotes come from Finnhub (live pulse) with Twelve Data as backup/cross-check.
// The alert loop re-reads the config each round, so thresholds and the interval change by voice (alert_config) with no redeploy.
const prioritySyms = () => {
  const dust = dustKeys(), m = new Map((watch.items || []).filter(i => !(i.held && isDustVal(i.value))).map(i => [i.sym, i]));
  for (const w of state.sigWatch) if (!dust.has(wlKey(w.symbol)) && (![...m.keys()].some(k => k.replace('/', '') === w.symbol || k === w.symbol))) m.set(w.symbol, { sym: w.symbol, held: false, stop: trailStopOf(w.symbol) ?? w.stop, entry: w.entry });
  return [...m.values()].slice(0, 25);
};
const alertHist = new Map(), newsSeen = new Set();
async function liveAlert(key, title, body, coolMin, link) {
  if (Date.now() - (watch.alerted.get(key) || 0) < coolMin * 60e3) return;
  watch.alerted.set(key, Date.now());
  if (/^(BUY-WATCH|SUDDEN DROP|DOWN ON THE DAY)/i.test(title) && trade.configured()) {
    const sm = String(title).match(/:\s*([A-Z.\-\/]{1,9})\s*$/);
    if (sm) { armBuy(sm[1], title, null); body += ` Ready: open Jarvis and say "buy it" for $${ARM_DOLLARS}; you still confirm.`; }
  }
  broadcast({ type: 'activity', text: 'ALERT: ' + body });
  const err = await push(title, body, link); if (err) console.warn('alert push failed', err);
}
async function alertTick() {
  const C = acfg(), now = Date.now(), items = prioritySyms();
  for (const it of items) {
    const q = lf.latest(it.sym); if (!q) continue;
    const h = (alertHist.get(it.sym) || []).filter(x => now - x.t <= C.dropWindowMin * 60e3);
    const t = now - q.ageSec * 1000; if (!h.length || t - h[h.length - 1].t > 1500) h.push({ t, p: q.price });
    alertHist.set(it.sym, h);
    const ctx = await alerts.context(it.sym);
    for (const a of alerts.triggers(it, q, h, ctx, C)) { const lm = String(a.level || '').match(/^(.*?)\s+([\d.]+)$/); await liveAlert(a.key, a.title, alerts.format(a, q), a.cooldownMin, chartLink(it.sym, { stop: it.stop, target: it.target, entry: it.entry, ...(lm ? { [lm[1].replace(/\s+/g, '_')]: lm[2] } : {}) })); }
  }
}
const alertLoop = () => setTimeout(async () => { try { await alertTick(); } catch (e) { console.warn('alertTick', e.message); } alertLoop(); }, Math.max(5, acfg().intervalSec) * 1000);
let lastSigAlert = 0, lastNews = 0, lastSweep = 0;
// Full-market sweep: today's gainers + most active (top 40 each) + a broad liquid universe, narrowed to the stocks that are up
// today (price >= $2), then the full signal score on the best movers. Alerts reuse the BUY-WATCH path (same cooldown per ticker).
async function sweepTick() {
  const C = acfg(), now = Date.now();
  if (!marketOpenNow() || !trade.configured() || now - lastSweep < C.sweepEveryMin * 60e3) return;
  lastSweep = now;
  try {
    const t = await trade.trending(40), pool = [...new Set([...t.all, ...trade.SWEEP_UNIVERSE, ...state.sigWatch.map(w => w.symbol)])];
    const snaps = await trade.snapshots(pool);
    const first = new Set(t.all);
    const cand = snaps.filter(x => x.price >= 2 && x.changePct > 0).sort((a, b) => (first.has(b.symbol) - first.has(a.symbol)) || b.changePct - a.changePct).slice(0, Math.max(5, C.sweepSize));
    const r = await sig.scan(cand.map(x => x.symbol), 8), dustK = dustKeys();
    state.sweep = { at: now, pool: pool.length, candidates: cand.length, top: r.top.map(x => `${x.symbol} ${x.score}`) }; const day = new Date().toDateString(); state.sweepCount = { day, n: (state.sweepCount?.day === day ? state.sweepCount.n : 0) + 1 };
    for (const x of r.top) if (x.score >= C.newSignalScore && x.stop && !dustK.has(wlKey(x.symbol))) {
      const body = `${x.symbol}: BUY-WATCH, market sweep found a new uptick setup scored ${x.score}/100 (${x.label}). Price ${fmtP(x.price)}, level: stop ${fmtP(x.stop)}, target ${fmtP(x.target)}, risk ${x.riskPct}%. I would look at entering near ${fmtP(x.price)} with the stop at ${fmtP(x.stop)}.`;
      await liveAlert(`${x.symbol}:newsig`, `BUY-WATCH: ${x.symbol}`, body, C.infoCooldownHours * 60, chartLink(x.symbol, { stop: x.stop, target: x.target, entry: x.price }));
    }
  } catch (e) { console.warn('market sweep', e.message); }
}
// Biggest-mover sweep (stocks + crypto), every moverEveryMin (30). Takes the SINGLE biggest absolute mover across Alpaca stocks
// (gainers, losers, active, universe; market hours only) and the top-100 coins (24h, 24/7). It is presented only if it passes the
// Owner's alert thresholds (spikePct with spikeVolRatio volume, or dropDayPct down, or unusualVolRatio volume with a spikePct move).
// Otherwise nothing at all: no message, no push, no voice. One short line when it qualifies.
let lastMover = 0;
async function moverTick() {
  const C = acfg(), now = Date.now();
  if (now - lastMover < C.moverEveryMin * 60e3) return;
  lastMover = now;
  try {
    const cands = [];
    if (marketOpenNow() && trade.configured()) {
      const t = await trade.trending(40), pool = [...new Set([...t.all, ...(t.losers || []), ...trade.SWEEP_UNIVERSE, ...state.sigWatch.map(w => w.symbol)])];
      for (const x of await trade.snapshots(pool)) if (x.price >= 2) cands.push({ sym: x.symbol, price: x.price, move: x.changePct, kind: 'stock' });
    }
    try { for (const c of (await crypto_.scan({ top: 100 })).coins) if (c.change24h != null && c.price) cands.push({ sym: `${c.symbol}/USD`, price: c.price, move: c.change24h, kind: 'crypto' }); } catch (e) { console.warn('mover crypto', e.message); }
    const top = cands.filter(c => Number.isFinite(c.move)).sort((a, b) => Math.abs(b.move) - Math.abs(a.move))[0];
    // Stage 1 first: volume UP vs the 20-day average, price move not required (volFirstRatio, tunable via alert_config). Checked on the top 8 gainers.
    if (C.volFirstRatio > 0) for (const c of cands.filter(x => Number.isFinite(x.move) && x.move >= 0 && !(x.kind === 'stock' && dustKeys().has(wlKey(x.sym)))).sort((a, b) => b.move - a.move).slice(0, 8)) {
      const cx = await alerts.context(c.sym), r = cx?.volRatio ?? 0; if (r < C.volFirstRatio) continue;
      const lb = c.sym.replace('/USD', ''), s2 = c.move > 0, s3 = s2 && cx.ma20Rising && c.price > cx.ma20;
      await liveAlert(`${c.sym}:vol1`, `VOLUME FIRST: ${lb}`, `${lb} volume ${r.toFixed(1)}x the 20-day average (stage 1). Price ${fmtP(c.price)}, ${c.move >= 0 ? '+' : ''}${c.move.toFixed(1)}%: ${s2 ? 'confirming up (stage 2)' : 'not moving yet (stage 2 pending)'}. Trend: ${s3 ? 'above a rising 20-day MA (stage 3)' : 'not confirmed (stage 3 pending)'}. Information only.`, C.infoCooldownHours * 60, chartLink(c.sym));
      break;
    }
    if (!top || (top.kind === 'stock' && dustKeys().has(wlKey(top.sym)))) return;
    const ctx = await alerts.context(top.sym), vr = ctx?.volRatio ?? null, up = top.move >= C.spikePct && (vr == null || vr >= C.spikeVolRatio);
    const down = top.move <= -C.dropDayPct, vol = vr != null && vr > C.unusualVolRatio && Math.abs(top.move) >= C.spikePct;
    if (!(up || down || vol)) return;
    const label = top.sym.replace('/USD', ''), sign = top.move >= 0 ? '+' : '';
    await liveAlert(`${top.sym}:mover`, `MOVER: ${label}`, `${label} ${sign}${top.move.toFixed(1)}%${top.kind === 'crypto' ? ' (24h)' : ' today'}, price ${fmtP(top.price)}${vr != null ? `, volume ${vr.toFixed(1)}x average` : ''}.`, C.infoCooldownHours * 60, chartLink(top.sym));
  } catch (e) { console.warn('mover sweep', e.message); }
}
async function slowAlertTick() {   // new signal (fresh setup with a stop) + news catalyst on held symbols
  const C = acfg(), now = Date.now();
  if (marketOpenNow() && now - lastSigAlert > C.newSignalEveryMin * 60e3) {
    lastSigAlert = now;
    try {
      const list = new Set(state.sigWatch.map(w => w.symbol));
      if (trade.configured()) for (const s of (await trade.trending(10)).all || []) list.add(s);
      const r = await sig.scan([...list].slice(0, 20), 8);
      const dustK = dustKeys();
      for (const x of r.top) if (x.score >= C.newSignalScore && x.stop && !dustK.has(wlKey(x.symbol))) {
        const body = `${x.symbol}: BUY-WATCH, new setup scored ${x.score}/100 (${x.label}). Price ${fmtP(x.price)}, level: stop ${fmtP(x.stop)}, target ${fmtP(x.target)}, risk ${x.riskPct}%. Quote: daily-candle scan, up to ${C.newSignalEveryMin} min old. I would look at entering near ${fmtP(x.price)} with the stop at ${fmtP(x.stop)}.`;
        await liveAlert(`${x.symbol}:newsig`, `BUY-WATCH: ${x.symbol}`, body, C.infoCooldownHours * 60, chartLink(x.symbol, { stop: x.stop, target: x.target, entry: x.price }));
      }
    } catch (e) { console.warn('new-signal alert', e.message); }
  }
  if (now - lastNews > C.newsEveryMin * 60e3 && md.configured('finnhub')) {
    lastNews = now;
    for (const it of prioritySyms().filter(i => i.held && !/\/USD$/.test(i.sym)).slice(0, 8)) try {
      const q = lf.latest(it.sym);
      for (const h of alerts.catalysts((await md.news(it.sym)).headlines, newsSeen).slice(0, 1)) {
        newsSeen.add(h.headline); if (newsSeen.size > 300) newsSeen.delete(newsSeen.values().next().value);
        await liveAlert(`${it.sym}:news:${h.headline.slice(0, 40)}`, `NEWS: ${it.sym}`, `${it.sym}: INFO, news catalyst on a position you hold: "${h.headline.slice(0, 140)}" (${h.source || 'news'}). ${q ? `Price ${fmtP(q.price)}, quote ${q.ageSec}s old.` : 'No live quote yet.'} I would check the story before acting.`, 24 * 60, chartLink(it.sym));
      }
    } catch (e) { console.warn('news alert', it.sym, e.message); }
  }
}
handlers.live_status = async () => JSON.stringify({ ...lf.status(), alertRules: acfg(), guide: 'Say how fresh the quotes really are in seconds per symbol and which feed. Be honest: Finnhub free is near-live; Twelve Data is spaced out to fit 800/day. Alerts are informational phone pushes ; Jarvis does not auto-trade and no resting broker stop orders exist.' });
handlers.alert_config = async ({ action, key, value }) => {
  if (action === 'set') { const r = alerts.setCfg(state.alertCfg, key, value); if (r.error) return r.error; saveState(); return `Set ${key} to ${value}. Takes effect on the next check, no redeploy. Now: ${JSON.stringify(acfg())}`; }
  if (action === 'reset') { state.alertCfg = {}; saveState(); return 'Alert settings back to defaults.'; }
  return JSON.stringify({ settings: acfg(), meaning: { dustUsd: 'open positions worth less than this many dollars are dust: no alerts and no watch-list row (default 1)', intervalSec: 'seconds between alert checks', dropPct: 'sudden drop % within dropWindowMin minutes', dropDayPct: 'drop % under yesterday close', spikePct: 'spike up %, with volume at least spikeVolRatio x average', newSignalScore: 'min signal_scan score for a buy-watch', moverEveryMin: 'minutes between biggest-mover sweeps, stocks and crypto (default 30)', targetNearPct: 'how close to target/resistance counts as reached', volFirstRatio: 'STAGE 1, the first flag: volume up at least this x the 20-day average, no price move needed (default 1.5, 0 = off); price, trend and spike volume confirm afterwards', unusualVolRatio: 'volume x the 20-day average (stage 3 spike)', trailPct: 'trailing stop: % below the highest price since entry (default 10); the stop only ever moves up',cooldownMin: 'repeat spacing for stop/drop', infoCooldownHours: 'repeat spacing for other alerts', staleSec: 'quotes older than this never trigger price alerts' } });
};
if (!process.env.JARVIS_SMOKE) {
  lf.start({ priority: prioritySyms, open: marketOpenNow });
  // After a restart no quotes are held, so the watch list has no daily %: fetch once, and again every 30 min while any is missing.
  const seedDay = () => { const syms = prioritySyms().map(i => i.sym); if (syms.some(s => !lf.latest(s)?.prevClose)) lf.seed(syms).then(() => { broadcast(watchlistMsg(true)); if (watch.holdings) broadcast(holdingsOut()); }).catch(() => {}); };
  setTimeout(seedDay, 8000); setInterval(seedDay, 30 * 60e3);
  setTimeout(alertLoop, 20000); setInterval(() => slowAlertTick().catch(() => {}), 60e3); setInterval(() => sweepTick().catch(() => {}), 60e3); setInterval(() => moverTick().catch(() => {}), 60e3);
}
async function cryptoBrief(slot) {
  const blocked = overBudget('chat');
  if (blocked) { console.log(`crypto ${slot} brief skipped: ${blocked}`); return; }
  let prompt;
  if (slot === 'midday') {
    let moved;
    try { moved = crypto_.notable((await crypto_.scan({ watch: state.watchlist })).coins, ALERT_PCT); }
    catch (e) { console.warn('crypto midday check failed:', e.message); return; }
    if (!moved.length) { console.log('crypto midday check: nothing notable'); return; }
    prompt = BRIEF_PROMPTS.midday(moved.map(c => `${c.name} ${c.change24h > 0 ? '+' : ''}${c.change24h}%`).join(', '));
  } else prompt = BRIEF_PROMPTS[slot]();
  console.log(`crypto ${slot} brief starting`);
  const text = await ask(prompt, { spoken: false, origin: 'system', label: `Crypto ${slot} brief` });
  if (text && !/spending limit|allowance|out of|could not|problem finishing/i.test(text)) await push(`Crypto ${slot}`, text, cryptoLinks(text));
}
function briefTick() {
  if (BRAIN !== 'openrouter' || !TALK.apiKey) return;
  state.briefs ||= {};
  const clock = localClock(new Date(), process.env.TZ || 'America/New_York');
  for (const slot of dueSlots({ clock, slots: BRIEF_SLOTS, done: state.briefs })) {
    state.briefs[slot] = clock.day; saveState(); // mark first so a slow brief can't run twice
    cryptoBrief(slot).catch(e => console.error(`crypto ${slot} brief failed`, e));
  }
}
if (!process.env.JARVIS_SMOKE) setInterval(briefTick, 60_000);

// ---------- W2 client follow-ups (texts go out from the shop iPhone through an Apple Shortcut) ----------
// Every morning Jarvis drafts a follow-up for each job that ended FOLLOWUP_DAYS ago (calendar events whose colour meaning
// contains "job"; all timed events if no meanings are set). Nothing is sent without the Owner's yes: he approves, edits or
// skips each one (voice or /followups). The shop iPhone runs a Shortcut a few times a day: it fetches the approved texts
// from /api/outbox (secret token, not the PIN), finds each customer in its Contacts by name, sends from the shop number,
// then reports back. iPhones don't let apps text on their own; Shortcuts is the one allowed way.
state.followups ||= [];
state.outboxToken ||= crypto.randomBytes(18).toString('base64url');
const FOLLOWUP_DAYS = Number(process.env.FOLLOWUP_DAYS || 3);
const FOLLOWUP_AT = parseTime(process.env.FOLLOWUP_AT ?? '08:45');
const custName = title => String(title || '').split(/\s[-–|:@]\s|,|\(/)[0].replace(/^(job|install|tint|appt|appointment)[:\s]+/i, '').trim().slice(0, 40);
function followupText(f) {
  const first = f.customer.split(/\s+/)[0];
  const review = state.reviewLink ? ` If you have a minute, a quick review helps us a lot: ${state.reviewLink}` : '';
  return (state.followupTemplate || 'Hi {name}, this is Defiant Audio checking in on your {job}. How is everything holding up? Let us know if anything needs attention.{review}')
    .replace('{name}', first).replace('{job}', f.job || 'visit').replace('{review}', review);
}
async function draftFollowups() {
  if (!cal.configured()) return 0;
  const tz = process.env.TZ || 'America/New_York';
  const day = new Date(Date.now() - FOLLOWUP_DAYS * 86400e3).toLocaleDateString('en-CA', { timeZone: tz });
  const r = await cal.list({ from: day, to: day }, state.calendarColors);
  const timed = r.events.filter(e => !e.allDay);
  const jobs = timed.some(e => /job/i.test(e.meaning || '')) ? timed.filter(e => /job/i.test(e.meaning || '')) : timed;
  let n = 0;
  for (const e of jobs) {
    if (state.followups.some(f => f.eventId === e.id)) continue;
    const customer = custName(e.title); if (!customer) continue;
    const f = { id: Math.random().toString(36).slice(2, 7), eventId: e.id, customer, job: (e.title.split(/\s[-–|:]\s/)[1] || '').trim().toLowerCase() || undefined, date: day, status: 'proposed', at: Date.now() };
    f.text = followupText(f); state.followups.push(f); n++;
  }
  state.followups = state.followups.filter(f => Date.now() - f.at < 30 * 86400e3).slice(-200);
  saveState(); return n;
}
const followupsWaiting = () => state.followups.filter(f => f.status === 'proposed');
async function followupTick() {
  const clock = localClock(new Date(), process.env.TZ || 'America/New_York');
  if (FOLLOWUP_AT == null || state.followupDay === clock.day || clock.minutes < FOLLOWUP_AT || clock.minutes > FOLLOWUP_AT + 240) return;
  state.followupDay = clock.day; saveState();
  try {
    const n = await draftFollowups();
    if (n) console.log(`follow-ups: drafted ${n}`);
  } catch (e) { console.warn('follow-ups:', e.message); }
}
if (!process.env.JARVIS_SMOKE) setInterval(followupTick, 5 * 60_000);
function followupNote() {
  const w = followupsWaiting(); if (!w.length || state.followupAnnounced === localClock().day) return '';
  state.followupAnnounced = localClock().day; saveState();
  return ` ${w.length} customer follow-up${w.length > 1 ? 's are' : ' is'} ready for your OK: ${listJoin(w.map(f => f.customer))}. Say "send the follow-ups", or check them on the follow-ups page.`;
}
Object.assign(handlers, {
  followup_list: async () => state.followups.filter(f => f.status !== 'sent' && f.status !== 'skipped').map(f => `${f.id} [${f.status}] ${f.customer}: "${f.text}"`).join('\n') || 'No follow-ups waiting.',
  followup_approve: async ({ ids, all }) => {
    const pick = all ? followupsWaiting() : state.followups.filter(f => (ids || []).includes(f.id));
    pick.forEach(f => { f.status = 'approved'; f.approvedAt = Date.now(); }); saveState();
    return pick.length ? `Approved ${pick.length} (${pick.map(f => f.customer).join(', ')}). The shop iPhone sends them on its next run.` : 'Nothing matched.';
  },
  followup_skip: async ({ ids }) => { const pick = state.followups.filter(f => (ids || []).includes(f.id)); pick.forEach(f => f.status = 'skipped'); saveState(); return `Skipped ${pick.length}.`; },
  followup_add: async ({ customer, text }) => {
    const f = { id: Math.random().toString(36).slice(2, 7), customer, status: 'proposed', at: Date.now() };
    f.text = text || followupText(f); state.followups.push(f); saveState(); return `Drafted for ${customer}: "${f.text}". Needs his OK before it goes out.`;
  },
  followup_edit: async ({ id, text }) => { const f = state.followups.find(x => x.id === id); if (!f) return 'No such follow-up.'; f.text = text; saveState(); return 'Updated.'; }
});

// ---------- HTTP ----------
const app = express();
app.set('trust proxy', 1);
const json1mb = express.json({ limit: '1mb' });
app.use((req, res, next) => req.path === '/api/photo' ? next() : json1mb(req, res, next)); // the photo route has its own bigger limit
app.use(express.urlencoded({ extended: false }));

// ---------- PIN lock (set JARVIS_PIN when Jarvis is on the internet) ----------
const PIN = String(process.env.JARVIS_PIN || '');
const SECRET = process.env.JARVIS_SECRET || crypto.createHash('sha256').update('jarvis:' + PIN + ':' + (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN || '')).digest('hex');
const TOKEN = crypto.createHmac('sha256', SECRET).update('ok:' + PIN).digest('hex');
const readCookie = req => Object.fromEntries(String(req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p.length === 2))['jarvis_auth'];
const authed = req => !PIN || readCookie(req) === TOKEN;
const tries = new Map();
const safeNext = n => (/^\/(chart)?\?[\w=&.%:+\-]{1,300}$/.test(String(n || '')) ? String(n) : '');
const loginPage = (err = '', next = '') => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>J.A.R.V.I.S.</title><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><meta name="theme-color" content="#02060c">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle,#06223a,#01050a 70%);color:#cfefff;font-family:system-ui,sans-serif}
form{display:flex;flex-direction:column;gap:14px;align-items:center;padding:16px}h1{font-weight:800;letter-spacing:.3em;color:#3fe0ff;text-shadow:0 0 14px rgba(63,224,255,.6);margin:0 0 10px}
input{font-size:28px;letter-spacing:.4em;text-align:center;width:220px;padding:12px;background:#041422;color:#3fe0ff;border:1px solid #3fe0ff;outline:0}
button{font-size:14px;letter-spacing:.3em;padding:14px 34px;background:transparent;color:#3fe0ff;border:1px solid #3fe0ff}p{color:#ff4d5e;margin:0;min-height:1em}</style></head>
<body><form method="post" action="/login${next ? `?next=${encodeURIComponent(next)}` : ''}"><h1>J.A.R.V.I.S.</h1><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus aria-label="PIN"><p>${err}</p><button>UNLOCK</button></form></body></html>`;
app.post('/login', (req, res) => {
  const ip = req.ip, now = Date.now();
  const t = (tries.get(ip) || []).filter(x => now - x < 10 * 60_000);
  if (t.length >= 8) return res.status(429).send(loginPage('Too many tries. Wait 10 minutes.'));
  const ok = PIN && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(String(req.body?.pin || '')).digest()), Buffer.from(crypto.createHash('sha256').update(PIN).digest()));
  if (!ok) { t.push(now); tries.set(ip, t); return res.status(401).send(loginPage('Wrong PIN.')); }
  tries.delete(ip);
  res.setHeader('Set-Cookie', `jarvis_auth=${TOKEN}; Path=/; Max-Age=${60 * 60 * 24 * 180}; HttpOnly; SameSite=Lax${req.secure ? '; Secure' : ''}`);
  res.redirect(303, safeNext(req.query.next) || '/');
});
app.get('/health', (_req, res) => res.send('ok'));
// Alert button target: signed, watch-only (never places a buy).
app.get('/watch-add', async (req, res) => {
  const sym = String(req.query.s || '').toUpperCase().replace(/[^A-Z.\-]/g, '').slice(0, 12), k = String(req.query.k || '');
  const page = (t, ok) => res.status(ok ? 200 : 400).send(`<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#02060c;color:#cfefff;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:16px"><div><h2 style="color:#3fe0ff">${ok ? 'Added to watch list' : 'Not added'}</h2><p>${t}</p><p><a style="color:#3fe0ff" href="/">Open Jarvis</a></p></div>`);
  const want = watchSig(sym);
  if (!sym || k.length !== want.length || !crypto.timingSafeEqual(Buffer.from(k), Buffer.from(want))) return page('Bad or expired link.', false);
  try { const r = await handlers.signal_watch({ action: 'add', symbol: sym }); return page(String(r).startsWith('Watching') ? `${sym} is on the watch list. Nothing was bought.` : String(r).replace(/[<>&]/g, ''), String(r).startsWith('Watching')); } catch (e) { return page('Could not add it.', false); }
});
// The shop iPhone's Shortcut: token in the URL instead of the PIN cookie.
const outboxOk = req => String(req.query.token || '') === state.outboxToken;
app.get('/api/outbox', (req, res) => {
  if (!outboxOk(req)) return res.status(401).json({ error: 'bad token' });
  const due = state.followups.filter(f => f.status === 'approved');
  due.forEach(f => { f.status = 'sending'; f.pickedAt = Date.now(); }); saveState();
  res.json({ count: due.length, messages: due.map(f => ({ id: f.id, name: f.customer, text: f.text })) });
});
app.all('/api/outbox/:id/sent', (req, res) => {
  if (!outboxOk(req)) return res.status(401).json({ error: 'bad token' });
  const f = state.followups.find(x => x.id === req.params.id); if (!f) return res.status(404).end();
  const failed = /fail|notfound|missing/i.test(String(req.query.status || ''));
  f.status = failed ? 'failed' : 'sent'; f.sentAt = Date.now(); saveState();
  broadcast({ type: 'activity', text: failed ? `Follow-up to ${f.customer} NOT sent (no matching contact on the shop phone)` : `Follow-up sent to ${f.customer}` });
  res.json({ ok: true });
});
// picked up but never confirmed within 2 hours: put it back so the next run retries
setInterval(() => { let c = false; for (const f of state.followups) if (f.status === 'sending' && Date.now() - f.pickedAt > 2 * 3600e3) { f.status = 'approved'; c = true; } if (c) saveState(); }, 10 * 60_000);
const PUBLIC_FILES = /^\/(manifest\.webmanifest|sw\.js|icons\/[\w.-]+\.png)$/;
app.use((req, res, next) => {
  if (authed(req) || PUBLIC_FILES.test(req.path)) return next();
  // Claude can run and read the model test remotely with BENCH_TOKEN (set in Railway); only the bench and talk-model routes accept it.
  const BT = String(process.env.BENCH_TOKEN || '');
  if (BT.length >= 16 && /^\/api\/(bench|talk-model)$/.test(req.path) && String(req.query.token || req.headers['x-bench-token'] || '') === BT) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'locked' });
  res.status(401).send(loginPage('', (req.path === '/chart' || (req.path === '/' && req.query.buy)) ? safeNext(req.originalUrl) : ''));
});
app.get('/chart', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'chart.html')));
app.get('/api/chart', async (req, res) => {
  try {
    const y = chart.ySymbol(req.query.s); if (!y) return res.status(400).json({ error: 'Unknown symbol.' });
    const tf = ['5m', '15m', '1h', '1d', '1w'].includes(req.query.tf) ? req.query.tf : '1d';
    const b = await chart.bars(y, tf), px = b[b.length - 1].c;
    res.json({ symbol: y, tf, bars: b.slice(-120), price: px, ...chart.levels(b, px) });
  } catch (e) { res.status(502).json({ error: String(e.message || e).slice(0, 200) }); }
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (_req, res) => {
  res.json({
    name: process.env.JARVIS_NAME || 'JARVIS',
    wakeWord: (process.env.WAKE_WORD || 'jarvis').toLowerCase(),
    userTitle: process.env.USER_TITLE || 'sir',
    wakeThreshold: process.env.WAKE_THRESHOLD || '0.5',   // on-device "Hey Jarvis" score needed while music plays (Android app only)
    elevenlabs: Boolean(process.env.FISH_API_KEY || process.env.ELEVENLABS_API_KEY),
    voiceProvider: process.env.FISH_API_KEY ? 'FISH AUDIO' : 'ELEVENLABS'
  });
});

// Photo analysis: the HUD camera button posts a JPEG (data URL) here; the answer is spoken and shown as the "image_analysis" panel.
app.post('/api/photo', express.json({ limit: '12mb' }), async (req, res) => {
  const question = String(req.body?.question || '').trim().slice(0, 500);
  const cmd = question ? `look at this photo: ${question}` : 'look at this photo';
  const fail = (code, msg) => {
    recordFailure(cmd, msg);
    broadcast({ type: 'log', role: 'system', text: 'Photo analysis failed: ' + msg });
    broadcast({ type: 'say', text: msg, speak: true });
    res.status(code).json({ error: msg });
  };
  const ce = String(req.body?.clientError || '').trim().slice(0, 300);
  if (ce) return fail(400, ce.replace(/\.?$/, ', sir.'));
  const img = parseDataUrl(req.body?.image);
  if (!img) return fail(400, 'I did not receive a usable photo, sir. Please try again.');
  if (img.bytes > MAX_IMAGE_BYTES) return fail(413, 'That photo is too large to send, sir. Try again.');
  const block = overBudget('talk'); if (block) return fail(429, block);
  broadcast({ type: 'state', state: 'thinking' });
  broadcast({ type: 'log', role: 'user', text: question ? `[photo] ${question}` : '[photo]' });
  try {
    const r = await analyzePhoto({ image: req.body.image, question });
    const s2 = addSpend(r.cost, 'talk');
    state.panels.image_analysis = { id: 'image_analysis', title: r.title, body: r.details || r.spoken, updatedAt: new Date().toISOString() };
    saveState();
    broadcast({ type: 'panels', panels: state.panels });
    broadcast({ type: 'spend', turn: r.cost, today: s2.usd, limit: DAILY_BUDGET });
    remember('user', '[sent a photo]' + (question ? ' ' + question : '')); remember('jarvis', r.spoken);
    broadcast({ type: 'say', text: r.spoken, speak: true });
    res.json({ ok: true, spoken: r.spoken, title: r.title });
  } catch (e) {
    fail(502, /^[A-Z]/.test(e.message) ? e.message.replace(/\.?$/, ', sir.') : 'The photo analysis failed, sir.');
  }
});
// Plain text ask (used by the safe-mode page)
app.post('/api/ask', async (req, res) => {
  const t = String(req.body?.text || '').trim().slice(0, 4000);
  if (!t) return res.status(400).json({ error: 'empty' });
  res.json({ reply: await ask(t, { spoken: false }) });
});
// Owner-facing calendar check (PIN protected like everything else): open /api/calendar-check on the phone.
app.get('/api/calendar-check', async (_req, res) => {
  const r = await cal.check();
  const lines = [
    'JARVIS CALENDAR CHECK', '',
    `Robot email (share each calendar with this): ${r.robotEmail || 'unknown'}`,
    `Calendars in Railway (GOOGLE_CALENDAR_ID): ${r.configured.join(', ') || 'NOT SET'}`, '',
    ...r.perCalendar.map(p => p.works ? `  OK   ${p.id}: ${p.events} events (14 days back to 30 ahead)` : `  FAIL ${p.id}: ${p.error}`),
    '', `Calendars the robot has in its list (${r.visibleCalendars.length}):`,
    ...r.visibleCalendars.map(c => `  - ${c.name}  |  id: ${c.id}  |  access: ${c.access}`),
    '', `Jarvis's clock says now: ${r.today} (${process.env.TZ || 'America/New_York'})`,
    ...(r.sample.length ? ['Latest events seen:', ...r.sample.map(x => '  ' + x)] : []),
    ...(r.problem ? ['', 'PROBLEM: ' + r.problem] : [])
  ];
  res.type('text/plain').send(lines.join('\n'));
});
// ---------- Places box (/places): places + the reminder / mention / question bucket ----------
app.get('/places', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'places.html')));
const placesView = () => {
  const here = currentPlace();
  return { places: state.places.map(p => ({ name: p.name, kind: p.kind, radius: p.radius || 150, lat: p.lat, lon: p.lon, address: p.address })),
    here: here ? here.name : null, located: !!state.location, items: state.reminders, shop: { days: SHOP_DAYS, from: SHOP_FROM, to: SHOP_TO } };
};
app.get('/api/places', (_req, res) => res.json(placesView()));
app.post('/api/places', async (req, res) => {
  const b = req.body || {}, name = String(b.name || '').trim().slice(0, 60);
  if (!name) return res.status(400).json({ error: 'Give the place a name.' });
  let lat = Number(b.lat), lon = Number(b.lon), address;
  if (b.address) {
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/search?' + new URLSearchParams({ q: b.address, format: 'json', limit: '1', countrycodes: 'us' }),
        { headers: { 'User-Agent': 'Jarvis-2.0 personal assistant (github.com/Elliot-H/Jarvis-2.0)' }, signal: AbortSignal.timeout(10000) });
      if (!r.ok) throw new Error(`lookup service answered ${r.status}`);
      const j = await r.json();
      if (!j[0]) return res.status(404).json({ error: 'Could not find that address. Try adding the town and state.' });
      lat = Number(j[0].lat); lon = Number(j[0].lon); address = j[0].display_name;
    } catch (e) { return res.status(502).json({ error: 'Address lookup failed: ' + e.message }); }
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).json({ error: 'No position: allow location on this page, or type an address.' });
  const key = placeKey(name), old = state.places.find(p => placeKey(p.name) === key);
  const radius = Number(b.radius) > 0 ? Math.min(5000, Number(b.radius)) : old?.radius || (key === 'shop' ? SHOP_RADIUS : 150);
  state.places = state.places.filter(p => placeKey(p.name) !== key);
  state.places.push({ name, lat: +lat.toFixed(5), lon: +lon.toFixed(5), radius, address,
    kind: b.home || key === 'home' ? 'home' : key === 'shop' ? 'work' : 'place' });
  if (!b.address) state.lastPlace = key;
  saveState(); res.json({ ok: true, address, ...placesView() });
});
app.patch('/api/places/:name', (req, res) => {
  const p = state.places.find(x => placeKey(x.name) === placeKey(req.params.name));
  if (!p) return res.status(404).json({ error: 'No such place.' });
  if (Number(req.body?.radius) > 0) p.radius = Math.min(5000, Number(req.body.radius));
  saveState(); res.json(placesView());
});
app.delete('/api/places/:name', (req, res) => {
  const key = placeKey(req.params.name);
  state.places = state.places.filter(p => placeKey(p.name) !== key);
  saveState(); res.json(placesView());
});
app.post('/api/items', (req, res) => {
  const it = cleanItem(req.body || {});
  if (!it.text) return res.status(400).json({ error: 'Write what Jarvis should say.' });
  const i = state.reminders.findIndex(r => r.id === it.id);
  if (i >= 0) state.reminders[i] = { ...it, lastShown: state.reminders[i].lastShown }; else state.reminders.push(it);
  saveState(); res.json(placesView());
});
app.delete('/api/items/:id', (req, res) => { state.reminders = state.reminders.filter(r => r.id !== req.params.id); saveState(); res.json(placesView()); });
// Background position reports from the Android app (every ~100 m moved, at most once a minute).
app.post('/api/loc', (req, res) => {
  const lat = Number(req.body?.lat), lon = Number(req.body?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return res.status(400).end();
  const moved = !state.location || Math.abs(state.location.lat - lat) > .5 || Math.abs(state.location.lon - lon) > .5;
  state.location = { lat: +lat.toFixed(4), lon: +lon.toFixed(4), at: new Date().toISOString(), tz: moved ? undefined : state.location?.tz, bg: true };
  if (moved) state.weather = undefined;
  saveState(); onMove();
  res.json({ ok: true, at: state.at || null });
});
app.get('/followups', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'followups.html')));
app.get('/api/followups', (req, res) => res.json({ items: state.followups.slice().reverse(), reviewLink: state.reviewLink || '', template: state.followupTemplate || '',
  days: FOLLOWUP_DAYS, outboxUrl: `${req.protocol}://${req.get('host')}/api/outbox?token=${state.outboxToken}`, sentBase: `${req.protocol}://${req.get('host')}/api/outbox/`, token: state.outboxToken }));
app.post('/api/followups', async (req, res) => {
  const b = req.body || {};
  try {
    if (b.action === 'settings') { state.reviewLink = String(b.reviewLink || '').trim().slice(0, 300) || undefined; state.followupTemplate = String(b.template || '').trim().slice(0, 500) || undefined; saveState(); }
    else if (b.action === 'draft') { const n = await draftFollowups(); saveState(); return res.json({ drafted: n }); }
    else if (b.action === 'add') await handlers.followup_add({ customer: String(b.customer || '').trim().slice(0, 40), text: b.text });
    else {
      const f = state.followups.find(x => x.id === b.id); if (!f) return res.status(404).json({ error: 'Not found' });
      if (b.text) f.text = String(b.text).slice(0, 600);
      if (b.action === 'approve') { f.status = 'approved'; f.approvedAt = Date.now(); }
      if (b.action === 'skip') f.status = 'skipped';
      if (b.action === 'retry') f.status = 'approved';
      saveState();
    }
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/logs', (_req, res) => res.type('text/plain').send(logs.tail(300)));

// Safe mode: a bare page with no fancy code, so Jarvis can still be reached (and asked to
// fix or roll back) even if the main screen breaks.
app.get('/safe', (_req, res) => res.send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Jarvis · Safe mode</title>
<style>body{margin:0;background:#02060c;color:#cfefff;font:16px system-ui,sans-serif;padding:16px}h1{color:#ffb547;font-size:18px;letter-spacing:.2em}
#log{white-space:pre-wrap;line-height:1.45;margin:12px 0 90px}.u{color:#8fb3c4}.j{color:#8af3ff;margin-bottom:12px}
form{position:fixed;left:0;right:0;bottom:0;display:flex;gap:8px;padding:12px;background:#02060c;border-top:1px solid #3fe0ff55}
input{flex:1;font-size:16px;padding:12px;background:#041422;color:#cfefff;border:1px solid #3fe0ff55}button{padding:0 16px;background:#3fe0ff;color:#001018;border:0;font-weight:700}
a{color:#3fe0ff}</style></head><body><h1>JARVIS · SAFE MODE</h1>
<p>Plain backup screen. Try: "roll back your last change" or "check your logs and fix the main screen". <a href="/">Back to main screen</a></p>
<div id="log"></div><form id="f"><input id="t" placeholder="Type to Jarvis…" autocomplete="off"><button>SEND</button></form>
<script>
f.onsubmit=async e=>{e.preventDefault();const v=t.value.trim();if(!v)return;t.value='';
log.insertAdjacentHTML('beforeend','<div class="u"></div><div class="j">…</div>');const u=log.children[log.children.length-2],j=log.lastChild;u.textContent='You: '+v;
try{const r=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:v})});const d=await r.json();j.textContent='Jarvis: '+(d.reply||d.error)}catch(err){j.textContent='Error: '+err}
scrollTo(0,document.body.scrollHeight)};
</script></body></html>`));

// ---------- model test bench (/bench) ----------
const BENCH_BUDGET = Number(process.env.BENCH_BUDGET_USD || 1);
let bench = { running: false, progress: null, report: null, error: null };
try { bench.report = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'bench-latest.json'), 'utf8')); } catch {}
app.get('/api/bench', (_req, res) => res.json({
  running: bench.running, progress: bench.progress && { done: bench.progress.done, total: bench.progress.total, spent: bench.progress.spent },
  error: bench.error, report: bench.report, text: bench.report ? renderText(bench.report) : '',
  current: BRAIN === 'openrouter' ? talkModel() : `claude ${CHAT_MODEL}`, budget: BENCH_BUDGET
}));
app.post('/api/bench', (req, res) => {
  if (bench.running) return res.status(409).json({ error: 'already running' });
  if (!TALK.apiKey) return res.status(400).json({ error: 'Add OPENROUTER_API_KEY in Railway first.' });
  const blocked = overBudget('chat');
  if (blocked) return res.status(402).json({ error: blocked });
  const left = Math.max(0, MONTHLY_BUDGET - spendMonth().usd);
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.filter(x => typeof x === 'string').slice(0, 12) : undefined;
  bench = { running: true, progress: { done: 0, total: 0, spent: 0 }, report: bench.report, error: null };
  let counted = 0;
  console.log(`model test started (cap $${Math.min(BENCH_BUDGET, left).toFixed(2)})`);
  runBench({ cfg: TALK, persona: readText('persona.md'), ids, budgetUsd: Math.min(BENCH_BUDGET, left),
    onProgress: p => { bench.progress = p; if (p.spent > counted) { addSpend(p.spent - counted, 'tests'); counted = p.spent; } } })
    .then(report => {
      bench.report = report;
      fs.writeFileSync(path.join(DATA_DIR, 'bench-latest.json'), JSON.stringify(report, null, 2));
      console.log(renderText(report));
    })
    .catch(e => { bench.error = String(e.message || e); console.error('model test failed', e); })
    .finally(() => { bench.running = false; });
  res.json({ started: true });
});
app.post('/api/talk-model', (req, res) => {
  const id = String(req.body?.id || '').trim();
  if (!/^[\w.-]+\/[\w.:-]+$/.test(id) && id !== '') return res.status(400).json({ error: 'bad model id' });
  state.talkModel = id || null; saveState();
  console.log(`talk model set to ${talkModel()}`);
  res.json({ model: talkModel() });
});
app.get('/bench', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'bench.html')));

// ElevenLabs text-to-speech proxy (keeps the key on the server)
// Last ElevenLabs result, in plain English, so the screen can say why the real voice isn't playing
let voiceStatus = { ok: null, reason: '', at: null };
function explainVoiceError(status, body) {
  const b = String(body || '');
  if (/unusual_activity|unusual activity/i.test(b)) return 'ElevenLabs blocked its FREE plan from the cloud server. Their paid Starter plan (about $5 a month) fixes it.';
  if (/quota_exceeded|quota/i.test(b)) return 'The ElevenLabs monthly character allowance is used up.';
  if (/voice_not_found|voice.*not.*found/i.test(b)) return 'The ElevenLabs voice ID is wrong or not in your account.';
  if (/paid_plan|subscription|upgrade/i.test(b)) return 'That ElevenLabs voice needs a paid ElevenLabs plan.';
  if (status === 401) return 'The ElevenLabs API key is wrong or was deleted.';
  return `ElevenLabs error ${status}: ${b.slice(0, 160)}`;
}
app.get('/api/voice-status', (_req, res) => res.json({ configured: Boolean(process.env.FISH_API_KEY || process.env.ELEVENLABS_API_KEY), ...voiceStatus }));

// Fish Audio: community "JARVIS" voice model. Used first when FISH_API_KEY is set.
function explainFishError(status, body) {
  const b = String(body || '');
  if (status === 401) return 'The Fish Audio API key is wrong or was deleted.';
  if (status === 402 || /balance|credit|payment/i.test(b)) return 'Fish Audio is out of credit. Add a few dollars at fish.audio.';
  if (status === 404 || /reference|model.*not.*found/i.test(b)) return 'The Fish Audio voice ID (FISH_VOICE_ID) was not found.';
  if (status === 429) return 'Fish Audio is rate limiting requests. Try again in a moment.';
  return `Fish Audio error ${status}: ${b.slice(0, 160)}`;
}
// Fish request with a model fallback: the chosen model (FISH_MODEL, default s1) first, then Fish's free
// model if the first one fails for anything but a bad key. Returns { r } on success or { status, body }.
const FISH_VOICE = () => process.env.FISH_VOICE_ID || 'b841fc010afe43efa1b9fb702832988d'; // community "JARVIS 1"
async function fishFetch(text) {
  const models = [...new Set([process.env.FISH_MODEL || 's1', process.env.FISH_FALLBACK_MODEL || 's2.1-pro-free'])];
  let last = { status: 0, body: '' };
  for (const model of models) {
    try {
      const r = await fetch(process.env.FISH_API_URL || 'https://api.fish.audio/v1/tts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.FISH_API_KEY}`, 'Content-Type': 'application/json', model },
        body: JSON.stringify({ text, reference_id: FISH_VOICE(), format: 'mp3', mp3_bitrate: 128, latency: 'balanced', normalize: true }),
        signal: AbortSignal.timeout(30000)
      });
      if (r.ok) { if (model !== models[0]) console.warn(`Fish ${models[0]} failed (${last.status}); spoke with ${model}`); return { r, model }; }
      last = { status: r.status, body: await r.text() };
      console.error('Fish Audio error', model, r.status, last.body.slice(0, 300));
      if (r.status === 401) break;
    } catch (e) { last = { status: 0, body: 'Could not reach Fish Audio: ' + String(e.message || e).slice(0, 120) }; }
  }
  return last;
}
// Voice clips for the next sentence chunks are made ahead while the current one plays, so long replies have no gap between chunks.
const ttsCache = new Map();
function ttsAhead(text) {
  let e = ttsCache.get(text);
  if (!e) {
    e = { at: Date.now(), p: (async () => { const o = await fishFetch(text); if (!o.r) return { fail: o }; return { buf: Buffer.from(await o.r.arrayBuffer()), model: o.model }; })().catch(err => ({ fail: { body: String(err.message || err) } })) };
    ttsCache.set(text, e);
    for (const [k, v] of ttsCache) if (Date.now() - v.at > 300e3 || ttsCache.size > 40) ttsCache.delete(k);
  }
  return e.p.then(r => { if (r.fail) ttsCache.delete(text); return r; });
}
async function fishTts(text, res, prefetch) {
  if (prefetch) { await ttsAhead(text); return res.status(204).end(); }
  if (ttsCache.has(text)) {
    const r = await ttsAhead(text);
    if (r.buf) { voiceStatus = { ok: true, reason: '', model: r.model, at: new Date().toISOString() }; res.setHeader('Content-Type', 'audio/mpeg'); return res.end(r.buf); }
  }
  const out = await fishFetch(text);
  if (!out.r) {
    voiceStatus = { ok: false, reason: out.status ? explainFishError(out.status, out.body) : out.body, at: new Date().toISOString() };
    return res.status(502).end();
  }
  voiceStatus = { ok: true, reason: '', model: out.model, at: new Date().toISOString() };
  res.setHeader('Content-Type', 'audio/mpeg');
  const reader = out.r.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    res.write(Buffer.from(value));
  }
  res.end();
}

// Jarvis's own voice check: a real 1-word Fish request, so he can say exactly why the voice is off.
handlers.voice_check = async () => {
  if (!process.env.FISH_API_KEY) return 'FISH_API_KEY is missing from Railway Variables, so the phone voice is used. Only the Owner can add it (fish.audio/app/api-keys, then Railway Variables).';
  const out = await fishFetch('Check.');
  if (out.r) { await out.r.arrayBuffer().catch(() => {}); voiceStatus = { ok: true, reason: '', model: out.model, at: new Date().toISOString() }; return `Fish Audio JARVIS voice works (model ${out.model}). If the Owner still hears the phone voice, tell him to fully close and reopen the app.`; }
  const why = out.status ? explainFishError(out.status, out.body) : out.body;
  voiceStatus = { ok: false, reason: why, at: new Date().toISOString() };
  return `The JARVIS voice is failing: ${why} This is an account problem you cannot fix in code; tell the Owner exactly this.`;
};

// Jarvis notification clip for the phone (ntfy custom sound). Made once with the Fish JARVIS voice, then cached.
const ALERT_LINE = () => process.env.ALERT_LINE || `Pardon the interruption, ${process.env.USER_TITLE || 'sir'}. You have a new alert. I'm sure you're busy, but you asked me to alert you to any important news.`;
// The cache file name includes a hash of the line, so changing the wording always makes a fresh clip.
const alertFile = line => path.join(DATA_DIR, `alert-sound-${crypto.createHash('sha1').update(line).digest('hex').slice(0, 8)}.mp3`);
app.get('/api/alert-sound.mp3', async (req, res) => {
  try {
    const line = String(req.query.text || ALERT_LINE()).slice(0, 200);
    const file = alertFile(line);
    if (req.query.remake !== undefined || !fs.existsSync(file)) {
      if (!process.env.FISH_API_KEY) return res.status(503).type('text/plain').send('FISH_API_KEY is not set in Railway.');
      const out = await fishFetch(line);
      if (!out.r) return res.status(502).type('text/plain').send('Could not make the clip: ' + (out.status ? explainFishError(out.status, out.body) : out.body));
      fs.writeFileSync(file, Buffer.from(await out.r.arrayBuffer()));
    }
    res.setHeader('Content-Disposition', 'attachment; filename="jarvis-alert.mp3"');
    res.type('audio/mpeg').sendFile(file);
  } catch (e) { res.status(500).type('text/plain').send(String(e.message || e)); }
});

// Filler lines: an instant acknowledgement when a command lands, and "still working" updates during long jobs.
// Made once with the Fish JARVIS voice, cached on disk, and preloaded by the app so they play with no delay.
const FILLERS = () => {
  const t = process.env.USER_TITLE || 'sir';
  return {
    wake: { generic: [`Yes, ${t}?`] }, // instant answer to "Hey Jarvis" so he knows Jarvis is listening
    ack: {
      generic: [`Right away, ${t}.`, 'Give me just one moment.', 'Okay, let me find out.', 'Give me just a minute.', "I'm working on it right now.",
        'Just one second, please.', `On it, ${t}.`, 'Certainly. One moment.', 'Let me take a look.', `Very good, ${t}. Give me a second.`],
      calendar: ['Let me check your calendar.', `Pulling up your schedule, ${t}.`, 'One moment, checking the calendar.'],
      weather: ['Let me check the forecast.', 'One moment, checking the weather.', `Checking the sky for you, ${t}.`],
      crypto: ['Let me check the markets.', `Scanning the market now, ${t}.`, 'One moment, checking the coins.'],
      lookup: ['Let me look that up.', `Searching for that now, ${t}.`, 'One moment, I will find out.'],
      music: [`Getting the music going, ${t}.`, 'Starting your tunes now.', 'Let me get that playing for you.', `Music coming up, ${t}.`],
      action: [`Certainly, ${t}. Making that change.`, 'On it. Taking care of that now.', 'One moment while I handle that.']
    },
    progress: {
      generic: ["Okay, I've found the data.", 'Got it. Just pulling it together now.', `I have what I need, ${t}. One more moment.`,
        'Found it. Putting it together now.', 'Okay, this is coming together.', 'Good, I have it. Just organizing it.'],
      calendar: ['Okay, I have your appointments. Just organizing them.', 'Got the schedule. One moment.'],
      weather: ['Got the forecast. Just putting it together.', 'I have the weather. One moment.'],
      crypto: ['Okay, I have the numbers. Just reading them.', 'Got the market data. One moment.'],
      lookup: ['Okay, I found something. Reading it now.', 'I have a few results. Picking the best one.'],
      music: ['Connecting the speaker and lining up the music.', 'Almost there, getting the music started.'],
      action: ['Almost done with that.', 'That is going through. One moment.']
    },
    still: {
      generic: ["Still working on it, ${t}.", 'This is taking a little longer than expected. Bear with me.', 'Almost there.',
        "Still digging. Thank you for your patience.", "I'm still on it. Just a bit longer.",
        'Nearly done. One more moment.', 'Bear with me, this one takes a minute.', 'Still gathering everything, one moment.'].map(l => l.replace('${t}', t))
    }
  };
};
app.get('/api/fillers', (req, res) => {
  const f = FILLERS(); const out = {};
  for (const k of Object.keys(f)) { out[k] = {}; for (const g of Object.keys(f[k])) out[k][g] = f[k][g].map((_, i) => `/api/filler/${k}/${g}/${i}.mp3`); }
  res.json(out);
});
app.get('/api/filler/:kind/:group/:n.mp3', async (req, res) => {
  try {
    const line = FILLERS()[req.params.kind]?.[req.params.group]?.[Number(req.params.n)];
    if (!line) return res.status(404).end();
    const file = path.join(DATA_DIR, `filler-${crypto.createHash('sha1').update(line).digest('hex').slice(0, 10)}.mp3`);
    if (!fs.existsSync(file)) {
      if (!process.env.FISH_API_KEY) return res.status(204).end();
      const out = await fishFetch(line);
      if (!out.r) return res.status(502).end();
      fs.writeFileSync(file, Buffer.from(await out.r.arrayBuffer()));
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.type('audio/mpeg').sendFile(file);
  } catch { res.status(500).end(); }
});

// Instant acknowledgement that repeats the gist of what he just said ("Connecting the speaker and getting your tunes going, sir.").
// A tiny, cheap model call plus the JARVIS voice; the page plays it while the real answer is still being worked out.
let ackDay = '', ackCount = 0;
app.post('/api/ack', async (req, res) => {
  try {
    const text = String(req.body?.text || '').replace(/\s+/g, ' ').trim().slice(0, 300);
    if (!text || !process.env.FISH_API_KEY || !TALK.apiKey || overBudget('talk')) return res.status(204).end();
    const day = new Date().toISOString().slice(0, 10);
    if (ackDay !== day) { ackDay = day; ackCount = 0; }
    if (++ackCount > Number(process.env.ACK_DAILY_MAX || 400)) return res.status(204).end();
    const t = process.env.USER_TITLE || 'sir';
    const r = await talk({
      cfg: { ...TALK, model: process.env.ACK_MODEL || talkModel(), reasoning: 'none' },
      system: `You are JARVIS. The Owner has just made a request and you are about to start on it. Say ONE short spoken acknowledgement, 6 to 14 words, that repeats the gist of what he asked in your own words, in a calm British butler tone, ending with "${t}" where it fits. Examples: "Connecting the speaker and getting your tunes going, ${t}." / "Checking tomorrow's forecast for Harrington now." / "Looking up Kicker twelve inch subs for you, ${t}." Rules: do not answer the request, do not state results, do not promise an outcome, do not ask a question, no links, plain words only. If the message is only chit-chat or a thank-you, reply with exactly: NONE`,
      prompt: text, tools: [], webSearch: false, maxTokens: 60, budgetUsd: 0.01, maxRounds: 1,
      run: async () => 'Done.'
    });
    addSpend(r.cost, 'talk');
    const line = String(r.text || '').replace(/["\n]/g, ' ').trim();
    if (r.error || !line || /^none\b/i.test(line) || line.split(/\s+/).length > 22) return res.status(204).end();
    const out = await fishFetch(line);
    if (!out.r) return res.status(502).end();
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Ack-Text', encodeURIComponent(line));
    const ackBuf = Buffer.from(await out.r.arrayBuffer()), ackId = crypto.randomBytes(6).toString('hex');
    ackClips.set(ackId, ackBuf); setTimeout(() => ackClips.delete(ackId), 120000); // the phone app replays it by URL on its own audio route
    res.setHeader('X-Ack-Id', ackId); res.setHeader('Access-Control-Expose-Headers', 'X-Ack-Id, X-Ack-Text');
    res.type('audio/mpeg').send(ackBuf);
  } catch { res.status(500).end(); }
});
const ackClips = new Map();
app.get('/api/ack-clip/:id.mp3', (req, res) => { const b = ackClips.get(req.params.id); if (!b) return res.status(404).end(); res.setHeader('Cache-Control', 'no-store'); res.type('audio/mpeg').send(b); });

app.all('/api/tts', async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  const text = state.silent ? '' : String(req.body?.text || req.query?.text || '').slice(0, 2500);
  if (process.env.FISH_API_KEY && text) return fishTts(text, res, req.query?.prefetch === '1');
  if (!key || !text) return res.status(204).end();
  const voice = process.env.ELEVENLABS_VOICE_ID || 'onwK4e9ZLuTAKqWW03F9'; // "Daniel" – calm, polished British male
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL || 'eleven_flash_v2_5',
        voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.15 }
      })
    });
    if (!r.ok) {
      const body = await r.text();
      voiceStatus = { ok: false, reason: explainVoiceError(r.status, body), at: new Date().toISOString() };
      console.error('ElevenLabs error', r.status, body.slice(0, 300));
      return res.status(502).end();
    }
    voiceStatus = { ok: true, reason: '', at: new Date().toISOString() };
    res.setHeader('Content-Type', 'audio/mpeg');
    const reader = r.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (e) {
    console.error('TTS failed', e);
    voiceStatus = { ok: false, reason: 'Could not reach ElevenLabs: ' + String(e.message || e).slice(0, 120), at: new Date().toISOString() };
    res.status(502).end();
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws', verifyClient: ({ req }) => authed(req) });

wss.on('connection', ws => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: 'silent', on: !!state.silent }));
  if (freshBoot) setTimeout(() => { if (freshBoot) { freshBoot = false; lastBackup = ''; saveState(); } }, 8000);   // no restore came: phone has no backup, start fresh
  if (state.backupStamp) ws.send(JSON.stringify({ type: 'backup', data: { ...backupOf(), stamp: state.backupStamp } }));
  ws.send(JSON.stringify({ type: 'stats', stats: state.stats }));
  ws.send(JSON.stringify({ type: 'panels', panels: state.panels }));
  if (watch.holdings) ws.send(JSON.stringify(holdingsOut()));
  ws.send(JSON.stringify(watchlistMsg()));
  ws.send(JSON.stringify({ type: 'state', state: busy ? 'thinking' : 'idle' }));
  ws.on('close', () => { clients.delete(ws); deviceClients.delete(ws); });
  ws.on('message', async raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'restore' && msg.data && (freshBoot || Number(msg.data.stamp) > (state.backupStamp || 0))) {
      freshBoot = false;
      for (const k of BACKUP_KEYS) if (msg.data[k] !== undefined) state[k] = msg.data[k];
      state.backupStamp = Number(msg.data.stamp); lastBackup = JSON.stringify(backupOf());
      try { fs.writeFileSync(STATS_FILE, JSON.stringify(state, null, 2)); } catch {}
      console.log('  restored memory from the phone backup'); ensureSeedPlaces(); broadcast(watchlistMsg(true));
    }
    if (msg.type === 'hello' && msg.device) deviceClients.add(ws);
    if (msg.type === 'device_result' && devWait.has(msg.id)) { const f = devWait.get(msg.id); devWait.delete(msg.id); f({ ok: !!msg.ok, detail: String(msg.detail || '') }); }
    if (msg.type === 'ask' && msg.text?.trim() && !silentAnswer(msg.text.trim()) && !(await panelAnswer(msg.text.trim())) && !(await shopAnswer(msg.text.trim())) && !(await bucketAnswer(msg.text.trim()))) ask(msg.text.trim());
    if (msg.type === 'location' && Number.isFinite(msg.lat) && Number.isFinite(msg.lon)) {
      const moved = !state.location || Math.abs(state.location.lat - msg.lat) > .5 || Math.abs(state.location.lon - msg.lon) > .5;
      state.location = { lat: +msg.lat.toFixed(3), lon: +msg.lon.toFixed(3), at: new Date().toISOString(), tz: moved ? undefined : state.location?.tz };
      if (moved) state.weather = undefined; // new place: report its weather fresh
      saveState(); onMove();
    }
    if (msg.type === 'mic_muted') { const r = 'Microphone muted.'; remember('jarvis', r); broadcast({ type: 'say', text: r, speak: true }); }
    if (msg.type === 'wake') briefing('wake', msg.memo);
    if (msg.type === 'interrupt' && current) { try { await current.interrupt(); } catch {} }
    if (msg.type === 'new_session') {
      state.sessionId = null; state.workSessionId = null; state.history = []; saveState();
      broadcast({ type: 'log', role: 'system', text: 'New conversation started.' });
    }
    if (msg.type === 'state') broadcast({ type: 'state', state: msg.state }); // listening/speaking echoed to all screens
    if (msg.type === 'client_error') console.warn('screen:', String(msg.text || '').slice(0, 1000));
  });
});

// ---------- music: Spotify + the phone (Android app) ----------
// Device actions go to the Android app over the websocket (open Spotify, connect the Bluetooth speaker through Tasker)
// and the app reports back, so Jarvis only says "connected" when it really is.
const deviceClients = new Set(); const devWait = new Map();
function deviceAction(action, args = {}, timeout = 20000) {
  if (!deviceClients.size) return Promise.resolve({ ok: false, detail: 'The Jarvis Android app is not open on the phone, so I cannot reach the phone itself.' });
  const id = Math.random().toString(36).slice(2, 9);
  return new Promise(res => {
    const t = setTimeout(() => { devWait.delete(id); res({ ok: false, detail: 'The phone did not answer in time.' }); }, timeout);
    devWait.set(id, r => { clearTimeout(t); res(r); });
    for (const c of deviceClients) if (c.readyState === 1) c.send(JSON.stringify({ type: 'device', id, action, ...args }));
  });
}
// ---------- vehicles: Bluetooth OBD dongles read by the phone when it is near (A17) ----------
// state.vehicles [{name, dongle (paired BT name or address), last:{...scan}, lastTry, alerts:{key: time}}]. While the Jarvis app is
// open (foreground or background), it tries each vehicle every OBD_EVERY_MIN minutes; out of range just fails quietly.
// After each good scan: new trouble codes, a low resting battery (R8 sitting) and low fuel become one short remark.
state.vehicles ||= [];
const OBD_EVERY = Number(process.env.OBD_EVERY_MIN || 20) * 60e3;
const vFind = name => state.vehicles.find(v => norm(v.name) === norm(name)) || (state.vehicles.length === 1 && !name ? state.vehicles[0] : null)
  || state.vehicles.find(v => norm(v.name).includes(norm(name || '#')) || norm(name || '#').includes(norm(v.name)));
async function obdScan(v, why = 'auto') {
  v.lastTry = Date.now(); saveState();
  const r = await deviceAction('obd_scan', { dongle: v.dongle }, 45000);
  let d = {}; try { d = JSON.parse(r.detail); } catch { d = { ok: false, detail: r.detail }; }
  if (!d.ok) { if (why !== 'auto') console.log(`obd ${v.name}: ${d.detail || d.code}`); return { ok: false, why: d.detail || d.code || 'no answer' }; }
  const prev = v.last || {}; d.at = new Date().toISOString(); v.last = d; v.alerts ||= {};
  const now = Date.now(), lines = [], once = (k, h) => { if (v.alerts[k] && now - v.alerts[k] < h * 3600e3) return false; v.alerts[k] = now; return true; };
  const fresh = (d.dtcs || []).filter(c => !(prev.dtcs || []).includes(c));
  if (fresh.length) lines.push(`Heads up, sir: the ${v.name} has ${fresh.length > 1 ? 'new trouble codes' : 'a new trouble code'}, ${listJoin(fresh)}${d.mil ? ', and the check engine light is on' : ''}. Ask me what ${fresh.length > 1 ? 'they mean' : 'it means'}.`);
  else if (d.mil && !prev.mil) lines.push(`The ${v.name}'s check engine light has come on, sir.`);
  const off = !d.rpm;
  // Battery trend: resting readings only (engine off and not run for 2 h, so no surface charge from driving)
  if (!off) v.lastRun = now;
  if (off && d.volts && (!v.lastRun || now - v.lastRun > 2 * 3600e3)) {
    v.volts = [...(v.volts || []).filter(x => now - x.t < 14 * 86400e3), { t: now, v: d.volts }].slice(-200);
    const drop = voltDropPerDay(v.volts);
    if (drop != null && drop >= Number(process.env.OBD_DRAIN_V_DAY || 0.08) && once('drain', 72))
      lines.push(`The ${v.name} is losing about ${drop.toFixed(2)} volts a day while it sits, sir. Something is drawing power; worth a parasitic draw test.`);
  }
  const freshPending = (d.pending || []).filter(c => !(prev.pending || []).includes(c) && !(d.dtcs || []).includes(c));
  if (freshPending.length) lines.push(`Early warning on the ${v.name}: ${listJoin(freshPending)} ${freshPending.length > 1 ? 'are' : 'is'} pending. The light isn't on yet.`);
  if (off && d.volts && d.volts < Number(process.env.OBD_LOW_VOLTS || 12.2) && once('volts', 24)) lines.push(`The ${v.name}'s battery is resting at ${d.volts.toFixed(1)} volts, sir. Might be worth putting the tender on it.`);
  if (d.fuelPct != null && d.fuelPct <= 15 && once('fuel', 12)) lines.push(`The ${v.name} is down to about ${d.fuelPct} percent fuel.`);
  saveState();
  if (lines.length && why === 'auto') deliver(lines.join(' '), v.name);
  return { ok: true, data: d, news: lines };
}
if (!process.env.JARVIS_SMOKE) setInterval(async () => {
  if (!deviceClients.size || busy) return;
  for (const v of state.vehicles) if (!v.lastTry || Date.now() - v.lastTry > OBD_EVERY) { try { await obdScan(v); } catch (e) { console.warn('obd', e.message); } }
}, 5 * 60_000);
// Least-squares slope of resting voltage over at least 2 days of readings, as volts lost per day (positive = draining).
function voltDropPerDay(pts) {
  if (!pts || pts.length < 3 || pts[pts.length - 1].t - pts[0].t < 2 * 86400e3) return null;
  const xs = pts.map(p => p.t / 86400e3), ys = pts.map(p => p.v), n = pts.length;
  const mx = xs.reduce((a, b) => a + b) / n, my = ys.reduce((a, b) => a + b) / n;
  const num = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0), den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  return den ? -num / den : null;
}
const vSummary = v => { const d = v.last; if (!d) return `${v.name}: never read yet (dongle "${v.dongle}").`;
  return `${v.name} (read ${d.at.slice(0, 16).replace('T', ' ')} UTC): battery ${d.volts ?? '?'} V${d.rpm ? ` (engine running, ${d.rpm} rpm)` : ' (engine off)'}, check engine light ${d.mil ? 'ON' : 'off'}, codes: ${(d.dtcs || []).join(', ') || 'none'}${d.fuelPct != null ? `, fuel ${d.fuelPct}%` : ''}${d.coolantC != null ? `, coolant ${d.coolantC} C` : ''}${d.kmSinceClear != null ? `, ${Math.round(d.kmSinceClear * 0.621)} miles since codes were last cleared` : ''}${d.vin ? `, VIN ${d.vin}` : ''}.`
  + ((d.pending || []).length ? ` Pending codes (light not on yet): ${d.pending.join(', ')}.` : '')
  + (d.readiness?.ready ? ` Emissions monitors not ready: ${(d.readiness.notReady || []).join(', ') || 'none'} (ready: ${d.readiness.ready.join(', ') || 'none'}). Inspection: ${d.mil ? 'would FAIL, check engine light is on' : (d.readiness.notReady || []).length <= 1 ? 'should pass on monitors (most states allow one not-ready)' : 'likely rejected until more monitors finish; drive a mixed highway/town cycle'}.` : '')
  + (d.trims ? ` Fuel trims (%; + = adding fuel/lean, - = rich): ${Object.entries(d.trims).map(([k, x]) => `${k} ${x}`).join(', ')}.` : '')
  + (d.freezeFrame ? ` Freeze frame for ${d.freezeFrame.code}: ${Object.entries(d.freezeFrame).filter(([k]) => k !== 'code').map(([k, x]) => `${k} ${x}`).join(', ')}.` : '')
  + (voltDropPerDay(v.volts) != null ? ` Resting battery trend: ${(-voltDropPerDay(v.volts)).toFixed(2)} V/day over ${Math.round((v.volts[v.volts.length - 1].t - v.volts[0].t) / 86400e3)} days.` : ''); };
Object.assign(handlers, {
  vehicle_add: async ({ name, dongle }) => {
    state.vehicles = state.vehicles.filter(v => norm(v.name) !== norm(name));
    state.vehicles.push({ name, dongle }); saveState();
    return `Saved the ${name} with OBD dongle "${dongle}". The phone will read it whenever it is in range (every ${OBD_EVERY / 60e3} min while the app runs). Ask "scan the ${name}" to try now.`;
  },
  vehicle_remove: async ({ name }) => { const n = state.vehicles.length; state.vehicles = state.vehicles.filter(v => norm(v.name) !== norm(name)); saveState(); return n === state.vehicles.length ? 'No vehicle by that name.' : 'Removed.'; },
  vehicle_scan: async ({ name }) => {
    const v = vFind(name); if (!v) return state.vehicles.length ? `Which one? ${state.vehicles.map(x => x.name).join(', ')}.` : 'No vehicles set up yet. Pair the OBD dongle with the phone, then use vehicle_add (bluetooth_paired lists the paired names).';
    const r = await obdScan(v, 'asked');
    return r.ok ? vSummary(v) + (r.news.length ? ' New: ' + r.news.join(' ') : '') + ' Explain any trouble codes in plain words (likely causes, how urgent).' : `Could not read the ${v.name}: ${r.why}`;
  },
  vehicle_status: async ({ name }) => { const vs = name ? [vFind(name)].filter(Boolean) : state.vehicles; return vs.length ? vs.map(vSummary).join('\n') : 'No vehicles set up yet.'; },
  vehicle_clear_codes: async ({ name }) => {
    const v = vFind(name); if (!v) return 'Which vehicle?';
    const r = await deviceAction('obd_clear', { dongle: v.dongle }, 30000);
    let d = {}; try { d = JSON.parse(r.detail); } catch {}
    if (d.cleared) { if (v.last) { v.last.dtcs = []; v.last.mil = false; } saveState(); return `Codes cleared on the ${v.name}. The check engine light should go out (it comes back if the fault is still there).`; }
    return `Could not clear codes on the ${v.name}: ${d.detail || 'the car did not confirm'}. The engine usually needs to be off with the key on.`;
  }
});
const spoRef = () => state.spotifyRefresh || process.env.SPOTIFY_REFRESH_TOKEN || '';
const spoFail = e => String(e.message || e) === 'NO_DEVICE'
  ? 'Spotify has no player to use. Spotify must be open on the phone.'
  : 'Spotify problem: ' + String(e.message || e);
async function spotifyReady() {
  const r = spoRef(); const dev = await spo.pickDevice(r, 0);
  if (dev) return dev;
  const opened = await deviceAction('open_app', { package: 'com.spotify.music' }, 8000);
  const d2 = await spo.pickDevice(r, 15000);
  if (!d2) throw new Error(opened.ok ? 'NO_DEVICE' : opened.detail);
  return d2;
}
// Bluetooth speakers he has taught Jarvis: { name (exact Bluetooth name), alias, area, volume }.
state.speakers ||= [];
const DEFAULT_VOLUME = Number(process.env.DEFAULT_VOLUME || 65);
for (const x of state.speakers) if (x.volume === 30 || x.volume === 45) delete x.volume;   // the old default was saved onto speakers; let them follow the new one
const norm = x => String(x || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
function pickSpeaker(hint) {
  const sp = state.speakers;
  if (!sp.length) return { name: process.env.BT_SPEAKER_NAME || 'Rockville', volume: DEFAULT_VOLUME };   // nothing taught yet: old default
  const h = norm(hint);
  if (h) { const m = sp.find(x => [x.alias, x.area, x.name].some(v => norm(v) && (norm(v).includes(h) || h.includes(norm(v))))); if (m) return m; }
  const here = currentPlace(); // at a saved place whose name matches a speaker's area
  if (here) { const m = sp.find(x => norm(x.area) && (norm(here.name).includes(norm(x.area)) || norm(x.area).includes(norm(here.name)))); if (m) return m; }
  if (sp.length === 1) return sp[0];
  return null;
}
async function connectSpeaker(hint) {
  const sp = pickSpeaker(hint);
  if (!sp) return { ok: false, text: `I know these speakers: ${state.speakers.map(x => x.alias + (x.area ? ' (' + x.area + ')' : '')).join(', ')}. Which one?` };
  const c = await deviceAction('bt_connect', { name: sp.name, task: process.env.TASKER_BT_TASK || 'JarvisBT' }, 25000);
  broadcast({ type: 'activity', text: `Speaker ${c.ok ? 'ok' : 'FAILED'}: ${c.detail}`.slice(0, 600) });
  if (!c.ok) return { ok: false, text: `Could not confirm the ${sp.alias || sp.name}: ${c.detail}` };
  const vol = sp.volume ?? DEFAULT_VOLUME;
  await deviceAction('set_volume', { percent: vol }, 6000);
  return { ok: true, text: `SUCCESS: the ${sp.alias || sp.name} speaker is connected (${c.detail}), volume ${vol}%. Tell the Owner it is connected.`, sp };
}
handlers.bluetooth_paired = async () => { const r = await deviceAction('bt_paired', {}, 10000); return r.ok ? 'Paired devices on the phone: ' + r.detail : 'Phone problem: ' + r.detail; };
handlers.speaker_save = async ({ name, alias, area, volume }) => {
  const key = norm(name);
  state.speakers = state.speakers.filter(x => norm(x.name) !== key);
  state.speakers.push({ name, alias: alias || name, area: area || '', volume: volume ?? undefined });
  saveState();
  return `Saved "${alias || name}"${area ? ' for the ' + area : ''}. I will connect it when asked${area ? ' or when he is at ' + area : ''}, at ${volume ?? DEFAULT_VOLUME}% volume.`;
};
handlers.speaker_list = async () => state.speakers.length ? state.speakers.map(x => `${x.alias} = Bluetooth "${x.name}"${x.area ? ', area ' + x.area : ''}, volume ${x.volume ?? DEFAULT_VOLUME}%`).join('\n') : 'No speakers taught yet (default: Rockville).';
handlers.speaker_remove = async ({ alias }) => { const n = state.speakers.length; state.speakers = state.speakers.filter(x => norm(x.alias) !== norm(alias) && norm(x.name) !== norm(alias)); saveState(); return n === state.speakers.length ? 'No such speaker.' : 'Removed.'; };
handlers.bluetooth_disconnect = async ({ device, leave_bluetooth_on } = {}) => {
  const sp = pickSpeaker(device) || state.speakers[0] || { name: process.env.BT_SPEAKER_NAME || 'Rockville' };
  await deviceAction('media_key', { key: 'pause' }, 4000);
  await new Promise(r => setTimeout(r, 400)); await deviceAction('media_key', { key: 'stop' }, 4000).catch(() => {});
  // Spotify keeps a foreground service while playing; once paused it drops it within a few seconds and can then be closed.
  await new Promise(r => setTimeout(r, 4500)); await deviceAction('close_app', { pkg: process.env.MUSIC_APP_PACKAGE || 'com.spotify.music' }, 4000).catch(() => {});   // stop the music first so it does not jump to the phone speaker
  const off = process.env.BT_TURN_OFF === '1' && !leave_bluetooth_on;  // Android blocks Tasker from switching Bluetooth off; disconnect only by default
  const task = off ? (process.env.TASKER_BT_OFF_TASK || 'JarvisBTOff') : (process.env.TASKER_BT_DISCONNECT_TASK || 'JarvisBTOff');
  const c = await deviceAction('bt_disconnect', { name: sp.name, task, off }, 25000);
  // If anything is still playing (on the phone speaker now that the link dropped), keep stopping and closing it, up to 3 times.
  let still = 'unknown';
  for (let n = 0; n < 3; n++) {
    await new Promise(r => setTimeout(r, 1200));
    const m = await deviceAction('music_active', {}, 3000).catch(() => ({ ok: false, detail: 'unknown' }));
    still = m.ok ? m.detail : 'unknown';
    if (still !== 'playing') break;
    await deviceAction('media_key', { key: 'pause' }, 3000).catch(() => {});
    await deviceAction('media_key', { key: 'stop' }, 3000).catch(() => {});
    await new Promise(r => setTimeout(r, 3500));
    await deviceAction('close_app', { pkg: process.env.MUSIC_APP_PACKAGE || 'com.spotify.music' }, 4000).catch(() => {});
  }
  broadcast({ type: 'activity', text: `Music after disconnect: ${still}` });
  broadcast({ type: 'activity', text: `Bluetooth ${c.ok ? 'ok' : 'FAILED'}: ${c.detail}`.slice(0, 600) });
  return c.ok ? `SUCCESS: ${sp.alias || sp.name} disconnected${off ? ' and Bluetooth turned off' : ''}. ${still === 'playing' ? 'BUT music is STILL playing on the phone after 3 tries: say so plainly.' : 'The music is stopped and Spotify closed. Tell the Owner.'}` : `Could not finish: ${c.detail}`;
};
// ---------- LED strip (A20): BanlanX/SPLED SP63xE over BLE, packets built here, phone writes them ----------
const LED_COLORS = { red: '255,0,0', green: '0,255,0', blue: '0,0,255', white: '255,255,255', 'warm white': '255,170,70', yellow: '255,200,0', orange: '255,90,0', purple: '150,0,255', violet: '150,0,255', pink: '255,40,140', magenta: '255,0,255', cyan: '0,255,255', teal: '0,200,160', aqua: '0,255,200', lime: '120,255,0', gold: '255,160,0', 'ice blue': '120,180,255', indigo: '60,0,255' };
const LED_FX = (() => { try { return JSON.parse(fs.readFileSync(path.join(CONFIG_DIR, 'ledfx.json'), 'utf8')); } catch { return { spi_dyn: {}, spi_snd: {}, pwm_dyn: {}, pwm_snd: {} }; } })();
const LED_ORDERS = ['RGB', 'RBG', 'GRB', 'GBR', 'BRG', 'BGR'];
const LED_PWM_TYPES = new Set([0x81, 0x83, 0x85, 0x87, 0x8A]); // PWM light types (SP630E); the rest are SPI pixel strips
const ledPkt = (cmd, ...d) => Buffer.from([0x53, cmd, 0, 1, 0, d.length, ...d]).toString('hex');
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(v))));
// Send packets and read the controller's own state back (new APK). Old APKs only say "sent": then st is null.
async function ledSend(packets, verify = true) {
  const r = await deviceAction('led', { packets, verify }, 30000);
  let st = null; try { const j = JSON.parse(r.detail); if (j && typeof j === 'object' && 'm' in j) st = j; } catch {}
  if (st) state.ledLast = { ...st, at: Date.now() };
  return { ok: r.ok, detail: r.detail, st };
}
const ledDescribe = st => {
  if (!st) return 'no state reported';
  const modes = { 1: 'static color', 2: 'static white', 3: 'effect', 4: 'white effect', 5: 'sound reactive', 6: 'sound white', 7: 'custom' };
  const order = LED_ORDERS[st.o] || `#${st.o}`;
  return `power ${st.p ? 'on' : 'off'}, mode ${modes[st.m] || st.m}, effect #${st.e}, color ${st.rgb || '?'}, level ${st.lv}, speed ${st.sp}, light type 0x${Number(st.t).toString(16)}, chip order ${order}`;
};
const ledTables = st => {
  const pwm = !!(st && LED_PWM_TYPES.has(st.t));
  return pwm ? { dyn: LED_FX.pwm_dyn, snd: LED_FX.pwm_snd, pwm: true } : { dyn: LED_FX.spi_dyn, snd: LED_FX.spi_snd, pwm: false };
};
const LED_ALIASES = { party: ['rainbow jump', 'seven color strobe'], disco: ['rainbow jump', 'seven color jump'], strobe: ['seven color strobe', 'rainbow stars'], flash: ['seven color strobe', 'rainbow stars'], rainbow: ['rainbow', 'seven color jump'], fire: ['red/yellow fire', 'seven color breath'], gradient: ['rainbow wave', 'seven color gradient'], fade: ['rainbow wave', 'seven color gradient'], breathe: ['breath', 'seven color breath'], pulse: ['breath', 'seven color breath'], heartbeat: ['rainbow stars', 'seven color heartbeat'], comet: ['rainbow comet', 'seven color jump'], twinkle: ['rainbow stars', 'seven color jump'], stars: ['rainbow stars', 'seven color jump'] };
function ledFindEffect(name, tbl, pwm) {
  const q = norm(name).replace(/[^a-z0-9/ ]/g, ' ').trim(); const ents = Object.entries(tbl).map(([k, v]) => [Number(k), v, norm(v)]);
  if (/^#?\d+$/.test(q)) { const n = Number(q.replace('#', '')); const e = ents.find(x => x[0] === n); if (e) return e; }
  let e = ents.find(x => x[2] === q); if (e) return e;
  const al = LED_ALIASES[q]; if (al) { const w = al[pwm ? 1 : 0]; e = ents.find(x => x[2] === w); if (e) return e; }
  e = ents.find(x => x[2].includes(q)); if (e) return e;
  const words = q.split(/\s+/).filter(Boolean); e = ents.find(x => words.every(w => x[2].includes(w)));
  return e || null;
}
handlers.led_color = async ({ color, brightness, power, effect, speed, music }) => {
  if (power === 'off' && !color && !effect && !music) {
    let r = await ledSend([ledPkt(0x50, 0)]);
    if (r.st && r.st.p) r = await ledSend([ledPkt(0x50, 0)]);
    broadcast({ type: 'activity', text: `LED off: ${r.ok ? ledDescribe(r.st) : r.detail}`.slice(0, 300) });
    if (!r.ok) return `LED failed: ${r.detail}`;
    return r.st && r.st.p ? 'FAILED: the controller says it is still on after 2 tries. Say so plainly.' : `SUCCESS: LED off${r.st ? ' (controller confirmed).' : ' (sent; this app version cannot confirm).'}`;
  }
  const lvl = brightness != null ? clamp(brightness * 2.55, 1, 255) : null;
  const pk = [ledPkt(0x50, 1)]; let want = null, label = '', note = '';
  if (music || effect) {
    // current tables: ask the controller first, since SPI and PWM strips have different effect lists
    const cur = await ledSend([]).catch(() => ({ st: null }));
    const T = ledTables(cur.st);
    if (music) {
      const hit = Object.entries(T.snd); const pick = T.pwm ? hit.find(([, v]) => /jump/i.test(v)) : hit.find(([, v]) => /party/i.test(v));
      const e = (effect && ledFindEffect(effect, T.snd, T.pwm)) || (pick ? [Number(pick[0]), pick[1]] : null);
      if (!e) return 'No sound effect table available.';
      pk.push(ledPkt(0x53, 5, e[0])); label = `sound mode "${e[1]}" (uses the controller's own microphone, not the phone)`; want = { m: 5, e: e[0] };
    } else {
      const e = ledFindEffect(effect, T.dyn, T.pwm);
      if (!e) return `No effect called "${effect}". Try rainbow, party, fire, comet, stars, breath, gradient or an effect number; there are ${Object.keys(T.dyn).length}.`;
      pk.push(ledPkt(0x53, 3, e[0])); label = `effect "${e[1]}"`; want = { m: 3, e: e[0] };
      if (/^(strobe|flash|party)$/.test(norm(effect)) && !T.pwm) note = ' Note for the Owner: this strip type has no true strobe; I used the closest party effect.';
    }
    if (speed != null) pk.push(ledPkt(0x54, clamp(speed, 1, 10)));
  } else if (color) {
    const c = norm(color); let rgb = LED_COLORS[c] || LED_COLORS[Object.keys(LED_COLORS).find(k => c.includes(k)) || ''];
    const hx = String(color).match(/#?([0-9a-f]{6})\b/i);
    if (!rgb && hx) rgb = [0, 2, 4].map(i => parseInt(hx[1].slice(i, i + 2), 16)).join(',');
    if (!rgb) return `Unknown color "${color}". Ask for a common color name or hex.`;
    const [r, g, b] = rgb.split(',').map(Number);
    pk.push(ledPkt(0x53, 1, 1), ledPkt(0x52, r, g, b, lvl ?? 255)); label = `${color}`; want = { m: 1, rgb: `${r},${g},${b}` };
  } else if (lvl != null) { label = `brightness ${brightness}%`; }
  if (lvl != null && (effect || music)) pk.push(ledPkt(0x51, 0, lvl));
  if (lvl != null && !effect && !music && !color) pk.push(ledPkt(0x51, 0, lvl));
  if (speed != null && !effect && !music) pk.push(ledPkt(0x54, clamp(speed, 1, 10)));
  const ok = st => st && st.p && (!want || ((want.m == null || st.m === want.m) && (want.e == null || st.e === want.e) && (!want.rgb || (st.rgb && st.rgb.split(',').every((v, i) => Math.abs(Number(v) - Number(want.rgb.split(',')[i])) <= 12)))));
  let r = await ledSend(pk);
  for (let i = 0; i < 2 && r.ok && r.st && !ok(r.st); i++) r = await ledSend(pk);
  broadcast({ type: 'activity', text: `LED ${label || 'update'}: ${r.ok ? ledDescribe(r.st) : r.detail}`.slice(0, 300) });
  if (!r.ok) return `LED failed: ${r.detail}`;
  if (!r.st) return `SUCCESS (unconfirmed): sent ${label || 'the change'} to the controller; this app version cannot read back. Tell the Owner to reinstall the latest app for confirmed control.${note}`;
  if (!ok(r.st)) return `FAILED: after 3 tries the controller reports: ${ledDescribe(r.st)}. It did not accept the change. Say that plainly. Possible causes: a nearby RF remote overriding, the SP63XE phone app still connected, or wrong light type. Offer to run the LED test.`;
  return `SUCCESS (controller confirmed): ${label || 'updated'}; ${ledDescribe(r.st)}. If the Owner sees a different color than that, the chip order is wrong: offer the LED test.${note}`;
};
handlers.led_status = async () => {
  const r = await ledSend([]);
  if (!r.ok) return `LED unreachable: ${r.detail}`;
  return r.st ? `LED controller reports: ${ledDescribe(r.st)}. Level is 0-255, speed 1-10.` : `Reached the controller but this app version cannot read its state (${r.detail}). Reinstall the latest app.`;
};
handlers.led_test = async () => {
  const seq = [['red', '255,0,0'], ['green', '0,255,0'], ['blue', '0,0,255']]; const out = [];
  for (const [n, rgb] of seq) {
    const [r, g, b] = rgb.split(',').map(Number);
    const x = await ledSend([ledPkt(0x50, 1), ledPkt(0x53, 1, 1), ledPkt(0x52, r, g, b, 255)]);
    if (!x.ok) return `LED test stopped at ${n}: ${x.detail}`;
    out.push(`${n}: controller says ${x.st ? x.st.rgb : 'unconfirmed'}`);
    await new Promise(res => setTimeout(res, 3500));
  }
  return `Test done (sent pure red, green, blue, 3 s each; ${out.join('; ')}). Now ask the Owner what colors he actually SAW in order. If they differ from red, green, blue, call led_setup with seen_red, seen_green, seen_blue. If they match, the order is fine and any earlier red was likely a remote or other app overriding.`;
};
handlers.led_setup = async ({ seen_red, seen_green, seen_blue, chip_order, light_type }) => {
  const cur = await ledSend([]);
  if (!cur.st) return 'Cannot read the controller, so I will not change its setup. Reinstall the latest app first.';
  let order = null;
  if (chip_order) order = LED_ORDERS.indexOf(String(chip_order).toUpperCase());
  else if (seen_red && seen_green && seen_blue) {
    const L = s => ({ red: 'R', green: 'G', blue: 'B' }[norm(s)] || String(s).toUpperCase()[0]);
    const seen = { R: L(seen_red), G: L(seen_green), B: L(seen_blue) }; const c = LED_ORDERS[cur.st.o];
    if (!c || ![seen.R, seen.G, seen.B].every(x => 'RGB'.includes(x)) || new Set(Object.values(seen)).size !== 3) return 'Those colors do not make a valid set. Ask the Owner again.';
    const n = [...c].map(ch => seen[ch]).join(''); order = LED_ORDERS.indexOf(n);
  }
  const pk = [];
  if (light_type != null) pk.push(ledPkt(0x50, 0), ledPkt(0x6A, 1, Number(light_type) & 0x7F));
  if (order != null && order >= 0) pk.push(ledPkt(0x6B, order));
  if (!pk.length) return 'Nothing to change: give seen colors, a chip_order, or a light_type.';
  pk.push(ledPkt(0x50, 1), ledPkt(0x53, 1, 1), ledPkt(0x52, 255, 0, 0, 255));
  const r = await ledSend(pk);
  broadcast({ type: 'activity', text: `LED setup: ${r.ok ? ledDescribe(r.st) : r.detail}`.slice(0, 300) });
  return r.ok ? `Setup written; now showing red. ${r.st ? 'Controller: ' + ledDescribe(r.st) + '. ' : ''}Ask the Owner if it is truly red; if not, run led_test again.` : `LED setup failed: ${r.detail}`;
};
// ---------- Awake: "I'm awake" dismisses every pending alarm on the phone ----------
handlers.alarms_off = async () => {
  const r = await deviceAction('alarms_off', { task: process.env.TASKER_ALARM_TASK || '' }, 10000).catch(e => ({ ok: false, detail: String((e && e.message) || e) }));
  return r.ok ? 'SUCCESS: the rest of the alarms are dismissed for today. Confirm briefly.' : `Could not clear the alarms: ${r.detail}. Say so plainly.`;
};
// ---------- Maintenance mode (A22): voice request -> Claude Code routine on the Owner's plan -> pushes to GitHub -> Railway redeploys ----------
const MAINT_ID = process.env.MAINT_ROUTINE_ID || 'trig_017yUMN1pQPd3PtArSRC2bzh';
const GH_REPO = () => process.env.GITHUB_REPO || 'Elliot-H/Jarvis-2.0';
handlers.maintenance_request = async ({ request }) => {
  const tok = process.env.MAINT_ROUTINE_TOKEN;
  if (!tok) return 'Maintenance mode is not connected yet: MAINT_ROUTINE_TOKEN is missing in Railway. Tell the Owner plainly. (use_workshop is the old path and needs Anthropic credit.)';
  if (!String(request || '').trim()) return 'No request given. Ask the Owner what to change.';
  try {
    const r = await fetch(`https://api.anthropic.com/v1/claude_code/routines/${MAINT_ID}/fire`, {
      method: 'POST', signal: AbortSignal.timeout(20000),
      headers: { Authorization: `Bearer ${tok}`, 'anthropic-beta': 'experimental-cc-routine-2026-04-01', 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `Owner's maintenance request (sent ${new Date().toISOString()}):\n${String(request).slice(0, 4000)}` })
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return `The maintenance engineer could not be started (HTTP ${r.status}${j?.error?.message ? ': ' + j.error.message : ''}). Tell the Owner.`;
    state.maintLast = { at: Date.now(), request: String(request).slice(0, 300), session: j.claude_code_session_url || '' }; saveState();
    broadcast({ type: 'activity', text: `Maintenance request sent: ${String(request).slice(0, 120)}${j.claude_code_session_url ? ' · ' + j.claude_code_session_url : ''}` });
    return 'SENT: a Claude Code engineer session has started on it. It usually takes a few minutes. Tell the Owner it is sent and to ask "maintenance status" in a few minutes.';
  } catch (e) { return `Could not reach the maintenance engineer: ${e.message}`; }
};
handlers.maintenance_status = async () => {
  try {
    const h = { Accept: 'application/vnd.github.raw+json', 'User-Agent': 'jarvis' };
    if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const r = await fetch(`https://api.github.com/repos/${GH_REPO()}/contents/maintenance/last.md`, { headers: h, signal: AbortSignal.timeout(10000) });
    if (r.status === 404) return state.maintLast ? 'No report yet. The engineer is probably still working. Ask again in a couple of minutes.' : 'No maintenance request has been sent yet.';
    if (!r.ok) return `Could not read the report (HTTP ${r.status}).`;
    const txt = await r.text();
    const t = (txt.match(/^TIME:\s*(.+)$/m) || [])[1];
    const stale = state.maintLast && t && Date.parse(t) < state.maintLast.at - 60000;
    return stale ? 'The engineer has not reported on the latest request yet. It is still working or it failed to start. Ask again shortly.' : txt.slice(0, 1500);
  } catch (e) { return `Could not read the report: ${e.message}`; }
};
// ---------- God Mode (A21): scan the room, pair a new speaker, connect it, play ----------
handlers.god_mode = async ({ speaker_name, area, song } = {}) => {
  const say = t => broadcast({ type: 'activity', text: 'God Mode: ' + t });
  say('scanning for speakers');
  const sc = await deviceAction('bt_scan', { seconds: 14 }, 30000);
  if (!sc.ok) return `God Mode scan failed: ${sc.detail}`;
  let list = []; try { list = JSON.parse(sc.detail); } catch {}
  const h = norm(speaker_name);
  const named = list.filter(d => d.name);
  const looksAV = d => d.speaker || /tv|vizio|soundbar|sound bar|speaker|bar\b|roku|samsung|lg\b|sony|jbl|bose|sonos|rockville|\bv\d\d\b/i.test(d.name);
  for (const d of named) if (!d.speaker && looksAV(d) && /tv|samsung|lg\b|sony|roku|vizio/i.test(d.name) && !/soundbar|sound bar/i.test(d.name)) d.tv = true;
  // Named: just that one. Otherwise every real speaker/soundbar/headphone in range (TVs included; other gear is left alone).
  const pick = (h ? named.filter(d => norm(d.name).includes(h) || h.includes(norm(d.name))) : named.filter(looksAV)).sort((a, b) => b.rssi - a.rssi);
  const seen = list.slice(0, 20).map(d => `${d.name || d.mac}${d.speaker ? '' : ' (not a speaker, class ' + d.cod + ')'} ${d.rssi}dBm`).join('; ') || 'nothing';
  say('saw: ' + seen);
  if (!pick.length) return `No ${speaker_name || 'speaker'} found in range. Bluetooth reaches about 30 feet, and a speaker only shows up while in pairing mode. Saw: ${seen}. Do not start music; tell the Owner exactly this.`;
  if (!state.speakers.length) state.speakers.push({ name: process.env.BT_SPEAKER_NAME || 'Rockville', alias: 'Rockville', area: '' });
  const ok = [], skipped = [];
  for (const d of pick) {
    if (!d.bonded) {
      say(d.tv ? `pairing ${d.name}: press OK on the TV now` : `pairing ${d.name}`);
      const pr = await deviceAction('bt_pair', { mac: d.mac, seconds: (h || d.tv) ? 45 : 12 }, (h || d.tv) ? 55000 : 20000);   // short: devices that need a button press are skipped, not forced
      if (!pr.ok) { skipped.push(`${d.name} (${pr.detail.split('(')[0].trim()})`); continue; }
    }
    if (!state.speakers.some(x => norm(x.name) === norm(d.name))) await handlers.speaker_save({ name: d.name, alias: d.name, area: area || '' });
    const c = await connectSpeaker(d.name);
    if (c.ok) ok.push(d.name); else skipped.push(`${d.name} (paired, would not connect)`);
  }
  if (!ok.length) return `God Mode: nothing took over. Skipped: ${skipped.join('; ')}.`;
  const m = await handlers.music_control({ action: 'play', query: song || 'Back in Black', kind: 'track' });
  return `SUCCESS: God Mode connected ${ok.join(', ')}.${skipped.length ? ' Skipped: ' + skipped.join('; ') + '.' : ''} ${m} Note: the phone streams to one speaker at a time, whichever connected last.`;
};
handlers.bluetooth_connect = async ({ device }) => { const c = await connectSpeaker(device); return c.text; };

// Without the Spotify Web API (Spotify limits who can create developer apps), the Android app drives the Spotify app directly.
async function musicViaPhone({ action, query, kind, volume, speaker }) {
  const say = r => (r.ok ? r.detail : 'Phone problem: ' + r.detail);
  const notes = [];
  if (action === 'start') { const c = await connectSpeaker(speaker); notes.push(c.text); if (!c.ok && !pickSpeaker(speaker)) return c.text; }
  if (action === 'start' || (action === 'play' && !query) || action === 'resume') {
    const r = await deviceAction('spotify_resume', {}, 15000);
    return notes.concat(r.ok ? 'Spotify is opening and resuming your most recent listening.' : say(r)).join(' ');
  }
  if (action === 'play') { const r = await deviceAction('spotify_search', { query, kind: kind || 'track' }, 15000); return say(r); }
  if (['pause', 'next', 'previous'].includes(action)) { const r = await deviceAction('media_key', { key: action }, 8000); return r.ok ? { pause: 'Paused.', next: 'Skipped.', previous: 'Previous track.' }[action] : say(r); }
  if (action === 'volume') { const r = await deviceAction('set_volume', { percent: Number(volume) }, 8000); return say(r); }
  if (action === 'status') return 'I cannot see what is playing without the Spotify connection; only controls work right now.';
  return 'Unknown music action.';
}
handlers.music_control = async ({ action, query, kind, volume, speaker }) => {
  if (action === 'close' || action === 'stop') return handlers.bluetooth_disconnect({ device: speaker });   // stop, force-close Spotify, drop the speaker
  if (!spo.configured() || !spoRef()) return musicViaPhone({ action, query, kind, volume, speaker });
  const r = spoRef();
  try {
    if (action === 'status') { const st = await spo.status(r); return st ? `${st.playing ? 'Playing' : 'Paused'}: ${st.track} by ${st.artists} on ${st.device} (volume ${st.volume}%).` : 'Nothing is playing.'; }
    if (action === 'pause') { await spo.pause(r); return 'Paused.'; }
    if (action === 'next') { await spo.next(r); return 'Skipped to the next track.'; }
    if (action === 'previous') { await spo.previous(r); return 'Back to the previous track.'; }
    if (action === 'volume') { await spo.volume(r, Number(volume)); return `Volume set to ${volume}%.`; }
    const notes = [];
    if (action === 'start') { const c = await connectSpeaker(speaker); notes.push(c.text); }
    const dev = await spotifyReady();
    if (action === 'resume' && !query) { await spo.play(r, { deviceId: dev.id }); return 'Playing again.'; }
    if (action === 'start' || (action === 'play' && !query)) {
      const pl = await spo.latestPlaylist(r);
      if (!pl) return notes.concat('I could not find a recent playlist.').join(' ');
      await spo.play(r, { uri: pl.uri, context: true, deviceId: dev.id });
      return notes.concat(`Playing your latest playlist, ${pl.name}, on ${dev.name}.`).join(' ');
    }
    if (action === 'play') {
      const hit = await spo.find(r, query, kind || 'track');
      if (!hit) return `Nothing on Spotify matched "${query}".`;
      await spo.play(r, { uri: hit.uri, context: hit.context, deviceId: dev.id });
      return `Playing ${hit.name} on ${dev.name}.`;
    }
    return 'Unknown music action.';
  } catch (e) { return spoFail(e); }
};
// Music only starts when the Owner actually asked for it in this turn. Pause/next/volume/status are always allowed.
{
  const _music = handlers.music_control;
  const WANTS_MUSIC = /\b(music|tunes?|songs?|spotify|playlist|play|put on|turn on|start|resume|speaker|bluetooth|god ?mode|take over|queue|album|artist|radio)\b/i;
  handlers.music_control = async a => {
    const starts = ['start', 'play', 'resume'].includes(a?.action);
    if (starts) {
      const said = turn?.text || '';
      if (turn?.origin !== 'user' || !WANTS_MUSIC.test(said)) {
        broadcast({ type: 'activity', text: `Blocked music ${a.action}: you did not ask for music (heard: "${said.slice(0, 60)}")` });
        console.log(`music ${a.action} BLOCKED, origin=${turn?.origin}, text="${said.slice(0, 80)}"`);
        return 'Refused: the Owner did not ask for music in this request. Do NOT start music. Just answer what he said.';
      }
      broadcast({ type: 'activity', text: `Music ${a.action} because you said: "${said.slice(0, 60)}"` });
    }
    return _music(a);
  };
}
const spoRedirect = req => `${process.env.PUBLIC_URL || `${req.headers['x-forwarded-proto'] || req.protocol}://${req.get('host')}`}/api/spotify/callback`;
app.get('/api/spotify/login', (req, res) => {
  if (!spo.configured()) return res.status(503).type('text/plain').send('Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Railway first.');
  res.redirect(spo.authUrl(spoRedirect(req), 'jarvis'));
});
app.get('/api/spotify/callback', async (req, res) => {
  try {
    if (!req.query.code) return res.status(400).type('text/plain').send('Spotify sent no code: ' + (req.query.error || 'cancelled'));
    state.spotifyRefresh = await spo.exchange(String(req.query.code), spoRedirect(req));
    saveState();
    res.type('html').send('<meta name=viewport content="width=device-width"><body style="background:#03090d;color:#3fe0ff;font:20px sans-serif;padding:30px"><h2>Spotify connected.</h2><p>You can close this and tell Jarvis to play something.</p>');
  } catch (e) { res.status(500).type('text/plain').send(String(e.message || e)); }
});
app.get('/api/spotify/status', async (req, res) => {
  res.type('text/plain').send(!spo.configured() ? 'Not set up: missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in Railway.'
    : !spoRef() ? 'Set up but not approved yet. Open /api/spotify/login on the phone.'
    : await spo.devices(spoRef()).then(d => 'Connected. Players: ' + (d.map(x => `${x.name} (${x.type}${x.is_active ? ', active' : ''})`).join(', ') || 'none open right now.')).catch(e => spoFail(e)));
});

// The Android app, served from Jarvis itself (GitHub's download servers can be very slow on phones). Cached for 1 minute (add ?fresh to skip).
app.get('/jarvis.apk', async (req, res) => {
  try {
    const file = path.join(DATA_DIR, 'jarvis.apk');
    const fresh = fs.existsSync(file) && Date.now() - fs.statSync(file).mtimeMs < 60e3 && req.query.fresh === undefined;
    if (!fresh) {
      const r = await fetch(`https://github.com/${process.env.GITHUB_REPO || 'Elliot-H/Jarvis-2.0'}/releases/latest/download/jarvis.apk`, { redirect: 'follow', signal: AbortSignal.timeout(60000) });
      if (!r.ok) return res.status(502).type('text/plain').send('Could not fetch the app from GitHub: ' + r.status);
      fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
    }
    if (req.query.check !== undefined) return res.type('text/plain').send(`ok, ${fs.statSync(file).size} bytes, cached ${new Date(fs.statSync(file).mtimeMs).toISOString()}`);
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="jarvis.apk"');
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(file, { acceptRanges: true });   // handles Range/resume, which Android's download manager uses
  } catch (e) { res.status(500).type('text/plain').send(String(e.message || e)); }
});

lastBackup = JSON.stringify(backupOf()); // starting point: boot-time seeding is not a change
server.listen(PORT, HOST, () => {
  const mcp = Object.keys(loadMcp());
  console.log(`\n  JARVIS online → http://localhost:${PORT}`);
  console.log(`  Connections: dashboard${mcp.length ? ', ' + mcp.join(', ') : ''}`);
  console.log(`  Talk brain: ${BRAIN === 'openrouter' ? `OpenRouter · ${talkModel()}` : `Claude · ${CHAT_MODEL}`} · repairs: Claude · ${WORK_MODEL}`);
  const at = m => m == null ? 'off' : `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
  console.log(`  Crypto briefs: morning ${at(BRIEF_SLOTS.morning)} · midday ${at(BRIEF_SLOTS.midday)} (only if a coin moves ${ALERT_PCT}%+) · evening ${at(BRIEF_SLOTS.evening)}${process.env.NTFY_TOPIC ? ' · phone alerts on' : ''}${BRAIN === 'openrouter' ? '' : ' · OFF (needs OpenRouter brain)'}`);
  console.log(`  Caps: $${DAILY_BUDGET}/day · $${MONTHLY_BUDGET}/month all AI · $${WORK_MONTHLY_BUDGET}/month repairs`);
  console.log(`  PIN lock: ${PIN ? 'on' : 'OFF (set JARVIS_PIN before putting this online)'}`);
  console.log(`  Voice: ${process.env.FISH_API_KEY ? 'Fish Audio' : process.env.ELEVENLABS_API_KEY ? 'ElevenLabs' : 'browser fallback (add ELEVENLABS_API_KEY for the real voice)'}\n`);
});
