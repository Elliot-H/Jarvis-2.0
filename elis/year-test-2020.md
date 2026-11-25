# Elis year test 2020

Out-of-sample year 2020 (253 sessions, formulas found on 2024-2025, never on 2020). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 213 trades, 42% wins, avg -0.09R, total -19.7R -> $3,000 became $2,488 (-17.1%, max drawdown 21.7%)
- midday, against the market, S&P flat at the open -> go with the stock: 110 trades, 39% wins, avg -0.08R, total -8.5R -> $3,000 became $2,883 (-3.9%, max drawdown 14.9%)
- midday, against the market, normal volume -> go with the stock: 143 trades, 41% wins, avg -0.13R, total -17.9R -> $3,000 became $2,436 (-18.8%, max drawdown 19.8%)
- afternoon, far from VWAP in the move direction -> go with the stock: 307 trades, 36% wins, avg -0.14R, total -44.3R -> $3,000 became $2,222 (-25.9%, max drawdown 32.8%)
- strong move alone (control) -> go with the stock: 2687 trades, 41% wins, avg -0.09R, total -245.4R -> $3,000 became $1,275 (-57.5%, max drawdown 58.6%)

```json
{
 "year": "2020",
 "sessions": 253,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 213,
   "winPct": 42,
   "avgR": -0.09,
   "totalR": -19.7,
   "money3k": {
    "start": 3000,
    "end": 2488,
    "returnPct": -17.1,
    "maxDrawdownPct": 21.7
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 110,
   "winPct": 39,
   "avgR": -0.08,
   "totalR": -8.5,
   "money3k": {
    "start": 3000,
    "end": 2883,
    "returnPct": -3.9,
    "maxDrawdownPct": 14.9
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 143,
   "winPct": 41,
   "avgR": -0.13,
   "totalR": -17.9,
   "money3k": {
    "start": 3000,
    "end": 2436,
    "returnPct": -18.8,
    "maxDrawdownPct": 19.8
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 307,
   "winPct": 36,
   "avgR": -0.14,
   "totalR": -44.3,
   "money3k": {
    "start": 3000,
    "end": 2222,
    "returnPct": -25.9,
    "maxDrawdownPct": 32.8
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2687,
   "winPct": 41,
   "avgR": -0.09,
   "totalR": -245.4,
   "money3k": {
    "start": 3000,
    "end": 1275,
    "returnPct": -57.5,
    "maxDrawdownPct": 58.6
   }
  }
 },
 "trades": 3460,
 "why": {
  "n": 2687,
  "overall": -0.09,
  "findings": [
   {
    "dim": "latest candle pattern",
    "value": "morning star",
    "n": 34,
    "avgR": 0.49,
    "winPct": 53,
    "z": 3.49,
    "better": true
   },
   {
    "dim": "month",
    "value": "2020-09",
    "n": 206,
    "avgR": 0.07,
    "winPct": 45,
    "z": 2.39,
    "better": true
   }
  ],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 1994,
     "avgR": -0.07,
     "winPct": 43
    },
    "market downtrend": {
     "n": 693,
     "avgR": -0.16,
     "winPct": 38
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 754,
     "avgR": -0.09,
     "winPct": 42
    },
    "normal market (12-18%)": {
     "n": 583,
     "avgR": -0.04,
     "winPct": 44
    },
    "nervous market (18-28%)": {
     "n": 902,
     "avgR": -0.11,
     "winPct": 39
    },
    "panicky market (28%+)": {
     "n": 448,
     "avgR": -0.12,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped up": {
     "n": 673,
     "avgR": -0.13,
     "winPct": 42
    },
    "S&P gapped down hard": {
     "n": 362,
     "avgR": -0.09,
     "winPct": 41
    },
    "S&P gapped down": {
     "n": 419,
     "avgR": -0.02,
     "winPct": 43
    },
    "S&P flat": {
     "n": 756,
     "avgR": -0.06,
     "winPct": 42
    },
    "S&P gapped up hard": {
     "n": 477,
     "avgR": -0.16,
     "winPct": 39
    }
   },
   "time of day": {
    "first hour": {
     "n": 2001,
     "avgR": -0.09,
     "winPct": 41
    },
    "10:30-11:30": {
     "n": 457,
     "avgR": -0.08,
     "winPct": 44
    },
    "11:30-1:00": {
     "n": 141,
     "avgR": -0.23,
     "winPct": 35
    },
    "1:00-2:30": {
     "n": 58,
     "avgR": -0.16,
     "winPct": 31
    },
    "last 90 min": {
     "n": 30,
     "avgR": 0.25,
     "winPct": 50
    }
   },
   "side": {
    "short": {
     "n": 1371,
     "avgR": -0.07,
     "winPct": 43
    },
    "long": {
     "n": 1316,
     "avgR": -0.11,
     "winPct": 40
    }
   },
   "moving against the market": {
    "no": {
     "n": 2249,
     "avgR": -0.09,
     "winPct": 41
    },
    "yes": {
     "n": 438,
     "avgR": -0.08,
     "winPct": 41
    }
   },
   "volume on the signal candle": {
    "normal": {
     "n": 1136,
     "avgR": -0.07,
     "winPct": 42
    },
    "fading": {
     "n": 1167,
     "avgR": -0.09,
     "winPct": 43
    },
    "rising": {
     "n": 301,
     "avgR": -0.16,
     "winPct": 36
    },
    "surging": {
     "n": 83,
     "avgR": -0.15,
     "winPct": 35
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 1248,
     "avgR": -0.12,
     "winPct": 39
    },
    "with the move": {
     "n": 1398,
     "avgR": -0.06,
     "winPct": 44
    },
    "against the move": {
     "n": 41,
     "avgR": -0.15,
     "winPct": 39
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 1668,
     "avgR": -0.09,
     "winPct": 43
    },
    "0.8-1.2x range": {
     "n": 763,
     "avgR": -0.12,
     "winPct": 38
    },
    "1.2x+ range": {
     "n": 256,
     "avgR": -0.02,
     "winPct": 41
    }
   },
   "stock opening gap": {
    "no gap": {
     "n": 412,
     "avgR": -0.09,
     "winPct": 44
    },
    "gap down 4%+": {
     "n": 508,
     "avgR": -0.1,
     "winPct": 39
    },
    "gap up 1-4%": {
     "n": 528,
     "avgR": -0.1,
     "winPct": 41
    },
    "gap up 4%+": {
     "n": 863,
     "avgR": -0.09,
     "winPct": 40
    },
    "gap down 1-4%": {
     "n": 376,
     "avgR": -0.07,
     "winPct": 43
    }
   },
   "opening volume surge": {
    "4-8x": {
     "n": 1063,
     "avgR": -0.15,
     "winPct": 40
    },
    "2-4x": {
     "n": 1065,
     "avgR": -0.06,
     "winPct": 43
    },
    "8x+": {
     "n": 548,
     "avgR": -0.05,
     "winPct": 41
    },
    "1-2x normal": {
     "n": 11,
     "avgR": 0.53,
     "winPct": 73
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 861,
     "avgR": -0.11,
     "winPct": 41
    },
    "normal stock": {
     "n": 1128,
     "avgR": -0.07,
     "winPct": 41
    },
    "jumpy stock": {
     "n": 535,
     "avgR": -0.1,
     "winPct": 41
    },
    "very jumpy stock": {
     "n": 163,
     "avgR": -0.09,
     "winPct": 40
    }
   },
   "news in the last hour": {
    "none": {
     "n": 2687,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 2687,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "overnight news": {
    "none": {
     "n": 2687,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "type of overnight news": {
    "none": {
     "n": 2687,
     "avgR": -0.09,
     "winPct": 41
    }
   },
   "sector": {
    "sector with the move": {
     "n": 1494,
     "avgR": -0.09,
     "winPct": 42
    },
    "sector flat": {
     "n": 569,
     "avgR": -0.09,
     "winPct": 42
    },
    "sector against the move": {
     "n": 469,
     "avgR": -0.1,
     "winPct": 41
    },
    "no sector": {
     "n": 155,
     "avgR": -0.1,
     "winPct": 33
    }
   },
   "candle read": {
    "candle-with": {
     "n": 1313,
     "avgR": -0.12,
     "winPct": 41
    },
    "candle-none": {
     "n": 726,
     "avgR": -0.06,
     "winPct": 41
    },
    "candle-mild": {
     "n": 327,
     "avgR": -0.08,
     "winPct": 42
    },
    "candle-against": {
     "n": 321,
     "avgR": -0.05,
     "winPct": 44
    }
   },
   "chart structure": {
    "trend-with": {
     "n": 1478,
     "avgR": -0.11,
     "winPct": 41
    },
    "range": {
     "n": 1119,
     "avgR": -0.07,
     "winPct": 42
    },
    "trend-against": {
     "n": 90,
     "avgR": -0.02,
     "winPct": 41
    }
   },
   "latest candle pattern": {
    "three black crows": {
     "n": 510,
     "avgR": -0.08,
     "winPct": 43
    },
    "bullish engulfing": {
     "n": 80,
     "avgR": -0.07,
     "winPct": 38
    },
    "three white soldiers": {
     "n": 495,
     "avgR": -0.15,
     "winPct": 40
    },
    "none": {
     "n": 438,
     "avgR": -0.09,
     "winPct": 39
    },
    "bear flag": {
     "n": 19,
     "avgR": 0.07,
     "winPct": 58
    },
    "inside bar": {
     "n": 272,
     "avgR": -0.05,
     "winPct": 43
    },
    "evening star": {
     "n": 26,
     "avgR": -0.14,
     "winPct": 38
    },
    "strong bear candle": {
     "n": 92,
     "avgR": -0.22,
     "winPct": 36
    },
    "bearish engulfing": {
     "n": 78,
     "avgR": -0.17,
     "winPct": 37
    },
    "strong bull candle": {
     "n": 96,
     "avgR": -0.03,
     "winPct": 42
    },
    "spinning top": {
     "n": 90,
     "avgR": -0.09,
     "winPct": 43
    },
    "tweezer bottom": {
     "n": 49,
     "avgR": 0,
     "winPct": 45
    },
    "bullish marubozu": {
     "n": 26,
     "avgR": -0.07,
     "winPct": 46
    },
    "outside bar": {
     "n": 124,
     "avgR": -0.08,
     "winPct": 44
    },
    "bull flag": {
     "n": 12,
     "avgR": 0.03,
     "winPct": 58
    },
    "doji": {
     "n": 29,
     "avgR": 0.13,
     "winPct": 52
    },
    "bearish harami": {
     "n": 13,
     "avgR": -0.05,
     "winPct": 46
    },
    "piercing line": {
     "n": 7,
     "avgR": -0.38,
     "winPct": 29
    },
    "bearish marubozu": {
     "n": 33,
     "avgR": -0.08,
     "winPct": 39
    },
    "tweezer top": {
     "n": 38,
     "avgR": -0.25,
     "winPct": 32
    },
    "morning star": {
     "n": 34,
     "avgR": 0.49,
     "winPct": 53
    },
    "bullish harami": {
     "n": 15,
     "avgR": -0.11,
     "winPct": 40
    },
    "shooting star": {
     "n": 15,
     "avgR": 0.11,
     "winPct": 53
    },
    "dragonfly doji": {
     "n": 20,
     "avgR": 0.25,
     "winPct": 60
    },
    "hammer": {
     "n": 20,
     "avgR": -0.24,
     "winPct": 30
    },
    "gravestone doji": {
     "n": 26,
     "avgR": -0.14,
     "winPct": 42
    },
    "dark cloud cover": {
     "n": 6,
     "avgR": -0.76,
     "winPct": 0
    },
    "hanging man": {
     "n": 11,
     "avgR": -0.21,
     "winPct": 36
    },
    "inverted hammer": {
     "n": 13,
     "avgR": -0.47,
     "winPct": 31
    }
   },
   "month": {
    "2020-01": {
     "n": 288,
     "avgR": -0.12,
     "winPct": 42
    },
    "2020-02": {
     "n": 305,
     "avgR": -0.19,
     "winPct": 39
    },
    "2020-03": {
     "n": 185,
     "avgR": -0.09,
     "winPct": 43
    },
    "2020-04": {
     "n": 98,
     "avgR": -0.12,
     "winPct": 43
    },
    "2020-05": {
     "n": 195,
     "avgR": -0.18,
     "winPct": 37
    },
    "2020-06": {
     "n": 184,
     "avgR": -0.11,
     "winPct": 40
    },
    "2020-07": {
     "n": 239,
     "avgR": -0.03,
     "winPct": 42
    },
    "2020-08": {
     "n": 254,
     "avgR": -0.06,
     "winPct": 44
    },
    "2020-09": {
     "n": 206,
     "avgR": 0.07,
     "winPct": 45
    },
    "2020-10": {
     "n": 236,
     "avgR": -0.11,
     "winPct": 39
    },
    "2020-11": {
     "n": 244,
     "avgR": -0.07,
     "winPct": 43
    },
    "2020-12": {
     "n": 253,
     "avgR": -0.09,
     "winPct": 40
    }
   }
  },
  "text": "Overall -0.09R avg over 2687 trades.\nMade money when:\n  + latest candle pattern = morning star: +0.49R avg, 53% wins, 34 trades\n  + month = 2020-09: +0.07R avg, 45% wins, 206 trades\nNo group stood out as worse than the rest."
 },
 "whyFormula": {
  "n": 213,
  "overall": -0.09,
  "findings": [],
  "tables": {
   "market trend": {
    "market uptrend": {
     "n": 153,
     "avgR": -0.08,
     "winPct": 39
    },
    "market downtrend": {
     "n": 60,
     "avgR": -0.13,
     "winPct": 48
    }
   },
   "market volatility": {
    "calm market (<12%)": {
     "n": 41,
     "avgR": 0.02,
     "winPct": 46
    },
    "normal market (12-18%)": {
     "n": 46,
     "avgR": -0.24,
     "winPct": 30
    },
    "nervous market (18-28%)": {
     "n": 90,
     "avgR": -0.03,
     "winPct": 46
    },
    "panicky market (28%+)": {
     "n": 36,
     "avgR": -0.19,
     "winPct": 42
    }
   },
   "S&P gap at the open": {
    "S&P gapped down hard": {
     "n": 33,
     "avgR": -0.1,
     "winPct": 45
    },
    "S&P flat": {
     "n": 66,
     "avgR": 0,
     "winPct": 41
    },
    "S&P gapped up": {
     "n": 42,
     "avgR": -0.05,
     "winPct": 45
    },
    "S&P gapped down": {
     "n": 34,
     "avgR": -0.3,
     "winPct": 35
    },
    "S&P gapped up hard": {
     "n": 38,
     "avgR": -0.11,
     "winPct": 42
    }
   },
   "time of day": {
    "10:30-11:30": {
     "n": 111,
     "avgR": -0.08,
     "winPct": 41
    },
    "11:30-1:00": {
     "n": 102,
     "avgR": -0.11,
     "winPct": 42
    }
   },
   "side": {
    "long": {
     "n": 94,
     "avgR": 0.06,
     "winPct": 52
    },
    "short": {
     "n": 119,
     "avgR": -0.21,
     "winPct": 34
    }
   },
   "moving against the market": {
    "yes": {
     "n": 213,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "volume on the signal candle": {
    "fading": {
     "n": 47,
     "avgR": -0.22,
     "winPct": 36
    },
    "rising": {
     "n": 41,
     "avgR": 0.02,
     "winPct": 46
    },
    "normal": {
     "n": 112,
     "avgR": -0.1,
     "winPct": 43
    },
    "surging": {
     "n": 13,
     "avgR": 0.06,
     "winPct": 38
    }
   },
   "price vs VWAP": {
    "with the move, far": {
     "n": 132,
     "avgR": 0.04,
     "winPct": 48
    },
    "with the move": {
     "n": 54,
     "avgR": -0.28,
     "winPct": 35
    },
    "against the move": {
     "n": 17,
     "avgR": -0.14,
     "winPct": 35
    },
    "against the move, far": {
     "n": 10,
     "avgR": -0.76,
     "winPct": 10
    }
   },
   "size of the 30-min move": {
    "0.6-0.8x range": {
     "n": 143,
     "avgR": -0.16,
     "winPct": 41
    },
    "0.8-1.2x range": {
     "n": 53,
     "avgR": -0.02,
     "winPct": 45
    },
    "1.2x+ range": {
     "n": 17,
     "avgR": 0.26,
     "winPct": 35
    }
   },
   "stock opening gap": {
    "gap down 1-4%": {
     "n": 25,
     "avgR": -0.12,
     "winPct": 36
    },
    "gap down 4%+": {
     "n": 51,
     "avgR": -0.09,
     "winPct": 47
    },
    "gap up 4%+": {
     "n": 90,
     "avgR": -0.11,
     "winPct": 40
    },
    "gap up 1-4%": {
     "n": 28,
     "avgR": -0.08,
     "winPct": 43
    },
    "no gap": {
     "n": 19,
     "avgR": 0.01,
     "winPct": 42
    }
   },
   "opening volume surge": {
    "8x+": {
     "n": 71,
     "avgR": -0.15,
     "winPct": 37
    },
    "4-8x": {
     "n": 84,
     "avgR": -0.15,
     "winPct": 39
    },
    "2-4x": {
     "n": 56,
     "avgR": 0.07,
     "winPct": 52
    },
    "1-2x normal": {
     "n": 2,
     "avgR": -0.07,
     "winPct": 50
    }
   },
   "stock volatility": {
    "calm stock": {
     "n": 60,
     "avgR": -0.2,
     "winPct": 38
    },
    "normal stock": {
     "n": 82,
     "avgR": -0.08,
     "winPct": 41
    },
    "jumpy stock": {
     "n": 54,
     "avgR": -0.02,
     "winPct": 46
    },
    "very jumpy stock": {
     "n": 17,
     "avgR": 0.02,
     "winPct": 41
    }
   },
   "news in the last hour": {
    "none": {
     "n": 213,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "type of last-hour news": {
    "none": {
     "n": 213,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "overnight news": {
    "none": {
     "n": 213,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "type of overnight news": {
    "none": {
     "n": 213,
     "avgR": -0.09,
     "winPct": 42
    }
   },
   "sector": {
    "sector flat": {
     "n": 67,
     "avgR": -0.09,
     "winPct": 48
    },
    "sector with the move": {
     "n": 36,
     "avgR": -0.01,
     "winPct": 47
    },
    "sector against the move": {
     "n": 96,
     "avgR": -0.12,
     "winPct": 35
    },
    "no sector": {
     "n": 14,
     "avgR": -0.17,
     "winPct": 43
    }
   },
   "candle read": {
    "candle-none": {
     "n": 44,
     "avgR": -0.22,
     "winPct": 41
    },
    "candle-mild": {
     "n": 40,
     "avgR": -0.04,
     "winPct": 48
    },
    "candle-with": {
     "n": 109,
     "avgR": -0.06,
     "winPct": 39
    },
    "candle-against": {
     "n": 20,
     "avgR": -0.1,
     "winPct": 45
    }
   },
   "chart structure": {
    "range": {
     "n": 89,
     "avgR": -0.2,
     "winPct": 37
    },
    "trend-with": {
     "n": 119,
     "avgR": -0.01,
     "winPct": 45
    },
    "trend-against": {
     "n": 5,
     "avgR": -0.14,
     "winPct": 40
    }
   },
   "latest candle pattern": {
    "dragonfly doji": {
     "n": 4,
     "avgR": 0.01,
     "winPct": 50
    },
    "inside bar": {
     "n": 16,
     "avgR": -0.27,
     "winPct": 38
    },
    "evening star": {
     "n": 4,
     "avgR": -0.64,
     "winPct": 25
    },
    "three black crows": {
     "n": 44,
     "avgR": 0.1,
     "winPct": 45
    },
    "none": {
     "n": 25,
     "avgR": -0.19,
     "winPct": 40
    },
    "outside bar": {
     "n": 8,
     "avgR": -0.53,
     "winPct": 25
    },
    "spinning top": {
     "n": 8,
     "avgR": -0.05,
     "winPct": 50
    },
    "strong bull candle": {
     "n": 14,
     "avgR": 0.49,
     "winPct": 64
    },
    "three white soldiers": {
     "n": 35,
     "avgR": -0.1,
     "winPct": 43
    },
    "bear flag": {
     "n": 6,
     "avgR": -0.41,
     "winPct": 17
    },
    "bullish engulfing": {
     "n": 7,
     "avgR": 0.15,
     "winPct": 57
    },
    "bullish harami": {
     "n": 2,
     "avgR": -0.7,
     "winPct": 0
    },
    "bearish marubozu": {
     "n": 3,
     "avgR": -0.85,
     "winPct": 0
    },
    "bearish engulfing": {
     "n": 7,
     "avgR": -0.4,
     "winPct": 29
    },
    "strong bear candle": {
     "n": 11,
     "avgR": -0.47,
     "winPct": 27
    },
    "doji": {
     "n": 3,
     "avgR": -0.65,
     "winPct": 33
    },
    "hammer": {
     "n": 1,
     "avgR": -0.4,
     "winPct": 0
    },
    "bullish marubozu": {
     "n": 1,
     "avgR": 2.46,
     "winPct": 100
    },
    "tweezer bottom": {
     "n": 1,
     "avgR": -0.2,
     "winPct": 0
    },
    "hanging man": {
     "n": 1,
     "avgR": 0.73,
     "winPct": 100
    },
    "shooting star": {
     "n": 2,
     "avgR": -0.3,
     "winPct": 50
    },
    "tweezer top": {
     "n": 2,
     "avgR": -0.63,
     "winPct": 0
    },
    "morning star": {
     "n": 2,
     "avgR": 0.43,
     "winPct": 50
    },
    "bearish harami": {
     "n": 3,
     "avgR": 0.11,
     "winPct": 67
    },
    "piercing line": {
     "n": 2,
     "avgR": 0.8,
     "winPct": 100
    },
    "gravestone doji": {
     "n": 1,
     "avgR": 0.73,
     "winPct": 100
    }
   },
   "month": {
    "2020-01": {
     "n": 17,
     "avgR": -0.08,
     "winPct": 47
    },
    "2020-02": {
     "n": 22,
     "avgR": 0.03,
     "winPct": 41
    },
    "2020-03": {
     "n": 13,
     "avgR": -0.02,
     "winPct": 46
    },
    "2020-04": {
     "n": 8,
     "avgR": -0.64,
     "winPct": 13
    },
    "2020-05": {
     "n": 20,
     "avgR": -0.17,
     "winPct": 35
    },
    "2020-06": {
     "n": 18,
     "avgR": -0.07,
     "winPct": 50
    },
    "2020-07": {
     "n": 27,
     "avgR": -0.21,
     "winPct": 37
    },
    "2020-08": {
     "n": 15,
     "avgR": 0.3,
     "winPct": 47
    },
    "2020-09": {
     "n": 15,
     "avgR": -0.03,
     "winPct": 53
    },
    "2020-10": {
     "n": 14,
     "avgR": 0.06,
     "winPct": 43
    },
    "2020-11": {
     "n": 34,
     "avgR": -0.05,
     "winPct": 44
    },
    "2020-12": {
     "n": 10,
     "avgR": -0.64,
     "winPct": 30
    }
   }
  },
  "text": "Overall -0.09R avg over 213 trades.\nNo group made money with enough trades to trust.\nNo group stood out as worse than the rest."
 },
 "sample": [
  {
   "date": "2020-12-28",
   "sym": "BTBT",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": 3.475351117525924,
   "minute": 215,
   "dir": "long",
   "entry": 10.9875,
   "stopDist": 0.315571403503418,
   "marketAgainst": false,
   "volRatio": 2.974771873960716,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.6446357123559174,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "morning star",
   "rvol": 2.283331596860457,
   "gap": 15.371330639217096,
   "atrPct": 13.625708358486014,
   "spyGap": 0.737067780316103,
   "spyTrend": "market uptrend",
   "spyVol": 8.880891616449912
  },
  {
   "date": "2020-12-29",
   "sym": "SNAP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 53.7482,
   "stopDist": 0.937828608921596,
   "marketAgainst": true,
   "volRatio": 0.7775128819889261,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7581342616723684,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "tweezer bottom",
   "rvol": 7.109224789036691,
   "gap": 6.672196001776598,
   "atrPct": 4.858208876600524,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "BTBT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.28084032381967355,
   "minute": 50,
   "dir": "short",
   "entry": 9.0515,
   "stopDist": 0.49471426010131836,
   "marketAgainst": false,
   "volRatio": 0.62671062522594,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 1.0822408876799894,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 4.852338383626418,
   "gap": -6.1010465689452005,
   "atrPct": 11.79013991648031,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "CLOV",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 40,
   "dir": "short",
   "entry": 15.9199,
   "stopDist": 0.41414288112095426,
   "marketAgainst": false,
   "volRatio": 0.6016883498858082,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7534597701049592,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "spinning top",
   "rvol": 3.0331615021843095,
   "gap": -3.222025217674629,
   "atrPct": 6.065361577694202,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "ACAD",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 52.07,
   "stopDist": 0.7428657531738282,
   "marketAgainst": false,
   "volRatio": 1.0495031499642786,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9853731941102335,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "hammer",
   "rvol": 2.4928818305274336,
   "gap": -0.921568903178005,
   "atrPct": 3.4928802837899537,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "TTD",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.30940340304681413,
   "minute": 50,
   "dir": "short",
   "entry": 81.3,
   "stopDist": 1.5419998168945312,
   "marketAgainst": false,
   "volRatio": 2.1688232223151584,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6329443034342169,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "trend-with",
   "pattern": "bullish harami",
   "rvol": 2.270669968787885,
   "gap": 910.0888522966301,
   "atrPct": 4.630073796934039,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "LEVI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4629889987862364,
   "minute": 50,
   "dir": "short",
   "entry": 19.89,
   "stopDist": 0.24213720049176898,
   "marketAgainst": false,
   "volRatio": 1.1419238035264483,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6277432781550911,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-none",
   "structure": "trend-with",
   "pattern": "spinning top",
   "rvol": 2.117823290422963,
   "gap": -1.1313326343787122,
   "atrPct": 2.9775848671969474,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "DXC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.17508370687868507,
   "minute": 35,
   "dir": "short",
   "entry": 23.52,
   "stopDist": 0.31978585379464286,
   "marketAgainst": false,
   "volRatio": 0.40371137410470653,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8005357240236023,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.0934528747794,
   "gap": 0.5818808693482724,
   "atrPct": 3.322795728313594,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-29",
   "sym": "XBI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.5844043743855666,
   "minute": 35,
   "dir": "short",
   "entry": 141.8,
   "stopDist": 1.7215427943638393,
   "marketAgainst": false,
   "volRatio": 2.038767299900394,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.059514759651399,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.042045410628019,
   "gap": 0.32090213340698615,
   "atrPct": 2.938588548830169,
   "spyGap": 0.42716640000066697,
   "spyTrend": "market uptrend",
   "spyVol": 9.094777538029017
  },
  {
   "date": "2020-12-30",
   "sym": "BTBT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 14.155,
   "stopDist": 0.5478971208844866,
   "marketAgainst": false,
   "volRatio": 0.42730392071099155,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.9892368098686716,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-none",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 15.355833493348966,
   "gap": 16.382571132947877,
   "atrPct": 12.971048747940625,
   "spyGap": 0.19374761645574168,
   "spyTrend": "market uptrend",
   "spyVol": 8.564094271623574
  },
  {
   "date": "2020-12-30",
   "sym": "BTBT",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": -1.05,
   "minute": 245,
   "dir": "long",
   "entry": 15.425,
   "stopDist": 0.5478971208844866,
   "marketAgainst": false,
   "volRatio": 1.913392983407925,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.0257400131848606,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bull candle",
   "rvol": 15.355833493348966,
   "gap": 16.382571132947877,
   "atrPct": 12.971048747940625,
   "spyGap": 0.19374761645574168,
   "spyTrend": "market uptrend",
   "spyVol": 8.564094271623574
  },
  {
   "date": "2020-12-30",
   "sym": "BGS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8139920127674782,
   "minute": 35,
   "dir": "short",
   "entry": 29.449,
   "stopDist": 0.28819710867745535,
   "marketAgainst": false,
   "volRatio": 0.7695652728905077,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.8341513247763034,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.9083949516533183,
   "gap": -1.2607810130843777,
   "atrPct": 2.390487014877283,
   "spyGap": 0.19374761645574168,
   "spyTrend": "market uptrend",
   "spyVol": 8.564094271623574
  },
  {
   "date": "2020-12-30",
   "sym": "CPRI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4355197132153063,
   "minute": 45,
   "dir": "short",
   "entry": 43.11,
   "stopDist": 0.6744142804827009,
   "marketAgainst": false,
   "volRatio": 1.5078021122539664,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.6049693961224872,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.138869322933112,
   "gap": 2.1804671221060445,
   "atrPct": 3.9110082981578564,
   "spyGap": 0.19374761645574168,
   "spyTrend": "market uptrend",
   "spyVol": 8.564094271623574
  },
  {
   "date": "2020-12-30",
   "sym": "DXC",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4107470872502866,
   "minute": 35,
   "dir": "long",
   "entry": 24.61,
   "stopDist": 0.33264301845005584,
   "marketAgainst": false,
   "volRatio": 0.6598916007015778,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.8176933977673093,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector with the move",
   "candle": "candle-against",
   "structure": "range",
   "pattern": "gravestone doji",
   "rvol": 1.9184610486044777,
   "gap": 0.2958586349929737,
   "atrPct": 3.5148248160960973,
   "spyGap": 0.19374761645574168,
   "spyTrend": "market uptrend",
   "spyVol": 8.564094271623574
  },
  {
   "date": "2020-12-31",
   "sym": "CELH",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.7169208344796931,
   "minute": 50,
   "dir": "long",
   "entry": 17.16,
   "stopDist": 0.37485708509172716,
   "marketAgainst": false,
   "volRatio": 1.4086224593858252,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.9390245349474069,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector flat",
   "candle": "candle-mild",
   "structure": "trend-with",
   "pattern": "strong bull candle",
   "rvol": 4.552064530921066,
   "gap": 236.32679668275895,
   "atrPct": 6.327769656832813,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  },
  {
   "date": "2020-12-31",
   "sym": "ENPH",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.102884425553922,
   "minute": 40,
   "dir": "short",
   "entry": 176.261,
   "stopDist": 4.3301973615373885,
   "marketAgainst": false,
   "volRatio": 0.630463634597498,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7139536011592738,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 4.278085307313503,
   "gap": 2.3304270484614253,
   "atrPct": 6.260043868815577,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  },
  {
   "date": "2020-12-31",
   "sym": "BILI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 89.1,
   "stopDist": 2.2162146432059155,
   "marketAgainst": true,
   "volRatio": 0.30647575173095276,
   "vwapWith": true,
   "vwapFar": false,
   "moveATR": 0.7322395441140588,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "range",
   "pattern": "inside bar",
   "rvol": 3.8834106245414493,
   "gap": 0.15898413174861847,
   "atrPct": 5.87232294395265,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  },
  {
   "date": "2020-12-31",
   "sym": "BTBT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 1.9307620188072734,
   "minute": 35,
   "dir": "long",
   "entry": 17.6155,
   "stopDist": 0.6984685625348773,
   "marketAgainst": false,
   "volRatio": 1.6045506133544463,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 1.90445221352905,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.7833900132956204,
   "gap": -3.828380416728616,
   "atrPct": 11.525884160428726,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  },
  {
   "date": "2020-12-31",
   "sym": "BTBT",
   "formula": "afternoon, far from VWAP in the move direction -> go with the stock",
   "R": 3.018856803262303,
   "minute": 220,
   "dir": "long",
   "entry": 19.52,
   "stopDist": 0.6984685625348773,
   "marketAgainst": false,
   "volRatio": 2.4808873114951044,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.6990149967925302,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "no sector",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three white soldiers",
   "rvol": 3.7833900132956204,
   "gap": -3.828380416728616,
   "atrPct": 11.525884160428726,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  },
  {
   "date": "2020-12-31",
   "sym": "BIDU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 45,
   "dir": "short",
   "entry": 213.0685,
   "stopDist": 4.5533517020089285,
   "marketAgainst": false,
   "volRatio": 1.0132355199148404,
   "vwapWith": true,
   "vwapFar": true,
   "moveATR": 0.868942321818532,
   "newsHour": "none",
   "newsHourCat": "none",
   "newsNight": "none",
   "newsNightCat": "none",
   "sectorMove": "sector against the move",
   "candle": "candle-with",
   "structure": "trend-with",
   "pattern": "three black crows",
   "rvol": 2.133867958290121,
   "gap": 2.1627259534606535,
   "atrPct": 5.182980012724639,
   "spyGap": -0.06719855391156271,
   "spyTrend": "market uptrend",
   "spyVol": 8.53713385111616
  }
 ]
}
```
