// Elis WHY - the homework after every result (Owner 2026-11-23: "every test, win or fail, ALWAYS gets a follow-up as to WHY,
// so we can predict the next one"). Given graded trades with what Elis knew at the time, find where it won and where it lost:
// each dimension (market regime, volatility, time of day, side, news, gap, volume, month...) is split into groups, and groups that
// are clearly better or worse than the overall result (enough trades, ~2 standard errors away) are written up in plain words.
export function explain(trades, dims, { minN = 25, z = 2 } = {}) {
  const R = trades.map(t => t.R).filter(Number.isFinite), n = R.length; if (n < minN) return { n, overall: null, findings: [], text: `Only ${n} trades: too few to say why.` };
  const mean = R.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(R.reduce((a, b) => a + (b - mean) ** 2, 0) / Math.max(1, n - 1)) || 1;
  const findings = [], tables = {};
  for (const dim of dims) {
    const g = {}; for (const t of trades) { const v = typeof dim.get === 'function' ? dim.get(t) : t[dim.key]; if (v == null || !Number.isFinite(t.R)) continue; (g[v] ||= []).push(t.R); }
    tables[dim.name] = Object.fromEntries(Object.entries(g).map(([v, a]) => [v, { n: a.length, avgR: r2(a.reduce((x, y) => x + y, 0) / a.length), winPct: Math.round(a.filter(x => x > 0).length / a.length * 100) }]));
    for (const [v, s] of Object.entries(tables[dim.name])) {
      if (s.n < minN) continue; const zz = (s.avgR - mean) / (sd / Math.sqrt(s.n));
      if (Math.abs(zz) >= z) findings.push({ dim: dim.name, value: v, ...s, z: r2(zz), better: zz > 0 });
    }
  }
  findings.sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  const won = findings.filter(f => f.better && f.avgR > 0).slice(0, 5), lost = findings.filter(f => !f.better).slice(0, 5), okBetter = findings.filter(f => f.better && f.avgR <= 0).slice(0, 3);
  const line = f => `${f.dim} = ${f.value}: ${f.avgR >= 0 ? '+' : ''}${f.avgR}R avg, ${f.winPct}% wins, ${f.n} trades`;
  const text = `Overall ${r2(mean) >= 0 ? '+' : ''}${r2(mean)}R avg over ${n} trades.\n`
    + (won.length ? `Made money when:\n${won.map(f => '  + ' + line(f)).join('\n')}\n` : 'No group made money with enough trades to trust.\n')
    + (okBetter.length ? `Lost less when:\n${okBetter.map(f => '  ~ ' + line(f)).join('\n')}\n` : '')
    + (lost.length ? `Lost most when:\n${lost.map(f => '  - ' + line(f)).join('\n')}` : 'No group stood out as worse than the rest.');
  return { n, overall: r2(mean), findings: findings.slice(0, 20), tables, text };
}
const r2 = x => Math.round(x * 100) / 100;
export const bucket = (x, cuts, names) => { if (x == null || !Number.isFinite(x)) return null; for (let i = 0; i < cuts.length; i++) if (x < cuts[i]) return names[i]; return names[cuts.length]; };
