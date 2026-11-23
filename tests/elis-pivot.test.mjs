// node tests/elis-pivot.test.mjs — pivot study finds warning signs (news + chart) that hold on unseen days; pivot exit uses them.
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), PV = await import('../elis-pivot.js'), L = await import('../elis-learn.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
// a stock-day: drifts up; at a random minute a bad headline hits -> 25 min later it drops hard; volume surges right before drops
function day(d, i) {
  const t0 = E.etMs(d, 570), bars = [], newsAt = 60 + Math.floor((i * 37) % 200), dropAt = newsAt + 10; let p = 50;
  for (let m = 0; m < 390; m++) {
    const o = p; p += m > dropAt && m < dropAt + 20 ? -0.08 : 0.01 + rnd() * 0.05;
    const v = m > newsAt && m <= dropAt ? 4000 : 1000;
    bars.push({ t: t0 + m * 60e3, o, h: Math.max(o, p) + 0.02, l: Math.min(o, p) - 0.02, c: p, v });
  }
  return { bars, row: { sym: 'X' + i, atr: 2, tone: 'news-pos', cat: 'fda', news: true, intraday: [{ m: newsAt, tone: 'neg', headline: 'X rescinds guidance' }], ctx: { sector: 'with-sector', fear: 'fear-calm', mktGap: 'spy-flat', buzz: 'buzz-unknown' } }, t0 };
}
const days = []; for (let t = Date.UTC(2025, 0, 2); days.length < 60; t += 86400e3) { const d = new Date(t); if (d.getUTCDay() % 6) days.push(d.toISOString().slice(0, 10)); }
const count = ds => { const T = PV.newTable(); ds.forEach((d, j) => { for (let i = 0; i < 6; i++) { const x = day(d, j * 6 + i); for (const [f, o] of PV.samples(x.bars, x.t0, 2, null, x.row)) PV.add(T, f, o); } }); return T; };
const train = count(days.slice(0, 40)), test = count(days.slice(40));
const v = PV.validate(train, test, { minTrain: 40, minTest: 15 });
const base = { up: test.base.up / test.base.n, down: test.base.down / test.base.n };
console.log('samples', train.base.n + test.base.n); console.log(PV.textOf(v, base, 4));
assert(v.some(s => s.dir === 'down' && /recent-news-bad/.test(s.signs)), 'learned: a bad headline in the last 30 min warns of a drop (held on unseen days)');
assert(v.some(s => s.dir === 'down' && /vol-(rising|surge)/.test(s.signs)), 'learned: volume surge warns of the drop');
// pivot exit in the replay leaves before the drop
const x = day(days[50], 999), table = PV.compile(v), c = { date: days[50], dir: 'long', orHigh: x.bars.slice(0, 5).reduce((a, b) => Math.max(a, b.h), 0), orLow: 49, atr: 2, rvol: 3, ...x.row };
const o1 = {}, o2 = {}, withP = L.simulate(x.bars, c, { ...L.DEFAULTS, exitMode: 'close', newsExit: false, pivotExit: 0.5, pivotTable: table }, o1), noP = L.simulate(x.bars, c, { ...L.DEFAULTS, exitMode: 'close', newsExit: false }, o2);
console.log('pivot exit', withP?.toFixed(2), o1.why, '| hold', noP?.toFixed(2), o2.why);
assert(/pivot warning/.test(o1.why || '') && withP > noP, 'pivot exit sells on the warning signs and beats holding');
// formula search: after a strong run-up, a volume surge + bad headline reverses it (hidden edge); found on train AND unseen days
const fday = (d, i) => { const t0 = E.etMs(d, 570), bars = []; let p = 50; const hot = i % 2 === 0;
  for (let m = 0; m < 390; m++) { const o = p; const ph = m % 60;   // every hour: 30 min strong run, then either reversal (hot) or noise
    p += ph < 30 ? 0.045 : hot ? -0.06 : (rnd() * 0.06); const v = hot && ph >= 26 && ph < 30 ? 5000 : 1000;
    bars.push({ t: t0 + m * 60e3, o, h: Math.max(o, p) + 0.01, l: Math.min(o, p) - 0.01, c: p, v }); }
  return { bars, t0, row: { atr: 2, tone: 'none', intraday: hot ? [0, 60, 120, 180, 240, 300].map(h => ({ m: h + 28, tone: 'neg', headline: 'bad' })) : [], ctx: {} } }; };
const fc = ds => { const F = PV.newF(); ds.forEach((d, j) => { for (let i = 0; i < 6; i++) { const x = fday(d, j * 6 + i); PV.formulaAdd(F, x.bars, x.t0, 2, null, x.row); } }); return F; };
const Ftr = fc(days.slice(0, 40)), Fte = fc(days.slice(40)), fl = PV.formulas(Ftr, Fte, { minTrain: 40, minTest: 15 });
console.log(PV.formulaText(fl, PV.formulaBaseline(Ftr), PV.formulaBaseline(Fte), Ftr.m.size, 3));
assert(fl.some(x => x.trade === 'go AGAINST the strong move' && /vol-(rising|surge)|recent-news-bad/.test(x.signs) && x.unseen.avgR > 0.3), 'formula search finds the hidden reversal formula on unseen days');
console.log('PIVOT TEST PASSED'); process.exit(0);
