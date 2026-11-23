// node tests/elis-learn.test.mjs — learning module: replay, weights, walk-forward adoption, rollback, bootstrap (fake Alpaca, no network).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'elis-')); process.env.DATA_DIR = tmp;
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), L = await import('../elis-learn.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
// 60 weekday sessions
const days = []; for (let t = Date.UTC(2026, 7, 3); days.length < 60; t += 86400e3) { const d = new Date(t); if (d.getUTCDay() % 6) days.push(d.toISOString().slice(0, 10)); }
const syms = ['FDA1', 'FDA2', 'NON1', 'NON2', 'ERN1', 'ANT1', 'NWS1'];
let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rows = [], PATHS = {};
for (const d of days) {
  const spyDir = rnd() > 0.5 ? 'long' : 'short';
  for (const s of syms) {
    const dir = s === 'ANT1' ? (spyDir === 'long' ? 'short' : 'long') : spyDir, sg = dir === 'long' ? 1 : -1, px = 50, atr = 2;
    const good = s.startsWith('FDA') || s === 'NWS1' || (s === 'ERN1' && rnd() > 0.4), cat = s.startsWith('FDA') || s === 'NWS1' ? 'fda' : s === 'ERN1' ? 'earnings' : 'none';
    const bars = []; let p = px;
    for (let m = 0; m < 390; m++) {
      if (s === 'NWS1' && m === 61) p -= sg * 6;   // bad news at 10:30 -> the next candle opens far lower (gap through any stop)
      const o = p;
      if (s === 'NWS1' && m === 61) {}
      else if (m < 5) p += sg * 0.04; else if (good) p += sg * (0.012 + (rnd() - 0.5) * 0.02); else p += (m < 6 ? sg * 0.05 : -sg * 0.03) + (rnd() - 0.5) * 0.02;
      bars.push([m, o, Math.max(o, p) + 0.01, Math.min(o, p) - 0.01, p, 1000]);
    }
    (PATHS[d] ||= {})[s] = bars;
    const orH = Math.max(...bars.slice(0, 5).map(b => b[2])), orL = Math.min(...bars.slice(0, 5).map(b => b[3]));
    rows.push({ date: d, sym: s, dir, rvol: s === 'NWS1' ? 5 : 2 + rnd() * 2, gapPct: sg * 2, atr, orHigh: orH, orLow: orL, open: px, cat, news: cat !== 'none', tone: cat !== 'none' ? 'news-pos' : 'none', spyDir,
      intraday: s === 'NWS1' ? [{ m: 60, tone: dir === 'long' ? 'neg' : 'pos', headline: 'NWS1 FDA rescinds approval' }] : [] });
  }
}
fs.mkdirSync(path.join(tmp, 'elis'), { recursive: true });
fs.writeFileSync(path.join(tmp, 'elis', 'journal.jsonl'), rows.map(r => JSON.stringify(r)).join('\n') + '\n');
global.fetch = async url => {
  const u = new URL(url), sp = u.searchParams, J = o => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (u.pathname === '/v2/stocks/bars' && sp.get('timeframe') === '1Min') {
    const d = E.et(Date.parse(sp.get('start'))).date, out = {};
    for (const s of sp.get('symbols').split(',')) out[s] = (PATHS[d]?.[s] || []).map(([m, o, h, l, c, v]) => ({ t: new Date(E.etMs(d, 570) + m * 60e3).toISOString(), o, h, l, c, v }));
    return J({ bars: out, next_page_token: null });
  }
  throw new Error('unmocked ' + u.pathname);
};
// replay sanity: a trending FDA long wins, a fading NON loses
const d0 = days[0], bar = s => PATHS[d0][s].map(([m, o, h, l, c, v]) => ({ t: E.etMs(d0, 570) + m * 60e3, o, h, l, c, v }));
const rF = L.simulate(bar('FDA1'), rows.find(r => r.date === d0 && r.sym === 'FDA1'), L.DEFAULTS), rN = L.simulate(bar('NON1'), rows.find(r => r.date === d0 && r.sym === 'NON1'), L.DEFAULTS);
console.log('replay FDA1', rF?.toFixed(2), 'NON1', rN?.toFixed(2)); assert(rF > 1 && rN < 0, 'replay wins/losses');

const rep = await L.learn();
console.log(L.summaryLine(rep)); console.log(L.moneyText(rep));
assert(rep.money.before.start === 3000 && rep.money.after.end > rep.money.before.end && rep.money.unseenAfter.trades > 0, 'money replay before/after from $3,000');
assert(rep.money.after.monthly.length >= 2 && rep.money.after.maxDrawdownPct >= 0, 'monthly curve + drawdown');
console.log('weights cat:', JSON.stringify(L.params().mult.cat), 'market:', JSON.stringify(L.params().mult.market));
assert(rep.adopted && rep.learned.avgR > rep.current.avgR, 'adopted only because unseen days improved');
assert(L.params().mult.cat.fda > 1.1 && L.params().mult.cat.none < 0.95, 'learned: FDA news predicts winners, no-news does not');
assert(L.params().mult.market['against-market'] < 1, 'learned: against-market is weaker');
for (const v of Object.values(L.params().mult).flatMap(Object.values)) assert(v >= 0.5 && v <= 1.6, 'weights bounded');
assert(!('riskPct' in L.params()), 'learner never touches risk per trade');
assert(L.params().newsExit === true, 'learned: selling on bad mid-day news pays');
const o1 = {}, o2 = {}, nb = PATHS[d0].NWS1.map(([m, o, h, l, c, v]) => ({ t: E.etMs(d0, 570) + m * 60e3, o, h, l, c, v })), nr = rows.find(r => r.date === d0 && r.sym === 'NWS1');
const withExit = L.simulate(nb, nr, { ...L.DEFAULTS, newsExit: true }, o1), noExit = L.simulate(nb, nr, { ...L.DEFAULTS, newsExit: false }, o2);
console.log('NWS1 news exit', withExit.toFixed(1), o1.why, '| holding', noExit.toFixed(1), o2.why); assert(withExit > noExit + 3, 'news exit beats holding through the gap');
assert(rep.whatPredictsWins['outcome:midTradeNews'] && rep.whatPredictsWins['chart:candle'], 'report covers mid-trade news and chart reads');
// rollback: 15 live trades far worse than promised -> previous settings restored
let msg = null; for (let i = 0; i < 15; i++) msg = L.recordLive(-0.8) || msg;
console.log(msg); assert(msg && /Rolled back/.test(msg) && Object.keys(L.params().mult).length === 0, 'rollback to previous settings');
console.log('ALL LEARN TESTS PASSED'); process.exit(0);
