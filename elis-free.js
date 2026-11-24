// Elis FREE DATA SOURCES (Owner 2026-11-24: "do all the free ones now").
// Each source turns into plain-language variables known BEFORE the moment Elis calls, so the walk can weigh them by track record:
//  attention   Wikipedia page views yesterday vs the stock's 30-day average     (wikimedia.org, history from mid-2015)
//  shortRatio  FINRA daily short-sale volume share yesterday vs its 20-day avg   (cdn.finra.org, one file per day)
//  insider     SEC Form 4 insider filings in the last 3 days                     (sec.gov EDGAR submissions)
//  filing8k    an 8-K (material event) filed since the last close               (sec.gov EDGAR submissions)
//  macro       Fed decision day / CPI day / jobs-report day / day before Fed      (Fed dates listed below; BLS archive pages)
//  fearCurve   VIX 9-day vs 30-day vs 3-month: panic (inverted) / normal / calm  (cdn.cboe.com VIX CSVs, full history)
//  putCall     CBOE total put/call ratio yesterday: heavy puts / normal / heavy calls (cdn.cboe.com; CSV to 2019, daily JSON after)
//  orderFlow   buying vs selling pressure in the 10 minutes before the call (Alpaca trades, tick rule) - filled for swing-turn cuts
// Every fetch is cached on disk; a source that fails gives null (the walk simply skips a variable that is missing).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis', 'free');
try { fs.mkdirSync(DIR, { recursive: true }); } catch {}
const UA = 'Elis research (+https://github.com/Elliot-H/Jarvis-2.0)';
const pause = ms => new Promise(r => setTimeout(r, ms));
export const status = {};   // per source: ok / fail counts and last error (shown on /elis-report)
const mark = (src, ok, err) => { const s = (status[src] ||= { ok: 0, fail: 0, last: '' }); ok ? s.ok++ : (s.fail++, (s.last = String(err || '').slice(0, 120))); };
async function get(url, { json = false, src = 'web', tries = 3, wait = 120, headers = {} } = {}) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { headers: { 'User-Agent': UA, ...headers }, signal: AbortSignal.timeout(30000) }); await pause(wait);
      if (r.status === 404) { mark(src, false, '404 ' + url); return null; }
      if (!r.ok) throw new Error(`${r.status} ${url}`); const v = json ? await r.json() : await r.text(); mark(src, true); return v;
    } catch (e) { if (i === tries - 1) { mark(src, false, e.message); return null; } await pause(1000 * (i + 1)); }
  }
}
const cacheFile = n => path.join(DIR, n + '.json.gz');
const load = n => { try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(cacheFile(n)))); } catch { return null; } };
const save = (n, v) => { try { fs.writeFileSync(cacheFile(n), zlib.gzipSync(JSON.stringify(v))); } catch {} };
const ymd = d => d.replace(/-/g, '');
const prevDays = (cal, k, n) => cal.slice(Math.max(0, k - n), k);   // trading dates before day k
const bk = (v, c, n) => { if (v == null || !Number.isFinite(v)) return null; for (let i = 0; i < c.length; i++) if (v < c[i]) return n[i]; return n[c.length]; };

// ---------- CBOE: VIX curve + put/call ----------
export function parseCsvSeries(txt, col = 'CLOSE') {   // "DATE,OPEN,HIGH,LOW,CLOSE" with MM/DD/YYYY or YYYY-MM-DD -> { 'YYYY-MM-DD': value }
  const out = {}; if (!txt) return out; const lines = txt.split(/\r?\n/); let ci = -1;
  for (const ln of lines) { const p = ln.split(',').map(x => x.trim());
    if (ci < 0) { const i = p.findIndex(x => x.toUpperCase() === col); if (i >= 0) { ci = i; continue; } }
    const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(p[0]) || /^(\d{4})-(\d{2})-(\d{2})$/.exec(p[0]); if (!m) continue;
    const d = m[0].includes('/') ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : m[0];
    const v = +(ci >= 0 ? p[ci] : p[p.length - 1]); if (Number.isFinite(v)) out[d] = v; }
  return out;
}
let CB = null;
export async function cboe() {
  if (CB) return CB; CB = load('cboe'); if (CB && Date.now() - (CB.at || 0) < 7 * 864e5) return CB;
  const base = 'https://cdn.cboe.com/api/global/us_indices/daily_prices/';
  const vix = parseCsvSeries(await get(base + 'VIX_History.csv', { src: 'cboe' })), v9 = parseCsvSeries(await get(base + 'VIX9D_History.csv', { src: 'cboe' })), v3m = parseCsvSeries(await get(base + 'VIX3M_History.csv', { src: 'cboe' }));
  const pc = parseCsvSeries(await get('https://cdn.cboe.com/resources/options/volume_and_call_put_ratios/totalpc.csv', { src: 'cboe' }), 'P/C RATIO');
  CB = { at: Date.now(), vix, v9, v3m, pc }; if (Object.keys(vix).length) save('cboe', CB); return CB;
}
// after 2019 CBOE stopped the CSV: one small JSON per day (fetched lazily, cached)
async function putCallAfter2019(d) {
  const c = CB || (await cboe()); if (c.pc[d] != null) return c.pc[d];
  const j = await get(`https://cdn.cboe.com/data/us/options/market_statistics/daily/${d}_daily_options`, { json: true, src: 'cboe-daily', tries: 2, wait: 60 });
  const ratios = j?.ratios || j?.data?.ratios || []; const t = (Array.isArray(ratios) ? ratios : []).find(x => /total/i.test(x.name || ''));
  const v = t ? +t.value : null; c.pc[d] = Number.isFinite(v) ? v : null; return c.pc[d];
}
export async function marketDay(cal, k) {   // known at the open of day k
  const c = await cboe(), y = cal[k - 1]; if (!y) return {};
  const vx = c.vix[y], v9 = c.v9[y], v3 = c.v3m[y];
  const fearCurve = !vx ? null : v3 && vx / v3 > 1 ? 'fear curve inverted (panic)' : v9 && v9 / vx > 1.05 ? 'short-term fear rising' : v3 && vx / v3 < 0.85 ? 'fear curve steep (calm)' : 'fear curve normal';
  let pc = c.pc[y]; if (pc == null && y >= '2019-10-01') pc = await putCallAfter2019(y).catch(() => null);
  return { fearCurve, putCall: bk(pc, [0.75, 0.95, 1.15], ['heavy call buying', 'normal put/call', 'more puts than usual', 'heavy put buying']) };
}

// ---------- macro calendar ----------
// FOMC decision days (statement days), 2016-2025, incl. the March 2020 emergency moves
export const FOMC = new Set(('2016-01-27 2016-03-16 2016-04-27 2016-06-15 2016-07-27 2016-09-21 2016-11-02 2016-12-14 2017-02-01 2017-03-15 2017-05-03 2017-06-14 2017-07-26 2017-09-20 2017-11-01 2017-12-13 '
  + '2018-01-31 2018-03-21 2018-05-02 2018-06-13 2018-08-01 2018-09-26 2018-11-08 2018-12-19 2019-01-30 2019-03-20 2019-05-01 2019-06-19 2019-07-31 2019-09-18 2019-10-30 2019-12-11 '
  + '2020-01-29 2020-03-03 2020-03-16 2020-04-29 2020-06-10 2020-07-29 2020-09-16 2020-11-05 2020-12-16 2021-01-27 2021-03-17 2021-04-28 2021-06-16 2021-07-28 2021-09-22 2021-11-03 2021-12-15 '
  + '2022-01-26 2022-03-16 2022-05-04 2022-06-15 2022-07-27 2022-09-21 2022-11-02 2022-12-14 2023-02-01 2023-03-22 2023-05-03 2023-06-14 2023-07-26 2023-09-20 2023-11-01 2023-12-13 '
  + '2024-01-31 2024-03-20 2024-05-01 2024-06-12 2024-07-31 2024-09-18 2024-11-07 2024-12-18 2025-01-29 2025-03-19 2025-05-07 2025-06-18 2025-07-30 2025-09-17 2025-10-29 2025-12-10').split(' '));
export function parseBlsDates(html) {   // BLS release archive pages list every release with its date
  const out = new Set(), M = { january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
  for (const m of String(html || '').matchAll(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g)) out.add(`${m[3]}-${m[1]}-${m[2]}`);
  for (const m of String(html || '').matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})\b/g)) out.add(`${m[3]}-${String(M[m[1].toLowerCase()]).padStart(2, '0')}-${m[2].padStart(2, '0')}`);
  return [...out].filter(d => d >= '2015-01-01' && [1, 2, 3, 4, 5].includes(new Date(d + 'T12:00:00Z').getUTCDay())).sort();
}
let MAC = null;
export async function macroDates() {
  if (MAC) return MAC; MAC = load('macro'); if (MAC && Date.now() - (MAC.at || 0) < 30 * 864e5) return MAC;
  const cpi = parseBlsDates(await get('https://www.bls.gov/bls/news-release/cpi.htm', { src: 'bls' })), jobs = parseBlsDates(await get('https://www.bls.gov/bls/news-release/empsit.htm', { src: 'bls' }));
  MAC = { at: Date.now(), cpi, jobs }; if (cpi.length || jobs.length) save('macro', MAC); return MAC;
}
export async function macroOf(d, cal, k) {
  const m = await macroDates(), next = cal[k + 1];
  if (FOMC.has(d)) return 'Fed decision day'; if (m.cpi.includes(d)) return 'CPI day'; if (m.jobs.includes(d)) return 'jobs report day'; if (next && FOMC.has(next)) return 'day before Fed decision';
  return 'no major release';
}

// ---------- FINRA daily short-sale volume ----------
export function parseFinra(txt) {   // Date|Symbol|ShortVolume|ShortExemptVolume|TotalVolume|Market -> { SYM: short share }
  const out = {}; for (const ln of String(txt || '').split(/\r?\n/)) { const p = ln.split('|'); if (p.length < 5 || !/^\d{8}$/.test(p[0])) continue; const tot = +p[4]; if (tot > 0) out[p[1]] = +p[2] / tot; } return out;
}
const finraMem = new Map();
async function finraDay(d) {
  if (finraMem.has(d)) return finraMem.get(d);
  const txt = await get(`https://cdn.finra.org/equity/regsho/daily/CNMSshvol${ymd(d)}.txt`, { src: 'finra', tries: 2, wait: 80 });
  const m = parseFinra(txt); finraMem.set(d, m); if (finraMem.size > 30) finraMem.delete(finraMem.keys().next().value); return m;
}
export async function shortOf(sym, cal, k) {
  const days = prevDays(cal, k, 21); if (days.length < 5) return null; const maps = []; for (const d of days) maps.push(await finraDay(d));
  const y = maps.at(-1)[sym], hist = maps.slice(0, -1).map(m => m[sym]).filter(v => v != null); if (y == null || hist.length < 5) return null;
  const avg = hist.reduce((a, b) => a + b, 0) / hist.length;
  return y - avg > 0.1 ? 'shorting jumped yesterday' : y - avg > 0.04 ? 'shorting up yesterday' : avg - y > 0.1 ? 'shorting dropped yesterday' : avg - y > 0.04 ? 'shorting down yesterday' : 'shorting normal';
}

// ---------- SEC EDGAR: insider (Form 4) and 8-K timing ----------
let CIK = null;
async function cikMap() { if (CIK) return CIK; CIK = load('cik'); if (CIK) return CIK; const j = await get('https://www.sec.gov/files/company_tickers.json', { json: true, src: 'sec', wait: 150 }); CIK = {}; for (const v of Object.values(j || {})) CIK[v.ticker] = v.cik_str; if (Object.keys(CIK).length) save('cik', CIK); return CIK; }
const edgarMem = new Map();
export async function edgarEvents(sym) {   // { f4: [YYYY-MM-DD], k8: [ISO acceptance times] }
  if (edgarMem.has(sym)) return edgarMem.get(sym); const disk = load('edgar-' + sym); if (disk) { edgarMem.set(sym, disk); return disk; }
  const cik = (await cikMap())[sym]; let ev = { f4: [], k8: [] };
  if (cik) { const pad = String(cik).padStart(10, '0'), j = await get(`https://data.sec.gov/submissions/CIK${pad}.json`, { json: true, src: 'sec', wait: 150 });
    const take = r => { if (!r?.form) return; for (let i = 0; i < r.form.length; i++) { if (r.form[i] === '4') ev.f4.push(r.filingDate[i]); else if (r.form[i] === '8-K') ev.k8.push(r.acceptanceDateTime?.[i] || r.filingDate[i]); } };
    take(j?.filings?.recent);
    for (const f of j?.filings?.files || []) { if (f.filingTo && f.filingTo < '2015-06-01') continue; take(await get(`https://data.sec.gov/submissions/${f.name}`, { json: true, src: 'sec', wait: 150 })); } }
  ev = { f4: [...new Set(ev.f4)].sort(), k8: [...new Set(ev.k8)].sort() }; edgarMem.set(sym, ev); if (edgarMem.size > 400) edgarMem.delete(edgarMem.keys().next().value); save('edgar-' + sym, ev); return ev;
}
export async function filingsOf(sym, d, cal, k, t0) {
  const ev = await edgarEvents(sym).catch(() => null); if (!ev) return {}; const lo = cal[Math.max(0, k - 3)], prevClose = cal[k - 1];
  const f4 = ev.f4.filter(x => x >= lo && x < d).length, k8 = ev.k8.some(x => { const t = Date.parse(x.length > 10 ? x : x + 'T16:00:00-05:00'); return t < t0 && x.slice(0, 10) >= prevClose; });
  return { insider: f4 ? (f4 >= 3 ? 'several insider filings last 3 days' : 'insider filing last 3 days') : 'no insider filings', filing8k: k8 ? '8-K filed since last close' : 'no 8-K since last close' };
}

// ---------- Wikipedia attention ----------
let WT = null;
const wikiTitles = () => (WT ||= load('wiki-titles') || {});
async function wikiTitle(sym, name) {
  const T = wikiTitles(); if (sym in T) return T[sym]; if (!name) return (T[sym] = null);
  const q = String(name).replace(/\b(Inc|Corp|Corporation|Co|Ltd|Holdings|Group|plc|Class [A-C]|Common Stock|Ordinary Shares|ADR|American Depositary Shares)\b\.?/gi, '').replace(/[,.]+/g, ' ').replace(/\s+/g, ' ').trim();
  const j = await get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q + ' company')}&srlimit=1&format=json`, { json: true, src: 'wiki', wait: 60 });
  T[sym] = j?.query?.search?.[0]?.title || null; if (Object.keys(T).length % 25 === 0) save('wiki-titles', T); return T[sym];
}
const wikiMem = new Map();
async function wikiViews(sym, name) {
  if (wikiMem.has(sym)) return wikiMem.get(sym); const disk = load('wiki-' + sym); if (disk) { wikiMem.set(sym, disk); return disk; }
  const t = await wikiTitle(sym, name); let v = {};
  if (t) { const j = await get(`https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/${encodeURIComponent(t.replace(/ /g, '_'))}/daily/20150701/20260101`, { json: true, src: 'wiki', wait: 60 });
    for (const it of j?.items || []) v[`${it.timestamp.slice(0, 4)}-${it.timestamp.slice(4, 6)}-${it.timestamp.slice(6, 8)}`] = it.views; }
  wikiMem.set(sym, v); if (wikiMem.size > 400) wikiMem.delete(wikiMem.keys().next().value); save('wiki-' + sym, v); return v;
}
export async function attentionOf(sym, name, cal, k) {
  const v = await wikiViews(sym, name).catch(() => null); if (!v || !Object.keys(v).length) return null;
  const y = v[cal[k - 1]], hist = prevDays(cal, k - 1, 30).map(d => v[d]).filter(x => x != null); if (y == null || hist.length < 10) return null;
  const avg = hist.reduce((a, b) => a + b, 0) / hist.length; const r = avg > 0 ? y / avg : 1;
  return bk(r, [0.7, 1.5, 3], ['attention fading', 'attention normal', 'attention up 1.5-3x', 'attention spike 3x+']);
}

// ---------- order flow (Alpaca trades, tick rule) ----------
export function tickFlow(trades) {   // buy volume share by the tick rule
  let last = null, dir = 0, buy = 0, sell = 0;
  for (const t of trades) { const p = +t.p, s = +t.s; if (last != null) dir = p > last ? 1 : p < last ? -1 : dir; last = p; if (dir > 0) buy += s; else if (dir < 0) sell += s; }
  const tot = buy + sell; return tot ? buy / tot : null;
}
export async function orderFlowOf(A, DATA, sym, T) {
  const q = new URLSearchParams({ start: new Date(T - 600e3).toISOString(), end: new Date(T).toISOString(), limit: '10000', feed: 'sip' });
  const j = await A(DATA, `/v2/stocks/${sym}/trades?${q}`).catch(() => null); const r = tickFlow(j?.trades || []); mark('orderflow', r != null, 'no trades');
  return bk(r, [0.4, 0.47, 0.53, 0.6], ['heavy selling last 10 min', 'selling last 10 min', 'balanced last 10 min', 'buying last 10 min', 'heavy buying last 10 min']);
}
// all morning-known free variables for one stock-day
export async function dayFree({ sym, name, d, cal, k, t0 }) {
  const out = {};
  try { Object.assign(out, await marketDay(cal, k)); } catch (e) { mark('cboe', false, e.message); }
  try { out.macro = await macroOf(d, cal, k); } catch (e) { mark('bls', false, e.message); }
  try { out.shortRatio = await shortOf(sym, cal, k); } catch (e) { mark('finra', false, e.message); }
  try { Object.assign(out, await filingsOf(sym, d, cal, k, t0)); } catch (e) { mark('sec', false, e.message); }
  try { out.attention = await attentionOf(sym, name, cal, k); } catch (e) { mark('wiki', false, e.message); }
  return out;
}
export const FREE_KEYS = ['fearCurve', 'putCall', 'macro', 'shortRatio', 'insider', 'filing8k', 'attention', 'orderFlow'];
