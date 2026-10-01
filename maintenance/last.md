STATUS: done
TIME: 2026-10-01T04:40:00Z
REQUEST: add chart/graph reading for stocks and crypto (candles, trend, support/resistance, volume, averages, patterns)
RESULT:
Owner, Jarvis can now read charts for stocks and crypto with a new chart_read tool.
It pulls price bars from Yahoo's free chart feed and works out trend, moving averages, RSI, MACD, volume, support and resistance, breakouts and candle patterns on any timeframe from 5 minutes to monthly.
It is analysis only and never trades. It is server-side, so it goes live when Railway redeploys; no APK reinstall.
I tested the math on sample data, but I could not confirm Yahoo is reachable from Railway, so try "how does Tesla's chart look" once it is live.
