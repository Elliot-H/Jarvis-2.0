// node tests/elis-wave.test.mjs — Wave strategy: rank() + a full simulated day against a fake Alpaca (no network).
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40); process.env.ELIS_STRATEGIES = 'wave';
const E = await import('../elis.js'), WV = await import('../elis-wave.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const date = '2026-11-18', T = (h, m, d = date) => E.etMs(d, h * 60 + m);
// symbols: AAA strong long + news, BBB strong short, CCC normal volume (not in play), DDD cheap (filtered)
const SPEC = { AAA: { px: 50, dir: 1, rv: 4, news: 'AAA wins FDA approval for lead drug' }, BBB: { px: 80, dir: -1, rv: 3 }, CCC: { px: 30, dir: 1, rv: 0.6 }, DDD: { px: 3, dir: 1, rv: 9 } };
const past = ['2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-17'];
function dailyBars(s) { const p = SPEC[s].px; return past.concat(['2026-11-16']).sort().map((d, i) => ({ t: new Date(T(0, 0, d)).toISOString(), o: p, h: p + 1, l: p - 1, c: p, v: 2e6 })); }
function path(s, t) {   // price path during the day
  const sp = SPEC[s], m = (t - T(9, 30)) / 60e3;
  if (m < 5) return sp.px + sp.dir * m * 0.05;                    // first 5 min drift in direction
  if (s === 'BBB' && m > 40) return sp.px + 2;                     // BBB reverses up later -> stop
  return sp.px + sp.dir * (0.25 + (m - 5) * 0.02);                 // breakout then trend
}
let NOW = T(9, 0); Date.now = () => NOW;
const orders = [], pos = {}, pushes = [];
global.fetch = async (url, opts = {}) => {
  const u = new URL(url), p = u.pathname, m = opts.method || 'GET', sp = u.searchParams;
  const J = (o, s = 200) => ({ ok: s < 300, status: s, text: async () => JSON.stringify(o) });
  if (p === '/v2/clock') return J({ is_open: NOW >= T(9, 30) && NOW < T(16, 0), next_open: new Date(NOW < T(9, 30) ? T(9, 30) : T(9, 30) + 86400e3).toISOString(), next_close: new Date(T(16, 0)).toISOString() });
  if (p.includes('most-actives')) return J({ most_actives: [{ symbol: 'AAA' }, { symbol: 'CCC' }] });
  if (p.includes('movers')) return J({ gainers: [{ symbol: 'DDD' }], losers: [{ symbol: 'BBB' }] });
  if (p === '/v1beta1/news') return J({ news: [{ headline: SPEC.AAA.news, symbols: ['AAA'] }], next_page_token: null });
  if (p === '/v2/calendar') return J(past.map(d => ({ date: d })).concat([{ date }]));
  if (p === '/v2/stocks/bars') {
    const syms = sp.get('symbols').split(',').filter(s => SPEC[s]), tf = sp.get('timeframe'), st = Date.parse(sp.get('start')), bars = {};
    for (const s of syms) {
      if (tf === '1Day') bars[s] = dailyBars(s);
      else if (st === T(9, 30)) { if (NOW >= T(9, 35)) { const o = path(s, T(9, 30)), c = path(s, T(9, 34, date) + 59e3); bars[s] = [{ t: new Date(T(9, 30)).toISOString(), o, h: Math.max(o, c) + 0.02, l: Math.min(o, c) - 0.02, c, v: 10000 * SPEC[s].rv }]; } }
      else bars[s] = [{ t: new Date(st).toISOString(), o: 1, h: 1, l: 1, c: 1, v: 10000 }];
    }
    return J({ bars, next_page_token: null });
  }
  if (p === '/v2/stocks/trades/latest') return J({ trades: Object.fromEntries(sp.get('symbols').split(',').map(s => [s, { p: Math.round(path(s, NOW) * 100) / 100 }])) });
  if (p === '/v2/account') return J({ equity: '100000', last_equity: '100000', buying_power: '400000', daytrade_count: 0, shorting_enabled: true });
  if (p.startsWith('/v2/account/portfolio')) return J({ equity: [100000] });
  if (p.startsWith('/v2/assets/')) return J({ shortable: true, easy_to_borrow: true });
  if (p.startsWith('/v2/positions/')) { const s = p.split('/').pop(); return pos[s] ? J(pos[s]) : J({ message: 'no position' }, 404); }
  if (p === '/v2/orders' && m === 'POST') {
    const b = JSON.parse(opts.body), px = Math.round(path(b.symbol, NOW) * 100) / 100, sg = b.side === 'buy' ? 1 : -1;
    const o = { id: 'o' + orders.length, ...b, status: 'filled', filled_qty: b.qty, filled_avg_price: String(px), legs: b.stop_loss ? [{ id: 'sl' + orders.length, type: 'stop', status: 'new', side: b.side === 'buy' ? 'sell' : 'buy', stop_price: b.stop_loss.stop_price }] : [] };
    orders.push(o);
    const cur = pos[b.symbol] ? +pos[b.symbol].qty : 0, nq = cur + sg * +b.qty;
    if (nq === 0) delete pos[b.symbol]; else pos[b.symbol] = { qty: String(nq), entry: px, market_value: String(nq * px), unrealized_pl: '0' };
    return J(o);
  }
  if (p.startsWith('/v2/orders/') && m === 'DELETE') { const id = p.split('/').pop(); for (const o of orders) for (const x of [o, ...o.legs]) if (x.id === id) x.status = 'canceled'; return J({}); }
  if (p.startsWith('/v2/orders/')) return J(orders.find(o => o.id === p.split('/').pop()));
  if (p === '/v2/orders') return J(orders);
  throw new Error('unmocked ' + p);
};
// rank() unit check
const r = WV.rank({ X: { avgOpenVol: 100, atr: 1, prevClose: 10, news: true }, Y: { avgOpenVol: 100, atr: 1, prevClose: 10 } }, { X: { o: 10, h: 10.5, l: 9.9, c: 10.4, v: 150 }, Y: { o: 10, h: 10.1, l: 9.5, c: 9.6, v: 170 } });
assert(r[0].sym === 'X' && r[0].dir === 'long' && r[1].dir === 'short', 'rank: news boost + direction');

E.start({ push: async (t, b) => { pushes.push(`${t} | ${b}`); }, hud: () => {} }); WV.start();
for (; NOW < T(16, 0); NOW += 15e3) {
  for (const o of orders) for (const l of o.legs) if (l.status === 'new' && pos[o.symbol]) {   // broker: stop legs
    const px = path(o.symbol, NOW), hit = l.side === 'sell' ? px <= +l.stop_price : px >= +l.stop_price;
    if (hit) { Object.assign(l, { status: 'filled', filled_qty: o.qty, filled_avg_price: l.stop_price }); delete pos[o.symbol]; }
  }
  await WV._tick();
}
console.log(pushes.join('\n')); console.log(JSON.stringify(WV.status().picks));
const ent = orders.filter(o => o.order_class === 'oto');
assert(ent.length === 2 && ent.some(o => o.symbol === 'AAA' && o.side === 'buy') && ent.some(o => o.symbol === 'BBB' && o.side === 'sell'), 'entries AAA long + BBB short');
assert(!orders.some(o => ['CCC', 'DDD'].includes(o.symbol)), 'CCC (not in play) and DDD (< $5) never traded');
assert(pushes.some(x => x.includes('wave STOP BBB')), 'BBB stopped out');
assert(orders.some(o => o.symbol === 'AAA' && /-flat-/.test(o.client_order_id)) && !pos.AAA, 'AAA flattened at the close');
assert(ent.every(o => /^elisw-20261118-/.test(o.client_order_id)), 'tagged orders');
console.log('ALL WAVE TESTS PASSED'); process.exit(0);
