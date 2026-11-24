# Elis year test 2018

Out-of-sample year 2018 (251 sessions, formulas found on 2024-2025, never on 2018). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 184 trades, 43% wins, avg -0.07R, total -12.7R -> $3,000 became $2,699 (-10%, max drawdown 19.5%)
- midday, against the market, S&P flat at the open -> go with the stock: 130 trades, 42% wins, avg -0.1R, total -13.3R -> $3,000 became $2,624 (-12.5%, max drawdown 15.8%)
- midday, against the market, normal volume -> go with the stock: 117 trades, 46% wins, avg -0.06R, total -7R -> $3,000 became $2,764 (-7.9%, max drawdown 14.2%)
- afternoon, far from VWAP in the move direction -> go with the stock: 307 trades, 43% wins, avg -0.08R, total -25.3R -> $3,000 became $2,395 (-20.2%, max drawdown 22.3%)
- strong move alone (control) -> go with the stock: 2880 trades, 43% wins, avg -0.07R, total -194.5R -> $3,000 became $1,970 (-34.3%, max drawdown 34.9%)

```json
{
 "year": "2018",
 "sessions": 251,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 184,
   "winPct": 43,
   "avgR": -0.07,
   "totalR": -12.7,
   "money3k": {
    "start": 3000,
    "end": 2699,
    "returnPct": -10,
    "maxDrawdownPct": 19.5
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 130,
   "winPct": 42,
   "avgR": -0.1,
   "totalR": -13.3,
   "money3k": {
    "start": 3000,
    "end": 2624,
    "returnPct": -12.5,
    "maxDrawdownPct": 15.8
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 117,
   "winPct": 46,
   "avgR": -0.06,
   "totalR": -7,
   "money3k": {
    "start": 3000,
    "end": 2764,
    "returnPct": -7.9,
    "maxDrawdownPct": 14.2
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 307,
   "winPct": 43,
   "avgR": -0.08,
   "totalR": -25.3,
   "money3k": {
    "start": 3000,
    "end": 2395,
    "returnPct": -20.2,
    "maxDrawdownPct": 22.3
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2880,
   "winPct": 43,
   "avgR": -0.07,
   "totalR": -194.5,
   "money3k": {
    "start": 3000,
    "end": 1970,
    "returnPct": -34.3,
    "maxDrawdownPct": 34.9
   }
  }
 },
 "trades": 3618,
 "why": {
  "n": 2880,
  "overall": -0.07,
  "findings": [
   {
    "dim": "volume on the signal candle",
    "value": "surging",
    "n": 73,
    "avgR": 0.19,
    "winPct": 49,
    "z": 2.33,
    "better": true
   },
   {
    "dim": "chart structure",
    "value": "trend-against",
    "n": 97,
    "avgR": -0.28,
    "winPct": 32,
    "z": -2.21,
    "better": false
   },
   {
    "dim": "sector",
    "value": "sector against the move",
    "n": 449,
    "avgR": 0.03,
    "winPct": 47,
    "z": 2.19,
    "better": true
   },
   {
    "dim": "sector",
    "value": "sector with the move",
    "n": 1510,
    "avgR": -0.12,
    "winPct": 41,
    "z": -2.16,
    "better": false
   },
   {
    "dim": "time of day",
    "value": "last 90 min",
    "n": 57,
    "avgR": -0.33,
    "winPct": 23,
    "z": -2.1,
    "better": false
   },
   {
    "dim": "month",
    "value": "2018-10",
    "n": 284,
    "avgR": -0.18,
    "winPct": 38,
    "z": -2.01,
    "better": false
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 1783,
     "avgR": -0.05,
     "winPct": 44
    },
    "market downtrend": {
     "n": 1097,
     "avgR": -0.1,
     "winPct": 41
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 1640,
     "avgR": -0.06,
     "winPct": 42
    },
    "nervous market (18-28%)": {
     "n": 852,
     "avgR": -0.07,
     "winPct": 44
    },
    "normal market (12-18%)": {
     "n": 385,
     "avgR": -0.09,
     "winPct": 42
    },
    "panicky market (28%+)": {
     "n": 3,
     "avgR": -0.33,
     "winPct": 33
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 753,
     "avgR": 0,
     "winPct": 46
    },
    "S&P flat": {
     "n": 1263,
     "avgR": -0.1,
     "winPct": 41
    },
    "S&P gapped down": {
     "n": 566,
     "avgR": -0.05,
     "winPct": 43
    },
    "S&P gapped down hard": {
     "n": 160,
     "avgR": -0.19,
     "winPct": 37
    },
    "S&P gapped up hard": {
     "n": 138,
     "avgR": -0.03,
     "winPct": 44
    }
   },
   "time of day": {
    "first hour": {
     "n": 2172,
     "avgR": -0.07,
     "winPct": 42
    },
    "10:30-11:30": {
     "n": 442,
     "avgR": -0.05,
     "winPct": 43
    },
    "11:30-1:00": {
     "n": 151,
     "avgR": 0.01,
     "winPct": 52
    },
    "1:00-2:30": {
     "n": 58,
     "avgR": -0.17,
     "winPct": 38
    },
    "last 90 min": {
     "n": 57,
     "avgR": -0.33,
     "winPct": 23
    }
   },
   "side": {
    "long": {
     "n": 1336,
     "avgR": -0.08,
     "winPct": 42
    },
    "short": {
     "n": 1544,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "moving against the market": {
    "no": {
     "n": 2513,
     "avgR": -0.08,
     "winPct": 42
    },
    "yes": {
     "n": 367,
     "avgR": 0.01,
     "winPct": 46
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 1268,
     "avgR": -0.08,
     "winPct": 41
    },
    "normal": {
     "n": 1209,
     "avgR": -0.06,
     "winPct": 44
    },
    "rising": {
     "n": 330,
     "avgR": -0.12,
     "winPct": 40
    },
    "surging": {
     "n": 73,
     "avgR": 0.19,
     "winPct": 49
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1358,
     "avgR": -0.09,
     "winPct": 41
    },
    "with the move": {
     "n": 1473,
     "avgR": -0.05,
     "winPct": 44
    },
    "against the move": {
     "n": 49,
     "avgR": -0.15,
     "winPct": 33
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 1787,
     "avgR": -0.06,
     "winPct": 44
    },
    "0.8-1.2x range": {
     "n": 760,
     "avgR": -0.07,
     "winPct": 42
    },
    "1.2x+ range": {
     "n": 333,
     "avgR": -0.11,
     "winPct": 36
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 759,
     "avgR": -0.06,
     "winPct": 44
    },
    "gap up 1-4%": {
     "n": 486,
     "avgR": -0.03,
     "winPct": 44
    },
    "gap down 1-4%": {
     "n": 524,
     "avgR": -0.12,
     "winPct": 41
    },
    "gap up 4%+": {
     "n": 622,
     "avgR": -0.05,
     "winPct": 42
    },
    "gap down 4%+": {
     "n": 489,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 1154,
     "avgR": -0.09,
     "winPct": 43
    },
    "2-4x": {
     "n": 1036,
     "avgR": -0.06,
     "winPct": 43
    },
    "8x+": {
     "n": 681,
     "avgR": -0.04,
     "winPct": 41
    },
    "1-2x normal": {
     "n": 9,
     "avgR": -0.01,
     "winPct": 44
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 1686,
     "avgR": -0.08,
     "winPct": 42
    },
    "normal stock": {
     "n": 1026,
     "avgR": -0.05,
     "winPct": 44
    },
    "jumpy stock": {
     "n": 155,
     "avgR": -0.04,
     "winPct": 43
    },
    "very jumpy stock": {
     "n": 13,
     "avgR": 0.06,
     "winPct": 46
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2880,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2880,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "overnight news": {
    "none": {
     "n": 2880,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2880,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1510,
     "avgR": -0.12,
     "winPct": 41
    },
    "sector against the move": {
     "n": 449,
     "avgR": 0.03,
     "winPct": 47
    },
    "sector flat": {
     "n": 798,
     "avgR": -0.04,
     "winPct": 43
    },
    "no sector": {
     "n": 123,
     "avgR": -0.04,
     "winPct": 46
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1410,
     "avgR": -0.07,
     "winPct": 43
    },
    "candle-none": {
     "n": 782,
     "avgR": -0.07,
     "winPct": 43
    },
    "candle-mild": {
     "n": 358,
     "avgR": -0.09,
     "winPct": 41
    },
    "candle-against": {
     "n": 330,
     "avgR": -0.03,
     "winPct": 43
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1565,
     "avgR": -0.06,
     "winPct": 44
    },
    "trend-against": {
     "n": 97,
     "avgR": -0.28,
     "winPct": 32
    },
    "range": {
     "n": 1218,
     "avgR": -0.06,
     "winPct": 42
    }
   },
   "latest candle pattern": {
    "three white soldiers": {
     "n": 524,
     "avgR": -0.05,
     "winPct": 44
    },
    "doji": {
     "n": 23,
     "avgR": -0.13,
     "winPct": 39
    },
    "none": {
     "n": 474,
     "avgR": -0.01,
     "winPct": 46
    },
    "strong bull candle": {
     "n": 92,
     "avgR": -0.04,
     "winPct": 38
    },
    "tweezer top": {
     "n": 36,
     "avgR": -0.36,
     "winPct": 33
    },
    "three black crows": {
     "n": 591,
     "avgR": -0.1,
     "winPct": 42
    },
    "spinning top": {
     "n": 79,
     "avgR": -0.14,
     "winPct": 41
    },
    "bull flag": {
     "n": 26,
     "avgR": -0.34,
     "winPct": 35
    },
    "bearish engulfing": {
     "n": 73,
     "avgR": -0.11,
     "winPct": 40
    },
    "dark cloud cover": {
     "n": 17,
     "avgR": -0.23,
     "winPct": 35
    },
    "hanging man": {
     "n": 17,
     "avgR": -0.06,
     "winPct": 47
    },
    "tweezer bottom": {
     "n": 35,
     "avgR": 0.1,
     "winPct": 46
    },
    "morning star": {
     "n": 26,
     "avgR": -0.04,
     "winPct": 42
    },
    "dragonfly doji": {
     "n": 34,
     "avgR": 0.22,
     "winPct": 50
    },
    "outside bar": {
     "n": 112,
     "avgR": -0.01,
     "winPct": 44
    },
    "inside bar": {
     "n": 324,
     "avgR": -0.14,
     "winPct": 40
    },
    "bullish engulfing": {
     "n": 71,
     "avgR": 0.04,
     "winPct": 45
    },
    "gravestone doji": {
     "n": 27,
     "avgR": -0.25,
     "winPct": 33
    },
    "strong bear candle": {
     "n": 93,
     "avgR": -0.15,
     "winPct": 41
    },
    "bearish harami": {
     "n": 13,
     "avgR": -0.05,
     "winPct": 38
    },
    "bearish marubozu": {
     "n": 29,
     "avgR": 0.11,
     "winPct": 52
    },
    "piercing line": {
     "n": 13,
     "avgR": 0.06,
     "winPct": 54
    },
    "shooting star": {
     "n": 15,
     "avgR": 0.22,
     "winPct": 40
    },
    "hammer": {
     "n": 24,
     "avgR": 0.11,
     "winPct": 46
    },
    "bullish marubozu": {
     "n": 25,
     "avgR": 0.04,
     "winPct": 56
    },
    "bear flag": {
     "n": 30,
     "avgR": -0.03,
     "winPct": 43
    },
    "evening star": {
     "n": 20,
     "avgR": -0.17,
     "winPct": 35
    },
    "inverted hammer": {
     "n": 19,
     "avgR": -0.05,
     "winPct": 53
    },
    "bullish harami": {
     "n": 18,
     "avgR": -0.24,
     "winPct": 33
    }
   },
   "month": {
    "2018-01": {
     "n": 292,
     "avgR": -0.07,
     "winPct": 44
    },
    "2018-02": {
     "n": 279,
     "avgR": -0.11,
     "winPct": 41
    },
    "2018-03": {
     "n": 206,
     "avgR": -0.1,
     "winPct": 44
    },
    "2018-04": {
     "n": 220,
     "avgR": -0.05,
     "winPct": 47
    },
    "2018-05": {
     "n": 299,
     "avgR": 0.04,
     "winPct": 43
    },
    "2018-06": {
     "n": 241,
     "avgR": -0.04,
     "winPct": 44
    },
    "2018-07": {
     "n": 243,
     "avgR": -0.08,
     "winPct": 42
    },
    "2018-08": {
     "n": 293,
     "avgR": -0.13,
     "winPct": 40
    },
    "2018-09": {
     "n": 200,
     "avgR": 0.06,
     "winPct": 47
    },
    "2018-10": {
     "n": 284,
     "avgR": -0.18,
     "winPct": 38
    },
    "2018-11": {
     "n": 210,
     "avgR": 0.01,
     "winPct": 44
    },
    "2018-12": {
     "n": 113,
     "avgR": -0.17,
     "winPct": 38
    }
   }
  },
  "text": "Overall -0.07R avg over 2880 trades.\nMade money when:\n  + volume on the signal candle = surging: +0.19R avg, 49% wins, 73 trades\n  + sector = sector against the move: +0.03R avg, 47% wins, 449 trades\nLost most when:\n  - chart structure = trend-against: -0.28R avg, 32% wins, 97 trades\n  - sector = sector with the move: -0.12R avg, 41% wins, 1510 trades\n  - time of day = last 90 min: -0.33R avg, 23% wins, 57 trades\n  - month = 2018-10: -0.18R avg, 38% wins, 284 trades"
 },
 "whyFormula": {
  "n": 184,
  "overall": -0.07,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 97,
     "avgR": -0.15,
     "winPct": 39
    },
    "market downtrend": {
     "n": 87,
     "avgR": 0.02,
     "winPct": 48
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 81,
     "avgR": -0.21,
     "winPct": 38
    },
    "nervous market (18-28%)": {
     "n": 71,
     "avgR": 0.08,
     "winPct": 49
    },
    "normal market (12-18%)": {
     "n": 32,
     "avgR": -0.03,
     "winPct": 44
    }
   },
   "S&P gap at the open": {
    "S&P flat": {
     "n": 81,
     "avgR": -0.2,
     "winPct": 41
    },
    "S&P gapped up": {
     "n": 45,
     "avgR": 0.09,
     "winPct": 42
    },
    "S&P gapped down": {
     "n": 32,
     "avgR": -0.18,
     "winPct": 41
    },
    "S&P gapped up hard": {
     "n": 20,
     "avgR": 0.11,
     "winPct": 60
    },
    "S&P gapped down hard": {
     "n": 6,
     "avgR": 0.57,
     "winPct": 50
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 102,
     "avgR": -0.06,
     "winPct": 41
    },
    "11:30-1:00": {
     "n": 82,
     "avgR": -0.08,
     "winPct": 46
    }
   },
   "side": {
    "long": {
     "n": 91,
     "avgR": -0.05,
     "winPct": 46
    },
    "short": {
     "n": 93,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "moving against the market": {
    "yes": {
     "n": 184,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 100,
     "avgR": -0.05,
     "winPct": 48
    },
    "fading": {
     "n": 53,
     "avgR": 0.02,
     "winPct": 49
    },
    "rising": {
     "n": 26,
     "avgR": -0.29,
     "winPct": 19
    },
    "surging": {
     "n": 5,
     "avgR": -0.37,
     "winPct": 20
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 117,
     "avgR": -0.11,
     "winPct": 40
    },
    "with the move": {
     "n": 51,
     "avgR": 0.04,
     "winPct": 53
    },
    "against the move": {
     "n": 15,
     "avgR": -0.14,
     "winPct": 33
    },
    "against the move, far": {
     "n": 1,
     "avgR": 0.04,
     "winPct": 100
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 44,
     "avgR": -0.14,
     "winPct": 41
    },
    "0.6-0.8x range": {
     "n": 129,
     "avgR": -0.02,
     "winPct": 45
    },
    "1.2x+ range": {
     "n": 11,
     "avgR": -0.41,
     "winPct": 36
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 25,
     "avgR": -0.25,
     "winPct": 36
    },
    "gap up 1-4%": {
     "n": 33,
     "avgR": -0.04,
     "winPct": 39
    },
    "gap up 4%+": {
     "n": 55,
     "avgR": -0.06,
     "winPct": 45
    },
    "gap down 4%+": {
     "n": 44,
     "avgR": -0.02,
     "winPct": 48
    },
    "gap down 1-4%": {
     "n": 27,
     "avgR": -0.03,
     "winPct": 44
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 71,
     "avgR": -0.18,
     "winPct": 38
    },
    "2-4x": {
     "n": 35,
     "avgR": -0.11,
     "winPct": 43
    },
    "4-8x": {
     "n": 78,
     "avgR": 0.05,
     "winPct": 49
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 104,
     "avgR": -0.01,
     "winPct": 45
    },
    "normal stock": {
     "n": 70,
     "avgR": -0.18,
     "winPct": 43
    },
    "very jumpy stock": {
     "n": 1,
     "avgR": -0.38,
     "winPct": 0
    },
    "jumpy stock": {
     "n": 9,
     "avgR": 0.16,
     "winPct": 33
    }
   },
   "news in the last hour": {
    "none": {
     "n": 184,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 184,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "overnight news": {
    "none": {
     "n": 184,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "type of overnight news": {
    "none": {
     "n": 184,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "sector": {
    "no sector": {
     "n": 10,
     "avgR": -0.14,
     "winPct": 40
    },
    "sector against the move": {
     "n": 96,
     "avgR": -0.05,
     "winPct": 47
    },
    "sector flat": {
     "n": 62,
     "avgR": 0,
     "winPct": 42
    },
    "sector with the move": {
     "n": 16,
     "avgR": -0.38,
     "winPct": 31
    }
   },
   "candle read": {
    "candle-against": {
     "n": 20,
     "avgR": -0.01,
     "winPct": 45
    },
    "candle-with": {
     "n": 101,
     "avgR": -0.12,
     "winPct": 40
    },
    "candle-mild": {
     "n": 26,
     "avgR": -0.12,
     "winPct": 35
    },
    "candle-none": {
     "n": 37,
     "avgR": 0.06,
     "winPct": 59
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 99,
     "avgR": -0.07,
     "winPct": 43
    },
    "range": {
     "n": 85,
     "avgR": -0.07,
     "winPct": 44
    }
   },
   "latest candle pattern": {
    "tweezer top": {
     "n": 4,
     "avgR": -0.44,
     "winPct": 25
    },
    "dragonfly doji": {
     "n": 2,
     "avgR": 0,
     "winPct": 50
    },
    "three white soldiers": {
     "n": 39,
     "avgR": 0.02,
     "winPct": 46
    },
    "strong bear candle": {
     "n": 4,
     "avgR": 0.39,
     "winPct": 25
    },
    "outside bar": {
     "n": 6,
     "avgR": 0.02,
     "winPct": 67
    },
    "three black crows": {
     "n": 38,
     "avgR": -0.11,
     "winPct": 34
    },
    "bearish harami": {
     "n": 2,
     "avgR": 0.1,
     "winPct": 50
    },
    "bear flag": {
     "n": 6,
     "avgR": -0.38,
     "winPct": 33
    },
    "none": {
     "n": 17,
     "avgR": 0.26,
     "winPct": 65
    },
    "spinning top": {
     "n": 6,
     "avgR": 0.17,
     "winPct": 67
    },
    "inside bar": {
     "n": 15,
     "avgR": -0.1,
     "winPct": 40
    },
    "piercing line": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bullish engulfing": {
     "n": 3,
     "avgR": -0.46,
     "winPct": 0
    },
    "tweezer bottom": {
     "n": 3,
     "avgR": -0.39,
     "winPct": 33
    },
    "bullish harami": {
     "n": 3,
     "avgR": -0.79,
     "winPct": 0
    },
    "shooting star": {
     "n": 2,
     "avgR": 0.43,
     "winPct": 100
    },
    "gravestone doji": {
     "n": 3,
     "avgR": -0.62,
     "winPct": 33
    },
    "bearish marubozu": {
     "n": 3,
     "avgR": -0.3,
     "winPct": 67
    },
    "strong bull candle": {
     "n": 13,
     "avgR": -0.26,
     "winPct": 31
    },
    "morning star": {
     "n": 4,
     "avgR": -0.14,
     "winPct": 25
    },
    "bull flag": {
     "n": 3,
     "avgR": -0.63,
     "winPct": 33
    },
    "evening star": {
     "n": 1,
     "avgR": 0.4,
     "winPct": 100
    },
    "bearish engulfing": {
     "n": 3,
     "avgR": 1.05,
     "winPct": 100
    },
    "doji": {
     "n": 2,
     "avgR": -0.45,
     "winPct": 50
    },
    "bullish marubozu": {
     "n": 1,
     "avgR": 0.08,
     "winPct": 100
    }
   },
   "month": {
    "2018-01": {
     "n": 8,
     "avgR": 0.14,
     "winPct": 50
    },
    "2018-02": {
     "n": 17,
     "avgR": -0.14,
     "winPct": 41
    },
    "2018-03": {
     "n": 16,
     "avgR": -0.09,
     "winPct": 44
    },
    "2018-04": {
     "n": 13,
     "avgR": 0.39,
     "winPct": 62
    },
    "2018-05": {
     "n": 24,
     "avgR": 0.12,
     "winPct": 54
    },
    "2018-06": {
     "n": 9,
     "avgR": -0.51,
     "winPct": 22
    },
    "2018-07": {
     "n": 17,
     "avgR": -0.25,
     "winPct": 29
    },
    "2018-08": {
     "n": 21,
     "avgR": -0.28,
     "winPct": 38
    },
    "2018-09": {
     "n": 6,
     "avgR": -0.82,
     "winPct": 0
    },
    "2018-10": {
     "n": 27,
     "avgR": -0.05,
     "winPct": 48
    },
    "2018-11": {
     "n": 20,
     "avgR": -0.04,
     "winPct": 40
    },
    "2018-12": {
     "n": 6,
     "avgR": 0.61,
     "winPct": 83
    }
   }
  },
  "text": "Overall -0.07R avg over 184 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2018-12-20",
   "sym": "CAG",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": 0.28758640938586705,
   "minute": 170,
   "dir": "short",
   "entry": 24.9365,
   "stopDist": 0.3302858080182757,
   "marketAgainst": true,
   "volRatio": 1.5219733919662488,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.130536011342454,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 5.14672472203077,
   "gap": -4.434514079825913,
   "atrPct": 2.838482350342072,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "CAG",
   "formula": "midday, against the market, S&P flat at the open -> go with the stock",
   "R": 0.28758640938586705,
   "minute": 170,
   "dir": "short",
   "entry": 24.9365,
   "stopDist": 0.3302858080182757,
   "marketAgainst": true,
   "volRatio": 1.5219733919662488,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.130536011342454,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 5.14672472203077,
   "gap": -4.434514079825913,
   "atrPct": 2.838482350342072,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "CAG",
   "formula": "midday, against the market, normal volume -> go with the stock",
   "R": 0.5858129683500689,
   "minute": 175,
   "dir": "short",
   "entry": 24.985,
   "stopDist": 0.3302858080182757,
   "marketAgainst": true,
   "volRatio": 0.7769872966990665,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.823529178053419,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 5.14672472203077,
   "gap": -4.434514079825913,
   "atrPct": 2.838482350342072,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "CAG",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": 0.8580014724199309,
   "minute": 260,
   "dir": "short",
   "entry": 24.34,
   "stopDist": 0.3302858080182757,
   "marketAgainst": false,
   "volRatio": 0.6117062891134694,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6176468835400664,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 5.14672472203077,
   "gap": -4.434514079825913,
   "atrPct": 2.838482350342072,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "CCL",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.12048556339038319,
   "minute": 320,
   "dir": "long",
   "entry": 50,
   "stopDist": 0.6384286063058036,
   "marketAgainst": false,
   "volRatio": 0.7299048813630187,
   "vwapWith": false,
   "vwapFar": false,
   "moveATR": 0.7455806260849124,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 4.959689928722486,
   "gap": -5.199051824754708,
   "atrPct": 2.9014207679765374,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "IYW",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.5166668927228965,
   "minute": 320,
   "dir": "long",
   "entry": 39.66,
   "stopDist": 0.4499997820172992,
   "marketAgainst": false,
   "volRatio": 0.6651596496185364,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7288892419672064,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 4.30482602058789,
   "gap": 298.0264922775964,
   "atrPct": 2.8103909301768115,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "TRGP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.44704458337604386,
   "minute": 115,
   "dir": "short",
   "entry": 38.1,
   "stopDist": 0.7444000244140625,
   "marketAgainst": false,
   "volRatio": 0.9246601801727558,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6018269550066605,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.881767311457557,
   "gap": -2.560817558509698,
   "atrPct": 4.765685268615748,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "GDX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.770165083880235,
   "minute": 85,
   "dir": "short",
   "entry": 20.4,
   "stopDist": 0.20828557695661273,
   "marketAgainst": false,
   "volRatio": 1.5765661804430038,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6337452738146013,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 3.4008731423573764,
   "gap": 2.907264234986884,
   "atrPct": 2.6100948495142275,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-20",
   "sym": "VOO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 320,
   "dir": "long",
   "entry": 227.7797,
   "stopDist": 2.2377397809709825,
   "marketAgainst": false,
   "volRatio": 1.8835535314199385,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7489163906595121,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 3.269120924101945,
   "gap": -0.46639271967797713,
   "atrPct": 2.4384750662877113,
   "spyGap": -0.4700419525536903,
   "spyTrend": "market downtrend",
   "spyVol": 21.578413835311615
  },
  {
   "date": "2018-12-21",
   "sym": "BRO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 50,
   "dir": "long",
   "entry": 27.49,
   "stopDist": 0.24614290509905135,
   "marketAgainst": false,
   "volRatio": 1.2190614464650442,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6012767255690011,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 35.21981529337877,
   "gap": -0.18504980354027145,
   "atrPct": 2.277413961223,
   "spyGap": -0.1578246972555819,
   "spyTrend": "market downtrend",
   "spyVol": 21.93299591886448
  },
  {
   "date": "2018-12-21",
   "sym": "PRSP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.5873190248688256,
   "minute": 45,
   "dir": "long",
   "entry": 18.04,
   "stopDist": 0.31638559613909045,
   "marketAgainst": false,
   "volRatio": 2.1738843544245694,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6068544280871514,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 31.77086197163677,
   "gap": -0.8342577644897653,
   "atrPct": 4.399132427615996,
   "spyGap": -0.1578246972555819,
   "spyTrend": "market downtrend",
   "spyVol": 21.93299591886448
  },
  {
   "date": "2018-12-21",
   "sym": "L",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 50,
   "dir": "long",
   "entry": 45.6428,
   "stopDist": 0.45771462576729915,
   "marketAgainst": false,
   "volRatio": 1.6694691495275154,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6928334428212544,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 29.742084332594636,
   "gap": -0.20157115969355877,
   "atrPct": 2.5627917700182503,
   "spyGap": -0.1578246972555819,
   "spyTrend": "market downtrend",
   "spyVol": 21.93299591886448
  },
  {
   "date": "2018-12-21",
   "sym": "KMX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 2.483926913246024,
   "minute": 40,
   "dir": "long",
   "entry": 58.045,
   "stopDist": 0.7952084132603238,
   "marketAgainst": true,
   "volRatio": 0.6660206223677435,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.643856367038196,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 24.963909726022987,
   "gap": 2.8385027232848747,
   "atrPct": 3.50497353731574,
   "spyGap": -0.1578246972555819,
   "spyTrend": "market downtrend",
   "spyVol": 21.93299591886448
  },
  {
   "date": "2018-12-21",
   "sym": "SBRA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.8094126098703079,
   "minute": 50,
   "dir": "long",
   "entry": 17.91,
   "stopDist": 0.2238572256905692,
   "marketAgainst": false,
   "volRatio": 1.0073548995103563,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7147412798779272,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 24.31348550797504,
   "gap": -0.1711391070758017,
   "atrPct": 3.192487406191395,
   "spyGap": -0.1578246972555819,
   "spyTrend": "market downtrend",
   "spyVol": 21.93299591886448
  },
  {
   "date": "2018-12-24",
   "sym": "SDY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.9362601950106386,
   "minute": 40,
   "dir": "short",
   "entry": 85.5899,
   "stopDist": 0.7899485996791294,
   "marketAgainst": false,
   "volRatio": 2.2300253097109364,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6330032108457606,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.8522983183414032,
   "gap": -0.4568852516445232,
   "atrPct": 2.255706945013262,
   "spyGap": -0.6566645635441626,
   "spyTrend": "market downtrend",
   "spyVol": 23.391663445242127
  },
  {
   "date": "2018-12-24",
   "sym": "HR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.7967714191165279,
   "minute": 40,
   "dir": "short",
   "entry": 25.1,
   "stopDist": 0.2544285910470145,
   "marketAgainst": false,
   "volRatio": 1.769918118014037,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.754632170896706,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.4300374954750694,
   "gap": -0.4285160731087423,
   "atrPct": 2.4778787523454024,
   "spyGap": -0.6566645635441626,
   "spyTrend": "market downtrend",
   "spyVol": 23.391663445242127
  },
  {
   "date": "2018-12-26",
   "sym": "WH",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.8344968144651697,
   "minute": 45,
   "dir": "short",
   "entry": 43.1,
   "stopDist": 0.6118571690150669,
   "marketAgainst": false,
   "volRatio": 0.8967415171121587,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6145225046643854,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.458107277075504,
   "gap": 0,
   "atrPct": 3.5164205115808445,
   "spyGap": 0.6826833281335709,
   "spyTrend": "market downtrend",
   "spyVol": 23.28443874122481
  },
  {
   "date": "2018-12-27",
   "sym": "AMLP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4793504024757978,
   "minute": 60,
   "dir": "short",
   "entry": 42.33,
   "stopDist": 0.6288569859095983,
   "marketAgainst": false,
   "volRatio": 1.0794005752056106,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.616992430224472,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.6525738786071753,
   "gap": -80.18243944722468,
   "atrPct": 3.5852737046315406,
   "spyGap": -1.3580199709293805,
   "spyTrend": "market downtrend",
   "spyVol": 30.261602113258284
  },
  {
   "date": "2018-12-27",
   "sym": "ANDX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.8275113132883498,
   "minute": 60,
   "dir": "short",
   "entry": 32.24,
   "stopDist": 0.5916312626429966,
   "marketAgainst": false,
   "volRatio": 1.155967358667821,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6422919544555892,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.1231436854180377,
   "gap": -2.007673319542469,
   "atrPct": 4.366927083706244,
   "spyGap": -1.3580199709293805,
   "spyTrend": "market downtrend",
   "spyVol": 30.261602113258284
  },
  {
   "date": "2018-12-28",
   "sym": "BC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3243983129093844,
   "minute": 45,
   "dir": "short",
   "entry": 46.04,
   "stopDist": 0.8012856619698662,
   "marketAgainst": false,
   "volRatio": 0.9318013343217197,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8087003558842767,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "doji",
   "rvol": 3.183385166833588,
   "gap": 0.3270810895161125,
   "atrPct": 4.368107562721004,
   "spyGap": 0.5519492563054174,
   "spyTrend": "market downtrend",
   "spyVol": 29.04830893457734
  }
 ]
}
```
