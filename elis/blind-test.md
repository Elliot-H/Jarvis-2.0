# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2025-10-22, tuned with the why on 2025-03-18 to 2025-10-22, final grade on 2025-10-22 to 2026-11-27 (never touched while tuning).
- Before tuning: 0% right on 0 calls (+0R/trade).
- Tuning (1 rounds): nothing improved; stop -> 0%. Tune set reached 0%.
- FINAL (unseen): 50.3% (+/-1.4) right on 4756 calls (calls on 100% of charts), 44.1% winning trades, -0.05R/trade. Coin flip 50%, "always up" 49.4%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 8864,
 "flatPct": 46.3,
 "callPct": 100,
 "accuracy": 50.3,
 "plusMinus": 1.4,
 "calls": 4756,
 "tradeAvgR": -0.05,
 "tradeWinPct": 44.1,
 "momentumAccuracy": 46.3,
 "momentumAvgR": -0.08,
 "upPct": 49.4,
 "byConfidence": {
  "60-65%": {
   "calls": 2584,
   "accuracy": 50.5
  },
  "55-60%": {
   "calls": 848,
   "accuracy": 51.1
  },
  "65%+": {
   "calls": 1324,
   "accuracy": 49.5
  }
 },
 "bestReads": [
  {
   "read": "time=late morning & news=no news",
   "calls": 321,
   "accuracy": 55.5
  },
  {
   "read": "candle=candle-none & news=no news",
   "calls": 126,
   "accuracy": 53.2
  },
  {
   "read": "vwap=below VWAP & news=no news",
   "calls": 192,
   "accuracy": 52.1
  },
  {
   "read": "volume=vol-weak & news=no news",
   "calls": 817,
   "accuracy": 52
  },
  {
   "read": "time=afternoon & news=no news",
   "calls": 120,
   "accuracy": 51.7
  }
 ],
 "before": {
  "charts": 8864,
  "flatPct": 46.3,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 46.3,
  "momentumAvgR": -0.08,
  "upPct": 49.4,
  "byConfidence": {},
  "bestReads": []
 },
 "afterTuneOnly": {
  "charts": 8864,
  "flatPct": 46.3,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 46.3,
  "momentumAvgR": -0.08,
  "upPct": 49.4,
  "byConfidence": {},
  "bestReads": []
 },
 "afterRelearn": {
  "charts": 8864,
  "flatPct": 46.3,
  "callPct": 100,
  "accuracy": 50.3,
  "plusMinus": 1.4,
  "calls": 4756,
  "tradeAvgR": -0.05,
  "tradeWinPct": 44.1,
  "momentumAccuracy": 46.3,
  "momentumAvgR": -0.08,
  "upPct": 49.4,
  "byConfidence": {
   "60-65%": {
    "calls": 2584,
    "accuracy": 50.5
   },
   "55-60%": {
    "calls": 848,
    "accuracy": 51.1
   },
   "65%+": {
    "calls": 1324,
    "accuracy": 49.5
   }
  },
  "bestReads": [
   {
    "read": "time=late morning & news=no news",
    "calls": 321,
    "accuracy": 55.5
   },
   {
    "read": "candle=candle-none & news=no news",
    "calls": 126,
    "accuracy": 53.2
   },
   {
    "read": "vwap=below VWAP & news=no news",
    "calls": 192,
    "accuracy": 52.1
   },
   {
    "read": "volume=vol-weak & news=no news",
    "calls": 817,
    "accuracy": 52
   },
   {
    "read": "time=afternoon & news=no news",
    "calls": 120,
    "accuracy": 51.7
   }
  ]
 },
 "tuneAcc": 0,
 "steps": [
  {
   "change": "start",
   "acc": 0,
   "calls": 0
  },
  {
   "change": "nothing improved; stop",
   "acc": 0,
   "calls": 0
  }
 ],
 "settings": {
  "mode": "best",
  "minP": 0.55,
  "minN": 80,
  "abstain": [],
  "drop": []
 },
 "learnedOn": "2024-01-02 to 2025-10-22",
 "tunedOn": "2025-03-18 to 2025-10-22",
 "testedOn": "2025-10-22 to 2026-11-27",
 "days": 605,
 "at": "2026-11-28T15:32:51.420Z",
 "rev": 3
}
```
