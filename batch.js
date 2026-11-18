// Batch upload analysis: the ANALYZE UPLOADS button on the HUD (and "analyze these uploads" by voice).
// Several photos, screenshots, short videos and screen recordings; EVERY file is analyzed and answered on its own.
// Kept apart from the SOCIAL button on purpose: batch files live in <data>/media/batch/<id>/, never in media/raw,
// so a batch file is never offered for a post and a social upload is never treated as an analysis job.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import * as media from './media.js';
import { analyzeBatchItem, transcribeAudio } from './vision.js';

export const DIR = path.join(path.dirname(media.RAW), 'batch');
fs.mkdirSync(DIR, { recursive: true });
export const LIMITS = {
  files: Number(process.env.BATCH_MAX_FILES) || 12,
  bytes: (Number(process.env.BATCH_MAX_MB) || 200) * 1048576,
  videoSec: Number(process.env.BATCH_MAX_VIDEO_SEC) || 180     // longer clips: only the first N seconds are analyzed (and he is told)
};
const IMG = /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i, VID = /\.(mp4|mov|m4v|webm|mkv|3gp)$/i;
const MIME = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/heic': '.heic', 'image/heif': '.heif', 'image/gif': '.gif', 'image/bmp': '.bmp', 'video/mp4': '.mp4', 'video/quicktime': '.mov', 'video/webm': '.webm', 'video/3gpp': '.3gp', 'video/x-matroska': '.mkv', 'video/x-m4v': '.m4v' };
export const kindOf = f => IMG.test(f) ? 'image' : VID.test(f) ? 'video' : '';
export const extFor = (type, name) => { const e = path.extname(String(name || '')).toLowerCase(); return kindOf('x' + e) ? e : (MIME[String(type || '').split(';')[0].trim().toLowerCase()] || ''); };
const validId = id => /^[a-z0-9]{6,24}$/.test(String(id || ''));
const dirOf = id => path.join(DIR, id);
const manPath = id => path.join(dirOf(id), 'batch.json');
export const newId = () => Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
export function load(id) { if (!validId(id)) return null; try { return JSON.parse(fs.readFileSync(manPath(id), 'utf8')); } catch { return null; } }
export function save(b) { fs.mkdirSync(dirOf(b.id), { recursive: true }); fs.writeFileSync(manPath(b.id), JSON.stringify(b, null, 1)); return b; }
const all = () => { try { return fs.readdirSync(DIR).map(load).filter(Boolean).sort((a, b) => b.created - a.created); } catch { return []; } };
// The newest batch that was uploaded but not analyzed yet (what "analyze these uploads" picks up).
export const latestQueued = () => all().find(b => b.status === 'queued' && b.items.length) || null;
export const latest = () => all()[0] || null;

// Stream one file to disk (never held in memory), capped; a partial file is removed.
export function saveFile(req, id, name) {
  return new Promise((res, rej) => {
    if (!validId(id)) return rej(new Error('Bad batch id.'));
    const b = load(id) || save({ id, created: Date.now(), status: 'uploading', instruction: '', items: [] });
    if (b.status === 'running' || b.status === 'done') return rej(new Error('That batch was already analyzed. Start a new one.'));
    if (b.items.length >= LIMITS.files) return rej(new Error(`Up to ${LIMITS.files} files per batch.`));
    const ext = extFor(req.headers['content-type'], name);
    if (!ext) return rej(Object.assign(new Error('Photos, screenshots and videos only (jpg, png, webp, heic, mp4, mov, webm).'), { code: 415 }));
    const clean = String(name || 'file' + ext).replace(/[^\w .()+-]/g, '_').slice(-80);
    const file = `${String(b.items.length + 1).padStart(2, '0')}-${crypto.randomBytes(3).toString('hex')}${ext}`, full = path.join(dirOf(id), file), out = fs.createWriteStream(full);
    let n = 0, dead = false;
    const fail = e => { if (dead) return; dead = true; try { out.destroy(); fs.unlinkSync(full); } catch {} rej(e); };
    req.on('data', c => { n += c.length; if (n > LIMITS.bytes) { fail(Object.assign(new Error(`${clean} is too large (limit ${Math.round(LIMITS.bytes / 1048576)} MB).`), { code: 413 })); req.destroy(); } });
    req.on('error', fail); req.on('aborted', () => fail(new Error('Upload was cut off.'))); out.on('error', fail);
    out.on('finish', () => {
      if (dead) return; if (!n) return fail(new Error('Empty upload.'));
      const cur = load(id) || b; const item = { file, name: clean, kind: kindOf(ext), bytes: n, question: '' };
      cur.items.push(item); save(cur); res(item);
    });
    req.pipe(out);
  });
}

// ---------- extraction (ffmpeg / sharp), one heavy job at a time with the social edits ----------
const tmp = ext => path.join(os.tmpdir(), `bt-${crypto.randomBytes(5).toString('hex')}${ext}`);
const readGone = p => { const b = fs.readFileSync(p); try { fs.unlinkSync(p); } catch {} return b; };
const jpegUrl = buf => 'data:image/jpeg;base64,' + buf.toString('base64');
async function imageUrl(full, px) {
  try { const S = await media.sharpLib(); return jpegUrl(await S(full).rotate().resize(px, px, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer()); }
  catch (e) {   // HEIC and odd formats: let ffmpeg decode it instead
    const o = tmp('.jpg');
    try { await media.ffmpegRun(['-y', '-i', full, '-frames:v', '1', '-vf', `scale='min(${px},iw)':-2`, o], 60e3); return jpegUrl(readGone(o)); }
    catch { throw new Error(`could not open the image (${e.message.slice(0, 80)})`); }
  }
}
const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
async function videoFrames(full, span, count, px) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const t = span > 0 ? Math.min(span - 0.2, span * (i + 0.5) / count) : i;
    const o = tmp('.jpg');
    try { await media.ffmpegRun(['-y', '-ss', Math.max(0, t).toFixed(2), '-i', full, '-map', '0:v:0', '-an', '-sn', '-frames:v', '1', '-vf', `scale='min(${px},iw)':-2`, '-q:v', '4', o], 60e3); out.push({ url: jpegUrl(readGone(o)), label: `Frame at ${mmss(t)}:` }); }
    catch { try { fs.unlinkSync(o); } catch {} }
  }
  return out;
}
async function audioB64(full, secs, kbps) {
  const o = tmp('.mp3');
  await media.ffmpegRun(['-y', '-t', String(Math.ceil(secs)), '-i', full, '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '16000', '-b:a', kbps + 'k', o], 120e3);
  const b = readGone(o); if (b.length < 2000) throw new Error('audio track is empty'); return b.toString('base64');
}

// ---------- one file ----------
async function analyzeOne(b, it, spend) {
  const full = path.join(dirOf(b.id), it.file), notes = [];
  if (!fs.existsSync(full)) throw new Error('the uploaded file is missing on the server');
  const base = { name: it.name, kind: it.kind, question: it.question, instruction: b.instruction };
  if (it.kind === 'image') {
    let r;
    try { const url = await media.heavyJob('batch-image', () => imageUrl(full, 1600)); r = await analyzeBatchItem({ ...base, images: [{ url }], notes }); }
    catch (e) {   // second go, smaller picture
      if (/key|credit|spending/i.test(e.message)) throw e;
      const url = await media.heavyJob('batch-image', () => imageUrl(full, 1000)); notes.push('(Retried at lower resolution.)'); r = await analyzeBatchItem({ ...base, images: [{ url }], notes });
    }
    spend(r.cost); return { ...r, notes: [] };
  }
  // video / screen recording: frames across the clip + the audio track
  const dur = await media.durationOf(full), aud = await media.hasAudio(full), told = [];
  const span = dur > 0 ? Math.min(dur, LIMITS.videoSec) : LIMITS.videoSec;
  if (dur > LIMITS.videoSec) told.push(`Only the first ${mmss(LIMITS.videoSec)} of this ${mmss(dur)} clip was analyzed (limit ${mmss(LIMITS.videoSec)}).`);
  notes.push(dur ? `Clip length ${mmss(dur)}${dur > LIMITS.videoSec ? `, frames and audio cover the first ${mmss(span)} only` : ''}.` : 'Clip length unknown.');
  let transcript = null;
  if (aud) {
    try { const a = await media.heavyJob('batch-audio', () => audioB64(full, span, 32)); const t = await transcribeAudio({ b64: a }); spend(t.cost); transcript = t; }
    catch (e) {
      if (/key|credit|spending/i.test(e.message)) told.push('Audio skipped: ' + e.message);
      else try {   // retry: lower bitrate and at most the first minute
        const s2 = Math.min(span, 60), a = await media.heavyJob('batch-audio', () => audioB64(full, s2, 16)); const t = await transcribeAudio({ b64: a }); spend(t.cost); transcript = t;
        if (s2 < span) told.push(`Audio transcribed for the first ${mmss(s2)} only (the full track failed: ${e.message.slice(0, 80)}).`);
      } catch (e2) { told.push(`The audio could not be transcribed (${e2.message.slice(0, 100)}); this answer is from the picture only.`); }
    }
  } else notes.push('The clip has no audio track.');
  const count = Math.max(4, Math.min(10, Math.round(span / 12)));
  let r, lastErr;
  for (const [n, px] of [[count, 768], [Math.max(3, Math.ceil(count / 2)), 512], [2, 384]]) {   // lower sample rate on each retry instead of failing
    try {
      const frames = await media.heavyJob('batch-frames', () => videoFrames(full, span, n, px));
      if (!frames.length) throw new Error('no frames could be read from the video');
      r = await analyzeBatchItem({ ...base, images: frames, transcript, notes: [...notes, `${frames.length} frames sampled evenly across it.`] });
      if (n !== count) told.push(`Analyzed at a lower sample rate (${frames.length} frames) after the first try failed.`);
      break;
    } catch (e) { lastErr = e; if (/key|credit|spending/i.test(e.message)) break; }
  }
  if (!r) {
    if (transcript?.speech) return { title: it.name, answer: 'I could not read the picture, but here is what is said in it.', details: '- Transcript:\n' + transcript.speech.slice(0, 2000), notes: [...told, `Frames failed: ${lastErr?.message || 'unknown'}.`], partial: true };
    throw lastErr || new Error('the video could not be analyzed');
  }
  spend(r.cost);
  if (transcript?.speech && !/transcript|said|says/i.test(r.details)) r.details += `\n- Said in it: ${transcript.speech.slice(0, 600)}${transcript.speech.length > 600 ? '…' : ''}`;
  return { ...r, notes: told };
}

// ---------- the whole batch ----------
// hooks: progress(text), spend(usd), blocked() -> reason or null. Every file is tried; one failure never stops the rest.
const running = new Set();
export async function run(id, hooks = {}) {
  const b = load(id); if (!b) throw new Error('No such batch.');
  if (running.has(id)) throw new Error('That batch is already being analyzed.');
  running.add(id); b.status = 'running'; b.startedAt = Date.now(); save(b);
  const results = [];
  try {
    for (const [i, it] of b.items.entries()) {
      hooks.progress?.(`Analyzing ${i + 1} of ${b.items.length}: ${it.name}`);
      const stop = hooks.blocked?.();
      if (stop) { results.push({ name: it.name, ok: false, error: stop }); continue; }
      try { const r = await analyzeOne(b, it, v => hooks.spend?.(v)); results.push({ name: it.name, kind: it.kind, ok: true, ...r }); }
      catch (e) { console.warn(`  batch ${id}: ${it.name} failed: ${e.message}`); results.push({ name: it.name, kind: it.kind, ok: false, error: e.message }); }
    }
    for (const f of b.clientFailed || []) results.push({ name: f.name, ok: false, error: f.reason || 'it did not upload' });
  } finally { running.delete(id); }
  const cur = load(id) || b; cur.status = 'done'; cur.doneAt = Date.now(); cur.results = results; save(cur);
  return { batch: cur, results };
}

// Text for the HUD panel and the comms log: one labelled block per file.
export function blocks(results) {
  return results.map((r, i) => r.ok
    ? `**${i + 1}. ${r.name}**${r.title && r.title !== r.name ? ` · ${r.title}` : ''}\n${r.answer}${r.notes?.length ? '\n' + r.notes.map(n => '- ⚠ ' + n).join('\n') : ''}${r.details ? '\n' + r.details : ''}`
    : `**${i + 1}. ${r.name}** · FAILED\n- ${r.error}`);
}
// Spoken: each file's first sentence (up to 4 files), then plainly which ones failed and why.
export function spoken(results, title = 'sir') {
  const ok = results.filter(r => r.ok), bad = results.filter(r => !r.ok), first = t => (String(t).match(/^.*?[.!?](\s|$)/) || [t])[0].trim();
  const parts = [`I went through all ${results.length} file${results.length > 1 ? 's' : ''}, ${title}.`];
  if (ok.length && ok.length <= 4) ok.forEach(r => parts.push(`${r.name.replace(/\.[a-z0-9]+$/i, '')}: ${first(r.answer)}`));
  else if (ok.length) parts.push(`${ok.length} answered; each one is on the screen in its own block.`);
  for (const r of bad) parts.push(`${r.name.replace(/\.[a-z0-9]+$/i, '')} failed: ${String(r.error).replace(/\.?$/, '.')}`);
  if (ok.length) parts.push('The full answer for each file is on the screen.');
  return parts.join(' ');
}

// Batches are a work area, not an archive: gone after BATCH_KEEP_DAYS (default 7).
export function cleanup(days = Number(process.env.BATCH_KEEP_DAYS) || 7) {
  for (const d of fs.readdirSync(DIR)) {
    try { const p = path.join(DIR, d); if (Date.now() - fs.statSync(p).mtimeMs > days * 864e5) fs.rmSync(p, { recursive: true, force: true }); } catch {}
  }
}
