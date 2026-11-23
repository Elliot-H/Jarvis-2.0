// node tests/elis-wave.test.mjs — Wave strategy: rank() + a full simulated day against a fake Alpaca (no network).
process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40); process.env.ELIS_STRATEGIES = 'wave';
const E = await import('../elis.js'), WV = await import('../elis-wave.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const date = '2026-11-18', T = (h, m, d = date) => E.etMs(d, h * 60 + m);
// symbols: AAA strong long + news, BBB strong short, CCC normal volume (not in play), DDD cheap (filtered)
const SPEC = { AAA: { px: 50, dir: 1, rv: 4, news: 'AAA wins FDA approval for lead drug' }, BBB: { px: 80, dir: -1, rv: 3 }, EEE: { px: 40, dir: 1, rv: 2 }, CCC: { px: 30, dir: 1, rv: 0.6 }, DDD: { px: 3, dir: 1, rv: 9 }, SPY: { px: 500, dir: 1, rv: 1 } };
const past = ['2026-10-27','2026-10-28','2026-10-29','2026-10-30','2026-10-31','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-10','2026-11-11','2026-11-12','2026-11-13','2026-11-14','2026-11-17'];
function dailyBars(s) { const p = SPEC[s].px; return past.concat(['2026-11-16']).sort().map((d, i) => ({ t: new Date(T(0, 0, d)).toISOString(), o: p, h: p + 1, l: p - 1, c: p, v: 2e6 })); }
function path(s, t) {   // price path during the day
  const sp = SPEC[s], m = (t - T(9, 30)) / 60e3;
  if (m < 5) return sp.px + sp.dir * m * 0.05;                    // first 5 min drift in direction
  if (s === 'BBB' && m > 40) return sp.px + 2;                     // BBB reverses up later -> trailing stop (in profit)
  if (s === 'EEE') return sp.px + 0.25 + Math.min((m - 5) * 0.02, 0.1); // EEE stalls just above entry -> sold at 11:00
  return sp.px + sp.dir * (0.25 + (m - 5) * 0.02);                 // breakout then trend
}
let NOW = T(9, 0); Date.now = () => NOW;
const orders = [], pos = {}, pushes = [], stops = []; let rid = 0;
global.fetch = async (url, opts = {}) => {
  const u = new URL(url), p = u.pathname, m = opts.method || 'GET', sp = u.searchParams;
  const J = (o, s = 200) => ({ ok: s < 300, status: s, text: async () => JSON.stringify(o) });
  if (p === '/v2/clock') return J({ is_open: NOW >= T(9, 30) && NOW < T(16, 0), next_open: new Date(NOW < T(9, 30) ? T(9, 30) : T(9, 30) + 86400e3).toISOString(), next_close: new Date(T(16, 0)).toISOString() });
  if (p.includes('most-actives')) return J({ most_actives: [{ symbol: 'AAA' }, { symbol: 'CCC' }, { symbol: 'EEE' }] });
  if (p.includes('movers')) return J({ gainers: [{ symbol: 'DDD' }], losers: [{ symbol: 'BBB' }] });
  if (p === '/v1beta1/news') {
    const st = Date.parse(sp.get('start') || 0), items = [{ id: 1, headline: SPEC.AAA.news, symbols: ['AAA'], created_at: new Date(T(8, 0)).toISOString() }, { id: 2, headline: 'EEE receives Complete Response Letter from FDA', symbols: ['EEE'], created_at: new Date(T(10, 20)).toISOString() }];
    return J({ news: items.filter(n => Date.parse(n.created_at) >= st && Date.parse(n.created_at) <= NOW), next_page_token: null });
  }
  if (p === '/v2/calendar') return J(past.map(d => ({ date: d })).concat([{ date }]));
  if (p === '/v2/stocks/bars') {
    const syms = sp.get('symbols').split(',').filter(s => SPEC[s]), tf = sp.get('timeframe'), st = Date.parse(sp.get('start')), bars = {};
    for (const s of syms) {
      if (tf === '1Day') bars[s] = dailyBars(s);
      else if (tf === '1Min') { const en = Math.min(Date.parse(sp.get('end')), NOW), a = []; for (let t = st; t + 60e3 <= en; t += 60e3) { const o = path(s, t), c = path(s, t + 59e3); a.push({ t: new Date(t).toISOString(), o, h: Math.max(o, c), l: Math.min(o, c), c, v: 1000 }); } bars[s] = a; }
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
  if (p.startsWith('/v2/orders/') && m === 'PATCH') {   // real Alpaca: a replace creates a NEW order; the old one becomes 'replaced'
    const id = p.split('/').pop(), b = JSON.parse(opts.body), old = [...orders.flatMap(o => o.legs.map(l => [o, l])), ...stops.map(x => [x.parent, x])].find(([, x]) => x.id === id);
    if (!old || !['new', 'accepted'].includes(old[1].status)) return J({ message: 'order is not open' }, 422);
    const nw = { id: 'rp' + (++rid), parent: old[0], symbol: old[0].symbol, type: 'stop', side: old[1].side, qty: old[0].qty, status: 'new', stop_price: b.stop_price, submitted_at: new Date(NOW).toISOString() };
    Object.assign(old[1], { status: 'replaced', replaced_by: nw.id }); stops.push(nw); return J(nw);
  }
  if (p.startsWith('/v2/orders/') && m === 'DELETE') { const id = p.split('/').pop(); for (const x of [...orders, ...orders.flatMap(o => o.legs), ...stops]) if (x.id === id && ['new', 'accepted', 'held'].includes(x.status)) x.status = 'canceled'; return J({}); }
  if (p.startsWith('/v2/orders/')) { const id = p.split('/').pop(); return J(orders.find(o => o.id === id) || orders.flatMap(o => o.legs).find(l => l.id === id) || stops.find(x => x.id === id)); }
  if (p === '/v2/orders' && sp.get('status') === 'open') return J(stops.filter(x => x.status === 'new' && (!sp.get('symbols') || x.symbol === sp.get('symbols'))).map(({ parent, ...x }) => x));
  if (p === '/v2/orders') return J(orders);
  throw new Error('unmocked ' + p);
};
// rank() unit check
const r = WV.rank({ X: { avgOpenVol: 100, atr: 1, prevClose: 10, news: true }, Y: { avgOpenVol: 100, atr: 1, prevClose: 10 } }, { X: { o: 10, h: 10.5, l: 9.9, c: 10.4, v: 150 }, Y: { o: 10, h: 10.1, l: 9.5, c: 9.6, v: 170 } });
assert(r[0].sym === 'X' && r[0].dir === 'long' && r[1].dir === 'short', 'rank: news boost + direction');

E.start({ push: async (t, b) => { pushes.push(`${t} | ${b}`); }, hud: () => {} }); WV.start();
for (; NOW < T(16, 0); NOW += 15e3) {
  for (const [o, l] of [...orders.flatMap(o => o.legs.map(l => [o, l])), ...stops.map(x => [x.parent, x])]) if (l.status === 'new' && pos[o.symbol]) {   // broker: live stops
    const px = path(o.symbol, NOW), hit = l.side === 'sell' ? px <= +l.stop_price : px >= +l.stop_price;
    if (hit) { Object.assign(l, { status: 'filled', filled_qty: o.qty, filled_avg_price: l.stop_price }); delete pos[o.symbol]; }
  }
  await WV._tick();
}
console.log(pushes.join('\n')); console.log(JSON.stringify(WV.status().picks));
const ent = orders.filter(o => o.order_class === 'oto');
assert(ent.length === 3 && ent.some(o => o.symbol === 'AAA' && o.side === 'buy') && ent.some(o => o.symbol === 'BBB' && o.side === 'sell') && ent.some(o => o.symbol === 'EEE'), 'entries AAA long, BBB short, EEE long');
assert(pushes.some(x => x.includes('wave HOLDING AAA')), 'AAA kept at 11:00 (trending)');
assert(pushes.some(x => /wave SOLD EEE \| bad news for the long: "EEE receives Complete Response Letter/.test(x)), 'EEE sold on mid-day bad news');
assert(pushes.some(x => /daily review/.test(x) && /EEE long/.test(x) && /news during trade: neg/.test(x)), 'daily review explains the EEE loss with the headline');
assert(pushes.some(x => /Chart: /.test(x)), 'entries carry the chart read');
const bLeg = [...orders.find(o => o.symbol === 'BBB' && o.order_class === 'oto').legs, ...stops.filter(x => x.symbol === 'BBB')].find(x => x.status === 'filled');
assert(+bLeg.filled_avg_price < +orders.find(o => o.symbol === 'BBB' && o.order_class === 'oto').filled_avg_price, 'BBB trailing stop locked profit on the short');
assert(!orders.some(o => ['CCC', 'DDD'].includes(o.symbol)), 'CCC (not in play) and DDD (< $5) never traded');
assert(pushes.some(x => x.includes('TRAIL STOP (profit) BBB')), 'BBB stopped out');
const k = WV.keepAtDecision({ dir: 'long', entry: 10, r: 0.2 }, Array.from({ length: 60 }, (_, i) => ({ h: 10 + i * 0.01, l: 10 + i * 0.01, c: 10 + i * 0.01, v: 100 }))); assert(k.keep, 'keep rule unit');
assert(orders.some(o => o.symbol === 'AAA' && /-flat-/.test(o.client_order_id)) && !pos.AAA, 'AAA flattened at the close');
assert(ent.every(o => /^elisw-20261118-/.test(o.client_order_id)), 'tagged orders');
assert(stops.length >= 2, 'trailing kept moving after the first replace'); assert(!stops.some(x => x.status === 'new') && !orders.flatMap(o => o.legs).some(l => l.status === 'new'), 'no stray stop order left open after the close');
console.log('ALL WAVE TESTS PASSED'); process.exit(0);
