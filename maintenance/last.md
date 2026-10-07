STATUS: done
TIME: 2026-10-07T23:55:00Z
REQUEST: Notification says "I have a question for you" but when opened, Jarvis never asks it
RESULT:
Owner, the question was being held and only spoken inside the startup greeting. Tapping the notification usually just brought the already-running app back to the front, which never sends that greeting, so the question was dropped.
Now the app tells Jarvis every time it comes back to the front or reconnects, and he asks whatever is waiting right away. The question also restarts its answer window, so your yes or no counts.
Held lines are now saved to disk (a redeploy no longer erases them), several can queue instead of the newest wiping the older one, and a question keeps for 45 minutes instead of 10.
Also fixed the notification's "open" link, which pointed at the wrong app package.
Goes live on the next Railway build, no APK reinstall. Server boot smoke-tested; not tested on the phone.
