STATUS: needs-owner
TIME: 2026-10-02T15:43:12Z
REQUEST: Fix market-data feed keys (Finnhub, Twelve Data, FMP) showing keySet false
RESULT:
I cannot see your Railway variables from here, so I could not confirm what is set. The code reads the right names: FINNHUB_API_KEY, TWELVEDATA_API_KEY and FMP_API_KEY, so the Finnhub lookup is correct. Owner, in Railway Variables for the Jarvis service check the name is exactly FINNHUB_API_KEY with no spaces, that it is on the same service and environment, and that the deploy finished after you saved it. Add TWELVEDATA_API_KEY and FMP_API_KEY too, since those are still missing. I added a names-only hint to data_feeds, so after this deploys it will list any similar variable names Railway really provides. No app reinstall needed.
