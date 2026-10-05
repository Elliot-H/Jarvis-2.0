// Trading via Alpaca (stocks + crypto). PAPER (fake money) unless ALPACA_LIVE=1.
// Guardrails live in code, not in the prompt: propose -> Owner says yes in a LATER turn -> confirm.
const LIVE = process.env.ALPACA_LIVE === '1';
const BASE = LIVE ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets';
const DATA = 'https://data.alpaca.markets';
const clean = v => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const KEY = () => clean(process.env.ALPACA_KEY_ID), SEC = () => clean(process.env.ALPACA_SECRET);
// Safe hint for a 401: never reveals the secret.
export function keyHint() {
  const k = KEY(), s = SEC();
  const bits = [`mode ${mode()}`, `key id ${k ? k.slice(0, 2) + '… (' + k.length + ' chars)' : 'MISSING'}`, `secret ${s ? s.length + ' chars' : 'MISSING'}`];
  if (k && !/^(PK|AK)/.test(k)) bits.push('key id should start with PK (paper) or AK (live)');
  if (k && /^AK/.test(k) && !LIVE) bits.push('this is a LIVE key but the app is in paper mode');
  if (k && /^PK/.test(k) && LIVE) bits.push('this is a PAPER key but ALPACA_LIVE=1');
  if (s && s.length < 30) bits.push('secret looks too short; it may be the key id pasted twice');
  return bits.join('; ');
}
export const MAX_ORDER = Number(process.env.TRADE_MAX_ORDER || 50);   // dollars per order
export const MAX_DAY = Number(process.env.TRADE_MAX_DAY || 150);      // dollars per day
export const configured = () => !!(KEY() && SEC());
export const mode = () => (LIVE ? 'LIVE (real money)' : 'PAPER (practice money)');

async function api(base, path, opts = {}) {
  if (!configured()) throw new Error('Alpaca keys are not set (ALPACA_KEY_ID, ALPACA_SECRET).');
  const r = await fetch(base + path, {
    ...opts,
    headers: { 'APCA-API-KEY-ID': KEY(), 'APCA-API-SECRET-KEY': SEC(), 'content-type': 'application/json' },
    signal: AbortSignal.timeout(15000)
  });
  const t = await r.text();
  let j; try { j = JSON.parse(t); } catch { j = t; }
  if (!r.ok) throw new Error(`Alpaca ${r.status}: ${j?.message || t}${r.status === 401 || r.status === 403 ? ' [' + keyHint() + ']' : ''}`.slice(0, 450));
  return j;
}

const isCrypto = s => /^[A-Z]{2,6}\/USD$/.test(s);
export function normSymbol(s) {
  s = String(s || '').toUpperCase().replace(/\s/g, '');
  if (/^[A-Z]{2,6}USD$/.test(s) && !/^[A-Z]{1,5}$/.test(s)) s = s.slice(0, -3) + '/USD';
  const map = { BITCOIN: 'BTC/USD', ETHEREUM: 'ETH/USD', SOLANA: 'SOL/USD', DOGECOIN: 'DOGE/USD', BTC: 'BTC/USD', ETH: 'ETH/USD', SOL: 'SOL/USD', DOGE: 'DOGE/USD' };
  s = map[s] || s;
  return /^[A-Z]{1,5}$|^[A-Z]{2,6}\/USD$/.test(s) ? s : null;
}

export async function account() {
  const a = await api(BASE, '/v2/account');
  return { equity: +a.equity, cash: +a.cash, buyingPower: +a.buying_power, status: a.status };
}
export async function positions() {
  const p = await api(BASE, '/v2/positions');
  return p.map(x => ({ symbol: x.symbol, qty: +x.qty, value: +x.market_value, costBasis: +x.cost_basis, pnl: +x.unrealized_pl, pnlPct: +(x.unrealized_plpc * 100).toFixed(2), price: +x.current_price, entry: +x.avg_entry_price, prevClose: +x.lastday_price }));
}
export async function quote(symbol) {
  const s = normSymbol(symbol); if (!s) throw new Error('Unrecognised symbol.');
  if (isCrypto(s)) {
    const j = await api(DATA, `/v1beta3/crypto/us/latest/trades?symbols=${encodeURIComponent(s)}`);
    return { symbol: s, price: j.trades?.[s]?.p };
  }
  const j = await api(DATA, `/v2/stocks/${s}/trades/latest`);
  return { symbol: s, price: j.trade?.p };
}
// Company name for a ticker, so he can hear what he is about to buy (speech-to-text mishears tickers).
export async function assetName(symbol) {
  const s = normSymbol(symbol); if (!s) return null;
  try { const a = await api(BASE, '/v2/assets/' + encodeURIComponent(s)); return a.name || null; } catch { return null; }
}
export async function orders() {
  const o = await api(BASE, '/v2/orders?status=open&limit=100');
  return o.map(x => ({ id: x.id, symbol: x.symbol, side: x.side, type: x.type, notional: x.notional, qty: x.qty, stopPrice: x.stop_price ? +x.stop_price : undefined, limitPrice: x.limit_price ? +x.limit_price : undefined, trailPercent: x.trail_percent ? +x.trail_percent : undefined, trailPrice: x.trail_price ? +x.trail_price : undefined, hwm: x.hwm ? +x.hwm : undefined, status: x.status }));
}

// ---- Resting stop orders at the broker (share-quantity based; never dollar based) ----
// Callers (server.js stop_* tools) must have the Owner's explicit "confirm" in a LATER turn before any of these writes run.
export const stopError = e => String(e?.message || e).replace(/\s*\[mode[^\]]*\]/i, '').replace(/\b(paper|live)\b[^.;,]*/gi, '').replace(/\s+/g, ' ').trim();
export async function stopOrders() {
  const o = await orders();
  return o.filter(x => x.side === 'sell' && ['stop', 'stop_limit', 'trailing_stop'].includes(x.type));
}
// Can this symbol carry a resting stop, and for how many shares? {ok:false, reason} or {ok:true, symbol, held, qty, crypto, note}.
export async function stopCheck(symbol) {
  const s = normSymbol(symbol); if (!s) return { ok: false, reason: 'I do not recognise that symbol.' };
  let pos = null;
  try { pos = await api(BASE, '/v2/positions/' + encodeURIComponent(s.replace('/', ''))); } catch (e) { if (!/404/.test(e.message)) throw e; }
  if (!pos) return { ok: false, symbol: s, reason: `You do not hold ${s}, so there is nothing for a stop order to protect.` };
  const held = +pos.qty, avail = pos.qty_available != null ? +pos.qty_available : held;
  if (!(held > 0)) return { ok: false, symbol: s, reason: `${s} is not a long position, so a sell stop cannot protect it.` };
  const crypto = isCrypto(s);
  if (crypto) return { ok: true, symbol: s, held, qty: avail, crypto, note: 'Crypto only supports a stop-limit order, not a trailing stop.' };
  const whole = Math.floor(avail + 1e-9);
  if (whole < 1) return { ok: false, symbol: s, held, reason: `${s}: you hold ${held} share${held === 1 ? '' : 's'}, under one whole share. The broker only accepts stop orders on whole shares, so this position cannot carry a stop.` };
  const left = +(avail - whole).toFixed(6);
  return { ok: true, symbol: s, held, qty: whole, crypto, note: left > 0 ? `You hold ${held} shares; the stop covers ${whole} whole shares and the last ${left} of a share cannot be covered.` : (avail < held ? `Only ${avail} of ${held} shares are free; the rest are committed to another order.` : null) };
}
// kind: 'stop' (fixed stop-loss) | 'trailing' (trailPercent or trailPrice). Sell side only.
export async function placeStop({ symbol, qty, kind, stopPrice, trailPercent, trailPrice }) {
  const s = normSymbol(symbol), crypto = isCrypto(s);
  const body = { symbol: s, side: 'sell', qty: String(qty), time_in_force: 'gtc' };
  if (kind === 'trailing') {
    if (crypto) throw new Error('Crypto does not support trailing stops at the broker.');
    body.type = 'trailing_stop'; if (trailPercent) body.trail_percent = String(trailPercent); else body.trail_price = String(trailPrice);
  } else if (crypto) { body.type = 'stop_limit'; body.stop_price = String(stopPrice); body.limit_price = String(+(stopPrice * 0.99).toPrecision(6)); }
  else { body.type = 'stop'; body.stop_price = String(stopPrice); }
  const o = await api(BASE, '/v2/orders', { method: 'POST', body: JSON.stringify(body) });
  return { id: o.id, status: o.status, symbol: o.symbol, type: o.type, qty: o.qty };
}
export async function amendStop(id, { stopPrice, trailPercent, trailPrice, limitPrice }) {
  const body = {}; if (stopPrice) body.stop_price = String(stopPrice); if (limitPrice) body.limit_price = String(limitPrice);
  if (trailPercent) body.trail = String(trailPercent); else if (trailPrice) body.trail = String(trailPrice);
  const o = await api(BASE, '/v2/orders/' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify(body) });
  return { id: o.id, status: o.status, symbol: o.symbol, type: o.type };
}
export async function cancelOrder(id) { await api(BASE, '/v2/orders/' + encodeURIComponent(id), { method: 'DELETE' }); return true; }
// Read-only: filled SELL orders (newest first) so realised P&L can be shown per position.
export async function sellFills(limit = 200) {
  const o = await api(BASE, `/v2/orders?status=closed&direction=desc&limit=${limit}`);
  return o.filter(x => x.side === 'sell' && +x.filled_qty > 0 && x.filled_avg_price).map(x => ({ symbol: x.symbol, qty: +x.filled_qty, price: +x.filled_avg_price, at: Date.parse(x.filled_at || x.updated_at) || 0 }));
}
export async function cancelAll() { await api(BASE, '/v2/orders', { method: 'DELETE' }); return 'All open orders cancelled.'; }

export async function place({ symbol, side, dollars }) {
  const s = normSymbol(symbol);
  const body = { symbol: s, side, type: 'market', notional: String(dollars), time_in_force: isCrypto(s) ? 'gtc' : 'day' };
  const o = await api(BASE, '/v2/orders', { method: 'POST', body: JSON.stringify(body) });
  return { id: o.id, status: o.status, symbol: o.symbol, side: o.side, notional: o.notional };
}

// Read-only latest prices for a mixed list of stocks and crypto (used by the Investment Watch).
export async function latestPrices(symbols) {
  const out = {}, st = [], cr = [];
  for (const x of symbols) { const s = normSymbol(x); if (s) (isCrypto(s) ? cr : st).push(s); }
  if (st.length) { const j = await api(DATA, `/v2/stocks/trades/latest?symbols=${st.join(',')}`); for (const s of st) if (j.trades?.[s]?.p) out[s] = j.trades[s].p; }
  if (cr.length) { const j = await api(DATA, `/v1beta3/crypto/us/latest/trades?symbols=${encodeURIComponent(cr.join(','))}`); for (const s of cr) if (j.trades?.[s]?.p) out[s] = j.trades[s].p; }
  return out;
}

// Previous daily close per symbol (Alpaca snapshots), so watch-list rows have a day % straight after a restart.
export async function prevCloses(symbols) {
  const out = {}, st = [], cr = [];
  for (const x of symbols) { const s = normSymbol(x); if (s) (isCrypto(s) ? cr : st).push(s); }
  if (st.length) { const j = await api(DATA, `/v2/stocks/snapshots?symbols=${st.join(',')}`); for (const s of st) { const c = (j[s] || j.snapshots?.[s])?.prevDailyBar?.c; if (c > 0) out[s] = c; } }
  if (cr.length) { const j = await api(DATA, `/v1beta3/crypto/us/snapshots?symbols=${encodeURIComponent(cr.join(','))}`); for (const s of cr) { const c = (j.snapshots?.[s] || j[s])?.prevDailyBar?.c; if (c > 0) out[s] = c; } }
  return out;
}

// Trending stocks from Alpaca's screener: today's biggest gainers plus most active by volume.
export async function trending(n = 15) {
  const [m, a] = await Promise.all([
    api(DATA, `/v1beta1/screener/stocks/movers?top=${n}`).catch(() => ({})),
    api(DATA, `/v1beta1/screener/stocks/most-actives?by=volume&top=${n}`).catch(() => ({}))
  ]);
  const ok = x => x?.symbol && /^[A-Z]{1,5}$/.test(x.symbol) && (x.price == null || x.price >= 2);
  const gain = (m.gainers || []).filter(ok), lose = (m.losers || []).filter(ok), act = (a.most_actives || []).filter(ok);
  return { gainers: gain.map(x => x.symbol), active: act.map(x => x.symbol), losers: lose.map(x => x.symbol), all: [...new Set([...gain, ...act].map(x => x.symbol))] };
}

// Broader universe for the full-market sweep: liquid large/mid caps across sectors, pre-filtered by one snapshot call.
export const SWEEP_UNIVERSE = 'AAPL MSFT NVDA AMZN GOOGL META TSLA AVGO AMD INTC MU QCOM TXN ORCL CRM ADBE NFLX PLTR SNOW UBER SHOP COIN HOOD SOFI PYPL SQ V MA JPM BAC WFC GS MS C SCHW UNH LLY JNJ PFE MRK ABBV MRNA BMY GILD CVS XOM CVX COP OXY SLB HAL DVN FCX NEM AA CLF X NUE F GM RIVN LCID NIO BA LMT RTX GE CAT DE HD LOW WMT COST TGT NKE SBUX MCD DIS CMCSA T VZ TMUS KO PEP PG AAL DAL UAL CCL RCL ABNB MAR ROKU SNAP PINS DKNG CHWY ETSY W LYFT DASH AFRM UPST MARA RIOT CLSK SMCI ARM ASML TSM AMAT LRCX ON DELL HPQ IBM CSCO NOW PANW CRWD ZS NET DDOG MDB SPY QQQ IWM XLE XLF XLK XBI ARKK SOXL TQQQ'.split(' ');
export async function snapshots(symbols) {
  const out = [], list = symbols.filter(s => /^[A-Z]{1,5}$/.test(s));
  for (let i = 0; i < list.length; i += 100) {
    const j = await api(DATA, `/v2/stocks/snapshots?symbols=${list.slice(i, i + 100).join(',')}`);
    for (const s of Object.keys(j.snapshots || j)) {
      const x = (j.snapshots || j)[s], p = x?.latestTrade?.p ?? x?.dailyBar?.c, pc = x?.prevDailyBar?.c;
      if (p > 0 && pc > 0) out.push({ symbol: s, price: p, changePct: (p / pc - 1) * 100, volume: x?.dailyBar?.v || 0 });
    }
  }
  return out;
}

// Premarket prints (IEX feed, partial but real): used by premarket.js. Read-only.
export async function stockTrades(symbol, startISO, endISO, limit = 1000) {
  const s = normSymbol(symbol); if (!s || isCrypto(s)) throw new Error("Stocks only.");
  const j = await api(DATA, `/v2/stocks/${s}/trades?start=${encodeURIComponent(startISO)}&end=${encodeURIComponent(endISO)}&limit=${limit}&feed=iex`);
  return (j.trades || []).map(t => ({ t: t.t, p: t.p, s: t.s }));
}
