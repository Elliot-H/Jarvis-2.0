// node tests/elis-jumps.test.mjs — big-jump study: finds signs that make 8%+ days more likely vs ordinary days, in both periods.
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const J = await import('../elis-jumps.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const N = 300, tr = J.newAcc(), te = J.newAcc();
for (let s = 0; s < 400; s++) {
  const x = { o: new Float32Array(N), h: new Float32Array(N), l: new Float32Array(N), c: new Float32Array(N), v: new Float32Array(N) }; let p = 30;
  for (let k = 0; k < N; k++) {
    const surgeY = k > 0 && x.v[k - 1] > 3.5e6;   // hidden rule: a volume surge yesterday -> 30% chance of an 8%+ jump today
    const r = surgeY && rnd() < 0.3 ? (rnd() < 0.7 ? 0.12 : -0.12) : (rnd() - 0.5) * 0.04;
    const o = p * (1 + (rnd() - 0.5) * 0.01); p = p * (1 + r);
    x.o[k] = o; x.c[k] = p; x.h[k] = Math.max(o, p) * 1.01; x.l[k] = Math.min(o, p) * 0.99; x.v[k] = rnd() < 0.05 ? 5e6 : 1.5e6;
  }
  for (let k = 22; k < N; k++) { const f = J.signs(x, k, 0), ret = x.c[k] / x.c[k - 1] - 1, oc = x.c[k] / x.o[k] - 1; J.addDay(k < 160 ? tr : te, f, ret, oc); }
}
const out = J.compare(tr, te, { minN: 200 });
console.log('base up', (tr.up / tr.n).toFixed(4), 'down', (tr.down / tr.n).toFixed(4), '| found', out.length);
for (const s of out.slice(0, 4)) console.log(s.dir, s.signs, 'unseen', s.unseen.odds, s.unseen.lift + 'x', s.unseen.n, 'trade', s.unseen.tradeAtOpen);
assert(out.some(s => s.dir === 'up' && /prev-vol-(surge|high)/.test(s.signs) && s.unseen.lift > 3), 'finds: volume surge yesterday -> more big up days');
assert(out.some(s => s.dir === 'down' && /prev-vol-(surge|high)/.test(s.signs)), 'finds it for big down days too');
assert(!out.some(s => !/prev-vol-surge|prev-vol-high/.test(s.signs) && s.unseen.lift > 2), 'no false signs without the surge');
const txt = J.text({ stockDays: tr.n + te.n, jumps: tr.up + tr.down + te.up + te.down, from: '2024-01-02', base: { unseen: { up: te.up / te.n, down: te.down / te.n } }, priceSigns: out, newsSigns: [] });
console.log(txt.split('\n').slice(0, 4).join('\n'));
console.log('JUMPS TEST PASSED'); process.exit(0);
