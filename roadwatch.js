// Road alerts ahead while driving. Sources (each optional, key in Railway): TomTom Traffic Incidents (TOMTOM_KEY), HERE Traffic v7 (HERE_API_KEY).
// Neither publishes police / speed-trap reports (Waze and Google keep those private), so this covers accidents, closures, construction, hazards, stalled vehicles.
const R = 6371, rad = x => x * Math.PI / 180;
export const distMi = (a, b) => { const dl = rad(b.lat - a.lat), dn = rad(b.lon - a.lon), h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) * 0.621371; };
export const bearing = (a, b) => { const y = Math.sin(rad(b.lon - a.lon)) * Math.cos(rad(b.lat)), x = Math.cos(rad(a.lat)) * Math.sin(rad(b.lat)) - Math.sin(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.cos(rad(b.lon - a.lon)); return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360; };
const angDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);
export const hasFeed = () => !!(process.env.TOMTOM_KEY || process.env.HERE_API_KEY);
const TT = { 1: 'accident', 3: 'road hazard', 5: 'ice on the road', 7: 'lane closure', 8: 'road closed', 9: 'construction', 11: 'flooding', 14: 'stalled vehicle' };
const HERE = { accident: 'accident', construction: 'construction', roadClosure: 'road closed', roadHazard: 'road hazard', laneRestriction: 'lane closure', weather: 'weather hazard' };
async function tomtom(L, mi) {
  const d = mi / 69, bb = [L.lon - d * 1.3, L.lat - d, L.lon + d * 1.3, L.lat + d].map(n => n.toFixed(5)).join(',');
  const fields = encodeURIComponent('{incidents{geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay}}}');
  const r = await fetch(`https://api.tomtom.com/traffic/services/5/incidentDetails?key=${process.env.TOMTOM_KEY}&bbox=${bb}&fields=${fields}&language=en-US&timeValidityFilter=present`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('tomtom ' + r.status);
  return ((await r.json()).incidents || []).map(i => {
    const p = i.properties || {}, kind = TT[p.iconCategory]; if (!kind) return null;
    const c = i.geometry?.type === 'Point' ? [i.geometry.coordinates] : i.geometry?.coordinates || [];
    return c.length ? { kind, pts: c.map(([lon, lat]) => ({ lat, lon })), src: 'tomtom' } : null;
  }).filter(Boolean);
}
async function here(L, mi) {
  const r = await fetch(`https://data.traffic.hereapi.com/v7/incidents?in=circle:${L.lat},${L.lon};r=${Math.round(mi * 1609)}&locationReferencing=shape&apiKey=${process.env.HERE_API_KEY}`, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('here ' + r.status);
  return ((await r.json()).results || []).map(i => {
    const d = i.incidentDetails || {}, kind = d.roadClosed ? 'road closed' : HERE[d.type]; if (!kind) return null;
    const pts = (i.location?.shape?.links || []).flatMap(l => l.points || []).map(p => ({ lat: p.lat, lon: p.lng }));
    return pts.length ? { kind, pts, src: 'here' } : null;
  }).filter(Boolean);
}
// Incidents within `mi` of the fix and inside +-50 degrees of the direction of travel, nearest first.
export async function incidentsAhead(L, brg, mi = 3) {
  const all = []; const jobs = [];
  if (process.env.TOMTOM_KEY) jobs.push(tomtom(L, mi));
  if (process.env.HERE_API_KEY) jobs.push(here(L, mi));
  const res = await Promise.allSettled(jobs); let ok = 0;
  for (const x of res) if (x.status === 'fulfilled') { ok++; all.push(...x.value); }
  if (!ok && res.length) throw new Error(res.map(x => x.reason?.message).join('; '));
  const out = [];
  for (const i of all) {
    let best = null;
    for (const p of i.pts) { const d = distMi(L, p); if (d < 0.1 || d > mi || angDiff(bearing(L, p), brg) > 50) continue; if (!best || d < best.d) best = { d, p }; }
    if (best) out.push({ kind: i.kind, miles: best.d, key: `${i.kind}:${best.p.lat.toFixed(3)},${best.p.lon.toFixed(3)}` });
  }
  const seen = new Set();
  return out.sort((a, b) => a.miles - b.miles).filter(i => !seen.has(i.key) && seen.add(i.key));
}
export function sayLine(i) {
  const m = i.miles, far = m < 0.25 ? 'a quarter mile' : m < 0.4 ? 'a third of a mile' : m < 0.7 ? 'half a mile' : m < 1.2 ? 'one mile' : `${Math.round(m)} miles`;
  const k = i.kind[0].toUpperCase() + i.kind.slice(1);
  return `${k} reported ahead in ${far}, sir.`;
}
