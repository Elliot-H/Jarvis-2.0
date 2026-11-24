// Elis WALK - the Owner's learning loop (2026-11-24), exactly as specified:
// 1. Walk the history in time order (2016 -> 2024; 2025 is locked as the exam). Elis makes a BLIND call (up/down, next 30 min)
//    on EVERY chart with its current formula. No confidence gate. Default with no formula: keep going (the 30-min move's direction).
// 2. Reveal what happened. Grade right / wrong.
// 3. HOMEWORK after each period (~1 month): look at the misses. Which conditions on the chart (one factor or a pair) were there when
//    Elis was wrong, and which way did price actually go under them? "When <condition>, it should have called <the real direction>."
//    Each such finding becomes a CANDIDATE variable.
// 4. Keep walking. Every later period where the candidate shows up again, Elis checks: would following it have beaten the current
//    call on those charts? A candidate that keeps adding accuracy period after period JOINS the formula; one that doesn't is dropped.
//    Formula rules keep being checked the same way and are removed if they stop adding.
// 5. Repeat passes; after each pass the formula sits the locked 2025 exam. Proven = 70%+ on 2025.
import fs from 'node:fs';
import path from 'node:path';
import * as H from './elis-hunt.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'walk-state.json');
export const TARGET = 70, SWI = Math.max(0, [0.5, 1, 2].indexOf(+(process.env.ELIS_SWING || 1)));   // Owner: from here, +1% before -1%?
const outc = s => (s.sw ? s.sw[SWI] : s.t[1]);   // 'up' | 'down' | 'none'/'flat'
export const P = { periodsPerYear: 12, minN: 30, minGain: 5, adoptMonths: 6, adoptShare: 0.7, minZ: 3, dropShare: 0.55, expire: 24, maxPairsVars: 26 };
const yieldNow = () => new Promise(r => setImmediate(r)), sleep = ms => new Promise(r => setTimeout(r, ms));
const r1 = x => Math.round(x * 10) / 10;
const K = H.KEYS;
const condOf = (f, c) => c.every(([k, v]) => f[k] === v);
const label = c => c.map(([k, v]) => `${k} = ${v}`).join(' AND ');
const keyOf = c => c.map(([k, v]) => k + '=' + v).join('&');
// the call: the most specific / best-proven matching rule, else the default
export function callOf(formula, s) {
  let best = null; for (const r of formula) if (condOf(s.f, r.c) && (!best || r.c.length > best.c.length || (r.c.length === best.c.length && r.score > best.score))) best = r;
  return best ? best.dir : s.m < 0 ? 'down' : 'up';
}
// split a year's samples (kept in time order) into periods
export function periods(years) { const out = []; for (const y of years) { const S = H.loadYear(y), n = P.periodsPerYear; for (let i = 0; i < n; i++) out.push({ id: `${y}-${String(i + 1).padStart(2, '0')}`, s: S.slice(Math.floor(S.length * i / n), Math.floor(S.length * (i + 1) / n)) }); } return out; }
// homework on one period: conditions under which Elis was wrong and the real direction was one-sided
export function homework(S, formula) {
  const g = new Map(), add = (c, s, right) => { const k = keyOf(c); let x = g.get(k); if (!x) g.set(k, x = { c, n: 0, up: 0, right: 0 }); x.n++; if (outc(s) === 'up') x.up++; if (right) x.right++; };
  for (const s of S) { const t = outc(s); if ((t === 'flat' || t === 'none')) continue; const right = callOf(formula, s) === t, kv = K.filter(k => s.f[k] != null).map(k => [k, s.f[k]]);
    for (let i = 0; i < kv.length; i++) { add([kv[i]], s, right); for (let j = i + 1; j < kv.length; j++) add([kv[i], kv[j]], s, right); } }
  const out = [];
  for (const x of g.values()) { if (x.n < P.minN) continue; const dir = x.up * 2 >= x.n ? 'up' : 'down', ruleAcc = (dir === 'up' ? x.up : x.n - x.up) / x.n * 100, curAcc = x.right / x.n * 100;
    if (ruleAcc - curAcc >= P.minGain) out.push({ c: x.c, dir, n: x.n, ruleAcc: r1(ruleAcc), curAcc: r1(curAcc) }); }
  return out.sort((a, b) => (b.ruleAcc - b.curAcc) * Math.sqrt(b.n) - (a.ruleAcc - a.curAcc) * Math.sqrt(a.n)).slice(0, 60);
}
// does following a rule beat the current call on this period's matching charts?
function check(rule, S, formula, without = false) {
  let n = 0, ruleRight = 0, curRight = 0, dis = 0; const f2 = without ? formula.filter(r => r !== rule) : formula;
  for (const s of S) { const t = outc(s); if ((t === 'flat' || t === 'none') || !condOf(s.f, rule.c)) continue; n++; const cc = callOf(f2, s); if (cc !== rule.dir) dis++; if (rule.dir === t) ruleRight++; if (cc === t) curRight++; }
  return { n, dis, diff: ruleRight - curRight, gain: n ? (ruleRight - curRight) / n * 100 : 0 };
}
export function grade(S, formula) { let n = 0, ok = 0; for (const s of S) { const t = outc(s); if ((t === 'flat' || t === 'none')) continue; n++; if (callOf(formula, s) === t) ok++; } return { n, acc: n ? r1(ok / n * 100) : 0 }; }
// one period of the walk: blind calls -> grade -> watch candidates / formula -> homework
export function step(st, per) {
  const g = grade(per.s, st.formula); st.charts += g.n; st.right += Math.round(g.acc * g.n / 100);
  st.recent.push({ id: per.id, acc: g.acc, n: g.n, rules: st.formula.length }); st.recent = st.recent.slice(-24);
  // candidates that show up again: did they add?
  for (const c of st.cands) { const r = check(c, per.s, st.formula); if (r.n < 15) continue; c.seen++; if (r.gain > 0) c.better++; c.gain += r.gain; c.diff = (c.diff || 0) + r.diff; c.dis = (c.dis || 0) + r.dis; }
  for (const c of [...st.cands]) { const share = c.seen ? c.better / c.seen : 0;
    const z = c.dis ? (c.diff || 0) / Math.sqrt(c.dis) : 0;   // enough evidence that it is not luck
    if (c.seen >= P.adoptMonths && share >= P.adoptShare && c.gain / c.seen > 1 && z >= P.minZ) { st.formula.push({ c: c.c, dir: c.dir, score: r1(share * 100), since: per.id, seen: c.seen, avgGain: r1(c.gain / c.seen) }); st.cands = st.cands.filter(x => x !== c); st.log.push(`${per.id}: + "${label(c.c)} -> ${c.dir}" joined (better in ${c.better} of ${c.seen} later periods, +${r1(c.gain / c.seen)} pts, ${c.diff} more right calls)`); }
    else if ((c.seen >= P.adoptMonths && share < P.dropShare) || st.n - c.born > P.expire || (c.seen >= 12 && z < 1)) { st.cands = st.cands.filter(x => x !== c); st.dropped++; } }
  // formula rules keep earning their place
  for (const r of [...st.formula]) { const x = check(r, per.s, st.formula, true); if (x.n < 15) continue; r.hist = [...(r.hist || []), x.gain > 0 ? 1 : 0].slice(-8); if (r.hist.length >= 8 && r.hist.reduce((a, b) => a + b, 0) < 4) { st.formula = st.formula.filter(y => y !== r); st.log.push(`${per.id}: - "${label(r.c)} -> ${r.dir}" removed (stopped adding)`); } }
  // homework: what should Elis have looked for?
  const have = new Set([...st.cands, ...st.formula].map(x => keyOf(x.c) + '>' + x.dir));
  for (const h of homework(per.s, st.formula)) { const k = keyOf(h.c) + '>' + h.dir; if (have.has(k)) continue; st.cands.push({ c: h.c, dir: h.dir, born: st.n, from: per.id, seen: 0, better: 0, gain: 0, why: `${per.id}: wrong ${r1(100 - h.curAcc)}% of ${h.n} charts with ${label(h.c)}; it went ${h.dir} ${h.ruleAcc}%` }); have.add(k); }
  st.cands = st.cands.slice(-400); st.log = st.log.slice(-200); st.n++; st.pos++;
  return g;
}
const blank = () => ({ pass: 1, pos: 0, n: 0, charts: 0, right: 0, formula: [], cands: [], dropped: 0, recent: [], log: [], exams: [], best: null });
export const state = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return blank(); } };
const save = st => { try { fs.writeFileSync(SF, JSON.stringify(st)); } catch {} };
const L = { phase: 'starting', tested: 0, bestAvg: null, bestMin: null, lastAcc: null, recent: [], bestHist: [], years: [], collect: '', proven: false, formula: '', at: 0 };
const roll = st => { const w = st.recent.slice(-12), n = w.reduce((a, x) => a + x.n, 0); return n ? r1(w.reduce((a, x) => a + x.acc * x.n, 0) / n) : null; };
const syncL = (st, phase) => { const last = st.recent.at(-1); Object.assign(L, { years: H.years(), phase: phase || L.phase, tested: st.charts, lastAcc: last?.acc ?? null, bestAvg: roll(st), bestMin: st.exams.at(-1)?.acc ?? null,
  recent: st.recent.map(x => x.acc), bestHist: (st.hist || []).map(a => ({ avg: a })), proven: !!st.proven, formula: `${st.formula.length} rules, ${st.cands.length} candidates under watch` }); };
syncL(state());
export const live = () => ({ ...L, target: TARGET, at: Date.now(), labels: { big: 'accuracy, last 12 periods (blind calls)', small: 'last 2025 exam', last: 'THIS PERIOD', tested: 'CHARTS CALLED' } });
export const setCollect = m => { L.collect = String(m || '').slice(0, 90); };
export async function forever({ paused = () => false, log = () => {}, tell = async () => {} } = {}) {
  for (;;) {
    try {
      if (paused()) { syncL(state(), 'paused for the market open'); await sleep(60e3); continue; }
      const all = H.years(), ys = all.filter(y => y !== H.LOCK); if (ys.length < 2) { syncL(state(), `collecting history: ${ys.length} years ready`); await sleep(60e3); continue; }
      const st = state(), PS = periods(ys);
      if (st.pos >= PS.length) {   // end of a pass: the locked exam, then walk again with what was learned
        if (all.includes(H.LOCK)) { const e = grade(H.loadYear(H.LOCK), st.formula); st.exams.push({ pass: st.pass, acc: e.acc, n: e.n, rules: st.formula.length, t: new Date().toISOString() }); log(`walk: pass ${st.pass} done; 2025 exam ${e.acc}% on ${e.n} charts with ${st.formula.length} rules`);
          if (e.acc >= TARGET && !st.proven) { st.proven = { pass: st.pass, acc: e.acc, rules: st.formula.map(r => `${label(r.c)} -> ${r.dir}`) }; await tell('Elis: 70% reached on the locked 2025 exam', text(st)); } }
        st.pass++; st.pos = 0; save(st); continue;
      }
      const per = PS[st.pos], g = step(st, per); st.hist = [...(st.hist || []), roll(st)].slice(-200);
      if (st.formula.length !== (st.lastRules ?? 0)) { st.lastRules = st.formula.length; log(`walk: ${per.id}: formula now ${st.formula.length} rules; rolling accuracy ${roll(st)}%`); }
      syncL(st, `pass ${st.pass}: month ${per.id} called blind, ${g.acc}% right of ${g.n}; misses studied; loop keeps going until 70%`); save(st); await yieldNow();
    } catch (e) { log('walk error: ' + e.message); await sleep(60e3); }
  }
}
export function text(st = state()) {
  const e = st.exams.at(-1);
  return `Walk pass ${st.pass}: ${st.charts.toLocaleString()} charts called blind, ${st.charts ? r1(st.right / st.charts * 100) : 0}% right overall; last 12 periods ${roll(st) ?? '--'}%.\n`
    + `Formula: ${st.formula.length ? st.formula.map(r => `${label(r.c)} -> ${r.dir} (better in ${r.score}% of later periods)`).slice(0, 8).join('; ') : 'no rule has proven itself yet'}.\n`
    + `${st.cands.length} candidates under watch, ${st.dropped} dropped.` + (e ? ` 2025 exam (pass ${e.pass}): ${e.acc}% on ${e.n} charts.` : '')
    + (st.proven ? ' PROVEN.' : ` Goal ${TARGET}%: still learning.`);
}
