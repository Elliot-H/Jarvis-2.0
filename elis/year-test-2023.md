# Elis year test 2023

Out-of-sample year 2023 (250 sessions, formulas found on 2024-2025, never on 2023). Stop 0.4 x daily range, out after 30 min, costs included; $3,000 at 1% risk, max 3 trades/day:
- midday, stock strong against the market -> go with the stock: 162 trades, 43% wins, avg -0.11R, total -17.4R -> $3,000 became $2,481 (-17.3%, max drawdown 19.1%)
- midday, against the market, S&P flat at the open -> go with the stock: 101 trades, 42% wins, avg -0.11R, total -11.4R -> $3,000 became $2,668 (-11.1%, max drawdown 14.4%)
- midday, against the market, normal volume -> go with the stock: 90 trades, 44% wins, avg -0.06R, total -5.7R -> $3,000 became $2,853 (-4.9%, max drawdown 13.5%)
- afternoon, far from VWAP in the move direction -> go with the stock: 235 trades, 42% wins, avg -0.07R, total -17.4R -> $3,000 became $2,678 (-10.7%, max drawdown 16.5%)
- strong move alone (control) -> go with the stock: 2999 trades, 44% wins, avg -0.06R, total -172.2R -> $3,000 became $1,827 (-39.1%, max drawdown 40.5%)

```json
{
 "year": "2023",
 "sessions": 250,
 "results": {
  "midday, stock strong against the market -> go with the stock": {
   "trades": 162,
   "winPct": 43,
   "avgR": -0.11,
   "totalR": -17.4,
   "money3k": {
    "start": 3000,
    "end": 2481,
    "returnPct": -17.3,
    "maxDrawdownPct": 19.1
   }
  },
  "midday, against the market, S&P flat at the open -> go with the stock": {
   "trades": 101,
   "winPct": 42,
   "avgR": -0.11,
   "totalR": -11.4,
   "money3k": {
    "start": 3000,
    "end": 2668,
    "returnPct": -11.1,
    "maxDrawdownPct": 14.4
   }
  },
  "midday, against the market, normal volume -> go with the stock": {
   "trades": 90,
   "winPct": 44,
   "avgR": -0.06,
   "totalR": -5.7,
   "money3k": {
    "start": 3000,
    "end": 2853,
    "returnPct": -4.9,
    "maxDrawdownPct": 13.5
   }
  },
  "afternoon, far from VWAP in the move direction -> go with the stock": {
   "trades": 235,
   "winPct": 42,
   "avgR": -0.07,
   "totalR": -17.4,
   "money3k": {
    "start": 3000,
    "end": 2678,
    "returnPct": -10.7,
    "maxDrawdownPct": 16.5
   }
  },
  "strong move alone (control) -> go with the stock": {
   "trades": 2999,
   "winPct": 44,
   "avgR": -0.06,
   "totalR": -172.2,
   "money3k": {
    "start": 3000,
    "end": 1827,
    "returnPct": -39.1,
    "maxDrawdownPct": 40.5
   }
  }
 },
 "trades": 3587,
 "sample": [
  {
   "date": "2023-12-22",
   "sym": "CROX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3344394676041799,
   "minute": 35,
   "dir": "short",
   "entry": 97.41,
   "stopDist": 1.2832255772181922
  },
  {
   "date": "2023-12-22",
   "sym": "DKS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.26586771778037227,
   "minute": 45,
   "dir": "short",
   "entry": 141.565,
   "stopDist": 1.389739990234375
  },
  {
   "date": "2023-12-22",
   "sym": "MP",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.07559750098337935,
   "minute": 60,
   "dir": "short",
   "entry": 19.9,
   "stopDist": 0.3980970927647182
  },
  {
   "date": "2023-12-22",
   "sym": "IONS",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.24332013437661548,
   "minute": 35,
   "dir": "long",
   "entry": 50.725,
   "stopDist": 0.579571533203125
  },
  {
   "date": "2023-12-22",
   "sym": "DECK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.3846854296766257,
   "minute": 45,
   "dir": "short",
   "entry": 114.83,
   "stopDist": 0.986000497000558
  },
  {
   "date": "2023-12-26",
   "sym": "ZIM",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.31404299359647103,
   "minute": 35,
   "dir": "short",
   "entry": 9.688,
   "stopDist": 0.3104028974260603
  },
  {
   "date": "2023-12-26",
   "sym": "STNG",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6993992896498605,
   "minute": 35,
   "dir": "short",
   "entry": 61.6736,
   "stopDist": 0.7489998953683036
  },
  {
   "date": "2023-12-26",
   "sym": "DQ",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "long",
   "entry": 25.72,
   "stopDist": 0.4637856619698661
  },
  {
   "date": "2023-12-26",
   "sym": "AAOI",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.6191076115476891,
   "minute": 55,
   "dir": "long",
   "entry": 23.07,
   "stopDist": 0.8258543559483119
  },
  {
   "date": "2023-12-27",
   "sym": "CYTK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 35,
   "dir": "short",
   "entry": 73.5,
   "stopDist": 1.1895111083984375
  },
  {
   "date": "2023-12-28",
   "sym": "NEO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -1.05,
   "minute": 60,
   "dir": "long",
   "entry": 17.415,
   "stopDist": 0.34831711905343193
  },
  {
   "date": "2023-12-28",
   "sym": "MNSO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.2938563967004949,
   "minute": 40,
   "dir": "short",
   "entry": 20.64,
   "stopDist": 0.34898289271763394
  },
  {
   "date": "2023-12-28",
   "sym": "FUTU",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.09544439623858063,
   "minute": 35,
   "dir": "long",
   "entry": 55.115,
   "stopDist": 0.7679714747837613
  },
  {
   "date": "2023-12-28",
   "sym": "GCT",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.8225798049729179,
   "minute": 40,
   "dir": "short",
   "entry": 18.14,
   "stopDist": 0.6073943001883371
  },
  {
   "date": "2023-12-28",
   "sym": "NVCR",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.13991235398031257,
   "minute": 35,
   "dir": "long",
   "entry": 15.85,
   "stopDist": 0.2947314671107701
  },
  {
   "date": "2023-12-29",
   "sym": "SRRK",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.7877518545374952,
   "minute": 80,
   "dir": "short",
   "entry": 18.3936,
   "stopDist": 0.5576400756835938
  },
  {
   "date": "2023-12-29",
   "sym": "SCCO",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.26937523162815474,
   "minute": 35,
   "dir": "long",
   "entry": 86.33,
   "stopDist": 0.9116799490792412
  },
  {
   "date": "2023-12-29",
   "sym": "BSX",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 1.2985896096503176,
   "minute": 55,
   "dir": "long",
   "entry": 57.753,
   "stopDist": 0.2684285845075335
  },
  {
   "date": "2023-12-29",
   "sym": "OLMA",
   "formula": "strong move alone (control) -> go with the stock",
   "R": 0.3291599189007639,
   "minute": 35,
   "dir": "long",
   "entry": 14.13,
   "stopDist": 0.39561143602643695
  },
  {
   "date": "2023-12-29",
   "sym": "TLRY",
   "formula": "strong move alone (control) -> go with the stock",
   "R": -0.4337718784570689,
   "minute": 35,
   "dir": "short",
   "entry": 23.45,
   "stopDist": 0.6514286586216519
  }
 ]
}
```
