STATUS: done
TIME: 2026-10-03T17:23:58Z
REQUEST: Fix the leaving-a-saved-place departure trigger that failed on Oct 2.
RESULT:
Owner, the engine-start question and the leave-the-perimeter trigger were already in place from last night. I closed two remaining gaps.
Jarvis now treats a truck parked just outside the shop's edge as still at the shop, so the "leaving the shop, or headed somewhere" question names the shop.
A quick key-off and restart between two engine checks is now caught from the engine run-time reading, then it asks and reads the bring list and leave reminders.
The server part goes live on the Railway redeploy. The run-time reading needs an APK rebuild and reinstall, which I could not compile here; until then it behaves as before.
