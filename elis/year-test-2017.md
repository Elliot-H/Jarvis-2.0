# Elis year test 2017

Out-of-sample year 2017 (251 sessions, formulas found on 2024-2025, never on 2017). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 72 trades, 47% wins, avg 0.05R, total 3.5R -> $3,000 became $3,142 (+4.7%, max drawdown 3.9%)
- midday, against the market, S&P flat at the open -> go with the stock: 64 trades, 48% wins, avg 0.08R, total 4.8R -> $3,000 became $3,185 (+6.2%, max drawdown 4.7%)
- midday, against the market, normal volume -> go with the stock: 41 trades, 39% wins, avg -0.11R, total -4.6R -> $3,000 became $2,860 (-4.7%, max drawdown 7.3%)
- afternoon, far from VWAP in the move direction -> go with the stock: 326 trades, 39% wins, avg -0.16R, total -50.9R -> $3,000 became $1,890 (-37%, max drawdown 37%)
- strong move alone (control) -> go with the stock: 2951 trades, 42% wins, avg -0.1R, total -287.1R -> $3,000 became $1,575 (-47.5%, max drawdown 56.2%)

```json
{
 "year": "2017",
 "sessions": 251,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 72,
   "winPct": 47,
   "avgR": 0.05,
   "totalR": 3.5,
   "money3k": {
    "start": 3000,
    "end": 3142,
    "returnPct": 4.7,
    "maxDrawdownPct": 3.9
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 64,
   "winPct": 48,
   "avgR": 0.08,
   "totalR": 4.8,
   "money3k": {
    "start": 3000,
    "end": 3185,
    "returnPct": 6.2,
    "maxDrawdownPct": 4.7
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 41,
   "winPct": 39,
   "avgR": -0.11,
   "totalR": -4.6,
   "money3k": {
    "start": 3000,
    "end": 2860,
    "returnPct": -4.7,
    "maxDrawdownPct": 7.3
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 326,
   "winPct": 39,
   "avgR": -0.16,
   "totalR": -50.9,
   "money3k": {
    "start": 3000,
    "end": 1890,
    "returnPct": -37,
    "maxDrawdownPct": 37
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2951,
   "winPct": 42,
   "avgR": -0.1,
   "totalR": -287.1,
   "money3k": {
    "start": 3000,
    "end": 1575,
    "returnPct": -47.5,
    "maxDrawdownPct": 56.2
   }
  }
 },
 "trades": 3454,
 "why": {
  "n": 2951,
  "overall": -0.1,
  "findings": [
   {
    "dim": "size of the 30-min move",
    "value": "1.2x+ range",
    "n": 337,
    "avgR": -0.24,
    "winPct": 33,
    "z": -2.95,
    "better": false
   },
   {
    "dim": "candle read",
    "value": "candle-against",
    "n": 379,
    "avgR": 0.01,
    "winPct": 47,
    "z": 2.35,
    "better": true
   },
   {
    "dim": "candle read",
    "value": "candle-mild",
    "n": 368,
    "avgR": -0.2,
    "winPct": 37,
    "z": -2.22,
    "better": false
   },
   {
    "dim": "latest candle pattern",
    "value": "strong bear candle",
    "n": 101,
    "avgR": -0.28,
    "winPct": 33,
    "z": -2.07,
    "better": false
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 487,
     "avgR": -0.08,
     "winPct": 43
    },
    "market uptrend": {
     "n": 2464,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 2951,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 552,
     "avgR": -0.11,
     "winPct": 41
    },
    "S&P flat": {
     "n": 2069,
     "avgR": -0.08,
     "winPct": 43
    },
    "S&P gapped down": {
     "n": 282,
     "avgR": -0.14,
     "winPct": 40
    },
    "S&P gapped up hard": {
     "n": 24,
     "avgR": -0.32,
     "winPct": 42
    },
    "S&P gapped down hard": {
     "n": 24,
     "avgR": -0.14,
     "winPct": 50
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 456,
     "avgR": -0.05,
     "winPct": 45
    },
    "first hour": {
     "n": 2269,
     "avgR": -0.11,
     "winPct": 42
    },
    "1:00-2:30": {
     "n": 58,
     "avgR": -0.07,
     "winPct": 41
    },
    "11:30-1:00": {
     "n": 140,
     "avgR": -0.06,
     "winPct": 44
    },
    "last 90 min": {
     "n": 28,
     "avgR": -0.24,
     "winPct": 39
    }
   },
   "side": {
    "short": {
     "n": 1494,
     "avgR": -0.07,
     "winPct": 44
    },
    "long": {
     "n": 1457,
     "avgR": -0.13,
     "winPct": 41
    }
   },
   "moving against the market": {
    "no": {
     "n": 2796,
     "avgR": -0.1,
     "winPct": 42
    },
    "yes": {
     "n": 155,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 1229,
     "avgR": -0.1,
     "winPct": 42
    },
    "fading": {
     "n": 1284,
     "avgR": -0.11,
     "winPct": 42
    },
    "surging": {
     "n": 88,
     "avgR": -0.08,
     "winPct": 40
    },
    "rising": {
     "n": 350,
     "avgR": -0.04,
     "winPct": 44
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1347,
     "avgR": -0.12,
     "winPct": 41
    },
    "with the move": {
     "n": 1558,
     "avgR": -0.08,
     "winPct": 44
    },
    "against the move": {
     "n": 46,
     "avgR": -0.22,
     "winPct": 39
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 818,
     "avgR": -0.09,
     "winPct": 43
    },
    "0.6-0.8x range": {
     "n": 1796,
     "avgR": -0.07,
     "winPct": 44
    },
    "1.2x+ range": {
     "n": 337,
     "avgR": -0.24,
     "winPct": 33
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 918,
     "avgR": -0.09,
     "winPct": 43
    },
    "gap up 4%+": {
     "n": 533,
     "avgR": -0.08,
     "winPct": 45
    },
    "gap down 1-4%": {
     "n": 515,
     "avgR": -0.08,
     "winPct": 45
    },
    "gap up 1-4%": {
     "n": 587,
     "avgR": -0.1,
     "winPct": 40
    },
    "gap down 4%+": {
     "n": 398,
     "avgR": -0.16,
     "winPct": 40
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 728,
     "avgR": -0.15,
     "winPct": 40
    },
    "4-8x": {
     "n": 1118,
     "avgR": -0.07,
     "winPct": 44
    },
    "2-4x": {
     "n": 1066,
     "avgR": -0.09,
     "winPct": 43
    },
    "1-2x normal": {
     "n": 39,
     "avgR": -0.17,
     "winPct": 28
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 2213,
     "avgR": -0.1,
     "winPct": 42
    },
    "normal stock": {
     "n": 666,
     "avgR": -0.1,
     "winPct": 42
    },
    "jumpy stock": {
     "n": 66,
     "avgR": 0.12,
     "winPct": 53
    },
    "very jumpy stock": {
     "n": 6,
     "avgR": -0.64,
     "winPct": 17
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2951,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2951,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "overnight news": {
    "none": {
     "n": 2951,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2951,
     "avgR": -0.1,
     "winPct": 42
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1277,
     "avgR": -0.09,
     "winPct": 44
    },
    "sector flat": {
     "n": 1145,
     "avgR": -0.09,
     "winPct": 41
    },
    "no sector": {
     "n": 168,
     "avgR": -0.05,
     "winPct": 45
    },
    "sector against the move": {
     "n": 361,
     "avgR": -0.17,
     "winPct": 40
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1363,
     "avgR": -0.08,
     "winPct": 43
    },
    "candle-mild": {
     "n": 368,
     "avgR": -0.2,
     "winPct": 37
    },
    "candle-none": {
     "n": 841,
     "avgR": -0.12,
     "winPct": 42
    },
    "candle-against": {
     "n": 379,
     "avgR": 0.01,
     "winPct": 47
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1567,
     "avgR": -0.1,
     "winPct": 42
    },
    "range": {
     "n": 1282,
     "avgR": -0.1,
     "winPct": 43
    },
    "trend-against": {
     "n": 102,
     "avgR": -0.03,
     "winPct": 43
    }
   },
   "latest candle pattern": {
    "three black crows": {
     "n": 528,
     "avgR": -0.08,
     "winPct": 43
    },
    "three white soldiers": {
     "n": 524,
     "avgR": -0.08,
     "winPct": 42
    },
    "strong bull candle": {
     "n": 123,
     "avgR": -0.11,
     "winPct": 41
    },
    "bear flag": {
     "n": 34,
     "avgR": -0.1,
     "winPct": 32
    },
    "inside bar": {
     "n": 303,
     "avgR": -0.08,
     "winPct": 44
    },
    "bullish engulfing": {
     "n": 91,
     "avgR": -0.04,
     "winPct": 42
    },
    "bull flag": {
     "n": 27,
     "avgR": -0.16,
     "winPct": 37
    },
    "dragonfly doji": {
     "n": 38,
     "avgR": 0.17,
     "winPct": 45
    },
    "none": {
     "n": 531,
     "avgR": -0.12,
     "winPct": 44
    },
    "outside bar": {
     "n": 105,
     "avgR": -0.19,
     "winPct": 35
    },
    "strong bear candle": {
     "n": 101,
     "avgR": -0.28,
     "winPct": 33
    },
    "dark cloud cover": {
     "n": 14,
     "avgR": -0.13,
     "winPct": 57
    },
    "spinning top": {
     "n": 88,
     "avgR": -0.09,
     "winPct": 40
    },
    "tweezer top": {
     "n": 44,
     "avgR": -0.13,
     "winPct": 30
    },
    "evening star": {
     "n": 23,
     "avgR": -0.02,
     "winPct": 48
    },
    "bearish engulfing": {
     "n": 83,
     "avgR": 0.05,
     "winPct": 57
    },
    "bullish harami": {
     "n": 14,
     "avgR": -0.05,
     "winPct": 50
    },
    "doji": {
     "n": 29,
     "avgR": -0.41,
     "winPct": 24
    },
    "bearish harami": {
     "n": 12,
     "avgR": -0.23,
     "winPct": 33
    },
    "tweezer bottom": {
     "n": 42,
     "avgR": 0.14,
     "winPct": 55
    },
    "bearish marubozu": {
     "n": 34,
     "avgR": -0.02,
     "winPct": 50
    },
    "morning star": {
     "n": 25,
     "avgR": -0.24,
     "winPct": 32
    },
    "piercing line": {
     "n": 8,
     "avgR": 0.32,
     "winPct": 50
    },
    "gravestone doji": {
     "n": 24,
     "avgR": -0.36,
     "winPct": 33
    },
    "bullish marubozu": {
     "n": 25,
     "avgR": -0.26,
     "winPct": 36
    },
    "hammer": {
     "n": 22,
     "avgR": -0.02,
     "winPct": 55
    },
    "shooting star": {
     "n": 25,
     "avgR": -0.05,
     "winPct": 48
    },
    "hanging man": {
     "n": 14,
     "avgR": -0.06,
     "winPct": 50
    },
    "inverted hammer": {
     "n": 20,
     "avgR": -0.1,
     "winPct": 45
    }
   },
   "month": {
    "2017-01": {
     "n": 243,
     "avgR": -0.12,
     "winPct": 41
    },
    "2017-02": {
     "n": 260,
     "avgR": -0.08,
     "winPct": 40
    },
    "2017-03": {
     "n": 197,
     "avgR": -0.06,
     "winPct": 44
    },
    "2017-04": {
     "n": 227,
     "avgR": -0.07,
     "winPct": 43
    },
    "2017-05": {
     "n": 294,
     "avgR": -0.06,
     "winPct": 42
    },
    "2017-06": {
     "n": 202,
     "avgR": -0.03,
     "winPct": 49
    },
    "2017-07": {
     "n": 228,
     "avgR": -0.16,
     "winPct": 37
    },
    "2017-08": {
     "n": 275,
     "avgR": -0.1,
     "winPct": 43
    },
    "2017-09": {
     "n": 228,
     "avgR": 0.02,
     "winPct": 50
    },
    "2017-10": {
     "n": 330,
     "avgR": -0.14,
     "winPct": 40
    },
    "2017-11": {
     "n": 297,
     "avgR": -0.2,
     "winPct": 40
    },
    "2017-12": {
     "n": 170,
     "avgR": -0.12,
     "winPct": 44
    }
   }
  },
  "text": "Overall -0.1R avg over 2951 trades.\nMade money when:\n  + candle read = candle-against: +0.01R avg, 47% wins, 379 trades\nLost most when:\n  - size of the 30-min move = 1.2x+ range: -0.24R avg, 33% wins, 337 trades\n  - candle read = candle-mild: -0.2R avg, 37% wins, 368 trades\n  - latest candle pattern = strong bear candle: -0.28R avg, 33% wins, 101 trades"
 },
 "whyFormula": {
  "n": 72,
  "overall": 0.05,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 59,
     "avgR": 0.03,
     "winPct": 44
    },
    "market downtrend": {
     "n": 13,
     "avgR": 0.15,
     "winPct": 62
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "S&P gap at the open": {
    "S&P flat": {
     "n": 50,
     "avgR": 0.12,
     "winPct": 46
    },
    "S&P gapped up": {
     "n": 10,
     "avgR": -0.08,
     "winPct": 60
    },
    "S&P gapped down": {
     "n": 7,
     "avgR": 0.16,
     "winPct": 57
    },
    "S&P gapped up hard": {
     "n": 2,
     "avgR": -0.31,
     "winPct": 50
    },
    "S&P gapped down hard": {
     "n": 3,
     "avgR": -0.76,
     "winPct": 0
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 30,
     "avgR": -0.02,
     "winPct": 47
    },
    "11:30-1:00": {
     "n": 42,
     "avgR": 0.1,
     "winPct": 48
    }
   },
   "side": {
    "short": {
     "n": 41,
     "avgR": -0.01,
     "winPct": 51
    },
    "long": {
     "n": 31,
     "avgR": 0.12,
     "winPct": 42
    }
   },
   "moving against the market": {
    "yes": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "volume on the signal candle": {
    "rising": {
     "n": 15,
     "avgR": 0.02,
     "winPct": 47
    },
    "fading": {
     "n": 17,
     "avgR": 0.18,
     "winPct": 59
    },
    "normal": {
     "n": 34,
     "avgR": -0.13,
     "winPct": 38
    },
    "surging": {
     "n": 6,
     "avgR": 0.77,
     "winPct": 67
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 48,
     "avgR": 0.08,
     "winPct": 44
    },
    "with the move": {
     "n": 14,
     "avgR": -0.01,
     "winPct": 50
    },
    "against the move": {
     "n": 9,
     "avgR": 0.02,
     "winPct": 67
    },
    "against the move, far": {
     "n": 1,
     "avgR": -0.2,
     "winPct": 0
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 20,
     "avgR": 0.38,
     "winPct": 55
    },
    "0.6-0.8x range": {
     "n": 44,
     "avgR": -0.07,
     "winPct": 48
    },
    "1.2x+ range": {
     "n": 8,
     "avgR": -0.11,
     "winPct": 25
    }
   },
   "stock opening gap": {
    "gap down 1-4%": {
     "n": 14,
     "avgR": 0.15,
     "winPct": 57
    },
    "gap up 1-4%": {
     "n": 16,
     "avgR": 0.09,
     "winPct": 38
    },
    "no gap": {
     "n": 20,
     "avgR": -0.01,
     "winPct": 50
    },
    "gap down 4%+": {
     "n": 13,
     "avgR": -0.21,
     "winPct": 38
    },
    "gap up 4%+": {
     "n": 9,
     "avgR": 0.33,
     "winPct": 56
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 29,
     "avgR": -0.11,
     "winPct": 41
    },
    "8x+": {
     "n": 27,
     "avgR": -0.03,
     "winPct": 41
    },
    "2-4x": {
     "n": 16,
     "avgR": 0.47,
     "winPct": 69
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 56,
     "avgR": 0.01,
     "winPct": 43
    },
    "normal stock": {
     "n": 14,
     "avgR": 0.13,
     "winPct": 57
    },
    "jumpy stock": {
     "n": 2,
     "avgR": 0.53,
     "winPct": 100
    }
   },
   "news in the last hour": {
    "none": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "overnight news": {
    "none": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "type of overnight news": {
    "none": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 47
    }
   },
   "sector": {
    "sector flat": {
     "n": 23,
     "avgR": 0.09,
     "winPct": 52
    },
    "sector against the move": {
     "n": 33,
     "avgR": 0.22,
     "winPct": 52
    },
    "no sector": {
     "n": 8,
     "avgR": -0.08,
     "winPct": 50
    },
    "sector with the move": {
     "n": 8,
     "avgR": -0.66,
     "winPct": 13
    }
   },
   "candle read": {
    "candle-none": {
     "n": 17,
     "avgR": -0.01,
     "winPct": 41
    },
    "candle-with": {
     "n": 35,
     "avgR": -0.1,
     "winPct": 46
    },
    "candle-against": {
     "n": 7,
     "avgR": 0.36,
     "winPct": 71
    },
    "candle-mild": {
     "n": 13,
     "avgR": 0.34,
     "winPct": 46
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 47,
     "avgR": -0.03,
     "winPct": 40
    },
    "range": {
     "n": 22,
     "avgR": 0.26,
     "winPct": 64
    },
    "trend-against": {
     "n": 3,
     "avgR": -0.35,
     "winPct": 33
    }
   },
   "latest candle pattern": {
    "none": {
     "n": 12,
     "avgR": -0.05,
     "winPct": 42
    },
    "three white soldiers": {
     "n": 11,
     "avgR": -0.2,
     "winPct": 27
    },
    "bullish engulfing": {
     "n": 2,
     "avgR": -0.21,
     "winPct": 50
    },
    "three black crows": {
     "n": 17,
     "avgR": -0.06,
     "winPct": 53
    },
    "inside bar": {
     "n": 6,
     "avgR": 0.59,
     "winPct": 67
    },
    "strong bull candle": {
     "n": 4,
     "avgR": 1.15,
     "winPct": 50
    },
    "strong bear candle": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "tweezer bottom": {
     "n": 1,
     "avgR": 0.21,
     "winPct": 100
    },
    "outside bar": {
     "n": 3,
     "avgR": 1.3,
     "winPct": 100
    },
    "bullish harami": {
     "n": 2,
     "avgR": -0.5,
     "winPct": 0
    },
    "spinning top": {
     "n": 1,
     "avgR": 0.66,
     "winPct": 100
    },
    "hammer": {
     "n": 1,
     "avgR": 0.15,
     "winPct": 100
    },
    "bearish harami": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "morning star": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "gravestone doji": {
     "n": 3,
     "avgR": -0.11,
     "winPct": 33
    },
    "bearish engulfing": {
     "n": 2,
     "avgR": -0.48,
     "winPct": 50
    },
    "inverted hammer": {
     "n": 1,
     "avgR": 1.43,
     "winPct": 100
    },
    "bear flag": {
     "n": 1,
     "avgR": -0.41,
     "winPct": 0
    },
    "tweezer top": {
     "n": 2,
     "avgR": -0.41,
     "winPct": 50
    }
   },
   "month": {
    "2017-01": {
     "n": 6,
     "avgR": -0.02,
     "winPct": 67
    },
    "2017-02": {
     "n": 9,
     "avgR": 0.57,
     "winPct": 33
    },
    "2017-03": {
     "n": 7,
     "avgR": -0.1,
     "winPct": 57
    },
    "2017-04": {
     "n": 6,
     "avgR": 0.06,
     "winPct": 67
    },
    "2017-05": {
     "n": 9,
     "avgR": -0.21,
     "winPct": 33
    },
    "2017-06": {
     "n": 2,
     "avgR": -0.38,
     "winPct": 50
    },
    "2017-07": {
     "n": 5,
     "avgR": 1.01,
     "winPct": 80
    },
    "2017-08": {
     "n": 5,
     "avgR": -0.12,
     "winPct": 40
    },
    "2017-09": {
     "n": 3,
     "avgR": 0.4,
     "winPct": 67
    },
    "2017-10": {
     "n": 4,
     "avgR": -0.72,
     "winPct": 0
    },
    "2017-11": {
     "n": 13,
     "avgR": 0.03,
     "winPct": 46
    },
    "2017-12": {
     "n": 3,
     "avgR": -0.58,
     "winPct": 33
    }
   }
  },
  "text": "Overall +0.05R avg over 72 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2017-12-22",
   "sym": "PENG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 85,
   "dir": "long",
   "entry": 17.19,
   "stopDist": 0.33228571755545483,
   "marketAgainst": false,
   "volRatio": 0.8009471719615263,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6380051527933035,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "strong bull candle",
   "rvol": 14.031146503925873,
   "gap": 118.6375262375349,
   "atrPct": 5.338780665078547,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "NKE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.7113500096209325,
   "minute": 35,
   "dir": "long",
   "entry": 62.58,
   "stopDist": 0.45314243861607145,
   "marketAgainst": false,
   "volRatio": 0.6074236941159682,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9356881277660146,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.7528992356432913,
   "gap": -5.5118061264382785,
   "atrPct": 1.749044550338803,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "CTAS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8262166704867013,
   "minute": 35,
   "dir": "short",
   "entry": 39.09,
   "stopDist": 0.20542864118303572,
   "marketAgainst": false,
   "volRatio": 0.3285698252107847,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6815018548229531,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bear flag",
   "rvol": 3.5421038285374857,
   "gap": 305.93836286497816,
   "atrPct": 1.2868243671288586,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "CTAS",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -0.3420722234955325,
   "minute": 275,
   "dir": "long",
   "entry": 39.3,
   "stopDist": 0.20542864118303572,
   "marketAgainst": false,
   "volRatio": 2.1054805180796228,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7009733363893335,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 3.5421038285374857,
   "gap": 305.93836286497816,
   "atrPct": 1.2868243671288586,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "LNG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 53.36,
   "stopDist": 0.5167114257812501,
   "marketAgainst": false,
   "volRatio": 0.7895855944670409,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8592803987809772,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.299977748815919,
   "gap": 0.0000011819356604547693,
   "atrPct": 2.5015077066636646,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "CELG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.45997967038133863,
   "minute": 40,
   "dir": "long",
   "entry": 105.55,
   "stopDist": 0.9412139892578125,
   "marketAgainst": false,
   "volRatio": 0.8973341449494947,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6640360291423625,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.223217371060943,
   "gap": -4.662585633555539,
   "atrPct": 2.1811596524396277,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-22",
   "sym": "ALGN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.36494629714052207,
   "minute": 40,
   "dir": "long",
   "entry": 222.5621,
   "stopDist": 3.546953909737723,
   "marketAgainst": false,
   "volRatio": 1.0587694612137442,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7140887827852513,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.8846793495477103,
   "gap": -1.0925190011198516,
   "atrPct": 4.053476411139338,
   "spyGap": 0.022423358436896024,
   "spyTrend": "market uptrend",
   "spyVol": 6.063347262338602
  },
  {
   "date": "2017-12-26",
   "sym": "CNK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 1.2388493315712346,
   "minute": 35,
   "dir": "short",
   "entry": 35.135,
   "stopDist": 0.29095720563616073,
   "marketAgainst": false,
   "volRatio": 0.8004590009815985,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7629988042901705,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 4.797856674326573,
   "gap": -0.19476524592009214,
   "atrPct": 2.0239094098068113,
   "spyGap": -0.16075002806581473,
   "spyTrend": "market uptrend",
   "spyVol": 6.0495084056790684
  },
  {
   "date": "2017-12-26",
   "sym": "XPO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3659912611255859,
   "minute": 95,
   "dir": "long",
   "entry": 89.625,
   "stopDist": 0.9968630109514509,
   "marketAgainst": false,
   "volRatio": 0.7759006716873601,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8546811253301605,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 4.517390976877307,
   "gap": -0.5666060705771137,
   "atrPct": 2.7687562140113466,
   "spyGap": -0.16075002806581473,
   "spyTrend": "market uptrend",
   "spyVol": 6.0495084056790684
  },
  {
   "date": "2017-12-26",
   "sym": "SIX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.29288875134811215,
   "minute": 45,
   "dir": "short",
   "entry": 67.11,
   "stopDist": 0.41171112060546877,
   "marketAgainst": false,
   "volRatio": 0.3179768859537719,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7140929289634897,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.482020202020202,
   "gap": 0.2517822354646926,
   "atrPct": 1.5244044026761188,
   "spyGap": -0.16075002806581473,
   "spyTrend": "market uptrend",
   "spyVol": 6.0495084056790684
  },
  {
   "date": "2017-12-27",
   "sym": "PTLA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.853928084878822,
   "minute": 35,
   "dir": "short",
   "entry": 48.12,
   "stopDist": 1.1062826974051339,
   "marketAgainst": false,
   "volRatio": 0.6780874694030382,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6797539198288751,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "gravestone doji",
   "rvol": 3.5418005157406514,
   "gap": 0.5102040816326481,
   "atrPct": 5.644299476556806,
   "spyGap": 0.07860981033636083,
   "spyTrend": "market uptrend",
   "spyVol": 5.208905464869349
  },
  {
   "date": "2017-12-27",
   "sym": "SU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.4119119395786642,
   "minute": 35,
   "dir": "long",
   "entry": 36.04,
   "stopDist": 0.2164914812360491,
   "marketAgainst": false,
   "volRatio": 0.9989010172434697,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8683944464078742,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "bull flag",
   "rvol": 1.9607833710596074,
   "gap": -0.0000012887490519197797,
   "atrPct": 1.523729437260819,
   "spyGap": 0.07860981033636083,
   "spyTrend": "market uptrend",
   "spyVol": 5.208905464869349
  },
  {
   "date": "2017-12-27",
   "sym": "CORT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.27159690229947175,
   "minute": 35,
   "dir": "short",
   "entry": 17.73,
   "stopDist": 0.4061428615025112,
   "marketAgainst": false,
   "volRatio": 0.6973086017083051,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8075975994914096,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "hammer",
   "rvol": 1.3739657997563126,
   "gap": 0.05321492275391915,
   "atrPct": 5.403709974900668,
   "spyGap": 0.07860981033636083,
   "spyTrend": "market uptrend",
   "spyVol": 5.208905464869349
  },
  {
   "date": "2017-12-29",
   "sym": "YPF",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.5746812959952754,
   "minute": 115,
   "dir": "long",
   "entry": 22.73,
   "stopDist": 0.22411428179059711,
   "marketAgainst": false,
   "volRatio": 1.7371614469029977,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7674655922227634,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three white soldiers",
   "rvol": 4.849524843877274,
   "gap": 0.26845466445726274,
   "atrPct": 2.5068711181813796,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "BTI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 55,
   "dir": "short",
   "entry": 66.855,
   "stopDist": 0.33114318847656254,
   "marketAgainst": false,
   "volRatio": 0.9231980345998653,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6824842178989734,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.5226051832271024,
   "gap": 0.7816041338406521,
   "atrPct": 1.244337872209646,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "HLF",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.6237584173538768,
   "minute": 35,
   "dir": "short",
   "entry": 33.89,
   "stopDist": 0.2820001874651228,
   "marketAgainst": false,
   "volRatio": 0.7129959308240081,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7234037744220632,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 2.2980513073507645,
   "gap": 100.02919580191696,
   "atrPct": 2.058996594927666,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "CRC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.17525581148159608,
   "minute": 125,
   "dir": "long",
   "entry": 19.9256,
   "stopDist": 0.3281284877232143,
   "marketAgainst": false,
   "volRatio": 1.0974593469445508,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6651053113806192,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 2.283885070422535,
   "gap": 0.7403498345720516,
   "atrPct": 4.338028693428568,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "GLD",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.08833167053472955,
   "minute": 260,
   "dir": "short",
   "entry": 123.62,
   "stopDist": 0.2791425432477678,
   "marketAgainst": false,
   "volRatio": 2.185522892935463,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6161726478479824,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.032590057753232,
   "gap": 0.6919019425612571,
   "atrPct": 0.568055650620481,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "BDX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.06436391387261274,
   "minute": 35,
   "dir": "long",
   "entry": 216.89,
   "stopDist": 1.044283621651786,
   "marketAgainst": false,
   "volRatio": 0.7017299470064742,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6932982429187287,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 1.413746641834094,
   "gap": 0.9238487346568514,
   "atrPct": 1.2181359485398109,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  },
  {
   "date": "2017-12-29",
   "sym": "MOS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.13861881062485584,
   "minute": 40,
   "dir": "short",
   "entry": 25.58,
   "stopDist": 0.22568571908133372,
   "marketAgainst": false,
   "volRatio": 1.6009645272497786,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7975692956235829,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 1.3841536737911664,
   "gap": 1.721441875004337,
   "atrPct": 2.207411226495235,
   "spyGap": 0.2576027350751353,
   "spyTrend": "market uptrend",
   "spyVol": 4.462850414603019
  }
 ]
}
```
