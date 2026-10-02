// Market outlook: multi-timeframe read (weekly + daily + hourly) + per-ticker back-test of every setup currently firing
// (win rate, average move, average drawdown, sample size on the ticker's own 5y daily history) -> directional bias,
// confidence, ATR stop/target, invalidation. Odds, not predictions. Analysis only, never trades.
import { bars, read, ySymbol, sma, emaSeries, rsi, atr } from './chart.js';
import { premarket } from './premarket.js';
import * as trade from './trade.js';

const r2 = v => (v == null || !Number.isFinite(v) ? null : Math.abs(v) >= 1 ? Number(v.toFixed(2)) : Number(v.toPrecision(3)));
const HORIZON = 5, MIN_SAMPLES = 8;

// Setups firing on the LAST bar of window b. dir: 1 bullish, -1 bearish.
export function tagsAt(b) {
  const n = b.length, x = b[n - 1], a = b[n - 2], p = b[n - 3];
  const c = b.map(k => k.c), body = k => Math.abs(k.c - k.o);
  const lw = k => Math.min(k.o, k.c) - k.l, uw = k => k.h - Math.max(k.o, k.c);
  const out = [];
  const add = (name, dir) => out.push({ name, dir });
  if (x.c > x.o && a.c < a.o && x.c >= a.o && x.o <= a.c) add('bullish engulfing', 1);
  if (x.c < x.o && a.c > a.o && x.c <= a.o && x.o >= a.c) add('bearish engulfing', -1);
  if (body(x) > 0 && lw(x) > 2 * body(x) && uw(x) < body(x) && a.c < a.o) add('hammer after a down candle', 1);
  if (body(x) > 0 && uw(x) > 2 * body(x) && lw(x) < body(x) && a.c > a.o) add('shooting star after an up candle', -1);
  if (a.h < p.h && a.l > p.l) { if (x.c > a.h) add('inside-bar breakout up', 1); else if (x.c < a.l) add('inside-bar breakdown', -1); }
  if (n > 70) {
    const prior = b.slice(-61, -1), hi = Math.max(...prior.map(k => k.h)), lo = Math.min(...prior.map(k => k.l));
    if (x.c > hi) add('breakout above 60-bar high', 1);
    if (x.c < lo) add('breakdown below 60-bar low', -1);
    // retest: broke the prior 60-bar high within the last 8 bars, now pulled back to it and closing back above
    for (let k = 2; k <= 8; k++) {
      const lvl = Math.max(...b.slice(n - k - 60, n - k).map(q => q.h));
      if (b[n - k].c > lvl && x.l <= lvl * 1.01 && x.c > lvl && x.c > x.o) { add('breakout retest holding', 1); break; }
    }
  }
  const w = c.slice(-120), r = rsi(w), rp = rsi(w.slice(0, -1));
  if (r != null && rp != null) {
    if (rp < 30 && r > rp && x.c > x.o) add('RSI oversold bounce', 1);
    if (rp > 70 && r < rp) add('RSI overbought rollover', -1);
  }
  const e12 = emaSeries(w, 12), e26 = emaSeries(w, 26), m = e12.map((v, i) => v - e26[i]), sg = emaSeries(m, 9), L = m.length;
  const h0 = m[L - 1] - sg[L - 1], h1 = m[L - 2] - sg[L - 2];
  if (h0 > 0 && h1 <= 0) add('MACD bullish cross', 1);
  if (h0 < 0 && h1 >= 0) add('MACD bearish cross', -1);
  const s20 = sma(c, 20);
  if (s20) {
    const sd = Math.sqrt(c.slice(-20).reduce((q, v) => q + (v - s20) ** 2, 0) / 20);
    if (x.c < s20 - 2 * sd && x.c > x.o) add('Bollinger lower-band stretch, turning up', 1);
    if (x.c > s20 + 2 * sd && x.c < x.o) add('Bollinger upper-band stretch, turning down', -1);
  }
  if (n >= 56) {
    const d = i => sma(c.slice(0, n - i), 20) - sma(c.slice(0, n - i), 50);
    if (d(0) > 0 && d(1) <= 0) add('golden cross (20 over 50)', 1);
    if (d(0) < 0 && d(1) >= 0) add('death cross (20 under 50)', -1);
  }
  return out;
}

// Replay every setup over the ticker's own history. Forward window HORIZON bars; results counted in the setup's direction.
export function backtestSetups(b) {
  const stats = {}, lastIdx = {};
  for (let i = 70; i < b.length - HORIZON; i++) {
    for (const t of tagsAt(b.slice(Math.max(0, i - 130), i + 1))) {
      if (i - (lastIdx[t.name] ?? -99) < HORIZON) continue; // no overlapping samples
      lastIdx[t.name] = i;
      const e = b[i].c, fw = b.slice(i + 1, i + HORIZON + 1), ret = (b[i + HORIZON].c / e - 1) * t.dir;
      const adverse = t.dir === 1 ? Math.min(...fw.map(k => k.l)) / e - 1 : -(Math.max(...fw.map(k => k.h)) / e - 1);
      (stats[t.name] ||= { rets: [], adv: [] }).rets.push(ret); stats[t.name].adv.push(adverse);
    }
  }
  const avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  const res = {};
  for (const [k, v] of Object.entries(stats)) res[k] = { samples: v.rets.length, winRatePct: Math.round(v.rets.filter(x => x > 0).length / v.rets.length * 100), avgMovePct: r2(avg(v.rets) * 100), avgDrawdownPct: r2(avg(v.adv) * 100) };
  return res;
}

const trendDir = t => (t === 'uptrend' ? 1 : t === 'downtrend' ? -1 : 0);

export async function outlook({ symbol } = {}) {
  const sym = ySymbol(symbol); if (!sym) throw new Error('Unrecognised symbol.');
  const [wk, dy, hr, long] = await Promise.all([
    read({ symbol: sym, timeframe: '1w' }).catch(() => null), read({ symbol: sym, timeframe: '1d' }),
    read({ symbol: sym, timeframe: '1h' }).catch(() => null), bars(sym, '1d5y')
  ]);
  const pre = await premarket(sym).catch(e => ({ available: false, why: e.message }));
  const price = dy.price, at = atr(long), bt = backtestSetups(long);
  const brief = r => r && { trend: r.trend, rsi: r.momentum.rsi14, macd: r.momentum.macdRead };
  const tfs = { weekly: brief(wk), daily: brief(dy), hourly: brief(hr) };
  const dirs = [['weekly', wk], ['daily', dy], ['hourly', hr]].filter(([, r]) => r).map(([k, r]) => [k, trendDir(r.trend)]);
  const up = dirs.filter(d => d[1] > 0).length, down = dirs.filter(d => d[1] < 0).length;
  const alignment = up === dirs.length ? 'all timeframes up' : down === dirs.length ? 'all timeframes down' : up > down ? `mostly up (${up} of ${dirs.length})` : down > up ? `mostly down (${down} of ${dirs.length})` : 'mixed / conflicting';

  let score = 0; const why = [];
  const wts = { weekly: 20, daily: 25, hourly: 10 };
  for (const [k, d] of dirs) { score += d * wts[k]; if (d) why.push(`${k} ${d > 0 ? 'up' : 'down'}trend`); }
  const sb = dy.scoreboard; score += (sb.bullish.length - sb.bearish.length) * 4;
  const vr = dy.volume?.lastVsAvg20;
  if (vr >= 1.5) { score += Math.sign(dy.changeLast5BarsPct || 0) * 8; why.push('high volume confirming the recent move'); }
  else if (vr < 0.6) why.push('light volume (weak conviction)');

  // Only present setups with meaningful history: >= MIN_SAMPLES and an edge in their own direction.
  const setups = [], unproven = [];
  for (const t of tagsAt(long)) {
    const h = bt[t.name];
    if (h && h.samples >= MIN_SAMPLES && h.winRatePct >= 55 && h.avgMovePct > 0) {
      setups.push({ setup: t.name, bias: t.dir > 0 ? 'bullish' : 'bearish', ...h, horizonBars: HORIZON });
      score += t.dir * Math.min(15, (h.winRatePct - 50) * 0.6);
    } else unproven.push(h ? `${t.name} (${h.samples} past cases, ${h.winRatePct}% win: not enough edge)` : `${t.name} (no history)`);
  }
  // Pre-market: the gap sets direction, pre-market volume sets how much to trust it (heavy = stronger, thin = ignore and lower confidence).
  let preAdj = 0;
  if (pre.available) {
    const gs = Math.sign(pre.gapPct) * Math.min(1, Math.abs(pre.gapPct) / 3), w = pre.conviction === 'heavy' ? 20 : pre.conviction === 'normal' ? 10 : 2;
    score += gs * w + (pre.aboveVwap == null ? 0 : pre.aboveVwap ? 2 : -2);
    why.push(`pre-market ${pre.gapKind} ${pre.gapPct}% on ${pre.conviction} volume`);
    preAdj = pre.conviction === 'heavy' ? 8 : pre.conviction === 'thin' ? -10 : 0;
  } else if (!pre.why?.includes('stocks only')) why.push('no pre-market data (no conviction read)');
  score = Math.max(-100, Math.min(100, Math.round(score)));
  const bias = score >= 25 ? 'bullish' : score <= -25 ? 'bearish' : 'neutral';

  let conf = 25 + Math.abs(score) * 0.45;
  if (dirs.length && (up === dirs.length || down === dirs.length)) conf += 10; else if (up && down) conf -= 10;
  const backed = setups.filter(s => s.bias === bias);
  if (bias !== 'neutral' && backed.length) conf += Math.min(10, backed[0].samples / 3); else conf -= 5;
  conf += preAdj;
  conf = Math.round(Math.max(10, Math.min(80, conf))); // technicals alone are capped at 80

  // ATR levels (daily): 1.5 ATR stop, or just past the nearest structure level if it sits between 1 and 1.5 ATR away.
  const sup = dy.levels.support[0]?.price, res = dy.levels.resistance[0]?.price;
  let plan = null;
  if (bias !== 'neutral' && at) {
    const isLong = bias === 'bullish', sgn = isLong ? 1 : -1;
    let stop = price - sgn * 1.5 * at;
    const lvl = isLong ? sup : res;
    if (lvl && Math.abs(price - lvl) >= at && Math.abs(price - lvl) <= 1.5 * at) stop = lvl - sgn * 0.2 * at;
    const risk = Math.abs(price - stop);
    plan = { side: isLong ? 'long' : 'short', entryRef: price, stop: r2(stop), riskPct: r2(risk / price * 100), target: r2(price + sgn * 2 * risk), nextWall: (isLong ? res : sup) ?? null, rewardToRisk: 2, atr14: r2(at) };
  }
  const invalidation = bias === 'bullish' ? [`daily close below ${plan?.stop ?? sup ?? 'support'}`, 'daily trend flips under the 20 and 50-day averages', 'bad news or a downgrade']
    : bias === 'bearish' ? [`daily close above ${plan?.stop ?? res ?? 'resistance'}`, 'reclaim of the 20 and 50-day averages', 'good news or an upgrade']
    : [`daily close above ${res ?? 'resistance'} or below ${sup ?? 'support'} ends the neutral read`];

  return {
    symbol: sym, price, bias, score, confidencePct: conf, confidenceNote: 'technical-only, capped at 80; adjust with news per newsWeighting',
    premarket: pre,
    timeframes: tfs, alignment, levels: dy.levels, plan, invalidation,
    setupsBackedByHistory: setups, setupsFiringButUnproven: unproven.length ? unproven : undefined,
    historyBasis: `${long.length} daily bars (~5y) of ${sym}; ${HORIZON}-bar forward results, min ${MIN_SAMPLES} samples, non-overlapping`,
    signalsUsed: why, candlePatternsNow: dy.candlePatterns, patternsNow: dy.patterns, volume: dy.volume,
    newsWeighting: 'Call ticker_news. Confirmed catalyst in the same direction: raise confidence by up to 10 (stay under 90). Catalyst against the bias: cut confidence by 15 and say the news conflicts. No catalyst: say it looks purely technical and keep the number. Never raise a bias on unconfirmed rumour.',
    newsStep: 'Call ticker_news for this symbol, then say whether the move has a confirmed catalyst or looks purely technical, and fold it into the confidence.',
    guide: 'Speak: bias, confidence %, pre-market read if available (gap vs prior close in price and percent, pre-market volume vs usual and what it means for conviction: heavy = stronger, thin = say confidence is low; pre-market high, low, VWAP, prints if any), the historical hit rate for the setup on THIS ticker (win rate, average move, average drawdown, sample size; if none is backed say there is no proven setup), key support/resistance, ATR stop and target, and what would invalidate it. Short, numbers aloud, never "on screen". Odds, not predictions; never promise returns; not financial advice; never trade from a chart read alone (trade_propose is separate).'
  };
}
