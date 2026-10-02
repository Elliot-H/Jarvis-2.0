STATUS: done
TIME: 2026-10-02T20:20:07Z
REQUEST: Watch list: show day % on every row, keep tickers until removed or bought (then move to holdings), persist across full app restarts.
RESULT:
Owner, every watch list row already shows its day percent, and the restart persistence fix from earlier is in place. The one new change is that when a watched ticker is bought, it is now removed from the watch list automatically and shows up in holdings. Tickers stay otherwise until you say remove. It goes live when Railway redeploys, and no APK reinstall is needed. I could only syntax-check it, not run it live. Durable storage across Railway wipes still relies on the phone backup, and a Railway volume would be more solid.
