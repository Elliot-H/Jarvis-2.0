STATUS: done
TIME: 2026-10-03T15:05:00Z
REQUEST: Add Google Maps navigation awareness (maps_nav_status, heading_to and arrival hooks), read-only
RESULT:
Jarvis now has a read-only maps_nav_status tool that reports whether you are navigating, the destination, ETA and last update. A new trip to a saved place acts like heading there: he reads the bring list and heads-up, and arrival clears it and fires the arrive event. It goes live when Railway redeploys, but you must set up one Tasker profile first: watch Maps notifications and post them to Jarvis, steps are at the nav-setup page. No APK reinstall is needed. I tested it with simulated notifications only, not a real Maps one.
