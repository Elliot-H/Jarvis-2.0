STATUS: done
TIME: 2026-10-03T15:25:33Z
REQUEST: Rework driving into one travel protocol: engine start asks leaving/heading, vehicle movement runs the full protocol; fix movement never firing.
RESULT:
Done, Owner. Engine start still asks where you are headed and gives the bring list. The full travel protocol, including the meal co-pilot, now runs only once the vehicle is really moving, using phone GPS speed or truck OBD speed.
The bug was that the truck was only checked every 20 minutes while running, one failed dongle read counted as engine off, and the phone sent no speed. Now it checks every 2 minutes, and if movement starts without the engine question being asked, it asks then.
The server side is live on deploy. Reinstall the APK to get faster location updates, phone speed and OBD speed. Without it, speed is worked out from location fixes. Not yet tested on a real drive.
