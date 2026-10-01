STATUS: done
TIME: 2026-10-01T05:17:34Z
REQUEST: Add pre-market data (trades, volume, gap/high/low/VWAP vs prior close) to the investment outlook; volume as conviction signal.
RESULT:
Owner, the market outlook now reads pre-market data for stocks: the gap versus the prior close, pre-market high, low and VWAP, volume versus usual, and prints when your Alpaca keys are set. Heavy pre-market volume raises confidence and thin volume lowers it, and the score stays capped so it never sounds certain. It says paper or live and never trades. It goes live when Railway redeploys; no APK reinstall needed. I could only test it on mock data, so the first real morning run is worth a look.
