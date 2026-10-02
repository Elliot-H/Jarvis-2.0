STATUS: done
TIME: 2026-10-02T15:11:15Z
REQUEST: Voice mute toggle that mechanically stops the mic until manually tapped.
RESULT:
Owner, saying "stop listening", "mute the mic", "stop the mic" or "go deaf" now fully shuts down the speech recognizer, the wake word engine and the mic meter.
Jarvis says "Microphone muted" aloud, and the HUD shows a red MIC MUTED chip, a red MUTED core and a red mic button.
Only a tap on the mic button, the core, or the space bar wakes it, and a voice command cannot unmute; it stays muted even after a reload.
After the tap it listens normally and continuously again. It goes live when Railway redeploys from main. No APK reinstall needed. Tested by syntax check only, not on a phone.
