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
const X = await import('../elis-explain.js');
// why: a fake year where longs in nervous markets win and shorts lose -> the write-up says so
let sd = 3; const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647 - 0.5);
const fake = Array.from({ length: 400 }, (_, i) => ({ date: '2023-0' + (1 + (i % 9)) + '-10', dir: i % 2 ? 'long' : 'short', spyVol: i % 4 < 2 ? 30 : 10, minute: 100, R: (i % 2 && i % 4 < 2 ? 0.8 : -0.4) + rr() }));
const w = X.explain(fake, O.WHY_DIMS); console.log(w.text);
assert(/Made money when:[\s\S]*panicky market/.test(w.text) && /Lost most when:[\s\S]*(short|calm market)/.test(w.text), 'why names the winning and losing conditions');
// build: 3 years; 'calm stock' + long wins a little every month in every year, everything else is noise -> proven
let sd2 = 11; const r2 = () => ((sd2 = (sd2 * 16807) % 2147483647) / 2147483647 - 0.5);
const yr = y => Array.from({ length: 1500 }, (_, i) => { const good = i % 3 === 0; return { R: (good ? 0.15 : -0.05) + r2() * 0.6, side: good ? 'long' : (i % 2 ? 'long' : 'short'), 'stock volatility': good ? 'calm stock' : (i % 2 ? 'jumpy stock' : 'normal stock'), 'time of day': ['first hour', '11:30-1:00'][i % 2], month: `${y}-${String(1 + (i % 12)).padStart(2, '0')}` }; });
const D2 = [{ name: 'side', key: 'side' }, { name: 'stock volatility', key: 'stock volatility' }, { name: 'time of day', key: 'time of day' }, { name: 'month', key: 'month' }];
const b = X.buildRules({ 2020: yr(2020), 2022: yr(2022), 2023: yr(2023) }, D2);
console.log(b.proven.slice(0, 3), b.honestR);
assert(b.ready && b.proven.length && /calm stock/.test(b.proven[0].rule) && b.proven[0].posMonths >= 60, 'the consistent condition is found, noise is not');
const n2 = X.buildRules({ 2020: yr(2020).map(t => ({ ...t, R: r2() - 0.02 })), 2022: yr(2022).map(t => ({ ...t, R: r2() - 0.02 })), 2023: yr(2023).map(t => ({ ...t, R: r2() - 0.02 })) }, D2);
assert(n2.ready && !n2.proven.length, 'pure noise proves nothing');
console.log('OOS TEST PASSED'); process.exit(0);
