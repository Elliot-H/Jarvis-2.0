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
  return o.map(x => ({ id: x.id, symbol: x.symbol, side: x.side, type: x.type, notional: x.notional, qty: x.qty, stopPrice: x.stop_price ? +x.stop_price : undefined, limitPrice: x.limit_price ? +x.limit_price : undefined, status: x.status }));
}
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
