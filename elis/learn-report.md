# Elis learning report

2026-11-23T23:31:42.266Z

Kept current settings (444 sessions, tested on the last 134 it did not learn from).
Unseen days: win rate 40% -> 36%, avg -0.28R -> -0.38R, avg win 1.29R -> 1.09R.
Changes: picks 3 -> 1, keepMinR 1 -> 0.5, entryEnd 630 -> 600, entryGate 0 -> 0.95, newsExit true -> false.
Best info: gap1-3% -0.11R, gap<1% -0.12R, rvol2-4 -0.12R, normal-range -0.06R.
Weakest: gap8%+ -0.35R, rvol8+ -0.33R, fear-falling -0.33R, fear-falling+short -0.36R.

## Why (unseen days)

Overall -0.28R avg over 283 trades.
Made money when:
  + how it exited = trailing stop: +1.22R avg, 91% wins, 114 trades
Lost most when:
  - how it exited = stopped on the entry candle: -1.83R avg, 0% wins, 75 trades
  - how it exited = stop: -1.05R avg, 0% wins, 81 trades

If Elis had started with $3,000 on 2024-01-02 (to 2025-10-08):
BEFORE (current settings): $3,000 -> $1,691 (-43.6%), max drawdown 46.9%, 532 trades, 34% wins, avg win $13 / avg loss $10, 16/22 red months
AFTER (learned settings): $3,000 -> $1,956 (-34.8%), max drawdown 37.1%, 225 trades, 40% wins, avg win $33 / avg loss $30, 15/22 red months
Honest check, only the 134 sessions the learner never saw (2025-03-28 to 2025-10-08), $3,000 start:
BEFORE: $3,000 -> $2,097 (-30.1%), max drawdown 35.1%, 283 trades, 40% wins, avg win $20 / avg loss $19, 6/8 red months
AFTER: $3,000 -> $2,299 (-23.4%), max drawdown 26.1%, 69 trades, 36% wins, avg win $27 / avg loss $31, 7/8 red months

## Formula search

Searched 12,226 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).
Strong move alone, unseen days: going with it -0.07R avg (41% wins), against it -0.03R (44% wins), 6028 cases.
1. go WITH the strong move when: t-midday + mkt-against-move + spy-flat
   unseen: 0.52R avg, 44% wins, 71 cases | training: 0.12R, 53% wins, 219 cases
2. go WITH the strong move when: no-indecision + t-midday + mkt-against-move
   unseen: 0.33R avg, 43% wins, 98 cases | training: 0.16R, 55% wins, 302 cases
3. go WITH the strong move when: t-midday + mkt-against-move + fear-calm
   unseen: 0.34R avg, 40% wins, 89 cases | training: 0.1R, 53% wins, 245 cases
4. go WITH the strong move when: vol-normal + t-midday + mkt-against-move
   unseen: 0.41R avg, 33% wins, 61 cases | training: 0.16R, 53% wins, 166 cases
5. go WITH the strong move when: vwap-with-move-far + t-midday + mkt-against-move
   unseen: 0.42R avg, 40% wins, 58 cases | training: 0.15R, 54% wins, 207 cases
6. go WITH the strong move when: t-midday + mkt-against-move
   unseen: 0.3R avg, 42% wins, 101 cases | training: 0.15R, 54% wins, 309 cases
7. go WITH the strong move when: t-midday + mkt-against-move + no-recent-news
   unseen: 0.3R avg, 42% wins, 101 cases | training: 0.15R, 54% wins, 309 cases
8. go WITH the strong move when: vwap-with-move-far + t-afternoon + with-sector
   unseen: 0.12R avg, 51% wins, 228 cases | training: 0.11R, 44% wins, 422 cases
9. go AGAINST the strong move when: bullish engulfing + t-midday
   unseen: 0.18R avg, 54% wins, 76 cases | training: 0.14R, 49% wins, 179 cases
10. go AGAINST the strong move when: bullish engulfing + t-midday + no-recent-news
   unseen: 0.18R avg, 54% wins, 76 cases | training: 0.14R, 49% wins, 179 cases

## Pivot study

481244 moments

Warning signs before drops:
DROP next 30 min: fear-calm + down-strong -> 33% on unseen days (normal 9%, 4166 cases; 31% in training, 10034 cases)
DROP next 30 min: down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)
DROP next 30 min: no-recent-news + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)
DROP next 30 min: none/none + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)
DROP next 30 min: buzz-unknown + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)
DROP next 30 min: down-strong + mkt-flat -> 34% on unseen days (normal 9%, 3022 cases; 32% in training, 7311 cases)
DROP next 30 min: no-indecision + down-strong -> 32% on unseen days (normal 9%, 4625 cases; 31% in training, 10729 cases)
DROP next 30 min: up-strong -> 32% on unseen days (normal 9%, 5038 cases; 33% in training, 11062 cases)

Signs before rises:
RISE next 30 min: no-indecision + up-strong -> 32% on unseen days (normal 9%, 4804 cases; 32% in training, 10552 cases)
RISE next 30 min: up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)
RISE next 30 min: no-recent-news + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)
RISE next 30 min: none/none + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)
RISE next 30 min: buzz-unknown + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)
RISE next 30 min: no-indecision + vol-fading + up-strong -> 34% on unseen days (normal 9%, 2289 cases; 33% in training, 4977 cases)
RISE next 30 min: vol-fading + up-strong -> 34% on unseen days (normal 9%, 2438 cases; 33% in training, 5311 cases)
RISE next 30 min: no-recent-news + vol-fading + up-strong -> 34% on unseen days (normal 9%, 2438 cases; 33% in training, 5311 cases)

## Experiments

Experiments on the 134 unseen sessions (current: 283 trades, 40% wins, avg -0.28R, total -80.2R):
- study rules (hold to close, 10% ATR stop), top 3, entries to 11:00: 294 trades, 8% wins, avg -0.47R, total -138.6R
- study rules, top 5, entries to 11:00: 482 trades, 8% wins, avg -0.48R, total -232.9R
- study rules, top 3, entries all day: 307 trades, 7% wins, avg -0.51R, total -157R
- study rules + sell on bad news, top 3: 294 trades, 8% wins, avg -0.47R, total -138.6R
- Elis exits, but 10% ATR stop: 283 trades, 27% wins, avg -0.94R, total -264.6R
- Elis + sell on pivot warning >= 45%: 283 trades, 40% wins, avg -0.28R, total -80.2R
- Elis + sell on pivot warning >= 55%: 283 trades, 40% wins, avg -0.28R, total -80.2R
- Elis + sell on pivot warning >= 65%: 283 trades, 40% wins, avg -0.28R, total -80.2R

## QQQ strategy history

{"sessions":400,"trades":331,"winRatePct":29.6,"totalR":-49.44,"profitFactor":0.79,"returnPct":-40.8,"maxDrawdownPct":-55.2}

## Proposals

No new rule or process beat the current setup on the unseen days, so nothing to change.

```json
{
 "why": {
  "n": 283,
  "overall": -0.28,
  "findings": [
   {
    "dim": "how it exited",
    "value": "trailing stop",
    "n": 114,
    "avgR": 1.22,
    "winPct": 91,
    "z": 9.66,
    "better": true
   },
   {
    "dim": "how it exited",
    "value": "stopped on the entry candle",
    "n": 75,
    "avgR": -1.83,
    "winPct": 0,
    "z": -8.06,
    "better": false
   },
   {
    "dim": "how it exited",
    "value": "stop",
    "n": 81,
    "avgR": -1.05,
    "winPct": 0,
    "z": -4.15,
    "better": false
   }
  ],
  "tables": {
   "how it exited": {
    "11": {
     "n": 13,
     "avgR": 0.26,
     "winPct": 69
    },
    "trailing stop": {
     "n": 114,
     "avgR": 1.22,
     "winPct": 91
    },
    "stopped on the entry candle": {
     "n": 75,
     "avgR": -1.83,
     "winPct": 0
    },
    "stop": {
     "n": 81,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "news type": {
    "none": {
     "n": 283,
     "avgR": -0.28,
     "winPct": 40
    }
   },
   "news tone": {
    "none": {
     "n": 283,
     "avgR": -0.28,
     "winPct": 40
    }
   },
   "S&P direction at the open": {
    "with-market": {
     "n": 154,
     "avgR": -0.07,
     "winPct": 46
    },
    "against-market": {
     "n": 129,
     "avgR": -0.54,
     "winPct": 33
    }
   },
   "S&P gap": {
    "spy-flat": {
     "n": 208,
     "avgR": -0.36,
     "winPct": 37
    },
    "spy-gap-down": {
     "n": 45,
     "avgR": 0.13,
     "winPct": 58
    },
    "spy-gap-up": {
     "n": 30,
     "avgR": -0.38,
     "winPct": 37
    }
   },
   "fear gauge": {
    "fear-calm": {
     "n": 230,
     "avgR": -0.33,
     "winPct": 37
    },
    "fear-rising": {
     "n": 33,
     "avgR": -0.02,
     "winPct": 58
    },
    "fear-falling": {
     "n": 20,
     "avgR": -0.2,
     "winPct": 40
    }
   },
   "trend regime": {
    "with-trend": {
     "n": 140,
     "avgR": -0.4,
     "winPct": 36
    },
    "against-trend": {
     "n": 143,
     "avgR": -0.17,
     "winPct": 44
    }
   },
   "sector": {
    "with-sector": {
     "n": 146,
     "avgR": -0.18,
     "winPct": 44
    },
    "against-sector": {
     "n": 111,
     "avgR": -0.56,
     "winPct": 33
    },
    "sector-flat": {
     "n": 5,
     "avgR": 0.36,
     "winPct": 40
    },
    "sector-unknown": {
     "n": 21,
     "avgR": 0.33,
     "winPct": 48
    }
   },
   "side": {
    "short": {
     "n": 169,
     "avgR": -0.14,
     "winPct": 44
    },
    "long": {
     "n": 114,
     "avgR": -0.5,
     "winPct": 33
    }
   },
   "stock gap": {
    "gap8%+": {
     "n": 113,
     "avgR": -0.59,
     "winPct": 31
    },
    "gap3-8%": {
     "n": 73,
     "avgR": -0.22,
     "winPct": 45
    },
    "gap<1%": {
     "n": 38,
     "avgR": -0.03,
     "winPct": 47
    },
    "gap1-3%": {
     "n": 59,
     "avgR": 0.05,
     "winPct": 46
    }
   },
   "opening volume surge": {
    "rvol8+": {
     "n": 257,
     "avgR": -0.31,
     "winPct": 39
    },
    "rvol4-8": {
     "n": 26,
     "avgR": -0.01,
     "winPct": 50
    }
   },
   "opening range": {
    "wide-range": {
     "n": 229,
     "avgR": -0.37,
     "winPct": 37
    },
    "normal-range": {
     "n": 44,
     "avgR": -0.02,
     "winPct": 52
    },
    "tight-range": {
     "n": 10,
     "avgR": 0.45,
     "winPct": 50
    }
   },
   "candle read at entry": {
    "candle-none": {
     "n": 207,
     "avgR": -0.34,
     "winPct": 39
    },
    "candle-with": {
     "n": 53,
     "avgR": -0.1,
     "winPct": 42
    },
    "candle-mild": {
     "n": 12,
     "avgR": -0.65,
     "winPct": 33
    },
    "candle-against": {
     "n": 11,
     "avgR": 0.32,
     "winPct": 55
    }
   },
   "volume at entry": {
    "vol-weak": {
     "n": 197,
     "avgR": -0.4,
     "winPct": 39
    },
    "vol-normal": {
     "n": 62,
     "avgR": -0.05,
     "winPct": 45
    },
    "vol-strong": {
     "n": 24,
     "avgR": 0.08,
     "winPct": 38
    }
   },
   "VWAP at entry": {
    "vwap-with": {
     "n": 274,
     "avgR": -0.24,
     "winPct": 41
    },
    "vwap-against": {
     "n": 9,
     "avgR": -1.46,
     "winPct": 22
    }
   },
   "mid-trade news": {
    "no bad news mid-trade": {
     "n": 283,
     "avgR": -0.28,
     "winPct": 40
    }
   },
   "month": {
    "2025-03": {
     "n": 6,
     "avgR": 0.78,
     "winPct": 67
    },
    "2025-04": {
     "n": 46,
     "avgR": 0.07,
     "winPct": 48
    },
    "2025-05": {
     "n": 43,
     "avgR": -0.7,
     "winPct": 28
    },
    "2025-06": {
     "n": 44,
     "avgR": -0.32,
     "winPct": 41
    },
    "2025-07": {
     "n": 44,
     "avgR": -0.35,
     "winPct": 36
    },
    "2025-08": {
     "n": 44,
     "avgR": -0.19,
     "winPct": 41
    },
    "2025-09": {
     "n": 44,
     "avgR": -0.51,
     "winPct": 39
    },
    "2025-10": {
     "n": 12,
     "avgR": 0.2,
     "winPct": 50
    }
   }
  },
  "text": "Overall -0.28R avg over 283 trades.\nMade money when:\n  + how it exited = trailing stop: +1.22R avg, 91% wins, 114 trades\nLost most when:\n  - how it exited = stopped on the entry candle: -1.83R avg, 0% wins, 75 trades\n  - how it exited = stop: -1.05R avg, 0% wins, 81 trades"
 },
 "money": {
  "before": {
   "from": "2024-01-02",
   "to": "2025-10-08",
   "start": 3000,
   "end": 1691,
   "returnPct": -43.6,
   "maxDrawdownPct": 46.9,
   "trades": 532,
   "winRatePct": 34,
   "avgWinUsd": 13,
   "avgLossUsd": 10,
   "bestDay": {
    "day": "2024-08-12",
    "usd": 132
   },
   "worstDay": {
    "day": "2024-04-04",
    "usd": -77
   },
   "redMonths": 16,
   "months": 22,
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
     "end": 1691,
     "pct": -2.8
    }
   ]
  },
  "after": {
   "from": "2024-01-02",
   "to": "2025-10-08",
   "start": 3000,
   "end": 1956,
   "returnPct": -34.8,
   "maxDrawdownPct": 37.1,
   "trades": 225,
   "winRatePct": 40,
   "avgWinUsd": 33,
   "avgLossUsd": 30,
   "bestDay": {
    "day": "2024-08-08",
    "usd": 200
   },
   "worstDay": {
    "day": "2025-08-28",
    "usd": -112
   },
   "redMonths": 15,
   "months": 22,
   "worstMonth": {
    "m": "2025-05",
    "end": 2388,
    "pct": -8.7
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 2941,
     "pct": -2
    },
    {
     "m": "2024-02",
     "end": 2770,
     "pct": -5.8
    },
    {
     "m": "2024-03",
     "end": 2660,
     "pct": -4
    },
    {
     "m": "2024-04",
     "end": 2445,
     "pct": -8.1
    },
    {
     "m": "2024-05",
     "end": 2389,
     "pct": -2.3
    },
    {
     "m": "2024-06",
     "end": 2321,
     "pct": -2.8
    },
    {
     "m": "2024-07",
     "end": 2219,
     "pct": -4.4
    },
    {
     "m": "2024-08",
     "end": 2406,
     "pct": 8.4
    },
    {
     "m": "2024-09",
     "end": 2303,
     "pct": -4.3
    },
    {
     "m": "2024-10",
     "end": 2342,
     "pct": 1.7
    },
    {
     "m": "2024-11",
     "end": 2424,
     "pct": 3.5
    },
    {
     "m": "2024-12",
     "end": 2372,
     "pct": -2.1
    },
    {
     "m": "2025-01",
     "end": 2438,
     "pct": 2.8
    },
    {
     "m": "2025-02",
     "end": 2473,
     "pct": 1.4
    },
    {
     "m": "2025-03",
     "end": 2518,
     "pct": 1.8
    },
    {
     "m": "2025-04",
     "end": 2616,
     "pct": 3.9
    },
    {
     "m": "2025-05",
     "end": 2388,
     "pct": -8.7
    },
    {
     "m": "2025-06",
     "end": 2321,
     "pct": -2.8
    },
    {
     "m": "2025-07",
     "end": 2223,
     "pct": -4.2
    },
    {
     "m": "2025-08",
     "end": 2181,
     "pct": -1.9
    },
    {
     "m": "2025-09",
     "end": 1999,
     "pct": -8.3
    },
    {
     "m": "2025-10",
     "end": 1956,
     "pct": -2.2
    }
   ]
  },
  "unseenBefore": {
   "from": "2025-03-28",
   "to": "2025-10-08",
   "start": 3000,
   "end": 2097,
   "returnPct": -30.1,
   "maxDrawdownPct": 35.1,
   "trades": 283,
   "winRatePct": 40,
   "avgWinUsd": 20,
   "avgLossUsd": 19,
   "bestDay": {
    "day": "2025-07-07",
    "usd": 171
   },
   "worstDay": {
    "day": "2025-05-19",
    "usd": -119
   },
   "redMonths": 6,
   "months": 8,
   "worstMonth": {
    "m": "2025-05",
    "end": 2601,
    "pct": -12.8
   },
   "monthly": [
    {
     "m": "2025-03",
     "end": 3107,
     "pct": 3.6
    },
    {
     "m": "2025-04",
     "end": 2983,
     "pct": -4
    },
    {
     "m": "2025-05",
     "end": 2601,
     "pct": -12.8
    },
    {
     "m": "2025-06",
     "end": 2490,
     "pct": -4.3
    },
    {
     "m": "2025-07",
     "end": 2399,
     "pct": -3.7
    },
    {
     "m": "2025-08",
     "end": 2433,
     "pct": 1.4
    },
    {
     "m": "2025-09",
     "end": 2124,
     "pct": -12.7
    },
    {
     "m": "2025-10",
     "end": 2097,
     "pct": -1.3
    }
   ]
  },
  "unseenAfter": {
   "from": "2025-03-28",
   "to": "2025-10-08",
   "start": 3000,
   "end": 2299,
   "returnPct": -23.4,
   "maxDrawdownPct": 26.1,
   "trades": 69,
   "winRatePct": 36,
   "avgWinUsd": 27,
   "avgLossUsd": 31,
   "bestDay": {
    "day": "2025-04-03",
    "usd": 114
   },
   "worstDay": {
    "day": "2025-08-28",
    "usd": -132
   },
   "redMonths": 7,
   "months": 8,
   "worstMonth": {
    "m": "2025-05",
    "end": 2807,
    "pct": -8.7
   },
   "monthly": [
    {
     "m": "2025-03",
     "end": 2960,
     "pct": -1.3
    },
    {
     "m": "2025-04",
     "end": 3076,
     "pct": 3.9
    },
    {
     "m": "2025-05",
     "end": 2807,
     "pct": -8.7
    },
    {
     "m": "2025-06",
     "end": 2728,
     "pct": -2.8
    },
    {
     "m": "2025-07",
     "end": 2613,
     "pct": -4.2
    },
    {
     "m": "2025-08",
     "end": 2564,
     "pct": -1.9
    },
    {
     "m": "2025-09",
     "end": 2350,
     "pct": -8.3
    },
    {
     "m": "2025-10",
     "end": 2299,
     "pct": -2.2
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
    "trades": 294,
    "totalR": -138.6,
    "avgR": -0.47,
    "winRatePct": 8,
    "avgWinR": 17.25,
    "avgLossR": 1.98
   }
  },
  {
   "name": "study rules, top 5, entries to 11:00",
   "unseen": {
    "trades": 482,
    "totalR": -232.9,
    "avgR": -0.48,
    "winRatePct": 8,
    "avgWinR": 14.68,
    "avgLossR": 1.86
   }
  },
  {
   "name": "study rules, top 3, entries all day",
   "unseen": {
    "trades": 307,
    "totalR": -157,
    "avgR": -0.51,
    "winRatePct": 7,
    "avgWinR": 17.25,
    "avgLossR": 1.95
   }
  },
  {
   "name": "study rules + sell on bad news, top 3",
   "unseen": {
    "trades": 294,
    "totalR": -138.6,
    "avgR": -0.47,
    "winRatePct": 8,
    "avgWinR": 17.25,
    "avgLossR": 1.98
   }
  },
  {
   "name": "Elis exits, but 10% ATR stop",
   "unseen": {
    "trades": 283,
    "totalR": -264.6,
    "avgR": -0.94,
    "winRatePct": 27,
    "avgWinR": 2.19,
    "avgLossR": 2.1
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 45%",
   "unseen": {
    "trades": 283,
    "totalR": -80.2,
    "avgR": -0.28,
    "winRatePct": 40,
    "avgWinR": 1.29,
    "avgLossR": 1.33
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 55%",
   "unseen": {
    "trades": 283,
    "totalR": -80.2,
    "avgR": -0.28,
    "winRatePct": 40,
    "avgWinR": 1.29,
    "avgLossR": 1.33
   }
  },
  {
   "name": "Elis + sell on pivot warning >= 65%",
   "unseen": {
    "trades": 283,
    "totalR": -80.2,
    "avgR": -0.28,
    "winRatePct": 40,
    "avgWinR": 1.29,
    "avgLossR": 1.33
   }
  }
 ],
 "pivot": {
  "samples": 481244,
  "signals": [
   {
    "dir": "down",
    "key": "fear+trend",
    "signs": "fear-calm + down-strong",
    "train": {
     "n": 10034,
     "p": 0.311,
     "lift": 3.37
    },
    "unseen": {
     "n": 4166,
     "p": 0.329,
     "lift": 3.63
    }
   },
   {
    "dir": "down",
    "key": "trend",
    "signs": "down-strong",
    "train": {
     "n": 11241,
     "p": 0.308,
     "lift": 3.34
    },
    "unseen": {
     "n": 4831,
     "p": 0.322,
     "lift": 3.55
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + down-strong",
    "train": {
     "n": 11241,
     "p": 0.308,
     "lift": 3.34
    },
    "unseen": {
     "n": 4831,
     "p": 0.322,
     "lift": 3.55
    }
   },
   {
    "dir": "down",
    "key": "newsDay+trend",
    "signs": "none/none + down-strong",
    "train": {
     "n": 11241,
     "p": 0.308,
     "lift": 3.34
    },
    "unseen": {
     "n": 4831,
     "p": 0.322,
     "lift": 3.55
    }
   },
   {
    "dir": "down",
    "key": "buzz+trend",
    "signs": "buzz-unknown + down-strong",
    "train": {
     "n": 11241,
     "p": 0.308,
     "lift": 3.34
    },
    "unseen": {
     "n": 4831,
     "p": 0.322,
     "lift": 3.55
    }
   },
   {
    "dir": "down",
    "key": "trend+market",
    "signs": "down-strong + mkt-flat",
    "train": {
     "n": 7311,
     "p": 0.32,
     "lift": 3.46
    },
    "unseen": {
     "n": 3022,
     "p": 0.341,
     "lift": 3.75
    }
   },
   {
    "dir": "down",
    "key": "indecision+trend",
    "signs": "no-indecision + down-strong",
    "train": {
     "n": 10729,
     "p": 0.309,
     "lift": 3.34
    },
    "unseen": {
     "n": 4625,
     "p": 0.323,
     "lift": 3.56
    }
   },
   {
    "dir": "down",
    "key": "trend",
    "signs": "up-strong",
    "train": {
     "n": 11062,
     "p": 0.327,
     "lift": 3.54
    },
    "unseen": {
     "n": 5038,
     "p": 0.315,
     "lift": 3.47
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + up-strong",
    "train": {
     "n": 11062,
     "p": 0.327,
     "lift": 3.54
    },
    "unseen": {
     "n": 5038,
     "p": 0.315,
     "lift": 3.47
    }
   },
   {
    "dir": "down",
    "key": "newsDay+trend",
    "signs": "none/none + up-strong",
    "train": {
     "n": 11062,
     "p": 0.327,
     "lift": 3.54
    },
    "unseen": {
     "n": 5038,
     "p": 0.315,
     "lift": 3.47
    }
   },
   {
    "dir": "down",
    "key": "buzz+trend",
    "signs": "buzz-unknown + up-strong",
    "train": {
     "n": 11062,
     "p": 0.327,
     "lift": 3.54
    },
    "unseen": {
     "n": 5038,
     "p": 0.315,
     "lift": 3.47
    }
   },
   {
    "dir": "down",
    "key": "vwap+trend",
    "signs": "above-vwap-far + up-strong",
    "train": {
     "n": 5821,
     "p": 0.339,
     "lift": 3.66
    },
    "unseen": {
     "n": 2581,
     "p": 0.341,
     "lift": 3.76
    }
   },
   {
    "dir": "down",
    "key": "indecision+trend",
    "signs": "no-indecision + up-strong",
    "train": {
     "n": 10552,
     "p": 0.327,
     "lift": 3.54
    },
    "unseen": {
     "n": 4804,
     "p": 0.315,
     "lift": 3.47
    }
   },
   {
    "dir": "up",
    "key": "indecision+trend",
    "signs": "no-indecision + up-strong",
    "train": {
     "n": 10552,
     "p": 0.315,
     "lift": 3.56
    },
    "unseen": {
     "n": 4804,
     "p": 0.315,
     "lift": 3.44
    }
   },
   {
    "dir": "up",
    "key": "trend",
    "signs": "up-strong",
    "train": {
     "n": 11062,
     "p": 0.317,
     "lift": 3.58
    },
    "unseen": {
     "n": 5038,
     "p": 0.313,
     "lift": 3.42
    }
   },
   {
    "dir": "up",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + up-strong",
    "train": {
     "n": 11062,
     "p": 0.317,
     "lift": 3.58
    },
    "unseen": {
     "n": 5038,
     "p": 0.313,
     "lift": 3.42
    }
   },
   {
    "dir": "up",
    "key": "newsDay+trend",
    "signs": "none/none + up-strong",
    "train": {
     "n": 11062,
     "p": 0.317,
     "lift": 3.58
    },
    "unseen": {
     "n": 5038,
     "p": 0.313,
     "lift": 3.42
    }
   },
   {
    "dir": "up",
    "key": "buzz+trend",
    "signs": "buzz-unknown + up-strong",
    "train": {
     "n": 11062,
     "p": 0.317,
     "lift": 3.58
    },
    "unseen": {
     "n": 5038,
     "p": 0.313,
     "lift": 3.42
    }
   },
   {
    "dir": "up",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-fading + up-strong",
    "train": {
     "n": 4977,
     "p": 0.325,
     "lift": 3.67
    },
    "unseen": {
     "n": 2289,
     "p": 0.344,
     "lift": 3.76
    }
   },
   {
    "dir": "up",
    "key": "vol+trend",
    "signs": "vol-fading + up-strong",
    "train": {
     "n": 5311,
     "p": 0.325,
     "lift": 3.67
    },
    "unseen": {
     "n": 2438,
     "p": 0.34,
     "lift": 3.71
    }
   },
   {
    "dir": "up",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-fading + up-strong",
    "train": {
     "n": 5311,
     "p": 0.325,
     "lift": 3.67
    },
    "unseen": {
     "n": 2438,
     "p": 0.34,
     "lift": 3.71
    }
   },
   {
    "dir": "down",
    "key": "fear+trend",
    "signs": "fear-calm + up-strong",
    "train": {
     "n": 9690,
     "p": 0.33,
     "lift": 3.57
    },
    "unseen": {
     "n": 4373,
     "p": 0.31,
     "lift": 3.42
    }
   },
   {
    "dir": "up",
    "key": "fear+trend",
    "signs": "fear-calm + up-strong",
    "train": {
     "n": 9690,
     "p": 0.315,
     "lift": 3.56
    },
    "unseen": {
     "n": 4373,
     "p": 0.312,
     "lift": 3.41
    }
   },
   {
    "dir": "up",
    "key": "trend",
    "signs": "down-strong",
    "train": {
     "n": 11241,
     "p": 0.3,
     "lift": 3.39
    },
    "unseen": {
     "n": 4831,
     "p": 0.308,
     "lift": 3.36
    }
   },
   {
    "dir": "up",
    "key": "newsRecent+trend",
    "signs": "no-recent-news + down-strong",
    "train": {
     "n": 11241,
     "p": 0.3,
     "lift": 3.39
    },
    "unseen": {
     "n": 4831,
     "p": 0.308,
     "lift": 3.36
    }
   },
   {
    "dir": "up",
    "key": "newsDay+trend",
    "signs": "none/none + down-strong",
    "train": {
     "n": 11241,
     "p": 0.3,
     "lift": 3.39
    },
    "unseen": {
     "n": 4831,
     "p": 0.308,
     "lift": 3.36
    }
   },
   {
    "dir": "up",
    "key": "buzz+trend",
    "signs": "buzz-unknown + down-strong",
    "train": {
     "n": 11241,
     "p": 0.3,
     "lift": 3.39
    },
    "unseen": {
     "n": 4831,
     "p": 0.308,
     "lift": 3.36
    }
   },
   {
    "dir": "up",
    "key": "indecision+trend",
    "signs": "no-indecision + down-strong",
    "train": {
     "n": 10729,
     "p": 0.3,
     "lift": 3.39
    },
    "unseen": {
     "n": 4625,
     "p": 0.307,
     "lift": 3.35
    }
   },
   {
    "dir": "down",
    "key": "sector+trend",
    "signs": "against-sector + down-strong",
    "train": {
     "n": 4296,
     "p": 0.299,
     "lift": 3.23
    },
    "unseen": {
     "n": 1904,
     "p": 0.338,
     "lift": 3.73
    }
   },
   {
    "dir": "down",
    "key": "trend+market",
    "signs": "up-strong + mkt-flat",
    "train": {
     "n": 7544,
     "p": 0.333,
     "lift": 3.6
    },
    "unseen": {
     "n": 3247,
     "p": 0.315,
     "lift": 3.48
    }
   },
   {
    "dir": "down",
    "key": "vol+trend",
    "signs": "vol-fading + down-strong",
    "train": {
     "n": 5728,
     "p": 0.314,
     "lift": 3.39
    },
    "unseen": {
     "n": 2471,
     "p": 0.327,
     "lift": 3.6
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-fading + down-strong",
    "train": {
     "n": 5728,
     "p": 0.314,
     "lift": 3.39
    },
    "unseen": {
     "n": 2471,
     "p": 0.327,
     "lift": 3.6
    }
   },
   {
    "dir": "down",
    "key": "indecision+vol+trend",
    "signs": "no-indecision + vol-fading + down-strong",
    "train": {
     "n": 5394,
     "p": 0.316,
     "lift": 3.42
    },
    "unseen": {
     "n": 2345,
     "p": 0.326,
     "lift": 3.6
    }
   },
   {
    "dir": "up",
    "key": "trend+market",
    "signs": "up-strong + mkt-flat",
    "train": {
     "n": 7544,
     "p": 0.322,
     "lift": 3.64
    },
    "unseen": {
     "n": 3247,
     "p": 0.316,
     "lift": 3.45
    }
   },
   {
    "dir": "down",
    "key": "vwap+trend",
    "signs": "below-vwap-far + down-strong",
    "train": {
     "n": 5764,
     "p": 0.309,
     "lift": 3.34
    },
    "unseen": {
     "n": 2445,
     "p": 0.323,
     "lift": 3.56
    }
   },
   {
    "dir": "up",
    "key": "fear+trend",
    "signs": "fear-calm + down-strong",
    "train": {
     "n": 10034,
     "p": 0.297,
     "lift": 3.35
    },
    "unseen": {
     "n": 4166,
     "p": 0.304,
     "lift": 3.32
    }
   },
   {
    "dir": "down",
    "key": "vol+trend",
    "signs": "vol-fading + up-strong",
    "train": {
     "n": 5311,
     "p": 0.333,
     "lift": 3.6
    },
    "unseen": {
     "n": 2438,
     "p": 0.318,
     "lift": 3.51
    }
   },
   {
    "dir": "down",
    "key": "newsRecent+vol+trend",
    "signs": "no-recent-news + vol-fading + up-strong",
    "train": {
     "n": 5311,
     "p": 0.333,
     "lift": 3.6
    },
    "unseen": {
     "n": 2438,
     "p": 0.318,
     "lift": 3.51
    }
   },
   {
    "dir": "up",
    "key": "vwap+trend",
    "signs": "below-vwap-far + down-strong",
    "train": {
     "n": 5764,
     "p": 0.317,
     "lift": 3.58
    },
    "unseen": {
     "n": 2445,
     "p": 0.321,
     "lift": 3.5
    }
   },
   {
    "dir": "down",
    "key": "vwap+trend",
    "signs": "below-vwap + down-strong",
    "train": {
     "n": 4327,
     "p": 0.303,
     "lift": 3.27
    },
    "unseen": {
     "n": 1875,
     "p": 0.329,
     "lift": 3.62
    }
   }
  ],
  "base": {
   "up": 0.09155334891235758,
   "down": 0.09068656343829527
  },
  "text": "Warning signs before drops:\nDROP next 30 min: fear-calm + down-strong -> 33% on unseen days (normal 9%, 4166 cases; 31% in training, 10034 cases)\nDROP next 30 min: down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)\nDROP next 30 min: no-recent-news + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)\nDROP next 30 min: none/none + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)\nDROP next 30 min: buzz-unknown + down-strong -> 32% on unseen days (normal 9%, 4831 cases; 31% in training, 11241 cases)\nDROP next 30 min: down-strong + mkt-flat -> 34% on unseen days (normal 9%, 3022 cases; 32% in training, 7311 cases)\nDROP next 30 min: no-indecision + down-strong -> 32% on unseen days (normal 9%, 4625 cases; 31% in training, 10729 cases)\nDROP next 30 min: up-strong -> 32% on unseen days (normal 9%, 5038 cases; 33% in training, 11062 cases)\n\nSigns before rises:\nRISE next 30 min: no-indecision + up-strong -> 32% on unseen days (normal 9%, 4804 cases; 32% in training, 10552 cases)\nRISE next 30 min: up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)\nRISE next 30 min: no-recent-news + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)\nRISE next 30 min: none/none + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)\nRISE next 30 min: buzz-unknown + up-strong -> 31% on unseen days (normal 9%, 5038 cases; 32% in training, 11062 cases)\nRISE next 30 min: no-indecision + vol-fading + up-strong -> 34% on unseen days (normal 9%, 2289 cases; 33% in training, 4977 cases)\nRISE next 30 min: vol-fading + up-strong -> 34% on unseen days (normal 9%, 2438 cases; 33% in training, 5311 cases)\nRISE next 30 min: no-recent-news + vol-fading + up-strong -> 34% on unseen days (normal 9%, 2438 cases; 33% in training, 5311 cases)"
 },
 "formula": {
  "tested": 176,
  "moments": 19575,
  "baseTrain": {
   "n": 13547,
   "contR": -0.06,
   "revR": -0.05,
   "contWin": 42,
   "revWin": 44
  },
  "baseTest": {
   "n": 6028,
   "contR": -0.07,
   "revR": -0.03,
   "contWin": 41,
   "revWin": 44
  },
  "list": [
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move + spy-flat",
    "keys": "time+market+mktGap",
    "train": {
     "n": 219,
     "avgR": 0.12,
     "winPct": 53
    },
    "unseen": {
     "n": 71,
     "avgR": 0.52,
     "winPct": 44
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "no-indecision + t-midday + mkt-against-move",
    "keys": "indecision+time+market",
    "train": {
     "n": 302,
     "avgR": 0.16,
     "winPct": 55
    },
    "unseen": {
     "n": 98,
     "avgR": 0.33,
     "winPct": 43
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move + fear-calm",
    "keys": "time+market+fear",
    "train": {
     "n": 245,
     "avgR": 0.1,
     "winPct": 53
    },
    "unseen": {
     "n": 89,
     "avgR": 0.34,
     "winPct": 40
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "vol-normal + t-midday + mkt-against-move",
    "keys": "vol+time+market",
    "train": {
     "n": 166,
     "avgR": 0.16,
     "winPct": 53
    },
    "unseen": {
     "n": 61,
     "avgR": 0.41,
     "winPct": 33
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "vwap-with-move-far + t-midday + mkt-against-move",
    "keys": "vwap+time+market",
    "train": {
     "n": 207,
     "avgR": 0.15,
     "winPct": 54
    },
    "unseen": {
     "n": 58,
     "avgR": 0.42,
     "winPct": 40
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move",
    "keys": "time+market",
    "train": {
     "n": 309,
     "avgR": 0.15,
     "winPct": 54
    },
    "unseen": {
     "n": 101,
     "avgR": 0.3,
     "winPct": 42
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "t-midday + mkt-against-move + no-recent-news",
    "keys": "time+market+newsRecent",
    "train": {
     "n": 309,
     "avgR": 0.15,
     "winPct": 54
    },
    "unseen": {
     "n": 101,
     "avgR": 0.3,
     "winPct": 42
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "vwap-with-move-far + t-afternoon + with-sector",
    "keys": "vwap+time+sector",
    "train": {
     "n": 422,
     "avgR": 0.11,
     "winPct": 44
    },
    "unseen": {
     "n": 228,
     "avgR": 0.12,
     "winPct": 51
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + t-midday",
    "keys": "pattern+time",
    "train": {
     "n": 179,
     "avgR": 0.14,
     "winPct": 49
    },
    "unseen": {
     "n": 76,
     "avgR": 0.18,
     "winPct": 54
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + t-midday + no-recent-news",
    "keys": "pattern+time+newsRecent",
    "train": {
     "n": 179,
     "avgR": 0.14,
     "winPct": 49
    },
    "unseen": {
     "n": 76,
     "avgR": 0.18,
     "winPct": 54
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + no-indecision + t-midday",
    "keys": "pattern+indecision+time",
    "train": {
     "n": 177,
     "avgR": 0.15,
     "winPct": 49
    },
    "unseen": {
     "n": 74,
     "avgR": 0.18,
     "winPct": 54
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "mkt-with-move + with-sector + fear-rising",
    "keys": "market+sector+fear",
    "train": {
     "n": 204,
     "avgR": 0.13,
     "winPct": 58
    },
    "unseen": {
     "n": 278,
     "avgR": 0.08,
     "winPct": 43
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + no-indecision + vwap-with-move",
    "keys": "pattern+indecision+vwap",
    "train": {
     "n": 204,
     "avgR": 0.11,
     "winPct": 52
    },
    "unseen": {
     "n": 84,
     "avgR": 0.14,
     "winPct": 55
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "vwap-against-move + mkt-flat + against-sector",
    "keys": "vwap+market+sector",
    "train": {
     "n": 255,
     "avgR": 0.11,
     "winPct": 52
    },
    "unseen": {
     "n": 110,
     "avgR": 0.1,
     "winPct": 48
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "three black crows + vol-rising + vwap-with-move-far",
    "keys": "pattern+vol+vwap",
    "train": {
     "n": 275,
     "avgR": 0.11,
     "winPct": 44
    },
    "unseen": {
     "n": 124,
     "avgR": 0.08,
     "winPct": 47
    }
   },
   {
    "trade": "go AGAINST the strong move",
    "signs": "bullish engulfing + t-midday + fear-calm",
    "keys": "pattern+time+fear",
    "train": {
     "n": 161,
     "avgR": 0.16,
     "winPct": 49
    },
    "unseen": {
     "n": 65,
     "avgR": 0.11,
     "winPct": 52
    }
   },
   {
    "trade": "go WITH the strong move",
    "signs": "three black crows + t-afternoon + spy-flat",
    "keys": "pattern+time+mktGap",
    "train": {
     "n": 205,
     "avgR": 0.25,
     "winPct": 43
    },
    "unseen": {
     "n": 121,
     "avgR": 0.08,
     "winPct": 47
    }
   }
  ],
  "text": "Searched 12,226 formulas on strong 30-min moves (stop 0.4 x daily range, out after 30 min, costs included).\nStrong move alone, unseen days: going with it -0.07R avg (41% wins), against it -0.03R (44% wins), 6028 cases.\n1. go WITH the strong move when: t-midday + mkt-against-move + spy-flat\n   unseen: 0.52R avg, 44% wins, 71 cases | training: 0.12R, 53% wins, 219 cases\n2. go WITH the strong move when: no-indecision + t-midday + mkt-against-move\n   unseen: 0.33R avg, 43% wins, 98 cases | training: 0.16R, 55% wins, 302 cases\n3. go WITH the strong move when: t-midday + mkt-against-move + fear-calm\n   unseen: 0.34R avg, 40% wins, 89 cases | training: 0.1R, 53% wins, 245 cases\n4. go WITH the strong move when: vol-normal + t-midday + mkt-against-move\n   unseen: 0.41R avg, 33% wins, 61 cases | training: 0.16R, 53% wins, 166 cases\n5. go WITH the strong move when: vwap-with-move-far + t-midday + mkt-against-move\n   unseen: 0.42R avg, 40% wins, 58 cases | training: 0.15R, 54% wins, 207 cases\n6. go WITH the strong move when: t-midday + mkt-against-move\n   unseen: 0.3R avg, 42% wins, 101 cases | training: 0.15R, 54% wins, 309 cases\n7. go WITH the strong move when: t-midday + mkt-against-move + no-recent-news\n   unseen: 0.3R avg, 42% wins, 101 cases | training: 0.15R, 54% wins, 309 cases\n8. go WITH the strong move when: vwap-with-move-far + t-afternoon + with-sector\n   unseen: 0.12R avg, 51% wins, 228 cases | training: 0.11R, 44% wins, 422 cases\n9. go AGAINST the strong move when: bullish engulfing + t-midday\n   unseen: 0.18R avg, 54% wins, 76 cases | training: 0.14R, 49% wins, 179 cases\n10. go AGAINST the strong move when: bullish engulfing + t-midday + no-recent-news\n   unseen: 0.18R avg, 54% wins, 76 cases | training: 0.14R, 49% wins, 179 cases"
 },
 "at": "2026-11-23T23:31:33.893Z",
 "sessions": 444,
 "candidates": 6730,
 "firstDay": "2024-01-02",
 "lastDay": "2025-10-08",
 "trainSessions": 310,
 "testSessions": 134,
 "current": {
  "trades": 283,
  "totalR": -80.2,
  "avgR": -0.28,
  "winRatePct": 40,
  "avgWinR": 1.29,
  "avgLossR": 1.33
 },
 "learned": {
  "trades": 69,
  "totalR": -26.1,
  "avgR": -0.38,
  "winRatePct": 36,
  "avgWinR": 1.09,
  "avgLossR": 1.21
 },
 "adopted": false,
 "changes": [
  "picks 3 -> 1",
  "keepMinR 1 -> 0.5",
  "entryEnd 630 -> 600",
  "entryGate 0 -> 0.95",
  "newsExit true -> false"
 ],
 "whatPredictsWins": {
  "cat": {
   "none": {
    "trades": 4666,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   }
  },
  "gap": {
   "gap1-3%": {
    "trades": 1014,
    "avgR": -0.11,
    "winRate": 43,
    "weight": 1.11
   },
   "gap8%+": {
    "trades": 1239,
    "avgR": -0.35,
    "winRate": 36,
    "weight": 0.88
   },
   "gap<1%": {
    "trades": 1115,
    "avgR": -0.12,
    "winRate": 44,
    "weight": 1.1
   },
   "gap3-8%": {
    "trades": 1298,
    "avgR": -0.26,
    "winRate": 39,
    "weight": 0.96
   }
  },
  "gapDir": {
   "with-gap": {
    "trades": 2430,
    "avgR": -0.19,
    "winRate": 42,
    "weight": 1.02
   },
   "against-gap": {
    "trades": 2140,
    "avgR": -0.25,
    "winRate": 39,
    "weight": 0.97
   },
   "flat": {
    "trades": 96,
    "avgR": -0.16,
    "winRate": 45,
    "weight": 1.05
   }
  },
  "rvol": {
   "rvol4-8": {
    "trades": 2230,
    "avgR": -0.14,
    "winRate": 43,
    "weight": 1.08
   },
   "rvol2-4": {
    "trades": 468,
    "avgR": -0.12,
    "winRate": 46,
    "weight": 1.1
   },
   "rvol8+": {
    "trades": 1968,
    "avgR": -0.33,
    "winRate": 36,
    "weight": 0.9
   }
  },
  "orAtr": {
   "wide-range": {
    "trades": 3904,
    "avgR": -0.25,
    "winRate": 39,
    "weight": 0.97
   },
   "normal-range": {
    "trades": 595,
    "avgR": -0.06,
    "winRate": 47,
    "weight": 1.16
   },
   "tight-range": {
    "trades": 167,
    "avgR": -0.03,
    "winRate": 46,
    "weight": 1.18
   }
  },
  "market": {
   "against-market": {
    "trades": 2222,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 1
   },
   "with-market": {
    "trades": 2433,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   },
   "mkt-flat": {
    "trades": 11,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 0.99
   }
  },
  "side": {
   "short": {
    "trades": 2279,
    "avgR": -0.25,
    "winRate": 40,
    "weight": 0.97
   },
   "long": {
    "trades": 2387,
    "avgR": -0.18,
    "winRate": 41,
    "weight": 1.03
   }
  },
  "newsTone": {
   "none": {
    "trades": 4666,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   }
  },
  "comboNewsMarket": {
   "none+against-market": {
    "trades": 2222,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 1
   },
   "none+with-market": {
    "trades": 2433,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   },
   "none+mkt-flat": {
    "trades": 11,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 0.99
   }
  },
  "mktGap": {
   "spy-gap-down": {
    "trades": 544,
    "avgR": -0.1,
    "winRate": 45,
    "weight": 1.12
   },
   "spy-flat": {
    "trades": 3556,
    "avgR": -0.23,
    "winRate": 39,
    "weight": 0.98
   },
   "spy-gap-up": {
    "trades": 566,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 0.99
   }
  },
  "fear": {
   "fear-calm": {
    "trades": 4049,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   },
   "fear-rising": {
    "trades": 352,
    "avgR": -0.1,
    "winRate": 45,
    "weight": 1.11
   },
   "fear-falling": {
    "trades": 265,
    "avgR": -0.33,
    "winRate": 38,
    "weight": 0.9
   }
  },
  "regime": {
   "against-trend": {
    "trades": 2224,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 1
   },
   "with-trend": {
    "trades": 2442,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 1
   }
  },
  "sector": {
   "with-sector": {
    "trades": 2555,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.03
   },
   "against-sector": {
    "trades": 1771,
    "avgR": -0.28,
    "winRate": 39,
    "weight": 0.94
   },
   "sector-unknown": {
    "trades": 275,
    "avgR": -0.18,
    "winRate": 43,
    "weight": 1.04
   },
   "sector-flat": {
    "trades": 65,
    "avgR": 0.11,
    "winRate": 51,
    "weight": 1.27
   }
  },
  "buzz": {
   "buzz-unknown": {
    "trades": 4666,
    "avgR": -0.22,
    "winRate": 40,
    "weight": 1
   }
  },
  "comboSectorNews": {
   "with-sector+none": {
    "trades": 2555,
    "avgR": -0.19,
    "winRate": 41,
    "weight": 1.03
   },
   "against-sector+none": {
    "trades": 1771,
    "avgR": -0.28,
    "winRate": 39,
    "weight": 0.94
   },
   "sector-unknown+none": {
    "trades": 275,
    "avgR": -0.18,
    "winRate": 43,
    "weight": 1.04
   },
   "sector-flat+none": {
    "trades": 65,
    "avgR": 0.11,
    "winRate": 51,
    "weight": 1.27
   }
  },
  "comboFearSide": {
   "fear-calm+short": {
    "trades": 1961,
    "avgR": -0.27,
    "winRate": 39,
    "weight": 0.95
   },
   "fear-calm+long": {
    "trades": 2088,
    "avgR": -0.17,
    "winRate": 41,
    "weight": 1.04
   },
   "fear-rising+short": {
    "trades": 185,
    "avgR": -0.01,
    "winRate": 48,
    "weight": 1.2
   },
   "fear-rising+long": {
    "trades": 167,
    "avgR": -0.2,
    "winRate": 41,
    "weight": 1.01
   },
   "fear-falling+long": {
    "trades": 132,
    "avgR": -0.3,
    "winRate": 40,
    "weight": 0.93
   },
   "fear-falling+short": {
    "trades": 133,
    "avgR": -0.36,
    "winRate": 35,
    "weight": 0.89
   }
  },
  "chart:candle": {
   "candle-none": {
    "trades": 3583,
    "avgR": -0.21,
    "winRate": 40,
    "weight": 1.01
   },
   "candle-mild": {
    "trades": 253,
    "avgR": -0.16,
    "winRate": 44,
    "weight": 1.05
   },
   "candle-against": {
    "trades": 156,
    "avgR": -0.38,
    "winRate": 35,
    "weight": 0.87
   },
   "candle-with": {
    "trades": 674,
    "avgR": -0.26,
    "winRate": 40,
    "weight": 0.96
   }
  },
  "chart:volume": {
   "vol-weak": {
    "trades": 3381,
    "avgR": -0.24,
    "winRate": 40,
    "weight": 0.98
   },
   "vol-normal": {
    "trades": 924,
    "avgR": -0.15,
    "winRate": 42,
    "weight": 1.07
   },
   "vol-strong": {
    "trades": 361,
    "avgR": -0.17,
    "winRate": 39,
    "weight": 1.05
   }
  },
  "chart:vwap": {
   "vwap-with": {
    "trades": 4529,
    "avgR": -0.21,
    "winRate": 41,
    "weight": 1.01
   },
   "vwap-against": {
    "trades": 137,
    "avgR": -0.55,
    "winRate": 31,
    "weight": 0.75
   }
  },
  "chart:structure": {
   "range": {
    "trades": 4304,
    "avgR": -0.23,
    "winRate": 40,
    "weight": 0.99
   },
   "trend-with": {
    "trades": 353,
    "avgR": -0.05,
    "winRate": 46,
    "weight": 1.17
   },
   "trend-against": {
    "trades": 9,
    "avgR": -0.7,
    "winRate": 22,
    "weight": 0.88
   }
  },
  "chart:extension": {
   "ext-normal": {
    "trades": 3914,
    "avgR": -0.22,
    "winRate": 41,
    "weight": 1
   },
   "ext-moderate": {
    "trades": 662,
    "avgR": -0.21,
    "winRate": 38,
    "weight": 1.01
   },
   "ext-stretched": {
    "trades": 90,
    "avgR": -0.39,
    "winRate": 31,
    "weight": 0.88
   }
  },
  "chart:timing": {
   "early": {
    "trades": 4081,
    "avgR": -0.24,
    "winRate": 40,
    "weight": 0.98
   },
   "mid": {
    "trades": 517,
    "avgR": -0.09,
    "winRate": 45,
    "weight": 1.13
   },
   "late": {
    "trades": 68,
    "avgR": 0.01,
    "winRate": 43,
    "weight": 1.18
   }
  },
  "chart:comboCandleVol": {
   "candle-none+vol-weak": {
    "trades": 2588,
    "avgR": -0.23,
    "winRate": 40,
    "weight": 0.98
   },
   "candle-none+vol-normal": {
    "trades": 669,
    "avgR": -0.13,
    "winRate": 41,
    "weight": 1.09
   },
   "candle-mild+vol-weak": {
    "trades": 191,
    "avgR": -0.24,
    "winRate": 42,
    "weight": 0.98
   },
   "candle-none+vol-strong": {
    "trades": 326,
    "avgR": -0.16,
    "winRate": 39,
    "weight": 1.05
   },
   "candle-against+vol-normal": {
    "trades": 33,
    "avgR": -0.56,
    "winRate": 27,
    "weight": 0.82
   },
   "candle-mild+vol-normal": {
    "trades": 54,
    "avgR": 0.11,
    "winRate": 50,
    "weight": 1.25
   },
   "candle-with+vol-weak": {
    "trades": 484,
    "avgR": -0.28,
    "winRate": 39,
    "weight": 0.94
   },
   "candle-against+vol-weak": {
    "trades": 118,
    "avgR": -0.3,
    "winRate": 38,
    "weight": 0.93
   },
   "candle-with+vol-normal": {
    "trades": 168,
    "avgR": -0.23,
    "winRate": 45,
    "weight": 0.99
   },
   "candle-mild+vol-strong": {
    "trades": 8,
    "avgR": -0.2,
    "winRate": 38,
    "weight": 1
   },
   "candle-with+vol-strong": {
    "trades": 22,
    "avgR": -0.09,
    "winRate": 41,
    "weight": 1.06
   },
   "candle-against+vol-strong": {
    "trades": 5,
    "avgR": -0.87,
    "winRate": 20,
    "weight": 0.9
   }
  },
  "outcome:exit": {
   "11": {
    "trades": 191,
    "avgR": 0.14,
    "winRate": 57,
    "weight": 1.37
   },
   "trailing stop": {
    "trades": 1887,
    "avgR": 1.11,
    "winRate": 93,
    "weight": 1.6
   },
   "stop": {
    "trades": 1720,
    "avgR": -1.05,
    "winRate": 0,
    "weight": 0.5
   },
   "stopped on the entry candle": {
    "trades": 861,
    "avgR": -1.55,
    "winRate": 0,
    "weight": 0.5
   },
   "closed 15": {
    "trades": 4,
    "avgR": 2.66,
    "winRate": 100,
    "weight": 1.49
   },
   "closed through VWAP": {
    "trades": 3,
    "avgR": 0.61,
    "winRate": 100,
    "weight": 1.09
   }
  }
 },
 "version": 1
}
```
