// Elis context: the bigger picture around each candidate (Owner 2026-11-23: "teach Elis more: world news, social media,
// politics, FDA..."). Everything here becomes a learner feature, so it only gets weight if it proves itself on unseen days.
//   market   : S&P 500 (SPY) gap at the open, fear gauge (VIXY gap), trend regime (SPY vs its 20-day average)
//   sector   : the stock's sector ETF (picked by return correlation, no lookup table) - first 5-min candle with/against the trade
//   (earnings is already read from Elis's own Benzinga headlines via Alpaca: news type 'earnings')
//   buzz     : Reddit/WallStreetBets mention rank + 24 h change (ApeWisdom, free) - forward-only, no history exists
import * as E from './elis.js';

export const ETFS = ['SPY', 'QQQ', 'IWM', 'VIXY', 'XLK', 'SMH', 'XLF', 'XLE', 'XLV', 'XBI', 'XLY', 'XLI', 'XLC', 'XLP', 'XLU', 'XLB', 'XLRE', 'ITB', 'KRE', 'GDX', 'JETS'];
export const SECTORS = ETFS.filter(s => !['SPY', 'QQQ', 'IWM', 'VIXY'].includes(s));

// ---- pure helpers ----
const rets = closes => closes.slice(1).map((c, i) => (closes[i] ? c / closes[i] - 1 : 0));
function corr(a, b) {
  const n = Math.min(a.length, b.length); if (n < 20) return 0; a = a.slice(-n); b = b.slice(-n);
  const ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let sab = 0, sa = 0, sb = 0;
  for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); sa += (a[i] - ma) ** 2; sb += (b[i] - mb) ** 2; }
  return sa && sb ? sab / Math.sqrt(sa * sb) : 0;
}
// which sector ETF moves most like this stock (last ~60 sessions of daily closes, aligned by date)
export function sectorOf(stockByDate, etfByDate) {
  const days = Object.keys(stockByDate).sort().slice(-61); if (days.length < 25) return null;
  const sr = rets(days.map(d => stockByDate[d]));
  let best = null, bc = 0.25;   // weak correlation -> no sector
  for (const e of SECTORS) { const m = etfByDate[e]; if (!m) continue; const c = corr(sr, rets(days.map(d => m[d] ?? stockByDate[d] * 0))); if (c > bc) { bc = c; best = e; } }
  return best;
}
const dirOf = b => (!b ? null : b.c > b.o ? 'long' : b.c < b.o ? 'short' : null);
export function contextFeatures(c, mk) {   // c: candidate {dir, sector, buzz}; mk: market snapshot for the day
  const gap = mk?.spyGap, vg = mk?.vixGap, sb = mk?.first?.[c.sector];
  return {
    mktGap: gap == null ? 'spy-unknown' : gap > 0.5 ? 'spy-gap-up' : gap < -0.5 ? 'spy-gap-down' : 'spy-flat',
    fear: vg == null ? 'fear-unknown' : vg > 3 ? 'fear-rising' : vg < -3 ? 'fear-falling' : 'fear-calm',
    regime: mk?.spyTrend == null ? 'trend-unknown' : (mk.spyTrend === 'up') === (c.dir === 'long') ? 'with-trend' : 'against-trend',
    sector: !c.sector || !sb ? 'sector-unknown' : dirOf(sb) === c.dir ? 'with-sector' : dirOf(sb) ? 'against-sector' : 'sector-flat',
    buzz: c.buzz == null ? 'buzz-unknown' : c.buzz.rank <= 25 && c.buzz.change > 0 ? 'buzz-hot' : c.buzz.rank <= 100 ? 'buzz-some' : 'buzz-none'
  };
}
export const CONTEXT_FEATURES = ['mktGap', 'fear', 'regime', 'sector', 'buzz'];

// ---- data (bulk lane for history, live lane for today) ----
const q = o => new URLSearchParams(o).toString();
async function bars(symbols, timeframe, start, end, feed, bulk) {
  const out = {};
  for (let i = 0; i < symbols.length; i += 100) {
    let token = '';
    do {
      const p = { symbols: symbols.slice(i, i + 100).join(','), timeframe, start, end, feed, limit: '10000', adjustment: 'split' }; if (token) p.page_token = token;
      const j = await E.api(E.DATA, `/v2/stocks/bars?${q(p)}`, {}, bulk);
      for (const [s, arr] of Object.entries(j.bars || {})) (out[s] ||= []).push(...arr); token = j.next_page_token || '';
    } while (token);
  }
  return out;
}
export const byDate = arr => Object.fromEntries((arr || []).map(b => [b.t.slice(0, 10), b.c]));

// daily closes for ETFs and given stocks between two dates -> { SYM: { date: close } }
export async function dailyCloses(symbols, fromDate, toDate, bulk = false) {
  const b = await bars(symbols, '1Day', fromDate, toDate, 'sip', bulk), out = {};
  for (const [s, arr] of Object.entries(b)) out[s] = byDate(arr);
  return out;
}
// market snapshot for one session: ETF first 5-min candles + SPY/VIXY gap + SPY 20-day trend
export function snapshot(date, dailyEtf, firstBars) {
  const prev = (s) => { const m = dailyEtf[s] || {}; const ds = Object.keys(m).filter(d => d < date).sort(); return ds.length ? m[ds.at(-1)] : null; };
  const spy0 = firstBars.SPY?.o, vix0 = firstBars.VIXY?.o, sp = prev('SPY'), vp = prev('VIXY');
  const spyDays = Object.keys(dailyEtf.SPY || {}).filter(d => d < date).sort().slice(-20), sma = spyDays.length >= 15 ? spyDays.reduce((a, d) => a + dailyEtf.SPY[d], 0) / spyDays.length : null;
  return { spyGap: spy0 && sp ? Math.round((spy0 / sp - 1) * 1000) / 10 : null, vixGap: vix0 && vp ? Math.round((vix0 / vp - 1) * 1000) / 10 : null,
    spyTrend: sma && sp ? (sp >= sma ? 'up' : 'down') : null, first: Object.fromEntries(Object.entries(firstBars).map(([s, b]) => [s, { o: b.o, c: b.c }])) };
}
export async function firstBarsFor(date, symbols, feed = 'sip', bulk = false) {
  const b = await bars(symbols, '5Min', new Date(E.etMs(date, 570)).toISOString(), new Date(E.etMs(date, 575)).toISOString(), feed, bulk), out = {};
  for (const [s, arr] of Object.entries(b)) if (arr[0]) out[s] = arr[0];
  return out;
}
// Reddit buzz right now (forward-only). ApeWisdom free API: rank, mentions, mentions 24 h ago.
export async function buzzNow() {
  const out = {};
  for (let page = 1; page <= 3; page++) {
    try {
      const r = await fetch(`https://apewisdom.io/api/v1.0/filter/all-stocks/page/${page}`, { signal: AbortSignal.timeout(15000) }); if (!r.ok) break;
      const j = await r.json(); for (const x of j.results || []) out[x.ticker] = { rank: +x.rank, mentions: +x.mentions, change: +x.mentions - +(x.mentions_24h_ago || 0) };
      if (!j.results?.length) break;
    } catch { break; }
  }
  return Object.keys(out).length ? out : null;
}
