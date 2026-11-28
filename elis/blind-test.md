# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2026-02-09, tuned with the why on 2025-05-28 to 2026-02-09, final grade on 2026-02-09 to 2026-11-27 (never touched while tuning).
- Before tuning: 0% right on 0 calls (+0R/trade).
- Tuning (1 rounds): nothing improved; stop -> 0%. Tune set reached 0%.
- FINAL (unseen): 51.4% (+/-1.4) right on 5084 calls (calls on 96% of charts), 44.5% winning trades, -0.04R/trade. Coin flip 50%, "always up" 48.5%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 10304,
 "flatPct": 48.9,
 "callPct": 96,
 "accuracy": 51.4,
 "plusMinus": 1.4,
 "calls": 5084,
 "tradeAvgR": -0.04,
 "tradeWinPct": 44.5,
 "momentumAccuracy": 45.8,
 "momentumAvgR": -0.09,
 "upPct": 48.5,
 "byConfidence": {
  "55-60%": {
   "calls": 3876,
   "accuracy": 51.5
  },
  "60-65%": {
   "calls": 1208,
   "accuracy": 51
  }
 },
 "bestReads": [
  {
   "read": "move=rising & rvol=rvol 4-8",
   "calls": 95,
   "accuracy": 67.4
  },
  {
   "read": "time=late morning & gap=gapped down",
   "calls": 198,
   "accuracy": 63.6
  },
  {
   "read": "move=dropping & rvol=rvol 4-8",
   "calls": 66,
   "accuracy": 62.1
  },
  {
   "read": "move=rising hard & vwap=above VWAP",
   "calls": 103,
   "accuracy": 58.3
  },
  {
   "read": "time=late morning & gap=gapped up 3%+",
   "calls": 42,
   "accuracy": 57.1
  }
 ],
 "before": {
  "charts": 10304,
  "flatPct": 48.9,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 45.8,
  "momentumAvgR": -0.09,
  "upPct": 48.5,
  "byConfidence": {},
  "bestReads": []
 },
 "afterTuneOnly": {
  "charts": 10304,
  "flatPct": 48.9,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 45.8,
  "momentumAvgR": -0.09,
  "upPct": 48.5,
  "byConfidence": {},
  "bestReads": []
 },
 "afterRelearn": {
  "charts": 10304,
  "flatPct": 48.9,
  "callPct": 96,
  "accuracy": 51.4,
  "plusMinus": 1.4,
  "calls": 5084,
  "tradeAvgR": -0.04,
  "tradeWinPct": 44.5,
  "momentumAccuracy": 45.8,
  "momentumAvgR": -0.09,
  "upPct": 48.5,
  "byConfidence": {
   "55-60%": {
    "calls": 3876,
    "accuracy": 51.5
   },
   "60-65%": {
    "calls": 1208,
    "accuracy": 51
   }
  },
  "bestReads": [
   {
    "read": "move=rising & rvol=rvol 4-8",
    "calls": 95,
    "accuracy": 67.4
   },
   {
    "read": "time=late morning & gap=gapped down",
    "calls": 198,
    "accuracy": 63.6
   },
   {
    "read": "move=dropping & rvol=rvol 4-8",
    "calls": 66,
    "accuracy": 62.1
   },
   {
    "read": "move=rising hard & vwap=above VWAP",
    "calls": 103,
    "accuracy": 58.3
   },
   {
    "read": "time=late morning & gap=gapped up 3%+",
    "calls": 42,
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
 "learnedOn": "2024-01-02 to 2026-02-09",
 "tunedOn": "2025-05-28 to 2026-02-09",
 "testedOn": "2026-02-09 to 2026-11-27",
 "days": 703,
 "at": "2026-11-28T15:45:13.406Z",
 "rev": 3
}
```
