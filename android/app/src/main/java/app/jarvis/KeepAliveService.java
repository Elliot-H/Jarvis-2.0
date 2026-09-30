package app.jarvis;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.IBinder;

/** A quiet "Jarvis is running" notification. It keeps Android from killing the app while the screen is off. */
public class KeepAliveService extends Service {
  @Override public int onStartCommand(Intent intent, int flags, int startId) {
    NotificationManager nm = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
    nm.createNotificationChannel(new NotificationChannel("keepalive", "Jarvis running", NotificationManager.IMPORTANCE_MIN));
    PendingIntent pi = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
    Notification n = new Notification.Builder(this, "keepalive")
        .setSmallIcon(R.drawable.ic_stat).setContentTitle("Jarvis").setContentText("At your service").setContentIntent(pi).setOngoing(true).build();
    try {
      if (Build.VERSION.SDK_INT >= 29) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE);
      else startForeground(1, n);
    } catch (Exception e) { stopSelf(); }
    return START_STICKY;
  }
  @Override public IBinder onBind(Intent i) { return null; }
}
