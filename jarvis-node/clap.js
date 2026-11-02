// Clap detector: raw 16-bit mono PCM in, clap patterns (2, 3...) out.
// A clap is a sharp, loud, SHORT transient: it jumps well above the room's background level within ~10 ms and dies away within
// ~150 ms. Speech, music, a dropped box or a slammed door last longer or rise slower, so they are rejected. Claps 120-800 ms apart
// form one pattern; the pattern is reported once the room has been quiet for the max gap after the last clap.
// Time comes from the sample count (not the clock), so it can be tested on synthetic audio.
export class ClapDetector {
  constructor({ rate = 16000, sensitivity = 5, onPattern = () => {}, onClap = () => {}, onLevel = null } = {}) {
    this.rate = rate; this.frame = Math.round(rate / 100);          // 10 ms frames
    this.onPattern = onPattern; this.onClap = onClap; this.onLevel = onLevel;
    this.setSensitivity(sensitivity);
    this.minGap = 120; this.maxGap = 800; this.maxLen = 150;        // ms
    this.floor = 0.005; this.prev = 0; this.t = 0; this.buf = Buffer.alloc(0);
    this.ev = null; this.claps = []; this.refractUntil = 0; this.loudUntil = 0; this.lvl = { peak: 0, n: 0 };
  }
  // 1 = only very hard claps, 10 = soft claps (and more false triggers)
  setSensitivity(s) {
    this.sensitivity = Math.max(1, Math.min(10, Number(s) || 5));
    const k = (this.sensitivity - 1) / 9;                            // 0..1
    this.minPeak = 0.5 - 0.44 * k;                                   // 0.50 .. 0.06 of full scale
    this.ratio = 16 - 8 * k;                                         // peak must be 16x .. 8x the background RMS
  }
  push(chunk) {
    this.buf = this.buf.length ? Buffer.concat([this.buf, chunk]) : chunk;
    const bytes = this.frame * 2;
    let off = 0;
    for (; off + bytes <= this.buf.length; off += bytes) this.step(this.buf, off, bytes);
    this.buf = this.buf.subarray(off);
  }
  step(b, off, bytes) {
    let sum = 0, peak = 0;
    for (let i = off; i < off + bytes; i += 2) { const v = b.readInt16LE(i) / 32768, a = Math.abs(v); sum += v * v; if (a > peak) peak = a; }
    const rms = Math.sqrt(sum / (bytes / 2)), now = this.t; this.t += 10;
    if (this.onLevel) { this.lvl.peak = Math.max(this.lvl.peak, peak); if (++this.lvl.n >= 10) { this.onLevel({ peak: this.lvl.peak, floor: this.floor, t: now }); this.lvl = { peak: 0, n: 0 }; } }
    if (this.ev) {
      this.ev.len += 10; this.ev.max = Math.max(this.ev.max, rms);
      if (rms < this.ev.max * 0.2 || rms < this.floor * 2) {            // decayed: it was short enough to be a clap?
        const e = this.ev; this.ev = null; this.refractUntil = now + 40;
        if (e.len <= this.maxLen && now >= this.loudUntil) this.clap(e.t);
      } else if (this.ev.len > this.maxLen) {                            // sustained: speech/music/bang, ignore and back off
        this.ev = null; this.loudUntil = now + 400; this.claps = []; this.over = false;
      }
    } else if (now >= this.refractUntil && peak >= this.minPeak && peak >= this.floor * this.ratio && rms >= Math.max(this.floor * 3, 0.02) && rms >= this.prev * 3) {
      this.ev = { t: now, len: 10, max: rms };
    } else {
      const a = rms > this.floor ? 0.01 : 0.05;                         // background follows quiet fast, loud slowly
      this.floor = Math.max(0.0005, this.floor + (rms - this.floor) * a);
    }
    this.prev = rms;
    if (this.claps.length && !this.ev && now - this.claps.at(-1) > this.maxGap) {
      const n = this.claps.length, over = this.over; this.claps = []; this.over = false;
      if (n >= 2 && !over && now >= this.loudUntil) this.onPattern(n, now);
    }
  }
  clap(t) {
    const last = this.claps.at(-1);
    if (last != null && t - last < this.minGap) return;                // echo of the same clap
    this.claps.push(t); this.onClap(t);
    if (this.claps.length > 4) this.over = true;                       // applause, not a command: drop the whole run
  }
}
