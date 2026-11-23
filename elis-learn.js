// Elis learning module (Owner's request 2026-11-23): wins AND losses teach Elis what to read, what to expect, and how to trade.
// It never rewrites code and never raises risk per trade. It learns SETTINGS and the WEIGHTS on the information it reads:
//   1. Journal: every morning the top 15 Wave candidates (traded or not) with what Elis read on them
//      (news type, gap, opening relative volume, opening range vs ATR, market direction, side).
//   2. Grade: replay each candidate on real 1-minute bars with the exact Wave rules -> result in R (wins and losses both count).
//   3. Learn (Saturdays, or on request): which information predicted winners -> score weights (shrunk toward neutral),
//      then tune picks / stop / trail / 11:00 keep rule / entry cut-off / minimum RVOL one step at a time.
//   4. Adopt only if the change beats the current version on the most recent 30% of days it did NOT learn from (walk-forward).
//   5. Guard: hard bounds on every setting; live paper results worse than expected after a change -> roll back.
// History starts with a bootstrap: the last ~120 sessions rebuilt from the liquid core list, Alpaca bars and Alpaca news.
import fs from 'node:fs';
import path from 'node:path';
import * as E from './elis.js';
import * as RD from './elis-read.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(path.dirname(new URL(import.meta.url).pathname), 'data'), 'elis');
const F = { journal: path.join(DIR, 'journal.jsonl'), params: path.join(DIR, 'params.json'), report: path.join(DIR, 'learn-report.json') };
try { fs.mkdirSync(DIR, { recursive: true }); } catch {}

// ---------- what Elis reads: feature buckets ----------
export const CATS = [['fda', /\b(fda|approv|clearance|phase|trial|drug|biotech)/i], ['earnings', /\b(earnings|eps|revenue|quarter|q[1-4]\b|guidance|outlook|beats?|miss(es)?)/i],
  ['analyst', /\b(upgrade|downgrade|price target|initiat|rating|overweight|underweight|outperform)/i], ['deal', /\b(acqui|merger|buyout|takeover|deal|stake)/i],
  ['contract', /\b(contract|award|partnership|agreement|order|launch|patent)/i], ['legal', /\b(lawsuit|sec |investigat|settle|probe|recall)/i]];
export const catOf = (headline, hasNews) => { if (!hasNews) return 'none'; for (const [k, re] of CATS) if (re.test(headline || '')) return k; return 'other'; };
export function features(c) {
  const g = Math.abs(c.gapPct || 0), r = c.rvol || 0, ora = c.atr ? (c.orHigh - c.orLow) / c.atr : 0;
  return {
    cat: c.cat || 'none',
    gap: g < 1 ? 'gap<1%' : g < 3 ? 'gap1-3%' : g < 8 ? 'gap3-8%' : 'gap8%+',
    gapDir: !c.gapPct ? 'flat' : (c.gapPct > 0) === (c.dir === 'long') ? 'with-gap' : 'against-gap',
    rvol: r < 2 ? 'rvol1-2' : r < 4 ? 'rvol2-4' : r < 8 ? 'rvol4-8' : 'rvol8+',
    orAtr: ora < 0.15 ? 'tight-range' : ora < 0.35 ? 'normal-range' : 'wide-range',
    market: !c.spyDir ? 'mkt-flat' : c.spyDir === c.dir ? 'with-market' : 'against-market',
    side: c.dir,
    newsTone: c.tone || (c.news ? 'news-neutral' : 'none'),
    comboNewsMarket: `${c.tone || (c.news ? 'news-neutral' : 'none')}+${!c.spyDir ? 'mkt-flat' : c.spyDir === c.dir ? 'with-market' : 'against-market'}`
  };
}
export const FEATURE_NAMES = ['cat', 'gap', 'gapDir', 'rvol', 'orAtr', 'market', 'side', 'newsTone', 'comboNewsMarket'];

// ---------- settings: defaults, bounds, steps (risk per trade is NOT here on purpose) ----------
export const DEFAULTS = { picks: 3, stopAtr: 0.10, trailR: 1, keepMinR: 1, entryEnd: 660, minRvol: 1, entryGate: 0, newsExit: true, marketExit: 0, mult: {}, emult: {} };
const GRID = { picks: [1, 2, 3, 4, 5], stopAtr: [0.05, 0.075, 0.10, 0.15, 0.20], trailR: [0.5, 0.75, 1, 1.5, 2], keepMinR: [0.5, 1, 1.5, 2], entryEnd: [600, 630, 660, 690], minRvol: [1, 1.5, 2, 3],
  entryGate: [0, 0.85, 0.95, 1.05], newsExit: [false, true], marketExit: [0, 0.3, 0.5, 0.8] };
const MULT_MIN = 0.5, MULT_MAX = 1.6, SHRINK = 25;

let P = load(F.params, { version: 0, params: { ...DEFAULTS }, history: [], adoptedAt: null, baselineAvgR: null });
function load(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }
function save(f, v) { try { fs.writeFileSync(f + '.tmp', JSON.stringify(v, null, 1)); fs.renameSync(f + '.tmp', f); } catch (e) { E.noteOut('learn save failed ' + e.message); } }
export const params = () => (process.env.ELIS_LEARN === '0' ? { ...DEFAULTS } : { ...DEFAULTS, ...P.params });
export const version = () => P.version;

// ---------- journal ----------
export function journal(date, cands, spyDir) {
  const lines = cands.slice(0, 15).map(c => JSON.stringify(row(date, c, spyDir))).join('\n');
  if (lines) try { fs.appendFileSync(F.journal, lines + '\n'); } catch (e) { E.noteOut('journal write failed ' + e.message); }
}
export const row = (date, c, spyDir) => ({ date, sym: c.sym, dir: c.dir, rvol: c.rvol, gapPct: c.gapPct, atr: c.atr, orHigh: c.orHigh, orLow: c.orLow, open: c.open, cat: c.cat, news: !!c.headline, tone: c.tone, spyDir, traded: !!c.traded, intraday: c.intraday || [], post: c.post || null, v: P.version });
export function journalUpdate(rows) {   // end of day: same rows again with mid-day news + post-mortem (last write wins)
  if (rows.length) try { fs.appendFileSync(F.journal, rows.map(r => JSON.stringify(r)).join('\n') + '\n'); } catch {}
}
export function readJournal() {
  let rows = []; try { rows = fs.readFileSync(F.journal, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)); } catch {}
  const seen = new Map(); for (const r of rows) seen.set(r.date + ':' + r.sym, r);   // last write wins
  return [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- replay one candidate with the Wave rules (pure; mirrors elis-wave.js live logic) ----------
export function simulate(bars, c, p, out = {}, spy = null) {
  const long = c.dir === 'long', lvl = long ? c.orHigh : c.orLow, slip = 0.01, t0 = E.etMs(c.date, 570), startT = E.etMs(c.date, 575), entryEndT = E.etMs(c.date, p.entryEnd), decideT = E.etMs(c.date, 660), flatT = E.etMs(c.date, 955);
  const news = (c.intraday || []).map(e => ({ t: t0 + e.m * 60e3, adverse: RD.adverse(e.tone, c.dir), h: e.headline })).filter(e => e.adverse).sort((a, b) => a.t - b.t);
  const spyAt = spy ? new Map(spy.map(b => [b.t, b.c])) : null;
  let entry = null, entryT, spy0, stop, r, best, decided = false, runner = false, pv = 0, vv = 0;
  const done = (R, why) => { out.R = R; out.why = why; return R; };
  for (let i = 0; i < bars.length; i++) {
    const b = bars[i]; pv += (b.h + b.l + b.c) / 3 * b.v; vv += b.v; const vwap = vv ? pv / vv : b.c;
    if (b.t < startT) continue;
    if (entry === null) {
      if (b.t >= entryEndT) return null;
      if (long ? b.h > lvl : b.l < lvl) {
        const rd = RD.read(bars.slice(0, i), c.dir, t0, c.atr); out.ef = rd.feat; out.read = rd.text;   // what the chart said at the breakout
        let m = 1; for (const k of RD.ENTRY_FEATURES) m *= p.emult?.[k]?.[rd.feat[k]] ?? 1;
        if (p.entryGate > 0 && m < p.entryGate) { out.skipped = true; return null; }
        entry = (long ? Math.max(lvl, b.o) : Math.min(lvl, b.o)) + (long ? slip : -slip); entryT = b.t; spy0 = spyAt?.get(b.t); r = Math.max(0.02, c.atr * p.stopAtr); stop = long ? entry - r : entry + r; best = entry;
        if (long ? b.l <= stop : b.h >= stop) return done(-1 - 2 * slip / r, 'stopped on the entry candle');
      }
      continue;
    }
    const gain = px => (long ? px - entry : entry - px) / r - slip / r;
    if (b.t >= flatT) return done(gain(b.o), 'closed 15:55');
    if (long ? b.l <= stop : b.h >= stop) return done(gain(long ? Math.min(stop, b.o) : Math.max(stop, b.o)), stop === entry - (long ? r : -r) ? 'stop' : 'trailing stop');   // a gap through the stop fills at the gap
    const ev = news.find(e => e.t > entryT && e.t <= b.t);
    if (ev) { out.adverseNews = ev.h; if (p.newsExit) return done(gain(b.c), 'bad news: ' + ev.h); }
    if (p.marketExit > 0 && spy0 && spyAt?.get(b.t)) { const mv = (spyAt.get(b.t) / spy0 - 1) * 100 * (long ? 1 : -1); if (mv <= -p.marketExit) return done(gain(b.c), `market turned (SPY ${mv.toFixed(2)}%)`); }
    best = long ? Math.max(best, b.h) : Math.min(best, b.l);
    if ((long ? best - entry : entry - best) / r >= p.trailR) { const ns = long ? Math.max(entry, best - p.trailR * r) : Math.min(entry, best + p.trailR * r); stop = long ? Math.max(stop, ns) : Math.min(stop, ns); }
    if (!decided && b.t + 60e3 >= decideT) {
      decided = true;
      const gainR = (long ? b.c - entry : entry - b.c) / r, ago = bars[Math.max(0, i - 30)].c, mom = long ? b.c > ago : b.c < ago, side = long ? b.c > vwap : b.c < vwap;
      if (gainR >= p.keepMinR && side && mom) runner = true; else return done(gainR - slip / r, '11:00 exit');
    } else if (runner && (long ? b.c < vwap : b.c > vwap)) return done(gain(b.c), 'closed through VWAP');
  }
  return entry === null ? null : done((long ? bars.at(-1).c - entry : entry - bars.at(-1).c) / r, 'data end');
}

// ---------- evaluate a settings set over days ----------
const score = (c, p) => { const f = features(c); let s = c.rvol; for (const k of FEATURE_NAMES) s *= p.mult?.[k]?.[f[k]] ?? 1; return s; };
export function evaluate(byDay, barsOf, p) {
  let n = 0, sum = 0, wins = 0, winR = 0, lossR = 0; const trades = [];
  for (const [date, cands] of byDay) {
    const pick = cands.filter(c => c.rvol >= p.minRvol).sort((a, b) => score(b, p) - score(a, p)).slice(0, p.picks);
    for (const c of pick) { const b = barsOf(date, c.sym); if (!b) continue; const R = simulate(b, c, p, {}, barsOf(date, 'SPY')); if (R === null) continue; n++; sum += R; if (R > 0) { wins++; winR += R; } else lossR -= R; trades.push({ date, sym: c.sym, R }); }
  }
  return { trades: n, totalR: sum, avgR: n ? sum / n : 0, winRate: n ? wins / n : 0, avgWinR: wins ? winR / wins : 0, avgLossR: n - wins ? lossR / (n - wins) : 0, list: trades };
}

// ---------- learn which information predicts winners (shrunk bucket expectancy) ----------
export function learnWeights(byDay, barsOf, p) {
  const acc = {}, eacc = {}, why = {}, pOpen = { ...p, entryGate: 0 };
  const bump = (A, k, v, R) => { const a = ((A[k] ||= {})[v] ||= { n: 0, sum: 0, wins: 0 }); a.n++; a.sum += R; if (R > 0) a.wins++; };
  for (const [date, cands] of byDay) for (const c of cands) {
    if (c.rvol < p.minRvol) continue; const b = barsOf(date, c.sym); if (!b) continue;
    const o = {}, R = simulate(b, c, pOpen, o, barsOf(date, 'SPY')); if (R === null) continue;
    const f = features(c); for (const k of FEATURE_NAMES) bump(acc, k, f[k], R);
    if (o.ef) for (const k of RD.ENTRY_FEATURES) bump(eacc, k, o.ef[k], R);
    bump(why, 'exit', String(o.why || '').replace(/:.*/, ''), R);
    if (o.adverseNews) bump(why, 'midTradeNews', 'bad news hit during trade', R);
  }
  const toMult = A => { const mult = {}, table = {};
    for (const [k, buckets] of Object.entries(A)) {
      const all = Object.values(buckets).reduce((x, y) => ({ n: x.n + y.n, sum: x.sum + y.sum }), { n: 0, sum: 0 }), base = all.n ? all.sum / all.n : 0;
      for (const [v, a] of Object.entries(buckets)) {
        const edge = (a.sum - base * a.n) / (a.n + SHRINK);   // better/worse than average, shrunk toward 0 on small samples
        (mult[k] ||= {})[v] = Math.round(Math.min(MULT_MAX, Math.max(MULT_MIN, Math.exp(edge))) * 100) / 100;
        (table[k] ||= {})[v] = { trades: a.n, avgR: Math.round(a.sum / a.n * 100) / 100, winRate: Math.round(a.wins / a.n * 100), weight: mult[k][v] };
      }
    }
    return { mult, table }; };
  const a = toMult(acc), e = toMult(eacc), w = toMult(why);
  return { mult: a.mult, emult: e.mult, table: { ...a.table, ...Object.fromEntries(Object.entries(e.table).map(([k, v]) => ['chart:' + k, v])), ...Object.fromEntries(Object.entries(w.table).map(([k, v]) => ['outcome:' + k, v])) } };
}

// ---------- data: bars per candidate-day (1-min, 09:30-16:00), cached on disk ----------
const BAR_DIR = path.join(DIR, 'bars'); try { fs.mkdirSync(BAR_DIR, { recursive: true }); } catch {}
const pause = ms => new Promise(r => setTimeout(r, ms));
async function barsForDay(date, syms) {
  const f = path.join(BAR_DIR, date + '.json'), have = load(f, {}), need = syms.filter(s => !have[s]);
  if (need.length) {
    for (let i = 0; i < need.length; i += 50) {
      let token = '';
      do {
        const qs = new URLSearchParams({ symbols: need.slice(i, i + 50).join(','), timeframe: '1Min', start: new Date(E.etMs(date, 570)).toISOString(), end: new Date(E.etMs(date, 960)).toISOString(), feed: 'sip', limit: '10000', adjustment: 'split' });
        if (token) qs.set('page_token', token);
        const j = await E.api(E.DATA, `/v2/stocks/bars?${qs}`); await pause(350);
        for (const [s, arr] of Object.entries(j.bars || {})) (have[s] ||= []).push(...arr.map(b => [Math.round((Date.parse(b.t) - E.etMs(date, 570)) / 60e3), b.o, b.h, b.l, b.c, b.v]));
        token = j.next_page_token || '';
      } while (token);
    }
    for (const s of need) have[s] ||= [];
    save(f, have);
  }
  return have;
}
const expand = (date, arr) => arr && arr.length ? arr.map(([m, o, h, l, c, v]) => ({ t: E.etMs(date, 570) + m * 60e3, o, h, l, c, v })) : null;

// ---------- bootstrap: rebuild ~120 past sessions of candidates from the liquid core (no historical screener exists) ----------
export async function bootstrap(core, days = 120) {
  const cal = await E.api(E.BASE, `/v2/calendar?start=${new Date(Date.now() - (days * 1.6 + 40) * 86400e3).toISOString().slice(0, 10)}&end=${new Date(Date.now() - 86400e3).toISOString().slice(0, 10)}`);
  const sessions = cal.map(c => c.date).filter(d => d < E.et().date), use = sessions.slice(-days), all = sessions.slice(-(days + 15));
  const syms = [...core, 'SPY'], daily = {};
  for (let i = 0; i < syms.length; i += 100) {
    let token = '';
    do {
      const qs = new URLSearchParams({ symbols: syms.slice(i, i + 100).join(','), timeframe: '1Day', start: all[0], end: use.at(-1), feed: 'sip', limit: '10000', adjustment: 'split' }); if (token) qs.set('page_token', token);
      const j = await E.api(E.DATA, `/v2/stocks/bars?${qs}`); await pause(350);
      for (const [s, arr] of Object.entries(j.bars || {})) (daily[s] ||= []).push(...arr.map(b => ({ d: b.t.slice(0, 10), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })));
      token = j.next_page_token || '';
    } while (token);
  }
  const first = {};   // first 5-min bar per day per symbol (IEX, same feed as live RVOL)
  for (const d of all) {
    for (let i = 0; i < syms.length; i += 100) {
      const qs = new URLSearchParams({ symbols: syms.slice(i, i + 100).join(','), timeframe: '5Min', start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 575)).toISOString(), feed: 'iex', limit: '10000' });
      const j = await E.api(E.DATA, `/v2/stocks/bars?${qs}`); await pause(350);
      for (const [s, arr] of Object.entries(j.bars || {})) if (arr[0]) (first[s] ||= {})[d] = arr[0];
    }
  }
  const rows = [];
  for (const d of use) {
    const idx = all.indexOf(d), prior = all.slice(Math.max(0, idx - 14), idx), spyB = first.SPY?.[d], spyDir = spyB ? (spyB.c > spyB.o ? 'long' : spyB.c < spyB.o ? 'short' : null) : null, cands = [];
    for (const s of core) {
      const dd = (daily[s] || []).filter(x => x.d < d).slice(-15), fb = first[s]?.[d]; if (dd.length < 15 || !fb) continue;
      const last14 = dd.slice(-14), avgVol = last14.reduce((a, b) => a + b.v, 0) / 14, prevClose = dd.at(-1).c;
      const tr = dd.slice(1).map((b, i) => Math.max(b.h - b.l, Math.abs(b.h - dd[i].c), Math.abs(b.l - dd[i].c))), atr = tr.reduce((a, b) => a + b, 0) / tr.length;
      if (prevClose < 5 || avgVol < 1e6 || atr <= 0.5) continue;
      const ov = prior.map(p => first[s]?.[p]?.v).filter(Boolean); if (ov.length < 10) continue;
      const rvol = fb.v / (ov.reduce((a, b) => a + b, 0) / ov.length), dir = fb.c > fb.o ? 'long' : fb.c < fb.o ? 'short' : null;
      if (!dir || rvol < 1) continue;
      cands.push({ date: d, sym: s, dir, rvol: Math.round(rvol * 100) / 100, gapPct: Math.round((fb.o / prevClose - 1) * 1000) / 10, atr, orHigh: fb.h, orLow: fb.l, open: fb.o, spyDir, cat: 'none', news: false, boot: true });
    }
    cands.sort((a, b) => b.rvol - a.rvol); const top = cands.slice(0, 15);
    if (top.length) {   // news in the 18 h before the open, for the top candidates
      try {
        const j = await E.api(E.DATA, `/v1beta1/news?${new URLSearchParams({ symbols: top.map(c => c.sym).join(','), start: new Date(E.etMs(d, 570) - 18 * 3600e3).toISOString(), end: new Date(E.etMs(d, 570)).toISOString(), limit: '50' })}`); await pause(350);
        for (const c of top) { const n = (j.news || []).filter(x => (x.symbols || []).includes(c.sym)); if (n.length) { c.news = true; c.cat = catOf(n.map(x => x.headline).join(' '), true); c.tone = RD.toneOf(n.map(x => x.headline)); } }
        const k = await E.api(E.DATA, `/v1beta1/news?${new URLSearchParams({ symbols: top.map(c => c.sym).join(','), start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 960)).toISOString(), limit: '50', sort: 'asc' })}`); await pause(350);
        for (const x of k.news || []) for (const c of top) if ((x.symbols || []).includes(c.sym)) (c.intraday ||= []).push({ m: Math.round((Date.parse(x.created_at) - E.etMs(d, 570)) / 60e3), tone: RD.tone(x.headline), headline: String(x.headline).slice(0, 140) });
      } catch {}
    }
    rows.push(...top);
  }
  fs.appendFileSync(F.journal, rows.map(r => JSON.stringify(r)).join('\n') + (rows.length ? '\n' : ''));
  return { sessions: use.length, candidates: rows.length };
}

// ---------- the weekly learning run ----------
let running = false;
export async function learn({ force = false } = {}) {
  if (running) return { busy: true };
  running = true;
  try {
    const J = readJournal(), byDayAll = new Map();
    for (const r of J) (byDayAll.get(r.date) || byDayAll.set(r.date, []).get(r.date)).push(r);
    const days = [...byDayAll.keys()].sort();
    if (days.length < 30) return { skipped: `only ${days.length} sessions in the journal; need 30` };
    const bars = {};
    for (const d of days) { bars[d] = await barsForDay(d, [...byDayAll.get(d).map(c => c.sym), 'SPY']); }
    const memo = new Map(), barsOf = (d, s) => { const k = d + s; if (!memo.has(k)) memo.set(k, expand(d, bars[d]?.[s])); return memo.get(k); };
    const cut = Math.floor(days.length * 0.7), trainDays = new Map(days.slice(0, cut).map(d => [d, byDayAll.get(d)])), testDays = new Map(days.slice(cut).map(d => [d, byDayAll.get(d)]));
    const cur = params(), curTest = evaluate(testDays, barsOf, cur);
    // 1) weights from TRAIN data, 2) settings one step at a time on TRAIN data
    const lw0 = learnWeights(trainDays, barsOf, cur); let cand = { ...cur, mult: lw0.mult, emult: lw0.emult };
    for (let pass = 0; pass < 2; pass++) for (const [k, vals] of Object.entries(GRID)) {
      const i = vals.indexOf(cand[k]), opts = [vals[i - 1], cand[k], vals[i + 1]].filter(v => v !== undefined);
      let bestV = cand[k], bestR = -Infinity;
      for (const v of opts) { const e = evaluate(trainDays, barsOf, { ...cand, [k]: v }); const sc = e.trades >= 20 ? e.totalR : -Infinity; if (sc > bestR + 1e-9) { bestR = sc; bestV = v; } await pause(0); }
      cand[k] = bestV;
    }
    const newTest = evaluate(testDays, barsOf, cand), allW = learnWeights(new Map(days.map(d => [d, byDayAll.get(d)])), barsOf, cur);
    const better = newTest.trades >= 15 && newTest.totalR > curTest.totalR + Math.max(1, Math.abs(curTest.totalR) * 0.1) && newTest.avgR > curTest.avgR;
    const changes = Object.keys(GRID).filter(k => cand[k] !== cur[k]).map(k => `${k} ${cur[k]} -> ${cand[k]}`);
    const report = { at: new Date().toISOString(), sessions: days.length, trainSessions: cut, testSessions: days.length - cut,
      current: sum(curTest), learned: sum(newTest), adopted: !!better, changes, whatPredictsWins: allW.table, version: P.version + (better ? 1 : 0) };
    if (better) {
      P.history.unshift({ version: P.version, params: P.params, at: P.adoptedAt }); P.history = P.history.slice(0, 10);
      P = { ...P, version: P.version + 1, params: cand, adoptedAt: new Date().toISOString(), baselineAvgR: newTest.avgR, liveRs: [] };
      save(F.params, P);
    }
    save(F.report, report);
    return report;
  } finally { running = false; }
}
const sum = e => ({ trades: e.trades, totalR: Math.round(e.totalR * 10) / 10, avgR: Math.round(e.avgR * 100) / 100, winRatePct: Math.round(e.winRate * 100), avgWinR: Math.round(e.avgWinR * 100) / 100, avgLossR: Math.round(e.avgLossR * 100) / 100 });

// ---------- live guard: roll back a change that does worse in live paper trading ----------
export function liveCheck(liveRs) {   // R results of live Wave trades since the last adoption
  if (!P.adoptedAt || !P.history.length || liveRs.length < 15) return null;
  const avg = liveRs.reduce((a, b) => a + b, 0) / liveRs.length;
  if (avg < 0 && avg < (P.baselineAvgR ?? 0) - 0.3) {
    const prev = P.history.shift(); P = { ...P, version: P.version + 1, params: prev.params, adoptedAt: new Date().toISOString(), baselineAvgR: null, rolledBack: true };
    P.liveRs = []; save(F.params, P); return `Rolled back to the previous settings: live average ${avg.toFixed(2)}R over ${liveRs.length} trades was below what testing promised.`;
  }
  return null;
}

export function recordLive(R) {   // a finished live Wave trade, in R
  if (!Number.isFinite(R)) return null;
  (P.liveRs ||= []).push(Math.round(R * 100) / 100); save(F.params, P);
  return liveCheck(P.liveRs);
}
export function summaryLine(rep) {   // phone push text for a learning run
  if (!rep || rep.skipped) return rep?.skipped || 'no report';
  const best = [], worst = [];
  for (const [k, b] of Object.entries(rep.whatPredictsWins || {})) if (!k.startsWith('outcome:')) for (const [v, x] of Object.entries(b)) if (x.trades >= 10) (x.weight >= 1.1 ? best : x.weight <= 0.9 ? worst : []).push(`${v} ${x.avgR >= 0 ? '+' : ''}${x.avgR}R`);
  const c = rep.current, l = rep.learned;
  return `${rep.adopted ? `ADOPTED v${rep.version}` : 'Kept current settings'} (${rep.sessions} sessions, tested on the last ${rep.testSessions} it did not learn from).\n`
    + `Unseen days: win rate ${c.winRatePct}% -> ${l.winRatePct}%, avg ${c.avgR}R -> ${l.avgR}R, avg win ${c.avgWinR}R -> ${l.avgWinR}R.\n`
    + (rep.changes.length ? `Changes: ${rep.changes.join(', ')}.\n` : '')
    + (best.length ? `Best info: ${best.slice(0, 4).join(', ')}.\n` : '') + (worst.length ? `Weakest: ${worst.slice(0, 4).join(', ')}.` : '');
}
export function status() {
  const rep = load(F.report, null), J = readJournal();
  return { version: P.version, adoptedAt: P.adoptedAt, settings: params(), journalSessions: new Set(J.map(r => r.date)).size, journalCandidates: J.length, lastReport: rep };
}
