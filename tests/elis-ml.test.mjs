import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
const DD = fs.mkdtempSync('/tmp/ml-'); process.env.DATA_DIR = DD; fs.mkdirSync(path.join(DD, 'elis'), { recursive: true });
const H = await import('../elis-hunt.js'), M = await import('../elis-ml.js');
// weak signals spread across many factors (each worth 2-6 points) + a strong one in a pair: combined they give certainty
let sd = 3; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const yr = () => Array.from({ length: 20000 }, () => { const f = Object.fromEntries(H.KEYS.map(k => [k, 'v' + Math.floor(r() * 3)])); let z = 0;
  if (f.orderFlow === 'v0') z += 0.25; if (f.fearCurve === 'v1') z -= 0.2; if (f.shortRatio === 'v2') z -= 0.15; if (f.attention === 'v0') z += 0.15; if (f.move === 'v1' && f.cut === 'v2') z += 0.8;
  const t = r() < 1 / (1 + Math.exp(-z)) ? 'up' : 'down'; return { v: H.KEYS.map(k => f[k]), sw: [t, t, t], t: [t, t, t], r: [[0, 0], [0, 0], [0, 0]], m: 0 }; });
['2019', '2020', '2021', '2022', '2025'].forEach(y => H.saveSamples(y, yr())); H.clearCache();
const rep = await M.run({ log: m => console.log(m) }); console.log(M.text(rep));
assert(rep.avg.all > 53 && rep.avg.top10 > rep.avg.all + 5 && rep.exam.top10 > 60, 'weighing all variables together gives more certainty on unseen years');
console.log('ML TEST PASSED');
