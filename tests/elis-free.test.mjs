import assert from 'node:assert';
import fs from 'node:fs';
process.env.DATA_DIR = fs.mkdtempSync('/tmp/free-');
// fake internet: every free source answers with its real file format
const cal = ['2023-02-27', '2023-02-28', '2023-03-01', '2023-03-02', '2023-03-03', '2023-03-06', '2023-03-07', '2023-03-08', '2023-03-09', '2023-03-10',
  '2023-03-13', '2023-03-14', '2023-03-15', '2023-03-16', '2023-03-17', '2023-03-20', '2023-03-21', '2023-03-22', '2023-03-23', '2023-03-24', '2023-03-27', '2023-03-28', '2023-03-29', '2023-03-30', '2023-03-31', '2023-04-03'];
const us = d => { const [y, m, dd] = d.split('-'); return `${m}/${dd}/${y}`; };
const csv = f => 'DATE,OPEN,HIGH,LOW,CLOSE\n' + cal.map(d => `${us(d)},1,1,1,${f(d)}`).join('\n');
globalThis.fetch = async url => {
  const ok = body => ({ ok: true, status: 200, text: async () => (typeof body === 'string' ? body : JSON.stringify(body)), json: async () => (typeof body === 'string' ? JSON.parse(body) : body) });
  if (/VIX_History/.test(url)) return ok(csv(d => (d === '2023-03-31' ? 30 : 18)));
  if (/VIX9D_History/.test(url)) return ok(csv(() => 17));
  if (/VIX3M_History/.test(url)) return ok(csv(() => 21));
  if (/totalpc\.csv/.test(url)) return ok('CBOE disclaimer line\nDATE,CALLS,PUTS,TOTAL,P/C Ratio\n' + cal.map(d => `${us(d)},100,90,190,${d === '2023-03-31' ? 1.25 : 0.9}`).join('\n'));
  if (/cpi\.htm/.test(url)) return ok('<li>Consumer Price Index for February 2023 <a>03/14/2023</a></li>');
  if (/empsit\.htm/.test(url)) return ok('<li>The Employment Situation - February 2023, released March 10, 2023</li>');
  if (/CNMSshvol(\d{8})/.test(url)) { const d = /CNMSshvol(\d{8})/.exec(url)[1]; return ok(`Date|Symbol|ShortVolume|ShortExemptVolume|TotalVolume|Market\n${d}|ABC|${d === '20230331' ? 700 : 400}|0|1000|B,Q,N\n`); }
  if (/company_tickers/.test(url)) { if (globalThis.SECDOWN) return { ok: false, status: 403, text: async () => '', json: async () => ({}) }; return ok({ 0: { cik_str: 1234, ticker: 'ABC' } }); }
  if (/CIK0000001234/.test(url)) return ok({ filings: { recent: { form: ['4', '8-K', '10-Q'], filingDate: ['2023-03-30', '2023-03-31', '2023-02-01'], acceptanceDateTime: ['2023-03-30T17:00:00.000Z', '2023-03-31T21:30:00.000Z', ''] }, files: [] } });
  if (/list=search/.test(url)) return ok({ query: { search: [{ title: 'ABC Company' }] } });
  if (/pageviews/.test(url)) return ok({ items: cal.map(d => ({ timestamp: d.replace(/-/g, '') + '00', views: d === '2023-03-31' ? 5000 : 1000 })) });
  return { ok: false, status: 404, text: async () => '', json: async () => ({}) };
};
const F = await import('../elis-free.js');
const k = cal.indexOf('2023-04-03'), t0 = Date.parse('2023-04-03T13:30:00Z');
const out = await F.dayFree({ sym: 'ABC', name: 'ABC Company, Inc.', d: '2023-04-03', cal, k, t0 }); console.log(out, F.status);
assert.equal(out.fearCurve, 'fear curve inverted (panic)');         // VIX 30 > VIX3M 21 the day before
assert.equal(out.putCall, 'heavy put buying');                       // 1.25 the day before
assert.equal(out.shortRatio, 'shorting jumped yesterday');           // 70% vs 40% average
assert.equal(out.insider, 'insider filing last 3 days');
assert.equal(out.filing8k, '8-K filed since last close');
assert.equal(out.attention, 'attention spike 3x+');
assert.equal(await F.macroOf('2023-03-14', cal, cal.indexOf('2023-03-14')), 'CPI day');
assert.equal(await F.macroOf('2023-03-10', cal, cal.indexOf('2023-03-10')), 'jobs report day');
assert.equal(await F.macroOf('2023-03-22', cal, cal.indexOf('2023-03-22')), 'Fed decision day');
assert.equal(await F.macroOf('2023-03-21', cal, cal.indexOf('2023-03-21')), 'day before Fed decision');
assert(Math.abs(F.tickFlow([{ p: 10, s: 100 }, { p: 10.01, s: 300 }, { p: 10.01, s: 100 }, { p: 10, s: 100 }]) - 0.8) < 1e-9, 'tick rule: upticks are buys');
const H = await import('../elis-hunt.js'); assert(F.FREE_KEYS.every(x => H.KEYS.includes(x)), 'free variables are in the loop');
globalThis.SECDOWN = true;
// a source that keeps refusing is paused instead of slowing every day
const before = Date.now(); for (let i = 0; i < 8; i++) await F.edgarEvents('ZZZ' + i).catch(() => {}); const took = Date.now() - before;
console.log('8 blocked lookups took', took, 'ms', F.status.sec);
console.log('FREE TEST PASSED');
