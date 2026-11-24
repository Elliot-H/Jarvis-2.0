// Elis: fully automated day-trading engine (Owner's request 2026-11-23). PAPER ONLY unless the Owner sets the live switches.
// Strategy (from an Instagram NQ reel, run on QQQ because Alpaca has no futures):
//   1. Mark Asia (20:00-00:00 ET), London (02:00-05:00) and pre-market (04:00-09:30) highs/lows.
//   2. 09:30-11:00 ET: wait for price to sweep one of those levels.
//   3. Take the first 1-minute fair value gap that forms against the sweep: limit entry at the gap,
//      stop beyond the sweep extreme, target 2R. One trade a day. Unfilled entry cancelled after 30 min.
//   4. Flat by 15:55 ET, daily report to the phone.
// Unlike trade.js (which needs the Owner's spoken confirm), Elis places its own orders: the Owner asked for full automation.
// Guards: paper endpoint unless ELIS_LIVE=1 AND ELIS_LIVE_CONFIRM=I_ACCEPT_REAL_MONEY_RISK; 1% risk; daily loss limit;
// max-drawdown kill switch; never trades while a non-Elis position in the symbol exists; only touches its own orders.

const num = (v, d) => (v !== undefined && v !== '' && Number.isFinite(Number(v)) ? Number(v) : d);
const clean = v => String(v || '').trim().replace(/^["']|["']$/g, '').trim();
const env = process.env;

export const CFG = {
  symbol: clean(env.ELIS_SYMBOL) || 'QQQ',
  feed: clean(env.ELIS_FEED) || 'sip',          // sip (free: SIP history + live IEX for the last 15 min) | iex | sip_paid
  riskPct: num(env.ELIS_RISK_PCT, 1),
  maxPositionPct: num(env.ELIS_MAX_POSITION_PCT, 100),
  dailyLossPct: num(env.ELIS_DAILY_LOSS_PCT, 2),
  maxDrawdownPct: num(env.ELIS_MAX_DRAWDOWN_PCT, 15),
  rr: num(env.ELIS_RR, 2),
  targetMode: clean(env.ELIS_TARGET_MODE) || 'rr', // rr | liquidity
  entryStart: 9 * 60 + 30, entryEnd: 11 * 60, flattenAt: 15 * 60 + 55,
  expiryMin: num(env.ELIS_ORDER_EXPIRY_MIN, 30),
  stopBuffer: 0.02, minRisk: 0.10, maxRisk: 3.0, minFvg: 0.02,
  allowShort: clean(env.ELIS_ALLOW_SHORT) !== '0' && clean(env.ELIS_ALLOW_SHORT).toLowerCase() !== 'false'
};
export const LIVE = clean(env.ELIS_LIVE) === '1' && clean(env.ELIS_LIVE_CONFIRM) === 'I_ACCEPT_REAL_MONEY_RISK';
const BASE = LIVE ? 'https://api.alpaca.markets' : 'https://paper-api.alpaca.markets';
const DATA = 'https://data.alpaca.markets';
const KEY = () => clean(env.ELIS_KEY_ID || env.ALPACA_KEY_ID), SEC = () => clean(env.ELIS_SECRET || env.ALPACA_SECRET);
export const enabled = () => clean(env.ELIS_ENABLED) !== '0' && !!(KEY() && SEC());
export const mode = () => (LIVE ? 'LIVE' : 'PAPER');

// ---------------- time (America/New_York) ----------------
const TZ = 'America/New_York';
const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short' });
export function et(ms = Date.now()) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, min: Number(p.hour) * 60 + Number(p.minute) };
}
// UTC ms for an ET wall-clock time on date (YYYY-MM-DD) plus dayOffset days.
export function etMs(date, minutes, dayOffset = 0) {
  const [y, m, d] = date.split('-').map(Number);
  for (const off of [5, 4]) {
    const ms = Date.UTC(y, m - 1, d + dayOffset, 0, minutes + off * 60);
    const e = et(ms), want = new Date(Date.UTC(y, m - 1, d + dayOffset)).toISOString().slice(0, 10);
    if (e.date === want && e.min === minutes) return ms;
  }
  return Date.UTC(y, m - 1, d + dayOffset, 0, minutes + 300);
}

// ---------------- strategy (pure) ----------------
// bars: [{t (ms, bar open), o, h, l, c}] sorted.
export function sessionLevels(bars, date) {
  const S = { asia: [[-1, 20 * 60], [0, 0]], london: [[0, 120], [0, 300]], premarket: [[0, 240], [0, 570]] };
  const lv = {};
  for (const [name, [[so, st], [eo, en]]] of Object.entries(S)) {
    const a = etMs(date, st, so), b = etMs(date, en, eo), seg = bars.filter(x => x.t >= a && x.t < b);
    if (seg.length) { lv[name + '_high'] = r2(Math.max(...seg.map(x => x.h))); lv[name + '_low'] = r2(Math.min(...seg.map(x => x.l))); }
  }
  return lv;
}
const r2 = v => Math.round(v * 100) / 100;

export function findSignal(rth, levels, cfg = CFG) {
  const highs = Object.entries(levels).filter(([k]) => k.endsWith('_high')), lows = Object.entries(levels).filter(([k]) => k.endsWith('_low'));
  if ((!highs.length && !lows.length) || rth.length < 3) return null;
  let hiIdx = null, loIdx = null, hiName = '', loName = '';
  for (let i = 0; i < rth.length; i++) {
    const m = et(rth[i].t).min;
    if (m < cfg.entryStart) continue;
    if (m >= cfg.entryEnd) break;
    if (hiIdx === null) { const hit = highs.filter(([, v]) => rth[i].h > v); if (hit.length) { hiIdx = i; hiName = hit.sort((a, b) => b[1] - a[1])[0][0]; } }
    if (loIdx === null) { const hit = lows.filter(([, v]) => rth[i].l < v); if (hit.length) { loIdx = i; loName = hit.sort((a, b) => a[1] - b[1])[0][0]; } }
    if (i < 2) continue;
    const time = rth[i].t + 60e3, A = rth[i - 2], B = rth[i - 1], C = rth[i];
    if (cfg.allowShort && hiIdx !== null && i - 2 >= hiIdx && A.l - C.h >= cfg.minFvg && B.c < B.o) {
      const entry = r2(C.h), stop = r2(Math.max(...rth.slice(hiIdx, i + 1).map(x => x.h)) + cfg.stopBuffer), risk = r2(stop - entry);
      if (risk >= cfg.minRisk && risk <= cfg.maxRisk) return { side: 'sell', entry, stop, target: target('sell', entry, risk, lows, cfg), risk, time, reason: `swept ${hiName} -> bearish FVG` };
    }
    if (loIdx !== null && i - 2 >= loIdx && C.l - A.h >= cfg.minFvg && B.c > B.o) {
      const entry = r2(C.l), stop = r2(Math.min(...rth.slice(loIdx, i + 1).map(x => x.l)) - cfg.stopBuffer), risk = r2(entry - stop);
      if (risk >= cfg.minRisk && risk <= cfg.maxRisk) return { side: 'buy', entry, stop, target: target('buy', entry, risk, highs, cfg), risk, time, reason: `swept ${loName} -> bullish FVG` };
    }
  }
  return null;
}
function target(side, entry, risk, opp, cfg) {
  if (cfg.targetMode === 'liquidity') {
    const v = opp.map(([, x]) => x).filter(x => (side === 'sell' ? x <= entry - risk : x >= entry + risk));
    if (v.length) return r2(side === 'sell' ? Math.max(...v) : Math.min(...v));
  }
  return r2(side === 'sell' ? entry - cfg.rr * risk : entry + cfg.rr * risk);
}

// Bar-by-bar fill/exit for the backtest. Conservative: the stop wins when both are touched in one bar.
export function simulate(s, bars, cfg = CFG, slip = 0.01) {
  const sell = s.side === 'sell', deadline = s.time + cfg.expiryMin * 60e3;
  let filled = null;
  for (const b of bars) {
    if (b.t < s.time) continue;
    if (filled === null) {
      if (b.t >= deadline) return null;
      if ((sell && b.h >= s.entry) || (!sell && b.l <= s.entry)) filled = b.t; else continue;
    }
    let px = null, why = null;
    if (et(b.t).min >= cfg.flattenAt) { px = b.o; why = 'eod'; }
    else if ((sell && b.h >= s.stop) || (!sell && b.l <= s.stop)) { px = s.stop; why = 'stop'; }
    else if (b.t !== filled && ((sell && b.l <= s.target) || (!sell && b.h >= s.target))) { px = s.target; why = 'target'; }
    if (px !== null) return result(s, filled, b.t, px, why, slip);
  }
  return filled !== null ? result(s, filled, bars.at(-1).t, bars.at(-1).c, 'data_end', slip) : null;
}
function result(s, tin, tout, px, why, slip) {
  const pnl = (s.side === 'sell' ? -1 : 1) * (px - s.entry) - 2 * slip;
  return { side: s.side, entryTime: new Date(tin).toISOString(), exitTime: new Date(tout).toISOString(), entry: s.entry, stop: s.stop, target: s.target, exit: r2(px), why, r: Math.round(pnl / s.risk * 1000) / 1000, setup: s.reason };
}

// ---------------- Alpaca ----------------
// One pacing lane for every Elis call: Alpaca allows ~200 requests/min per account (free data plan), shared with
// live trading. Live calls (priority) jump the queue; the history study ('bulk') takes whatever is left.
export const apiStats = { calls: 0, e429: 0, errors: 0, msTotal: 0, since: Date.now(), bulkWaitMs: 0 };
const BULK_MAX = Number(process.env.ELIS_API_PER_MIN || 170), LIVE_MAX = 195, win = [];   // calls in the last 60 s
let pausedUntil = 0;
async function slot(bulk) {
  for (;;) {
    const now = Date.now(); while (win.length && win[0] <= now - 60e3) win.shift();
    const cap = bulk ? BULK_MAX : LIVE_MAX;
    if (now >= pausedUntil && win.length < cap) { win.push(now); return; }
    const w = Math.max(pausedUntil - now, win.length ? win[0] + 60e3 - now : 50, 50); if (bulk) apiStats.bulkWaitMs += Math.min(w, 1000);
    await new Promise(r => setTimeout(r, Math.min(w, 1000)));   // re-check every second so live calls are never stuck behind bulk
  }
}
async function api(base, path, opts = {}, bulk = false) {
  await slot(bulk);
  const t0 = Date.now(); apiStats.calls++;
  let r; try { r = await fetch(base + path, { ...opts, headers: { 'APCA-API-KEY-ID': KEY(), 'APCA-API-SECRET-KEY': SEC(), 'content-type': 'application/json' }, signal: AbortSignal.timeout(20000) }); }
  catch (e) { apiStats.errors++; throw e; }
  finally { apiStats.msTotal += Date.now() - t0; }
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { j = t; }
  if (r.status === 429) { apiStats.e429++; pausedUntil = Date.now() + 5000; }   // back everything off for 5 s
  if (!r.ok) { if (r.status !== 429) apiStats.errors++; const e = new Error(`Alpaca ${r.status}: ${j?.message || t}`.slice(0, 300)); e.status = r.status; throw e; }
  return j;
}
const SIP_DELAY = 16 * 60e3;
async function fetchBars(startMs, endMs, feed, bulk = false) {
  if (endMs <= startMs) return [];
  const out = []; let token = '';
  do {
    const q = new URLSearchParams({ timeframe: '1Min', start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString(), feed, limit: '10000', adjustment: 'split' });
    if (token) q.set('page_token', token);
    const j = await api(DATA, `/v2/stocks/${CFG.symbol}/bars?${q}`, {}, bulk);
    for (const b of j.bars || []) out.push({ t: Date.parse(b.t), o: b.o, h: b.h, l: b.l, c: b.c, v: b.v });
    token = j.next_page_token || '';
  } while (token);
  return out;
}
export async function bars(startMs, endMs, feed = CFG.feed) {
  const now = Date.now(); endMs = Math.min(endMs, now);
  if (feed === 'iex') return fetchBars(startMs, endMs, 'iex');
  if (feed === 'sip_paid') return fetchBars(startMs, endMs, 'sip');
  const cut = now - SIP_DELAY, a = await fetchBars(startMs, Math.min(endMs, cut), 'sip');
  const b = endMs > cut ? await fetchBars(Math.max(startMs, cut), endMs, 'iex') : [];
  const seen = new Set(a.map(x => x.t));
  return [...a, ...b.filter(x => !seen.has(x.t))].sort((x, y) => x.t - y.t);
}

// ---------------- live engine ----------------
const S = { day: null, levels: null, traded: false, orderId: null, placedAt: 0, filledSent: false, closedSent: false, flattened: false, halted: false, lastMinute: -1, lastError: null, lastTick: 0, log: [], history: [] };
let push = async () => {}, hud = () => {}, busy = false, timer = null;
const note = m => { S.log.unshift(`${new Date().toISOString().slice(11, 16)}Z ${m}`); S.log.length = Math.min(S.log.length, 30); console.log('[elis]', m); };
const tell = (title, body) => { note(`${title}: ${body}`); setTimeout(() => sendHud(true), 3000); return push(`Elis: ${title}`, body).catch(() => {}); };
const tag = date => `elis-${date.replace(/-/g, '')}`;

async function todaysOrders(date) {
  const after = new Date(etMs(date, 0)).toISOString();
  const o = await api(BASE, `/v2/orders?status=all&nested=true&limit=100&symbols=${CFG.symbol}&after=${encodeURIComponent(after)}`);
  return o.filter(x => (x.client_order_id || '').startsWith(tag(date)));
}
async function position() { try { return await api(BASE, `/v2/positions/${CFG.symbol}`); } catch (e) { if (e.status === 404) return null; throw e; } }

async function riskOk() {
  const a = await api(BASE, '/v2/account');
  if (a.trading_blocked || a.account_blocked) return [false, 'account blocked'];
  const eq = +a.equity, last = +a.last_equity;
  if (last > 0 && (last - eq) / last * 100 >= CFG.dailyLossPct) return [false, `daily loss limit (${CFG.dailyLossPct}%) reached`];
  try {
    const h = await api(BASE, '/v2/account/portfolio/history?period=1A&timeframe=1D');
    const peak = Math.max(eq, ...(h.equity || []).filter(Boolean));
    if (peak > 0 && (peak - eq) / peak * 100 >= CFG.maxDrawdownPct) { S.halted = true; return [false, `MAX DRAWDOWN ${CFG.maxDrawdownPct}% hit (equity ${eq.toFixed(2)}, peak ${peak.toFixed(2)}). Elis is OFF until redeployed or re-armed.`]; }
  } catch (e) { note('portfolio history unavailable: ' + e.message); }
  // No PDT guard: FINRA's pattern-day-trader rule and $25k minimum were replaced by intraday margin standards (SEC approval 2026-04-14, effective 2026-06-04). Alpaca enforces margin itself.
  return [true, '', a];
}

async function place(date, s) {
  const [ok, why, a] = await riskOk();
  if (!ok) return tell('setup skipped', why);
  if (await position()) return tell('setup skipped', `an existing ${CFG.symbol} position is open that Elis did not open`);
  if (s.side === 'sell') {
    const asset = await api(BASE, `/v2/assets/${CFG.symbol}`);
    if (!asset.shortable || !a.shorting_enabled) return tell('short skipped', 'shorting is not available on this account/asset');
  }
  const eq = +a.equity, byRisk = Math.floor(eq * CFG.riskPct / 100 / s.risk), byCash = Math.floor(Math.min(+a.buying_power * 0.95, eq * CFG.maxPositionPct / 100) / s.entry);
  const qty = Math.max(0, Math.min(byRisk, byCash));
  if (qty < 1) return tell('setup skipped', `size came out 0 (risk ${s.risk}/share)`);
  const o = await api(BASE, '/v2/orders', { method: 'POST', body: JSON.stringify({
    symbol: CFG.symbol, qty: String(qty), side: s.side, type: 'limit', time_in_force: 'day', limit_price: s.entry.toFixed(2),
    order_class: 'bracket', take_profit: { limit_price: s.target.toFixed(2) }, stop_loss: { stop_price: s.stop.toFixed(2) },
    client_order_id: `${tag(date)}-${Date.now().toString(36)}` }) });
  S.orderId = o.id; S.placedAt = Date.now(); S.trade = { ...s, qty };
  await tell(`${s.side === 'buy' ? 'LONG' : 'SHORT'} ${qty} ${CFG.symbol}`, `limit ${s.entry} | stop ${s.stop} | target ${s.target} | risk $${Math.round(s.risk * qty)}\n${s.reason}`);
}

async function manage() {
  if (!S.orderId) return;
  const o = await api(BASE, `/v2/orders/${S.orderId}?nested=true`);
  if (['new', 'accepted', 'pending_new', 'partially_filled'].includes(o.status) && +o.filled_qty === 0 && Date.now() - S.placedAt > CFG.expiryMin * 60e3) {
    await api(BASE, `/v2/orders/${S.orderId}`, { method: 'DELETE' }).catch(() => {});
    S.orderId = null; return tell('entry cancelled', `not filled within ${CFG.expiryMin} minutes`);
  }
  if (['canceled', 'expired', 'rejected'].includes(o.status) && +o.filled_qty === 0) { S.orderId = null; return; }
  if (+o.filled_qty > 0 && !S.filledSent) { S.filledSent = true; await tell('filled', `${o.side} ${o.filled_qty} ${CFG.symbol} @ ${o.filled_avg_price}`); }
  const exit = (o.legs || []).find(l => l.status === 'filled');
  if (exit && !S.closedSent) {
    S.closedSent = true;
    const pnl = (o.side === 'buy' ? 1 : -1) * (+exit.filled_avg_price - +o.filled_avg_price) * +exit.filled_qty;
    const kind = exit.type === 'limit' ? 'TARGET hit' : 'STOP hit';
    S.history.unshift({ date: S.day, side: o.side, qty: +exit.filled_qty, entry: +o.filled_avg_price, exit: +exit.filled_avg_price, pnl: Math.round(pnl * 100) / 100, kind });
    S.history.length = Math.min(S.history.length, 60);
    await tell(kind, `${CFG.symbol} out @ ${exit.filled_avg_price}, ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  }
}

async function flatten() {
  S.flattened = true;
  try {
    if (S.orderId) {
      const o = await api(BASE, `/v2/orders/${S.orderId}?nested=true`);
      for (const x of [o, ...(o.legs || [])]) if (['new', 'accepted', 'held', 'pending_new', 'partially_filled'].includes(x.status)) await api(BASE, `/v2/orders/${x.id}`, { method: 'DELETE' }).catch(() => {});
      if (+o.filled_qty > 0 && !S.closedSent && await position()) {
        await new Promise(r => setTimeout(r, 1500));
        const ps = await position();
        if (ps) await api(BASE, '/v2/orders', { method: 'POST', body: JSON.stringify({ symbol: CFG.symbol, qty: String(Math.abs(+ps.qty)), side: +ps.qty > 0 ? 'sell' : 'buy', type: 'market', time_in_force: 'day', client_order_id: `${tag(S.day)}-flat-${Date.now().toString(36)}` }) });
        await tell('closed at end of day', `${CFG.symbol} position flattened before the close`);
      }
    }
  } catch (e) { await tell('FLATTEN ERROR', e.message); }
  const a = await api(BASE, '/v2/account').catch(() => null);
  const line = a ? `Equity $${(+a.equity).toLocaleString('en-US', { maximumFractionDigits: 2 })} (${+a.equity - +a.last_equity >= 0 ? '+' : ''}${(+a.equity - +a.last_equity).toFixed(2)} today)` : 'account unavailable';
  await tell('daily report', `${S.day}: ${S.trade ? `${S.trade.side} setup ${S.trade.reason}` : 'no trade today'}. ${line}.`);
}

async function newDay(date) {
  Object.assign(S, { day: date, levels: null, traded: false, orderId: null, placedAt: 0, filledSent: false, closedSent: false, flattened: false, lastMinute: -1, trade: null });
  const mine = await todaysOrders(date);                    // restart-safe: today's orders are the source of truth
  if (mine.length) { const o = mine.at(-1); Object.assign(S, { traded: true, orderId: o.id, placedAt: Date.parse(o.submitted_at), filledSent: +o.filled_qty > 0 }); note('resumed with today\'s order ' + o.id); }
  const pre = await bars(etMs(date, 19 * 60, -1), etMs(date, 570));
  S.levels = sessionLevels(pre, date);
  if (!Object.keys(S.levels).length) { S.traded = true; return tell('sitting out', `${date}: no pre-open data for levels`); }
  if (!S.traded) await tell(`ready ${date}`, Object.entries(S.levels).map(([k, v]) => `${k.replace('_', ' ')} ${v}`).join(', '));
}

let clockCache = { at: 0, v: null };
async function tick() {
  if (busy || S.halted) return; busy = true; S.lastTick = Date.now();
  try {
    if (Date.now() - clockCache.at > 60e3) clockCache = { at: Date.now(), v: await api(BASE, '/v2/clock') };
    const now = et(), c = clockCache.v;
    if (!c.is_open) return;
    if (S.day !== now.date) await newDay(now.date);
    const closingSoon = Date.parse(c.next_close) - Date.now() < 5 * 60e3;   // also covers 13:00 half days
    if (now.min >= CFG.flattenAt || closingSoon) { if (!S.flattened) await flatten(); return; }
    await manage();
    if (!S.traded && now.min > CFG.entryStart && now.min < CFG.entryEnd && now.min !== S.lastMinute && new Date(Date.now()).getSeconds() >= 3) {
      S.lastMinute = now.min;
      const rth = (await bars(etMs(now.date, CFG.entryStart), Date.now())).filter(b => b.t + 60e3 <= Date.now());
      const s = findSignal(rth, S.levels);
      if (s) { S.traded = true; if (Date.now() - s.time <= 3 * 60e3) await place(now.date, s); else note('stale setup ignored ' + s.reason); }
    }
    S.lastError = null;
  } catch (e) {
    const msg = e.message || String(e);
    if (msg !== S.lastError) await tell('error', msg + (e.status === 401 || e.status === 403 ? ' (check the Alpaca paper keys in Railway)' : ''));
    S.lastError = msg;
  } finally { busy = false; }
}

export function start(opts = {}) {
  if (opts.push) push = opts.push;
  if (opts.hud) hud = opts.hud;
  if (!enabled() || timer) return false;
  if (!strategyOn('sweep')) { setInterval(() => sendHud(), 60e3); setTimeout(() => sendHud(true), 12e3); timer = 'hud-only'; return true; }
  if (!LIVE && /^AK/.test(KEY())) { console.warn('[elis] ALPACA keys are LIVE keys but Elis is paper-only: set ELIS_KEY_ID/ELIS_SECRET to paper keys.'); return false; }
  timer = setInterval(() => tick(), 15e3); setTimeout(() => tick(), 10e3);
  setInterval(() => sendHud(), 60e3); setTimeout(() => sendHud(true), 12e3);
  tell('online', `${mode()} mode, ${CFG.symbol}, ${CFG.riskPct}% risk per trade, 1 trade/day.`);
  return true;
}

export function status() {
  return { running: !!timer && !S.halted, mode: mode(), enabled: enabled(), symbol: CFG.symbol, halted: S.halted, day: S.day, levels: S.levels, tradedToday: S.traded, openOrder: S.orderId, todaysTrade: S.trade || null, lastError: S.lastError, lastCheckSecondsAgo: S.lastTick ? Math.round((Date.now() - S.lastTick) / 1000) : null, recentTrades: S.history.slice(0, 10), log: S.log.slice(0, 12), rules: `QQQ, sweep of Asia/London/pre-market high or low 9:30-11:00 ET, then first 1-min fair value gap reversal; stop past the sweep, target ${CFG.rr}R; ${CFG.riskPct}% risk; flat 15:55; daily loss stop ${CFG.dailyLossPct}%; off at ${CFG.maxDrawdownPct}% drawdown.` };
}

// Backtest on Alpaca history (same strategy code). days = trading sessions to test.
// History test for the QQQ strategy. Works 10 sessions at a time and yields between chunks, so it never freezes the
// server (the first version held ~400 days of minute bars and ran in one block: Jarvis stopped answering).
export async function backtest(days = 120, overrides = {}) {
  const cfg = { ...CFG, ...overrides };
  const end = Date.now() - 20 * 60e3, start = end - Math.ceil(days * 1.5 + 5) * 86400e3;
  const cal = await api(BASE, `/v2/calendar?start=${new Date(start).toISOString().slice(0, 10)}&end=${new Date(end).toISOString().slice(0, 10)}`, {}, true);
  const dates = cal.map(c => c.date).filter(d => d < et().date).slice(-days), trades = [];
  for (let i = 0; i < dates.length; i += 10) {
    const chunk = dates.slice(i, i + 10), bars = await fetchBars(etMs(chunk[0], 19 * 60, -1), etMs(chunk.at(-1), 16 * 60), 'sip', true);
    trades.push(...runBacktest(bars, chunk, cfg)._trades);
    await new Promise(r => setImmediate(r));
  }
  return summarize(trades, dates.length, cfg);
}
export function runBacktest(all, dates, cfg = CFG) {
  const trades = [];
  for (const d of dates) {
    const a = etMs(d, 19 * 60, -1), z = etMs(d, 16 * 60), o = etMs(d, 570);   // once per day, not per bar
    const w = all.filter(b => b.t >= a && b.t < z);
    const lv = sessionLevels(w, d), rth = w.filter(b => b.t >= o);
    if (!Object.keys(lv).length || !rth.length) continue;
    const s = findSignal(rth, lv, cfg); if (!s) continue;
    const r = simulate(s, rth, cfg); if (r) trades.push({ date: d, ...r });
  }
  return summarize(trades, dates.length, cfg);
}
function summarize(trades, sessions, cfg) {
  const R = trades.map(t => t.r), wins = R.filter(x => x > 0), loss = R.filter(x => x < 0);
  let eq = 1, peak = 1, dd = 0; for (const r of R) { eq *= 1 + r * cfg.riskPct / 100; peak = Math.max(peak, eq); dd = Math.min(dd, eq / peak - 1); }
  return { _trades: trades, sessions, trades: trades.length, winRatePct: trades.length ? Math.round(wins.length / trades.length * 1000) / 10 : 0, totalR: Math.round(R.reduce((a, b) => a + b, 0) * 100) / 100, profitFactor: loss.length ? Math.round(wins.reduce((a, b) => a + b, 0) / -loss.reduce((a, b) => a + b, 0) * 100) / 100 : null, returnPct: Math.round((eq - 1) * 1000) / 10, maxDrawdownPct: Math.round(dd * 1000) / 10, last: trades.slice(-10) };
}

// ---------------- HUD panel: P/L graph + today / lifetime numbers ----------------
// Elis P/L = cash flow of its own fills (client_order_id elis-*: entries, bracket exits, EOD flatten) + any open Elis position.
let hudCache = { at: 0, v: null }, extraOpen = () => [], hudExtra = () => ({});
export const setHudExtra = f => { hudExtra = f; };
export const hudSend = o => { try { hud(o); } catch {} };   // extra live panels (hunt accuracy)
export const setExtraOpen = f => { extraOpen = f; };
export async function summary(force = false) {
  if (!force && hudCache.v && Date.now() - hudCache.at < 55e3) return hudCache.v;
  const a = await api(BASE, '/v2/account');
  const fills = []; let until = '';
  for (let page = 0; page < 10; page++) {
    const q = new URLSearchParams({ status: 'closed', nested: 'true', limit: '500', direction: 'desc' }); if (until) q.set('until', until);
    const list = await api(BASE, `/v2/orders?${q}`);
    for (const o of list) { const mt = (o.client_order_id || '').match(/^elisw?-(\d{8})/); if (mt) for (const x of [o, ...(o.legs || [])]) if (+x.filled_qty > 0) fills.push({ day: mt[1], sym: x.symbol || o.symbol, side: x.side, qty: +x.filled_qty, px: +x.filled_avg_price }); }
    if (list.length < 500) break; until = list.at(-1).submitted_at;
  }
  const byDay = {};
  for (const f of fills) byDay[f.day] = (byDay[f.day] || 0) + (f.side === 'sell' ? 1 : -1) * f.qty * f.px;
  const today = et().date.replace(/-/g, '');
  // open Elis shares today, marked to market from the broker itself (not from memory: a restart must never show a bought position as a loss)
  const net = {}; for (const f of fills) if (f.day === today && f.sym) net[f.sym] = (net[f.sym] || 0) + (f.side === 'buy' ? f.qty : -f.qty);
  if (Object.values(net).some(q => Math.abs(q) > 1e-9)) { const ps = await api(BASE, '/v2/positions').catch(() => []);
    for (const [sym, q] of Object.entries(net)) { if (Math.abs(q) < 1e-9) continue; const p = (ps || []).find(x => x.symbol === sym); const px = p ? +p.current_price : null;
      if (px) byDay[today] = (byDay[today] || 0) + q * px; else note(`hud: ${sym} shows ${q} open Elis shares but no broker position`); } }
  const days = Object.keys(byDay).sort(); let cum = 0;
  const series = days.map(d => (cum += byDay[d], { d, pnl: Math.round(byDay[d] * 100) / 100, cum: Math.round(cum * 100) / 100 }));
  const trades = new Set(fills.filter(f => f.day).map(f => f.day)).size;
  let netCash = 0;   // deposits/withdrawals today are not profit
  try { const acts = await api(BASE, `/v2/account/activities?${new URLSearchParams({ activity_types: 'CSD,CSW,JNLC', date: et().date })}`); for (const x of acts || []) netCash += +x.net_amount || 0; } catch {}
  hudCache = { at: Date.now(), v: { mode: mode(), running: !!timer && !S.halted, halted: S.halted, equity: +a.equity, accountToday: Math.round((+a.equity - +a.last_equity - netCash) * 100) / 100,
    elisToday: Math.round((byDay[today] || 0) * 100) / 100, elisLifetime: Math.round(cum * 100) / 100, tradeDays: trades, series: series.slice(-90),
    today: S.trade ? `${S.trade.side === 'buy' ? 'LONG' : 'SHORT'} ${S.trade.qty} ${CFG.symbol}` : S.day === et().date ? 'no trade yet' : 'waiting for the open', ...hudExtra() } };
  return hudCache.v;
}
async function sendHud(force = false) {
  try { hud({ type: 'elis', ...(await summary(force)) }); } catch (e) { note('hud summary failed: ' + e.message); }
}
export const lastHud = () => (hudCache.v ? { type: 'elis', ...hudCache.v } : null);
export const _tick = () => tick();
// shared with elis-wave.js
export { api, BASE, DATA, riskOk };
export const tellOut = (t, b) => tell(t, b);
export const noteOut = m => note(m);
export const strategyOn = name => (clean(env.ELIS_STRATEGIES) || 'sweep,wave').split(',').map(x => x.trim()).includes(name);
