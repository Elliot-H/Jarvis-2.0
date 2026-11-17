// Road co-pilot / drive plan: lay out the road corridor from where he is (or a named start) to where he is going, then find what is
// genuinely ON that corridor and ahead of him (never backwards, never a detour off the route). Pure lookups, no state; server.js applies
// his food rules, picks the stores and speaks the summary.
// Route: OSRM (no key). Places: Google Places "search along route" (GOOGLE_PLACES_KEY) when set, else OpenStreetMap Overpass (no key).
// Towns on the corridor: OpenStreetMap Nominatim reverse geocode at a few points along the route (no key, 1 request per second).
const R = 6371, rad = x => x * Math.PI / 180;
export const miles = (a, b) => { const dl = rad(b.lat - a.lat), dn = rad(b.lon - a.lon), h = Math.sin(dl / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dn / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) * 0.621371; };
const UA = { 'User-Agent': 'Jarvis-personal-assistant/2.0' };
export const CORRIDOR_MI = Number(process.env.DRIVEPLAN_CORRIDOR_MI || 1.5);   // max distance off the route line

export function decodePolyline(s, p = 5) {
  const out = []; let i = 0, lat = 0, lon = 0; const f = 10 ** p;
  while (i < s.length) {
    for (const k of [0, 1]) {
      let b, sh = 0, r = 0;
      do { b = s.charCodeAt(i++) - 63; r |= (b & 31) << sh; sh += 5; } while (b >= 32);
      const d = r & 1 ? ~(r >> 1) : r >> 1; if (k === 0) lat += d; else lon += d;
    }
    out.push({ lat: lat / f, lon: lon / f });
  }
  return out;
}

// {pts, cum (miles along route at each point), miles, minutes, polyline} or null
export async function route(a, b) {
  try {
    const r = await fetch(`https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=simplified&geometries=polyline`, { signal: AbortSignal.timeout(8000) });
    const j = r.ok && await r.json(), rt = j?.routes?.[0]; if (!rt?.geometry) return null;
    const pts = decodePolyline(rt.geometry), cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + miles(pts[i - 1], pts[i]));
    return { pts, cum, miles: rt.distance / 1609.34, minutes: rt.duration / 60, polyline: rt.geometry };
  } catch { return null; }
}

// Where a point sits relative to the route: {off: miles off the line, along: miles from the start}.
export function project(rt, p) {
  let best = { off: Infinity, along: 0, outside: false };
  const kx = Math.cos(rad(p.lat)) * 69.17, ky = 69.05;   // miles per degree, local flat projection
  for (let i = 1; i < rt.pts.length; i++) {
    const A = rt.pts[i - 1], B = rt.pts[i];
    const ax = (A.lon - p.lon) * kx, ay = (A.lat - p.lat) * ky, bx = (B.lon - p.lon) * kx, by = (B.lat - p.lat) * ky;
    const dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy;
    const t = L2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / L2)) : 0;
    const x = ax + t * dx, y = ay + t * dy, off = Math.hypot(x, y);
    const outside = (i === 1 && t === 0) || (i === rt.pts.length - 1 && t === 1);   // beyond the start (behind him) or past the destination
    if (off < best.off) best = { off, along: rt.cum[i - 1] + t * (rt.cum[i] - rt.cum[i - 1]), outside };
  }
  return best;
}

// Points every ~step miles along the route (for town names and the Overpass corridor line).
function samples(rt, n) {
  const out = [], total = rt.cum[rt.cum.length - 1] || 0;
  for (let k = 1; k <= n; k++) {
    const want = total * k / (n + 1); let i = rt.cum.findIndex(c => c >= want); if (i < 1) i = 1;
    const t = (want - rt.cum[i - 1]) / ((rt.cum[i] - rt.cum[i - 1]) || 1), A = rt.pts[i - 1], B = rt.pts[i];
    out.push({ lat: A.lat + t * (B.lat - A.lat), lon: A.lon + t * (B.lon - A.lon), along: want });
  }
  return out;
}

// Towns the corridor passes through, in driving order.
export async function corridorTowns(rt, fromAlong = 0) {
  const total = rt.cum[rt.cum.length - 1] || 0, n = Math.max(2, Math.min(6, Math.round(total / 6)));
  const towns = [];
  for (const s of samples(rt, n)) {
    if (s.along < fromAlong) continue;
    try {
      const r = await fetch('https://nominatim.openstreetmap.org/reverse?' + new URLSearchParams({ lat: s.lat, lon: s.lon, format: 'json', zoom: '13', addressdetails: '1' }), { signal: AbortSignal.timeout(5000), headers: UA });
      const a = r.ok && (await r.json()).address; const t = a && (a.city || a.town || a.village || a.hamlet || a.suburb || a.municipality);
      if (t && !towns.includes(t)) towns.push(t);
    } catch {}
    await new Promise(z => setTimeout(z, 1100));   // Nominatim usage policy: max 1 request per second
  }
  return towns;
}

const todayHours = list => { if (!Array.isArray(list) || !list.length) return ''; const d = (new Date().getDay() + 6) % 7; return String(list[d] || '').replace(/^[A-Za-z]+:\s*/, '').replace(/\u2009|\u202f/g, ' '); };
async function googleAlong(query, rt) {
  const key = process.env.GOOGLE_PLACES_KEY; if (!key) return null;
  try {
    const r = await fetch('https://places.googleapis.com/v1/places:searchText', { method: 'POST', signal: AbortSignal.timeout(8000),
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.shortFormattedAddress,places.location,places.currentOpeningHours.openNow,places.currentOpeningHours.weekdayDescriptions,places.regularOpeningHours.weekdayDescriptions' },
      body: JSON.stringify({ textQuery: query, pageSize: 15, searchAlongRouteParameters: { polyline: { encodedPolyline: rt.polyline } } }) });
    if (!r.ok) return null;
    return ((await r.json()).places || []).filter(p => p.location).map(p => ({
      name: p.displayName?.text || query, address: p.shortFormattedAddress || p.formattedAddress || '', lat: p.location.latitude, lon: p.location.longitude,
      hours: todayHours(p.currentOpeningHours?.weekdayDescriptions || p.regularOpeningHours?.weekdayDescriptions), openNow: p.currentOpeningHours?.openNow ?? null }));
  } catch { return null; }
}
function osmFilter(q) {
  const t = q.toLowerCase();
  if (/hardware|home improvement|lumber/.test(t)) return '["shop"~"^(hardware|doityourself|trade)$"]';
  if (/auto ?parts|car parts/.test(t)) return '["shop"="car_parts"]';
  if (/grocery|supermarket/.test(t)) return '["shop"="supermarket"]';
  if (/\bgas\b|fuel/.test(t)) return '["amenity"="fuel"]';
  const n = String(q).replace(/[^A-Za-z0-9 '’&-]/g, '').replace(/['’]/g, '.?');   // "McDonald's" -> McDonald.?s
  return `["~^(name|brand)$"~"${n}",i]`;
}
async function osmAlong(query, rt) {
  const line = samples(rt, Math.min(60, Math.max(8, Math.round((rt.cum[rt.cum.length - 1] || 0) * 1.5)))).map(p => `${p.lat.toFixed(5)},${p.lon.toFixed(5)}`);
  line.unshift(`${rt.pts[0].lat.toFixed(5)},${rt.pts[0].lon.toFixed(5)}`); const e = rt.pts[rt.pts.length - 1]; line.push(`${e.lat.toFixed(5)},${e.lon.toFixed(5)}`);
  const q = `[out:json][timeout:20];nwr${osmFilter(query)}(around:${Math.round(CORRIDOR_MI * 1609)},${line.join(',')});out center tags 40;`;
  try {
    const r = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { ...UA, 'Content-Type': 'application/x-www-form-urlencoded' }, signal: AbortSignal.timeout(20000) });
    if (!r.ok) return null;
    return ((await r.json()).elements || []).map(el => {
      const t = el.tags || {}, lat = el.lat ?? el.center?.lat, lon = el.lon ?? el.center?.lon; if (lat == null) return null;
      const addr = [t['addr:housenumber'], t['addr:street']].filter(Boolean).join(' ') + (t['addr:city'] ? ', ' + t['addr:city'] : '');
      return { name: t.name || t.brand || query, address: addr.trim().replace(/^,\s*/, ''), lat, lon, hours: t.opening_hours || '', openNow: null };
    }).filter(Boolean);
  } catch { return null; }
}

// Places matching `query` that sit within CORRIDOR_MI of the route and ahead of `fromAlong`, in driving order, deduped by name+spot.
export async function alongRoute(query, rt, fromAlong = 0, max = 4) {
  const raw = (await googleAlong(query, rt)) || (await osmAlong(query, rt)) || [];
  const words = String(query).toLowerCase().replace(/['’]/g, '').split(/\s+/).filter(w => w.length > 2 && !/store|shop|the/.test(w));
  const seen = new Set(), out = [];
  for (const p of raw) {
    const pr = project(rt, p); if (pr.off > CORRIDOR_MI || pr.along < fromAlong - 0.3 || (pr.outside && pr.off > 0.25)) continue;   // off the corridor or already behind him
    const k = `${p.name.toLowerCase()}@${pr.along.toFixed(1)}`; if (seen.has(k)) continue; seen.add(k);
    out.push({ ...p, query, off: +pr.off.toFixed(1), along: +pr.along.toFixed(1), ahead: +(pr.along - fromAlong).toFixed(1), brandHit: words.some(w => p.name.toLowerCase().replace(/['’]/g, '').includes(w)) });
  }
  return out.sort((a, b) => a.along - b.along).slice(0, max);
}
export const source = () => process.env.GOOGLE_PLACES_KEY ? 'Google Places along the route' : 'OpenStreetMap along the route';
