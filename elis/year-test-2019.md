# Elis year test 2019

Out-of-sample year 2019 (252 sessions, formulas found on 2024-2025, never on 2019). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 157 trades, 51% wins, avg 0.09R, total 13.7R -> $3,000 became $3,466 (+15.5%, max drawdown 7.6%)
- midday, against the market, S&P flat at the open -> go with the stock: 99 trades, 45% wins, avg -0.06R, total -5.8R -> $3,000 became $2,783 (-7.2%, max drawdown 14.2%)
- midday, against the market, normal volume -> go with the stock: 98 trades, 53% wins, avg 0.06R, total 6.1R -> $3,000 became $3,146 (+4.9%, max drawdown 7.9%)
- afternoon, far from VWAP in the move direction -> go with the stock: 275 trades, 40% wins, avg -0.2R, total -56.3R -> $3,000 became $1,975 (-34.2%, max drawdown 34.8%)
- strong move alone (control) -> go with the stock: 2756 trades, 43% wins, avg -0.06R, total -159.9R -> $3,000 became $1,355 (-54.8%, max drawdown 55.3%)

```json
{
 "year": "2019",
 "sessions": 252,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 157,
   "winPct": 51,
   "avgR": 0.09,
   "totalR": 13.7,
   "money3k": {
    "start": 3000,
    "end": 3466,
    "returnPct": 15.5,
    "maxDrawdownPct": 7.6
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 99,
   "winPct": 45,
   "avgR": -0.06,
   "totalR": -5.8,
   "money3k": {
    "start": 3000,
    "end": 2783,
    "returnPct": -7.2,
    "maxDrawdownPct": 14.2
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 98,
   "winPct": 53,
   "avgR": 0.06,
   "totalR": 6.1,
   "money3k": {
    "start": 3000,
    "end": 3146,
    "returnPct": 4.9,
    "maxDrawdownPct": 7.9
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 275,
   "winPct": 40,
   "avgR": -0.2,
   "totalR": -56.3,
   "money3k": {
    "start": 3000,
    "end": 1975,
    "returnPct": -34.2,
    "maxDrawdownPct": 34.8
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2756,
   "winPct": 43,
   "avgR": -0.06,
   "totalR": -159.9,
   "money3k": {
    "start": 3000,
    "end": 1355,
    "returnPct": -54.8,
    "maxDrawdownPct": 55.3
   }
  }
 },
 "trades": 3385,
 "why": {
  "n": 2756,
  "overall": -0.06,
  "findings": [
   {
    "dim": "candle read",
    "value": "candle-against",
    "n": 354,
    "avgR": 0.1,
    "winPct": 49,
    "z": 3.13,
    "better": true
   },
   {
    "dim": "volume on the signal candle",
    "value": "rising",
    "n": 283,
    "avgR": -0.21,
    "winPct": 33,
    "z": -2.7,
    "better": false
   },
   {
    "dim": "latest candle pattern",
    "value": "strong bear candle",
    "n": 89,
    "avgR": -0.29,
    "winPct": 31,
    "z": -2.31,
    "better": false
   },
   {
    "dim": "time of day",
    "value": "11:30-1:00",
    "n": 108,
    "avgR": -0.26,
    "winPct": 30,
    "z": -2.21,
    "better": false
   },
   {
    "dim": "stock opening gap",
    "value": "gap up 1-4%",
    "n": 514,
    "avgR": -0.15,
    "winPct": 39,
    "z": -2.2,
    "better": false
   },
   {
    "dim": "sector",
    "value": "sector flat",
    "n": 827,
    "avgR": -0.13,
    "winPct": 38,
    "z": -2.18,
    "better": false
   },
   {
    "dim": "latest candle pattern",
    "value": "three black crows",
    "n": 502,
    "avgR": -0.15,
    "winPct": 38,
    "z": -2.17,
    "better": false
   },
   {
    "dim": "month",
    "value": "2019-05",
    "n": 259,
    "avgR": 0.07,
    "winPct": 47,
    "z": 2.17,
    "better": true
   },
   {
    "dim": "candle read",
    "value": "candle-mild",
    "n": 313,
    "avgR": -0.17,
    "winPct": 39,
    "z": -2.09,
    "better": false
   }
  ],
  "tables": {
   "market trend": {
    "market downtrend": {
     "n": 577,
     "avgR": -0.13,
     "winPct": 40
    },
    "market uptrend": {
     "n": 2179,
     "avgR": -0.04,
     "winPct": 44
    }
   },
   "market volatility": {
    "panicky market (28%+)": {
     "n": 78,
     "avgR": -0.11,
     "winPct": 44
    },
    "nervous market (18-28%)": {
     "n": 238,
     "avgR": -0.09,
     "winPct": 42
    },
    "normal market (12-18%)": {
     "n": 650,
     "avgR": -0.01,
     "winPct": 46
    },
    "calm market (<12%)": {
     "n": 1790,
     "avgR": -0.07,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped down hard": {
     "n": 168,
     "avgR": -0.02,
     "winPct": 48
    },
    "S&P gapped up hard": {
     "n": 126,
     "avgR": -0.09,
     "winPct": 39
    },
    "S&P flat": {
     "n": 1345,
     "avgR": -0.08,
     "winPct": 42
    },
    "S&P gapped up": {
     "n": 708,
     "avgR": -0.06,
     "winPct": 44
    },
    "S&P gapped down": {
     "n": 409,
     "avgR": 0.01,
     "winPct": 44
    }
   },
   "time of day": {
    "first hour": {
     "n": 2178,
     "avgR": -0.05,
     "winPct": 43
    },
    "10:30-11:30": {
     "n": 406,
     "avgR": -0.02,
     "winPct": 47
    },
    "11:30-1:00": {
     "n": 108,
     "avgR": -0.26,
     "winPct": 30
    },
    "1:00-2:30": {
     "n": 34,
     "avgR": -0.13,
     "winPct": 41
    },
    "last 90 min": {
     "n": 30,
     "avgR": -0.25,
     "winPct": 40
    }
   },
   "side": {
    "long": {
     "n": 1356,
     "avgR": -0.04,
     "winPct": 45
    },
    "short": {
     "n": 1400,
     "avgR": -0.08,
     "winPct": 41
    }
   },
   "moving against the market": {
    "no": {
     "n": 2452,
     "avgR": -0.05,
     "winPct": 44
    },
    "yes": {
     "n": 304,
     "avgR": -0.09,
     "winPct": 39
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 1186,
     "avgR": -0.04,
     "winPct": 43
    },
    "surging": {
     "n": 77,
     "avgR": -0.18,
     "winPct": 40
    },
    "fading": {
     "n": 1210,
     "avgR": -0.03,
     "winPct": 45
    },
    "rising": {
     "n": 283,
     "avgR": -0.21,
     "winPct": 33
    }
   },
   "price vs VWAP": {
    "with the move": {
     "n": 1440,
     "avgR": -0.03,
     "winPct": 45
    },
    "with the move, far": {
     "n": 1258,
     "avgR": -0.09,
     "winPct": 40
    },
    "against the move": {
     "n": 58,
     "avgR": -0.18,
     "winPct": 43
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 1635,
     "avgR": -0.08,
     "winPct": 44
    },
    "0.8-1.2x range": {
     "n": 780,
     "avgR": -0.04,
     "winPct": 43
    },
    "1.2x+ range": {
     "n": 341,
     "avgR": 0.01,
     "winPct": 40
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 721,
     "avgR": -0.05,
     "winPct": 46
    },
    "gap down 1-4%": {
     "n": 455,
     "avgR": -0.12,
     "winPct": 40
    },
    "gap down 4%+": {
     "n": 422,
     "avgR": 0.03,
     "winPct": 47
    },
    "gap up 4%+": {
     "n": 644,
     "avgR": -0.02,
     "winPct": 43
    },
    "gap up 1-4%": {
     "n": 514,
     "avgR": -0.15,
     "winPct": 39
    }
   },
   "opening volume surge": {
    "2-4x": {
     "n": 1008,
     "avgR": -0.06,
     "winPct": 45
    },
    "8x+": {
     "n": 691,
     "avgR": -0.05,
     "winPct": 42
    },
    "4-8x": {
     "n": 1030,
     "avgR": -0.06,
     "winPct": 43
    },
    "1-2x normal": {
     "n": 27,
     "avgR": -0.27,
     "winPct": 30
    }
   },
   "stock volatility": {
    "normal stock": {
     "n": 932,
     "avgR": -0.09,
     "winPct": 43
    },
    "jumpy stock": {
     "n": 138,
     "avgR": -0.14,
     "winPct": 38
    },
    "calm stock": {
     "n": 1680,
     "avgR": -0.03,
     "winPct": 44
    },
    "very jumpy stock": {
     "n": 6,
     "avgR": -0.37,
     "winPct": 17
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2756,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2756,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "overnight news": {
    "none": {
     "n": 2756,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2756,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1422,
     "avgR": -0.03,
     "winPct": 45
    },
    "sector against the move": {
     "n": 428,
     "avgR": 0.02,
     "winPct": 47
    },
    "sector flat": {
     "n": 827,
     "avgR": -0.13,
     "winPct": 38
    },
    "no sector": {
     "n": 79,
     "avgR": -0.15,
     "winPct": 39
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1343,
     "avgR": -0.09,
     "winPct": 42
    },
    "candle-against": {
     "n": 354,
     "avgR": 0.1,
     "winPct": 49
    },
    "candle-none": {
     "n": 746,
     "avgR": -0.03,
     "winPct": 44
    },
    "candle-mild": {
     "n": 313,
     "avgR": -0.17,
     "winPct": 39
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1478,
     "avgR": -0.1,
     "winPct": 42
    },
    "range": {
     "n": 1176,
     "avgR": -0.01,
     "winPct": 44
    },
    "trend-against": {
     "n": 102,
     "avgR": -0.03,
     "winPct": 45
    }
   },
   "latest candle pattern": {
    "three white soldiers": {
     "n": 525,
     "avgR": -0.05,
     "winPct": 45
    },
    "inside bar": {
     "n": 261,
     "avgR": 0.03,
     "winPct": 49
    },
    "inverted hammer": {
     "n": 13,
     "avgR": 0.53,
     "winPct": 62
    },
    "bearish engulfing": {
     "n": 78,
     "avgR": -0.06,
     "winPct": 47
    },
    "three black crows": {
     "n": 502,
     "avgR": -0.15,
     "winPct": 38
    },
    "tweezer top": {
     "n": 51,
     "avgR": -0.03,
     "winPct": 33
    },
    "outside bar": {
     "n": 112,
     "avgR": 0.02,
     "winPct": 43
    },
    "none": {
     "n": 496,
     "avgR": -0.04,
     "winPct": 44
    },
    "doji": {
     "n": 25,
     "avgR": -0.19,
     "winPct": 28
    },
    "strong bull candle": {
     "n": 81,
     "avgR": -0.07,
     "winPct": 44
    },
    "strong bear candle": {
     "n": 89,
     "avgR": -0.29,
     "winPct": 31
    },
    "bullish marubozu": {
     "n": 16,
     "avgR": 0.24,
     "winPct": 56
    },
    "tweezer bottom": {
     "n": 53,
     "avgR": -0.01,
     "winPct": 42
    },
    "bearish harami": {
     "n": 19,
     "avgR": 0.25,
     "winPct": 58
    },
    "shooting star": {
     "n": 22,
     "avgR": 0.16,
     "winPct": 55
    },
    "bullish engulfing": {
     "n": 84,
     "avgR": -0.13,
     "winPct": 40
    },
    "piercing line": {
     "n": 14,
     "avgR": -0.14,
     "winPct": 43
    },
    "bullish harami": {
     "n": 16,
     "avgR": -0.07,
     "winPct": 44
    },
    "gravestone doji": {
     "n": 31,
     "avgR": -0.11,
     "winPct": 42
    },
    "spinning top": {
     "n": 63,
     "avgR": 0.02,
     "winPct": 43
    },
    "bull flag": {
     "n": 18,
     "avgR": 0.08,
     "winPct": 72
    },
    "evening star": {
     "n": 25,
     "avgR": 0.17,
     "winPct": 56
    },
    "bearish marubozu": {
     "n": 34,
     "avgR": -0.16,
     "winPct": 41
    },
    "hanging man": {
     "n": 18,
     "avgR": -0.15,
     "winPct": 39
    },
    "morning star": {
     "n": 23,
     "avgR": -0.15,
     "winPct": 26
    },
    "dark cloud cover": {
     "n": 19,
     "avgR": 0.2,
     "winPct": 47
    },
    "hammer": {
     "n": 20,
     "avgR": -0.04,
     "winPct": 35
    },
    "dragonfly doji": {
     "n": 34,
     "avgR": -0.19,
     "winPct": 44
    },
    "bear flag": {
     "n": 14,
     "avgR": -0.12,
     "winPct": 43
    }
   },
   "month": {
    "2019-01": {
     "n": 187,
     "avgR": -0.03,
     "winPct": 48
    },
    "2019-02": {
     "n": 271,
     "avgR": -0.08,
     "winPct": 41
    },
    "2019-03": {
     "n": 219,
     "avgR": -0.07,
     "winPct": 40
    },
    "2019-04": {
     "n": 249,
     "avgR": -0.17,
     "winPct": 38
    },
    "2019-05": {
     "n": 259,
     "avgR": 0.07,
     "winPct": 47
    },
    "2019-06": {
     "n": 170,
     "avgR": 0,
     "winPct": 46
    },
    "2019-07": {
     "n": 268,
     "avgR": 0.03,
     "winPct": 47
    },
    "2019-08": {
     "n": 242,
     "avgR": -0.08,
     "winPct": 43
    },
    "2019-09": {
     "n": 191,
     "avgR": -0.13,
     "winPct": 40
    },
    "2019-10": {
     "n": 257,
     "avgR": -0.01,
     "winPct": 45
    },
    "2019-11": {
     "n": 248,
     "avgR": -0.08,
     "winPct": 44
    },
    "2019-12": {
     "n": 195,
     "avgR": -0.15,
     "winPct": 38
    }
   }
  },
  "text": "Overall -0.06R avg over 2756 trades.\nMade money when:\n  + candle read = candle-against: +0.1R avg, 49% wins, 354 trades\n  + month = 2019-05: +0.07R avg, 47% wins, 259 trades\nLost most when:\n  - volume on the signal candle = rising: -0.21R avg, 33% wins, 283 trades\n  - latest candle pattern = strong bear candle: -0.29R avg, 31% wins, 89 trades\n  - time of day = 11:30-1:00: -0.26R avg, 30% wins, 108 trades\n  - stock opening gap = gap up 1-4%: -0.15R avg, 39% wins, 514 trades\n  - sector = sector flat: -0.13R avg, 38% wins, 827 trades"
 },
 "whyFormula": {
  "n": 157,
  "overall": 0.09,
  "findings": [
   {
    "dim": "price vs VWAP",
    "value": "against the move",
    "n": 16,
    "avgR": 0.76,
    "winPct": 75,
    "z": 2.74,
    "better": true
   },
   {
    "dim": "S&P gap at the open",
    "value": "S&P gapped down",
    "n": 23,
    "avgR": 0.51,
    "winPct": 70,
    "z": 2.06,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 97,
     "avgR": -0.03,
     "winPct": 44
    },
    "market downtrend": {
     "n": 60,
     "avgR": 0.28,
     "winPct": 62
    }
   },
   "market volatility": {
    "panicky market (28%+)": {
     "n": 1,
     "avgR": -0.02,
     "winPct": 0
    },
    "nervous market (18-28%)": {
     "n": 11,
     "avgR": 0.64,
     "winPct": 55
    },
    "normal market (12-18%)": {
     "n": 53,
     "avgR": -0.1,
     "winPct": 45
    },
    "calm market (<12%)": {
     "n": 92,
     "avgR": 0.13,
     "winPct": 54
    }
   },
   "S&P gap at the open": {
    "S&P gapped down": {
     "n": 23,
     "avgR": 0.51,
     "winPct": 70
    },
    "S&P gapped up": {
     "n": 47,
     "avgR": 0.06,
     "winPct": 47
    },
    "S&P flat": {
     "n": 67,
     "avgR": -0.11,
     "winPct": 45
    },
    "S&P gapped up hard": {
     "n": 5,
     "avgR": 0.58,
     "winPct": 80
    },
    "S&P gapped down hard": {
     "n": 15,
     "avgR": 0.23,
     "winPct": 53
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 84,
     "avgR": 0.11,
     "winPct": 49
    },
    "11:30-1:00": {
     "n": 73,
     "avgR": 0.06,
     "winPct": 53
    }
   },
   "side": {
    "short": {
     "n": 72,
     "avgR": 0.05,
     "winPct": 51
    },
    "long": {
     "n": 85,
     "avgR": 0.12,
     "winPct": 51
    }
   },
   "moving against the market": {
    "yes": {
     "n": 157,
     "avgR": 0.09,
     "winPct": 51
    }
   },
   "volume on the signal candle": {
    "surging": {
     "n": 4,
     "avgR": -0.79,
     "winPct": 0
    },
    "normal": {
     "n": 79,
     "avgR": 0.19,
     "winPct": 59
    },
    "fading": {
     "n": 52,
     "avgR": 0.13,
     "winPct": 50
    },
    "rising": {
     "n": 22,
     "avgR": -0.23,
     "winPct": 32
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 99,
     "avgR": -0.01,
     "winPct": 51
    },
    "with the move": {
     "n": 36,
     "avgR": -0.01,
     "winPct": 39
    },
    "against the move": {
     "n": 16,
     "avgR": 0.76,
     "winPct": 75
    },
    "against the move, far": {
     "n": 6,
     "avgR": 0.53,
     "winPct": 67
    }
   },
   "size of the 30-min move": {
    "0.8-1.2x range": {
     "n": 37,
     "avgR": 0.21,
     "winPct": 51
    },
    "0.6-0.8x range": {
     "n": 110,
     "avgR": 0.05,
     "winPct": 52
    },
    "1.2x+ range": {
     "n": 10,
     "avgR": 0.06,
     "winPct": 40
    }
   },
   "stock opening gap": {
    "gap down 1-4%": {
     "n": 23,
     "avgR": 0.13,
     "winPct": 39
    },
    "gap up 4%+": {
     "n": 46,
     "avgR": 0.24,
     "winPct": 61
    },
    "gap up 1-4%": {
     "n": 35,
     "avgR": -0.1,
     "winPct": 46
    },
    "no gap": {
     "n": 18,
     "avgR": -0.26,
     "winPct": 33
    },
    "gap down 4%+": {
     "n": 35,
     "avgR": 0.23,
     "winPct": 60
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 53,
     "avgR": 0.3,
     "winPct": 58
    },
    "4-8x": {
     "n": 75,
     "avgR": 0.03,
     "winPct": 51
    },
    "2-4x": {
     "n": 29,
     "avgR": -0.15,
     "winPct": 38
    }
   },
   "stock volatility": {
    "jumpy stock": {
     "n": 5,
     "avgR": -0.69,
     "winPct": 0
    },
    "calm stock": {
     "n": 105,
     "avgR": 0.08,
     "winPct": 50
    },
    "normal stock": {
     "n": 47,
     "avgR": 0.18,
     "winPct": 60
    }
   },
   "news in the last hour": {
    "none": {
     "n": 157,
     "avgR": 0.09,
     "winPct": 51
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 157,
     "avgR": 0.09,
     "winPct": 51
    }
   },
   "overnight news": {
    "none": {
     "n": 157,
     "avgR": 0.09,
     "winPct": 51
    }
   },
   "type of overnight news": {
    "none": {
     "n": 157,
     "avgR": 0.09,
     "winPct": 51
    }
   },
   "sector": {
    "sector flat": {
     "n": 54,
     "avgR": 0.24,
     "winPct": 57
    },
    "sector against the move": {
     "n": 85,
     "avgR": 0.04,
     "winPct": 49
    },
    "sector with the move": {
     "n": 12,
     "avgR": -0.39,
     "winPct": 33
    },
    "no sector": {
     "n": 6,
     "avgR": 0.26,
     "winPct": 50
    }
   },
   "candle read": {
    "candle-against": {
     "n": 15,
     "avgR": 0.54,
     "winPct": 67
    },
    "candle-none": {
     "n": 33,
     "avgR": 0.19,
     "winPct": 58
    },
    "candle-with": {
     "n": 80,
     "avgR": -0.04,
     "winPct": 46
    },
    "candle-mild": {
     "n": 29,
     "avgR": 0.1,
     "winPct": 48
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 95,
     "avgR": 0.05,
     "winPct": 49
    },
    "trend-against": {
     "n": 4,
     "avgR": -0.14,
     "winPct": 50
    },
    "range": {
     "n": 58,
     "avgR": 0.16,
     "winPct": 53
    }
   },
   "latest candle pattern": {
    "hammer": {
     "n": 1,
     "avgR": -0.02,
     "winPct": 0
    },
    "piercing line": {
     "n": 1,
     "avgR": -0.18,
     "winPct": 0
    },
    "bullish marubozu": {
     "n": 2,
     "avgR": 0.03,
     "winPct": 50
    },
    "bullish harami": {
     "n": 2,
     "avgR": 0.72,
     "winPct": 50
    },
    "three white soldiers": {
     "n": 33,
     "avgR": -0.17,
     "winPct": 36
    },
    "none": {
     "n": 14,
     "avgR": 0.51,
     "winPct": 79
    },
    "bullish engulfing": {
     "n": 5,
     "avgR": 0.38,
     "winPct": 80
    },
    "three black crows": {
     "n": 35,
     "avgR": 0.09,
     "winPct": 57
    },
    "strong bear candle": {
     "n": 5,
     "avgR": -0.32,
     "winPct": 40
    },
    "dragonfly doji": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bearish harami": {
     "n": 4,
     "avgR": -0.05,
     "winPct": 50
    },
    "evening star": {
     "n": 4,
     "avgR": -0.16,
     "winPct": 50
    },
    "strong bull candle": {
     "n": 8,
     "avgR": 0.27,
     "winPct": 63
    },
    "inside bar": {
     "n": 18,
     "avgR": 0.12,
     "winPct": 50
    },
    "outside bar": {
     "n": 8,
     "avgR": -0.09,
     "winPct": 25
    },
    "spinning top": {
     "n": 5,
     "avgR": 0.18,
     "winPct": 60
    },
    "morning star": {
     "n": 2,
     "avgR": 1.56,
     "winPct": 100
    },
    "tweezer top": {
     "n": 3,
     "avgR": 0.36,
     "winPct": 33
    },
    "bear flag": {
     "n": 1,
     "avgR": -0.66,
     "winPct": 0
    },
    "bearish engulfing": {
     "n": 2,
     "avgR": 0.36,
     "winPct": 50
    },
    "doji": {
     "n": 1,
     "avgR": 0.04,
     "winPct": 100
    },
    "shooting star": {
     "n": 1,
     "avgR": 1.91,
     "winPct": 100
    },
    "bearish marubozu": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "month": {
    "2019-01": {
     "n": 11,
     "avgR": 0.25,
     "winPct": 45
    },
    "2019-02": {
     "n": 20,
     "avgR": 0.24,
     "winPct": 65
    },
    "2019-03": {
     "n": 18,
     "avgR": -0.25,
     "winPct": 39
    },
    "2019-04": {
     "n": 10,
     "avgR": -0.19,
     "winPct": 40
    },
    "2019-05": {
     "n": 31,
     "avgR": 0.1,
     "winPct": 52
    },
    "2019-06": {
     "n": 2,
     "avgR": 0.39,
     "winPct": 100
    },
    "2019-07": {
     "n": 3,
     "avgR": 0.6,
     "winPct": 33
    },
    "2019-08": {
     "n": 35,
     "avgR": 0.18,
     "winPct": 54
    },
    "2019-09": {
     "n": 7,
     "avgR": 0.17,
     "winPct": 43
    },
    "2019-10": {
     "n": 17,
     "avgR": -0.13,
     "winPct": 47
    },
    "2019-11": {
     "n": 2,
     "avgR": 0.51,
     "winPct": 50
    },
    "2019-12": {
     "n": 1,
     "avgR": 0.92,
     "winPct": 100
    }
   }
  },
  "text": "Overall +0.09R avg over 157 trades.\nMade money when:\n  + price vs VWAP = against the move: +0.76R avg, 75% wins, 16 trades\n  + S&P gap at the open = S&P gapped down: +0.51R avg, 70% wins, 23 trades\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2019-12-27",
   "sym": "RVLV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6115436204442181,
   "minute": 70,
   "dir": "long",
   "entry": 19.6097,
   "stopDist": 0.39124298095703125,
   "marketAgainst": false,
   "volRatio": 1.5953970938064257,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6131228205378195,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "outside bar",
   "rvol": 2.07757760554274,
   "gap": 0.10363090015592658,
   "atrPct": 5.0679144614388445,
   "spyGap": 0.2477232775579985,
   "spyTrend": "market uptrend",
   "spyVol": 7.378452503902736
  },
  {
   "date": "2019-12-27",
   "sym": "TNA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.41642362779774583,
   "minute": 35,
   "dir": "short",
   "entry": 71.97,
   "stopDist": 0.6549795968191965,
   "marketAgainst": false,
   "volRatio": 0.6521150975935194,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8122390416183529,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "spinning top",
   "rvol": 1.923723347572888,
   "gap": 0.5997810605066212,
   "atrPct": 2.232073307557929,
   "spyGap": 0.2477232775579985,
   "spyTrend": "market uptrend",
   "spyVol": 7.378452503902736
  },
  {
   "date": "2019-12-27",
   "sym": "GGAL",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3546555249792618,
   "minute": 40,
   "dir": "short",
   "entry": 16.59,
   "stopDist": 0.370685659136091,
   "marketAgainst": false,
   "volRatio": 1.2171658037449506,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7499615729615726,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.7738701755913855,
   "gap": 1.3489781421192948,
   "atrPct": 5.435273837584023,
   "spyGap": 0.2477232775579985,
   "spyTrend": "market uptrend",
   "spyVol": 7.378452503902736
  },
  {
   "date": "2019-12-27",
   "sym": "WYNN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.38190391402159723,
   "minute": 40,
   "dir": "short",
   "entry": 138.97,
   "stopDist": 1.4311370849609375,
   "marketAgainst": false,
   "volRatio": 1.0853334896064428,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6512304165644927,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 1.5653343969284308,
   "gap": 0.43990176518657886,
   "atrPct": 2.53855729418607,
   "spyGap": 0.2477232775579985,
   "spyTrend": "market uptrend",
   "spyVol": 7.378452503902736
  },
  {
   "date": "2019-12-27",
   "sym": "FSLR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3358059313872964,
   "minute": 35,
   "dir": "short",
   "entry": 57.13,
   "stopDist": 0.48984287806919646,
   "marketAgainst": false,
   "volRatio": 2.230896178862396,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.0452331205021035,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.499716594748775,
   "gap": 0.32390070419727746,
   "atrPct": 2.0876358649138607,
   "spyGap": 0.2477232775579985,
   "spyTrend": "market uptrend",
   "spyVol": 7.378452503902736
  },
  {
   "date": "2019-12-30",
   "sym": "MIK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.6739913052376948,
   "minute": 35,
   "dir": "short",
   "entry": 7.3,
   "stopDist": 0.22099712916782926,
   "marketAgainst": false,
   "volRatio": 0.4320900391474555,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8284270510182316,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three black crows",
   "rvol": 9.005361507362434,
   "gap": -0.3750000000000031,
   "atrPct": 6.906160286494664,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "TRP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.4382482484868893,
   "minute": 35,
   "dir": "short",
   "entry": 52.825,
   "stopDist": 0.2560173034667969,
   "marketAgainst": false,
   "volRatio": 0.43771690783642975,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6483936739905878,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 4.0010068289266325,
   "gap": -0.3532889245248749,
   "atrPct": 1.1901139330508557,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "MYGN",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8496021368910242,
   "minute": 35,
   "dir": "short",
   "entry": 26.61,
   "stopDist": 0.45575703212193086,
   "marketAgainst": false,
   "volRatio": 0.858958046693379,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7065168001924624,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "bullish engulfing",
   "rvol": 3.9413757282868884,
   "gap": 6.4227007813790316,
   "atrPct": 4.254639847238736,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "VTV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3466137399482632,
   "minute": 55,
   "dir": "short",
   "entry": 119.62,
   "stopDist": 0.2676882062639509,
   "marketAgainst": false,
   "volRatio": 1.3614837314739305,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6030896999653875,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bear flag",
   "rvol": 3.711242329785865,
   "gap": 0.0832652182759741,
   "atrPct": 0.5572194206181273,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "WW",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.4287797561843195,
   "minute": 35,
   "dir": "short",
   "entry": 36.74,
   "stopDist": 0.7519114903041295,
   "marketAgainst": false,
   "volRatio": 0.5053784921781357,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7607278348261977,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "three black crows",
   "rvol": 2.7412470920773373,
   "gap": 0.5316349648955665,
   "atrPct": 4.996753798860745,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "PDD",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.26337438918411243,
   "minute": 35,
   "dir": "short",
   "entry": 38.57,
   "stopDist": 0.5105713980538504,
   "marketAgainst": false,
   "volRatio": 0.33806739263292407,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6659205770162245,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bearish engulfing",
   "rvol": 1.687932528367159,
   "gap": -0.1783936683805165,
   "atrPct": 3.252875740408223,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "FLR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.2618294449305788,
   "minute": 40,
   "dir": "long",
   "entry": 18.51,
   "stopDist": 0.2596428462437221,
   "marketAgainst": false,
   "volRatio": 1.9514100191348536,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6624484459646849,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer bottom",
   "rvol": 1.6111182008485296,
   "gap": -0.6618817778341612,
   "atrPct": 3.58029313654893,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "USO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 125,
   "dir": "short",
   "entry": 102.4,
   "stopDist": 0.5308571951729911,
   "marketAgainst": false,
   "volRatio": 9.082753244621928,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.0850375679890658,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 1.6042679346239928,
   "gap": -87.40317568380148,
   "atrPct": 1.284995162295172,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "TWLO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3083220388261421,
   "minute": 35,
   "dir": "short",
   "entry": 97.38,
   "stopDist": 0.9484285627092635,
   "marketAgainst": false,
   "volRatio": 0.5181090306180713,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8859286118500966,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bear flag",
   "rvol": 1.4799350169841974,
   "gap": -0.8662753186618688,
   "atrPct": 2.3609194459506164,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "TECL",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.04510868776497946,
   "minute": 35,
   "dir": "short",
   "entry": 23.59,
   "stopDist": 0.21028573172433035,
   "marketAgainst": false,
   "volRatio": 0.49220529646121397,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9891303527558069,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 1.3875830469644903,
   "gap": 898.0351901524285,
   "atrPct": 2.1519210918693568,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-30",
   "sym": "PS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.07362278781923787,
   "minute": 35,
   "dir": "short",
   "entry": 16.44,
   "stopDist": 0.211660030909947,
   "marketAgainst": false,
   "volRatio": 2.09020565233583,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7370309799603623,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-against",
   "pattern": "outside bar",
   "rvol": 1.3481622896379124,
   "gap": -0.4072165903597713,
   "atrPct": 3.0782435185298054,
   "spyGap": 0.034069659100177674,
   "spyTrend": "market uptrend",
   "spyVol": 7.1933743809069135
  },
  {
   "date": "2019-12-31",
   "sym": "MTOR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 25.35,
   "stopDist": 0.2494286673409598,
   "marketAgainst": false,
   "volRatio": 0.4426354495382732,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.4432984140828236,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "bearish engulfing",
   "rvol": 22.7683737366714,
   "gap": 8.233277574192744,
   "atrPct": 2.673978029642937,
   "spyGap": -0.18995574176730035,
   "spyTrend": "market uptrend",
   "spyVol": 6.679533849389574
  },
  {
   "date": "2019-12-31",
   "sym": "BE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 75,
   "dir": "short",
   "entry": 7.2,
   "stopDist": 0.2183342524937221,
   "marketAgainst": false,
   "volRatio": 2.1791016221276944,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6870200084813217,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer top",
   "rvol": 3.258994864356744,
   "gap": 2.920722407625731,
   "atrPct": 7.591594254386094,
   "spyGap": -0.18995574176730035,
   "spyTrend": "market uptrend",
   "spyVol": 6.679533849389574
  },
  {
   "date": "2019-12-31",
   "sym": "PEG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.4229725097203703,
   "minute": 35,
   "dir": "short",
   "entry": 58.87,
   "stopDist": 0.25371453421456475,
   "marketAgainst": false,
   "volRatio": 0.3491192686863632,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6858101390945552,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "piercing line",
   "rvol": 2.803135515353192,
   "gap": 0.3920263136746316,
   "atrPct": 1.081108497242372,
   "spyGap": -0.18995574176730035,
   "spyTrend": "market uptrend",
   "spyVol": 6.679533849389574
  },
  {
   "date": "2019-12-31",
   "sym": "CRC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.1384253192723437,
   "minute": 35,
   "dir": "long",
   "entry": 8.81,
   "stopDist": 0.21228569575718473,
   "marketAgainst": false,
   "volRatio": 1.1991687200883154,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6029610216715132,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "spinning top",
   "rvol": 2.208478710593757,
   "gap": -2.2650048180534066,
   "atrPct": 6.010353838941086,
   "spyGap": -0.18995574176730035,
   "spyTrend": "market uptrend",
   "spyVol": 6.679533849389574
  }
 ]
}
```
