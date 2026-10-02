STATUS: done
TIME: 2026-10-02T22:37:30Z
REQUEST: Make NIGHT crypto token resolve via CoinGecko instead of the stock feeds
RESULT:
NIGHT now routes to CoinGecko with id night, so a NIGHT or NIGHT USD quote returns price, 24h and 7d change and volume instead of no data.
It is added once to the watchlist, so the tile, crypto scan and the alert data pick it up, and it is treated as crypto in charts, news and the HUD.
Not tested against live CoinGecko from here. It goes live when Railway finishes the deploy; no APK reinstall is needed.
