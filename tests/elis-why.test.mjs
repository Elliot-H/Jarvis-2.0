// node tests/elis-why.test.mjs — big moves found, sources attributed (news lead time, filing, market, unexplained), weighted.
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), W = await import('../elis-why.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const d = '2025-03-04', t0 = E.etMs(d, 570);
const bars = Array.from({ length: 390 }, (_, m) => { const p = 50 + (m >= 60 && m < 90 ? (m - 60) * 0.1 : m >= 90 ? 3 : 0) + (m >= 200 && m < 230 ? -(m - 200) * 0.1 : m >= 230 ? -3 : 0); return { t: t0 + m * 60e3, o: p, h: p + 0.02, l: p - 0.02, c: p, v: 1000 }; });
const mv = W.bigMoves(bars, t0, 2); console.log(mv.map(m => `${m.dir} ${m.move}x @${m.minute}m`).join(', '));
assert(mv.length === 2 && mv[0].dir === 'up' && mv[1].dir === 'down', 'finds the two big moves');
const news = [{ t: t0 + 50 * 60e3, source: 'benzinga', headline: 'X wins contract', tone: 'pos', cat: 'contract' }], filings = [{ t: t0 + 195 * 60e3, form: '8-K' }];
const w1 = W.explain(mv[0], news, filings, null, null), w2 = W.explain(mv[1], news, filings, null, null);
console.log(w1, w2);
assert(w1[0].kind === 'news' && w1[0].leadMin === 10 && w1[0].source === 'benzinga', 'up move: benzinga headline 10 min before');
assert(w2[0].kind === 'filing' && w2[0].label === 'sec:8-K' && w2[0].leadMin === 5, 'down move: 8-K filed 5 min before');
const un = W.explain({ ...mv[0], startT: t0 + 300 * 60e3, endT: t0 + 330 * 60e3 }, news, filings, null, null); assert(un[0].kind === 'unexplained', 'nothing before -> unexplained');
const wt = W.weigh([{ move: 1.5, why: w1 }, { move: -1.5, why: w2 }, { move: 1.2, why: un }], [{ label: 'news:benzinga:contract', followed: true }, { label: 'news:benzinga:contract', followed: false }]);
console.log(wt); assert(wt.find(x => x.label === 'news:benzinga:contract').hitRatePct === 50, 'hit rate per source');
console.log(W.text({ bigMoves: 3, sessions: 1, secAvailable: true, byKind: { news: 33.3, filing: 33.3, unexplained: 33.3 }, weights: wt }).split('\n').slice(0, 4).join('\n'));
console.log('WHY TEST PASSED'); process.exit(0);
