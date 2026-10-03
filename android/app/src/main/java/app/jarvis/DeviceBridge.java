package app.jarvis;

import android.bluetooth.BluetoothA2dp;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.app.SearchManager;
import android.content.Intent;
import android.content.ComponentName;
import android.media.AudioManager;
import android.media.session.MediaController;
import android.media.session.MediaSessionManager;
import android.media.session.PlaybackState;
import org.json.JSONArray;
import android.provider.MediaStore;
import android.view.KeyEvent;
import android.os.Build;
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
  private String lastTarget = "?";
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
      else if ("bt_disconnect".equals(action)) { SttBridge.noResumeUntil = Long.MAX_VALUE; btDisconnect(id, o.optString("name", "Rockville"), o.optString("task", "JarvisBTOff"), o.optBoolean("off", true)); }
      else if ("bt_paired".equals(action)) btPaired(id);
      else if ("alarms_off".equals(action)) alarmsOff(id, o.optString("task", ""));
      else if ("siren".equals(action)) siren(id, o.optInt("seconds", 20));
      else if ("siren_stop".equals(action)) { sirenStop = true; reply(id, true, "siren stopped"); }
      else if ("spotify_resume".equals(action)) { SttBridge.noResumeUntil = 0; spotifyResume(id, o.optString("mode", "launch")); }
      else if ("media_status".equals(action)) mediaStatus(id);
      else if ("spotify_search".equals(action)) { SttBridge.noResumeUntil = 0; spotifySearch(id, o.optString("query"), o.optString("kind")); }
      else if ("music_active".equals(action)) { boolean a = PhoneAudio.otherMusicActive((AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE)); reply(id, true, a ? "playing" : "silent"); }
      else if ("close_app".equals(action)) { SttBridge.noResumeUntil = Long.MAX_VALUE; String pk = o.optString("pkg", "com.spotify.music"); try { ((android.app.ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE)).killBackgroundProcesses(pk); reply(id, true, "closed " + pk); } catch (Exception e) { reply(id, false, String.valueOf(e)); } }
      else if ("media_key".equals(action)) { if ("pause".equals(o.optString("key")) || "stop".equals(o.optString("key"))) SttBridge.noResumeUntil = Long.MAX_VALUE; else if ("play".equals(o.optString("key"))) SttBridge.noResumeUntil = 0; mediaKey(o.optString("key")); reply(id, true, o.optString("key")); }
      else if ("bt_scan".equals(action)) btScan(id, o.optInt("seconds", 9));
      else if ("bt_pair".equals(action)) btPair(id, o.optString("mac"), o.optInt("seconds", 30));
      else if ("led".equals(action)) ledWrite(id, o.optString("mac", ""), o.optJSONArray("packets"), o.optBoolean("verify", true));
      else if ("set_volume".equals(action)) setVolume(id, o.optInt("percent", 50));
      else reply(id, false, "Unknown phone action " + action);
    } catch (Exception e) { reply(id, false, String.valueOf(e.getMessage())); }
  }

  // "I'm awake": dismiss every pending alarm via the standard clock intent; optionally also run a Tasker task (TASKER_ALARM_TASK) for clock apps that ignore it.
  private void alarmsOff(String id, String task) {
    String res;
    try {
      Intent i = new Intent(android.provider.AlarmClock.ACTION_DISMISS_ALARM)
          .putExtra(android.provider.AlarmClock.EXTRA_ALARM_SEARCH_MODE, android.provider.AlarmClock.ALARM_SEARCH_MODE_ALL)
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      ctx.startActivity(i);
      res = "dismiss sent";
    } catch (Exception e) { res = "clock refused: " + e.getMessage(); }
    boolean ok = res.startsWith("dismiss sent");
    if (task != null && !task.isEmpty()) {
      for (String pk : new String[]{"net.dinglisch.android.taskerm", "net.dinglisch.android.tasker"}) {
        try { ctx.sendBroadcast(new Intent("net.dinglisch.android.tasker.ACTION_TASK").setPackage(pk).putExtra("task_name", task)); } catch (Exception ignored) {}
      }
      res += "; tasker " + task;
      ok = true;
    }
    ui.postDelayed(() -> {
      Intent back = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("silent", true);
      try { ctx.startActivity(back); } catch (Exception ignored) {}
    }, 1200);
    reply(id, ok, res);
  }

  // Wake-up call: car-alarm style siren (fast warble, rising sweeps, tight chirps) on the phone's own speaker, alarm stream at max. Replies when it ends.
  private volatile boolean sirenStop = false, sirenOn = false;
  private void siren(final String id, final int seconds) {
    if (sirenOn) { reply(id, false, "siren already running"); return; }
    sirenOn = true; sirenStop = false;
    final int secs = Math.max(3, Math.min(60, seconds));
    new Thread(() -> {
      AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
      int oldVol = am.getStreamVolume(AudioManager.STREAM_ALARM), oldMusic = am.getStreamVolume(AudioManager.STREAM_MUSIC);
      android.media.AudioTrack t = null;
      String res = "siren played";
      boolean ok = true;
      try {
        am.setStreamVolume(AudioManager.STREAM_ALARM, am.getStreamMaxVolume(AudioManager.STREAM_ALARM), 0);
        final int sr = 22050;
        short[] pat = sirenPattern(sr);
        int min = android.media.AudioTrack.getMinBufferSize(sr, android.media.AudioFormat.CHANNEL_OUT_MONO, android.media.AudioFormat.ENCODING_PCM_16BIT);
        t = new android.media.AudioTrack.Builder()
            .setAudioAttributes(new android.media.AudioAttributes.Builder().setUsage(android.media.AudioAttributes.USAGE_ALARM).setContentType(android.media.AudioAttributes.CONTENT_TYPE_SONIFICATION).build())
            .setAudioFormat(new android.media.AudioFormat.Builder().setSampleRate(sr).setChannelMask(android.media.AudioFormat.CHANNEL_OUT_MONO).setEncoding(android.media.AudioFormat.ENCODING_PCM_16BIT).build())
            .setBufferSizeInBytes(Math.max(min, 8192)).setTransferMode(android.media.AudioTrack.MODE_STREAM).build();
        t.setVolume(1.0f);
        if (Build.VERSION.SDK_INT >= 28) { // the phone's own speaker, even if a Bluetooth speaker is connected
          for (android.media.AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) if (d.getType() == android.media.AudioDeviceInfo.TYPE_BUILTIN_SPEAKER) { t.setPreferredDevice(d); break; }
        }
        t.play();
        long end = System.currentTimeMillis() + secs * 1000L;
        while (!sirenStop && System.currentTimeMillis() < end) t.write(pat, 0, pat.length);
        if (sirenStop) res = "siren stopped early";
      } catch (Exception e) { ok = false; res = "siren failed: " + e.getMessage(); }
      finally {
        try { if (t != null) { t.pause(); t.flush(); t.release(); } } catch (Exception ignored) {}
        try { am.setStreamVolume(AudioManager.STREAM_ALARM, oldVol, 0); am.setStreamVolume(AudioManager.STREAM_MUSIC, oldMusic, 0); } catch (Exception ignored) {}
        sirenOn = false;
      }
      final boolean fok = ok; final String fres = res;
      ui.post(() -> reply(id, fok, fres));
    }, "jarvis-siren").start();
  }

  /** ~4.4 s loop: warble 1400/1900 Hz, three rising sweeps, tight 3000 Hz chirps. Hard-clipped for a sharp edge. */
  private static short[] sirenPattern(int sr) {
    java.util.ArrayList<double[]> segs = new java.util.ArrayList<>(); // {startHz, endHz, seconds, gate(0 = continuous)}
    for (int i = 0; i < 12; i++) segs.add(new double[]{i % 2 == 0 ? 1400 : 1900, i % 2 == 0 ? 1400 : 1900, 0.125, 0});
    for (int i = 0; i < 3; i++) segs.add(new double[]{650, 1700, 0.4, 0});
    for (int i = 0; i < 8; i++) { segs.add(new double[]{3000, 3000, 0.06, 0}); segs.add(new double[]{0, 0, 0.06, 0}); }
    int n = 0; for (double[] g : segs) n += (int) (g[2] * sr);
    short[] out = new short[n];
    int k = 0; double ph = 0;
    for (double[] g : segs) {
      int m = (int) (g[2] * sr);
      for (int i = 0; i < m; i++) {
        double f = g[0] + (g[1] - g[0]) * i / m;
        if (g[0] == 0) { out[k++] = 0; continue; }
        ph += 2 * Math.PI * f / sr;
        double v = Math.max(-1, Math.min(1, Math.sin(ph) * 2.2));
        out[k++] = (short) (v * 32000);
      }
    }
    return out;
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
    final long holdUntil = System.currentTimeMillis() + 7000;   // wait (up to 7 s) for his instant reply to finish before connecting, so it is not dragged onto the speaker
    final int[] quiet = {0};
    // Tasker connects most reliably by hardware address: look up the paired speaker whose name contains what we were given.
    final String[] target = {name, name};
    try { for (BluetoothDevice d : ad.getBondedDevices()) { String n = d.getName(); if (n != null && n.toLowerCase().contains(name.toLowerCase())) { target[0] = d.getAddress(); target[1] = n; break; } } } catch (SecurityException ignored) {}
    lastTarget = target[0] + " (" + target[1] + ")";
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
              if (PhoneAudio.PLAYING.get() > 0) quiet[0] = 0; else quiet[0]++;
              if (quiet[0] < 2 && System.currentTimeMillis() < holdUntil) { ui.postDelayed(poll[0], 250); return; }
              sent[0] = true;
              // Tasker from Google Play is package net.dinglisch.android.taskerm; the direct-download build is ...tasker. Try both.
              for (String pkg : new String[]{"net.dinglisch.android.taskerm", "net.dinglisch.android.tasker"}) {
                Intent t = new Intent("net.dinglisch.android.tasker.ACTION_TASK");
                t.setPackage(pkg);
                t.putExtra("version_number", "1.0");
                t.putExtra("task_name", task);
                t.putExtra("par1", target[0]); // the Tasker task reads the speaker's hardware address (or name) as %par1
                t.putExtra("par2", target[1]);
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

  /** Hand the disconnect (and optionally Bluetooth-off) to Tasker, then watch until it has really happened. */
  private void btDisconnect(final String id, final String name, final String task, final boolean off) {
    final BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
    final BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
    if (ad == null) { reply(id, false, "This phone has no Bluetooth."); return; }
    final long deadline = System.currentTimeMillis() + 21000;
    final boolean[] sent = {false};
    final Runnable[] poll = new Runnable[1];
    poll[0] = () -> {
      try {
        if (!ad.isEnabled()) { reply(id, true, "Bluetooth is off"); return; }
        ad.getProfileProxy(ctx, new BluetoothProfile.ServiceListener() {
          @Override public void onServiceConnected(int profile, BluetoothProfile p) {
            boolean still = false;
            try { for (BluetoothDevice d : p.getConnectedDevices()) { String n = d.getName(); if (n != null && n.toLowerCase().contains(name.toLowerCase())) still = true; } }
            catch (SecurityException e) { ad.closeProfileProxy(profile, p); reply(id, false, "Bluetooth permission was not granted to the Jarvis app."); return; }
            ad.closeProfileProxy(profile, p);
            if (!sent[0]) {
              sent[0] = true;
              if (!still && !off) { reply(id, true, "already disconnected"); return; }
              for (String pkg : new String[]{"net.dinglisch.android.taskerm", "net.dinglisch.android.tasker"}) {
                Intent t = new Intent("net.dinglisch.android.tasker.ACTION_TASK");
                t.setPackage(pkg);
                t.putExtra("version_number", "1.0");
                t.putExtra("task_name", task);
                ctx.sendBroadcast(t);
              }
            } else if (!still && !off) { reply(id, true, "disconnected"); return; }
            if (System.currentTimeMillis() > deadline) {
              if (!still) { reply(id, true, "speaker disconnected, but Bluetooth is still on: Tasker's Bluetooth Off step did not run (run the " + task + " task by hand in Tasker to see its error)"); return; }
              reply(id, false, "It did not finish. Check that Tasker has a task named " + task + ". Still connected: true."); return;
            }
            ui.postDelayed(poll[0], 1200);
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
    sb.append("Tasker task name sent: ").append(task).append(", device sent as ").append(lastTarget).append(".");
    return sb.toString();
  }

  // ---- Spotify without the Web API: drive the Spotify app like a remote ----
  private void mediaKey(String key) {
    int code = "stop".equals(key) ? KeyEvent.KEYCODE_MEDIA_STOP : "pause".equals(key) ? KeyEvent.KEYCODE_MEDIA_PAUSE : "next".equals(key) ? KeyEvent.KEYCODE_MEDIA_NEXT
        : "previous".equals(key) ? KeyEvent.KEYCODE_MEDIA_PREVIOUS : KeyEvent.KEYCODE_MEDIA_PLAY;
    AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
    am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, code));
    am.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, code));
  }

  /** Media key sent ONLY to the Spotify app, so Android cannot hand it to YouTube or whatever else played last. */
  private void mediaKeyToSpotify(String key) {
    int code = "pause".equals(key) ? KeyEvent.KEYCODE_MEDIA_PAUSE : KeyEvent.KEYCODE_MEDIA_PLAY;
    for (int act : new int[]{KeyEvent.ACTION_DOWN, KeyEvent.ACTION_UP}) {
      Intent b = new Intent(Intent.ACTION_MEDIA_BUTTON).setPackage("com.spotify.music").putExtra(Intent.EXTRA_KEY_EVENT, new KeyEvent(act, code));
      try { ctx.sendBroadcast(b); } catch (Exception ignored) {}
    }
  }

  private void backToJarvis(long delay) {
    ui.postDelayed(() -> {
      Intent back = new Intent(ctx, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP).putExtra("silent", true);
      try { ctx.startActivity(back); } catch (Exception ignored) {}
    }, delay);
  }

  /** Active media sessions (needs Notification access for Jarvis); null when that access has not been granted. */
  private List<MediaController> sessions() {
    try {
      MediaSessionManager msm = (MediaSessionManager) ctx.getSystemService(Context.MEDIA_SESSION_SERVICE);
      return msm.getActiveSessions(new ComponentName(ctx, JarvisNotificationListener.class));
    } catch (Exception e) { return null; }
  }

  /** What is really playing: audio state, Bluetooth route and each media session (package, state, track, artist) as JSON. */
  private void mediaStatus(String id) {
    try {
      AudioManager am = (AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE);
      JSONObject r = new JSONObject();
      r.put("audio", PhoneAudio.otherMusicActive(am));
      boolean bt = false;
      try { for (android.media.AudioDeviceInfo d : am.getDevices(AudioManager.GET_DEVICES_OUTPUTS)) if (d.getType() == android.media.AudioDeviceInfo.TYPE_BLUETOOTH_A2DP) bt = true; } catch (Exception ignored) {}
      r.put("bt", bt);
      r.put("volume", Math.round(100f * am.getStreamVolume(AudioManager.STREAM_MUSIC) / Math.max(1, am.getStreamMaxVolume(AudioManager.STREAM_MUSIC))));
      List<MediaController> cs = sessions();
      r.put("listener", cs != null);
      JSONArray arr = new JSONArray();
      if (cs != null) for (MediaController c : cs) {
        JSONObject s = new JSONObject();
        s.put("pkg", c.getPackageName());
        PlaybackState ps = c.getPlaybackState();
        s.put("state", ps == null ? "none" : ps.getState() == PlaybackState.STATE_PLAYING ? "playing" : ps.getState() == PlaybackState.STATE_PAUSED ? "paused" : ps.getState() == PlaybackState.STATE_BUFFERING ? "buffering" : "stopped");
        android.media.MediaMetadata md = c.getMetadata();
        s.put("title", md == null ? "" : String.valueOf(md.getString(android.media.MediaMetadata.METADATA_KEY_TITLE)));
        s.put("artist", md == null ? "" : String.valueOf(md.getString(android.media.MediaMetadata.METADATA_KEY_ARTIST)));
        arr.put(s);
      }
      r.put("sessions", arr);
      reply(id, true, r.toString());
    } catch (Exception e) { reply(id, false, "media status failed: " + e); }
  }

  /**
   * Open Spotify in the foreground and start it.
   * mode "launch": launcher intent, then Play via Spotify's own media session (if Notification access is granted) and a Spotify-only Play key.
   * mode "search": Android's "play music" request (empty search) sent straight to Spotify, which starts its last/suggested listening.
   */
  private void spotifyResume(String id, String mode) {
    if ("search".equals(mode)) {
      Intent i = new Intent(MediaStore.INTENT_ACTION_MEDIA_PLAY_FROM_SEARCH).setPackage("com.spotify.music");
      i.putExtra(SearchManager.QUERY, "");
      i.putExtra(MediaStore.EXTRA_MEDIA_FOCUS, "vnd.android.cursor.item/*");
      i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
      try { ctx.startActivity(i); } catch (Exception e) { reply(id, false, "Spotify would not take the play request: " + e.getMessage()); return; }
      backToJarvis(8000);
      reply(id, true, "sent Spotify a play-music request");
      return;
    }
    Intent i = ctx.getPackageManager().getLaunchIntentForPackage("com.spotify.music");
    if (i == null) { reply(id, false, "Spotify is not installed on the phone."); return; }
    i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    ctx.startActivity(i);
    Runnable press = () -> {
      List<MediaController> cs = sessions();
      if (cs != null) for (MediaController c : cs) if ("com.spotify.music".equals(c.getPackageName())) { try { c.getTransportControls().play(); } catch (Exception ignored) {} }
      mediaKeyToSpotify("play");
    };
    ui.postDelayed(press, 3500);
    ui.postDelayed(press, 6000); // second press is ignored if it is already playing
    backToJarvis(8000);
    reply(id, true, "opened Spotify and pressed play in Spotify only");
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

  // ---- BanlanX/SPLED BLE LED controller (SP63xE): scan, connect, write packets to ffe1, disconnect ----
  private boolean ledBusy = false;
  private void ledWrite(final String id, String macIn, org.json.JSONArray pkIn, final boolean verify) {
    if (ledBusy) { reply(id, false, "LED controller busy"); return; }
    final org.json.JSONArray pk = pkIn == null ? new org.json.JSONArray() : pkIn;
    if (pk.length() == 0 && !verify) { reply(id, false, "no packets"); return; }
    final BluetoothAdapter ad = ((BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
    if (ad == null || !ad.isEnabled()) { reply(id, false, "Bluetooth is off"); return; }
    ledBusy = true;
    final android.content.SharedPreferences sp = ctx.getSharedPreferences("led", Context.MODE_PRIVATE);
    String mac = macIn.isEmpty() ? sp.getString("mac", "") : macIn;
    if (!mac.isEmpty()) { ledConnect(id, ad.getRemoteDevice(mac), pk, verify, sp); return; }
    final android.bluetooth.le.BluetoothLeScanner sc = ad.getBluetoothLeScanner();
    if (sc == null) { ledBusy = false; reply(id, false, "no BLE scanner"); return; }
    final BluetoothDevice[] best = new BluetoothDevice[1];
    final int[] bestRssi = {-999};
    final android.bluetooth.le.ScanCallback cb = new android.bluetooth.le.ScanCallback() {
      @Override public void onScanResult(int t, android.bluetooth.le.ScanResult r) {
        android.bluetooth.le.ScanRecord rec = r.getScanRecord();
        byte[] d = rec == null ? null : rec.getManufacturerSpecificData(20563);
        if (d != null && d.length > 1 && d[1] == 0x10 && r.getRssi() > bestRssi[0]) { bestRssi[0] = r.getRssi(); best[0] = r.getDevice(); }
      }
    };
    try { sc.startScan(cb); } catch (Exception e) { ledBusy = false; reply(id, false, "scan failed: " + e.getMessage()); return; }
    ui.postDelayed(() -> {
      try { sc.stopScan(cb); } catch (Exception ignored) {}
      if (best[0] == null) { ledBusy = false; reply(id, false, "LED controller not found. Power it on, stay close, and check Nearby devices permission."); return; }
      sp.edit().putString("mac", best[0].getAddress()).apply();
      ledConnect(id, best[0], pk, verify, sp);
    }, 5000);
  }

  /** Status frame (message type 0x02) to compact JSON. Offsets follow the SP63xE status layout (UniLED reference). */
  private static String ledStatusJson(byte[] f) {
    try {
      org.json.JSONObject o = new org.json.JSONObject();
      o.put("n", f.length);
      if (f.length > 52) {
        o.put("t", f[19] & 0xFF); o.put("o", f[31] & 0xFF); o.put("p", (f[29] & 0xFF) > 0 ? 1 : 0);
        o.put("m", f[32] & 0xFF); o.put("e", f[33] & 0xFF); o.put("lv", f[35] & 0xFF); o.put("wl", f[36] & 0xFF);
        o.put("sp", f[42] & 0xFF);
        o.put("rgb", (f[37] & 0xFF) + "," + (f[38] & 0xFF) + "," + (f[39] & 0xFF));
        o.put("drgb", (f[47] & 0xFF) + "," + (f[48] & 0xFF) + "," + (f[49] & 0xFF));
      }
      return o.toString();
    } catch (Exception e) { return "{}"; }
  }

  private void ledConnect(final String id, BluetoothDevice dev, final org.json.JSONArray pk, final boolean verify, final android.content.SharedPreferences sp) {
    final int[] idx = {0};
    final boolean[] done = {false};
    final boolean[] queryWriting = {false};   // the state query packet is being written
    final boolean[] queried = {false};        // query written, waiting for the status frame
    final boolean[] gotStatus = {false};
    final String[] last = {null};
    final java.io.ByteArrayOutputStream rx = new java.io.ByteArrayOutputStream();
    final android.bluetooth.BluetoothGatt[] g = new android.bluetooth.BluetoothGatt[1];
    final java.util.UUID SVC = java.util.UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb");
    final java.util.UUID CHR = java.util.UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb");
    final java.util.UUID CCC = java.util.UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");
    final android.bluetooth.BluetoothGattCallback cb = new android.bluetooth.BluetoothGattCallback() {
      void end(boolean ok, String msg) {
        if (done[0]) return; done[0] = true;
        try { g[0].disconnect(); g[0].close(); } catch (Exception ignored) {}
        ui.post(() -> { ledBusy = false; if (!ok) sp.edit().remove("mac").apply(); reply(id, ok, msg); });
      }
      byte[] hex(String h) {
        byte[] b = new byte[h.length() / 2];
        for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(h.substring(2 * i, 2 * i + 2), 16);
        return b;
      }
      android.bluetooth.BluetoothGattCharacteristic chr(android.bluetooth.BluetoothGatt gt) {
        android.bluetooth.BluetoothGattService sv = gt.getService(SVC);
        return sv == null ? null : sv.getCharacteristic(CHR);
      }
      boolean put(android.bluetooth.BluetoothGatt gt, byte[] b) {
        android.bluetooth.BluetoothGattCharacteristic ch = chr(gt);
        if (ch == null) { end(false, "controller service ffe0/ffe1 missing"); return false; }
        ch.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
        ch.setValue(b);
        return gt.writeCharacteristic(ch);
      }
      void next(android.bluetooth.BluetoothGatt gt) {
        try {
          if (idx[0] >= pk.length()) {
            if (!verify) { end(true, "sent"); return; }
            if (queryWriting[0] || queried[0]) return;
            queryWriting[0] = true;   // 53 02 00 01 00 01 01 = "send me your state"
            if (!put(gt, new byte[]{0x53, 0x02, 0x00, 0x01, 0x00, 0x01, 0x01})) end(true, "sent (status query refused)");
            return;
          }
          if (!put(gt, hex(pk.getString(idx[0]++)))) end(false, "write refused");
        } catch (Exception e) { end(false, String.valueOf(e.getMessage())); }
      }
      void enableNotify(android.bluetooth.BluetoothGatt gt) {
        try {
          android.bluetooth.BluetoothGattCharacteristic ch = chr(gt);
          if (ch != null && gt.setCharacteristicNotification(ch, true)) {
            android.bluetooth.BluetoothGattDescriptor d = ch.getDescriptor(CCC);
            if (d != null) {
              d.setValue(android.bluetooth.BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
              if (gt.writeDescriptor(d)) return;
            }
          }
        } catch (Exception ignored) {}
        next(gt);
      }
      @Override public void onConnectionStateChange(android.bluetooth.BluetoothGatt gt, int st, int ns) {
        if (ns == BluetoothProfile.STATE_CONNECTED) gt.discoverServices();
        else if (ns == BluetoothProfile.STATE_DISCONNECTED) end(false, "disconnected early (status " + st + ")");
      }
      @Override public void onServicesDiscovered(android.bluetooth.BluetoothGatt gt, int st) {
        if (!verify) { next(gt); return; }
        try { if (gt.requestMtu(185)) return; } catch (Exception ignored) {}   // status frame is ~60 bytes
        enableNotify(gt);
      }
      @Override public void onMtuChanged(android.bluetooth.BluetoothGatt gt, int mtu, int st) { enableNotify(gt); }
      @Override public void onDescriptorWrite(android.bluetooth.BluetoothGatt gt, android.bluetooth.BluetoothGattDescriptor d, int st) { next(gt); }
      @Override public void onCharacteristicWrite(android.bluetooth.BluetoothGatt gt, android.bluetooth.BluetoothGattCharacteristic c, int st) {
        if (st != android.bluetooth.BluetoothGatt.GATT_SUCCESS) { end(false, "write failed " + st); return; }
        if (queryWriting[0]) {
          queryWriting[0] = false; queried[0] = true;
          ui.postDelayed(() -> end(true, last[0] != null ? last[0] : "sent (no status reply)"), 2500);
        } else next(gt);
      }
      @Override public void onCharacteristicChanged(android.bluetooth.BluetoothGatt gt, android.bluetooth.BluetoothGattCharacteristic c) {
        try {
          byte[] v = c.getValue();
          if (v == null) return;
          rx.write(v, 0, v.length);
          byte[] all = rx.toByteArray();
          while (all.length >= 6) {
            if ((all[0] & 0xFF) != 0x53) { rx.reset(); return; }
            int need = 6 + (all[5] & 0xFF);
            if (all.length < need) return;
            byte[] f = java.util.Arrays.copyOfRange(all, 0, need);
            all = java.util.Arrays.copyOfRange(all, need, all.length);
            rx.reset(); rx.write(all, 0, all.length);
            if ((f[1] & 0xFF) == 0x02) {
              last[0] = ledStatusJson(f);
              if (queried[0] && !gotStatus[0]) { gotStatus[0] = true; ui.postDelayed(() -> end(true, last[0]), 250); }
            }
          }
        } catch (Exception ignored) {}
      }
    };
    ui.postDelayed(() -> { if (ledBusy) { ledBusy = false; try { if (g[0] != null) { g[0].disconnect(); g[0].close(); } } catch (Exception ignored) {} if (!done[0]) { done[0] = true; sp.edit().remove("mac").apply(); reply(id, false, "LED controller timed out"); } } }, 16000);
    g[0] = Build.VERSION.SDK_INT >= 23 ? dev.connectGatt(ctx, false, cb, BluetoothDevice.TRANSPORT_LE) : dev.connectGatt(ctx, false, cb);
  }

  // ---- God Mode: discover nearby Bluetooth audio devices, then pair one ----
  private boolean scanBusy = false;
  private void btScan(final String id, int seconds) {
    final BluetoothAdapter ad = ((BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
    if (ad == null || !ad.isEnabled()) { reply(id, false, "Bluetooth is off"); return; }
    if (scanBusy) { reply(id, false, "scan already running"); return; }
    scanBusy = true;
    final java.util.LinkedHashMap<String, JSONObject> found = new java.util.LinkedHashMap<>();
    final android.content.BroadcastReceiver rc = new android.content.BroadcastReceiver() {
      @Override public void onReceive(Context c, Intent in) {
        try {
          BluetoothDevice d = in.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
          if (d == null) return;
          JSONObject j = new JSONObject();
          j.put("mac", d.getAddress());
          String n = d.getName(); if (n == null) n = in.getStringExtra(BluetoothDevice.EXTRA_NAME);
          j.put("name", n == null ? "" : n);
          j.put("rssi", in.getShortExtra(BluetoothDevice.EXTRA_RSSI, (short) -100));
          android.bluetooth.BluetoothClass bc = d.getBluetoothClass();
          j.put("audio", bc != null && bc.getMajorDeviceClass() == android.bluetooth.BluetoothClass.Device.Major.AUDIO_VIDEO);
          int mc = bc == null ? 0 : bc.getDeviceClass();
          j.put("speaker", mc == 0x414 || mc == 0x41C || mc == 0x420 || mc == 0x428 || mc == 0x418 || mc == 0x42C);
          j.put("tv", mc == 0x42C);
          j.put("cod", Integer.toHexString(mc));
          j.put("bonded", d.getBondState() == BluetoothDevice.BOND_BONDED);
          found.put(d.getAddress(), j);
        } catch (Exception ignored) {}
      }
    };
    try {
      ctx.registerReceiver(rc, new android.content.IntentFilter(BluetoothDevice.ACTION_FOUND));
      if (ad.isDiscovering()) ad.cancelDiscovery();
      if (!ad.startDiscovery()) { scanBusy = false; ctx.unregisterReceiver(rc); reply(id, false, "could not start scan (Nearby devices permission?)"); return; }
    } catch (SecurityException e) { scanBusy = false; reply(id, false, "Bluetooth scan permission missing"); return; }
    ui.postDelayed(() -> {
      try { ad.cancelDiscovery(); } catch (Exception ignored) {}
      try { ctx.unregisterReceiver(rc); } catch (Exception ignored) {}
      scanBusy = false;
      org.json.JSONArray a = new org.json.JSONArray();
      for (JSONObject j : found.values()) a.put(j);
      reply(id, true, a.toString());
    }, Math.max(5, Math.min(20, seconds)) * 1000L);
  }

  private void btPair(final String id, final String mac, final int secs) {
    final BluetoothAdapter ad = ((BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
    if (ad == null || mac.isEmpty()) { reply(id, false, "no device"); return; }
    final BluetoothDevice d = ad.getRemoteDevice(mac);
    try { if (d.getBondState() == BluetoothDevice.BOND_BONDED) { reply(id, true, "already paired"); return; } } catch (SecurityException e) { reply(id, false, "Bluetooth permission missing"); return; }
    final boolean[] done = {false};
    final android.content.BroadcastReceiver rc = new android.content.BroadcastReceiver() {
      @Override public void onReceive(Context c, Intent in) {
        BluetoothDevice x = in.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
        if (x == null || !mac.equalsIgnoreCase(x.getAddress()) || done[0]) return;
        int st = in.getIntExtra(BluetoothDevice.EXTRA_BOND_STATE, -1);
        if (st == BluetoothDevice.BOND_BONDED) { done[0] = true; try { ctx.unregisterReceiver(this); } catch (Exception ignored) {} reply(id, true, "paired"); }
        else if (st == BluetoothDevice.BOND_NONE && in.getIntExtra(BluetoothDevice.EXTRA_PREVIOUS_BOND_STATE, -1) == BluetoothDevice.BOND_BONDING) { done[0] = true; try { ctx.unregisterReceiver(this); } catch (Exception ignored) {} reply(id, false, "pairing refused (speaker not in pairing mode, or you declined the Pair prompt)"); }
      }
    };
    try {
      ctx.registerReceiver(rc, new android.content.IntentFilter(BluetoothDevice.ACTION_BOND_STATE_CHANGED));
      try { ad.cancelDiscovery(); } catch (Exception ignored) {}
      if (!d.createBond()) { done[0] = true; ctx.unregisterReceiver(rc); reply(id, false, "could not start pairing"); return; }
    } catch (SecurityException e) { reply(id, false, "Bluetooth permission missing"); return; }
    ui.postDelayed(() -> { if (!done[0]) { done[0] = true; try { ctx.unregisterReceiver(rc); } catch (Exception ignored) {} reply(id, false, "pairing timed out (tap Pair on the phone if a prompt is showing)"); } }, secs * 1000L);
  }
}
