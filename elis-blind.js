// Elis BLIND CHART TEST (Owner 2026-11-23: "test it against blind charts and give me the feedback").
// Elis is shown a real chart (stock + SPY minute bars) only up to a random moment, calls the next 30 minutes UP / DOWN / no call,
// then the hidden part is revealed and graded. Elis learns its chart read from the first 70% of stored sessions; it is graded only
// on the last 30%, which it never saw. Baselines: coin flip, "keep going" (momentum), "always up".
import fs from 'node:fs';
import path from 'node:path';
import * as RD from './elis-read.js';
import * as E from './elis.js';
import { readJournal, loadDayBars } from './elis-learn.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'blind-report.json');
export const BLIND_REV = 1;
export const lastReport = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return null; } };
const yieldNow = () => new Promise(r => setImmediate(r));
const H = 6, STOP = 0.4, COST = 0.05, FLAT = 0.1;
let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const b5 = (x, c, n) => { for (let i = 0; i < c.length; i++) if (x < c[i]) return n[i]; return n[c.length]; };

// what Elis can see at the moment: chart read + 30-min move + VWAP + market + time
export function sees(bars, spyBars, t0, atr, k) {
  const cs = RD.to5m(bars, t0), T = cs[k].t + 300e3, vis = bars.filter(b => b.t < T), rd = RD.read(vis, 'long', t0, atr);
  const sp = spyBars ? RD.to5m(spyBars, t0) : [], s = sp[k], s6 = sp[k - 6], sm = s && s6 ? s.c / s6.c - 1 : 0, mv = (cs[k].c - cs[k - 6].c) / atr;
  return { move: b5(mv, [-0.6, -0.2, 0.2, 0.6], ['dropping hard', 'dropping', 'flat', 'rising', 'rising hard']), candle: rd.feat.candle, structure: rd.feat.structure, vwap: rd.feat.vwap === 'vwap-with' ? 'above VWAP' : 'below VWAP',
    volume: rd.feat.volume, market: sm > 0.0015 ? 'market rising' : sm < -0.0015 ? 'market falling' : 'market flat', time: b5((k + 1) * 5, [60, 150, 270], ['first hour', 'late morning', 'midday', 'afternoon']), pattern: rd.patterns.at(-1) || 'none', mv };
}
// the hidden answer: next 30 min, plus the trade result if Elis had acted on its call
export function outcome(cs, k, atr, call) {
  const e = cs[k].c, end = cs[k + H].c, d = (end - e) / atr, truth = d > FLAT ? 'up' : d < -FLAT ? 'down' : 'flat';
  let R = null; if (call) { const dir = call === 'up' ? 1 : -1, risk = STOP * atr; for (let j = k + 1; j <= k + H; j++) { const c = cs[j]; if (dir > 0 ? c.l <= e - risk : c.h >= e + risk) { R = -1 - COST; break; } if (j === k + H) R = dir * (c.c - e) / risk - COST; } }
  return { truth, R };
}
const KEYS = ['move', 'candle', 'structure', 'vwap', 'volume', 'market', 'time', 'pattern'];
const pairsOf = f => { const out = []; for (let a = 0; a < KEYS.length; a++) for (let b = a + 1; b < KEYS.length; b++) out.push(`${KEYS[a]}=${f[KEYS[a]]} & ${KEYS[b]}=${f[KEYS[b]]}`); return out; };
// Elis's call: the most one-sided pattern it learned (>= minP, enough examples), else no call
export function call(table, f, { minN = 80, minP = 0.55 } = {}) {
  let best = null; for (const k of pairsOf(f)) { const s = table[k]; if (!s || s.up + s.down < minN) continue; const p = s.up / (s.up + s.down), conf = Math.max(p, 1 - p); if (conf >= minP && (!best || conf > best.conf)) best = { dir: p >= 0.5 ? 'up' : 'down', conf, why: k, n: s.up + s.down }; }
  return best;
}
export async function run({ perDay = 4, progress = null, shouldStop = () => false } = {}) {
  const J = readJournal().filter(r => r.atr > 0), days = [...new Set(J.map(r => r.date))].sort(); if (days.length < 40) return { skipped: `only ${days.length} stored sessions` };
  const cut = days[Math.floor(days.length * 0.7)], table = {}, test = []; let seen = 0;
  for (const d of days) {
    if (shouldStop()) return { paused: true };
    const barsOf = loadDayBars(d), spy = barsOf(d, 'SPY'), t0 = E.etMs(d, 570), learnDay = d < cut;
    for (const r of J.filter(x => x.date === d)) {
      const bars = barsOf(d, r.sym); if (!bars || bars.length < 120) continue; const cs = RD.to5m(bars, t0); if (cs.length < 20) continue;
      for (let i = 0; i < perDay; i++) {
        const k = 6 + Math.floor(rnd() * (cs.length - H - 7)); const f = sees(bars, spy, t0, r.atr, k), o = outcome(cs, k, r.atr, null); seen++;
        if (learnDay) { if (o.truth !== 'flat') for (const key of pairsOf(f)) { const s = (table[key] ||= { up: 0, down: 0 }); s[o.truth]++; } }
        else { const c = call(table, f), oc = outcome(cs, k, r.atr, c?.dir), mom = f.mv > 0.2 ? 'up' : f.mv < -0.2 ? 'down' : null;
          test.push({ date: d, sym: r.sym, truth: oc.truth, call: c?.dir || null, conf: c?.conf, why: c?.why, R: oc.R, mom, momR: mom ? outcome(cs, k, r.atr, mom).R : null }); }
      }
    }
    if (seen % 4000 < perDay * 20) progress?.(`blind test: ${d}, ${seen} charts`); await yieldNow();
  }
  const r = grade(test); r.learnedOn = `${days[0]} to ${cut}`; r.testedOn = `${cut} to ${days.at(-1)}`; r.at = new Date().toISOString(); r.rev = BLIND_REV;
  try { fs.writeFileSync(SF, JSON.stringify(r)); } catch {} return r;
}
const pc = (a, b) => (b ? Math.round(a / b * 1000) / 10 : 0), avg = a => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length * 100) / 100 : 0);
export function grade(test) {
  const moved = test.filter(t => t.truth !== 'flat'), calls = test.filter(t => t.call), callsMoved = calls.filter(t => t.truth !== 'flat');
  const hit = callsMoved.filter(t => t.call === t.truth).length, se = callsMoved.length ? Math.sqrt(0.25 / callsMoved.length) * 100 : 0;
  const mom = test.filter(t => t.mom && t.truth !== 'flat'), up = moved.filter(t => t.truth === 'up').length;
  const byConf = {}; for (const t of callsMoved) { const b = t.conf >= 0.65 ? '65%+' : t.conf >= 0.6 ? '60-65%' : '55-60%'; (byConf[b] ||= { n: 0, hit: 0 }).n++; if (t.call === t.truth) byConf[b].hit++; }
  const whyTop = {}; for (const t of callsMoved) { const w = (whyTop[t.why] ||= { n: 0, hit: 0 }); w.n++; if (t.call === t.truth) w.hit++; }
  return { charts: test.length, flatPct: pc(test.length - moved.length, test.length), callPct: pc(calls.length, test.length), accuracy: pc(hit, callsMoved.length), plusMinus: Math.round(se * 1.96 * 10) / 10, calls: callsMoved.length,
    tradeAvgR: avg(calls.map(t => t.R).filter(x => x != null)), tradeWinPct: pc(calls.filter(t => t.R > 0).length, calls.length),
    momentumAccuracy: pc(mom.filter(t => t.mom === t.truth).length, mom.length), momentumAvgR: avg(test.map(t => t.momR).filter(x => x != null)), upPct: pc(up, moved.length),
    byConfidence: Object.fromEntries(Object.entries(byConf).map(([k, v]) => [k, { calls: v.n, accuracy: pc(v.hit, v.n) }])),
    bestReads: Object.entries(whyTop).filter(([, v]) => v.n >= 40).map(([k, v]) => ({ read: k, calls: v.n, accuracy: pc(v.hit, v.n) })).sort((a, b) => b.accuracy - a.accuracy).slice(0, 5) };
}
export function text(r) {
  if (!r || r.skipped) return r?.skipped || 'no blind test yet';
  return `Blind chart test: ${r.charts.toLocaleString()} charts Elis never saw (${r.testedOn}); it learned from ${r.learnedOn}. Each chart cut at a random moment; Elis calls the next 30 min.\n`
    + `- Calls made on ${r.callPct}% of charts (${r.flatPct}% went nowhere either way).\n`
    + `- Accuracy on its calls: ${r.accuracy}% (+/-${r.plusMinus}) vs 50% coin flip. ${Object.entries(r.byConfidence).map(([k, v]) => `When ${k} sure: ${v.accuracy}% over ${v.calls}`).join('; ')}.\n`
    + `- If it had traded every call (stop 0.4x range, 30 min, costs in): ${r.tradeWinPct}% wins, ${r.tradeAvgR >= 0 ? '+' : ''}${r.tradeAvgR}R avg per trade.\n`
    + `- Baselines: "keep going" ${r.momentumAccuracy}% (${r.momentumAvgR >= 0 ? '+' : ''}${r.momentumAvgR}R), "always up" ${r.upPct}%.\n`
    + (r.bestReads.length ? `- Best reads: ${r.bestReads.slice(0, 3).map(b => `${b.read} ${b.accuracy}% (${b.calls})`).join('; ')}.` : '');
}
