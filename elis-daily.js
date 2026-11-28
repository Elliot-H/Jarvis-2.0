// Elis DAILY PICKS (Owner 2026-11-27): "on a daily basis, predict with 70% accuracy the up or the down of the most likely investments.
// Batch, learn, next batch - each batch should get better; don't average in the early bad batches."
// Exactly that: walk 2016 -> 2025 day by day. Each day Elis (one model weighing every variable) calls every chart of that day BLIND,
// ranks the calls by certainty, keeps its top K, and is graded on them; THEN it learns from the whole day and moves to the next.
// The score that counts is the recent one (last 12 months, after ~9 years of learning), not the lifetime average.
// Tried for every target Elis can call (symmetric only, so 50% is the honest coin-flip line):
//   swing 0.5% / 1% / 2% (which comes first, +X% or -X%) and direction after 15 / 30 / 60 minutes.
import fs from 'node:fs';
import path from 'node:path';
import * as H from './elis-hunt.js';
import * as ML from './elis-ml.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'daily-report.json');
const yieldNow = () => new Promise(r => setImmediate(r)), r1 = x => Math.round(x * 10) / 10;
export const TARGETS = { 'swing 0.5%': s => s.sw?.[0], 'swing 1%': s => s.sw?.[1], 'swing 2%': s => s.sw?.[2], 'direction 15 min': s => s.t?.[0], 'direction 30 min': s => s.t?.[1], 'direction 60 min': s => s.t?.[2] };
export const KS = [1, 3, 5, 10, 20];
const dayOf = T => new Date(T - 5 * 3600e3).toISOString().slice(0, 10);
export const lastReport = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return null; } };
// one online learner: predict the day blind, grade the top K, then learn the day
export async function walkDaily(days, target, { lr = 0.05, l2 = 1e-6 } = {}) {
  const w = new Float32Array(ML.SIZE), g2 = new Float32Array(ML.SIZE).fill(1e-6); let b = 0, gb = 1e-6;
  const res = Object.fromEntries(KS.map(k => [k, []])), all = [];
  for (let di = 0; di < days.length; di++) {
    const [d, S] = days[di], rows = [];
    for (const s of S) { const y = target(s); const x = ML.featuresOf(s.f); let z = b; for (const j of x) z += w[j]; const p = 1 / (1 + Math.exp(-z)); rows.push({ x, y, p, cert: Math.abs(p - 0.5) }); }
    if (di >= 250) {   // grade only after a year of learning
      rows.sort((a, c) => c.cert - a.cert); const graded = rows.filter(r => r.y === 'up' || r.y === 'down');
      for (const k of KS) { const top = rows.slice(0, k).filter(r => r.y === 'up' || r.y === 'down'); if (top.length) res[k].push({ d, n: top.length, ok: top.filter(r => (r.p >= 0.5 ? 'up' : 'down') === r.y).length }); }
      if (graded.length) all.push({ d, n: graded.length, ok: graded.filter(r => (r.p >= 0.5 ? 'up' : 'down') === r.y).length });
    }
    for (const r of rows) { if (r.y !== 'up' && r.y !== 'down') continue; const yy = r.y === 'up' ? 1 : 0, g = r.p - yy;   // learn the day
      for (const j of r.x) { const gj = g + l2 * w[j]; g2[j] += gj * gj; w[j] -= lr * gj / Math.sqrt(g2[j]); } gb += g * g; b -= lr * g / Math.sqrt(gb); }
    if (di % 20 === 0) await yieldNow();
  }
  const acc = (arr, from = '') => { const a = arr.filter(x => x.d >= from), n = a.reduce((s, x) => s + x.n, 0); return { acc: n ? r1(a.reduce((s, x) => s + x.ok, 0) / n * 100) : null, calls: n, days: a.length }; };
  const last = days.at(-1)?.[0] || '', yr = d => d.slice(0, 4), lastYear = `${+yr(last) - 1}${last.slice(4)}`, twoYears = `${+yr(last) - 2}${last.slice(4)}`;
  const out = { all: { last12m: acc(all, lastYear) } };
  for (const k of KS) { const byYear = {}; for (const y of [...new Set(res[k].map(x => yr(x.d)))]) byYear[y] = acc(res[k].filter(x => yr(x.d) === y)).acc;
    out[k] = { last12m: acc(res[k], lastYear), last24m: acc(res[k], twoYears), byYear, winDays12m: (a => (a.length ? r1(a.filter(x => x.ok / x.n >= 0.7).length / a.length * 100) : null))(res[k].filter(x => x.d >= lastYear)) }; }
  return out;
}
export async function run({ log = () => {} } = {}) {
  const ys = H.years(); if (ys.length < 3) return null;
  const byDay = new Map(); for (const y of ys) for (const s of H.loadYear(y)) { if (!s.T) continue; const d = dayOf(s.T); (byDay.get(d) || byDay.set(d, []).get(d)).push(s); }
  const days = [...byDay.entries()].sort((a, c) => (a[0] < c[0] ? -1 : 1)); if (days.length < 400) return null;
  const results = {};
  for (const [name, fn] of Object.entries(TARGETS)) { results[name] = await walkDaily(days, fn); const t = results[name]; log(`daily: ${name}: last 12 months every chart ${t.all.last12m.acc}%, daily top 1 ${t[1].last12m.acc}%, top 5 ${t[5].last12m.acc}%`); }
  let best = null; for (const [name, t] of Object.entries(results)) for (const k of KS) { const x = t[k]; if (x.last24m.calls >= 150 && x.last12m.acc != null && (!best || Math.min(x.last12m.acc, x.last24m.acc) > best.score)) best = { target: name, k, score: Math.min(x.last12m.acc, x.last24m.acc), last12m: x.last12m, last24m: x.last24m, byYear: x.byYear, winDays12m: x.winDays12m }; }
  const r = { at: new Date().toISOString(), from: days[0][0], to: days.at(-1)[0], days: days.length, results, best };
  try { fs.writeFileSync(SF, JSON.stringify(r)); } catch {} return r;
}
export function text(r = lastReport()) {
  if (!r) return 'Daily picks: waiting for data';
  const b = r.best; if (!b) return 'Daily picks: not enough graded calls yet';
  return `Daily picks (learn every day, ${r.from} to ${r.to}): best is "${b.target}", top ${b.k} call${b.k > 1 ? 's' : ''} a day: last 12 months ${b.last12m.acc}% right (${b.last12m.calls} calls), last 24 months ${b.last24m.acc}%. `
    + `Days with 70%+ right in the last 12 months: ${b.winDays12m}%. By year: ${Object.entries(b.byYear).map(([y, a]) => `${y} ${a}%`).join(', ')}.`;
}
