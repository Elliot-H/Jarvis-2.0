// Crypto watch: market data from CoinGecko (free public API; optional COINGECKO_API_KEY = free "demo" key,
// which avoids rate limits on shared cloud IPs). News is NOT fetched here: the brain searches the web for the movers.

const BASE = process.env.COINGECKO_API_URL || 'https://api.coingecko.com/api/v3';

const pct = v => (v == null || Number.isNaN(Number(v)) ? null : Math.round(Number(v) * 10) / 10);
const usd = v => {
  if (v == null) return null;
  const n = Number(v);
  return n >= 1 ? Number(n.toFixed(2)) : Number(n.toPrecision(3));
};

export function shape(c) {
  return {
    id: c.id, symbol: String(c.symbol || '').toUpperCase(), name: c.name,
    rank: c.market_cap_rank ?? null,
    price: usd(c.current_price),
    change24h: pct(c.price_change_percentage_24h_in_currency ?? c.price_change_percentage_24h),
    change7d: pct(c.price_change_percentage_7d_in_currency),
    marketCapB: c.market_cap ? Math.round(c.market_cap / 1e7) / 100 : null,
    volumeToCap: c.market_cap && c.total_volume ? Math.round((c.total_volume / c.market_cap) * 100) / 100 : null,
    fromAthPct: pct(c.ath_change_percentage)
  };
}

async function get(pathAndQuery) {
  const headers = { Accept: 'application/json' };
  if (process.env.COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = process.env.COINGECKO_API_KEY;
  const r = await fetch(`${BASE}${pathAndQuery}`, { headers, signal: AbortSignal.timeout(15000) });
  if (r.status === 429) throw new Error('CoinGecko is rate limiting Jarvis. A free CoinGecko demo key (COINGECKO_API_KEY in Railway) fixes it.');
  if (!r.ok) throw new Error(`CoinGecko returned ${r.status}`);
  return r.json();
}

/** Top coins by market cap, plus any watchlist ids (CoinGecko ids like "bitcoin", "solana"). */
const cache = new Map(); // scans are reused for 5 minutes (a brief and the model's own call in the same minute cost one request)
export async function scan(args = {}) {
  const key = JSON.stringify([args.top || 25, [...(args.watch || [])].sort()]);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.t < 300_000) return hit.v;
  const v = await scanFresh(args);
  cache.set(key, { t: Date.now(), v });
  return v;
}
async function scanFresh({ top = 25, watch = [] } = {}) {
  top = Math.min(Math.max(Number(top) || 25, 1), 100);
  const list = await get(`/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${top}&page=1&sparkline=false&price_change_percentage=24h,7d`);
  const coins = list.map(shape);
  const have = new Set(coins.map(c => c.id));
  const extra = watch.map(w => String(w).toLowerCase().trim()).filter(w => w && !have.has(w)).slice(0, 25);
  if (extra.length) {
    const more = await get(`/coins/markets?vs_currency=usd&ids=${encodeURIComponent(extra.join(','))}&sparkline=false&price_change_percentage=24h,7d`);
    for (const c of more) coins.push({ ...shape(c), watched: true });
  }
  const movers = [...coins].filter(c => c.change24h != null).sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 5).map(c => c.symbol);
  return { coins, movers, at: new Date().toISOString() };
}

/** Trending searches on CoinGecko: a rough "what is getting attention" signal. */
export async function trending() {
  const d = await get('/search/trending');
  return (d.coins || []).slice(0, 7).map(x => ({ id: x.item?.id, symbol: x.item?.symbol, name: x.item?.name, rank: x.item?.market_cap_rank ?? null }));
}

// What the brain is told to do with the numbers. Lives in the tool result so it costs nothing on ordinary questions.
export const PLAYBOOK = `How to use this (spoken reply must stay short and stand on its own; fuller detail also goes on the HUD):
1. Web-search news for the biggest movers and anything on the watchlist (at most 3 searches; prefer one search per story, recent days only).
2. For each coin you can say something about: what happened, whether that is likely positive, negative or noise for the price, how confident you are (low/medium/high), and what would change your mind.
3. show_panel id "crypto" with title "Crypto watch": one bullet per coin, ranked by how much the news matters. Add update_stats tiles only for the few coins the Owner follows.
4. Speak the headline and the key numbers aloud (price, 24h move, the one or two stories that matter), e.g. "Bitcoin steady near sixty-four thousand, up one percent. Ether down three on a staking story." Never say "on screen" or "on the HUD".
Ground rules: this is analysis, not financial advice, and you are not a licensed advisor. News moves prices unpredictably and often the move happened before the story; say so when it applies. Never promise a direction. Never place, suggest placing, or offer to place a trade; if asked to, say the Owner must do it himself. If the news search returns nothing solid for a coin, say "no clear news" rather than guessing.`;

/** Which coins moved enough today to be worth a midday look. Watched coins need a smaller move. */
export function notable(coins, pct = 6) {
  return coins.filter(c => c.change24h != null && Math.abs(c.change24h) >= (c.watched ? pct * 0.66 : pct))
    .sort((a, b) => Math.abs(b.change24h) - Math.abs(a.change24h)).slice(0, 6);
}
