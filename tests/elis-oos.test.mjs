// node tests/elis-oos.test.mjs — year test: formulas fire on the right moments and are graded on what followed.
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), O = await import('../elis-oos.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const d = '2023-06-14', t0 = E.etMs(d, 570), mk = f => Array.from({ length: 390 }, (_, m) => { const p = f(m), o = f(Math.max(0, m - 1)); return { t: t0 + m * 60e3, o, h: Math.max(o, p) + 0.01, l: Math.min(o, p) - 0.01, c: p, v: 1000 }; });
// stock rallies hard 11:00-11:30 while SPY falls, then keeps rising
const stock = mk(m => 50 + (m >= 90 && m < 120 ? (m - 90) * 0.05 : m >= 120 ? 1.5 + (m - 120) * 0.02 : 0)), spy = mk(m => 400 - (m >= 90 && m < 120 ? (m - 90) * 0.05 : m >= 120 ? 1.5 : 0));
const t = O.tradesForDay(stock, t0, 2, spy, 0.1); console.log(t.map(x => `${x.formula} @${x.minute}m ${x.dir} R=${x.R.toFixed(2)}`).join('\n'));
const mid = t.find(x => /^midday, stock strong against the market/.test(x.formula));
assert(mid && mid.dir === 'long' && mid.minute >= 115 && mid.R > 0.5, 'midday relative strength fires and is graded on the follow-through');
assert(t.some(x => /S&P flat at the open/.test(x.formula)), 'S&P-flat variant fires (gap 0.1%)');
const m = O.money([{ date: d, R: 1 }, { date: '2023-06-15', R: -1 }], 3000); console.log(m); assert(m.end === 3000 && m.maxDrawdownPct === 1, 'money compounding (+1% then -1% = $2,999.70)');
console.log(O.text({ year: '2023', sessions: 1, results: O.summarize(t.map(x => ({ ...x, date: d }))) }).split('\n').slice(0, 3).join('\n'));
console.log('OOS TEST PASSED'); process.exit(0);
