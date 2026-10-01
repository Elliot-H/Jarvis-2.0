STATUS: done
TIME: 2026-10-01T04:53:24Z
REQUEST: Add ticker_news tool and auto-run it for signal_scan, chart_read, crypto_scan movers.
RESULT:
Owner, I added a ticker_news tool that takes a symbol and stock or crypto, auto-detected if you skip it. It uses Jarvis's existing web search to pull the top three to five dated headlines with sources and a one-line price note, and puts them on the HUD panel called ticker_news. Signal scans, chart reads and crypto scans now tell Jarvis to run it for each symbol he names and say whether the move has a confirmed catalyst or looks purely technical. He speaks only the headline and direction. It goes live when Railway redeploys; no APK reinstall needed.
