STATUS: done
TIME: 2026-10-09T14:33:37Z
REQUEST: Add silent/text-only mode and mic mute with voice triggers; note the maintenance credit error
RESULT:
Owner, silent mode and mic mute were already built, so I only widened the phrases.
Saying "no mic, no talk" now mutes the mic and switches to text only. "Talk again", "unmute" and "voice back on" now end silent mode.
Plain "mute" and "quiet mode" still mean quiet alerts, which I left alone. A muted mic cannot hear you, so wake it by tapping the mic button.
This goes live on the next Railway build, no APK reinstall. Syntax checked only.
The credit error is not fixable from the repo: please check that the Anthropic key behind the maintenance path in Railway has credit or is replaced.
