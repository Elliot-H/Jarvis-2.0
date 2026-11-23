# Elis learning report

2026-11-23T19:33:25.689Z

Kept current settings (444 sessions, tested on the last 134 it did not learn from).
Unseen days: win rate 36% -> 27%, avg -0.21R -> -0.43R, avg win 1.26R -> 1.02R.
Changes: picks 3 -> 1, keepMinR 1 -> 0.5, entryEnd 630 -> 600, entryGate 0 -> 0.95, newsExit true -> false.
Best info: gap<1% -0.14R, normal-range -0.09R, tight-range -0.04R, spy-gap-down -0.08R.
Weakest: fear-falling+short -0.4R, ext-stretched -0.48R, candle-against+vol-normal -0.55R.

If Elis had started with $3,000 on 2024-01-02 (to 2025-10-08):
BEFORE (current settings): $3,000 -> $1,717 (-42.8%), max drawdown 45.6%, 498 trades, 29% wins, avg win $12 / avg loss $8, 16/22 red months
AFTER (learned settings): $3,000 -> $1,724 (-42.5%), max drawdown 44.5%, 200 trades, 30% wins, avg win $27 / avg loss $21, 17/22 red months
Honest check, only the 134 sessions the learner never saw (2025-03-28 to 2025-10-08), $3,000 start:
BEFORE: $3,000 -> $2,208 (-26.4%), max drawdown 30.6%, 283 trades, 36% wins, avg win $19 / avg loss $15, 6/8 red months
AFTER: $3,000 -> $2,159 (-28%), max drawdown 31.5%, 77 trades, 27% wins, avg win $26 / avg loss $25, 6/8 red months

## Proposals

No new rule or process beat the current setup on the unseen days, so nothing to change.

```json
{
 "money": {
  "before": {
   "from": "2024-01-02",
   "to": "2025-10-08",
   "start": 3000,
   "end": 1717,
   "returnPct": -42.8,
   "maxDrawdownPct": 45.6,
   "trades": 498,
   "winRatePct": 29,
   "avgWinUsd": 12,
   "avgLossUsd": 8,
   "bestDay": {
    "day": "2024-08-08",
    "usd": 104
   },
   "worstDay": {
    "day": "2024-01-10",
    "usd": -64
   },
   "redMonths": 16,
   "months": 22,
   "worstMonth": {
    "m": "2024-04",
    "end": 2189,
    "pct": -11.6
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 2831,
     "pct": -5.6
    },
    {
     "m": "2024-02",
     "end": 2718,
     "pct": -4
    },
    {
     "m": "2024-03",
     "end": 2477,
     "pct": -8.9
    },
    {
     "m": "2024-04",
     "end": 2189,
     "pct": -11.6
    },
    {
     "m": "2024-05",
     "end": 1989,
     "pct": -9.1
    },
    {
     "m": "2024-06",
     "end": 1958,
     "pct": -1.6
    },
    {
     "m": "2024-07",
     "end": 1956,
     "pct": -0.1
    },
    {
     "m": "2024-08",
     "end": 1964,
     "pct": 0.4
    },
    {
     "m": "2024-09",
     "end": 1969,
     "pct": 0.3
    },
    {
     "m": "2024-10",
     "end": 1943,
     "pct": -1.3
    },
    {
     "m": "2024-11",
     "end": 1948,
     "pct": 0.3
    },
    {
     "m": "2024-12",
     "end": 1926,
     "pct": -1.1
    },
    {
     "m": "2025-01",
     "end": 1894,
     "pct": -1.7
    },
    {
     "m": "2025-02",
     "end": 1939,
     "pct": 2.4
    },
    {
     "m": "2025-03",
     "end": 1968,
     "pct": 1.5
    },
    {
     "m": "2025-04",
     "end": 1963,
     "pct": -0.3
    },
    {
     "m": "2025-05",
     "end": 1856,
     "pct": -5.5
    },
    {
     "m": "2025-06",
     "end": 1790,
     "pct": -3.6
    },
    {
     "m": "2025-07",
     "end": 1788,
     "pct": -0.1
    },
    {
     "m": "2025-08",
     "end": 1834,
     "pct": 2.6
    },
    {
     "m": "2025-09",
     "end": 1759,
     "pct": -4.1
    },
    {
     "m": "2025-10",
     "end": 1717,
     "pct": -2.4
    }
   ]
  },
  "after": {
   "from": "2024-01-02",
   "to": "2025-10-08",
   "start": 3000,
   "end": 1724,
   "returnPct": -42.5,
   "maxDrawdownPct": 44.5,
   "trades": 200,
   "winRatePct": 30,
   "avgWinUsd": 27,
   "avgLossUsd": 21,
   "bestDay": {
    "day": "2024-08-08",
    "usd": 190
   },
   "worstDay": {
    "day": "2024-01-23",
    "usd": -43
   },
   "redMonths": 17,
   "months": 22,
   "worstMonth": {
    "m": "2024-04",
    "end": 2435,
    "pct": -9.6
   },
   "monthly": [
    {
     "m": "2024-01",
     "end": 2967,
     "pct": -1.1
    },
    {
     "m": "2024-02",
     "end": 2869,
     "pct": -3.3
    },
    {
     "m": "2024-03",
     "end": 2693,
     "pct": -6.1
    },
    {
     "m": "2024-04",
     "end": 2435,
     "pct": -9.6
    },
    {
     "m": "2024-05",
     "end": 2314,
     "pct": -5
    },
    {
     "m": "2024-06",
     "end": 2290,
     "pct": -1
    },
    {
     "m": "2024-07",
     "end": 2155,
     "pct": -5.9
    },
    {
     "m": "2024-08",
     "end": 2231,
     "pct": 3.5
    },
    {
     "m": "2024-09",
     "end": 2122,
     "pct": -4.9
    },
    {
     "m": "2024-10",
     "end": 2051,
     "pct": -3.3
    },
    {
     "m": "2024-11",
     "end": 1989,
     "pct": -3
    },
    {
     "m": "2024-12",
     "end": 1990,
     "pct": 0.1
    },
    {
     "m": "2025-01",
     "end": 1985,
     "pct": -0.3
    },
    {
     "m": "2025-02",
     "end": 2031,
     "pct": 2.3
    },
    {
     "m": "2025-03",
     "end": 2123,
     "pct": 4.5
    },
    {
     "m": "2025-04",
     "end": 2178,
     "pct": 2.6
    },
    {
     "m": "2025-05",
     "end": 2002,
     "pct": -8.1
    },
    {
     "m": "2025-06",
     "end": 1926,
     "pct": -3.8
    },
    {
     "m": "2025-07",
     "end": 1893,
     "pct": -1.7
    },
    {
     "m": "2025-08",
     "end": 1847,
     "pct": -2.4
    },
    {
     "m": "2025-09",
     "end": 1762,
     "pct": -4.6
    },
    {
     "m": "2025-10",
     "end": 1724,
     "pct": -2.2
    }
   ]
  },
  "unseenBefore": {
   "from": "2025-03-28",
   "to": "2025-10-08",
   "start": 3000,
   "end": 2208,
   "returnPct": -26.4,
   "maxDrawdownPct": 30.6,
   "trades": 283,
   "winRatePct": 36,
   "avgWinUsd": 19,
   "avgLossUsd": 15,
   "bestDay": {
    "day": "2025-07-07",
    "usd": 144
   },
   "worstDay": {
    "day": "2025-04-17",
    "usd": -66
   },
   "redMonths": 6,
   "months": 8,
   "worstMonth": {
    "m": "2025-05",
    "end": 2642,
    "pct": -8
   },
   "monthly": [
    {
     "m": "2025-03",
     "end": 3107,
     "pct": 3.6
    },
    {
     "m": "2025-04",
     "end": 2872,
     "pct": -7.6
    },
    {
     "m": "2025-05",
     "end": 2642,
     "pct": -8
    },
    {
     "m": "2025-06",
     "end": 2443,
     "pct": -7.5
    },
    {
     "m": "2025-07",
     "end": 2387,
     "pct": -2.3
    },
    {
     "m": "2025-08",
     "end": 2393,
     "pct": 0.3
    },
    {
     "m": "2025-09",
     "end": 2214,
     "pct": -7.5
    },
    {
     "m": "2025-10",
     "end": 2208,
     "pct": -0.3
    }
   ]
  },
  "unseenAfter": {
   "from": "2025-03-28",
   "to": "2025-10-08",
   "start": 3000,
   "end": 2159,
   "returnPct": -28,
   "maxDrawdownPct": 31.5,
   "trades": 77,
   "winRatePct": 27,
   "avgWinUsd": 26,
   "avgLossUsd": 25,
   "bestDay": {
    "day": "2025-04-03",
    "usd": 114
   },
   "worstDay": {
    "day": "2025-04-09",
    "usd": -37
   },
   "redMonths": 6,
   "months": 8,
   "worstMonth": {
    "m": "2025-09",
    "end": 2207,
    "pct": -8.7
   },
   "monthly": [
    {
     "m": "2025-03",
     "end": 3045,
     "pct": 1.5
    },
    {
     "m": "2025-04",
     "end": 3125,
     "pct": 2.6
    },
    {
     "m": "2025-05",
     "end": 2871,
     "pct": -8.1
    },
    {
     "m": "2025-06",
     "end": 2673,
     "pct": -6.9
    },
    {
     "m": "2025-07",
     "end": 2494,
     "pct": -6.7
    },
    {
     "m": "2025-08",
     "end": 2416,
     "pct": -3.1
    },
    {
     "m": "2025-09",
     "end": 2207,
     "pct": -8.7
    },
    {
     "m": "2025-10",
     "end": 2159,
     "pct": -2.2
    }
   ]
  }
 },
 "proposals": [],
 "gaps": [],
 "at": "2026-11-23T19:33:25.332Z",
 "sessions": 444,
 "candidates": 6730,
 "firstDay": "2024-01-02",
 "lastDay": "2025-10-08",
 "trainSessions": 310,
 "testSessions": 134,
 "current": {
  "trades": 283,
  "totalR": -58.8,
  "avgR": -0.21,
  "winRatePct": 36,
  "avgWinR": 1.26,
  "avgLossR": 1.02
 },
 "learned": {
  "trades": 77,
  "totalR": -33.3,
  "avgR": -0.43,
  "winRatePct": 27,
  "avgWinR": 1.02,
  "avgLossR": 0.98
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
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   }
  },
  "gap": {
   "gap1-3%": {
    "trades": 1014,
    "avgR": -0.17,
    "winRate": 39,
    "weight": 1.06
   },
   "gap8%+": {
    "trades": 1239,
    "avgR": -0.31,
    "winRate": 30,
    "weight": 0.93
   },
   "gap<1%": {
    "trades": 1115,
    "avgR": -0.14,
    "winRate": 42,
    "weight": 1.1
   },
   "gap3-8%": {
    "trades": 1298,
    "avgR": -0.29,
    "winRate": 34,
    "weight": 0.94
   }
  },
  "gapDir": {
   "with-gap": {
    "trades": 2430,
    "avgR": -0.23,
    "winRate": 37,
    "weight": 1.01
   },
   "against-gap": {
    "trades": 2140,
    "avgR": -0.25,
    "winRate": 35,
    "weight": 0.99
   },
   "flat": {
    "trades": 96,
    "avgR": -0.17,
    "winRate": 43,
    "weight": 1.05
   }
  },
  "rvol": {
   "rvol4-8": {
    "trades": 2230,
    "avgR": -0.19,
    "winRate": 39,
    "weight": 1.05
   },
   "rvol2-4": {
    "trades": 468,
    "avgR": -0.17,
    "winRate": 44,
    "weight": 1.06
   },
   "rvol8+": {
    "trades": 1968,
    "avgR": -0.3,
    "winRate": 31,
    "weight": 0.93
   }
  },
  "orAtr": {
   "wide-range": {
    "trades": 3904,
    "avgR": -0.26,
    "winRate": 34,
    "weight": 0.97
   },
   "normal-range": {
    "trades": 595,
    "avgR": -0.09,
    "winRate": 46,
    "weight": 1.15
   },
   "tight-range": {
    "trades": 167,
    "avgR": -0.04,
    "winRate": 46,
    "weight": 1.19
   }
  },
  "market": {
   "against-market": {
    "trades": 2222,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 0.99
   },
   "with-market": {
    "trades": 2433,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1.01
   },
   "mkt-flat": {
    "trades": 11,
    "avgR": -0.25,
    "winRate": 36,
    "weight": 1
   }
  },
  "side": {
   "short": {
    "trades": 2279,
    "avgR": -0.26,
    "winRate": 36,
    "weight": 0.97
   },
   "long": {
    "trades": 2387,
    "avgR": -0.2,
    "winRate": 36,
    "weight": 1.03
   }
  },
  "newsTone": {
   "none": {
    "trades": 4666,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   }
  },
  "comboNewsMarket": {
   "none+against-market": {
    "trades": 2222,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 0.99
   },
   "none+with-market": {
    "trades": 2433,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1.01
   },
   "none+mkt-flat": {
    "trades": 11,
    "avgR": -0.25,
    "winRate": 36,
    "weight": 1
   }
  },
  "mktGap": {
   "spy-gap-down": {
    "trades": 544,
    "avgR": -0.08,
    "winRate": 42,
    "weight": 1.16
   },
   "spy-flat": {
    "trades": 3556,
    "avgR": -0.26,
    "winRate": 35,
    "weight": 0.98
   },
   "spy-gap-up": {
    "trades": 566,
    "avgR": -0.25,
    "winRate": 36,
    "weight": 0.98
   }
  },
  "fear": {
   "fear-calm": {
    "trades": 4049,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 1
   },
   "fear-rising": {
    "trades": 352,
    "avgR": -0.1,
    "winRate": 41,
    "weight": 1.14
   },
   "fear-falling": {
    "trades": 265,
    "avgR": -0.34,
    "winRate": 34,
    "weight": 0.91
   }
  },
  "regime": {
   "against-trend": {
    "trades": 2224,
    "avgR": -0.24,
    "winRate": 36,
    "weight": 1
   },
   "with-trend": {
    "trades": 2442,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   }
  },
  "sector": {
   "with-sector": {
    "trades": 2555,
    "avgR": -0.22,
    "winRate": 36,
    "weight": 1.02
   },
   "against-sector": {
    "trades": 1771,
    "avgR": -0.27,
    "winRate": 35,
    "weight": 0.96
   },
   "sector-unknown": {
    "trades": 275,
    "avgR": -0.22,
    "winRate": 37,
    "weight": 1.02
   },
   "sector-flat": {
    "trades": 65,
    "avgR": 0.09,
    "winRate": 49,
    "weight": 1.26
   }
  },
  "buzz": {
   "buzz-unknown": {
    "trades": 4666,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   }
  },
  "comboSectorNews": {
   "with-sector+none": {
    "trades": 2555,
    "avgR": -0.22,
    "winRate": 36,
    "weight": 1.02
   },
   "against-sector+none": {
    "trades": 1771,
    "avgR": -0.27,
    "winRate": 35,
    "weight": 0.96
   },
   "sector-unknown+none": {
    "trades": 275,
    "avgR": -0.22,
    "winRate": 37,
    "weight": 1.02
   },
   "sector-flat+none": {
    "trades": 65,
    "avgR": 0.09,
    "winRate": 49,
    "weight": 1.26
   }
  },
  "comboFearSide": {
   "fear-calm+short": {
    "trades": 1961,
    "avgR": -0.28,
    "winRate": 35,
    "weight": 0.96
   },
   "fear-calm+long": {
    "trades": 2088,
    "avgR": -0.2,
    "winRate": 36,
    "weight": 1.03
   },
   "fear-rising+short": {
    "trades": 185,
    "avgR": -0.03,
    "winRate": 45,
    "weight": 1.2
   },
   "fear-rising+long": {
    "trades": 167,
    "avgR": -0.18,
    "winRate": 37,
    "weight": 1.05
   },
   "fear-falling+long": {
    "trades": 132,
    "avgR": -0.28,
    "winRate": 37,
    "weight": 0.96
   },
   "fear-falling+short": {
    "trades": 133,
    "avgR": -0.4,
    "winRate": 31,
    "weight": 0.87
   }
  },
  "chart:candle": {
   "candle-none": {
    "trades": 3583,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   },
   "candle-mild": {
    "trades": 253,
    "avgR": -0.15,
    "winRate": 41,
    "weight": 1.08
   },
   "candle-against": {
    "trades": 156,
    "avgR": -0.34,
    "winRate": 31,
    "weight": 0.91
   },
   "candle-with": {
    "trades": 674,
    "avgR": -0.25,
    "winRate": 38,
    "weight": 0.98
   }
  },
  "chart:volume": {
   "vol-weak": {
    "trades": 3381,
    "avgR": -0.25,
    "winRate": 36,
    "weight": 0.98
   },
   "vol-normal": {
    "trades": 924,
    "avgR": -0.19,
    "winRate": 37,
    "weight": 1.04
   },
   "vol-strong": {
    "trades": 361,
    "avgR": -0.17,
    "winRate": 35,
    "weight": 1.06
   }
  },
  "chart:vwap": {
   "vwap-with": {
    "trades": 4529,
    "avgR": -0.23,
    "winRate": 36,
    "weight": 1
   },
   "vwap-against": {
    "trades": 137,
    "avgR": -0.33,
    "winRate": 28,
    "weight": 0.92
   }
  },
  "chart:structure": {
   "range": {
    "trades": 4304,
    "avgR": -0.25,
    "winRate": 35,
    "weight": 0.99
   },
   "trend-with": {
    "trades": 353,
    "avgR": -0.04,
    "winRate": 46,
    "weight": 1.2
   },
   "trend-against": {
    "trades": 9,
    "avgR": -0.92,
    "winRate": 11,
    "weight": 0.83
   }
  },
  "chart:extension": {
   "ext-normal": {
    "trades": 3914,
    "avgR": -0.22,
    "winRate": 37,
    "weight": 1.01
   },
   "ext-moderate": {
    "trades": 662,
    "avgR": -0.29,
    "winRate": 31,
    "weight": 0.95
   },
   "ext-stretched": {
    "trades": 90,
    "avgR": -0.48,
    "winRate": 20,
    "weight": 0.82
   }
  },
  "chart:timing": {
   "early": {
    "trades": 4081,
    "avgR": -0.26,
    "winRate": 35,
    "weight": 0.98
   },
   "mid": {
    "trades": 517,
    "avgR": -0.08,
    "winRate": 44,
    "weight": 1.16
   },
   "late": {
    "trades": 68,
    "avgR": 0.04,
    "winRate": 43,
    "weight": 1.23
   }
  },
  "chart:comboCandleVol": {
   "candle-none+vol-weak": {
    "trades": 2588,
    "avgR": -0.25,
    "winRate": 36,
    "weight": 0.99
   },
   "candle-none+vol-normal": {
    "trades": 669,
    "avgR": -0.2,
    "winRate": 35,
    "weight": 1.04
   },
   "candle-mild+vol-weak": {
    "trades": 191,
    "avgR": -0.25,
    "winRate": 39,
    "weight": 0.99
   },
   "candle-none+vol-strong": {
    "trades": 326,
    "avgR": -0.16,
    "winRate": 35,
    "weight": 1.07
   },
   "candle-against+vol-normal": {
    "trades": 33,
    "avgR": -0.55,
    "winRate": 21,
    "weight": 0.84
   },
   "candle-mild+vol-normal": {
    "trades": 54,
    "avgR": 0.19,
    "winRate": 50,
    "weight": 1.34
   },
   "candle-with+vol-weak": {
    "trades": 484,
    "avgR": -0.27,
    "winRate": 36,
    "weight": 0.97
   },
   "candle-against+vol-weak": {
    "trades": 118,
    "avgR": -0.26,
    "winRate": 35,
    "weight": 0.98
   },
   "candle-with+vol-normal": {
    "trades": 168,
    "avgR": -0.22,
    "winRate": 43,
    "weight": 1.01
   },
   "candle-mild+vol-strong": {
    "trades": 8,
    "avgR": -0.15,
    "winRate": 38,
    "weight": 1.02
   },
   "candle-with+vol-strong": {
    "trades": 22,
    "avgR": -0.18,
    "winRate": 36,
    "weight": 1.02
   },
   "candle-against+vol-strong": {
    "trades": 5,
    "avgR": -0.79,
    "winRate": 20,
    "weight": 0.91
   }
  },
  "outcome:exit": {
   "11": {
    "trades": 190,
    "avgR": 0.14,
    "winRate": 56,
    "weight": 1.39
   },
   "trailing stop": {
    "trades": 1674,
    "avgR": 1.1,
    "winRate": 94,
    "weight": 1.6
   },
   "stop": {
    "trades": 1468,
    "avgR": -1.05,
    "winRate": 0,
    "weight": 0.5
   },
   "stopped on the entry candle": {
    "trades": 1327,
    "avgR": -1.08,
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
    "weight": 1.1
   }
  }
 },
 "version": 1
}
```
