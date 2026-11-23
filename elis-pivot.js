// Elis PIVOT STUDY (Owner 2026-11-23, incl. "this has to include news, social reactions and all the other contexts"): "learn what the chart showed before every peak and bounce, weigh those signs,
// and recognise them next time". Every completed 5-minute candle of every stored stock-day is a sample:
//   what Elis could see at that moment (candle pattern + sequence, volume change, VWAP side/distance, prior 30-min trend,
//   time of day, market direction)  ->  what price did over the NEXT 30 minutes (up / down / chop, in units of daily range).
// Signals are counted on the TRAIN days and kept only if they also beat the base rate on the UNSEEN days.
// Validated "turn against you" signals can then drive an exit rule, which is replay-tested like everything else.
import * as RD from './elis-read.js';

export const HORIZON = 6, MOVE = 0.4;   // 6 candles = 30 min; a move counts if it reaches 0.4 x the daily range (ATR)

const bucketVol = r => (r < 0.7 ? 'vol-fading' : r < 1.5 ? 'vol-normal' : r < 3 ? 'vol-rising' : 'vol-surge');
const bucketTrend = x => (x > 0.6 ? 'up-strong' : x > 0.2 ? 'up' : x < -0.6 ? 'down-strong' : x < -0.2 ? 'down' : 'flat');
const bucketTime = m => (m < 30 ? 't-open' : m < 90 ? 't-morning' : m < 210 ? 't-midday' : m < 330 ? 't-afternoon' : 't-close');

// Features at the close of 5-min candle k. cs = 5-min candles from 09:30; vw = running VWAP at that candle; atr = daily range.
export function pivotFeatures(cs, k, vw, atr, spyTrend, row = null) {
  const x = cs[k], win = cs.slice(Math.max(0, k - 11), k + 1), pats = RD.candlePatterns(win), fl = RD.flag(win);
  const top = pats.filter(p => p.bias !== 'neutral').sort((a, b) => b.strength - a.strength)[0] || pats[0];
  // indecision run: consecutive dojis / spinning tops (the Owner's "dojis in consecutive order")
  let run = 0; for (let i = k; i >= Math.max(0, k - 4); i--) { const c = cs[i], b = Math.abs(c.c - c.o), r = Math.max(1e-9, c.h - c.l); if (b <= 0.25 * r) run++; else break; }
  const prior = cs.slice(Math.max(0, k - 6), k), avgV = prior.length ? prior.reduce((s, c) => s + c.v, 0) / prior.length : x.v;
  const tr = k >= 6 ? (x.c - cs[k - 6].c) / atr : (x.c - cs[0].o) / atr, dv = (x.c - vw) / atr;
  return {
    pattern: fl || (top ? top.name : 'no-pattern'),
    indecision: run >= 2 ? `indecision-x${Math.min(run, 3)}` : 'no-indecision',
    vol: bucketVol(avgV ? x.v / avgV : 1),
    vwap: (dv >= 0 ? 'above-vwap' : 'below-vwap') + (Math.abs(dv) > 0.5 ? '-far' : ''),
    trend: bucketTrend(tr),
    time: bucketTime(k * 5),
    market: spyTrend || 'mkt-?',
    // news + social + context (from the journal row: pre-open news, mid-day headlines by minute, market/sector/fear/buzz)
    newsRecent: recentNews(row, (k + 1) * 5),
    newsDay: row ? `${row.tone || (row.news ? 'news-neutral' : 'none')}/${row.cat || 'none'}` : 'news-?',
    sector: row?.ctx?.sector || 'sector-unknown',
    fear: row?.ctx?.fear || 'fear-unknown',
    mktGap: row?.ctx?.mktGap || 'spy-unknown',
    buzz: row?.ctx?.buzz || 'buzz-unknown'
  };
}
// headline(s) in the 30 minutes before minute m of the session (m counted from 09:30)
function recentNews(row, m) {
  const ev = (row?.intraday || []).filter(e => e.m > m - 30 && e.m <= m); if (!row) return 'news-?';
  if (!ev.length) return 'no-recent-news';
  const neg = ev.some(e => e.tone === 'neg'), pos = ev.some(e => e.tone === 'pos');
  return neg && pos ? 'recent-news-mixed' : neg ? 'recent-news-bad' : pos ? 'recent-news-good' : 'recent-news-neutral';
}
// Which combinations are tracked (single signs, the pairs traders read together, and the full picture)
export const KEYS = [
  ['pattern'], ['indecision'], ['vol'], ['vwap'], ['trend'],
  ['pattern', 'vol'], ['pattern', 'trend'], ['indecision', 'trend'], ['indecision', 'vol'], ['vwap', 'trend'], ['vol', 'trend'], ['trend', 'market'],
  ['pattern', 'vol', 'trend'], ['indecision', 'vol', 'trend'], ['pattern', 'vwap', 'trend'], ['pattern', 'vol', 'vwap', 'trend'],
  // news, social and context, alone and read together with the chart
  ['newsRecent'], ['newsDay'], ['sector'], ['fear'], ['mktGap'], ['buzz'],
  ['newsRecent', 'trend'], ['newsRecent', 'pattern'], ['newsRecent', 'vol', 'trend'], ['newsDay', 'trend'], ['newsDay', 'time'],
  ['sector', 'trend'], ['fear', 'trend'], ['mktGap', 'time'], ['market', 'pattern'], ['buzz', 'trend'], ['buzz', 'vol'],
  ['pattern', 'vol', 'newsRecent', 'trend']
];
export const keyOf = (f, ks) => ks.map(k => f[k]).join(' + ');

export function outcome(cs, k, atr) {
  const fut = cs.slice(k + 1, k + 1 + HORIZON); if (fut.length < HORIZON) return null;
  const up = (Math.max(...fut.map(c => c.h)) - cs[k].c) / atr, dn = (cs[k].c - Math.min(...fut.map(c => c.l))) / atr;
  return up >= MOVE && up > dn * 1.5 ? 'up' : dn >= MOVE && dn > up * 1.5 ? 'down' : 'chop';
}

// Walk one stock-day: yields [features, outcome] for every candle with a full 30-min future.
export function samples(bars1m, t0, atr, spyBars1m, row = null) {
  if (!bars1m?.length || !atr) return [];
  const cs = RD.to5m(bars1m, t0), spy = spyBars1m ? RD.to5m(spyBars1m, t0) : [], out = [];
  let pv = 0, vv = 0, bi = 0;
  for (let k = 1; k < cs.length - HORIZON; k++) {
    const end = cs[k].t + 300e3; while (bi < bars1m.length && bars1m[bi].t < end) { const b = bars1m[bi++]; pv += (b.h + b.l + b.c) / 3 * b.v; vv += b.v; }
    const vw = vv ? pv / vv : cs[k].c, s = spy[k], s6 = spy[Math.max(0, k - 6)];
    const spyTrend = s && s6 ? (s.c > s6.c * 1.0015 ? 'mkt-up' : s.c < s6.c * 0.9985 ? 'mkt-down' : 'mkt-flat') : null;
    const o = outcome(cs, k, atr); if (o) out.push([pivotFeatures(cs, k, vw, atr, spyTrend, row), o]);
  }
  return out;
}

// Accumulate counts: table[keyName][value] = { n, up, down }
export const newTable = () => ({ base: { n: 0, up: 0, down: 0 }, t: {} });
export function add(T, f, o) {
  T.base.n++; if (o !== 'chop') T.base[o]++;
  for (const ks of KEYS) { const kn = ks.join('+'), v = keyOf(f, ks), c = ((T.t[kn] ||= {})[v] ||= { n: 0, up: 0, down: 0 }); c.n++; if (o !== 'chop') c[o]++; }
}
// Signals that beat the base rate on TRAIN and again on UNSEEN days. lift = P(move | signs) / P(move overall)
export function validate(train, test, { minTrain = 150, minTest = 50, liftTrain = 1.2, liftTest = 1.1 } = {}) {
  const out = [];
  for (const dir of ['up', 'down']) {
    const bTr = train.base[dir] / Math.max(1, train.base.n), bTe = test.base[dir] / Math.max(1, test.base.n);
    if (bTr < 0.01 || bTe < 0.01) continue;   // a move that (almost) never happens has no meaningful odds
    for (const [kn, vals] of Object.entries(train.t)) for (const [v, c] of Object.entries(vals)) {
      if (c.n < minTrain) continue; const pTr = c[dir] / c.n; if (pTr / bTr < liftTrain) continue;
      const u = test.t[kn]?.[v]; if (!u || u.n < minTest) continue; const pTe = u[dir] / u.n; if (pTe / bTe < liftTest) continue;
      out.push({ dir, key: kn, signs: v, train: { n: c.n, p: r3(pTr), lift: r2(pTr / bTr) }, unseen: { n: u.n, p: r3(pTe), lift: r2(pTe / bTe) } });
    }
  }
  return out.sort((a, b) => b.unseen.lift * Math.log(b.unseen.n) - a.unseen.lift * Math.log(a.unseen.n));
}
const r2 = x => Math.round(x * 100) / 100, r3 = x => Math.round(x * 1000) / 1000;

// For live use / exits: probability that price moves `dir` in the next 30 min, from the most specific validated signal present.
export function compile(validated) {   // -> { 'down': { 'pattern+vol+trend': { 'evening star + vol-rising + up': p } }, 'up': {...}, base }
  const m = { up: {}, down: {} }; for (const s of validated) ((m[s.dir][s.key] ||= {})[s.signs] = s.unseen.p); return m;
}
export function pChance(table, f, dir) {
  if (!table?.[dir]) return 0; let best = 0;
  for (const ks of KEYS) { const p = table[dir][ks.join('+')]?.[keyOf(f, ks)]; if (p > best) best = p; }
  return best;
}
export function textOf(v, base, limit = 8) {
  const line = s => `${s.dir === 'down' ? 'DROP' : 'RISE'} next 30 min: ${s.signs} -> ${Math.round(s.unseen.p * 100)}% on unseen days (normal ${Math.round(base[s.dir] * 100)}%, ${s.unseen.n} cases; ${Math.round(s.train.p * 100)}% in training, ${s.train.n} cases)`;
  const dn = v.filter(s => s.dir === 'down').slice(0, limit), up = v.filter(s => s.dir === 'up').slice(0, limit);
  return [dn.length ? 'Warning signs before drops:\n' + dn.map(line).join('\n') : 'No drop signal held up on unseen days.', up.length ? 'Signs before rises:\n' + up.map(line).join('\n') : 'No rise signal held up on unseen days.'].join('\n\n');
}
export function merge(a, b) {
  const T = newTable(); for (const x of [a, b]) { T.base.n += x.base.n; T.base.up += x.base.up; T.base.down += x.base.down;
    for (const [kn, vals] of Object.entries(x.t)) for (const [v, c] of Object.entries(vals)) { const d = ((T.t[kn] ||= {})[v] ||= { n: 0, up: 0, down: 0 }); d.n += c.n; d.up += c.up; d.down += c.down; } }
  return T;
}

// ================= FORMULA SEARCH (Owner 2026-11-23: "narrow it down - the 30-minute move plus candle pattern plus volume...
// build a formula with a high success probability") =================
// Only moments right after a STRONG 30-minute move (up-strong / down-strong): the next 30 min are ~3x more likely to move big.
// Question: which combination of extra signs says WHICH WAY. Each moment is scored as two real trades from the candle close:
// "continue" (with the move) and "reverse" (against it), stop 0.4 x ATR, otherwise out after 30 min, costs included.
export const SIGNS = ['pattern', 'indecision', 'vol', 'vwap', 'time', 'market', 'sector', 'fear', 'newsRecent', 'mktGap'];
const STOP = 0.4, COST_R = 0.05;   // stop in ATR; fills/slippage per trade in R
function tradeR(cs, k, atr, dir) {   // dir: +1 long, -1 short, entered at the close of candle k
  const e = cs[k].c, risk = STOP * atr;
  for (let j = k + 1; j <= Math.min(k + HORIZON, cs.length - 1); j++) {
    const c = cs[j];
    if (dir > 0 ? c.l <= e - risk : c.h >= e + risk) return -1 - COST_R;   // stop (assumed first when both happen in one candle)
    if (j === k + HORIZON) return dir * (c.c - e) / risk - COST_R;
  }
  return null;
}
// combos of 0..3 extra signs (0 = the strong move alone)
export const COMBOS = (() => { const out = [[]]; for (let a = 0; a < SIGNS.length; a++) { out.push([SIGNS[a]]); for (let b = a + 1; b < SIGNS.length; b++) { out.push([SIGNS[a], SIGNS[b]]); for (let c = b + 1; c < SIGNS.length; c++) out.push([SIGNS[a], SIGNS[b], SIGNS[c]]); } } return out; })();
export const newF = () => ({ n: 0, m: new Map() });
// one stock-day -> add every strong-move moment to the accumulator
export function formulaAdd(F, bars1m, t0, atr, spyBars1m, row) {
  if (!bars1m?.length || !atr) return;
  const cs = RD.to5m(bars1m, t0), spy = spyBars1m ? RD.to5m(spyBars1m, t0) : [];
  let pv = 0, vv = 0, bi = 0;
  for (let k = 6; k < cs.length - HORIZON; k++) {
    const end = cs[k].t + 300e3; while (bi < bars1m.length && bars1m[bi].t < end) { const b = bars1m[bi++]; pv += (b.h + b.l + b.c) / 3 * b.v; vv += b.v; }
    const mv = (cs[k].c - cs[k - 6].c) / atr; if (Math.abs(mv) <= 0.6) continue;   // strong moves only
    const s = spy[k], s6 = spy[k - 6], spyTrend = s && s6 ? (s.c > s6.c * 1.0015 ? 'mkt-up' : s.c < s6.c * 0.9985 ? 'mkt-down' : 'mkt-flat') : null;
    const f = pivotFeatures(cs, k, vv ? pv / vv : cs[k].c, atr, spyTrend, row), up = mv > 0;
    // express market/sector relative to the move so "up" and "down" moves share statistics
    f.market = !spyTrend || spyTrend === 'mkt-flat' ? 'mkt-flat' : (spyTrend === 'mkt-up') === up ? 'mkt-with-move' : 'mkt-against-move';
    f.vwap = (f.vwap.startsWith('above') === up ? 'vwap-with-move' : 'vwap-against-move') + (f.vwap.endsWith('-far') ? '-far' : '');
    const cont = tradeR(cs, k, atr, up ? 1 : -1), rev = tradeR(cs, k, atr, up ? -1 : 1); if (cont == null || rev == null) continue;
    F.n++;
    for (const cb of COMBOS) {
      const key = (up ? '' : '') + (cb.length ? cb.map(x => f[x]).join(' + ') : 'strong move') + '|' + cb.join('+');
      let a = F.m.get(key); if (!a) F.m.set(key, a = { n: 0, cont: 0, rev: 0, cw: 0, rw: 0 });
      a.n++; a.cont += cont; a.rev += rev; if (cont > 0) a.cw++; if (rev > 0) a.rw++;
    }
  }
}
// formulas profitable on TRAIN and again on UNSEEN days (after costs), best first
export function formulas(train, test, { minTrain = 150, minTest = 50, minR = 0.1 } = {}) {
  const out = [];
  for (const [key, a] of train.m) {
    if (a.n < minTrain) continue;
    for (const side of ['cont', 'rev']) {
      const rTr = a[side] / a.n; if (rTr < minR) continue;
      const u = test.m.get(key); if (!u || u.n < minTest) continue; const rTe = u[side] / u.n; if (rTe < minR * 0.5) continue;
      const [signs, keys] = key.split('|');
      out.push({ trade: side === 'cont' ? 'go WITH the strong move' : 'go AGAINST the strong move', signs, keys, train: { n: a.n, avgR: r2(rTr), winPct: Math.round(a[side === 'cont' ? 'cw' : 'rw'] / a.n * 100) },
        unseen: { n: u.n, avgR: r2(rTe), winPct: Math.round(u[side === 'cont' ? 'cw' : 'rw'] / u.n * 100) } });
    }
  }
  return out.sort((x, y) => y.unseen.avgR * Math.sqrt(y.unseen.n) - x.unseen.avgR * Math.sqrt(x.unseen.n));
}
export function formulaBaseline(F) { const a = F.m.get('strong move|'); return a ? { n: a.n, contR: r2(a.cont / a.n), revR: r2(a.rev / a.n), contWin: Math.round(a.cw / a.n * 100), revWin: Math.round(a.rw / a.n * 100) } : null; }
export function formulaText(list, baseTrain, baseTest, tested, limit = 10) {
  const head = `Searched ${tested.toLocaleString('en-US')} formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).\n`
    + (baseTest ? `Strong move alone, unseen days: going with it ${baseTest.contR}R avg (${baseTest.contWin}% wins), against it ${baseTest.revR}R (${baseTest.revWin}% wins), ${baseTest.n} cases.\n` : '');
  if (!list.length) return head + 'No formula was profitable on both the training days and the unseen days.';
  return head + list.slice(0, limit).map((x, i) => `${i + 1}. ${x.trade} when: ${x.signs}\n   unseen: ${x.unseen.avgR}R avg, ${x.unseen.winPct}% wins, ${x.unseen.n} cases | training: ${x.train.avgR}R, ${x.train.winPct}% wins, ${x.train.n} cases`).join('\n');
}
