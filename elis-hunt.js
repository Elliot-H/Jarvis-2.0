// Elis HUNT (Owner 2026-11-23: "use historical data and keep running loops until there are enough PROVEN data sets to get closer
// to 70%. The loop continues until then. No more waiting.").
// Data: every year test (2016-2025) also cuts each stock-in-play chart at random moments and stores the compact sample:
// what Elis could see (chart read + the why variables) and what happened next at 15 / 30 / 60 minutes.
// Loop (never ends): try a configuration (horizon, read model, confidence, examples needed, variables used, optional why-tuning),
// grade it leave-one-year-out (learn on the other years, call the held-out year), score = its WORST year (consistency first).
// 2025 is locked: a configuration is checked on it only when it beats the best so far on every other year. Proven = 2025 and
// every other unseen year hold up. Only a proven result is pushed to the Owner.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import * as BL from './elis-blind.js';
import * as RD from './elis-read.js';
import { catOf } from './elis-learn.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'hunt-state.json');
export const HS = [3, 6, 12];                         // 15 / 30 / 60 minutes ahead (5-min candles)
export const NAMES = { 3: '15 min', 6: '30 min', 12: '60 min' };
export const LOCK = process.env.ELIS_HUNT_LOCK || '2025';
export const TARGET = 70, PROVEN_MIN = 65;           // Owner's goal; a result is reported as proven at 65%+ on every unseen year incl. 2025
const STOP = 0.4, COST = 0.05, FLAT = 0.1;
const yieldNow = () => new Promise(r => setImmediate(r)), sleep = ms => new Promise(r => setTimeout(r, ms));
const b = (x, c, n) => { if (x == null || !Number.isFinite(x)) return null; for (let i = 0; i < c.length; i++) if (x < c[i]) return n[i]; return n[c.length]; };
export const KEYS = [...['move', 'candle', 'structure', 'vwap', 'volume', 'market', 'time', 'pattern'], ...BL.DAY_KEYS];
const SFILE = y => path.join(DIR, `hunt-samples-${y}.json.gz`);
export const haveSamples = y => fs.existsSync(SFILE(y));
export const years = () => fs.readdirSync(DIR).map(f => /^hunt-samples-(\d{4})\.json\.gz$/.exec(f)?.[1]).filter(Boolean).sort();

function outcomeH(cs, k, atr, h, dir) {
  const e = cs[k].c, risk = STOP * atr;
  if (!dir) { const d = (cs[k + h].c - e) / atr; return d > FLAT ? 'up' : d < -FLAT ? 'down' : 'flat'; }
  for (let j = k + 1; j <= k + h; j++) { const c = cs[j]; if (dir > 0 ? c.l <= e - risk : c.h >= e + risk) return -1 - COST; if (j === k + h) return Math.round((dir * (c.c - e) / risk - COST) * 100) / 100; }
}
// one stock-day -> n samples (features known at the cut, outcomes after it)
export function samplesForDay({ bars, spy, sec, t0, atr, gapPct, rvol, spyGap, spyTrend, spyVol, news = [], n = 4, rnd = Math.random }) {
  const cs = RD.to5m(bars, t0); if (cs.length < 26) return [];
  const pre = news.filter(x => x.t < t0), pos = pre.filter(x => x.tone === 'pos').length, neg = pre.filter(x => x.tone === 'neg').length;
  const day = { gap: b(gapPct, [-3, -0.5, 0.5, 3], ['gapped down 3%+', 'gapped down', 'no gap', 'gapped up', 'gapped up 3%+']) || 'gap-unknown',
    news: !pre.length ? 'no news' : pos > neg ? 'news pos' : neg > pos ? 'news neg' : 'news neutral', newsType: pre.length ? pre.at(-1).cat || 'other' : 'none',
    rvol: b(rvol, [2, 4, 8], ['rvol 1-2', 'rvol 2-4', 'rvol 4-8', 'rvol 8+']) || 'rvol-unknown', mktGap: b(spyGap, [-0.5, -0.15, 0.15, 0.5], ['spy gap down big', 'spy gap down', 'spy flat', 'spy gap up', 'spy gap up big']) || 'spy-unknown',
    fear: b(spyVol, [12, 18, 28], ['calm market', 'normal market', 'nervous market', 'panicky market']) || 'fear-unknown', regime: spyTrend || 'trend-unknown', buzz: 'buzz-unknown' };
  const sc = sec ? RD.to5m(sec, t0) : null, out = [];
  for (let i = 0; i < n; i++) {
    const k = 6 + Math.floor(rnd() * (cs.length - 12 - 7)), { mv, ...v } = BL.sees(bars, spy, t0, atr, k);
    const s1 = sc?.[k], s0 = sc?.[k - 6], sm = s1 && s0 ? s1.c / s0.c - 1 : null;
    const f = { ...v, ...day, sector: sm == null ? 'no sector' : sm > 0.0015 ? 'sector rising' : sm < -0.0015 ? 'sector falling' : 'sector flat' };
    out.push({ v: KEYS.map(x => f[x]), t: HS.map(h => outcomeH(cs, k, atr, h)), r: HS.map(h => [outcomeH(cs, k, atr, h, 1), outcomeH(cs, k, atr, h, -1)]), m: mv > 0.2 ? 1 : mv < -0.2 ? -1 : 0 });
  }
  return out;
}
export const saveSamples = (y, arr) => { try { fs.writeFileSync(SFILE(y), zlib.gzipSync(JSON.stringify(arr))); } catch {} };
const cache = new Map();
export function loadYear(y) {
  if (cache.has(y)) return cache.get(y);
  let raw = []; try { raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(SFILE(y)))); } catch {}
  const s = raw.map(x => ({ f: Object.fromEntries(KEYS.map((k, i) => [k, x.v[i]])), t: x.t, r: x.r, m: x.m })); cache.set(y, s); return s;
}
// pair-odds tables per year and horizon (additive, so "all other years" = sum)
const tcache = new Map();
function tableOf(y, hi) { const key = y + ':' + hi; if (!tcache.has(key)) tcache.set(key, BL.learn(loadYear(y).map(s => ({ f: s.f, truth: s.t[hi] })))); return tcache.get(key); }
const sum = ts => { const o = {}; for (const t of ts) for (const [k, v] of Object.entries(t)) { const x = (o[k] ||= { up: 0, down: 0 }); x.up += v.up; x.down += v.down; } return o; };
async function grade(table, samples, hi, P) {
  let calls = 0, hit = 0, R = 0, n = 0;
  for (let i = 0; i < samples.length; i++) { const s = samples[i], c = BL.call(table, s.f, P); if (c) { const tr = s.t[hi]; if (tr !== 'flat') { calls++; if (c.dir === tr) hit++; } R += s.r[hi][c.dir === 'up' ? 0 : 1]; n++; } if (i % 3000 === 2999) await yieldNow(); }
  return { calls, acc: calls ? Math.round(hit / calls * 1000) / 10 : 0, avgR: n ? Math.round(R / n * 100) / 100 : 0 };
}
// leave-one-year-out score of one configuration over the given years
export async function score(cfg, ys) {
  const hi = HS.indexOf(cfg.h), per = {};
  for (const y of ys) {
    const train = ys.filter(x => x !== y); let P = cfg.P;
    if (cfg.why && train.length >= 3) {   // tune with the why on the newest training year, odds from the rest
      const tuneY = train.at(-1), tbl = sum(train.filter(x => x !== tuneY).map(x => tableOf(x, hi)));
      P = (await BL.loop(tbl, loadYear(tuneY).map(s => ({ f: s.f, truth: s.t[hi], Rup: s.r[hi][0], Rdn: s.r[hi][1], mom: null })), { target: 99, rounds: 6, minCalls: 100 })).P;
    }
    per[y] = { ...(await grade(sum(train.map(x => tableOf(x, hi))), loadYear(y), hi, P)), P };
  }
  const v = Object.values(per), ok = v.every(x => x.calls >= 100);
  return { per, minAcc: ok ? Math.min(...v.map(x => x.acc)) : 0, avgAcc: Math.round(v.reduce((a, x) => a + x.acc, 0) / v.length * 10) / 10, avgR: Math.round(v.reduce((a, x) => a + x.avgR, 0) / v.length * 100) / 100, calls: v.reduce((a, x) => a + x.calls, 0), ok };
}
let seed = Date.now() % 2147483647 || 1; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647), pick = a => a[Math.floor(rnd() * a.length)];
export function nextConfig() {
  const keep = KEYS.filter(() => rnd() < 0.6), drop = rnd() < 0.35 ? [] : KEYS.filter(k => !keep.includes(k));
  return { h: pick(HS), why: rnd() < 0.15, P: { mode: pick(['best', 'vote']), minP: pick([0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.75]), minN: pick([40, 80, 150, 300, 600]), abstain: [], drop: drop.length >= KEYS.length - 2 ? [] : drop } };
}
export const state = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return { tested: 0, board: [], finalChecks: 0, best: null, proven: null, years: [] }; } };
const save = st => { try { fs.writeFileSync(SF, JSON.stringify(st)); } catch {} };
const desc = c => `${NAMES[c.h]} ahead, ${c.P.mode === 'best' ? 'strongest read' : '5-read blend'}, ${Math.round(c.P.minP * 1000) / 10}%+ sure, ${c.P.minN}+ examples${c.P.drop.length ? `, without ${c.P.drop.join('/')}` : ''}${c.why ? ', why-tuned' : ''}`;
// the endless loop
export async function forever({ paused = () => false, log = () => {}, tell = async () => {} } = {}) {
  for (;;) {
    try {
      if (paused()) { await sleep(60e3); continue; }
      const all = years(), ys = all.filter(y => y !== LOCK); if (ys.length < 3) { await sleep(10 * 60e3); continue; }
      const st = state(); if (String(st.years) !== String(all)) { st.years = all; st.rescored = false; }
      if (!st.rescored && st.board.length) { for (const e of st.board) Object.assign(e, await score(e.cfg, ys)); st.board.sort((a, b) => b.minAcc - a.minAcc || b.avgR - a.avgR); st.rescored = true; save(st); log(`hunt: rescored on ${ys.join(',')}`); }
      st.rescored = true;
      const cfg = nextConfig(), r = await score(cfg, ys); st.tested++;
      if (r.ok) { st.board.push({ cfg, d: desc(cfg), ...r, per: Object.fromEntries(Object.entries(r.per).map(([y, x]) => [y, { acc: x.acc, calls: x.calls, avgR: x.avgR }])) }); st.board.sort((a, b) => b.minAcc - a.minAcc || b.avgR - a.avgR); st.board = st.board.slice(0, 25); }
      const top = st.board[0];
      if (top && all.includes(LOCK) && top.minAcc >= 60 && top.minAcc > (st.best?.minAcc || 0) + 0.5) {   // exam on the locked year only for a new best
        const hi = HS.indexOf(top.cfg.h), fin = await grade(sum(ys.map(x => tableOf(x, hi))), loadYear(LOCK), hi, top.cfg.P); st.finalChecks++;
        st.best = { d: top.d, cfg: top.cfg, minAcc: top.minAcc, per: top.per, final: fin, at: new Date().toISOString(), tested: st.tested };
        log(`hunt: new best ${top.minAcc}% worst year; locked ${LOCK}: ${fin.acc}% on ${fin.calls}`);
        if (top.minAcc >= PROVEN_MIN && fin.acc >= PROVEN_MIN && fin.calls >= 100 && !st.proven) { st.proven = st.best; await tell('Elis: PROVEN read', text(st)); }
      }
      if (st.tested % 100 === 0) log(`hunt: ${st.tested} configurations tested on ${ys.length} years; best worst-year ${top ? top.minAcc + '%' : 'n/a'}`);
      save(st); await yieldNow();
    } catch (e) { log('hunt error: ' + e.message); await sleep(60e3); }
  }
}
export function text(st = state()) {
  const t = st.board?.[0];
  return `Hunt: ${st.tested} configurations tested leave-one-year-out on ${(st.years || []).filter(y => y !== LOCK).join(', ') || 'no years yet'} (${LOCK} locked as the final exam, checked ${st.finalChecks} times).\n`
    + (t ? `Best so far: ${t.d}. Worst unseen year ${t.minAcc}% right, average ${t.avgAcc}%, ${t.avgR >= 0 ? '+' : ''}${t.avgR}R/trade; by year ${Object.entries(t.per).map(([y, x]) => `${y} ${x.acc}% (${x.calls})`).join(', ')}.\n` : 'No configuration with enough calls yet.\n')
    + (st.best?.final ? `Locked ${LOCK} exam for the best: ${st.best.final.acc}% on ${st.best.final.calls} calls, ${st.best.final.avgR >= 0 ? '+' : ''}${st.best.final.avgR}R/trade.\n` : '')
    + (st.proven ? `PROVEN: ${st.proven.d}` : `Goal ${TARGET}%: not reached; still looping.`);
}
