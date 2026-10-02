STATUS: done
TIME: 2026-10-02T17:18:53Z
REQUEST: Add an always-on live HUD box showing all active holdings with price, value and profit/loss.
RESULT:
Owner, the HUD now has a Holdings box in the left column. It lists every open position with ticker, price, value, and profit or loss in percent and dollars, plus a total.
It updates on every Investment Watch check, so about every 60 seconds. Positions under a dollar go in a small dust line at the bottom, and the box hides when you hold nothing.
It goes live after Railway redeploys; no APK reinstall is needed. It has not been tested against live Alpaca from here, only syntax-checked.
