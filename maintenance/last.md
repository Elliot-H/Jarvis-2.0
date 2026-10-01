STATUS: done
TIME: 2026-10-01T15:26:29Z
REQUEST: Fix comings and goings detection (arrive/leave remarks not spoken, stuck at Home)
RESULT:
Found the cause, Owner. Jarvis only spoke on arriving or leaving when a reminder matched, so Home and other places with no reminders were silent. Now every arrival and departure gets one short line, except in quiet hours. With the app open, location is now sent every minute instead of every ten. This goes live when Railway redeploys, and no APK reinstall is needed. I could not test the phone's background reports from here, so if he still reads as at Home after leaving with the app closed, check that Jarvis has location permission and unrestricted battery.
