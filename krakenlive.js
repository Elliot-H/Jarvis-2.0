// Real-time crypto prices from Kraken's free public WebSocket (no key). Used for any watched coin that Kraken lists (<SYMBOL>/USD).
// CoinGecko stays the backup and the source of names/ranks; coins Kraken does not list simply never get a live tick.
import { WebSocket } from 'ws';

const URL_WS = process.env.KRAKEN_WS_URL || 'wss://ws.kraken.com/v2';
const px = new Map();        // 'NIGHT' -> { price, pct, at }
const unsupported = new Set();
let ws = null, want = [], subbed = new Set(), onTick = () => {}, retry = 2000, timer = null, status = 'idle';

export const latest = sym => { const v = px.get(String(sym || '').toUpperCase()); return v && Date.now() - v.at < 45e3 ? v : null; };
export const info = () => ({ status, live: [...px.keys()].filter(k => latest(k)), unsupported: [...unsupported] });

function send(o) { try { ws && ws.readyState === 1 && ws.send(JSON.stringify(o)); } catch {} }
function sync() {
  const need = want.filter(s => !subbed.has(s) && !unsupported.has(s));
  if (need.length) { need.forEach(s => subbed.add(s)); send({ method: 'subscribe', params: { channel: 'ticker', symbol: need.map(s => `${s}/USD`) } }); }
}
function connect() {
  if (ws) return;
  status = 'connecting';
  ws = new WebSocket(URL_WS);
  ws.on('open', () => { status = 'live'; retry = 2000; subbed = new Set(); sync(); });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (m.channel === 'ticker' && Array.isArray(m.data)) {
      for (const d of m.data) {
        const sym = String(d.symbol || '').split('/')[0]; const price = Number(d.last);
        if (sym && price > 0) { px.set(sym, { price, pct: d.change_pct != null ? Number(d.change_pct) : null, at: Date.now() }); onTick(sym); }
      }
    } else if (m.method === 'subscribe' && m.success === false) {
      const sym = String(m.symbol || m.result?.symbol || '').split('/')[0];
      if (sym) { unsupported.add(sym); subbed.delete(sym); }   // Kraken does not list it: CoinGecko only
    }
  });
  const drop = () => { ws = null; subbed = new Set(); status = 'reconnecting'; clearTimeout(timer); timer = setTimeout(connect, retry); retry = Math.min(retry * 2, 60000); };
  ws.on('close', drop); ws.on('error', () => { try { ws && ws.terminate(); } catch {} });
  setInterval(() => send({ method: 'ping' }), 25000).unref?.();
}
/** symbols: () => ['NIGHT','BTC',...] re-read every 20 s; onTick(sym) fires on each price update. */
export function start(symbols, tick) {
  onTick = tick || onTick;
  const refresh = () => { want = [...new Set((symbols() || []).map(s => String(s).toUpperCase()).filter(s => /^[A-Z0-9]{2,10}$/.test(s)))].slice(0, 40); connect(); sync(); };
  refresh(); setInterval(refresh, 20000).unref?.();
}
