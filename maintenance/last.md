STATUS: needs-owner
TIME: 2026-10-04T20:40:00Z
REQUEST: Fix silent/Death Mode lock (no voice, re-enters silent, mic beeping)
RESULT:
Owner, silent mode was saved in the phone backup and the full-mute version also muted the mic, so voice stayed off and came back on every restore. Now silent mode is never restored or kept across restarts, opening the app ends it, and it no longer mutes the mic. "Death mode" and "death mode off" work by voice. I could not see behaviour logs, so I could not confirm the beeping source, but the mute loop is gone and app chimes are off by default. The fix is on branch claude/laughing-allen-vvkah8, not main, so it needs merging to main to go live. No APK reinstall needed. Syntax-checked only.
