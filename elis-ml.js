// Elis ML ENGINE (Owner 2026-11-24: "do everything we need to get better accuracy"; "what we're looking for is certainty").
// One model that weighs ALL variables together (every value of every factor, plus pairs of the key factors) instead of one rule at a time,
// trained like a learner: logistic regression, L2-regularised, on everything Elis saw in earlier years. Then it calls the NEXT year blind.
// Each call has a certainty (how far from 50/50). Graded on:
//   all charts         - every chart called
//   certain calls      - only the charts where it is in its top 30% / 20% / 10% most certain (the trades Elis would take)
// Walk-forward: train on years before Y, test on Y, for every Y with at least two earlier years. 2025 stays locked: tested once per data set.
import fs from 'node:fs';
import path from 'node:path';
import * as H from './elis-hunt.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, `ml-report-v${H.SREV}.json`);
const yieldNow = () => new Promise(r => setImmediate(r));
const r1 = x => Math.round(x * 10) / 10;
export const SWI = Math.max(0, [0.5, 1, 2].indexOf(+(process.env.ELIS_SWING || 1)));
const outc = s => (s.sw ? s.sw[SWI] : s.t?.[1]);
export const PAIR_KEYS = ['move', 'cut', 'market', 'vwap', 'structure', 'orderFlow', 'sector', 'newsByHour', 'gap', 'fearCurve', 'time'];
export const BITS = 18, SIZE = 1 << BITS;
function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) & (SIZE - 1); }
export function featuresOf(f) {
  const out = [];
  for (const k of H.KEYS) if (f[k] != null) out.push(hash(k + '=' + f[k]));
  for (let a = 0; a < PAIR_KEYS.length; a++) for (let b = a + 1; b < PAIR_KEYS.length; b++) { const x = f[PAIR_KEYS[a]], y = f[PAIR_KEYS[b]]; if (x != null && y != null) out.push(hash(PAIR_KEYS[a] + '=' + x + '&' + PAIR_KEYS[b] + '=' + y)); }
  return out;
}
// train: logistic regression by SGD (AdaGrad), a few passes, L2 shrinkage
export async function train(samples, { epochs = 3, lr = 0.1, l2 = 1e-5 } = {}) {
  const w = new Float32Array(SIZE), g2 = new Float32Array(SIZE).fill(1e-6); let b = 0, gb = 1e-6;
  const rows = []; for (const s of samples) { const t = outc(s); if (t === 'up' || t === 'down') rows.push(s); }   // features built on the fly (memory)
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let e = 0; e < epochs; e++) {
    for (let i = rows.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [rows[i], rows[j]] = [rows[j], rows[i]]; }
    for (let i = 0; i < rows.length; i++) {
      const x = featuresOf(rows[i].f), y = outc(rows[i]) === 'up' ? 1 : 0; let z = b; for (const j of x) z += w[j]; const p = 1 / (1 + Math.exp(-z)), g = p - y;
      for (const j of x) { const gj = g + l2 * w[j]; g2[j] += gj * gj; w[j] -= lr * gj / Math.sqrt(g2[j]); }
      gb += g * g; b -= lr * g / Math.sqrt(gb);
      if (i % 20000 === 19999) await yieldNow();
    }
  }
  return { w, b, n: rows.length };
}
export const prob = (m, f) => { let z = m.b; for (const j of featuresOf(f)) z += m.w[j]; return 1 / (1 + Math.exp(-z)); };
// grade a year: all charts, and the most-certain slices
export function grade(m, samples) {
  const c = []; for (const s of samples) { const t = outc(s); if (t !== 'up' && t !== 'down') continue; const p = prob(m, s.f); c.push({ cert: Math.abs(p - 0.5), right: (p >= 0.5 ? 'up' : 'down') === t }); }
  c.sort((a, b) => b.cert - a.cert); const acc = a => (a.length ? r1(a.filter(x => x.right).length / a.length * 100) : 0);
  const top = q => c.slice(0, Math.max(1, Math.floor(c.length * q)));
  return { n: c.length, all: acc(c), top30: acc(top(0.3)), top20: acc(top(0.2)), top10: acc(top(0.1)), top5: acc(top(0.05)), n10: top(0.1).length };
}
export const lastReport = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return null; } };
export async function run({ log = () => {} } = {}) {
  const all = H.years(), ys = all.filter(y => y !== H.LOCK); if (ys.length < 3) return null;
  const per = {};
  for (let i = 2; i < ys.length; i++) { const y = ys[i], tr = ys.slice(0, i).flatMap(x => H.loadYear(x)); const m = await train(tr); per[y] = grade(m, H.loadYear(y)); log(`ml: trained on ${ys.slice(0, i).join(',')} -> ${y}: all ${per[y].all}%, most certain 10% ${per[y].top10}%`); await yieldNow(); }
  const v = Object.values(per), avg = k => (v.length ? r1(v.reduce((a, x) => a + x[k], 0) / v.length) : null), mn = k => (v.length ? Math.min(...v.map(x => x[k])) : null);
  let exam = null; if (all.includes(H.LOCK)) { const m = await train(ys.flatMap(x => H.loadYear(x))); exam = grade(m, H.loadYear(H.LOCK)); }
  const r = { at: new Date().toISOString(), years: all, versions: Object.fromEntries(all.map(y => [y, H.versionOf(y)])), per, avg: { all: avg('all'), top30: avg('top30'), top20: avg('top20'), top10: avg('top10'), top5: avg('top5') }, worst: { all: mn('all'), top10: mn('top10'), top5: mn('top5') }, exam };
  try { fs.writeFileSync(SF, JSON.stringify(r)); } catch {} return r;
}
export function text(r = lastReport()) {
  if (!r) return 'ML engine: waiting for 3 years of data';
  return `ML engine (all variables weighed together, trained on earlier years, tested on the next): every chart ${r.avg.all}% right; `
    + `when most certain: top 30% ${r.avg.top30}%, top 20% ${r.avg.top20}%, top 10% ${r.avg.top10}% (worst year ${r.worst.top10}%), top 5% ${r.avg.top5}%.`
    + (r.exam ? ` Locked 2025 exam: every chart ${r.exam.all}%, top 10% ${r.exam.top10}%, top 5% ${r.exam.top5}%.` : '');
}
