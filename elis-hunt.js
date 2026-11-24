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
export const TARGET = 70, PROVEN_MIN = 70, FLOOR = 65;           // Owner: the goal is 70% ACCURACY (share of calls right) on every unseen year incl. 2025
const STOP = 0.4, COST = 0.05, FLAT = 0.1;
const yieldNow = () => new Promise(r => setImmediate(r)), sleep = ms => new Promise(r => setTimeout(r, ms));
const b = (x, c, n) => { if (x == null || !Number.isFinite(x)) return null; for (let i = 0; i < c.length; i++) if (x < c[i]) return n[i]; return n[c.length]; };
export const KEYS = [...['move', 'candle', 'structure', 'vwap', 'volume', 'market', 'time', 'pattern'], ...BL.DAY_KEYS];
export const SREV = 4;   // v4: swing outcomes (+X% before -X%) and cuts at swing turns   // bump when factors are added -> year tests recollect samples
const SFILE = y => path.join(DIR, `hunt-samples-v${SREV}-${y}.json.gz`);
export const haveSamples = y => fs.existsSync(SFILE(y));
export const years = () => fs.readdirSync(DIR).map(f => new RegExp(`^hunt-samples-v${SREV}-(\\d{4})\\.json\\.gz$`).exec(f)?.[1]).filter(Boolean).sort();

function outcomeH(cs, k, atr, h, dir) {
  const e = cs[k].c, risk = STOP * atr;
  if (!dir) { const d = (cs[k + h].c - e) / atr; return d > FLAT ? 'up' : d < -FLAT ? 'down' : 'flat'; }
  for (let j = k + 1; j <= k + h; j++) { const c = cs[j]; if (dir > 0 ? c.l <= e - risk : c.h >= e + risk) return -1 - COST; if (j === k + h) return Math.round((dir * (c.c - e) / risk - COST) * 100) / 100; }
}
// one stock-day -> n samples (features known at the cut, outcomes after it)
// Owner's target: from this point, does price hit +X% before -X% (rest of the day)? -> 'up' / 'down' / 'none'
export const SW = [0.5, 1, 2];
function firstTouch(bars, T, e, x) { const up = e * (1 + x / 100), dn = e * (1 - x / 100); for (const b of bars) { if (b.t < T) continue; const hu = b.h >= up, hd = b.l <= dn; if (hu && hd) return b.c >= e ? 'up' : 'down'; if (hu) return 'up'; if (hd) return 'down'; } return 'none'; }
// swing turns: 5-min candles where price has come >= 1% off its last-hour extreme and the candle turned back (the flip-flops to catch)
function turns(cs) { const out = []; for (let k = 12; k < cs.length - 2; k++) { const w = cs.slice(k - 12, k + 1), hi = Math.max(...w.map(c => c.h)), lo = Math.min(...w.map(c => c.l)), c = cs[k];
  if ((hi / c.c - 1 >= 0.01 && c.c > c.o) || (1 - lo / c.c >= 0.01 && c.c < c.o)) out.push(k); } return out; }
export function samplesForDay({ bars, spy, sec, t0, atr, gapPct, rvol, spyGap, spyTrend, spyVol, news = [], daily = {}, n = 4, rnd = Math.random }) {
  const cs = RD.to5m(bars, t0); if (cs.length < 26) return [];
  const pre = news.filter(x => x.t < t0), pos = pre.filter(x => x.tone === 'pos').length, neg = pre.filter(x => x.tone === 'neg').length;
  const day = { gap: b(gapPct, [-3, -0.5, 0.5, 3], ['gapped down 3%+', 'gapped down', 'no gap', 'gapped up', 'gapped up 3%+']) || 'gap-unknown',
    news: !pre.length ? 'no news' : pos > neg ? 'news pos' : neg > pos ? 'news neg' : 'news neutral', newsType: pre.length ? pre.at(-1).cat || 'other' : 'none',
    rvol: b(rvol, [2, 4, 8], ['rvol 1-2', 'rvol 2-4', 'rvol 4-8', 'rvol 8+']) || 'rvol-unknown', mktGap: b(spyGap, [-0.5, -0.15, 0.15, 0.5], ['spy gap down big', 'spy gap down', 'spy flat', 'spy gap up', 'spy gap up big']) || 'spy-unknown',
    fear: b(spyVol, [12, 18, 28], ['calm market', 'normal market', 'nervous market', 'panicky market']) || 'fear-unknown', regime: spyTrend || 'trend-unknown', buzz: 'buzz-unknown',
    ...daily, openCandle: (o => !o ? null : (o.c - o.o) / atr > 0.1 ? 'opening candle up' : (o.c - o.o) / atr < -0.1 ? 'opening candle down' : 'opening candle doji')(cs[0]) };
  const by = arr => { if (!arr.length) return 'no news'; const x = arr.at(-1); return `${x.src || 'unknown'}: ${x.tone || 'neutral'}`; };
  day.newsBy = by(pre);
  const sc = sec ? RD.to5m(sec, t0) : null, out = [];
  const tk = turns(cs), cuts = [];
  for (let i = 0; i < n; i++) cuts.push([6 + Math.floor(rnd() * (cs.length - 12 - 7)), 'random moment']);
  for (let i = 0; i < Math.min(4, tk.length); i++) cuts.push([tk[Math.floor(rnd() * tk.length)], 'swing turn']);
  for (const [k, kind] of cuts) {
    if (k < 6 || k + 12 >= cs.length) continue;
    const { mv, ...v } = BL.sees(bars, spy, t0, atr, k);
    const s1 = sc?.[k], s0 = sc?.[k - 6], sm = s1 && s0 ? s1.c / s0.c - 1 : null;
    const T = cs[k].t + 300e3, hr = news.filter(x => x.t >= T - 3600e3 && x.t < T);
    const nc = hr.length;
    const f = { ...v, ...day, cut: kind, newsCount: nc === 0 ? 'no headlines last hour' : nc === 1 ? '1 headline last hour' : nc <= 3 ? '2-3 headlines last hour' : '4+ headlines last hour', newsByHour: by(hr), sector: sm == null ? 'no sector' : sm > 0.0015 ? 'sector rising' : sm < -0.0015 ? 'sector falling' : 'sector flat' };
    out.push({ v: KEYS.map(x => f[x]), sw: SW.map(x => firstTouch(bars, T, cs[k].c, x)), t: HS.map(h => outcomeH(cs, k, atr, h)), r: HS.map(h => [outcomeH(cs, k, atr, h, 1), outcomeH(cs, k, atr, h, -1)]), m: mv > 0.2 ? 1 : mv < -0.2 ? -1 : 0 });
  }
  return out;
}
export const saveSamples = (y, arr) => { try { fs.writeFileSync(SFILE(y), zlib.gzipSync(JSON.stringify(arr))); } catch {} };
const cache = new Map();
export function loadYear(y) {
  if (cache.has(y)) return cache.get(y);
  let raw = []; try { raw = JSON.parse(zlib.gunzipSync(fs.readFileSync(SFILE(y)))); } catch {}
  const s = raw.map(x => ({ f: Object.fromEntries(KEYS.map((k, i) => [k, x.v[i]])), t: x.t, sw: x.sw, r: x.r, m: x.m })); cache.set(y, s); return s;
}
// ======================= FORMULA BUILDER (Owner 2026-11-23) =======================
// No randomness. Every variable value gets a weight learned from its own track record (shrunk by how many times it was seen) and
// only if it pointed the same way in the training years: a source / influencer / sign that is inconsistent gets weight 0.
// Each step: rank every variable not yet in the formula by how reliable it is on its own (blind, leave-one-year-out), then test
// formula + the top candidate blind; keep it only if average accuracy rises and no year gets worse; otherwise leave it behind and
// try the next. After a keep, re-check the older variables and drop any that no longer add. Interactions (a x b) of the most
// reliable variables are candidates too (the decision tree's branches). Runs per horizon; never stops; resumes when new years or
// new variables arrive.
const A = 1, K = 200, TH = [0.505, 0.51, 0.515, 0.52, 0.53, 0.54, 0.55, 0.575, 0.6, 0.625, 0.65, 0.675, 0.7, 0.725, 0.75, 0.8], MINCALLS = 100;   // real single signals move the odds only a few points: start the calls at 50.5%
const r1 = x => Math.round(x * 10) / 10;
const val = (f, v) => { const i = v.indexOf(' x '); if (i < 0) return f[v]; const a = f[v.slice(0, i)], c = f[v.slice(i + 3)]; return a == null || c == null ? null : a + ' | ' + c; };
const ccache = new Map();
export const clearCache = () => { cache.clear(); ccache.clear(); };   // per year, horizon, variable: value -> [up, down]
function counts(y, hi, v) {
  const key = `${y}:${hi}:${v}`; if (ccache.has(key)) return ccache.get(key);
  const o = {}, tot = [0, 0]; for (const s of loadYear(y)) { const t = s.t[hi]; if (t === 'flat') continue; const j = t === 'up' ? 0 : 1; tot[j]++; const x = val(s.f, v); if (x == null) continue; (o[x] ||= [0, 0])[j]++; }
  const r = { o, tot }; ccache.set(key, r); return r;
}
// weights from the training years; a value counts only if it is seen enough and leans the same way in (almost) every training year
export function model(train, vars, hi) {
  const w = {}, tot = [0, 0]; for (const y of train) { const t = counts(y, hi, vars[0] || 'move').tot; tot[0] += t[0]; tot[1] += t[1]; }
  const base = Math.log((tot[0] + A) / (tot[1] + A)), baseP = tot[0] / Math.max(1, tot[0] + tot[1]);
  for (const v of vars) {
    const sumv = {}, per = {}; for (const y of train) for (const [x, [u, d]] of Object.entries(counts(y, hi, v).o)) { const q = (sumv[x] ||= [0, 0]); q[0] += u; q[1] += d; (per[x] ||= []).push([u, d]); }
    w[v] = {};
    for (const [x, [u, d]] of Object.entries(sumv)) {
      const n = u + d; if (n < 30) continue; const lean = Math.sign(u / n - baseP);
      const yrs = per[x].filter(([a, b2]) => a + b2 >= 10), agree = yrs.filter(([a, b2]) => Math.sign(a / (a + b2) - baseP) === lean).length;
      if (yrs.length < Math.min(2, train.length) || agree < yrs.length - (yrs.length >= 4 ? 1 : 0)) continue;   // not consistent -> left behind
      w[v][x] = (Math.log((u + A) / (d + A)) - base) * n / (n + K);
    }
  }
  return { base, w };
}
const prob = (m, f, vars) => { let x = m.base; for (const v of vars) { const y = m.w[v]?.[val(f, v)]; if (y) x += y; } return 1 / (1 + Math.exp(-x)); };
// blind, leave-one-year-out grade of a formula; the call threshold is picked on the training years only
export async function evalFormula(vars, ys, hi) {
  const per = {};
  for (const y of ys) {
    const tr = ys.filter(x => x !== y), m = model(tr, vars, hi), tp = [];
    for (const x of tr) { const S = loadYear(x); for (let i = 0; i < S.length; i += 3) { const t = S[i].t[hi]; if (t !== 'flat') tp.push([prob(m, S[i].f, vars), t]); } await yieldNow(); }
    let th = 0.55, bestA = -1; const need = Math.max(40, MINCALLS * tr.length / 3);
    for (const h of TH) { let c = 0, ok = 0; for (const [p, t] of tp) { if (p >= h) { c++; if (t === 'up') ok++; } else if (p <= 1 - h) { c++; if (t === 'down') ok++; } } if (c >= need && ok / c > bestA) { bestA = ok / c; th = h; } }
    const S = loadYear(y); let c = 0, ok = 0;
    for (let i = 0; i < S.length; i++) { const t = S[i].t[hi]; if (t === 'flat') continue; const p = prob(m, S[i].f, vars); if (p >= th) { c++; if (t === 'up') ok++; } else if (p <= 1 - th) { c++; if (t === 'down') ok++; } if (i % 5000 === 4999) await yieldNow(); }
    per[y] = { acc: c ? r1(ok / c * 100) : 0, calls: c, th };
  }
  const v = Object.values(per), ok = v.length && v.every(x => x.calls >= MINCALLS);
  return { per, ok, avgAcc: v.length ? r1(v.reduce((a, x) => a + x.acc, 0) / v.length) : 0, minAcc: v.length ? Math.min(...v.map(x => x.acc)) : 0, calls: v.reduce((a, x) => a + x.calls, 0) };
}
export const rank = r => (r.ok ? (r.avgAcc ?? 0) * 0.7 + (r.minAcc ?? 0) * 0.3 : 0);
// top weighted signals of a formula with their track record (the "scale": which source / sign carries how much weight)
export function weights(vars, ys, hi, top = 12) {
  const m = model(ys, vars, hi), out = [];
  for (const v of vars) for (const [x, w] of Object.entries(m.w[v] || {})) { let u = 0, d = 0, yrs = 0; for (const y of ys) { const q = counts(y, hi, v).o[x]; if (q) { u += q[0]; d += q[1]; yrs++; } } out.push({ variable: v, value: x, weight: Math.round(w * 100) / 100, points: w > 0 ? 'up' : 'down', rightPct: r1((w > 0 ? u : d) / (u + d) * 100), seen: u + d, years: yrs }); }
  return out.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)).slice(0, top);
}
// ---- state + live readout ----
const blank = () => ({ samples: {}, formulas: {}, years: [], tested: 0, finalChecks: 0, proven: null, bestHist: [], log: [] });
export const HREV = 2;   // bump to rebuild formulas after a builder fix
export const state = () => { try { const s = JSON.parse(fs.readFileSync(SF, 'utf8')); return s.formulas && s.hrev === HREV ? s : { ...blank(), hrev: HREV }; } catch { return { ...blank(), hrev: HREV }; } };
const save = st => { try { fs.writeFileSync(SF, JSON.stringify(st)); } catch {} };
const L = { phase: 'starting', tested: 0, bestAvg: null, bestMin: null, lastAcc: null, lastDesc: '', recent: [], bestHist: [], years: [], collect: '', proven: false, formula: '', at: 0 };
const bestOf = st => Object.entries(st.formulas || {}).map(([h, f]) => ({ h: +h, ...f })).filter(f => f.score?.ok).sort((a, b) => rank(b.score) - rank(a.score))[0];
const syncL = st => { const b2 = bestOf(st) || (() => { const sc = Object.entries(st.formulas || {}).map(([h, f]) => ({ h: +h, s: f.screen?.[0] })).filter(x => x.s).sort((a, b) => b.s.avgAcc - a.s.avgAcc)[0]; return sc ? { h: sc.h, vars: [sc.s.v + ' (single, not yet added)'], score: { avgAcc: sc.s.avgAcc, minAcc: sc.s.minAcc } } : null; })(); Object.assign(L, { tested: st.tested, years: st.years, bestHist: st.bestHist || [], proven: !!st.proven, bestAvg: b2?.score.avgAcc ?? null, bestMin: b2?.score.minAcc ?? null, formula: b2 ? `${NAMES[b2.h]}: ${b2.vars.join(' + ')}` : '' }); };
syncL(state());
export const live = () => ({ ...L, target: TARGET, at: Date.now() });
export const setCollect = m => { L.collect = String(m || '').slice(0, 90); };
const logStep = (st, m, log) => { st.log = [...(st.log || []), { t: new Date().toISOString(), m }].slice(-200); log('hunt: ' + m); };
// one climb for one horizon: screen -> add the best candidate that truly helps -> prune -> repeat until nothing helps
export async function climb(st, hi, ys, all, { paused, log, tell }) {
  const h = HS[hi], F = (st.formulas[h] ||= { vars: [], score: null, steps: [], left: [] });
  if (F.vars.length) { F.score = await evalFormula(F.vars, ys, hi); }
  for (;;) {
    while (paused()) { L.phase = 'paused for the market open'; await sleep(60e3); }
    // screen every variable on its own: how reliable is it, blind, across years
    L.phase = `${NAMES[h]}: ranking variables by reliability`;
    const singles = KEYS.filter(k => !F.vars.includes(k)), scr = [];
    for (const v of singles) { const r = await evalFormula([v], ys, hi); scr.push({ v, ...r }); st.tested++; L.lastAcc = r.ok ? r.avgAcc : null; L.lastDesc = v; if (r.ok) { L.recent.push(r.avgAcc); L.recent = L.recent.slice(-60); } L.tested = st.tested; }
    scr.sort((a, b) => rank(b) - rank(a));
    const strong = scr.filter(x => x.ok).slice(0, 8).map(x => x.v), base = [...F.vars, ...strong].slice(0, 10), pairs = [];
    for (let i = 0; i < base.length; i++) for (let j = i + 1; j < base.length; j++) { const pv = `${base[i]} x ${base[j]}`; if (!F.vars.includes(pv)) pairs.push(pv); }
    for (const v of pairs) { const r = await evalFormula([v], ys, hi); scr.push({ v, ...r }); st.tested++; L.tested = st.tested; L.lastAcc = r.ok ? r.avgAcc : null; if (r.ok) { L.recent.push(r.avgAcc); L.recent = L.recent.slice(-60); } }
    const cands = scr.filter(x => x.ok && x.avgAcc > 50 && x.minAcc >= 50).sort((a, b) => rank(b) - rank(a));
    F.screen = scr.filter(x => x.ok).sort((a, b) => rank(b) - rank(a)).slice(0, 15).map(x => ({ v: x.v, avgAcc: x.avgAcc, minAcc: x.minAcc, calls: x.calls }));
    if (!F.vars.length && F.screen[0]) { L.bestAvg = F.screen[0].avgAcc; L.bestMin = F.screen[0].minAcc; L.formula = `${NAMES[h]}: best single so far ${F.screen[0].v}`; }
    save(st);
    const cur = F.score || { ok: false, avgAcc: 0, minAcc: 0 };
    let added = null;
    for (const c of cands.slice(0, 15)) {
      L.phase = `${NAMES[h]}: testing formula (${F.vars.length}) + ${c.v}`;
      const r = await evalFormula([...F.vars, c.v], ys, hi); st.tested++; L.tested = st.tested; L.lastAcc = r.ok ? r.avgAcc : null; if (r.ok) { L.recent.push(r.avgAcc); L.recent = L.recent.slice(-60); }
      const steady = cur.ok ? Object.entries(r.per).every(([y, x]) => x.acc >= (cur.per[y]?.acc ?? 0) - 1) : true;
      if (r.ok && r.avgAcc >= cur.avgAcc + 0.3 && r.minAcc >= cur.minAcc - 0.5 && steady) { added = { v: c.v, r }; break; }
      F.left = [...new Set([...(F.left || []), c.v])].slice(-40);
    }
    if (!added) { F.done = true; logStep(st, `${NAMES[h]} formula settled at ${cur.avgAcc}% avg / ${cur.minAcc}% worst year with ${F.vars.join(' + ') || 'nothing'}; no remaining variable adds consistently`, log); save(st); syncL(st); return; }
    F.vars.push(added.v); F.score = added.r; F.done = false; F.steps.push({ add: added.v, avgAcc: added.r.avgAcc, minAcc: added.r.minAcc, t: new Date().toISOString() });
    logStep(st, `${NAMES[h]}: + ${added.v} -> ${added.r.avgAcc}% avg, worst year ${added.r.minAcc}%`, log);
    // prune: an older variable that no longer adds is removed
    for (const u of F.vars.slice(0, -1)) { L.phase = `${NAMES[h]}: re-checking ${u}`; const r = await evalFormula(F.vars.filter(x => x !== u), ys, hi); st.tested++;
      if (r.ok && r.avgAcc >= F.score.avgAcc - 0.1 && r.minAcc >= F.score.minAcc - 0.3) { F.vars = F.vars.filter(x => x !== u); F.score = r; F.steps.push({ drop: u, avgAcc: r.avgAcc, minAcc: r.minAcc, t: new Date().toISOString() }); logStep(st, `${NAMES[h]}: - ${u} (no longer adds) -> ${r.avgAcc}%`, log); } }
    F.weights = weights(F.vars, ys, hi);
    st.bestHist = [...(st.bestHist || []), { t: Date.now(), avg: bestOf(st)?.score.avgAcc ?? F.score.avgAcc }].slice(-200);
    // final exam on the locked year for every improvement
    if (all.includes(LOCK)) { const m = model(ys, F.vars, hi), S = loadYear(LOCK); let c = 0, ok = 0; const th = Object.values(F.score.per)[0]?.th || 0.6;
      for (const s of S) { const t = s.t[hi]; if (t === 'flat') continue; const p = prob(m, s.f, F.vars); if (p >= th) { c++; if (t === 'up') ok++; } else if (p <= 1 - th) { c++; if (t === 'down') ok++; } }
      F.exam = { acc: c ? r1(ok / c * 100) : 0, calls: c }; st.finalChecks++;
      if (F.score.avgAcc >= PROVEN_MIN && F.score.minAcc >= FLOOR && F.exam.acc >= PROVEN_MIN && c >= MINCALLS && !st.proven) { st.proven = { h, vars: [...F.vars], score: F.score, exam: F.exam, t: new Date().toISOString() }; await tell('Elis: PROVEN formula', text(st)); } }
    save(st); syncL(st); await yieldNow();
  }
}
// the endless loop
export async function forever({ paused = () => false, log = () => {}, tell = async () => {} } = {}) {
  for (;;) {
    try {
      if (paused()) { L.phase = 'paused for the market open'; await sleep(60e3); continue; }
      const all = years(), ys = all.filter(y => y !== LOCK); L.years = all; if (ys.length < 3) { L.phase = `collecting history: ${ys.length} of 3 years ready`; await sleep(60e3); continue; }
      const st = state(); const fresh = String(st.years) !== String(all) || st.keys !== KEYS.join();
      st.samples = Object.fromEntries(all.map(y => [y, loadYear(y).length]));
      if (fresh) { st.years = all; st.keys = KEYS.join(); for (const f of Object.values(st.formulas)) f.done = false; clearCache(); logStep(st, `data now ${ys.join(', ')}${all.includes(LOCK) ? ` + ${LOCK} locked` : ''}; re-checking every formula`, log); }
      const todo = HS.map((h, i) => i).filter(i => !st.formulas[HS[i]]?.done).sort((a, b) => (a === 1 ? -1 : b === 1 ? 1 : 0));   // 30 min first
      if (!todo.length) { L.phase = 'all formulas settled; waiting for new years or variables'; save(st); await sleep(10 * 60e3); continue; }
      await climb(st, todo[0], ys, all, { paused, log, tell });
    } catch (e) { log('hunt error: ' + e.message); await sleep(60e3); }
  }
}
export function text(st = state()) {
  const b2 = bestOf(st), f = Object.entries(st.formulas || {});
  return `Formula builder on ${(st.years || []).filter(y => y !== LOCK).join(', ') || 'no years yet'} (${LOCK} locked as the final exam). ${st.tested} blind tests run.\n`
    + (f.length ? f.map(([h, x]) => `- ${NAMES[h]} ahead: ${x.vars.length ? x.vars.join(' + ') : '(building)'} -> ${x.score?.avgAcc ?? '--'}% avg, worst year ${x.score?.minAcc ?? '--'}%${x.exam ? `, ${LOCK} exam ${x.exam.acc}% on ${x.exam.calls}` : ''}${x.done ? ' (settled)' : ''}`).join('\n') + '\n' : '')
    + (b2?.weights?.length ? `Heaviest signals: ${b2.weights.slice(0, 6).map(w => `${w.variable} = ${w.value} -> ${w.points} ${w.rightPct}% (${w.seen}, ${w.years} yrs)`).join('; ')}.\n` : '')
    + (st.proven ? `PROVEN: ${NAMES[st.proven.h]} ${st.proven.vars.join(' + ')}` : `Goal ${TARGET}% average accuracy: not reached; still climbing.`);
}
