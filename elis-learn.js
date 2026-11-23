// Elis learning module (Owner's request 2026-11-23): wins AND losses teach Elis what to read, what to expect, and how to trade.
// It never rewrites code and never raises risk per trade. It learns SETTINGS and the WEIGHTS on the information it reads:
//   1. Journal: every morning the top 15 Wave candidates (traded or not) with what Elis read on them
//      (news type, gap, opening relative volume, opening range vs ATR, market direction, side).
//   2. Grade: replay each candidate on real 1-minute bars with the exact Wave rules -> result in R (wins and losses both count).
//   3. Learn (Saturdays, or on request): which information predicted winners -> score weights (shrunk toward neutral),
//      then tune picks / stop / trail / 11:00 keep rule / entry cut-off / minimum RVOL one step at a time.
//   4. Adopt only if the change beats the current version on the most recent 30% of days it did NOT learn from (walk-forward).
//   5. Guard: hard bounds on every setting; live paper results worse than expected after a change -> roll back.
// History: history() replays every session since 2024 across the whole market as if live (see below).
import fs from 'node:fs';
import zlib from 'node:zlib';
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
export const DEFAULTS = { picks: 3, stopAtr: 0.10, trailR: 1, keepMinR: 1, entryEnd: 660, minRvol: 1, entryGate: 0, newsExit: true, marketExit: 0, newsDelay: 1, mult: {}, emult: {}, skip: [] };
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
  const hasHist = rows.some(r => r.hist);
  const seen = new Map(); for (const r of rows) if (!(hasHist && r.boot)) seen.set(r.date + ':' + r.sym, r);   // last write wins; the old core-only bootstrap is replaced by the full history
  return [...seen.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---------- replay one candidate with the Wave rules (pure; mirrors elis-wave.js live logic) ----------
export function simulate(bars, c, p, out = {}, spy = null) {
  const long = c.dir === 'long', lvl = long ? c.orHigh : c.orLow, slip = 0.01, t0 = E.etMs(c.date, 570), startT = E.etMs(c.date, 575), entryEndT = E.etMs(c.date, p.entryEnd), decideT = E.etMs(c.date, 660), flatT = E.etMs(c.date, 955);
  const news = (c.intraday || []).map(e => ({ t: t0 + (e.m + (p.newsDelay ?? 1)) * 60e3, adverse: RD.adverse(e.tone, c.dir), h: e.headline })).filter(e => e.adverse).sort((a, b) => a.t - b.t);   // newsDelay: minutes until Elis sees it (1 = polling once a minute)
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
        if (p.skip?.some(r => r.chart && rd.feat[r.k] === r.v)) { out.skipped = true; return null; }   // adopted proposal: never take this chart read
        entry = (long ? Math.max(lvl, b.o) : Math.min(lvl, b.o)) + (long ? slip : -slip); entryT = b.t; spy0 = spyAt?.get(b.t); r = Math.max(0.02, c.atr * p.stopAtr); stop = long ? entry - r : entry + r; best = entry;
        if (long ? b.l <= stop : b.h >= stop) return done(-1 - 2 * slip / r, 'stopped on the entry candle');
      }
      continue;
    }
    const gain = px => (long ? px - entry : entry - px) / r - slip / r;
    if (b.t >= flatT) return done(gain(b.o), 'closed 15:55');
    const ev = news.find(e => e.t > entryT && e.t <= b.t); if (ev) out.adverseNews = ev.h;
    if (long ? b.l <= stop : b.h >= stop) return done(gain(long ? Math.min(stop, b.o) : Math.max(stop, b.o)), stop === entry - (long ? r : -r) ? 'stop' : 'trailing stop');   // a gap through the stop fills at the gap
    if (ev && p.newsExit) return done(gain(b.c), 'bad news: ' + ev.h);
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
    const pick = cands.filter(c => c.rvol >= p.minRvol && !(p.skip || []).some(r => !r.chart && features(c)[r.k] === r.v)).sort((a, b) => score(b, p) - score(a, p)).slice(0, p.picks);
    for (const c of pick) { const b = barsOf(date, c.sym); if (!b) continue; const R = simulate(b, c, p, {}, barsOf(date, 'SPY')); if (R === null) continue; n++; sum += R; if (R > 0) { wins++; winR += R; } else lossR -= R; trades.push({ date, sym: c.sym, R }); }
  }
  return { trades: n, totalR: sum, avgR: n ? sum / n : 0, winRate: n ? wins / n : 0, avgWinR: wins ? winR / wins : 0, avgLossR: n - wins ? lossR / (n - wins) : 0, list: trades };
}

// ---------- learn which information predicts winners (shrunk bucket expectancy) ----------
export const newAcc = () => ({ acc: {}, eacc: {}, why: {} });
export function learnWeights(byDay, barsOf, p, A = null) {
  const own = !A; A ||= newAcc(); const { acc, eacc, why } = A, pOpen = { ...p, entryGate: 0 };
  const bump = (A, k, v, R) => { const a = ((A[k] ||= {})[v] ||= { n: 0, sum: 0, wins: 0 }); a.n++; a.sum += R; if (R > 0) a.wins++; };
  for (const [date, cands] of byDay) for (const c of cands) {
    if (c.rvol < p.minRvol) continue; const b = barsOf(date, c.sym); if (!b) continue;
    const o = {}, R = simulate(b, c, pOpen, o, barsOf(date, 'SPY')); if (R === null) continue;
    const f = features(c); for (const k of FEATURE_NAMES) bump(acc, k, f[k], R);
    if (o.ef) for (const k of RD.ENTRY_FEATURES) bump(eacc, k, o.ef[k], R);
    bump(why, 'exit', String(o.why || '').replace(/:.*/, ''), R);
    if (o.adverseNews) bump(why, 'midTradeNews', 'bad news hit during trade', R);
  }
  return own ? finishWeights(A) : A;
}
export function finishWeights({ acc, eacc, why }) {
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
// Alpaca call with retries: rate limits (429), server errors and network blips back off instead of stopping the study
async function A(base, p) {
  for (let i = 0; ; i++) {
    try { return await E.api(base, p, {}, true); }   // bulk lane: paced behind live trading calls
    catch (e) { if (i >= 6 || (e.status && e.status !== 429 && e.status < 500)) throw e; await pause(Math.min(60e3, 2000 * 2 ** i)); }
  }
}
// bars on disk: gzip JSON, prices in cents (the Railway volume is only 500 MB)
const barFile = d => path.join(BAR_DIR, d + '.json.gz');
export function readBars(date) {
  try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(barFile(date))).toString()); } catch {}
  const legacy = load(path.join(BAR_DIR, date + '.json'), null);   // older uncompressed files (prices in dollars)
  if (legacy) for (const s of Object.keys(legacy)) legacy[s] = legacy[s].map(([m, o, h, l, c, v]) => [m, Math.round(o * 100), Math.round(h * 100), Math.round(l * 100), Math.round(c * 100), v]);
  return legacy || {};
}
const hasBars = d => fs.existsSync(barFile(d)) || fs.existsSync(path.join(BAR_DIR, d + '.json'));
export function freeMB() { try { const st = fs.statfsSync(DIR); return st.bavail * st.bsize / 1e6; } catch { return Infinity; } }
async function barsForDay(date, syms) {
  const have = readBars(date), need = syms.filter(s => !have[s]);
  if (need.length) {
    for (let i = 0; i < need.length; i += 50) {
      let token = '';
      do {
        const qs = new URLSearchParams({ symbols: need.slice(i, i + 50).join(','), timeframe: '1Min', start: new Date(E.etMs(date, 570)).toISOString(), end: new Date(E.etMs(date, 960)).toISOString(), feed: 'sip', limit: '10000', adjustment: 'split' });
        if (token) qs.set('page_token', token);
        const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); await pause(350);
        for (const [s, arr] of Object.entries(j.bars || {})) (have[s] ||= []).push(...arr.map(b => [Math.round((Date.parse(b.t) - E.etMs(date, 570)) / 60e3), Math.round(b.o * 100), Math.round(b.h * 100), Math.round(b.l * 100), Math.round(b.c * 100), Math.round(b.v)]));
        token = j.next_page_token || '';
      } while (token);
    }
    for (const s of need) have[s] ||= [];
    try { fs.writeFileSync(barFile(date) + '.tmp', zlib.gzipSync(JSON.stringify(have), { level: 9 })); fs.renameSync(barFile(date) + '.tmp', barFile(date)); try { fs.unlinkSync(path.join(BAR_DIR, date + '.json')); } catch {} }
    catch (e) { E.noteOut('bar save failed ' + e.message); }
  }
  return have;
}
const expand = (date, arr) => arr && arr.length ? arr.map(([m, o, h, l, c, v]) => ({ t: E.etMs(date, 570) + m * 60e3, o: o / 100, h: h / 100, l: l / 100, c: c / 100, v })) : null;

// ---------- HISTORY: replay every session since FROM as if live (whole market, no look-ahead) ----------
// Each session: only data knowable at 09:35 picks the candidates (prior daily bars, the 09:30 5-min bar, pre-open news);
// then the top 20 by opening relative volume are graded on real 1-min bars with mid-day news. Resumable; outside market hours.
// Survivorship: inactive (delisted) symbols are included. Data: Alpaca SIP history (free plan allows SIP older than 15 min) + Alpaca/Benzinga news.
const HF = path.join(DIR, 'history-state.json'), PER_DAY = Number(process.env.ELIS_HISTORY_PER_DAY || 15);   // 15/day keeps the bar files ~38 MB on the 500 MB volume
export const HS = { phase: 'idle', startedAt: null, rate: null };   // live progress for the report page
export const historyState = () => load(HF, { done: [], finished: false, from: null });
export async function history({ from = '2024-01-02', progress = null, shouldStop = () => false, gap = 0 } = {}) {
  const runStart = Date.now(), done0 = (historyState().done || []).length; HS.phase = 'starting'; HS.startedAt = runStart;
  // free space first: uncompressed bar files from the first (core-only) study are ~5x larger than needed
  try { let freed = 0; for (const f of fs.readdirSync(BAR_DIR)) if (f.endsWith('.json')) { const fp = path.join(BAR_DIR, f); freed += fs.statSync(fp).size; fs.unlinkSync(fp); } if (freed) progress?.(`freed ${Math.round(freed / 1e6)} MB of old uncompressed bars`); } catch {}
  HS.diskFreeMB = Math.round(freeMB());
  const st = historyState(); if (st.finished && st.from === from) return { finished: true, sessions: st.done.length };
  st.from = from; st.done ||= []; st.win ||= {};
  const today = E.et().date, warm = new Date(Date.parse(from) - 45 * 86400e3).toISOString().slice(0, 10);
  const cal = (await A(E.BASE, `/v2/calendar?start=${warm}&end=${today}`)).map(c => c.date).filter(d => d < today);
  const sessions = cal.filter(d => d >= from), di = new Map(cal.map((d, i) => [d, i])), N = cal.length;
  // 1) universe: every US common-stock-like symbol, active and delisted
  const assets = [];
  for (const status of ['active', 'inactive']) { try { assets.push(...(await A(E.BASE, `/v2/assets?status=${status}&asset_class=us_equity`))); } catch {} await pause(gap); }
  const syms = [...new Set(assets.filter(a => /^[A-Z]{1,5}$/.test(a.symbol) && ['NASDAQ', 'NYSE', 'ARCA', 'AMEX', 'BATS'].includes(a.exchange)).map(a => a.symbol))];
  progress?.(`history: ${syms.length} symbols, ${sessions.length} sessions since ${from} (${st.done.length} already done)`); HS.phase = `daily bars for ${syms.length} symbols`; HS.total = sessions.length;
  // 2) daily bars for all of them, kept only for symbols that are ever liquid enough (typed arrays by session index)
  const D = new Map();
  for (let i = 0; i < syms.length; i += 100) {
    if (shouldStop()) { save(HF, st); return { paused: true, sessions: st.done.length }; }
    const part = syms.slice(i, i + 100), raw = {}; let token = '';
    do {
      const qs = new URLSearchParams({ symbols: part.join(','), timeframe: '1Day', start: warm, end: cal.at(-1), feed: 'sip', limit: '10000', adjustment: 'split' }); if (token) qs.set('page_token', token);
      const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); await pause(gap);
      for (const [s, arr] of Object.entries(j.bars || {})) (raw[s] ||= []).push(...arr); token = j.next_page_token || '';
    } while (token);
    for (const [s, arr] of Object.entries(raw)) {
      if (arr.filter(b => b.v >= 1e6).length < 10 || Math.max(...arr.map(b => b.c)) < 5) continue;
      const o = new Float32Array(N).fill(NaN), h = o.slice(), l = o.slice(), c = o.slice(), v = o.slice();
      for (const b of arr) { const k = di.get(b.t.slice(0, 10)); if (k === undefined) continue; o[k] = b.o; h[k] = b.h; l[k] = b.l; c[k] = b.c; v[k] = b.v; }
      D.set(s, { o, h, l, c, v });
    }
  }
  progress?.(`history: ${D.size} symbols were liquid at some point; replaying sessions`); HS.phase = 'replaying sessions';
  // 3) sessions in order (the 14-session opening-volume window needs order)
  const done = new Set(st.done); let n = 0;
  for (const d of cal) {
    if (d < warm || (done.has(d) && d >= from) || (d < from && st.done.length)) continue;   // on resume the volume window is restored from the saved state
    if (shouldStop()) { save(HF, st); HS.phase = 'paused (market hours)'; return { paused: true, sessions: st.done.length }; }
    if (freeMB() < 90) { save(HF, st); HS.phase = 'stopped: disk nearly full';   // stop before Jarvis's own cleanup (< 80 MB) would delete Elis bar files return { paused: true, diskLow: true, sessions: st.done.length }; }
    const k = di.get(d), elig = [];
    for (const [s, x] of D) {
      if (k < 15) break;
      let ok = 0, vs = 0, trs = 0; for (let j = k - 14; j < k; j++) if (!isNaN(x.c[j])) { ok++; vs += x.v[j]; trs += Math.max(x.h[j] - x.l[j], Math.abs(x.h[j] - x.c[j - 1] || 0), Math.abs(x.l[j] - x.c[j - 1] || 0)); }
      const prev = x.c[k - 1]; if (ok < 13 || isNaN(prev) || isNaN(x.o[k])) continue;
      const avgVol = vs / ok, atr = trs / ok; if (prev < 5 || avgVol < 1e6 || atr <= 0.5) continue;
      elig.push({ s, prev, atr, avgVol });
    }
    const first = {}; const ask = [...elig.map(e => e.s), 'SPY'];
    for (let i = 0; i < ask.length; i += 100) {
      const qs = new URLSearchParams({ symbols: ask.slice(i, i + 100).join(','), timeframe: '5Min', start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 575)).toISOString(), feed: 'sip', limit: '10000' });
      const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); await pause(gap);
      for (const [s, arr] of Object.entries(j.bars || {})) if (arr[0]) first[s] = arr[0];
    }
    const spyB = first.SPY, spyDir = spyB ? (spyB.c > spyB.o ? 'long' : spyB.c < spyB.o ? 'short' : null) : null, cands = [];
    for (const e of elig) {
      const fb = first[e.s], win = st.win[e.s] || []; if (fb) st.win[e.s] = [...win, fb.v].slice(-14); else continue;
      if (win.length < 10 || d < from) continue;
      const rvol = fb.v / (win.reduce((a, b) => a + b, 0) / win.length), dir = fb.c > fb.o ? 'long' : fb.c < fb.o ? 'short' : null;
      if (!dir || rvol < 1) continue;
      cands.push({ date: d, sym: e.s, dir, rvol: Math.round(rvol * 100) / 100, gapPct: Math.round((fb.o / e.prev - 1) * 1000) / 10, atr: e.atr, avgVol: Math.round(e.avgVol), orHigh: fb.h, orLow: fb.l, open: fb.o, spyDir, cat: 'none', news: false, tone: 'none', intraday: [], hist: true });
    }
    if (d >= from) {
      cands.sort((a, b) => b.rvol - a.rvol); const top = cands.slice(0, PER_DAY);
      if (top.length) {
        const list = top.map(c => c.sym).join(',');
        try {   // pre-open news (18 h before the bell) -> type + tone
          const j = await A(E.DATA, `/v1beta1/news?${new URLSearchParams({ symbols: list, start: new Date(E.etMs(d, 570) - 18 * 3600e3).toISOString(), end: new Date(E.etMs(d, 570)).toISOString(), limit: '50' })}`); await pause(gap);
          for (const c of top) { const hs = (j.news || []).filter(x => (x.symbols || []).includes(c.sym)).map(x => x.headline); if (hs.length) { c.news = true; c.cat = catOf(hs.join(' '), true); c.tone = RD.toneOf(hs); } }
          let token = '', pages = 0;   // mid-day news (09:30-16:00), the part Elis must learn to react to
          do {
            const q = new URLSearchParams({ symbols: list, start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 960)).toISOString(), limit: '50', sort: 'asc' }); if (token) q.set('page_token', token);
            const k2 = await A(E.DATA, `/v1beta1/news?${q}`); await pause(gap);
            for (const x of k2.news || []) for (const c of top) if ((x.symbols || []).includes(c.sym)) c.intraday.push({ m: Math.round((Date.parse(x.created_at) - E.etMs(d, 570)) / 60e3), tone: RD.tone(x.headline), headline: String(x.headline).slice(0, 140) });
            token = k2.next_page_token || ''; pages++;
          } while (token && pages < 4);
        } catch (e) { progress?.(`news ${d}: ${e.message}`); }
        await barsForDay(d, [...top.map(c => c.sym), 'SPY']);   // the real 1-min bars the replay grades against
        fs.appendFileSync(F.journal, top.map(c => JSON.stringify(c)).join('\n') + '\n');
      }
      st.done.push(d); n++; HS.last = d; HS.done = st.done.length; HS.rate = Math.round(n / ((Date.now() - runStart) / 3600e3)); HS.etaH = HS.rate ? Math.round((sessions.length - st.done.length) / HS.rate * 10) / 10 : null;
      if (n % 10 === 0) save(HF, st);
      if (n % 60 === 0) progress?.(`history: ${st.done.length}/${sessions.length} sessions replayed (through ${d})`);
    }
  }
  st.finished = true; st.win = {}; save(HF, st); HS.phase = 'finished';
  return { finished: true, sessions: st.done.length, candidates: readJournal().length };
}

// ---------- the weekly learning run ----------
let running = false;
// streaming helpers: one day of bars in memory at a time (two years of minute bars do not fit comfortably)
function loadDayBars(date) { const raw = readBars(date), memo = new Map(); return (d, sym) => { if (!memo.has(sym)) memo.set(sym, expand(date, raw[sym])); return memo.get(sym); }; }
const yieldNow = () => new Promise(r => setImmediate(r));
const zero = () => ({ trades: 0, totalR: 0, wins: 0, winR: 0, lossR: 0 });
async function streamEval(days, byDayAll, sets) {
  const out = sets.map(zero);
  for (const d of days) {
    const barsOf = loadDayBars(d), one = new Map([[d, byDayAll.get(d)]]);
    sets.forEach((p, i) => { const e = evaluate(one, barsOf, p), o = out[i], w = Math.round(e.winRate * e.trades); o.trades += e.trades; o.totalR += e.totalR; o.wins += w; o.winR += e.avgWinR * w; o.lossR += e.avgLossR * (e.trades - w); });
    await yieldNow();
  }
  return out.map(o => ({ trades: o.trades, totalR: o.totalR, avgR: o.trades ? o.totalR / o.trades : 0, winRate: o.trades ? o.wins / o.trades : 0, avgWinR: o.wins ? o.winR / o.wins : 0, avgLossR: o.trades - o.wins ? o.lossR / (o.trades - o.wins) : 0 }));
}
async function streamWeights(days, byDayAll, p) {
  const A = newAcc();
  for (const d of days) { learnWeights(new Map([[d, byDayAll.get(d)]]), loadDayBars(d), p, A); await yieldNow(); }
  return finishWeights(A);
}
// ---------- "what would my money have done": compound a starting balance through every replayed day ----------
// 1% of the account risked per trade, whole shares, leverage a real account of that size gets (2x margin from $2,000; cash, long-only below).
export async function equityCurve(days, byDayAll, p, { start = 3000, riskPct = 1 } = {}) {
  let eq = start, peak = start, maxDD = 0, trades = 0, wins = 0, winUsd = 0, lossUsd = 0, best = null, worst = null; const months = {};
  for (const d of days) {
    const barsOf = loadDayBars(d), cands = byDayAll.get(d) || [], lev = eq >= 2000 ? 2 : 1;
    const e = evaluate(new Map([[d, cands]]), barsOf, lev === 1 ? { ...p } : p), dayStart = eq; let pnl = 0;
    for (const t of e.list) {
      const c = cands.find(x => x.sym === t.sym); if (!c || (lev === 1 && c.dir === 'short')) continue;
      const stopDist = Math.max(0.02, c.atr * p.stopAtr), px = c.dir === 'long' ? c.orHigh : c.orLow;
      const shares = Math.floor(Math.min(dayStart * riskPct / 100 / stopDist, dayStart * lev / Math.max(1, p.picks) / px, c.avgVol ? c.avgVol * 0.01 : Infinity)); if (shares < 1) continue;   // never more than 1% of normal daily volume
      const usd = t.R * shares * stopDist; pnl += usd; trades++; if (usd > 0) { wins++; winUsd += usd; } else lossUsd -= usd;
    }
    eq = Math.max(0, eq + pnl); peak = Math.max(peak, eq); maxDD = Math.max(maxDD, peak ? (peak - eq) / peak : 0);
    if (!best || pnl > best.usd) best = { day: d, usd: Math.round(pnl) }; if (!worst || pnl < worst.usd) worst = { day: d, usd: Math.round(pnl) };
    months[d.slice(0, 7)] = Math.round(eq);
    await yieldNow();
  }
  const ms = Object.entries(months), monthly = ms.map(([m, v], i) => ({ m, end: v, pct: Math.round(((v / (i ? ms[i - 1][1] : start)) - 1) * 1000) / 10 }));
  return { from: days[0], to: days.at(-1), start, end: Math.round(eq), returnPct: Math.round((eq / start - 1) * 1000) / 10, maxDrawdownPct: Math.round(maxDD * 1000) / 10, trades, winRatePct: trades ? Math.round(wins / trades * 100) : 0,
    avgWinUsd: wins ? Math.round(winUsd / wins) : 0, avgLossUsd: trades - wins ? Math.round(lossUsd / (trades - wins)) : 0, bestDay: best, worstDay: worst,
    redMonths: monthly.filter(x => x.pct < 0).length, months: monthly.length, worstMonth: monthly.reduce((a, b) => (!a || b.pct < a.pct ? b : a), null), monthly };
}

// ---------- publish reports to the repo's elis-reports branch (no redeploy; Claude reads it from there) ----------
export async function publish(file, text) {
  const tok = process.env.GITHUB_TOKEN; if (!tok) return 'no GITHUB_TOKEN';
  const repo = process.env.GITHUB_REPO || 'Elliot-H/Jarvis-2.0', B = 'elis-reports';
  const gh = async (p, o = {}) => { const r = await fetch(`https://api.github.com/repos/${repo}${p}`, { ...o, headers: { Authorization: `Bearer ${tok}`, Accept: 'application/vnd.github+json', 'content-type': 'application/json' }, signal: AbortSignal.timeout(20000) }); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; } return { ok: r.ok, status: r.status, j }; };
  try {
    if ((await gh(`/git/ref/heads/${B}`)).status === 404) { const m = await gh('/git/ref/heads/main'); if (!m.ok) return 'no main ref'; await gh('/git/refs', { method: 'POST', body: JSON.stringify({ ref: `refs/heads/${B}`, sha: m.j.object.sha }) }); }
    const cur = await gh(`/contents/${file}?ref=${B}`);
    const r = await gh(`/contents/${file}`, { method: 'PUT', body: JSON.stringify({ message: `elis: ${file}`, branch: B, content: Buffer.from(text).toString('base64'), ...(cur.ok ? { sha: cur.j.sha } : {}) }) });
    return r.ok ? 'ok' : `github ${r.status}`;
  } catch (e) { return e.message; }
}

export async function learn({ force = false, progress = null, minRuleN = 80 } = {}) {
  if (running) return { busy: true };
  running = true;
  try {
    const J = readJournal(), byDayAll = new Map();
    for (const r of J) (byDayAll.get(r.date) || byDayAll.set(r.date, []).get(r.date)).push(r);
    const days = [...byDayAll.keys()].sort();
    if (days.length < 30) return { skipped: `only ${days.length} sessions in the journal; need 30` };
    for (const d of days) { if (byDayAll.get(d).every(c => c.hist) && hasBars(d)) continue; await barsForDay(d, [...byDayAll.get(d).map(c => c.sym), 'SPY']); await yieldNow(); }   // fill only live days' missing bars
    const cut = Math.floor(days.length * 0.7), train = days.slice(0, cut), test = days.slice(cut);
    const cur = params(), [curTest] = await streamEval(test, byDayAll, [cur]);
    // 1) weights from TRAIN only, 2) settings one step at a time on TRAIN only
    const lw0 = await streamWeights(train, byDayAll, cur); let cand = { ...cur, mult: lw0.mult, emult: lw0.emult };
    for (let pass = 0; pass < 2; pass++) for (const [k, vals] of Object.entries(GRID)) {
      const i = vals.indexOf(cand[k]), opts = [vals[i - 1], cand[k], vals[i + 1]].filter(v => v !== undefined);
      const res = await streamEval(train, byDayAll, opts.map(v => ({ ...cand, [k]: v })));
      let bestV = cand[k], bestR = -Infinity; res.forEach((e, j) => { const sc = e.trades >= 20 ? e.totalR : -Infinity; if (sc > bestR + 1e-9) { bestR = sc; bestV = opts[j]; } });
      cand[k] = bestV; progress?.(`tuned ${k} (pass ${pass + 1})`);
    }
    const [newTest] = await streamEval(test, byDayAll, [cand]), allW = await streamWeights(days, byDayAll, cur);
    const better = newTest.trades >= 15 && newTest.totalR > curTest.totalR + Math.max(1, Math.abs(curTest.totalR) * 0.1) && newTest.avgR > curTest.avgR;
    const changes = Object.keys(GRID).filter(k => cand[k] !== cur[k]).map(k => `${k} ${cur[k]} -> ${cand[k]}`);
    // ---- proposals: new rules / processes tested on the UNSEEN days; only proven ones are presented to the Owner
    const final = better ? cand : cur, proposals = [], [base] = await streamEval(test, byDayAll, [final]), proven = (e, b) => e.totalR > b.totalR + Math.max(2, Math.abs(b.totalR) * 0.05) && e.avgR > b.avgR && e.trades >= b.trades * 0.6;
    const rules = [];
    for (const [k, b] of Object.entries(lw0.table)) { if (k.startsWith('outcome:')) continue; const chart = k.startsWith('chart:'), kk = chart ? k.slice(6) : k;
      for (const [v, x] of Object.entries(b)) if (x.trades >= minRuleN && x.avgR < -0.05 && !(final.skip || []).some(r => r.k === kk && r.v === v)) rules.push({ k: kk, v, chart, n: x.trades, avgR: x.avgR }); }
    rules.sort((a, b) => a.avgR * a.n - b.avgR * b.n);
    for (const r of rules.slice(0, 6)) {
      const [e] = await streamEval(test, byDayAll, [{ ...final, skip: [...(final.skip || []), { k: r.k, v: r.v, chart: r.chart }] }]);
      if (proven(e, base)) proposals.push({ id: `skip-${r.k}-${r.v}`, kind: 'rule', rule: { k: r.k, v: r.v, chart: r.chart }, title: `Never trade "${r.v}" setups`,
        why: `In ${r.n} training trades, "${r.v}" (${r.chart ? 'chart read at entry' : r.k}) averaged ${r.avgR}R. Skipping it was then tested on the ${test.length} unseen sessions.`,
        evidence: { before: sum(base), after: sum(e) }, effort: 'None. Tell Jarvis "adopt Elis proposal" (or say no) - Elis applies it at the next scan.' });
      progress?.(`tested rule skip ${r.v}`);
    }
    // faster news: is reacting within seconds (Alpaca's real-time news stream, free) better than polling once a minute?
    {
      // fair test: relearn the weights as if news arrived within seconds, then compare the whole system on unseen days
      const fastP = { ...cur, newsExit: true, newsDelay: 0 }, lwF = await streamWeights(train, byDayAll, fastP);
      const [fast] = await streamEval(test, byDayAll, [{ ...final, mult: lwF.mult, emult: lwF.emult, newsExit: true, newsDelay: 0 }]);
      if (proven(fast, base)) proposals.push({ id: 'news-stream', kind: 'build', title: 'Switch Elis to the real-time news stream',
        why: `Mid-day headlines that went against open trades: selling within seconds of the headline (instead of up to a minute later${final.newsExit ? '' : ', or not at all'}) was tested on the ${test.length} unseen sessions.`, settings: { newsExit: true },
        evidence: { before: sum(base), after: sum(fast) }, effort: 'No cost (free Alpaca news stream). Claude builds it in a session when you say "build it".' });
    }
    const gaps = []; const mt = allW.table['outcome:midTradeNews']?.['bad news hit during trade']; if (mt) gaps.push(`${mt.trades} graded trades had bad news hit mid-trade (avg ${mt.avgR}R).`);
    progress?.('money replay: $3,000 from the first session, before vs after');
    const money = { before: await equityCurve(days, byDayAll, cur), after: await equityCurve(days, byDayAll, cand),
      unseenBefore: await equityCurve(test, byDayAll, cur), unseenAfter: await equityCurve(test, byDayAll, cand) };
    P.proposals = proposals; save(F.params, P);
    const report = { money, proposals, gaps, at: new Date().toISOString(), sessions: days.length, candidates: J.length, firstDay: days[0], lastDay: days.at(-1), trainSessions: cut, testSessions: days.length - cut,
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
export function moneyText(rep) {   // replay caps: 1% risk, whole shares, 2x margin from $2k (cash/long-only below), max 1% of average daily volume per position
  const m = rep?.money; if (!m) return '';
  const f = v => '$' + Math.round(v).toLocaleString('en-US'), line = (k, x) => `${k}: ${f(x.start)} -> ${f(x.end)} (${x.returnPct >= 0 ? '+' : ''}${x.returnPct}%), max drawdown ${x.maxDrawdownPct}%, ${x.trades} trades, ${x.winRatePct}% wins, avg win ${f(x.avgWinUsd)} / avg loss ${f(x.avgLossUsd)}, ${x.redMonths}/${x.months} red months`;
  return `If Elis had started with $3,000 on ${m.before.from} (to ${m.before.to}):\n${line('BEFORE (current settings)', m.before)}\n${line('AFTER (learned settings)', m.after)}\n`
    + `Honest check, only the ${rep.testSessions} sessions the learner never saw (${m.unseenBefore.from} to ${m.unseenBefore.to}), $3,000 start:\n${line('BEFORE', m.unseenBefore)}\n${line('AFTER', m.unseenAfter)}`;
}
export function proposalsText(rep) {
  const ps = rep?.proposals || []; if (!ps.length) return 'No new rule or process beat the current setup on the unseen days, so nothing to change.' + (rep?.gaps?.length ? ' ' + rep.gaps.join(' ') : '');
  return ps.map((x, i) => `${i + 1}. ${x.title}\nWhy: ${x.why}\nProof (unseen days): avg ${x.evidence.before.avgR}R -> ${x.evidence.after.avgR}R, total ${x.evidence.before.totalR}R -> ${x.evidence.after.totalR}R, win rate ${x.evidence.before.winRatePct}% -> ${x.evidence.after.winRatePct}%, trades ${x.evidence.before.trades} -> ${x.evidence.after.trades}\nFrom you: ${x.effort}`).join('\n\n');
}
export function adoptProposal(id) {   // Owner said yes (via Jarvis); rules apply at the next 9:15 scan
  const x = (P.proposals || []).find(p => !id || p.id === id || p.title.toLowerCase().includes(String(id).toLowerCase()));
  if (!x) return 'No matching Elis proposal.';
  if (x.kind !== 'rule') return `"${x.title}" needs code: Claude builds it in a session when the Owner says "build it".`;
  P.history.unshift({ version: P.version, params: P.params, at: P.adoptedAt }); P.history = P.history.slice(0, 10);
  P = { ...P, version: P.version + 1, params: { ...P.params, skip: [...(P.params.skip || []), x.rule] }, adoptedAt: new Date().toISOString(), liveRs: [], proposals: P.proposals.filter(p => p !== x) };
  save(F.params, P); return `Adopted: ${x.title}. Elis v${P.version} applies it from the next scan. It rolls back on its own if live paper results disappoint.`;
}
export const proposals = () => P.proposals || [];
export function status() {
  const rep = load(F.report, null), J = readJournal();
  return { version: P.version, adoptedAt: P.adoptedAt, settings: params(), journalSessions: new Set(J.map(r => r.date)).size, journalCandidates: J.length, lastReport: rep };
}
