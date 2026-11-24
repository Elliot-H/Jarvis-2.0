# Elis year test 2023

Out-of-sample year 2023 (220 sessions, formulas found on 2024-2025, never on 2023). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 141 trades, 45% wins, avg -0.07R, total -10.3R -> $3,000 became $2,672 (-10.9%, max drawdown 15.9%)
- midday, against the market, S&P flat at the open -> go with the stock: 92 trades, 42% wins, avg -0.1R, total -9R -> $3,000 became $2,734 (-8.9%, max drawdown 13.5%)
- midday, against the market, normal volume -> go with the stock: 82 trades, 48% wins, avg 0.02R, total 1.3R -> $3,000 became $3,027 (+0.9%, max drawdown 8.9%)
- afternoon, far from VWAP in the move direction -> go with the stock: 211 trades, 43% wins, avg -0.05R, total -9.9R -> $3,000 became $2,939 (-2%, max drawdown 9.1%)
- strong move alone (control) -> go with the stock: 2663 trades, 44% wins, avg -0.05R, total -123.8R -> $3,000 became $2,351 (-21.6%, max drawdown 24.4%)

```json
{
 "year": "2023",
 "sessions": 220,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 141,
   "winPct": 45,
   "avgR": -0.07,
   "totalR": -10.3,
   "money3k": {
    "start": 3000,
    "end": 2672,
    "returnPct": -10.9,
    "maxDrawdownPct": 15.9
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 92,
   "winPct": 42,
   "avgR": -0.1,
   "totalR": -9,
   "money3k": {
    "start": 3000,
    "end": 2734,
    "returnPct": -8.9,
    "maxDrawdownPct": 13.5
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 82,
   "winPct": 48,
   "avgR": 0.02,
   "totalR": 1.3,
   "money3k": {
    "start": 3000,
    "end": 3027,
    "returnPct": 0.9,
    "maxDrawdownPct": 8.9
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 211,
   "winPct": 43,
   "avgR": -0.05,
   "totalR": -9.9,
   "money3k": {
    "start": 3000,
    "end": 2939,
    "returnPct": -2,
    "maxDrawdownPct": 9.1
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2663,
   "winPct": 44,
   "avgR": -0.05,
   "totalR": -123.8,
   "money3k": {
    "start": 3000,
    "end": 2351,
    "returnPct": -21.6,
    "maxDrawdownPct": 24.4
   }
  }
 },
 "trades": 3189,
 "why": {
  "n": 2663,
  "overall": -0.05,
  "findings": [
   {
    "dim": "month",
    "value": "2023-03",
    "n": 153,
    "avgR": -0.26,
    "winPct": 33,
    "z": -2.83,
    "better": false
   },
   {
    "dim": "volume on the signal candle",
    "value": "surging",
    "n": 57,
    "avgR": 0.25,
    "winPct": 47,
    "z": 2.4,
    "better": true
   },
   {
    "dim": "chart structure",
    "value": "range",
    "n": 1049,
    "avgR": 0.02,
    "winPct": 47,
    "z": 2.31,
    "better": true
   },
   {
    "dim": "stock volatility",
    "value": "very jumpy stock",
    "n": 30,
    "avgR": 0.34,
    "winPct": 57,
    "z": 2.27,
    "better": true
   },
   {
    "dim": "S&P gap at the open",
    "value": "S&P flat",
    "n": 1194,
    "avgR": 0.01,
    "winPct": 47,
    "z": 2.09,
    "better": true
   },
   {
    "dim": "month",
    "value": "2023-06",
    "n": 202,
    "avgR": 0.09,
    "winPct": 50,
    "z": 2.08,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 896,
     "avgR": -0.07,
     "winPct": 44
    },
    "market uptrend": {
     "n": 1767,
     "avgR": -0.04,
     "winPct": 45
    }
   },
   "market volatility": {
    "nervous market (18-28%)": {
     "n": 104,
     "avgR": -0.01,
     "winPct": 52
    },
    "normal market (12-18%)": {
     "n": 1249,
     "avgR": -0.09,
     "winPct": 43
    },
    "calm market (<12%)": {
     "n": 1310,
     "avgR": -0.01,
     "winPct": 46
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 651,
     "avgR": -0.08,
     "winPct": 43
    },
    "S&P gapped down": {
     "n": 566,
     "avgR": -0.08,
     "winPct": 42
    },
    "S&P gapped up hard": {
     "n": 166,
     "avgR": -0.09,
     "winPct": 45
    },
    "S&P flat": {
     "n": 1194,
     "avgR": 0.01,
     "winPct": 47
    },
    "S&P gapped down hard": {
     "n": 86,
     "avgR": -0.2,
     "winPct": 36
    }
   },
   "time of day": {
    "first hour": {
     "n": 2043,
     "avgR": -0.06,
     "winPct": 44
    },
    "last 90 min": {
     "n": 38,
     "avgR": 0.07,
     "winPct": 53
    },
    "10:30-11:30": {
     "n": 435,
     "avgR": 0,
     "winPct": 48
    },
    "11:30-1:00": {
     "n": 102,
     "avgR": -0.14,
     "winPct": 37
    },
    "1:00-2:30": {
     "n": 45,
     "avgR": 0.07,
     "winPct": 58
    }
   },
   "side": {
    "short": {
     "n": 1314,
     "avgR": -0.03,
     "winPct": 44
    },
    "long": {
     "n": 1349,
     "avgR": -0.06,
     "winPct": 45
    }
   },
   "moving against the market": {
    "no": {
     "n": 2297,
     "avgR": -0.04,
     "winPct": 45
    },
    "yes": {
     "n": 366,
     "avgR": -0.07,
     "winPct": 41
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 1156,
     "avgR": -0.03,
     "winPct": 46
    },
    "normal": {
     "n": 1182,
     "avgR": -0.07,
     "winPct": 43
    },
    "surging": {
     "n": 57,
     "avgR": 0.25,
     "winPct": 47
    },
    "rising": {
     "n": 268,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1242,
     "avgR": -0.08,
     "winPct": 43
    },
    "with the move": {
     "n": 1377,
     "avgR": -0.02,
     "winPct": 46
    },
    "against the move": {
     "n": 41,
     "avgR": 0.19,
     "winPct": 56
    },
    "against the move, far": {
     "n": 3,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 746,
     "avgR": -0.05,
     "winPct": 45
    },
    "0.6-0.8x range": {
     "n": 1613,
     "avgR": -0.03,
     "winPct": 45
    },
    "1.2x+ range": {
     "n": 304,
     "avgR": -0.13,
     "winPct": 39
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 540,
     "avgR": -0.02,
     "winPct": 49
    },
    "gap up 1-4%": {
     "n": 541,
     "avgR": 0,
     "winPct": 47
    },
    "gap down 1-4%": {
     "n": 452,
     "avgR": -0.07,
     "winPct": 41
    },
    "gap up 4%+": {
     "n": 638,
     "avgR": -0.09,
     "winPct": 43
    },
    "gap down 4%+": {
     "n": 492,
     "avgR": -0.05,
     "winPct": 43
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 1133,
     "avgR": -0.04,
     "winPct": 45
    },
    "2-4x": {
     "n": 799,
     "avgR": -0.04,
     "winPct": 47
    },
    "8x+": {
     "n": 719,
     "avgR": -0.06,
     "winPct": 42
    },
    "1-2x normal": {
     "n": 12,
     "avgR": -0.34,
     "winPct": 33
    }
   },
   "stock volatility": {
    "normal stock": {
     "n": 1110,
     "avgR": -0.06,
     "winPct": 44
    },
    "calm stock": {
     "n": 1306,
     "avgR": -0.02,
     "winPct": 45
    },
    "jumpy stock": {
     "n": 217,
     "avgR": -0.16,
     "winPct": 40
    },
    "very jumpy stock": {
     "n": 30,
     "avgR": 0.34,
     "winPct": 57
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2663,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2663,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "overnight news": {
    "none": {
     "n": 2663,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2663,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1506,
     "avgR": -0.05,
     "winPct": 45
    },
    "sector against the move": {
     "n": 423,
     "avgR": -0.09,
     "winPct": 42
    },
    "sector flat": {
     "n": 669,
     "avgR": 0,
     "winPct": 45
    },
    "no sector": {
     "n": 65,
     "avgR": -0.16,
     "winPct": 40
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1366,
     "avgR": -0.04,
     "winPct": 45
    },
    "candle-mild": {
     "n": 260,
     "avgR": -0.05,
     "winPct": 45
    },
    "candle-against": {
     "n": 301,
     "avgR": -0.05,
     "winPct": 44
    },
    "candle-none": {
     "n": 736,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1510,
     "avgR": -0.09,
     "winPct": 43
    },
    "range": {
     "n": 1049,
     "avgR": 0.02,
     "winPct": 47
    },
    "trend-against": {
     "n": 104,
     "avgR": -0.08,
     "winPct": 45
    }
   },
   "latest candle pattern": {
    "three black crows": {
     "n": 568,
     "avgR": -0.06,
     "winPct": 44
    },
    "strong bull candle": {
     "n": 70,
     "avgR": -0.14,
     "winPct": 41
    },
    "shooting star": {
     "n": 24,
     "avgR": -0.18,
     "winPct": 38
    },
    "none": {
     "n": 476,
     "avgR": -0.06,
     "winPct": 45
    },
    "bearish engulfing": {
     "n": 81,
     "avgR": -0.02,
     "winPct": 42
    },
    "inside bar": {
     "n": 222,
     "avgR": -0.03,
     "winPct": 44
    },
    "doji": {
     "n": 27,
     "avgR": -0.15,
     "winPct": 37
    },
    "outside bar": {
     "n": 113,
     "avgR": -0.05,
     "winPct": 43
    },
    "tweezer top": {
     "n": 45,
     "avgR": -0.09,
     "winPct": 44
    },
    "three white soldiers": {
     "n": 503,
     "avgR": -0.05,
     "winPct": 45
    },
    "bullish engulfing": {
     "n": 73,
     "avgR": 0.03,
     "winPct": 47
    },
    "hammer": {
     "n": 17,
     "avgR": -0.22,
     "winPct": 35
    },
    "strong bear candle": {
     "n": 77,
     "avgR": 0.03,
     "winPct": 47
    },
    "gravestone doji": {
     "n": 27,
     "avgR": 0.05,
     "winPct": 48
    },
    "tweezer bottom": {
     "n": 41,
     "avgR": -0.14,
     "winPct": 44
    },
    "spinning top": {
     "n": 76,
     "avgR": -0.06,
     "winPct": 46
    },
    "piercing line": {
     "n": 17,
     "avgR": 0.08,
     "winPct": 65
    },
    "bullish marubozu": {
     "n": 25,
     "avgR": 0.13,
     "winPct": 56
    },
    "bull flag": {
     "n": 16,
     "avgR": -0.04,
     "winPct": 50
    },
    "morning star": {
     "n": 18,
     "avgR": -0.27,
     "winPct": 39
    },
    "bear flag": {
     "n": 12,
     "avgR": 0.03,
     "winPct": 25
    },
    "bullish harami": {
     "n": 11,
     "avgR": -0.62,
     "winPct": 27
    },
    "bearish marubozu": {
     "n": 23,
     "avgR": 0.22,
     "winPct": 48
    },
    "hanging man": {
     "n": 19,
     "avgR": 0.44,
     "winPct": 58
    },
    "evening star": {
     "n": 19,
     "avgR": 0.16,
     "winPct": 58
    },
    "inverted hammer": {
     "n": 12,
     "avgR": -0.24,
     "winPct": 42
    },
    "dark cloud cover": {
     "n": 18,
     "avgR": 0.09,
     "winPct": 44
    },
    "bearish harami": {
     "n": 9,
     "avgR": -0.27,
     "winPct": 33
    },
    "dragonfly doji": {
     "n": 24,
     "avgR": 0.15,
     "winPct": 42
    }
   },
   "month": {
    "2023-01": {
     "n": 104,
     "avgR": -0.07,
     "winPct": 50
    },
    "2023-02": {
     "n": 158,
     "avgR": -0.11,
     "winPct": 38
    },
    "2023-03": {
     "n": 153,
     "avgR": -0.26,
     "winPct": 33
    },
    "2023-04": {
     "n": 211,
     "avgR": -0.09,
     "winPct": 45
    },
    "2023-05": {
     "n": 311,
     "avgR": -0.04,
     "winPct": 46
    },
    "2023-06": {
     "n": 202,
     "avgR": 0.09,
     "winPct": 50
    },
    "2023-07": {
     "n": 258,
     "avgR": -0.04,
     "winPct": 43
    },
    "2023-08": {
     "n": 305,
     "avgR": -0.08,
     "winPct": 44
    },
    "2023-09": {
     "n": 186,
     "avgR": 0.03,
     "winPct": 48
    },
    "2023-10": {
     "n": 289,
     "avgR": 0,
     "winPct": 45
    },
    "2023-11": {
     "n": 268,
     "avgR": -0.05,
     "winPct": 44
    },
    "2023-12": {
     "n": 218,
     "avgR": -0.02,
     "winPct": 45
    }
   }
  },
  "text": "Overall -0.05R avg over 2663 trades.\nMade money when:\n  + volume on the signal candle = surging: +0.25R avg, 47% wins, 57 trades\n  + chart structure = range: +0.02R avg, 47% wins, 1049 trades\n  + stock volatility = very jumpy stock: +0.34R avg, 57% wins, 30 trades\n  + S&P gap at the open = S&P flat: +0.01R avg, 47% wins, 1194 trades\n  + month = 2023-06: +0.09R avg, 50% wins, 202 trades\nLost most when:\n  - month = 2023-03: -0.26R avg, 33% wins, 153 trades"
 },
 "whyFormula": {
  "n": 141,
  "overall": -0.07,
  "findings": [
   {
    "dim": "candle read",
    "value": "candle-mild",
    "n": 21,
    "avgR": 0.32,
    "winPct": 67,
    "z": 2.1,
    "better": true
   },
   {
    "dim": "stock opening gap",
    "value": "no gap",
    "n": 17,
    "avgR": 0.36,
    "winPct": 65,
    "z": 2.08,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 64,
     "avgR": -0.07,
     "winPct": 48
    },
    "market uptrend": {
     "n": 77,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "market volatility": {
    "normal market (12-18%)": {
     "n": 80,
     "avgR": -0.07,
     "winPct": 49
    },
    "nervous market (18-28%)": {
     "n": 6,
     "avgR": -0.82,
     "winPct": 0
    },
    "calm market (<12%)": {
     "n": 55,
     "avgR": 0,
     "winPct": 45
    }
   },
   "S&P gap at the open": {
    "S&P gapped down": {
     "n": 38,
     "avgR": -0.13,
     "winPct": 45
    },
    "S&P gapped up": {
     "n": 38,
     "avgR": -0.19,
     "winPct": 39
    },
    "S&P gapped down hard": {
     "n": 7,
     "avgR": -0.24,
     "winPct": 43
    },
    "S&P gapped up hard": {
     "n": 12,
     "avgR": 0.15,
     "winPct": 50
    },
    "S&P flat": {
     "n": 46,
     "avgR": 0.04,
     "winPct": 50
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 84,
     "avgR": -0.1,
     "winPct": 45
    },
    "11:30-1:00": {
     "n": 57,
     "avgR": -0.04,
     "winPct": 46
    }
   },
   "side": {
    "long": {
     "n": 62,
     "avgR": -0.14,
     "winPct": 39
    },
    "short": {
     "n": 79,
     "avgR": -0.02,
     "winPct": 51
    }
   },
   "moving against the market": {
    "yes": {
     "n": 141,
     "avgR": -0.07,
     "winPct": 45
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 70,
     "avgR": 0.04,
     "winPct": 50
    },
    "fading": {
     "n": 39,
     "avgR": -0.2,
     "winPct": 41
    },
    "rising": {
     "n": 28,
     "avgR": -0.17,
     "winPct": 43
    },
    "surging": {
     "n": 4,
     "avgR": -0.02,
     "winPct": 25
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 33,
     "avgR": -0.05,
     "winPct": 45
    },
    "with the move, far": {
     "n": 91,
     "avgR": -0.02,
     "winPct": 49
    },
    "against the move": {
     "n": 14,
     "avgR": -0.43,
     "winPct": 21
    },
    "against the move, far": {
     "n": 3,
     "avgR": -0.3,
     "winPct": 33
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 34,
     "avgR": 0.1,
     "winPct": 53
    },
    "0.6-0.8x range": {
     "n": 101,
     "avgR": -0.14,
     "winPct": 43
    },
    "1.2x+ range": {
     "n": 6,
     "avgR": 0.14,
     "winPct": 50
    }
   },
   "stock opening gap": {
    "gap up 1-4%": {
     "n": 21,
     "avgR": -0.41,
     "winPct": 29
    },
    "gap down 1-4%": {
     "n": 14,
     "avgR": -0.26,
     "winPct": 43
    },
    "gap up 4%+": {
     "n": 53,
     "avgR": -0.07,
     "winPct": 40
    },
    "gap down 4%+": {
     "n": 36,
     "avgR": -0.01,
     "winPct": 56
    },
    "no gap": {
     "n": 17,
     "avgR": 0.36,
     "winPct": 65
    }
   },
   "opening volume surge": {
    "2-4x": {
     "n": 16,
     "avgR": 0.15,
     "winPct": 56
    },
    "4-8x": {
     "n": 66,
     "avgR": -0.15,
     "winPct": 41
    },
    "8x+": {
     "n": 58,
     "avgR": -0.06,
     "winPct": 47
    },
    "1-2x normal": {
     "n": 1,
     "avgR": 0.66,
     "winPct": 100
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 74,
     "avgR": -0.11,
     "winPct": 45
    },
    "normal stock": {
     "n": 61,
     "avgR": -0.01,
     "winPct": 46
    },
    "very jumpy stock": {
     "n": 2,
     "avgR": 0.71,
     "winPct": 100
    },
    "jumpy stock": {
     "n": 4,
     "avgR": -0.75,
     "winPct": 25
    }
   },
   "news in the last hour": {
    "none": {
     "n": 141,
     "avgR": -0.07,
     "winPct": 45
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 141,
     "avgR": -0.07,
     "winPct": 45
    }
   },
   "overnight news": {
    "none": {
     "n": 141,
     "avgR": -0.07,
     "winPct": 45
    }
   },
   "type of overnight news": {
    "none": {
     "n": 141,
     "avgR": -0.07,
     "winPct": 45
    }
   },
   "sector": {
    "sector against the move": {
     "n": 67,
     "avgR": -0.1,
     "winPct": 40
    },
    "sector flat": {
     "n": 54,
     "avgR": -0.05,
     "winPct": 48
    },
    "sector with the move": {
     "n": 16,
     "avgR": -0.09,
     "winPct": 56
    },
    "no sector": {
     "n": 4,
     "avgR": 0.12,
     "winPct": 50
    }
   },
   "candle read": {
    "candle-none": {
     "n": 33,
     "avgR": -0.21,
     "winPct": 45
    },
    "candle-against": {
     "n": 12,
     "avgR": -0.02,
     "winPct": 50
    },
    "candle-with": {
     "n": 75,
     "avgR": -0.13,
     "winPct": 39
    },
    "candle-mild": {
     "n": 21,
     "avgR": 0.32,
     "winPct": 67
    }
   },
   "chart structure": {
    "range": {
     "n": 46,
     "avgR": -0.11,
     "winPct": 43
    },
    "trend-with": {
     "n": 90,
     "avgR": -0.03,
     "winPct": 48
    },
    "trend-against": {
     "n": 5,
     "avgR": -0.48,
     "winPct": 20
    }
   },
   "latest candle pattern": {
    "inside bar": {
     "n": 14,
     "avgR": 0.18,
     "winPct": 57
    },
    "three black crows": {
     "n": 42,
     "avgR": -0.04,
     "winPct": 48
    },
    "three white soldiers": {
     "n": 22,
     "avgR": -0.08,
     "winPct": 32
    },
    "none": {
     "n": 19,
     "avgR": -0.26,
     "winPct": 42
    },
    "strong bear candle": {
     "n": 6,
     "avgR": 0.51,
     "winPct": 100
    },
    "outside bar": {
     "n": 8,
     "avgR": -0.29,
     "winPct": 38
    },
    "strong bull candle": {
     "n": 6,
     "avgR": -0.25,
     "winPct": 17
    },
    "piercing line": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "gravestone doji": {
     "n": 2,
     "avgR": 0.33,
     "winPct": 100
    },
    "bearish marubozu": {
     "n": 2,
     "avgR": 0.23,
     "winPct": 50
    },
    "spinning top": {
     "n": 4,
     "avgR": -0.1,
     "winPct": 75
    },
    "dark cloud cover": {
     "n": 1,
     "avgR": 1.53,
     "winPct": 100
    },
    "dragonfly doji": {
     "n": 2,
     "avgR": -0.53,
     "winPct": 0
    },
    "tweezer bottom": {
     "n": 2,
     "avgR": -0.52,
     "winPct": 50
    },
    "bearish engulfing": {
     "n": 3,
     "avgR": -1.05,
     "winPct": 0
    },
    "bullish marubozu": {
     "n": 1,
     "avgR": -0.58,
     "winPct": 0
    },
    "bullish harami": {
     "n": 1,
     "avgR": -0.1,
     "winPct": 0
    },
    "bear flag": {
     "n": 1,
     "avgR": -0.43,
     "winPct": 0
    },
    "hammer": {
     "n": 2,
     "avgR": -0.41,
     "winPct": 50
    },
    "bullish engulfing": {
     "n": 1,
     "avgR": 1.1,
     "winPct": 100
    },
    "bearish harami": {
     "n": 1,
     "avgR": 1.23,
     "winPct": 100
    }
   },
   "month": {
    "2023-01": {
     "n": 6,
     "avgR": -0.71,
     "winPct": 17
    },
    "2023-02": {
     "n": 11,
     "avgR": 0.29,
     "winPct": 55
    },
    "2023-03": {
     "n": 9,
     "avgR": -0.16,
     "winPct": 56
    },
    "2023-04": {
     "n": 11,
     "avgR": 0.23,
     "winPct": 73
    },
    "2023-05": {
     "n": 24,
     "avgR": -0.18,
     "winPct": 38
    },
    "2023-06": {
     "n": 9,
     "avgR": -0.46,
     "winPct": 11
    },
    "2023-07": {
     "n": 9,
     "avgR": -0.02,
     "winPct": 44
    },
    "2023-08": {
     "n": 20,
     "avgR": 0.07,
     "winPct": 50
    },
    "2023-09": {
     "n": 7,
     "avgR": 0.07,
     "winPct": 43
    },
    "2023-10": {
     "n": 18,
     "avgR": -0.35,
     "winPct": 39
    },
    "2023-11": {
     "n": 15,
     "avgR": 0.18,
     "winPct": 60
    },
    "2023-12": {
     "n": 2,
     "avgR": -0.01,
     "winPct": 50
    }
   }
  },
  "text": "Overall -0.07R avg over 141 trades.\nMade money when:\n  + candle read = candle-mild: +0.32R avg, 67% wins, 21 trades\n  + stock opening gap = no gap: +0.36R avg, 65% wins, 17 trades\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2023-12-22",
   "sym": "CROX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3344394676041799,
   "minute": 35,
   "dir": "short",
   "entry": 97.41,
   "stopDist": 1.2832255772181922,
   "marketAgainst": true,
   "volRatio": 0.5094150736520952,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6094018182642822,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 5.693471729035783,
   "gap": -2.579890338918678,
   "atrPct": 3.135017967010248,
   "spyGap": 0.24539618426342447,
   "spyTrend": "market uptrend",
   "spyVol": 9.767111564417547
  },
  {
   "date": "2023-12-22",
   "sym": "DKS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.26586771778037227,
   "minute": 45,
   "dir": "short",
   "entry": 141.565,
   "stopDist": 1.389739990234375,
   "marketAgainst": false,
   "volRatio": 0.5823127916745878,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 1.0102609192121013,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three black crows",
   "rvol": 4.604440891223862,
   "gap": -2.7382314729549107,
   "atrPct": 2.366562246007313,
   "spyGap": 0.24539618426342447,
   "spyTrend": "market uptrend",
   "spyVol": 9.767111564417547
  },
  {
   "date": "2023-12-22",
   "sym": "MP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.07559750098337935,
   "minute": 60,
   "dir": "short",
   "entry": 19.9,
   "stopDist": 0.3980970927647182,
   "marketAgainst": false,
   "volRatio": 1.2271884943065932,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.653107005113612,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.679672622665208,
   "gap": 2.6078207222423266,
   "atrPct": 4.991187087542531,
   "spyGap": 0.24539618426342447,
   "spyTrend": "market uptrend",
   "spyVol": 9.767111564417547
  },
  {
   "date": "2023-12-22",
   "sym": "IONS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.24332013437661548,
   "minute": 35,
   "dir": "long",
   "entry": 50.725,
   "stopDist": 0.579571533203125,
   "marketAgainst": false,
   "volRatio": 1.4588562225660782,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6660092462904286,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bull candle",
   "rvol": 3.2042119908929925,
   "gap": 1.3235580972715821,
   "atrPct": 2.950374292405125,
   "spyGap": 0.24539618426342447,
   "spyTrend": "market uptrend",
   "spyVol": 9.767111564417547
  },
  {
   "date": "2023-12-22",
   "sym": "DECK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3846854296766257,
   "minute": 45,
   "dir": "short",
   "entry": 114.83,
   "stopDist": 0.986000497000558,
   "marketAgainst": false,
   "volRatio": 1.3284307111051141,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7464499280060554,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 3.142981240181129,
   "gap": 486.5797515506146,
   "atrPct": 2.1003759625781506,
   "spyGap": 0.24539618426342447,
   "spyTrend": "market uptrend",
   "spyVol": 9.767111564417547
  },
  {
   "date": "2023-12-26",
   "sym": "ZIM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.31404299359647103,
   "minute": 35,
   "dir": "short",
   "entry": 9.688,
   "stopDist": 0.3104028974260603,
   "marketAgainst": false,
   "volRatio": 1.436825519850699,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9432901639384547,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "strong bear candle",
   "rvol": 2.643079600171765,
   "gap": -7.167529612905399,
   "atrPct": 6.701271577528628,
   "spyGap": 0.09078562420705705,
   "spyTrend": "market uptrend",
   "spyVol": 9.664558333448504
  },
  {
   "date": "2023-12-26",
   "sym": "STNG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6993992896498605,
   "minute": 35,
   "dir": "short",
   "entry": 61.6736,
   "stopDist": 0.7489998953683036,
   "marketAgainst": false,
   "volRatio": 0.6598299538486547,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6416022258103193,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 2.226457635285812,
   "gap": -1.657115843087087,
   "atrPct": 2.899953147391534,
   "spyGap": 0.09078562420705705,
   "spyTrend": "market uptrend",
   "spyVol": 9.664558333448504
  },
  {
   "date": "2023-12-26",
   "sym": "DQ",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 25.72,
   "stopDist": 0.4637856619698661,
   "marketAgainst": false,
   "volRatio": 0.30133285414201,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6640998746960224,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "tweezer top",
   "rvol": 1.7815315315315314,
   "gap": -1.959999999999995,
   "atrPct": 4.637856619698661,
   "spyGap": 0.09078562420705705,
   "spyTrend": "market uptrend",
   "spyVol": 9.664558333448504
  },
  {
   "date": "2023-12-26",
   "sym": "AAOI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6191076115476891,
   "minute": 55,
   "dir": "long",
   "entry": 23.07,
   "stopDist": 0.8258543559483119,
   "marketAgainst": false,
   "volRatio": 0.7014689552333513,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6339616619189556,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "none",
   "rvol": 1.640875006607356,
   "gap": 1.435408549977879,
   "atrPct": 9.878640801697626,
   "spyGap": 0.09078562420705705,
   "spyTrend": "market uptrend",
   "spyVol": 9.664558333448504
  },
  {
   "date": "2023-12-27",
   "sym": "CYTK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 73.5,
   "stopDist": 1.1895111083984375,
   "marketAgainst": false,
   "volRatio": 0.6995048568023365,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.6359662270158202,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "gravestone doji",
   "rvol": 22.900168463876476,
   "gap": 61.10260659579614,
   "atrPct": 6.505748918306725,
   "spyGap": -0.0441488277470814,
   "spyTrend": "market uptrend",
   "spyVol": 9.679692573452044
  },
  {
   "date": "2023-12-28",
   "sym": "NEO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 60,
   "dir": "long",
   "entry": 17.415,
   "stopDist": 0.34831711905343193,
   "marketAgainst": false,
   "volRatio": 1.1180752871402755,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9359287332357347,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 12.172223124956474,
   "gap": -11.951219512195122,
   "atrPct": 4.247769744554048,
   "spyGap": 0.07135007185730124,
   "spyTrend": "market uptrend",
   "spyVol": 9.615548599754097
  },
  {
   "date": "2023-12-28",
   "sym": "MNSO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.2938563967004949,
   "minute": 40,
   "dir": "short",
   "entry": 20.64,
   "stopDist": 0.34898289271763394,
   "marketAgainst": false,
   "volRatio": 0.6652379172799866,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8768338115862554,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 5.05168343028592,
   "gap": 1.3039090219596705,
   "atrPct": 4.3754122789712255,
   "spyGap": 0.07135007185730124,
   "spyTrend": "market uptrend",
   "spyVol": 9.615548599754097
  },
  {
   "date": "2023-12-28",
   "sym": "FUTU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.09544439623858063,
   "minute": 35,
   "dir": "long",
   "entry": 55.115,
   "stopDist": 0.7679714747837613,
   "marketAgainst": false,
   "volRatio": 0.7749896420658224,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6745042192431101,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.9200816964798175,
   "gap": 2.867036259955502,
   "atrPct": 3.694301793078594,
   "spyGap": 0.07135007185730124,
   "spyTrend": "market uptrend",
   "spyVol": 9.615548599754097
  },
  {
   "date": "2023-12-28",
   "sym": "GCT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8225798049729179,
   "minute": 40,
   "dir": "short",
   "entry": 18.14,
   "stopDist": 0.6073943001883371,
   "marketAgainst": false,
   "volRatio": 0.8016811530256828,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8134419434736189,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.4354794073718002,
   "gap": 3.0186646946928297,
   "atrPct": 8.334170184945378,
   "spyGap": 0.07135007185730124,
   "spyTrend": "market uptrend",
   "spyVol": 9.615548599754097
  },
  {
   "date": "2023-12-28",
   "sym": "NVCR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.13991235398031257,
   "minute": 35,
   "dir": "long",
   "entry": 15.85,
   "stopDist": 0.2947314671107701,
   "marketAgainst": false,
   "volRatio": 2.546760942132565,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9093022968574864,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.3154052189553713,
   "gap": 0.39525489866927277,
   "atrPct": 4.853943695414128,
   "spyGap": 0.07135007185730124,
   "spyTrend": "market uptrend",
   "spyVol": 9.615548599754097
  },
  {
   "date": "2023-12-29",
   "sym": "SRRK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.7877518545374952,
   "minute": 80,
   "dir": "short",
   "entry": 18.3936,
   "stopDist": 0.5576400756835938,
   "marketAgainst": false,
   "volRatio": 0.9632216839157237,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6465819364901305,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "hammer",
   "rvol": 3.48083783688319,
   "gap": -0.09842369647924398,
   "atrPct": 6.860729380641087,
   "spyGap": -0.04195650011158403,
   "spyTrend": "market uptrend",
   "spyVol": 9.626766182760143
  },
  {
   "date": "2023-12-29",
   "sym": "SCCO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.26937523162815474,
   "minute": 35,
   "dir": "long",
   "entry": 86.33,
   "stopDist": 0.9116799490792412,
   "marketAgainst": false,
   "volRatio": 0.28494214096564735,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6493506856193305,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "hanging man",
   "rvol": 3.2963649382924056,
   "gap": -1.5344117748296915,
   "atrPct": 2.609870405255867,
   "spyGap": -0.04195650011158403,
   "spyTrend": "market uptrend",
   "spyVol": 9.626766182760143
  },
  {
   "date": "2023-12-29",
   "sym": "BSX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 1.2985896096503176,
   "minute": 55,
   "dir": "long",
   "entry": 57.753,
   "stopDist": 0.2684285845075335,
   "marketAgainst": false,
   "volRatio": 1.3754492130287854,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8538583937343962,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.09561961454065,
   "gap": 1.2793198939584638,
   "atrPct": 1.1923800210096904,
   "spyGap": -0.04195650011158403,
   "spyTrend": "market uptrend",
   "spyVol": 9.626766182760143
  },
  {
   "date": "2023-12-29",
   "sym": "OLMA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3291599189007639,
   "minute": 35,
   "dir": "long",
   "entry": 14.13,
   "stopDist": 0.39561143602643695,
   "marketAgainst": false,
   "volRatio": 0.1297262686089323,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9908712547273395,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-against",
   "structure": "trend-against",
   "pattern": "three black crows",
   "rvol": 2.2517946769581476,
   "gap": -0.34506398832265806,
   "atrPct": 6.825594242157611,
   "spyGap": -0.04195650011158403,
   "spyTrend": "market uptrend",
   "spyVol": 9.626766182760143
  },
  {
   "date": "2023-12-29",
   "sym": "TLRY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4337718784570689,
   "minute": 35,
   "dir": "short",
   "entry": 23.45,
   "stopDist": 0.6514286586216519,
   "marketAgainst": false,
   "volRatio": 0.8343315238522756,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8596490077438357,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.787360924234805,
   "gap": -89.8340250571789,
   "atrPct": 6.757558592431906,
   "spyGap": -0.04195650011158403,
   "spyTrend": "market uptrend",
   "spyVol": 9.626766182760143
  }
 ]
}
```
