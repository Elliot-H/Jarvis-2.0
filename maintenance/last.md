STATUS: done
TIME: 2026-10-05T15:26:46Z
REQUEST: Build real resting stop orders (fixed and trailing) with list, amend, cancel, and wire into the Investment Watch
RESULT:
Owner, Jarvis can now place real stop orders at the broker. Fixed stops and trailing stops by percent or dollar amount, plus showing, moving and cancelling them. Every change is proposed first, read back with the symbol spelled out, shares, type and level, and only done after you say confirm in your next message. Positions under one whole share, or crypto trailing stops, are refused with the plain reason, and broker rejections are reported and logged as failed commands. The watch status now lists resting stops separately from alert levels, and alerts say either alert level touched, you need to act, or broker stop order resting. It goes live on the Railway redeploy, no APK reinstall. I could only test it against a mock broker, not the real one.
