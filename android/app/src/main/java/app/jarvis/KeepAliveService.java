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
import android.os.Build;
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
    return START_STICKY;
  }

  private void startLocation() {
    if (lm != null) return;
    try {
      lm = (LocationManager) getSystemService(LOCATION_SERVICE);
      String p = Build.VERSION.SDK_INT >= 31 && lm.hasProvider(LocationManager.FUSED_PROVIDER) ? LocationManager.FUSED_PROVIDER
          : lm.isProviderEnabled(LocationManager.NETWORK_PROVIDER) ? LocationManager.NETWORK_PROVIDER : LocationManager.GPS_PROVIDER;
      lm.requestLocationUpdates(p, 60_000L, 100f, listener, Looper.getMainLooper());
      Location last = lm.getLastKnownLocation(p);
      if (last != null) report(last);
    } catch (SecurityException | IllegalArgumentException e) { lm = null; }
  }

  private void report(Location l) {
    long now = System.currentTimeMillis();
    if (now - lastSent < 45_000) return;
    lastSent = now;
    final String body = String.format(Locale.US, "{\"lat\":%.6f,\"lon\":%.6f,\"acc\":%.0f}", l.getLatitude(), l.getLongitude(), l.getAccuracy());
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
    }).start();
  }

  @Override public void onDestroy() { try { if (lm != null) lm.removeUpdates(listener); } catch (Exception ignored) {} super.onDestroy(); }
  @Override public IBinder onBind(Intent i) { return null; }
}
