package app.jarvis;

import android.bluetooth.BluetoothA2dp;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.content.Context;
import android.content.Intent;
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
              Intent t = new Intent("net.dinglisch.android.tasker.ACTION_TASK");
              t.setPackage("net.dinglisch.android.tasker");
              t.putExtra("version_number", "1.0");
              t.putExtra("task_name", task);
              ctx.sendBroadcast(t);
            }
            if (System.currentTimeMillis() > deadline) { reply(id, false, "The speaker did not connect. Check that Tasker has a task named " + task + " and external access is on, and that the speaker is on and in range."); return; }
            ui.postDelayed(poll[0], 1500);
          }
          @Override public void onServiceDisconnected(int profile) {}
        }, BluetoothProfile.A2DP);
      } catch (SecurityException e) { reply(id, false, "Bluetooth permission was not granted to the Jarvis app."); }
    };
    poll[0].run();
  }
}
