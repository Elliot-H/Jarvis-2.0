package app.jarvis;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.media.AudioManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.ArrayList;

/**
 * The page asks for webkitSpeechRecognition; WebView has none. stt-shim.js fakes it and calls in here,
 * where Android's real speech recognizer does the listening. Results go back to the page as JS events.
 */
public class SttBridge {
  private final Context ctx;
  private final WebView web;
  private final AudioManager am;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private SpeechRecognizer sr;
  private boolean running = false;
  private boolean muted = false;
  private final java.util.ArrayList<Integer> mutedStreams = new java.util.ArrayList<>();
  // The phone's own recognizer beeps on the notification/system streams, Google's on music: quiet all three while listening.
  private static final int[] BEEP_STREAMS = {AudioManager.STREAM_MUSIC};   // never the notification/system streams: muting those flipped the phone to silent;
  private boolean useDefault = false;   // switch to the phone's default recognizer if Google's own can't be used
  private boolean announced = false;
  private boolean ready = false;        // recognizer said it is actually hearing audio
  private float maxRms = -100f;         // loudest sound level the recognizer heard this session (silence is about -2, talking 5+)
  private long lastQuietDiag = 0;
  // While music plays, feed the recognizer our own mic audio (AudioRecord takes no audio focus) instead of letting it open the mic
  // itself, because opening the mic is what makes it grab focus and pause Spotify. Needs Android 13+.
  private static final boolean FEED_ENABLED = false;   // experiment left off: it made the mic deaf on this phone
  private volatile boolean feeding = false;
  private boolean fedSession = false, feedBroken = false;   // feedBroken: the recognizer ignored our audio, stop using the feed
  private android.media.AudioRecord rec;
  private android.os.ParcelFileDescriptor feedRead, feedWrite;
  private boolean startFeed(Intent i) {
    if (android.os.Build.VERSION.SDK_INT < 33) return false;
    try {
      final int rate = 16000;
      int min = android.media.AudioRecord.getMinBufferSize(rate, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT);
      rec = new android.media.AudioRecord(android.media.MediaRecorder.AudioSource.MIC, rate, android.media.AudioFormat.CHANNEL_IN_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT, Math.max(min, 8192) * 2);
      if (rec.getState() != android.media.AudioRecord.STATE_INITIALIZED) { rec.release(); rec = null; return false; }
      android.os.ParcelFileDescriptor[] p = android.os.ParcelFileDescriptor.createPipe();
      feedRead = p[0]; feedWrite = p[1];
      i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE, feedRead);
      i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_CHANNEL_COUNT, 1);
      i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_ENCODING, android.media.AudioFormat.ENCODING_PCM_16BIT);
      i.putExtra(RecognizerIntent.EXTRA_AUDIO_SOURCE_SAMPLING_RATE, rate);
      feeding = true; rec.startRecording();
      final android.media.AudioRecord r = rec; final android.os.ParcelFileDescriptor w = feedWrite;
      new Thread(() -> {
        byte[] buf = new byte[3200];
        try (java.io.OutputStream out = new android.os.ParcelFileDescriptor.AutoCloseOutputStream(w)) {
          while (feeding) { int n = r.read(buf, 0, buf.length); if (n <= 0) break; out.write(buf, 0, n); }
        } catch (Exception ignored) {}
      }, "stt-feed").start();
      return true;
    } catch (Throwable t) { stopFeed(); return false; }
  }
  private void stopFeed() {
    feeding = false;
    try { if (rec != null) { rec.stop(); } } catch (Exception ignored) {}
    try { if (rec != null) { rec.release(); } } catch (Exception ignored) {}
    rec = null;
    try { if (feedRead != null) feedRead.close(); } catch (Exception ignored) {}
    feedRead = null; feedWrite = null;
  }
  static volatile long noResumeUntil = 0;   // set when the server deliberately paused/stopped/closed the music: never auto-resume then
  private long musicBeforeAt = 0;   // when musicBefore was set; a stale flag never resumes
  private boolean musicBefore = false;   // music was playing when the mic opened (the recognizer pauses it)
  private boolean wantPause = false;     // he just told Jarvis to pause/stop: do not resume
  private final Runnable resume = this::doResume;
  private void doResume() {
    if (!musicBefore) return;
    musicBefore = false;
    if (System.currentTimeMillis() - musicBeforeAt > 60000) return;
    try {
      if (System.currentTimeMillis() < noResumeUntil) wantPause = true;
      if (!wantPause && !am.isMusicActive()) {
        long t = android.os.SystemClock.uptimeMillis();
        am.dispatchMediaKeyEvent(new android.view.KeyEvent(t, t, android.view.KeyEvent.ACTION_DOWN, android.view.KeyEvent.KEYCODE_MEDIA_PLAY, 0));
        am.dispatchMediaKeyEvent(new android.view.KeyEvent(t, t, android.view.KeyEvent.ACTION_UP, android.view.KeyEvent.KEYCODE_MEDIA_PLAY, 0));
        emit("diag", "mic closed, resumed the music");
      }
    } catch (Exception ignored) {}
    wantPause = false;
  }
  private void scheduleResume() { if (musicBefore && System.currentTimeMillis() < noResumeUntil) musicBefore = false;
    if (musicBefore) { ui.removeCallbacks(resume); ui.postDelayed(resume, 1500); } }

  /** Watchdog: the recognizer sometimes accepts startListening and then never answers (no ready, no error),
   *  which left the mic "on" with nothing listening. Tear it down so the page can start clean. */
  private final Runnable stall = () -> {
    if (!running) return;
    emit("diag", ready ? "listening session hung, resetting mic" : "mic did not start, resetting");
    reset();
    emit("error", "stalled"); emit("end", "");
  };
  private void reset() {
    ui.removeCallbacks(stall);
    if (sr != null) { try { sr.cancel(); } catch (Exception ignored) {} try { sr.destroy(); } catch (Exception ignored) {} sr = null; }
    running = false; ready = false; stopFeed();
  }

  SttBridge(Context c, WebView w) {
    ctx = c; web = w; am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE);
  }

  @JavascriptInterface public void start(final String lang) { ui.post(() -> begin(lang)); }
  @JavascriptInterface public void stop() { ui.post(() -> { if (sr != null && running) sr.stopListening(); }); }
  @JavascriptInterface public void abort() { ui.post(this::cancel); }

  private SpeechRecognizer make() {
    // Force Google's recognizer. If Jarvis is the phone's chosen assistant, the default recognizer would be our stub.
    if (useDefault) return SpeechRecognizer.createSpeechRecognizer(ctx);
    try {
      ctx.getPackageManager().getPackageInfo("com.google.android.googlequicksearchbox", 0);
      ComponentName g = new ComponentName("com.google.android.googlequicksearchbox", "com.google.android.voicesearch.serviceapi.GoogleRecognitionService");
      return SpeechRecognizer.createSpeechRecognizer(ctx, g);
    } catch (Exception e) {
      return SpeechRecognizer.createSpeechRecognizer(ctx);
    }
  }

  private void begin(String lang) {
    if (running) return;
    if (ctx.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
      emit("error", "not-allowed"); emit("end", ""); return;
    }
    if (!announced) {
      announced = true;
      emit("diag", "speech available: " + SpeechRecognizer.isRecognitionAvailable(ctx) + ", engine: " + (useDefault ? "phone default" : "Google"));
    }
    try {
      if (am.isMusicActive()) {
        StringBuilder sb = new StringBuilder();
        for (android.media.AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_INPUTS)) sb.append(d.getType()).append(' ');
        emit("diag", "mic start while music plays; input device types: " + sb + "mode " + am.getMode() + ", engine " + (useDefault ? "default" : "Google"));
      }
    } catch (Exception ignored) {}
    if (sr == null) { sr = make(); sr.setRecognitionListener(listener); }
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "en-US" : lang);
    i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
    i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
    i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, ctx.getPackageName());
    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 4000L);
    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 3500L);
    try { if (!musicBefore) { musicBefore = am.isMusicActive() && System.currentTimeMillis() >= noResumeUntil; musicBeforeAt = System.currentTimeMillis(); } } catch (Exception ignored) {}
    stopFeed();
    boolean fed = false;
    try { if (FEED_ENABLED && !feedBroken && am.isMusicActive()) fed = startFeed(i); } catch (Exception ignored) {}
    fedSession = fed;
    if (FEED_ENABLED && !feedBroken && am.isMusicActive()) emit("diag", fed ? "music playing: feeding the recognizer our own mic audio (no audio focus)" : "music playing: own-audio feed unavailable, using the recognizer's mic");
    ui.removeCallbacks(resume);
    running = true; ready = false; maxRms = -100f;
    hush(1600); // mute the recognizer's start "ding"
    try { sr.startListening(i); } catch (Exception e) { reset(); emit("error", "aborted"); emit("end", ""); return; }
    ui.removeCallbacks(stall); ui.postDelayed(stall, 5000);
  }

  private void cancel() {
    if (sr == null) return;
    boolean was = running;
    ui.removeCallbacks(stall);
    try { sr.cancel(); } catch (Exception ignored) {}
    running = false; ready = false; stopFeed();
    hush(500);
    if (was) emit("end", "");
  }

  /** The recognizer's start/stop beeps ride the media stream. Jarvis never talks while listening, so mute it briefly. */
  private void hush(long ms) {
    try {
      if (!muted) {
        // Never mute the music stream while music is playing (that silenced Spotify and Jarvis's own voice).
        boolean music = false; try { music = am.isMusicActive(); } catch (Exception ignored) {}
        for (int st : BEEP_STREAMS) { if (music && st == AudioManager.STREAM_MUSIC) continue; try { am.adjustStreamVolume(st, AudioManager.ADJUST_MUTE, 0); mutedStreams.add(st); } catch (Exception ignored) {} }
        muted = true;
      }
    } catch (Exception ignored) {}
    ui.removeCallbacks(unhush);
    ui.postDelayed(unhush, ms);
  }
  private void doUnhush() {
    if (muted) { for (int st : mutedStreams) { try { am.adjustStreamVolume(st, AudioManager.ADJUST_UNMUTE, 0); } catch (Exception ignored) {} } mutedStreams.clear(); }
    muted = false;
  }
  private final Runnable unhush = this::doUnhush;

  private final RecognitionListener listener = new RecognitionListener() {
    @Override public void onReadyForSpeech(Bundle p) {
      ready = true; ui.removeCallbacks(stall); ui.postDelayed(stall, 60000);   // a live session never runs this long
      emit("start", ""); ui.removeCallbacks(unhush); ui.postDelayed(unhush, 450); }
    @Override public void onBeginningOfSpeech() {}
    @Override public void onRmsChanged(float v) { if (v > maxRms) maxRms = v; }
    @Override public void onBufferReceived(byte[] b) {}
    @Override public void onEndOfSpeech() { hush(500); }
    @Override public void onError(int code) {
      running = false; ready = false; stopFeed(); ui.removeCallbacks(stall);
      if (fedSession && maxRms <= -100f && code != 10) { feedBroken = true; emit("diag", "recognizer ignored our audio feed (code " + code + "), using its own mic from now on"); }
      fedSession = false;
      if (code != SpeechRecognizer.ERROR_NO_MATCH && code != SpeechRecognizer.ERROR_SPEECH_TIMEOUT) emit("diag", "speech engine error " + code);
      else if (System.currentTimeMillis() - lastQuietDiag > 15000) {
        lastQuietDiag = System.currentTimeMillis();
        emit("diag", (code == SpeechRecognizer.ERROR_NO_MATCH ? "heard sound but no words" : "heard nothing") + ", loudest level " + (maxRms <= -100f ? "none (no audio reached the recognizer)" : String.valueOf(Math.round(maxRms))) + " (silence is about -2, talking is 5 or more)");
      }
      String e;
      switch (code) {
        case SpeechRecognizer.ERROR_NO_MATCH:
        case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: e = "no-speech"; break;
        case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: e = "not-allowed"; break;
        case SpeechRecognizer.ERROR_NETWORK:
        case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: e = "network"; break;
        case SpeechRecognizer.ERROR_AUDIO: e = "audio-capture"; break;
        case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: e = "aborted"; break;
        case 10: e = "throttled"; break;   // ERROR_TOO_MANY_REQUESTS: restarted too fast; the page backs off
        default: e = "android-error-" + code;   // shows up on the HUD so it can be read off the screen
      }
      // Google's recognizer could not be used: rebuild with the phone's default one and carry on.
      if (code == 10) { useDefault = !useDefault; emit("diag", "Too many requests, switching to " + (useDefault ? "the phone's default recognizer" : "Google's recognizer")); }
      if (!useDefault && (code == SpeechRecognizer.ERROR_CLIENT || code == 11 || code == 12 || code == 13)) {
        useDefault = true; emit("diag", "Google recognizer failed (" + code + "), trying the phone's default");
      }
      if (code == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || code == SpeechRecognizer.ERROR_CLIENT || code == 10 || useDefault && sr != null && code >= 11) {
        try { sr.destroy(); } catch (Exception ignored) {} sr = null;
      }
      if (!e.equals("no-speech") && !e.equals("aborted")) emit("error", e);
      emit("end", ""); scheduleResume();
    }
    @Override public void onPartialResults(Bundle b) { push(b, false); }
    @Override public void onResults(Bundle b) { running = false; ready = false; stopFeed(); ui.removeCallbacks(stall); push(b, true); emit("end", ""); scheduleResume(); }
    @Override public void onEvent(int t, Bundle b) {}
  };

  private void push(Bundle b, boolean fin) {
    ArrayList<String> l = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
    if (l == null || l.isEmpty() || l.get(0) == null || l.get(0).isEmpty()) return;
    if (fin && l.get(0).toLowerCase().matches(".*\\b(pause|stop|disconnect|turn off|shut)\\b.*")) wantPause = true;
    try {
      JSONObject o = new JSONObject();
      o.put("text", l.get(0)); o.put("final", fin);
      emit("result", o.toString());
    } catch (Exception ignored) {}
  }

  private void emit(String type, String data) {
    final String js = "window.__stt&&window.__stt.ev(" + JSONObject.quote(type) + "," + (data.startsWith("{") ? data : JSONObject.quote(data)) + ")";
    ui.post(() -> web.evaluateJavascript(js, null));
  }

  void release() {
    stopFeed(); ui.removeCallbacks(unhush); ui.removeCallbacks(stall); unhush.run();
    if (sr != null) { try { sr.destroy(); } catch (Exception ignored) {} sr = null; }
  }
}
