# Elis year test 2022

Out-of-sample year 2022 (251 sessions, formulas found on 2024-2025, never on 2022). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 125 trades, 34% wins, avg -0.12R, total -15R -> $3,000 became $2,540 (-15.3%, max drawdown 25.4%)
- midday, against the market, S&P flat at the open -> go with the stock: 61 trades, 21% wins, avg -0.3R, total -18.4R -> $3,000 became $2,520 (-16%, max drawdown 21.8%)
- midday, against the market, normal volume -> go with the stock: 78 trades, 37% wins, avg -0.1R, total -7.7R -> $3,000 became $2,697 (-10.1%, max drawdown 19.7%)
- afternoon, far from VWAP in the move direction -> go with the stock: 181 trades, 42% wins, avg -0.08R, total -14.6R -> $3,000 became $2,945 (-1.8%, max drawdown 7.6%)
- strong move alone (control) -> go with the stock: 2489 trades, 44% wins, avg -0.06R, total -151.8R -> $3,000 became $2,242 (-25.3%, max drawdown 37%)

```json
{
 "year": "2022",
 "sessions": 251,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 125,
   "winPct": 34,
   "avgR": -0.12,
   "totalR": -15,
   "money3k": {
    "start": 3000,
    "end": 2540,
    "returnPct": -15.3,
    "maxDrawdownPct": 25.4
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 61,
   "winPct": 21,
   "avgR": -0.3,
   "totalR": -18.4,
   "money3k": {
    "start": 3000,
    "end": 2520,
    "returnPct": -16,
    "maxDrawdownPct": 21.8
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 78,
   "winPct": 37,
   "avgR": -0.1,
   "totalR": -7.7,
   "money3k": {
    "start": 3000,
    "end": 2697,
    "returnPct": -10.1,
    "maxDrawdownPct": 19.7
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 181,
   "winPct": 42,
   "avgR": -0.08,
   "totalR": -14.6,
   "money3k": {
    "start": 3000,
    "end": 2945,
    "returnPct": -1.8,
    "maxDrawdownPct": 7.6
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2489,
   "winPct": 44,
   "avgR": -0.06,
   "totalR": -151.8,
   "money3k": {
    "start": 3000,
    "end": 2242,
    "returnPct": -25.3,
    "maxDrawdownPct": 37
   }
  }
 },
 "trades": 2934,
 "why": {
  "n": 2489,
  "overall": -0.06,
  "findings": [
   {
    "dim": "stock volatility",
    "value": "jumpy stock",
    "n": 590,
    "avgR": 0.05,
    "winPct": 49,
    "z": 3.16,
    "better": true
   },
   {
    "dim": "volume on the signal candle",
    "value": "surging",
    "n": 79,
    "avgR": -0.28,
    "winPct": 37,
    "z": -2.28,
    "better": false
   },
   {
    "dim": "month",
    "value": "2022-06",
    "n": 149,
    "avgR": -0.22,
    "winPct": 34,
    "z": -2.28,
    "better": false
   },
   {
    "dim": "price vs VWAP",
    "value": "against the move",
    "n": 27,
    "avgR": 0.31,
    "winPct": 52,
    "z": 2.26,
    "better": true
   },
   {
    "dim": "S&P gap at the open",
    "value": "S&P flat",
    "n": 685,
    "avgR": 0.01,
    "winPct": 49,
    "z": 2.18,
    "better": true
   },
   {
    "dim": "S&P gap at the open",
    "value": "S&P gapped up",
    "n": 517,
    "avgR": -0.14,
    "winPct": 40,
    "z": -2.11,
    "better": false
   },
   {
    "dim": "month",
    "value": "2022-01",
    "n": 226,
    "avgR": -0.18,
    "winPct": 39,
    "z": -2.1,
    "better": false
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 1038,
     "avgR": -0.04,
     "winPct": 45
    },
    "market downtrend": {
     "n": 1451,
     "avgR": -0.08,
     "winPct": 43
    }
   },
   "market volatility": {
    "normal market (12-18%)": {
     "n": 446,
     "avgR": -0.12,
     "winPct": 41
    },
    "nervous market (18-28%)": {
     "n": 1606,
     "avgR": -0.04,
     "winPct": 46
    },
    "panicky market (28%+)": {
     "n": 437,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 517,
     "avgR": -0.14,
     "winPct": 40
    },
    "S&P flat": {
     "n": 685,
     "avgR": 0.01,
     "winPct": 49
    },
    "S&P gapped down": {
     "n": 441,
     "avgR": -0.11,
     "winPct": 41
    },
    "S&P gapped down hard": {
     "n": 474,
     "avgR": 0,
     "winPct": 45
    },
    "S&P gapped up hard": {
     "n": 372,
     "avgR": -0.09,
     "winPct": 43
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 396,
     "avgR": -0.12,
     "winPct": 41
    },
    "first hour": {
     "n": 1863,
     "avgR": -0.04,
     "winPct": 45
    },
    "1:00-2:30": {
     "n": 56,
     "avgR": -0.19,
     "winPct": 43
    },
    "11:30-1:00": {
     "n": 101,
     "avgR": -0.03,
     "winPct": 48
    },
    "last 90 min": {
     "n": 73,
     "avgR": -0.18,
     "winPct": 41
    }
   },
   "side": {
    "long": {
     "n": 1275,
     "avgR": -0.05,
     "winPct": 44
    },
    "short": {
     "n": 1214,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "moving against the market": {
    "no": {
     "n": 2084,
     "avgR": -0.05,
     "winPct": 45
    },
    "yes": {
     "n": 405,
     "avgR": -0.11,
     "winPct": 40
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 1091,
     "avgR": -0.05,
     "winPct": 45
    },
    "rising": {
     "n": 251,
     "avgR": -0.15,
     "winPct": 41
    },
    "fading": {
     "n": 1068,
     "avgR": -0.04,
     "winPct": 45
    },
    "surging": {
     "n": 79,
     "avgR": -0.28,
     "winPct": 37
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1164,
     "avgR": -0.05,
     "winPct": 46
    },
    "against the move": {
     "n": 27,
     "avgR": 0.31,
     "winPct": 52
    },
    "with the move": {
     "n": 1297,
     "avgR": -0.08,
     "winPct": 43
    },
    "against the move, far": {
     "n": 1,
     "avgR": 0.13,
     "winPct": 100
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 1662,
     "avgR": -0.06,
     "winPct": 44
    },
    "0.8-1.2x range": {
     "n": 642,
     "avgR": -0.04,
     "winPct": 46
    },
    "1.2x+ range": {
     "n": 185,
     "avgR": -0.11,
     "winPct": 39
    }
   },
   "stock opening gap": {
    "gap up 1-4%": {
     "n": 409,
     "avgR": -0.02,
     "winPct": 47
    },
    "gap up 4%+": {
     "n": 647,
     "avgR": -0.09,
     "winPct": 42
    },
    "no gap": {
     "n": 470,
     "avgR": -0.05,
     "winPct": 44
    },
    "gap down 4%+": {
     "n": 570,
     "avgR": -0.08,
     "winPct": 45
    },
    "gap down 1-4%": {
     "n": 393,
     "avgR": -0.04,
     "winPct": 45
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 1021,
     "avgR": -0.04,
     "winPct": 45
    },
    "2-4x": {
     "n": 1004,
     "avgR": -0.09,
     "winPct": 43
    },
    "8x+": {
     "n": 444,
     "avgR": -0.06,
     "winPct": 44
    },
    "1-2x normal": {
     "n": 20,
     "avgR": -0.14,
     "winPct": 45
    }
   },
   "stock volatility": {
    "normal stock": {
     "n": 1122,
     "avgR": -0.11,
     "winPct": 41
    },
    "calm stock": {
     "n": 651,
     "avgR": -0.1,
     "winPct": 43
    },
    "jumpy stock": {
     "n": 590,
     "avgR": 0.05,
     "winPct": 49
    },
    "very jumpy stock": {
     "n": 126,
     "avgR": 0.02,
     "winPct": 54
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2489,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2489,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "overnight news": {
    "none": {
     "n": 2489,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2489,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1750,
     "avgR": -0.06,
     "winPct": 45
    },
    "sector against the move": {
     "n": 325,
     "avgR": -0.13,
     "winPct": 38
    },
    "no sector": {
     "n": 48,
     "avgR": 0.04,
     "winPct": 44
    },
    "sector flat": {
     "n": 366,
     "avgR": -0.04,
     "winPct": 45
    }
   },
   "candle read": {
    "candle-mild": {
     "n": 309,
     "avgR": -0.11,
     "winPct": 40
    },
    "candle-with": {
     "n": 1338,
     "avgR": -0.08,
     "winPct": 44
    },
    "candle-against": {
     "n": 239,
     "avgR": -0.04,
     "winPct": 44
    },
    "candle-none": {
     "n": 603,
     "avgR": -0.01,
     "winPct": 47
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1525,
     "avgR": -0.07,
     "winPct": 44
    },
    "range": {
     "n": 888,
     "avgR": -0.05,
     "winPct": 44
    },
    "trend-against": {
     "n": 76,
     "avgR": 0.08,
     "winPct": 49
    }
   },
   "latest candle pattern": {
    "strong bull candle": {
     "n": 87,
     "avgR": -0.12,
     "winPct": 37
    },
    "three white soldiers": {
     "n": 562,
     "avgR": -0.02,
     "winPct": 46
    },
    "inside bar": {
     "n": 153,
     "avgR": 0.06,
     "winPct": 51
    },
    "spinning top": {
     "n": 60,
     "avgR": -0.06,
     "winPct": 43
    },
    "three black crows": {
     "n": 527,
     "avgR": -0.08,
     "winPct": 43
    },
    "bearish marubozu": {
     "n": 28,
     "avgR": -0.14,
     "winPct": 43
    },
    "none": {
     "n": 402,
     "avgR": 0,
     "winPct": 47
    },
    "strong bear candle": {
     "n": 82,
     "avgR": -0.19,
     "winPct": 40
    },
    "hanging man": {
     "n": 16,
     "avgR": -0.15,
     "winPct": 25
    },
    "dragonfly doji": {
     "n": 26,
     "avgR": -0.36,
     "winPct": 35
    },
    "bullish engulfing": {
     "n": 63,
     "avgR": -0.02,
     "winPct": 44
    },
    "outside bar": {
     "n": 110,
     "avgR": -0.19,
     "winPct": 39
    },
    "bear flag": {
     "n": 9,
     "avgR": -0.3,
     "winPct": 33
    },
    "bearish engulfing": {
     "n": 59,
     "avgR": -0.11,
     "winPct": 37
    },
    "tweezer bottom": {
     "n": 42,
     "avgR": -0.21,
     "winPct": 38
    },
    "bull flag": {
     "n": 13,
     "avgR": -0.21,
     "winPct": 31
    },
    "doji": {
     "n": 34,
     "avgR": -0.06,
     "winPct": 41
    },
    "morning star": {
     "n": 12,
     "avgR": -0.06,
     "winPct": 42
    },
    "hammer": {
     "n": 20,
     "avgR": -0.48,
     "winPct": 20
    },
    "gravestone doji": {
     "n": 26,
     "avgR": 0.06,
     "winPct": 54
    },
    "dark cloud cover": {
     "n": 19,
     "avgR": -0.16,
     "winPct": 37
    },
    "bullish harami": {
     "n": 14,
     "avgR": 0.18,
     "winPct": 57
    },
    "inverted hammer": {
     "n": 12,
     "avgR": 0.03,
     "winPct": 50
    },
    "bearish harami": {
     "n": 12,
     "avgR": -0.26,
     "winPct": 33
    },
    "tweezer top": {
     "n": 35,
     "avgR": 0.05,
     "winPct": 60
    },
    "bullish marubozu": {
     "n": 22,
     "avgR": -0.16,
     "winPct": 41
    },
    "shooting star": {
     "n": 14,
     "avgR": 0.08,
     "winPct": 64
    },
    "piercing line": {
     "n": 8,
     "avgR": 0.17,
     "winPct": 50
    },
    "evening star": {
     "n": 22,
     "avgR": -0.31,
     "winPct": 32
    }
   },
   "month": {
    "2022-01": {
     "n": 226,
     "avgR": -0.18,
     "winPct": 39
    },
    "2022-02": {
     "n": 259,
     "avgR": -0.05,
     "winPct": 46
    },
    "2022-03": {
     "n": 220,
     "avgR": 0.02,
     "winPct": 50
    },
    "2022-04": {
     "n": 188,
     "avgR": -0.1,
     "winPct": 41
    },
    "2022-05": {
     "n": 226,
     "avgR": -0.01,
     "winPct": 49
    },
    "2022-06": {
     "n": 149,
     "avgR": -0.22,
     "winPct": 34
    },
    "2022-07": {
     "n": 176,
     "avgR": -0.1,
     "winPct": 41
    },
    "2022-08": {
     "n": 276,
     "avgR": 0.02,
     "winPct": 44
    },
    "2022-09": {
     "n": 174,
     "avgR": -0.13,
     "winPct": 42
    },
    "2022-10": {
     "n": 201,
     "avgR": -0.1,
     "winPct": 43
    },
    "2022-11": {
     "n": 223,
     "avgR": -0.01,
     "winPct": 45
    },
    "2022-12": {
     "n": 171,
     "avgR": 0.05,
     "winPct": 52
    }
   }
  },
  "text": "Overall -0.06R avg over 2489 trades.\nMade money when:\n  + stock volatility = jumpy stock: +0.05R avg, 49% wins, 590 trades\n  + price vs VWAP = against the move: +0.31R avg, 52% wins, 27 trades\n  + S&P gap at the open = S&P flat: +0.01R avg, 49% wins, 685 trades\nLost most when:\n  - volume on the signal candle = surging: -0.28R avg, 37% wins, 79 trades\n  - month = 2022-06: -0.22R avg, 34% wins, 149 trades\n  - S&P gap at the open = S&P gapped up: -0.14R avg, 40% wins, 517 trades\n  - month = 2022-01: -0.18R avg, 39% wins, 226 trades"
 },
 "whyFormula": {
  "n": 125,
  "overall": -0.12,
  "findings": [],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 77,
     "avgR": -0.1,
     "winPct": 35
    },
    "market uptrend": {
     "n": 48,
     "avgR": -0.15,
     "winPct": 33
    }
   },
   "market volatility": {
    "normal market (12-18%)": {
     "n": 19,
     "avgR": 0.23,
     "winPct": 53
    },
    "nervous market (18-28%)": {
     "n": 93,
     "avgR": -0.16,
     "winPct": 31
    },
    "panicky market (28%+)": {
     "n": 13,
     "avgR": -0.32,
     "winPct": 31
    }
   },
   "S&P gap at the open": {
    "S&P flat": {
     "n": 37,
     "avgR": -0.19,
     "winPct": 27
    },
    "S&P gapped down": {
     "n": 19,
     "avgR": 0.06,
     "winPct": 37
    },
    "S&P gapped up": {
     "n": 28,
     "avgR": -0.33,
     "winPct": 21
    },
    "S&P gapped down hard": {
     "n": 24,
     "avgR": -0.07,
     "winPct": 42
    },
    "S&P gapped up hard": {
     "n": 17,
     "avgR": 0.08,
     "winPct": 59
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 70,
     "avgR": -0.17,
     "winPct": 31
    },
    "11:30-1:00": {
     "n": 55,
     "avgR": -0.05,
     "winPct": 38
    }
   },
   "side": {
    "long": {
     "n": 67,
     "avgR": -0.11,
     "winPct": 34
    },
    "short": {
     "n": 58,
     "avgR": -0.13,
     "winPct": 34
    }
   },
   "moving against the market": {
    "yes": {
     "n": 125,
     "avgR": -0.12,
     "winPct": 34
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 63,
     "avgR": -0.11,
     "winPct": 35
    },
    "surging": {
     "n": 11,
     "avgR": -0.13,
     "winPct": 27
    },
    "fading": {
     "n": 29,
     "avgR": -0.05,
     "winPct": 38
    },
    "rising": {
     "n": 22,
     "avgR": -0.24,
     "winPct": 32
    }
   },
   "price vs VWAP": {
    "against the move": {
     "n": 14,
     "avgR": -0.4,
     "winPct": 36
    },
    "with the move, far": {
     "n": 64,
     "avgR": -0.07,
     "winPct": 36
    },
    "with the move": {
     "n": 44,
     "avgR": -0.2,
     "winPct": 27
    },
    "against the move, far": {
     "n": 3,
     "avgR": 1.3,
     "winPct": 100
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 96,
     "avgR": -0.17,
     "winPct": 33
    },
    "0.8-1.2x range": {
     "n": 23,
     "avgR": 0.12,
     "winPct": 43
    },
    "1.2x+ range": {
     "n": 6,
     "avgR": -0.3,
     "winPct": 17
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 16,
     "avgR": -0.13,
     "winPct": 31
    },
    "gap down 4%+": {
     "n": 40,
     "avgR": -0.11,
     "winPct": 38
    },
    "gap down 1-4%": {
     "n": 24,
     "avgR": -0.21,
     "winPct": 21
    },
    "gap up 4%+": {
     "n": 30,
     "avgR": 0.03,
     "winPct": 47
    },
    "gap up 1-4%": {
     "n": 15,
     "avgR": -0.3,
     "winPct": 27
    }
   },
   "opening volume surge": {
    "2-4x": {
     "n": 33,
     "avgR": -0.08,
     "winPct": 42
    },
    "4-8x": {
     "n": 54,
     "avgR": -0.27,
     "winPct": 28
    },
    "8x+": {
     "n": 38,
     "avgR": 0.06,
     "winPct": 37
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 42,
     "avgR": 0.1,
     "winPct": 36
    },
    "normal stock": {
     "n": 39,
     "avgR": -0.25,
     "winPct": 33
    },
    "jumpy stock": {
     "n": 35,
     "avgR": -0.2,
     "winPct": 34
    },
    "very jumpy stock": {
     "n": 9,
     "avgR": -0.25,
     "winPct": 33
    }
   },
   "news in the last hour": {
    "none": {
     "n": 125,
     "avgR": -0.12,
     "winPct": 34
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 125,
     "avgR": -0.12,
     "winPct": 34
    }
   },
   "overnight news": {
    "none": {
     "n": 125,
     "avgR": -0.12,
     "winPct": 34
    }
   },
   "type of overnight news": {
    "none": {
     "n": 125,
     "avgR": -0.12,
     "winPct": 34
    }
   },
   "sector": {
    "sector against the move": {
     "n": 62,
     "avgR": -0.23,
     "winPct": 27
    },
    "sector with the move": {
     "n": 21,
     "avgR": 0.04,
     "winPct": 38
    },
    "no sector": {
     "n": 9,
     "avgR": 0.17,
     "winPct": 67
    },
    "sector flat": {
     "n": 33,
     "avgR": -0.08,
     "winPct": 36
    }
   },
   "candle read": {
    "candle-mild": {
     "n": 21,
     "avgR": -0.02,
     "winPct": 33
    },
    "candle-with": {
     "n": 63,
     "avgR": -0.19,
     "winPct": 30
    },
    "candle-against": {
     "n": 20,
     "avgR": -0.12,
     "winPct": 35
    },
    "candle-none": {
     "n": 21,
     "avgR": -0.02,
     "winPct": 48
    }
   },
   "chart structure": {
    "range": {
     "n": 41,
     "avgR": 0.03,
     "winPct": 41
    },
    "trend-with": {
     "n": 79,
     "avgR": -0.21,
     "winPct": 29
    },
    "trend-against": {
     "n": 5,
     "avgR": 0.07,
     "winPct": 60
    }
   },
   "latest candle pattern": {
    "strong bull candle": {
     "n": 8,
     "avgR": 0.24,
     "winPct": 50
    },
    "three white soldiers": {
     "n": 30,
     "avgR": -0.25,
     "winPct": 33
    },
    "gravestone doji": {
     "n": 4,
     "avgR": -0.19,
     "winPct": 25
    },
    "outside bar": {
     "n": 4,
     "avgR": -0.39,
     "winPct": 0
    },
    "three black crows": {
     "n": 30,
     "avgR": -0.01,
     "winPct": 33
    },
    "hammer": {
     "n": 3,
     "avgR": -0.24,
     "winPct": 33
    },
    "none": {
     "n": 15,
     "avgR": 0.11,
     "winPct": 47
    },
    "inside bar": {
     "n": 9,
     "avgR": -0.38,
     "winPct": 44
    },
    "shooting star": {
     "n": 1,
     "avgR": -0.29,
     "winPct": 0
    },
    "dragonfly doji": {
     "n": 1,
     "avgR": -0.57,
     "winPct": 0
    },
    "tweezer bottom": {
     "n": 4,
     "avgR": 0.07,
     "winPct": 25
    },
    "bullish harami": {
     "n": 2,
     "avgR": -0.57,
     "winPct": 0
    },
    "bullish engulfing": {
     "n": 4,
     "avgR": -0.41,
     "winPct": 25
    },
    "strong bear candle": {
     "n": 2,
     "avgR": -0.38,
     "winPct": 0
    },
    "tweezer top": {
     "n": 2,
     "avgR": -0.44,
     "winPct": 0
    },
    "bearish harami": {
     "n": 1,
     "avgR": 0.3,
     "winPct": 100
    },
    "spinning top": {
     "n": 2,
     "avgR": -0.19,
     "winPct": 50
    },
    "bearish engulfing": {
     "n": 1,
     "avgR": 0.89,
     "winPct": 100
    },
    "inverted hammer": {
     "n": 1,
     "avgR": -0.18,
     "winPct": 0
    },
    "dark cloud cover": {
     "n": 1,
     "avgR": 0.15,
     "winPct": 100
    }
   },
   "month": {
    "2022-01": {
     "n": 8,
     "avgR": 0.02,
     "winPct": 63
    },
    "2022-02": {
     "n": 11,
     "avgR": -0.38,
     "winPct": 9
    },
    "2022-03": {
     "n": 13,
     "avgR": -0.42,
     "winPct": 31
    },
    "2022-04": {
     "n": 10,
     "avgR": -0.49,
     "winPct": 10
    },
    "2022-05": {
     "n": 14,
     "avgR": -0.54,
     "winPct": 21
    },
    "2022-06": {
     "n": 5,
     "avgR": 0.02,
     "winPct": 40
    },
    "2022-07": {
     "n": 4,
     "avgR": -0.66,
     "winPct": 25
    },
    "2022-08": {
     "n": 25,
     "avgR": 0.25,
     "winPct": 48
    },
    "2022-09": {
     "n": 13,
     "avgR": 0.01,
     "winPct": 31
    },
    "2022-10": {
     "n": 5,
     "avgR": 0.25,
     "winPct": 60
    },
    "2022-11": {
     "n": 10,
     "avgR": -0.05,
     "winPct": 40
    },
    "2022-12": {
     "n": 7,
     "avgR": 0.36,
     "winPct": 43
    }
   }
  },
  "text": "Overall -0.12R avg over 125 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2022-12-27",
   "sym": "NINE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.7939488192809617,
   "minute": 90,
   "dir": "short",
   "entry": 13.5,
   "stopDist": 0.4301371165684292,
   "marketAgainst": false,
   "volRatio": 0.42295291326043943,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6091080957862863,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "doji",
   "rvol": 2.5634584525338058,
   "gap": 0.5809697863243146,
   "atrPct": 7.80931558222849,
   "spyGap": -0.03133991302437522,
   "spyTrend": "market downtrend",
   "spyVol": 20.887878380045194
  },
  {
   "date": "2022-12-27",
   "sym": "LVS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.37833210776995735,
   "minute": 55,
   "dir": "long",
   "entry": 48.425,
   "stopDist": 0.5329969133649554,
   "marketAgainst": false,
   "volRatio": 0.9243641574126197,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.697940251945292,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.090326005253602,
   "gap": 1.3757513670219934,
   "atrPct": 2.864342799442106,
   "spyGap": -0.03133991302437522,
   "spyTrend": "market downtrend",
   "spyVol": 20.887878380045194
  },
  {
   "date": "2022-12-27",
   "sym": "WYNN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8706967768622663,
   "minute": 45,
   "dir": "long",
   "entry": 84.455,
   "stopDist": 1.1024259294782366,
   "marketAgainst": false,
   "volRatio": 1.6403530680592608,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6004938584067195,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.7470603337612323,
   "gap": 0.9043592272761858,
   "atrPct": 3.414351811219639,
   "spyGap": -0.03133991302437522,
   "spyTrend": "market downtrend",
   "spyVol": 20.887878380045194
  },
  {
   "date": "2022-12-28",
   "sym": "WB",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.10088992067359752,
   "minute": 45,
   "dir": "short",
   "entry": 18.56,
   "stopDist": 0.46391435350690574,
   "marketAgainst": false,
   "volRatio": 0.16169593072408384,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9139618052229318,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "outside bar",
   "rvol": 1.719065965000442,
   "gap": 0.21538461538461728,
   "atrPct": 5.947619916755201,
   "spyGap": -0.01572991542854174,
   "spyTrend": "market downtrend",
   "spyVol": 20.90232003665888
  },
  {
   "date": "2022-12-28",
   "sym": "TTE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.24992202210007647,
   "minute": 50,
   "dir": "short",
   "entry": 62.87,
   "stopDist": 0.5501429966517857,
   "marketAgainst": false,
   "volRatio": 1.007501475009131,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.625291973348041,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.7069863727522283,
   "gap": 0.9782248681543093,
   "atrPct": 2.170018094747823,
   "spyGap": -0.01572991542854174,
   "spyTrend": "market downtrend",
   "spyVol": 20.90232003665888
  },
  {
   "date": "2022-12-29",
   "sym": "CALM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 54.77,
   "stopDist": 0.8156172616141183,
   "marketAgainst": true,
   "volRatio": 0.8816923025156816,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 1.1966397058204497,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer top",
   "rvol": 6.669353407046467,
   "gap": -4.389771164163559,
   "atrPct": 3.278731627370674,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "TGTX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.35068695130965083,
   "minute": 35,
   "dir": "long",
   "entry": 9.68,
   "stopDist": 0.42427136557442807,
   "marketAgainst": false,
   "volRatio": 0.5211036464308096,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7070946199582077,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer bottom",
   "rvol": 5.774141557951931,
   "gap": 8.392434499427504,
   "atrPct": 12.537569848148545,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "EDR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.09008015121618783,
   "minute": 35,
   "dir": "long",
   "entry": 21.51,
   "stopDist": 0.24950005667550224,
   "marketAgainst": false,
   "volRatio": 0.2643976973376765,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7054106614047977,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "dragonfly doji",
   "rvol": 4.101572372166652,
   "gap": 0.9161052602634223,
   "atrPct": 3.0074741975521584,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "EDU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8165329809512131,
   "minute": 35,
   "dir": "long",
   "entry": 34.445,
   "stopDist": 1.0328516278948103,
   "marketAgainst": false,
   "volRatio": 0.7529239430844413,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.2799515092932958,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "dark cloud cover",
   "rvol": 3.193881338245811,
   "gap": -7.836125970810059,
   "atrPct": 7.099612718089279,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "SE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 45,
   "dir": "long",
   "entry": 51.2,
   "stopDist": 1.4786714826311385,
   "marketAgainst": false,
   "volRatio": 0.718468658309953,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6086544648839416,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.9186801245428868,
   "gap": -0.3475024025107798,
   "atrPct": 7.556579813865402,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "CCEP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.025703503193562877,
   "minute": 35,
   "dir": "long",
   "entry": 55.64,
   "stopDist": 0.3962828499930246,
   "marketAgainst": false,
   "volRatio": 0.19831891223733003,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6258156264000936,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bull flag",
   "rvol": 1.9068796229394962,
   "gap": -0.32502900802373613,
   "atrPct": 1.7889257960902356,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "LUV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.007795515423502326,
   "minute": 45,
   "dir": "long",
   "entry": 33.255,
   "stopDist": 0.5190714154924665,
   "marketAgainst": false,
   "volRatio": 1.3444769723389323,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6049263947661142,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.834020625342681,
   "gap": 0.4970530603199741,
   "atrPct": 4.031309705165518,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-29",
   "sym": "CHRS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.7056228132420773,
   "minute": 35,
   "dir": "long",
   "entry": 6.72,
   "stopDist": 0.22497997283935547,
   "marketAgainst": false,
   "volRatio": 1.2924346744665922,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8711886552673354,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer bottom",
   "rvol": 1.7163067890427433,
   "gap": 0.32154679233089567,
   "atrPct": 9.042603714960231,
   "spyGap": 0.7885085512171708,
   "spyTrend": "market downtrend",
   "spyVol": 17.18158376587343
  },
  {
   "date": "2022-12-30",
   "sym": "FUTU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.6629821789618053,
   "minute": 40,
   "dir": "short",
   "entry": 45.11,
   "stopDist": 1.448142787388393,
   "marketAgainst": false,
   "volRatio": 0.56990859312384,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7899773488932748,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 13.938404906384653,
   "gap": -24.800543006713184,
   "atrPct": 6.145572870223022,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "TGTX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3158458630044175,
   "minute": 70,
   "dir": "long",
   "entry": 11.2685,
   "stopDist": 0.48336279732840404,
   "marketAgainst": false,
   "volRatio": 1.54066922280693,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6152728378016681,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bullish engulfing",
   "rvol": 4.64150071586456,
   "gap": 4.9038500016964415,
   "atrPct": 11.619298438895346,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "TIP",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -1.05,
   "minute": 210,
   "dir": "long",
   "entry": 106.8,
   "stopDist": 0.24625113351004468,
   "marketAgainst": false,
   "volRatio": 3.1625174344999247,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7959354225348289,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bullish marubozu",
   "rvol": 2.9018999111549917,
   "gap": -0.3465737437493899,
   "atrPct": 0.5766465169132756,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "TIP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 210,
   "dir": "long",
   "entry": 106.8,
   "stopDist": 0.24625113351004468,
   "marketAgainst": false,
   "volRatio": 3.1625174344999247,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7959354225348289,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bullish marubozu",
   "rvol": 2.9018999111549917,
   "gap": -0.3465737437493899,
   "atrPct": 0.5766465169132756,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "GRPN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.9638793484030848,
   "minute": 55,
   "dir": "long",
   "entry": 7.61,
   "stopDist": 0.22685144969395232,
   "marketAgainst": false,
   "volRatio": 0.7564422486112331,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.689790610600501,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.143133351383204,
   "gap": -2.7741105270713384,
   "atrPct": 7.491791431629702,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "FULC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.37373907577715015,
   "minute": 40,
   "dir": "short",
   "entry": 7.075,
   "stopDist": 0.23599428449358262,
   "marketAgainst": false,
   "volRatio": 3.131165780689826,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6525581766968075,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 2.0429285781677518,
   "gap": -0.276239941304246,
   "atrPct": 8.148974169688925,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  },
  {
   "date": "2022-12-30",
   "sym": "BLNK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.030683099272757183,
   "minute": 50,
   "dir": "long",
   "entry": 11.08,
   "stopDist": 0.309854234967913,
   "marketAgainst": false,
   "volRatio": 1.8508699569298144,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7681031050766385,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bull candle",
   "rvol": 1.9303763372551013,
   "gap": -0.09813131300369093,
   "atrPct": 7.601919718534907,
   "spyGap": -0.7302322197940581,
   "spyTrend": "market downtrend",
   "spyVol": 18.853751691472432
  }
 ]
}
```
