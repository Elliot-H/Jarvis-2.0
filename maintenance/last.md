STATUS: done
TIME: 2026-10-04T16:58:55Z
REQUEST: Fix arrival vs departure logic (no "safe travels" on arrival, no departure checklist on arrival, no all-places "where headed")
RESULT:
Owner, an arrival like "I am at the Camden house now" is now recognised as an arrival. Jarvis welcomes you, mentions or clears the bring items for that place, and never says safe travels. The leftover departure question is closed, and Jarvis no longer asks the checklist again when you arrive. The vehicle-start question now offers only the one guessed place instead of listing all three. It is live after Railway redeploys; no APK reinstall is needed.
