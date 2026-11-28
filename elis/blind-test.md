# Elis blind chart test

Blind chart loop: learned 2024-01-02 to 2025-06-02, tuned with the why on 2024-12-09 to 2025-06-02, final grade on 2025-06-02 to 2026-11-27 (never touched while tuning).
- Before tuning: 0% right on 0 calls (+0R/trade).
- Tuning (1 rounds): nothing improved; stop -> 0%. Tune set reached 0%.
- FINAL (unseen): 0% (+/-0) right on 0 calls (calls on 0% of charts), 0% winning trades, +0R/trade. Coin flip 50%, "always up" 49.9%.
- The tune-set result carried over to unseen charts.

```json
{
 "charts": 1436,
 "flatPct": 38.8,
 "callPct": 0,
 "accuracy": 0,
 "plusMinus": 0,
 "calls": 0,
 "tradeAvgR": 0,
 "tradeWinPct": 0,
 "momentumAccuracy": 50.3,
 "momentumAvgR": -0.01,
 "upPct": 49.9,
 "byConfidence": {},
 "bestReads": [],
 "before": {
  "charts": 1436,
  "flatPct": 38.8,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 50.3,
  "momentumAvgR": -0.01,
  "upPct": 49.9,
  "byConfidence": {},
  "bestReads": []
 },
 "afterTuneOnly": {
  "charts": 1436,
  "flatPct": 38.8,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 50.3,
  "momentumAvgR": -0.01,
  "upPct": 49.9,
  "byConfidence": {},
  "bestReads": []
 },
 "afterRelearn": {
  "charts": 1436,
  "flatPct": 38.8,
  "callPct": 0,
  "accuracy": 0,
  "plusMinus": 0,
  "calls": 0,
  "tradeAvgR": 0,
  "tradeWinPct": 0,
  "momentumAccuracy": 50.3,
  "momentumAvgR": -0.01,
  "upPct": 49.9,
  "byConfidence": {},
  "bestReads": []
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
 "learnedOn": "2024-01-02 to 2025-06-02",
 "tunedOn": "2024-12-09 to 2025-06-02",
 "testedOn": "2025-06-02 to 2026-11-27",
 "days": 472,
 "at": "2026-11-28T15:16:39.602Z",
 "rev": 3
}
```
