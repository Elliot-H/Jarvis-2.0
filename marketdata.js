// Market data from three FREE tiers: Finnhub (quotes, news, earnings, analyst ratings), Twelve Data (quote + price history fallback),
// Financial Modeling Prep (company profile, ratios, statements). Facts only. Analysis, never trades.
// Free-tier limits are enforced here so a chatty day never burns a key: Finnhub 60/min, Twelve Data 8/min + 800/day, FMP 250/day.
const clean = v => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const KEYS = { finnhub: () => clean(process.env.FINNHUB_API_KEY), twelve: () => clean(process.env.TWELVEDATA_API_KEY), fmp: () => clean(process.env.FMP_API_KEY) };
const LIMITS = {   // soft caps just under the free limits
  finnhub: { perMin: 50 },
  twelve: { perMin: 7, perDay: 780 },
  fmp: { perDay: 240 }
};
const used = { finnhub: [], twelve: [], fmp: [] };   // timestamps of calls
const dayKey = () => new Date().toISOString().slice(0, 10);
let usedDay = dayKey();
export const configured = p => !!KEYS[p]();
function allow(p) {
  if (dayKey() !== usedDay) { usedDay = dayKey(); for (const k in used) used[k] = []; }
  const now = Date.now(), L = LIMITS[p], u = used[p];
  if (L.perMin && u.filter(t => now - t < 60e3).length >= L.perMin) return `${p} per-minute limit reached, try again in a minute`;
  if (L.perDay && u.length >= L.perDay) return `${p} daily limit reached (resets at midnight UTC)`;
  return null;
}
const cache = new Map();
async function get(p, url, ttlMs, label) {
  const hit = cache.get(url); if (hit && Date.now() - hit.at < ttlMs) return hit.v;
  if (!configured(p)) throw new Error(`${p} key not set`);
  const lim = allow(p); if (lim) throw new Error(lim);
  used[p].push(Date.now());
  const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = null; }
  if (!r.ok) throw new Error(`${label || p} ${r.status}${r.status === 401 || r.status === 403 ? ' (key rejected or endpoint not on the free plan)' : r.status === 402 ? ' (not on the free plan)' : r.status === 429 ? ' (rate limited)' : ''}`);
  if (j && typeof j === 'object' && !Array.isArray(j) && (j.status === 'error' || j['Error Message'] || (j.error && typeof j.error === 'string'))) throw new Error(`${label || p}: ${j.message || j.error || j['Error Message']}`.slice(0, 200));
  cache.set(url, { at: Date.now(), v: j }); if (cache.size > 300) cache.delete(cache.keys().next().value);
  return j;
}
export function sym(s) {
  s = String(s || '').toUpperCase().replace(/[^A-Z0-9.\-]/g, '');
  return /^[A-Z0-9.\-]{1,10}$/.test(s) ? s : null;
}
const n = v => (v === null || v === undefined || v === '' || isNaN(+v) ? null : +v);

// ---- quote: Finnhub -> Twelve Data -> FMP
export async function quote(symbol) {
  const s = sym(symbol); if (!s) throw new Error('Unrecognised symbol.');
  const errs = [];
  if (configured('finnhub')) try {
    const j = await get('finnhub', `https://finnhub.io/api/v1/quote?symbol=${s}&token=${KEYS.finnhub()}`, 20e3, 'Finnhub quote');
    if (j && n(j.c)) return { symbol: s, price: j.c, change: j.d, changePct: j.dp, open: j.o, high: j.h, low: j.l, prevClose: j.pc, asOf: j.t ? new Date(j.t * 1000).toISOString() : null, source: 'Finnhub' };
    errs.push('Finnhub had no price');
  } catch (e) { errs.push(e.message); }
  if (configured('twelve')) try {
    const j = await get('twelve', `https://api.twelvedata.com/quote?symbol=${s}&apikey=${KEYS.twelve()}`, 20e3, 'Twelve Data quote');
    if (j && n(j.close)) return { symbol: s, name: j.name, price: n(j.close), change: n(j.change), changePct: n(j.percent_change), open: n(j.open), high: n(j.high), low: n(j.low), prevClose: n(j.previous_close), asOf: j.datetime, source: 'Twelve Data' };
    errs.push('Twelve Data had no price');
  } catch (e) { errs.push(e.message); }
  if (configured('fmp')) try {
    const j = await get('fmp', `https://financialmodelingprep.com/stable/quote?symbol=${s}&apikey=${KEYS.fmp()}`, 20e3, 'FMP quote');
    const q = Array.isArray(j) ? j[0] : null;
    if (q && n(q.price)) return { symbol: s, name: q.name, price: q.price, change: q.change, changePct: q.changePercentage ?? q.changesPercentage, open: q.open, high: q.dayHigh, low: q.dayLow, prevClose: q.previousClose, yearHigh: q.yearHigh, yearLow: q.yearLow, marketCap: q.marketCap, source: 'Financial Modeling Prep' };
    errs.push('FMP had no price');
  } catch (e) { errs.push(e.message); }
  throw new Error(errs.length ? errs.join('; ') : 'No data keys are set (FINNHUB_API_KEY, TWELVEDATA_API_KEY, FMP_API_KEY).');
}

// ---- price history (Twelve Data): daily/hourly closes for when Yahoo is unavailable
export async function series(symbol, interval = '1day', count = 60) {
  const s = sym(symbol); if (!s) throw new Error('Unrecognised symbol.');
  const iv = ['5min', '15min', '1h', '1day', '1week'].includes(interval) ? interval : '1day';
  const j = await get('twelve', `https://api.twelvedata.com/time_series?symbol=${s}&interval=${iv}&outputsize=${Math.min(Math.max(+count || 60, 5), 200)}&apikey=${KEYS.twelve()}`, 60e3, 'Twelve Data series');
  const v = (j?.values || []).map(b => ({ t: b.datetime, o: n(b.open), h: n(b.high), l: n(b.low), c: n(b.close), v: n(b.volume) })).reverse();
  if (!v.length) throw new Error('Twelve Data returned no bars.');
  return { symbol: s, interval: iv, bars: v, source: 'Twelve Data' };
}

// ---- fundamentals: FMP (profile + ratios + key metrics), Finnhub metrics as backup
export async function fundamentals(symbol) {
  const s = sym(symbol); if (!s) throw new Error('Unrecognised symbol.');
  const out = { symbol: s, sources: [] }; const errs = [];
  if (configured('fmp')) {
    const base = 'https://financialmodelingprep.com/stable', k = `apikey=${KEYS.fmp()}`;
    try {
      const p = (await get('fmp', `${base}/profile?symbol=${s}&${k}`, 6 * 3600e3, 'FMP profile'))?.[0];
      if (p) { Object.assign(out, { name: p.companyName, sector: p.sector, industry: p.industry, marketCap: p.marketCap, beta: p.beta, price: p.price, range52w: p.range, avgVolume: p.averageVolume ?? p.volAvg, description: String(p.description || '').slice(0, 300) }); out.sources.push('FMP profile'); }
    } catch (e) { errs.push(e.message); }
    try {
      const r = (await get('fmp', `${base}/ratios?symbol=${s}&limit=1&${k}`, 6 * 3600e3, 'FMP ratios'))?.[0];
      if (r) { out.ratios = { pe: r.priceToEarningsRatio ?? r.priceEarningsRatio, pb: r.priceToBookRatio, ps: r.priceToSalesRatio, debtToEquity: r.debtToEquityRatio ?? r.debtEquityRatio, currentRatio: r.currentRatio, grossMargin: r.grossProfitMargin, netMargin: r.netProfitMargin, dividendYield: r.dividendYield ?? r.dividendYieldPercentage, fiscalYear: r.fiscalYear ?? r.date }; out.sources.push('FMP ratios'); }
    } catch (e) { errs.push(e.message); }
  }
  if (configured('finnhub') && !out.ratios) try {
    const m = (await get('finnhub', `https://finnhub.io/api/v1/stock/metric?symbol=${s}&metric=all&token=${KEYS.finnhub()}`, 6 * 3600e3, 'Finnhub metrics'))?.metric;
    if (m) { out.ratios = { pe: m.peTTM ?? m.peBasicExclExtraTTM, pb: m.pbQuarterly, ps: m.psTTM, debtToEquity: m['totalDebt/totalEquityQuarterly'], currentRatio: m.currentRatioQuarterly, grossMargin: m.grossMarginTTM, netMargin: m.netProfitMarginTTM, dividendYield: m.currentDividendYieldTTM, epsGrowth5y: m.epsGrowth5Y, revenueGrowth5y: m.revenueGrowth5Y, high52w: m['52WeekHigh'], low52w: m['52WeekLow'], beta: m.beta }; out.sources.push('Finnhub metrics'); }
  } catch (e) { errs.push(e.message); }
  if (!out.sources.length) throw new Error(errs.length ? errs.join('; ') : 'No fundamentals key set (FMP_API_KEY or FINNHUB_API_KEY).');
  if (errs.length) out.partial = errs;
  return out;
}

// ---- news (Finnhub): headlines for a company, last 7 days, or general market
export async function news(symbol) {
  if (symbol) {
    const s = sym(symbol); if (!s) throw new Error('Unrecognised symbol.');
    const to = new Date(), from = new Date(Date.now() - 7 * 86400e3), d = x => x.toISOString().slice(0, 10);
    const j = await get('finnhub', `https://finnhub.io/api/v1/company-news?symbol=${s}&from=${d(from)}&to=${d(to)}&token=${KEYS.finnhub()}`, 15 * 60e3, 'Finnhub news');
    return { symbol: s, headlines: (j || []).slice(0, 8).map(a => ({ headline: a.headline, source: a.source, at: a.datetime ? new Date(a.datetime * 1000).toISOString() : null, summary: String(a.summary || '').slice(0, 200) })) };
  }
  const j = await get('finnhub', `https://finnhub.io/api/v1/news?category=general&token=${KEYS.finnhub()}`, 15 * 60e3, 'Finnhub news');
  return { market: true, headlines: (j || []).slice(0, 8).map(a => ({ headline: a.headline, source: a.source, at: a.datetime ? new Date(a.datetime * 1000).toISOString() : null })) };
}

// ---- earnings dates + analyst ratings (Finnhub)
export async function earnings(symbol) {
  const s = sym(symbol); if (!s) throw new Error('Unrecognised symbol.');
  const out = { symbol: s }; const errs = [];
  const to = new Date(Date.now() + 120 * 86400e3), from = new Date(), d = x => x.toISOString().slice(0, 10);
  try {
    const j = await get('finnhub', `https://finnhub.io/api/v1/calendar/earnings?from=${d(from)}&to=${d(to)}&symbol=${s}&token=${KEYS.finnhub()}`, 6 * 3600e3, 'Finnhub earnings');
    out.upcoming = (j?.earningsCalendar || []).slice(0, 2).map(e => ({ date: e.date, hour: e.hour, epsEstimate: e.epsEstimate, revenueEstimate: e.revenueEstimate }));
  } catch (e) { errs.push(e.message); }
  try {
    const j = await get('finnhub', `https://finnhub.io/api/v1/stock/recommendation?symbol=${s}&token=${KEYS.finnhub()}`, 12 * 3600e3, 'Finnhub ratings');
    const r = j?.[0]; if (r) out.analysts = { period: r.period, strongBuy: r.strongBuy, buy: r.buy, hold: r.hold, sell: r.sell, strongSell: r.strongSell };
  } catch (e) { errs.push(e.message); }
  if (!out.upcoming && !out.analysts) throw new Error(errs.join('; ') || 'No data.');
  if (errs.length) out.partial = errs;
  return out;
}

export function status() {
  const now = Date.now();
  return {
    finnhub: { keySet: configured('finnhub'), callsLastMinute: used.finnhub.filter(t => now - t < 60e3).length, limit: '60/min free' },
    twelveData: { keySet: configured('twelve'), callsLastMinute: used.twelve.filter(t => now - t < 60e3).length, callsToday: used.twelve.length, limit: '8/min, 800/day free' },
    fmp: { keySet: configured('fmp'), callsToday: used.fmp.length, limit: '250/day free' }
  };
}
