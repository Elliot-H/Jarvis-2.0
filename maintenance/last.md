STATUS: done
TIME: 2026-10-05T21:15:02Z
REQUEST: Make the vehicle OBD dongle watch always-on, not only during shut-the-shop-down
RESULT:
Owner, the dongle watch was already separate from the shutdown protocol, but it was slow and paused whenever I was busy thinking. I now look for the truck and R8 dongles about every 45 seconds, any place and any hour, as long as the phone app is connected.
A running engine on first sight triggers the full departure sequence: where you are headed, the bring list, then the offer of the short vehicle check.
I also added log entries so I can see when the dongle is seen or when the phone app was asleep, which is the likely reason it was missed since October third.
It goes live on the next Railway build, no APK reinstall. Syntax-checked only, not tested on the truck.
