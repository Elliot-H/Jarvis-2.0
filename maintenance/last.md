STATUS: done
TIME: 2026-10-01T20:29:05Z
REQUEST: Fix the mic button / push-to-talk so tapping it actually captures audio like the wake word.
RESULT:
Owner, I found the cause. When you tapped the mic, the app told the wake word engine to stop and opened the recognizer half a second later, but the engine had not released the microphone yet, so the recognizer heard nothing. It now waits until the wake engine confirms it let go. Tapping the mic while it is really listening now stops it cleanly. This is a page-only change, so it goes live with the Railway deploy and no APK reinstall is needed. I could not test on a real phone from here.
