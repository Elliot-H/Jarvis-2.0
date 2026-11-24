# Elis year test 2021

Out-of-sample year 2021 (252 sessions, formulas found on 2024-2025, never on 2021). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 195 trades, 52% wins, avg 0.14R, total 27.5R -> $3,000 became $3,427 (+14.2%, max drawdown 13.3%)
- midday, against the market, S&P flat at the open -> go with the stock: 136 trades, 55% wins, avg 0.21R, total 28.1R -> $3,000 became $3,523 (+17.4%, max drawdown 8.4%)
- midday, against the market, normal volume -> go with the stock: 127 trades, 50% wins, avg 0.15R, total 19.4R -> $3,000 became $2,961 (-1.3%, max drawdown 15.5%)
- afternoon, far from VWAP in the move direction -> go with the stock: 326 trades, 37% wins, avg -0.11R, total -34.4R -> $3,000 became $2,383 (-20.6%, max drawdown 30.5%)
- strong move alone (control) -> go with the stock: 3010 trades, 44% wins, avg -0.07R, total -214R -> $3,000 became $1,375 (-54.2%, max drawdown 59%)

```json
{
 "year": "2021",
 "sessions": 252,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 195,
   "winPct": 52,
   "avgR": 0.14,
   "totalR": 27.5,
   "money3k": {
    "start": 3000,
    "end": 3427,
    "returnPct": 14.2,
    "maxDrawdownPct": 13.3
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 136,
   "winPct": 55,
   "avgR": 0.21,
   "totalR": 28.1,
   "money3k": {
    "start": 3000,
    "end": 3523,
    "returnPct": 17.4,
    "maxDrawdownPct": 8.4
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 127,
   "winPct": 50,
   "avgR": 0.15,
   "totalR": 19.4,
   "money3k": {
    "start": 3000,
    "end": 2961,
    "returnPct": -1.3,
    "maxDrawdownPct": 15.5
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 326,
   "winPct": 37,
   "avgR": -0.11,
   "totalR": -34.4,
   "money3k": {
    "start": 3000,
    "end": 2383,
    "returnPct": -20.6,
    "maxDrawdownPct": 30.5
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 3010,
   "winPct": 44,
   "avgR": -0.07,
   "totalR": -214,
   "money3k": {
    "start": 3000,
    "end": 1375,
    "returnPct": -54.2,
    "maxDrawdownPct": 59
   }
  }
 },
 "trades": 3794,
 "why": {
  "n": 3010,
  "overall": -0.07,
  "findings": [
   {
    "dim": "month",
    "value": "2021-01",
    "n": 284,
    "avgR": 0.05,
    "winPct": 47,
    "z": 2.16,
    "better": true
   },
   {
    "dim": "latest candle pattern",
    "value": "strong bull candle",
    "n": 95,
    "avgR": -0.27,
    "winPct": 35,
    "z": -2.05,
    "better": false
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 2323,
     "avgR": -0.08,
     "winPct": 44
    },
    "market downtrend": {
     "n": 687,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 1936,
     "avgR": -0.09,
     "winPct": 42
    },
    "normal market (12-18%)": {
     "n": 975,
     "avgR": -0.03,
     "winPct": 47
    },
    "nervous market (18-28%)": {
     "n": 99,
     "avgR": -0.1,
     "winPct": 38
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 881,
     "avgR": -0.06,
     "winPct": 45
    },
    "S&P flat": {
     "n": 1319,
     "avgR": -0.09,
     "winPct": 42
    },
    "S&P gapped down": {
     "n": 529,
     "avgR": -0.03,
     "winPct": 46
    },
    "S&P gapped down hard": {
     "n": 154,
     "avgR": -0.18,
     "winPct": 38
    },
    "S&P gapped up hard": {
     "n": 127,
     "avgR": -0.03,
     "winPct": 46
    }
   },
   "time of day": {
    "first hour": {
     "n": 2321,
     "avgR": -0.07,
     "winPct": 43
    },
    "10:30-11:30": {
     "n": 484,
     "avgR": -0.07,
     "winPct": 46
    },
    "1:00-2:30": {
     "n": 48,
     "avgR": -0.11,
     "winPct": 42
    },
    "11:30-1:00": {
     "n": 126,
     "avgR": 0,
     "winPct": 44
    },
    "last 90 min": {
     "n": 31,
     "avgR": -0.28,
     "winPct": 35
    }
   },
   "side": {
    "long": {
     "n": 1461,
     "avgR": -0.1,
     "winPct": 42
    },
    "short": {
     "n": 1549,
     "avgR": -0.04,
     "winPct": 46
    }
   },
   "moving against the market": {
    "yes": {
     "n": 410,
     "avgR": 0,
     "winPct": 48
    },
    "no": {
     "n": 2600,
     "avgR": -0.08,
     "winPct": 43
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 1396,
     "avgR": -0.06,
     "winPct": 45
    },
    "normal": {
     "n": 1202,
     "avgR": -0.08,
     "winPct": 43
    },
    "surging": {
     "n": 105,
     "avgR": -0.13,
     "winPct": 41
    },
    "rising": {
     "n": 307,
     "avgR": -0.08,
     "winPct": 40
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 1575,
     "avgR": -0.05,
     "winPct": 45
    },
    "with the move, far": {
     "n": 1388,
     "avgR": -0.09,
     "winPct": 42
    },
    "against the move": {
     "n": 43,
     "avgR": -0.11,
     "winPct": 40
    },
    "against the move, far": {
     "n": 4,
     "avgR": -0.41,
     "winPct": 25
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 788,
     "avgR": -0.08,
     "winPct": 45
    },
    "0.6-0.8x range": {
     "n": 1919,
     "avgR": -0.06,
     "winPct": 44
    },
    "1.2x+ range": {
     "n": 303,
     "avgR": -0.12,
     "winPct": 37
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 619,
     "avgR": -0.09,
     "winPct": 43
    },
    "gap up 4%+": {
     "n": 806,
     "avgR": -0.11,
     "winPct": 42
    },
    "gap down 4%+": {
     "n": 579,
     "avgR": -0.04,
     "winPct": 46
    },
    "gap up 1-4%": {
     "n": 582,
     "avgR": -0.04,
     "winPct": 46
    },
    "gap down 1-4%": {
     "n": 424,
     "avgR": -0.06,
     "winPct": 41
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 656,
     "avgR": -0.12,
     "winPct": 40
    },
    "4-8x": {
     "n": 1273,
     "avgR": -0.05,
     "winPct": 45
    },
    "2-4x": {
     "n": 1068,
     "avgR": -0.06,
     "winPct": 45
    },
    "1-2x normal": {
     "n": 13,
     "avgR": -0.26,
     "winPct": 54
    }
   },
   "stock volatility": {
    "normal stock": {
     "n": 1190,
     "avgR": -0.07,
     "winPct": 45
    },
    "calm stock": {
     "n": 1108,
     "avgR": -0.06,
     "winPct": 45
    },
    "very jumpy stock": {
     "n": 162,
     "avgR": -0.1,
     "winPct": 39
    },
    "jumpy stock": {
     "n": 550,
     "avgR": -0.1,
     "winPct": 41
    }
   },
   "news in the last hour": {
    "none": {
     "n": 3010,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 3010,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "overnight news": {
    "none": {
     "n": 3010,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "type of overnight news": {
    "none": {
     "n": 3010,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "sector": {
    "sector against the move": {
     "n": 539,
     "avgR": -0.05,
     "winPct": 41
    },
    "sector with the move": {
     "n": 1704,
     "avgR": -0.09,
     "winPct": 44
    },
    "no sector": {
     "n": 193,
     "avgR": -0.16,
     "winPct": 40
    },
    "sector flat": {
     "n": 574,
     "avgR": 0,
     "winPct": 46
    }
   },
   "candle read": {
    "candle-none": {
     "n": 788,
     "avgR": -0.06,
     "winPct": 45
    },
    "candle-against": {
     "n": 334,
     "avgR": -0.01,
     "winPct": 45
    },
    "candle-with": {
     "n": 1517,
     "avgR": -0.08,
     "winPct": 43
    },
    "candle-mild": {
     "n": 371,
     "avgR": -0.11,
     "winPct": 44
    }
   },
   "chart structure": {
    "range": {
     "n": 1264,
     "avgR": -0.05,
     "winPct": 45
    },
    "trend-with": {
     "n": 1656,
     "avgR": -0.09,
     "winPct": 43
    },
    "trend-against": {
     "n": 90,
     "avgR": -0.08,
     "winPct": 49
    }
   },
   "latest candle pattern": {
    "none": {
     "n": 501,
     "avgR": -0.07,
     "winPct": 44
    },
    "dragonfly doji": {
     "n": 33,
     "avgR": -0.02,
     "winPct": 48
    },
    "three black crows": {
     "n": 589,
     "avgR": -0.06,
     "winPct": 44
    },
    "inside bar": {
     "n": 289,
     "avgR": -0.1,
     "winPct": 42
    },
    "bearish harami": {
     "n": 20,
     "avgR": -0.2,
     "winPct": 40
    },
    "doji": {
     "n": 24,
     "avgR": -0.05,
     "winPct": 42
    },
    "bearish marubozu": {
     "n": 24,
     "avgR": -0.02,
     "winPct": 58
    },
    "piercing line": {
     "n": 16,
     "avgR": -0.35,
     "winPct": 31
    },
    "gravestone doji": {
     "n": 33,
     "avgR": -0.02,
     "winPct": 45
    },
    "three white soldiers": {
     "n": 585,
     "avgR": -0.09,
     "winPct": 42
    },
    "strong bull candle": {
     "n": 95,
     "avgR": -0.27,
     "winPct": 35
    },
    "strong bear candle": {
     "n": 108,
     "avgR": -0.09,
     "winPct": 42
    },
    "bearish engulfing": {
     "n": 93,
     "avgR": 0.08,
     "winPct": 48
    },
    "tweezer bottom": {
     "n": 38,
     "avgR": 0.04,
     "winPct": 53
    },
    "hammer": {
     "n": 24,
     "avgR": 0.05,
     "winPct": 46
    },
    "evening star": {
     "n": 21,
     "avgR": 0.17,
     "winPct": 62
    },
    "spinning top": {
     "n": 83,
     "avgR": -0.08,
     "winPct": 47
    },
    "outside bar": {
     "n": 132,
     "avgR": 0,
     "winPct": 52
    },
    "bullish engulfing": {
     "n": 78,
     "avgR": -0.11,
     "winPct": 38
    },
    "bear flag": {
     "n": 26,
     "avgR": -0.07,
     "winPct": 46
    },
    "tweezer top": {
     "n": 42,
     "avgR": 0.17,
     "winPct": 36
    },
    "bull flag": {
     "n": 19,
     "avgR": 0.19,
     "winPct": 63
    },
    "dark cloud cover": {
     "n": 12,
     "avgR": -0.25,
     "winPct": 25
    },
    "bullish marubozu": {
     "n": 31,
     "avgR": -0.02,
     "winPct": 39
    },
    "bullish harami": {
     "n": 22,
     "avgR": -0.08,
     "winPct": 55
    },
    "shooting star": {
     "n": 25,
     "avgR": -0.11,
     "winPct": 40
    },
    "morning star": {
     "n": 12,
     "avgR": -0.43,
     "winPct": 33
    },
    "inverted hammer": {
     "n": 19,
     "avgR": 0.01,
     "winPct": 63
    },
    "hanging man": {
     "n": 16,
     "avgR": -0.46,
     "winPct": 19
    }
   },
   "month": {
    "2021-01": {
     "n": 284,
     "avgR": 0.05,
     "winPct": 47
    },
    "2021-02": {
     "n": 307,
     "avgR": -0.02,
     "winPct": 50
    },
    "2021-03": {
     "n": 189,
     "avgR": -0.15,
     "winPct": 39
    },
    "2021-04": {
     "n": 222,
     "avgR": -0.1,
     "winPct": 44
    },
    "2021-05": {
     "n": 248,
     "avgR": -0.04,
     "winPct": 42
    },
    "2021-06": {
     "n": 246,
     "avgR": -0.06,
     "winPct": 41
    },
    "2021-07": {
     "n": 250,
     "avgR": -0.06,
     "winPct": 47
    },
    "2021-08": {
     "n": 302,
     "avgR": -0.11,
     "winPct": 42
    },
    "2021-09": {
     "n": 245,
     "avgR": -0.08,
     "winPct": 42
    },
    "2021-10": {
     "n": 245,
     "avgR": -0.16,
     "winPct": 40
    },
    "2021-11": {
     "n": 321,
     "avgR": -0.11,
     "winPct": 41
    },
    "2021-12": {
     "n": 151,
     "avgR": -0.01,
     "winPct": 48
    }
   }
  },
  "text": "Overall -0.07R avg over 3010 trades.\nMade money when:\n  + month = 2021-01: +0.05R avg, 47% wins, 284 trades\nLost most when:\n  - latest candle pattern = strong bull candle: -0.27R avg, 35% wins, 95 trades"
 },
 "whyFormula": {
  "n": 195,
  "overall": 0.14,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 138,
     "avgR": 0.12,
     "winPct": 51
    },
    "market downtrend": {
     "n": 57,
     "avgR": 0.2,
     "winPct": 56
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 103,
     "avgR": 0.2,
     "winPct": 55
    },
    "normal market (12-18%)": {
     "n": 86,
     "avgR": 0.1,
     "winPct": 50
    },
    "nervous market (18-28%)": {
     "n": 6,
     "avgR": -0.27,
     "winPct": 33
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 69,
     "avgR": 0.18,
     "winPct": 52
    },
    "S&P gapped down": {
     "n": 38,
     "avgR": 0.12,
     "winPct": 50
    },
    "S&P gapped down hard": {
     "n": 16,
     "avgR": -0.23,
     "winPct": 44
    },
    "S&P flat": {
     "n": 64,
     "avgR": 0.23,
     "winPct": 56
    },
    "S&P gapped up hard": {
     "n": 8,
     "avgR": -0.13,
     "winPct": 50
    }
   },
   "time of day": {
    "11:30-1:00": {
     "n": 95,
     "avgR": 0.09,
     "winPct": 51
    },
    "10:30-11:30": {
     "n": 100,
     "avgR": 0.19,
     "winPct": 54
    }
   },
   "side": {
    "long": {
     "n": 81,
     "avgR": -0.04,
     "winPct": 44
    },
    "short": {
     "n": 114,
     "avgR": 0.27,
     "winPct": 58
    }
   },
   "moving against the market": {
    "yes": {
     "n": 195,
     "avgR": 0.14,
     "winPct": 52
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 57,
     "avgR": 0.08,
     "winPct": 49
    },
    "normal": {
     "n": 89,
     "avgR": 0.29,
     "winPct": 56
    },
    "rising": {
     "n": 35,
     "avgR": -0.25,
     "winPct": 40
    },
    "surging": {
     "n": 14,
     "avgR": 0.43,
     "winPct": 71
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 40,
     "avgR": 0.03,
     "winPct": 48
    },
    "with the move, far": {
     "n": 133,
     "avgR": 0.2,
     "winPct": 56
    },
    "against the move": {
     "n": 13,
     "avgR": -0.34,
     "winPct": 31
    },
    "against the move, far": {
     "n": 9,
     "avgR": 0.45,
     "winPct": 44
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 134,
     "avgR": 0.09,
     "winPct": 53
    },
    "0.8-1.2x range": {
     "n": 41,
     "avgR": 0.13,
     "winPct": 54
    },
    "1.2x+ range": {
     "n": 20,
     "avgR": 0.52,
     "winPct": 45
    }
   },
   "stock opening gap": {
    "gap down 4%+": {
     "n": 57,
     "avgR": 0.26,
     "winPct": 56
    },
    "gap up 4%+": {
     "n": 83,
     "avgR": -0.04,
     "winPct": 47
    },
    "gap down 1-4%": {
     "n": 20,
     "avgR": 0.38,
     "winPct": 55
    },
    "gap up 1-4%": {
     "n": 18,
     "avgR": 0.39,
     "winPct": 61
    },
    "no gap": {
     "n": 17,
     "avgR": 0.04,
     "winPct": 53
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 72,
     "avgR": 0.07,
     "winPct": 44
    },
    "4-8x": {
     "n": 82,
     "avgR": 0.21,
     "winPct": 60
    },
    "2-4x": {
     "n": 41,
     "avgR": 0.12,
     "winPct": 51
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 52,
     "avgR": 0.04,
     "winPct": 56
    },
    "very jumpy stock": {
     "n": 21,
     "avgR": 0.06,
     "winPct": 38
    },
    "jumpy stock": {
     "n": 57,
     "avgR": 0.25,
     "winPct": 53
    },
    "normal stock": {
     "n": 65,
     "avgR": 0.15,
     "winPct": 54
    }
   },
   "news in the last hour": {
    "none": {
     "n": 195,
     "avgR": 0.14,
     "winPct": 52
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 195,
     "avgR": 0.14,
     "winPct": 52
    }
   },
   "overnight news": {
    "none": {
     "n": 195,
     "avgR": 0.14,
     "winPct": 52
    }
   },
   "type of overnight news": {
    "none": {
     "n": 195,
     "avgR": 0.14,
     "winPct": 52
    }
   },
   "sector": {
    "sector against the move": {
     "n": 74,
     "avgR": 0.13,
     "winPct": 53
    },
    "no sector": {
     "n": 28,
     "avgR": -0.02,
     "winPct": 43
    },
    "sector with the move": {
     "n": 46,
     "avgR": 0.12,
     "winPct": 57
    },
    "sector flat": {
     "n": 47,
     "avgR": 0.27,
     "winPct": 53
    }
   },
   "candle read": {
    "candle-with": {
     "n": 96,
     "avgR": 0.19,
     "winPct": 59
    },
    "candle-mild": {
     "n": 34,
     "avgR": 0,
     "winPct": 47
    },
    "candle-none": {
     "n": 42,
     "avgR": 0.24,
     "winPct": 45
    },
    "candle-against": {
     "n": 23,
     "avgR": -0.02,
     "winPct": 43
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 110,
     "avgR": 0.09,
     "winPct": 54
    },
    "range": {
     "n": 79,
     "avgR": 0.25,
     "winPct": 51
    },
    "trend-against": {
     "n": 6,
     "avgR": -0.33,
     "winPct": 50
    }
   },
   "latest candle pattern": {
    "three white soldiers": {
     "n": 35,
     "avgR": -0.06,
     "winPct": 46
    },
    "strong bear candle": {
     "n": 10,
     "avgR": 0.01,
     "winPct": 40
    },
    "none": {
     "n": 22,
     "avgR": 0.2,
     "winPct": 41
    },
    "piercing line": {
     "n": 2,
     "avgR": 1.62,
     "winPct": 50
    },
    "morning star": {
     "n": 1,
     "avgR": 0.68,
     "winPct": 100
    },
    "inside bar": {
     "n": 17,
     "avgR": 0.72,
     "winPct": 53
    },
    "doji": {
     "n": 4,
     "avgR": -0.37,
     "winPct": 25
    },
    "three black crows": {
     "n": 44,
     "avgR": 0.31,
     "winPct": 70
    },
    "tweezer bottom": {
     "n": 2,
     "avgR": 0.36,
     "winPct": 50
    },
    "strong bull candle": {
     "n": 11,
     "avgR": 0.22,
     "winPct": 64
    },
    "bearish engulfing": {
     "n": 3,
     "avgR": -0.32,
     "winPct": 67
    },
    "hammer": {
     "n": 3,
     "avgR": 0.29,
     "winPct": 67
    },
    "bullish engulfing": {
     "n": 5,
     "avgR": 0.2,
     "winPct": 40
    },
    "outside bar": {
     "n": 10,
     "avgR": -0.56,
     "winPct": 30
    },
    "spinning top": {
     "n": 7,
     "avgR": 0.22,
     "winPct": 57
    },
    "dragonfly doji": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "gravestone doji": {
     "n": 2,
     "avgR": 0.88,
     "winPct": 100
    },
    "inverted hammer": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "shooting star": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bullish marubozu": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bear flag": {
     "n": 1,
     "avgR": 0.25,
     "winPct": 100
    },
    "bearish harami": {
     "n": 4,
     "avgR": 0.2,
     "winPct": 50
    },
    "evening star": {
     "n": 4,
     "avgR": -0.04,
     "winPct": 50
    },
    "bullish harami": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "tweezer top": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "hanging man": {
     "n": 2,
     "avgR": 0.06,
     "winPct": 100
    }
   },
   "month": {
    "2021-01": {
     "n": 45,
     "avgR": 0.42,
     "winPct": 58
    },
    "2021-02": {
     "n": 26,
     "avgR": -0.07,
     "winPct": 42
    },
    "2021-03": {
     "n": 23,
     "avgR": -0.3,
     "winPct": 30
    },
    "2021-04": {
     "n": 13,
     "avgR": -0.23,
     "winPct": 46
    },
    "2021-05": {
     "n": 14,
     "avgR": 0.28,
     "winPct": 50
    },
    "2021-06": {
     "n": 7,
     "avgR": 1.09,
     "winPct": 71
    },
    "2021-07": {
     "n": 9,
     "avgR": 0.25,
     "winPct": 44
    },
    "2021-08": {
     "n": 6,
     "avgR": 0.08,
     "winPct": 67
    },
    "2021-09": {
     "n": 14,
     "avgR": 0.42,
     "winPct": 71
    },
    "2021-10": {
     "n": 11,
     "avgR": -0.69,
     "winPct": 27
    },
    "2021-11": {
     "n": 19,
     "avgR": 0.3,
     "winPct": 68
    },
    "2021-12": {
     "n": 8,
     "avgR": 0.27,
     "winPct": 75
    }
   }
  },
  "text": "Overall +0.14R avg over 195 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2021-12-23",
   "sym": "WYNN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4823516339987794,
   "minute": 35,
   "dir": "short",
   "entry": 87.48,
   "stopDist": 1.5380998883928572,
   "marketAgainst": false,
   "volRatio": 0.34346399392830035,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6034978657789949,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 3.2654310181578987,
   "gap": 5.042502754071854,
   "atrPct": 4.47798951670023,
   "spyGap": 0.22664533196357084,
   "spyTrend": "market uptrend",
   "spyVol": 21.05959108792449
  },
  {
   "date": "2021-12-23",
   "sym": "P",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.42249500349305313,
   "minute": 35,
   "dir": "long",
   "entry": 34.495,
   "stopDist": 0.5234969547816685,
   "marketAgainst": false,
   "volRatio": 0.43591536509718065,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8978084699576118,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bullish engulfing",
   "rvol": 3.1570391526835655,
   "gap": 0.12136200436421163,
   "atrPct": 3.9706990998392206,
   "spyGap": 0.22664533196357084,
   "spyTrend": "market uptrend",
   "spyVol": 21.05959108792449
  },
  {
   "date": "2021-12-23",
   "sym": "ACHR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.04101723276414674,
   "minute": 60,
   "dir": "long",
   "entry": 6.888,
   "stopDist": 0.2226485388619559,
   "marketAgainst": false,
   "volRatio": 1.1250944694775935,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6072350651437477,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 2.8033917611905297,
   "gap": 2.504177539456487,
   "atrPct": 9.292510324269749,
   "spyGap": 0.22664533196357084,
   "spyTrend": "market uptrend",
   "spyVol": 21.05959108792449
  },
  {
   "date": "2021-12-23",
   "sym": "UNG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.10918135166065483,
   "minute": 95,
   "dir": "long",
   "entry": 48.48,
   "stopDist": 1.005142865862165,
   "marketAgainst": false,
   "volRatio": 0.6768796167280641,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6048891363104727,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bullish engulfing",
   "rvol": 2.4753158849141315,
   "gap": -76.29717030891024,
   "atrPct": 4.938791493520889,
   "spyGap": 0.22664533196357084,
   "spyTrend": "market uptrend",
   "spyVol": 21.05959108792449
  },
  {
   "date": "2021-12-27",
   "sym": "ALNY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8968831017941462,
   "minute": 35,
   "dir": "short",
   "entry": 168.235,
   "stopDist": 3.7861062186104912,
   "marketAgainst": true,
   "volRatio": 3.280447084461003,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 1.4753944230466054,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three black crows",
   "rvol": 2.261165474371966,
   "gap": -2.2485237799210855,
   "atrPct": 4.870216233224502,
   "spyGap": 0.3038661024092226,
   "spyTrend": "market uptrend",
   "spyVol": 19.412838366761395
  },
  {
   "date": "2021-12-27",
   "sym": "BOX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.16445076302067319,
   "minute": 35,
   "dir": "long",
   "entry": 27.73,
   "stopDist": 0.30309987749372214,
   "marketAgainst": false,
   "volRatio": 1.0547414923108676,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6004621364578756,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.9237383412366926,
   "gap": 0.0746800330160724,
   "atrPct": 2.8295357517006163,
   "spyGap": 0.3038661024092226,
   "spyTrend": "market uptrend",
   "spyVol": 19.412838366761395
  },
  {
   "date": "2021-12-28",
   "sym": "APPS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.23544242858791875,
   "minute": 35,
   "dir": "short",
   "entry": 66.09,
   "stopDist": 1.7256029401506698,
   "marketAgainst": true,
   "volRatio": 0.4346863369428758,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6026878929107474,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "doji",
   "rvol": 5.414277467011607,
   "gap": 11.16015373037893,
   "atrPct": 6.800137836952012,
   "spyGap": 0.09638147445056866,
   "spyTrend": "market uptrend",
   "spyVol": 19.56174364392385
  },
  {
   "date": "2021-12-28",
   "sym": "IBRX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 1.316481038652474,
   "minute": 80,
   "dir": "short",
   "entry": 7.29,
   "stopDist": 0.24881428309849332,
   "marketAgainst": true,
   "volRatio": 0.5547522153216146,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6028592817584447,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.082219090043798,
   "gap": 3.458645132844329,
   "atrPct": 9.353920283092327,
   "spyGap": 0.09638147445056866,
   "spyTrend": "market uptrend",
   "spyVol": 19.56174364392385
  },
  {
   "date": "2021-12-28",
   "sym": "ALGM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 37.83,
   "stopDist": 0.7190687997000559,
   "marketAgainst": false,
   "volRatio": 0.6008342281928222,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8677890074778468,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bull flag",
   "rvol": 3.0313206726587416,
   "gap": 1.231799452016391,
   "atrPct": 5.03267619769346,
   "spyGap": 0.09638147445056866,
   "spyTrend": "market uptrend",
   "spyVol": 19.56174364392385
  },
  {
   "date": "2021-12-29",
   "sym": "VSXY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.507781445388761,
   "minute": 45,
   "dir": "long",
   "entry": 54.475,
   "stopDist": 0.8628571646554131,
   "marketAgainst": true,
   "volRatio": 1.016403338684844,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6559602483292064,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 11.490951735596834,
   "gap": 7.431037531656948,
   "atrPct": 4.440392816658114,
   "spyGap": 0.027262122621185547,
   "spyTrend": "market uptrend",
   "spyVol": 17.944289313985017
  },
  {
   "date": "2021-12-29",
   "sym": "SBGI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.062207623697621464,
   "minute": 35,
   "dir": "short",
   "entry": 25.345,
   "stopDist": 0.40958012172154024,
   "marketAgainst": false,
   "volRatio": 1.4828229269571176,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.610381184880761,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 2.730198308699481,
   "gap": -0.38505705043692107,
   "atrPct": 3.9428199128881256,
   "spyGap": 0.027262122621185547,
   "spyTrend": "market uptrend",
   "spyVol": 17.944289313985017
  },
  {
   "date": "2021-12-30",
   "sym": "BIIB",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.017586767460607312,
   "minute": 40,
   "dir": "short",
   "entry": 239.2,
   "stopDist": 3.0851597377232145,
   "marketAgainst": false,
   "volRatio": 1.4983422311660541,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7442078191044997,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "strong bear candle",
   "rvol": 5.5778598376970185,
   "gap": -5.079167543880169,
   "atrPct": 2.985908179012111,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-30",
   "sym": "HIMX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.10182972675659807,
   "minute": 35,
   "dir": "short",
   "entry": 14.64,
   "stopDist": 0.3279970986502512,
   "marketAgainst": false,
   "volRatio": 0.49112625586746766,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8517148509837463,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "three black crows",
   "rvol": 3.15026556880992,
   "gap": 1.586206896551734,
   "atrPct": 5.655122390521571,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-30",
   "sym": "SBGI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.45186736563564517,
   "minute": 35,
   "dir": "long",
   "entry": 26.54,
   "stopDist": 0.418437249319894,
   "marketAgainst": false,
   "volRatio": 1.3442923481330535,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6787158659072515,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 1.76623557806331,
   "gap": 0.7128712871287135,
   "atrPct": 4.142943062573208,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-30",
   "sym": "QFIN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.26449508897290436,
   "minute": 35,
   "dir": "long",
   "entry": 21.79,
   "stopDist": 0.6041429792131696,
   "marketAgainst": false,
   "volRatio": 0.44192245165894944,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7547882135349657,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.6717007925390033,
   "gap": 0.9443297854943911,
   "atrPct": 7.506746446490063,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-30",
   "sym": "KWEB",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.03862346422578081,
   "minute": 35,
   "dir": "long",
   "entry": 36.23,
   "stopDist": 0.7334400721958706,
   "marketAgainst": false,
   "volRatio": 0.563952429840425,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6162739358469198,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.6156734254960385,
   "gap": 0.5284751011493949,
   "atrPct": 5.383441299352204,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-30",
   "sym": "SOFI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.22910685890327503,
   "minute": 45,
   "dir": "long",
   "entry": 15.57,
   "stopDist": 0.3582857131958008,
   "marketAgainst": false,
   "volRatio": 0.9865320801336545,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6077830959477735,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 1.4092049536323368,
   "gap": 0.24187790134975184,
   "atrPct": 6.190146969316007,
   "spyGap": 0.09424248205538444,
   "spyTrend": "market uptrend",
   "spyVol": 17.223281433485667
  },
  {
   "date": "2021-12-31",
   "sym": "HUYA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 45,
   "dir": "long",
   "entry": 7.12,
   "stopDist": 0.20651427677699496,
   "marketAgainst": false,
   "volRatio": 1.630184921763869,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8522413207782931,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bullish engulfing",
   "rvol": 2.382133975130365,
   "gap": -1.5988388460929204,
   "atrPct": 7.504152374341083,
   "spyGap": -0.10920775749959644,
   "spyTrend": "market uptrend",
   "spyVol": 16.713806731475728
  },
  {
   "date": "2021-12-31",
   "sym": "HIMX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 16.23,
   "stopDist": 0.34256853376116075,
   "marketAgainst": true,
   "volRatio": 1.436863210385075,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6071777746668867,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "outside bar",
   "rvol": 1.3199295312470078,
   "gap": -0.06587816188891038,
   "atrPct": 5.64177415800773,
   "spyGap": -0.10920775749959644,
   "spyTrend": "market uptrend",
   "spyVol": 16.713806731475728
  },
  {
   "date": "2021-12-31",
   "sym": "XEL",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 100,
   "dir": "short",
   "entry": 66.73,
   "stopDist": 0.43414241245814733,
   "marketAgainst": false,
   "volRatio": 13.573915471979147,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6265225239338225,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bear candle",
   "rvol": 1.313521087325496,
   "gap": -1.2018222432789383,
   "atrPct": 1.5907313172293336,
   "spyGap": -0.10920775749959644,
   "spyTrend": "market uptrend",
   "spyVol": 16.713806731475728
  }
 ]
}
```
