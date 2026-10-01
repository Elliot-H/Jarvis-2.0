/* Reactor Prime: the Jarvis emblem. One drawing, used for the boot screen and for exporting the app icons.
 * drawPrime(ctx, size, seconds, opts). All art is laid out in a 340 x 340 space and scaled to `size`.
 * opts: sweep (radar wash), triRot (fixed triangle angle, for stills), bg (backdrop + grid + particles), reactor, labels (degree numbers), compass, hud (brackets + readouts),
 *       fx (scan line, scanlines, glitch, vignette), cx, cy, R (reactor centre and radius, in 340 space). */
(() => {
  const CY = [63, 224, 255];
  const rg = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  const rnd = n => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s); };
  const PT = Array.from({ length: 44 }, (_, i) => ({ x: rnd(i), y: rnd(i + 50), vx: (rnd(i + 90) - .5) * .012, vy: (rnd(i + 130) - .5) * .012, r: .4 + rnd(i + 7) * 1.3 }));

  window.drawPrime = function (x, S, t, o) {
    o = Object.assign({ bg: true, reactor: true, labels: true, compass: true, hud: true, fx: true, cx: 170, cy: 170, R: 136, sweep: true, triRot: null }, o || {});
    const K = 340, C = K / 2, R = 136, u = o.R / R;
    x.save(); x.scale(S / K, S / K); x.lineCap = 'round'; x.shadowBlur = 0;
    const arc = (r, w, a, s, e, d) => { x.beginPath(); x.lineWidth = w; x.strokeStyle = rg(CY, a); if (d) x.setLineDash(d); x.arc(0, 0, r, s, e); x.stroke(); x.setLineDash([]); };

    if (o.bg) {
      const g = x.createRadialGradient(C, C * .95, 0, C, C * .95, K * .75);
      g.addColorStop(0, rg(CY, .2)); g.addColorStop(.5, '#04101c'); g.addColorStop(1, '#010409');
      x.fillStyle = g; x.fillRect(0, 0, K, K);
      x.strokeStyle = rg(CY, .05); x.lineWidth = 1; x.beginPath();
      const st = 28; for (let a = (t * 8) % st; a < K; a += st) { x.moveTo(a, 0); x.lineTo(a, K); x.moveTo(0, a); x.lineTo(K, a); }
      x.stroke();
      const pp = PT.map(p => [((p.x + p.vx * t) % 1 + 1) % 1 * K, ((p.y + p.vy * t) % 1 + 1) % 1 * K, p.r]);
      x.lineWidth = .6;
      for (let i = 0; i < pp.length; i++) for (let j = i + 1; j < pp.length; j++) {
        const d = Math.hypot(pp[i][0] - pp[j][0], pp[i][1] - pp[j][1]);
        if (d < 62) { x.strokeStyle = rg(CY, .16 * (1 - d / 62)); x.beginPath(); x.moveTo(pp[i][0], pp[i][1]); x.lineTo(pp[j][0], pp[j][1]); x.stroke(); }
      }
      x.fillStyle = rg(CY, .55); pp.forEach(p => { x.beginPath(); x.arc(p[0], p[1], p[2], 0, 7); x.fill(); });
    }

    if (o.reactor) {
      x.save(); x.translate(o.cx, o.cy); x.scale(u, u); x.shadowColor = '#3fe0ff'; x.shadowBlur = 8;
      x.save(); x.rotate(t * .04);
      for (let i = 0; i < 144; i++) {
        const a = i / 144 * 6.283, lg = i % 12 === 0, md = i % 4 === 0, L = lg ? 9 : md ? 5 : 3;
        x.strokeStyle = rg(CY, lg ? 1 : md ? .55 : .28); x.lineWidth = lg ? 1.8 : .8;
        x.beginPath(); x.moveTo(Math.cos(a) * (R - L), Math.sin(a) * (R - L)); x.lineTo(Math.cos(a) * R, Math.sin(a) * R); x.stroke();
      }
      if (o.labels) {
        x.shadowBlur = 0; x.fillStyle = rg(CY, .8); x.font = '600 7px "JetBrains Mono",monospace'; x.textAlign = 'center'; x.textBaseline = 'middle';
        for (let k = 0; k < 12; k++) { x.save(); x.rotate(k / 12 * 6.283); x.translate(0, -R - 9); x.fillText(String(k * 30).padStart(3, '0'), 0, 0); x.restore(); }
      }
      x.restore(); x.shadowBlur = 8;
      if (o.compass) {
        x.fillStyle = rg(CY, .95);
        for (let k = 0; k < 4; k++) { x.save(); x.rotate(k * 1.5708); x.translate(0, -R - 22); x.beginPath(); x.moveTo(-4, -3); x.lineTo(4, -3); x.lineTo(0, 4); x.closePath(); x.fill(); x.restore(); }
      }
      x.save(); x.rotate(-t * .12); arc(R * .93, 1, .4, 0, 6.283, [1, 6]); x.restore();
      x.save(); x.rotate(-t * .3);
      for (let k = 0; k < 3; k++) { const s = k * 2.094, e = s + 1; arc(R * .87, 4, .9, s, e); x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.cos(e) * R * .87, Math.sin(e) * R * .87, 3, 0, 7); x.fill(); }
      x.restore();
      x.save(); x.rotate(t * .5); x.beginPath();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; i ? x.lineTo(Math.cos(a) * R * .78, Math.sin(a) * R * .78) : x.moveTo(Math.cos(a) * R * .78, Math.sin(a) * R * .78); }
      x.closePath(); x.strokeStyle = rg(CY, .4); x.lineWidth = 1.2; x.stroke();
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.283; x.fillStyle = rg(CY, 1); x.beginPath(); x.arc(Math.cos(a) * R * .78, Math.sin(a) * R * .78, 2.2, 0, 7); x.fill(); }
      x.restore();
      x.save(); x.rotate(t * .1);
      for (let i = 0; i < 90; i++) {
        const a = i / 90 * 6.283, n = (Math.sin(t * 3 + i * .7) + Math.sin(t * 5.3 - i * 1.3) + 2) / 4, L = R * (.03 + n * .13 + .03 * Math.sin(t * 2)), b = R * .57;
        x.strokeStyle = rg(CY, .3 + n * .65); x.lineWidth = 2; x.beginPath(); x.moveTo(Math.cos(a) * b, Math.sin(a) * b); x.lineTo(Math.cos(a) * (b + L), Math.sin(a) * (b + L)); x.stroke();
      }
      x.restore();
      const sw = x.createConicGradient(t * 1.5, 0, 0); sw.addColorStop(0, rg(CY, .42)); sw.addColorStop(.26, rg(CY, 0)); sw.addColorStop(1, rg(CY, 0));
      x.shadowBlur = 0; if (o.sweep) { x.fillStyle = sw; x.beginPath(); x.arc(0, 0, R * .72, 0, 7); x.fill(); } x.shadowBlur = 8;
      for (let k = 0; k < 3; k++) {
        const a = t * (2.2 + k * .6) + k * 2.1, r = R * (.66 + k * .06);
        for (let j = 0; j < 14; j++) { const aa = a - j * .07; x.fillStyle = rg(CY, (1 - j / 14) * .55); x.beginPath(); x.arc(Math.cos(aa) * r, Math.sin(aa) * r, 2.6 * (1 - j / 18), 0, 7); x.fill(); }
        x.fillStyle = '#fff'; x.beginPath(); x.arc(Math.cos(a) * r, Math.sin(a) * r, 3, 0, 7); x.fill();
      }
      const ch = (t * 6) % 10; x.save(); x.rotate(t * .1);
      for (let i = 0; i < 10; i++) {
        const a0 = i / 10 * 6.283 + .05, a1 = (i + 1) / 10 * 6.283 - .05; let d = Math.abs(i - ch); d = Math.min(d, 10 - d);
        const hl = Math.max(0, 1 - d / 2.2);
        x.beginPath(); x.arc(0, 0, R * .46, a0, a1); x.arc(0, 0, R * .3, a1, a0, true); x.closePath();
        x.fillStyle = rg(CY, .1 + hl * .55); x.fill(); x.strokeStyle = rg(CY, .55 + hl * .45); x.lineWidth = 1.1; x.stroke();
      }
      x.restore();
      arc(R * .28, 2, .95, 0, 6.283); arc(R * .48, 1.2, .65, 0, 6.283);
      [0, .5].forEach(off => { const ph = (t * .5 + off) % 1; arc(R * .12 + ph * R * .8, 2, (1 - ph) * .45, 0, 6.283); });
      const sd = Math.floor(t * 9); x.shadowBlur = 7;
      for (let k = 0; k < 3; k++) {
        if (rnd(sd + k * 11) < .4) continue;
        const a = rnd(sd * 3 + k) * 6.283; x.strokeStyle = `rgba(210,250,255,${.55 + rnd(sd + k) * .4})`; x.lineWidth = 1.2; x.beginPath();
        for (let j = 0; j <= 7; j++) { const r = R * .1 + j / 7 * R * .36, aa = a + (j && j < 7 ? (rnd(sd * 7 + k * 13 + j) - .5) * .22 : 0); j ? x.lineTo(Math.cos(aa) * r, Math.sin(aa) * r) : x.moveTo(Math.cos(aa) * r, Math.sin(aa) * r); }
        x.stroke();
      }
      const cr = R * .1 + Math.sin(t * 3.2) * 2.2, cg = x.createRadialGradient(0, 0, 0, 0, 0, cr * 2.6);
      cg.addColorStop(0, 'rgba(255,255,255,1)'); cg.addColorStop(.25, rg(CY, .9)); cg.addColorStop(.6, rg(CY, .22)); cg.addColorStop(1, rg(CY, 0));
      x.shadowBlur = 0; x.fillStyle = cg; x.beginPath(); x.arc(0, 0, cr * 2.6, 0, 7); x.fill();
      const fl = .6 + .4 * Math.sin(t * 3.2), hg = x.createLinearGradient(-R * .5, 0, R * .5, 0);
      hg.addColorStop(0, rg(CY, 0)); hg.addColorStop(.5, `rgba(255,255,255,${.85 * fl})`); hg.addColorStop(1, rg(CY, 0)); x.fillStyle = hg; x.fillRect(-R * .5, -.8, R, 1.6);
      const vg = x.createLinearGradient(0, -R * .3, 0, R * .3);
      vg.addColorStop(0, rg(CY, 0)); vg.addColorStop(.5, `rgba(255,255,255,${.6 * fl})`); vg.addColorStop(1, rg(CY, 0)); x.fillStyle = vg; x.fillRect(-.6, -R * .3, 1.2, R * .6);
      x.shadowBlur = 8; x.save(); x.rotate(o.triRot == null ? t * .35 : o.triRot); x.strokeStyle = 'rgba(255,255,255,.95)'; x.lineWidth = 1.6; x.beginPath();
      for (let k = 0; k < 3; k++) { const a = k * 2.094 - 1.571, r = R * .19; k ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.closePath(); x.stroke(); x.restore();
      x.save(); x.rotate(o.triRot == null ? -t * .8 : Math.PI); x.strokeStyle = rg(CY, .9); x.lineWidth = 1; x.beginPath();
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + 1.571, r = R * .09; k ? x.lineTo(Math.cos(a) * r, Math.sin(a) * r) : x.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      x.closePath(); x.stroke(); x.restore();
      x.restore();
    }

    if (o.hud) {
      x.save(); x.strokeStyle = rg(CY, .65); x.lineWidth = 2; x.lineCap = 'square';
      const m = 18, L = 20;
      [[m, m, 1, 1], [K - m, m, -1, 1], [m, K - m, 1, -1], [K - m, K - m, -1, -1]].forEach(([a, b, sx, sy]) => { x.beginPath(); x.moveTo(a, b + L * sy); x.lineTo(a, b); x.lineTo(a + L * sx, b); x.stroke(); });
      x.shadowColor = '#3fe0ff'; x.shadowBlur = 6; x.fillStyle = rg(CY, .85); x.font = '600 7px "JetBrains Mono",monospace'; x.textBaseline = 'alphabetic';
      x.textAlign = 'left'; x.fillText('SYS ONLINE', 32, 34); x.textAlign = 'right'; x.fillText('PWR ' + (99 + Math.sin(t * 2)).toFixed(1) + '%', K - 32, K - 30);
      if (Math.sin(t * 5) > 0) { x.beginPath(); x.arc(26, 31, 2, 0, 7); x.fillStyle = '#5fe3a1'; x.fill(); }
      x.shadowBlur = 10; x.fillStyle = 'rgba(180,248,255,.95)'; x.font = '900 14px Orbitron,sans-serif'; x.textAlign = 'center'; x.fillText('J.A.R.V.I.S.', C, K - 26);
      x.restore();
    }

    if (o.fx) {
      x.shadowBlur = 0;
      const sy = (t * 55) % (K + 60) - 30, sg = x.createLinearGradient(0, sy - 30, 0, sy);
      sg.addColorStop(0, rg(CY, 0)); sg.addColorStop(1, rg(CY, .09)); x.fillStyle = sg; x.fillRect(0, sy - 30, K, 30);
      x.fillStyle = 'rgba(0,0,0,.14)'; for (let y = 0; y < K; y += 3) x.fillRect(0, y, K, 1);
      const gl = t % 6; if (gl < .14) for (let k = 0; k < 4; k++) { x.fillStyle = rg(CY, .14); x.fillRect(0, rnd(Math.floor(t * 30) + k) * K, K, 2 + rnd(k + 3) * 6); }
      const vgn = x.createRadialGradient(C, C, K * .38, C, C, K * .72); vgn.addColorStop(0, 'rgba(0,0,0,0)'); vgn.addColorStop(1, 'rgba(0,0,0,.6)'); x.fillStyle = vgn; x.fillRect(0, 0, K, K);
    }
    x.restore();
  };
})();
