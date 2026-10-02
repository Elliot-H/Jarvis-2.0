// Live quote scheduler over the three FREE feeds. Facts only; it never trades.
//  Finnhub (60/min): primary live pulse, polled in rotation (stalest priority symbol first), kept under FINNHUB_POLL_PER_MIN.
//  Twelve Data (8/min, 800/day): backup + cross-check, paced so a day never exceeds the routine budget (rest reserved on demand).
//  FMP (250/day): slow data only (fundamentals), once per symbol per day, small routine budget. Never used for live prices.
// A feed that returns rate-limit / auth / missing key goes into a cooldown and the other feed covers; nothing retries in a loop.
import * as md from './marketdata.js';

const num = (v, d) => (Number.isFinite(Number(v)) && v !== '' && v != null ? Number(v) : d);
export const CFG = {
  finnhubPollPerMin: () => num(process.env.FINNHUB_POLL_PER_MIN, 42),      // of 60; the rest is on-demand + news
  minRefreshSec: () => num(process.env.LIVE_MIN_REFRESH_SEC, 3),          // never re-poll one symbol faster than this
  twelveDay: () => num(process.env.TWELVE_ROUTINE_PER_DAY, 600),          // of 800; ~200 reserved on demand
  twelveMinGapSec: () => num(process.env.TWELVE_MIN_GAP_SEC, 10),          // <= 6/min, headroom under 8/min
  fmpDay: () => num(process.env.FMP_ROUTINE_PER_DAY, 40),                  // of 250
  staleSec: () => num(process.env.LIVE_STALE_SEC, 120)
};
const COOL = { rate: 60e3, auth: 3600e3, other: 15e3, nokey: Infinity };
const feeds = {
  finnhub: { downUntil: 0, lastErr: null, calls: 0, fails: 0 },
  twelve: { downUntil: 0, lastErr: null, calls: 0, fails: 0, lastCall: 0, day: [], dayKey: '' },
  fmp: { downUntil: 0, lastErr: null, calls: 0, fails: 0, day: [], dayKey: '' }
};
const q = new Map();      // sym -> { price, prevClose, source, fetchedAt, tradeAt, last: {finnhub, twelve}, diffPct }
const slow = new Map();   // sym -> { at, data }
let getPriority = () => [], marketOpen = () => true, onQuote = () => {};
let fh = { tokens: 5, at: Date.now() }, timer = null, slowTimer = null;
const isCrypto = s => /\/USD$/.test(s);
const dayKey = () => new Date().toISOString().slice(0, 10);

function usable(name) {
  const f = feeds[name];
  if (!md.configured(name)) return false;
  return Date.now() >= f.downUntil;
}
function fail(name, e) {
  const f = feeds[name]; f.fails++; f.lastErr = String(e.message || e).slice(0, 140);
  f.downUntil = Date.now() + (COOL[e.kind] ?? COOL.other);   // fall through to the other feed, retry only after the cooldown
}
function record(sym, r, name) {
  const prev = q.get(sym) || { last: {} };
  const now = Date.now();
  const cur = { ...prev, price: r.price, prevClose: r.prevClose ?? prev.prevClose ?? null, source: r.source, fetchedAt: now, tradeAt: r.tradeAt, last: { ...prev.last, [name]: { price: r.price, at: now } } };
  const o = name === 'finnhub' ? cur.last.twelve : cur.last.finnhub;
  cur.diffPct = o && now - o.at < 10 * 60e3 ? Math.abs(r.price - o.price) / o.price * 100 : null;   // cross-check between the two feeds
  q.set(sym, cur);
  try { onQuote(sym, cur); } catch {}
}
const ageOf = (sym, name) => { const c = q.get(sym); const t = name ? c?.last?.[name]?.at : c?.fetchedAt; return t ? Date.now() - t : Infinity; };
const eligible = () => getPriority().filter(p => isCrypto(p.sym) || marketOpen());

async function finnhubStep() {
  const now = Date.now(), per = CFG.finnhubPollPerMin();
  fh.tokens = Math.min(5, fh.tokens + (now - fh.at) / 1000 * per / 60); fh.at = now;   // token bucket, burst 5
  if (fh.tokens < 1 || !usable('finnhub')) return;
  const cand = eligible().filter(p => !isCrypto(p.sym) && ageOf(p.sym, 'finnhub') >= CFG.minRefreshSec() * 1000)
    .sort((a, b) => ageOf(b.sym, 'finnhub') - ageOf(a.sym, 'finnhub'))[0];
  if (!cand) return;
  fh.tokens -= 1; feeds.finnhub.calls++;
  try { record(cand.sym, await md.quoteFrom('finnhub', cand.sym), 'finnhub'); }
  catch (e) { fail('finnhub', e); }
}
async function twelveStep() {
  const f = feeds.twelve, now = Date.now();
  if (f.dayKey !== dayKey()) { f.dayKey = dayKey(); f.day = []; }
  if (!usable('twelve') || f.day.length >= CFG.twelveDay()) return;
  // pace so the remaining routine budget lasts to midnight UTC, never faster than the per-minute gap
  const secLeft = Math.max(60, 86400 - (now / 1000 % 86400)), pace = Math.max(CFG.twelveMinGapSec(), secLeft / (CFG.twelveDay() - f.day.length));
  if (now - f.lastCall < pace * 1000) return;
  const list = eligible(); if (!list.length) return;
  const finnhubDown = !usable('finnhub');
  // crypto only has this feed; stocks get cross-checks (or full cover while Finnhub is down)
  const cand = list.map(p => ({ p, score: isCrypto(p.sym) ? ageOf(p.sym) * 2 : finnhubDown ? ageOf(p.sym) : ageOf(p.sym, 'twelve') }))
    .sort((a, b) => b.score - a.score)[0];
  if (!cand || cand.score < 20e3) return;
  f.lastCall = now; f.day.push(now); f.calls++;
  try { record(cand.p.sym, await md.quoteFrom('twelve', cand.p.sym), 'twelve'); }
  catch (e) { fail('twelve', e); }
}
async function tick() { try { await finnhubStep(); await twelveStep(); } catch (e) { console.warn('livefeed', e.message); } }

// FMP: slow data once per day per priority symbol (profile + ratios = 2 calls), stocks only. Never live pricing.
async function slowStep() {
  const f = feeds.fmp;
  if (f.dayKey !== dayKey()) { f.dayKey = dayKey(); f.day = []; }
  if (!usable('fmp') || f.day.length + 2 > CFG.fmpDay()) return;
  const c = getPriority().filter(p => !isCrypto(p.sym)).find(p => Date.now() - (slow.get(p.sym)?.at || 0) > 23 * 3600e3);
  if (!c) return;
  slow.set(c.sym, { at: Date.now(), data: slow.get(c.sym)?.data || null });   // set first: a failure is not retried in a loop
  try { f.day.push(Date.now(), Date.now()); f.calls += 2; slow.set(c.sym, { at: Date.now(), data: await md.fundamentals(c.sym) }); }
  catch (e) { fail('fmp', e); }
}

export function start({ priority, open, onQuote: cb }) {
  getPriority = priority; marketOpen = open; if (cb) onQuote = cb;
  if (timer) return;
  timer = setInterval(tick, 1000); slowTimer = setInterval(() => slowStep().catch(() => {}), 5 * 60e3);
  setTimeout(() => slowStep().catch(() => {}), 20e3);
}
// One-shot fill for symbols with no quote yet (app restart, market closed): gets price + prevClose so the daily % shows.
export async function seed(syms) {
  for (const sym of syms) {
    if (q.get(sym)?.prevClose || isCrypto(sym)) continue;
    try { const r = await md.quote(sym); if (r?.price) record(sym, { price: r.price, prevClose: r.prevClose ?? null, tradeAt: r.asOf ? Date.parse(r.asOf) || null : null, source: r.source }, 'seed'); }
    catch (e) { console.warn('seed quote', sym, e.message); }
  }
}
export function stop() { clearInterval(timer); clearInterval(slowTimer); timer = slowTimer = null; }

/** Latest quote with freshness: ageSec = seconds since we fetched it; tradeAgeSec = seconds since the exchange print (when given). */
export function latest(sym) {
  const c = q.get(sym); if (!c) return null;
  const ageSec = Math.round((Date.now() - c.fetchedAt) / 1000);
  return { symbol: sym, price: c.price, prevClose: c.prevClose, source: c.source, ageSec, tradeAgeSec: c.tradeAt ? Math.max(0, Math.round((Date.now() - c.tradeAt) / 1000)) : null, crossCheckDiffPct: c.diffPct == null ? null : +c.diffPct.toFixed(2), stale: ageSec > CFG.staleSec() };
}
export const slowData = sym => slow.get(sym)?.data || null;

export function status() {
  const syms = getPriority().map(p => p.sym), now = Date.now();
  const f = feeds;
  return {
    freshness: Object.fromEntries(syms.map(s => { const l = latest(s); return [s, l ? `${l.ageSec}s old (${l.source}${l.crossCheckDiffPct != null ? `, feeds differ ${l.crossCheckDiffPct}%` : ''})${l.stale ? ' STALE' : ''}` : 'no quote yet' + (isCrypto(s) || marketOpen() ? '' : ' (market closed)')]; })),
    feeds: {
      finnhub: { role: 'live pulse', keySet: md.configured('finnhub'), pollBudgetPerMin: CFG.finnhubPollPerMin(), polls: f.finnhub.calls, failures: f.finnhub.fails, pausedForSec: Math.max(0, Math.round((f.finnhub.downUntil - now) / 1000)) || 0, lastError: f.finnhub.lastErr },
      twelveData: { role: 'backup + cross-check, crypto', keySet: md.configured('twelve'), routineToday: `${f.twelve.day.length}/${CFG.twelveDay()}`, reservedOnDemand: 800 - CFG.twelveDay(), failures: f.twelve.fails, pausedForSec: Math.max(0, Math.round((f.twelve.downUntil - now) / 1000)) || 0, lastError: f.twelve.lastErr },
      fmp: { role: 'slow data only (fundamentals, once a day)', keySet: md.configured('fmp'), routineToday: `${f.fmp.day.length}/${CFG.fmpDay()}`, snapshots: slow.size, failures: f.fmp.fails, pausedForSec: Math.max(0, Math.round((f.fmp.downUntil - now) / 1000)) || 0, lastError: f.fmp.lastErr }
    },
    note: 'Free tiers: Finnhub is near-live (seconds), Twelve Data is spaced to fit 800/day so it is a cross-check, not a second-by-second feed. FMP is never used for prices.'
  };
}
