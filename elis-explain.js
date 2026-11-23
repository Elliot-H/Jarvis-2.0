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

// BUILD: the why is not a report, it is formula material (Owner 2026-11-23). Every condition (and pair of conditions) the why
// splits on becomes a candidate rule "only trade when ...". Leave-one-year-out: a rule is chosen using the other years only
// (positive in EACH of them, enough trades), then graded on the year it never saw. A rule is proven only if it was chosen in
// every fold and made money in every held-out year. That is the same test the Owner asked for: "test it on a year it never saw".
export function buildRules(byYear, dims, { minN = 40, minR = 0.05, top = 8, pairs = true, minPosMonths = 60 } = {}) {
  const years = Object.keys(byYear).filter(y => byYear[y]?.length); if (years.length < 3) return { ready: false, note: `need 3 tested years, have ${years.length}` };
  const val = (d, t) => (typeof d.get === 'function' ? d.get(t) : t[d.key]);
  const keyed = {}; for (const y of years) keyed[y] = byYear[y].map(t => ({ R: t.R, f: dims.map(d => { const v = val(d, t); return v == null ? null : String(v); }) }));
  const mi = dims.findIndex(d => /month/.test(d.name));
  const use = dims.map((d, i) => i).filter(i => i !== mi);
  const months = (y, cond) => { const m = {}; for (const t of keyed[y]) if (cond.every(([i, v]) => t.f[i] === v)) { const k = mi >= 0 ? t.f[mi] : y; m[k] = (m[k] || 0) + t.R; } return Object.values(m); };
  const stat = (y, cond) => { let n = 0, s = 0, w = 0; for (const t of keyed[y]) if (cond.every(([i, v]) => t.f[i] === v)) { n++; s += t.R; if (t.R > 0) w++; } return { n, avgR: n ? s / n : 0, winPct: n ? Math.round(w / n * 100) : 0 }; };
  const values = use.map(i => [i, [...new Set(years.flatMap(y => keyed[y].map(t => t.f[i])))].filter(v => v != null)]);
  const cands = []; for (const [i, vs] of values) for (const v of vs) cands.push([[i, v]]);
  if (pairs) for (let a = 0; a < values.length; a++) for (let b = a + 1; b < values.length; b++) for (const va of values[a][1]) for (const vb of values[b][1]) cands.push([[values[a][0], va], [values[b][0], vb]]);
  const name = cond => cond.map(([i, v]) => `${dims[i].name} = ${v}`).join(' AND ');
  const folds = [], picks = new Map();
  for (const hold of years) {
    const train = years.filter(y => y !== hold), chosen = [];
    for (const c of cands) { const st = train.map(y => stat(y, c)); if (st.every(s => s.n >= minN && s.avgR >= minR)) chosen.push({ c, trainR: st.reduce((a, s) => a + s.avgR * s.n, 0) / st.reduce((a, s) => a + s.n, 0) }); }
    chosen.sort((a, b) => b.trainR - a.trainR);
    const graded = chosen.slice(0, top).map(x => ({ rule: name(x.c), trainR: r2(x.trainR), held: hold, months: months(hold, x.c), ...(s => ({ heldN: s.n, heldR: r2(s.avgR), heldWin: s.winPct }))(stat(hold, x.c)) }));
    for (const g of graded) { const p = picks.get(g.rule) || { rule: g.rule, folds: [] }; p.folds.push(g); picks.set(g.rule, p); }
    folds.push({ held: hold, tried: cands.length, passedTraining: chosen.length, graded });
  }
  const posM = p => { const all = p.folds.flatMap(f => f.months); return all.length ? Math.round(all.filter(x => x > 0).length / all.length * 100) : 0; };
  const proven = [...picks.values()].filter(p => p.folds.length === years.length && p.folds.every(f => f.heldN >= minN / 2 && f.heldR > 0) && posM(p) >= minPosMonths)
    .map(p => ({ rule: p.rule, posMonths: posM(p), heldR: r2(p.folds.reduce((a, f) => a + f.heldR * f.heldN, 0) / p.folds.reduce((a, f) => a + f.heldN, 0)), heldN: p.folds.reduce((a, f) => a + f.heldN, 0), byYear: Object.fromEntries(p.folds.map(f => [f.held, f.heldR])) }))
    .sort((a, b) => b.posMonths - a.posMonths || b.heldR - a.heldR);   // Owner: consistency matters most, even if small
  const heldAll = folds.flatMap(f => f.graded); const honest = heldAll.length ? r2(heldAll.reduce((a, g) => a + g.heldR * g.heldN, 0) / Math.max(1, heldAll.reduce((a, g) => a + g.heldN, 0))) : null;
  for (const f of folds) for (const g of f.graded) delete g.months;
  return { ready: true, years, tried: cands.length, folds, proven, honestR: honest };
}
