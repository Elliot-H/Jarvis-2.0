// PS5 on the home LAN, driven THROUGH THE PHONE (A32 gaming mode, no PC/Pi needed).
// Railway cannot reach the console, but the Jarvis Android app sits on the same Wi-Fi. The phone only moves raw bytes
// (device actions `udp` / `tcp`); everything protocol-side lives here:
//  - Discovery (DDP, UDP 9302): "SRCH" -> "HTTP/1.1 200 Ok" (awake) or "620 Server Standby" (rest mode), host name/id, running title.
//  - Wake (DDP "WAKEUP"): needs the RegistKey from a one-time Remote Play registration.
//  - Registration (UDP "SRC3" -> "RES3", then TCP POST /sie/ps5/rp/sess/rgst on 9295): needs the PSN account id (base64, from
//    the PSN login in /api/ps/login) and the 8-digit PIN the console shows under Settings > System > Remote Play > Link Device.
// Protocol ported from pyremoteplay (ddp.py, register.py, crypt.py, oauth.py). PS5 only.
import crypto from 'crypto';

const DDP_PORT = 9302, RP_PORT = 9295, DDP_VERSION = '00030010';
const K0 = Buffer.from('d860e146bdb0bd94b460070bb14fe723', 'hex');   // REG_KEY_0_PS5[i*32+1]
const K1 = Buffer.from('a83761b527fc076e62433aa701958a85', 'hex');   // REG_KEY_1_PS5[i*32+8]
const HMAC_KEY = Buffer.from('464687b349ca8ce859c5270f5d7a69d6', 'hex');
const CLIENT_TYPE = 'dabfa2ec873de5839bee8d3f4c0239c4282c07c25c6077a2931afcf0adc0d34f';

// ---------- crypto (exported for tests) ----------
function key0(pin) { const k = Buffer.from(K0); const p = Number(pin) >>> 0; for (let i = 0; i < 4; i++) k[12 + i] ^= (p >>> (24 - i * 8)) & 255; return k; }
function key1(nonce) { const k = Buffer.alloc(16); for (let i = 0; i < 16; i++) k[i] = (((nonce[i] ^ K1[i]) - 45 + i) % 256 + 256) % 256; return k; }
function aesIv(nonce, counter = 0) { const c = Buffer.alloc(8); c.writeBigUInt64BE(BigInt(counter)); return crypto.createHmac('sha256', HMAC_KEY).update(Buffer.concat([nonce, c])).digest().subarray(0, 16); }
const cfb = (dir, key, nonce, data) => { const c = (dir === 'enc' ? crypto.createCipheriv : crypto.createDecipheriv)('aes-128-cfb', key, aesIv(nonce, 0)); return Buffer.concat([c.update(data), c.final()]); };
function registRequest(accountB64, pin, nonce = crypto.randomBytes(16)) {
  const k0 = key0(pin), k1 = key1(nonce), A = Buffer.alloc(480, 'A');
  const plain = Buffer.concat([A.subarray(0, 199), k1.subarray(8), A.subarray(207, 401), k1.subarray(0, 8), A.subarray(409)]);
  const enc = cfb('enc', k0, nonce, Buffer.from(`Client-Type: ${CLIENT_TYPE}\r\nNp-AccountId: ${accountB64}\r\n`));
  const body = Buffer.concat([plain, enc]);
  const head = Buffer.from(`POST /sie/ps5/rp/sess/rgst HTTP/1.1\r\n HTTP/1.1\r\nHOST: 10.0.2.15\r\nUser-Agent: remoteplay Windows\r\nConnection: close\r\nContent-Length: ${body.length}\r\nRP-Version: 1.0\r\n\r\n`);
  return { packet: Buffer.concat([head, body]), k0, nonce };
}
function registParse(resp, k0, nonce) {
  const split = resp.indexOf('\r\n\r\n');
  const status = resp.subarray(0, resp.indexOf('\r\n')).toString();
  if (!/200 OK/i.test(status)) return { ok: false, detail: `console refused the pairing (${status.trim() || 'no answer'}). The PIN may be wrong or expired.` };
  const text = cfb('dec', k0, nonce, resp.subarray(split + 4)).toString('utf8'), info = {};
  for (const l of text.split('\r\n')) { const i = l.indexOf(': '); if (i > 0) info[l.slice(0, i)] = l.slice(i + 2); }
  const rk = info['PS5-RegistKey'] || info.RegistKey;
  return rk ? { ok: true, registKey: rk, rpKey: info['RP-Key'], mac: info['PS5-Mac'], nickname: info['PS5-Nickname'] } : { ok: false, detail: 'pairing answer had no RegistKey: ' + Object.keys(info).join(',') };
}
const wakeCredential = registKey => BigInt('0x' + Buffer.from(registKey, 'hex').toString('utf8')).toString();   // pyremoteplay format_regist_key
const ddpMsg = (type, data = {}) => `${type} * HTTP/1.1\n${Object.entries(data).map(([k, v]) => `${k}:${v}\n`).join('')}device-discovery-protocol-version:${DDP_VERSION}\n`;
function ddpParse(text, ip) {
  const d = { ip };
  for (const raw of String(text).split(/\r?\n/)) {
    const l = raw.trim(); if (!l) continue;
    const m = l.match(/^HTTP\/1\.1 (\d+) (.*)$/); if (m) { d.code = Number(m[1]); d.status = m[2]; continue; }
    const i = l.indexOf(':'); if (i > 0) d[l.slice(0, i)] = l.slice(i + 1);
  }
  return d;
}

// ---------- PSN login (account id), done on Railway ----------
const PSN_CLIENT = 'ba495a24-818c-472b-b12d-ff231c1b5745', PSN_SECRET = 'mvaiZkRsAsI1IBkY';
const PSN_REDIRECT = 'https://remoteplay.dl.playstation.net/remoteplay/redirect';
const PSN_LOGIN = `https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/authorize?service_entity=urn:service-entity:psn&response_type=code&client_id=${PSN_CLIENT}&redirect_uri=${PSN_REDIRECT}&scope=psn:clientapp&request_locale=en_US&ui=pr&service_logo=ps&layout_type=popup&smcid=remoteplay&prompt=always&PlatformPrivacyWs1=minimal&no_captcha=true&`;
async function psnAccount(code) {
  const TOKEN = 'https://auth.api.sonyentertainmentnetwork.com/2.0/oauth/token';
  const auth = 'Basic ' + Buffer.from(`${PSN_CLIENT}:${PSN_SECRET}`).toString('base64');
  const t = await fetch(TOKEN, { method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: `grant_type=authorization_code&code=${encodeURIComponent(code)}&redirect_uri=${PSN_REDIRECT}&`, signal: AbortSignal.timeout(10000) });
  if (!t.ok) throw new Error('PSN token HTTP ' + t.status);
  const { access_token } = await t.json();
  const a = await fetch(`${TOKEN}/${access_token}`, { headers: { Authorization: auth }, signal: AbortSignal.timeout(10000) });
  if (!a.ok) throw new Error('PSN account HTTP ' + a.status);
  const j = await a.json(), b = Buffer.alloc(8); b.writeBigUInt64LE(BigInt(j.user_id));
  return { accountId: b.toString('base64'), onlineId: j.online_id || '' };
}

// ---------- LAN ops through the phone ----------
// device action udp: {host ('broadcast' allowed), port, b64, waitMs, max} -> detail JSON [{from, b64}]
// device action tcp: {host, port, b64, waitMs} -> detail JSON {b64}
function make(deviceAction) {
  const dev = async (action, args, timeout) => {
    const r = await deviceAction(action, args, timeout);
    if (!r.ok) throw new Error(/Unknown phone action/.test(r.detail) ? 'the Jarvis app on the phone is an old build without PlayStation control. Install the newest APK.' : r.detail);
    try { return JSON.parse(r.detail); } catch { throw new Error('bad phone answer: ' + String(r.detail).slice(0, 80)); }
  };
  const udp = (host, port, buf, waitMs = 2500, max = 4) => dev('udp', { host, port, b64: buf.toString('base64'), waitMs, max }, waitMs + 8000);
  async function discover(host) {
    const tries = host ? [host, 'broadcast'] : ['broadcast'];
    for (const h of tries) {
      const res = await udp(h, DDP_PORT, Buffer.from(ddpMsg('SRCH')), 2500);
      const hits = (res || []).map(x => ddpParse(Buffer.from(x.b64, 'base64').toString(), x.from)).filter(d => d.code && /PS5/i.test(d['host-type'] || 'PS5'));
      if (hits.length) return hits[0];
    }
    return null;
  }
  async function register(accountB64, pin) {
    const st = await discover();
    if (!st) return { ok: false, detail: 'no PlayStation answered on the phone\'s Wi-Fi. The phone must be on the home Wi-Fi and the PS5 on (not in rest mode) showing the Link Device code.' };
    const init = await udp(st.ip, RP_PORT, Buffer.from('SRC3'), 3000, 1);
    const first = init?.[0] ? Buffer.from(init[0].b64, 'base64').subarray(0, 4).toString() : '';
    if (first !== 'RES3') return { ok: false, detail: 'the PS5 is not in pairing mode. Open Settings > System > Remote Play > Link Device so the code is on screen, then say the code.' };
    const { packet, k0, nonce } = registRequest(accountB64, pin);
    const r = await dev('tcp', { host: st.ip, port: RP_PORT, b64: packet.toString('base64'), waitMs: 5000 }, 15000);
    if (!r?.b64) return { ok: false, detail: 'the PS5 did not answer the pairing request.' };
    return { ...registParse(Buffer.from(r.b64, 'base64'), k0, nonce), ip: st.ip, hostId: st['host-id'], name: st['host-name'] };
  }
  async function wake(ps) {
    let st = await discover(ps.ip);
    if (st?.code === 200) return { ok: true, already: true, st };
    const ip = st?.ip || ps.ip;
    if (!ip) return { ok: false, detail: 'the PS5 did not answer on the home Wi-Fi (is the phone on it, and is the PS5 in rest mode, not fully off?)' };
    const msg = Buffer.from(ddpMsg('WAKEUP', { 'user-credential': wakeCredential(ps.registKey), 'client-type': 'vr', 'auth-type': 'R', model: 'w', 'app-type': 'r' }));
    await udp(ip, DDP_PORT, msg, 300, 0);
    for (let i = 0; i < 12; i++) {             // a PS5 takes ~10-20 s to come out of rest mode
      await new Promise(r => setTimeout(r, 2500));
      st = await discover(ip).catch(() => null);
      if (st?.code === 200) return { ok: true, st };
      if (i === 3) await udp(ip, DDP_PORT, msg, 300, 0);   // resend once
    }
    return { ok: false, detail: `wake was sent but the PS5 still reports ${st?.status || 'no answer'} after 30 seconds`, st };
  }
  return { discover, register, wake };
}

export const _t = { key0, key1, aesIv, registRequest, registParse, wakeCredential, ddpMsg, ddpParse, cfb };
export { make, PSN_LOGIN, PSN_REDIRECT, psnAccount };
