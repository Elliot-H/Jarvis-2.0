package app.jarvis;

import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.InputStream;
import java.io.OutputStream;
import java.util.UUID;

/**
 * Reads a paired ELM327 Bluetooth OBD dongle (the classic kind you pair in phone settings, PIN 1234 or 0000).
 * The page calls AndroidObd.scan(id, nameOrAddress); the answer comes back as window.__obd(id, json).
 * Read-only except clearCodes, which the server only sends after the Owner says so.
 */
public class ObdBridge {
  private static final UUID SPP = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");
  private final Context ctx; private final WebView web;
  private volatile boolean busy = false;

  ObdBridge(Context c, WebView w) { ctx = c; web = w; }

  @JavascriptInterface public void scan(final String id, final String dongle) { run(id, dongle, false); }
  @JavascriptInterface public void clearCodes(final String id, final String dongle) { run(id, dongle, true); }

  private void run(final String id, final String dongle, final boolean clear) {
    if (busy) { reply(id, err("busy", "Another vehicle scan is running.")); return; }
    busy = true;
    new Thread(() -> {
      BluetoothSocket s = null;
      try {
        BluetoothAdapter ad = ((BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE)).getAdapter();
        if (ad == null || !ad.isEnabled()) { reply(id, err("bt_off", "Bluetooth is off on the phone.")); return; }
        BluetoothDevice dev = null;
        for (BluetoothDevice d : ad.getBondedDevices()) {
          String n = d.getName() == null ? "" : d.getName();
          if (d.getAddress().equalsIgnoreCase(dongle) || (!dongle.isEmpty() && n.toLowerCase().contains(dongle.toLowerCase()))) { dev = d; break; }
        }
        if (dev == null) { reply(id, err("not_paired", "No paired Bluetooth device matches \"" + dongle + "\". Pair the OBD dongle in the phone's Bluetooth settings first.")); return; }
        try { ad.cancelDiscovery(); } catch (Exception ignored) {}
        s = dev.createRfcommSocketToServiceRecord(SPP);
        try { s.connect(); }
        catch (Exception e) {
          try { s.close(); } catch (Exception ignored) {}
          try { s = (BluetoothSocket) dev.getClass().getMethod("createRfcommSocket", int.class).invoke(dev, 1); s.connect(); } // some clones only answer on channel 1
          catch (Exception e2) { reply(id, err("out_of_range", "Could not reach the dongle (out of range, or the vehicle is off and it is asleep).")); return; }
        }
        InputStream in = s.getInputStream(); OutputStream out = s.getOutputStream();
        for (String c : new String[]{"ATZ", "ATE0", "ATL0", "ATS0", "ATH0", "ATSP0"}) cmd(in, out, c, c.equals("ATZ") ? 2500 : 1500);
        JSONObject r = new JSONObject().put("ok", true).put("dongle", dev.getName());
        String volts = cmd(in, out, "ATRV", 1500).replaceAll("[^0-9.]", "");
        if (!volts.isEmpty()) r.put("volts", Double.parseDouble(volts));
        if (clear) {
          String c = cmd(in, out, "04", 5000);
          r.put("cleared", c.contains("44"));
          reply(id, r); return;
        }
        String vin = vin(cmd(in, out, "0902", 5000)); if (vin != null) r.put("vin", vin);
        int[] st = bytes(cmd(in, out, "0101", 4000), "4101", 4);
        boolean ecu = st != null;
        r.put("ecu", ecu);
        if (ecu) {
          r.put("mil", (st[0] & 0x80) != 0).put("dtcCount", st[0] & 0x7F);
          r.put("dtcs", dtcs(cmd(in, out, "03", 5000), "43"));
          r.put("pending", dtcs(cmd(in, out, "07", 5000), "47"));   // seen once, light not on (yet)
          r.put("readiness", readiness(st));
          JSONObject trims = new JSONObject();
          String[][] tp = {{"0106", "stft1"}, {"0107", "ltft1"}, {"0108", "stft2"}, {"0109", "ltft2"}};
          for (String[] q : tp) { int[] v = bytes(cmd(in, out, q[0], 2500), "41" + q[0].substring(2), 1); if (v != null) trims.put(q[1], Math.round((v[0] - 128) * 1000 / 128.0) / 10.0); }
          if (trims.length() > 0) r.put("trims", trims);
          // Freeze frame (frame 0): the snapshot saved when the light came on
          int[] ffd = bytes(cmd(in, out, "020200", 3000), "420200", 2);
          if (ffd != null && (ffd[0] | ffd[1]) != 0) {
            JSONObject ff = new JSONObject().put("code", code(ffd[0], ffd[1]));
            int[] v;
            if ((v = bytes(cmd(in, out, "020400", 2500), "420400", 1)) != null) ff.put("loadPct", Math.round(v[0] * 100 / 255.0));
            if ((v = bytes(cmd(in, out, "020500", 2500), "420500", 1)) != null) ff.put("coolantC", v[0] - 40);
            if ((v = bytes(cmd(in, out, "020C00", 2500), "420C00", 2)) != null) ff.put("rpm", (v[0] * 256 + v[1]) / 4);
            if ((v = bytes(cmd(in, out, "020D00", 2500), "420D00", 1)) != null) ff.put("kmh", v[0]);
            if ((v = bytes(cmd(in, out, "020600", 2500), "420600", 1)) != null) ff.put("stft1", Math.round((v[0] - 128) * 1000 / 128.0) / 10.0);
            if ((v = bytes(cmd(in, out, "020700", 2500), "420700", 1)) != null) ff.put("ltft1", Math.round((v[0] - 128) * 1000 / 128.0) / 10.0);
            r.put("freezeFrame", ff);
          }
          int[] f = bytes(cmd(in, out, "012F", 3000), "412F", 1); if (f != null) r.put("fuelPct", Math.round(f[0] * 100 / 255.0));
          int[] t = bytes(cmd(in, out, "0105", 3000), "4105", 1); if (t != null) r.put("coolantC", t[0] - 40);
          int[] rp = bytes(cmd(in, out, "010C", 3000), "410C", 2); if (rp != null) r.put("rpm", (rp[0] * 256 + rp[1]) / 4);
          int[] sp = bytes(cmd(in, out, "010D", 3000), "410D", 1); if (sp != null) r.put("speedKph", sp[0]);
          int[] d = bytes(cmd(in, out, "0131", 3000), "4131", 2); if (d != null) r.put("kmSinceClear", d[0] * 256 + d[1]);
        }
        reply(id, r);
      } catch (SecurityException e) {
        reply(id, err("permission", "Jarvis needs the Nearby devices (Bluetooth) permission."));
      } catch (Exception e) {
        reply(id, err("error", String.valueOf(e.getMessage())));
      } finally {
        try { if (s != null) s.close(); } catch (Exception ignored) {}
        busy = false;
      }
    }).start();
  }

  // Send one command, read until the ELM ">" prompt (or timeout). Returns the cleaned reply.
  private static String cmd(InputStream in, OutputStream out, String c, long timeout) throws Exception {
    while (in.available() > 0) in.read();
    out.write((c + "\r").getBytes()); out.flush();
    StringBuilder b = new StringBuilder(); long end = System.currentTimeMillis() + timeout;
    while (System.currentTimeMillis() < end) {
      if (in.available() > 0) { int ch = in.read(); if (ch == '>') break; b.append((char) ch); }
      else Thread.sleep(15);
    }
    return b.toString().replace("SEARCHING...", "").replaceAll("\\s", "").toUpperCase();
  }
  private static int[] bytes(String r, String head, int n) {
    int i = r.indexOf(head); if (i < 0 || r.length() < i + head.length() + n * 2) return null;
    int[] o = new int[n]; for (int k = 0; k < n; k++) o[k] = Integer.parseInt(r.substring(i + head.length() + k * 2, i + head.length() + k * 2 + 2), 16);
    return o;
  }
  private static String code(int b0, int b1) {
    String[] sys = {"P", "C", "B", "U"};
    return sys[b0 >> 6] + ((b0 >> 4) & 3) + Integer.toHexString(b0 & 15).toUpperCase() + String.format("%02X", b1);
  }
  // Emissions monitors from 0101 bytes B, C, D: which are supported and which have not finished ("not ready").
  private static JSONObject readiness(int[] st) {
    JSONObject o = new JSONObject(); JSONArray ok = new JSONArray(), not = new JSONArray();
    try {
      String[] cont = {"misfire", "fuel system", "components"};
      for (int b = 0; b < 3; b++) if ((st[1] & (1 << b)) != 0) ((st[1] & (1 << (b + 4))) != 0 ? not : ok).put(cont[b]);
      boolean diesel = (st[1] & 8) != 0;
      String[] gas = {"catalyst", "heated catalyst", "evap", "secondary air", "A/C", "O2 sensor", "O2 heater", "EGR"};
      if (!diesel) for (int b = 0; b < 8; b++) if ((st[2] & (1 << b)) != 0) ((st[3] & (1 << b)) != 0 ? not : ok).put(gas[b]);
      o.put("ready", ok).put("notReady", not);
    } catch (Exception ignored) {}
    return o;
  }
  // Mode 03/07 reply: "43"/"47" then 2-byte codes (CAN replies may carry a count byte). Zero pairs are padding.
  private static JSONArray dtcs(String r, String head) {
    JSONArray a = new JSONArray(); int i = r.indexOf(head); if (i < 0) return a;
    String d = r.substring(i + 2).replaceAll("[^0-9A-F]", "");
    if (d.length() % 4 == 2) d = d.substring(2);
    String[] sys = {"P", "C", "B", "U"};
    for (int k = 0; k + 4 <= d.length(); k += 4) {
      String w = d.substring(k, k + 4); if (w.equals("0000")) continue;
      int b0 = Integer.parseInt(w.substring(0, 2), 16);
      String code = sys[b0 >> 6] + ((b0 >> 4) & 3) + Integer.toHexString(b0 & 15).toUpperCase() + w.substring(2);
      boolean dup = false; for (int j = 0; j < a.length(); j++) if (a.optString(j).equals(code)) dup = true;
      if (!dup) a.put(code);
    }
    return a;
  }
  private static String vin(String r) {
    int i = r.indexOf("4902"); if (i < 0) return null;
    StringBuilder v = new StringBuilder();
    String hex = r.substring(i).replaceAll("[0-9]:", "").replace("4902", "");
    for (int k = 0; k + 2 <= hex.length(); k += 2) {
      int c = Integer.parseInt(hex.substring(k, k + 2), 16);
      if (c >= '0' && c <= 'Z' && Character.isLetterOrDigit(c)) v.append((char) c);
    }
    return v.length() >= 17 ? v.substring(v.length() - 17) : null;
  }
  private static JSONObject err(String code, String detail) {
    try { return new JSONObject().put("ok", false).put("code", code).put("detail", detail); } catch (Exception e) { return new JSONObject(); }
  }
  private void reply(String id, JSONObject r) {
    web.post(() -> web.evaluateJavascript("window.__obd&&window.__obd(" + JSONObject.quote(id) + "," + JSONObject.quote(r.toString()) + ")", null));
  }
}
