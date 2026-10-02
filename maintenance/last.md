STATUS: done
TIME: 2026-10-02T23:31:41Z
REQUEST: Wire the vehicle-start "leaving" trigger into the traveling protocol (truck/R8 OBD)
RESULT:
This is already built and live, Owner, so I changed no code.
When the OBD dongle sees the engine running after the vehicle has sat for 30 minutes, Jarvis asks once per drive: "Are you leaving the shop, or headed somewhere?" with a few saved places.
If you name a saved place, he gives the leave reminders for where you are, then that place's bring list and heading reminders, in one to three short sentences. If you just say leaving, you get the leave reminders for your current place.
It needs a known location and the phone app connected. The truck dongle OBDII is seeded; the R8 only works once you pair its dongle and say add vehicle R8. No APK reinstall needed.
