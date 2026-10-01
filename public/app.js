/* J.A.R.V.I.S. HUD client
 * - Wake word + push-to-talk via the browser's speech recognition (Chrome / Edge)
 * - Speaks with ElevenLabs through the server, falls back to the browser voice
 * - Reactor visual reacts to state + live audio level
 * URL flags:  ?display=1  → display-only screen (no mic, no voice, no boot) for Pi kiosks / extra monitors
 */
(() => {
  // Inside the Android app: use the phone's own speech engine (WebView has none). Installed here so it is
  // in place before the page looks for SpeechRecognition, whatever the app did or did not inject.
  if (window.AndroidSTT && !window.__sttShim) {
    window.__sttShim = true;
    let cur = null;
    function SR() { this.continuous = false; this.interimResults = false; this.lang = 'en-US'; this.maxAlternatives = 1; this._on = false; }
    SR.prototype.start = function () {
      // A session that never reported back must not block the mic forever.
      if (this._on && Date.now() - this._t < 12000) throw new Error('InvalidStateError');
      if (this._on) { try { window.AndroidSTT.abort(); } catch {} }
      cur = this; this._on = true; this._t = Date.now(); window.AndroidSTT.start(this.lang || 'en-US');
    };
    SR.prototype.stop = function () { window.AndroidSTT.stop(); };
    SR.prototype.abort = function () { window.AndroidSTT.abort(); };
    window.__stt = {
      ev: function (t, d) {
        if (t === 'diag') { window.__sttDiag && window.__sttDiag(d); return; }
        const r = cur; if (!r) return;
        r._t = Date.now();
        if (t === 'start') r.onstart && r.onstart({});
        else if (t === 'result') {
          const res = [{ transcript: d.text, confidence: 0.9 }]; res.isFinal = !!d.final; res.item = function (i) { return this[i]; };
          const list = [res]; list.item = function (i) { return this[i]; };
          r.onresult && r.onresult({ resultIndex: 0, results: list });
        }
        else if (t === 'error') r.onerror && r.onerror({ error: d });
        else if (t === 'end') { r._on = false; r.onend && r.onend({}); }
      }
    };
    window.SpeechRecognition = SR; window.webkitSpeechRecognition = SR;
  }
})();
(() => {
  const $ = s => document.querySelector(s);
  const params = new URLSearchParams(location.search);
  const DISPLAY_ONLY = params.get('display') === '1';
  window.__sttDiag = t => { try { addActivity('Phone mic: ' + t); } catch {} };

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
      `Say "${window.AndroidWake ? 'Hey ' + cap(cfg.wakeWord) : cap(cfg.wakeWord)}" or press SPACE`;
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
  let lostMidRequest = false; // a redeploy killed the socket while a request was in flight: its answer will never come
  function connect() {
    ws = new WebSocket((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws');
    ws.onopen = () => { if (window.AndroidDevice) ws.send(JSON.stringify({ type: 'hello', device: true })); try { const b = JSON.parse(localStorage.getItem('jarvis.backup') || 'null'); if (b) ws.send(JSON.stringify({ type: 'restore', data: b })); } catch {} chip('#chipLink', 'ok', 'LINK'); try { window.__micKick && window.__micKick(); } catch {} if (state === 'offline') setState('idle', { echo: false }); if (lostMidRequest) { lostMidRequest = false; stopFillers(); addLog('system', 'Connection dropped while I was working on that (server restarting). Please say it again.'); } };
    ws.onclose = () => { if (state === 'thinking') lostMidRequest = true; chip('#chipLink', 'bad', 'LINK'); setState('offline', { echo: false }); setTimeout(connect, 2000); };
    ws.onmessage = e => handle(JSON.parse(e.data));
  }
  function send(o) { if (ws?.readyState === 1) ws.send(JSON.stringify(o)); }
  // Report screen errors to the server so Jarvis can read and fix them
  const reportErr = t => { try { send({ type: 'client_error', text: `${t} | ${navigator.userAgent.slice(0, 80)}` }); } catch {} };
  window.addEventListener('error', e => reportErr(`${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', e => reportErr('promise: ' + (e.reason?.stack || e.reason)));
  function chip(sel, cls, txt) { const c = $(sel); c.className = 'chip ' + cls; if (txt) c.querySelector('span').textContent = txt; }

  function handle(m) {
    switch (m.type) {
      case 'state':
        if (m.state === 'thinking') { setState('thinking', { echo: false }); ticker('Processing…'); }
        else if (DISPLAY_ONLY) setState(m.state, { echo: false });
        break;
      case 'log': addLog(m.role === 'user' ? 'user' : 'system', m.text); break;
      case 'activity': addActivity(m.text); ticker(m.text); break;
      case 'device':
        if (m.action === 'obd_scan' || m.action === 'obd_clear') { // vehicle OBD dongle: answered by the app's ObdBridge
          if (!window.AndroidObd) { send({ type: 'device_result', id: m.id, ok: false, detail: 'This app build cannot read OBD dongles yet. Install the newest Jarvis app.' }); break; }
          try { window.AndroidObd[m.action === 'obd_clear' ? 'clearCodes' : 'scan'](m.id, String(m.dongle || '')); } catch (e) { send({ type: 'device_result', id: m.id, ok: false, detail: String(e) }); }
          break;
        }
        if (window.AndroidDevice) { try { window.AndroidDevice.run(JSON.stringify(m)); } catch (e) { send({ type: 'device_result', id: m.id, ok: false, detail: String(e) }); } }
        break;
      case 'backup': try { localStorage.setItem('jarvis.backup', JSON.stringify(m.data)); } catch {} break;
      case 'say':
        if (m.memo) saveMemo(m.memo);
        ticker('');
        if (m.text) addLog('jarvis', m.text);
        if (m.speak && !DISPLAY_ONLY && booted) afterFiller(() => speak(m.text));
        else { stopFillers(); caption(m.text); setState('idle', { echo: false }); if (!DISPLAY_ONLY && booted) afterReply(m.text); }
        break;
      case 'stats': renderStats(m.stats); break;
      case 'panels': renderPanels(m.panels); break;
      case 'connections': renderConns(m.connections); break;
      case 'meta': break;
      case 'spend': {
        const f = n => '$' + (n < 0.01 ? Number(n).toFixed(4) : Number(n).toFixed(2));
        addActivity(`Cost ${f(m.turn)} · today ${f(m.today)} of $${m.limit}`);
        const c = document.querySelector('#chipCost'); if (c) { c.className = 'chip ' + (m.today > m.limit * 0.8 ? 'warn' : 'ok'); c.querySelector('span').textContent = 'TODAY ' + f(m.today); }
        break;
      }
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
  // App dings are off by default (they piled up as the mic cycled). Add ?chime=1 to the address to bring them back.
  const CHIMES = params.get('chime') === '1';
  function chime(up = true) {
    if (!CHIMES || !audioCtx) return;
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

  // In the Android app Jarvis's voice is played natively (no audio focus, so Spotify keeps playing; and on the phone's own
  // speaker while a Bluetooth speaker is playing music). PhoneClip looks enough like an Audio element for the code below.
  const PHONE_AUDIO = !!window.AndroidPhoneAudio;
  let clipSeq = 0; const clips = {};
  window.__obd = (id, json) => { let r = {}; try { r = JSON.parse(json); } catch {} send({ type: 'device_result', id, ok: !!r.ok, detail: json }); };
  window.__phoneClip = (id, ev) => {
    ev = String(ev || '');
    if (ev.startsWith('info:')) { addActivity('Voice: ' + ev.slice(5)); return; }
    const c = clips[id]; if (!c) return;
    if (ev.startsWith('error')) { addActivity('Voice: phone player failed (' + (ev.slice(6) || 'unknown') + '), using the app player'); return c._webFallback(); }
    c._fire('onended');
  };
  class PhoneClip {
    constructor(src) { this.src = src; this.id = 'c' + (++clipSeq) + Date.now().toString(36); this.phone = true; this.stopped = false; clips[this.id] = this; }
    _fire(n) { delete clips[this.id]; if (this.stopped) return; try { this[n] && this[n](); } catch {} }
    // The page player plays out loud for sure (it may pause Spotify for a moment, which beats silence).
    _webFallback() {
      if (this.stopped || this.fellBack) return this._fire('onerror');
      let bt = false; try { bt = window.AndroidPhoneAudio.btActive(); } catch {}
      if (bt) { addActivity('Voice: skipped this clip rather than play it on the Bluetooth speaker'); return this._fire('onerror'); }
      this.fellBack = true;
      const a = new Audio(this.src); this.web = a;
      a.onended = () => this._fire('onended'); a.onerror = () => this._fire('onerror');
      a.play().catch(() => this._fire('onerror'));
    }
    async play() {
      // Newer app builds stream the voice straight from the server: playback starts as the first audio arrives.
      // (blob: and data: clips can't be streamed by URL; they take the older hand-over path below)
      if (window.AndroidPhoneAudio.playUrl && !/^(blob|data):/.test(this.src)) { window.AndroidPhoneAudio.playUrl(this.id, new URL(this.src, location.href).href); return; }
      try {
        const r = await fetch(this.src);
        if (r.status !== 200) throw new Error('no audio');
        const b = await r.blob();
        if (this.stopped) return;
        if (b.size < 500) throw new Error('empty audio');
        const b64 = await new Promise(res => { const f = new FileReader(); f.onloadend = () => res(String(f.result).split(',')[1] || ''); f.readAsDataURL(b); });
        if (this.stopped) return;
        window.AndroidPhoneAudio.play(this.id, b64);
      } catch (e) { this._fire('onerror'); throw e; }
    }
    pause() {
      if (this.stopped) return;
      this.stopped = true; delete clips[this.id];
      try { window.AndroidPhoneAudio.stop(this.id); } catch {}
      try { this.web && this.web.pause(); } catch {}
      if (this.onpause) { try { this.onpause(); } catch {} }
    }
  }
  const newClip = src => PHONE_AUDIO ? new PhoneClip(src) : new Audio(src);

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
    const done = () => { if (!speaking) return; speaking = false; currentAudio = null; fakeLevel = false; setState('idle'); afterReply(clean); };

    if (cfg.elevenlabs) {
      ensureAudio();
      const a = newClip(); a.crossOrigin = 'anonymous';
      a.src = '/api/tts?text=' + encodeURIComponent(clean);
      currentAudio = a;
      if (a.phone) fakeLevel = true; else { try { audioCtx.createMediaElementSource(a).connect(ttsAnalyser); } catch {} }
      a.onended = done;
      let fell = false;
      const fallback = why => { if (fell) return; fell = true; if (currentAudio === a) currentAudio = null; if (why === 'error') voiceProblem(); browserSpeak(clean, done); };
      a.onerror = () => fallback('error');
      a.play().catch(e => fallback(e?.name === 'NotAllowedError' ? 'blocked' : 'error'));
    } else browserSpeak(clean, done);
  }
  function browserSpeak(text, done) {
    if (!('speechSynthesis' in window)) return done();
    const u = new SpeechSynthesisUtterance(text);
    const vs = speechSynthesis.getVoices();
    u.voice = vs.find(v => /en-GB/i.test(v.lang) && /male|daniel|george|arthur|ryan/i.test(v.name))
      || vs.find(v => /en-GB/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)) || null;
    u.rate = 1.02; u.pitch = .9;
    // Chrome often drops 'end' (garbage-collected utterance, or a silent stop), which left the mic off.
    // Keep a reference and poll speechSynthesis as a backup so done() always runs.
    // Only treat speech as finished after it has really started (phones take ~1s to begin),
    // otherwise the mic would open while Jarvis is still talking and cut him off.
    let finished = false, started = false;
    const finish = () => { if (finished) return; finished = true; clearInterval(poll); clearTimeout(cap); fakeLevel = false; if (curUtt === u) curUtt = null; done(); };
    u.onstart = () => { started = true; };
    u.onend = finish; u.onerror = finish;
    curUtt = u; fakeLevel = true;
    speechSynthesis.speak(u);
    const poll = setInterval(() => {
      if (speechSynthesis.speaking) started = true;
      else if (started && !speechSynthesis.pending) finish();
    }, 400);
    const cap = setTimeout(finish, Math.max(5000, text.length * 110));
  }
  let fakeLevel = false, curUtt = null, voiceWarned = false;
  async function voiceProblem() {
    try {
      const v = await (await fetch('/api/voice-status')).json();
      chip('#chipVoice', 'warn', 'BACKUP VOICE');
      if (v.reason && !voiceWarned) { voiceWarned = true; addLog('system', 'Using the phone voice because: ' + v.reason); addActivity('Voice: ' + v.reason); }
    } catch {}
  }
  function stopSpeaking(resume = true) {
    if (currentAudio) { currentAudio.pause(); currentAudio.src = ''; currentAudio = null; }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    fakeLevel = false;
    if (speaking) { speaking = false; if (resume) { setState('idle'); resumeListening(); } }
  }

  // The Android app reports back how a phone action went (connect speaker, open Spotify).
  window.__deviceResult = (id, ok, detail) => send({ type: 'device_result', id, ok, detail });

  // What the greeting needs to remember lives on the phone (the server's disk is wiped on every deploy).
  function readMemo() { try { return JSON.parse(localStorage.getItem('jarvis.memo') || 'null') || {}; } catch { return {}; } }
  function saveMemo(m) { try { localStorage.setItem('jarvis.memo', JSON.stringify(m)); } catch {} }

  // ======================= filler lines (ack + "still working") =======================
  // Short Jarvis clips: one plays the instant a command is sent, more play if the job runs long.
  const filler = { wake: {}, ack: {}, progress: {}, still: {}, cur: null, curAt: 0, timer: null, lastIdx: {} };
  async function loadFillers() {
    try {
      const list = await (await fetch('/api/fillers')).json();
      const jobs = [];
      for (const kind of Object.keys(list)) for (const g of Object.keys(list[kind])) for (const u of list[kind][g]) jobs.push({ kind, g, u });
      // generic lines first, then the topic ones, a few at a time so the server isn't flooded
      jobs.sort((x, y) => (x.g === 'generic' ? 0 : 1) - (y.g === 'generic' ? 0 : 1));
      let i = 0;
      const worker = async () => {
        while (i < jobs.length) {
          const { kind, g, u } = jobs[i++];
          try { const r = await fetch(u); if (r.ok && r.status === 200) { const b = await r.blob(); if (b.size > 500) ((filler[kind][g] ||= []).push(PHONE_AUDIO ? u : URL.createObjectURL(b))); } } catch {}
        }
      };
      await Promise.all([worker(), worker(), worker()]);
    } catch {}
  }
  // What kind of command is this? Chat and remarks get NO filler; requests get lines that fit the topic.
  const REQUEST = /(\?\s*$|^(what|whats|what's|how|when|where|who|why|which|can|could|will|would|do|does|is|are|tell|give|show|find|check|look|search|read|list|add|create|schedule|set|change|update|move|reschedule|cancel|remind|send|call|open|get|pull|calculate|convert|translate|remember|brief|learn|save|remove|delete|put|make|start|play)\b|\b(can you|could you|would you|i need|i want|tell me|let me know|go ahead and)\b)/i;
  const TOPICS = [
    ['music', /\b(music|tunes|songs?|spotify|playlist|speaker|bluetooth|volume|pause|resume|skip|play)\b/i],
    ['action', /\b(add|create|change|move|reschedule|cancel|remind|save|remove|delete|update|book)\b/i],
    ['calendar', /\b(calendar|appointments?|schedule|jobs?|booked|meetings?|agenda|colou?rs?)\b|what'?s on\b/i],
    ['weather', /\b(weather|forecast|rain|raining|snow|temperature|jacket|umbrella|humid|windy)\b/i],
    ['crypto', /\b(crypto|bitcoin|btc|eth|ethereum|coins?|market|markets|solana)\b/i],
    ['lookup', /\b(search|look up|find out|who is|how much|cost|price|news|score|hours|near me|parts?|fit)\b/i]
  ];
  const CHAT = /^(thanks|thank you|thx|good|great|nice|cool|ok|okay|perfect|awesome|excellent|i appreciate|appreciate|that (was|is|works|worked)|you('?re| are) (right|welcome)|never ?mind|sounds good|got it|yes|no|yeah|yep|nope|hello|hi|hey|alright|all right|understood|fair enough|makes sense|wow|lol|haha)\b/i;
  function fillerTopic(text) {
    const t = String(text || '').trim();
    const words = t.split(/\s+/).filter(Boolean).length;
    const request = REQUEST.test(t);
    for (const [g, re] of TOPICS) if (re.test(t) && (request || words > 3)) return g;
    return null;   // no topic match: stay quiet. A canned line that does not fit what he said feels wrong; the real answer is the acknowledgement.
  }
  function pickFiller(kind, group) {
    const l = (filler[kind][group] && filler[kind][group].length ? filler[kind][group] : filler[kind].generic) || [];
    if (!l.length) return null;
    const key = kind + group;
    let i = Math.floor(Math.random() * l.length);
    if (l.length > 1 && i === filler.lastIdx[key]) i = (i + 1) % l.length;
    filler.lastIdx[key] = i; return l[i];
  }
  function playFiller(kind, group) {
    if (DISPLAY_ONLY || !booted || speaking) return;
    if (filler.cur) { if (Date.now() - filler.curAt < 6000) return; filler.cur = null; }   // a clip the phone paused must never block the next one
    const url = pickFiller(kind, group); if (!url) return;
    const a = newClip(url); filler.cur = a; filler.curAt = Date.now();
    const end = () => { if (filler.cur === a) filler.cur = null; };
    a.onended = end; a.onerror = end; a.onpause = end;
    setTimeout(end, 7000);
    a.play().catch(end);
  }
  // Spoken acknowledgement that repeats what he asked. Falls back to a topic line if it is slow or unavailable.
  let ackSeq = 0;
  async function playAck(text, group) {
    const my = ++ackSeq;
    const fallback = () => { if (my === ackSeq && state === 'thinking' && group) playFiller('ack', group); };
    try {
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 3500);
      const r = await fetch('/api/ack', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text }), signal: ctl.signal });
      clearTimeout(to);
      if (r.status !== 200) return fallback();
      const blob = await r.blob(); if (blob.size < 500) return fallback();
      if (my !== ackSeq || state !== 'thinking' || speaking || filler.cur) return;   // the real answer beat it
      const ackId = r.headers.get('X-Ack-Id');
      const a = newClip(PHONE_AUDIO && ackId ? '/api/ack-clip/' + ackId + '.mp3' : URL.createObjectURL(blob)); filler.cur = a; filler.curAt = Date.now();
      const end = () => { if (filler.cur === a) filler.cur = null; };
      a.onended = end; a.onerror = end; a.onpause = end; setTimeout(end, 9000);
      a.play().catch(end);
    } catch { fallback(); }
  }
  function stopFillers() {
    ackSeq++;
    clearTimeout(filler.timer); filler.timer = null;
  }
  function startFillers(text) {
    stopFillers();
    const g = fillerTopic(text);
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    const wantAck = !DISPLAY_ONLY && booted && (g || (REQUEST.test(text) || (words > 3 && !CHAT.test(text))));
    addActivity('Ack: ' + (wantAck ? 'echoing your request' : 'none (chit-chat)'));
    if (wantAck) playAck(text, g);
    if (!g) return;                                   // no topic: no progress lines either
    // ~4s after the ack: a progress line that fits the topic
    const prog = (tries = 0) => {
      filler.timer = setTimeout(() => {
        if (state !== 'thinking') return;
        if (filler.cur && tries < 6) return prog(tries + 1);
        playFiller('progress', g); later();
      }, tries ? 500 : 4000);
    };
    // only for long jobs: a generic "still working" line after ~30s, then every 25s
    const later = () => {
      filler.timer = setTimeout(function again() {
        if (state !== 'thinking') return;
        playFiller('still', 'generic');
        filler.timer = setTimeout(again, 25000);
      }, 26000);
    };
    prog();
  }
  // Called before the real reply: let a filler that is mid-sentence finish (max 3s) so nothing is cut off.
  function afterFiller(fn) {
    stopFillers();
    const a = filler.cur; if (!a) return fn();
    let done = false; const go = () => { if (done) return; done = true; fn(); };
    const prev = a.onended; a.onended = () => { prev && prev(); go(); }; a.onerror = a.onended;
    setTimeout(() => { if (!done) { try { a.pause(); } catch {} } go(); }, 5000);   // never talk over the acknowledgement
  }

  // ======================= speech in (wake word) =======================
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let rec, recOn = false, recWanted = false, mode = 'passive', activeTimer, recErrs = [], lastRecErr = '', lastRecErrAt = 0, recBackoff = 0, recThrottled = false, micNotBefore = 0, lastMicStart = 0;
  // Every mic start goes through here so a cooldown is honoured no matter who asks (the phone's recognizer refuses
  // requests that come too fast, and hammering it makes it refuse for longer).
  // While music is playing the speech recognizer keeps pausing it (Android hands the recognizer audio focus), so the always-on
  // listening stands down and the mic button becomes push-to-talk. Questions from Jarvis still open the mic. Add ?musicmic=on to keep listening anyway.
  const MUSIC_QUIET = params.get('musicmic') !== 'on';
  let manualMicUntil = 0, musicHeld = false;
  const musicPlaying = () => { try { return MUSIC_QUIET && !!window.AndroidPhoneAudio && window.AndroidPhoneAudio.musicActive(); } catch { return false; } };
  // The on-device wake word does the passive listening (no mic ding every second); the recognizer only opens after "Hey Jarvis" or the mic button. ?wake=speech goes back to recognizer-only listening.
  const WAKE_FIRST = !!window.AndroidWake && params.get('wake') !== 'speech';
  function startMic() {
    const now = Date.now();
    if (!rec || now < micNotBefore || now - lastMicStart < 600) return;
    // Two recorders on the mic at once leave the recognizer deaf: the wake word engine must be off while the recognizer listens.
    if (WAKE_FIRST && wakeEver && !wakeErrShown && mode === 'passive' && now > manualMicUntil) return;
    // The wake engine releases the mic on its own thread, a moment after stop(): wait for its 'stopped' report, or the recognizer opens against a still-held mic and hears nothing.
    if (window.AndroidWake && (wakeOn || wakeHalting)) {
      if (wakeOn) { try { window.AndroidWake.stop(); } catch {} wakeOn = false; wakeHalting = true; clearTimeout(wakeHaltTimer); wakeHaltTimer = setTimeout(() => { wakeHalting = false; startMic(); }, 2500); }
      return;
    }
    if (now > manualMicUntil && musicPlaying()) {
      if (!musicHeld) { musicHeld = true; chip('#chipMic', 'warn', 'MIC: TAP TO TALK'); addActivity('Music is playing: listening is off so it does not cut out. Tap the mic button to talk.'); }
      return;
    }
    if (musicHeld) { musicHeld = false; chip('#chipMic', 'ok', 'MIC'); }
    lastMicStart = now; try { rec.start(); } catch {}
  }
  // While music plays the recognizer stays off (it pauses Spotify). An on-device wake word (Porcupine, no audio focus) listens instead.
  let wakeOn = false, wakeErrShown = false, wakeEver = false;
  let wakeHalting = false, wakeHaltTimer = 0;
  window.__wake = (type, data) => {
    if (type === 'started') {
      // Late start (models take a moment to load): if the recognizer is being used right now, the wake engine must not hold the mic.
      if (recOn || mode === 'active' || Date.now() < manualMicUntil) { try { window.AndroidWake.stop(); } catch {} wakeOn = false; return; }
      wakeOn = true; wakeEver = true; if (WAKE_FIRST) { try { rec && rec.abort(); } catch {} } addActivity('Wake word "Hey Jarvis" is listening (app ' + data + ').'); }
    else if (type === 'stopped') { wakeOn = false; if (wakeHalting) { wakeHalting = false; clearTimeout(wakeHaltTimer); setTimeout(() => { if (recWanted && !recOn) startMic(); }, 200); } }
    else if (type === 'error') { wakeOn = false; if (!wakeErrShown) { wakeErrShown = true; addActivity('Wake word engine: ' + data + ' (back to speech listening)'); } setTimeout(() => { if (recWanted && !recOn) startMic(); }, 500); }
    else if (type === 'near') addActivity('Wake word almost (' + data + ')');
    else if (type === 'hit') { if (speaking) return; addActivity('Heard "Jarvis" (' + data + ')'); manualMicUntil = Date.now() + 15000; answerWake(); }
  };
  function syncWake() {
    if (!window.AndroidWake || !booted) return;
    try {
      const want = (WAKE_FIRST || musicPlaying()) && mode !== 'active' && !recOn && Date.now() > manualMicUntil;
      if (want && !wakeOn && !wakeErrShown) window.AndroidWake.start(String(cfg.wakeThreshold || '0.5'));
      else if (!want && wakeOn) window.AndroidWake.stop();
    } catch {}
  }
  setInterval(syncWake, 1200);
  // Pick listening back up by itself once the music stops.
  setInterval(() => { if (rec && recWanted && !recOn && musicHeld && !musicPlaying()) startMic(); }, 4000);
  const WAKE_VARIANTS = () => {
    const w = cfg.wakeWord;
    return w === 'jarvis' ? ['jarvis', 'jervis', 'javis', 'jarvas', 'jarvus', 'jarves', 'travis', 'jarvi', 'harvis', 'jarvice', 'charvis', 'jarvie', 'jervas', 'garvis'] : [w];
  };
  const WAKE_UP = /^(wake up|wakey|daddy'?s home|i'?m home|i'?m back|good (morning|afternoon|evening)|you (up|there|awake))\b/i;

  function initRecognition() {
    if (!SR) { chip('#chipMic', 'bad', 'NO SPEECH API'); caption('Voice input needs Chrome or Edge. You can still type.', { typed: false, pre: '!!' }); return; }
    rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = params.get('lang') || 'en-US';
    rec.onstart = () => { recOn = true; };
    rec.onend = () => {
      recOn = false;
      // The browser ends a listening session by itself after a short silence. If we still want the mic,
      // do NOT send the command yet: keep the words so far and let the pause timer decide.
      if (pending && recWanted && !pending.wakeOnly) carry = lastHeard;
      else if (pending) flush();
      uttStart = 0; lastLen = 0;
      // Android's recognizer refuses restarts that come too fast (error 10). Back off, then ease back down.
      if (!recThrottled && recBackoff) recBackoff = recBackoff < 1000 ? 0 : Math.round(recBackoff / 2);
      recThrottled = false;
      const wait = recBackoff || (recErrs.length >= 3 ? 8000 : 250);   // repeated failures: pause before retrying
      // With the wake word engine healthy the recognizer is single-shot: one session per "Hey Jarvis" / mic tap / question, so it does not
      // re-open (and ding, through the Bluetooth speaker when music plays) every second. It only re-opens to finish a sentence he is mid-way through.
      const single = WAKE_FIRST && wakeEver && !wakeErrShown;
      if (single && !pending && !carry) {   // nothing heard in this session: done. If he was speaking (pending), re-open until he pauses for PAUSE_MS
        manualMicUntil = 0;
        if (mode === 'active' && !pending) { mode = 'passive'; clearTimeout(activeTimer); setState('idle'); }
      } else if (recWanted) setTimeout(() => { if (recWanted && !recOn) startMic(); }, Math.max(wait, micNotBefore - Date.now()) + 50);
    };
    rec.onerror = e => {
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (e.error === 'throttled') {
        recThrottled = true; recBackoff = Math.min(recBackoff ? recBackoff * 2 : 2000, 30000); micNotBefore = Date.now() + recBackoff;
        chip('#chipMic', 'warn', 'MIC COOLDOWN'); addActivity('Mic cooling down ' + Math.round(recBackoff / 1000) + 's'); return;
      }
      if (e.error === 'stalled') { recBackoff = Math.max(recBackoff, 800); chip('#chipMic', 'warn', 'MIC RESET'); return; }
      const why = {
        'not-allowed': 'Microphone is blocked. Tap the lock icon in the address bar and allow the mic.',
        'service-not-allowed': 'Speech recognition is turned off in this browser. Use Chrome.',
        'audio-capture': 'Another app is using the microphone.',
        network: 'Speech service unreachable. Check your connection.'
      }[e.error] || ('Speech error: ' + e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { recWanted = false; chip('#chipMic', 'bad', 'MIC BLOCKED'); }
      else chip('#chipMic', 'warn', 'MIC ' + e.error.toUpperCase());
      // Say it once, not in a loop; back off restarts when the mic keeps failing
      const now = Date.now();
      recErrs = recErrs.filter(t => now - t < 15000); recErrs.push(now);
      if (why !== lastRecErr || now - lastRecErrAt > 30000) { addActivity(why); caption(why, { typed: false, pre: '!!' }); reportErr('speech: ' + e.error); lastRecErr = why; lastRecErrAt = now; }
    };
    rec.onaudiostart = () => chip('#chipMic', 'ok', 'MIC');
    rec.onresult = e => { recBackoff = 0; onSpeech(e); };
    recWanted = true; startMic();
  }
  function pauseListening() { recWanted = false; try { rec?.abort(); } catch {} }
  function resumeListening() {
    if (!rec || DISPLAY_ONLY) return;
    mode = 'passive'; recWanted = true;
    if (!recOn) startMic();
  }
  // When Jarvis asks something, open the mic for the answer straight away (no wake word).
  // Any question counts: a "?" anywhere in his last couple of sentences, or a phrase like "shall I" / "would you like".
  // After a normal reply the mic also stays open briefly, so you can just keep talking (?follow=0 turns that off).
  const ASKING = /(\?|\b(shall i|should i|would you like|do you want|want me to|which (one|would|do)|let me know|your call|say yes|say the word|confirm)\b)/i;
  const FOLLOW_UP = params.get('follow') !== '0';
  function isQuestion(text) {
    const t = String(text || '').trim();
    return ASKING.test(t.slice(-220));
  }
  function afterReply(text) {
    if (isQuestion(text)) setTimeout(() => { if (!speaking && state !== 'thinking') { manualMicUntil = Date.now() + 20000; goActive({ ms: 20000 }); } }, 250);
    else if (FOLLOW_UP) setTimeout(() => { if (!speaking && state !== 'thinking') goActive({ ms: 6000, quiet: true }); }, 250);
    else resumeListening();
  }
  // Phones sometimes refuse to restart the mic right after audio playback; keep trying until it is really on.
  function ensureMic(tries = 8) {
    if (!rec || !recWanted || recOn) return;
    const cool = micNotBefore - Date.now();
    if (cool > 0) { setTimeout(() => ensureMic(tries), cool + 100); return; }   // cooling down: wait it out, don't burn retries
    startMic();
    if (tries > 0) setTimeout(() => ensureMic(tries - 1), 700);
  }
  // After a redeploy the server comes back: clear any mic cooldown the outage caused and make sure the mic is really on.
  window.__micKick = () => { recBackoff = 0; recThrottled = false; micNotBefore = 0; recErrs = []; ensureMic(); };
  // "Hey Jarvis" on its own: he answers "Yes, sir?" (cached clip, on the phone's own route), THEN the mic opens for the command,
  // so the recognizer never hears his reply. No clip available: the old chime.
  let wakeAnswering = false;
  function answerWake() {
    const url = !DISPLAY_ONLY && booted ? pickFiller('wake', 'generic') : null;
    if (!url || wakeAnswering) return goActive();
    wakeAnswering = true;
    try { pauseListening(); } catch {}
    setState('speaking', { echo: false });
    let done = false; const go = () => { if (done) return; done = true; wakeAnswering = false; goActive({ quiet: true }); };
    const a = newClip(url); a.onended = go; a.onerror = go; a.onpause = go;
    setTimeout(go, 2500);
    a.play().catch(go);
  }
  function goActive(o = {}) {
    stopSpeaking(false);
    mode = 'active'; setState('listening'); if (!o.quiet) chime(true);
    caption('', {});
    clearTimeout(uttTimer); pending = null; carry = ''; lastHeard = ''; uttStart = lastLen;
    recWanted = true; ensureMic();
    clearTimeout(activeTimer);
    activeTimer = setTimeout(() => { if (mode === 'active' && !pending) { mode = 'passive'; setState('idle'); if (!o.quiet) chime(false); } }, o.ms || 20000);
  }

  // ---- utterance assembly ----
  // Phones send many small "final" chunks per sentence (sometimes repeating earlier words),
  // so we stitch them together and only act once you've been quiet for SILENCE_MS.
  // How long Jarvis waits after you stop talking before he acts. Natural pauses between sentences
  // are longer than this used to allow, so it is now about 2 seconds (like the Claude app).
  // Trailing words like "and", "then", "to" mean you are mid-thought, so he waits a bit longer.
  // Change it any time with ?pause=2500 on the address (milliseconds); it is remembered on this phone.
  const PAUSE_MS = (() => {
    const v = Number(params.get('pause'));
    if (v >= 600 && v <= 8000) { try { localStorage.setItem('jarvisPause', String(v)); } catch {} return v; }
    try { const k = Number(localStorage.getItem('jarvisPause')); if (k >= 600 && k <= 8000) return k; } catch {}
    return 3300;   // he talks in long stretches: wait for a real pause before acting
  })();
  const MID_THOUGHT = /(,|\b(and|but|so|then|also|or|to|the|a|an|for|with|of|in|on|that|which|because|if|when|my|your|is|are|i|it)|\.\.\.?)\s*$/i;
  const silenceFor = text => PAUSE_MS + (MID_THOUGHT.test(text || '') ? 1300 : 0);
  let uttStart = 0, lastLen = 0, uttTimer = null, pending = null, carry = '', lastHeard = '';
  function joinResults(results, from) {
    const parts = [];
    for (let i = from; i < results.length; i++) {
      const t = (results[i][0]?.transcript || '').trim();
      if (!t) continue;
      const last = parts[parts.length - 1];
      const tl = t.toLowerCase(), ll = last?.toLowerCase();
      if (last && tl.startsWith(ll)) parts[parts.length - 1] = t;      // phone repeated + extended
      else if (last && ll.startsWith(tl)) continue;                    // phone repeated a shorter copy
      else parts.push(t);
    }
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }
  function findWake(text) {
    const lower = text.toLowerCase();
    for (const w of WAKE_VARIANTS()) {
      const m = lower.match(new RegExp('\\b' + w + '\\b'));
      if (m) return { i: m.index, len: w.length };
    }
    return null;
  }
  function flush() {
    clearTimeout(uttTimer); uttTimer = null;
    const p = pending; pending = null;
    carry = ''; lastHeard = '';
    uttStart = lastLen;
    if (!p) return;
    if (p.wakeOnly) return answerWake();
    const text = p.text.replace(/^[\s,.!?]+/, '').trim();
    if (!text || text.length < 2) return goActive();
    if (p.fromWake && WAKE_UP.test(text)) { chime(true); addLog('user', 'Jarvis, ' + text); send({ type: 'wake', memo: readMemo() }); setState('thinking'); return; }
    submit(text);
  }
  function onSpeech(e) {
    lastLen = e.results.length;
    if (uttStart > lastLen) uttStart = 0;
    const now = joinResults(e.results, uttStart);
    if (!now) return;
    // words from earlier listening sessions of this same command (see rec.onend)
    const heard = carry ? carry + ' ' + now : now;
    lastHeard = heard;

    if (mode === 'active') {
      clearTimeout(activeTimer);
      caption(heard, { typed: false, pre: 'YOU' });
      pending = { text: heard };
    } else {
      const hit = findWake(heard);
      if (!hit) {
        if (Date.now() - (window.__lastHeardDiag || 0) > 4000) { window.__lastHeardDiag = Date.now(); addActivity('Heard (no wake word): ' + heard.slice(-60)); }
        // background chatter: forget finished chunks so they don't pile up
        let lastFinal = -1;
        for (let i = uttStart; i < e.results.length; i++) if (e.results[i].isFinal) lastFinal = i;
        if (lastFinal >= 0 && !pending) uttStart = lastFinal + 1;
        return;
      }
      if (state !== 'listening') setState('listening');
      const after = heard.slice(hit.i + hit.len);
      caption(after.trim() || '…', { typed: false, pre: 'YOU' });
      pending = after.trim() ? { text: after, fromWake: true } : { wakeOnly: true };
    }
    clearTimeout(uttTimer);
    uttTimer = setTimeout(flush, pending?.wakeOnly ? 1100 : silenceFor(pending?.text));
  }

  function submit(text) {
    clearTimeout(activeTimer); mode = 'passive';
    if (!text) return;
    if (/^(stop|cancel|never ?mind|shut up|quiet)\b/i.test(text)) { stopSpeaking(); stopFillers(); if (filler.cur) { filler.cur.pause(); filler.cur = null; } send({ type: 'interrupt' }); setState('idle'); return; }
    if (LOOK_RE.test(text)) { openCamera(text.replace(LOOK_RE, '').replace(/^[\s,.:;-]+|[\s,.]+$/g, '').replace(/^(and|then)\s+/i, '')); addLog('user', text); caption('Opening the camera…'); return; }
    stopSpeaking(false);
    setState('thinking');
    startFillers(text);
    send({ type: 'ask', text }); sendLocation(); // ask right away; the position follows (server uses the last one it has)
  }

  // Fresh phone position (cached up to 2 min, never waits more than 1.2s) so places and weather follow him.
  function sendLocation(then) {
    let done = false; const fin = () => { if (done) return; done = true; then && then(); };
    if (!navigator.geolocation) return fin();
    setTimeout(fin, 1300);
    navigator.geolocation.getCurrentPosition(p => { send({ type: 'location', lat: p.coords.latitude, lon: p.coords.longitude }); fin(); }, fin, { timeout: 1200, maximumAge: 30000 });
  }
  setInterval(() => { if (booted) sendLocation(); }, 60000); // once a minute so arrive/leave is noticed with the app open


  // ======================= camera: photo analysis =======================
  const camInput = $('#camInput'), camBtn = $('#camBtn');
  const LOOK_RE = /\b(look at (this|that|it)|take (a )?(picture|photo|pic)|(analy[sz]e|scan|read) (this|that) (picture|photo|pic|label|gauge|receipt)|use the camera|open the camera)\b/i;
  function openCamera(question) {
    camInput.dataset.q = question || '';
    try { camInput.click(); } catch {}
    // Browsers only open the camera from a tap; when this came from voice, leave one big button to tap.
    if (!navigator.userActivation?.isActive) showCamPrompt();
  }
  function showCamPrompt() {
    if ($('#camPrompt')) return;
    const b = document.createElement('button'); b.id = 'camPrompt'; b.textContent = 'TAP TO OPEN CAMERA';
    b.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;padding:22px 30px;font:700 16px Orbitron,sans-serif;letter-spacing:.2em;background:#041422;color:#3fe0ff;border:2px solid #3fe0ff;box-shadow:0 0 24px rgba(63,224,255,.5)';
    b.onclick = () => { b.remove(); camInput.click(); };
    document.body.appendChild(b); setTimeout(() => b.remove(), 20000);
  }
  // Shrink to <=1600px JPEG so the upload is quick on mobile data.
  function shrink(file) {
    return new Promise((ok, bad) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
        ok(c.toDataURL('image/jpeg', 0.85));
      };
      im.onerror = () => { URL.revokeObjectURL(url); bad(new Error('could not read the photo')); };
      im.src = url;
    });
  }
  camBtn.addEventListener('click', () => { camInput.dataset.q = ''; camInput.click(); });
  camInput.addEventListener('change', async () => {
    const f = camInput.files?.[0], q = camInput.dataset.q || ''; camInput.value = ''; $('#camPrompt')?.remove();
    if (!f) return photoFail('No photo was taken, or camera permission was denied. Allow camera access for Jarvis in the phone settings.', q);
    setState('thinking'); addActivity('Photo sent for analysis');
    try {
      const image = await shrink(f);
      const r = await fetch('/api/photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image, question: q }) });
      if (!r.ok && r.status === 401) location.reload();
      // success and server-side failures are spoken by the server over the socket
    } catch (e) { photoFail('The photo upload failed: ' + e.message, q); }
  });
  // Client-only failures (no photo, permission, upload) are reported to the server so Jarvis speaks them and notes the failure.
  function photoFail(msg, q) {
    setState('idle');
    fetch('/api/photo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: '', question: q || '', clientError: msg }) }).catch(() => { addLog('system', msg); caption(msg); });
  }

  // ======================= controls =======================
  $('#cmd').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('#cmdInput').value.trim(); if (!v) return;
    $('#cmdInput').value = '';
    if (!booted) boot();
    submit(v);
  });
  $('#micBtn').onclick = () => {
    if (!booted) return boot();
    // Only a mic that is really open counts as "on"; a stale listening state must not turn the tap into a stop.
    if (state === 'listening' && recOn) { mode = 'passive'; manualMicUntil = 0; clearTimeout(activeTimer); try { rec && rec.abort(); } catch {} setState('idle'); }
    else { micNotBefore = 0; recBackoff = 0; manualMicUntil = Date.now() + 15000; goActive(); }
  };
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
    loadFillers();
    chime(true);
    // "wake up" on start → greeting from the server-side briefing
    // Share the phone's position first (for weather wherever he is), then greet. Never blocks longer than 4s.
    const wake = () => setTimeout(() => send({ type: 'wake', memo: readMemo() }), 600);
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(
      p => { send({ type: 'location', lat: p.coords.latitude, lon: p.coords.longitude }); wake(); },
      () => wake(), { timeout: 4000, maximumAge: 600000 });
    else wake();
  }
  $('#bootBtn').onclick = boot;
  // Inside the Android app there is no tap-to-start: boot straight away, and let the side key jump to listening.
  if (/JarvisApp/.test(navigator.userAgent)) {
    setTimeout(boot, 500);
    window.__jarvisWake = () => { if (!booted) boot(); else goActive(); };
  }

  // ======================= reactor =======================
  const rc = $('#reactor'); let rx = rc.getContext('2d');
  const brc = $('#bootReactor'), brx = brc && brc.getContext('2d');
  const bg = $('#bg'), bx = bg.getContext('2d');
  let W, H, BW, BH, dpr = Math.min(2, window.devicePixelRatio || 1);
  function resize() {
    const r = rc.getBoundingClientRect();
    W = rc.width = r.width * dpr; H = rc.height = r.height * dpr;
    BW = bg.width = innerWidth; BH = bg.height = innerHeight; // background at 1x: it is soft glow, and full-res costs the phone a lot
  }
  addEventListener('resize', resize);

  const COL = {
    idle: [63, 224, 255], listening: [220, 250, 255], thinking: [255, 181, 71],
    speaking: [120, 240, 255], offline: [255, 77, 94]
  };
  let col = [...COL.idle];
  const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

  const parts = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - .5) * .00012, vy: (Math.random() - .5) * .00012, r: Math.random() * 1.6 + .3 }));

  let t0 = performance.now(), lastFrame = 0;
  function frame(now) {
    // 30 fps is plenty for the HUD and halves the phone's work (less heat, snappier voice and mic).
    if (now - lastFrame < 32) { requestAnimationFrame(frame); return; }
    lastFrame = now;
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
    if (brx && !$('#boot').classList.contains('hide')) drawBootReactor(t);
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

  // boot screen emblem: Reactor Prime (prime.js), drawn on its own canvas
  function drawBootReactor(t) {
    const r = brc.getBoundingClientRect(), w = r.width * dpr, h = r.height * dpr;
    if (brc.width !== w || brc.height !== h) { brc.width = w; brc.height = h; }
    brx.setTransform(1, 0, 0, 1, 0, 0); brx.clearRect(0, 0, brc.width, brc.height);
    drawPrime(brx, Math.min(w, h), t, { bg: false, hud: false, fx: false, R: 128 });
  }

  // ======================= start =======================
  (async () => {
    try { cfg = await (await fetch('/api/config')).json(); } catch {}
    $('#brandName').textContent = cfg.name.split('').join('.').toUpperCase() + '.';
    $('#wakeHint').textContent = window.AndroidWake ? 'Hey ' + cap(cfg.wakeWord) : cap(cfg.wakeWord); // the phone's wake model is trained on "Hey Jarvis"
    chip('#chipVoice', cfg.elevenlabs ? 'ok' : 'warn', cfg.elevenlabs ? (cfg.voiceProvider || 'ELEVENLABS') : 'BASIC VOICE');
    if (DISPLAY_ONLY) { $('#boot').classList.add('hide'); booted = true; $('.bottom .cmd').style.display = 'none'; chip('#chipMic', '', 'DISPLAY'); }
    setState('idle', { echo: false });
    resize(); connect(); requestAnimationFrame(frame);
    if ('speechSynthesis' in window) speechSynthesis.getVoices();
  })();
})();
