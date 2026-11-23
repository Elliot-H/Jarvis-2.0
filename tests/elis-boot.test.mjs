// node tests/elis-boot.test.mjs — bootstrap rebuilds past candidates from bars + news (fake Alpaca).
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'elisb-')); process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), L = await import('../elis-learn.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const days = []; for (let t = Date.UTC(2026, 8, 1); days.length < 50; t += 86400e3) { const d = new Date(t); if (d.getUTCDay() % 6) days.push(d.toISOString().slice(0, 10)); }
Date.now = () => E.etMs(days.at(-1), 20 * 60) + 86400e3;
global.setTimeout = (f) => { f(); return 0; };   // skip the rate-limit pauses
global.fetch = async url => {
  const u = new URL(url), sp = u.searchParams, J = o => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (u.pathname === '/v2/calendar') return J(days.map(date => ({ date })));
  if (u.pathname === '/v1beta1/news') return J({ news: [{ headline: 'HOT gets FDA approval', symbols: ['HOT'] }] });
  if (u.pathname === '/v2/stocks/bars') {
    const tf = sp.get('timeframe'), out = {};
    for (const s of sp.get('symbols').split(',')) {
      if (tf === '1Day') out[s] = days.map(d => ({ t: d + 'T04:00:00Z', o: 50, h: 52, l: 48, c: 50, v: 3e6 }));
      else { const d = E.et(Date.parse(sp.get('start'))).date, hot = s === 'HOT' && d === days.at(-1); out[s] = [{ t: sp.get('start'), o: 50, h: 50.6, l: 49.9, c: hot ? 50.5 : 50.1, v: hot ? 90000 : 10000 }]; }
    }
    return J({ bars: out, next_page_token: null });
  }
  throw new Error('unmocked ' + u.pathname);
};
const b = await L.bootstrap(['HOT', 'MEH', 'SPY2'], 20);
const J = L.readJournal(), hot = J.find(r => r.sym === 'HOT' && r.date === days.at(-1));
console.log(b, hot);
assert(b.sessions === 20 && hot && hot.rvol >= 8 && hot.cat === 'fda' && hot.dir === 'long' && hot.spyDir === 'long', 'bootstrap candidate with RVOL, news type, market direction');
console.log('BOOTSTRAP TEST PASSED'); process.exit(0);
