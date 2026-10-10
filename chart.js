// Chart reading: price bars (Yahoo chart API, no key; works for stocks and crypto) -> indicators, trend,
// support/resistance, volume, candle patterns. Returns facts; the brain explains them. Analysis only, never trades.
import { coinIdFor } from './crypto.js';
const FRAMES = {
  '5m': { interval: '5m', range: '5d' }, '15m': { interval: '15m', range: '5d' }, '1h': { interval: '60m', range: '1mo' },
  '1d': { interval: '1d', range: '6mo' }, '1dlong': { interval: '1d', range: '2y' }, '1d5y': { interval: '1d', range: '5y' }, '1w': { interval: '1wk', range: '2y' }, '1mo': { interval: '1mo', range: '10y' }
};
const CRYPTO = { BTC: 1, ETH: 1, SOL: 1, DOGE: 1, XRP: 1, ADA: 1, AVAX: 1, LINK: 1, LTC: 1, DOT: 1, BNB: 1, SHIB: 1, MATIC: 1, NIGHT: 1 };
const r2 = v => (v == null || !Number.isFinite(v) ? null : Math.abs(v) >= 1 ? Number(v.toFixed(2)) : Number(v.toPrecision(3)));

export function ySymbol(s) {
  s = String(s || '').toUpperCase().replace(/\s/g, '');
  const names = { BITCOIN: 'BTC', ETHEREUM: 'ETH', SOLANA: 'SOL', DOGECOIN: 'DOGE' };
  s = names[s] || s;
  const m = s.match(/^([A-Z]{2,6})[\/-]?USD$/);
  if (m && (CRYPTO[m[1]] || s.includes('/') || s.includes('-'))) return m[1] + '-USD';
  if (CRYPTO[s] || coinIdFor(s)) return s + '-USD';   // known coins plus any coin he added (learned ticker -> CoinGecko id)
  return /^[A-Z.\-]{1,6}$/.test(s) ? s.replace('.', '-') : null;
}

// Crypto candles from Kraken's free public API (same source as the live price feed). Used first for <COIN>-USD; Yahoo is the fallback.
const KRAKEN_IV = { '5m': 5, '15m': 15, '1h': 60, '1d': 1440, '1dlong': 1440, '1d5y': 1440, '1w': 10080, '1mo': 21600 };
const KRAKEN_BASE = { BTC: 'XBT', DOGE: 'XDG' };
async function krakenBars(coin, tf) {
  const iv = KRAKEN_IV[tf]; if (!iv) return null;
  const pair = (KRAKEN_BASE[coin] || coin) + 'USD';
  const r = await fetch(`https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=${iv}`, { signal: AbortSignal.timeout(15000) });
  if (!r.ok) return null;
  const j = await r.json(); if (j.error?.length) return null;
  const key = Object.keys(j.result || {}).find(k => k !== 'last'); const rows = key ? j.result[key] : null;
  if (!rows || rows.length < 20) return null;
  return rows.map(x => ({ t: +x[0], o: +x[1], h: +x[2], l: +x[3], c: +x[4], v: +x[6] || 0 }));
}

export async function bars(sym, tf) {
  const f = FRAMES[tf]; if (!f) throw new Error(`Timeframe must be one of ${Object.keys(FRAMES).join(', ')}.`);
  if (!/-USD$/.test(String(sym))) sym = ySymbol(sym) || sym;   // a bare coin ticker (NIGHT) means NIGHT-USD, never a stock with that name
  const cm = String(sym).match(/^([A-Z0-9]{2,10})-USD$/);
  if (cm) { try { const kb = await krakenBars(cm[1], tf); if (kb) return kb; } catch {} }
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=${f.interval}&range=${f.range}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 Jarvis', Accept: 'application/json' }, signal: AbortSignal.timeout(15000)
  });
  if (!r.ok) throw new Error(`Chart data source returned ${r.status} for ${sym}.`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res?.timestamp) throw new Error(`No chart data for ${sym}.`);
  const q = res.indicators.quote[0], out = [];
  res.timestamp.forEach((t, i) => { if (q.close[i] != null && q.open[i] != null) out.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume?.[i] || 0 }); });
  if (out.length < 20) throw new Error(`Not enough history for ${sym} (${out.length} bars).`);
  return out;
}

export const sma = (a, n) => (a.length >= n ? a.slice(-n).reduce((x, y) => x + y, 0) / n : null);
export function emaSeries(a, n) { const k = 2 / (n + 1); const o = []; a.forEach((v, i) => o.push(i ? v * k + o[i - 1] * (1 - k) : v)); return o; }
export function rsi(c, n = 14) {
  if (c.length <= n) return null;
  let g = 0, l = 0;
  for (let i = 1; i <= n; i++) { const d = c[i] - c[i - 1]; d > 0 ? (g += d) : (l -= d); }
  g /= n; l /= n;
  for (let i = n + 1; i < c.length; i++) { const d = c[i] - c[i - 1]; g = (g * (n - 1) + Math.max(d, 0)) / n; l = (l * (n - 1) + Math.max(-d, 0)) / n; }
  return l === 0 ? 100 : 100 - 100 / (1 + g / l);
}
export function atr(b, n = 14) { const tr = b.slice(1).map((x, i) => Math.max(x.h - x.l, Math.abs(x.h - b[i].c), Math.abs(x.l - b[i].c))); return sma(tr, n); }

// Swing highs/lows (3 bars each side), clustered within 1.5% into levels with touch counts.
export function levels(b, price) {
  const pts = [];
  for (let i = 3; i < b.length - 3; i++) {
    const w = b.slice(i - 3, i + 4);
    if (b[i].h === Math.max(...w.map(x => x.h))) pts.push(b[i].h);
    if (b[i].l === Math.min(...w.map(x => x.l))) pts.push(b[i].l);
  }
  const cl = [];
  for (const p of pts.sort((x, y) => x - y)) {
    const last = cl[cl.length - 1];
    if (last && p / (last.sum / last.n) < 1.015) { last.sum += p; last.n++; } else cl.push({ sum: p, n: 1 });
  }
  const lv = cl.map(x => ({ price: x.sum / x.n, touches: x.n }));
  const sup = lv.filter(x => x.price < price).sort((x, y) => y.price - x.price).slice(0, 3);
  const res = lv.filter(x => x.price >= price).sort((x, y) => x.price - y.price).slice(0, 3);
  return { support: sup.map(x => ({ price: r2(x.price), touches: x.touches })), resistance: res.map(x => ({ price: r2(x.price), touches: x.touches })) };
}

export function candles(b) {
  const out = [], a = b[b.length - 2], x = b[b.length - 1], body = k => Math.abs(k.c - k.o), rng = k => k.h - k.l || 1e-9;
  const up = k => k.c > k.o, dn = k => k.c < k.o;
  const lw = k => Math.min(k.o, k.c) - k.l, uw = k => k.h - Math.max(k.o, k.c);
  if (body(x) / rng(x) < 0.1) out.push('doji (indecision)');
  if (lw(x) > 2 * body(x) && uw(x) < body(x) && body(x) > 0) out.push(dn(a) || x.c < sma(b.map(k => k.c), 10) ? 'hammer (possible bounce)' : 'hanging man (possible top)');
  if (uw(x) > 2 * body(x) && lw(x) < body(x) && body(x) > 0) out.push('shooting star / inverted hammer (rejection from highs)');
  if (up(x) && dn(a) && x.c >= a.o && x.o <= a.c) out.push('bullish engulfing');
  if (dn(x) && up(a) && x.c <= a.o && x.o >= a.c) out.push('bearish engulfing');
  if (x.h < a.h && x.l > a.l) out.push('inside bar (consolidating)');
  if (body(x) / rng(x) > 0.85 && body(x) > 1.5 * (sma(b.slice(0, -1).map(body), 14) || 0)) out.push(up(x) ? 'strong bullish candle' : 'strong bearish candle');
  return out;
}

function patterns(b, lv, price) {
  const out = [], hi = Math.max(...b.slice(-60).map(x => x.h)), lo = Math.min(...b.slice(-60).map(x => x.l));
  const atrv = atr(b) || 0;
  const r = lv.resistance[0], s = lv.support[0];
  if (r && r.touches >= 2 && price > r.price * 0.985 && price <= r.price * 1.0) out.push(`pressing resistance ${r.price} (${r.touches} touches); breakout if it closes above`);
  if (s && s.touches >= 2 && price < s.price * 1.015 && price >= s.price) out.push(`sitting on support ${s.price} (${s.touches} touches); breakdown if it closes below`);
  const prior = b.slice(-61, -1); const pHi = Math.max(...prior.map(x => x.h)), pLo = Math.min(...prior.map(x => x.l));
  if (price > pHi) out.push('closed above its 60-bar high (breakout)');
  if (price < pLo) out.push('closed below its 60-bar low (breakdown)');
  const half = b.slice(-30), a1 = half.slice(0, 15), a2 = half.slice(15);
  const h1 = Math.max(...a1.map(x => x.h)), h2 = Math.max(...a2.map(x => x.h)), l1 = Math.min(...a1.map(x => x.l)), l2 = Math.min(...a2.map(x => x.l));
  if (h2 > h1 && l2 > l1) out.push('higher highs and higher lows (uptrend structure)');
  if (h2 < h1 && l2 < l1) out.push('lower highs and lower lows (downtrend structure)');
  if (Math.abs(h2 / h1 - 1) < 0.015 && Math.abs(h1 / hi - 1) < 0.03 && h1 > price * 1.02) out.push('possible double top (two similar highs)');
  if (Math.abs(l2 / l1 - 1) < 0.015 && Math.abs(l1 / lo - 1) < 0.03 && l1 < price * 0.98) out.push('possible double bottom (two similar lows)');
  const rg = n => { const s = b.slice(-n); return Math.max(...s.map(x => x.h)) - Math.min(...s.map(x => x.l)); };
  if (rg(10) < rg(30) * 0.4 && atrv) out.push('range is squeezing (volatility contraction); a bigger move often follows');
  return out;
}

export async function read({ symbol, timeframe = '1d' } = {}) {
  const sym = ySymbol(symbol); if (!sym) throw new Error('Unrecognised symbol.');
  const b = await bars(sym, timeframe), c = b.map(x => x.c), price = c[c.length - 1];
  const s20 = sma(c, 20), s50 = sma(c, 50), s200 = sma(c, 200);
  const e12 = emaSeries(c, 12), e26 = emaSeries(c, 26), macd = e12.map((v, i) => v - e26[i]), sig = emaSeries(macd, 9);
  const hist = macd[macd.length - 1] - sig[sig.length - 1], histPrev = macd[macd.length - 2] - sig[sig.length - 2];
  const rs = rsi(c), at = atr(b);
  const sd = (() => { const w = c.slice(-20), m = sma(w, 20); return Math.sqrt(w.reduce((a, v) => a + (v - m) ** 2, 0) / 20); })();
  const vAvg = sma(b.map(x => x.v), 20), vLast = b[b.length - 1].v;
  const slope = s20 && c.length >= 25 ? price / c[c.length - 21] - 1 : null;
  let trend = 'sideways';
  if (s50 && price > s20 && s20 > s50) trend = 'uptrend'; else if (s50 && price < s20 && s20 < s50) trend = 'downtrend';
  else if (!s50 && slope != null) trend = slope > 0.03 ? 'uptrend' : slope < -0.03 ? 'downtrend' : 'sideways';
  const lv = levels(b, price);
  const bull = [], bear = [];
  (price > s20 ? bull : bear).push('price vs 20-bar average');
  if (s50) (price > s50 ? bull : bear).push('price vs 50-bar average');
  if (s200) (price > s200 ? bull : bear).push('price vs 200-bar average');
  (hist > 0 ? bull : bear).push('MACD histogram');
  if (rs != null) (rs >= 50 ? bull : bear).push('RSI side of 50');
  const last = b[b.length - 1];
  return {
    symbol: sym, timeframe, bars: b.length, lastBarTime: new Date(last.t * 1000).toISOString(), price: r2(price),
    changeOverWindowPct: r2((price / b[0].c - 1) * 100),
    changeLast5BarsPct: r2((price / c[c.length - 6] - 1) * 100),
    range: { high: r2(Math.max(...b.map(x => x.h))), low: r2(Math.min(...b.map(x => x.l))) },
    trend, movingAverages: { sma20: r2(s20), sma50: r2(s50), sma200: r2(s200), note: s50 && s50 < (sma(c.slice(0, -5), 50) ?? s50) ? '50 sloping down' : '50 sloping up or flat' },
    crossRecent: (() => { if (c.length < 56) return null; const d = i => sma(c.slice(0, c.length - i), 20) - sma(c.slice(0, c.length - i), 50); return d(0) > 0 && d(5) <= 0 ? 'golden cross (20 over 50) in last 5 bars' : d(0) < 0 && d(5) >= 0 ? 'death cross (20 under 50) in last 5 bars' : null; })(),
    momentum: { rsi14: r2(rs), rsiRead: rs == null ? null : rs >= 70 ? 'overbought' : rs <= 30 ? 'oversold' : rs >= 50 ? 'bullish side' : 'bearish side', macdHistogram: r2(hist), macdRead: hist > 0 ? (hist > histPrev ? 'bullish, strengthening' : 'bullish, fading') : (hist < histPrev ? 'bearish, strengthening' : 'bearish, fading') },
    volatility: { atr14: r2(at), atrPct: r2(at / price * 100), bollinger: { upper: r2(s20 + 2 * sd), lower: r2(s20 - 2 * sd), position: price > s20 + 2 * sd ? 'above upper band (stretched)' : price < s20 - 2 * sd ? 'below lower band (stretched)' : 'inside bands' } },
    volume: vAvg ? { lastVsAvg20: r2(vLast / vAvg), read: vLast / vAvg > 1.5 ? 'high volume, move has conviction' : vLast / vAvg < 0.6 ? 'light volume, move is weak' : 'normal' } : 'not available',
    levels: lv,
    lastCandles: b.slice(-5).map(x => ({ o: r2(x.o), h: r2(x.h), l: r2(x.l), c: r2(x.c), v: x.v })),
    candlePatterns: candles(b), patterns: patterns(b, lv, price),
    scoreboard: { bullish: bull, bearish: bear },
    guide: 'Explain like a floor trader to a friend: lead with trend + where price sits vs support/resistance, then momentum and volume, then what would change the picture (a close above resistance or below support). Spoken reply short but must include the key numbers (price, support, resistance, trend); the HUD may carry extra detail, but never say "on screen" or "on the HUD". Chart patterns are probabilities, not predictions. You are not a financial advisor: no promises, no pushing trades. If the user wants to trade, use trade_propose separately. Mention the timeframe, since daily and 5-minute charts can disagree.'
  };
}
