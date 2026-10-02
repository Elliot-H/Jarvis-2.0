// Real-time alert rules over the live quote stream (livefeed.js). Pure rule checks: facts and informational alerts only.
// It never places orders. Thresholds are tunable at runtime (state.alertCfg via the alert_config tool), no redeploy.
import * as chart from './chart.js';
import * as sig from './signals.js';

const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);
export const DEFAULTS = {
  intervalSec: num(process.env.ALERT_INTERVAL_SEC, 15),        // how often the stream is checked (min 5)
  dropPct: num(process.env.WATCH_DROP_PCT, 2),                 // sudden drop: % fall within dropWindowMin
  dropWindowMin: num(process.env.WATCH_DROP_WINDOW_MIN, 15),
  dropDayPct: 3,                                               // or this % under yesterday's close
  spikePct: 3,                                                 // spike up: % rise (window or vs yesterday)...
  spikeVolRatio: 1,                                            // ...with today's volume at least this x the 20-day average
  newSignalScore: 75,                                          // fresh signal_scan setup: min score (needs a defined stop)
  newSignalEveryMin: 15,
  sweepEveryMin: 18,                                           // full-market sweep (gainers, most active, broad universe), market hours: ~21 a day
  moverEveryMin: 30,                                           // biggest-mover sweep (stocks + crypto): one candidate per run, silent unless it passes the spike/drop/volume thresholds
  sweepSize: 40,                                               // symbols that get the full signal score per sweep
  targetNearPct: 0.3,                                          // target / resistance: within this % counts as reached
  volFirstRatio: 1.5,                                          // STAGE 1 (first flag, no price move needed): volume UP at least this x the 20-day average. 0 = off
  unusualVolRatio: 2,                                          // volume > this x the 20-period average
  newsEveryMin: 20,                                            // news catalyst check on held symbols
  cooldownMin: num(process.env.WATCH_COOLDOWN_MIN, 10),        // repeat spacing for stop / drop
  infoCooldownHours: 6,                                        // repeat spacing for the other alerts
  trailPct: num(process.env.TRAIL_PCT, 10),                    // trailing stop: % below the highest price seen since entry (stop only ratchets up)
  atrMult: 2,                                                  // trailing stop distance in ATRs (14-day) below the highest price; per-ticker via its own volatility
  costPct: 0.2,                                                // after the first scale-out the stop never sits under entry + this % (breakeven plus costs)
  dustUsd: num(process.env.DUST_USD, 1),                       // open positions worth less than this ($) are dust: no alerts, no watch-list row
  staleSec: 120                                                // quotes older than this never trigger price alerts
};
export const KEYS = Object.keys(DEFAULTS);
export const cfgOf = saved => ({ ...DEFAULTS, ...(saved || {}) });
export function setCfg(saved, key, value) {
  if (!KEYS.includes(key)) return { error: `Unknown setting. Options: ${KEYS.join(', ')}.` };
  const v = Number(value); if (!Number.isFinite(v) || v < 0) return { error: 'The value must be a number, zero or more.' };
  if (key === 'intervalSec' && v < 5) return { error: 'intervalSec must be at least 5.' };
  saved[key] = v; return { ok: true };
}

// ---- per-symbol context from daily candles (Yahoo, no key), refreshed every 10 minutes
const ctxCache = new Map();
export async function context(sym) {
  const c = ctxCache.get(sym);
  if (c && Date.now() - c.at < 10 * 60e3) return c.v;
  try {
    const ys = chart.ySymbol(sym); if (!ys) return null;
    const b = await chart.bars(ys, '1d'), f = sig.features(b), px = f.price;
    const avgVol = chart.sma(b.slice(0, -1).map(x => x.v), 20), todayVol = b[b.length - 1].v;
    const res = chart.levels(b, px).resistance.filter(r => r.touches >= 2)[0] || null;
    const cl = b.map(x => x.c), ma20 = chart.sma(cl, 20), ma20Prev = chart.sma(cl.slice(0, -5), 20);
    const v = { ma20, ma20Rising: ma20 != null && ma20Prev != null && ma20 > ma20Prev, e20: f.e20, macdDown: f.hist < 0 && f.hist < f.histPrev, volRatio: avgVol ? todayVol / avgVol : null, resistance: res?.price ?? null, atr: f.atr };
    ctxCache.set(sym, { at: Date.now(), v }); return v;
  } catch { ctxCache.set(sym, { at: Date.now(), v: c?.v || null }); return c?.v || null; }
}

const fp = v => (Math.abs(v) >= 1 ? v.toFixed(2) : v.toPrecision(3));
const pct = (a, b) => (b ? (a - b) / b * 100 : null);

/**
 * item: {sym, held, stop, entry, target}; quote: livefeed.latest(); hist: [{t,p}] within the drop window (oldest first); ctx: context().
 * Returns [{key, title, body, level, cooldownMin}] (level = the stop/target/average it relates to, or null).
 */
export function triggers(item, quote, hist, ctx, cfg) {
  if (!quote || quote.ageSec > cfg.staleSec) return [];
  const out = [], p = quote.price, s = item.sym;
  const day = pct(p, quote.prevClose), first = hist[0], win = first ? pct(p, first.p) : null, hi = hist.length ? Math.max(...hist.map(x => x.p)) : p;
  const add = (key, title, what, level, cool, act) => out.push({ key: `${s}:${key}`, title: `${title}: ${s}`, what, level, act, move: day ?? win, cooldownMin: cool ?? cfg.infoCooldownHours * 60 });
  const floor = item.stop ?? p * 0.97;
  // sell side
  if (item.stop && p <= item.stop) add('stop', 'SELL WARNING, STOP HIT', `price ${fp(p)} is at or under your stop ${fp(item.stop)}`, `stop ${fp(item.stop)}`, cfg.cooldownMin, 'I would exit here.');
  if (ctx && item.held !== false && p < ctx.e20 && ctx.macdDown && (ctx.volRatio ?? 0) >= 1) add('trend', 'SELL WARNING, UPTREND BREAK', `price ${fp(p)} is under the 20-day average ${fp(ctx.e20)} with MACD turning down on above-average volume (${ctx.volRatio.toFixed(1)}x)`, `20-day avg ${fp(ctx.e20)}`, 4 * 60, `I would trim, and exit if it loses ${fp(floor)}.`);
  const drop = (hi - p) / hi * 100;
  if (hist.length > 1 && drop >= cfg.dropPct) add('drop', 'SUDDEN DROP', `down ${drop.toFixed(1)}% in ${Math.round((Date.now() - first.t) / 60e3)} min (${fp(hi)} to ${fp(p)})`, item.stop ? `stop ${fp(item.stop)}` : null, cfg.cooldownMin, `I would hold, or trim if it loses ${fp(floor)}.`);
  else if (day != null && day <= -cfg.dropDayPct) add('day', 'DOWN ON THE DAY', `${day.toFixed(1)}% under yesterday's close`, item.stop ? `stop ${fp(item.stop)}` : null, cfg.cooldownMin, `I would trim, or exit under ${fp(floor)}.`);
  // take profit
  const target = item.target ?? (item.entry && item.stop && item.entry > item.stop ? item.entry + 2 * (item.entry - item.stop) : null);
  if (target && p >= target * (1 - cfg.targetNearPct / 100)) add('target', 'TAKE-PROFIT, TARGET REACHED', `price ${fp(p)} reached your target ${fp(target)}`, `target ${fp(target)}`, undefined, `I would take profit, or trail the stop up to ${fp(item.entry ?? p * 0.98)}.`);
  else if (ctx?.resistance && item.held !== false && p >= ctx.resistance * (1 - cfg.targetNearPct / 100)) add('resist', 'TAKE-PROFIT, RESISTANCE HIT', `price ${fp(p)} is at resistance ${fp(ctx.resistance)}`, `resistance ${fp(ctx.resistance)}`, undefined, 'I would take some profit or tighten the stop.');
  // buy side + info
  const up = Math.max(day ?? -Infinity, win ?? -Infinity);
  if (up >= cfg.spikePct && ctx && (ctx.volRatio ?? 0) >= cfg.spikeVolRatio) add('spike', 'BUY-WATCH, SPIKE UP', `up ${up.toFixed(1)}% on ${ctx.volRatio.toFixed(1)}x average volume`, null, undefined, `I would wait for a pullback, not chase; a stop near ${fp(p * 0.97)}.`);
  // Staged buy-side flag, volume FIRST. Stage 1 volume up vs the 20-day average (no price move required); then stage 2 price confirms up
  // (not down, not fading); then stage 3 trend (price above a rising 20-day MA) and the volume spike ratios. Informational only.
  const vr = ctx?.volRatio ?? 0;
  if (cfg.volFirstRatio > 0 && vr >= cfg.volFirstRatio) {
    const s2 = (day ?? win ?? 0) > 0 && (win == null || win >= 0) && p >= hi * 0.997;
    const s3a = !!ctx.ma20Rising && p > ctx.ma20, s3b = vr >= cfg.unusualVolRatio, s3 = s2 && s3a;
    const st = `Stage 1 volume ${vr.toFixed(1)}x the 20-day average: yes. Stage 2 price: ${s2 ? 'confirming up' : (day ?? 0) < 0 || (win ?? 0) < 0 ? 'down, not confirmed' : 'not moving up yet'}. Stage 3 trend: ${s3a ? 'above a rising 20-day MA' : 'not above a rising 20-day MA'}${s3b ? `, spike volume (over ${cfg.unusualVolRatio}x)` : ''}.`;
    add(s3 ? 'vol1c' : 'vol1', s3 ? 'BUY-WATCH, VOLUME FIRST, CONFIRMED' : 'BUY-WATCH, VOLUME FIRST (EARLY)', st, null, undefined, s3 ? `I would look at an entry near ${fp(p)} with a stop near ${fp(p * 0.97)}.` : s2 ? 'I would wait for the trend to confirm before entering.' : 'I would only watch it for now; no entry until price confirms up.');
  } else if (cfg.volFirstRatio <= 0 && ctx && vr > cfg.unusualVolRatio) add('vol', 'INFO, UNUSUAL VOLUME', `volume is ${ctx.volRatio.toFixed(1)}x the 20-day average`, null, undefined, 'I would check the news before acting.');
  return out;
}

export function format(a, quote) {
  const mv = a.move == null ? 'n/a' : `${a.move >= 0 ? '+' : ''}${a.move.toFixed(1)}%`;
  const age = quote ? `${quote.ageSec}s old (${quote.source})` : 'unknown';
  return `${a.title.split(': ')[1]}: ${a.what}. Price ${fp(quote.price)}, move ${mv}${a.level ? `, level: ${a.level}` : ''}. Quote ${age}. ${a.act}`;
}

// ---- news catalyst (held symbols): high-impact headline in the last 3 hours
export const NEWS_RE = /earnings|guidance|downgrad|upgrad|\bSEC\b|FDA|lawsuit|investigation|subpoena|recall|bankrupt|offering|merger|acquisition|buyout|delist|halt|antitrust|probe|fraud/i;
export function catalysts(headlines, seen) {
  const cutoff = Date.now() - 3 * 3600e3;
  return (headlines || []).filter(h => h.headline && NEWS_RE.test(h.headline) && (!h.at || Date.parse(h.at) >= cutoff) && !seen.has(h.headline));
}
