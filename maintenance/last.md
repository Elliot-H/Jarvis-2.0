STATUS: done
TIME: 2026-10-12T13:58:22Z
REQUEST: Fix travel questions: capture the answered destination, stop re-asking, tailor lines, trigger departure promptly
RESULT:
Fixed, Owner. When you answer where you are headed, Jarvis now saves it for the whole trip, whether it is home, the shop, the Camden house or any other place.
He stops asking again, and his lines follow that destination: bring list, reminders, Maps ETA, and today's jobs for the shop.
The saved destination clears when you arrive. The engine-start check now runs every minute instead of two, so the question comes sooner.
This is a server change and goes live with the Railway deploy; no APK reinstall. I only syntax-checked it and could not run it end to end here, so please test it on the next drive.
