STATUS: done
TIME: 2026-10-02T22:56:48Z
REQUEST: Make the HUD watch list show live data for crypto entries like NIGHT via CoinGecko
RESULT:
Most of this was already in place: NIGHT is on the watch list as a CoinGecko coin and its tile pulls price and 24 hour change from CoinGecko, not the stock feeds.
I closed one gap: a coin ticker like NIGHT added to the stock watch list now also triggers the CoinGecko fetch, so that tile no longer stays blank.
It goes live when Railway deploys this push, and no APK reinstall is needed.
I could not test against live CoinGecko from here, only a syntax check. If the tile is still blank, the row's note will show the CoinGecko error.
