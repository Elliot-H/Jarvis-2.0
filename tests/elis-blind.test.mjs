import assert from 'node:assert';
import * as B from '../elis-blind.js';
// grading: 60 right of 100 calls -> 60%; momentum baseline and flats counted
const t = []; for (let i = 0; i < 200; i++) t.push({ truth: i < 20 ? 'flat' : i % 5 < 3 ? 'up' : 'down', call: i < 120 ? 'up' : null, conf: 0.6, why: 'move=rising & market=market rising', R: i % 5 < 3 ? 0.5 : -1, mom: 'up', momR: 0.1 });
const g = B.grade(t); console.log(B.text({ ...g, testedOn: 'x', learnedOn: 'y' }));
assert(g.flatPct === 10 && g.callPct === 60 && g.calls === 100 && g.accuracy === 60, 'grading counts');
// the caller picks the most one-sided learned read and abstains on weak ones
const table = { 'move=rising & candle=candle-with': { up: 140, down: 60 }, 'move=rising & market=market rising': { up: 55, down: 45 } };
const f = { move: 'rising', candle: 'candle-with', structure: 'range', vwap: 'above VWAP', volume: 'vol-normal', market: 'market rising', time: 'midday', pattern: 'none' };
const c = B.call(table, f); assert(c.dir === 'up' && /candle-with/.test(c.why) && c.conf === 0.7, 'strongest read wins');
assert(!B.call({ 'move=rising & market=market rising': { up: 53, down: 47 } }, f), 'no call on a weak read');
// outcome: hidden 30 min graded, stop honored
const cs = Array.from({ length: 20 }, (_, i) => ({ t: i, o: 100, h: 100.2 + (i > 10 ? i - 10 : 0), l: 99.8, c: 100 + (i > 10 ? i - 10 : 0) }));
const o = B.outcome(cs, 10, 2, 'up'); assert(o.truth === 'up' && o.R > 0, 'hidden move graded');
console.log('BLIND TEST PASSED');
