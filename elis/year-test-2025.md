# Elis year test 2025

Out-of-sample year 2025 (250 sessions, formulas found on 2024-2025, never on 2025). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 211 trades, 45% wins, avg 0.09R, total 18.9R -> $3,000 became $3,355 (+11.8%, max drawdown 10.7%)
- midday, against the market, S&P flat at the open -> go with the stock: 128 trades, 45% wins, avg 0.14R, total 18.4R -> $3,000 became $3,299 (+10%, max drawdown 9.2%)
- midday, against the market, normal volume -> go with the stock: 137 trades, 40% wins, avg 0R, total 0.6R -> $3,000 became $3,070 (+2.3%, max drawdown 15%)
- afternoon, far from VWAP in the move direction -> go with the stock: 448 trades, 49% wins, avg 0.07R, total 29.7R -> $3,000 became $3,290 (+9.7%, max drawdown 23.2%)
- strong move alone (control) -> go with the stock: 3484 trades, 44% wins, avg -0.05R, total -181.6R -> $3,000 became $1,684 (-43.9%, max drawdown 45.6%)

```json
{
 "year": "2025",
 "sessions": 250,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 211,
   "winPct": 45,
   "avgR": 0.09,
   "totalR": 18.9,
   "money3k": {
    "start": 3000,
    "end": 3355,
    "returnPct": 11.8,
    "maxDrawdownPct": 10.7
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 128,
   "winPct": 45,
   "avgR": 0.14,
   "totalR": 18.4,
   "money3k": {
    "start": 3000,
    "end": 3299,
    "returnPct": 10,
    "maxDrawdownPct": 9.2
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 137,
   "winPct": 40,
   "avgR": 0,
   "totalR": 0.6,
   "money3k": {
    "start": 3000,
    "end": 3070,
    "returnPct": 2.3,
    "maxDrawdownPct": 15
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 448,
   "winPct": 49,
   "avgR": 0.07,
   "totalR": 29.7,
   "money3k": {
    "start": 3000,
    "end": 3290,
    "returnPct": 9.7,
    "maxDrawdownPct": 23.2
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 3484,
   "winPct": 44,
   "avgR": -0.05,
   "totalR": -181.6,
   "money3k": {
    "start": 3000,
    "end": 1684,
    "returnPct": -43.9,
    "maxDrawdownPct": 45.6
   }
  }
 },
 "trades": 4408,
 "why": {
  "n": 3484,
  "overall": -0.05,
  "findings": [
   {
    "dim": "month",
    "value": "2025-04",
    "n": 218,
    "avgR": 0.12,
    "winPct": 50,
    "z": 2.51,
    "better": true
   },
   {
    "dim": "candle read",
    "value": "candle-mild",
    "n": 469,
    "avgR": 0.06,
    "winPct": 44,
    "z": 2.4,
    "better": true
   },
   {
    "dim": "stock volatility",
    "value": "jumpy stock",
    "n": 540,
    "avgR": -0.15,
    "winPct": 39,
    "z": -2.25,
    "better": false
   },
   {
    "dim": "size of the 30-min move",
    "value": "1.2x+ range",
    "n": 442,
    "avgR": -0.16,
    "winPct": 37,
    "z": -2.24,
    "better": false
   },
   {
    "dim": "stock opening gap",
    "value": "no gap",
    "n": 553,
    "avgR": 0.04,
    "winPct": 48,
    "z": 2.14,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 863,
     "avgR": -0.07,
     "winPct": 43
    },
    "market uptrend": {
     "n": 2621,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "market volatility": {
    "normal market (12-18%)": {
     "n": 1392,
     "avgR": -0.06,
     "winPct": 44
    },
    "calm market (<12%)": {
     "n": 1588,
     "avgR": -0.06,
     "winPct": 43
    },
    "nervous market (18-28%)": {
     "n": 263,
     "avgR": -0.02,
     "winPct": 43
    },
    "panicky market (28%+)": {
     "n": 241,
     "avgR": 0.02,
     "winPct": 50
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 807,
     "avgR": -0.12,
     "winPct": 42
    },
    "S&P flat": {
     "n": 1636,
     "avgR": -0.03,
     "winPct": 44
    },
    "S&P gapped down": {
     "n": 404,
     "avgR": -0.05,
     "winPct": 42
    },
    "S&P gapped down hard": {
     "n": 369,
     "avgR": 0.02,
     "winPct": 49
    },
    "S&P gapped up hard": {
     "n": 268,
     "avgR": -0.14,
     "winPct": 42
    }
   },
   "time of day": {
    "first hour": {
     "n": 2662,
     "avgR": -0.05,
     "winPct": 43
    },
    "11:30-1:00": {
     "n": 154,
     "avgR": -0.07,
     "winPct": 44
    },
    "10:30-11:30": {
     "n": 540,
     "avgR": -0.06,
     "winPct": 45
    },
    "last 90 min": {
     "n": 38,
     "avgR": 0.03,
     "winPct": 50
    },
    "1:00-2:30": {
     "n": 90,
     "avgR": -0.02,
     "winPct": 41
    }
   },
   "side": {
    "long": {
     "n": 1776,
     "avgR": -0.05,
     "winPct": 45
    },
    "short": {
     "n": 1708,
     "avgR": -0.05,
     "winPct": 42
    }
   },
   "moving against the market": {
    "no": {
     "n": 2920,
     "avgR": -0.06,
     "winPct": 43
    },
    "yes": {
     "n": 564,
     "avgR": 0,
     "winPct": 46
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 1484,
     "avgR": -0.06,
     "winPct": 44
    },
    "surging": {
     "n": 120,
     "avgR": 0.07,
     "winPct": 48
    },
    "normal": {
     "n": 1466,
     "avgR": -0.02,
     "winPct": 44
    },
    "rising": {
     "n": 414,
     "avgR": -0.15,
     "winPct": 39
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 1717,
     "avgR": -0.01,
     "winPct": 46
    },
    "with the move, far": {
     "n": 1713,
     "avgR": -0.09,
     "winPct": 42
    },
    "against the move": {
     "n": 53,
     "avgR": -0.02,
     "winPct": 38
    },
    "against the move, far": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 988,
     "avgR": -0.01,
     "winPct": 45
    },
    "1.2x+ range": {
     "n": 442,
     "avgR": -0.16,
     "winPct": 37
    },
    "0.6-0.8x range": {
     "n": 2054,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "stock opening gap": {
    "gap up 4%+": {
     "n": 1102,
     "avgR": -0.11,
     "winPct": 40
    },
    "no gap": {
     "n": 553,
     "avgR": 0.04,
     "winPct": 48
    },
    "gap up 1-4%": {
     "n": 582,
     "avgR": -0.07,
     "winPct": 44
    },
    "gap down 1-4%": {
     "n": 457,
     "avgR": 0.03,
     "winPct": 48
    },
    "gap down 4%+": {
     "n": 790,
     "avgR": -0.07,
     "winPct": 42
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 1630,
     "avgR": -0.05,
     "winPct": 44
    },
    "2-4x": {
     "n": 597,
     "avgR": 0.01,
     "winPct": 49
    },
    "8x+": {
     "n": 1255,
     "avgR": -0.08,
     "winPct": 40
    },
    "1-2x normal": {
     "n": 2,
     "avgR": 0.01,
     "winPct": 50
    }
   },
   "stock volatility": {
    "jumpy stock": {
     "n": 540,
     "avgR": -0.15,
     "winPct": 39
    },
    "normal stock": {
     "n": 1501,
     "avgR": -0.04,
     "winPct": 45
    },
    "calm stock": {
     "n": 1314,
     "avgR": -0.01,
     "winPct": 45
    },
    "very jumpy stock": {
     "n": 129,
     "avgR": -0.17,
     "winPct": 36
    }
   },
   "news in the last hour": {
    "none": {
     "n": 3484,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 3484,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "overnight news": {
    "none": {
     "n": 3484,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "type of overnight news": {
    "none": {
     "n": 3484,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1771,
     "avgR": -0.05,
     "winPct": 44
    },
    "sector flat": {
     "n": 855,
     "avgR": -0.07,
     "winPct": 43
    },
    "sector against the move": {
     "n": 636,
     "avgR": -0.01,
     "winPct": 47
    },
    "no sector": {
     "n": 222,
     "avgR": -0.09,
     "winPct": 34
    }
   },
   "candle read": {
    "candle-none": {
     "n": 872,
     "avgR": -0.05,
     "winPct": 45
    },
    "candle-with": {
     "n": 1727,
     "avgR": -0.09,
     "winPct": 43
    },
    "candle-against": {
     "n": 416,
     "avgR": -0.03,
     "winPct": 44
    },
    "candle-mild": {
     "n": 469,
     "avgR": 0.06,
     "winPct": 44
    }
   },
   "chart structure": {
    "range": {
     "n": 1315,
     "avgR": -0.06,
     "winPct": 43
    },
    "trend-with": {
     "n": 2020,
     "avgR": -0.05,
     "winPct": 44
    },
    "trend-against": {
     "n": 149,
     "avgR": -0.01,
     "winPct": 42
    }
   },
   "latest candle pattern": {
    "none": {
     "n": 574,
     "avgR": -0.05,
     "winPct": 46
    },
    "bullish engulfing": {
     "n": 99,
     "avgR": -0.23,
     "winPct": 34
    },
    "three black crows": {
     "n": 652,
     "avgR": -0.08,
     "winPct": 41
    },
    "three white soldiers": {
     "n": 717,
     "avgR": -0.09,
     "winPct": 45
    },
    "outside bar": {
     "n": 195,
     "avgR": 0.02,
     "winPct": 43
    },
    "bearish engulfing": {
     "n": 104,
     "avgR": 0.08,
     "winPct": 49
    },
    "strong bull candle": {
     "n": 128,
     "avgR": 0.03,
     "winPct": 45
    },
    "bearish marubozu": {
     "n": 28,
     "avgR": -0.14,
     "winPct": 43
    },
    "gravestone doji": {
     "n": 48,
     "avgR": 0.03,
     "winPct": 46
    },
    "bullish harami": {
     "n": 26,
     "avgR": -0.16,
     "winPct": 35
    },
    "hammer": {
     "n": 35,
     "avgR": 0.06,
     "winPct": 43
    },
    "strong bear candle": {
     "n": 113,
     "avgR": -0.01,
     "winPct": 38
    },
    "tweezer bottom": {
     "n": 71,
     "avgR": -0.06,
     "winPct": 44
    },
    "dragonfly doji": {
     "n": 40,
     "avgR": -0.11,
     "winPct": 48
    },
    "inside bar": {
     "n": 252,
     "avgR": -0.02,
     "winPct": 44
    },
    "spinning top": {
     "n": 84,
     "avgR": -0.02,
     "winPct": 45
    },
    "doji": {
     "n": 32,
     "avgR": 0.09,
     "winPct": 53
    },
    "hanging man": {
     "n": 23,
     "avgR": -0.11,
     "winPct": 52
    },
    "morning star": {
     "n": 26,
     "avgR": -0.05,
     "winPct": 35
    },
    "shooting star": {
     "n": 22,
     "avgR": 0.06,
     "winPct": 50
    },
    "dark cloud cover": {
     "n": 21,
     "avgR": -0.31,
     "winPct": 29
    },
    "tweezer top": {
     "n": 61,
     "avgR": -0.06,
     "winPct": 48
    },
    "piercing line": {
     "n": 18,
     "avgR": -0.26,
     "winPct": 39
    },
    "bear flag": {
     "n": 18,
     "avgR": -0.03,
     "winPct": 44
    },
    "bearish harami": {
     "n": 23,
     "avgR": 0.12,
     "winPct": 61
    },
    "inverted hammer": {
     "n": 21,
     "avgR": 0.12,
     "winPct": 48
    },
    "bull flag": {
     "n": 13,
     "avgR": -0.18,
     "winPct": 31
    },
    "bullish marubozu": {
     "n": 17,
     "avgR": -0.35,
     "winPct": 24
    },
    "evening star": {
     "n": 23,
     "avgR": 0.36,
     "winPct": 57
    }
   },
   "month": {
    "2025-01": {
     "n": 281,
     "avgR": -0.11,
     "winPct": 42
    },
    "2025-02": {
     "n": 360,
     "avgR": -0.07,
     "winPct": 42
    },
    "2025-03": {
     "n": 199,
     "avgR": -0.07,
     "winPct": 44
    },
    "2025-04": {
     "n": 218,
     "avgR": 0.12,
     "winPct": 50
    },
    "2025-05": {
     "n": 309,
     "avgR": -0.1,
     "winPct": 43
    },
    "2025-06": {
     "n": 240,
     "avgR": 0,
     "winPct": 47
    },
    "2025-07": {
     "n": 360,
     "avgR": 0.01,
     "winPct": 43
    },
    "2025-08": {
     "n": 310,
     "avgR": -0.09,
     "winPct": 41
    },
    "2025-09": {
     "n": 302,
     "avgR": -0.06,
     "winPct": 45
    },
    "2025-10": {
     "n": 381,
     "avgR": -0.01,
     "winPct": 46
    },
    "2025-11": {
     "n": 294,
     "avgR": -0.16,
     "winPct": 40
    },
    "2025-12": {
     "n": 230,
     "avgR": -0.07,
     "winPct": 43
    }
   }
  },
  "text": "Overall -0.05R avg over 3484 trades.\nMade money when:\n  + month = 2025-04: +0.12R avg, 50% wins, 218 trades\n  + candle read = candle-mild: +0.06R avg, 44% wins, 469 trades\n  + stock opening gap = no gap: +0.04R avg, 48% wins, 553 trades\nLost most when:\n  - stock volatility = jumpy stock: -0.15R avg, 39% wins, 540 trades\n  - size of the 30-min move = 1.2x+ range: -0.16R avg, 37% wins, 442 trades"
 },
 "whyFormula": {
  "n": 211,
  "overall": 0.09,
  "findings": [],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 70,
     "avgR": 0.04,
     "winPct": 46
    },
    "market uptrend": {
     "n": 141,
     "avgR": 0.11,
     "winPct": 44
    }
   },
   "market volatility": {
    "normal market (12-18%)": {
     "n": 96,
     "avgR": -0.02,
     "winPct": 43
    },
    "calm market (<12%)": {
     "n": 86,
     "avgR": 0.23,
     "winPct": 44
    },
    "nervous market (18-28%)": {
     "n": 20,
     "avgR": -0.01,
     "winPct": 45
    },
    "panicky market (28%+)": {
     "n": 9,
     "avgR": 0.15,
     "winPct": 67
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 45,
     "avgR": -0.15,
     "winPct": 40
    },
    "S&P gapped down": {
     "n": 30,
     "avgR": 0.1,
     "winPct": 43
    },
    "S&P gapped down hard": {
     "n": 34,
     "avgR": 0.19,
     "winPct": 56
    },
    "S&P gapped up hard": {
     "n": 21,
     "avgR": 0.15,
     "winPct": 52
    },
    "S&P flat": {
     "n": 81,
     "avgR": 0.16,
     "winPct": 41
    }
   },
   "time of day": {
    "11:30-1:00": {
     "n": 100,
     "avgR": 0.09,
     "winPct": 42
    },
    "10:30-11:30": {
     "n": 111,
     "avgR": 0.09,
     "winPct": 47
    }
   },
   "side": {
    "short": {
     "n": 100,
     "avgR": 0,
     "winPct": 43
    },
    "long": {
     "n": 111,
     "avgR": 0.17,
     "winPct": 46
    }
   },
   "moving against the market": {
    "yes": {
     "n": 211,
     "avgR": 0.09,
     "winPct": 45
    }
   },
   "volume on the signal candle": {
    "surging": {
     "n": 8,
     "avgR": -0.21,
     "winPct": 50
    },
    "rising": {
     "n": 36,
     "avgR": 0.35,
     "winPct": 58
    },
    "normal": {
     "n": 106,
     "avgR": 0.03,
     "winPct": 36
    },
    "fading": {
     "n": 61,
     "avgR": 0.08,
     "winPct": 51
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 118,
     "avgR": 0.1,
     "winPct": 42
    },
    "with the move": {
     "n": 60,
     "avgR": 0.12,
     "winPct": 52
    },
    "against the move": {
     "n": 28,
     "avgR": 0.02,
     "winPct": 39
    },
    "against the move, far": {
     "n": 5,
     "avgR": 0,
     "winPct": 40
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 144,
     "avgR": 0,
     "winPct": 44
    },
    "0.8-1.2x range": {
     "n": 55,
     "avgR": 0.04,
     "winPct": 47
    },
    "1.2x+ range": {
     "n": 12,
     "avgR": 1.35,
     "winPct": 42
    }
   },
   "stock opening gap": {
    "gap up 1-4%": {
     "n": 24,
     "avgR": -0.16,
     "winPct": 38
    },
    "no gap": {
     "n": 27,
     "avgR": 0.05,
     "winPct": 48
    },
    "gap down 1-4%": {
     "n": 20,
     "avgR": -0.04,
     "winPct": 45
    },
    "gap down 4%+": {
     "n": 65,
     "avgR": 0.07,
     "winPct": 51
    },
    "gap up 4%+": {
     "n": 75,
     "avgR": 0.23,
     "winPct": 40
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 85,
     "avgR": 0.11,
     "winPct": 52
    },
    "2-4x": {
     "n": 13,
     "avgR": 0.07,
     "winPct": 38
    },
    "8x+": {
     "n": 113,
     "avgR": 0.08,
     "winPct": 40
    }
   },
   "stock volatility": {
    "jumpy stock": {
     "n": 31,
     "avgR": 0.27,
     "winPct": 42
    },
    "normal stock": {
     "n": 81,
     "avgR": 0,
     "winPct": 42
    },
    "calm stock": {
     "n": 89,
     "avgR": 0.1,
     "winPct": 47
    },
    "very jumpy stock": {
     "n": 10,
     "avgR": 0.22,
     "winPct": 50
    }
   },
   "news in the last hour": {
    "none": {
     "n": 211,
     "avgR": 0.09,
     "winPct": 45
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 211,
     "avgR": 0.09,
     "winPct": 45
    }
   },
   "overnight news": {
    "none": {
     "n": 211,
     "avgR": 0.09,
     "winPct": 45
    }
   },
   "type of overnight news": {
    "none": {
     "n": 211,
     "avgR": 0.09,
     "winPct": 45
    }
   },
   "sector": {
    "sector against the move": {
     "n": 96,
     "avgR": 0.04,
     "winPct": 48
    },
    "sector flat": {
     "n": 57,
     "avgR": 0.2,
     "winPct": 40
    },
    "sector with the move": {
     "n": 34,
     "avgR": 0.18,
     "winPct": 41
    },
    "no sector": {
     "n": 24,
     "avgR": -0.1,
     "winPct": 46
    }
   },
   "candle read": {
    "candle-with": {
     "n": 119,
     "avgR": 0.09,
     "winPct": 42
    },
    "candle-mild": {
     "n": 37,
     "avgR": 0.03,
     "winPct": 49
    },
    "candle-none": {
     "n": 39,
     "avgR": 0.19,
     "winPct": 51
    },
    "candle-against": {
     "n": 16,
     "avgR": -0.04,
     "winPct": 38
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 128,
     "avgR": -0.07,
     "winPct": 43
    },
    "range": {
     "n": 78,
     "avgR": 0.28,
     "winPct": 45
    },
    "trend-against": {
     "n": 5,
     "avgR": 1.36,
     "winPct": 80
    }
   },
   "latest candle pattern": {
    "bearish marubozu": {
     "n": 4,
     "avgR": 0.35,
     "winPct": 75
    },
    "three white soldiers": {
     "n": 41,
     "avgR": 0.03,
     "winPct": 49
    },
    "outside bar": {
     "n": 13,
     "avgR": -0.04,
     "winPct": 46
    },
    "strong bull candle": {
     "n": 11,
     "avgR": -0.38,
     "winPct": 36
    },
    "inside bar": {
     "n": 24,
     "avgR": 0.05,
     "winPct": 46
    },
    "none": {
     "n": 19,
     "avgR": 0.24,
     "winPct": 58
    },
    "strong bear candle": {
     "n": 11,
     "avgR": 0.27,
     "winPct": 45
    },
    "bull flag": {
     "n": 2,
     "avgR": -0.56,
     "winPct": 0
    },
    "three black crows": {
     "n": 45,
     "avgR": -0.14,
     "winPct": 36
    },
    "evening star": {
     "n": 3,
     "avgR": 0.2,
     "winPct": 33
    },
    "bear flag": {
     "n": 3,
     "avgR": -0.37,
     "winPct": 33
    },
    "bullish engulfing": {
     "n": 9,
     "avgR": 2.35,
     "winPct": 67
    },
    "bullish marubozu": {
     "n": 2,
     "avgR": -0.06,
     "winPct": 50
    },
    "spinning top": {
     "n": 5,
     "avgR": 0.88,
     "winPct": 80
    },
    "gravestone doji": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bearish harami": {
     "n": 1,
     "avgR": 1.13,
     "winPct": 100
    },
    "inverted hammer": {
     "n": 1,
     "avgR": 1.12,
     "winPct": 100
    },
    "morning star": {
     "n": 2,
     "avgR": -0.54,
     "winPct": 0
    },
    "bearish engulfing": {
     "n": 5,
     "avgR": -0.43,
     "winPct": 20
    },
    "bullish harami": {
     "n": 1,
     "avgR": 0.34,
     "winPct": 100
    },
    "dragonfly doji": {
     "n": 2,
     "avgR": -1.05,
     "winPct": 0
    },
    "tweezer bottom": {
     "n": 2,
     "avgR": -0.38,
     "winPct": 0
    },
    "piercing line": {
     "n": 2,
     "avgR": 0.13,
     "winPct": 50
    },
    "hammer": {
     "n": 1,
     "avgR": -0.07,
     "winPct": 0
    },
    "tweezer top": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "month": {
    "2025-01": {
     "n": 17,
     "avgR": -0.48,
     "winPct": 18
    },
    "2025-02": {
     "n": 20,
     "avgR": 0.31,
     "winPct": 45
    },
    "2025-03": {
     "n": 19,
     "avgR": 0.25,
     "winPct": 63
    },
    "2025-04": {
     "n": 13,
     "avgR": 0.16,
     "winPct": 54
    },
    "2025-05": {
     "n": 11,
     "avgR": -0.03,
     "winPct": 45
    },
    "2025-06": {
     "n": 10,
     "avgR": -0.17,
     "winPct": 30
    },
    "2025-07": {
     "n": 18,
     "avgR": -0.15,
     "winPct": 44
    },
    "2025-08": {
     "n": 22,
     "avgR": 0.09,
     "winPct": 45
    },
    "2025-09": {
     "n": 11,
     "avgR": 1.13,
     "winPct": 36
    },
    "2025-10": {
     "n": 27,
     "avgR": -0.06,
     "winPct": 33
    },
    "2025-11": {
     "n": 31,
     "avgR": 0.27,
     "winPct": 65
    },
    "2025-12": {
     "n": 12,
     "avgR": -0.19,
     "winPct": 33
    }
   }
  },
  "text": "Overall +0.09R avg over 211 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2025-12-29",
   "sym": "RARE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.004054963544583859,
   "minute": 35,
   "dir": "long",
   "entry": 20.04,
   "stopDist": 0.54412841796875,
   "marketAgainst": false,
   "volRatio": 0.737042135719642,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.819659450364553,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bullish engulfing",
   "rvol": 36.758238918931276,
   "gap": -43.37525364836925,
   "atrPct": 3.9787104403660365,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "CEF",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.6952387072296827,
   "minute": 50,
   "dir": "short",
   "entry": 46.15,
   "stopDist": 0.41597409929547996,
   "marketAgainst": false,
   "volRatio": 0.8369503423841085,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6346548990601304,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-against",
   "pattern": "outside bar",
   "rvol": 5.138536708501835,
   "gap": -4.227080190122578,
   "atrPct": 2.1236169538812364,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "PSLV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.03999738591838141,
   "minute": 55,
   "dir": "short",
   "entry": 23.65,
   "stopDist": 0.333343015398298,
   "marketAgainst": false,
   "volRatio": 2.0970032647538934,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7259789130750024,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 4.7877166227012085,
   "gap": -7.0660554947606595,
   "atrPct": 3.2002976543630752,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "AAAU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5879247731813715,
   "minute": 35,
   "dir": "short",
   "entry": 42.85,
   "stopDist": 0.22714276994977678,
   "marketAgainst": false,
   "volRatio": 1.2777099377166876,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.686616615772023,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 4.354599094493939,
   "gap": -3.085870266175772,
   "atrPct": 1.269805253519431,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "SLV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.03381123648795465,
   "minute": 55,
   "dir": "short",
   "entry": 64.5,
   "stopDist": 0.9265686035156251,
   "marketAgainst": false,
   "volRatio": 2.018329727347313,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6428881765903194,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 4.320828629513355,
   "gap": -7.681387142303764,
   "atrPct": 3.2570604883734875,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "UGL",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5468766476908846,
   "minute": 35,
   "dir": "short",
   "entry": 56.4055,
   "stopDist": 0.6291082109723773,
   "marketAgainst": false,
   "volRatio": 0.9512863494117713,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7022639226360317,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 4.194128651366099,
   "gap": -6.645106831879344,
   "atrPct": 2.542878845969596,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "SIVR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.044838793294309495,
   "minute": 55,
   "dir": "short",
   "entry": 67.7,
   "stopDist": 0.9687656947544643,
   "marketAgainst": false,
   "volRatio": 3.4315701779386534,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6441185968689314,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 4.132814240459902,
   "gap": -7.634614763623682,
   "atrPct": 3.243924615711349,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "IAUM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5544527432482312,
   "minute": 35,
   "dir": "short",
   "entry": 43.27,
   "stopDist": 0.23161446707589284,
   "marketAgainst": false,
   "volRatio": 1.2020639345234565,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6735330567623008,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.9023314073971838,
   "gap": -3.120850587985169,
   "atrPct": 1.281620548425269,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "PPLT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.24585813317718103,
   "minute": 60,
   "dir": "short",
   "entry": 19.07,
   "stopDist": 0.33799983433314734,
   "marketAgainst": false,
   "volRatio": 0.8211042998800392,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6153849170085273,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.6515500122727853,
   "gap": 799.7273872816331,
   "atrPct": 3.839162094710239,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "IAU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5189052562028075,
   "minute": 35,
   "dir": "short",
   "entry": 81.74,
   "stopDist": 0.4394404820033482,
   "marketAgainst": false,
   "volRatio": 1.3770261192039135,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6917887915426185,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.6059065458111976,
   "gap": -3.1169398313057983,
   "atrPct": 1.2873227702736563,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "PAAS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.40455206005254396,
   "minute": 100,
   "dir": "long",
   "entry": 52.885,
   "stopDist": 0.9448541913713728,
   "marketAgainst": false,
   "volRatio": 1.5317547043078126,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6498357160366,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.5321608100923196,
   "gap": -5.217547249492361,
   "atrPct": 4.264552273798868,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-29",
   "sym": "HBM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8217131197288547,
   "minute": 35,
   "dir": "short",
   "entry": 19.42,
   "stopDist": 0.25249132428850446,
   "marketAgainst": false,
   "volRatio": 0.5677549629267603,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6020008823206917,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 3.3491068221385882,
   "gap": -4.302667373385571,
   "atrPct": 3.121801840538938,
   "spyGap": -0.39982001830409786,
   "spyTrend": "market uptrend",
   "spyVol": 8.210193342259982
  },
  {
   "date": "2025-12-30",
   "sym": "RARE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6229492016030403,
   "minute": 35,
   "dir": "long",
   "entry": 22.25,
   "stopDist": 0.8901312691824776,
   "marketAgainst": false,
   "volRatio": 1.170139981993435,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8964969860376961,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 3.584614536178989,
   "gap": 0.6592327138544629,
   "atrPct": 11.28462601643799,
   "spyGap": -0.05814866615306835,
   "spyTrend": "market uptrend",
   "spyVol": 8.13461301877284
  },
  {
   "date": "2025-12-30",
   "sym": "SIVR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.9610338634551683,
   "minute": 340,
   "dir": "short",
   "entry": 71.8899,
   "stopDist": 1.163623046875,
   "marketAgainst": false,
   "volRatio": 1.8288418900371075,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6325416138642967,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 2.580353166947777,
   "gap": 4.673298836542106,
   "atrPct": 4.19595779656313,
   "spyGap": -0.05814866615306835,
   "spyTrend": "market uptrend",
   "spyVol": 8.13461301877284
  },
  {
   "date": "2025-12-30",
   "sym": "XPEV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.017396442695367054,
   "minute": 35,
   "dir": "long",
   "entry": 21.725,
   "stopDist": 0.2967515672956194,
   "marketAgainst": false,
   "volRatio": 0.43905762553446176,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6874437154927607,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "trend-against",
   "pattern": "dragonfly doji",
   "rvol": 2.0088810654113467,
   "gap": 3.5121951219512226,
   "atrPct": 3.6189215523856024,
   "spyGap": -0.05814866615306835,
   "spyTrend": "market uptrend",
   "spyVol": 8.13461301877284
  },
  {
   "date": "2025-12-31",
   "sym": "CORT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3733822857005142,
   "minute": 35,
   "dir": "short",
   "entry": 35.22,
   "stopDist": 1.5468290056501117,
   "marketAgainst": false,
   "volRatio": 0.9471377029880781,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6102807721809232,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bearish engulfing",
   "rvol": 55.566634229510306,
   "gap": -44.59719329143679,
   "atrPct": 5.509042710930327,
   "spyGap": 0.01746557294208806,
   "spyTrend": "market uptrend",
   "spyVol": 8.144027707517612
  },
  {
   "date": "2025-12-31",
   "sym": "ONDS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.02332924531885662,
   "minute": 65,
   "dir": "long",
   "entry": 10.015,
   "stopDist": 0.36369424547467916,
   "marketAgainst": false,
   "volRatio": 4.628282332013894,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6876105495527051,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.0939591707586716,
   "gap": 3.2258090797010697,
   "atrPct": 10.113855804621542,
   "spyGap": 0.01746557294208806,
   "spyTrend": "market uptrend",
   "spyVol": 8.144027707517612
  },
  {
   "date": "2025-12-31",
   "sym": "COGT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.08893126210816828,
   "minute": 45,
   "dir": "long",
   "entry": 36,
   "stopDist": 0.7197804042271206,
   "marketAgainst": false,
   "volRatio": 1.0355157611759094,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6640914328770352,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 1.9975953590429527,
   "gap": -3.6907299873545685,
   "atrPct": 4.847659111924534,
   "spyGap": 0.01746557294208806,
   "spyTrend": "market uptrend",
   "spyVol": 8.144027707517612
  },
  {
   "date": "2025-12-31",
   "sym": "QXO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.0706246348556342,
   "minute": 40,
   "dir": "short",
   "entry": 20.565,
   "stopDist": 0.2424285343715123,
   "marketAgainst": false,
   "volRatio": 2.049900227948956,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6847378772071901,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.9553024228851594,
   "gap": -0.28517544161826835,
   "atrPct": 2.8805670606292852,
   "spyGap": 0.01746557294208806,
   "spyTrend": "market uptrend",
   "spyVol": 8.144027707517612
  },
  {
   "date": "2025-12-31",
   "sym": "QXO",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": 0.2387448879789374,
   "minute": 325,
   "dir": "short",
   "entry": 19.585,
   "stopDist": 0.2424285343715123,
   "marketAgainst": false,
   "volRatio": 2.064689225240756,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.668238169322677,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.9553024228851594,
   "gap": -0.28517544161826835,
   "atrPct": 2.8805670606292852,
   "spyGap": 0.01746557294208806,
   "spyTrend": "market uptrend",
   "spyVol": 8.144027707517612
  }
 ]
}
```
