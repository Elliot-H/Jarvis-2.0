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
import { HUD_TOOLS, FAILURE_TOOLS, MODE_TOOLS, CRYPTO_TOOLS, PHONE_TOOLS, CALENDAR_TOOLS } from './tools.js';
import * as cal from './calendar.js';
import * as crypto_ from './crypto.js';
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
const DATA_DIR = path.join(__dirname, 'data');
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
state.stats ||= {}; state.panels ||= {};
const saveState = () => fs.writeFileSync(STATS_FILE, JSON.stringify(state, null, 2));

// ---------- websocket fan-out (all screens see the same HUD) ----------
const clients = new Set();
function broadcast(msg) {
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
    state.panels[id] = { id, title, body, updatedAt: new Date().toISOString() };
    saveState();
    broadcast({ type: 'panels', panels: state.panels });
    return `Panel "${title}" shown.`;
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
const failuresServer = createSdkMcpServer({ alwaysLoad: true, name: 'failures', version: '1.0.0', tools: sdkTools(FAILURE_TOOLS) });

function setPanel(id, panel) {
  if (panel) state.panels[id] = { id, ...panel, updatedAt: new Date().toISOString() };
  else delete state.panels[id];
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
  const clock = `\n\n# Right now\nLocal time: ${now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.`;
  const hud = `\nOn the HUD: ${Object.values(state.stats).map(s => `${s.label}=${s.value}${s.delta ? ` (${s.delta})` : ''}`).join('; ') || 'nothing yet'}.`;
  pruneFailures();
  const failed = state.failures.length
    ? `\nUnresolved failed commands (resolve_failure once done): ${state.failures.slice(-10).map(f => `[${f.id}] "${f.command}" (${f.reason})`).join('; ')}.`
    : '';

  const external = loadMcp();
  const mcpServers = mode === 'work'
    ? { dashboard, self: selfServer, failures: failuresServer, ...external }
    : { dashboard, failures: failuresServer, mode: modeServer, ...external };
  const persona = readText('persona.md');
  const allowed = [
    'mcp__dashboard', 'mcp__failures',
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
  const live = (clock + hud + failed + (recent && mode === 'chat' ? `\n\n# Recent conversation (for context)\n${recent}` : '')).trim();
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
      return `${JSON.stringify(r)}\n\n${crypto_.PLAYBOOK}`;
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
const TALK_TOOLS = [...HUD_TOOLS, ...FAILURE_TOOLS, ...MODE_TOOLS, ...CRYPTO_TOOLS, ...PHONE_TOOLS, ...CALENDAR_TOOLS];
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
  let finalText = r.text || (r.error ? 'I ran into a problem finishing that, sir. Check the log.' : 'Done, sir.');
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
function localGreeting() {
  const tz = process.env.TZ || 'America/New_York';
  const now = new Date();
  const h = Number(now.toLocaleString('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: tz }));
  const part = h < 5 ? 'Up late, sir.' : h < 12 ? 'Good morning, sir.' : h < 17 ? 'Good afternoon, sir.' : 'Good evening, sir.';
  const day = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: tz });
  const n = state.failures.length;
  const open = n ? ` ${n} earlier request${n > 1 ? 's' : ''} didn't go through; ask me to retry when you're ready.` : '';
  const brief = state.panels?.crypto ? ' Your crypto watch is on screen.' : '';
  return `${part} It's ${day}. All systems online.${brief}${open}`;
}
async function briefing(reason = 'scheduled') {
  if (reason === 'wake') { broadcast({ type: 'say', text: localGreeting(), speak: true }); return; }
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
const TAIL = 'Reply with one or two spoken sentences (the headline only); the detail goes in the "crypto" panel.';
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
async function pushTelegram(title, body) {
  try {
    const chat = await tgChatId();
    if (!chat) return 'Telegram is connected but has no chat yet. The Owner must open the bot in Telegram and send it any message once.';
    const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chat, text: `${title}\n${body}`.slice(0, 3500) }), signal: AbortSignal.timeout(10000)
    });
    return r.ok ? null : `Telegram answered ${r.status}: ${(await r.text()).slice(0, 120)}`;
  } catch (e) { return String(e.message || e).slice(0, 120); }
}
async function pushNtfy(title, body) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return 'NTFY_TOPIC is not set in Railway yet.';
  try {
    const r = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, { method: 'POST', headers: { Title: encodeURIComponent(String(title).slice(0, 80)).replace(/%20/g, ' '), Tags: 'chart_with_upwards_trend', Priority: process.env.NTFY_PRIORITY || '4' }, body: String(body).slice(0, 500), signal: AbortSignal.timeout(10000) });
    return r.ok ? null : `ntfy answered ${r.status}`;
  } catch (e) { console.warn('phone notification failed:', String(e.message || e)); return String(e.message || e).slice(0, 120); }
}
// Pushover: a notification-only app that lets the Owner upload his own sound (website: Custom Sounds).
// Needs PUSHOVER_APP_TOKEN (the app/API token) and PUSHOVER_USER_KEY. PUSHOVER_SOUND is the sound's name as uploaded (default "jarvis").
async function pushPushover(title, body) {
  try {
    const r = await fetch('https://api.pushover.net/1/messages.json', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        token: process.env.PUSHOVER_APP_TOKEN, user: process.env.PUSHOVER_USER_KEY,
        title: String(title).slice(0, 250), message: String(body).slice(0, 1000) || ' ',
        sound: process.env.PUSHOVER_SOUND || 'jarvis', priority: process.env.PUSHOVER_PRIORITY || '0'
      }), signal: AbortSignal.timeout(10000)
    });
    return r.ok ? null : `Pushover answered ${r.status}: ${(await r.text()).slice(0, 160)}`;
  } catch (e) { return String(e.message || e).slice(0, 120); }
}
async function push(title, body) {
  if (process.env.PUSHOVER_APP_TOKEN && process.env.PUSHOVER_USER_KEY) {
    const err = await pushPushover(title, body);
    if (!err) return null;
    console.warn('Pushover alert failed:', err);
    const backup = process.env.TELEGRAM_BOT_TOKEN ? await pushTelegram(title, body) : process.env.NTFY_TOPIC ? await pushNtfy(title, body) : 'no backup set';
    return backup ? `${err} (backup: ${backup})` : null;
  }
  if (process.env.TELEGRAM_BOT_TOKEN) {
    const err = await pushTelegram(title, body);
    if (!err) return null;
    console.warn('Telegram alert failed:', err);
    const backup = process.env.NTFY_TOPIC ? await pushNtfy(title, body) : 'no ntfy backup set';
    return backup ? `${err} (ntfy backup: ${backup})` : null;
  }
  return pushNtfy(title, body);
}
handlers.phone_alert = async ({ title, message }) => {
  const err = await push(title || 'Jarvis', message || '');
  return err ? `Could not send: ${err} Tell the Owner plainly.` : 'Sent. Tell the Owner to check his phone.';
};
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
  if (text && !/spending limit|allowance|out of|could not|problem finishing/i.test(text)) await push(`Crypto ${slot}`, text);
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

// ---------- HTTP ----------
const app = express();
app.set('trust proxy', 1);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// ---------- PIN lock (set JARVIS_PIN when Jarvis is on the internet) ----------
const PIN = String(process.env.JARVIS_PIN || '');
const SECRET = process.env.JARVIS_SECRET || crypto.createHash('sha256').update('jarvis:' + PIN + ':' + (process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_CODE_OAUTH_TOKEN || '')).digest('hex');
const TOKEN = crypto.createHmac('sha256', SECRET).update('ok:' + PIN).digest('hex');
const readCookie = req => Object.fromEntries(String(req.headers.cookie || '').split(';').map(c => c.trim().split('=')).filter(p => p.length === 2))['jarvis_auth'];
const authed = req => !PIN || readCookie(req) === TOKEN;
const tries = new Map();
const loginPage = (err = '') => `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>J.A.R.V.I.S.</title><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"><meta name="theme-color" content="#02060c">
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle,#06223a,#01050a 70%);color:#cfefff;font-family:system-ui,sans-serif}
form{display:flex;flex-direction:column;gap:14px;align-items:center;padding:16px}h1{font-weight:800;letter-spacing:.3em;color:#3fe0ff;text-shadow:0 0 14px rgba(63,224,255,.6);margin:0 0 10px}
input{font-size:28px;letter-spacing:.4em;text-align:center;width:220px;padding:12px;background:#041422;color:#3fe0ff;border:1px solid #3fe0ff;outline:0}
button{font-size:14px;letter-spacing:.3em;padding:14px 34px;background:transparent;color:#3fe0ff;border:1px solid #3fe0ff}p{color:#ff4d5e;margin:0;min-height:1em}</style></head>
<body><form method="post" action="/login"><h1>J.A.R.V.I.S.</h1><input name="pin" type="password" inputmode="numeric" autocomplete="current-password" autofocus aria-label="PIN"><p>${err}</p><button>UNLOCK</button></form></body></html>`;
app.post('/login', (req, res) => {
  const ip = req.ip, now = Date.now();
  const t = (tries.get(ip) || []).filter(x => now - x < 10 * 60_000);
  if (t.length >= 8) return res.status(429).send(loginPage('Too many tries. Wait 10 minutes.'));
  const ok = PIN && crypto.timingSafeEqual(Buffer.from(crypto.createHash('sha256').update(String(req.body?.pin || '')).digest()), Buffer.from(crypto.createHash('sha256').update(PIN).digest()));
  if (!ok) { t.push(now); tries.set(ip, t); return res.status(401).send(loginPage('Wrong PIN.')); }
  tries.delete(ip);
  res.setHeader('Set-Cookie', `jarvis_auth=${TOKEN}; Path=/; Max-Age=${60 * 60 * 24 * 180}; HttpOnly; SameSite=Lax${req.secure ? '; Secure' : ''}`);
  res.redirect(303, '/');
});
app.get('/health', (_req, res) => res.send('ok'));
const PUBLIC_FILES = /^\/(manifest\.webmanifest|sw\.js|icons\/[\w.-]+\.png)$/;
app.use((req, res, next) => {
  if (authed(req) || PUBLIC_FILES.test(req.path)) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'locked' });
  res.status(401).send(loginPage());
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/config', (_req, res) => {
  res.json({
    name: process.env.JARVIS_NAME || 'JARVIS',
    wakeWord: (process.env.WAKE_WORD || 'jarvis').toLowerCase(),
    userTitle: process.env.USER_TITLE || 'sir',
    elevenlabs: Boolean(process.env.FISH_API_KEY || process.env.ELEVENLABS_API_KEY),
    voiceProvider: process.env.FISH_API_KEY ? 'FISH AUDIO' : 'ELEVENLABS'
  });
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
async function fishTts(text, res) {
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

app.all('/api/tts', async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  const text = String(req.body?.text || req.query?.text || '').slice(0, 2500);
  if (process.env.FISH_API_KEY && text) return fishTts(text, res);
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
  ws.send(JSON.stringify({ type: 'stats', stats: state.stats }));
  ws.send(JSON.stringify({ type: 'panels', panels: state.panels }));
  ws.send(JSON.stringify({ type: 'state', state: busy ? 'thinking' : 'idle' }));
  ws.on('close', () => clients.delete(ws));
  ws.on('message', async raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'ask' && msg.text?.trim()) ask(msg.text.trim());
    if (msg.type === 'wake') briefing('wake');
    if (msg.type === 'interrupt' && current) { try { await current.interrupt(); } catch {} }
    if (msg.type === 'new_session') {
      state.sessionId = null; state.workSessionId = null; state.history = []; saveState();
      broadcast({ type: 'log', role: 'system', text: 'New conversation started.' });
    }
    if (msg.type === 'state') broadcast({ type: 'state', state: msg.state }); // listening/speaking echoed to all screens
    if (msg.type === 'client_error') console.warn('screen:', String(msg.text || '').slice(0, 1000));
  });
});

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
