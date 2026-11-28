# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2025-12-31, tuned with the why on 2025-05-02 to 2025-12-31, final grade on 2025-12-31 to 2026-11-27 (never touched while tuning).
- Before tuning: 0% right on 0 calls (+0R/trade).
- Tuning (1 rounds): nothing improved; stop -> 0%. Tune set reached 0%.
- FINAL (unseen): 50.7% (+/-1.4) right on 5060 calls (calls on 98.1% of charts), 44.5% winning trades, -0.04R/trade. Coin flip 50%, "always up" 49.1%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 9824,
 "flatPct": 47.7,
 "callPct": 98.1,
 "accuracy": 50.7,
 "plusMinus": 1.4,
 "calls": 5060,
 "tradeAvgR": -0.04,
 "tradeWinPct": 44.5,
 "momentumAccuracy": 45,
 "momentumAvgR": -0.09,
 "upPct": 49.1,
 "byConfidence": {
  "55-60%": {
   "calls": 3394,
   "accuracy": 51.2
  },
  "60-65%": {
   "calls": 1666,
   "accuracy": 49.7
  }
 },
 "bestReads": [
  {
   "read": "volume=vol-weak & gap=gapped up",
   "calls": 53,
   "accuracy": 60.4
  },
  {
   "read": "pattern=three black crows & rvol=rvol 8+",
   "calls": 162,
   "accuracy": 59.3
  },
  {
   "read": "volume=vol-weak & pattern=none",
   "calls": 90,
   "accuracy": 58.9
  },
  {
   "read": "volume=vol-weak & market=market falling",
   "calls": 341,
   "accuracy": 56
  },
  {
   "read": "vwap=below VWAP & time=first hour",
   "calls": 50,
   "accuracy": 56
  }
 ],
 "before": {
  "charts": 9824,
  "flatPct": 47.7,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 45,
  "momentumAvgR": -0.09,
  "upPct": 49.1,
  "byConfidence": {},
  "bestReads": []
 },
 "afterTuneOnly": {
  "charts": 9824,
  "flatPct": 47.7,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 45,
  "momentumAvgR": -0.09,
  "upPct": 49.1,
  "byConfidence": {},
  "bestReads": []
 },
 "afterRelearn": {
  "charts": 9824,
  "flatPct": 47.7,
  "callPct": 98.1,
  "accuracy": 50.7,
  "plusMinus": 1.4,
  "calls": 5060,
  "tradeAvgR": -0.04,
  "tradeWinPct": 44.5,
  "momentumAccuracy": 45,
  "momentumAvgR": -0.09,
  "upPct": 49.1,
  "byConfidence": {
   "55-60%": {
    "calls": 3394,
    "accuracy": 51.2
   },
   "60-65%": {
    "calls": 1666,
    "accuracy": 49.7
   }
  },
  "bestReads": [
   {
    "read": "volume=vol-weak & gap=gapped up",
    "calls": 53,
    "accuracy": 60.4
   },
   {
    "read": "pattern=three black crows & rvol=rvol 8+",
    "calls": 162,
    "accuracy": 59.3
   },
   {
    "read": "volume=vol-weak & pattern=none",
    "calls": 90,
    "accuracy": 58.9
   },
   {
    "read": "volume=vol-weak & market=market falling",
    "calls": 341,
    "accuracy": 56
   },
   {
    "read": "vwap=below VWAP & time=first hour",
    "calls": 50,
    "accuracy": 56
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
 "learnedOn": "2024-01-02 to 2025-12-31",
 "tunedOn": "2025-05-02 to 2025-12-31",
 "testedOn": "2025-12-31 to 2026-11-27",
 "days": 669,
 "at": "2026-11-28T15:41:04.286Z",
 "rev": 3
}
```
