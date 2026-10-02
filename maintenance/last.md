STATUS: done
TIME: 2026-10-02T20:24:22Z
REQUEST: Watch list: refetch daily percent change for every symbol on app load after a restart.
RESULT:
Owner, the watch list tiles now get their daily percent back after a restart. An earlier fix already pulls previous close from Alpaca; I added a second safety net that fetches one quote per watched stock 8 seconds after boot and retries every 30 minutes if any are missing. It goes live when Railway redeploys, and no APK reinstall is needed. I could only syntax-check it, not run it against live feeds.
