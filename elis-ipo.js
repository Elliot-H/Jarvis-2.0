// Elis IPO STUDY (Owner 2026-11-25): "buy IPOs in the first 20 minutes, sell 40 minutes later - why isn't that a 70% move?"
// Every US IPO 2016-2025: buy at the first trade of day one (what anyone can actually get; the IPO price itself goes to the
// underwriters' clients), then where was price 20 / 40 / 60 minutes later, and did it hit +1% before -1%?
// IPO list: Nasdaq IPO calendar (priced deals, by month). Fallback if Nasdaq refuses the server: every Alpaca symbol whose first
// ever daily bar falls in the period (new listings: IPOs, SPACs, spin-offs; a few renames slip in).
import fs from 'node:fs';
import path from 'node:path';
import * as E from './elis.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'ipo-report.json');
const pause = ms => new Promise(r => setTimeout(r, ms)), r1 = x => Math.round(x * 10) / 10;
async function A(base, p) { for (let i = 0; ; i++) { try { return await E.api(base, p, {}, true); } catch (e) { if (i >= 5 || (e.status && e.status !== 429 && e.status < 500)) throw e; await pause(Math.min(60e3, 2000 * 2 ** i)); } } }
export const lastReport = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return null; } };

async function nasdaqMonth(ym) {
  try { const r = await fetch(`https://api.nasdaq.com/api/ipo/calendar?date=${ym}`, { headers: { 'User-Agent': `Elis research ${process.env.ELIS_SEC_CONTACT || 'Elliot-H@users.noreply.github.com'}`, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null; const j = await r.json(); return (j?.data?.priced?.rows || []).map(x => ({ sym: String(x.proposedTickerSymbol || '').trim(), date: x.pricedDate, name: x.companyName, price: +String(x.proposedSharePrice || '').replace(/[^0-9.]/g, '') || null, exch: x.proposedExchange }));
  } catch { return null; }
}
const toISO = d => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(d || ''); return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : d; };
// outcome of buying at the first trade of day one
export function dayOne(bars) {
  if (!bars?.length) return null; const t0 = bars[0].t, e = bars[0].o, at = min => { let x = null; for (const b of bars) { if (b.t - t0 <= min * 60e3) x = b; else break; } return x ? x.c : null; };
  let touch = 'none'; for (const b of bars) { if (b.t - t0 > 60 * 60e3) break; const hu = b.h >= e * 1.01, hd = b.l <= e * 0.99; if (hu && hd) { touch = b.c >= e ? 'up' : 'down'; break; } if (hu) { touch = 'up'; break; } if (hd) { touch = 'down'; break; } }
  const ret = m => { const c = at(m); return c ? (c / e - 1) * 100 : null; };
  return { open: e, r20: ret(20), r40: ret(40), r60: ret(60), touch };
}
export function summarize(rows) {
  const ok = rows.filter(r => r.r20 != null), s = k => { const v = ok.map(r => r[k]).filter(x => x != null).sort((a, b) => a - b); return v.length ? { up: r1(v.filter(x => x > 0).length / v.length * 100), median: r1(v[Math.floor(v.length / 2)]), avg: r1(v.reduce((a, b) => a + b, 0) / v.length), n: v.length } : null; };
  const t = ok.filter(r => r.touch !== 'none');
  return { ipos: ok.length, after20: s('r20'), after40: s('r40'), after60: s('r60'), plus1First: t.length ? r1(t.filter(r => r.touch === 'up').length / t.length * 100) : null, touched: t.length };
}
export async function run({ from = 2016, to = 2025, progress = () => {}, shouldStop = () => false } = {}) {
  let list = [], source = 'Nasdaq IPO calendar';
  months: for (let y = from; y <= to; y++) for (let m = 1; m <= 12; m++) { const rows = await nasdaqMonth(`${y}-${String(m).padStart(2, '0')}`); if (rows == null) { list = null; break months; } list.push(...rows.map(x => ({ ...x, date: toISO(x.date) }))); await pause(250); }
  if (!list) {   // Nasdaq refused: new listings from Alpaca (first ever daily bar inside the period)
    source = 'Alpaca new listings'; list = []; progress('ipo study: Nasdaq calendar refused the server; finding new listings from Alpaca');
    const assets = []; for (const st of ['active', 'inactive']) { try { assets.push(...await A(E.BASE, `/v2/assets?status=${st}&asset_class=us_equity`)); } catch (e) { progress('ipo study: assets ' + st + ' failed: ' + e.message); } }
    const syms = [...new Set(assets.filter(a => ['NYSE', 'NASDAQ', 'AMEX', 'ARCA', 'BATS'].includes(a.exchange) && /^[A-Z]{1,5}$/.test(a.symbol)).map(a => a.symbol))], nameOf = Object.fromEntries(assets.map(a => [a.symbol, a.name]));
    // first trading month per symbol, 100 symbols per request (monthly bars), then the exact first day for the new ones
    const firstMonth = {};
    for (let i = 0; i < syms.length; i += 100) { if (shouldStop()) return { paused: true }; let token = '';
      do { const q = new URLSearchParams({ symbols: syms.slice(i, i + 100).join(','), timeframe: '1Month', start: '2015-06-01', end: `${to}-12-31`, limit: '10000', feed: 'sip', adjustment: 'raw' }); if (token) q.set('page_token', token);
        const j = await A(E.DATA, `/v2/stocks/bars?${q}`).catch(() => null); for (const [sym, bs] of Object.entries(j?.bars || {})) { const d = bs[0]?.t?.slice(0, 10); if (d && (!firstMonth[sym] || d < firstMonth[sym])) firstMonth[sym] = d; } token = j?.next_page_token || ''; } while (token);
      if (i % 2000 === 0) progress(`ipo study: first month found for ${Object.keys(firstMonth).length} of ${syms.length} symbols`); }
    for (const [sym, m] of Object.entries(firstMonth)) { if (m < `${from}-01-01` || m > `${to}-12-31` || m <= '2015-07-01') continue;
      const j = await A(E.DATA, `/v2/stocks/${sym}/bars?timeframe=1Day&start=${m.slice(0, 7)}-01&limit=1&feed=sip`).catch(() => null), d = j?.bars?.[0]?.t?.slice(0, 10); if (d) list.push({ sym, date: d, name: nameOf[sym] }); }
  }
  list = list.filter(x => x.sym && x.date); progress(`ipo study: ${list.length} IPOs from ${source}`);
  const rows = [];
  for (let i = 0; i < list.length; i++) { if (shouldStop()) return { paused: true }; const x = list[i];
    const q = new URLSearchParams({ timeframe: '1Min', start: new Date(E.etMs(x.date, 570)).toISOString(), end: new Date(E.etMs(x.date, 960)).toISOString(), limit: '10000', feed: 'sip' });
    const j = await A(E.DATA, `/v2/stocks/${x.sym}/bars?${q}`).catch(() => null), bars = (j?.bars || []).map(b => ({ t: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }));
    const d1 = dayOne(bars); if (d1) rows.push({ ...x, year: x.date.slice(0, 4), ...d1 });
    if (i % 100 === 0) progress(`ipo study: ${i} of ${list.length} first days read`); }
  const byYear = {}; for (const y of [...new Set(rows.map(r => r.year))].sort()) byYear[y] = summarize(rows.filter(r => r.year === y));
  const big = rows.filter(r => r.price && r.open / r.price > 1.2), flat = rows.filter(r => r.price && r.open / r.price <= 1.05);
  const rep = { at: new Date().toISOString(), source, all: summarize(rows), byYear, openedHot: big.length ? summarize(big) : null, openedFlat: flat.length ? summarize(flat) : null, sample: rows.slice(-15) };
  try { fs.writeFileSync(SF, JSON.stringify(rep)); } catch {} return rep;
}
export function text(r = lastReport()) {
  if (!r) return 'IPO study: not run yet';
  const f = x => (x ? `${x.up}% higher, median ${x.median >= 0 ? '+' : ''}${x.median}%, average ${x.avg >= 0 ? '+' : ''}${x.avg}%` : 'n/a');
  return `IPO study (${r.all.ipos} US IPOs, ${r.source}), buying at the first trade on day one:\n- after 20 min: ${f(r.all.after20)}\n- after 40 min: ${f(r.all.after40)}\n- after 60 min: ${f(r.all.after60)}\n- hit +1% before -1%: ${r.all.plus1First}% of ${r.all.touched}`
    + (r.openedHot ? `\n- IPOs that opened 20%+ above their IPO price, after 40 min: ${f(r.openedHot.after40)}` : '') + (r.openedFlat ? `\n- IPOs that opened near their IPO price, after 40 min: ${f(r.openedFlat.after40)}` : '')
    + `\nBy year (higher after 40 min): ${Object.entries(r.byYear).map(([y, x]) => `${y} ${x.after40?.up ?? '--'}% (${x.ipos})`).join(', ')}`;
}
