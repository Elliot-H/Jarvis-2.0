STATUS: done
TIME: 2026-10-02T18:26:40Z
REQUEST: 10% trailing stop on every watch-list row, shown on the HUD, ratchet up only, fixed stop as fallback
RESULT:
Owner, every watch row now gets a 10% trailing stop under its highest price seen, including QTEX, SCKT and any future ones. The Holdings and watch boxes show it as trail, and it only ever moves up. Stop-hit alerts use it too. With no price data it falls back to the old fixed stop. The earlier Alpaca-only trailing change was not in the repo, so this covers all rows in one place. It goes live when Railway redeploys, no APK reinstall. I only syntax-checked it, and it sends alerts only, no broker stop orders.
