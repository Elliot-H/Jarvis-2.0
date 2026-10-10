STATUS: done
TIME: 2026-10-10T16:05:00Z
REQUEST: Fix Jarvis's travel/departure statements (leaving-the-shop line never fired Oct 2, full departure sequence, review arrive/leave/heading-to prompts)
RESULT:
Owner, I found why the Oct 2 line stayed silent. After you turned the truck off and back on at the shop, Jarvis still treated the earlier departure answer as the current trip, so he asked nothing and said nothing when you left.
Now a key-off and restart while you are still at a saved place resets the trip, so the full sequence runs again: where are you headed, the bring list, then the short vehicle check offer, with the full scan read only if you say yes.
Leaving a saved place now always gets a short "Leaving the shop, sir." The engine-start question reads "Leaving the shop, sir? Where are you headed?", and the low-fuel wording is fixed.
It could not be tested on the real truck. It goes live after the Railway build, no APK reinstall.
