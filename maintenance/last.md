STATUS: done
TIME: 2026-10-02T19:05:00Z
REQUEST: Never alert on dust positions (under a small dollar threshold), independent of the watch list
RESULT:
Owner, done. Any open position worth under one dollar is now ignored by every alert: stop hit, sudden drop, target, scale-out, sell warning, spike and news. That covers stocks and crypto, with or without a watch-list row. Dust also no longer appears as an automatic watch-list row. The one dollar line is adjustable by voice through alert settings or the DUST_USD variable. It goes live when Railway redeploys, no APK reinstall. I checked syntax only; the server could not boot here because packages are not installed.
