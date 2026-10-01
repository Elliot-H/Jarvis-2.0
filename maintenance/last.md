STATUS: done
TIME: 2026-10-01T20:32:08Z
REQUEST: Stop repeated "Arrived at / welcome to the shop" while he stays at the shop; add debounce and re-arm.
RESULT:
Owner, I found two causes. The current place was not saved across redeploys, so every update looked like a fresh arrival. Also, single stray GPS fixes at the edge flipped you in and out.
Now a place change must hold for three readings over three minutes. A new arrival needs a confirmed leave first, and re-entering within thirty minutes stays silent.
It goes live when Railway redeploys from main. No APK reinstall needed. I tested it with simulated moves only.
