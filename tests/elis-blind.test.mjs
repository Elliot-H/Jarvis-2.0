import assert from 'node:assert';
import * as B from '../elis-blind.js';
// grading: 60 right of 100 calls -> 60%; momentum baseline and flats counted
const t = []; for (let i = 0; i < 200; i++) t.push({ truth: i < 20 ? 'flat' : i % 5 < 3 ? 'up' : 'down', call: i < 120 ? 'up' : null, conf: 0.6, why: 'move=rising & market=market rising', R: i % 5 < 3 ? 0.5 : -1, mom: 'up', momR: 0.1 });
const g = B.grade(t); 
assert(g.flatPct === 10 && g.callPct === 60 && g.calls === 100 && g.accuracy === 60, 'grading counts');
// the caller picks the most one-sided learned read and abstains on weak ones
const table = { 'move=rising & candle=candle-with': { up: 140, down: 60 }, 'move=rising & market=market rising': { up: 55, down: 45 } };
const f = { move: 'rising', candle: 'candle-with', structure: 'range', vwap: 'above VWAP', volume: 'vol-normal', market: 'market rising', time: 'midday', pattern: 'none' };
const c = B.call(table, f, { minN: 80 }); assert(c.dir === 'up' && /candle-with/.test(c.why) && c.conf === 0.7, 'strongest read wins');
assert(!B.call({ 'move=rising & market=market rising': { up: 53, down: 47 } }, f), 'no call on a weak read');
// outcome: hidden 30 min graded, stop honored
const cs = Array.from({ length: 20 }, (_, i) => ({ t: i, o: 100, h: 100.2 + (i > 10 ? i - 10 : 0), l: 99.8, c: 100 + (i > 10 ? i - 10 : 0) }));
const o = B.outcome(cs, 10, 2, 'up'); assert(o.truth === 'up' && o.R > 0, 'hidden move graded');
// the loop: one planted condition makes calls wrong (bad news + gap) -> the why finds it, abstains, tune accuracy rises
let sd = 5; const rr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
const mk = n => Array.from({ length: n }, () => { const up = rr() < 0.5, trap = rr() < 0.3, real = trap ? rr() < 0.5 : (rr() < 0.68 ? up : !up);
  return { f: { move: up ? 'rising' : 'dropping', candle: 'candle-none', structure: 'range', vwap: 'above VWAP', volume: 'vol-normal', market: 'market flat', time: 'midday', pattern: 'none', gap: 'no gap', news: trap ? 'news neg' : 'no news', newsType: 'none', rvol: 'rvol 1-2', mktGap: 'x', fear: 'x', regime: 'x', sector: 'x', buzz: 'x' }, truth: real ? 'up' : 'down', Rup: real ? 0.5 : -1, Rdn: real ? -1 : 0.5, mom: null }; });
const table2 = B.learn(mk(6000)), tune = mk(3000), base = B.evaluate(table2, tune, B.BASE).g, L = await B.loop(table2, tune, { target: 99 });
console.log(base.accuracy, '->', L.tune.accuracy, L.steps.map(s => s.change));
assert(L.tune.accuracy > base.accuracy + 3 && L.steps.some(s => /news = news neg/.test(s.change)), 'the loop uses the why to fix its calls');
console.log('BLIND TEST PASSED');
