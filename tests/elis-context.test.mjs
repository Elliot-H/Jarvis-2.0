// node tests/elis-context.test.mjs — sector by correlation, context buckets, history enrichment (no look-ahead).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'elisc-')); process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), C = await import('../elis-context.js'), L = await import('../elis-learn.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const days = []; for (let t = Date.UTC(2025, 0, 2); days.length < 140; t += 86400e3) { const d = new Date(t); if (d.getUTCDay() % 6) days.push(d.toISOString().slice(0, 10)); }
let seed = 9; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5);
const series = {}; for (const e of C.ETFS) { let p = 100; series[e] = Object.fromEntries(days.map(d => [d, p *= 1 + rnd() * 0.03])); }
let p = 50; series.CHIPCO = Object.fromEntries(days.map(d => [d, p *= series.SMH[d] / (series.SMH[days[days.indexOf(d) - 1]] || series.SMH[d]) * (1 + rnd() * 0.004)]));   // moves with SMH
assert(C.sectorOf(series.CHIPCO, series) === 'SMH', 'sector by correlation: chip stock -> SMH');
const mk = { spyGap: 1.2, vixGap: 6, spyTrend: 'down', first: { SMH: { o: 10, c: 9 } } };
const f = C.contextFeatures({ dir: 'short', sector: 'SMH', buzz: { rank: 5, change: 40 } }, mk);
console.log(f); assert(f.mktGap === 'spy-gap-up' && f.fear === 'fear-rising' && f.regime === 'with-trend' && f.sector === 'with-sector' && f.buzz === 'buzz-hot', 'context buckets');
// enrichment over journal rows using only data before each session
const D = days.at(-1); fs.mkdirSync(path.join(process.env.DATA_DIR, 'elis'), { recursive: true });
fs.writeFileSync(path.join(process.env.DATA_DIR, 'elis', 'journal.jsonl'), JSON.stringify({ date: D, sym: 'CHIPCO', dir: 'long', rvol: 3, hist: true }) + '\n');
let lookAhead = false;
global.fetch = async url => {
  const u = new URL(url), sp = u.searchParams, J = o => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (u.pathname === '/v2/stocks/bars' && sp.get('timeframe') === '1Day') { const out = {}; for (const s of sp.get('symbols').split(',')) if (series[s]) out[s] = days.filter(d => d <= sp.get('end')).map(d => ({ t: d + 'T05:00:00Z', o: series[s][d], h: series[s][d], l: series[s][d], c: series[s][d], v: 1e6 })); return J({ bars: out }); }
  if (u.pathname === '/v2/stocks/bars' && sp.get('timeframe') === '5Min') { const out = {}; for (const s of sp.get('symbols').split(',')) out[s] = [{ t: sp.get('start'), o: 100, h: 101, l: 99, c: s === 'SMH' ? 100.5 : s === 'SPY' ? 99.5 : 100, v: 1 }]; return J({ bars: out }); }
  throw new Error('unmocked ' + u.pathname);
};
const n = await L.enrich(), row = L.readJournal()[0]; console.log(n, row.sectorEtf, row.ctx);
assert(n === 1 && row.sectorEtf === 'SMH' && row.ctx.sector === 'with-sector' && row.ctx.buzz === 'buzz-unknown' && L.ctxDone(), 'history row enriched (sector, buzz unknown for history)');
const feat = L.features(row); assert(feat.sector === 'with-sector' && feat.comboSectorNews.startsWith('with-sector'), 'learner sees the context');
console.log('CONTEXT TEST PASSED'); process.exit(0);
