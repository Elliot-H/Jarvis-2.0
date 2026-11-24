# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2025-05-01, tuned with the why on 2024-11-18 to 2025-05-01, final grade on 2025-05-01 to 2026-11-23 (never touched while tuning).
- Before tuning: 51.8% right on 2941 calls (-0.03R/trade).
- Tuning (4 rounds): switch to blend of the 5 strongest reads -> 50.1%; call only when 57%+ sure -> 55.2%; don't call when sector = against-sector (why: 47% right over 106) -> 60.6%; nothing improved; stop -> 60.6%. Tune set reached 60.6%.
- FINAL (unseen): 60.4% (+/-13.5) right on 53 calls (calls on 1.7% of charts), 45.5% winning trades, +0.01R/trade. Coin flip 50%, "always up" 49.9%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 6656,
 "flatPct": 45.1,
 "callPct": 1.7,
 "accuracy": 60.4,
 "plusMinus": 13.5,
 "calls": 53,
 "tradeAvgR": 0.01,
 "tradeWinPct": 45.5,
 "momentumAccuracy": 48.7,
 "momentumAvgR": -0.07,
 "upPct": 49.9,
 "byConfidence": {
  "55-60%": {
   "calls": 53,
   "accuracy": 60.4
  }
 },
 "bestReads": [
  {
   "read": "move=flat & mktGap=spy-gap-down",
   "calls": 45,
   "accuracy": 60
  }
 ],
 "before": {
  "charts": 6656,
  "flatPct": 45.1,
  "callPct": 77.9,
  "accuracy": 51.8,
  "plusMinus": 1.8,
  "calls": 2941,
  "tradeAvgR": -0.03,
  "tradeWinPct": 45.2,
  "momentumAccuracy": 48.7,
  "momentumAvgR": -0.07,
  "upPct": 49.9,
  "byConfidence": {
   "60-65%": {
    "calls": 473,
    "accuracy": 47.6
   },
   "55-60%": {
    "calls": 2346,
    "accuracy": 52.3
   },
   "65%+": {
    "calls": 122,
    "accuracy": 58.2
   }
  },
  "bestReads": [
   {
    "read": "candle=candle-against & market=market falling",
    "calls": 47,
    "accuracy": 68.1
   },
   {
    "read": "fear=fear-falling & sector=with-sector",
    "calls": 51,
    "accuracy": 60.8
   },
   {
    "read": "structure=range & pattern=bullish engulfing",
    "calls": 45,
    "accuracy": 60
   },
   {
    "read": "time=midday & mktGap=spy-gap-down",
    "calls": 100,
    "accuracy": 60
   },
   {
    "read": "move=dropping & candle=candle-against",
    "calls": 91,
    "accuracy": 59.3
   }
  ]
 },
 "afterTuneOnly": {
  "charts": 6656,
  "flatPct": 45.1,
  "callPct": 1.7,
  "accuracy": 60.4,
  "plusMinus": 13.5,
  "calls": 53,
  "tradeAvgR": 0.01,
  "tradeWinPct": 45.5,
  "momentumAccuracy": 48.7,
  "momentumAvgR": -0.07,
  "upPct": 49.9,
  "byConfidence": {
   "55-60%": {
    "calls": 53,
    "accuracy": 60.4
   }
  },
  "bestReads": [
   {
    "read": "move=flat & mktGap=spy-gap-down",
    "calls": 45,
    "accuracy": 60
   }
  ]
 },
 "afterRelearn": {
  "charts": 6656,
  "flatPct": 45.1,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 48.7,
  "momentumAvgR": -0.07,
  "upPct": 49.9,
  "byConfidence": {},
  "bestReads": []
 },
 "tuneAcc": 60.6,
 "steps": [
  {
   "change": "start",
   "acc": 49,
   "calls": 2980
  },
  {
   "change": "switch to blend of the 5 strongest reads",
   "acc": 50.1,
   "calls": 730
  },
  {
   "change": "call only when 57%+ sure",
   "acc": 55.2,
   "calls": 261
  },
  {
   "change": "don't call when sector = against-sector (why: 47% right over 106)",
   "acc": 60.6,
   "calls": 155
  },
  {
   "change": "nothing improved; stop",
   "acc": 60.6,
   "calls": 155
  }
 ],
 "settings": {
  "mode": "vote",
  "minP": 0.57,
  "minN": 80,
  "abstain": [
   {
    "k": "sector",
    "v": "against-sector"
   }
  ],
  "drop": []
 },
 "learnedOn": "2024-01-02 to 2025-05-01",
 "tunedOn": "2024-11-18 to 2025-05-01",
 "testedOn": "2025-05-01 to 2026-11-23",
 "days": 445,
 "at": "2026-11-24T01:45:32.838Z",
 "rev": 3
}
```
