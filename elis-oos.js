// Elis OUT-OF-SAMPLE YEAR TEST (Owner 2026-11-23): "pick a different year, send Elis in to scan and trade the newest formula,
// run it through the charts and see how we do." The formulas were found on 2024-2025; this replays a year they never saw
// (default 2023), as if live: every morning the stocks in play (top 30 by opening relative volume, price > $5, avg vol >= 1M,
// ATR > $0.50), then every 5-min candle 09:35-15:30 is checked for each formula; a hit = enter at that candle's close,
// stop 0.4 x ATR, out after 30 min (the formula's own test), one trade per stock per formula per day, 0.05R costs.
// Streams the data (nothing stored), bulk API lane, yields every session.
import * as E from './elis.js';
import * as RD from './elis-read.js';
import * as X from './elis-explain.js';
import fs from 'node:fs';
import path from 'node:path';
const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis'), SF = path.join(DIR, 'oos-reports.json');
export const reports = () => { try { return JSON.parse(fs.readFileSync(SF, 'utf8')); } catch { return {}; } };
export const lastReport = () => { const r = reports(); return Object.keys(r).length ? Object.fromEntries(Object.entries(r).map(([y, v]) => [y, { results: v.results, why: v.why?.text }])) : null; };
export const saveReport = r => { const all = reports(); all[r.year] = r; try { fs.writeFileSync(SF, JSON.stringify(all)); } catch {} };
export const YEARS = () => String(process.env.ELIS_OOS_YEARS || '2023,2020,2022').split(',').map(x => x.trim()).filter(Boolean);
export const nextYear = () => YEARS().find(y => !reports()[y]);

const pause = ms => new Promise(r => setTimeout(r, ms)), yieldNow = () => new Promise(r => setImmediate(r));
async function A(base, p) { for (let i = 0; ; i++) { try { return await E.api(base, p, {}, true); } catch (e) { if (i >= 6 || (e.status && e.status !== 429 && e.status < 500)) throw e; await pause(Math.min(60e3, 2000 * 2 ** i)); } } }
const STOP = 0.4, HOLD = 6, COST = 0.05;

// the formulas under test (from the 2024-2025 formula search); m = moment info
export const FORMULAS = {
  'midday, stock strong against the market -> go with the stock': m => m.minute >= 90 && m.minute < 210 && m.marketAgainst,
  'midday, against the market, S&P flat at the open -> go with the stock': m => m.minute >= 90 && m.minute < 210 && m.marketAgainst && Math.abs(m.spyGap) <= 0.5,
  'midday, against the market, normal volume -> go with the stock': m => m.minute >= 90 && m.minute < 210 && m.marketAgainst && m.volRatio >= 0.7 && m.volRatio < 1.5,
  'afternoon, far from VWAP in the move direction -> go with the stock': m => m.minute >= 210 && m.minute < 330 && m.vwapWith && m.vwapFar,
  'strong move alone (control) -> go with the stock': () => true
};
// one stock-day: every 5-min candle after a strong 30-min move, tested against every formula
export function tradesForDay(bars, t0, atr, spyBars, spyGap) {
  const cs = RD.to5m(bars, t0), spy = spyBars ? RD.to5m(spyBars, t0) : [], out = [], used = new Set();
  let pv = 0, vv = 0, bi = 0;
  for (let k = 6; k < cs.length - HOLD; k++) {
    const end = cs[k].t + 300e3; while (bi < bars.length && bars[bi].t < end) { const b = bars[bi++]; pv += (b.h + b.l + b.c) / 3 * b.v; vv += b.v; }
    const mv = (cs[k].c - cs[k - 6].c) / atr; if (Math.abs(mv) <= 0.6) continue;
    const up = mv > 0, s = spy[k], s6 = spy[k - 6], sm = s && s6 ? s.c / s6.c - 1 : 0, vw = vv ? pv / vv : cs[k].c;
    const prior = cs.slice(k - 6, k), avgV = prior.reduce((a, c) => a + c.v, 0) / 6;
    const m = { minute: (k + 1) * 5, marketAgainst: up ? sm < -0.0015 : sm > 0.0015, spyGap: spyGap ?? 0, volRatio: avgV ? cs[k].v / avgV : 1, vwapWith: up ? cs[k].c > vw : cs[k].c < vw, vwapFar: Math.abs(cs[k].c - vw) / atr > 0.5 };
    for (const [name, rule] of Object.entries(FORMULAS)) {
      if (used.has(name) || !rule(m)) continue;
      const e = cs[k].c, risk = STOP * atr, dir = up ? 1 : -1; let R = null;
      for (let j = k + 1; j <= k + HOLD; j++) { const c = cs[j]; if (dir > 0 ? c.l <= e - risk : c.h >= e + risk) { R = -1 - COST; break; } if (j === k + HOLD) R = dir * (c.c - e) / risk - COST; }
      if (R != null) { used.add(name); out.push({ formula: name, R, minute: m.minute, dir: up ? 'long' : 'short', entry: e, stopDist: risk, marketAgainst: m.marketAgainst, volRatio: m.volRatio, vwapWith: m.vwapWith, vwapFar: m.vwapFar, moveATR: Math.abs(mv) }); }
    }
  }
  return out;
}
export function money(trades, start = 3000, riskPct = 1, perDayMax = 3) {   // compound per session; at most 3 trades/day/formula
  let eq = start, peak = start, dd = 0; const byDay = new Map(); for (const t of trades) (byDay.get(t.date) || byDay.set(t.date, []).get(t.date)).push(t);
  for (const d of [...byDay.keys()].sort()) { const day = byDay.get(d).slice(0, perDayMax), base = eq; for (const t of day) eq += base * riskPct / 100 * t.R; eq = Math.max(eq, 0); peak = Math.max(peak, eq); dd = Math.max(dd, (peak - eq) / peak); }
  return { start, end: Math.round(eq), returnPct: Math.round((eq / start - 1) * 1000) / 10, maxDrawdownPct: Math.round(dd * 1000) / 10 };
}
export function summarize(all) {
  const out = {};
  for (const name of Object.keys(FORMULAS)) {
    const t = all.filter(x => x.formula === name).sort((a, b) => (a.date + a.minute < b.date + b.minute ? -1 : 1)), n = t.length, w = t.filter(x => x.R > 0).length, tot = t.reduce((a, x) => a + x.R, 0);
    out[name] = { trades: n, winPct: n ? Math.round(w / n * 100) : 0, avgR: n ? Math.round(tot / n * 100) / 100 : 0, totalR: Math.round(tot * 10) / 10, money3k: money(t) };
  }
  return out;
}

export const WHY_DIMS = [
  { name: 'market trend', key: 'spyTrend' },
  { name: 'market volatility', get: t => X.bucket(t.spyVol, [12, 18, 28], ['calm market (<12%)', 'normal market (12-18%)', 'nervous market (18-28%)', 'panicky market (28%+)']) },
  { name: 'S&P gap at the open', get: t => X.bucket(t.spyGap, [-0.75, -0.25, 0.25, 0.75], ['S&P gapped down hard', 'S&P gapped down', 'S&P flat', 'S&P gapped up', 'S&P gapped up hard']) },
  { name: 'time of day', get: t => X.bucket(t.minute, [60, 120, 210, 300], ['first hour', '10:30-11:30', '11:30-1:00', '1:00-2:30', 'last 90 min']) },
  { name: 'side', key: 'dir' },
  { name: 'moving against the market', get: t => (t.marketAgainst ? 'yes' : 'no') },
  { name: 'volume on the signal candle', get: t => X.bucket(t.volRatio, [0.7, 1.5, 3], ['fading', 'normal', 'rising', 'surging']) },
  { name: 'price vs VWAP', get: t => (t.vwapWith ? 'with the move' : 'against the move') + (t.vwapFar ? ', far' : '') },
  { name: 'size of the 30-min move', get: t => X.bucket(t.moveATR, [0.8, 1.2], ['0.6-0.8x range', '0.8-1.2x range', '1.2x+ range']) },
  { name: 'stock opening gap', get: t => X.bucket(t.gap, [-4, -1, 1, 4], ['gap down 4%+', 'gap down 1-4%', 'no gap', 'gap up 1-4%', 'gap up 4%+']) },
  { name: 'opening volume surge', get: t => X.bucket(t.rvol, [2, 4, 8], ['1-2x normal', '2-4x', '4-8x', '8x+']) },
  { name: 'stock volatility', get: t => X.bucket(t.atrPct, [3, 6, 10], ['calm stock', 'normal stock', 'jumpy stock', 'very jumpy stock']) },
  { name: 'month', get: t => t.date?.slice(0, 7) }
];
export async function run({ year = '2023', progress = null, shouldStop = () => false, perDay = 30 } = {}) {
  const from = `${year}-01-01`, to = `${year}-12-31`, warm = new Date(Date.parse(from) - 50 * 86400e3).toISOString().slice(0, 10);
  const cal = (await A(E.BASE, `/v2/calendar?start=${warm}&end=${to}`)).map(c => c.date), N = cal.length, di = new Map(cal.map((d, i) => [d, i]));
  const assets = []; for (const st of ['active', 'inactive']) { try { assets.push(...await A(E.BASE, `/v2/assets?status=${st}&asset_class=us_equity`)); } catch {} }
  const syms = [...new Set(assets.filter(a => /^[A-Z]{1,5}$/.test(a.symbol) && ['NASDAQ', 'NYSE', 'ARCA', 'AMEX', 'BATS'].includes(a.exchange)).map(a => a.symbol))];
  progress?.(`${year} test: daily bars for ${syms.length} symbols`);
  const D = new Map();
  for (let i = 0; i < syms.length; i += 100) {
    if (shouldStop()) return { paused: true };
    const raw = {}; let token = '';
    do { const qs = new URLSearchParams({ symbols: syms.slice(i, i + 100).join(','), timeframe: '1Day', start: warm, end: to, feed: 'sip', limit: '10000', adjustment: 'split' }); if (token) qs.set('page_token', token);
      const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); for (const [s, arr] of Object.entries(j.bars || {})) (raw[s] ||= []).push(...arr); token = j.next_page_token || ''; } while (token);
    for (const [s, arr] of Object.entries(raw)) {
      if (arr.filter(x => x.v >= 1e6).length < 10 || Math.max(...arr.map(x => x.c)) < 5) continue;
      const o = new Float32Array(N).fill(NaN), h = o.slice(), l = o.slice(), c = o.slice(), v = o.slice();
      for (const x of arr) { const k = di.get(x.t.slice(0, 10)); if (k === undefined) continue; o[k] = x.o; h[k] = x.h; l[k] = x.l; c[k] = x.c; v[k] = x.v; }
      D.set(s, { o, h, l, c, v });
    }
  }
  const win = {}, all = []; let sessions = 0;
  for (let k = 15; k < N; k++) {
    const d = cal[k]; if (shouldStop()) return { paused: true, partial: summarize(all), sessions };
    const elig = [];
    for (const [s, x] of D) { if (s === 'SPY') continue; let ok = 0, vs = 0, trs = 0; for (let j = k - 14; j < k; j++) if (!isNaN(x.c[j])) { ok++; vs += x.v[j]; trs += Math.max(x.h[j] - x.l[j], Math.abs(x.h[j] - (x.c[j - 1] || x.c[j])), Math.abs(x.l[j] - (x.c[j - 1] || x.c[j]))); }
      const prev = x.c[k - 1]; if (ok < 13 || isNaN(prev) || isNaN(x.o[k])) continue; const avgVol = vs / ok, atr = trs / ok; if (prev < 5 || avgVol < 1e6 || atr <= 0.5) continue; elig.push({ s, atr }); }
    const first = {}, ask = [...elig.map(e => e.s), 'SPY'];
    for (let i = 0; i < ask.length; i += 100) { const qs = new URLSearchParams({ symbols: ask.slice(i, i + 100).join(','), timeframe: '5Min', start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 575)).toISOString(), feed: 'sip', limit: '10000' });
      const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); for (const [s, arr] of Object.entries(j.bars || {})) if (arr[0]) first[s] = arr[0]; }
    const cands = [];
    for (const e of elig) { const fb = first[e.s], w = win[e.s] || []; if (!fb) continue; win[e.s] = [...w, fb.v].slice(-14); if (w.length < 10 || d < from) continue; const rvol = fb.v / (w.reduce((a, b) => a + b, 0) / w.length); if (rvol >= 1) cands.push({ ...e, rvol }); }
    if (d >= from && cands.length) {
      const top = cands.sort((a, b) => b.rvol - a.rvol).slice(0, perDay), bars = {}, spy = D.get('SPY'), spyGap = spy && first.SPY ? (first.SPY.o / spy.c[k - 1] - 1) * 100 : 0;
      const list = [...top.map(c => c.s), 'SPY'];
      for (let i = 0; i < list.length; i += 50) { let token = '';
        do { const qs = new URLSearchParams({ symbols: list.slice(i, i + 50).join(','), timeframe: '1Min', start: new Date(E.etMs(d, 570)).toISOString(), end: new Date(E.etMs(d, 960)).toISOString(), feed: 'sip', limit: '10000', adjustment: 'split' }); if (token) qs.set('page_token', token);
          const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); for (const [s, arr] of Object.entries(j.bars || {})) (bars[s] ||= []).push(...arr.map(b => ({ t: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v }))); token = j.next_page_token || ''; } while (token); }
      let spyTrend = null, spyVol = null; if (spy) { const cl = []; for (let j = k - 20; j < k; j++) if (!isNaN(spy.c[j])) cl.push(spy.c[j]); if (cl.length >= 15) { const sma = cl.reduce((a, b) => a + b, 0) / cl.length; spyTrend = spy.c[k - 1] >= sma ? 'market uptrend' : 'market downtrend'; const rr = cl.slice(1).map((c, i) => Math.log(c / cl[i])), mu = rr.reduce((a, b) => a + b, 0) / rr.length; spyVol = Math.sqrt(rr.reduce((a, b) => a + (b - mu) ** 2, 0) / rr.length * 252) * 100; } }
      for (const c of top) { const x = D.get(c.s), gap = x && first[c.s] ? (first[c.s].o / x.c[k - 1] - 1) * 100 : null;
        for (const t of tradesForDay(bars[c.s] || [], E.etMs(d, 570), c.atr, bars.SPY, spyGap)) all.push({ date: d, sym: c.s, ...t, rvol: c.rvol, gap, atrPct: x ? c.atr / x.c[k - 1] * 100 : null, spyGap, spyTrend, spyVol }); }
      sessions++; if (sessions % 25 === 0) progress?.(`${year} test: ${sessions} sessions, ${all.length} formula trades`);
    }
    await yieldNow();
  }
  const main = all.filter(t => /^strong move alone/.test(t.formula));   // every strong-move trade: the widest base for the why
  const why = X.explain(main, WHY_DIMS);
  const whyFormula = X.explain(all.filter(t => /^midday, stock strong against the market -> go/.test(t.formula)), WHY_DIMS, { minN: 15 });
  return { year, sessions, results: summarize(all), trades: all.length, why, whyFormula, sample: all.slice(-20) };
}
export function text(r) {
  const f = v => '$' + Math.round(v).toLocaleString('en-US');
  return `Out-of-sample year ${r.year} (${r.sessions} sessions, formulas found on 2024-2025, never on ${r.year}). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:\n`
    + Object.entries(r.results).map(([n, x]) => `- ${n}: ${x.trades} trades, ${x.winPct}% wins, avg ${x.avgR}R, total ${x.totalR}R -> ${f(x.money3k.start)} became ${f(x.money3k.end)} (${x.money3k.returnPct >= 0 ? '+' : ''}${x.money3k.returnPct}%, max drawdown ${x.money3k.maxDrawdownPct}%)`).join('\n')
    + (r.why ? `\n\nWHY (all strong-move trades in ${r.year}):\n${r.why.text}` : '') + (r.whyFormula ? `\n\nWHY (midday relative-strength formula):\n${r.whyFormula.text}` : '');
}
