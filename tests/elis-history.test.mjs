// node tests/elis-history.test.mjs — whole-market history replay: picks from 09:35 info only, delisted included, mid-day news, resume.
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path';
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'elish-')); process.env.ALPACA_KEY_ID = 'PKTEST'; process.env.ALPACA_SECRET = 'x'.repeat(40);
const E = await import('../elis.js'), L = await import('../elis-learn.js');
const assert = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } };
const cal = []; for (let t = Date.UTC(2026, 0, 2); cal.length < 70; t += 86400e3) { const d = new Date(t); if (d.getUTCDay() % 6) cal.push(d.toISOString().slice(0, 10)); }
const FROM = cal[40], HOTDAY = cal[50];
Date.now = () => E.etMs(cal.at(-1), 20 * 60) + 86400e3;
let calls = 0;
global.fetch = async url => {
  calls++; const u = new URL(url), sp = u.searchParams, J = o => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
  if (u.pathname === '/v2/calendar') return J(cal.map(date => ({ date })));
  if (u.pathname === '/v2/assets') return J(sp.get('status') === 'active' ? [{ symbol: 'HOT', exchange: 'NASDAQ' }, { symbol: 'MEH', exchange: 'NYSE' }, { symbol: 'TINY', exchange: 'NYSE' }, { symbol: 'SPY', exchange: 'ARCA' }, { symbol: 'BRK.B', exchange: 'NYSE' }] : [{ symbol: 'GONE', exchange: 'NASDAQ' }]);
  if (u.pathname === '/v1beta1/news') {
    const st = Date.parse(sp.get('start')), en = Date.parse(sp.get('end')), items = [{ headline: 'HOT wins FDA approval', symbols: ['HOT'], created_at: new Date(E.etMs(HOTDAY, 570) - 3600e3).toISOString() }, { headline: 'FDA rescinds HOT approval', symbols: ['HOT'], created_at: new Date(E.etMs(HOTDAY, 630)).toISOString() }];
    return J({ news: items.filter(n => Date.parse(n.created_at) >= st && Date.parse(n.created_at) <= en) });
  }
  if (u.pathname === '/v2/stocks/bars') {
    const tf = sp.get('timeframe'), out = {};
    for (const s of sp.get('symbols').split(',')) {
      if (tf === '1Day') out[s] = cal.map(d => ({ t: d + 'T05:00:00Z', o: s === 'TINY' ? 2 : 50, h: s === 'TINY' ? 2.1 : 52, l: s === 'TINY' ? 1.9 : 48, c: s === 'TINY' ? 2 : 50, v: 3e6 }));
      else if (tf === '5Min') { const d = E.et(Date.parse(sp.get('start'))).date, hot = s === 'HOT' && d === HOTDAY; out[s] = [{ t: sp.get('start'), o: 50, h: 50.6, l: 49.9, c: hot ? 50.5 : 50.1, v: hot ? 90000 : 10000 }]; }
      else { const d = E.et(Date.parse(sp.get('start'))).date; out[s] = Array.from({ length: 390 }, (_, m) => ({ t: new Date(E.etMs(d, 570) + m * 60e3).toISOString(), o: 50, h: 50.1, l: 49.9, c: 50, v: 1000 })); }
    }
    return J({ bars: out, next_page_token: null });
  }
  throw new Error('unmocked ' + u.pathname);
};
// pause after 5 sessions (market opened), then resume
let k = 0; const r1 = await L.history({ from: FROM, gap: 0, shouldStop: () => L.historyState().done?.length >= 5 && ++k > 0 });
console.log('first run', r1); assert(r1.paused, 'pauses when asked');
const r2 = await L.history({ from: FROM, gap: 0 });
console.log('resume', r2, 'requests', calls);
const J = L.readJournal(), hot = J.find(r => r.sym === 'HOT' && r.date === HOTDAY);
console.log(hot);
assert(r2.finished && r2.sessions === cal.length - 40, 'every session from FROM replayed once');
assert(new Set(J.map(r => r.date)).size === cal.length - 40, 'journal covers all sessions');
assert(hot && hot.rvol >= 8 && hot.cat === 'fda' && hot.tone === 'news-pos', 'pre-open news read');
assert(hot.intraday.some(e => e.tone === 'neg' && e.m === 60), 'mid-day rescind headline attached at 10:30');
assert(J.some(r => r.sym === 'GONE'), 'delisted symbols included');
assert(!J.some(r => r.sym === 'TINY' || r.sym === 'BRK.B'), 'under-$5 and odd symbols excluded');
assert(fs.existsSync(path.join(process.env.DATA_DIR, 'elis', 'bars', HOTDAY + '.json.gz')), '1-min bars stored for grading');
console.log('HISTORY TEST PASSED'); process.exit(0);
