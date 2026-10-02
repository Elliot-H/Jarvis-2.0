STATUS: needs-owner
TIME: 2026-10-02T18:29:25Z
REQUEST: ATR-aware trailing stop, scale-out tranches with breakeven ratchet, per-position stop/next level/realised vs open P&L, real broker stop orders
RESULT:
Owner, parts one to three are built. The trailing stop now follows two times that ticker's own ATR or its swing low and only moves up, and it resets once so old ten percent stops do not shake you out. Alerts tell you to sell a third at plus one R and plus two R, and after the first one the stop moves to breakeven plus costs. Holdings shows the trail stop, next scale-out level, open and realised profit. It goes live when Railway redeploys, no APK reinstall. I did not build real stop and limit orders at Alpaca, because that is order-placing code and needs your yes in an interactive session, so say so and I will add it with your confirm step.
