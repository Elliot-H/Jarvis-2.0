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
// a realistic weak world (signals worth 2-4 points): the builder must still produce real percentages and climb
sd = 21; const weak = yi => Array.from({ length: 30000 }, () => { const f = Object.fromEntries(H.KEYS.map(k => [k, 'v' + Math.floor(r() * 3)])); let p = 0.5;
  if (f.market === 'v0') p -= 0.04; if (f.trend5d === 'v1') p += 0.03; const t = r() < p ? 'up' : 'down'; return { v: H.KEYS.map(k => f[k]), t: [t, t, t], r: [[0, 0], [0, 0], [0, 0]], m: 0 }; });
['2019', '2020', '2021', '2022', '2023'].forEach((y, i) => H.saveSamples(y, weak(i))); H.clearCache();
const st2 = { formulas: {}, years: [], tested: 0, finalChecks: 0, bestHist: [], log: [] };
await H.climb(st2, 1, H.years(), H.years(), { paused: () => false, log: () => {}, tell: async () => {} });
const F2 = st2.formulas[6]; console.log('weak world:', F2.vars, F2.score?.avgAcc, F2.screen.slice(0, 3));
assert(F2.screen.length && F2.screen[0].avgAcc > 50 && F2.vars.length >= 1 && F2.score.avgAcc > 51, 'weak but real signals give real percentages and a formula');
console.log('HUNT TEST PASSED');
// verified save + cleanup
{ const fs2 = (await import('node:fs')).default, p2 = (await import('node:path')).default; const dir = p2.join(process.env.DATA_DIR, 'elis');
  fs2.writeFileSync(p2.join(dir, 'hunt-samples-v4-2030.json.gz'), ''); fs2.writeFileSync(p2.join(dir, 'hunt-samples-2031.json.gz'), 'x'); fs2.writeFileSync(p2.join(dir, 'hunt-samples-v3-2032.json.gz'), 'x');
  const gone = H.cleanup(); console.log('cleanup removed', gone); assert(gone.length === 3 && H.years().every(y => !['2030', '2031', '2032'].includes(y)), 'empty / superseded sample files are removed');
  assert(H.saveSamples('2033', [{ v: [], t: [], sw: [], r: [], m: 0 }]) === true && H.loadYear('2033').length === 1, 'verified save reads back');
  console.log('SAVE/CLEANUP OK'); }
