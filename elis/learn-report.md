# Elis learning report

2026-11-28T15:06:39.311Z

Kept current settings (448 sessions, tested on the last 135 it did not learn from).
Unseen days: win rate 41% -> 0%, avg -0.28R -> 0R, avg win 1.24R -> 0R.
Changes: picks 3 -> 2, trailR 1 -> 0.75, keepMinR 1 -> 0.5.


## Why (unseen days)

Only 0 trades: too few to say why.

If Elis had started with $3,000 on 2024-01-02 (to 2026-11-27):
BEFORE (current settings): $3,000 -> $3,000 (+0%), max drawdown 0%, 0 trades, 0% wins, avg win $0 / avg loss $0, 0/23 red months
AFTER (learned settings): $3,000 -> $3,000 (+0%), max drawdown 0%, 0 trades, 0% wins, avg win $0 / avg loss $0, 0/23 red months
Honest check, only the 135 sessions the learner never saw (2025-04-02 to 2026-11-27), $3,000 start:
BEFORE: $3,000 -> $3,000 (+0%), max drawdown 0%, 0 trades, 0% wins, avg win $0 / avg loss $0, 0/8 red months
AFTER: $3,000 -> $3,000 (+0%), max drawdown 0%, 0 trades, 0% wins, avg win $0 / avg loss $0, 0/8 red months

## Formula search

Searched 0 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).
No formula was profitable on both the training days and the unseen days.

## Pivot study

0 moments

No drop signal held up on unseen days.

No rise signal held up on unseen days.

## Experiments

Experiments on the 135 unseen sessions (current: 284 trades, 41% wins, avg -0.28R, total -80R):
- study rules (hold to close, 10% ATR stop), top 3, entries to 11:00: 0 trades, 0% wins, avg 0R, total 0R
- study rules, top 5, entries to 11:00: 0 trades, 0% wins, avg 0R, total 0R
- study rules, top 3, entries all day: 0 trades, 0% wins, avg 0R, total 0R
- study rules + sell on bad news, top 3: 0 trades, 0% wins, avg 0R, total 0R
- Elis exits, but 10% ATR stop: 0 trades, 0% wins, avg 0R, total 0R
- Elis + sell on pivot warning >= 45%: 0 trades, 0% wins, avg 0R, total 0R
- Elis + sell on pivot warning >= 55%: 0 trades, 0% wins, avg 0R, total 0R
- Elis + sell on pivot warning >= 65%: 0 trades, 0% wins, avg 0R, total 0R

## QQQ strategy history

{"sessions":400,"trades":329,"winRatePct":30.1,"totalR":-44.37,"profitFactor":0.81,"returnPct":-37.7,"maxDrawdownPct":-55.2}

## Proposals

No new rule or process beat the current setup on the unseen days, so nothing to change.

```json
{
 "why": {
  "n": 0,
  "overall": null,
  "findings": [],
  "text": "Only 0 trades: too few to say why."
 },
 "money": {
  "before": {
   "from": "2024-01-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 3000,
   "returnPct": 0,
   "maxDrawdownPct": 0,
   "trades": 0,
   "winRatePct": 0,
   "avgWinUsd": 0,
   "avgLossUsd": 0,
   "bestDay": {
    "day": "2024-01-02",
    "usd": 0
   },
   "worstDay": {
    "day": "2024-01-02",
    "usd": 0
   },
   "redMonths": 0,
   "months": 23,
   "worstMonth": {
    "m": "2024-01",
    "end": 3000,
    "pct": 0
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-02",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-03",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-11",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-12",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-01",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-02",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-03",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2026-11",
     "end": 3000,
     "pct": 0
    }
   ]
  },
  "after": {
   "from": "2024-01-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 3000,
   "returnPct": 0,
   "maxDrawdownPct": 0,
   "trades": 0,
   "winRatePct": 0,
   "avgWinUsd": 0,
   "avgLossUsd": 0,
   "bestDay": {
    "day": "2024-01-02",
    "usd": 0
   },
   "worstDay": {
    "day": "2024-01-02",
    "usd": 0
   },
   "redMonths": 0,
   "months": 23,
   "worstMonth": {
    "m": "2024-01",
    "end": 3000,
    "pct": 0
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-02",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-03",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-11",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2024-12",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-01",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-02",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-03",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2026-11",
     "end": 3000,
     "pct": 0
    }
   ]
  },
  "unseenBefore": {
   "from": "2025-04-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 3000,
   "returnPct": 0,
   "maxDrawdownPct": 0,
   "trades": 0,
   "winRatePct": 0,
   "avgWinUsd": 0,
   "avgLossUsd": 0,
   "bestDay": {
    "day": "2025-04-02",
    "usd": 0
   },
   "worstDay": {
    "day": "2025-04-02",
    "usd": 0
   },
   "redMonths": 0,
   "months": 8,
   "worstMonth": {
    "m": "2025-04",
    "end": 3000,
    "pct": 0
   },
   "monthly": [
    {
     "m": "2025-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2026-11",
     "end": 3000,
     "pct": 0
    }
   ]
  },
  "unseenAfter": {
   "from": "2025-04-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 3000,
   "returnPct": 0,
   "maxDrawdownPct": 0,
   "trades": 0,
   "winRatePct": 0,
   "avgWinUsd": 0,
   "avgLossUsd": 0,
   "bestDay": {
    "day": "2025-04-02",
    "usd": 0
   },
   "worstDay": {
    "day": "2025-04-02",
    "usd": 0
   },
   "redMonths": 0,
   "months": 8,
   "worstMonth": {
    "m": "2025-04",
    "end": 3000,
    "pct": 0
   },
   "monthly": [
    {
     "m": "2025-04",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-05",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-06",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-07",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-08",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-09",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2025-10",
     "end": 3000,
     "pct": 0
    },
    {
     "m": "2026-11",
     "end": 3000,
     "pct": 0
    }
   ]
  }
 },
 "proposals": [],
 "gaps": [],
 "experiments": [
  {
   "name": "study rules (hold to close, 10% ATR stop), top 3, entries to 11:00",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "study rules, top 5, entries to 11:00",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "study rules, top 3, entries all day",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "study rules + sell on bad news, top 3",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "Elis exits, but 10% ATR stop",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 45%",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 55%",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 65%",
   "unseen": {
    "trades": 0,
    "totalR": 0,
    "avgR": 0,
    "winRatePct": 0,
    "avgWinR": 0,
    "avgLossR": 0
   }
  }
 ],
 "pivot": {
  "samples": 0,
  "signals": [],
  "base": {
   "up": 0,
   "down": 0
  },
  "text": "No drop signal held up on unseen days.\n\nNo rise signal held up on unseen days."
 },
 "formula": {
  "tested": 176,
  "moments": 0,
  "baseTrain": null,
  "baseTest": null,
  "list": [],
  "text": "Searched 0 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).\nNo formula was profitable on both the training days and the unseen days."
 },
 "at": "2026-11-28T15:06:32.350Z",
 "sessions": 448,
 "candidates": 6775,
 "firstDay": "2024-01-02",
 "lastDay": "2026-11-27",
 "trainSessions": 313,
 "testSessions": 135,
 "current": {
  "trades": 284,
  "totalR": -80,
  "avgR": -0.28,
  "winRatePct": 41,
  "avgWinR": 1.24,
  "avgLossR": 1.34
 },
 "learned": {
  "trades": 0,
  "totalR": 0,
  "avgR": 0,
  "winRatePct": 0,
  "avgWinR": 0,
  "avgLossR": 0
 },
 "adopted": false,
 "changes": [
  "picks 3 -> 2",
  "trailR 1 -> 0.75",
  "keepMinR 1 -> 0.5"
 ],
 "whatPredictsWins": {},
 "version": 1
}
```
