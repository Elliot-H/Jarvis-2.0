# Elis why-it-moved study

2,778 big intraday moves (>= 1 daily range in 30 min) across 444 sessions. (SEC EDGAR was unreachable; filings not included.)
What came before them: unexplained 75.1%, sector 12.3%, market+sector 7.5%, market 5.2%

Sources by weight:
- unexplained (no news, filing, market or sector): before 75.1% of big moves (2085), avg 1.52x daily range
- sector ETF same way: before 19.7% of big moves (548), avg 1.59x daily range, ~0 min warning
- market (S&P 500 same way): before 12.7% of big moves (352), avg 1.58x daily range, ~0 min warning

```json
{
 "at": "2026-11-24T01:40:21.529Z",
 "sessions": 444,
 "bigMoves": 2778,
 "secAvailable": false,
 "byKind": {
  "unexplained": 75.1,
  "sector": 12.3,
  "market+sector": 7.5,
  "market": 5.2
 },
 "weights": [
  {
   "label": "unexplained (no news, filing, market or sector)",
   "kind": "unexplained",
   "shareOfBigMoves": 75.1,
   "moves": 2085,
   "avgMoveATR": 1.52,
   "medianWarningMin": null,
   "hitRatePct": null,
   "events": null,
   "tone": {}
  },
  {
   "label": "sector ETF same way",
   "kind": "sector",
   "shareOfBigMoves": 19.7,
   "moves": 548,
   "avgMoveATR": 1.59,
   "medianWarningMin": 0,
   "hitRatePct": null,
   "events": null,
   "tone": {}
  },
  {
   "label": "market (S&P 500 same way)",
   "kind": "market",
   "shareOfBigMoves": 12.7,
   "moves": 352,
   "avgMoveATR": 1.58,
   "medianWarningMin": 0,
   "hitRatePct": null,
   "events": null,
   "tone": {}
  }
 ],
 "examples": [
  {
   "date": "2025-09-23",
   "sym": "FCEL",
   "move": "7.9%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-24",
   "sym": "QURE",
   "move": "-7.2%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-25",
   "sym": "PDYN",
   "move": "8.3%",
   "why": [
    "market (S&P 500 same way) (0 min before)"
   ]
  },
  {
   "date": "2025-09-26",
   "sym": "CNSY",
   "move": "-9.2%",
   "why": [
    "market (S&P 500 same way) (0 min before)"
   ]
  },
  {
   "date": "2025-09-26",
   "sym": "GFS",
   "move": "-2.7%",
   "why": [
    "market (S&P 500 same way) (0 min before)",
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-26",
   "sym": "LI",
   "move": "-4.5%",
   "why": [
    "market (S&P 500 same way) (0 min before)"
   ]
  },
  {
   "date": "2025-09-26",
   "sym": "PPTA",
   "move": "10.9%",
   "why": [
    "market (S&P 500 same way) (0 min before)"
   ]
  },
  {
   "date": "2025-09-26",
   "sym": "PPTA",
   "move": "-5.4%",
   "why": [
    "market (S&P 500 same way) (0 min before)"
   ]
  },
  {
   "date": "2025-09-29",
   "sym": "CCL",
   "move": "-7.1%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-30",
   "sym": "LW",
   "move": "5.9%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-30",
   "sym": "SNY",
   "move": "1.8%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-09-30",
   "sym": "JEF",
   "move": "-5.4%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-10-01",
   "sym": "LLYX",
   "move": "5.8%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-10-02",
   "sym": "BENF",
   "move": "22.5%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  },
  {
   "date": "2025-10-06",
   "sym": "FITB",
   "move": "-3.9%",
   "why": [
    "sector ETF same way (0 min before)"
   ]
  }
 ]
}
```
