STATUS: done
TIME: 2026-10-02T23:58:00Z
REQUEST: Fix the vehicle-start / leaving-a-saved-place departure announcement that failed to fire
RESULT:
Owner, found the cause: the vehicle-start trigger ignored a restart within 30 minutes of the engine last running, so shutting off and restarting at the shop never fired. It now counts any start after a shutdown or dongle dropout.
The plain leaving-a-place announcement now always fires, even in quiet hours, and is also pushed to your phone so it reaches you when the app is in the background. It is no longer silenced by an unanswered vehicle-start question.
Every departure decision, fired or skipped, with the reason is logged and visible at slash api slash depart-log.
Goes live when Railway deploys. No APK reinstall needed. Only syntax checked, not tested with the real dongle.
