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
  private boolean useDefault = false;   // switch to the phone's default recognizer if Google's own can't be used
  private boolean announced = false;

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
    if (sr == null) { sr = make(); sr.setRecognitionListener(listener); }
    Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang == null || lang.isEmpty() ? "en-US" : lang);
    i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
    i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
    i.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, ctx.getPackageName());
    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
    i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
    running = true;
    hush(1600); // mute the recognizer's start "ding"
    try { sr.startListening(i); } catch (Exception e) { running = false; emit("error", "aborted"); emit("end", ""); }
  }

  private void cancel() {
    if (sr == null) return;
    boolean was = running;
    try { sr.cancel(); } catch (Exception ignored) {}
    running = false;
    hush(500);
    if (was) emit("end", "");
  }

  /** The recognizer's start/stop beeps ride the media stream. Jarvis never talks while listening, so mute it briefly. */
  private void hush(long ms) {
    try {
      if (!muted) { am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_MUTE, 0); muted = true; }
    } catch (Exception ignored) {}
    ui.removeCallbacks(unhush);
    ui.postDelayed(unhush, ms);
  }
  private void doUnhush() {
    try { if (muted) am.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_UNMUTE, 0); } catch (Exception ignored) {}
    muted = false;
  }
  private final Runnable unhush = this::doUnhush;

  private final RecognitionListener listener = new RecognitionListener() {
    @Override public void onReadyForSpeech(Bundle p) { emit("start", ""); ui.removeCallbacks(unhush); ui.postDelayed(unhush, 450); }
    @Override public void onBeginningOfSpeech() {}
    @Override public void onRmsChanged(float v) {}
    @Override public void onBufferReceived(byte[] b) {}
    @Override public void onEndOfSpeech() { hush(500); }
    @Override public void onError(int code) {
      running = false;
      String e;
      switch (code) {
        case SpeechRecognizer.ERROR_NO_MATCH:
        case SpeechRecognizer.ERROR_SPEECH_TIMEOUT: e = "no-speech"; break;
        case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS: e = "not-allowed"; break;
        case SpeechRecognizer.ERROR_NETWORK:
        case SpeechRecognizer.ERROR_NETWORK_TIMEOUT: e = "network"; break;
        case SpeechRecognizer.ERROR_AUDIO: e = "audio-capture"; break;
        case SpeechRecognizer.ERROR_RECOGNIZER_BUSY: e = "aborted"; break;
        default: e = "android-error-" + code;   // shows up on the HUD so it can be read off the screen
      }
      // Google's recognizer could not be used: rebuild with the phone's default one and carry on.
      if (!useDefault && (code == SpeechRecognizer.ERROR_CLIENT || code == 11 || code == 12 || code == 13)) {
        useDefault = true; emit("diag", "Google recognizer failed (" + code + "), trying the phone's default");
      }
      if (code == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || code == SpeechRecognizer.ERROR_CLIENT || useDefault && sr != null && code >= 11) {
        try { sr.destroy(); } catch (Exception ignored) {} sr = null;
      }
      if (!e.equals("no-speech") && !e.equals("aborted")) emit("error", e);
      emit("end", "");
    }
    @Override public void onPartialResults(Bundle b) { push(b, false); }
    @Override public void onResults(Bundle b) { running = false; push(b, true); emit("end", ""); }
    @Override public void onEvent(int t, Bundle b) {}
  };

  private void push(Bundle b, boolean fin) {
    ArrayList<String> l = b == null ? null : b.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
    if (l == null || l.isEmpty() || l.get(0) == null || l.get(0).isEmpty()) return;
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
    ui.removeCallbacks(unhush); unhush.run();
    if (sr != null) { try { sr.destroy(); } catch (Exception ignored) {} sr = null; }
  }
}
