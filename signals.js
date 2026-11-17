// Screening methodology (rewritten 2026-11-17, Owner's maintenance request): reads a chart the way desk technicians do,
// in this order: (1) trend and market structure, (2) location, (3) moving averages, (4) momentum, (5) volume,
// (6) ATR volatility and stop, (7) multi-timeframe alignment (weekly = direction, daily = setup, 5-minute = entry),
// (8) explicit invalidation. Long setups only (the account buys; it does not short).
// Output is a PROBABILITY read with a stop and the risk in dollars, never a guarantee. It never trades.
import { bars, sma, emaSeries, rsi, atr } from './chart.js';
import * as trade from './trade.js';

const r2 = v => (v == null || !Number.isFinite(v) ? null : Math.abs(v) >= 1 ? Number(v.toFixed(2)) : Number(v.toPrecision(3)));
const last = a => a[a.length - 1];
export const FRAMING = 'Probability read, not a guarantee and not financial advice. Every setup has a stop and can fail; size so a stop-out is an acceptable loss.';

// ---- (1) structure: confirmed swing pivots (k bars each side) ----
function pivots(b, k = 3) {
  const hi = [], lo = [];
  for (let i = k; i < b.length - k; i++) {
    let h = true, l = true;
    for (let j = i - k; j <= i + k; j++) { if (j === i) continue; if (b[j].h > b[i].h) h = false; if (b[j].l < b[i].l) l = false; }
    if (h) hi.push({ i, p: b[i].h });
    if (l) lo.push({ i, p: b[i].l });
  }
  return { hi, lo };
}
function structure(b) {
  const { hi, lo } = pivots(b), n = b.length, c = b[n - 1].c;
  const h1 = hi[hi.length - 2], h2 = last(hi), l1 = lo[lo.length - 2], l2 = last(lo);
  const hh = !!(h1 && h2 && h2.p > h1.p), hl = !!(l1 && l2 && l2.p > l1.p), lh = !!(h1 && h2 && h2.p < h1.p), ll = !!(l1 && l2 && l2.p < l1.p);
  // Break of structure: a close through the last confirmed swing high (bullish) or swing low (bearish) within the last 5 bars.
  let bosUp = null, bosDown = false;
  if (h2) for (let i = Math.max(h2.i + 1, n - 5); i < n; i++) if (b[i].c > h2.p && b[i - 1].c <= h2.p) bosUp = i;
  if (l2 && c < l2.p) bosDown = true;
  const trend = (hh && hl) || (bosUp != null && hl) ? 'up' : (lh && ll) || bosDown ? 'down' : 'range';
  return { trend, hh, hl, lh, ll, bosUp, bosDown, lastHigh: h2?.p ?? null, lastLow: l2?.p ?? null, prevLow: l1?.p ?? null, hi, lo };
}

// ---- (2) location: S/R levels and supply/demand zones (base candle before an impulsive >= 2 ATR move) ----
function zones(b, st, a) {
  const demand = [], supply = [];
  for (const l of st.lo) {
    const nh = st.hi.find(h => h.i > l.i);
    if (nh && nh.p - l.p >= 2 * a) demand.push({ lo: l.p, hi: Math.max(l.p, Math.min(b[l.i].o, b[l.i].c)) });
  }
  for (const h of st.hi) {
    const nl = st.lo.find(l => l.i > h.i);
    if (nl && h.p - nl.p >= 2 * a) supply.push({ lo: Math.min(h.p, Math.max(b[h.i].o, b[h.i].c)), hi: h.p });
  }
  return { demand, supply };
}
function location(b, st, a, z) {
  const price = last(b).c;
  const highs = st.hi.map(x => x.p), lows = st.lo.map(x => x.p);
  const res = [...highs.filter(p => p > price * 1.002), ...z.supply.filter(s => s.lo > price).map(s => s.lo)].sort((x, y) => x - y)[0] ?? null;
  const sup = [...lows.filter(p => p < price), ...z.demand.filter(d => d.hi < price).map(d => d.hi)].sort((x, y) => y - x)[0] ?? null;
  const inDemand = z.demand.some(d => price >= d.lo - 0.25 * a && price <= d.hi + 0.5 * a);
  const nearSupport = sup != null && (price - sup) <= 1 * a;
  const retest = st.lastHigh != null && price >= st.lastHigh && price - st.lastHigh <= 1 * a && st.bosUp == null && b.slice(-6, -1).some(x => x.c > st.lastHigh);   // broke out earlier, back near the old high
  const pd = b[b.length - 2], gapPct = pd ? (last(b).o / pd.c - 1) * 100 : null;
  return { resistance: res, support: sup, inDemand, nearSupport, retest, priorDayHigh: pd?.h ?? null, priorDayLow: pd?.l ?? null, gapPct };
}

// ---- weekly bars from daily (higher timeframe = direction) ----
function weekly(b) {
  const out = [];
  for (const x of b) {
    const d = new Date(x.t * 1000), wk = Math.floor((d.getTime() / 86400000 + 3) / 7);   // Monday-based week number
    const w = last(out);
    if (w && w.wk === wk) { w.h = Math.max(w.h, x.h); w.l = Math.min(w.l, x.l); w.c = x.c; w.v += x.v; }
    else out.push({ wk, t: x.t, o: x.o, h: x.h, l: x.l, c: x.c, v: x.v });
  }
  return out;
}
function htf(b) {
  const w = weekly(b); if (w.length < 15) return { bias: 'unknown' };
  const c = w.map(x => x.c), e10 = emaSeries(c, 10), n = c.length, st = structure(w);
  const up = last(c) > e10[n - 1] && e10[n - 1] > e10[n - 4], down = last(c) < e10[n - 1] && e10[n - 1] < e10[n - 4];
  const bias = up && st.trend !== 'down' ? 'up' : down || st.trend === 'down' ? 'down' : 'neutral';
  return { bias, weeklyTrend: st.trend, weeklyEma10: e10[n - 1] };
}

// RSI per bar (for divergence at swing points).
function rsiSeries(c, n = 14) { const out = new Array(c.length).fill(null); for (let i = n + 1; i < c.length; i++) out[i] = rsi(c.slice(Math.max(0, i - 120), i + 1), n); return out; }

// ---- daily features (also used by alerts.js: price, e20, hist, histPrev, atr must stay) ----
export function features(b, opts = {}) {
  const c = b.map(x => x.c), n = c.length, price = c[n - 1], L = last(b);
  const e20s = emaSeries(c, 20), e50s = emaSeries(c, 50), e200s = emaSeries(c, 200);
  const e12 = emaSeries(c, 12), e26 = emaSeries(c, 26), macd = e12.map((v, i) => v - e26[i]), sig = emaSeries(macd, 9);
  const a = atr(b), a5 = atr(b, 5);
  const st = structure(b), z = zones(b, st, a), loc = location(b, st, a, z);
  // (5) volume: relative volume (time-adjusted when the last bar is today's live session), breakout expansion, consolidation dry-up
  const vAvg = sma(b.slice(0, -1).map(x => x.v), 20);
  const frac = opts.sessionFrac && opts.sessionFrac < 1 ? Math.max(0.15, opts.sessionFrac) : 1;
  const relVol = vAvg ? L.v / (vAvg * frac) : null;
  const bosVol = st.bosUp != null && vAvg ? b[st.bosUp].v / vAvg : null;
  const base = b.slice(-8, -1), baseVol = vAvg ? sma(base.map(x => x.v), base.length) / vAvg : null;
  const contraction = a && a5 ? a5 / a : null;
  // (4) momentum: RSI, MACD, divergence at the last two swing highs/lows
  let bearDiv = false, bullDiv = false;
  if (!opts.fast) {
    const rs = rsiSeries(c), hi = st.hi.slice(-2), lo = st.lo.slice(-2);
    if (hi.length === 2 && hi[1].p > hi[0].p && rs[hi[1].i] != null && rs[hi[0].i] != null && rs[hi[1].i] < rs[hi[0].i] - 3) bearDiv = true;
    if (lo.length === 2 && lo[1].p < lo[0].p && rs[lo[1].i] != null && rs[lo[0].i] != null && rs[lo[1].i] > rs[lo[0].i] + 3) bullDiv = true;
  }
  return {
    price, atr: a, atrPct: a ? a / price * 100 : null,
    e20: e20s[n - 1], e50: e50s[n - 1], e200: n >= 200 ? e200s[n - 1] : null,
    e20Slope: e20s[n - 1] - e20s[n - 6], e50Slope: e50s[n - 1] - e50s[n - 6], e200Slope: n >= 205 ? e200s[n - 1] - e200s[n - 6] : null,
    hist: macd[n - 1] - sig[n - 1], histPrev: macd[n - 2] - sig[n - 2], macd: macd[n - 1], rsi: rsi(c), rsiPrev: rsi(c.slice(0, -2)),
    bearDiv, bullDiv, relVol, volRatio: relVol, bosVol, baseVol, contraction,
    st, zones: z, loc, htf: opts.noHtf ? { bias: 'unknown' } : htf(b)
  };
}

// ---- scoring: each block earns points; gates stop a "long" read in a downtrend or with a stop too wide ----
export function setupScore(f) {
  const pts = [], miss = [], gates = [];
  const add = (ok, w, yes, no) => (ok ? pts.push([w, yes]) : no && miss.push(no));
  const { st, loc } = f, a = f.atr;
  // (1) structure 25
  add(st.trend === 'up', 15, 'uptrend structure (higher highs and higher lows)', st.trend === 'down' ? 'downtrend structure (lower highs / lower lows)' : 'no clean higher-high, higher-low structure');
  add(st.bosUp != null, 10, 'fresh break of structure above the last swing high ' + r2(st.lastHigh), null);
  if (st.trend === 'down' || st.bosDown) gates.push('structure is bearish (broke below the last swing low)');
  // (2) location 20
  const room = loc.resistance != null && a ? (loc.resistance - f.price) / a : 99;
  add(loc.nearSupport || loc.inDemand || loc.retest || st.bosUp != null, 10, loc.retest ? 'retesting the breakout level from above' : loc.inDemand ? 'sitting in a demand zone' : loc.nearSupport ? `within 1 ATR of support ${r2(loc.support)}` : 'at the breakout level', 'mid-range location, not at support or a breakout');
  add(room >= 2, 10, room >= 99 ? 'no overhead resistance nearby' : `${r2(room)} ATR of room to resistance ${r2(loc.resistance)}`, `resistance ${r2(loc.resistance)} only ${r2(room)} ATR overhead`);
  const extended = f.e20 && a ? (f.price - f.e20) / a : 0;
  if (extended > 2.5) { pts.push([-10, null]); miss.push(`extended ${r2(extended)} ATR above the 20 EMA (chasing)`); }
  // (3) moving averages 15
  const aligned = f.price > f.e20 && f.e20 > f.e50 && (f.e200 == null || f.e50 > f.e200);
  add(aligned, 8, '20 > 50 > 200 EMA alignment with price above', 'EMAs not stacked bullish');
  add(f.e20Slope > 0 && f.e50Slope > 0 && (f.e200Slope == null || f.e200Slope >= 0), 7, 'EMAs sloping up', 'EMA slope flat or down');
  if (f.e200 != null && f.price < f.e200) gates.push('price below the 200 EMA');
  // (4) momentum 15
  add(f.rsi >= 50 && f.rsi <= 72, 7, `RSI ${r2(f.rsi)} in the bull zone`, `RSI ${r2(f.rsi)} ${f.rsi > 72 ? 'overbought' : 'below 50'}`);
  add(f.hist > 0 && f.hist >= f.histPrev, 8, 'MACD above signal and expanding', 'MACD not confirming');
  if (f.bearDiv) { pts.push([-8, null]); miss.push('bearish RSI divergence at the last swing high'); }
  if (f.bullDiv) pts.push([3, 'bullish RSI divergence at the last swing low']);
  // (5) volume 10
  const volOk = (f.bosVol != null && f.bosVol >= 1.5) || (f.baseVol != null && f.baseVol < 0.8 && f.contraction != null && f.contraction < 0.85) || (f.relVol != null && f.relVol >= 1.5 && f.price > f.e20);
  add(volOk, 10, f.bosVol >= 1.5 ? `breakout on ${r2(f.bosVol)}x volume` : f.baseVol < 0.8 ? 'volume drying up in a tight base' : `relative volume ${r2(f.relVol)}x`, 'no volume confirmation');
  // (7) higher timeframe 15
  const hb = f.htf?.bias;
  add(hb === 'up', 15, 'weekly trend agrees (up)', hb === 'down' ? 'weekly trend is down' : 'weekly trend neutral');
  if (hb === 'neutral') pts.push([6, null]);
  if (hb === 'down') gates.push('weekly trend is down');
  const score = Math.max(0, Math.min(100, pts.reduce((s, [w]) => s + w, 0)));
  return { score, reasons: pts.map(x => x[1]).filter(Boolean), missing: miss, gates };
}

// ---- (6) ATR stop at structural invalidation; (8) explicit invalidation level ----
export function stopLevel(f) {
  const a = f.atr, p = f.price, st = f.st, z = f.zones;
  const dz = z?.demand.filter(d => d.hi < p).sort((x, y) => y.hi - x.hi)[0];
  const anchor = st?.bosUp != null && st.lastHigh < p ? Math.max(st.lastLow ?? 0, st.lastHigh - 0.5 * a)   // breakout: old high minus half an ATR (failed breakout)
    : [st?.lastLow, dz?.lo].filter(v => v != null && v < p).sort((x, y) => y - x)[0] ?? p - 2 * a;   // trend: last higher low / demand zone
  let stop = anchor - 0.25 * a;
  stop = Math.min(stop, p - 1 * a);                      // never tighter than 1 ATR (noise)
  const wide = p - stop > 3 * a;
  const riskPct = (p - stop) / p * 100, R = p - stop;
  const res = f.loc?.resistance, rr = res != null && res > p ? (res - p) / R : null;
  const target = res != null && res > p && rr >= 2 ? res : p + 2 * R;
  return { stop: r2(stop), riskPct: r2(riskPct), target: r2(target), rToResistance: r2(rr), stopTooWide: wide, invalidation: r2(anchor), invalidationRule: `a daily close below ${r2(anchor)} breaks the setup` };
}

// ---- lower timeframe entry trigger: VWAP, opening range, prior day high/low, gap (5-minute bars, today's session) ----
function nyDay(t) { return new Date(t * 1000).toLocaleDateString('en-US', { timeZone: 'America/New_York' }); }
export function intraday(b5, daily) {
  if (!b5?.length) return null;
  const day = nyDay(last(b5).t), today = b5.filter(x => nyDay(x.t) === day);
  if (today.length < 3) return null;
  let pv = 0, vv = 0; for (const x of today) { const tp = (x.h + x.l + x.c) / 3; pv += tp * x.v; vv += x.v; }
  const vwap = vv ? pv / vv : null, or = today.slice(0, 6), orh = Math.max(...or.map(x => x.h)), orl = Math.min(...or.map(x => x.l)), p = last(today).c;
  const prior = daily?.length >= 2 ? (nyDay(last(daily).t) === day ? daily[daily.length - 2] : last(daily)) : null;
  const gapPct = prior ? (today[0].o / prior.c - 1) * 100 : null;
  const gapFilled = prior && gapPct > 0 ? Math.min(...today.map(x => x.l)) <= prior.c : null;
  const aboveVwap = vwap != null && p > vwap, aboveOR = today.length > 6 && p > orh, belowOR = today.length > 6 && p < orl;
  const entry = aboveVwap && (aboveOR || today.length <= 6) ? 'go' : belowOR || !aboveVwap ? 'wait' : 'neutral';
  const why = [aboveVwap ? 'above VWAP ' + r2(vwap) : 'below VWAP ' + r2(vwap), today.length > 6 ? (aboveOR ? 'above the opening-range high ' + r2(orh) : belowOR ? 'below the opening-range low ' + r2(orl) : 'inside the opening range') : 'opening range still forming'];
  if (prior) why.push(p > prior.h ? 'above the prior-day high ' + r2(prior.h) : p < prior.l ? 'below the prior-day low ' + r2(prior.l) : 'inside the prior-day range');
  if (gapPct != null && Math.abs(gapPct) >= 1) why.push(`gapped ${gapPct > 0 ? 'up' : 'down'} ${r2(Math.abs(gapPct))}%${gapFilled ? ', gap filled' : ''}`);
  return { trigger: entry, vwap: r2(vwap), openingRangeHigh: r2(orh), openingRangeLow: r2(orl), priorDayHigh: r2(prior?.h), priorDayLow: r2(prior?.l), gapPct: r2(gapPct), note: why.join('; ') };
}

export function exitSignal(b, stop) {
  const f = features(b, { fast: true, noHtf: true }), why = [];
  if (f.st.bosDown) why.push(`daily close below the last swing low ${r2(f.st.lastLow)} (structure broke down)`);
  if (f.price < f.e20 && f.hist < 0 && f.hist < f.histPrev) why.push('closed under the 20 EMA with MACD turning down');
  if (f.rsiPrev != null && f.rsiPrev > 72 && f.rsi < 65) why.push(`RSI rolled over from ${r2(f.rsiPrev)} to ${r2(f.rsi)}`);
  if (f.e20 < f.e50 && f.price < f.e50) why.push('20 EMA under the 50 EMA and price below both');
  if (stop != null && f.price <= stop) why.push(`price ${r2(f.price)} is at or under the stop ${stop}`);
  return { exit: why.length > 0, reasons: why, price: r2(f.price), stop: stopLevel(f).stop };
}

// Same daily+weekly rule replayed on the ticker's own history: entry when the score crosses 70 with no gate,
// exit at the stop, the target, or after 15 bars. Gives the hit rate and average R, so the read is a probability, not a promise.
export function backtest(b) {
  const out = [];
  let prev = 0;
  for (let i = 210; i < b.length - 1; i++) {
    const w = b.slice(Math.max(0, i - 400), i + 1), f = features(w, { fast: true }), s = setupScore(f), sc = s.gates.length ? 0 : s.score;
    if (sc >= 70 && prev < 70) {
      const { stop, target, stopTooWide } = stopLevel(f), entry = f.price, R = entry - stop;
      if (!stopTooWide && R > 0) {
        let ret = null; const end = Math.min(i + 15, b.length - 1);
        for (let j = i + 1; j <= end; j++) {
          if (b[j].l <= stop) { ret = -1; break; }
          if (b[j].h >= target) { ret = (target - entry) / R; break; }
          if (j === end) ret = (b[j].c - entry) / R;
        }
        if (ret != null) out.push(ret);
      }
    }
    prev = sc;
  }
  const n = out.length, wins = out.filter(x => x > 0).length;
  return { samples: n, winRatePct: n ? Math.round(wins / n * 100) : null, avgR: n ? r2(out.reduce((s, x) => s + x, 0) / n) : null };
}

// Fraction of today's regular session elapsed (for time-adjusted relative volume); 1 outside market hours.
function sessionFrac() {
  const ny = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })), m = ny.getHours() * 60 + ny.getMinutes() - 570;
  return ny.getDay() === 0 || ny.getDay() === 6 || m <= 0 || m >= 390 ? 1 : m / 390;
}

export async function evaluate(symbol, { intradayBars = true } = {}) {
  const b = await bars(symbol, '1dlong');
  const live = nyDay(last(b).t) === nyDay(Date.now() / 1000) ? sessionFrac() : 1;
  const f = features(b, { sessionFrac: live }), s = setupScore(f), st = stopLevel(f), bt = backtest(b);
  let ltf = null;
  if (intradayBars && !/-USD$/.test(symbol)) { try { ltf = intraday(await bars(symbol, '5m'), b); } catch {} }
  let label;
  if (s.gates.length) label = 'no long setup';
  else if (st.stopTooWide) label = 'stop too wide';
  else if (s.score >= 75) label = bt.samples >= 5 && bt.winRatePct >= 55 && bt.avgR > 0 ? 'A setup (history supports it)' : 'A setup (unproven on this ticker)';
  else if (s.score >= 55) label = 'B setup, needs confirmation';
  else label = 'weak';
  const score = s.gates.length ? Math.min(s.score, 40) : st.stopTooWide ? Math.min(s.score, 60) : s.score;
  const ex = exitSignal(b, null);
  const probability = bt.samples >= 5 ? `Historically ${bt.winRatePct}% of ${bt.samples} similar setups on this ticker worked, averaging ${bt.avgR}R. Past odds, not a promise.` : `Only ${bt.samples} past examples on this ticker, so the odds are unproven.`;
  return {
    symbol, price: r2(f.price), score, label, reasons: s.reasons, missing: [...s.gates, ...s.missing],
    stop: st.stop, riskPct: st.riskPct, target: st.target, rToResistance: st.rToResistance, invalidation: st.invalidationRule,
    structure: { trend: f.st.trend, lastSwingHigh: r2(f.st.lastHigh), lastSwingLow: r2(f.st.lastLow), breakOfStructure: f.st.bosUp != null },
    location: { support: r2(f.loc.support), resistance: r2(f.loc.resistance), inDemandZone: f.loc.inDemand, priorDayHigh: r2(f.loc.priorDayHigh), priorDayLow: r2(f.loc.priorDayLow) },
    emas: { e20: r2(f.e20), e50: r2(f.e50), e200: r2(f.e200) }, rsi: r2(f.rsi), relVol: r2(f.relVol), atr: r2(f.atr), atrPct: r2(f.atrPct),
    timeframes: { weekly: f.htf.bias, daily: f.st.trend, entry: ltf ? ltf.trigger : 'n/a' }, entryTrigger: ltf,
    history: bt, probability, exitWarning: ex.exit ? ex.reasons : null, framing: FRAMING
  };
}

// ---- tradeable on Alpaca and inside his limits ----
// budget: { perOrder, dayLeft } in dollars. Fractionable: any price works if at least $1 fits. Whole-share only: one share must fit.
export async function tradeability(symbol, budget) {
  if (/-USD$|\/USD$/.test(symbol)) return { ok: true, note: 'crypto' };
  if (!trade.configured()) return { ok: null, note: 'Alpaca keys not set, tradeability unverified' };
  const a = await trade.assetInfo(symbol);
  if (!a) return { ok: false, note: 'not found on Alpaca' };
  if (!a.tradable || a.status !== 'active') return { ok: false, note: 'not tradable on Alpaca' };
  const cap = budget ? Math.min(budget.perOrder, budget.dayLeft) : Infinity;
  if (cap < 1) return { ok: false, fractionable: a.fractionable, note: 'daily buy limit used up' };
  return { ok: true, fractionable: a.fractionable, cap, note: a.fractionable ? `fractional, up to $${Math.floor(cap)} per order` : 'whole shares only' };
}

export async function scan(symbols, top = 5, { budget, onlyTradeable = false } = {}) {
  const res = [], errs = [], skipped = [];
  const q = [...symbols];
  await Promise.all(Array.from({ length: 5 }, async () => {
    for (let s; (s = q.shift());) {
      try {
        let t = null;
        try { t = await tradeability(s, budget); } catch (e) { t = { ok: null, note: 'tradeability check failed: ' + e.message }; }
        if (onlyTradeable && t.ok === false) { skipped.push(`${s} (${t.note})`); continue; }
        const ev = await evaluate(s);
        if (t.ok && t.fractionable === false && budget) {   // whole-share symbol: one share must fit his per-order and daily room
          const cap = Math.min(budget.perOrder, budget.dayLeft), shares = Math.floor(cap / ev.price);
          if (shares < 1) { if (onlyTradeable) { skipped.push(`${s} (one share $${ev.price} is over the $${Math.floor(cap)} limit)`); continue; } t = { ...t, ok: false, note: `one share $${ev.price} is over the $${Math.floor(cap)} limit` }; }
          else t = { ...t, shares, note: `whole shares only, ${shares} fit the limit` };
        }
        if (t.ok && budget) { const dollars = t.shares ? t.shares * ev.price : t.cap; ev.sizing = { dollars: r2(dollars), riskAtStopDollars: r2(dollars * ev.riskPct / 100) }; }
        res.push({ ...ev, tradeable: t });
      } catch (e) { errs.push(`${s}: ${e.message}`); }
    }
  }));
  res.sort((a, b) => b.score - a.score);
  return { scanned: symbols.length, failed: errs.length ? errs.slice(0, 3) : undefined, skippedNotTradeable: skipped.length ? skipped.slice(0, 10) : undefined, top: res.slice(0, top), framing: FRAMING };
}
