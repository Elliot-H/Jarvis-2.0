// Pre-market read for US stocks: gap vs prior close, pre-market high/low/VWAP, volume vs usual (conviction), IEX prints.
// Yahoo 5m bars with pre/post included. Facts only; outlook.js fuses them. Analysis only, never trades.
import { ySymbol } from './chart.js';
import * as trade from './trade.js';

const r2 = v => (v == null || !Number.isFinite(v) ? null : Math.abs(v) >= 1 ? Number(v.toFixed(2)) : Number(v.toPrecision(3)));
const nyParts = t => { // seconds -> { date, mins } in New York
  const d = new Date(t * 1000), p = Object.fromEntries(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(d).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, mins: (Number(p.hour) % 24) * 60 + Number(p.minute) };
};
const PRE_START = 4 * 60, OPEN = 9 * 60 + 30;

async function extBars(sym) { // 5-minute bars incl. pre/post market, last 5 days
  const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(sym)}?interval=5m&range=5d&includePrePost=true`, {
    headers: { 'User-Agent': 'Mozilla/5.0 Jarvis', Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
  if (!r.ok) throw new Error(`Pre-market data source returned ${r.status} for ${sym}.`);
  const res = (await r.json())?.chart?.result?.[0];
  if (!res?.timestamp) throw new Error(`No pre-market data for ${sym}.`);
  const q = res.indicators.quote[0], out = [];
  res.timestamp.forEach((t, i) => { if (q.close[i] != null && q.open[i] != null) out.push({ t, o: q.open[i], h: q.high[i], l: q.low[i], c: q.close[i], v: q.volume?.[i] || 0 }); });
  return out;
}

// Pre-market stats for the most recent session that has any pre-market bars, vs the prior regular-session close.
export async function premarket(symbol) {
  const sym = ySymbol(symbol); if (!sym || sym.endsWith('-USD')) return { available: false, why: 'Pre-market applies to US stocks only.' };
  const all = await extBars(sym);
  const byDay = {};
  for (const b of all) { const p = nyParts(b.t); (byDay[p.date] ||= { pre: [], reg: [] })[p.mins >= PRE_START && p.mins < OPEN ? 'pre' : p.mins >= OPEN && p.mins < 16 * 60 ? 'reg' : 'x']?.push(b); }
  const days = Object.keys(byDay).sort();
  const today = [...days].reverse().find(d => byDay[d].pre.length);
  if (!today) return { available: false, why: 'No pre-market bars found (market closed or not trading pre-market).' };
  const prevDay = [...days].reverse().find(d => d < today && byDay[d].reg.length);
  if (!prevDay) return { available: false, why: 'No prior close to compare against.' };
  const prevClose = byDay[prevDay].reg[byDay[prevDay].reg.length - 1].c;
  const pre = byDay[today].pre, vol = pre.reduce((a, x) => a + x.v, 0);
  const pv = pre.reduce((a, x) => a + ((x.h + x.l + x.c) / 3) * x.v, 0);
  const hi = Math.max(...pre.map(x => x.h)), lo = Math.min(...pre.map(x => x.l)), last = pre[pre.length - 1].c;
  const vwap = vol ? pv / vol : null;
  // Baseline: pre-market volume on the earlier days in this window, cut to the same time of day.
  const cut = nyParts(pre[pre.length - 1].t).mins;
  const hist = days.filter(d => d < today && byDay[d].pre.length).map(d => byDay[d].pre.filter(x => nyParts(x.t).mins <= cut).reduce((a, x) => a + x.v, 0)).filter(v => v > 0);
  const base = hist.length ? hist.reduce((a, b) => a + b, 0) / hist.length : null;
  const volRatio = base ? vol / base : null;
  const gapPct = (last / prevClose - 1) * 100;
  const conviction = vol < 20000 || (volRatio != null && volRatio < 0.5) ? 'thin' : volRatio != null && volRatio >= 1.5 ? 'heavy' : volRatio != null || vol >= 100000 ? 'normal' : 'thin';
  let prints = null;
  if (trade.configured()) {
    try {
      const d0 = new Date(Date.UTC(+today.slice(0, 4), +today.slice(5, 7) - 1, +today.slice(8, 10), 8)).toISOString(), d1 = new Date(pre[pre.length - 1].t * 1000 + 300000).toISOString();
      const tr = await trade.stockTrades(sym, d0, d1);
      if (tr.length) prints = { count: tr.length, shares: tr.reduce((a, x) => a + x.s, 0), largest: tr.sort((a, b) => b.s - a.s).slice(0, 3).map(x => ({ price: r2(x.p), shares: x.s })), note: 'IEX feed only, a slice of total prints' };
    } catch (e) { prints = { unavailable: e.message.slice(0, 120) }; }
  }
  return {
    available: true, sessionDate: today, priorClose: r2(prevClose), last: r2(last), gapPct: r2(gapPct), gapKind: Math.abs(gapPct) < 0.3 ? 'flat' : gapPct > 0 ? 'gap up' : 'gap down',
    high: r2(hi), low: r2(lo), vwap: r2(vwap), aboveVwap: vwap ? last > vwap : null, volume: vol, avgPremarketVolumeSameTime: base ? Math.round(base) : null, volumeVsAvg: r2(volRatio),
    conviction, prints, lastBarTime: new Date(pre[pre.length - 1].t * 1000).toISOString(),
    caveat: pre.length < 6 ? 'Early in pre-market; few bars so far.' : undefined
  };
}
