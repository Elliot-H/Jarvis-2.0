STATUS: done
TIME: 2026-10-09T14:45:00Z
REQUEST: Add "I need a minute" as a silent mode trigger and mute phone notifications while silent mode is on
RESULT:
Owner, "I need a minute", "give me a minute" and "need a minute" now turn on silent mode, and "voice back on" ends it.
While silent mode is on, every phone alert is held back, including Pushover, Telegram and ntfy, whatever phrase started it. Held alerts are dropped, not queued, and they come back when silent mode ends.
Silent mode still ends by itself after 8 hours. Plain "quiet mode" still means the separate quiet-alerts mode, which I left alone.
This goes live on the next Railway build, no APK reinstall. Syntax checked only.
