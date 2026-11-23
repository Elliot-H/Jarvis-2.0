// node tests/elis.test.mjs  — strategy + a full simulated paper day against a fake Alpaca (no network).
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };

function makeDay(date, dir) {
  const bars = []; let p = 500, seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.04;
  for (let t = E.etMs(date, 19 * 60, -1); t < E.etMs(date, 570); t += 60e3) { p += rnd(); bars.push({ t, o: p, h: p + 0.03, l: p - 0.03, c: p + 0.01 }); }
  const pre = bars.filter(b => b.t >= E.etMs(date, 240)), ph = Math.max(...pre.map(b => b.h)), pl = Math.min(...pre.map(b => b.l));
  const lvl = bars.at(-1).c, at = (h, m) => E.etMs(date, h * 60 + m), add = (h, m, o, hi, lo, c) => bars.push({ t: at(h, m), o, h: hi, l: lo, c });
  for (let m = 30; m < 35; m++) add(9, m, lvl, lvl + 0.02, lvl - 0.02, lvl);
  if (dir === 'short') {
    add(9, 35, ph - .1, ph + .5, ph - .2, ph - .1); add(9, 36, ph - .1, ph - .05, ph - .3, ph - .25);
    add(9, 37, ph - .25, ph - .25, ph - 1, ph - .95); add(9, 38, ph - .95, ph - .6, ph - 1.1, ph - 1); add(9, 39, ph - 1, ph - .2, ph - 1.05, ph - .7);
    let x = ph - .7; for (let t = at(9, 40); t < E.etMs(date, 960); t += 60e3) { x -= 0.02; bars.push({ t, o: x, h: x + .01, l: x - .01, c: x }); }
  } else {
    add(9, 35, pl + .1, pl + .2, pl - .5, pl + .1); add(9, 36, pl + .1, pl + .3, pl + .05, pl + .25);
    add(9, 37, pl + .25, pl + 1, pl + .25, pl + .95); add(9, 38, pl + .95, pl + 1.1, pl + .6, pl + 1); add(9, 39, pl + 1, pl + 1.05, pl + .2, pl + .7);
    let x = pl + .7; for (let t = at(9, 40); t < E.etMs(date, 960); t += 60e3) { x += 0.02; bars.push({ t, o: x, h: x + .01, l: x - .01, c: x }); }
  }
  return bars;
}

// 1) strategy + backtest
for (const [dir, date] of [['short', '2026-11-18'], ['long', '2026-07-15']]) {   // one EST, one EDT date
  const b = makeDay(date, dir), lv = E.sessionLevels(b, date), rth = b.filter(x => x.t >= E.etMs(date, 570));
  const s = E.findSignal(rth, lv); const r = E.simulate(s, rth);
  console.log(dir, date, s?.side, s?.entry, s?.stop, s?.target, s?.reason, '->', r?.why, r?.r);
  assert(s && s.side === (dir === 'short' ? 'sell' : 'buy'), 'signal side'); assert(r.why === 'target' && r.r > 1.8, 'target hit');
}
assert(E.et(E.etMs('2026-07-15', 570)).min === 570 && E.et(E.etMs('2026-11-18', 570)).min === 570, 'DST conversion');
const bt = E.runBacktest([...makeDay('2026-11-17', 'short'), ...makeDay('2026-11-18', 'long')].sort((a, b) => a.t - b.t), ['2026-11-17', '2026-11-18']);
console.log('backtest', JSON.stringify({ ...bt, last: undefined })); assert(bt.trades === 2 && bt.totalR > 3.5, 'backtest');

// 2) live engine: simulated day 2026-11-18 against a fake Alpaca, clock advanced minute by minute
const date = '2026-11-18', DAY = makeDay(date, 'short');
let NOW = E.etMs(date, 570) + 4e3; Date.now = () => NOW;
const pushes = [], orders = []; let pos = null, equity = 30000;
global.fetch = async (url, opts = {}) => {
  const u = new URL(url), p = u.pathname, m = opts.method || 'GET';
  const J = (o, s = 200) => ({ ok: s < 300, status: s, text: async () => JSON.stringify(o) });
  if (p === '/v2/clock') return J({ is_open: true, next_close: new Date(E.etMs(date, 960)).toISOString(), next_open: new Date(E.etMs(date, 570, 1)).toISOString() });
  if (p === '/v2/account') return J({ equity: String(equity), last_equity: '30000', buying_power: '60000', daytrade_count: 0, shorting_enabled: true });
  if (p.startsWith('/v2/account/portfolio')) return J({ equity: [29000, 30000] });
  if (p.startsWith('/v2/assets')) return J({ shortable: true });
  if (p.startsWith('/v2/positions')) return m === 'DELETE' ? (pos = null, J({})) : pos ? J(pos) : J({ message: 'position does not exist' }, 404);
  if (p.includes('/bars')) { const s = Date.parse(u.searchParams.get('start')), e = Date.parse(u.searchParams.get('end'));
    return J({ bars: DAY.filter(b => b.t >= s && b.t < e && b.t + 60e3 <= NOW).map(b => ({ t: new Date(b.t).toISOString(), o: b.o, h: b.h, l: b.l, c: b.c, v: 100 })), next_page_token: null }); }
  if (p === '/v2/orders' && m === 'POST') { const b = JSON.parse(opts.body); const o = { id: 'ord1', ...b, status: 'new', filled_qty: '0', submitted_at: new Date(NOW).toISOString(), legs: [{ id: 'tp', type: 'limit', status: 'held', limit_price: b.take_profit.limit_price }, { id: 'sl', type: 'stop', status: 'held', stop_price: b.stop_loss.stop_price }] }; orders.push(o); return J(o); }
  if (p === '/v2/orders') return J(orders);
  if (p.startsWith('/v2/orders/')) return J(orders[0]);
  throw new Error('unmocked ' + p);
};
const huds = []; E.start({ push: async (t, b) => { pushes.push(`${t} | ${b}`); }, hud: m => huds.push(m) });
for (; NOW < E.etMs(date, 16 * 60); NOW += 60e3) {
  const o = orders[0], bar = DAY.find(b => b.t === NOW - 4e3 - 60e3);   // bar that just closed
  if (o && bar) {   // broker simulation
    const px = +o.limit_price, sell = o.side === 'sell';
    if (o.filled_qty === '0' && (sell ? bar.h >= px : bar.l <= px)) { Object.assign(o, { status: 'filled', filled_qty: o.qty, filled_avg_price: o.limit_price }); o.legs.forEach(l => l.status = 'new'); pos = { qty: o.qty }; }
    else if (o.status === 'filled' && pos) { const tp = o.legs[0], sl = o.legs[1];
      if (sell ? bar.l <= +tp.limit_price : bar.h >= +tp.limit_price) { Object.assign(tp, { status: 'filled', filled_qty: o.qty, filled_avg_price: tp.limit_price }); sl.status = 'canceled'; pos = null; equity += (+o.limit_price - +tp.limit_price) * +o.qty; } }
  }
  await E._tick();
}
console.log(pushes.join('\n'));
assert(orders.length === 1 && orders[0].order_class === 'bracket' && orders[0].side === 'sell', 'one bracket short order');
assert(pushes.some(x => x.includes('TARGET hit')) && pushes.some(x => x.includes('daily report')), 'target + report pushed');
const sm = await E.summary(true); console.log('hud', JSON.stringify(sm));
assert(Math.abs(sm.elisLifetime - 90.86) < 0.01 && Math.abs(sm.elisToday - 90.86) < 0.01 && sm.tradeDays === 1 && sm.series.length === 1, 'HUD P/L numbers');
console.log('ALL ELIS TESTS PASSED'); process.exit(0);
