// Jarvis HUD server
// Brain: Claude Agent SDK (Claude Code under the hood) + MCP connections
// Voice: ElevenLabs TTS (falls back to the browser voice if no key)
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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

// ---------- the HUD's own MCP tools (Claude uses these to drive the screen) ----------
const dashboard = createSdkMcpServer({
  name: 'dashboard',
  version: '1.0.0',
  tools: [
    tool(
      'update_stats',
      'Put numbers on the Jarvis HUD. Each stat is a tile. Reuse the same id to update a tile. Call this whenever you pull real numbers (downloads, revenue, ad spend, ROAS, subscribers, jobs booked, etc).',
      {
        stats: z.array(z.object({
          id: z.string().describe('stable slug, e.g. myguru_downloads_7d'),
          label: z.string().describe('short label, e.g. "Downloads · 7d"'),
          value: z.string().describe('display value, e.g. "2,459" or "$4,289"'),
          delta: z.string().optional().describe('change vs prior period, e.g. "+12%" or "-3%"'),
          trend: z.array(z.number()).optional().describe('optional sparkline points, oldest first'),
          group: z.string().optional().describe('tile group, e.g. "MyGuru", "Ads", "YouTube", "Shop"'),
          source: z.string().optional().describe('where the number came from')
        }))
      },
      async ({ stats }) => {
        const now = new Date().toISOString();
        for (const s of stats) state.stats[s.id] = { ...s, updatedAt: now };
        saveState();
        broadcast({ type: 'stats', stats: state.stats });
        return { content: [{ type: 'text', text: `HUD updated: ${stats.map(s => s.label).join(', ')}` }] };
      }
    ),
    tool(
      'get_hud',
      'Read what is currently on the HUD (all stat tiles and panels).',
      {},
      async () => ({ content: [{ type: 'text', text: JSON.stringify({ stats: state.stats, panels: state.panels }, null, 2) }] })
    ),
    tool(
      'remove_stats',
      'Remove tiles from the HUD by id. Pass ["*"] to clear everything.',
      { ids: z.array(z.string()) },
      async ({ ids }) => {
        if (ids.includes('*')) state.stats = {};
        else for (const id of ids) delete state.stats[id];
        saveState();
        broadcast({ type: 'stats', stats: state.stats });
        return { content: [{ type: 'text', text: 'Removed.' }] };
      }
    ),
    tool(
      'show_panel',
      'Show a text panel on the HUD (a recommendation, a to-do list, a short report). Markdown-lite: lines starting with "- " become bullets. Reuse the id to replace it.',
      {
        id: z.string(),
        title: z.string(),
        body: z.string()
      },
      async ({ id, title, body }) => {
        state.panels[id] = { id, title, body, updatedAt: new Date().toISOString() };
        saveState();
        broadcast({ type: 'panels', panels: state.panels });
        return { content: [{ type: 'text', text: `Panel "${title}" shown.` }] };
      }
    ),
    tool(
      'hide_panel',
      'Remove a panel from the HUD by id, or "*" for all.',
      { id: z.string() },
      async ({ id }) => {
        if (id === '*') state.panels = {}; else delete state.panels[id];
        saveState();
        broadcast({ type: 'panels', panels: state.panels });
        return { content: [{ type: 'text', text: 'Hidden.' }] };
      }
    )
  ]
});

// ---------- failed commands (remembered across restarts so Jarvis can revisit them) ----------
state.failures ||= [];
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
const failuresServer = createSdkMcpServer({
  name: 'failures',
  version: '1.0.0',
  tools: [
    tool(
      'note_failure',
      'Remember a command you could not carry out: cut off mid-sentence, unclear, blocked, missing a connection, or it errored. Call this before replying whenever a request did not succeed.',
      { command: z.string().describe('what the Owner asked, as heard'), reason: z.string().describe('why it failed, in a few words') },
      async ({ command, reason }) => ({ content: [{ type: 'text', text: `Remembered as failure ${recordFailure(command, reason).id}.` }] })
    ),
    tool(
      'list_failures',
      'List the commands that failed earlier and have not been resolved yet.',
      {},
      async () => (pruneFailures(), { content: [{ type: 'text', text: state.failures.length ? state.failures.map(f => `${f.id} · ${f.at.slice(0, 16).replace('T', ' ')} · "${f.command}" · ${f.reason}`).join('\n') : 'No failed commands on record.' }] })
    ),
    tool(
      'resolve_failure',
      'Forget a failed command once it has been done or the Owner no longer wants it. Pass "*" to clear all.',
      { id: z.string() },
      async ({ id }) => {
        state.failures = id === '*' ? [] : state.failures.filter(f => f.id !== id);
        saveState();
        return { content: [{ type: 'text', text: 'Resolved.' }] };
      }
    )
  ]
});

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
const selfServer = createSdkMcpServer({ name: 'self', version: '1.0.0', tools: selfRepair.tools });

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

async function run(text, { spoken = true, origin = 'user', label } = {}) {
  busy = true;
  turn = { id: ++turnCounter, text, origin };
  broadcast({ type: 'state', state: 'thinking' });
  broadcast({ type: 'log', role: origin, text: label || text });
  const now = new Date();
  const clock = `\n\n# Right now\nLocal time: ${now.toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' })}.`;
  const hud = `\nOn the HUD: ${Object.values(state.stats).map(s => `${s.label}=${s.value}${s.delta ? ` (${s.delta})` : ''}`).join('; ') || 'nothing yet'}.`;
  pruneFailures();
  const failed = state.failures.length
    ? `\nUnresolved failed commands (resolve_failure once done): ${state.failures.slice(-10).map(f => `[${f.id}] "${f.command}" (${f.reason})`).join('; ')}.`
    : '';

  const external = loadMcp();
  const mcpServers = { dashboard, self: selfServer, failures: failuresServer, ...external };
  const persona = readText('persona.md');
  const allowed = [
    'mcp__dashboard', 'mcp__self', 'mcp__failures',
    ...Object.keys(external).map(n => `mcp__${n}`),
    'WebSearch', 'WebFetch', 'TodoWrite',
    // file access stays inside Jarvis's workspace; code edits only inside ./self
    'Read(./**)', 'Glob(./**)', 'Grep(./**)',
    'Edit(./self/**)', 'Write(./self/**)', 'MultiEdit(./self/**)',
    ...(process.env.JARVIS_ALLOW_SHELL === '1' ? ['Bash'] : [])
  ];

  let finalText = '';
  try {
    current = query({
      prompt: text,
      options: {
        cwd: WORKSPACE,
        model: process.env.JARVIS_MODEL || undefined,
        systemPrompt: { type: 'preset', preset: 'claude_code', append: persona + clock + hud + failed },
        mcpServers,
        allowedTools: allowed,
        disallowedTools: ['Read(//proc/**)', 'Read(//sys/**)', 'Read(//etc/**)', 'Read(~/**)', 'Read(//root/**)'],
        permissionMode: 'dontAsk', // voice assistant can't click "approve": anything not listed above is denied
        resume: state.sessionId || undefined,
        maxTurns: Number(process.env.JARVIS_MAX_TURNS || 60)
      }
    });

    for await (const m of current) {
      if (m.type === 'system' && m.subtype === 'init') {
        const conn = (m.mcp_servers || []).map(s => ({ name: s.name, status: s.status }));
        broadcast({ type: 'connections', connections: conn });
      }
      if (m.type === 'assistant' && !m.parent_tool_use_id) {
        for (const b of m.message?.content || []) {
          if (b.type === 'tool_use' && !['ToolSearch', 'TodoWrite'].includes(b.name)) {
            broadcast({ type: 'activity', text: prettyTool(b.name, b.input) });
          }
        }
      }
      if (m.type === 'result') {
        if (m.session_id) { state.sessionId = m.session_id; saveState(); }
        if (m.subtype === 'success') finalText = m.result || '';
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

  broadcast({ type: 'say', text: finalText, speak: spoken });
  return finalText;
}

function prettyTool(name, input) {
  const n = name.replace(/^mcp__/, '').replace(/__/g, ' › ');
  if (name === 'WebSearch') return `Searching the web: ${input?.query ?? ''}`;
  if (name === 'WebFetch') return `Reading ${input?.url ?? 'a page'}`;
  if (name.startsWith('mcp__dashboard')) return `Updating HUD`;
  return `Using ${n}`;
}

// ---------- scheduled briefing ----------
async function briefing(reason = 'scheduled') {
  const b = readText('briefing.md');
  if (!b.trim()) return;
  ask(`[${reason} briefing] ${b}`, { spoken: reason !== 'scheduled', origin: 'system', label: reason === 'wake' ? 'Wake-up briefing' : 'Scheduled briefing' });
}
const every = Number(process.env.BRIEFING_EVERY_MINUTES || 0);
if (every > 0 && !process.env.JARVIS_SMOKE) setInterval(() => { if (!busy && !queue.length) briefing('scheduled'); }, every * 60_000);

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
    elevenlabs: Boolean(process.env.ELEVENLABS_API_KEY)
  });
});

// Plain text ask (used by the safe-mode page)
app.post('/api/ask', async (req, res) => {
  const t = String(req.body?.text || '').trim().slice(0, 4000);
  if (!t) return res.status(400).json({ error: 'empty' });
  res.json({ reply: await ask(t, { spoken: false }) });
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

// ElevenLabs text-to-speech proxy (keeps the key on the server)
app.all('/api/tts', async (req, res) => {
  const key = process.env.ELEVENLABS_API_KEY;
  const text = String(req.body?.text || req.query?.text || '').slice(0, 2500);
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
      console.error('ElevenLabs error', r.status, await r.text());
      return res.status(204).end();
    }
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
    res.status(204).end();
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
      state.sessionId = null; saveState();
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
  console.log(`  PIN lock: ${PIN ? 'on' : 'OFF (set JARVIS_PIN before putting this online)'}`);
  console.log(`  Voice: ${process.env.ELEVENLABS_API_KEY ? 'ElevenLabs' : 'browser fallback (add ELEVENLABS_API_KEY for the real voice)'}\n`);
});
