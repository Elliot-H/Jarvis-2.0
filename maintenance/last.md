STATUS: done
TIME: 2026-10-02T21:47:57Z
REQUEST: Make volume-up the first alert trigger, then price, then trend and the rest, tunable live
RESULT:
Owner, alerts now fire first on volume rising above its 20-day average, with no price move needed. Price confirming up is checked next, then price above a rising 20-day average with spike volume. The first-flag threshold is volFirstRatio, default 1.5, and you can change it by voice with alert config, no redeploy. The 30-minute mover sweep also checks the top gainers for volume first. It is live once Railway redeploys, no APK reinstall needed. Alerts stay information only, nothing trades. It was tested on sample data, not live feeds.
