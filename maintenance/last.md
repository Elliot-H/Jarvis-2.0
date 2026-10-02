STATUS: done
TIME: 2026-10-02T16:25:49Z
REQUEST: Remove the "Jarvis does not place stops for you" disclaimer from all outgoing alerts and messages.
RESULT:
Owner, I removed the "Informational only: Jarvis does not trade or place stops for you" sentence from all three alert templates, in server.js and alerts.js. Buy-watch alerts, news alerts and the standard alerts no longer carry it. It goes live when the server restarts on the new commit. No APK reinstall is needed.
