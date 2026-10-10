package app.jarvis;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.speech.tts.TextToSpeech;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import android.os.IBinder;
import android.os.Looper;
import android.webkit.CookieManager;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Locale;

/**
 * A quiet "Jarvis is running" notification. It keeps Android from killing the app while the screen is off, and (when
 * location is allowed) reports the phone's position to Jarvis whenever it has moved about 100 m, so Jarvis sees him
 * arrive at and leave his places even with the app in the background. Low battery: network/fused fixes, at most one a minute.
 */
public class KeepAliveService extends Service {
  private LocationManager lm;
  private final LocationListener listener = this::report;
  private long lastSent = 0;
  private final Handler hnd = new Handler(Looper.getMainLooper());
  private boolean sayLoop = false;
  private TextToSpeech tts;
  // Lines Jarvis wants spoken while the app screen is closed (arrivals, leaving): asked for every 12 s, plus right after each position report.
  private final Runnable sayPoll = new Runnable() { @Override public void run() { pollOnce(); hnd.postDelayed(this, 12_000); } };

  @Override public int onStartCommand(Intent intent, int flags, int startId) {
    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    nm.createNotificationChannel(new NotificationChannel("keepalive", "Jarvis running", NotificationManager.IMPORTANCE_MIN));
    PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
    Notification n = new Notification.Builder(this, "keepalive")
        .setSmallIcon(R.drawable.ic_stat).setContentTitle("Jarvis").setContentText("At your service").setContentIntent(pi).setOngoing(true).build();
    boolean loc = checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    try {
      if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE | (loc ? ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION : 0));
      else startForeground(1, n);
    } catch (Exception e) {
      try { if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE); else startForeground(1, n); loc = false; }
      catch (Exception e2) { stopSelf(); return START_NOT_STICKY; }
    }
    if (loc) startLocation();
    if (!sayLoop) { sayLoop = true; hnd.postDelayed(sayPoll, 5_000); }
    return START_STICKY;
  }

  private void startLocation() {
    if (lm != null) return;
    try {
      lm = (LocationManager) getSystemService(LOCATION_SERVICE);
      String p = Build.VERSION.SDK_INT >= 31 && lm.hasProvider(LocationManager.FUSED_PROVIDER) ? LocationManager.FUSED_PROVIDER
          : lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER : LocationManager.GPS_PROVIDER;
      lm.requestLocationUpdates(p, 30_000L, 50f, listener, Looper.getMainLooper());
      Location last = lm.getLastKnownLocation(p);
      if (last != null) report(last);
    } catch (SecurityException | IllegalArgumentException e) { lm = null; }
  }

  private void report(Location l) {
    long now = System.currentTimeMillis();
    if (now - lastSent < 25_000) return;
    lastSent = now;
    final String body = String.format(Locale.US, "{\"lat\":%.6f,\"lon\":%.6f,\"acc\":%.0f,\"speed\":%.1f}", l.getLatitude(), l.getLongitude(), l.getAccuracy(), l.hasSpeed() ? l.getSpeed() : -1f);
    new Thread(() -> {
      try {
        String base = BuildConfig.BASE_URL;
        HttpURLConnection c = (HttpURLConnection) new URL(base + "/api/loc").openConnection();
        c.setRequestMethod("POST"); c.setDoOutput(true); c.setConnectTimeout(10_000); c.setReadTimeout(10_000);
        c.setRequestProperty("Content-Type", "application/json");
        String ck = CookieManager.getInstance().getCookie(base);
        if (ck != null) c.setRequestProperty("Cookie", ck);
        try (OutputStream o = c.getOutputStream()) { o.write(body.getBytes(StandardCharsets.UTF_8)); }
        c.getResponseCode(); c.disconnect();
      } catch (Exception ignored) {}
      hnd.postDelayed(this::pollOnce, 3_000); hnd.postDelayed(this::pollOnce, 8_000);
    }).start();
  }

  private String cookieFor(String base) { try { return CookieManager.getInstance().getCookie(base); } catch (Exception e) { return null; } }

  private void pollOnce() {
    new Thread(() -> {
      try {
        String base = BuildConfig.BASE_URL;
        HttpURLConnection c = (HttpURLConnection) new URL(base + "/api/say-next").openConnection();
        c.setConnectTimeout(8_000); c.setReadTimeout(20_000);
        String ck = cookieFor(base); if (ck != null) c.setRequestProperty("Cookie", ck);
        if (c.getResponseCode() != 200) { c.disconnect(); return; }
        JSONObject j = new JSONObject(new String(readAll(c.getInputStream()), StandardCharsets.UTF_8)); c.disconnect();
        String text = j.optString("text", ""), clip = j.optString("clip", "");
        if (text.isEmpty()) return;
        File f = null;
        if (!clip.isEmpty()) {
          try {
            HttpURLConnection d = (HttpURLConnection) new URL(base + clip).openConnection();
            d.setConnectTimeout(8_000); d.setReadTimeout(20_000);
            if (ck != null) d.setRequestProperty("Cookie", ck);
            if (d.getResponseCode() == 200) { f = new File(getCacheDir(), "say.mp3"); try (FileOutputStream o = new FileOutputStream(f)) { o.write(readAll(d.getInputStream())); } }
            d.disconnect();
          } catch (Exception e) { f = null; }
        }
        final File ff = f; final String tx = text;
        hnd.post(() -> speak(tx, ff));
      } catch (Exception ignored) {}
    }).start();
  }

  private static byte[] readAll(InputStream in) throws Exception {
    ByteArrayOutputStream b = new ByteArrayOutputStream(); byte[] buf = new byte[8192]; int n;
    while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
    in.close(); return b.toByteArray();
  }

  // Say it aloud: the Jarvis-voice clip when we have it, else the phone's own voice. Music ducks while he talks.
  private void speak(String text, File clip) {
    final AudioManager am = (AudioManager) getSystemService(AUDIO_SERVICE);
    final AudioAttributes at = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_ASSISTANCE_NAVIGATION_GUIDANCE).setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build();
    final AudioFocusRequest fr = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK).setAudioAttributes(at).build();
    am.requestAudioFocus(fr);
    final Runnable done = () -> { try { am.abandonAudioFocusRequest(fr); } catch (Exception ignored) {} };
    if (clip != null && clip.exists()) {
      try {
        MediaPlayer mp = new MediaPlayer();
        mp.setAudioAttributes(at); mp.setDataSource(clip.getAbsolutePath()); mp.prepare();
        mp.setOnCompletionListener(m -> { m.release(); done.run(); });
        mp.setOnErrorListener((m, w, e) -> { m.release(); done.run(); return true; });
        mp.start(); return;
      } catch (Exception ignored) {}
    }
    final String say = text;
    tts = new TextToSpeech(this, st -> {
      if (st != TextToSpeech.SUCCESS || tts == null) { done.run(); return; }
      try { tts.setAudioAttributes(at); } catch (Exception ignored) {}
      tts.speak(say, TextToSpeech.QUEUE_FLUSH, null, "jarvis");
      hnd.postDelayed(() -> { try { tts.shutdown(); } catch (Exception ignored) {} done.run(); }, 20_000);
    });
  }

  @Override public void onDestroy() { hnd.removeCallbacksAndMessages(null); try { if (lm != null) lm.removeUpdates(listener); } catch (Exception ignored) {} super.onDestroy(); }
  @Override public IBinder onBind(Intent i) { return null; }
}
