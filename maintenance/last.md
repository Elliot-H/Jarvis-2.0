STATUS: done
TIME: 2026-10-02T21:05:27Z
REQUEST: 30-minute full-market mover sweep (stocks and crypto), single biggest mover, only if it fits alert thresholds
RESULT:
Owner, I added a mover sweep that runs every 30 minutes. It checks stocks during market hours and the top 100 crypto around the clock, and picks the single biggest mover. It only reaches you if that mover passes your alert settings: spike percent with volume, drop percent, or unusual volume. If it does not qualify, nothing is sent at all, no message, no phone alert, no voice. When it qualifies you get one line with the symbol, the move and the price. It goes live when Railway redeploys; no APK reinstall. It is untested against live data, so watch the first few.
