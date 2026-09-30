package app.jarvis;

import android.bluetooth.BluetoothA2dp;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.app.SearchManager;
import android.content.Intent;
import android.media.AudioManager;
import android.provider.MediaStore;
import android.view.KeyEvent;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONObject;

import java.util.List;

/**
 * Phone actions Jarvis can ask for over the websocket: open an app (Spotify) and connect a paired Bluetooth speaker.
 * Android will not let ordinary apps connect Bluetooth devices, so the connect step is handed to Tasker
 * (a Tasker task named JarvisBT), then we watch until the speaker really shows as connected and report back.
 */
public class DeviceBridge {
  private final Context ctx;
  private final WebView web;
  private final Handler ui = new Handler(Looper.getMainLooper());

  DeviceBridge(Context c, WebView w) { ctx = c; web = w; }

  @JavascriptInterface public void run(final String json) { ui.post(() -> handle(json)); }

  private void handle(String json) {
    String id = "";
    try {
      JSONObject o = new JSONObject(json);
      id = o.optString("id");
      String action = o.optString("action");
      if ("open_app".equals(action)) openApp(id, o.optString("package"));
      else if ("bt_connect".equals(action)) btConnect(id, o.optString("name", "Rockville"), o.optString("task", "JarvisBT"));
      else if ("bt_paired".equals(action)) btPaired(id);
      else if ("spotify_resume".equals(action)) spotifyResume(id);
      else if ("spotify_search".equals(action)) spotifySearch(id, o.optString("query"), o.optString("kind"));
      else if ("media_key".equals(action)) { mediaKey(o.optString("key")); reply(id, true, o.optString("key")); }
      else if ("set_volume".equals(action)) setVolume(id, o.optInt("percent", 50));
      else reply(id, false, "Unknown phone action " + action);
    } catch (Exception e) { reply(id, false, String.valueOf(e.getMessage())); }
  }

  private void reply(String id, boolean ok, String detail) {
    String js = "window.__deviceResult&&window.__deviceResult(" + JSONObject.quote(id) + "," + ok + "," + JSONObject.quote(detail) + ")";
    web.evaluateJavascript(js, null);
  }

  private void openApp(String id, String pkg) {
    Intent i = ctx.getPackageManager().getLaunchIntentForPackage(pkg);
    if (i == null) { reply(id, false, pkg + " is not installed on the phone."); return; }
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(i);
    // Bring Jarvis back to the front a moment later (without making him start listening); the music keeps playing.
    ui.postDelayed(() -> {
      Intent back = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("silent", true);
      try { ctx.startActivity(back); } catch (Exception ignored) {}
    }, 4000);
    reply(id, true, "opened");
  }

  private void btConnect(final String id, final String name, String task) {
    final BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
    final BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
    if (ad == null) { reply(id, false, "This phone has no Bluetooth."); return; }
    final long deadline = System.currentTimeMillis() + 20000;
    final boolean[] sent = {false};
    final Runnable[] poll = new Runnable[1];
    poll[0] = () -> {
      try {
        ad.getProfileProxy(ctx, new BluetoothProfile.ServiceListener() {
          @Override public void onServiceConnected(int profile, BluetoothProfile p) {
            String hit = null;
            try {
              List<BluetoothDevice> l = p.getConnectedDevices();
              for (BluetoothDevice d : l) { String n = d.getName(); if (n != null && n.toLowerCase().contains(name.toLowerCase())) hit = n; }
            } catch (SecurityException e) { ad.closeProfileProxy(profile, p); reply(id, false, "Bluetooth permission was not granted to the Jarvis app."); return; }
            ad.closeProfileProxy(profile, p);
            if (hit != null) { reply(id, true, hit + (sent[0] ? "" : " was already connected")); return; }
            if (!sent[0]) {
              sent[0] = true;
              // Tasker from Google Play is package net.dinglisch.android.taskerm; the direct-download build is ...tasker. Try both.
              for (String pkg : new String[]{"net.dinglisch.android.taskerm", "net.dinglisch.android.tasker"}) {
                Intent t = new Intent("net.dinglisch.android.tasker.ACTION_TASK");
                t.setPackage(pkg);
                t.putExtra("version_number", "1.0");
                t.putExtra("task_name", task);
                t.putExtra("par1", name); // the Tasker task reads the device name as %par1
                ctx.sendBroadcast(t);
              }
            }
            if (System.currentTimeMillis() > deadline) { reply(id, false, "The speaker did not connect. " + taskerReport(name, task)); return; }
            ui.postDelayed(poll[0], 1500);
          }
          @Override public void onServiceDisconnected(int profile) {}
        }, BluetoothProfile.A2DP);
      } catch (SecurityException e) { reply(id, false, "Bluetooth permission was not granted to the Jarvis app."); }
    };
    poll[0].run();
  }

  /** What the phone can tell us about why Tasker did not connect the speaker. */
  private String taskerReport(String name, String task) {
    StringBuilder sb = new StringBuilder();
    String found = "none";
    for (String pkg : new String[]{"net.dinglisch.android.taskerm", "net.dinglisch.android.tasker"}) {
      try { ctx.getPackageManager().getPackageInfo(pkg, 0); found = pkg; break; } catch (Exception ignored) {}
    }
    sb.append("Tasker app installed: ").append(found).append(". ");
    boolean perm = ctx.checkSelfPermission("net.dinglisch.android.tasker.PERMISSION_RUN_TASKS") == android.content.pm.PackageManager.PERMISSION_GRANTED;
    sb.append("Jarvis allowed to run Tasker tasks: ").append(perm ? "yes" : "NO (Android Settings > Apps > Jarvis > Permissions)").append(". ");
    try {
      BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
      BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
      sb.append("Bluetooth on: ").append(ad != null && ad.isEnabled()).append(". ");
      boolean paired = false; StringBuilder names = new StringBuilder();
      if (ad != null) for (BluetoothDevice d : ad.getBondedDevices()) { String n = d.getName(); if (names.length() > 0) names.append(", "); names.append(n); if (n != null && n.toLowerCase().contains(name.toLowerCase())) paired = true; }
      sb.append("Paired device matching \"").append(name).append("\": ").append(paired ? "yes" : "NO. Paired devices are: " + names).append(". ");
    } catch (SecurityException e) { sb.append("Jarvis lacks the Nearby devices permission. "); }
    sb.append("Tasker task name sent: ").append(task).append(".");
    return sb.toString();
  }

  // ---- Spotify without the Web API: drive the Spotify app like a remote ----
  private void mediaKey(String key) {
    int code = "pause".equals(key) ? KeyEvent.KEYCODE_MEDIA_PAUSE : "next".equals(key) ? KeyEvent.KEYCODE_MEDIA_NEXT
        : "previous".equals(key) ? KeyEvent.KEYCODE_MEDIA_PREVIOUS : KeyEvent.KEYCODE_MEDIA_PLAY;
    AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
    am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
    am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
  }

  private void backToJarvis(long delay) {
    ui.postDelayed(() -> {
      Intent back = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("silent", true);
      try { ctx.startActivity(back); } catch (Exception ignored) {}
    }, delay);
  }

  /** Open Spotify and press Play: Spotify carries on with whatever played last (your most recent playlist). */
  private void spotifyResume(String id) {
    Intent i = ctx.getPackageManager().getLaunchIntentForPackage("com.spotify.music");
    if (i == null) { reply(id, false, "Spotify is not installed on the phone."); return; }
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(i);
    ui.postDelayed(() -> mediaKey("play"), 3500);
    ui.postDelayed(() -> mediaKey("play"), 6000); // second press is ignored if it is already playing
    backToJarvis(7500);
    reply(id, true, "opened Spotify and pressed play; it resumes what played last");
  }

  private void spotifySearch(String id, String query, String kind) {
    Intent i = new Intent(MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH);
    i.setPackage("com.spotify.music");
    i.putExtra(SearchManager.QUERY, query);
    String focus = "artist".equals(kind) ? "vnd.android.cursor.item/artist" : "album".equals(kind) ? "vnd.android.cursor.item/album"
        : "playlist".equals(kind) ? "vnd.android.cursor.item/playlist" : "vnd.android.cursor.item/audio";
    i.putExtra(MediaStore.EXTRA_MEDIA_FOCUS, focus);
    if ("artist".equals(kind)) i.putExtra(MediaStore.EXTRA_MEDIA_ARTIST, query);
    else if ("album".equals(kind)) i.putExtra(MediaStore.EXTRA_MEDIA_ALBUM, query);
    else if ("playlist".equals(kind)) i.putExtra("android.intent.extra.playlist", query);
    else i.putExtra(MediaStore.EXTRA_MEDIA_TITLE, query);
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    try { ctx.startActivity(i); } catch (Exception e) { reply(id, false, "Spotify would not take the search: " + e.getMessage()); return; }
    backToJarvis(6000);
    reply(id, true, "asked Spotify to play " + query + " (cannot confirm what it picked)");
  }

  private void setVolume(String id, int pct) {
    AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
    int max = am.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
    am.setStreamVolume(AudioManager.STREAM_MUSIC, Math.max(0, Math.min(max, Math.round(max * pct / 100f))), 0);
    reply(id, true, "volume " + pct + "%");
  }

  /** Names of the phone's already-paired Bluetooth devices, so Jarvis can be taught which is which. */
  private void btPaired(String id) {
    try {
      BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
      BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
      if (ad == null) { reply(id, false, "This phone has no Bluetooth."); return; }
      StringBuilder sb = new StringBuilder();
      for (BluetoothDevice d : ad.getBondedDevices()) { if (sb.length() > 0) sb.append(" | "); sb.append(d.getName()); }
      reply(id, true, sb.length() == 0 ? "(no paired devices)" : sb.toString());
    } catch (SecurityException e) { reply(id, false, "Bluetooth permission was not granted to the Jarvis app."); }
  }
}
