package app.jarvis;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Handler;
import android.os.Looper;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Plays Jarvis's voice clips natively instead of in the page. Two reasons:
 *  1. It asks for no audio focus, so Spotify keeps playing instead of pausing whenever he speaks.
 *  2. While a Bluetooth speaker is playing music, his voice goes to the phone's own speaker, not the shop speaker.
 */
public class PhoneAudio {
  private final Context ctx;
  private final WebView web;
  private final AudioManager am;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private final Map<String, MediaPlayer> players = new HashMap<>();

  PhoneAudio(Context c, WebView w) { ctx = c; web = w; am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE); }

  private AudioDeviceInfo find(int type) {
    try { for (AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) if (d.getType() == type) return d; } catch (Exception ignored) {}
    return null;
  }

  /** True when a Bluetooth speaker/headset is taking the phone's media audio right now. */
  @JavascriptInterface public boolean btActive() { return find(AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) != null; }

  @JavascriptInterface public void play(final String id, final String base64) { ui.post(() -> start(id, base64)); }
  @JavascriptInterface public void stop(final String id) { ui.post(() -> release(id)); }

  private void start(String id, String b64) {
    try {
      File f = new File(ctx.getCacheDir(), "clip-" + id + ".mp3");
      try (FileOutputStream o = new FileOutputStream(f)) { o.write(Base64.decode(b64, Base64.DEFAULT)); }
      MediaPlayer mp = new MediaPlayer();
      mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
      mp.setDataSource(f.getAbsolutePath());
      if (btActive()) { AudioDeviceInfo spk = find(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER); if (spk != null) mp.setPreferredDevice(spk); }
      mp.setOnPreparedListener(MediaPlayer::start);
      mp.setOnCompletionListener(p -> { release(id); emit(id, "ended"); });
      mp.setOnErrorListener((p, what, extra) -> { release(id); emit(id, "error"); return true; });
      players.put(id, mp);
      mp.prepareAsync();
    } catch (Exception e) { release(id); emit(id, "error"); }
  }

  private void release(String id) {
    MediaPlayer mp = players.remove(id);
    if (mp != null) { try { mp.stop(); } catch (Exception ignored) {} try { mp.release(); } catch (Exception ignored) {} }
    try { new File(ctx.getCacheDir(), "clip-" + id + ".mp3").delete(); } catch (Exception ignored) {}
  }

  private void emit(String id, String ev) {
    web.evaluateJavascript("window.__phoneClip&&window.__phoneClip(" + JSONObject.quote(id) + "," + JSONObject.quote(ev) + ")", null);
  }

  void releaseAll() { for (String id : new java.util.ArrayList<>(players.keySet())) release(id); }
}
