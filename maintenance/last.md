STATUS: done
TIME: 2026-10-04T17:15:00Z
REQUEST: Watch list adds with no entry price default to today's price and compute the trailing stop
RESULT:
Owner, anything you add to the watch list without an entry price now takes today's live price as the entry. The trailing stop is computed from it right away. Stocks already did this; coins did not, so coin rows now get an entry and stop too, including old coin rows that were blank. I could not test it against the live price feeds from here, only a syntax check. It goes live after Railway redeploys; no APK reinstall is needed.
