import assert from 'node:assert';
const I = await import('../elis-ipo.js');
const t0 = Date.parse('2024-03-21T15:00:00Z'), mk = path => path.map((c, i) => ({ t: t0 + i * 60e3, o: i ? path[i - 1] : 40, h: Math.max(c, i ? path[i - 1] : 40) + 0.01, l: Math.min(c, i ? path[i - 1] : 40) - 0.01, c, v: 1000 }));
const up = I.dayOne(mk(Array.from({ length: 70 }, (_, i) => 40 + i * 0.05))), dn = I.dayOne(mk(Array.from({ length: 70 }, (_, i) => 40 - i * 0.05)));
assert(up.r20 > 0 && up.r40 > up.r20 && up.touch === 'up' && dn.r40 < 0 && dn.touch === 'down', 'day-one returns from the first trade');
const s = I.summarize([{ ...up, year: '2024' }, { ...dn, year: '2024' }, { ...up, year: '2024' }]); console.log(s);
assert(s.after40.up === 66.7 && s.plus1First === 66.7, 'summary');
console.log('IPO TEST PASSED');
