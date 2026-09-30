package app.jarvis;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import ai.picovoice.porcupine.Porcupine;
import ai.picovoice.porcupine.PorcupineManager;
import ai.picovoice.porcupine.PorcupineManagerCallback;

import org.json.JSONObject;

/**
 * On-device "Jarvis" wake word (Picovoice Porcupine). It records the mic itself, which takes no audio focus, so Spotify keeps playing
 * while it listens. The page starts it only while music plays; a detection opens the normal recognizer for the command.
 */
public class WakeBridge {
  private final Context ctx;
  private final WebView web;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private PorcupineManager pm;
  private boolean on = false;

  WakeBridge(Context c, WebView w) { ctx = c; web = w; }

  @JavascriptInterface public boolean running() { return on; }

  @JavascriptInterface public void start(final String accessKey) { ui.post(() -> begin(accessKey)); }
  @JavascriptInterface public void stop() { ui.post(this::halt); }

  private void begin(String key) {
    if (on) return;
    if (key == null || key.isEmpty()) { emit("error", "no key"); return; }
    try {
      if (ctx.checkSelfPermission(android.Manifest.permission.RECORD_AUDIO) != android.content.pm.PackageManager.PERMISSION_GRANTED) { emit("error", "mic permission"); return; }
      PorcupineManagerCallback cb = idx -> emit("hit", "");
      pm = new PorcupineManager.Builder()
          .setAccessKey(key)
          .setKeyword(Porcupine.BuiltInKeyword.JARVIS)
          .setSensitivity(0.7f)
          .build(ctx, cb);
      pm.start();
      on = true; emit("started", "");
    } catch (Throwable t) {
      on = false; pm = null;
      emit("error", t.getClass().getSimpleName() + ": " + String.valueOf(t.getMessage()));
    }
  }

  private void halt() {
    if (pm != null) { try { pm.stop(); } catch (Throwable ignored) {} try { pm.delete(); } catch (Throwable ignored) {} pm = null; }
    if (on) emit("stopped", "");
    on = false;
  }

  private void emit(String type, String data) {
    final String js = "window.__wake&&window.__wake(" + JSONObject.quote(type) + "," + JSONObject.quote(data) + ")";
    ui.post(() -> web.evaluateJavascript(js, null));
  }

  void release() { halt(); }
}
