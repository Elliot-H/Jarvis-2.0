# Elis blind chart test

Blind chart test: 7,972 charts Elis never saw (2025-03-31 to 2026-11-23); it learned from 2024-01-02 to 2025-03-31. Each chart cut at a random moment; Elis calls the next 30 min.
- Calls made on 50.2% of charts (46.2% went nowhere either way).
- Accuracy on its calls: 51.8% (+/-2.1) vs 50% coin flip. When 55-60% sure: 52% over 2121; When 65%+ sure: 55.9% over 34; When 60-65% sure: 46.4% over 84.
- If it had traded every call (stop 0.4x range, 30 min, costs in): 45.1% wins, -0.03R avg per trade.
- Baselines: "keep going" 47.7% (-0.08R), "always up" 49.9%.
- Best reads: candle=candle-against & market=market falling 59.4% (106); vwap=below VWAP & pattern=bear flag 58.7% (46); move=dropping & market=market falling 56.8% (162).

```json
{
 "charts": 7972,
 "flatPct": 46.2,
 "callPct": 50.2,
 "accuracy": 51.8,
 "plusMinus": 2.1,
 "calls": 2239,
 "tradeAvgR": -0.03,
 "tradeWinPct": 45.1,
 "momentumAccuracy": 47.7,
 "momentumAvgR": -0.08,
 "upPct": 49.9,
 "byConfidence": {
  "55-60%": {
   "calls": 2121,
   "accuracy": 52
  },
  "65%+": {
   "calls": 34,
   "accuracy": 55.9
  },
  "60-65%": {
   "calls": 84,
   "accuracy": 46.4
  }
 },
 "bestReads": [
  {
   "read": "candle=candle-against & market=market falling",
   "calls": 106,
   "accuracy": 59.4
  },
  {
   "read": "vwap=below VWAP & pattern=bear flag",
   "calls": 46,
   "accuracy": 58.7
  },
  {
   "read": "move=dropping & market=market falling",
   "calls": 162,
   "accuracy": 56.8
  },
  {
   "read": "market=market flat & pattern=morning star",
   "calls": 52,
   "accuracy": 55.8
  },
  {
   "read": "time=first hour & pattern=none",
   "calls": 62,
   "accuracy": 54.8
  }
 ],
 "learnedOn": "2024-01-02 to 2025-03-31",
 "testedOn": "2025-03-31 to 2026-11-23",
 "at": "2026-11-23T23:50:57.875Z",
 "rev": 1
}
```
