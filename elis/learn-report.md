# Elis learning report

2026-11-23T20:12:02.351Z

Kept current settings (444 sessions, tested on the last 134 it did not learn from).
Unseen days: win rate 40% -> 36%, avg -0.28R -> -0.38R, avg win 1.29R -> 1.09R.
Changes: picks 3 -> 1, keepMinR 1 -> 0.5, entryEnd 630 -> 600, entryGate 0 -> 0.95, newsExit true -> false.
Best info: gap1-3% -0.11R, gap<1% -0.12R, rvol2-4 -0.12R, normal-range -0.06R.
Weakest: gap8%+ -0.35R, rvol8+ -0.33R, fear-falling -0.33R, fear-falling+short -0.36R.

If Elis had started with $3,000 on 2024-01-02 (to 2025-10-08):
BEFORE (current settings): $3,000 -> $1,691 (-43.6%), max drawdown 46.9%, 532 trades, 34% wins, avg win $13 / avg loss $10, 16/22 red months
AFTER (learned settings): $3,000 -> $1,956 (-34.8%), max drawdown 37.1%, 225 trades, 40% wins, avg win $33 / avg loss $30, 15/22 red months
Honest check, only the 134 sessions the learner never saw (2025-03-28 to 2025-10-08), $3,000 start:
BEFORE: $3,000 -> $2,097 (-30.1%), max drawdown 35.1%, 283 trades, 40% wins, avg win $20 / avg loss $19, 6/8 red months
AFTER: $3,000 -> $2,299 (-23.4%), max drawdown 26.1%, 69 trades, 36% wins, avg win $27 / avg loss $31, 7/8 red months

## Experiments

Experiments on the 134 unseen sessions (current: 283 trades, 40% wins, avg -0.28R, total -80.2R):
- study rules (hold to close, 10% ATR stop), top 3, entries to 11:00: 294 trades, 8% wins, avg -0.47R, total -138.6R
- study rules, top 5, entries to 11:00: 482 trades, 8% wins, avg -0.48R, total -232.9R
- study rules, top 3, entries all day: 307 trades, 7% wins, avg -0.51R, total -157R
- study rules + sell on bad news, top 3: 294 trades, 8% wins, avg -0.47R, total -138.6R
- Elis exits, but 10% ATR stop: 283 trades, 27% wins, avg -0.94R, total -264.6R

## QQQ strategy history

{"sessions":400,"trades":331,"winRatePct":29.6,"totalR":-49.44,"profitFactor":0.79,"returnPct":-40.8,"maxDrawdownPct":-55.2}

## Proposals

No new rule or process beat the current setup on the unseen days, so nothing to change.

```json
{
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
  }
 ],
 "at": "2026-11-23T20:11:54.201Z",
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
