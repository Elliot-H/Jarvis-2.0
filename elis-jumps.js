// Elis BIG-JUMP STUDY (Owner 2026-11-23): "look at the stocks that made large jumps up and down, study everything around
// them, layer them on top of each other and find what they have in common - in both directions."
// Done the honest way: every sign seen before a jump is compared with how often the same sign appears before ORDINARY days.
// A sign only matters if it makes a jump clearly MORE likely, in 2024 (learn) and again in 2025+ (unseen).
//   jump  = a liquid stock (price > $5, 20-day avg volume >= 1M) closes >= +8% or <= -8% vs the prior close
//   signs = only what was knowable at the open: prior 1/5-day move, prior-day volume vs normal, range expansion, distance from the
//           20-day high/low, opening gap, SPY's prior day, price/volatility level, weekday, and pre-open news (tone/type, Benzinga via Alpaca)
//   trade = for each sign, what buying (or shorting) at the open and selling at the close returned on average, after 0.1% costs
import fs from 'node:fs';
import path from 'node:path';
import * as E from './elis.js';
import * as RD from './elis-read.js';
import { catOf } from './elis-learn.js';

const DIR = path.join(process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || './data', 'elis');
const SF = path.join(DIR, 'jumps-state.json'), RF = path.join(DIR, 'jumps-report.json');
const load = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const save = (f, v) => { try { fs.writeFileSync(f, JSON.stringify(v)); } catch {} };
export const state = () => load(SF, { done: false });
export const lastReport = () => load(RF, null);
export const JUMP = 0.08, COST = 0.001;
const pause = ms => new Promise(r => setTimeout(r, ms)), yieldNow = () => new Promise(r => setImmediate(r));
async function A(base, p) { for (let i = 0; ; i++) { try { return await E.api(base, p, {}, true); } catch (e) { if (i >= 6 || (e.status && e.status !== 429 && e.status < 500)) throw e; await pause(Math.min(60e3, 2000 * 2 ** i)); } } }

// ---------- signs knowable at the open (pure) ----------
const b = (x, cuts, names) => { for (let i = 0; i < cuts.length; i++) if (x < cuts[i]) return names[i]; return names[cuts.length]; };
export function signs(x, k, spyRet) {   // x: {o,h,l,c,v} typed arrays; k: session index (the jump day)
  const c1 = x.c[k - 1], r1 = c1 / x.c[k - 2] - 1, r5 = c1 / x.c[k - 6] - 1;
  let v20 = 0, rg = 0, hi = -Infinity, lo = Infinity; for (let j = k - 20; j < k; j++) { v20 += x.v[j]; rg += (x.h[j] - x.l[j]) / x.c[j]; hi = Math.max(hi, x.h[j]); lo = Math.min(lo, x.l[j]); }
  v20 /= 20; rg /= 20; const rgY = (x.h[k - 1] - x.l[k - 1]) / c1, gap = x.o[k] / c1 - 1;
  return {
    prior1: b(r1, [-0.05, -0.015, 0.015, 0.05], ['prev-day-down-big', 'prev-day-down', 'prev-day-flat', 'prev-day-up', 'prev-day-up-big']),
    prior5: b(r5, [-0.1, -0.03, 0.03, 0.1], ['5d-down-big', '5d-down', '5d-flat', '5d-up', '5d-up-big']),
    volY: b(x.v[k - 1] / v20, [0.7, 1.5, 3], ['prev-vol-low', 'prev-vol-normal', 'prev-vol-high', 'prev-vol-surge']),
    rangeY: b(rgY / rg, [0.7, 1.5], ['prev-range-tight', 'prev-range-normal', 'prev-range-wide']),
    near: c1 >= hi * 0.98 ? 'at-20d-high' : c1 <= lo * 1.02 ? 'at-20d-low' : 'mid-range',
    gap: b(gap, [-0.04, -0.01, 0.01, 0.04], ['gap-down-big', 'gap-down', 'no-gap', 'gap-up', 'gap-up-big']),
    spyY: spyRet == null ? 'spy-?' : b(spyRet, [-0.01, 0.01], ['spy-fell', 'spy-flat', 'spy-rose']),
    price: b(c1, [10, 30, 100], ['price-5-10', 'price-10-30', 'price-30-100', 'price-100+']),
    volat: b(rg, [0.02, 0.04, 0.07], ['calm-stock', 'normal-stock', 'jumpy-stock', 'very-jumpy-stock'])
  };
}
export const PRICE_SIGNS = ['prior1', 'prior5', 'volY', 'rangeY', 'near', 'gap', 'spyY', 'price', 'volat'];
export const COMBOS = (() => { const S = PRICE_SIGNS, o = []; for (let a = 0; a < S.length; a++) { o.push([S[a]]); for (let c = a + 1; c < S.length; c++) { o.push([S[a], S[c]]); for (let d = c + 1; d < S.length; d++) o.push([S[a], S[c], S[d]]); } } return o; })();

// accumulator: per combo value -> n, ups, downs, sum of open->close return
export const newAcc = () => ({ n: 0, up: 0, down: 0, m: new Map() });
export function addDay(A, f, ret, oc) {   // ret: close/prevClose - 1 (defines the jump); oc: open->close return (the tradeable part)
  const up = ret >= JUMP, dn = ret <= -JUMP; A.n++; if (up) A.up++; if (dn) A.down++;
  for (const cb of COMBOS) { const key = cb.map(s => f[s]).join(' + '); let a = A.m.get(key); if (!a) A.m.set(key, a = { n: 0, up: 0, down: 0, oc: 0 }); a.n++; if (up) a.up++; if (dn) a.down++; a.oc += oc; }
}
// signs that make a jump more likely in BOTH periods (lift vs the base rate), with what trading them at the open returned
export function compare(tr, te, { minN = 400, lift = 1.5 } = {}) {
  const out = [];
  for (const dir of ['up', 'down']) {
    const bTr = tr[dir] / tr.n, bTe = te[dir] / te.n;
    for (const [key, a] of tr.m) {
      if (a.n < minN) continue; const pTr = a[dir] / a.n; if (pTr / bTr < lift) continue;
      const u = te.m.get(key); if (!u || u.n < minN / 3) continue; const pTe = u[dir] / u.n; if (pTe / bTe < lift * 0.8) continue;
      const side = dir === 'up' ? 1 : -1;
      out.push({ dir, signs: key, learn: { n: a.n, odds: r3(pTr), lift: r2(pTr / bTr), tradeAtOpen: r4(side * a.oc / a.n - COST) },
        unseen: { n: u.n, odds: r3(pTe), lift: r2(pTe / bTe), tradeAtOpen: r4(side * u.oc / u.n - COST) } });
    }
  }
  return out.sort((x, y) => y.unseen.lift * Math.log(y.unseen.n) - x.unseen.lift * Math.log(x.unseen.n));
}
const r2 = x => Math.round(x * 100) / 100, r3 = x => Math.round(x * 1000) / 1000, r4 = x => Math.round(x * 10000) / 10000;

// ---------- the study (network, bulk lane, resumable enough to rerun) ----------
export async function run({ from = '2024-01-02', split = '2025-01-01', progress = null, shouldStop = () => false } = {}) {
  const today = E.et().date, warm = new Date(Date.parse(from) - 45 * 86400e3).toISOString().slice(0, 10);
  const cal = (await A(E.BASE, `/v2/calendar?start=${warm}&end=${today}`)).map(c => c.date).filter(d => d < today), N = cal.length, di = new Map(cal.map((d, i) => [d, i]));
  const assets = []; for (const st of ['active', 'inactive']) { try { assets.push(...await A(E.BASE, `/v2/assets?status=${st}&asset_class=us_equity`)); } catch {} }
  const syms = [...new Set(assets.filter(a => /^[A-Z]{1,5}$/.test(a.symbol) && ['NASDAQ', 'NYSE', 'ARCA', 'AMEX', 'BATS'].includes(a.exchange)).map(a => a.symbol))];
  progress?.(`jump study: daily bars for ${syms.length} symbols, ${cal.filter(d => d >= from).length} sessions`);
  const D = new Map();
  for (let i = 0; i < syms.length; i += 100) {
    if (shouldStop()) return { paused: true };
    const raw = {}; let token = '';
    do { const qs = new URLSearchParams({ symbols: syms.slice(i, i + 100).join(','), timeframe: '1Day', start: warm, end: cal.at(-1), feed: 'sip', limit: '10000', adjustment: 'split' }); if (token) qs.set('page_token', token);
      const j = await A(E.DATA, `/v2/stocks/bars?${qs}`); for (const [s, arr] of Object.entries(j.bars || {})) (raw[s] ||= []).push(...arr); token = j.next_page_token || ''; } while (token);
    for (const [s, arr] of Object.entries(raw)) {
      if (arr.filter(x => x.v >= 1e6).length < 20 || Math.max(...arr.map(x => x.c)) < 5) continue;
      const o = new Float32Array(N).fill(NaN), h = o.slice(), l = o.slice(), c = o.slice(), v = o.slice();
      for (const x of arr) { const k = di.get(x.t.slice(0, 10)); if (k === undefined) continue; o[k] = x.o; h[k] = x.h; l[k] = x.l; c[k] = x.c; v[k] = x.v; }
      D.set(s, { o, h, l, c, v });
    }
    if (i % 2000 === 0) progress?.(`jump study: ${i}/${syms.length} symbols loaded`);
  }
  const spy = D.get('SPY');
  const tr = newAcc(), te = newAcc(), jumps = [], controls = []; let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let k = 22; k < N; k++) {
    const d = cal[k]; if (d < from) continue;
    const spyRet = spy && spy.c[k - 1] && spy.c[k - 2] ? spy.c[k - 1] / spy.c[k - 2] - 1 : null, acc = d < split ? tr : te;
    for (const [s, x] of D) {
      if (s === 'SPY' || isNaN(x.c[k]) || isNaN(x.o[k])) continue;
      let ok = true, v20 = 0; for (let j = k - 21; j < k; j++) { if (isNaN(x.c[j])) { ok = false; break; } if (j >= k - 20) v20 += x.v[j]; } if (!ok) continue;
      if (x.c[k - 1] < 5 || v20 / 20 < 1e6) continue;
      const f = signs(x, k, spyRet), ret = x.c[k] / x.c[k - 1] - 1, oc = x.c[k] / x.o[k] - 1;
      addDay(acc, f, ret, oc);
      if (Math.abs(ret) >= JUMP) jumps.push({ d, s, dir: ret > 0 ? 'up' : 'down', oc, f }); else if (rnd() < 0.004) controls.push({ d, s, oc, f });
    }
    await yieldNow(); if (k % 40 === 0) progress?.(`jump study: through ${d}, ${jumps.length} jumps`);   // yield every session: never freeze the server
  }
  // pre-open news for every jump and the control sample (18 h before the open), batched per day
  progress?.(`jump study: news for ${jumps.length} jumps + ${controls.length} ordinary days`);
  const byDay = new Map(); for (const x of [...jumps, ...controls]) (byDay.get(x.d) || byDay.set(x.d, []).get(x.d)).push(x);
  for (const [d, xs] of byDay) {
    if (shouldStop()) return { paused: true };
    for (let i = 0; i < xs.length; i += 40) {
      const part = xs.slice(i, i + 40), q = new URLSearchParams({ symbols: [...new Set(part.map(x => x.s))].join(','), start: new Date(E.etMs(d, 570) - 18 * 3600e3).toISOString(), end: new Date(E.etMs(d, 570)).toISOString(), limit: '50' });
      try { const j = await A(E.DATA, `/v1beta1/news?${q}`); for (const x of part) { const hs = (j.news || []).filter(n => (n.symbols || []).includes(x.s)).map(n => n.headline); x.news = hs.length ? `${RD.toneOf(hs)}/${catOf(hs.join(' '), true)}` : 'no-news'; } } catch { for (const x of part) x.news = 'news-?'; }
    }
  }
  // news signs: how much more common before jumps than before ordinary days (controls = what "normal" looks like)
  const newsStats = {}, isTr = x => x.d < split;
  for (const [grp, xs] of [['jump-up', jumps.filter(x => x.dir === 'up')], ['jump-down', jumps.filter(x => x.dir === 'down')], ['ordinary', controls]])
    for (const per of ['learn', 'unseen']) for (const x of xs.filter(x => (per === 'learn') === isTr(x))) { const t = ((newsStats[x.news] ||= {})[per] ||= {}); t[grp] = (t[grp] || 0) + 1; }
  const tot = (per, g) => Object.values(newsStats).reduce((s, v) => s + (v[per]?.[g] || 0), 0);
  const newsSigns = Object.entries(newsStats).map(([k, v]) => {
    const row = {}; for (const per of ['learn', 'unseen']) { const o = (v[per]?.ordinary || 0) / Math.max(1, tot(per, 'ordinary')); row[per] = { beforeUpJumps: r3((v[per]?.['jump-up'] || 0) / Math.max(1, tot(per, 'jump-up'))), beforeDownJumps: r3((v[per]?.['jump-down'] || 0) / Math.max(1, tot(per, 'jump-down'))), beforeOrdinaryDays: r3(o) }; }
    return { news: k, ...row };
  }).filter(x => (x.learn.beforeOrdinaryDays > 0 || x.learn.beforeUpJumps > 0.02));
  const price = compare(tr, te);
  const report = { at: new Date().toISOString(), from, split, sessions: cal.filter(d => d >= from).length, stockDays: tr.n + te.n, base: { learn: { up: r4(tr.up / tr.n), down: r4(tr.down / tr.n) }, unseen: { up: r4(te.up / te.n), down: r4(te.down / te.n) } },
    jumps: jumps.length, controls: controls.length, priceSigns: price.slice(0, 40), newsSigns };
  save(RF, report); save(SF, { done: true, at: report.at });
  return report;
}
export function text(rep) {
  if (!rep) return 'no report';
  const pct = x => (x * 100).toFixed(x < 0.01 ? 2 : 1) + '%', t = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(2) + '%';
  const line = s => `${s.dir === 'up' ? 'UP' : 'DOWN'} 8%+ day after: ${s.signs}\n   odds ${pct(s.unseen.odds)} in 2025 (normal ${pct(rep.base.unseen[s.dir])}, ${s.unseen.lift}x, ${s.unseen.n.toLocaleString('en-US')} cases) | 2024 ${pct(s.learn.odds)} (${s.learn.lift}x) | trade at the open: ${t(s.unseen.tradeAtOpen)} avg 2025, ${t(s.learn.tradeAtOpen)} 2024`;
  const up = rep.priceSigns.filter(s => s.dir === 'up').slice(0, 6), dn = rep.priceSigns.filter(s => s.dir === 'down').slice(0, 6);
  const nw = rep.newsSigns.filter(x => x.news !== 'news-?').sort((a, b) => (b.unseen.beforeUpJumps + b.unseen.beforeDownJumps - 2 * b.unseen.beforeOrdinaryDays) - (a.unseen.beforeUpJumps + a.unseen.beforeDownJumps - 2 * a.unseen.beforeOrdinaryDays)).slice(0, 6);
  return `${rep.stockDays.toLocaleString('en-US')} stock-days, ${rep.jumps.toLocaleString('en-US')} jumps of 8%+ (${rep.from} to now; learned on 2024, checked on 2025+).\n`
    + `Normal odds of an 8%+ day: up ${pct(rep.base.unseen.up)}, down ${pct(rep.base.unseen.down)}.\n\n`
    + (up.length ? up.map(line).join('\n') : 'No sign raised the odds of a big UP day in both years.') + '\n\n'
    + (dn.length ? dn.map(line).join('\n') : 'No sign raised the odds of a big DOWN day in both years.') + '\n\n'
    + 'Pre-market news before jumps vs before ordinary days (2025):\n' + nw.map(x => `   ${x.news}: before up-jumps ${pct(x.unseen.beforeUpJumps)}, before down-jumps ${pct(x.unseen.beforeDownJumps)}, before ordinary days ${pct(x.unseen.beforeOrdinaryDays)}`).join('\n');
}
