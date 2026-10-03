STATUS: done
TIME: 2026-10-03T15:20:57Z
REQUEST: Consolidate all driving behaviour into one travel protocol module with the co-pilot inside it; fix the missed leaving-the-shop line
RESULT:
Owner, driving is now one travel protocol in the server. One shared detector, a live Maps trip and or the truck engine running, drives the engine-start question, bring lists, leave and heading reminders, the departure checklist, arrival lines, and the meal co-pilot as a part inside it.
The leaving-the-shop miss is fixed: a Maps or engine-start departure used to mark the leave as handled without saying anything. Now every departure always says Leaving the shop, sir, first.
Only syntax checked, not tested on the road. No APK reinstall. This was pushed to the Claude working branch, not main, so it is not live on Railway until it is merged to main.
