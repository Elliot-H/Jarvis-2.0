#!/usr/bin/env node
// Jarvis Node: runs on a Raspberry Pi (or any always-on Linux box) inside the building. LAN-only hardware, outbound-only link to Jarvis.
//  - Lights: Shelly relays/dimmers (local HTTP, any generation) and Zigbee lights/plugs through zigbee2mqtt (local MQTT).
//  - Clapper: a USB mic via `arecord`; 2 claps toggle the clapper room, 3 claps turn off every light on this node.
//  - Zigbee buttons (optional): a press can toggle a room locally.
// Claps and buttons act HERE first, so they keep working with the internet or Jarvis down; Jarvis is told afterwards.
//
// node agent.js [config.json]          run
// node agent.js --calibrate            show mic levels and claps, switch nothing
// node agent.js --mics                 list capture devices
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';
import { fileURLToPath } from 'url';
import WebSocket from 'ws';
import { ClapDetector } from './clap.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION = '1.0.0';
const args = process.argv.slice(2);
const CFG_PATH = path.resolve(args.find(a => !a.startsWith('--')) || path.join(HERE, 'config.json'));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

if (args.includes('--mics')) { try { console.log(execSync('arecord -l', { encoding: 'utf8' })); } catch (e) { console.log('arecord not found: sudo apt install alsa-utils'); } process.exit(0); }
if (!fs.existsSync(CFG_PATH)) { console.error(`No config at ${CFG_PATH}. Copy config.example.json to config.json and fill it in.`); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));
cfg.clapper ||= { enabled: false };
const saveCfg = () => { try { fs.writeFileSync(CFG_PATH, JSON.stringify(cfg, null, 2)); } catch (e) { log('could not save config:', e.message); } };
const norm = x => String(x || '').toLowerCase().trim();

// ---------- devices ----------
// Each light: {id, name, room, kind: shelly|z2m, ...}; live: on, bri, online.
const lights = (cfg.lights || []).map(l => ({ dim: false, ...l, id: String(l.id || l.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'), on: null, bri: null, online: null }));
const pub = l => ({ id: l.id, name: l.name, room: l.room, kind: l.kind, dim: !!l.dim, on: l.on, bri: l.bri, online: l.online });

async function http(url, timeout = 3000) {
  const r = await fetch(url, { signal: AbortSignal.timeout(timeout) });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}
const shelly = {
  async detect(l) {
    if (l.gen) return;
    const j = await http(`http://${l.host}/shelly`);
    l.gen = j.gen >= 2 ? 2 : 1;                                            // Gen2/3/4 speak RPC; Gen1 the old REST
    log(`${l.name}: Shelly ${j.model || j.type || ''} gen ${j.gen || 1}`);
  },
  base: l => `http://${l.host}`,
  read(l, j) { l.on = !!(j.output ?? j.ison); if (l.dim && j.brightness != null) l.bri = j.brightness; },
  async status(l) {
    await this.detect(l); const ch = l.channel || 0;
    const j = l.gen === 2 ? await http(`${this.base(l)}/rpc/${l.dim ? 'Light' : 'Switch'}.GetStatus?id=${ch}`) : await http(`${this.base(l)}/${l.dim ? 'light' : 'relay'}/${ch}`);
    this.read(l, j);
  },
  async set(l, on, bri) {
    await this.detect(l); const ch = l.channel || 0;
    if (l.gen === 2) {
      const q = `id=${ch}&on=${on}` + (l.dim && bri != null && on ? `&brightness=${bri}` : '');
      await http(`${this.base(l)}/rpc/${l.dim ? 'Light' : 'Switch'}.Set?${q}`);
    } else {
      await http(`${this.base(l)}/${l.dim ? 'light' : 'relay'}/${ch}?turn=${on ? 'on' : 'off'}` + (l.dim && bri != null && on ? `&brightness=${bri}` : ''));
    }
    await this.status(l);
  }
};

let mqtt = null;
const z2m = {
  base: () => cfg.zigbee2mqtt?.base_topic || 'zigbee2mqtt',
  async start() {
    if (!cfg.zigbee2mqtt?.url) return;
    let lib; try { lib = (await import('mqtt')).default; } catch { log('zigbee2mqtt configured but the mqtt package is missing: npm install mqtt'); return; }
    mqtt = lib.connect(cfg.zigbee2mqtt.url, { username: cfg.zigbee2mqtt.username, password: cfg.zigbee2mqtt.password, reconnectPeriod: 5000 });
    mqtt.on('connect', () => {
      log('zigbee2mqtt connected');
      for (const l of lights.filter(x => x.kind === 'z2m')) { mqtt.subscribe(`${this.base()}/${l.device}`); mqtt.publish(`${this.base()}/${l.device}/get`, JSON.stringify({ state: '' })); }
      for (const b of cfg.buttons || []) mqtt.subscribe(`${this.base()}/${b.device}`);
    });
    mqtt.on('error', e => log('mqtt:', e.message));
    mqtt.on('message', (topic, buf) => {
      let j; try { j = JSON.parse(buf); } catch { return; }
      const dev = topic.slice(this.base().length + 1);
      const l = lights.find(x => x.kind === 'z2m' && x.device === dev);
      if (l && j.state) {
        const was = l.on, wb = l.bri; l.on = j.state === 'ON'; l.online = true; if (j.brightness != null) l.bri = Math.round(j.brightness / 2.54);
        if (was !== l.on || wb !== l.bri) report([l], l._pending ? 'jarvis' : 'switch');
        if (l._pending) { l._pending(); l._pending = null; }
      }
      const b = (cfg.buttons || []).find(x => x.device === dev);
      if (b && j.action && b.actions?.[j.action]) runAction(b.actions[j.action], 'button').catch(e => log('button action failed:', e.message));
    });
  },
  status: async () => {},
  set(l, on, bri) {
    if (!mqtt?.connected) return Promise.reject(new Error('zigbee2mqtt is not connected'));
    const msg = { state: on ? 'ON' : 'OFF' }; if (l.dim && bri != null && on) msg.brightness = Math.round(bri * 2.54);
    return new Promise((res, rej) => {
      const t = setTimeout(() => { l._pending = null; rej(new Error(`${l.name} did not confirm`)); }, 5000);
      l._pending = () => { clearTimeout(t); res(); };
      mqtt.publish(`${this.base()}/${l.device}/set`, JSON.stringify(msg));
    });
  }
};
z2m.start = z2m.start.bind(z2m); z2m.set = z2m.set.bind(z2m);
const DRIVERS = { shelly, z2m };

async function setOne(l, on, bri) {
  const target = on === 'toggle' ? !l.on : on;
  try { await DRIVERS[l.kind].set(l, target, bri); l.online = true; return null; }
  catch (e) { l.online = false; return `${l.name}: ${e.message}`; }
}
async function setMany(list, on, bri) {
  const errs = (await Promise.all(list.map(l => setOne(l, on, bri)))).filter(Boolean);
  return errs;
}
// "toggle:bedroom", "off:all", "on:bedroom:40" -> local action (claps, buttons)
async function runAction(spec, by) {
  const [verb, where = 'all', b] = String(spec).split(':');
  const list = where === 'all' ? lights : lights.filter(l => norm(l.room) === norm(where) || norm(l.name) === norm(where) || l.id === norm(where));
  if (!list.length) return log(`action ${spec}: no lights match`);
  let on = verb === 'off' ? false : verb === 'on' ? true : !list.some(l => l.on);   // toggle a group: any on -> all off, else all on
  const errs = await setMany(list, on, b != null ? Number(b) : null);
  log(`${by}: ${spec} -> ${list.map(l => `${l.name} ${l.on ? 'on' : 'off'}`).join(', ')}${errs.length ? ' | ' + errs.join('; ') : ''}`);
  report(list, by);
}
async function pollAll() {
  for (const l of lights) {
    if (!DRIVERS[l.kind]) { l.online = false; continue; }
    const was = l.on, wb = l.bri;
    try { await DRIVERS[l.kind].status(l); if (l.kind === 'shelly') l.online = true; } catch { if (l.kind === 'shelly') l.online = false; }
    if (was !== null && (was !== l.on || wb !== l.bri)) report([l], 'switch');   // somebody used the wall switch / app
  }
}

// ---------- link to Jarvis ----------
let ws = null, backoff = 2000;
const send = m => { if (ws?.readyState === 1) ws.send(JSON.stringify(m)); };
const report = (list, by) => send({ type: 'state', devices: list.map(pub), by });
const clapperPub = () => ({ enabled: !!cfg.clapper.enabled, room: cfg.clapper.room || '', sensitivity: cfg.clapper.sensitivity || 5 });
function connect() {
  if (!cfg.jarvis_url || !cfg.token) return log('No jarvis_url/token in config: running local-only (clapper and buttons still work).');
  const url = cfg.jarvis_url.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
  ws = new WebSocket(url, { headers: { 'x-jarvis-node': cfg.token } });
  ws.on('open', () => { backoff = 2000; log('connected to Jarvis'); send({ type: 'hello', site: cfg.site || 'home', version: VERSION, devices: lights.map(pub), clapper: clapperPub() }); });
  ws.on('message', async raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.type === 'set') {
      const list = lights.filter(l => (m.targets || []).includes(l.id));
      const errs = await setMany(list, m.on, m.bri ?? null);
      log(`jarvis: ${list.map(l => l.name).join(', ')} -> ${m.on}${m.bri != null ? ' ' + m.bri + '%' : ''}${errs.length ? ' | ' + errs.join('; ') : ''}`);
      send({ type: 'result', id: m.id, ok: errs.length < list.length, detail: errs.join('; ') || 'done', devices: list.map(pub) });
    }
    if (m.type === 'clapper') {
      if (m.enabled != null) cfg.clapper.enabled = !!m.enabled;
      if (m.room) { const r = lights.find(l => norm(l.room).includes(norm(m.room)) || norm(m.room).includes(norm(l.room))); if (r) cfg.clapper.room = r.room; }
      if (m.sensitivity) { cfg.clapper.sensitivity = m.sensitivity; det?.setSensitivity(m.sensitivity); }
      saveCfg(); cfg.clapper.enabled ? startMic() : stopMic();
      send({ type: 'result', id: m.id, ok: true, detail: 'done', clapper: clapperPub() });
    }
  });
  ws.on('close', (code) => { log(`Jarvis link closed (${code}), retry in ${backoff / 1000}s`); ws = null; setTimeout(connect, backoff); backoff = Math.min(backoff * 2, 60000); });
  ws.on('error', e => log('Jarvis link:', e.message));
}

// ---------- clapper ----------
let rec = null, det = null, micWant = false;
function startMic(calibrate = false) {
  micWant = true; if (rec) return;
  const dev = cfg.clapper.mic || 'default';
  det = new ClapDetector({
    sensitivity: cfg.clapper.sensitivity || 5,
    onClap: t => calibrate && log(`  clap at ${(t / 1000).toFixed(2)}s`),
    onPattern: n => {
      const action = n === 2 ? `toggle:${cfg.clapper.room || 'all'}` : n === 3 ? (cfg.clapper.triple || 'off:all') : null;
      if (calibrate) return log(`PATTERN: ${n} claps -> would run ${action || 'nothing'}`);
      if (!action) return;
      runAction(action, 'clap').then(() => send({ type: 'clap', count: n, room: cfg.clapper.room, action })).catch(e => log('clap action failed:', e.message));
    },
    onLevel: calibrate ? ({ peak, floor }) => process.stdout.write(`\rpeak ${peak.toFixed(2)} ${'#'.repeat(Math.round(peak * 40)).padEnd(40)} background ${floor.toFixed(3)}  `) : null
  });
  rec = spawn('arecord', ['-q', '-D', dev, '-f', 'S16_LE', '-r', '16000', '-c', '1', '-t', 'raw'], { stdio: ['ignore', 'pipe', 'pipe'] });
  rec.stdout.on('data', c => det.push(c));
  rec.stderr.on('data', d => log('mic:', String(d).trim()));
  rec.on('error', e => { log('mic: cannot start arecord:', e.message, '(sudo apt install alsa-utils)'); if (e.code === 'ENOENT') micWant = false; });
  rec.on('close', code => { rec = null; if (micWant) { log(`mic stopped (${code}), restarting in 5s`); setTimeout(() => micWant && startMic(calibrate), 5000); } });
  log(`clapper listening on ${dev}, sensitivity ${det.sensitivity}, room ${cfg.clapper.room || 'all'}`);
}
function stopMic() { micWant = false; if (rec) { rec.kill(); rec = null; log('clapper off'); } }

// ---------- main ----------
if (args.includes('--calibrate')) {
  log('Calibrating: clap twice, then three times, then talk normally. Nothing is switched. Ctrl+C to stop.');
  startMic(true);
} else {
  log(`Jarvis Node "${cfg.site || 'home'}" v${VERSION}: ${lights.length} lights`);
  await z2m.start();
  await pollAll();
  setInterval(pollAll, (cfg.poll_seconds || 20) * 1000);
  connect();
  if (cfg.clapper.enabled) startMic();
  process.on('SIGTERM', () => { stopMic(); process.exit(0); });
}
