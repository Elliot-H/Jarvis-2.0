// Elis chart + news reader (Owner 2026-11-23): read candles, volume, VWAP, structure and headlines the way a trader does,
// so the learner can match them with outcomes. Pure functions, no network.

// ---------------- candles ----------------
// 1-min bars [{t,o,h,l,c,v}] -> 5-min candles aligned to the 09:30 open (t0 = 09:30 in ms).
export function to5m(bars, t0) {
  const out = [];
  for (const b of bars) {
    const k = Math.floor((b.t - t0) / 300e3); if (k < 0) continue;
    const c = out[out.length - 1];
    if (c && c.k === k) { c.h = Math.max(c.h, b.h); c.l = Math.min(c.l, b.l); c.c = b.c; c.v += b.v; }
    else out.push({ k, t: t0 + k * 300e3, o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
  }
  return out;
}
const body = x => Math.abs(x.c - x.o), rng = x => Math.max(1e-9, x.h - x.l), up = x => x.c > x.o, dn = x => x.c < x.o;
const upper = x => x.h - Math.max(x.o, x.c), lower = x => Math.min(x.o, x.c) - x.l, mid = x => (x.o + x.c) / 2;

// Candlestick patterns on the LAST candle (using up to 5 before it). Each: { name, bias: bull|bear|neutral, strength 1-3 }.
export function candlePatterns(cs) {
  const n = cs.length; if (!n) return [];
  const x = cs[n - 1], a = cs[n - 2], b = cs[n - 3], P = [], add = (name, bias, strength) => P.push({ name, bias, strength });
  const avgBody = cs.slice(-11, -1).reduce((s, k) => s + body(k), 0) / Math.max(1, Math.min(10, n - 1)) || body(x) || 1e-9;
  const prior = cs.slice(-6, -1), fell = prior.length >= 3 && prior.at(-1).c < prior[0].o, rose = prior.length >= 3 && prior.at(-1).c > prior[0].o;
  const small = body(x) < 0.3 * rng(x), big = body(x) > 1.3 * avgBody;
  // one-candle
  if (body(x) <= 0.1 * rng(x)) {
    if (lower(x) > 0.6 * rng(x)) add('dragonfly doji', fell ? 'bull' : 'neutral', fell ? 2 : 1);
    else if (upper(x) > 0.6 * rng(x)) add('gravestone doji', rose ? 'bear' : 'neutral', rose ? 2 : 1);
    else add('doji', 'neutral', 1);
  }
  if (lower(x) >= 2 * body(x) && upper(x) <= Math.max(body(x), 0.1 * rng(x)) && body(x) > 0.1 * rng(x)) add(fell ? 'hammer' : rose ? 'hanging man' : 'hammer-shape', fell ? 'bull' : rose ? 'bear' : 'neutral', fell || rose ? 2 : 1);
  if (upper(x) >= 2 * body(x) && lower(x) <= Math.max(body(x), 0.1 * rng(x)) && body(x) > 0.1 * rng(x)) add(rose ? 'shooting star' : fell ? 'inverted hammer' : 'star-shape', rose ? 'bear' : fell ? 'bull' : 'neutral', rose || fell ? 2 : 1);
  if (big && upper(x) < 0.05 * rng(x) && lower(x) < 0.05 * rng(x)) add(up(x) ? 'bullish marubozu' : 'bearish marubozu', up(x) ? 'bull' : 'bear', 2);
  else if (big) add(up(x) ? 'strong bull candle' : 'strong bear candle', up(x) ? 'bull' : 'bear', 1);
  if (small && upper(x) > body(x) && lower(x) > body(x) && body(x) > 0.1 * rng(x)) add('spinning top', 'neutral', 1);
  if (a) {
    // two-candle
    if (up(x) && dn(a) && x.c >= a.o && x.o <= a.c && body(x) > body(a)) add('bullish engulfing', 'bull', fell ? 3 : 2);
    if (dn(x) && up(a) && x.c <= a.o && x.o >= a.c && body(x) > body(a)) add('bearish engulfing', 'bear', rose ? 3 : 2);
    if (body(a) > avgBody && Math.max(x.o, x.c) < Math.max(a.o, a.c) && Math.min(x.o, x.c) > Math.min(a.o, a.c)) add(dn(a) ? 'bullish harami' : 'bearish harami', dn(a) ? 'bull' : 'bear', 1);
    if (dn(a) && up(x) && x.o < a.c && x.c > mid(a) && x.c < a.o) add('piercing line', 'bull', 2);
    if (up(a) && dn(x) && x.o > a.c && x.c < mid(a) && x.c > a.o) add('dark cloud cover', 'bear', 2);
    if (Math.abs(x.l - a.l) <= 0.05 * rng(x) && dn(a) && up(x)) add('tweezer bottom', 'bull', 2);
    if (Math.abs(x.h - a.h) <= 0.05 * rng(x) && up(a) && dn(x)) add('tweezer top', 'bear', 2);
    if (x.h <= a.h && x.l >= a.l) add('inside bar', 'neutral', 1);
    if (x.h > a.h && x.l < a.l) add('outside bar', up(x) ? 'bull' : 'bear', 1);
  }
  if (a && b) {
    // three-candle
    if (dn(b) && body(b) > avgBody && body(a) < 0.5 * body(b) && up(x) && x.c > mid(b)) add('morning star', 'bull', 3);
    if (up(b) && body(b) > avgBody && body(a) < 0.5 * body(b) && dn(x) && x.c < mid(b)) add('evening star', 'bear', 3);
    if ([b, a, x].every(up) && a.c > b.c && x.c > a.c && a.o > b.o && x.o > a.o) add('three white soldiers', 'bull', 3);
    if ([b, a, x].every(dn) && a.c < b.c && x.c < a.c && a.o < b.o && x.o < a.o) add('three black crows', 'bear', 3);
  }
  return P;
}

// Bull/bear flag: a strong impulse candle, then 2-4 small candles drifting back less than half of it on lighter volume.
export function flag(cs) {
  for (let len = 2; len <= 4; len++) {
    const i = cs.length - 1 - len; if (i < 0) break;
    const imp = cs[i], pull = cs.slice(i + 1), move = imp.c - imp.o, avgV = pull.reduce((s, k) => s + k.v, 0) / pull.length;
    if (Math.abs(move) < 0.6 * rng(imp) || avgV > imp.v * 0.8) continue;
    const hi = Math.max(...pull.map(k => k.h)), lo = Math.min(...pull.map(k => k.l));
    if (move > 0 && lo > imp.c - 0.5 * move && hi <= imp.h * 1.002) return 'bull flag';
    if (move < 0 && hi < imp.c - 0.5 * move && lo >= imp.l * 0.998) return 'bear flag';
  }
  return null;
}

// Full read at a moment: bars = completed 1-min bars from 09:30 up to now; dir = intended trade side.
export function read(bars, dir, t0, atr) {
  const cs = to5m(bars, t0), long = dir === 'long', last = bars.at(-1);
  if (!cs.length || !last) return { feat: { candle: 'candle-none', volume: 'vol-normal', vwap: 'vwap-with', structure: 'range', extension: 'ext-normal', timing: 'early' }, patterns: [], text: 'no data' };
  const pats = candlePatterns(cs), fl = flag(cs);
  if (fl) pats.push({ name: fl, bias: fl === 'bull flag' ? 'bull' : 'bear', strength: 2 });
  const net = pats.reduce((s, p) => s + (p.bias === 'bull' ? p.strength : p.bias === 'bear' ? -p.strength : 0), 0) * (long ? 1 : -1);
  let pv = 0, vv = 0; for (const b of bars) { pv += (b.h + b.l + b.c) / 3 * b.v; vv += b.v; }
  const vwap = vv ? pv / vv : last.c, ext = atr ? Math.abs(last.c - vwap) / atr : 0;
  const lastV = bars.slice(-3).reduce((s, b) => s + b.v, 0) / Math.min(3, bars.length), priorV = bars.slice(-23, -3);
  const volRatio = priorV.length ? lastV / (priorV.reduce((s, b) => s + b.v, 0) / priorV.length) : 1;
  const c3 = cs.slice(-3), hh = c3.length === 3 && c3[2].h > c3[1].h && c3[1].h > c3[0].h && c3[2].l > c3[0].l, ll = c3.length === 3 && c3[2].l < c3[1].l && c3[1].l < c3[0].l && c3[2].h < c3[0].h;
  const mins = (last.t - t0) / 60e3;
  const feat = {
    candle: net >= 2 ? 'candle-with' : net <= -2 ? 'candle-against' : net !== 0 ? 'candle-mild' : 'candle-none',
    volume: volRatio >= 2 ? 'vol-strong' : volRatio < 0.8 ? 'vol-weak' : 'vol-normal',
    vwap: (long ? last.c >= vwap : last.c <= vwap) ? 'vwap-with' : 'vwap-against',
    structure: (long ? hh : ll) ? 'trend-with' : (long ? ll : hh) ? 'trend-against' : 'range',
    extension: ext > 1 ? 'ext-stretched' : ext > 0.5 ? 'ext-moderate' : 'ext-normal',
    timing: mins < 20 ? 'early' : mins < 50 ? 'mid' : 'late'
  };
  feat.comboCandleVol = `${feat.candle}+${feat.volume}`;
  const text = `${pats.length ? pats.map(p => p.name).join(', ') : 'no clear candle'}; volume ${volRatio.toFixed(1)}x; ${feat.vwap === 'vwap-with' ? 'right side of' : 'wrong side of'} VWAP ${vwap.toFixed(2)}; ${feat.structure}`;
  return { feat, patterns: pats.map(p => p.name), vwap, volRatio, text };
}
export const ENTRY_FEATURES = ['candle', 'volume', 'vwap', 'structure', 'extension', 'timing', 'comboCandleVol'];

// ---------------- headlines ----------------
const NEG = /\b(withdr[ae]w|revok|rescind|remov(e|ed|es|al) .*approv|reject|complete response letter|\bcrl\b|halt(ed|s)?|(public |stock |share )?offering|dilut|downgrad|miss(es|ed)?\b|cut(s|ting)? (its |the )?(guidance|outlook|forecast)|lower(s|ed)? (guidance|outlook|forecast)|warn(s|ing)?|investigat|subpoena|lawsuit|sues|sued|class action|recall|delist|bankrupt|chapter 11|default|resign|fraud|short (seller|report)|plunge|tumble|sink|slump|fail(s|ed|ure)?|clinical hold|safety (concern|signal)|death|suspend)/i;
const POS = /\b(approv(al|ed|es)|clear(ed|ance)|beat(s)?\b|tops estimates|raise(s|d)? (its |the )?(guidance|outlook|forecast)|upgrad|award(ed)?|wins? .*contract|contract|partner(ship)?|acqui(re|res|sition)|buyout|to be acquired|record (revenue|sales|quarter)|breakthrough|positive (data|results|topline)|met (primary )?endpoint|surge|soar|jump|rall(y|ies)|buyback|repurchase|dividend (hike|increase))/i;
export function tone(headline) {
  const h = String(headline || ''); if (!h) return 'none';
  const neg = NEG.test(h), pos = POS.test(h);
  return neg && pos ? (/(withdr|revok|rescind|reject|crl|halt|offering|dilut|downgrad|cut|lower|fraud|bankrupt|delist|clinical hold)/i.test(h) ? 'neg' : 'mixed') : neg ? 'neg' : pos ? 'pos' : 'neutral';
}
// pre-open news tone across several headlines -> learner feature
export function toneOf(headlines = []) {
  if (!headlines.length) return 'none';
  const t = headlines.map(tone), n = t.filter(x => x === 'neg').length, p = t.filter(x => x === 'pos').length;
  return n && p ? 'news-mixed' : n ? 'news-neg' : p ? 'news-pos' : 'news-neutral';
}
// is this headline against an open trade?
export const adverse = (t, dir) => (dir === 'long' ? t === 'neg' : t === 'pos');
