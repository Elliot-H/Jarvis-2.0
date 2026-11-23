// Elis "Wave": opening-wave day trading on Stocks in Play (Owner's request 2026-11-23, paper, 100% automated).
// Model: Zarattini, Barbon & Aziz (2024) "A Profitable Day Trading Strategy For The U.S. Equity Market" (5-minute
// Opening Range Breakout on Stocks in Play), plus the Owner's own pre-market routine (news + pre-market movement, top 3).
//   ~09:15 ET  build the day's universe: Alpaca most-actives + top movers + symbols in the last 18 h of news + a liquid core list.
//              Keep price > $5, 14-day avg volume >= 1M, 14-day ATR > $0.50. Load each one's average first-5-minute volume (14 days).
//   09:35      Stocks in Play = first 5-min bar volume / its 14-day average (Relative Volume) >= 100%.
//              Score = RVOL x 1.25 if it has fresh news. Pick the top ELIS_WAVE_PICKS (default 3).
//              Direction = colour of the first 5-min candle (green long, red short, doji skipped).
//   09:35-11:00 Enter when price breaks the opening-range high (long) / low (short): market order + protective stop
//              at entry -/+ 10% of the 14-day ATR (the paper's stop). 1% account risk per trade, exposure capped by buying power.
//   Exit (context-driven, Owner 2026-11-23: "3:55 loses the wave unless the stock is winning all day"):
//              - after +1R the stop moves to break-even, then trails 1R behind the best price;
//              - 11:00 keep-or-sell: keep only if >= +1R, on the right side of VWAP and the last 30 min still move its way;
//              - runners: trailing stop, out on a 1-min close back through VWAP; everything flat by 15:55.
//              ELIS_WAVE_EXIT=HH:MM replaces this with a plain timed exit (the paper exits at the close).
// Orders carry client_order_id elisw-YYYYMMDD-SYMBOL-*, so the ELIS panel counts them and nothing else is touched.
import * as E from './elis.js';

const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
const hm = (v, d) => { const m = String(v || '').match(/^(\d{1,2}):(\d{2})$/); return m ? Number(m[1]) * 60 + Number(m[2]) : d; };
const env = process.env;
export const W = {
  picks: num(env.ELIS_WAVE_PICKS, 3),
  riskPct: num(env.ELIS_WAVE_RISK_PCT, 1),
  stopAtr: num(env.ELIS_WAVE_STOP_ATR, 0.10),
  minPrice: 5, minAvgVol: 1e6, minAtr: 0.5, minRvol: 1, newsBoost: 1.25,
  scanAt: 9 * 60 + 15, orbEnd: 9 * 60 + 35, entryEnd: hm(env.ELIS_WAVE_ENTRY_END, 11 * 60),
  decideAt: hm(env.ELIS_WAVE_DECIDE, 11 * 60),            // keep-or-sell check (context exit); ELIS_WAVE_EXIT=HH:MM forces a plain timed exit instead
  exitAt: hm(env.ELIS_WAVE_EXIT, 15 * 60 + 55), smartExit: !hm(env.ELIS_WAVE_EXIT, 0), keepMinR: num(env.ELIS_WAVE_KEEP_R, 1), trailR: num(env.ELIS_WAVE_TRAIL_R, 1),
  allowShort: !/^(0|false)$/i.test(String(env.ELIS_WAVE_SHORT || '').trim())
};
// Liquid core: large caps that are often "in play" (earnings, news). Screeners and news add the day's movers on top.
export const CORE = 'AAPL MSFT NVDA AMZN GOOGL META TSLA AMD AVGO NFLX ORCL CRM ADBE INTC MU QCOM TXN AMAT LRCX KLAC MRVL ARM SMCI PLTR SNOW CRWD PANW NET DDOG ZS SHOP UBER LYFT ABNB DASH COIN HOOD SQ PYPL SOFI AFRM RIVN LCID NIO F GM BA DAL UAL AAL CCL RCL NCLH DIS WBD PARA ROKU SPOT PINS SNAP RBLX U TTD JPM BAC C WFC GS MS SCHW XOM CVX OXY SLB HAL COP DVN MRNA PFE BNTX JNJ LLY ABBV MRK BMY GILD AMGN REGN VRTX BIIB CVS UNH HUM WMT TGT COST HD LOW NKE SBUX MCD CMG LULU DKNG PENN MARA RIOT MSTR CLSK BABA JD PDD BIDU SE TSM ASML DELL HPQ WDC STX ON MCHP NXPI ENPH FSLR RUN PLUG CHPT GME AMC'.split(' ');
const CATALYST = /\b(fda|approv|clearance|phase|trial|earnings|beats?|revenue|guidance|raises?|upgrade|downgrade|contract|award|partnership|acqui|merger|buyout|ipo|launch|record|patent|settle|lawsuit|sec |investigat)/i;

const S = { day: null, lastMinute: -1, universe: null, info: {}, picks: [], trades: {}, flattened: false, scanned: false, picked: false, lastErr: null, log: [] };
const note = m => { S.log.unshift(`${new Date().toISOString().slice(11, 16)}Z ${m}`); S.log.length = Math.min(S.log.length, 30); E.noteOut('wave: ' + m); };
const tag = (date, sym) => `elisw-${date.replace(/-/g, '')}-${sym}`;
const chunk = (a, n) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));
const q = o => new URLSearchParams(o).toString();

async function multiBars(symbols, timeframe, startMs, endMs, feed) {
  const out = {};
  for (const part of chunk(symbols, 100)) {
    let token = '';
    do {
      const p = { symbols: part.join(','), timeframe, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString(), feed, limit: '10000', adjustment: 'split' };
      if (token) p.page_token = token;
      const j = await E.api(E.DATA, `/v2/stocks/bars?${q(p)}`);
      for (const [s, arr] of Object.entries(j.bars || {})) (out[s] ||= []).push(...arr.map(b => ({ t: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v })));
      token = j.next_page_token || '';
    } while (token);
  }
  return out;
}
const atr14 = d => { const tr = d.slice(1).map((b, i) => Math.max(b.h - b.l, Math.abs(b.h - d[i].c), Math.abs(b.l - d[i].c))); const x = tr.slice(-14); return x.length ? x.reduce((a, b) => a + b, 0) / x.length : 0; };

// ---- pre-open scan: universe + daily stats + 14-day average opening-5-minute volume (IEX, same feed as the live bar)
async function scan(date) {
  const syms = new Set(CORE), news = {};
  try { const a = await E.api(E.DATA, '/v1beta1/screener/stocks/most-actives?by=volume&top=100'); for (const x of a.most_actives || []) syms.add(x.symbol); } catch (e) { note('most-actives unavailable: ' + e.message); }
  try { const m = await E.api(E.DATA, '/v1beta1/screener/stocks/movers?top=50'); for (const x of [...(m.gainers || []), ...(m.losers || [])]) syms.add(x.symbol); } catch (e) { note('movers unavailable: ' + e.message); }
  try {
    let token = '', pages = 0;
    do {
      const j = await E.api(E.DATA, `/v1beta1/news?${q({ start: new Date(Date.now() - 18 * 3600e3).toISOString(), limit: '50', sort: 'desc', ...(token ? { page_token: token } : {}) })}`);
      for (const n of j.news || []) for (const s of n.symbols || []) { syms.add(s); (news[s] ||= []).push(n.headline); }
      token = j.next_page_token || ''; pages++;
    } while (token && pages < 6);
  } catch (e) { note('news unavailable: ' + e.message); }
  const list = [...syms].filter(s => /^[A-Z]{1,5}$/.test(s) && s !== E.CFG.symbol);
  const daily = await multiBars(list, '1Day', Date.now() - 40 * 86400e3, E.etMs(date, 0), 'sip');
  const info = {};
  for (const s of list) {
    const d = daily[s] || []; if (d.length < 15) continue;
    const last14 = d.slice(-14), avgVol = last14.reduce((a, b) => a + b.v, 0) / 14, atr = atr14(d), close = d.at(-1).c;
    if (close < W.minPrice || avgVol < W.minAvgVol || atr <= W.minAtr) continue;
    const hl = (news[s] || []).find(h => CATALYST.test(h)) || (news[s] || [])[0] || '';
    info[s] = { prevClose: close, avgVol, atr, news: !!news[s], headline: hl };
  }
  // 14-day average first-5-minute volume, one request window per past session
  const cal = await E.api(E.BASE, `/v2/calendar?${q({ start: new Date(Date.now() - 30 * 86400e3).toISOString().slice(0, 10), end: date })}`);
  const past = cal.map(c => c.date).filter(d => d < date).slice(-14), ok = Object.keys(info), sum = {}, cnt = {};
  for (const d of past) {
    const b = await multiBars(ok, '5Min', E.etMs(d, 570), E.etMs(d, 575), 'iex');
    for (const [s, arr] of Object.entries(b)) if (arr[0]) { sum[s] = (sum[s] || 0) + arr[0].v; cnt[s] = (cnt[s] || 0) + 1; }
  }
  for (const s of ok) if (cnt[s] >= 10) info[s].avgOpenVol = sum[s] / cnt[s]; else delete info[s];
  S.info = info; S.scanned = true;
  note(`scan: ${list.length} symbols, ${Object.keys(info).length} pass price/volume/ATR`);
}

// ---- 09:35: rank by opening Relative Volume, pick the top N
export function rank(info, firstBars, w = W) {
  const c = [];
  for (const [s, b] of Object.entries(firstBars)) {
    const i = info[s]; if (!i || !b || !i.avgOpenVol) continue;
    const rvol = b.v / i.avgOpenVol; if (rvol < w.minRvol || b.o < w.minPrice) continue;
    const dir = b.c > b.o ? 'long' : b.c < b.o ? 'short' : null; if (!dir || (dir === 'short' && !w.allowShort)) continue;
    c.push({ sym: s, dir, rvol: Math.round(rvol * 100) / 100, score: rvol * (i.news ? w.newsBoost : 1), orHigh: Math.round(b.h * 100) / 100, orLow: Math.round(b.l * 100) / 100, open: b.o, atr: i.atr, gapPct: Math.round((b.o / i.prevClose - 1) * 1000) / 10, headline: i.headline });
  }
  return c.sort((a, b) => b.score - a.score).slice(0, w.picks);
}
async function pick(date) {
  S.picked = true;
  const syms = Object.keys(S.info); if (!syms.length) { note('no candidates passed the scan'); return; }
  const first = await multiBars(syms, '5Min', E.etMs(date, 570), E.etMs(date, 575), 'iex'), fb = {};
  for (const [s, arr] of Object.entries(first)) if (arr[0] && arr[0].t === E.etMs(date, 570)) fb[s] = arr[0];
  S.picks = rank(S.info, fb);
  if (!S.picks.length) return E.tellOut('wave: no stocks in play', `${date}: nothing with opening volume above its 14-day normal. Sitting out.`);
  await E.tellOut('wave picks', S.picks.map(p => `${p.sym} ${p.dir.toUpperCase()} · RVOL ${p.rvol}x · gap ${p.gapPct >= 0 ? '+' : ''}${p.gapPct}% · break ${p.dir === 'long' ? 'above ' + p.orHigh : 'below ' + p.orLow}${p.headline ? '\n  ' + p.headline.slice(0, 90) : ''}`).join('\n'));
}

// ---- entries / management
async function enter(date, p, px) {
  const [ok, why, a] = await E.riskOk();
  if (!ok) { p.done = true; return E.tellOut(`wave: ${p.sym} skipped`, why); }
  try { await E.api(E.BASE, `/v2/positions/${p.sym}`); p.done = true; return note(`${p.sym}: existing non-Elis position, skipped`); } catch (e) { if (e.status !== 404) throw e; }
  const stopDist = Math.max(0.02, Math.round(p.atr * W.stopAtr * 100) / 100), long = p.dir === 'long';
  const stop = Math.round((long ? px - stopDist : px + stopDist) * 100) / 100;
  const perPos = (+a.buying_power * 0.95) / Math.max(1, W.picks);
  const qty = Math.max(0, Math.min(Math.floor(+a.equity * W.riskPct / 100 / stopDist), Math.floor(perPos / px)));
  if (qty < 1) { p.done = true; return note(`${p.sym}: size 0`); }
  if (!long) { const as = await E.api(E.BASE, `/v2/assets/${p.sym}`); if (!as.shortable || !as.easy_to_borrow && as.borrow_status !== 'ETB' || !a.shorting_enabled) { p.done = true; return note(`${p.sym}: not shortable`); } }
  const o = await E.api(E.BASE, '/v2/orders', { method: 'POST', body: JSON.stringify({ symbol: p.sym, qty: String(qty), side: long ? 'buy' : 'sell', type: 'market', time_in_force: 'day', order_class: 'oto', stop_loss: { stop_price: stop.toFixed(2) }, client_order_id: `${tag(date, p.sym)}-${Date.now().toString(36)}` }) });
  p.done = true; S.trades[p.sym] = { id: o.id, qty, stop, dir: p.dir, sentFill: false, sentExit: false };
  await E.tellOut(`wave ${long ? 'LONG' : 'SHORT'} ${qty} ${p.sym}`, `broke ${long ? 'above ' + p.orHigh : 'below ' + p.orLow} at ~${px} · stop ${stop} · risk ~$${Math.round(stopDist * qty)}`);
}
async function manage() {
  for (const [sym, t] of Object.entries(S.trades)) {
    if (t.sentExit) continue;
    const o = await E.api(E.BASE, `/v2/orders/${t.id}?nested=true`);
    if (+o.filled_qty > 0 && !t.sentFill) { t.sentFill = true; t.entry = +o.filled_avg_price; t.r = Math.abs(t.entry - t.stop) || 0.01; t.best = t.entry; t.legId = (o.legs || []).find(l => l.type === 'stop')?.id; note(`${sym} filled ${o.filled_qty} @ ${o.filled_avg_price}`); }
    const ex = (o.legs || []).find(l => l.status === 'filled');
    if (ex) { t.sentExit = true; const pnl = (t.dir === 'long' ? 1 : -1) * (+ex.filled_avg_price - +o.filled_avg_price) * +ex.filled_qty; await E.tellOut(`wave ${pnl > 0 ? "TRAIL STOP (profit)" : "STOP"} ${sym}`, `out @ ${ex.filled_avg_price}, ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`); }
    if (['canceled', 'expired', 'rejected'].includes(o.status) && +o.filled_qty === 0) { t.sentExit = true; note(`${sym} entry ${o.status}`); }
  }
}
// ---- context exit: trailing stop, 11:00 keep-or-sell, VWAP exit for runners
export function trailStop(t, px, w = W) {   // returns a better stop or null
  const long = t.dir === 'long';
  t.best = long ? Math.max(t.best, px) : Math.min(t.best, px);
  const gainR = (long ? t.best - t.entry : t.entry - t.best) / t.r;
  if (gainR < w.trailR) return null;
  const want = Math.round((long ? Math.max(t.entry, t.best - w.trailR * t.r) : Math.min(t.entry, t.best + w.trailR * t.r)) * 100) / 100;
  return (long ? want > t.stop + 0.009 : want < t.stop - 0.009) ? want : null;
}
export function vwapOf(bars) { let pv = 0, v = 0; for (const b of bars) { pv += (b.h + b.l + b.c) / 3 * b.v; v += b.v; } return v ? pv / v : null; }
export function keepAtDecision(t, bars, w = W) {   // bars = today's 1-min bars up to now
  if (!bars.length) return { keep: false, why: 'no bars' };
  const px = bars.at(-1).c, long = t.dir === 'long', vw = vwapOf(bars), gainR = (long ? px - t.entry : t.entry - px) / t.r;
  const ago = bars.at(-31)?.c ?? bars[0].c, momentum = long ? px > ago : px < ago, sideOk = vw != null && (long ? px > vw : px < vw);
  const keep = gainR >= w.keepMinR && sideOk && momentum;
  return { keep, why: `${gainR >= 0 ? '+' : ''}${gainR.toFixed(1)}R, ${sideOk ? 'right side of' : 'wrong side of'} VWAP ${vw?.toFixed(2)}, last 30 min ${momentum ? 'with' : 'against'} it` };
}
async function closeOne(date, sym, t, reason) {
  const o = await E.api(E.BASE, `/v2/orders/${t.id}?nested=true`);
  for (const x of [o, ...(o.legs || [])]) if (['new', 'accepted', 'held', 'pending_new', 'partially_filled'].includes(x.status)) await E.api(E.BASE, `/v2/orders/${x.id}`, { method: 'DELETE' }).catch(() => {});
  let pos = null; try { pos = await E.api(E.BASE, `/v2/positions/${sym}`); } catch {}
  t.sentExit = true;
  if (!pos) return;
  await E.api(E.BASE, '/v2/orders', { method: 'POST', body: JSON.stringify({ symbol: sym, qty: String(Math.abs(+pos.qty)), side: +pos.qty > 0 ? 'sell' : 'buy', type: 'market', time_in_force: 'day', client_order_id: `${tag(date, sym)}-flat-${Date.now().toString(36)}` }) });
  await E.tellOut(`wave SOLD ${sym}`, `${reason} · ${+pos.unrealized_pl >= 0 ? '+' : ''}$${(+pos.unrealized_pl).toFixed(2)}`);
}
async function contextExit(date, now) {
  const live = Object.entries(S.trades).filter(([, t]) => t.sentFill && !t.sentExit); if (!live.length) return;
  const j = await E.api(E.DATA, `/v2/stocks/trades/latest?${q({ symbols: live.map(([s]) => s).join(','), feed: 'iex' })}`);
  for (const [sym, t] of live) {
    const px = j.trades?.[sym]?.p; if (!px) continue;
    const ns = trailStop(t, px);
    if (ns && t.legId && Date.now() - (t.amendAt || 0) > 30e3) {
      try { await E.api(E.BASE, `/v2/orders/${t.legId}`, { method: 'PATCH', body: JSON.stringify({ stop_price: ns.toFixed(2) }) }); t.amendAt = Date.now(); if (!t.beSent) { t.beSent = true; note(`${sym}: stop to break-even, now trailing`); } t.stop = ns; }
      catch (e) { note(`${sym}: stop amend failed ${e.message}`); }
    }
  }
  if (!W.smartExit || now.min < W.decideAt || now.min === S.lastMinute) return;
  S.lastMinute = now.min;
  const bars = await multiBars(live.map(([s]) => s), '1Min', E.etMs(date, 570), Date.now(), 'iex');
  for (const [sym, t] of live) {
    const b = (bars[sym] || []).filter(x => x.t + 60e3 <= Date.now());
    if (!t.decided) {
      t.decided = true; const d = keepAtDecision(t, b);
      if (d.keep) { t.runner = true; await E.tellOut(`wave HOLDING ${sym}`, `still running at 11:00: ${d.why}. Trailing stop ${t.stop}.`); }
      else await closeOne(date, sym, t, `11:00 exit: ${d.why}`);
    } else if (t.runner && b.length) {
      const vw = vwapOf(b), c = b.at(-1).c;
      if (vw != null && (t.dir === 'long' ? c < vw : c > vw)) await closeOne(date, sym, t, `closed back through VWAP ${vw.toFixed(2)}`);
    }
  }
}
async function flatten(date) {
  S.flattened = true; const lines = [];
  for (const [sym, t] of Object.entries(S.trades)) {
    if (t.sentExit) continue;
    try {
      const o = await E.api(E.BASE, `/v2/orders/${t.id}?nested=true`);
      for (const x of [o, ...(o.legs || [])]) if (['new', 'accepted', 'held', 'pending_new', 'partially_filled'].includes(x.status)) await E.api(E.BASE, `/v2/orders/${x.id}`, { method: 'DELETE' }).catch(() => {});
      let pos = null; try { pos = await E.api(E.BASE, `/v2/positions/${sym}`); } catch {}
      if (pos && +o.filled_qty > 0) {
        await E.api(E.BASE, '/v2/orders', { method: 'POST', body: JSON.stringify({ symbol: sym, qty: String(Math.abs(+pos.qty)), side: +pos.qty > 0 ? 'sell' : 'buy', type: 'market', time_in_force: 'day', client_order_id: `${tag(date, sym)}-flat-${Date.now().toString(36)}` }) });
        lines.push(`${sym} ${+pos.unrealized_pl >= 0 ? '+' : ''}$${(+pos.unrealized_pl).toFixed(2)}`);
      }
      t.sentExit = true;
    } catch (e) { lines.push(`${sym} FLATTEN ERROR ${e.message}`); }
  }
  if (lines.length) await E.tellOut('wave closed', lines.join(' · '));
}

let busy = false, timer = null;
async function tick() {
  if (busy) return; busy = true;
  try {
    const c = await E.api(E.BASE, '/v2/clock'), now = E.et(), date = now.date;
    const tradingDay = c.is_open || (Date.parse(c.next_open) - Date.now() < 4 * 3600e3 && E.et(Date.parse(c.next_open)).date === date);
    if (!tradingDay) return;
    if (S.day !== date) Object.assign(S, { day: date, lastMinute: -1, info: {}, picks: [], trades: {}, flattened: false, scanned: false, picked: false });
    if (!S.scanned && now.min >= W.scanAt && now.min < W.entryEnd) await scan(date);
    if (!c.is_open) return;
    const closingSoon = Date.parse(c.next_close) - Date.now() < 5 * 60e3;
    if (now.min >= W.exitAt || closingSoon) { if (!S.flattened) await flatten(date); return; }
    if (S.scanned && !S.picked && now.min >= W.orbEnd && Date.now() >= E.etMs(date, W.orbEnd) + 20e3) await pick(date);
    const open = S.picks.filter(p => !p.done);
    if (open.length && now.min < W.entryEnd) {
      const j = await E.api(E.DATA, `/v2/stocks/trades/latest?${q({ symbols: open.map(p => p.sym).join(','), feed: 'iex' })}`);
      for (const p of open) {
        const px = j.trades?.[p.sym]?.p; if (!px) continue;
        if ((p.dir === 'long' && px > p.orHigh) || (p.dir === 'short' && px < p.orLow)) await enter(date, p, px);
      }
    } else if (open.length && now.min >= W.entryEnd) { for (const p of open) p.done = true; note('entry window closed; untriggered picks dropped'); }
    await manage();
    await contextExit(date, now);
    S.lastErr = null;
  } catch (e) {
    if (e.message !== S.lastErr) await E.tellOut('wave error', e.message);
    S.lastErr = e.message;
  } finally { busy = false; }
}

export async function openValues() {   // open Wave positions marked to market, for the ELIS panel
  const out = [];
  for (const [sym, t] of Object.entries(S.trades)) if (!t.sentExit && t.sentFill) { try { const p = await E.api(E.BASE, `/v2/positions/${sym}`); out.push(+p.market_value); } catch {} }
  return out;
}
let openCache = [];
export function start() {
  if (!E.enabled() || !E.strategyOn('wave') || timer) return false;
  timer = setInterval(() => tick(), 15e3); setTimeout(() => tick(), 15e3);
  setInterval(() => openValues().then(v => { openCache = v; }).catch(() => {}), 60e3);
  E.setExtraOpen(() => openCache);
  note(`online: picks ${W.picks}, risk ${W.riskPct}%/trade, entries until ${Math.floor(W.entryEnd / 60)}:${String(W.entryEnd % 60).padStart(2, '0')}, exit ${Math.floor(W.exitAt / 60)}:${String(W.exitAt % 60).padStart(2, '0')}`);
  return true;
}
export function status() {
  return { running: !!timer, day: S.day, scanned: S.scanned, candidates: Object.keys(S.info).length, picks: S.picks.map(p => ({ symbol: p.sym, dir: p.dir, rvol: p.rvol, gapPct: p.gapPct, breakLevel: p.dir === 'long' ? p.orHigh : p.orLow, triggered: !!S.trades[p.sym], headline: p.headline })), trades: S.trades, lastError: S.lastErr, log: S.log.slice(0, 10), rules: `Stocks in Play 5-min opening range breakout (Zarattini, Barbon & Aziz 2024): top ${W.picks} by opening relative volume (news x${W.newsBoost}), price > $5, avg vol > 1M, ATR > $0.50; enter on the break of the first 5-min high/low until the entry cut-off, stop ${W.stopAtr * 100}% of ATR, ${W.riskPct}% risk each. ${W.smartExit ? `Exit: break-even then ${W.trailR}R trailing stop after +${W.trailR}R; 11:00 keep only if >= +${W.keepMinR}R, right side of VWAP and still moving its way; runners out on a close through VWAP; flat 15:55.` : 'Exit at the set time.'}` };
}
export const _tick = () => tick();
export const _state = S;
