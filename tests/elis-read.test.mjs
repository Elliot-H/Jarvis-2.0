// node tests/elis-read.test.mjs — candle patterns, flags, chart read, headline tone.
const R = await import('../elis-read.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const C = (o, h, l, c, v = 100) => ({ o, h, l, c, v });
const down = [C(10, 10.1, 9.7, 9.8), C(9.8, 9.85, 9.5, 9.55), C(9.55, 9.6, 9.3, 9.35), C(9.35, 9.4, 9.1, 9.15)], upT = down.map(x => C(20 - x.o, 20 - x.l, 20 - x.h, 20 - x.c));
const has = (cs, name) => R.candlePatterns(cs).some(p => p.name === name);
assert(has([...down, C(9.0, 9.22, 8.6, 9.2)], 'hammer'), 'hammer after decline');
assert(has([...upT, C(10.85, 11.5, 10.75, 10.95)], 'shooting star'), 'shooting star after rise');
assert(has([...down, C(9.1, 9.12, 8.9, 8.95), C(8.9, 9.3, 8.88, 9.25)], 'bullish engulfing'), 'bullish engulfing');
assert(has([...upT, C(10.9, 11.1, 10.85, 11.05), C(11.1, 11.12, 10.7, 10.75)], 'bearish engulfing'), 'bearish engulfing');
assert(has([...down, C(9.15, 9.16, 8.6, 8.65), C(8.6, 8.66, 8.55, 8.62), C(8.65, 9.1, 8.64, 9.05)], 'morning star'), 'morning star');
assert(has([C(10, 10.32, 9.99, 10.3), C(10.3, 10.62, 10.29, 10.6), C(10.6, 10.92, 10.59, 10.9)], 'three white soldiers'), 'three white soldiers');
assert(has([C(10, 10.2, 9.8, 10.001)], 'doji'), 'doji');
assert(R.flag([C(10, 10.02, 10, 10.01, 500), C(10, 11, 9.99, 10.95, 5000), C(10.95, 10.97, 10.8, 10.85, 1500), C(10.85, 10.9, 10.75, 10.8, 1200)]) === 'bull flag', 'bull flag');
// full read: trending up on rising volume -> with
const t0 = Date.UTC(2026, 10, 18, 14, 30), bars = Array.from({ length: 40 }, (_, i) => ({ t: t0 + i * 60e3, o: 10 + i * 0.02, h: 10.03 + i * 0.02, l: 9.99 + i * 0.02, c: 10.02 + i * 0.02, v: i > 36 ? 5000 : 1000 }));
const rd = R.read(bars, 'long', t0, 1); console.log(rd.text, rd.feat);
assert(rd.feat.vwap === 'vwap-with' && rd.feat.volume === 'vol-strong' && rd.feat.structure === 'trend-with', 'chart read long');
const rs = R.read(bars, 'short', t0, 1); assert(rs.feat.vwap === 'vwap-against' && rs.feat.structure === 'trend-against', 'chart read short');
// headlines
const T = { 'FDA rescinds approval for Acme lead drug': 'neg', 'Acme receives Complete Response Letter from FDA': 'neg', 'Acme announces $200M public offering': 'neg', 'Acme beats estimates, raises guidance': 'pos', 'Acme wins $1B Army contract': 'pos', 'Acme downgraded to Sell at Citi': 'neg', 'Acme to present at conference': 'neutral', 'FDA approves Acme drug': 'pos' };
for (const [h, want] of Object.entries(T)) { const got = R.tone(h); console.log(want === got ? 'ok ' : 'XX ', got.padEnd(7), h); assert(got === want, 'tone: ' + h); }
assert(R.adverse('neg', 'long') && R.adverse('pos', 'short') && !R.adverse('pos', 'long'), 'adverse');
console.log('ALL READ TESTS PASSED');
