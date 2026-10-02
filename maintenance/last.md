STATUS: done
TIME: 2026-10-02T20:23:59Z
REQUEST: After restart, watch list tiles should re-fetch and show daily % (and other per-ticker figures) immediately.
RESULT:
Owner, I found the cause: watch-only tickers were refreshed with a price but no previous close, so the day percent stayed blank until a live quote feed caught up. The server now fetches each watched ticker's previous close from Alpaca on the first check after a restart and every check after, so the day percent shows within a few seconds. The sparkline and verdict already reload on their own. It goes live when Railway redeploys, and no APK reinstall is needed. I could only syntax-check it, not run it against live Alpaca.
