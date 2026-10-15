STATUS: done
TIME: 2026-10-15T13:51:04Z
REQUEST: Read the truck dongle ASAP, but only when the Owner's phone is in range and the engine is running or the truck is moving
RESULT:
Owner, the rule you described was already how the read works: the phone does the reading, so if you are out of range nothing is scanned and no departure questions fire. I made it faster on top of the quick engine check added earlier. Jarvis now reads the dongle right away when the app connects and when your phone starts moving, instead of waiting for the next timer. If someone else starts the truck while you are away, nothing happens. This part is server only and goes live on the Railway deploy. The quick engine check from the earlier request still needs the new APK. I could not test it on the real truck.
