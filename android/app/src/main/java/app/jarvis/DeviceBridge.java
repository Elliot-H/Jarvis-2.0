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
      else if ("spotify_resume".equals(action)) { SttBridge.noResumeUntil = 0; spotifyResume(id); }
      else if ("spotify_search".equals(action)) { SttBridge.noResumeUntil = 0; spotifySearch(id, o.optString("query"), o.optString("kind")); }
      else if ("music_active".equals(action)) { boolean a = PhoneAudio.otherMusicActive((AudioManager) ctx.getSystemService(Context.AUDIO_SERVICE)); reply(id, true, a ? "playing" : "silent"); }
      else if ("close_app".equals(action)) { SttBridge.noResumeUntil = Long.MAX_VALUE; String pk = o.optString("pkg", "com.spotify.music"); try { ((android.app.ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE)).killBackgroundProcesses(pk); reply(id, true, "closed " + pk); } catch (Exception e) { reply(id, false, String.valueOf(e)); } }
      else if ("media_key".equals(action)) { if ("pause".equals(o.optString("key")) || "stop".equals(o.optString("key"))) SttBridge.noResumeUntil = Long.MAX_VALUE; else if ("play".equals(o.optString("key"))) SttBridge.noResumeUntil = 0; mediaKey(o.optString("key")); reply(id, true, o.optString("key")); }
      else if ("bt_scan".equals(action)) btScan(id, o.optInt("seconds", 9));
      else if ("bt_pair".equals(action)) btPair(id, o.optString("mac"), o.optInt("seconds", 30));
      else if ("led".equals(action)) ledWrite(id, o.optString("mac", ""), o.optJSONArray("packets"));
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

  // ---- BanlanX/SPLED BLE LED controller (SP63xE): scan, connect, write packets to ffe1, disconnect ----
  private boolean ledBusy = false;
  private void ledWrite(final String id, String macIn, final org.json.JSONArray pk) {
    if (ledBusy) { reply(id, false, "LED controller busy"); return; }
    if (pk == null || pk.length() == 0) { reply(id, false, "no packets"); return; }
    final BluetoothAdapter ad = ((BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
    if (ad == null || !ad.isEnabled()) { reply(id, false, "Bluetooth is off"); return; }
    ledBusy = true;
    final android.content.SharedPreferences sp = ctx.getSharedPreferences("led", Context.MODE_PRIVATE);
    String mac = macIn.isEmpty() ? sp.getString("mac", "") : macIn;
    if (!mac.isEmpty()) { ledConnect(id, ad.getRemoteDevice(mac), pk, sp); return; }
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
      ledConnect(id, best[0], pk, sp);
    }, 5000);
  }

  private void ledConnect(final String id, BluetoothDevice dev, final org.json.JSONArray pk, final android.content.SharedPreferences sp) {
    final int[] idx = {0};
    final boolean[] done = {false};
    final android.bluetooth.BluetoothGatt[] g = new android.bluetooth.BluetoothGatt[1];
    final Runnable finish = () -> {};
    final android.bluetooth.BluetoothGattCallback cb = new android.bluetooth.BluetoothGattCallback() {
      void end(boolean ok, String msg) {
        if (done[0]) return; done[0] = true;
        try { g[0].disconnect(); g[0].close(); } catch (Exception ignored) {}
        ui.post(() -> { ledBusy = false; if (!ok) sp.edit().remove("mac").apply(); reply(id, ok, msg); });
      }
      void next(android.bluetooth.BluetoothGatt gt) {
        try {
          if (idx[0] >= pk.length()) { end(true, "sent"); return; }
          String hex = pk.getString(idx[0]++);
          byte[] b = new byte[hex.length() / 2];
          for (int i = 0; i < b.length; i++) b[i] = (byte) Integer.parseInt(hex.substring(2 * i, 2 * i + 2), 16);
          android.bluetooth.BluetoothGattService sv = gt.getService(java.util.UUID.fromString("0000ffe0-0000-1000-8000-00805f9b34fb"));
          android.bluetooth.BluetoothGattCharacteristic ch = sv == null ? null : sv.getCharacteristic(java.util.UUID.fromString("0000ffe1-0000-1000-8000-00805f9b34fb"));
          if (ch == null) { end(false, "controller service ffe0/ffe1 missing"); return; }
          ch.setWriteType(android.bluetooth.BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
          ch.setValue(b);
          if (!gt.writeCharacteristic(ch)) end(false, "write refused");
        } catch (Exception e) { end(false, String.valueOf(e.getMessage())); }
      }
      @Override public void onConnectionStateChange(android.bluetooth.BluetoothGatt gt, int st, int ns) {
        if (ns == BluetoothProfile.STATE_CONNECTED) gt.discoverServices();
        else if (ns == BluetoothProfile.STATE_DISCONNECTED) end(false, "disconnected early (status " + st + ")");
      }
      @Override public void onServicesDiscovered(android.bluetooth.BluetoothGatt gt, int st) { next(gt); }
      @Override public void onCharacteristicWrite(android.bluetooth.BluetoothGatt gt, android.bluetooth.BluetoothGattCharacteristic c, int st) {
        if (st != android.bluetooth.BluetoothGatt.GATT_SUCCESS) end(false, "write failed " + st); else next(gt);
      }
    };
    ui.postDelayed(() -> { if (ledBusy) { ledBusy = false; try { if (g[0] != null) { g[0].disconnect(); g[0].close(); } } catch (Exception ignored) {} if (!done[0]) { done[0] = true; sp.edit().remove("mac").apply(); reply(id, false, "LED controller timed out"); } } }, 12000);
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
