// Elis WHY-IT-MOVED STUDY (Owner 2026-11-23): "markets move on information people act on. Find where it comes from, put it on a
// scale so we know its weight, and hunt for that kind of information next time."
// For every big intraday move in the stored history (30-min move >= 1 x daily range, from the 2024-2025 graded stock-days):
//   what reached the market in the 60 min before the move started (or the first 5 min of it)?
//     news     : Alpaca/Benzinga headline (outlet, tone, type, minutes of warning)
//     filing   : SEC EDGAR 8-K / 6-K / Form 4 / S-1 / 424B etc. accepted in that window (exact timestamps)
//     market   : S&P 500 (SPY) moved >= 0.3% the same way in the same 30 min
//     sector   : the stock's sector ETF moved >= 0.5% the same way
//     unexplained : none of the above = information Elis cannot see yet (flows, social, options, private)
// Each source then gets a weight: share of big moves it preceded, average move, warning time, and HIT RATE (how often an event
// of that kind was followed by a big move within 60 min at all).
import fs from 'node:fs';
import path from 'node:path';
import * as E from './elis.js';
import * as RD from './elis-read.js';
import * as C from './elis-context.js';
import { readJournal, readBars, catOf } from './elis-learn.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), RF = path.join(DIR, 'why-report.json');
export const lastReport = () => { try { return JSON.parse(fs.readFileSync(RF, 'utf8')); } catch { return null; } };
const pause = ms => new Promise(r => setTimeout(r, ms)), yieldNow = () => new Promise(r => setImmediate(r));
async function A(base, p) { for (let i = 0; ; i++) { try { return await E.api(base, p, {}, true); } catch (e) { if (i >= 6 || (e.status && e.status !== 429 && e.status < 500)) throw e; await pause(Math.min(60e3, 2000 * 2 ** i)); } } }
const UA = `Elis research ${process.env.ELIS_SEC_CONTACT || 'Elliot-H@users.noreply.github.com'}`;   // SEC requires a contact e-mail in the User-Agent
async function sec(url) {   // SEC asks for <= 10 requests/s and a descriptive User-Agent
  for (let i = 0; i < 4; i++) { const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) }).catch(() => null); await pause(150);
    if (r?.ok) return r.json(); if (r && r.status !== 429 && r.status < 500) return null; await pause(2000 * 2 ** i); }
  return null;
}

// ---------- pure: find big moves in a stock-day ----------
export function bigMoves(bars, t0, atr, minMove = 1.0) {   // non-overlapping 30-min windows with |move| >= minMove x ATR
  const out = []; let i = 0;
  while (i + 30 < bars.length) {
    const mv0 = (bars[i + 30].c - bars[i].c) / atr;
    if (Math.abs(mv0) >= minMove) {
      // date the move from where it really took off: the low (rises) / high (drops) inside the window, then measure 30 min from there
      let s0 = i; for (let j = i; j <= i + 30; j++) if (mv0 > 0 ? bars[j].c <= bars[s0].c : bars[j].c >= bars[s0].c) s0 = j;   // last low before the lift-off
      const e0 = Math.min(bars.length - 1, s0 + 30), a = bars[s0], b = bars[e0], mv = (b.c - a.c) / atr;
      out.push({ startT: a.t, endT: b.t, minute: Math.round((a.t - t0) / 60e3), move: Math.round(mv * 100) / 100, dir: mv0 > 0 ? 'up' : 'down', pct: Math.round((b.c / a.c - 1) * 1000) / 10 }); i = e0;
    }
    else i += 5;
  }
  return out;
}
// classify what preceded a move. news: [{t, source, headline, tone, cat}], filings: [{t, form}], spy/sector: minute closes Map
export function explain(m, news, filings, spyAt, secAt) {
  const lo = m.startT - 60 * 60e3, hi = m.startT + 5 * 60e3, why = [];
  for (const n of news) if (n.t >= lo && n.t <= hi) why.push({ kind: 'news', source: n.source || 'unknown', label: `news:${n.source || 'unknown'}:${n.cat}`, tone: n.tone, leadMin: Math.round((m.startT - n.t) / 60e3), headline: n.headline });
  for (const f of filings) if (f.t >= lo && f.t <= hi) why.push({ kind: 'filing', label: `sec:${f.form}`, leadMin: Math.round((m.startT - f.t) / 60e3) });
  const mv = (mp, th) => { const a = mp?.get(m.startT), b = mp?.get(m.endT); if (!a || !b) return 0; const r = b / a - 1; return (m.dir === 'up' ? r : -r) >= th ? r : 0; };
  if (mv(spyAt, 0.003)) why.push({ kind: 'market', label: 'market (S&P 500 same way)', leadMin: 0 });
  if (mv(secAt, 0.005)) why.push({ kind: 'sector', label: 'sector ETF same way', leadMin: 0 });
  if (!why.length) why.push({ kind: 'unexplained', label: 'unexplained (no news, filing, market or sector)', leadMin: null });
  return why;
}
// weights per source: share of big moves, avg move, median warning, hit rate (events followed by a big move within 60 min)
export function weigh(moves, events) {
  const by = {}, total = moves.length;
  for (const m of moves) { const seen = new Set(); for (const w of m.why) { if (seen.has(w.label)) continue; seen.add(w.label); const a = (by[w.label] ||= { label: w.label, kind: w.kind, moves: 0, absMove: 0, leads: [], tone: {} }); a.moves++; a.absMove += Math.abs(m.move); if (w.leadMin != null) a.leads.push(w.leadMin); if (w.tone) a.tone[w.tone] = (a.tone[w.tone] || 0) + 1; } }
  const hit = {}; for (const e of events) { const h = (hit[e.label] ||= { n: 0, hits: 0 }); h.n++; if (e.followed) h.hits++; }
  return Object.values(by).map(a => { const l = a.leads.sort((x, y) => x - y); return { label: a.label, kind: a.kind, shareOfBigMoves: Math.round(a.moves / total * 1000) / 10, moves: a.moves, avgMoveATR: Math.round(a.absMove / a.moves * 100) / 100,
    medianWarningMin: l.length ? l[Math.floor(l.length / 2)] : null, hitRatePct: hit[a.label]?.n ? Math.round(hit[a.label].hits / hit[a.label].n * 1000) / 10 : null, events: hit[a.label]?.n || null, tone: a.tone }; })
    .sort((x, y) => y.moves - x.moves);
}

// ---------- the study ----------
export async function run({ progress = null, shouldStop = () => false } = {}) {
  const J = readJournal().filter(r => r.date < E.et().date && r.atr), byDay = new Map(); for (const r of J) (byDay.get(r.date) || byDay.set(r.date, []).get(r.date)).push(r);
  const days = [...byDay.keys()].sort(); progress?.(`why-it-moved: ${days.length} sessions`);
  // SEC: ticker -> CIK, then each company's filings with exact acceptance times
  const cikMap = {}, tick = await sec('https://www.sec.gov/files/company_tickers.json');
  if (tick) for (const v of Object.values(tick)) cikMap[v.ticker] = String(v.cik_str).padStart(10, '0');
  const filingsOf = {}, syms = [...new Set(J.map(r => r.sym))];
  if (tick) { let n = 0; for (const s of syms) { const cik = cikMap[s]; if (!cik) continue; const j = await sec(`https://data.sec.gov/submissions/CIK${cik}.json`); const r = j?.filings?.recent; if (r) filingsOf[s] = r.form.map((f, i) => ({ form: f, t: Date.parse(r.acceptanceDateTime[i]) })).filter(x => x.t); if (++n % 200 === 0) { progress?.(`why-it-moved: SEC filings for ${n}/${syms.length} companies`); await yieldNow(); } } }
  const moves = [], events = [];
  for (const d of days) {
    if (shouldStop()) return { paused: true };
    const rows = byDay.get(d), raw = readBars(d), t0 = E.etMs(d, 570), bars = s => (raw[s] || []).map(([m, o, h, l, c, v]) => ({ t: t0 + m * 60e3, o: o / 100, h: h / 100, l: l / 100, c: c / 100, v }));
    const spy = bars('SPY'), spyAt = new Map(spy.map(b => [b.t, b.c]));
    // news for the day's stocks with outlet + exact time (pre-open 18 h + session)
    let news = []; try { let token = '', pages = 0; do { const q = new URLSearchParams({ symbols: rows.map(r => r.sym).join(','), start: new Date(t0 - 18 * 3600e3).toISOString(), end: new Date(E.etMs(d, 960)).toISOString(), limit: '50', sort: 'asc' }); if (token) q.set('page_token', token);
      const j = await A(E.DATA, `/v1beta1/news?${q}`); news.push(...(j.news || [])); token = j.next_page_token || ''; } while (token && ++pages < 5); } catch {}
    // sector ETFs minute bars for the day (only the ETFs these stocks map to)
    const etfs = [...new Set(rows.map(r => r.sectorEtf).filter(Boolean))], secBars = {};
    if (etfs.length) try { const q = new URLSearchParams({ symbols: etfs.join(','), timeframe: '1Min', start: new Date(t0).toISOString(), end: new Date(E.etMs(d, 960)).toISOString(), feed: 'sip', limit: '10000' }); const j = await A(E.DATA, `/v2/stocks/bars?${q}`); for (const [s, a] of Object.entries(j.bars || {})) secBars[s] = new Map(a.map(b => [Date.parse(b.t), b.c])); } catch {}
    for (const r of rows) {
      const b = bars(r.sym); if (b.length < 60) continue;
      const nws = news.filter(n => (n.symbols || []).includes(r.sym)).map(n => ({ t: Date.parse(n.created_at), source: n.source, headline: String(n.headline).slice(0, 120), tone: RD.tone(n.headline), cat: catOf(n.headline, true) }));
      const fil = (filingsOf[r.sym] || []).filter(f => f.t >= t0 - 18 * 3600e3 && f.t <= E.etMs(d, 960));
      const mvs = bigMoves(b, t0, r.atr);
      for (const m of mvs) moves.push({ date: d, sym: r.sym, ...m, why: explain(m, nws, fil, spyAt, secBars[r.sectorEtf]) });
      // hit rate: every in-session news item / filing for this stock -> was there a big move starting within 60 min after it?
      for (const n of nws.filter(n => n.t >= t0 && n.t < E.etMs(d, 900))) events.push({ label: `news:${n.source || 'unknown'}:${n.cat}`, followed: mvs.some(m => m.startT >= n.t - 5 * 60e3 && m.startT <= n.t + 60 * 60e3) });
      for (const f of fil.filter(f => f.t >= t0 && f.t < E.etMs(d, 900))) events.push({ label: `sec:${f.form}`, followed: mvs.some(m => m.startT >= f.t - 5 * 60e3 && m.startT <= f.t + 60 * 60e3) });
    }
    await yieldNow(); if (days.indexOf(d) % 50 === 0) progress?.(`why-it-moved: through ${d}, ${moves.length} big moves`);
  }
  const weights = weigh(moves, events), kinds = {};
  for (const m of moves) { const k = [...new Set(m.why.map(w => w.kind))].sort().join('+'); kinds[k] = (kinds[k] || 0) + 1; }
  const report = { at: new Date().toISOString(), sessions: days.length, bigMoves: moves.length, secAvailable: !!tick, byKind: Object.fromEntries(Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, Math.round(v / moves.length * 1000) / 10])),
    weights: weights.slice(0, 40), examples: moves.filter(m => m.why.some(w => w.kind !== 'unexplained')).slice(-15).map(m => ({ date: m.date, sym: m.sym, move: m.pct + '%', why: m.why.map(w => w.label + (w.leadMin != null ? ` (${w.leadMin} min before)` : '')) })) };
  try { fs.writeFileSync(RF, JSON.stringify(report)); } catch {}
  return report;
}
export function text(r) {
  if (!r) return 'no report';
  const w = r.weights.slice(0, 12).map(x => `- ${x.label}: before ${x.shareOfBigMoves}% of big moves (${x.moves}), avg ${x.avgMoveATR}x daily range${x.medianWarningMin != null ? `, ~${x.medianWarningMin} min warning` : ''}${x.hitRatePct != null ? `, hit rate ${x.hitRatePct}% of ${x.events} events` : ''}`).join('\n');
  return `${r.bigMoves.toLocaleString('en-US')} big intraday moves (>= 1 daily range in 30 min) across ${r.sessions} sessions.${r.secAvailable ? '' : ' (SEC EDGAR was unreachable; filings not included.)'}\n`
    + `What came before them: ${Object.entries(r.byKind).slice(0, 6).map(([k, v]) => `${k} ${v}%`).join(', ')}\n\nSources by weight:\n${w}`;
}
