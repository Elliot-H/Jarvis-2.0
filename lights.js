// Room lights (A18) through a Jarvis Node: a small program on a Raspberry Pi (or any always-on PC) in each building.
// Railway cannot reach the LAN, so the node connects OUT to Jarvis on the same /ws socket the HUD uses, authenticated by the
// header x-jarvis-node: <JARVIS_NODE_TOKEN> (no PIN cookie, no port forwarding). The node owns the hardware (Shelly relays/dimmers
// over local HTTP, Zigbee plugs/switches/buttons through zigbee2mqtt) and the clapper (USB mic). Claps and Zigbee buttons act
// locally on the node first, so they work with the internet down; Jarvis is told afterwards.
//
// Protocol (JSON):
//   node -> jarvis  hello {site, version, devices:[dev], clapper}      dev = {id, name, room, kind, dim, on, bri, online}
//                   state {devices:[dev], by}                           by = clap | button | switch | jarvis | poll
//                   clap {count, room, action}                          a clap pattern was heard (already acted on)
//                   result {id, ok, detail, devices}                    answer to a set / clapper command
//   jarvis -> node  set {id, targets:[local ids], on:true|false|'toggle', bri?}
//                   clapper {id, enabled?, room?, sensitivity?}
// state.lights (phone-backed, BACKUP_KEYS 'lights'): {devices: {"site:id": dev+site}, sites: {site: {seen, clapper}}}.
// DIRECT SHELLY MODE (no Pi): a Shelly Gen2+ plug is configured (Ws.SetConfig) to open an outbound WebSocket to
// wss://<jarvis host>/shelly/<JARVIS_NODE_TOKEN>. It sends NotifyFullStatus/NotifyStatus frames; Jarvis sends RPC requests
// {id, src:'jarvis', method:'Switch.Set', params:{id:0,on}} and reads {id, result|error}. Devices are stored in the same
// state.lights.devices with via:'shelly' (site 'home' unless renamed), so voice, tools and the HUD treat them like node lights.
import crypto from 'crypto';

const NUMW = { one: 1, two: 2, three: 3, four: 4, five: 5, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100, half: 50 };
const norm = x => String(x || '').toLowerCase().replace(/[^a-z0-9% ]/g, ' ').replace(/\s+/g, ' ').trim();
const COLOR = /\b(red|green|blue|purple|violet|pink|magenta|cyan|teal|aqua|lime|gold|orange|yellow|indigo|rainbow|color|colour|strip|led|leds|effect|music mode)\b/;
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

export function make({ state, saveState, broadcast, remember, log = console.log }) {
  state.lights ||= { devices: {}, sites: {} };
  state.lights.devices ||= {}; state.lights.sites ||= {};
  const nodes = new Map();                 // site -> ws
  const waits = new Map();                 // cmd id -> resolve
  const L = () => state.lights;

  L().token ||= crypto.randomBytes(16).toString('hex');   // used when JARVIS_NODE_TOKEN is not set in Railway (no manual step)
  const nodeToken = () => process.env.JARVIS_NODE_TOKEN || L().token;
  const isNode = req => {
    const want = nodeToken(), got = String(req.headers['x-jarvis-node'] || '');
    if (!want || !got || want.length !== got.length) return false;
    return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(got));
  };
  const shellyTokenOk = url => {
    const want = nodeToken(), m = String(url || '').match(/^\/shelly\/([A-Za-z0-9_-]{8,128})\/?(\?.*)?$/);
    if (!want || !m || want.length !== m[1].length) return false;
    return crypto.timingSafeEqual(Buffer.from(want), Buffer.from(m[1]));
  };
  const shellies = new Map();              // shelly src id -> ws
  const rpcWaits = new Map();              // rpc id -> {resolve}
  let rpcN = 0;
  const online = site => { const ws = nodes.get(site); return !!ws && ws.readyState === 1; };
  const devs = () => Object.values(L().devices);
  const label = d => d.name || d.id;

  function merge(site, list = [], by) {
    let changed = [];
    for (const d of list) {
      if (!d?.id) continue;
      const key = `${site}:${d.id}`, old = L().devices[key];
      const nu = { ...(old || {}), ...d, site, key, at: Date.now() };
      if (by) nu.by = by;
      if (!old || old.on !== nu.on || old.bri !== nu.bri) changed.push(nu);
      L().devices[key] = nu;
    }
    return changed;
  }

  // ----- direct Shelly plugs (outbound WebSocket from the plug) -----
  function shellyRpc(src, method, params, timeout = 6000) {
    const ws = shellies.get(src);
    if (!ws || ws.readyState !== 1) return Promise.resolve({ error: { message: 'the plug is offline' } });
    const id = ++rpcN;
    return new Promise(res => {
      const t = setTimeout(() => { rpcWaits.delete(id); res({ error: { message: 'the plug did not answer' } }); }, timeout);
      rpcWaits.set(id, r => { clearTimeout(t); res(r); });
      try { ws.send(JSON.stringify({ id, src: 'jarvis', method, params })); } catch (e) { clearTimeout(t); rpcWaits.delete(id); res({ error: { message: String(e.message || e) } }); }
    });
  }
  const shellyKind = src => /plug|pm|1|2/.test(src) ? 'plug' : 'switch';
  function shellyApply(src, params, by) {
    // params: {"switch:0": {output, ...}, ...} from NotifyFullStatus / NotifyStatus
    const sw = Object.entries(params || {}).filter(([k, v]) => /^switch:\d+$/.test(k) && v && typeof v === 'object');
    const list = [];
    for (const [k, v] of sw) {
      const ch = k.split(':')[1], id = sw.length > 1 || ch !== '0' ? `${src}#${ch}` : src;
      const key = `home:${id}`, old = L().devices[key];
      if (v.output === undefined && !old) continue;
      list.push({ id, on: v.output !== undefined ? !!v.output : old?.on, online: true, via: 'shelly', shelly: src, ch: Number(ch), kind: shellyKind(src), name: old?.name || ((sw.length > 1 ? `Plug ${ch}` : 'Plug') + ' ' + src.split('-').pop().slice(-4)), room: old?.room || '' });
    }
    if (list.length) { const ch = merge('home', list, by); saveState(); return ch; }
    return [];
  }
  function attachShelly(ws) {
    let src = null;
    ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', async raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.id != null && (m.result !== undefined || m.error) && rpcWaits.has(m.id)) { const f = rpcWaits.get(m.id); rpcWaits.delete(m.id); f(m); return; }
      if (!m.src) return;
      if (!src) {
        src = String(m.src).slice(0, 60); const prev = shellies.get(src); if (prev && prev !== ws) try { prev.close(4000, 'replaced'); } catch {}
        shellies.set(src, ws); log(`lights: Shelly plug ${src} connected`);
      }
      if (m.method === 'NotifyFullStatus') {
        const sys = m.params?.sys || {};
        shellyApply(src, m.params, 'connect');
        // pick up the name set on the plug itself, if any (only when we have not named it in Jarvis)
        const nm = sys.device?.name || (await shellyRpc(src, 'Sys.GetConfig', {}))?.result?.device?.name;
        if (nm) for (const k of Object.keys(L().devices)) { const d = L().devices[k]; if (d.shelly === src && !d.named) { d.name = nm; } }
        L().sites.home = { ...(L().sites.home || {}), seen: Date.now() };
        saveState(); broadcast({ type: 'log', role: 'system', text: `Shelly plug ${src} connected.` });
      } else if (m.method === 'NotifyStatus') {
        const ch = shellyApply(src, m.params, 'switch'); L().sites.home = { ...(L().sites.home || {}), seen: Date.now() };
        if (ch.length) broadcast({ type: 'log', role: 'system', text: `${ch.map(d => `${label(d)} ${d.on ? 'on' : 'off'}`).join(', ')} (at the plug).` });
      }
    });
    ws.on('close', () => {
      if (!src || shellies.get(src) !== ws) return;
      shellies.delete(src); for (const d of Object.values(L().devices)) if (d.shelly === src) d.online = false; saveState();
      log(`lights: Shelly plug ${src} offline`);
    });
  }
  async function shellySet(d, on, bri) {
    const method = on === 'toggle' ? 'Switch.Toggle' : 'Switch.Set';
    const r = await shellyRpc(d.shelly, method, on === 'toggle' ? { id: d.ch || 0 } : { id: d.ch || 0, on: bri != null && on !== false ? true : !!on });
    if (r.error) return { ok: false, detail: `${label(d)}: ${r.error.message || 'failed'}` };
    if (on !== 'toggle') { const cur = L().devices[d.key]; if (cur) { cur.on = bri != null && on !== false ? true : !!on; cur.online = true; saveState(); } }
    else { const cur = L().devices[d.key]; if (cur) { cur.on = !cur.on; saveState(); } }
    return { ok: true };
  }

  function attach(ws) {
    let site = null;
    ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', raw => {
      let m; try { m = JSON.parse(raw); } catch { return; }
      if (m.type === 'hello' && m.site) {
        site = String(m.site).toLowerCase().slice(0, 40);
        const prev = nodes.get(site); if (prev && prev !== ws) try { prev.close(4000, 'replaced'); } catch {}
        nodes.set(site, ws);
        // a fresh hello is the full device list for that site: drop devices the node no longer has
        const ids = new Set((m.devices || []).map(d => `${site}:${d.id}`));
        for (const k of Object.keys(L().devices)) if (L().devices[k].site === site && !ids.has(k)) delete L().devices[k];
        merge(site, m.devices);
        L().sites[site] = { seen: Date.now(), version: m.version, clapper: m.clapper || null };
        saveState(); log(`lights: node "${site}" online, ${plural((m.devices || []).length, 'device')}`);
        broadcast({ type: 'log', role: 'system', text: `Lights node "${site}" connected (${plural((m.devices || []).length, 'light')}).` });
        return;
      }
      if (!site) return;
      L().sites[site] = { ...(L().sites[site] || {}), seen: Date.now() };
      if (m.type === 'state') {
        const ch = merge(site, m.devices, m.by); saveState();
        if (ch.length && m.by && m.by !== 'jarvis' && m.by !== 'poll') broadcast({ type: 'log', role: 'system', text: `${ch.map(d => `${label(d)} ${d.on ? 'on' : 'off'}`).join(', ')} (${m.by}).` });
      }
      if (m.type === 'clap') broadcast({ type: 'log', role: 'system', text: `Heard ${m.count} claps in the ${m.room || 'room'}: ${m.action || 'nothing mapped'}.` });
      if (m.type === 'clapper') { L().sites[site].clapper = m.clapper; saveState(); }
      if (m.type === 'result' && waits.has(m.id)) { if (m.devices) merge(site, m.devices, 'jarvis'); if (m.clapper) L().sites[site].clapper = m.clapper; saveState(); const f = waits.get(m.id); waits.delete(m.id); f(m); }
    });
    ws.on('close', () => { if (site && nodes.get(site) === ws) { nodes.delete(site); log(`lights: node "${site}" offline`); } });
  }
  if (!process.env.JARVIS_SMOKE) setInterval(() => { for (const ws of shellies.values()) { try { ws.ping(); } catch {} }   // plugs: keep the connection warm only (not sure every firmware answers pings, so never terminate on silence)
    for (const ws of nodes.values()) { if (!ws.isAlive) { try { ws.terminate(); } catch {} continue; } ws.isAlive = false; try { ws.ping(); } catch {} } }, 30_000);

  function send(site, msg, timeout = 8000) {
    const ws = nodes.get(site);
    if (!ws || ws.readyState !== 1) return Promise.resolve({ ok: false, detail: `the ${site} lights node is offline` });
    const id = Math.random().toString(36).slice(2, 9);
    return new Promise(res => {
      const t = setTimeout(() => { waits.delete(id); res({ ok: false, detail: `the ${site} node did not answer` }); }, timeout);
      waits.set(id, r => { clearTimeout(t); res(r); });
      ws.send(JSON.stringify({ ...msg, id }));
    });
  }

  // "bedroom", "the living room lamp", "all", "the shop", "" -> list of devices (or {ask} when it cannot tell)
  function resolve(target) {
    const t = norm(target).replace(/\b(the|my|a|light|lights|lamp|lamps|in|on|at|of|room)\b/g, ' ').replace(/\s+/g, ' ').trim();
    const all = devs(); if (!all.length) return { list: [], none: true };
    if (!t) {
      const rooms = [...new Set(all.map(d => `${d.site}/${d.room || ''}`))];
      if (rooms.length === 1) return { list: all };
      const def = Object.values(L().sites).map(s => s.clapper?.room).filter(Boolean);
      if (def.length === 1) return { list: all.filter(d => norm(d.room) === norm(def[0])) };
      return { list: [], ask: true };
    }
    if (/^(all|every|everything|all of them|whole house|house|everywhere)$/.test(t)) {
      const here = state.pres?.place && all.filter(d => norm(d.site) === norm(state.pres.place));
      return { list: /house/.test(t) ? all.filter(d => /house|home/.test(norm(d.site))) : (here?.length && t !== 'everywhere' ? here : all) };
    }
    const hit = f => all.filter(d => f(norm(d.name)) || f(norm(d.room)) || f(norm(d.site)));
    let list = hit(x => x && x === t);
    if (!list.length) list = hit(x => x && (x.includes(t) || t.includes(x)));
    if (!list.length) { const w = t.split(' ').filter(x => x.length > 2); list = all.filter(d => w.some(x => norm(`${d.name} ${d.room}`).split(' ').includes(x))); }
    return { list };
  }

  async function setLights(target, on, bri) {
    const r = resolve(target);
    if (r.none) return { ok: false, text: 'No lights are set up yet. No plug or Jarvis Node has connected.' };
    if (r.ask) return { ok: false, ask: true, text: `Which room, sir? I have ${[...new Set(devs().map(d => d.room).filter(Boolean))].join(', ')}.` };
    if (!r.list.length) return { ok: false, text: `I don't have a light called ${norm(target).replace(/^(the|my) /, '')}.` };
    const bySite = {}; for (const d of r.list.filter(x => x.via !== 'shelly')) (bySite[d.site] ||= []).push(d);
    const out = await Promise.all([
      ...Object.entries(bySite).map(([site, ds]) => send(site, { type: 'set', targets: ds.map(d => d.id), on, bri })),
      ...r.list.filter(x => x.via === 'shelly').map(d => shellySet(d, on, bri))
    ]);
    const bad = out.filter(o => !o.ok);
    const rooms = [...new Set(r.list.map(d => d.room || d.name))];
    const what = r.list.length === 1 ? label(r.list[0]) : r.list.length === devs().length && rooms.length > 1 ? 'All the lights' : rooms.length === 1 ? `${cap(rooms[0])} light${r.list.length > 1 ? 's' : ''}` : `${rooms.slice(0, -1).map(cap).join(', ')} and ${rooms.at(-1)} lights`;
    if (bad.length === out.length) return { ok: false, text: `${what}: no luck, ${bad[0].detail}.` };
    const did = bri != null && on !== false ? `at ${bri} percent` : on === 'toggle' ? 'switched' : on ? 'on' : 'off';
    return { ok: true, text: `${what} ${did}.${bad.length ? ` Part of it failed: ${bad.map(b => b.detail).join('; ')}.` : ''}`, list: r.list };
  }
  const cap = s => String(s).replace(/^./, c => c.toUpperCase());

  async function clapper(opts) {
    const sites = [...nodes.keys()].filter(online);
    if (!sites.length) return { ok: false, text: 'There is no clapper connected to me. A regular Clapper works on its own, sir.' };
    const out = await Promise.all(sites.map(s => send(s, { type: 'clapper', ...opts })));
    const ok = out.filter(o => o.ok);
    if (!ok.length) return { ok: false, text: `Clapper: ${out[0].detail}.` };
    const c = ok[0].clapper || {};
    return { ok: true, text: opts.enabled === false ? 'Clapper off.' : opts.enabled ? `Clapper on${c.room ? ` for the ${c.room}` : ''}. Clap twice to switch the lights.` : `Clapper ${c.enabled ? 'on' : 'off'}${c.room ? `, ${c.room}` : ''}${c.sensitivity ? `, sensitivity ${c.sensitivity}` : ''}.` };
  }

  function status() {
    const all = devs(); if (!all.length) return 'No lights are set up yet. No Jarvis Node has connected.';
    const sites = [...new Set(all.map(d => d.site))];
    return sites.map(s => {
      const c = L().sites[s]?.clapper;
      const mine = all.filter(d => d.site === s), plugsOnly = mine.every(d => d.via === 'shelly');
      return `${s}${plugsOnly ? ' plugs' : ' node ' + (online(s) ? 'online' : 'OFFLINE (last seen ' + new Date(L().sites[s]?.seen || 0).toLocaleString('en-US', { timeZone: 'America/New_York' }) + ')')}: ` +
        mine.map(d => `${label(d)}${d.room ? ` [room ${d.room}]` : ''} ${d.online === false ? 'unreachable' : d.on ? 'on' + (d.dim && d.bri != null ? ' ' + d.bri + '%' : '') : 'off'}`).join('; ') +
        (c ? `. Clapper ${c.enabled ? 'on' : 'off'} (room ${c.room || '-'}, sensitivity ${c.sensitivity || 5}/10)` : '');
    }).join('\n');
  }

  // ---------- voice shortcut: no AI call ----------
  // "lights off", "turn on the bedroom lights", "kill the lights", "dim the bedroom to 30", "all lights off", "clapper on/off".
  // Falls through (false) when no lights are registered, when it sounds like the LED strip (colors/effects), or when unsure.
  async function answer(text) {
    let t = norm(text).replace(/^(hey )?jarvis /, '').replace(/\b(please|can you|could you|would you|go ahead and|for me|sir|thanks|thank you|now)\b/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || t.split(' ').length > 12 || COLOR.test(t)) return false;
    let reply;
    if (/\bclapper\b/.test(t)) {
      if (!Object.keys(L().sites).length) return false;
      const off = /\b(off|disable|stop|deactivate|mute)\b/.test(t), on = !off && /\b(on|enable|start|activate|arm)\b/.test(t);
      const s = t.match(/\bsensitivity (to )?(\d{1,2})\b/), room = t.match(/\bfor the ([a-z ]+?)( lights?)?$/);
      if (!on && !off && !s) return false;
      reply = (await clapper({ ...(on ? { enabled: true } : off ? { enabled: false } : {}), ...(s ? { sensitivity: Math.max(1, Math.min(10, +s[2])) } : {}), ...(room ? { room: room[1] } : {}) })).text;
    } else {
      if (!devs().length) return false;
      const names = devs().flatMap(d => [norm(d.name), norm(d.room)]).filter(Boolean);
      const lighty = /\b(lights?|lamps?)\b/.test(t) || names.some(n => new RegExp(`\\b${n}\\b`).test(t));
      if (!lighty) return false;
      if (/\b(are|is|status|which|what)\b.*\b(on|off|lights?)\b/.test(t) && !/\b(turn|switch|shut|kill|cut|dim|set)\b/.test(t)) { reply = status(); }
      else {
        const pct = t.match(/\b(\d{1,3})( ?%| percent)?$|\bto (\d{1,3})\b|\b(half|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)( percent)?\b/);
        let bri = pct ? Math.min(100, Number(pct[1] || pct[3]) || NUMW[pct[4]] || 0) : null;
        let on;
        if (/\b(dim|dimmer|dimmed|lower)\b/.test(t)) { on = true; bri ??= 30; }
        else if (/\b(brighten|brighter|full|max)\b/.test(t)) { on = true; bri ??= 100; }
        else if (/\b(off|out|kill|cut|shut)\b/.test(t)) on = false;
        else if (/\b(on|up)\b/.test(t)) on = true;
        else if (/\b(toggle|flip|switch)\b/.test(t)) on = 'toggle';
        else if (bri != null && /\b(set|lights?)\b/.test(t)) on = true;
        else return false;
        if (on === false) bri = null;
        const target = t.replace(/\b(turn|switch|shut|kill|cut|flip|toggle|set|dim|dimmer|dimmed|lower|brighten|brighter|full|max|on|off|out|up|down|to|at|percent|brightness|all of|the lights|half|ten|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b|\d+ ?%?/g, ' ').replace(/\s+/g, ' ').trim();
        const r = await setLights(target, on, bri);
        reply = r.text;
      }
    }
    broadcast({ type: 'log', role: 'user', text }); remember('user', text);
    remember('jarvis', reply); broadcast({ type: 'say', text: reply, speak: true });
    return true;
  }

  const handlers = {
    lights_set: async ({ target = '', power = 'on', brightness }) => {
      const on = power === 'toggle' ? 'toggle' : power !== 'off';
      const r = await setLights(target, on, power === 'off' ? null : brightness ?? null);
      return r.text + (r.ok ? ' Confirm it to the user in a few words.' : ' Tell the user.');
    },
    lights_status: async () => status(),
    lights_name: async ({ device = '', name, room }) => {
      const r = resolve(device); const d = r.list?.[0] || devs().find(x => /^plug\b/i.test(x.name) && !x.named);
      if (!d) return 'I could not tell which plug you mean.';
      const cur = L().devices[d.key]; if (name) { cur.name = String(name).slice(0, 40); cur.named = true; } if (room != null) cur.room = String(room).slice(0, 30); saveState();
      return `Saved: ${cur.name}${cur.room ? ', ' + cur.room : ''}.`;
    },
    clapper_set: async ({ enabled, room, sensitivity }) => (await clapper({ ...(enabled != null ? { enabled } : {}), ...(room ? { room } : {}), ...(sensitivity ? { sensitivity: Math.max(1, Math.min(10, sensitivity)) } : {}) })).text
  };

  return { isNode, nodeToken, shellyTokenOk, attach, attachShelly, answer, handlers, status, setLights, resolve, nodes };
}
