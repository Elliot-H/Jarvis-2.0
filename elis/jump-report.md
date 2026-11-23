# Elis big-jump study

1,241,970 stock-days, 44,548 jumps of 8%+ (2024-01-02 to now; learned on 2024, checked on 2025+).
Normal odds of an 8%+ day: up 2.1%, down 2.0%.

UP 8%+ day after: gap-up-big + very-jumpy-stock
   odds 42.2% in 2025 (normal 2.1%, 19.91x, 10,372 cases) | 2024 41.7% (33.97x) | trade at the open: -0.28% avg 2025, -0.52% 2024
UP 8%+ day after: mid-range + gap-up-big + very-jumpy-stock
   odds 41.7% in 2025 (normal 2.1%, 19.68x, 9,524 cases) | 2024 41.4% (33.72x) | trade at the open: -0.38% avg 2025, -0.54% 2024
UP 8%+ day after: gap-up-big + spy-flat + very-jumpy-stock
   odds 41.7% in 2025 (normal 2.1%, 19.69x, 7,676 cases) | 2024 41.3% (33.61x) | trade at the open: -0.50% avg 2025, -0.36% 2024
UP 8%+ day after: prev-range-normal + gap-up-big + very-jumpy-stock
   odds 42.1% in 2025 (normal 2.1%, 19.88x, 6,251 cases) | 2024 40.3% (32.83x) | trade at the open: -0.21% avg 2025, -0.45% 2024
UP 8%+ day after: prev-vol-normal + gap-up-big + very-jumpy-stock
   odds 42.5% in 2025 (normal 2.1%, 20.05x, 5,547 cases) | 2024 40.6% (33.1x) | trade at the open: +0.08% avg 2025, -0.33% 2024
UP 8%+ day after: gap-up-big + price-10-30 + very-jumpy-stock
   odds 43.0% in 2025 (normal 2.1%, 20.31x, 4,415 cases) | 2024 41.8% (34.08x) | trade at the open: -0.17% avg 2025, -0.37% 2024

DOWN 8%+ day after: gap-down-big + very-jumpy-stock
   odds 45.1% in 2025 (normal 2.0%, 22.42x, 9,806 cases) | 2024 44.2% (45.73x) | trade at the open: +0.15% avg 2025, -0.20% 2024
DOWN 8%+ day after: gap-down-big + spy-flat + very-jumpy-stock
   odds 46.2% in 2025 (normal 2.0%, 23.01x, 7,406 cases) | 2024 46.6% (48.17x) | trade at the open: +0.34% avg 2025, +0.32% 2024
DOWN 8%+ day after: mid-range + gap-down-big + very-jumpy-stock
   odds 45.2% in 2025 (normal 2.0%, 22.47x, 9,083 cases) | 2024 45.2% (46.72x) | trade at the open: +0.15% avg 2025, -0.10% 2024
DOWN 8%+ day after: 5d-up-big + gap-down-big + very-jumpy-stock
   odds 48.5% in 2025 (normal 2.0%, 24.13x, 3,295 cases) | 2024 53.3% (55.16x) | trade at the open: +0.15% avg 2025, +1.22% 2024
DOWN 8%+ day after: prev-range-normal + gap-down-big + very-jumpy-stock
   odds 44.3% in 2025 (normal 2.0%, 22.02x, 5,963 cases) | 2024 42.2% (43.63x) | trade at the open: +0.08% avg 2025, -0.77% 2024
DOWN 8%+ day after: mid-range + gap-down-big + spy-flat
   odds 40.1% in 2025 (normal 2.0%, 19.96x, 13,520 cases) | 2024 39.5% (40.84x) | trade at the open: +0.25% avg 2025, +0.17% 2024

Pre-market news before jumps vs before ordinary days (2025):
   no-news: before up-jumps 92.4%, before down-jumps 92.4%, before ordinary days 94.7%

```json
{
 "at": "2026-11-23T23:23:06.042Z",
 "from": "2024-01-02",
 "split": "2025-01-01",
 "sessions": 726,
 "stockDays": 1241970,
 "base": {
  "learn": {
   "up": 0.0123,
   "down": 0.0097
  },
  "unseen": {
   "up": 0.0212,
   "down": 0.0201
  }
 },
 "jumps": 44548,
 "controls": 4759,
 "priceSigns": [
  {
   "dir": "down",
   "signs": "gap-down-big + very-jumpy-stock",
   "learn": {
    "n": 1169,
    "odds": 0.442,
    "lift": 45.73,
    "tradeAtOpen": -0.002
   },
   "unseen": {
    "n": 9806,
    "odds": 0.451,
    "lift": 22.42,
    "tradeAtOpen": 0.0015
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big + spy-flat + very-jumpy-stock",
   "learn": {
    "n": 893,
    "odds": 0.466,
    "lift": 48.17,
    "tradeAtOpen": 0.0032
   },
   "unseen": {
    "n": 7406,
    "odds": 0.462,
    "lift": 23.01,
    "tradeAtOpen": 0.0034
   }
  },
  {
   "dir": "down",
   "signs": "mid-range + gap-down-big + very-jumpy-stock",
   "learn": {
    "n": 1069,
    "odds": 0.452,
    "lift": 46.72,
    "tradeAtOpen": -0.001
   },
   "unseen": {
    "n": 9083,
    "odds": 0.452,
    "lift": 22.47,
    "tradeAtOpen": 0.0015
   }
  },
  {
   "dir": "down",
   "signs": "5d-up-big + gap-down-big + very-jumpy-stock",
   "learn": {
    "n": 508,
    "odds": 0.533,
    "lift": 55.16,
    "tradeAtOpen": 0.0122
   },
   "unseen": {
    "n": 3295,
    "odds": 0.485,
    "lift": 24.13,
    "tradeAtOpen": 0.0015
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-normal + gap-down-big + very-jumpy-stock",
   "learn": {
    "n": 628,
    "odds": 0.422,
    "lift": 43.63,
    "tradeAtOpen": -0.0077
   },
   "unseen": {
    "n": 5963,
    "odds": 0.443,
    "lift": 22.02,
    "tradeAtOpen": 0.0008
   }
  },
  {
   "dir": "down",
   "signs": "mid-range + gap-down-big + spy-flat",
   "learn": {
    "n": 2289,
    "odds": 0.395,
    "lift": 40.84,
    "tradeAtOpen": 0.0017
   },
   "unseen": {
    "n": 13520,
    "odds": 0.401,
    "lift": 19.96,
    "tradeAtOpen": 0.0025
   }
  },
  {
   "dir": "down",
   "signs": "mid-range + gap-down-big",
   "learn": {
    "n": 3392,
    "odds": 0.342,
    "lift": 35.36,
    "tradeAtOpen": -0.005
   },
   "unseen": {
    "n": 17873,
    "odds": 0.388,
    "lift": 19.32,
    "tradeAtOpen": 0.0001
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big + spy-flat",
   "learn": {
    "n": 2915,
    "odds": 0.38,
    "lift": 39.3,
    "tradeAtOpen": 0.0017
   },
   "unseen": {
    "n": 15690,
    "odds": 0.392,
    "lift": 19.51,
    "tradeAtOpen": 0.0021
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big",
   "learn": {
    "n": 4426,
    "odds": 0.324,
    "lift": 33.46,
    "tradeAtOpen": -0.0056
   },
   "unseen": {
    "n": 21340,
    "odds": 0.377,
    "lift": 18.77,
    "tradeAtOpen": -0.0002
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big + price-10-30 + very-jumpy-stock",
   "learn": {
    "n": 472,
    "odds": 0.434,
    "lift": 44.91,
    "tradeAtOpen": -0.005
   },
   "unseen": {
    "n": 4082,
    "odds": 0.451,
    "lift": 22.44,
    "tradeAtOpen": 0.0016
   }
  },
  {
   "dir": "down",
   "signs": "prev-day-up-big + gap-down-big",
   "learn": {
    "n": 629,
    "odds": 0.458,
    "lift": 47.35,
    "tradeAtOpen": 0.0104
   },
   "unseen": {
    "n": 4080,
    "odds": 0.447,
    "lift": 22.25,
    "tradeAtOpen": 0.0039
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-normal + gap-down-big + very-jumpy-stock",
   "learn": {
    "n": 462,
    "odds": 0.383,
    "lift": 39.62,
    "tradeAtOpen": -0.0128
   },
   "unseen": {
    "n": 5213,
    "odds": 0.433,
    "lift": 21.55,
    "tradeAtOpen": 0.001
   }
  },
  {
   "dir": "down",
   "signs": "prev-day-up-big + mid-range + gap-down-big",
   "learn": {
    "n": 457,
    "odds": 0.503,
    "lift": 52.04,
    "tradeAtOpen": 0.0138
   },
   "unseen": {
    "n": 3412,
    "odds": 0.455,
    "lift": 22.65,
    "tradeAtOpen": 0.004
   }
  },
  {
   "dir": "up",
   "signs": "gap-up-big + very-jumpy-stock",
   "learn": {
    "n": 1511,
    "odds": 0.417,
    "lift": 33.97,
    "tradeAtOpen": -0.0052
   },
   "unseen": {
    "n": 10372,
    "odds": 0.422,
    "lift": 19.91,
    "tradeAtOpen": -0.0028
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-high + gap-down-big + spy-flat",
   "learn": {
    "n": 676,
    "odds": 0.467,
    "lift": 48.34,
    "tradeAtOpen": 0.0017
   },
   "unseen": {
    "n": 2501,
    "odds": 0.47,
    "lift": 23.4,
    "tradeAtOpen": 0.0002
   }
  },
  {
   "dir": "down",
   "signs": "5d-up-big + gap-down-big",
   "learn": {
    "n": 925,
    "odds": 0.431,
    "lift": 44.6,
    "tradeAtOpen": 0.0052
   },
   "unseen": {
    "n": 4671,
    "odds": 0.434,
    "lift": 21.58,
    "tradeAtOpen": -0.0004
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-high + mid-range + gap-down-big",
   "learn": {
    "n": 710,
    "odds": 0.427,
    "lift": 44.13,
    "tradeAtOpen": -0.0064
   },
   "unseen": {
    "n": 3120,
    "odds": 0.455,
    "lift": 22.65,
    "tradeAtOpen": -0.0031
   }
  },
  {
   "dir": "down",
   "signs": "5d-up-big + mid-range + gap-down-big",
   "learn": {
    "n": 694,
    "odds": 0.46,
    "lift": 47.53,
    "tradeAtOpen": 0.0067
   },
   "unseen": {
    "n": 3829,
    "odds": 0.443,
    "lift": 22.04,
    "tradeAtOpen": -0.0008
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-high + prev-range-normal + gap-down-big",
   "learn": {
    "n": 603,
    "odds": 0.439,
    "lift": 45.44,
    "tradeAtOpen": -0.0044
   },
   "unseen": {
    "n": 2127,
    "odds": 0.475,
    "lift": 23.63,
    "tradeAtOpen": 0
   }
  },
  {
   "dir": "up",
   "signs": "mid-range + gap-up-big + very-jumpy-stock",
   "learn": {
    "n": 1399,
    "odds": 0.414,
    "lift": 33.72,
    "tradeAtOpen": -0.0054
   },
   "unseen": {
    "n": 9524,
    "odds": 0.417,
    "lift": 19.68,
    "tradeAtOpen": -0.0038
   }
  },
  {
   "dir": "down",
   "signs": "prev-day-up-big + 5d-up-big + gap-down-big",
   "learn": {
    "n": 417,
    "odds": 0.482,
    "lift": 49.84,
    "tradeAtOpen": 0.0147
   },
   "unseen": {
    "n": 2004,
    "odds": 0.477,
    "lift": 23.71,
    "tradeAtOpen": 0.005
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-wide + gap-down-big + spy-flat",
   "learn": {
    "n": 554,
    "odds": 0.424,
    "lift": 43.86,
    "tradeAtOpen": 0.0019
   },
   "unseen": {
    "n": 2119,
    "odds": 0.472,
    "lift": 23.48,
    "tradeAtOpen": 0.0065
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-normal + mid-range + gap-down-big",
   "learn": {
    "n": 2124,
    "odds": 0.327,
    "lift": 33.79,
    "tradeAtOpen": -0.0062
   },
   "unseen": {
    "n": 11234,
    "odds": 0.386,
    "lift": 19.19,
    "tradeAtOpen": 0.0002
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-normal + gap-down-big + spy-flat",
   "learn": {
    "n": 1858,
    "odds": 0.375,
    "lift": 38.79,
    "tradeAtOpen": 0.0019
   },
   "unseen": {
    "n": 10194,
    "odds": 0.389,
    "lift": 19.37,
    "tradeAtOpen": 0.0017
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-normal + gap-down-big",
   "learn": {
    "n": 2800,
    "odds": 0.311,
    "lift": 32.17,
    "tradeAtOpen": -0.0065
   },
   "unseen": {
    "n": 13295,
    "odds": 0.378,
    "lift": 18.79,
    "tradeAtOpen": 0
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-high + gap-down-big",
   "learn": {
    "n": 1088,
    "odds": 0.389,
    "lift": 40.2,
    "tradeAtOpen": -0.0069
   },
   "unseen": {
    "n": 4156,
    "odds": 0.43,
    "lift": 21.38,
    "tradeAtOpen": -0.0034
   }
  },
  {
   "dir": "down",
   "signs": "5d-up-big + gap-down-big + spy-flat",
   "learn": {
    "n": 783,
    "odds": 0.434,
    "lift": 44.9,
    "tradeAtOpen": 0.0053
   },
   "unseen": {
    "n": 3791,
    "odds": 0.432,
    "lift": 21.51,
    "tradeAtOpen": -0.002
   }
  },
  {
   "dir": "down",
   "signs": "prev-day-up-big + gap-down-big + spy-flat",
   "learn": {
    "n": 500,
    "odds": 0.472,
    "lift": 48.81,
    "tradeAtOpen": 0.0156
   },
   "unseen": {
    "n": 2731,
    "odds": 0.448,
    "lift": 22.3,
    "tradeAtOpen": 0.0028
   }
  },
  {
   "dir": "up",
   "signs": "gap-up-big + spy-flat + very-jumpy-stock",
   "learn": {
    "n": 1253,
    "odds": 0.413,
    "lift": 33.61,
    "tradeAtOpen": -0.0036
   },
   "unseen": {
    "n": 7676,
    "odds": 0.417,
    "lift": 19.69,
    "tradeAtOpen": -0.005
   }
  },
  {
   "dir": "down",
   "signs": "mid-range + gap-down-big + price-10-30",
   "learn": {
    "n": 1310,
    "odds": 0.331,
    "lift": 34.18,
    "tradeAtOpen": -0.0066
   },
   "unseen": {
    "n": 6707,
    "odds": 0.396,
    "lift": 19.73,
    "tradeAtOpen": 0.0001
   }
  },
  {
   "dir": "up",
   "signs": "prev-range-normal + gap-up-big + very-jumpy-stock",
   "learn": {
    "n": 881,
    "odds": 0.403,
    "lift": 32.83,
    "tradeAtOpen": -0.0045
   },
   "unseen": {
    "n": 6251,
    "odds": 0.421,
    "lift": 19.88,
    "tradeAtOpen": -0.0021
   }
  },
  {
   "dir": "up",
   "signs": "prev-vol-normal + gap-up-big + very-jumpy-stock",
   "learn": {
    "n": 694,
    "odds": 0.406,
    "lift": 33.1,
    "tradeAtOpen": -0.0033
   },
   "unseen": {
    "n": 5547,
    "odds": 0.425,
    "lift": 20.05,
    "tradeAtOpen": 0.0008
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big + spy-flat + price-10-30",
   "learn": {
    "n": 1095,
    "odds": 0.381,
    "lift": 39.38,
    "tradeAtOpen": -0.0007
   },
   "unseen": {
    "n": 5808,
    "odds": 0.4,
    "lift": 19.92,
    "tradeAtOpen": 0.0011
   }
  },
  {
   "dir": "down",
   "signs": "gap-down-big + price-10-30",
   "learn": {
    "n": 1651,
    "odds": 0.317,
    "lift": 32.76,
    "tradeAtOpen": -0.0076
   },
   "unseen": {
    "n": 7855,
    "odds": 0.386,
    "lift": 19.23,
    "tradeAtOpen": -0.0006
   }
  },
  {
   "dir": "down",
   "signs": "prev-range-wide + mid-range + gap-down-big",
   "learn": {
    "n": 742,
    "odds": 0.383,
    "lift": 39.58,
    "tradeAtOpen": -0.0026
   },
   "unseen": {
    "n": 3079,
    "odds": 0.428,
    "lift": 21.28,
    "tradeAtOpen": -0.0013
   }
  },
  {
   "dir": "up",
   "signs": "gap-up-big + price-10-30 + very-jumpy-stock",
   "learn": {
    "n": 643,
    "odds": 0.418,
    "lift": 34.08,
    "tradeAtOpen": -0.0037
   },
   "unseen": {
    "n": 4415,
    "odds": 0.43,
    "lift": 20.31,
    "tradeAtOpen": -0.0017
   }
  },
  {
   "dir": "down",
   "signs": "5d-up-big + prev-range-normal + gap-down-big",
   "learn": {
    "n": 489,
    "odds": 0.382,
    "lift": 39.54,
    "tradeAtOpen": 0.0025
   },
   "unseen": {
    "n": 2804,
    "odds": 0.428,
    "lift": 21.31,
    "tradeAtOpen": -0.0012
   }
  },
  {
   "dir": "down",
   "signs": "5d-down-big + mid-range + gap-down-big",
   "learn": {
    "n": 471,
    "odds": 0.31,
    "lift": 32.05,
    "tradeAtOpen": -0.0257
   },
   "unseen": {
    "n": 3692,
    "odds": 0.413,
    "lift": 20.55,
    "tradeAtOpen": -0.0034
   }
  },
  {
   "dir": "up",
   "signs": "5d-up-big + gap-up-big + very-jumpy-stock",
   "learn": {
    "n": 598,
    "odds": 0.436,
    "lift": 35.56,
    "tradeAtOpen": -0.011
   },
   "unseen": {
    "n": 3049,
    "odds": 0.444,
    "lift": 20.95,
    "tradeAtOpen": -0.0057
   }
  },
  {
   "dir": "down",
   "signs": "prev-vol-normal + gap-down-big + spy-flat",
   "learn": {
    "n": 1489,
    "odds": 0.32,
    "lift": 33.13,
    "tradeAtOpen": 0
   },
   "unseen": {
    "n": 8880,
    "odds": 0.371,
    "lift": 18.47,
    "tradeAtOpen": 0.0018
   }
  }
 ],
 "newsSigns": [
  {
   "news": "no-news",
   "learn": {
    "beforeUpJumps": 1,
    "beforeDownJumps": 1,
    "beforeOrdinaryDays": 1
   },
   "unseen": {
    "beforeUpJumps": 0.924,
    "beforeDownJumps": 0.924,
    "beforeOrdinaryDays": 0.947
   }
  }
 ]
}
```
