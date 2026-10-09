// Media for social posts: raw photos/videos the Owner uploads (private), and finished posts Jarvis makes from them (public, unguessable names, so Buffer can fetch them).
// Photos: sharp (crop to the platform shape, light colour/contrast lift, dark banner with a headline). Video: ffmpeg (crop to 9:16, trim, same lift, headline for the first seconds).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const base = process.env.MEDIA_DIR || process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(here, 'data');
export const RAW = path.join(base, 'media', 'raw'), OUT = path.join(base, 'media', 'out'), MUSIC = path.join(base, 'media', 'music');
for (const d of [RAW, OUT, MUSIC]) fs.mkdirSync(d, { recursive: true });
const FONT = path.join(here, 'config', 'fonts', 'DejaVuSans-Bold.ttf');

const IMG = /\.(jpe?g|png|webp|heic|heif|gif)$/i, VID = /\.(mp4|mov|m4v|webm|mkv|3gp)$/i, AUD = /\.(mp3|m4a|aac|wav|ogg|flac)$/i;
export const kindOf = f => IMG.test(f) ? 'photo' : VID.test(f) ? 'video' : AUD.test(f) ? 'music' : '';
const MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif', 'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/3gpp': '.3gp', 'video/x-matroska': '.mkv', 'audio/mpeg': '.mp3', 'audio/mp4': '.m4a', 'audio/aac': '.aac', 'audio/wav': '.wav', 'audio/x-wav': '.wav', 'audio/ogg': '.ogg', 'audio/flac': '.flac' };
export const extFor = (type, name) => { const e = path.extname(String(name || '')).toLowerCase(); return kindOf('x' + e) ? e : (MIME[String(type || '').split(';')[0].trim()] || ''); };
export const saveRaw = (buf, ext, label) => {
  const id = Date.now().toString(36) + crypto.randomBytes(2).toString('hex');
  const slug = String(label || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
  const file = `${id}${slug ? '-' + slug : ''}${ext}`; fs.writeFileSync(path.join(AUD.test(ext) ? MUSIC : RAW, file), buf); return file;
};
export const listRaw = (n = 12) => fs.readdirSync(RAW).map(f => ({ file: f, kind: kindOf(f), at: fs.statSync(path.join(RAW, f)).mtimeMs })).filter(x => x.kind).sort((a, b) => b.at - a.at).slice(0, n);
export const listMusic = () => fs.readdirSync(MUSIC).filter(f => AUD.test(f));
export const pickMusic = q => { const all = listMusic(); q = String(q || '').trim().toLowerCase(); if (!all.length || /^(none|no|off)$/.test(q)) return ''; if (!q || q === 'auto' || q === 'yes') return all[Math.floor(Math.random() * all.length)]; return all.find(f => f.toLowerCase().includes(q)) || ''; };
export const findRaw = q => {
  const all = listRaw(200); q = String(q || '').trim().toLowerCase();
  if (!q || q === 'latest' || q === 'last') return all[0] || null;
  return all.find(x => x.file.toLowerCase() === q) || all.find(x => x.file.toLowerCase().includes(q)) || null;
};
export const outPath = f => { const n = path.basename(String(f || '')); const p = path.join(OUT, n); return /^[\w.-]+$/.test(n) && fs.existsSync(p) ? p : ''; };
// Finished files older than 30 days go; raw uploads stay.
export const cleanup = () => { for (const f of fs.readdirSync(OUT)) { try { const p = path.join(OUT, f); if (Date.now() - fs.statSync(p).mtimeMs > 30 * 864e5) fs.unlinkSync(p); } catch {} } };

// shapes: width x height
// A still frame (JPEG) from an uploaded video, for the vision model; and whether the video has sound.
export async function frameOf(file, at = 1.2) {
  const out = path.join(os.tmpdir(), `fr-${crypto.randomBytes(4).toString('hex')}.jpg`);
  await run('ffmpeg', ['-y', '-ss', String(at), '-i', path.join(RAW, path.basename(file)), '-frames:v', '1', '-vf', 'scale=1024:-2', out], 60e3);
  const b = fs.readFileSync(out); try { fs.unlinkSync(out); } catch {} return b;
}
const probe = (file, args) => new Promise(res => { const p = spawn('ffprobe', ['-v', 'error', ...args, file], { stdio: ['ignore', 'pipe', 'ignore'] }); let o = ''; p.stdout.on('data', d => { o += d; }); p.on('error', () => res('')); p.on('close', () => res(o.trim())); });
export const hasAudio = async f => (await probe(f, ['-select_streams', 'a', '-show_entries', 'stream=codec_type', '-of', 'csv=p=0'])).includes('audio');
export const durationOf = async f => Number(await probe(f, ['-show_entries', 'format=duration', '-of', 'csv=p=0'])) || 0;
export async function photoSmall(file) { const S = await sharp(); return 'data:image/jpeg;base64,' + (await S(path.join(RAW, path.basename(file))).rotate().resize(1024, 1024, { fit: 'inside' }).jpeg({ quality: 80 }).toBuffer()).toString('base64'); }
export const SHAPES = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920], landscape: [1600, 900] };
const BRANDS = { defiant: { color: '#e11d2e', tag: 'DEFIANT AUDIO' }, myonlinecarguy: { color: '#18a0ff', tag: 'MYONLINECARGUY' }, nexus: { color: '#7c5cff', tag: 'NEXUS' }, myguru: { color: '#ff3d9a', tag: 'MYGURU' } };
const brandOf = b => BRANDS[String(b || '').toLowerCase().replace(/[^a-z]/g, '')] || { color: '#18a0ff', tag: '' };
const xml = s => String(s).replace(/[<&>"]/g, c => ({ '<': '&lt;', '&': '&amp;', '>': '&gt;', '"': '&quot;' }[c]));
// Word-wrap a headline to a few lines for a given pixel width and font size (bold sans is about 0.62 em per character).
const wrap = (t, w, size) => { const max = Math.max(6, Math.floor(w / (size * 0.62))), words = String(t).trim().split(/\s+/), lines = []; let cur = ''; for (const wd of words) { if ((cur + ' ' + wd).trim().length > max && cur) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); } if (cur) lines.push(cur); return lines.slice(0, 4); };

let sharpP;
async function sharp() {
  if (sharpP) return sharpP;
  // librsvg finds fonts through fontconfig; point it at the bundled font (a Railway container has none).
  try {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-')), conf = path.join(dir, 'fonts.conf');
    fs.writeFileSync(conf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${path.dirname(FONT)}</dir><cachedir>${dir}</cachedir></fontconfig>`);
    process.env.FONTCONFIG_FILE = conf;
  } catch {}
  sharpP = import('sharp').then(m => m.default);
  return sharpP;
}

export async function preparePhoto(file, { shape = 'portrait', headline = '', sub = '', brand = '' } = {}) {
  const S = await sharp(), [W, H] = SHAPES[shape] || SHAPES.portrait, br = brandOf(brand);
  const src = path.join(RAW, path.basename(file));
  // rotate() applies the phone's orientation; normalise + modulate gives a light "pro" lift without crushing it.
  let img = S(src).rotate().resize(W, H, { fit: 'cover', position: 'attention' }).normalise({ lower: 2, upper: 99 }).modulate({ saturation: 1.12, brightness: 1.03 }).sharpen({ sigma: 0.8 });
  const layers = [];
  const hl = String(headline || '').trim().toUpperCase().slice(0, 80);
  if (hl) {
    const size = Math.round(W * (hl.length > 34 ? 0.062 : 0.078)), lines = wrap(hl, W * 0.84, size), lh = Math.round(size * 1.12);
    const subL = String(sub || '').trim().slice(0, 70), subSize = Math.round(size * 0.42);
    const boxH = lines.length * lh + (subL ? subSize * 2.2 : 0) + Math.round(H * 0.07) + 40, y0 = H - boxH, pad = Math.round(W * 0.07);
    let ty = y0 + Math.round(H * 0.035) + size;
    const text = lines.map(l => { const t = `<text x="${pad}" y="${ty}" font-family="DejaVu Sans" font-weight="bold" font-size="${size}" fill="#fff">${xml(l)}</text>`; ty += lh; return t; }).join('');
    const subT = subL ? `<text x="${pad}" y="${ty + subSize * 0.4}" font-family="DejaVu Sans" font-weight="bold" font-size="${subSize}" fill="${br.color}">${xml(subL)}</text>` : '';
    const tag = br.tag ? `<text x="${W - pad}" y="${y0 - 18}" text-anchor="end" font-family="DejaVu Sans" font-weight="bold" font-size="${Math.round(W * 0.026)}" fill="#fff" fill-opacity="0.9">${xml(br.tag)}</text>` : '';
    layers.push({ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="0.45" stop-color="#000" stop-opacity="0.78"/><stop offset="1" stop-color="#000" stop-opacity="0.92"/></linearGradient></defs><rect x="0" y="${y0 - 90}" width="${W}" height="${boxH + 90}" fill="url(#g)"/><rect x="${pad}" y="${y0 + Math.round(H * 0.012)}" width="${Math.round(W * 0.12)}" height="8" fill="${br.color}"/>${tag}${text}${subT}</svg>`), top: 0, left: 0 });
  }
  const id = crypto.randomBytes(8).toString('hex'), name = `${id}.jpg`;
  await (layers.length ? img.composite(layers) : img).jpeg({ quality: 88, mozjpeg: true }).toFile(path.join(OUT, name));
  return { name, kind: 'photo', shape };
}

const run = (cmd, args, ms) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'ignore', 'pipe'] }); let err = '';
  p.stderr.on('data', d => { err = (err + d).slice(-600); });
  const t = setTimeout(() => { p.kill('SIGKILL'); rej(new Error('video edit took too long')); }, ms);
  p.on('error', e => { clearTimeout(t); rej(new Error(e.code === 'ENOENT' ? 'ffmpeg is not installed on the server' : e.message)); });
  p.on('close', c => { clearTimeout(t); c === 0 ? res() : rej(new Error('ffmpeg failed: ' + err.split('\n').slice(-3).join(' ').slice(0, 240))); });
});
const ffText = s => String(s).replace(/[\\':%]/g, ' ').replace(/[\r\n]+/g, ' ').trim();
export async function prepareVideo(file, { shape = 'story', headline = '', start = 0, seconds = 45, brand = '', music = '' } = {}) {
  const [W, H] = SHAPES[shape] || SHAPES.story, br = brandOf(brand), src = path.join(RAW, path.basename(file));
  const id = crypto.randomBytes(8).toString('hex'), name = `${id}.mp4`, hl = ffText(String(headline).toUpperCase().slice(0, 60));
  const dur = Math.max(3, Math.min(58, Number(seconds) || 45)), ss = Math.max(0, Number(start) || 0);
  const size = Math.round(W * (hl.length > 26 ? 0.06 : 0.075));
  const vf = [`scale=${W}:${H}:force_original_aspect_ratio=increase`, `crop=${W}:${H}`, 'eq=contrast=1.06:saturation=1.15:brightness=0.02', 'unsharp=5:5:0.6']
    .concat(hl ? [`drawbox=x=0:y=ih*0.72:w=iw:h=ih*0.2:color=black@0.55:t=fill:enable='lt(t,4)'`, `drawtext=fontfile=${FONT}:text='${hl}':fontcolor=white:fontsize=${size}:x=(w-text_w)/2:y=h*0.78:enable='lt(t,4)'`, `drawbox=x=iw*0.35:y=ih*0.72:w=iw*0.3:h=8:color=0x${br.color.slice(1)}:t=fill:enable='lt(t,4)'`] : []).join(',');
  const track = pickMusic(music), sound = await hasAudio(src);
  // Music sits under the original sound (quieter, fades out at the end); a silent clip gets the music alone.
  const fade = `afade=t=in:d=0.5,afade=t=out:st=${Math.max(0, dur - 1.5)}:d=1.5`;
  const args = ['-y', '-ss', String(ss), '-t', String(dur), '-i', src];
  if (track) args.push('-stream_loop', '-1', '-i', path.join(MUSIC, track));
  args.push('-vf', vf);
  if (track) args.push('-filter_complex', sound ? `[0:a]volume=1.0[a0];[1:a]volume=0.22,${fade}[a1];[a0][a1]amix=inputs=2:duration=first:dropout_transition=0,loudnorm=I=-16:TP=-1.5:LRA=11[a]` : `[1:a]volume=0.6,${fade},loudnorm=I=-16:TP=-1.5:LRA=11[a]`, '-map', '0:v:0', '-map', '[a]');
  else if (sound) args.push('-af', 'loudnorm=I=-16:TP=-1.5:LRA=11');
  args.push('-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', ...(track || sound ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']), '-t', String(dur), '-movflags', '+faststart', path.join(OUT, name));
  await run('ffmpeg', args, 5 * 60e3);
  return { name, kind: 'video', shape, music: track };
}
