/* J.A.R.V.I.S. HUD client
 * - Wake word + push-to-talk via the browser's speech recognition (Chrome / Edge)
 * - Speaks with ElevenLabs through the server, falls back to the browser voice
 * - Reactor visual reacts to state + live audio level
 * URL flags:  ?display=1  → display-only screen (no mic, no voice, no boot) for Pi kiosks / extra monitors
 */
(() => {
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const DISPLAY_ONLY = params.get('display') === '1';

  let cfg = { name: 'JARVIS', wakeWord: 'jarvis', userTitle: 'sir', elevenlabs: false };
  let ws, state = 'idle', level = 0, targetLevel = 0;
  let audioCtx, ttsAnalyser, micAnalyser, freq = new Uint8Array(128);
  let speaking = false, currentAudio = null;

  // ======================= state =======================
  const LABEL = { idle: 'STANDBY', listening: 'LISTENING', thinking: 'PROCESSING', speaking: 'SPEAKING', offline: 'OFFLINE' };
  function setState(s, { echo = true } = {}) {
    state = s;
    document.body.dataset.state = s;
    $('#coreState').textContent = LABEL[s] || s.toUpperCase();
    const chip = $('#chipState');
    chip.className = 'chip ' + (s === 'offline' ? 'bad' : s === 'thinking' ? 'warn' : 'ok');
    chip.querySelector('span').textContent = LABEL[s] || s;
    $('#micBtn').classList.toggle('on', s === 'listening');
    $('#coreHint').textContent =
      s === 'listening' ? 'Go ahead, ' + cfg.userTitle + '…' :
      s === 'thinking' ? 'Working on it' :
      s === 'speaking' ? 'Click the core or press SPACE to interrupt' :
      `Say "${cap(cfg.wakeWord)}" or press SPACE`;
    if (echo && !DISPLAY_ONLY && ws?.readyState === 1 && (s === 'listening' || s === 'speaking' || s === 'idle'))
      ws.send(JSON.stringify({ type: 'state', state: s }));
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  // ======================= clock =======================
  function tick() {
    const d = new Date();
    $('#clockTime').textContent = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    $('#clockDate').textContent = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase();
  }
  setInterval(tick, 1000); tick();

  // ======================= websocket =======================
  function connect() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { chip('#chipLink', 'ok', 'LINK'); if (state === 'offline') setState('idle', { echo: false }); };
    ws.onclose = () => { chip('#chipLink', 'bad', 'LINK'); setState('offline', { echo: false }); setTimeout(connect, 2000); };
    ws.onmessage = e => handle(JSON.parse(e.data));
  }
  function send(o) { if (ws?.readyState === 1) ws.send(JSON.stringify(o)); }
  function chip(sel, cls, txt) { const c = $(sel); c.className = 'chip ' + cls; if (txt) c.querySelector('span').textContent = txt; }

  function handle(m) {
    switch (m.type) {
      case 'state':
        if (m.state === 'thinking') { setState('thinking', { echo: false }); ticker('Processing…'); }
        else if (DISPLAY_ONLY) setState(m.state, { echo: false });
        break;
      case 'log': addLog(m.role === 'user' ? 'user' : 'system', m.text); break;
      case 'activity': addActivity(m.text); ticker(m.text); break;
      case 'say':
        ticker('');
        if (m.text) addLog('jarvis', m.text);
        if (m.speak && !DISPLAY_ONLY && booted) speak(m.text);
        else { caption(m.text); setState('idle', { echo: false }); if (!DISPLAY_ONLY) resumeListening(); }
        break;
      case 'stats': renderStats(m.stats); break;
      case 'panels': renderPanels(m.panels); break;
      case 'connections': renderConns(m.connections); break;
      case 'meta': break;
    }
  }

  // ======================= log / activity / caption =======================
  function addLog(kind, text) {
    const who = kind === 'user' ? 'YOU' : kind === 'jarvis' ? cfg.name.toUpperCase() : 'SYSTEM';
    const el = document.createElement('div');
    el.className = 'msg ' + kind;
    el.innerHTML = `<span class="who">${who} · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>`;
    el.appendChild(document.createTextNode(text));
    const log = $('#log'); log.appendChild(el);
    while (log.children.length > 80) log.firstChild.remove();
    log.scrollTop = log.scrollHeight;
  }
  function addActivity(text) {
    const li = document.createElement('li');
    li.innerHTML = `<b>${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</b>`;
    li.appendChild(document.createTextNode(text));
    const a = $('#activity'); a.prepend(li);
    while (a.children.length > 30) a.lastChild.remove();
  }
  let tickerT;
  function ticker(t) { clearTimeout(tickerT); $('#ticker').textContent = t ? '▸ ' + t : ''; if (t) tickerT = setTimeout(() => $('#ticker').textContent = '', 12000); }
  let capT, capI;
  function caption(text, { typed = true, pre = '>>' } = {}) {
    clearInterval(capI); clearTimeout(capT);
    const c = $('#caption');
    if (!text) { c.innerHTML = ''; return; }
    c.innerHTML = `<span class="pre">${pre}</span><span class="t"></span>`;
    const t = c.querySelector('.t');
    if (!typed) t.textContent = text;
    else { let i = 0; capI = setInterval(() => { t.textContent = text.slice(0, i += 2); if (i >= text.length) clearInterval(capI); }, 28); }
    capT = setTimeout(() => { if (!speaking) c.innerHTML = ''; }, Math.max(6000, text.length * 90));
  }

  // ======================= stats / panels / conns =======================
  const prevVals = {};
  function renderStats(stats) {
    const box = $('#stats');
    const list = Object.values(stats || {});
    $('#statCount').textContent = list.length;
    if (!list.length) {
      box.innerHTML = `<div class="empty"><div class="empty-ring"></div><p>No feeds online.</p><small>Data appears here when functions are connected.</small></div>`;
      return;
    }
    box.innerHTML = '';
    list.sort((a, b) => (a.group || '').localeCompare(b.group || '')).forEach(s => {
      const el = document.createElement('div');
      el.className = 'stat' + (prevVals[s.id] !== undefined && prevVals[s.id] !== s.value ? ' flash' : '');
      prevVals[s.id] = s.value;
      const dir = s.delta ? (s.delta.trim().startsWith('-') ? 'down' : 'up') : '';
      el.innerHTML = `<div class="g"></div><div class="l"></div><div class="v"><span class="vv"></span>${s.delta ? `<span class="d ${dir}"></span>` : ''}</div>`;
      el.querySelector('.g').textContent = s.group || '';
      el.querySelector('.l').textContent = s.label;
      el.querySelector('.vv').textContent = s.value;
      if (s.delta) el.querySelector('.d').textContent = s.delta;
      if (s.trend?.length > 1) el.appendChild(spark(s.trend));
      el.title = (s.source ? 'Source: ' + s.source + '\n' : '') + 'Updated ' + new Date(s.updatedAt).toLocaleString();
      box.appendChild(el);
    });
  }
  function spark(pts) {
    const w = 120, h = 26, mn = Math.min(...pts), mx = Math.max(...pts), r = mx - mn || 1;
    const d = pts.map((p, i) => `${(i / (pts.length - 1)) * w},${h - 2 - ((p - mn) / r) * (h - 4)}`).join(' ');
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${w} ${h}`); svg.setAttribute('preserveAspectRatio', 'none');
    svg.innerHTML = `<polyline points="0,${h} ${d} ${w},${h}" fill="rgba(63,224,255,.12)" stroke="none"/><polyline points="${d}" fill="none" stroke="#3fe0ff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    return svg;
  }
  function renderPanels(panels) {
    const box = $('#panels'); box.innerHTML = '';
    Object.values(panels || {}).forEach(p => {
      const el = document.createElement('div'); el.className = 'panel';
      el.innerHTML = `<h3><span></span><button title="Close">✕</button></h3><div class="pb"></div>`;
      el.querySelector('h3 span').textContent = p.title.toUpperCase();
      el.querySelector('.pb').innerHTML = mdLite(p.body);
      el.querySelector('button').onclick = () => el.remove();
      box.appendChild(el);
    });
  }
  function mdLite(s) {
    const esc = t => t.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
    let html = '', inList = false;
    for (const line of s.split('\n')) {
      const b = line.match(/^\s*[-*•]\s+(.*)/);
      if (b) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${bold(esc(b[1]))}</li>`; continue; }
      if (inList) { html += '</ul>'; inList = false; }
      html += line.trim() ? `<p>${bold(esc(line))}</p>` : '<br>';
    }
    return html + (inList ? '</ul>' : '');
  }
  const bold = t => t.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  function renderConns(list) {
    const ul = $('#connections'); ul.innerHTML = '';
    list.forEach(c => {
      const li = document.createElement('li');
      const cls = c.status === 'connected' ? 'ok' : c.status === 'pending' ? 'pend' : 'bad';
      li.innerHTML = `<b class="dot ${cls}"></b><span></span><em>${c.status === 'connected' ? 'online' : c.status}</em>`;
      li.querySelector('span').textContent = c.name;
      ul.appendChild(li);
    });
  }

  // ======================= audio =======================
  function ensureAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    ttsAnalyser = audioCtx.createAnalyser(); ttsAnalyser.fftSize = 256; ttsAnalyser.smoothingTimeConstant = .75;
    ttsAnalyser.connect(audioCtx.destination);
  }
  function chime(up = true) {
    if (!audioCtx) return;
    const t = audioCtx.currentTime, o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(up ? 660 : 880, t); o.frequency.exponentialRampToValueAtTime(up ? 1320 : 440, t + .14);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.18, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .22);
    o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + .25);
  }
  const MOBILE = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  async function startMicMeter() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      if (MOBILE) {
        // Phones only let ONE thing use the mic. Keep it free for speech recognition.
        stream.getTracks().forEach(t => t.stop());
        chip('#chipMic', 'ok', 'MIC');
        return true;
      }
      const src = audioCtx.createMediaStreamSource(stream);
      micAnalyser = audioCtx.createAnalyser(); micAnalyser.fftSize = 256; micAnalyser.smoothingTimeConstant = .8;
      src.connect(micAnalyser);
      chip('#chipMic', 'ok', 'MIC');
      return true;
    } catch (e) { chip('#chipMic', 'bad', 'MIC DENIED'); return false; }
  }

  // ======================= speech out =======================
  function stripForSpeech(t) {
    return t.replace(/```[\s\S]*?```/g, ' ').replace(/[*_#`>]/g, '').replace(/https?:\/\/\S+/g, 'the link').replace(/\n+/g, '. ').trim();
  }
  function speak(text) {
    stopSpeaking(false);
    const clean = stripForSpeech(text || '');
    if (!clean) { setState('idle'); resumeListening(); return; }
    speaking = true; pauseListening(); setState('speaking');
    caption(clean);
    const done = () => { if (!speaking) return; speaking = false; currentAudio = null; setState('idle'); resumeListening(); };

    if (cfg.elevenlabs) {
      ensureAudio();
      const a = new Audio(); a.crossOrigin = 'anonymous';
      a.src = '/api/tts?text=' + encodeURIComponent(clean);
      currentAudio = a;
      try { audioCtx.createMediaElementSource(a).connect(ttsAnalyser); } catch {}
      a.onended = done;
      a.onerror = () => { currentAudio = null; browserSpeak(clean, done); };
      a.play().catch(() => browserSpeak(clean, done));
    } else browserSpeak(clean, done);
  }
  function browserSpeak(text, done) {
    if (!('speechSynthesis' in window)) return done();
    const u = new SpeechSynthesisUtterance(text);
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => /en-GB/i.test(v.lang) && /male|daniel|george|arthur|ryan/i.test(v.name))
      || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
    u.rate = 1.02; u.pitch = .9;
    u.onend = done; u.onerror = done;
    fakeLevel = true; u.addEventListener('end', () => fakeLevel = false);
    speechSynthesis.speak(u);
  }
  let fakeLevel = false;
  function stopSpeaking(resume = true) {
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    fakeLevel = false;
    if (speaking) { speaking = false; if (resume) { setState('idle'); resumeListening(); } }
  }

  // ======================= speech in (wake word) =======================
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec, recOn = false, recWanted = false, mode = 'passive', activeTimer;
  const WAKE_VARIANTS = () => {
    const w = cfg.wakeWord;
    return w === 'jarvis' ? ['jarvis', 'jervis', 'javis', 'jarvas', 'jarvus', 'jarves'] : [w];
  };
  const WAKE_UP = /^(wake up|wakey|daddy'?s home|i'?m home|i'?m back|good (morning|afternoon|evening)|you (up|there|awake))\b/i;

  function initRecognition() {
    if (!SR) { chip('#chipMic', 'bad', 'NO SPEECH API'); caption('Voice input needs Chrome or Edge. You can still type.', { typed: false, pre: '!!' }); return; }
    rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = params.get('lang') || 'en-US';
    rec.onstart = () => { recOn = true; };
    rec.onend = () => { recOn = false; if (recWanted) setTimeout(() => { try { rec.start(); } catch {} }, 250); };
    rec.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      const why = {
        'not-allowed': 'Microphone is blocked. Tap the lock icon in the address bar and allow the mic.',
        'service-not-allowed': 'Speech recognition is turned off in this browser. Use Chrome.',
        'audio-capture': 'Another app is using the microphone.',
        network: 'Speech service unreachable. Check your connection.'
      }[e.error] || ('Speech error: ' + e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { recWanted = false; chip('#chipMic', 'bad', 'MIC BLOCKED'); }
      else chip('#chipMic', 'warn', 'MIC ' + e.error.toUpperCase());
      addActivity(why); caption(why, { typed: false, pre: '!!' });
    };
    rec.onaudiostart = () => chip('#chipMic', 'ok', 'MIC');
    rec.onresult = onSpeech;
    recWanted = true; try { rec.start(); } catch {}
  }
  function pauseListening() { recWanted = false; try { rec?.abort(); } catch {} }
  function resumeListening() {
    if (!rec || DISPLAY_ONLY) return;
    mode = 'passive'; recWanted = true;
    if (!recOn) try { rec.start(); } catch {}
  }
  function goActive() {
    stopSpeaking(false);
    mode = 'active'; setState('listening'); chime(true);
    caption('', {});
    recWanted = true; if (!recOn) try { rec.start(); } catch {}
    clearTimeout(activeTimer);
    activeTimer = setTimeout(() => { if (mode === 'active') { mode = 'passive'; setState('idle'); chime(false); } }, 8000);
  }

  function onSpeech(e) {
    let interim = '', finals = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const r = e.results[i];
      if (r.isFinal) finals += r[0].transcript; else interim += r[0].transcript;
    }
    const heard = (finals || interim).trim();
    if (!heard) return;

    if (mode === 'active') {
      clearTimeout(activeTimer);
      caption(heard, { typed: false, pre: 'YOU' });
      if (finals.trim()) { mode = 'passive'; submit(finals.trim()); }
      else activeTimer = setTimeout(() => { if (mode === 'active') { mode = 'passive'; setState('idle'); } }, 6000);
      return;
    }

    // passive: look for the wake word
    const lower = heard.toLowerCase();
    const hit = WAKE_VARIANTS().map(w => ({ w, i: lower.search(new RegExp('\\b' + w + '\\b')) })).find(x => x.i >= 0);
    if (!hit) return;
    if (state !== 'listening') { setState('listening'); }
    const after = heard.slice(hit.i + hit.w.length).replace(/^[\s,.!?]+/, '');
    caption(after || '…', { typed: false, pre: 'YOU' });
    if (!finals.trim()) return; // wait for the full sentence
    if (!after || after.length < 2) return goActive();
    if (WAKE_UP.test(after)) { chime(true); send({ type: 'wake' }); addLog('user', heard); return; }
    submit(after);
  }

  function submit(text) {
    clearTimeout(activeTimer);
    if (!text) return;
    if (/^(stop|cancel|never ?mind|shut up|quiet)\b/i.test(text)) { stopSpeaking(); send({ type: 'interrupt' }); setState('idle'); return; }
    stopSpeaking(false);
    send({ type: 'ask', text });
    setState('thinking');
  }

  // ======================= controls =======================
  $('#cmd').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#cmdInput').value.trim(); if (!v) return;
    $('#cmdInput').value = '';
    if (!booted) boot();
    submit(v);
  });
  $('#micBtn').onclick = () => { if (!booted) return boot(); state === 'listening' ? (mode = 'passive', setState('idle')) : goActive(); };
  $('#reactor').onclick = () => { if (!booted) return boot(); if (speaking) stopSpeaking(); else goActive(); };
  $('#newSess').onclick = () => { send({ type: 'new_session' }); $('#log').innerHTML = ''; };
  document.addEventListener('keydown', e => {
    if (e.code !== 'Space' || document.activeElement === $('#cmdInput')) return;
    e.preventDefault();
    if (!booted) return boot();
    if (speaking) stopSpeaking(); else if (state !== 'listening') goActive();
  });

  // ======================= boot =======================
  let booted = false;
  async function boot() {
    if (booted) return; booted = true;
    $('#boot').classList.add('hide');
    ensureAudio(); audioCtx.resume();
    await startMicMeter();
    initRecognition();
    chime(true);
    // "wake up" on start → greeting from the server-side briefing
    setTimeout(() => send({ type: 'wake' }), 600);
  }
  $('#bootBtn').onclick = boot;

  // ======================= reactor =======================
  const rc = $('#reactor'), rx = rc.getContext('2d');
  const bg = $('#bg'), bx = bg.getContext('2d');
  let W, H, BW, BH, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    const r = rc.getBoundingClientRect();
    W = rc.width = r.width * dpr; H = rc.height = r.height * dpr;
    BW = bg.width = innerWidth * dpr; BH = bg.height = innerHeight * dpr;
  }
  addEventListener('resize', resize);

  const COL = {
    idle: [63, 224, 255], listening: [220, 250, 255], thinking: [255, 181, 71],
    speaking: [120, 240, 255], offline: [255, 77, 94]
  };
  let col = [...COL.idle];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00012, vy: (Math.random() - .5) * .00012, r: Math.random() * 1.6 + .3 }));

  let t0 = performance.now();
  function frame(now) {
    const t = (now - t0) / 1000;

    // audio level
    let an = speaking && currentAudio ? ttsAnalyser : (state === 'listening' ? micAnalyser : null);
    if (an) {
      an.getByteFrequencyData(freq);
      let s = 0; for (let i = 2; i < 60; i++) s += freq[i];
      targetLevel = Math.min(1, s / (58 * 150));
    } else if (fakeLevel) {
      targetLevel = .35 + Math.abs(Math.sin(t * 9)) * .35 * Math.random();
      for (let i = 0; i < freq.length; i++) freq[i] = Math.random() * 200 * targetLevel;
    } else { targetLevel = state === 'thinking' ? .25 : state === 'listening' ? .3 + Math.sin(t * 5) * .1 : .06 + Math.sin(t * 1.6) * .03; freq.fill(0); }
    level += (targetLevel - level) * .18;

    // color lerp
    const tc = COL[state] || COL.idle;
    for (let i = 0; i < 3; i++) col[i] += (tc[i] - col[i]) * .06;

    drawBg(t);
    drawReactor(t);
    requestAnimationFrame(frame);
  }

  function drawBg(t) {
    bx.clearRect(0, 0, BW, BH);
    const g = bx.createRadialGradient(BW / 2, BH * .48, 0, BW / 2, BH * .48, Math.max(BW, BH) * .7);
    g.addColorStop(0, rgba(col, .10)); g.addColorStop(.5, 'rgba(4,16,28,.6)'); g.addColorStop(1, '#010409');
    bx.fillStyle = g; bx.fillRect(0, 0, BW, BH);
    // grid
    const step = 46 * dpr;
    bx.strokeStyle = 'rgba(63,224,255,.045)'; bx.lineWidth = 1;
    bx.beginPath();
    for (let x = (t * 6 * dpr) % step; x < BW; x += step) { bx.moveTo(x, 0); bx.lineTo(x, BH); }
    for (let y = (t * 6 * dpr) % step; y < BH; y += step) { bx.moveTo(0, y); bx.lineTo(BW, y); }
    bx.stroke();
    // particles + links
    for (const p of parts) {
      p.x += p.vx * (1 + level * 6); p.y += p.vy * (1 + level * 6);
      if (p.x < 0) p.x = 1; if (p.x > 1) p.x = 0; if (p.y < 0) p.y = 1; if (p.y > 1) p.y = 0;
      bx.fillStyle = rgba(col, .5); bx.beginPath(); bx.arc(p.x * BW, p.y * BH, p.r * dpr, 0, 7); bx.fill();
    }
    bx.lineWidth = .6 * dpr;
    for (let i = 0; i < parts.length; i++) for (let j = i + 1; j < parts.length; j++) {
      const a = parts[i], b = parts[j], dx = (a.x - b.x) * BW, dy = (a.y - b.y) * BH, d = Math.hypot(dx, dy);
      if (d < 130 * dpr) { bx.strokeStyle = rgba(col, .12 * (1 - d / (130 * dpr))); bx.beginPath(); bx.moveTo(a.x * BW, a.y * BH); bx.lineTo(b.x * BW, b.y * BH); bx.stroke(); }
    }
  }

  function ring(r, w, a, start = 0, end = Math.PI * 2, dash) {
    rx.beginPath(); rx.lineWidth = w; rx.strokeStyle = rgba(col, a);
    if (dash) rx.setLineDash(dash); rx.arc(0, 0, r, start, end); rx.stroke(); rx.setLineDash([]);
  }

  function drawReactor(t) {
    rx.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * .42;
    const spin = state === 'thinking' ? 3.2 : state === 'speaking' ? 1.4 : 1;
    rx.save(); rx.translate(W / 2, H / 2);
    rx.shadowColor = rgba(col, .9); rx.shadowBlur = 14 * dpr;

    // outer tick ring
    rx.save(); rx.rotate(t * .05 * spin);
    for (let i = 0; i < 180; i++) {
      const a = (i / 180) * Math.PI * 2, long = i % 15 === 0, mid = i % 5 === 0;
      const r1 = R * (long ? .93 : mid ? .955 : .97), r2 = R;
      rx.strokeStyle = rgba(col, long ? .9 : mid ? .55 : .25); rx.lineWidth = (long ? 2 : 1) * dpr;
      rx.beginPath(); rx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); rx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); rx.stroke();
    }
    rx.restore();

    // segmented arcs (counter-rotating)
    rx.save(); rx.rotate(-t * .22 * spin);
    for (let k = 0; k < 3; k++) { const s = k * (Math.PI * 2 / 3); ring(R * .86, 3 * dpr, .8, s, s + Math.PI * .45); }
    rx.restore();
    rx.save(); rx.rotate(t * .35 * spin);
    for (let k = 0; k < 6; k++) { const s = k * (Math.PI / 3); ring(R * .80, 1.5 * dpr, .5, s, s + Math.PI * .22); }
    rx.restore();
    ring(R * .75, 1 * dpr, .35, 0, Math.PI * 2, [2 * dpr, 6 * dpr]);

    // audio-reactive bars
    const bars = 96, base = R * .56;
    rx.save(); rx.rotate(-Math.PI / 2 + t * .1);
    for (let i = 0; i < bars; i++) {
      const idx = Math.floor(((i < bars / 2 ? i : bars - i) / (bars / 2)) * 70) + 2;
      const f = freq[idx] / 255;
      const len = R * (.02 + f * .17 + level * .05 + (state === 'thinking' ? (Math.sin(t * 8 + i * .5) * .5 + .5) * .06 : 0));
      const a = (i / bars) * Math.PI * 2;
      rx.strokeStyle = rgba(col, .35 + f * .6); rx.lineWidth = 2.2 * dpr;
      rx.beginPath(); rx.moveTo(Math.cos(a) * base, Math.sin(a) * base); rx.lineTo(Math.cos(a) * (base + len), Math.sin(a) * (base + len)); rx.stroke();
    }
    rx.restore();

    // thinking: orbiting satellites
    if (state === 'thinking') {
      for (let k = 0; k < 3; k++) {
        const a = t * (2.4 + k * .7) + k * 2.1, r = R * (.66 + k * .06);
        rx.fillStyle = rgba(col, 1); rx.beginPath(); rx.arc(Math.cos(a) * r, Math.sin(a) * r, 3.5 * dpr, 0, 7); rx.fill();
        rx.strokeStyle = rgba(col, .25); rx.lineWidth = 1.5 * dpr; rx.beginPath(); rx.arc(0, 0, r, a - .9, a); rx.stroke();
      }
    }

    // arc-reactor segments
    const segs = 10, r1 = R * .30, r2 = R * .46;
    rx.save(); rx.rotate(t * .08 * spin);
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * Math.PI * 2 + .05, a1 = ((i + 1) / segs) * Math.PI * 2 - .05;
      rx.beginPath();
      rx.arc(0, 0, r2, a0, a1); rx.arc(0, 0, r1, a1 - .03, a0 + .03, true); rx.closePath();
      rx.fillStyle = rgba(col, .10 + level * .35); rx.fill();
      rx.strokeStyle = rgba(col, .75); rx.lineWidth = 1.2 * dpr; rx.stroke();
    }
    rx.restore();
    ring(R * .28, 2 * dpr, .9);
    ring(R * .48, 1.2 * dpr, .6);

    // core glow
    const cr = R * (.18 + level * .1);
    const g = rx.createRadialGradient(0, 0, 0, 0, 0, cr * 2.2);
    g.addColorStop(0, 'rgba(255,255,255,.95)');
    g.addColorStop(.25, rgba(col, .9));
    g.addColorStop(.6, rgba(col, .25));
    g.addColorStop(1, rgba(col, 0));
    rx.shadowBlur = 0;
    rx.fillStyle = g; rx.beginPath(); rx.arc(0, 0, cr * 2.2, 0, 7); rx.fill();
    // inner triangle (MK-VI nod)
    rx.save(); rx.rotate(-t * .3 * spin);
    rx.strokeStyle = rgba([255, 255, 255], .55 + level * .4); rx.lineWidth = 1.5 * dpr;
    rx.beginPath();
    for (let k = 0; k < 3; k++) { const a = k * (Math.PI * 2 / 3) - Math.PI / 2; const r = R * .2; k ? rx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : rx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    rx.closePath(); rx.stroke();
    rx.restore();

    // readouts
    rx.shadowBlur = 0;
    rx.fillStyle = rgba(col, .75); rx.font = `${10 * dpr}px "JetBrains Mono"`; rx.textAlign = 'center';
    rx.fillText(`PWR ${(97 + level * 3).toFixed(1)}%`, 0, -R * 1.05);
    rx.textAlign = 'left'; rx.fillText(`θ ${((t * 20 * spin) % 360).toFixed(0).padStart(3, '0')}°`, R * .92, -R * .72);
    rx.textAlign = 'right'; rx.fillText(`SIG ${(level * 100).toFixed(0).padStart(3, '0')}`, -R * .92, R * .74);

    rx.restore();
  }

  // ======================= start =======================
  (async () => {
    try { cfg = await (await fetch('/api/config')).json(); } catch {}
    $('#brandName').textContent = cfg.name.split('').join('.').toUpperCase() + '.';
    $('#wakeHint').textContent = cap(cfg.wakeWord);
    chip('#chipVoice', cfg.elevenlabs ? 'ok' : 'warn', cfg.elevenlabs ? 'ELEVENLABS' : 'BASIC VOICE');
    if (DISPLAY_ONLY) { $('#boot').classList.add('hide'); booted = true; $('.bottom .cmd').style.display = 'none'; chip('#chipMic', '', 'DISPLAY'); }
    setState('idle', { echo: false });
    resize(); connect(); requestAnimationFrame(frame);
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  })();
})();
