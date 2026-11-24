import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const DD = fs.mkdtempSync('/tmp/hunt-'); process.env.DATA_DIR = DD; fs.mkdirSync(path.join(DD, 'elis'), { recursive: true });
const H = await import('../elis-hunt.js');
// planted world, 5 years: a reliable analyst (pos -> up 78%), the market falling (-> down 66%), and a loud influencer who is
// right one year and wrong the next (must get NO weight). Everything else is noise.
let sd = 9; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const year = yi => Array.from({ length: 8000 }, () => {
  const f = Object.fromEntries(H.KEYS.map(k => [k, 'v' + Math.floor(r() * 3)])); let pUp = 0.5;
  const q = r(); if (q < 0.12) { f.newsBy = 'wire/Good Analyst: pos'; pUp = 0.78; } else if (q < 0.3) { f.newsBy = 'social/Loud Influencer: pos'; pUp = yi % 2 ? 0.62 : 0.38; } else f.newsBy = 'no news';
  if (r() < 0.3) { f.market = 'market falling'; pUp = Math.max(0.05, pUp - 0.16); } else f.market = 'market flat';
  const t = r() < pUp ? 'up' : 'down'; return { v: H.KEYS.map(k => f[k]), t: [t, t, t], r: [[0, 0], [0, 0], [0, 0]], m: 0 };
});
['2019', '2020', '2021', '2022', '2023'].forEach((y, i) => H.saveSamples(y, year(i)));
const st = { formulas: {}, years: [], tested: 0, finalChecks: 0, bestHist: [], log: [] }, logs = [];
await H.climb(st, 1, H.years(), H.years(), { paused: () => false, log: m => logs.push(m), tell: async () => {} });
const F = st.formulas[6]; console.log(logs.join('\n')); console.log(F.vars, F.score.avgAcc, F.score.minAcc); console.log(F.weights.slice(0, 5));
assert(F.vars.some(v => /newsBy/.test(v)) && F.vars.some(v => /market/.test(v)), 'the builder climbs with the real signals (alone or as a branch)');
const all = H.weights(F.vars, H.years(), 1, 999); assert(!all.some(w => w.value === 'social/Loud Influencer: pos' || w.value === 'social/Loud Influencer: pos | market flat'), 'the inconsistent influencer gets no weight on its own');
assert(F.weights.some(w => /Good Analyst/.test(w.value) && w.points === 'up'), 'the reliable analyst is weighed in');
assert(F.steps.filter(s => s.add).every((s, i, a) => i === 0 || s.avgAcc >= a[i - 1].avgAcc), 'every kept step raised accuracy');
assert(!F.vars.some(v => /^(candle|dow|time)$/.test(v)), 'noise variables are left behind');
console.log(H.text(st));
console.log('HUNT TEST PASSED');
