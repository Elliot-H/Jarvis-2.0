// Google Calendar for Jarvis: read, add and change events, including their colours.
// Auth: a Google "service account". The Owner shares his calendar with the service account's email
// ("Make changes to events"), so there is no login, no consent screen and no token that expires.
// Env: GOOGLE_CALENDAR_KEY (the service account's JSON key, pasted whole), GOOGLE_CALENDAR_ID (usually his Gmail address), TZ.

import crypto from 'node:crypto';

const API = process.env.GCAL_API_URL || 'https://www.googleapis.com/calendar/v3';
const TZ = () => process.env.TZ || 'America/New_York';

// Google's fixed event colours (colorId → name as shown in Google Calendar). No colorId means the calendar's own default colour.
export const COLORS = {
  '1': 'Lavender', '2': 'Sage', '3': 'Grape', '4': 'Flamingo', '5': 'Banana', '6': 'Tangerine',
  '7': 'Peacock', '8': 'Graphite', '9': 'Blueberry', '10': 'Basil', '11': 'Tomato'
};
export const colorName = id => (id ? COLORS[String(id)] || `color ${id}` : 'Default');
const NAME_TO_ID = Object.fromEntries(Object.entries(COLORS).map(([id, n]) => [n.toLowerCase(), id]));
/** Accepts "6", "tangerine", "default"/"none" (clears the colour). Returns a colorId string, '' for default, or null if unknown. */
export function parseColor(v) {
  if (v == null) return undefined;
  const s = String(v).trim().toLowerCase();
  if (['default', 'none', 'clear', ''].includes(s)) return '';
  if (COLORS[s]) return s;
  return NAME_TO_ID[s] || null;
}

// The calendar id is cleaned before use: stray spaces or quotes removed, and email-style ids lower-cased (Google ids are lower case).
export const calId = () => {
  const raw = String(process.env.GOOGLE_CALENDAR_ID || '').trim().replace(/^["']|["']$/g, '').trim();
  return raw.includes('@') ? raw.toLowerCase() : raw;
};
export const configured = () => Boolean(process.env.GOOGLE_CALENDAR_KEY && calId());
const NOT_SET = 'The calendar is not connected yet. It needs GOOGLE_CALENDAR_KEY and GOOGLE_CALENDAR_ID in Railway. Tell the Owner plainly.';

function key() {
  try { const k = JSON.parse(process.env.GOOGLE_CALENDAR_KEY); if (k.client_email && k.private_key) return k; } catch {}
  throw new Error('GOOGLE_CALENDAR_KEY is not valid JSON from a Google service account key file.');
}
const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');

let tok = { v: null, exp: 0 };
async function token() {
  if (tok.v && Date.now() < tok.exp - 60_000) return tok.v;
  const k = key(), now = Math.floor(Date.now() / 1000);
  const head = b64({ alg: 'RS256', typ: 'JWT' });
  const claim = b64({ iss: k.client_email, scope: 'https://www.googleapis.com/auth/calendar', aud: k.token_uri || 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const sig = crypto.createSign('RSA-SHA256').update(`${head}.${claim}`).sign(k.private_key).toString('base64url');
  const r = await fetch(k.token_uri || 'https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${head}.${claim}.${sig}` }),
    signal: AbortSignal.timeout(15000)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error(`Google refused the service account key (${r.status} ${j.error_description || j.error || ''}).`);
  tok = { v: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 };
  return tok.v;
}

let accepted = false;
async function acceptShare() {
  // A calendar shared with a service account is not in its calendar list until it is added. Harmless if already there.
  if (accepted) return;
  try {
    const r = await fetch(`${API}/users/me/calendarList`, { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ id: calId() }), signal: AbortSignal.timeout(15000) });
    if (r.ok || r.status === 409) accepted = true;
  } catch {}
}
async function call(method, pathAndQuery, body) {
  await acceptShare();
  const r = await fetch(`${API}/calendars/${encodeURIComponent(calId())}${pathAndQuery}`, {
    method, headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000)
  });
  if (!r.ok) {
    const raw = await r.text();
    let msg = raw.slice(0, 200); try { msg = JSON.parse(raw).error?.message || msg; } catch {}
    if (r.status === 404) throw new Error(`Google cannot find that calendar (${msg}). The calendar is probably not shared with the robot email yet, or GOOGLE_CALENDAR_ID is wrong.`);
    if (r.status === 403) throw new Error(`Google says no permission (${msg}). The calendar must be shared with the robot email with "Make changes to events", and the Calendar API must be enabled.`);
    throw new Error(`Google Calendar returned ${r.status}: ${msg}`);
  }
  return r.status === 204 ? {} : r.json();
}

// Plain "2026-10-03T14:00" is read in the Owner's time zone; anything with Z or an offset is left alone; a bare date is an all-day event.
const hasZone = s => /(Z|[+-]\d\d:?\d\d)$/.test(s);
function when(v) {
  const s = String(v).trim();
  if (/^\d{4}-\d\d-\d\d$/.test(s)) return { date: s };
  return hasZone(s) ? { dateTime: s } : { dateTime: s.length === 16 ? `${s}:00` : s, timeZone: TZ() };
}

export function shape(e, meanings = {}) {
  const id = e.colorId ? String(e.colorId) : '';
  return {
    id: e.id, title: e.summary || '(no title)',
    start: e.start?.dateTime || e.start?.date, end: e.end?.dateTime || e.end?.date,
    allDay: Boolean(e.start?.date), location: e.location || undefined,
    notes: e.description ? String(e.description).slice(0, 300) : undefined,
    colorId: id || undefined, color: colorName(id), meaning: meanings[id || 'default'] || undefined
  };
}

/** Events from one date to another (inclusive, "2026-10-01"; time parts are ignored), oldest first. */
export async function list({ from, to, query, max = 100 } = {}, meanings = {}) {
  if (!configured()) throw new Error(NOT_SET);
  const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ() });
  const d1 = String(from || today).slice(0, 10), d2 = String(to || d1).slice(0, 10);
  const day = 86_400_000;
  // Ask Google for a window one day wider on each side, then keep only events starting on the requested local dates.
  const q = new URLSearchParams({
    timeMin: new Date(Date.parse(`${d1}T00:00:00Z`) - day).toISOString(),
    timeMax: new Date(Date.parse(`${d2}T00:00:00Z`) + 2 * day).toISOString(),
    singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeZone: TZ()
  });
  if (query) q.set('q', String(query));
  const j = await call('GET', `/events?${q}`);
  const events = (j.items || []).filter(e => e.status !== 'cancelled')
    .map(e => shape(e, meanings))
    .filter(e => String(e.start).slice(0, 10) >= d1 && String(e.start).slice(0, 10) <= d2)
    .slice(0, Math.min(max, 250));
  return { from: d1, to: d2, count: events.length, events };
}

/** Count events per colour and show sample titles, so the Owner can say what each colour means. */
export async function colorSurvey(days = 60, meanings = {}) {
  if (!configured()) throw new Error(NOT_SET);
  const now = Date.now();
  const q = new URLSearchParams({ timeMin: new Date(now - days * 864e5).toISOString(), timeMax: new Date(now + days * 864e5).toISOString(), singleEvents: 'true', maxResults: '250', timeZone: TZ() });
  const j = await call('GET', `/events?${q}`);
  const by = {};
  for (const e of (j.items || []).filter(e => e.status !== 'cancelled')) {
    const id = e.colorId ? String(e.colorId) : 'default';
    const g = (by[id] ||= { colorId: id, color: colorName(id === 'default' ? '' : id), count: 0, samples: [], meaning: meanings[id] });
    g.count++;
    if (g.samples.length < 5 && e.summary && !g.samples.includes(e.summary)) g.samples.push(e.summary);
  }
  return Object.values(by).sort((a, b) => b.count - a.count);
}

export async function add({ title, start, end, colorId, location, notes, allDay }) {
  if (!configured()) throw new Error(NOT_SET);
  if (!title || !start) throw new Error('An event needs at least a title and a start time.');
  const c = parseColor(colorId);
  if (c === null) throw new Error(`Unknown colour "${colorId}". Use a Google colour name like Tangerine or Tomato, or a number 1 to 11.`);
  const s = when(start);
  let e;
  if (s.date || allDay) {
    // Google's all-day end date is exclusive, so a one-day event ends the next day.
    const d1 = String(start).slice(0, 10);
    const d2 = end ? String(end).slice(0, 10) : new Date(Date.parse(`${d1}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    e = { start: { date: d1 }, end: { date: d2 > d1 ? d2 : new Date(Date.parse(`${d1}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10) } };
  }
  else if (end) e = { start: s, end: when(end) };
  else {
    // No end given: one hour after the start.
    const plusHour = hasZone(s.dateTime) ? new Date(Date.parse(s.dateTime) + 3600_000).toISOString()
      : new Date(Date.parse(`${s.dateTime}Z`) + 3600_000).toISOString().replace(/\.\d+Z$/, '');
    e = { start: s, end: hasZone(s.dateTime) ? { dateTime: plusHour } : { dateTime: plusHour, timeZone: TZ() } };
  }
  const body = { summary: title, ...e };
  if (location) body.location = location;
  if (notes) body.description = notes;
  if (c) body.colorId = c;
  return shape(await call('POST', '/events', body));
}

export async function update({ eventId, title, start, end, colorId, location, notes }) {
  if (!configured()) throw new Error(NOT_SET);
  if (!eventId) throw new Error('Which event? An eventId from calendar_events is required.');
  const body = {};
  if (title != null) body.summary = title;
  if (start != null) body.start = when(start);
  if (end != null) body.end = when(end);
  if (location != null) body.location = location;
  if (notes != null) body.description = notes;
  if (colorId !== undefined) {
    const c = parseColor(colorId);
    if (c === null) throw new Error(`Unknown colour "${colorId}". Use a Google colour name like Tangerine or Tomato, or a number 1 to 11.`);
    body.colorId = c === '' ? null : c; // null removes the colour
  }
  if (!Object.keys(body).length) throw new Error('Nothing to change.');
  return shape(await call('PATCH', `/events/${encodeURIComponent(eventId)}`, body));
}

/** Diagnostics for the Owner: which robot account this is, which calendars it can see, and whether GOOGLE_CALENDAR_ID works. */
export async function check() {
  const out = { robotEmail: null, configuredId: calId() || null, visibleCalendars: [], idWorks: null, problem: null };
  try { out.robotEmail = key().client_email; } catch (e) { out.problem = e.message; return out; }
  await acceptShare();
  try {
    const r = await fetch(`${API}/users/me/calendarList?minAccessRole=reader`, { headers: { Authorization: `Bearer ${await token()}` }, signal: AbortSignal.timeout(20000) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) out.problem = `Google answered ${r.status}: ${JSON.stringify(j.error?.message || j).slice(0, 200)}`;
    out.visibleCalendars = (j.items || []).map(c => ({ id: c.id, name: c.summary, access: c.accessRole }));
  } catch (e) { out.problem = e.message; }
  if (out.configuredId) {
    try { await call('GET', '/events?maxResults=1'); out.idWorks = true; } catch (e) { out.idWorks = false; out.idError = e.message; }
  }
  if (out.idWorks) {
    try {
      const now = Date.now(), day = 86_400_000;
      const q = new URLSearchParams({ timeMin: new Date(now - 14 * day).toISOString(), timeMax: new Date(now + 30 * day).toISOString(), singleEvents: 'true', orderBy: 'startTime', maxResults: '250', timeZone: TZ() });
      const j = await call('GET', `/events?${q}`);
      const ev = (j.items || []).filter(e => e.status !== 'cancelled');
      out.eventsFound = ev.length;
      out.timeZoneOfCalendar = j.timeZone;
      out.sample = ev.slice(-12).map(e => `${String(e.start?.dateTime || e.start?.date).slice(0, 16)} | ${colorName(e.colorId)} | ${e.summary || '(no title)'}`);
      out.today = new Date().toLocaleString('en-US', { timeZone: TZ() });
    } catch (e) { out.eventsError = e.message; }
  }
  if (!out.problem && out.idWorks === false && !out.visibleCalendars.length) out.problem = 'The robot account cannot see any calendar. The share to its email did not save, or went to a different email. Share the calendar with exactly: ' + out.robotEmail;
  return out;
}
