package app.jarvis;

import android.service.notification.NotificationListenerService;

/**
 * Does nothing itself. Once the Owner grants Jarvis "Notification access" (Android Settings > Notifications > Device & app
 * notifications), Android lets the app read the active media sessions, which is how Jarvis checks what Spotify is really playing.
 */
public class JarvisNotificationListener extends NotificationListenerService {}
