// Rule-based technical signals from daily candles: setup score, stop-loss level, exit signal, and an honest
// back-test of the same rule on the ticker's own history. Not advice; it never trades.
import { bars, sma, emaSeries, rsi, atr } from './chart.js';

const r2 = v => (v == null || !Number.isFinite(v) ? null : Math.abs(v) >= 1 ? Number(v.toFixed(2)) : Number(v.toPrecision(3)));

export function features(b) {
  const c = b.map(x => x.c), n = c.length, price = c[n - 1];
  const e20 = emaSeries(c, 20), e50 = emaSeries(c, 50);
  const e12 = emaSeries(c, 12), e26 = emaSeries(c, 26), macd = e12.map((v, i) => v - e26[i]), sig = emaSeries(macd, 9);
  const hist = macd[n - 1] - sig[n - 1], histPrev = macd[n - 2] - sig[n - 2];
  const vAvg = sma(b.map(x => x.v), 20), last = b[n - 1];
  return {
    price, e20: e20[n - 1], e50: e50[n - 1], hist, histPrev, rsi: rsi(c), atr: atr(b),
    rsiPrev: rsi(c.slice(0, -2)), volRatio: vAvg ? last.v / vAvg : null,
    higherLows: b[n - 1].l > b[n - 2].l && b[n - 2].l > b[n - 3].l, risingCloses: c[n - 1] > c[n - 2] && c[n - 2] > c[n - 3],
    upBar: last.c > last.o, low10: Math.min(...b.slice(-10).map(x => x.l))
  };
}

export function setupScore(f) {
  const pts = [], miss = [];
  const add = (ok, w, yes, no) => (ok ? pts.push([w, yes]) : miss.push(no));
  add(f.price > f.e20, 20, 'price above its 20-day average', 'price below its 20-day average');
  add(f.e20 > f.e50, 20, '20-day average above the 50-day', '20-day average not above the 50-day');
  add(f.hist > 0 && f.hist > f.histPrev, 20, 'MACD positive and strengthening', 'MACD not positive and strengthening');
  add(f.rsi >= 50 && f.rsi <= 70, 15, `RSI ${r2(f.rsi)} (strong, not overbought)`, `RSI ${r2(f.rsi)} (outside the 50 to 70 sweet spot)`);
  add(f.higherLows || f.risingCloses, 15, 'last three candles stepping up', 'last three candles not stepping up');
  add(f.upBar && f.volRatio != null && f.volRatio >= 1, 10, `up candle on ${r2(f.volRatio)}x average volume`, 'no above-average volume on an up candle');
  return { score: pts.reduce((a, [w]) => a + w, 0), reasons: pts.map(x => x[1]), missing: miss };
}

export function stopLevel(f) {
  const floor = f.price - 3 * f.atr;                       // never wider than 3 ATR
  const stop = Math.max(floor, f.low10 - 0.1 * f.atr);     // just under the 10-day low, otherwise 3 ATR
  const s = Math.min(stop, f.price - 1.2 * f.atr);         // and never tighter than 1.2 ATR (noise)
  return { stop: r2(s), riskPct: r2((f.price - s) / f.price * 100), target: r2(f.price + 2 * (f.price - s)) };
}

export function exitSignal(b, stop) {
  const f = features(b), why = [];
  if (f.price < f.e20 && f.hist < 0 && f.hist < f.histPrev) why.push('closed under its 20-day average with MACD turning down');
  if (f.rsiPrev != null && f.rsiPrev > 70 && f.rsi < 65) why.push(`RSI rolled over from ${r2(f.rsiPrev)} to ${r2(f.rsi)}`);
  if (f.e20 < f.e50 && f.price < f.e50) why.push('20-day average crossed under the 50-day and price is below both');
  if (stop != null && f.price <= stop) why.push(`price ${r2(f.price)} is at or under the stop ${stop}`);
  return { exit: why.length > 0, reasons: why, price: r2(f.price), stop: stopLevel(f).stop };
}

// Same entry rule replayed on the ticker's own history: entry when the score crosses 70, stop as above, hold up to 10 bars.
export function backtest(b) {
  const out = [];
  let prev = 0;
  for (let i = 60; i < b.length - 1; i++) {
    const w = b.slice(0, i + 1), f = features(w), sc = setupScore(f).score;
    if (sc >= 70 && prev < 70) {
      const { stop } = stopLevel(f), entry = f.price;
      let ret = null;
      for (let j = i + 1; j <= Math.min(i + 10, b.length - 1); j++) {
        if (b[j].l <= stop) { ret = stop / entry - 1; break; }
        if (j === Math.min(i + 10, b.length - 1)) ret = b[j].c / entry - 1;
      }
      if (ret != null) out.push(ret);
    }
    prev = sc;
  }
  const n = out.length, wins = out.filter(x => x > 0).length;
  return { samples: n, winRatePct: n ? Math.round(wins / n * 100) : null, avgReturnPct: n ? r2(out.reduce((a, x) => a + x, 0) / n * 100) : null };
}

export async function evaluate(symbol) {
  const b = await bars(symbol, '1dlong'), f = features(b), s = setupScore(f), st = stopLevel(f), bt = backtest(b);
  let label = 'weak';
  if (s.score >= 75) label = bt.samples >= 5 && bt.winRatePct >= 55 ? 'strong' : 'promising but unproven on this ticker';
  else if (s.score >= 55) label = 'moderate';
  const ex = exitSignal(b, null);
  return { symbol, price: r2(f.price), score: s.score, label, reasons: s.reasons, missing: s.missing, ...st, history: bt, exitWarning: ex.exit ? ex.reasons : null };
}

export async function scan(symbols, top = 5) {
  const res = [], errs = [];
  const q = [...symbols];
  await Promise.all(Array.from({ length: 5 }, async () => {
    for (let s; (s = q.shift());) { try { res.push(await evaluate(s)); } catch (e) { errs.push(`${s}: ${e.message}`); } }
  }));
  res.sort((a, b) => b.score - a.score);
  return { scanned: symbols.length, failed: errs.length ? errs.slice(0, 3) : undefined, top: res.slice(0, top) };
}
