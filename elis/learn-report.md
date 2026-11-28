# Elis learning report

2026-11-28T16:03:51.244Z

Kept current settings (730 sessions, tested on the last 220 it did not learn from).
Unseen days: win rate 43% -> 40%, avg -0.11R -> -0.23R, avg win 1.35R -> 1.18R.
Changes: picks 3 -> 1, keepMinR 1 -> 0.5, entryEnd 630 -> 660, entryGate 0 -> 0.95, newsExit true -> false, marketExit 0 -> 0.3.
Best info: other +0R, analyst +0.11R, gap1-3% -0.07R, gap<1% -0.09R.
Weakest: earnings -0.32R, fda -0.48R, gap8%+ -0.33R, fear-falling -0.33R.

## Why (unseen days)

Overall -0.11R avg over 474 trades.
Made money when:
  + how it exited = trailing stop: +1.36R avg, 95% wins, 191 trades
  + opening range = normal-range: +0.32R avg, 59% wins, 63 trades
Lost most when:
  - how it exited = stopped on the entry candle: -1.69R avg, 0% wins, 95 trades
  - how it exited = stop: -1.05R avg, 0% wins, 150 trades
  - stock gap = gap8%+: -0.4R avg, 35% wins, 165 trades

If Elis had started with $3,000 on 2024-01-02 (to 2026-11-27):
BEFORE (current settings): $3,000 -> $1,439 (-52%), max drawdown 55.1%, 785 trades, 36% wins, avg win $11 / avg loss $9, 25/35 red months
AFTER (learned settings): $3,000 -> $1,691 (-43.6%), max drawdown 45.1%, 380 trades, 40% wins, avg win $30 / avg loss $26, 23/35 red months
Honest check, only the 220 sessions the learner never saw (2026-01-14 to 2026-11-27), $3,000 start:
BEFORE: $3,000 -> $1,933 (-35.6%), max drawdown 38%, 429 trades, 42% wins, avg win $20 / avg loss $19, 8/11 red months
AFTER: $3,000 -> $2,188 (-27.1%), max drawdown 32.5%, 135 trades, 40% wins, avg win $30 / avg loss $30, 9/11 red months

## Formula search

Searched 14,287 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).
Strong move alone, unseen days: going with it -0.06R avg (42% wins), against it -0.04R (44% wins), 8486 cases.
1. go WITH the strong move when: vol-normal + t-midday + mkt-against-move
   unseen: 0.35R avg, 55% wins, 121 cases | training: 0.22R, 47% wins, 259 cases
2. go AGAINST the strong move when: shooting star + vwap-with-move-far
   unseen: 0.32R avg, 49% wins, 61 cases | training: 0.11R, 45% wins, 165 cases
3. go AGAINST the strong move when: shooting star + vwap-with-move-far + no-recent-news
   unseen: 0.3R avg, 48% wins, 60 cases | training: 0.11R, 45% wins, 165 cases
4. go WITH the strong move when: vwap-with-move-far + t-midday + mkt-against-move
   unseen: 0.13R avg, 44% wins, 177 cases | training: 0.2R, 50% wins, 313 cases
5. go WITH the strong move when: t-midday + mkt-against-move
   unseen: 0.08R avg, 44% wins, 283 cases | training: 0.17R, 50% wins, 486 cases
6. go WITH the strong move when: t-midday + mkt-against-move + no-recent-news
   unseen: 0.08R avg, 44% wins, 282 cases | training: 0.17R, 50% wins, 486 cases
7. go WITH the strong move when: no-indecision + t-midday + mkt-against-move
   unseen: 0.08R avg, 44% wins, 276 cases | training: 0.18R, 50% wins, 474 cases
8. go WITH the strong move when: three black crows + mkt-against-move
   unseen: 0.07R avg, 43% wins, 232 cases | training: 0.16R, 46% wins, 415 cases
9. go WITH the strong move when: three black crows + mkt-against-move + no-recent-news
   unseen: 0.07R avg, 43% wins, 232 cases | training: 0.16R, 46% wins, 415 cases
10. go AGAINST the strong move when: bullish engulfing + vol-normal + t-midday
   unseen: 0.13R avg, 52% wins, 54 cases | training: 0.13R, 49% wins, 152 cases

## Pivot study

791971 moments

Warning signs before drops:
DROP next 30 min: above-vwap-far + up-strong -> 34% on unseen days (normal 8%, 3814 cases; 34% in training, 9810 cases)
DROP next 30 min: up-strong -> 30% on unseen days (normal 8%, 7321 cases; 32% in training, 18717 cases)
DROP next 30 min: sector-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 33% in training, 3682 cases)
DROP next 30 min: fear-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 32% in training, 2600 cases)
DROP next 30 min: buzz-unknown + up-strong -> 31% on unseen days (normal 8%, 7287 cases; 32% in training, 18717 cases)
DROP next 30 min: down-strong -> 31% on unseen days (normal 8%, 7037 cases; 31% in training, 18626 cases)
DROP next 30 min: sector-unknown + down-strong -> 31% on unseen days (normal 8%, 7037 cases; 30% in training, 3708 cases)
DROP next 30 min: fear-unknown + down-strong -> 31% on unseen days (normal 8%, 7037 cases; 29% in training, 2536 cases)

Signs before rises:
RISE next 30 min: up-strong -> 30% on unseen days (normal 8%, 7321 cases; 31% in training, 18717 cases)
RISE next 30 min: sector-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 31% in training, 3682 cases)
RISE next 30 min: fear-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 30% in training, 2600 cases)
RISE next 30 min: buzz-unknown + up-strong -> 30% on unseen days (normal 8%, 7287 cases; 31% in training, 18717 cases)
RISE next 30 min: no-indecision + up-strong -> 30% on unseen days (normal 8%, 6989 cases; 31% in training, 17835 cases)
RISE next 30 min: up-strong + mkt-flat -> 32% on unseen days (normal 8%, 4519 cases; 32% in training, 12508 cases)
RISE next 30 min: no-recent-news + up-strong -> 30% on unseen days (normal 8%, 6865 cases; 31% in training, 18717 cases)
RISE next 30 min: vol-fading + up-strong -> 32% on unseen days (normal 8%, 3650 cases; 33% in training, 8920 cases)

## Experiments

Experiments on the 220 unseen sessions (current: 474 trades, 43% wins, avg -0.11R, total -51.4R):
- study rules (hold to close, 10% ATR stop), top 3, entries to 11:00: 481 trades, 9% wins, avg -0.7R, total -336.7R
- study rules, top 5, entries to 11:00: 795 trades, 10% wins, avg -0.72R, total -575.3R
- study rules, top 3, entries all day: 522 trades, 10% wins, avg -0.69R, total -361.1R
- study rules + sell on bad news, top 3: 481 trades, 9% wins, avg -0.7R, total -337R
- Elis exits, but 10% ATR stop: 474 trades, 26% wins, avg -0.81R, total -383R
- Elis + sell on pivot warning >= 45%: 474 trades, 43% wins, avg -0.11R, total -51.4R
- Elis + sell on pivot warning >= 55%: 474 trades, 43% wins, avg -0.11R, total -51.4R
- Elis + sell on pivot warning >= 65%: 474 trades, 43% wins, avg -0.11R, total -51.4R

## QQQ strategy history

{"sessions":400,"trades":329,"winRatePct":30.1,"totalR":-44.37,"profitFactor":0.81,"returnPct":-37.7,"maxDrawdownPct":-55.2}

## Proposals

1. Never trade "wide-range" setups
Why: In 4459 training trades, "wide-range" (orAtr) averaged -0.26R. Skipping it was then tested on the 220 unseen sessions.
Proof (unseen days): avg -0.11R -> 0.12R, total -51.4R -> 41.2R, win rate 43% -> 54%, trades 474 -> 331
From you: None. Tell Jarvis "adopt Elis proposal" (or say no) - Elis applies it at the next scan.

```json
{
 "why": {
  "n": 474,
  "overall": -0.11,
  "findings": [
   {
    "dim": "how it exited",
    "value": "trailing stop",
    "n": 191,
    "avgR": 1.36,
    "winPct": 95,
    "z": 12.71,
    "better": true
   },
   {
    "dim": "how it exited",
    "value": "stopped on the entry candle",
    "n": 95,
    "avgR": -1.69,
    "winPct": 0,
    "z": -9.66,
    "better": false
   },
   {
    "dim": "how it exited",
    "value": "stop",
    "n": 150,
    "avgR": -1.05,
    "winPct": 0,
    "z": -7.22,
    "better": false
   },
   {
    "dim": "stock gap",
    "value": "gap8%+",
    "n": 165,
    "avgR": -0.4,
    "winPct": 35,
    "z": -2.35,
    "better": false
   },
   {
    "dim": "opening range",
    "value": "normal-range",
    "n": 63,
    "avgR": 0.32,
    "winPct": 59,
    "z": 2.13,
    "better": true
   }
  ],
  "tables": {
   "how it exited": {
    "11": {
     "n": 37,
     "avgR": 0.1,
     "winPct": 54
    },
    "trailing stop": {
     "n": 191,
     "avgR": 1.36,
     "winPct": 95
    },
    "stopped on the entry candle": {
     "n": 95,
     "avgR": -1.69,
     "winPct": 0
    },
    "stop": {
     "n": 150,
     "avgR": -1.05,
     "winPct": 0
    },
    "closed 15": {
     "n": 1,
     "avgR": 2.73,
     "winPct": 100
    }
   },
   "news type": {
    "none": {
     "n": 317,
     "avgR": -0.12,
     "winPct": 42
    },
    "earnings": {
     "n": 42,
     "avgR": -0.26,
     "winPct": 38
    },
    "deal": {
     "n": 15,
     "avgR": 0.08,
     "winPct": 40
    },
    "fda": {
     "n": 28,
     "avgR": -0.63,
     "winPct": 39
    },
    "other": {
     "n": 45,
     "avgR": 0.18,
     "winPct": 49
    },
    "analyst": {
     "n": 14,
     "avgR": 0.58,
     "winPct": 64
    },
    "contract": {
     "n": 9,
     "avgR": -0.44,
     "winPct": 33
    },
    "legal": {
     "n": 4,
     "avgR": 0.35,
     "winPct": 75
    }
   },
   "news tone": {
    "none": {
     "n": 317,
     "avgR": -0.12,
     "winPct": 42
    },
    "news-neutral": {
     "n": 83,
     "avgR": -0.17,
     "winPct": 45
    },
    "news-pos": {
     "n": 29,
     "avgR": -0.25,
     "winPct": 31
    },
    "news-neg": {
     "n": 44,
     "avgR": 0.19,
     "winPct": 55
    },
    "news-mixed": {
     "n": 1,
     "avgR": -1.35,
     "winPct": 0
    }
   },
   "S&P direction at the open": {
    "with-market": {
     "n": 248,
     "avgR": -0.1,
     "winPct": 43
    },
    "against-market": {
     "n": 221,
     "avgR": -0.12,
     "winPct": 42
    },
    "mkt-flat": {
     "n": 5,
     "avgR": 0.3,
     "winPct": 80
    }
   },
   "S&P gap": {
    "spy-unknown": {
     "n": 474,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "fear gauge": {
    "fear-unknown": {
     "n": 474,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "trend regime": {
    "trend-unknown": {
     "n": 474,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "sector": {
    "sector-unknown": {
     "n": 474,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "side": {
    "long": {
     "n": 206,
     "avgR": -0.22,
     "winPct": 41
    },
    "short": {
     "n": 268,
     "avgR": -0.02,
     "winPct": 44
    }
   },
   "stock gap": {
    "gap3-8%": {
     "n": 132,
     "avgR": -0.01,
     "winPct": 44
    },
    "gap8%+": {
     "n": 165,
     "avgR": -0.4,
     "winPct": 35
    },
    "gap<1%": {
     "n": 64,
     "avgR": -0.02,
     "winPct": 47
    },
    "gap1-3%": {
     "n": 113,
     "avgR": 0.14,
     "winPct": 50
    }
   },
   "opening volume surge": {
    "rvol8+": {
     "n": 437,
     "avgR": -0.13,
     "winPct": 43
    },
    "rvol4-8": {
     "n": 34,
     "avgR": 0.16,
     "winPct": 44
    },
    "rvol2-4": {
     "n": 3,
     "avgR": -0.62,
     "winPct": 33
    }
   },
   "opening range": {
    "wide-range": {
     "n": 383,
     "avgR": -0.19,
     "winPct": 39
    },
    "tight-range": {
     "n": 28,
     "avgR": 0.08,
     "winPct": 50
    },
    "normal-range": {
     "n": 63,
     "avgR": 0.32,
     "winPct": 59
    }
   },
   "candle read at entry": {
    "candle-none": {
     "n": 362,
     "avgR": -0.09,
     "winPct": 42
    },
    "candle-with": {
     "n": 70,
     "avgR": -0.23,
     "winPct": 43
    },
    "candle-mild": {
     "n": 30,
     "avgR": -0.22,
     "winPct": 47
    },
    "candle-against": {
     "n": 12,
     "avgR": 0.43,
     "winPct": 50
    }
   },
   "volume at entry": {
    "vol-weak": {
     "n": 334,
     "avgR": -0.05,
     "winPct": 45
    },
    "vol-normal": {
     "n": 104,
     "avgR": -0.19,
     "winPct": 41
    },
    "vol-strong": {
     "n": 36,
     "avgR": -0.41,
     "winPct": 28
    }
   },
   "VWAP at entry": {
    "vwap-with": {
     "n": 461,
     "avgR": -0.09,
     "winPct": 43
    },
    "vwap-against": {
     "n": 13,
     "avgR": -0.64,
     "winPct": 31
    }
   },
   "mid-trade news": {
    "no bad news mid-trade": {
     "n": 474,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "month": {
    "2026-01": {
     "n": 28,
     "avgR": -0.1,
     "winPct": 43
    },
    "2026-02": {
     "n": 33,
     "avgR": -0.07,
     "winPct": 48
    },
    "2026-03": {
     "n": 47,
     "avgR": -0.15,
     "winPct": 40
    },
    "2026-04": {
     "n": 42,
     "avgR": 0.03,
     "winPct": 43
    },
    "2026-05": {
     "n": 46,
     "avgR": -0.15,
     "winPct": 43
    },
    "2026-06": {
     "n": 46,
     "avgR": -0.12,
     "winPct": 41
    },
    "2026-07": {
     "n": 51,
     "avgR": -0.14,
     "winPct": 41
    },
    "2026-08": {
     "n": 45,
     "avgR": -0.43,
     "winPct": 36
    },
    "2026-09": {
     "n": 47,
     "avgR": -0.11,
     "winPct": 45
    },
    "2026-10": {
     "n": 48,
     "avgR": 0.07,
     "winPct": 44
    },
    "2026-11": {
     "n": 41,
     "avgR": 0,
     "winPct": 46
    }
   }
  },
  "text": "Overall -0.11R avg over 474 trades.\nMade money when:\n  + how it exited = trailing stop: +1.36R avg, 95% wins, 191 trades\n  + opening range = normal-range: +0.32R avg, 59% wins, 63 trades\nLost most when:\n  - how it exited = stopped on the entry candle: -1.69R avg, 0% wins, 95 trades\n  - how it exited = stop: -1.05R avg, 0% wins, 150 trades\n  - stock gap = gap8%+: -0.4R avg, 35% wins, 165 trades"
 },
 "money": {
  "before": {
   "from": "2024-01-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 1439,
   "returnPct": -52,
   "maxDrawdownPct": 55.1,
   "trades": 785,
   "winRatePct": 36,
   "avgWinUsd": 11,
   "avgLossUsd": 9,
   "bestDay": {
    "day": "2024-08-12",
    "usd": 132
   },
   "worstDay": {
    "day": "2024-04-04",
    "usd": -77
   },
   "redMonths": 25,
   "months": 35,
   "worstMonth": {
    "m": "2024-04",
    "end": 2260,
    "pct": -11.5
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 2955,
     "pct": -1.5
    },
    {
     "m": "2024-02",
     "end": 2789,
     "pct": -5.6
    },
    {
     "m": "2024-03",
     "end": 2554,
     "pct": -8.4
    },
    {
     "m": "2024-04",
     "end": 2260,
     "pct": -11.5
    },
    {
     "m": "2024-05",
     "end": 2057,
     "pct": -9
    },
    {
     "m": "2024-06",
     "end": 1969,
     "pct": -4.3
    },
    {
     "m": "2024-07",
     "end": 1967,
     "pct": -0.1
    },
    {
     "m": "2024-08",
     "end": 2098,
     "pct": 6.7
    },
    {
     "m": "2024-09",
     "end": 1974,
     "pct": -5.9
    },
    {
     "m": "2024-10",
     "end": 1942,
     "pct": -1.6
    },
    {
     "m": "2024-11",
     "end": 1948,
     "pct": 0.3
    },
    {
     "m": "2024-12",
     "end": 1941,
     "pct": -0.4
    },
    {
     "m": "2025-01",
     "end": 1890,
     "pct": -2.6
    },
    {
     "m": "2025-02",
     "end": 1930,
     "pct": 2.1
    },
    {
     "m": "2025-03",
     "end": 1949,
     "pct": 1
    },
    {
     "m": "2025-04",
     "end": 1954,
     "pct": 0.3
    },
    {
     "m": "2025-05",
     "end": 1800,
     "pct": -7.9
    },
    {
     "m": "2025-06",
     "end": 1789,
     "pct": -0.6
    },
    {
     "m": "2025-07",
     "end": 1755,
     "pct": -1.9
    },
    {
     "m": "2025-08",
     "end": 1820,
     "pct": 3.7
    },
    {
     "m": "2025-09",
     "end": 1740,
     "pct": -4.4
    },
    {
     "m": "2025-10",
     "end": 1696,
     "pct": -2.5
    },
    {
     "m": "2025-11",
     "end": 1709,
     "pct": 0.8
    },
    {
     "m": "2025-12",
     "end": 1665,
     "pct": -2.6
    },
    {
     "m": "2026-01",
     "end": 1642,
     "pct": -1.4
    },
    {
     "m": "2026-02",
     "end": 1604,
     "pct": -2.3
    },
    {
     "m": "2026-03",
     "end": 1567,
     "pct": -2.3
    },
    {
     "m": "2026-04",
     "end": 1533,
     "pct": -2.2
    },
    {
     "m": "2026-05",
     "end": 1609,
     "pct": 5
    },
    {
     "m": "2026-06",
     "end": 1615,
     "pct": 0.4
    },
    {
     "m": "2026-07",
     "end": 1583,
     "pct": -2
    },
    {
     "m": "2026-08",
     "end": 1487,
     "pct": -6.1
    },
    {
     "m": "2026-09",
     "end": 1460,
     "pct": -1.8
    },
    {
     "m": "2026-10",
     "end": 1466,
     "pct": 0.4
    },
    {
     "m": "2026-11",
     "end": 1439,
     "pct": -1.8
    }
   ]
  },
  "after": {
   "from": "2024-01-02",
   "to": "2026-11-27",
   "start": 3000,
   "end": 1691,
   "returnPct": -43.6,
   "maxDrawdownPct": 45.1,
   "trades": 380,
   "winRatePct": 40,
   "avgWinUsd": 30,
   "avgLossUsd": 26,
   "bestDay": {
    "day": "2024-08-08",
    "usd": 207
   },
   "worstDay": {
    "day": "2025-08-28",
    "usd": -121
   },
   "redMonths": 23,
   "months": 35,
   "worstMonth": {
    "m": "2024-04",
    "end": 2567,
    "pct": -8.6
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 2977,
     "pct": -0.8
    },
    {
     "m": "2024-02",
     "end": 2909,
     "pct": -2.3
    },
    {
     "m": "2024-03",
     "end": 2807,
     "pct": -3.5
    },
    {
     "m": "2024-04",
     "end": 2567,
     "pct": -8.6
    },
    {
     "m": "2024-05",
     "end": 2446,
     "pct": -4.7
    },
    {
     "m": "2024-06",
     "end": 2458,
     "pct": 0.5
    },
    {
     "m": "2024-07",
     "end": 2298,
     "pct": -6.5
    },
    {
     "m": "2024-08",
     "end": 2511,
     "pct": 9.3
    },
    {
     "m": "2024-09",
     "end": 2345,
     "pct": -6.6
    },
    {
     "m": "2024-10",
     "end": 2298,
     "pct": -2
    },
    {
     "m": "2024-11",
     "end": 2394,
     "pct": 4.2
    },
    {
     "m": "2024-12",
     "end": 2292,
     "pct": -4.3
    },
    {
     "m": "2025-01",
     "end": 2239,
     "pct": -2.3
    },
    {
     "m": "2025-02",
     "end": 2326,
     "pct": 3.9
    },
    {
     "m": "2025-03",
     "end": 2409,
     "pct": 3.6
    },
    {
     "m": "2025-04",
     "end": 2491,
     "pct": 3.4
    },
    {
     "m": "2025-05",
     "end": 2330,
     "pct": -6.5
    },
    {
     "m": "2025-06",
     "end": 2256,
     "pct": -3.2
    },
    {
     "m": "2025-07",
     "end": 2297,
     "pct": 1.8
    },
    {
     "m": "2025-08",
     "end": 2355,
     "pct": 2.5
    },
    {
     "m": "2025-09",
     "end": 2276,
     "pct": -3.4
    },
    {
     "m": "2025-10",
     "end": 2163,
     "pct": -5
    },
    {
     "m": "2025-11",
     "end": 2166,
     "pct": 0.1
    },
    {
     "m": "2025-12",
     "end": 2092,
     "pct": -3.4
    },
    {
     "m": "2026-01",
     "end": 1913,
     "pct": -8.6
    },
    {
     "m": "2026-02",
     "end": 1899,
     "pct": -0.7
    },
    {
     "m": "2026-03",
     "end": 1845,
     "pct": -2.8
    },
    {
     "m": "2026-04",
     "end": 1819,
     "pct": -1.4
    },
    {
     "m": "2026-05",
     "end": 1837,
     "pct": 1
    },
    {
     "m": "2026-06",
     "end": 1939,
     "pct": 5.6
    },
    {
     "m": "2026-07",
     "end": 1871,
     "pct": -3.5
    },
    {
     "m": "2026-08",
     "end": 1840,
     "pct": -1.7
    },
    {
     "m": "2026-09",
     "end": 1733,
     "pct": -5.8
    },
    {
     "m": "2026-10",
     "end": 1755,
     "pct": 1.3
    },
    {
     "m": "2026-11",
     "end": 1691,
     "pct": -3.6
    }
   ]
  },
  "unseenBefore": {
   "from": "2026-01-14",
   "to": "2026-11-27",
   "start": 3000,
   "end": 1933,
   "returnPct": -35.6,
   "maxDrawdownPct": 38,
   "trades": 429,
   "winRatePct": 42,
   "avgWinUsd": 20,
   "avgLossUsd": 19,
   "bestDay": {
    "day": "2026-02-17",
    "usd": 89
   },
   "worstDay": {
    "day": "2026-06-01",
    "usd": -93
   },
   "redMonths": 8,
   "months": 11,
   "worstMonth": {
    "m": "2026-08",
    "end": 2205,
    "pct": -11.6
   },
   "monthly": [
    {
     "m": "2026-01",
     "end": 3011,
     "pct": 0.4
    },
    {
     "m": "2026-02",
     "end": 3010,
     "pct": 0
    },
    {
     "m": "2026-03",
     "end": 2754,
     "pct": -8.5
    },
    {
     "m": "2026-04",
     "end": 2774,
     "pct": 0.7
    },
    {
     "m": "2026-05",
     "end": 2736,
     "pct": -1.4
    },
    {
     "m": "2026-06",
     "end": 2623,
     "pct": -4.1
    },
    {
     "m": "2026-07",
     "end": 2494,
     "pct": -4.9
    },
    {
     "m": "2026-08",
     "end": 2205,
     "pct": -11.6
    },
    {
     "m": "2026-09",
     "end": 2037,
     "pct": -7.6
    },
    {
     "m": "2026-10",
     "end": 1969,
     "pct": -3.3
    },
    {
     "m": "2026-11",
     "end": 1933,
     "pct": -1.8
    }
   ]
  },
  "unseenAfter": {
   "from": "2026-01-14",
   "to": "2026-11-27",
   "start": 3000,
   "end": 2188,
   "returnPct": -27.1,
   "maxDrawdownPct": 32.5,
   "trades": 135,
   "winRatePct": 40,
   "avgWinUsd": 30,
   "avgLossUsd": 30,
   "bestDay": {
    "day": "2026-08-25",
    "usd": 107
   },
   "worstDay": {
    "day": "2026-08-05",
    "usd": -105
   },
   "redMonths": 9,
   "months": 11,
   "worstMonth": {
    "m": "2026-11",
    "end": 2188,
    "pct": -7
   },
   "monthly": [
    {
     "m": "2026-01",
     "end": 2924,
     "pct": -2.5
    },
    {
     "m": "2026-02",
     "end": 3061,
     "pct": 4.7
    },
    {
     "m": "2026-03",
     "end": 2851,
     "pct": -6.9
    },
    {
     "m": "2026-04",
     "end": 2718,
     "pct": -4.7
    },
    {
     "m": "2026-05",
     "end": 2605,
     "pct": -4.2
    },
    {
     "m": "2026-06",
     "end": 2716,
     "pct": 4.3
    },
    {
     "m": "2026-07",
     "end": 2547,
     "pct": -6.2
    },
    {
     "m": "2026-08",
     "end": 2479,
     "pct": -2.7
    },
    {
     "m": "2026-09",
     "end": 2380,
     "pct": -4
    },
    {
     "m": "2026-10",
     "end": 2352,
     "pct": -1.2
    },
    {
     "m": "2026-11",
     "end": 2188,
     "pct": -7
    }
   ]
  }
 },
 "proposals": [
  {
   "id": "skip-orAtr-wide-range",
   "kind": "rule",
   "rule": {
    "k": "orAtr",
    "v": "wide-range",
    "chart": false
   },
   "title": "Never trade \"wide-range\" setups",
   "why": "In 4459 training trades, \"wide-range\" (orAtr) averaged -0.26R. Skipping it was then tested on the 220 unseen sessions.",
   "evidence": {
    "before": {
     "trades": 474,
     "totalR": -51.4,
     "avgR": -0.11,
     "winRatePct": 43,
     "avgWinR": 1.35,
     "avgLossR": 1.19
    },
    "after": {
     "trades": 331,
     "totalR": 41.2,
     "avgR": 0.12,
     "winRatePct": 54,
     "avgWinR": 0.97,
     "avgLossR": 0.87
    }
   },
   "effort": "None. Tell Jarvis \"adopt Elis proposal\" (or say no) - Elis applies it at the next scan."
  }
 ],
 "gaps": [],
 "experiments": [
  {
   "name": "study rules (hold to close, 10% ATR stop), top 3, entries to 11:00",
   "unseen": {
    "trades": 481,
    "totalR": -336.7,
    "avgR": -0.7,
    "winRatePct": 9,
    "avgWinR": 9.88,
    "avgLossR": 1.74
   }
  },
  {
   "name": "study rules, top 5, entries to 11:00",
   "unseen": {
    "trades": 795,
    "totalR": -575.3,
    "avgR": -0.72,
    "winRatePct": 10,
    "avgWinR": 7.97,
    "avgLossR": 1.68
   }
  },
  {
   "name": "study rules, top 3, entries all day",
   "unseen": {
    "trades": 522,
    "totalR": -361.1,
    "avgR": -0.69,
    "winRatePct": 10,
    "avgWinR": 8.56,
    "avgLossR": 1.72
   }
  },
  {
   "name": "study rules + sell on bad news, top 3",
   "unseen": {
    "trades": 481,
    "totalR": -337,
    "avgR": -0.7,
    "winRatePct": 9,
    "avgWinR": 9.88,
    "avgLossR": 1.74
   }
  },
  {
   "name": "Elis exits, but 10% ATR stop",
   "unseen": {
    "trades": 474,
    "totalR": -383,
    "avgR": -0.81,
    "winRatePct": 26,
    "avgWinR": 1.94,
    "avgLossR": 1.79
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 45%",
   "unseen": {
    "trades": 474,
    "totalR": -51.4,
    "avgR": -0.11,
    "winRatePct": 43,
    "avgWinR": 1.35,
    "avgLossR": 1.19
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 55%",
   "unseen": {
    "trades": 474,
    "totalR": -51.4,
    "avgR": -0.11,
    "winRatePct": 43,
    "avgWinR": 1.35,
    "avgLossR": 1.19
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 65%",
   "unseen": {
    "trades": 474,
    "totalR": -51.4,
    "avgR": -0.11,
    "winRatePct": 43,
    "avgWinR": 1.35,
    "avgLossR": 1.19
   }
  }
 ],
 "pivot": {
  "samples": 791971,
  "signals": [
   {
    "dir": "down",
    "key": "vwap+trend",
    "signs": "above-vwap-far + up-strong",
    "train": {
     "n": 9810,
     "p": 0.339,
     "lift": 3.62
    },
    "unseen": {
     "n": 3814,
     "p": 0.338,
     "lift": 4.18
    }
   },
   {
    "dir": "down",
    "key": "trend",
    "signs": "up-strong",
    "train": {
     "n": 18717,
     "p": 0.323,
     "lift": 3.44
    },
    "unseen": {
     "n": 7321,
     "p": 0.304,
     "lift": 3.77
    }
   },
   {
    "dir": "down",
    "key": "sector+trend",
    "signs": "sector-unknown + up-strong",
    "train": {
     "n": 3682,
     "p": 0.326,
     "lift": 3.48
    },
    "unseen": {
     "n": 7321,
     "p": 0.304,
     "lift": 3.77
    }
   },
   {
    "dir": "down",
    "key": "fear+trend",
    "signs": "fear-unknown + up-strong",
    "train": {
     "n": 2600,
     "p": 0.317,
     "lift": 3.38
    },
    "unseen": {
     "n": 7321,
     "p": 0.304,
     "lift": 3.77
    }
   },
   {
    "dir": "down",
    "key": "buzz+trend",
    "signs": "buzz-unknown + up-strong",
    "train": {
     "n": 18717,
     "p": 0.323,
     "lift": 3.44
    },
    "unseen": {
     "n": 7287,
     "p": 0.305,
     "lift": 3.77
    }
   },
   {
    "dir": "down",
    "key": "trend",
    "signs": "down-strong",
    "train": {
     "n": 18626,
     "p": 0.309,
     "lift": 3.3
    },
    "unseen": {
     "n": 7037,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "down",
    "key": "sector+trend",
    "signs": "sector-unknown + down-strong",
    "train": {
     "n": 3708,
     "p": 0.3,
     "lift": 3.21
    },
    "unseen": {
     "n": 7037,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "down",
    "key": "fear+trend",
    "signs": "fear-unknown + down-strong",
    "train": {
     "n": 2536,
     "p": 0.291,
     "lift": 3.11
    },
    "unseen": {
     "n": 7037,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + up-strong",
    "train": {
     "n": 18717,
     "p": 0.323,
     "lift": 3.44
    },
    "unseen": {
     "n": 6865,
     "p": 0.306,
     "lift": 3.79
    }
   },
   {
    "dir": "down",
    "key": "buzz+trend",
    "signs": "buzz-unknown + down-strong",
    "train": {
     "n": 18626,
     "p": 0.309,
     "lift": 3.3
    },
    "unseen": {
     "n": 7023,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "down",
    "key": "indecision+trend",
    "signs": "no-indecision + up-strong",
    "train": {
     "n": 17835,
     "p": 0.323,
     "lift": 3.45
    },
    "unseen": {
     "n": 6989,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + down-strong",
    "train": {
     "n": 18626,
     "p": 0.309,
     "lift": 3.3
    },
    "unseen": {
     "n": 6721,
     "p": 0.304,
     "lift": 3.76
    }
   },
   {
    "dir": "down",
    "key": "indecision+trend",
    "signs": "no-indecision + down-strong",
    "train": {
     "n": 17775,
     "p": 0.31,
     "lift": 3.31
    },
    "unseen": {
     "n": 6718,
     "p": 0.304,
     "lift": 3.76
    }
   },
   {
    "dir": "down",
    "key": "trend+market",
    "signs": "up-strong + mkt-flat",
    "train": {
     "n": 12508,
     "p": 0.327,
     "lift": 3.49
    },
    "unseen": {
     "n": 4519,
     "p": 0.31,
     "lift": 3.84
    }
   },
   {
    "dir": "down",
    "key": "newsDay+trend",
    "signs": "none/none + up-strong",
    "train": {
     "n": 18717,
     "p": 0.323,
     "lift": 3.44
    },
    "unseen": {
     "n": 4442,
     "p": 0.307,
     "lift": 3.81
    }
   },
   {
    "dir": "up",
    "key": "trend",
    "signs": "up-strong",
    "train": {
     "n": 18717,
     "p": 0.314,
     "lift": 3.44
    },
    "unseen": {
     "n": 7321,
     "p": 0.302,
     "lift": 3.58
    }
   },
   {
    "dir": "up",
    "key": "sector+trend",
    "signs": "sector-unknown + up-strong",
    "train": {
     "n": 3682,
     "p": 0.305,
     "lift": 3.34
    },
    "unseen": {
     "n": 7321,
     "p": 0.302,
     "lift": 3.58
    }
   },
   {
    "dir": "up",
    "key": "fear+trend",
    "signs": "fear-unknown + up-strong",
    "train": {
     "n": 2600,
     "p": 0.303,
     "lift": 3.33
    },
    "unseen": {
     "n": 7321,
     "p": 0.302,
     "lift": 3.58
    }
   },
   {
    "dir": "up",
    "key": "buzz+trend",
    "signs": "buzz-unknown + up-strong",
    "train": {
     "n": 18717,
     "p": 0.314,
     "lift": 3.44
    },
    "unseen": {
     "n": 7287,
     "p": 0.303,
     "lift": 3.58
    }
   },
   {
    "dir": "down",
    "key": "vol+trend",
    "signs": "vol-fading + down-strong",
    "train": {
     "n": 9413,
     "p": 0.317,
     "lift": 3.39
    },
    "unseen": {
     "n": 3682,
     "p": 0.312,
     "lift": 3.87
    }
   },
   {
    "dir": "down",
    "key": "trend+market",
    "signs": "down-strong + mkt-flat",
    "train": {
     "n": 12010,
     "p": 0.322,
     "lift": 3.43
    },
    "unseen": {
     "n": 4279,
     "p": 0.307,
     "lift": 3.8
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-fading + down-strong",
    "train": {
     "n": 9413,
     "p": 0.317,
     "lift": 3.39
    },
    "unseen": {
     "n": 3452,
     "p": 0.313,
     "lift": 3.88
    }
   },
   {
    "dir": "up",
    "key": "indecision+trend",
    "signs": "no-indecision + up-strong",
    "train": {
     "n": 17835,
     "p": 0.313,
     "lift": 3.44
    },
    "unseen": {
     "n": 6989,
     "p": 0.301,
     "lift": 3.56
    }
   },
   {
    "dir": "up",
    "key": "trend+market",
    "signs": "up-strong + mkt-flat",
    "train": {
     "n": 12508,
     "p": 0.319,
     "lift": 3.5
    },
    "unseen": {
     "n": 4519,
     "p": 0.315,
     "lift": 3.73
    }
   },
   {
    "dir": "down",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-fading + down-strong",
    "train": {
     "n": 8866,
     "p": 0.318,
     "lift": 3.4
    },
    "unseen": {
     "n": 3471,
     "p": 0.311,
     "lift": 3.85
    }
   },
   {
    "dir": "down",
    "key": "newsDay+trend",
    "signs": "none/none + down-strong",
    "train": {
     "n": 18626,
     "p": 0.309,
     "lift": 3.3
    },
    "unseen": {
     "n": 4166,
     "p": 0.303,
     "lift": 3.75
    }
   },
   {
    "dir": "down",
    "key": "vwap+trend",
    "signs": "below-vwap-far + down-strong",
    "train": {
     "n": 9578,
     "p": 0.307,
     "lift": 3.27
    },
    "unseen": {
     "n": 3544,
     "p": 0.308,
     "lift": 3.81
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-fading + up-strong",
    "train": {
     "n": 8920,
     "p": 0.328,
     "lift": 3.5
    },
    "unseen": {
     "n": 3313,
     "p": 0.309,
     "lift": 3.83
    }
   },
   {
    "dir": "down",
    "key": "vol+trend",
    "signs": "vol-fading + up-strong",
    "train": {
     "n": 8920,
     "p": 0.328,
     "lift": 3.5
    },
    "unseen": {
     "n": 3650,
     "p": 0.305,
     "lift": 3.78
    }
   },
   {
    "dir": "up",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + up-strong",
    "train": {
     "n": 18717,
     "p": 0.314,
     "lift": 3.44
    },
    "unseen": {
     "n": 6865,
     "p": 0.296,
     "lift": 3.5
    }
   },
   {
    "dir": "down",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-fading + up-strong",
    "train": {
     "n": 8356,
     "p": 0.327,
     "lift": 3.49
    },
    "unseen": {
     "n": 3437,
     "p": 0.304,
     "lift": 3.77
    }
   },
   {
    "dir": "up",
    "key": "vol+trend",
    "signs": "vol-fading + up-strong",
    "train": {
     "n": 8920,
     "p": 0.331,
     "lift": 3.63
    },
    "unseen": {
     "n": 3650,
     "p": 0.315,
     "lift": 3.73
    }
   },
   {
    "dir": "up",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-fading + up-strong",
    "train": {
     "n": 8356,
     "p": 0.331,
     "lift": 3.64
    },
    "unseen": {
     "n": 3437,
     "p": 0.314,
     "lift": 3.72
    }
   },
   {
    "dir": "down",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-normal + up-strong",
    "train": {
     "n": 7438,
     "p": 0.319,
     "lift": 3.4
    },
    "unseen": {
     "n": 2676,
     "p": 0.308,
     "lift": 3.82
    }
   },
   {
    "dir": "up",
    "key": "trend",
    "signs": "down-strong",
    "train": {
     "n": 18626,
     "p": 0.305,
     "lift": 3.34
    },
    "unseen": {
     "n": 7037,
     "p": 0.287,
     "lift": 3.4
    }
   },
   {
    "dir": "up",
    "key": "sector+trend",
    "signs": "sector-unknown + down-strong",
    "train": {
     "n": 3708,
     "p": 0.326,
     "lift": 3.57
    },
    "unseen": {
     "n": 7037,
     "p": 0.287,
     "lift": 3.4
    }
   },
   {
    "dir": "up",
    "key": "fear+trend",
    "signs": "fear-unknown + down-strong",
    "train": {
     "n": 2536,
     "p": 0.318,
     "lift": 3.49
    },
    "unseen": {
     "n": 7037,
     "p": 0.287,
     "lift": 3.4
    }
   },
   {
    "dir": "up",
    "key": "buzz+trend",
    "signs": "buzz-unknown + down-strong",
    "train": {
     "n": 18626,
     "p": 0.305,
     "lift": 3.34
    },
    "unseen": {
     "n": 7023,
     "p": 0.287,
     "lift": 3.4
    }
   },
   {
    "dir": "down",
    "key": "vol+trend",
    "signs": "vol-normal + up-strong",
    "train": {
     "n": 7718,
     "p": 0.317,
     "lift": 3.39
    },
    "unseen": {
     "n": 2776,
     "p": 0.306,
     "lift": 3.79
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-normal + up-strong",
    "train": {
     "n": 7718,
     "p": 0.317,
     "lift": 3.39
    },
    "unseen": {
     "n": 2663,
     "p": 0.306,
     "lift": 3.79
    }
   }
  ],
  "base": {
   "up": 0.08443163097199341,
   "down": 0.08074567753315694
  },
  "text": "Warning signs before drops:\nDROP next 30 min: above-vwap-far + up-strong -> 34% on unseen days (normal 8%, 3814 cases; 34% in training, 9810 cases)\nDROP next 30 min: up-strong -> 30% on unseen days (normal 8%, 7321 cases; 32% in training, 18717 cases)\nDROP next 30 min: sector-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 33% in training, 3682 cases)\nDROP next 30 min: fear-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 32% in training, 2600 cases)\nDROP next 30 min: buzz-unknown + up-strong -> 31% on unseen days (normal 8%, 7287 cases; 32% in training, 18717 cases)\nDROP next 30 min: down-strong -> 31% on unseen days (normal 8%, 7037 cases; 31% in training, 18626 cases)\nDROP next 30 min: sector-unknown + down-strong -> 31% on unseen days (normal 8%, 7037 cases; 30% in training, 3708 cases)\nDROP next 30 min: fear-unknown + down-strong -> 31% on unseen days (normal 8%, 7037 cases; 29% in training, 2536 cases)\n\nSigns before rises:\nRISE next 30 min: up-strong -> 30% on unseen days (normal 8%, 7321 cases; 31% in training, 18717 cases)\nRISE next 30 min: sector-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 31% in training, 3682 cases)\nRISE next 30 min: fear-unknown + up-strong -> 30% on unseen days (normal 8%, 7321 cases; 30% in training, 2600 cases)\nRISE next 30 min: buzz-unknown + up-strong -> 30% on unseen days (normal 8%, 7287 cases; 31% in training, 18717 cases)\nRISE next 30 min: no-indecision + up-strong -> 30% on unseen days (normal 8%, 6989 cases; 31% in training, 17835 cases)\nRISE next 30 min: up-strong + mkt-flat -> 32% on unseen days (normal 8%, 4519 cases; 32% in training, 12508 cases)\nRISE next 30 min: no-recent-news + up-strong -> 30% on unseen days (normal 8%, 6865 cases; 31% in training, 18717 cases)\nRISE next 30 min: vol-fading + up-strong -> 32% on unseen days (normal 8%, 3650 cases; 33% in training, 8920 cases)"
 },
 "formula": {
  "tested": 176,
  "moments": 31417,
  "baseTrain": {
   "n": 22931,
   "contR": -0.07,
   "revR": -0.03,
   "contWin": 42,
   "revWin": 45
  },
  "baseTest": {
   "n": 8486,
   "contR": -0.06,
   "revR": -0.04,
   "contWin": 42,
   "revWin": 44
  },
  "list": [
   {
    "trade": "go WITH the strong move",
    "signs": "vol-normal + t-midday + mkt-against-move",
    "keys": "vol+time+market",
    "train": {
     "n": 259,
     "avgR": 0.22,
     "winPct": 47
    },
    "unseen": {
     "n": 121,
     "avgR": 0.35,
     "winPct": 55
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "shooting star + vwap-with-move-far",
    "keys": "pattern+vwap",
    "train": {
     "n": 165,
     "avgR": 0.11,
     "winPct": 45
    },
    "unseen": {
     "n": 61,
     "avgR": 0.32,
     "winPct": 49
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "shooting star + vwap-with-move-far + no-recent-news",
    "keys": "pattern+vwap+newsRecent",
    "train": {
     "n": 165,
     "avgR": 0.11,
     "winPct": 45
    },
    "unseen": {
     "n": 60,
     "avgR": 0.3,
     "winPct": 48
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "vwap-with-move-far + t-midday + mkt-against-move",
    "keys": "vwap+time+market",
    "train": {
     "n": 313,
     "avgR": 0.2,
     "winPct": 50
    },
    "unseen": {
     "n": 177,
     "avgR": 0.13,
     "winPct": 44
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move",
    "keys": "time+market",
    "train": {
     "n": 486,
     "avgR": 0.17,
     "winPct": 50
    },
    "unseen": {
     "n": 283,
     "avgR": 0.08,
     "winPct": 44
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move + no-recent-news",
    "keys": "time+market+newsRecent",
    "train": {
     "n": 486,
     "avgR": 0.17,
     "winPct": 50
    },
    "unseen": {
     "n": 282,
     "avgR": 0.08,
     "winPct": 44
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "no-indecision + t-midday + mkt-against-move",
    "keys": "indecision+time+market",
    "train": {
     "n": 474,
     "avgR": 0.18,
     "winPct": 50
    },
    "unseen": {
     "n": 276,
     "avgR": 0.08,
     "winPct": 44
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "three black crows + mkt-against-move",
    "keys": "pattern+market",
    "train": {
     "n": 415,
     "avgR": 0.16,
     "winPct": 46
    },
    "unseen": {
     "n": 232,
     "avgR": 0.07,
     "winPct": 43
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "three black crows + mkt-against-move + no-recent-news",
    "keys": "pattern+market+newsRecent",
    "train": {
     "n": 415,
     "avgR": 0.16,
     "winPct": 46
    },
    "unseen": {
     "n": 232,
     "avgR": 0.07,
     "winPct": 43
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + vol-normal + t-midday",
    "keys": "pattern+vol+time",
    "train": {
     "n": 152,
     "avgR": 0.13,
     "winPct": 49
    },
    "unseen": {
     "n": 54,
     "avgR": 0.13,
     "winPct": 52
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + vwap-with-move-far + t-midday",
    "keys": "pattern+vwap+time",
    "train": {
     "n": 186,
     "avgR": 0.21,
     "winPct": 51
    },
    "unseen": {
     "n": 69,
     "avgR": 0.1,
     "winPct": 52
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "three black crows + no-indecision + mkt-against-move",
    "keys": "pattern+indecision+market",
    "train": {
     "n": 404,
     "avgR": 0.17,
     "winPct": 46
    },
    "unseen": {
     "n": 230,
     "avgR": 0.05,
     "winPct": 43
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "spinning top + t-midday + mkt-flat",
    "keys": "pattern+time+market",
    "train": {
     "n": 186,
     "avgR": 0.12,
     "winPct": 48
    },
    "unseen": {
     "n": 56,
     "avgR": 0.06,
     "winPct": 50
    }
   }
  ],
  "text": "Searched 14,287 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).\nStrong move alone, unseen days: going with it -0.06R avg (42% wins), against it -0.04R (44% wins), 8486 cases.\n1. go WITH the strong move when: vol-normal + t-midday + mkt-against-move\n   unseen: 0.35R avg, 55% wins, 121 cases | training: 0.22R, 47% wins, 259 cases\n2. go AGAINST the strong move when: shooting star + vwap-with-move-far\n   unseen: 0.32R avg, 49% wins, 61 cases | training: 0.11R, 45% wins, 165 cases\n3. go AGAINST the strong move when: shooting star + vwap-with-move-far + no-recent-news\n   unseen: 0.3R avg, 48% wins, 60 cases | training: 0.11R, 45% wins, 165 cases\n4. go WITH the strong move when: vwap-with-move-far + t-midday + mkt-against-move\n   unseen: 0.13R avg, 44% wins, 177 cases | training: 0.2R, 50% wins, 313 cases\n5. go WITH the strong move when: t-midday + mkt-against-move\n   unseen: 0.08R avg, 44% wins, 283 cases | training: 0.17R, 50% wins, 486 cases\n6. go WITH the strong move when: t-midday + mkt-against-move + no-recent-news\n   unseen: 0.08R avg, 44% wins, 282 cases | training: 0.17R, 50% wins, 486 cases\n7. go WITH the strong move when: no-indecision + t-midday + mkt-against-move\n   unseen: 0.08R avg, 44% wins, 276 cases | training: 0.18R, 50% wins, 474 cases\n8. go WITH the strong move when: three black crows + mkt-against-move\n   unseen: 0.07R avg, 43% wins, 232 cases | training: 0.16R, 46% wins, 415 cases\n9. go WITH the strong move when: three black crows + mkt-against-move + no-recent-news\n   unseen: 0.07R avg, 43% wins, 232 cases | training: 0.16R, 46% wins, 415 cases\n10. go AGAINST the strong move when: bullish engulfing + vol-normal + t-midday\n   unseen: 0.13R avg, 52% wins, 54 cases | training: 0.13R, 49% wins, 152 cases"
 },
 "at": "2026-11-28T16:03:44.107Z",
 "sessions": 730,
 "candidates": 11059,
 "firstDay": "2024-01-02",
 "lastDay": "2026-11-27",
 "trainSessions": 510,
 "testSessions": 220,
 "current": {
  "trades": 474,
  "totalR": -51.4,
  "avgR": -0.11,
  "winRatePct": 43,
  "avgWinR": 1.35,
  "avgLossR": 1.19
 },
 "learned": {
  "trades": 135,
  "totalR": -30.7,
  "avgR": -0.23,
  "winRatePct": 40,
  "avgWinR": 1.18,
  "avgLossR": 1.17
 },
 "adopted": false,
 "changes": [
  "picks 3 -> 1",
  "keepMinR 1 -> 0.5",
  "entryEnd 630 -> 660",
  "entryGate 0 -> 0.95",
  "newsExit true -> false",
  "marketExit 0 -> 0.3"
 ],
 "whatPredictsWins": {
  "cat": {
   "none": {
    "trades": 6973,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "earnings": {
    "trades": 394,
    "avgR": -0.32,
    "winRate": 33,
    "weight": 0.89
   },
   "other": {
    "trades": 143,
    "avgR": 0,
    "winRate": 45,
    "weight": 1.19
   },
   "deal": {
    "trades": 46,
    "avgR": -0.09,
    "winRate": 41,
    "weight": 1.07
   },
   "fda": {
    "trades": 51,
    "avgR": -0.48,
    "winRate": 43,
    "weight": 0.83
   },
   "analyst": {
    "trades": 68,
    "avgR": 0.11,
    "winRate": 50,
    "weight": 1.25
   },
   "legal": {
    "trades": 6,
    "avgR": 0.15,
    "winRate": 67,
    "weight": 1.07
   },
   "contract": {
    "trades": 26,
    "avgR": -0.19,
    "winRate": 50,
    "weight": 1
   }
  },
  "gap": {
   "gap1-3%": {
    "trades": 1670,
    "avgR": -0.07,
    "winRate": 45,
    "weight": 1.13
   },
   "gap8%+": {
    "trades": 2169,
    "avgR": -0.33,
    "winRate": 36,
    "weight": 0.88
   },
   "gap<1%": {
    "trades": 1749,
    "avgR": -0.09,
    "winRate": 45,
    "weight": 1.11
   },
   "gap3-8%": {
    "trades": 2119,
    "avgR": -0.25,
    "winRate": 39,
    "weight": 0.95
   }
  },
  "gapDir": {
   "with-gap": {
    "trades": 4020,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.01
   },
   "against-gap": {
    "trades": 3526,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 0.99
   },
   "flat": {
    "trades": 161,
    "avgR": -0.13,
    "winRate": 47,
    "weight": 1.06
   }
  },
  "rvol": {
   "rvol4-8": {
    "trades": 3578,
    "avgR": -0.13,
    "winRate": 43,
    "weight": 1.07
   },
   "rvol2-4": {
    "trades": 574,
    "avgR": -0.07,
    "winRate": 47,
    "weight": 1.13
   },
   "rvol8+": {
    "trades": 3546,
    "avgR": -0.29,
    "winRate": 38,
    "weight": 0.92
   },
   "rvol1-2": {
    "trades": 9,
    "avgR": 0.51,
    "winRate": 67,
    "weight": 1.2
   }
  },
  "orAtr": {
   "wide-range": {
    "trades": 6361,
    "avgR": -0.24,
    "winRate": 39,
    "weight": 0.96
   },
   "normal-range": {
    "trades": 1033,
    "avgR": 0,
    "winRate": 49,
    "weight": 1.22
   },
   "tight-range": {
    "trades": 313,
    "avgR": 0.04,
    "winRate": 49,
    "weight": 1.24
   }
  },
  "market": {
   "against-market": {
    "trades": 3693,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "with-market": {
    "trades": 3980,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "mkt-flat": {
    "trades": 34,
    "avgR": 0.11,
    "winRate": 50,
    "weight": 1.19
   }
  },
  "side": {
   "short": {
    "trades": 3735,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "long": {
    "trades": 3972,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1
   }
  },
  "newsTone": {
   "none": {
    "trades": 6973,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "news-neutral": {
    "trades": 493,
    "avgR": -0.24,
    "winRate": 38,
    "weight": 0.96
   },
   "news-pos": {
    "trades": 124,
    "avgR": -0.24,
    "winRate": 39,
    "weight": 0.97
   },
   "news-neg": {
    "trades": 108,
    "avgR": 0.05,
    "winRate": 47,
    "weight": 1.22
   },
   "news-mixed": {
    "trades": 9,
    "avgR": -0.7,
    "winRate": 22,
    "weight": 0.88
   }
  },
  "comboNewsMarket": {
   "none+against-market": {
    "trades": 3315,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "none+with-market": {
    "trades": 3634,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1
   },
   "none+mkt-flat": {
    "trades": 24,
    "avgR": -0.27,
    "winRate": 38,
    "weight": 0.97
   },
   "news-neutral+with-market": {
    "trades": 227,
    "avgR": -0.25,
    "winRate": 38,
    "weight": 0.96
   },
   "news-neutral+against-market": {
    "trades": 257,
    "avgR": -0.29,
    "winRate": 36,
    "weight": 0.92
   },
   "news-pos+with-market": {
    "trades": 52,
    "avgR": -0.14,
    "winRate": 37,
    "weight": 1.04
   },
   "news-neg+against-market": {
    "trades": 45,
    "avgR": 0.45,
    "winRate": 56,
    "weight": 1.51
   },
   "news-pos+against-market": {
    "trades": 71,
    "avgR": -0.32,
    "winRate": 39,
    "weight": 0.92
   },
   "news-neg+with-market": {
    "trades": 63,
    "avgR": -0.24,
    "winRate": 41,
    "weight": 0.97
   },
   "news-mixed+with-market": {
    "trades": 4,
    "avgR": -0.26,
    "winRate": 50,
    "weight": 0.99
   },
   "news-mixed+against-market": {
    "trades": 5,
    "avgR": -1.05,
    "winRate": 0,
    "weight": 0.87
   },
   "news-neutral+mkt-flat": {
    "trades": 9,
    "avgR": 1.06,
    "winRate": 78,
    "weight": 1.39
   },
   "news-pos+mkt-flat": {
    "trades": 1,
    "avgR": 0.55,
    "winRate": 100,
    "weight": 1.03
   }
  },
  "mktGap": {
   "spy-gap-down": {
    "trades": 544,
    "avgR": -0.1,
    "winRate": 45,
    "weight": 1.1
   },
   "spy-flat": {
    "trades": 3556,
    "avgR": -0.23,
    "winRate": 39,
    "weight": 0.96
   },
   "spy-gap-up": {
    "trades": 566,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 0.97
   },
   "spy-unknown": {
    "trades": 3041,
    "avgR": -0.17,
    "winRate": 42,
    "weight": 1.03
   }
  },
  "fear": {
   "fear-calm": {
    "trades": 4049,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 0.98
   },
   "fear-rising": {
    "trades": 352,
    "avgR": -0.1,
    "winRate": 45,
    "weight": 1.09
   },
   "fear-falling": {
    "trades": 265,
    "avgR": -0.33,
    "winRate": 38,
    "weight": 0.89
   },
   "fear-unknown": {
    "trades": 3041,
    "avgR": -0.17,
    "winRate": 42,
    "weight": 1.03
   }
  },
  "regime": {
   "against-trend": {
    "trades": 2224,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 0.98
   },
   "with-trend": {
    "trades": 2442,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 0.98
   },
   "trend-unknown": {
    "trades": 3041,
    "avgR": -0.17,
    "winRate": 42,
    "weight": 1.03
   }
  },
  "sector": {
   "with-sector": {
    "trades": 2555,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.01
   },
   "against-sector": {
    "trades": 1771,
    "avgR": -0.28,
    "winRate": 39,
    "weight": 0.92
   },
   "sector-unknown": {
    "trades": 3316,
    "avgR": -0.17,
    "winRate": 42,
    "weight": 1.03
   },
   "sector-flat": {
    "trades": 65,
    "avgR": 0.11,
    "winRate": 51,
    "weight": 1.25
   }
  },
  "buzz": {
   "buzz-unknown": {
    "trades": 7672,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "buzz-none": {
    "trades": 30,
    "avgR": 0.38,
    "winRate": 67,
    "weight": 1.37
   },
   "buzz-some": {
    "trades": 4,
    "avgR": -0.57,
    "winRate": 25,
    "weight": 0.95
   },
   "buzz-hot": {
    "trades": 1,
    "avgR": 0.95,
    "winRate": 100,
    "weight": 1.04
   }
  },
  "comboSectorNews": {
   "with-sector+none": {
    "trades": 2555,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.01
   },
   "against-sector+none": {
    "trades": 1771,
    "avgR": -0.28,
    "winRate": 39,
    "weight": 0.92
   },
   "sector-unknown+none": {
    "trades": 2582,
    "avgR": -0.16,
    "winRate": 43,
    "weight": 1.04
   },
   "sector-flat+none": {
    "trades": 65,
    "avgR": 0.11,
    "winRate": 51,
    "weight": 1.25
   },
   "sector-unknown+news-neutral": {
    "trades": 493,
    "avgR": -0.24,
    "winRate": 38,
    "weight": 0.96
   },
   "sector-unknown+news-pos": {
    "trades": 124,
    "avgR": -0.24,
    "winRate": 39,
    "weight": 0.97
   },
   "sector-unknown+news-neg": {
    "trades": 108,
    "avgR": 0.05,
    "winRate": 47,
    "weight": 1.22
   },
   "sector-unknown+news-mixed": {
    "trades": 9,
    "avgR": -0.7,
    "winRate": 22,
    "weight": 0.88
   }
  },
  "comboFearSide": {
   "fear-calm+short": {
    "trades": 1961,
    "avgR": -0.27,
    "winRate": 39,
    "weight": 0.93
   },
   "fear-calm+long": {
    "trades": 2088,
    "avgR": -0.17,
    "winRate": 41,
    "weight": 1.02
   },
   "fear-rising+short": {
    "trades": 185,
    "avgR": -0.01,
    "winRate": 48,
    "weight": 1.17
   },
   "fear-rising+long": {
    "trades": 167,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "fear-falling+long": {
    "trades": 132,
    "avgR": -0.3,
    "winRate": 40,
    "weight": 0.92
   },
   "fear-falling+short": {
    "trades": 133,
    "avgR": -0.36,
    "winRate": 35,
    "weight": 0.88
   },
   "fear-unknown+long": {
    "trades": 1585,
    "avgR": -0.21,
    "winRate": 41,
    "weight": 0.99
   },
   "fear-unknown+short": {
    "trades": 1456,
    "avgR": -0.12,
    "winRate": 43,
    "weight": 1.08
   }
  },
  "chart:candle": {
   "candle-none": {
    "trades": 5915,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.01
   },
   "candle-mild": {
    "trades": 415,
    "avgR": -0.21,
    "winRate": 41,
    "weight": 0.99
   },
   "candle-against": {
    "trades": 261,
    "avgR": -0.26,
    "winRate": 38,
    "weight": 0.95
   },
   "candle-with": {
    "trades": 1116,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 0.98
   }
  },
  "chart:volume": {
   "vol-weak": {
    "trades": 5608,
    "avgR": -0.21,
    "winRate": 41,
    "weight": 0.99
   },
   "vol-normal": {
    "trades": 1488,
    "avgR": -0.16,
    "winRate": 42,
    "weight": 1.04
   },
   "vol-strong": {
    "trades": 611,
    "avgR": -0.17,
    "winRate": 39,
    "weight": 1.03
   }
  },
  "chart:vwap": {
   "vwap-with": {
    "trades": 7478,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.01
   },
   "vwap-against": {
    "trades": 229,
    "avgR": -0.52,
    "winRate": 34,
    "weight": 0.75
   }
  },
  "chart:structure": {
   "range": {
    "trades": 7096,
    "avgR": -0.2,
    "winRate": 40,
    "weight": 0.99
   },
   "trend-with": {
    "trades": 598,
    "avgR": -0.11,
    "winRate": 45,
    "weight": 1.09
   },
   "trend-against": {
    "trades": 13,
    "avgR": -0.89,
    "winRate": 15,
    "weight": 0.79
   }
  },
  "chart:extension": {
   "ext-normal": {
    "trades": 6505,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1
   },
   "ext-moderate": {
    "trades": 1070,
    "avgR": -0.21,
    "winRate": 38,
    "weight": 0.99
   },
   "ext-stretched": {
    "trades": 132,
    "avgR": -0.24,
    "winRate": 30,
    "weight": 0.96
   }
  },
  "chart:timing": {
   "early": {
    "trades": 6713,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 0.98
   },
   "mid": {
    "trades": 882,
    "avgR": -0.1,
    "winRate": 45,
    "weight": 1.1
   },
   "late": {
    "trades": 112,
    "avgR": -0.04,
    "winRate": 45,
    "weight": 1.14
   }
  },
  "chart:comboCandleVol": {
   "candle-none+vol-weak": {
    "trades": 4303,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1
   },
   "candle-none+vol-normal": {
    "trades": 1067,
    "avgR": -0.16,
    "winRate": 41,
    "weight": 1.03
   },
   "candle-mild+vol-weak": {
    "trades": 310,
    "avgR": -0.27,
    "winRate": 40,
    "weight": 0.93
   },
   "candle-none+vol-strong": {
    "trades": 545,
    "avgR": -0.16,
    "winRate": 40,
    "weight": 1.04
   },
   "candle-against+vol-normal": {
    "trades": 53,
    "avgR": -0.42,
    "winRate": 30,
    "weight": 0.86
   },
   "candle-mild+vol-normal": {
    "trades": 89,
    "avgR": 0.01,
    "winRate": 47,
    "weight": 1.18
   },
   "candle-with+vol-weak": {
    "trades": 797,
    "avgR": -0.24,
    "winRate": 40,
    "weight": 0.96
   },
   "candle-against+vol-weak": {
    "trades": 198,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 0.98
   },
   "candle-with+vol-normal": {
    "trades": 279,
    "avgR": -0.16,
    "winRate": 47,
    "weight": 1.04
   },
   "candle-mild+vol-strong": {
    "trades": 16,
    "avgR": -0.13,
    "winRate": 38,
    "weight": 1.03
   },
   "candle-with+vol-strong": {
    "trades": 40,
    "avgR": -0.28,
    "winRate": 35,
    "weight": 0.95
   },
   "candle-against+vol-strong": {
    "trades": 10,
    "avgR": -0.18,
    "winRate": 30,
    "weight": 1
   }
  },
  "outcome:exit": {
   "11": {
    "trades": 345,
    "avgR": 0.16,
    "winRate": 56,
    "weight": 1.39
   },
   "trailing stop": {
    "trades": 3144,
    "avgR": 1.12,
    "winRate": 93,
    "weight": 1.6
   },
   "stop": {
    "trades": 2788,
    "avgR": -1.05,
    "winRate": 0,
    "weight": 0.5
   },
   "stopped on the entry candle": {
    "trades": 1413,
    "avgR": -1.54,
    "winRate": 0,
    "weight": 0.5
   },
   "closed 15": {
    "trades": 10,
    "avgR": 3.21,
    "winRate": 100,
    "weight": 1.6
   },
   "closed through VWAP": {
    "trades": 6,
    "avgR": 0.78,
    "winRate": 100,
    "weight": 1.21
   },
   "data end": {
    "trades": 1,
    "avgR": 2.16,
    "winRate": 100,
    "weight": 1.09
   }
  }
 },
 "version": 1
}
```
