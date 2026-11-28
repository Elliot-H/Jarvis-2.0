import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const DD = fs.mkdtempSync('/tmp/daily-'); process.env.DATA_DIR = DD; fs.mkdirSync(path.join(DD, 'elis'), { recursive: true });
const H = await import('../elis-hunt.js'), D = await import('../elis-daily.js');
// a world where a rare setup (5% of charts) really goes up 85%; everything else is a coin flip. Daily top picks must find it.
let sd = 7; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
for (const y of ['2019', '2020', '2021', '2022']) { const arr = []; for (let d = 0; d < 250; d++) { const T = Date.parse(`${y}-01-02T15:00:00Z`) + d * 864e5;
  for (let i = 0; i < 60; i++) { const f = Object.fromEntries(H.KEYS.map(k => [k, 'v' + Math.floor(r() * 4)])); let p = 0.5; if (r() < 0.05) { f.orderFlow = 'heavy buying last 10 min'; f.cut = 'swing turn'; p = 0.85; }
    const t = r() < p ? 'up' : 'down'; arr.push({ T, v: H.KEYS.map(k => f[k]), sw: [t, t, t], t: [t, t, t], r: [[0, 0], [0, 0], [0, 0]], m: 0 }); } }
  H.saveSamples(y, arr); }
H.clearCache(); const rep = await D.run({ log: m => console.log(m) }); console.log(D.text(rep));
assert(rep.best.last12m.acc >= 75 && rep.results['swing 1%'].all.last12m.acc < 60, 'daily top picks find the rare real setup; every-chart accuracy stays near 50%');
console.log('DAILY TEST PASSED');
