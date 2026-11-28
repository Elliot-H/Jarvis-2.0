# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2025-11-25, tuned with the why on 2025-04-09 to 2025-11-25, final grade on 2025-11-25 to 2026-11-27 (never touched while tuning).
- Before tuning: 0% right on 0 calls (+0R/trade).
- Tuning (1 rounds): nothing improved; stop -> 0%. Tune set reached 0%.
- FINAL (unseen): 51.1% (+/-1.4) right on 4805 calls (calls on 99.7% of charts), 44.4% winning trades, -0.04R/trade. Coin flip 50%, "always up" 49.2%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 9284,
 "flatPct": 48.2,
 "callPct": 99.7,
 "accuracy": 51.1,
 "plusMinus": 1.4,
 "calls": 4805,
 "tradeAvgR": -0.04,
 "tradeWinPct": 44.4,
 "momentumAccuracy": 46,
 "momentumAvgR": -0.08,
 "upPct": 49.2,
 "byConfidence": {
  "60-65%": {
   "calls": 2016,
   "accuracy": 49.5
  },
  "55-60%": {
   "calls": 2445,
   "accuracy": 51.6
  },
  "65%+": {
   "calls": 344,
   "accuracy": 57
  }
 },
 "bestReads": [
  {
   "read": "vwap=below VWAP & gap=gapped down 3%+",
   "calls": 56,
   "accuracy": 60.7
  },
  {
   "read": "move=flat & structure=trend-with",
   "calls": 106,
   "accuracy": 58.5
  },
  {
   "read": "candle=candle-with & gap=gapped down 3%+",
   "calls": 207,
   "accuracy": 58.5
  },
  {
   "read": "move=flat & volume=vol-weak",
   "calls": 50,
   "accuracy": 58
  },
  {
   "read": "move=dropping & gap=gapped up 3%+",
   "calls": 231,
   "accuracy": 57.1
  }
 ],
 "before": {
  "charts": 9284,
  "flatPct": 48.2,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 46,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {},
  "bestReads": []
 },
 "afterTuneOnly": {
  "charts": 9284,
  "flatPct": 48.2,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 46,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {},
  "bestReads": []
 },
 "afterRelearn": {
  "charts": 9284,
  "flatPct": 48.2,
  "callPct": 99.7,
  "accuracy": 51.1,
  "plusMinus": 1.4,
  "calls": 4805,
  "tradeAvgR": -0.04,
  "tradeWinPct": 44.4,
  "momentumAccuracy": 46,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {
   "60-65%": {
    "calls": 2016,
    "accuracy": 49.5
   },
   "55-60%": {
    "calls": 2445,
    "accuracy": 51.6
   },
   "65%+": {
    "calls": 344,
    "accuracy": 57
   }
  },
  "bestReads": [
   {
    "read": "vwap=below VWAP & gap=gapped down 3%+",
    "calls": 56,
    "accuracy": 60.7
   },
   {
    "read": "move=flat & structure=trend-with",
    "calls": 106,
    "accuracy": 58.5
   },
   {
    "read": "candle=candle-with & gap=gapped down 3%+",
    "calls": 207,
    "accuracy": 58.5
   },
   {
    "read": "move=flat & volume=vol-weak",
    "calls": 50,
    "accuracy": 58
   },
   {
    "read": "move=dropping & gap=gapped up 3%+",
    "calls": 231,
    "accuracy": 57.1
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
 "learnedOn": "2024-01-02 to 2025-11-25",
 "tunedOn": "2025-04-09 to 2025-11-25",
 "testedOn": "2025-11-25 to 2026-11-27",
 "days": 636,
 "at": "2026-11-28T15:36:57.663Z",
 "rev": 3
}
```
