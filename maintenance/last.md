STATUS: done
TIME: 2026-10-23T17:00:25Z
REQUEST: Fix false departure/geofence trigger (repeat "you just left" prompts)
RESULT:
Owner, a departure now has to hold for three minutes before Jarvis treats it as real, so a quick glitch no longer counts. The same place is never announced as left twice within thirty minutes, which covers your store stop. If you say you did not leave, Jarvis acknowledges it once and will not ask where you are again for that trip. It goes live on the next Railway deploy, no APK reinstall needed. I could only test this with simulated checks, not real GPS.
