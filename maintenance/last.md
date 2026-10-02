STATUS: done
TIME: 2026-10-02T16:53:26Z
REQUEST: Owner hears only the short acknowledgement, not the full spoken reply; fix voice playback.
RESULT:
Owner, I found the cause. The app was almost certainly stuck in silent, text-only mode, which sends full replies to the comms log with no voice. Saying "stop talking" or "be quiet" switched it on, it is remembered, and the short acknowledgement ignored it, so that was the only thing you heard.
I fixed three things. Those two phrases no longer turn silent mode on. The acknowledgement now respects silent mode. Opening the app always turns silent mode off, so reopening it brings the voice back.
Replies still go through the Fish JARVIS voice, and only replies over about 2500 characters are cut for speech. It goes live when Railway redeploys, and no APK reinstall is needed. Just close and reopen the app after the deploy.
