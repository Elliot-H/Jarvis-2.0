// Ticker news: the brain's own web search does the searching; this builds the search plan and the rules.
const CRYPTO = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'AVAX', 'LINK', 'LTC', 'DOT', 'BNB', 'SHIB', 'MATIC', 'USDT', 'USDC', 'TRX', 'TON', 'PEPE', 'UNI', 'ATOM', 'NEAR', 'BCH', 'XLM', 'ARB', 'OP', 'APT', 'SUI']);

export function normSymbol(sym) {
  return String(sym || '').toUpperCase().replace(/[-\/]?USD[T]?$/, '').replace(/[^A-Z0-9.]/g, '').slice(0, 12);
}
export function detectKind(sym, kind) {
  if (kind === 'stock' || kind === 'crypto') return kind;
  const raw = String(sym || '').toUpperCase();
  return CRYPTO.has(normSymbol(sym)) || /[-\/]USD/.test(raw) ? 'crypto' : 'stock';
}

export const NEWS_GUIDE = `How to use this (spoken reply stays short and stands on its own; headlines also go on the HUD):
1. Web-search recent news (last few days; one or two searches) using the queries listed. Keep only real, dated stories from named sources. Never invent a headline, source or date.
2. Pick the top 3 to 5 headlines. For each: headline, source, date.
3. Add ONE plain-English line on what the story means for price (positive, negative or noise, and how confident).
4. show_panel id "ticker_news" title "News: <SYMBOL>" with those bullets. When several tickers are named, one panel with a section per symbol (replace the same id).
5. Say aloud only the headline and direction, e.g. "TSLA: earnings beat, leaning positive." State whether the move has a confirmed catalyst or looks purely technical. If search finds nothing solid, say "no clear catalyst, looks technical" rather than guessing.
Analysis only, not financial advice. News often lands after the move; say so when it applies.`;

export const AUTO_NEWS = 'NEWS STEP: for each symbol you name as a mover or setup (at most 3), call ticker_news and then say whether the move has a confirmed catalyst or looks purely technical. Put the headlines on the HUD in panel id "ticker_news"; speak the headline, direction and key price figure aloud; never say "on screen" or "on the HUD".';

export function plan(symbol, kind) {
  const s = normSymbol(symbol);
  if (!s) return null;
  const k = detectKind(symbol, kind);
  const queries = k === 'crypto'
    ? [`${s} crypto news today`, `${s} exchange listing OR partnership OR regulatory OR upgrade news`]
    : [`${s} stock news today`, `${s} earnings OR SEC filing OR upgrade OR downgrade OR partnership news`];
  return { symbol: s, kind: k, queries, guide: NEWS_GUIDE };
}
