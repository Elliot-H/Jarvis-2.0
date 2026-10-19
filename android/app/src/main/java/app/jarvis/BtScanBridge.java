package app.jarvis;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanResult;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Handler;
import android.os.Looper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "What Bluetooth devices are around me?" Scans (classic discovery + low energy) for about 9 seconds and returns the NAMES it hears with a rough
 * signal strength. Names only: no addresses are kept or sent, and nothing is connected to. Answer comes back as window.__btscan(id, json).
 */
public class BtScanBridge {
  private final Context ctx; private final WebView web;
  private final Handler ui = new Handler(Looper.getMainLooper());
  private volatile boolean busy = false;

  BtScanBridge(Context c, WebView w) { ctx = c; web = w; }

  @JavascriptInterface public void scan(final String id) { ui.post(() -> run(id)); }

  private void run(final String id) {
    if (busy) { done(id, false, "A scan is already running.", null, 0); return; }
    try {
      BluetoothManager bm = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
      final BluetoothAdapter ad = bm == null ? null : bm.getAdapter();
      if (ad == null || !ad.isEnabled()) { done(id, false, "Bluetooth is off on the phone.", null, 0); return; }
      if (ctx.checkSelfPermission(android.Manifest.permission.BLUETOOTH_SCAN) != android.content.pm.PackageManager.PERMISSION_GRANTED && android.os.Build.VERSION.SDK_INT >= 31) { done(id, false, "The app does not have the Nearby devices permission.", null, 0); return; }
      busy = true;
      final Map<String, int[]> found = new LinkedHashMap<>();   // name -> {strongest rssi, kind 0=classic 1=low energy}
      final int[] unnamed = {0};
      final BroadcastReceiver rx = new BroadcastReceiver() {
        @Override public void onReceive(Context c, Intent i) {
          if (!BluetoothDevice.ACTION_FOUND.equals(i.getAction())) return;
          String n = i.getStringExtra(BluetoothDevice.EXTRA_NAME); int rssi = i.getShortExtra(BluetoothDevice.EXTRA_RSSI, (short) -100);
          add(found, unnamed, n, rssi, 0);
        }
      };
      final ScanCallback cb = new ScanCallback() {
        @Override public void onScanResult(int t, ScanResult r) {
          String n = null;
          try { if (r.getScanRecord() != null) n = r.getScanRecord().getDeviceName(); } catch (Exception ignored) {}
          if (n == null) { try { n = r.getDevice().getName(); } catch (Exception ignored) {} }
          add(found, unnamed, n, r.getRssi(), 1);
        }
      };
      try { ctx.registerReceiver(rx, new IntentFilter(BluetoothDevice.ACTION_FOUND)); } catch (Exception ignored) {}
      try { ad.startDiscovery(); } catch (Exception ignored) {}
      final BluetoothLeScanner le = ad.getBluetoothLeScanner();
      try { if (le != null) le.startScan(cb); } catch (Exception ignored) {}
      ui.postDelayed(() -> {
        try { ad.cancelDiscovery(); } catch (Exception ignored) {}
        try { if (le != null) le.stopScan(cb); } catch (Exception ignored) {}
        try { ctx.unregisterReceiver(rx); } catch (Exception ignored) {}
        JSONArray arr = new JSONArray();
        try { for (Map.Entry<String, int[]> e : found.entrySet()) arr.put(new JSONObject().put("name", e.getKey()).put("rssi", e.getValue()[0]).put("le", e.getValue()[1] == 1)); } catch (Exception ignored) {}
        busy = false;
        done(id, true, null, arr, unnamed[0]);
      }, 9000);
    } catch (Throwable t) { busy = false; done(id, false, String.valueOf(t.getMessage()), null, 0); }
  }

  private static void add(Map<String, int[]> m, int[] unnamed, String n, int rssi, int kind) {
    if (n == null || n.trim().isEmpty()) { unnamed[0]++; return; }
    synchronized (m) { int[] cur = m.get(n); if (cur == null) m.put(n, new int[]{rssi, kind}); else if (rssi > cur[0]) cur[0] = rssi; }
  }

  private void done(String id, boolean ok, String err, JSONArray devices, int unnamed) {
    try {
      JSONObject o = new JSONObject().put("ok", ok);
      if (err != null) o.put("detail", err);
      if (devices != null) o.put("devices", devices).put("unnamed", unnamed);
      final String js = "window.__btscan&&window.__btscan(" + JSONObject.quote(id) + "," + JSONObject.quote(o.toString()) + ")";
      ui.post(() -> web.evaluateJavascript(js, null));
    } catch (Exception ignored) {}
  }
}
