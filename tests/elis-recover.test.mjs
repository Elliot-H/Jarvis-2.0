// node tests/elis-recover.test.mjs — after a mid-day restart Wave rebuilds today's trades from Alpaca and still closes them at 15:55.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'elisr-')); process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40); process.env.ELIS_STRATEGIES = 'wave';
const E = await import('../elis.js'), WV = await import('../elis-wave.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const date = '2026-11-18', T = (h, m) => E.etMs(date, h * 60 + m); let NOW = T(13, 0); Date.now = () => NOW;
const orders = [
  { id: 'a1', symbol: 'AAA', side: 'buy', qty: '100', filled_qty: '100', filled_avg_price: '50.30', status: 'filled', order_class: 'oto', submitted_at: new Date(T(9, 40)).toISOString(), client_order_id: 'elisw-20261118-AAA-x1', legs: [{ id: 'aL', type: 'stop', side: 'sell', status: 'canceled', stop_price: '50.10' }] },   // stop lost, like MNRO on 2026-11-23
  { id: 'b1', symbol: 'BBB', side: 'sell', qty: '50', filled_qty: '50', filled_avg_price: '79.70', status: 'filled', order_class: 'oto', submitted_at: new Date(T(9, 41)).toISOString(), client_order_id: 'elisw-20261118-BBB-x2', legs: [{ id: 'bL', type: 'stop', side: 'buy', status: 'filled', filled_qty: '50', filled_avg_price: '79.90', stop_price: '79.90' }] },
  { id: 'z9', symbol: 'MINE', side: 'buy', qty: '5', filled_qty: '5', filled_avg_price: '10', status: 'filled', submitted_at: new Date(T(9, 50)).toISOString(), client_order_id: 'owner-manual', legs: [] }];
const pos = { AAA: { qty: '100', unrealized_pl: '150', market_value: '5045', current_price: '51.5' }, MINE: { qty: '5', unrealized_pl: '1', market_value: '51' } }, pushes = [], posted = [];
global.fetch = async (url, opts = {}) => {
  const u = new URL(url), p = u.pathname, m = opts.method || 'GET', J = (o, s = 200) => ({ ok: s < 300, status: s, text: async () => JSON.stringify(o) });
  if (p === '/v2/clock') return J({ is_open: NOW < T(16, 0), next_open: new Date(T(9, 30) + 86400e3).toISOString(), next_close: new Date(T(16, 0)).toISOString() });
  if (p === '/v2/orders' && m === 'GET') return J(u.searchParams.get('status') === 'open' ? posted.filter(b => b.type === 'stop' && !b.canceled).map((b, i) => ({ id: 'st' + i, ...b, status: 'new' })) : orders);
  if (p === '/v2/orders' && m === 'POST') { const b = JSON.parse(opts.body); posted.push(b); if (b.type !== 'stop') delete pos[b.symbol]; return J({ id: b.type === 'stop' ? 'st' + (posted.filter(x => x.type === 'stop').length - 1) : 'f' + posted.length, ...b }); }
  if (p.startsWith('/v2/orders/') && m === 'DELETE') { const i = +p.split('/').pop().replace('st', ''); const st = posted.filter(b => b.type === 'stop')[i]; if (st) st.canceled = true; return J({}); }
  if (p.startsWith('/v2/orders/')) return J(orders.find(o => o.id === p.split('/').pop()));
  if (p.startsWith('/v2/positions/')) { const s = p.split('/').pop(); return pos[s] ? J(pos[s]) : J({ message: 'none' }, 404); }
  if (p === '/v2/stocks/trades/latest') return J({ trades: { AAA: { p: 51.5 }, SPY: { p: 500 } } });
  if (p === '/v1beta1/news') return J({ news: [] });
  if (p === '/v2/stocks/bars') return J({ bars: {}, next_page_token: null });
  return J({});
};
E.start({ push: async (t, b) => { pushes.push(`${t} | ${b}`); }, hud: () => {} }); WV.start();
for (; NOW < T(16, 0); NOW += 15e3) await WV._tick();
console.log(pushes.filter(x => /wave/.test(x)).join('\n'));
assert(pushes.some(x => /wave resumed \| .*still managing AAA/.test(x)), 'restart: resumes managing the open AAA');
assert(posted.some(b => b.symbol === 'AAA' && b.side === 'sell' && /elisw-20261118-AAA-flat-/.test(b.client_order_id)), 'AAA closed by 15:55 after the restart');
assert(!pushes.some(x => /SOLD AAA \| 11:00 exit/.test(x)), 'a runner recovered after 11:00 is not re-judged by the 11:00 rule');
assert(!posted.some(b => b.symbol === 'MINE' || b.symbol === 'BBB'), 'never touches the Owner\'s own position or already-closed trades');
const st = posted.find(b => b.symbol === 'AAA' && b.type === 'stop');
assert(st && st.side === 'sell' && +st.stop_price < 51.5 && +st.stop_price >= 50.3 && st.qty === '100' && /-stop-/.test(st.client_order_id), 'lost stop restored at the trailed level, sized to the position');
assert(pushes.some(x => /stop restored AAA/.test(x)), 'Owner is told the stop was restored');
assert(posted.filter(b => b.symbol === 'AAA' && b.type === 'stop').length === 1, 'restored once, not every tick');
assert(st.canceled, 'restored stop cancelled at the close (no stray order)');
console.log('RECOVER TEST PASSED'); process.exit(0);
