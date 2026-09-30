// Spotify Web API for Jarvis: log in once, then search, play, pause, skip, volume, "latest playlist".
// Needs SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET (Railway) and Spotify Premium for playback control.
const AUTH = 'https://accounts.spotify.com';
const API = 'https://api.spotify.com/v1';
export const SCOPES = 'user-read-playback-state user-modify-playback-state user-read-currently-playing user-read-recently-played playlist-read-private';

export const configured = () => !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
const basic = () => 'Basic ' + Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString('base64');

let cache = { token: null, exp: 0 };
export const authUrl = (redirect, stateParam) => `${AUTH}/authorize?` + new URLSearchParams({
  client_id: process.env.SPOTIFY_CLIENT_ID, response_type: 'code', redirect_uri: redirect, scope: SCOPES, state: stateParam, show_dialog: 'true'
});

export async function exchange(code, redirect) {
  const r = await fetch(`${AUTH}/api/token`, {
    method: 'POST', headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirect }), signal: AbortSignal.timeout(15000)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.refresh_token) throw new Error(`Spotify said ${r.status}: ${j.error_description || j.error || 'no token'}`);
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return j.refresh_token;
}

async function token(refresh) {
  if (cache.token && Date.now() < cache.exp) return cache.token;
  if (!refresh) throw new Error('Spotify is not connected yet. The Owner must approve it once at /api/spotify/login.');
  const r = await fetch(`${AUTH}/api/token`, {
    method: 'POST', headers: { Authorization: basic(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }), signal: AbortSignal.timeout(15000)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`Spotify login failed (${r.status}): ${j.error_description || j.error || ''}. The Owner may need to approve again at /api/spotify/login.`);
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in - 60) * 1000 };
  return cache.token;
}

async function call(refresh, method, path, body) {
  const t = await token(refresh);
  const r = await fetch(API + path, {
    method, headers: { Authorization: 'Bearer ' + t, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(15000)
  });
  if (r.status === 204 || r.status === 202) return {};
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = j.error?.message || r.statusText;
    if (r.status === 403 && /premium/i.test(m)) throw new Error('Spotify says playback control needs Premium.');
    if (r.status === 404 && /device/i.test(m)) throw new Error('NO_DEVICE');
    throw new Error(`Spotify ${r.status}: ${m}`);
  }
  return j;
}

export const devices = async refresh => (await call(refresh, 'GET', '/me/player/devices')).devices || [];
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Find a device to play on (prefers the active one, then the phone). Waits up to `wait` ms for the Spotify app to appear. */
export async function pickDevice(refresh, wait = 0) {
  const end = Date.now() + wait;
  for (;;) {
    const d = await devices(refresh);
    const dev = d.find(x => x.is_active) || d.find(x => /smartphone/i.test(x.type)) || d[0];
    if (dev) return dev;
    if (Date.now() >= end) return null;
    await sleep(1500);
  }
}

export async function latestPlaylist(refresh) {
  const rp = await call(refresh, 'GET', '/me/player/recently-played?limit=50');
  const seen = (rp.items || []).map(i => i.context).find(c => c && c.type === 'playlist');
  if (seen) {
    const id = seen.uri.split(':').pop();
    const p = await call(refresh, 'GET', `/playlists/${id}?fields=name`).catch(() => ({}));
    return { uri: seen.uri, name: p.name || 'your latest playlist' };
  }
  const mine = await call(refresh, 'GET', '/me/playlists?limit=1');
  const p = mine.items?.[0];
  return p ? { uri: p.uri, name: p.name } : null;
}

export async function find(refresh, query, kind = 'track') {
  const type = { track: 'track', song: 'track', artist: 'artist', album: 'album', playlist: 'playlist' }[kind] || 'track';
  const r = await call(refresh, 'GET', `/search?type=${type}&limit=1&q=${encodeURIComponent(query)}`);
  const it = r[type + 's']?.items?.[0];
  if (!it) return null;
  return { uri: it.uri, name: it.name + (it.artists ? ' by ' + it.artists.map(a => a.name).join(', ') : ''), context: type !== 'track' };
}

export async function play(refresh, { uri, context, deviceId }) {
  const q = deviceId ? `?device_id=${deviceId}` : '';
  await call(refresh, 'PUT', '/me/player/play' + q, context ? { context_uri: uri } : uri ? { uris: [uri] } : undefined);
}
export const pause = async refresh => call(refresh, 'PUT', '/me/player/pause');
export const next = async refresh => call(refresh, 'POST', '/me/player/next');
export const previous = async refresh => call(refresh, 'POST', '/me/player/previous');
export const volume = async (refresh, pct) => call(refresh, 'PUT', `/me/player/volume?volume_percent=${Math.max(0, Math.min(100, Math.round(pct)))}`);
export const transfer = async (refresh, deviceId) => call(refresh, 'PUT', '/me/player', { device_ids: [deviceId], play: true });
export async function status(refresh) {
  const s = await call(refresh, 'GET', '/me/player');
  if (!s.item) return null;
  return { playing: !!s.is_playing, track: s.item.name, artists: (s.item.artists || []).map(a => a.name).join(', '), device: s.device?.name, volume: s.device?.volume_percent };
}
