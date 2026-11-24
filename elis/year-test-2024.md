# Elis year test 2024

Out-of-sample year 2024 (252 sessions, formulas found on 2024-2025, never on 2024). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 214 trades, 50% wins, avg 0.05R, total 11.3R -> $3,000 became $3,291 (+9.7%, max drawdown 7.6%)
- midday, against the market, S&P flat at the open -> go with the stock: 149 trades, 54% wins, avg 0.12R, total 18.3R -> $3,000 became $3,516 (+17.2%, max drawdown 7.7%)
- midday, against the market, normal volume -> go with the stock: 131 trades, 50% wins, avg 0.1R, total 13.6R -> $3,000 became $3,376 (+12.5%, max drawdown 3.3%)
- afternoon, far from VWAP in the move direction -> go with the stock: 384 trades, 43% wins, avg -0.08R, total -31.6R -> $3,000 became $2,260 (-24.7%, max drawdown 30.5%)
- strong move alone (control) -> go with the stock: 3326 trades, 43% wins, avg -0.06R, total -210.2R -> $3,000 became $1,977 (-34.1%, max drawdown 43.1%)

```json
{
 "year": "2024",
 "sessions": 252,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 214,
   "winPct": 50,
   "avgR": 0.05,
   "totalR": 11.3,
   "money3k": {
    "start": 3000,
    "end": 3291,
    "returnPct": 9.7,
    "maxDrawdownPct": 7.6
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 149,
   "winPct": 54,
   "avgR": 0.12,
   "totalR": 18.3,
   "money3k": {
    "start": 3000,
    "end": 3516,
    "returnPct": 17.2,
    "maxDrawdownPct": 7.7
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 131,
   "winPct": 50,
   "avgR": 0.1,
   "totalR": 13.6,
   "money3k": {
    "start": 3000,
    "end": 3376,
    "returnPct": 12.5,
    "maxDrawdownPct": 3.3
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 384,
   "winPct": 43,
   "avgR": -0.08,
   "totalR": -31.6,
   "money3k": {
    "start": 3000,
    "end": 2260,
    "returnPct": -24.7,
    "maxDrawdownPct": 30.5
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 3326,
   "winPct": 43,
   "avgR": -0.06,
   "totalR": -210.2,
   "money3k": {
    "start": 3000,
    "end": 1977,
    "returnPct": -34.1,
    "maxDrawdownPct": 43.1
   }
  }
 },
 "trades": 4204,
 "why": {
  "n": 3326,
  "overall": -0.06,
  "findings": [
   {
    "dim": "chart structure",
    "value": "trend-against",
    "n": 125,
    "avgR": 0.19,
    "winPct": 49,
    "z": 2.91,
    "better": true
   },
   {
    "dim": "month",
    "value": "2024-06",
    "n": 190,
    "avgR": 0.12,
    "winPct": 54,
    "z": 2.6,
    "better": true
   },
   {
    "dim": "latest candle pattern",
    "value": "strong bear candle",
    "n": 115,
    "avgR": 0.15,
    "winPct": 51,
    "z": 2.35,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 2560,
     "avgR": -0.05,
     "winPct": 43
    },
    "market downtrend": {
     "n": 766,
     "avgR": -0.11,
     "winPct": 43
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 2000,
     "avgR": -0.05,
     "winPct": 44
    },
    "normal market (12-18%)": {
     "n": 1128,
     "avgR": -0.08,
     "winPct": 41
    },
    "nervous market (18-28%)": {
     "n": 198,
     "avgR": -0.08,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped down": {
     "n": 423,
     "avgR": -0.06,
     "winPct": 40
    },
    "S&P flat": {
     "n": 1538,
     "avgR": -0.04,
     "winPct": 44
    },
    "S&P gapped up": {
     "n": 913,
     "avgR": -0.09,
     "winPct": 42
    },
    "S&P gapped down hard": {
     "n": 177,
     "avgR": -0.11,
     "winPct": 41
    },
    "S&P gapped up hard": {
     "n": 275,
     "avgR": -0.07,
     "winPct": 41
    }
   },
   "time of day": {
    "first hour": {
     "n": 2669,
     "avgR": -0.07,
     "winPct": 42
    },
    "10:30-11:30": {
     "n": 475,
     "avgR": -0.05,
     "winPct": 46
    },
    "last 90 min": {
     "n": 32,
     "avgR": 0.01,
     "winPct": 53
    },
    "1:00-2:30": {
     "n": 54,
     "avgR": -0.01,
     "winPct": 44
    },
    "11:30-1:00": {
     "n": 96,
     "avgR": -0.11,
     "winPct": 44
    }
   },
   "side": {
    "long": {
     "n": 1613,
     "avgR": -0.09,
     "winPct": 41
    },
    "short": {
     "n": 1713,
     "avgR": -0.03,
     "winPct": 44
    }
   },
   "moving against the market": {
    "no": {
     "n": 2880,
     "avgR": -0.06,
     "winPct": 43
    },
    "yes": {
     "n": 446,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 1552,
     "avgR": -0.06,
     "winPct": 42
    },
    "surging": {
     "n": 82,
     "avgR": 0.04,
     "winPct": 48
    },
    "normal": {
     "n": 1418,
     "avgR": -0.09,
     "winPct": 42
    },
    "rising": {
     "n": 274,
     "avgR": 0.01,
     "winPct": 45
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1609,
     "avgR": -0.08,
     "winPct": 41
    },
    "with the move": {
     "n": 1647,
     "avgR": -0.05,
     "winPct": 44
    },
    "against the move": {
     "n": 70,
     "avgR": 0.03,
     "winPct": 46
    }
   },
   "size of the 30-min move": {
    "1.2x+ range": {
     "n": 458,
     "avgR": -0.09,
     "winPct": 37
    },
    "0.6-0.8x range": {
     "n": 1856,
     "avgR": -0.05,
     "winPct": 44
    },
    "0.8-1.2x range": {
     "n": 1012,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "stock opening gap": {
    "gap down 4%+": {
     "n": 629,
     "avgR": -0.01,
     "winPct": 44
    },
    "gap down 1-4%": {
     "n": 453,
     "avgR": -0.01,
     "winPct": 46
    },
    "no gap": {
     "n": 582,
     "avgR": -0.08,
     "winPct": 43
    },
    "gap up 4%+": {
     "n": 1024,
     "avgR": -0.08,
     "winPct": 42
    },
    "gap up 1-4%": {
     "n": 638,
     "avgR": -0.12,
     "winPct": 41
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 1131,
     "avgR": -0.04,
     "winPct": 42
    },
    "4-8x": {
     "n": 1402,
     "avgR": -0.06,
     "winPct": 43
    },
    "2-4x": {
     "n": 778,
     "avgR": -0.1,
     "winPct": 43
    },
    "1-2x normal": {
     "n": 15,
     "avgR": 0.1,
     "winPct": 60
    }
   },
   "stock volatility": {
    "jumpy stock": {
     "n": 357,
     "avgR": -0.11,
     "winPct": 42
    },
    "normal stock": {
     "n": 1187,
     "avgR": -0.09,
     "winPct": 41
    },
    "calm stock": {
     "n": 1685,
     "avgR": -0.03,
     "winPct": 45
    },
    "very jumpy stock": {
     "n": 97,
     "avgR": -0.19,
     "winPct": 38
    }
   },
   "news in the last hour": {
    "none": {
     "n": 3326,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 3326,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "overnight news": {
    "none": {
     "n": 3326,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "type of overnight news": {
    "none": {
     "n": 3326,
     "avgR": -0.06,
     "winPct": 43
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1680,
     "avgR": -0.05,
     "winPct": 43
    },
    "sector against the move": {
     "n": 599,
     "avgR": -0.03,
     "winPct": 45
    },
    "sector flat": {
     "n": 890,
     "avgR": -0.09,
     "winPct": 41
    },
    "no sector": {
     "n": 157,
     "avgR": -0.15,
     "winPct": 39
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1560,
     "avgR": -0.1,
     "winPct": 42
    },
    "candle-mild": {
     "n": 419,
     "avgR": 0.02,
     "winPct": 49
    },
    "candle-none": {
     "n": 920,
     "avgR": -0.01,
     "winPct": 43
    },
    "candle-against": {
     "n": 427,
     "avgR": -0.14,
     "winPct": 40
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1724,
     "avgR": -0.07,
     "winPct": 42
    },
    "range": {
     "n": 1477,
     "avgR": -0.08,
     "winPct": 43
    },
    "trend-against": {
     "n": 125,
     "avgR": 0.19,
     "winPct": 49
    }
   },
   "latest candle pattern": {
    "tweezer bottom": {
     "n": 54,
     "avgR": -0.06,
     "winPct": 54
    },
    "three white soldiers": {
     "n": 553,
     "avgR": -0.11,
     "winPct": 42
    },
    "none": {
     "n": 575,
     "avgR": 0,
     "winPct": 42
    },
    "outside bar": {
     "n": 169,
     "avgR": -0.02,
     "winPct": 46
    },
    "bearish harami": {
     "n": 17,
     "avgR": -0.2,
     "winPct": 29
    },
    "strong bear candle": {
     "n": 115,
     "avgR": 0.15,
     "winPct": 51
    },
    "three black crows": {
     "n": 601,
     "avgR": -0.09,
     "winPct": 43
    },
    "doji": {
     "n": 31,
     "avgR": -0.08,
     "winPct": 42
    },
    "bear flag": {
     "n": 20,
     "avgR": 0.07,
     "winPct": 40
    },
    "bearish engulfing": {
     "n": 124,
     "avgR": -0.02,
     "winPct": 52
    },
    "bullish marubozu": {
     "n": 28,
     "avgR": -0.17,
     "winPct": 29
    },
    "strong bull candle": {
     "n": 117,
     "avgR": -0.22,
     "winPct": 38
    },
    "dragonfly doji": {
     "n": 56,
     "avgR": 0.07,
     "winPct": 41
    },
    "inside bar": {
     "n": 314,
     "avgR": -0.04,
     "winPct": 43
    },
    "bullish engulfing": {
     "n": 92,
     "avgR": -0.17,
     "winPct": 43
    },
    "inverted hammer": {
     "n": 23,
     "avgR": 0.05,
     "winPct": 57
    },
    "tweezer top": {
     "n": 55,
     "avgR": -0.14,
     "winPct": 35
    },
    "hanging man": {
     "n": 27,
     "avgR": -0.07,
     "winPct": 48
    },
    "hammer": {
     "n": 29,
     "avgR": -0.11,
     "winPct": 41
    },
    "spinning top": {
     "n": 99,
     "avgR": -0.17,
     "winPct": 35
    },
    "piercing line": {
     "n": 22,
     "avgR": 0.21,
     "winPct": 55
    },
    "bearish marubozu": {
     "n": 27,
     "avgR": -0.04,
     "winPct": 33
    },
    "evening star": {
     "n": 26,
     "avgR": -0.27,
     "winPct": 38
    },
    "gravestone doji": {
     "n": 42,
     "avgR": -0.09,
     "winPct": 40
    },
    "bull flag": {
     "n": 19,
     "avgR": -0.24,
     "winPct": 32
    },
    "shooting star": {
     "n": 20,
     "avgR": -0.01,
     "winPct": 30
    },
    "bullish harami": {
     "n": 18,
     "avgR": -0.36,
     "winPct": 22
    },
    "morning star": {
     "n": 30,
     "avgR": 0.24,
     "winPct": 57
    },
    "dark cloud cover": {
     "n": 23,
     "avgR": -0.17,
     "winPct": 39
    }
   },
   "month": {
    "2024-01": {
     "n": 299,
     "avgR": -0.15,
     "winPct": 40
    },
    "2024-02": {
     "n": 333,
     "avgR": -0.06,
     "winPct": 41
    },
    "2024-03": {
     "n": 224,
     "avgR": -0.03,
     "winPct": 42
    },
    "2024-04": {
     "n": 257,
     "avgR": -0.15,
     "winPct": 41
    },
    "2024-05": {
     "n": 351,
     "avgR": -0.04,
     "winPct": 44
    },
    "2024-06": {
     "n": 190,
     "avgR": 0.12,
     "winPct": 54
    },
    "2024-07": {
     "n": 296,
     "avgR": -0.14,
     "winPct": 38
    },
    "2024-08": {
     "n": 286,
     "avgR": -0.11,
     "winPct": 41
    },
    "2024-09": {
     "n": 245,
     "avgR": -0.06,
     "winPct": 42
    },
    "2024-10": {
     "n": 318,
     "avgR": -0.01,
     "winPct": 42
    },
    "2024-11": {
     "n": 287,
     "avgR": 0,
     "winPct": 48
    },
    "2024-12": {
     "n": 240,
     "avgR": -0.09,
     "winPct": 44
    }
   }
  },
  "text": "Overall -0.06R avg over 3326 trades.\nMade money when:\n  + chart structure = trend-against: +0.19R avg, 49% wins, 125 trades\n  + month = 2024-06: +0.12R avg, 54% wins, 190 trades\n  + latest candle pattern = strong bear candle: +0.15R avg, 51% wins, 115 trades\nNo group stood out as worse than the rest."
 },
 "whyFormula": {
  "n": 214,
  "overall": 0.05,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 131,
     "avgR": 0.13,
     "winPct": 52
    },
    "market downtrend": {
     "n": 83,
     "avgR": -0.06,
     "winPct": 47
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 113,
     "avgR": 0.1,
     "winPct": 52
    },
    "normal market (12-18%)": {
     "n": 87,
     "avgR": -0.04,
     "winPct": 46
    },
    "nervous market (18-28%)": {
     "n": 14,
     "avgR": 0.2,
     "winPct": 57
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 69,
     "avgR": 0.07,
     "winPct": 52
    },
    "S&P flat": {
     "n": 83,
     "avgR": 0.14,
     "winPct": 54
    },
    "S&P gapped down hard": {
     "n": 15,
     "avgR": -0.12,
     "winPct": 33
    },
    "S&P gapped down": {
     "n": 20,
     "avgR": -0.08,
     "winPct": 40
    },
    "S&P gapped up hard": {
     "n": 27,
     "avgR": -0.06,
     "winPct": 48
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 127,
     "avgR": 0.04,
     "winPct": 49
    },
    "11:30-1:00": {
     "n": 87,
     "avgR": 0.07,
     "winPct": 52
    }
   },
   "side": {
    "short": {
     "n": 107,
     "avgR": 0.04,
     "winPct": 49
    },
    "long": {
     "n": 107,
     "avgR": 0.07,
     "winPct": 51
    }
   },
   "moving against the market": {
    "yes": {
     "n": 214,
     "avgR": 0.05,
     "winPct": 50
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 101,
     "avgR": 0.01,
     "winPct": 47
    },
    "fading": {
     "n": 62,
     "avgR": 0.03,
     "winPct": 48
    },
    "rising": {
     "n": 37,
     "avgR": 0.04,
     "winPct": 54
    },
    "surging": {
     "n": 14,
     "avgR": 0.51,
     "winPct": 71
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 134,
     "avgR": 0.07,
     "winPct": 53
    },
    "with the move": {
     "n": 49,
     "avgR": -0.01,
     "winPct": 41
    },
    "against the move": {
     "n": 26,
     "avgR": 0.01,
     "winPct": 50
    },
    "against the move, far": {
     "n": 5,
     "avgR": 0.43,
     "winPct": 60
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 150,
     "avgR": 0.06,
     "winPct": 50
    },
    "0.8-1.2x range": {
     "n": 51,
     "avgR": 0.1,
     "winPct": 55
    },
    "1.2x+ range": {
     "n": 13,
     "avgR": -0.24,
     "winPct": 31
    }
   },
   "stock opening gap": {
    "gap down 1-4%": {
     "n": 22,
     "avgR": 0.22,
     "winPct": 59
    },
    "gap up 4%+": {
     "n": 86,
     "avgR": -0.06,
     "winPct": 47
    },
    "gap down 4%+": {
     "n": 49,
     "avgR": 0.07,
     "winPct": 51
    },
    "no gap": {
     "n": 21,
     "avgR": -0.08,
     "winPct": 43
    },
    "gap up 1-4%": {
     "n": 36,
     "avgR": 0.28,
     "winPct": 56
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 99,
     "avgR": 0.13,
     "winPct": 54
    },
    "2-4x": {
     "n": 18,
     "avgR": -0.02,
     "winPct": 33
    },
    "8x+": {
     "n": 97,
     "avgR": -0.02,
     "winPct": 49
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 118,
     "avgR": -0.03,
     "winPct": 47
    },
    "jumpy stock": {
     "n": 26,
     "avgR": 0.23,
     "winPct": 54
    },
    "normal stock": {
     "n": 67,
     "avgR": 0.12,
     "winPct": 54
    },
    "very jumpy stock": {
     "n": 3,
     "avgR": 0.04,
     "winPct": 33
    }
   },
   "news in the last hour": {
    "none": {
     "n": 214,
     "avgR": 0.05,
     "winPct": 50
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 214,
     "avgR": 0.05,
     "winPct": 50
    }
   },
   "overnight news": {
    "none": {
     "n": 214,
     "avgR": 0.05,
     "winPct": 50
    }
   },
   "type of overnight news": {
    "none": {
     "n": 214,
     "avgR": 0.05,
     "winPct": 50
    }
   },
   "sector": {
    "sector with the move": {
     "n": 28,
     "avgR": -0.18,
     "winPct": 39
    },
    "sector against the move": {
     "n": 96,
     "avgR": 0.06,
     "winPct": 50
    },
    "sector flat": {
     "n": 76,
     "avgR": 0.13,
     "winPct": 54
    },
    "no sector": {
     "n": 14,
     "avgR": 0.04,
     "winPct": 50
    }
   },
   "candle read": {
    "candle-with": {
     "n": 113,
     "avgR": 0.03,
     "winPct": 51
    },
    "candle-none": {
     "n": 49,
     "avgR": 0.02,
     "winPct": 43
    },
    "candle-against": {
     "n": 25,
     "avgR": -0.11,
     "winPct": 40
    },
    "candle-mild": {
     "n": 27,
     "avgR": 0.39,
     "winPct": 67
    }
   },
   "chart structure": {
    "range": {
     "n": 76,
     "avgR": 0.03,
     "winPct": 47
    },
    "trend-with": {
     "n": 130,
     "avgR": 0.1,
     "winPct": 54
    },
    "trend-against": {
     "n": 8,
     "avgR": -0.47,
     "winPct": 13
    }
   },
   "latest candle pattern": {
    "tweezer top": {
     "n": 3,
     "avgR": -0.47,
     "winPct": 33
    },
    "three black crows": {
     "n": 44,
     "avgR": -0.04,
     "winPct": 50
    },
    "bullish engulfing": {
     "n": 10,
     "avgR": -0.33,
     "winPct": 40
    },
    "none": {
     "n": 26,
     "avgR": 0.08,
     "winPct": 50
    },
    "bullish marubozu": {
     "n": 5,
     "avgR": -0.31,
     "winPct": 20
    },
    "morning star": {
     "n": 2,
     "avgR": 1.47,
     "winPct": 100
    },
    "inside bar": {
     "n": 20,
     "avgR": 0,
     "winPct": 40
    },
    "three white soldiers": {
     "n": 42,
     "avgR": 0.25,
     "winPct": 67
    },
    "gravestone doji": {
     "n": 3,
     "avgR": 0.04,
     "winPct": 33
    },
    "bear flag": {
     "n": 1,
     "avgR": 0.19,
     "winPct": 100
    },
    "strong bear candle": {
     "n": 8,
     "avgR": 0.21,
     "winPct": 75
    },
    "evening star": {
     "n": 4,
     "avgR": 0.27,
     "winPct": 50
    },
    "bullish harami": {
     "n": 2,
     "avgR": 0.09,
     "winPct": 50
    },
    "spinning top": {
     "n": 9,
     "avgR": -0.14,
     "winPct": 33
    },
    "hammer": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    },
    "bearish marubozu": {
     "n": 2,
     "avgR": 0.91,
     "winPct": 50
    },
    "inverted hammer": {
     "n": 2,
     "avgR": -1.05,
     "winPct": 0
    },
    "dragonfly doji": {
     "n": 3,
     "avgR": 0.74,
     "winPct": 67
    },
    "strong bull candle": {
     "n": 7,
     "avgR": 0.71,
     "winPct": 71
    },
    "bull flag": {
     "n": 3,
     "avgR": -0.91,
     "winPct": 0
    },
    "bearish harami": {
     "n": 2,
     "avgR": 0.01,
     "winPct": 50
    },
    "tweezer bottom": {
     "n": 2,
     "avgR": 0.85,
     "winPct": 100
    },
    "outside bar": {
     "n": 7,
     "avgR": -0.03,
     "winPct": 43
    },
    "hanging man": {
     "n": 1,
     "avgR": -0.39,
     "winPct": 0
    },
    "shooting star": {
     "n": 1,
     "avgR": -0.3,
     "winPct": 0
    },
    "bearish engulfing": {
     "n": 2,
     "avgR": -0.54,
     "winPct": 0
    },
    "doji": {
     "n": 1,
     "avgR": -0.27,
     "winPct": 0
    },
    "piercing line": {
     "n": 1,
     "avgR": -1.05,
     "winPct": 0
    }
   },
   "month": {
    "2024-01": {
     "n": 8,
     "avgR": 0.09,
     "winPct": 50
    },
    "2024-02": {
     "n": 31,
     "avgR": 0.04,
     "winPct": 42
    },
    "2024-03": {
     "n": 8,
     "avgR": -0.28,
     "winPct": 38
    },
    "2024-04": {
     "n": 22,
     "avgR": -0.15,
     "winPct": 36
    },
    "2024-05": {
     "n": 13,
     "avgR": 0.17,
     "winPct": 62
    },
    "2024-06": {
     "n": 7,
     "avgR": 0.37,
     "winPct": 71
    },
    "2024-07": {
     "n": 28,
     "avgR": -0.07,
     "winPct": 46
    },
    "2024-08": {
     "n": 25,
     "avgR": 0.3,
     "winPct": 64
    },
    "2024-09": {
     "n": 11,
     "avgR": -0.13,
     "winPct": 36
    },
    "2024-10": {
     "n": 27,
     "avgR": 0.28,
     "winPct": 67
    },
    "2024-11": {
     "n": 16,
     "avgR": 0.16,
     "winPct": 63
    },
    "2024-12": {
     "n": 18,
     "avgR": -0.23,
     "winPct": 28
    }
   }
  },
  "text": "Overall +0.05R avg over 214 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2024-12-30",
   "sym": "BOIL",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -1.05,
   "minute": 230,
   "dir": "short",
   "entry": 118.16,
   "stopDist": 2.6905713762555803,
   "marketAgainst": false,
   "volRatio": 2.0750764857983146,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.7582032641851095,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 7.88971344520673,
   "gap": -39.0686274509804,
   "atrPct": 6.5945376869009324,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "UNG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 60,
   "dir": "short",
   "entry": 18.69,
   "stopDist": 0.29697993142264234,
   "marketAgainst": false,
   "volRatio": 1.2248499720998927,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8823491834775894,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bearish engulfing",
   "rvol": 6.839122074965153,
   "gap": 18.210658181708595,
   "atrPct": 4.7109760011042985,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "UNG",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": 0.4045761706971318,
   "minute": 110,
   "dir": "short",
   "entry": 18.465,
   "stopDist": 0.29697993142264234,
   "marketAgainst": true,
   "volRatio": 0.6165950727440225,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6532427934462404,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "spinning top",
   "rvol": 6.839122074965153,
   "gap": 18.210658181708595,
   "atrPct": 4.7109760011042985,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "UNG",
   "formula": "midday, against the market, normal volume -> go with the stock",
   "R": -0.3591117960740434,
   "minute": 115,
   "dir": "short",
   "entry": 18.3582,
   "stopDist": 0.29697993142264234,
   "marketAgainst": true,
   "volRatio": 1.1247832174375048,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6578222274621511,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 6.839122074965153,
   "gap": 18.210658181708595,
   "atrPct": 4.7109760011042985,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "UNG",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -1.05,
   "minute": 230,
   "dir": "short",
   "entry": 17.84,
   "stopDist": 0.29697993142264234,
   "marketAgainst": false,
   "volRatio": 0.9607640190819148,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9158868031823584,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 6.839122074965153,
   "gap": 18.210658181708595,
   "atrPct": 4.7109760011042985,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "CRK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8231498381173573,
   "minute": 75,
   "dir": "long",
   "entry": 18.64,
   "stopDist": 0.3378572463989258,
   "marketAgainst": false,
   "volRatio": 1.0936029885830452,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6038053117828561,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 4.9228137079720655,
   "gap": 5.324750376168441,
   "atrPct": 4.942323630520345,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "EXE",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.2054741990535902,
   "minute": 95,
   "dir": "long",
   "entry": 100.68,
   "stopDist": 0.8611437116350447,
   "marketAgainst": false,
   "volRatio": 0.5969017708076744,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8082274660968211,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 4.642927036800681,
   "gap": 0.9108781534922672,
   "atrPct": 2.2284020965599054,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "EQT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.14472353517072623,
   "minute": 95,
   "dir": "long",
   "entry": 46.38,
   "stopDist": 0.513548605782645,
   "marketAgainst": false,
   "volRatio": 0.8455557400593714,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6464821367668521,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.777218440312554,
   "gap": 4.580325629859727,
   "atrPct": 2.896822029099756,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "AR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8750253698622864,
   "minute": 45,
   "dir": "long",
   "entry": 34.975,
   "stopDist": 0.43782582964215966,
   "marketAgainst": false,
   "volRatio": 1.466764575914325,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6258196329438682,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "dragonfly doji",
   "rvol": 3.566848140921628,
   "gap": 3.310512877467464,
   "atrPct": 3.2869807783275444,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "RRC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.03681166595120686,
   "minute": 90,
   "dir": "long",
   "entry": 36.58,
   "stopDist": 0.4354253496442523,
   "marketAgainst": false,
   "volRatio": 1.4856404125774973,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6430493774162704,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.1270368949342178,
   "gap": 3.2480570702380307,
   "atrPct": 3.128954715332551,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "GRRR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 2.0935250771960376,
   "minute": 35,
   "dir": "long",
   "entry": 22.15,
   "stopDist": 0.7697600637163435,
   "marketAgainst": true,
   "volRatio": 0.7507876259204478,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.982124217188,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "tweezer top",
   "rvol": 2.3777328212641407,
   "gap": 6.991530179600924,
   "atrPct": 10.192797906950334,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "GRRR",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": -1.05,
   "minute": 170,
   "dir": "short",
   "entry": 20.99,
   "stopDist": 0.7697600637163435,
   "marketAgainst": true,
   "volRatio": 2.817442595677372,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.6160879975950728,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.3777328212641407,
   "gap": 6.991530179600924,
   "atrPct": 10.192797906950334,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-30",
   "sym": "GRRR",
   "formula": "midday, against the market, normal volume -> go with the stock",
   "R": -0.6930575231588072,
   "minute": 180,
   "dir": "short",
   "entry": 22.35,
   "stopDist": 0.7697600637163435,
   "marketAgainst": true,
   "volRatio": 0.7409558990967284,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 1.134431417218585,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "none",
   "rvol": 2.3777328212641407,
   "gap": 6.991530179600924,
   "atrPct": 10.192797906950334,
   "spyGap": -1.184855657874051,
   "spyTrend": "market downtrend",
   "spyVol": 13.897721121393053
  },
  {
   "date": "2024-12-31",
   "sym": "SIDU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.30391096684401575,
   "minute": 35,
   "dir": "short",
   "entry": 5.22,
   "stopDist": 0.47328287533351354,
   "marketAgainst": false,
   "volRatio": 0.31297069100983066,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9365223698145791,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 15.640067620540965,
   "gap": 17.612521388852098,
   "atrPct": 23.15473889273722,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "OPTT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 2.447423247100815,
   "minute": 35,
   "dir": "short",
   "entry": 34.05,
   "stopDist": 1.0811143057686943,
   "marketAgainst": false,
   "volRatio": 0.3093565017961847,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.5539522426405106,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "bearish engulfing",
   "rvol": 6.020728710271369,
   "gap": -95.7954544847005,
   "atrPct": 10.237825013166436,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "OPTT",
   "formula": "midday, stock strong against the market -> go with the stock",
   "R": 1.6519476943205578,
   "minute": 130,
   "dir": "long",
   "entry": 25.64,
   "stopDist": 1.0811143057686943,
   "marketAgainst": true,
   "volRatio": 0.2977665092736691,
   "vwapWith": false,
   "vwapFar": true,
   "moveATR": 0.758476689860249,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-against",
   "pattern": "tweezer bottom",
   "rvol": 6.020728710271369,
   "gap": -95.7954544847005,
   "atrPct": 10.237825013166436,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "OPTT",
   "formula": "midday, against the market, S&P flat at the open -> go with the stock",
   "R": 1.6519476943205578,
   "minute": 130,
   "dir": "long",
   "entry": 25.64,
   "stopDist": 1.0811143057686943,
   "marketAgainst": true,
   "volRatio": 0.2977665092736691,
   "vwapWith": false,
   "vwapFar": true,
   "moveATR": 0.758476689860249,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-against",
   "pattern": "tweezer bottom",
   "rvol": 6.020728710271369,
   "gap": -95.7954544847005,
   "atrPct": 10.237825013166436,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "OPTT",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -1.05,
   "minute": 250,
   "dir": "short",
   "entry": 28.63,
   "stopDist": 1.0811143057686943,
   "marketAgainst": false,
   "volRatio": 1.6663573438807333,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8953724826642943,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "strong bear candle",
   "rvol": 6.020728710271369,
   "gap": -95.7954544847005,
   "atrPct": 10.237825013166436,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "FTAI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.7552126633119787,
   "minute": 35,
   "dir": "long",
   "entry": 145.2855,
   "stopDist": 2.4769853864397327,
   "marketAgainst": false,
   "volRatio": 0.4996597495650884,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9601187043813301,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "none",
   "rvol": 4.03728871834627,
   "gap": 7.932495130196049,
   "atrPct": 4.895034663092742,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  },
  {
   "date": "2024-12-31",
   "sym": "AISP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.6113823958374499,
   "minute": 55,
   "dir": "short",
   "entry": 6.6221,
   "stopDist": 0.3736113956996373,
   "marketAgainst": false,
   "volRatio": 1.5903272077728763,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8542565983629337,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-mild",
   "structure": "range",
   "pattern": "strong bear candle",
   "rvol": 3.3104358423398867,
   "gap": 8.853412849564378,
   "atrPct": 13.556291833798193,
   "spyGap": 0.28646244275942756,
   "spyTrend": "market downtrend",
   "spyVol": 14.37466633767223
  }
 ]
}
```
