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
  private final Map<String, android.media.audiofx.LoudnessEnhancer> boosts = new HashMap<>();
  private static final int VOICE_GAIN_MB = 1200;   // +12 dB on Jarvis's voice so it carries over the shop and over music
  private void boost(String id, MediaPlayer p) {
    try { android.media.audiofx.LoudnessEnhancer le = new android.media.audiofx.LoudnessEnhancer(p.getAudioSessionId()); le.setTargetGain(VOICE_GAIN_MB); le.setEnabled(true); boosts.put(id, le); } catch (Throwable ignored) {}
  }

  PhoneAudio(Context c, WebView w) { ctx = c; web = w; am = (AudioManager) c.getSystemService(Context.AUDIO_SERVICE); }

  private AudioDeviceInfo find(int type) {
    try { for (AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) if (d.getType() == type) return d; } catch (Exception ignored) {}
    return null;
  }

  /** True when a Bluetooth speaker/headset is taking the phone's media audio right now. */
  @JavascriptInterface public boolean btActive() { return find(AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) != null; }

  /** True while any app (Spotify) is playing music. The page stops listening in the background then, because the speech recognizer interrupts music. */
  @JavascriptInterface public boolean musicActive() { try { return am.isMusicActive(); } catch (Exception e) { return false; } }

  @JavascriptInterface public void play(final String id, final String base64) { ui.post(() -> start(id, base64)); }
  @JavascriptInterface public void stop(final String id) { ui.post(() -> release(id)); }
  /** Stream a clip straight from the server (no base64 hop): it starts playing as soon as the first audio arrives. */
  @JavascriptInterface public void playUrl(final String id, final String url) { ui.post(() -> startUrl(id, url, true)); }

  // While Bluetooth music plays, Android sends media-type audio to the Bluetooth speaker no matter the preferred device. Other usages
  // (accessibility, notification, alarm) are routed differently, so try them in turn and keep the first one that lands on the phone speaker.
  private static final int[] USAGES = { AudioAttributes.USAGE_MEDIA, AudioAttributes.USAGE_ASSISTANCE_ACCESSIBILITY, AudioAttributes.USAGE_NOTIFICATION, AudioAttributes.USAGE_ALARM };
  private int goodVariant = 0;
  private static boolean isBtOut(AudioDeviceInfo d) {
    if (d == null) return false;
    int t = d.getType();
    return t == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP || t == AudioDeviceInfo.TYPE_BLUETOOTH_SCO || t == AudioDeviceInfo.TYPE_BLE_HEADSET || t == AudioDeviceInfo.TYPE_BLE_SPEAKER || t == AudioDeviceInfo.TYPE_BLE_BROADCAST || t == AudioDeviceInfo.TYPE_HEARING_AID;
  }

  private void startUrl(String id, String url, boolean route) {
    final boolean bt = btActive();
    startUrlV(id, url, bt ? goodVariant : 0, bt);
  }

  private void startUrlV(final String id, final String url, final int v, final boolean bt) {
    try {
      MediaPlayer mp = new MediaPlayer();
      mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(USAGES[v]).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
      Map<String, String> h = new HashMap<>();
      String ck = android.webkit.CookieManager.getInstance().getCookie(url);
      if (ck != null) h.put("Cookie", ck);
      mp.setDataSource(ctx, android.net.Uri.parse(url), h);
      if (bt) { AudioDeviceInfo spk = find(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER); if (spk != null) mp.setPreferredDevice(spk); }
      mp.setOnPreparedListener(p -> {
        boost(id, p); p.start();
        ui.postDelayed(() -> {
          try {
            if (players.get(id) != p) return;
            if (bt && isBtOut(p.getRoutedDevice()) && v < USAGES.length - 1) { release(id); goodVariant = v + 1; startUrlV(id, url, v + 1, true); return; }
            if (bt && !isBtOut(p.getRoutedDevice())) goodVariant = v;
            emit(id, "info:" + where(p, bt) + (bt ? ", route " + v : ""));
          } catch (Exception ignored) {}
        }, 250);
      });
      mp.setOnCompletionListener(p -> { release(id); emit(id, "ended"); });
      mp.setOnErrorListener((p, what, extra) -> {
        release(id);
        if (bt && v < USAGES.length - 1) { goodVariant = v + 1; startUrlV(id, url, v + 1, true); return true; }
        emit(id, "error:" + what + "/" + extra); return true;
      });
      players.put(id, mp);
      mp.prepareAsync();
    } catch (Exception e) { release(id); emit(id, "error:" + e.getClass().getSimpleName()); }
  }

  // Where the voice actually went and how loud that output is, so a silent reply can be explained.
  private String where(MediaPlayer p, boolean bt) {
    AudioDeviceInfo d = p.getRoutedDevice();
    String dev = d == null ? "no output" : d.getType() == AudioDeviceInfo.TYPE_BUILTIN_SPEAKER ? "phone speaker" : d.getType() == AudioDeviceInfo.TYPE_BLUETOOTH_A2DP ? "Bluetooth (" + d.getProductName() + ")" : String.valueOf(d.getProductName());
    int v = am.getStreamVolume(AudioManager.STREAM_MUSIC), max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
    return "playing on " + dev + (bt ? " while Bluetooth music is on" : "") + ", media volume " + v + "/" + max;
  }

  private void start(String id, String b64) {
    try {
      File f = new File(ctx.getCacheDir(), "clip-" + id + ".mp3");
      try (FileOutputStream o = new FileOutputStream(f)) { o.write(Base64.decode(b64, Base64.DEFAULT)); }
      MediaPlayer mp = new MediaPlayer();
      mp.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build());
      mp.setDataSource(f.getAbsolutePath());
      if (btActive()) { AudioDeviceInfo spk = find(AudioDeviceInfo.TYPE_BUILTIN_SPEAKER); if (spk != null) mp.setPreferredDevice(spk); }
      mp.setOnPreparedListener(p -> { boost(id, p); p.start(); });
      mp.setOnCompletionListener(p -> { release(id); emit(id, "ended"); });
      mp.setOnErrorListener((p, what, extra) -> { release(id); emit(id, "error"); return true; });
      players.put(id, mp);
      mp.prepareAsync();
    } catch (Exception e) { release(id); emit(id, "error"); }
  }

  private void release(String id) {
    MediaPlayer mp = players.remove(id);
    android.media.audiofx.LoudnessEnhancer le = boosts.remove(id); if (le != null) { try { le.release(); } catch (Throwable ignored) {} }
    if (mp != null) { try { mp.stop(); } catch (Exception ignored) {} try { mp.release(); } catch (Exception ignored) {} }
    try { new File(ctx.getCacheDir(), "clip-" + id + ".mp3").delete(); } catch (Exception ignored) {}
  }

  private void emit(String id, String ev) {
    web.evaluateJavascript("window.__phoneClip&&window.__phoneClip(" + JSONObject.quote(id) + "," + JSONObject.quote(ev) + ")", null);
  }

  void releaseAll() { for (String id : new java.util.ArrayList<>(players.keySet())) release(id); }
}
