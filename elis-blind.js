// Elis BLIND CHART TEST (Owner 2026-11-23: "test it against blind charts and give me the feedback").
// Elis is shown a real chart (stock + SPY minute bars) only up to a random moment, calls the next 30 minutes UP / DOWN / no call,
// then the hidden part is revealed and graded. Elis learns its chart read from the first 70% of stored sessions; it is graded only
// on the last 30%, which it never saw. Baselines: coin flip, "keep going" (momentum), "always up".
import fs from 'node:fs';
import path from 'node:path';
import * as RD from './elis-read.js';
import * as E from './elis.js';
import { readJournal, loadDayBars } from './elis-learn.js';
import * as X from './elis-explain.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'blind-report.json');
export const BLIND_REV = 3;
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
// the why variables known that morning (journal + enrich context), in absolute terms (not relative to a side)
export function dayFeatures(r) {
  const g = r.gapPct || 0, rv = r.rvol || 0, x = r.ctx || {};
  return { gap: g <= -3 ? 'gapped down 3%+' : g < -0.5 ? 'gapped down' : g < 0.5 ? 'no gap' : g < 3 ? 'gapped up' : 'gapped up 3%+', news: r.tone && r.tone !== 'none' ? `news ${r.tone}` : r.news ? 'news neutral' : 'no news',
    newsType: r.cat || 'none', rvol: rv < 2 ? 'rvol 1-2' : rv < 4 ? 'rvol 2-4' : rv < 8 ? 'rvol 4-8' : 'rvol 8+', mktGap: x.mktGap || 'spy-unknown', fear: x.fear || 'fear-unknown', regime: x.regime || 'trend-unknown', sector: x.sector || 'sector-unknown', buzz: x.buzz || 'buzz-unknown' };
}
export const DAY_KEYS = ['gap', 'news', 'newsType', 'rvol', 'mktGap', 'fear', 'regime', 'sector', 'buzz', 'trend5d', 'range20', 'sma20', 'prevDay', 'dow', 'openCandle', 'newsBy', 'newsByHour', 'fearMove'];   // later factors are null on old samples and simply skipped
const ALL = [...KEYS, ...DAY_KEYS];
const PAIRS = []; for (let a = 0; a < ALL.length; a++) for (let b = a + 1; b < ALL.length; b++) PAIRS.push([ALL[a], ALL[b]]);
const pk = (f, [a, b]) => `${a}=${f[a]} & ${b}=${f[b]}`;
const pairsOf = (f, keys = KEYS) => PAIRS.filter(([a, b]) => keys.includes(a) && keys.includes(b)).map(p => pk(f, p));
export function learn(samples) { const t = {}; for (const s of samples) if (s.truth !== 'flat') for (const p of PAIRS) { if (s.f[p[0]] == null || s.f[p[1]] == null) continue; const k = pk(s.f, p); (t[k] ||= { up: 0, down: 0 })[s.truth]++; } return t; }
// Elis's call under settings P: 'best' = most one-sided learned read; 'vote' = blend of the 5 strongest reads (shrunk by sample size).
// abstain = conditions the why found its calls fail in; drop = variables that only add noise
export const BASE = { mode: 'best', minP: 0.55, minN: 80, abstain: [], drop: [] };
export function call(table, f, P = {}) {
  P = { ...BASE, ...P }; if (P.abstain.some(r => f[r.k] === r.v)) return null;
  const keys = ALL.filter(k => !P.drop.includes(k) && f[k] != null), ev = [];
  for (const k of pairsOf(f, keys)) { const s = table[k]; if (!s || s.up + s.down < P.minN) continue; const n = s.up + s.down, p = s.up / n; ev.push({ k, n, p, lo: Math.log((s.up + 1) / (s.down + 1)) * n / (n + 200) }); }
  if (!ev.length) return null;
  if (P.mode === 'best') { const b = ev.reduce((a, e) => (Math.max(e.p, 1 - e.p) > Math.max(a.p, 1 - a.p) ? e : a)); const conf = Math.max(b.p, 1 - b.p); return conf >= P.minP ? { dir: b.p >= 0.5 ? 'up' : 'down', conf, why: b.k, n: b.n } : null; }
  const top = ev.sort((a, b) => Math.abs(b.lo) - Math.abs(a.lo)).slice(0, 5), x = top.reduce((a, e) => a + e.lo, 0) / top.length, p = 1 / (1 + Math.exp(-x)), conf = Math.max(p, 1 - p);
  return conf >= P.minP ? { dir: x >= 0 ? 'up' : 'down', conf, why: top[0].k, n: top[0].n } : null;
}
export function evaluate(table, samples, P) {
  const test = samples.map(s => { const c = call(table, s.f, P); return { truth: s.truth, call: c?.dir || null, conf: c?.conf, why: c?.why, R: c ? (c.dir === 'up' ? s.Rup : s.Rdn) : null, mom: s.mom, momR: s.mom ? (s.mom === 'up' ? s.Rup : s.Rdn) : null, f: s.f }; });
  return { test, g: grade(test) };
}
// THE LOOP (Owner: "keep testing, assess the why, use the why to adjust predictions and retest, loop until closer to 70%").
// Learn on the first 50% of sessions, tune on the next 25%, final grade on the last 25% (never used while tuning).
// Each round: grade on the tune set, run the WHY on hits vs misses, turn the worst conditions into "don't call here" rules,
// try dropping noisy variables, the blend vs best-read mode and stricter/looser confidence; keep a change only if tune accuracy
// rises with enough calls left. Stop at 70% on the tune set or when nothing helps; then grade once on the untouched final set.
export async function loop(table, tune, { target = 70, rounds = 30, minCalls = 150, log = () => {} } = {}) {
  let P = { ...BASE }, cur = evaluate(table, tune, P).g; const steps = [{ change: 'start', acc: cur.accuracy, calls: cur.calls }];
  const ok = g => g.calls >= minCalls;
  for (let r = 0; r < rounds && cur.accuracy < target; r++) {
    const { test } = evaluate(table, tune, P), called = test.filter(t => t.call && t.truth !== 'flat').map(t => ({ ...t.f, side: t.call, sure: t.conf >= 0.65 ? '65%+' : t.conf >= 0.6 ? '60-65%' : '55-60%', R: t.call === t.truth ? 1 : -1 }));
    const why = X.explain(called, [...ALL.map(k => ({ name: k, key: k })), { name: 'side', key: 'side' }, { name: 'sure', key: 'sure' }], { minN: 40, z: 1.5 });
    const cands = [];
    for (const f of why.findings.filter(x => !x.better)) if (ALL.includes(f.dim)) cands.push([`don't call when ${f.dim} = ${f.value} (why: ${f.winPct}% right over ${f.n})`, { ...P, abstain: [...P.abstain, { k: f.dim, v: f.value }] }]);
    for (const k of ALL) if (!P.drop.includes(k)) cands.push([`stop using ${k}`, { ...P, drop: [...P.drop, k] }]);
    for (const d of [0.02, 0.05, -0.02]) { const m = Math.round((P.minP + d) * 100) / 100; if (m >= 0.52 && m <= 0.85) cands.push([`call only when ${Math.round(m * 100)}%+ sure`, { ...P, minP: m }]); }
    for (const n of [40, 150, 300]) if (n !== P.minN) cands.push([`need ${n}+ past examples`, { ...P, minN: n }]);
    cands.push([`switch to ${P.mode === 'best' ? 'blend of the 5 strongest reads' : 'single strongest read'}`, { ...P, mode: P.mode === 'best' ? 'vote' : 'best' }]);
    let best = null; for (const [name, Q] of cands) { const g = evaluate(table, tune, Q).g; if (ok(g) && g.accuracy > cur.accuracy + 0.3 && (!best || g.accuracy > best.g.accuracy)) best = { name, Q, g }; await yieldNow(); }
    if (!best) { steps.push({ change: 'nothing improved; stop', acc: cur.accuracy, calls: cur.calls }); break; }
    P = best.Q; cur = best.g; steps.push({ change: best.name, acc: cur.accuracy, calls: cur.calls }); log(`blind loop round ${r + 1}: ${best.name} -> ${cur.accuracy}% on ${cur.calls} calls`);
  }
  return { P, tune: cur, steps };
}
export async function run({ perDay = 4, progress = null, shouldStop = () => false } = {}) {
  const J = readJournal().filter(r => r.atr > 0), days = [...new Set(J.map(r => r.date))].sort(); if (days.length < 60) return { skipped: `only ${days.length} stored sessions` };
  const c1 = days[Math.floor(days.length * 0.5)], c2 = days[Math.floor(days.length * 0.75)], S = { learn: [], tune: [], final: [] }; let seen = 0; seed = 7;
  const byDay = new Map(); for (const r of J) (byDay.get(r.date) || byDay.set(r.date, []).get(r.date)).push(r);
  for (const d of days) {
    if (shouldStop()) return { paused: true };
    const barsOf = loadDayBars(d), spy = barsOf(d, 'SPY'), t0 = E.etMs(d, 570), part = d < c1 ? 'learn' : d < c2 ? 'tune' : 'final';
    for (const r of byDay.get(d) || []) {
      const bars = barsOf(d, r.sym); if (!bars || bars.length < 120) continue; const cs = RD.to5m(bars, t0); if (cs.length < 20) continue; const df = dayFeatures(r);
      for (let i = 0; i < perDay; i++) {
        const k = 6 + Math.floor(rnd() * (cs.length - H - 7)), v = sees(bars, spy, t0, r.atr, k), o = outcome(cs, k, r.atr, null); seen++;
        const { mv, ...f } = v; S[part].push({ d, f: { ...f, ...df }, truth: o.truth, Rup: outcome(cs, k, r.atr, 'up').R, Rdn: outcome(cs, k, r.atr, 'down').R, mom: mv > 0.2 ? 'up' : mv < -0.2 ? 'down' : null });
      }
    }
    if (seen % 4000 < perDay * 20) progress?.(`blind test: ${d}, ${seen} charts`); await yieldNow();
  }
  const table = learn(S.learn), before = evaluate(table, S.final, BASE).g;
  const L2 = await loop(table, S.tune, { log: m => progress?.(m) });
  const after = evaluate(table, S.final, L2.P).g;
  // last step: relearn the odds on learn+tune with the tuned settings and grade the final set once more (more data, same untouched test)
  const table2 = learn([...S.learn, ...S.tune]), after2 = evaluate(table2, S.final, L2.P).g;
  const main = after2.calls >= 100 ? after2 : after;   // relearning on more data shrinks confidence; if it stops calling, grade with the table the settings were tuned on
  const r = { ...main, before, afterTuneOnly: after, afterRelearn: after2, tuneAcc: L2.tune.accuracy, steps: L2.steps, settings: L2.P, learnedOn: `${days[0]} to ${c2}`, tunedOn: `${c1} to ${c2}`, testedOn: `${c2} to ${days.at(-1)}`, days: days.length, at: new Date().toISOString(), rev: BLIND_REV };
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
  const sg = x => (x >= 0 ? '+' : '') + x;
  return `Blind chart loop: learned ${r.learnedOn}, tuned with the why on ${r.tunedOn}, final grade on ${r.testedOn} (never touched while tuning).\n`
    + `- Before tuning: ${r.before.accuracy}% right on ${r.before.calls} calls (${sg(r.before.tradeAvgR)}R/trade).\n`
    + `- Tuning (${r.steps.length - 1} rounds): ${r.steps.slice(1).map(s => `${s.change} -> ${s.acc}%`).join('; ')}. Tune set reached ${r.tuneAcc}%.\n`
    + `- FINAL (unseen): ${r.accuracy}% (+/-${r.plusMinus}) right on ${r.calls} calls (calls on ${r.callPct}% of charts), ${r.tradeWinPct}% winning trades, ${sg(r.tradeAvgR)}R/trade. Coin flip 50%, "always up" ${r.upPct}%.\n`
    + (r.tuneAcc - r.accuracy > 4 ? `- The tune-set gain mostly did not carry over to unseen charts (memorized noise).` : `- The tune-set result carried over to unseen charts.`);
}
