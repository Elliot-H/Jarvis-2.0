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
  return { mode: mode(), equity: +a.equity, cash: +a.cash, buyingPower: +a.buying_power, status: a.status };
}
export async function positions() {
  const p = await api(BASE, '/v2/positions');
  return p.map(x => ({ symbol: x.symbol, qty: +x.qty, value: +x.market_value, costBasis: +x.cost_basis, pnl: +x.unrealized_pl, pnlPct: +(x.unrealized_plpc * 100).toFixed(2) }));
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
export async function orders() {
  const o = await api(BASE, '/v2/orders?status=open&limit=20');
  return o.map(x => ({ id: x.id, symbol: x.symbol, side: x.side, notional: x.notional, qty: x.qty, status: x.status }));
}
export async function cancelAll() { await api(BASE, '/v2/orders', { method: 'DELETE' }); return 'All open orders cancelled.'; }

export async function place({ symbol, side, dollars }) {
  const s = normSymbol(symbol);
  const body = { symbol: s, side, type: 'market', notional: String(dollars), time_in_force: isCrypto(s) ? 'gtc' : 'day' };
  const o = await api(BASE, '/v2/orders', { method: 'POST', body: JSON.stringify(body) });
  return { id: o.id, status: o.status, symbol: o.symbol, side: o.side, notional: o.notional };
}
