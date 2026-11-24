import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const DD = fs.mkdtempSync('/tmp/walk-'); process.env.DATA_DIR = DD; fs.mkdirSync(path.join(DD, 'elis'), { recursive: true });
const H = await import('../elis-hunt.js'), W = await import('../elis-walk.js');
// planted world: when news is from a reliable source AND positive, price goes up 80%; when the sector is falling, down 70%; else coin flip.
let sd = 5; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const yr = () => Array.from({ length: 6000 }, () => { const f = Object.fromEntries(H.KEYS.map(k => [k, 'v' + Math.floor(r() * 4)])); let p = 0.5;
  if (r() < 0.15) { f.newsBy = 'wire/Reliable: pos'; p = 0.8; } else if (r() < 0.25) { f.sector = 'sector falling'; p = 0.3; }
  const t = r() < p ? 'up' : 'down', m = r() < 0.5 ? 1 : -1; return { v: H.KEYS.map(k => f[k]), sw: [t, t, t], t: [t, t, t], r: [[0, 0], [0, 0], [0, 0]], m }; });
['2019', '2020', '2021', '2022'].forEach(y => H.saveSamples(y, yr())); H.clearCache();
const st = { pass: 1, pos: 0, n: 0, charts: 0, right: 0, formula: [], cands: [], dropped: 0, recent: [], log: [], exams: [] };
const PS = W.periods(H.years()); for (const p of PS) W.step(st, p);
console.log(st.log.join('\n')); console.log('first 6 periods', st.recent.slice(0, 1).map(x => x.acc), '... last 12', st.recent.slice(-12).map(x => x.acc).join(' '));
assert(st.formula.some(x => x.c.some(([k, v]) => k === 'newsBy' && v === 'wire/Reliable: pos') && x.dir === 'up'), 'learned the reliable source from its misses');
assert(st.formula.some(x => x.c.some(([k, v]) => k === 'sector' && v === 'sector falling') && x.dir === 'down'), 'learned the falling-sector tell');
const late = st.recent.slice(-12).reduce((a, x) => a + x.acc, 0) / 12; assert(late > 56, 'accuracy climbs as the formula grows');
assert(st.charts > 20000 && st.recent[0].n > 0, 'every chart gets a blind call, from the first period on');
console.log(W.text(st));
// swing outcome + turn cuts on a synthetic bouncing chart
const E = await import('../elis.js'); const t0 = E.etMs('2023-03-06', 570);
const bars = Array.from({ length: 390 }, (_, i) => { const p = 100 * (1 + 0.015 * Math.sin(i / 25)); return { t: t0 + i * 60e3, o: p, h: p * 1.001, l: p * 0.999, c: p * (1 + 0.0004 * Math.cos(i / 25)), v: 1000 }; });
const sm = H.samplesForDay({ bars, spy: bars, sec: null, t0, atr: 2, gapPct: 0, rvol: 2, spyGap: 0, spyTrend: 'market uptrend', spyVol: 15, news: [], daily: {}, rnd: () => 0.37 });
const ti = H.KEYS.indexOf('cut'); console.log(sm.map(x => x.v[ti] + ' -> ' + x.sw.join('/')));
assert(sm.some(x => x.v[ti] === 'swing turn') && sm.every(x => x.sw.length === 3 && x.sw.every(o => ['up', 'down', 'none'].includes(o))), 'swing outcomes and turn cuts');
console.log('WALK TEST PASSED');
