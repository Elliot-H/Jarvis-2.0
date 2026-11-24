# Elis year test 2016

Out-of-sample year 2016 (229 sessions, formulas found on 2024-2025, never on 2016). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 73 trades, 45% wins, avg 0R, total 0.1R -> $3,000 became $2,947 (-1.8%, max drawdown 12.2%)
- midday, against the market, S&P flat at the open -> go with the stock: 60 trades, 45% wins, avg -0.01R, total -0.6R -> $3,000 became $2,932 (-2.3%, max drawdown 10.1%)
- midday, against the market, normal volume -> go with the stock: 45 trades, 44% wins, avg -0.1R, total -4.5R -> $3,000 became $2,862 (-4.6%, max drawdown 11.7%)
- afternoon, far from VWAP in the move direction -> go with the stock: 227 trades, 38% wins, avg -0.12R, total -26.5R -> $3,000 became $2,403 (-19.9%, max drawdown 19.9%)
- strong move alone (control) -> go with the stock: 2232 trades, 41% wins, avg -0.11R, total -243.9R -> $3,000 became $1,131 (-62.3%, max drawdown 62.9%)

```json
{
 "year": "2016",
 "sessions": 229,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 73,
   "winPct": 45,
   "avgR": 0,
   "totalR": 0.1,
   "money3k": {
    "start": 3000,
    "end": 2947,
    "returnPct": -1.8,
    "maxDrawdownPct": 12.2
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 60,
   "winPct": 45,
   "avgR": -0.01,
   "totalR": -0.6,
   "money3k": {
    "start": 3000,
    "end": 2932,
    "returnPct": -2.3,
    "maxDrawdownPct": 10.1
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 45,
   "winPct": 44,
   "avgR": -0.1,
   "totalR": -4.5,
   "money3k": {
    "start": 3000,
    "end": 2862,
    "returnPct": -4.6,
    "maxDrawdownPct": 11.7
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 227,
   "winPct": 38,
   "avgR": -0.12,
   "totalR": -26.5,
   "money3k": {
    "start": 3000,
    "end": 2403,
    "returnPct": -19.9,
    "maxDrawdownPct": 19.9
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2232,
   "winPct": 41,
   "avgR": -0.11,
   "totalR": -243.9,
   "money3k": {
    "start": 3000,
    "end": 1131,
    "returnPct": -62.3,
    "maxDrawdownPct": 62.9
   }
  }
 },
 "trades": 2637,
 "why": {
  "n": 2232,
  "overall": -0.11,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 1502,
     "avgR": -0.1,
     "winPct": 41
    },
    "market downtrend": {
     "n": 730,
     "avgR": -0.13,
     "winPct": 42
    }
   },
   "market volatility": {
    "nervous market (18-28%)": {
     "n": 287,
     "avgR": -0.13,
     "winPct": 39
    },
    "normal market (12-18%)": {
     "n": 243,
     "avgR": -0.11,
     "winPct": 42
    },
    "calm market (<12%)": {
     "n": 1702,
     "avgR": -0.11,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped down": {
     "n": 409,
     "avgR": -0.1,
     "winPct": 44
    },
    "S&P gapped down hard": {
     "n": 112,
     "avgR": -0.25,
     "winPct": 35
    },
    "S&P gapped up": {
     "n": 401,
     "avgR": -0.09,
     "winPct": 42
    },
    "S&P gapped up hard": {
     "n": 57,
     "avgR": -0.22,
     "winPct": 32
    },
    "S&P flat": {
     "n": 1253,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "time of day": {
    "first hour": {
     "n": 1658,
     "avgR": -0.13,
     "winPct": 41
    },
    "10:30-11:30": {
     "n": 337,
     "avgR": -0.06,
     "winPct": 43
    },
    "last 90 min": {
     "n": 47,
     "avgR": 0.02,
     "winPct": 34
    },
    "1:00-2:30": {
     "n": 58,
     "avgR": 0.11,
     "winPct": 48
    },
    "11:30-1:00": {
     "n": 132,
     "avgR": -0.17,
     "winPct": 39
    }
   },
   "side": {
    "long": {
     "n": 1156,
     "avgR": -0.15,
     "winPct": 39
    },
    "short": {
     "n": 1076,
     "avgR": -0.06,
     "winPct": 44
    }
   },
   "moving against the market": {
    "no": {
     "n": 2006,
     "avgR": -0.12,
     "winPct": 41
    },
    "yes": {
     "n": 226,
     "avgR": -0.02,
     "winPct": 48
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 958,
     "avgR": -0.11,
     "winPct": 43
    },
    "rising": {
     "n": 253,
     "avgR": -0.11,
     "winPct": 39
    },
    "normal": {
     "n": 936,
     "avgR": -0.12,
     "winPct": 41
    },
    "surging": {
     "n": 85,
     "avgR": -0.01,
     "winPct": 39
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 1192,
     "avgR": -0.08,
     "winPct": 43
    },
    "with the move, far": {
     "n": 990,
     "avgR": -0.13,
     "winPct": 40
    },
    "against the move": {
     "n": 49,
     "avgR": -0.28,
     "winPct": 33
    },
    "against the move, far": {
     "n": 1,
     "avgR": 2.36,
     "winPct": 100
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 1459,
     "avgR": -0.11,
     "winPct": 42
    },
    "1.2x+ range": {
     "n": 208,
     "avgR": -0.1,
     "winPct": 40
    },
    "0.8-1.2x range": {
     "n": 565,
     "avgR": -0.12,
     "winPct": 41
    }
   },
   "stock opening gap": {
    "gap down 4%+": {
     "n": 373,
     "avgR": -0.19,
     "winPct": 39
    },
    "gap up 1-4%": {
     "n": 380,
     "avgR": -0.07,
     "winPct": 41
    },
    "gap up 4%+": {
     "n": 456,
     "avgR": -0.09,
     "winPct": 42
    },
    "no gap": {
     "n": 620,
     "avgR": -0.08,
     "winPct": 44
    },
    "gap down 1-4%": {
     "n": 403,
     "avgR": -0.14,
     "winPct": 40
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 596,
     "avgR": -0.15,
     "winPct": 42
    },
    "4-8x": {
     "n": 771,
     "avgR": -0.14,
     "winPct": 40
    },
    "2-4x": {
     "n": 807,
     "avgR": -0.06,
     "winPct": 42
    },
    "1-2x normal": {
     "n": 58,
     "avgR": 0,
     "winPct": 45
    }
   },
   "stock volatility": {
    "normal stock": {
     "n": 656,
     "avgR": -0.05,
     "winPct": 43
    },
    "jumpy stock": {
     "n": 116,
     "avgR": -0.14,
     "winPct": 40
    },
    "calm stock": {
     "n": 1441,
     "avgR": -0.13,
     "winPct": 41
    },
    "very jumpy stock": {
     "n": 19,
     "avgR": -0.16,
     "winPct": 37
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2232,
     "avgR": -0.11,
     "winPct": 41
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2232,
     "avgR": -0.11,
     "winPct": 41
    }
   },
   "overnight news": {
    "none": {
     "n": 2232,
     "avgR": -0.11,
     "winPct": 41
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2232,
     "avgR": -0.11,
     "winPct": 41
    }
   },
   "sector": {
    "no sector": {
     "n": 83,
     "avgR": -0.13,
     "winPct": 41
    },
    "sector with the move": {
     "n": 1206,
     "avgR": -0.09,
     "winPct": 41
    },
    "sector against the move": {
     "n": 291,
     "avgR": -0.09,
     "winPct": 44
    },
    "sector flat": {
     "n": 652,
     "avgR": -0.15,
     "winPct": 41
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1135,
     "avgR": -0.1,
     "winPct": 41
    },
    "candle-none": {
     "n": 585,
     "avgR": -0.1,
     "winPct": 42
    },
    "candle-mild": {
     "n": 252,
     "avgR": -0.19,
     "winPct": 39
    },
    "candle-against": {
     "n": 260,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1140,
     "avgR": -0.09,
     "winPct": 43
    },
    "range": {
     "n": 1013,
     "avgR": -0.13,
     "winPct": 39
    },
    "trend-against": {
     "n": 79,
     "avgR": -0.13,
     "winPct": 47
    }
   },
   "latest candle pattern": {
    "tweezer bottom": {
     "n": 34,
     "avgR": -0.05,
     "winPct": 50
    },
    "three white soldiers": {
     "n": 457,
     "avgR": -0.12,
     "winPct": 41
    },
    "inside bar": {
     "n": 249,
     "avgR": -0.1,
     "winPct": 42
    },
    "three black crows": {
     "n": 401,
     "avgR": -0.09,
     "winPct": 43
    },
    "none": {
     "n": 345,
     "avgR": -0.11,
     "winPct": 40
    },
    "hammer": {
     "n": 19,
     "avgR": -0.1,
     "winPct": 37
    },
    "bullish engulfing": {
     "n": 73,
     "avgR": -0.28,
     "winPct": 33
    },
    "strong bull candle": {
     "n": 74,
     "avgR": -0.17,
     "winPct": 38
    },
    "spinning top": {
     "n": 52,
     "avgR": 0.06,
     "winPct": 58
    },
    "outside bar": {
     "n": 99,
     "avgR": -0.09,
     "winPct": 44
    },
    "hanging man": {
     "n": 12,
     "avgR": -0.32,
     "winPct": 33
    },
    "piercing line": {
     "n": 8,
     "avgR": -0.36,
     "winPct": 25
    },
    "strong bear candle": {
     "n": 61,
     "avgR": -0.16,
     "winPct": 36
    },
    "bull flag": {
     "n": 29,
     "avgR": -0.07,
     "winPct": 41
    },
    "dragonfly doji": {
     "n": 25,
     "avgR": 0.19,
     "winPct": 48
    },
    "shooting star": {
     "n": 13,
     "avgR": -0.17,
     "winPct": 38
    },
    "bear flag": {
     "n": 12,
     "avgR": -0.12,
     "winPct": 33
    },
    "inverted hammer": {
     "n": 15,
     "avgR": 0.06,
     "winPct": 60
    },
    "dark cloud cover": {
     "n": 5,
     "avgR": -0.07,
     "winPct": 60
    },
    "doji": {
     "n": 26,
     "avgR": -0.12,
     "winPct": 46
    },
    "bearish marubozu": {
     "n": 26,
     "avgR": -0.09,
     "winPct": 46
    },
    "bearish engulfing": {
     "n": 63,
     "avgR": -0.18,
     "winPct": 33
    },
    "tweezer top": {
     "n": 32,
     "avgR": -0.23,
     "winPct": 25
    },
    "bullish marubozu": {
     "n": 23,
     "avgR": 0.26,
     "winPct": 48
    },
    "bearish harami": {
     "n": 14,
     "avgR": -0.32,
     "winPct": 36
    },
    "evening star": {
     "n": 14,
     "avgR": -0.35,
     "winPct": 29
    },
    "morning star": {
     "n": 23,
     "avgR": -0.13,
     "winPct": 43
    },
    "bullish harami": {
     "n": 10,
     "avgR": -0.15,
     "winPct": 50
    },
    "gravestone doji": {
     "n": 18,
     "avgR": 0.23,
     "winPct": 33
    }
   },
   "month": {
    "2016-02": {
     "n": 149,
     "avgR": -0.17,
     "winPct": 39
    },
    "2016-03": {
     "n": 145,
     "avgR": -0.08,
     "winPct": 41
    },
    "2016-04": {
     "n": 253,
     "avgR": -0.09,
     "winPct": 42
    },
    "2016-05": {
     "n": 210,
     "avgR": -0.15,
     "winPct": 43
    },
    "2016-06": {
     "n": 151,
     "avgR": -0.07,
     "winPct": 44
    },
    "2016-07": {
     "n": 189,
     "avgR": -0.12,
     "winPct": 39
    },
    "2016-08": {
     "n": 290,
     "avgR": -0.13,
     "winPct": 38
    },
    "2016-09": {
     "n": 196,
     "avgR": -0.07,
     "winPct": 43
    },
    "2016-10": {
     "n": 219,
     "avgR": -0.11,
     "winPct": 43
    },
    "2016-11": {
     "n": 254,
     "avgR": -0.12,
     "winPct": 40
    },
    "2016-12": {
     "n": 176,
     "avgR": -0.06,
     "winPct": 43
    }
   }
  },
  "text": "Overall -0.11R avg over 2232 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "whyFormula": {
  "n": 73,
  "overall": 0,
  "findings": [
   {
    "dim": "month",
    "value": "2016-11",
    "n": 19,
    "avgR": 0.58,
    "winPct": 68,
    "z": 2.32,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 32,
     "avgR": -0.13,
     "winPct": 38
    },
    "market uptrend": {
     "n": 41,
     "avgR": 0.11,
     "winPct": 51
    }
   },
   "market volatility": {
    "nervous market (18-28%)": {
     "n": 14,
     "avgR": -0.36,
     "winPct": 36
    },
    "normal market (12-18%)": {
     "n": 7,
     "avgR": -0.51,
     "winPct": 29
    },
    "calm market (<12%)": {
     "n": 52,
     "avgR": 0.17,
     "winPct": 50
    }
   },
   "S&P gap at the open": {
    "S&P gapped down hard": {
     "n": 6,
     "avgR": 0.47,
     "winPct": 67
    },
    "S&P gapped up": {
     "n": 16,
     "avgR": 0.18,
     "winPct": 50
    },
    "S&P gapped down": {
     "n": 11,
     "avgR": -0.47,
     "winPct": 27
    },
    "S&P flat": {
     "n": 40,
     "avgR": -0.01,
     "winPct": 45
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 38,
     "avgR": 0.07,
     "winPct": 47
    },
    "11:30-1:00": {
     "n": 35,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "side": {
    "long": {
     "n": 44,
     "avgR": 0.02,
     "winPct": 50
    },
    "short": {
     "n": 29,
     "avgR": -0.02,
     "winPct": 38
    }
   },
   "moving against the market": {
    "yes": {
     "n": 73,
     "avgR": 0,
     "winPct": 45
    }
   },
   "volume on the signal candle": {
    "rising": {
     "n": 19,
     "avgR": 0.03,
     "winPct": 37
    },
    "normal": {
     "n": 39,
     "avgR": -0.08,
     "winPct": 44
    },
    "fading": {
     "n": 11,
     "avgR": -0.07,
     "winPct": 55
    },
    "surging": {
     "n": 4,
     "avgR": 0.86,
     "winPct": 75
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 51,
     "avgR": -0.01,
     "winPct": 45
    },
    "with the move": {
     "n": 17,
     "avgR": 0.26,
     "winPct": 59
    },
    "against the move": {
     "n": 5,
     "avgR": -0.74,
     "winPct": 0
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 17,
     "avgR": 0,
     "winPct": 35
    },
    "0.6-0.8x range": {
     "n": 53,
     "avgR": 0.06,
     "winPct": 51
    },
    "1.2x+ range": {
     "n": 3,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "stock opening gap": {
    "gap down 1-4%": {
     "n": 12,
     "avgR": 0.4,
     "winPct": 67
    },
    "gap up 1-4%": {
     "n": 20,
     "avgR": -0.18,
     "winPct": 45
    },
    "no gap": {
     "n": 12,
     "avgR": 0.06,
     "winPct": 42
    },
    "gap up 4%+": {
     "n": 18,
     "avgR": 0.25,
     "winPct": 44
    },
    "gap down 4%+": {
     "n": 11,
     "avgR": -0.58,
     "winPct": 27
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 26,
     "avgR": 0.2,
     "winPct": 50
    },
    "2-4x": {
     "n": 16,
     "avgR": -0.07,
     "winPct": 44
    },
    "8x+": {
     "n": 30,
     "avgR": -0.15,
     "winPct": 40
    },
    "1-2x normal": {
     "n": 1,
     "avgR": 0.59,
     "winPct": 100
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 43,
     "avgR": -0.25,
     "winPct": 35
    },
    "normal stock": {
     "n": 26,
     "avgR": 0.41,
     "winPct": 62
    },
    "jumpy stock": {
     "n": 4,
     "avgR": 0.01,
     "winPct": 50
    }
   },
   "news in the last hour": {
    "none": {
     "n": 73,
     "avgR": 0,
     "winPct": 45
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 73,
     "avgR": 0,
     "winPct": 45
    }
   },
   "overnight news": {
    "none": {
     "n": 73,
     "avgR": 0,
     "winPct": 45
    }
   },
   "type of overnight news": {
    "none": {
     "n": 73,
     "avgR": 0,
     "winPct": 45
    }
   },
   "sector": {
    "sector against the move": {
     "n": 33,
     "avgR": -0.11,
     "winPct": 36
    },
    "no sector": {
     "n": 5,
     "avgR": 0.45,
     "winPct": 40
    },
    "sector with the move": {
     "n": 13,
     "avgR": 0.37,
     "winPct": 77
    },
    "sector flat": {
     "n": 22,
     "avgR": -0.15,
     "winPct": 41
    }
   },
   "candle read": {
    "candle-with": {
     "n": 46,
     "avgR": -0.18,
     "winPct": 37
    },
    "candle-mild": {
     "n": 10,
     "avgR": 0.17,
     "winPct": 50
    },
    "candle-against": {
     "n": 7,
     "avgR": 0.78,
     "winPct": 71
    },
    "candle-none": {
     "n": 10,
     "avgR": 0.11,
     "winPct": 60
    }
   },
   "chart structure": {
    "range": {
     "n": 25,
     "avgR": 0.28,
     "winPct": 56
    },
    "trend-with": {
     "n": 47,
     "avgR": -0.12,
     "winPct": 40
    },
    "trend-against": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "latest candle pattern": {
    "bullish engulfing": {
     "n": 3,
     "avgR": 1.2,
     "winPct": 67
    },
    "three white soldiers": {
     "n": 21,
     "avgR": -0.29,
     "winPct": 33
    },
    "tweezer bottom": {
     "n": 3,
     "avgR": -0.58,
     "winPct": 0
    },
    "strong bull candle": {
     "n": 5,
     "avgR": 0.29,
     "winPct": 60
    },
    "bearish engulfing": {
     "n": 2,
     "avgR": 1.08,
     "winPct": 50
    },
    "inside bar": {
     "n": 3,
     "avgR": -0.38,
     "winPct": 33
    },
    "none": {
     "n": 8,
     "avgR": 0.11,
     "winPct": 63
    },
    "three black crows": {
     "n": 17,
     "avgR": -0.44,
     "winPct": 24
    },
    "evening star": {
     "n": 1,
     "avgR": 0.73,
     "winPct": 100
    },
    "morning star": {
     "n": 1,
     "avgR": 0.21,
     "winPct": 100
    },
    "strong bear candle": {
     "n": 1,
     "avgR": -0.1,
     "winPct": 0
    },
    "spinning top": {
     "n": 2,
     "avgR": 0.75,
     "winPct": 100
    },
    "dragonfly doji": {
     "n": 2,
     "avgR": 2.33,
     "winPct": 100
    },
    "bullish marubozu": {
     "n": 1,
     "avgR": 0.23,
     "winPct": 100
    },
    "bearish marubozu": {
     "n": 1,
     "avgR": 0.07,
     "winPct": 100
    },
    "bearish harami": {
     "n": 1,
     "avgR": 0.7,
     "winPct": 100
    },
    "outside bar": {
     "n": 1,
     "avgR": 0.31,
     "winPct": 100
    }
   },
   "month": {
    "2016-02": {
     "n": 11,
     "avgR": -0.4,
     "winPct": 36
    },
    "2016-03": {
     "n": 4,
     "avgR": -0.58,
     "winPct": 25
    },
    "2016-04": {
     "n": 8,
     "avgR": -0.03,
     "winPct": 25
    },
    "2016-05": {
     "n": 4,
     "avgR": -0.36,
     "winPct": 25
    },
    "2016-06": {
     "n": 3,
     "avgR": -0.34,
     "winPct": 33
    },
    "2016-07": {
     "n": 4,
     "avgR": 0.19,
     "winPct": 50
    },
    "2016-08": {
     "n": 4,
     "avgR": 0.09,
     "winPct": 50
    },
    "2016-09": {
     "n": 5,
     "avgR": -0.61,
     "winPct": 20
    },
    "2016-10": {
     "n": 8,
     "avgR": 0.01,
     "winPct": 50
    },
    "2016-11": {
     "n": 19,
     "avgR": 0.58,
     "winPct": 68
    },
    "2016-12": {
     "n": 3,
     "avgR": 0.15,
     "winPct": 67
    }
   }
  },
  "text": "Overall +0R avg over 73 trades.\nMade money when:\n  + month = 2016-11: +0.58R avg, 68% wins, 19 trades\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2016-12-29",
   "sym": "ENLK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.1872135477162134,
   "minute": 35,
   "dir": "long",
   "entry": 18.69,
   "stopDist": 0.21863730294363842,
   "marketAgainst": false,
   "volRatio": 0.3532881712030815,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6037396099513195,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 10.35253262432513,
   "gap": 0.16111256398758655,
   "atrPct": 2.9355168245072956,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "B",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": 0.3130630416734806,
   "minute": 90,
   "dir": "long",
   "entry": 16.335,
   "stopDist": 0.22200001307896208,
   "marketAgainst": true,
   "volRatio": 1.8408708991447984,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6036035680427575,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "outside bar",
   "rvol": 2.2087043410244287,
   "gap": 2.0942426218654386,
   "atrPct": 3.6321992303430854,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "B",
   "formula": "midday, against the market, S&P flat at the open -> go with the stock",
   "R": 0.3130630416734806,
   "minute": 90,
   "dir": "long",
   "entry": 16.335,
   "stopDist": 0.22200001307896208,
   "marketAgainst": true,
   "volRatio": 1.8408708991447984,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6036035680427575,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "outside bar",
   "rvol": 2.2087043410244287,
   "gap": 2.0942426218654386,
   "atrPct": 3.6321992303430854,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "B",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3130630416734806,
   "minute": 90,
   "dir": "long",
   "entry": 16.335,
   "stopDist": 0.22200001307896208,
   "marketAgainst": true,
   "volRatio": 1.8408708991447984,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6036035680427575,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "outside bar",
   "rvol": 2.2087043410244287,
   "gap": 2.0942426218654386,
   "atrPct": 3.6321992303430854,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "GDXJ",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.33843672213452536,
   "minute": 100,
   "dir": "long",
   "entry": 32.52,
   "stopDist": 0.5406285967145648,
   "marketAgainst": false,
   "volRatio": 1.7969232245723248,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6140999607079359,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.9660151810041075,
   "gap": 0.9787940789674598,
   "atrPct": 4.409694970988787,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "AEM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.4704835292408304,
   "minute": 35,
   "dir": "long",
   "entry": 42.48,
   "stopDist": 0.5956000191824777,
   "marketAgainst": false,
   "volRatio": 0.7173920420482696,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6044324855699912,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 1.8182536127991011,
   "gap": 1.382716049382715,
   "atrPct": 3.676543328286899,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "ALNY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.39993813214679785,
   "minute": 35,
   "dir": "short",
   "entry": 38.7,
   "stopDist": 0.7429884774344309,
   "marketAgainst": false,
   "volRatio": 0.4871767191524143,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6514232921501946,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 1.684388744455188,
   "gap": -0.4748771044835176,
   "atrPct": 4.642517549385635,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "NUGT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.2501072081307591,
   "minute": 35,
   "dir": "long",
   "entry": 158,
   "stopDist": 5.33142809186663,
   "marketAgainst": false,
   "volRatio": 0.5772725787707516,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6872455066194405,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.6592830626174164,
   "gap": -94.83825586672016,
   "atrPct": 9.373115693186612,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "WPM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.052710235615393834,
   "minute": 35,
   "dir": "long",
   "entry": 19.7,
   "stopDist": 0.2582801273890904,
   "marketAgainst": false,
   "volRatio": 1.0880282681444713,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.1770166101166326,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 1.1891130085809845,
   "gap": 1.785716807023996,
   "atrPct": 3.494049428935146,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "WPM",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": 0.5872925461355207,
   "minute": 90,
   "dir": "long",
   "entry": 20.0354,
   "stopDist": 0.2582801273890904,
   "marketAgainst": true,
   "volRatio": 1.2171881343053983,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7362548637492752,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.1891130085809845,
   "gap": 1.785716807023996,
   "atrPct": 3.494049428935146,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "WPM",
   "formula": "midday, against the market, S&P flat at the open -> go with the stock",
   "R": 0.5872925461355207,
   "minute": 90,
   "dir": "long",
   "entry": 20.0354,
   "stopDist": 0.2582801273890904,
   "marketAgainst": true,
   "volRatio": 1.2171881343053983,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7362548637492752,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.1891130085809845,
   "gap": 1.785716807023996,
   "atrPct": 3.494049428935146,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-29",
   "sym": "WPM",
   "formula": "midday, against the market, normal volume -> go with the stock",
   "R": 0.5872925461355207,
   "minute": 90,
   "dir": "long",
   "entry": 20.0354,
   "stopDist": 0.2582801273890904,
   "marketAgainst": true,
   "volRatio": 1.2171881343053983,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7362548637492752,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.1891130085809845,
   "gap": 1.785716807023996,
   "atrPct": 3.494049428935146,
   "spyGap": 0.022281925700973204,
   "spyTrend": "market downtrend",
   "spyVol": 8.451921868737207
  },
  {
   "date": "2016-12-30",
   "sym": "MBLY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.25827438331919145,
   "minute": 35,
   "dir": "short",
   "entry": 37.735,
   "stopDist": 0.5041426522391184,
   "marketAgainst": false,
   "volRatio": 0.8815985060845587,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6188724532912893,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "spinning top",
   "rvol": 2.36961524166278,
   "gap": -0.052025565617708214,
   "atrPct": 3.2787634641643075,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "GDXJ",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.537787642070085,
   "minute": 65,
   "dir": "short",
   "entry": 32.88,
   "stopDist": 0.6047713688441685,
   "marketAgainst": false,
   "volRatio": 1.3345420589948898,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7267539811615156,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer top",
   "rvol": 2.206748404206825,
   "gap": 0.11947568193126923,
   "atrPct": 4.515915301023419,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "NUGT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.34773159261496367,
   "minute": 65,
   "dir": "short",
   "entry": 167.6,
   "stopDist": 6.045713806152344,
   "marketAgainst": false,
   "volRatio": 1.2161181283069908,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9924386420498728,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "evening star",
   "rvol": 1.8727343373408754,
   "gap": -94.95949082975935,
   "atrPct": 8.746692273410298,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "WPM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5940798851394262,
   "minute": 55,
   "dir": "short",
   "entry": 20.22,
   "stopDist": 0.2949944632393973,
   "marketAgainst": false,
   "volRatio": 1.1063315479751537,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6644192499333136,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.7302534887433434,
   "gap": 0.2472833251407902,
   "atrPct": 3.6473105002106183,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "GDX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.25721903667414414,
   "minute": 65,
   "dir": "short",
   "entry": 21.5089,
   "stopDist": 0.2948570796421596,
   "marketAgainst": false,
   "volRatio": 0.8683747710605376,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8425777000216773,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "evening star",
   "rvol": 1.368392792908815,
   "gap": -0.13748714593857514,
   "atrPct": 3.378289227383682,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "QQQ",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.026330393757327375,
   "minute": 35,
   "dir": "short",
   "entry": 118.86,
   "stopDist": 0.4224827357700893,
   "marketAgainst": false,
   "volRatio": 1.1172142881746416,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7574273997651338,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "doji",
   "rvol": 1.268829936983126,
   "gap": 0.15034979741193055,
   "atrPct": 0.8822308959704336,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "RGLD",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.19249077521845753,
   "minute": 50,
   "dir": "short",
   "entry": 66.35,
   "stopDist": 0.8866316659109933,
   "marketAgainst": false,
   "volRatio": 1.3489441376531652,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.686508302604554,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.1725797188721432,
   "gap": 0.9145473458284537,
   "atrPct": 3.3232072956427605,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  },
  {
   "date": "2016-12-30",
   "sym": "AG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.02042936788046583,
   "minute": 65,
   "dir": "short",
   "entry": 8.0201,
   "stopDist": 0.20628574916294645,
   "marketAgainst": false,
   "volRatio": 1.7334122143420823,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7385871327429896,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer top",
   "rvol": 1.1673981267549174,
   "gap": 1.3414657718720413,
   "atrPct": 6.28919981589101,
   "spyGap": 0.17830792389799122,
   "spyTrend": "market downtrend",
   "spyVol": 8.285932791761823
  }
 ]
}
```
