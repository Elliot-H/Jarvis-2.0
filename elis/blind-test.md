# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2026-03-10, tuned with the why on 2025-06-17 to 2026-03-10, final grade on 2026-03-10 to 2026-11-27 (never touched while tuning).
- Before tuning: 50.7% right on 5556 calls (-0.05R/trade).
- Tuning (3 rounds): don't call when pattern = strong bear candle (why: 41% right over 147) -> 49.7%; don't call when move = rising (why: 46% right over 537) -> 50.4%; nothing improved; stop -> 50.4%. Tune set reached 50.4%.
- FINAL (unseen): 48.8% (+/-1.6) right on 3560 calls (calls on 66.7% of charts), 43.1% winning trades, -0.06R/trade. Coin flip 50%, "always up" 49.2%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 10968,
 "flatPct": 48.7,
 "callPct": 66.7,
 "accuracy": 48.8,
 "plusMinus": 1.6,
 "calls": 3560,
 "tradeAvgR": -0.06,
 "tradeWinPct": 43.1,
 "momentumAccuracy": 47.7,
 "momentumAvgR": -0.08,
 "upPct": 49.2,
 "byConfidence": {
  "55-60%": {
   "calls": 2969,
   "accuracy": 48.6
  },
  "60-65%": {
   "calls": 591,
   "accuracy": 49.7
  }
 },
 "bestReads": [
  {
   "read": "structure=range & pattern=spinning top",
   "calls": 64,
   "accuracy": 65.6
  },
  {
   "read": "structure=range & volume=vol-strong",
   "calls": 105,
   "accuracy": 58.1
  },
  {
   "read": "structure=trend-against & time=first hour",
   "calls": 66,
   "accuracy": 57.6
  },
  {
   "read": "time=afternoon & gap=gapped up",
   "calls": 84,
   "accuracy": 54.8
  },
  {
   "read": "candle=candle-with & market=market falling",
   "calls": 109,
   "accuracy": 53.2
  }
 ],
 "before": {
  "charts": 10968,
  "flatPct": 48.7,
  "callPct": 99.1,
  "accuracy": 50.7,
  "plusMinus": 1.3,
  "calls": 5556,
  "tradeAvgR": -0.05,
  "tradeWinPct": 44.6,
  "momentumAccuracy": 47.7,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {
   "65%+": {
    "calls": 4918,
    "accuracy": 51.3
   },
   "60-65%": {
    "calls": 638,
    "accuracy": 46.2
   }
  },
  "bestReads": [
   {
    "read": "market=market flat & news=no news",
    "calls": 891,
    "accuracy": 52.2
   },
   {
    "read": "structure=range & news=no news",
    "calls": 2002,
    "accuracy": 52
   },
   {
    "read": "structure=range & buzz=buzz-unknown",
    "calls": 1367,
    "accuracy": 51.4
   },
   {
    "read": "news=no news & newsType=none",
    "calls": 413,
    "accuracy": 50.1
   },
   {
    "read": "market=market flat & buzz=buzz-unknown",
    "calls": 658,
    "accuracy": 47.6
   }
  ]
 },
 "afterTuneOnly": {
  "charts": 10968,
  "flatPct": 48.7,
  "callPct": 83.8,
  "accuracy": 50.7,
  "plusMinus": 1.5,
  "calls": 4523,
  "tradeAvgR": -0.05,
  "tradeWinPct": 44.4,
  "momentumAccuracy": 47.7,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {
   "65%+": {
    "calls": 4015,
    "accuracy": 51.3
   },
   "60-65%": {
    "calls": 508,
    "accuracy": 46.1
   }
  },
  "bestReads": [
   {
    "read": "market=market flat & news=no news",
    "calls": 703,
    "accuracy": 52.9
   },
   {
    "read": "structure=range & news=no news",
    "calls": 1705,
    "accuracy": 51.9
   },
   {
    "read": "structure=range & buzz=buzz-unknown",
    "calls": 1100,
    "accuracy": 51.2
   },
   {
    "read": "news=no news & newsType=none",
    "calls": 317,
    "accuracy": 50.2
   },
   {
    "read": "market=market flat & buzz=buzz-unknown",
    "calls": 507,
    "accuracy": 46.9
   }
  ]
 },
 "afterRelearn": {
  "charts": 10968,
  "flatPct": 48.7,
  "callPct": 66.7,
  "accuracy": 48.8,
  "plusMinus": 1.6,
  "calls": 3560,
  "tradeAvgR": -0.06,
  "tradeWinPct": 43.1,
  "momentumAccuracy": 47.7,
  "momentumAvgR": -0.08,
  "upPct": 49.2,
  "byConfidence": {
   "55-60%": {
    "calls": 2969,
    "accuracy": 48.6
   },
   "60-65%": {
    "calls": 591,
    "accuracy": 49.7
   }
  },
  "bestReads": [
   {
    "read": "structure=range & pattern=spinning top",
    "calls": 64,
    "accuracy": 65.6
   },
   {
    "read": "structure=range & volume=vol-strong",
    "calls": 105,
    "accuracy": 58.1
   },
   {
    "read": "structure=trend-against & time=first hour",
    "calls": 66,
    "accuracy": 57.6
   },
   {
    "read": "time=afternoon & gap=gapped up",
    "calls": 84,
    "accuracy": 54.8
   },
   {
    "read": "candle=candle-with & market=market falling",
    "calls": 109,
    "accuracy": 53.2
   }
  ]
 },
 "tuneAcc": 50.4,
 "steps": [
  {
   "change": "start",
   "acc": 49.3,
   "calls": 3400
  },
  {
   "change": "don't call when pattern = strong bear candle (why: 41% right over 147)",
   "acc": 49.7,
   "calls": 3253
  },
  {
   "change": "don't call when move = rising (why: 46% right over 537)",
   "acc": 50.4,
   "calls": 2716
  },
  {
   "change": "nothing improved; stop",
   "acc": 50.4,
   "calls": 2716
  }
 ],
 "settings": {
  "mode": "best",
  "minP": 0.55,
  "minN": 80,
  "abstain": [
   {
    "k": "pattern",
    "v": "strong bear candle"
   },
   {
    "k": "move",
    "v": "rising"
   }
  ],
  "drop": []
 },
 "learnedOn": "2024-01-02 to 2026-03-10",
 "tunedOn": "2025-06-17 to 2026-03-10",
 "testedOn": "2026-03-10 to 2026-11-27",
 "days": 730,
 "at": "2026-11-28T15:49:50.135Z",
 "rev": 3
}
```
