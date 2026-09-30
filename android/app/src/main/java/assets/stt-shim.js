(function () {
  if (window.__sttShim || !window.AndroidSTT) return;
  window.__sttShim = true;
  var cur = null;
  function SR() { this.continuous = false; this.interimResults = false; this.lang = 'en-US'; this.maxAlternatives = 1; this._on = false; }
  SR.prototype.start = function () {
    if (this._on) throw new Error('InvalidStateError');
    cur = this; this._on = true; window.AndroidSTT.start(this.lang || 'en-US');
  };
  SR.prototype.stop = function () { window.AndroidSTT.stop(); };
  SR.prototype.abort = function () { window.AndroidSTT.abort(); };
  window.__stt = {
    ev: function (t, d) {
      var r = cur; if (!r) return;
      if (t === 'start') { r.onstart && r.onstart({}); }
      else if (t === 'result') {
        var alt = { transcript: d.text, confidence: 0.9 };
        var res = [alt]; res.isFinal = !!d.final; res.item = function (i) { return this[i]; };
        var list = [res]; list.item = function (i) { return this[i]; };
        r.onresult && r.onresult({ resultIndex: 0, results: list });
      }
      else if (t === 'error') { r.onerror && r.onerror({ error: d }); }
      else if (t === 'end') { r._on = false; r.onend && r.onend({}); }
    }
  };
  window.SpeechRecognition = SR; window.webkitSpeechRecognition = SR;
})();
