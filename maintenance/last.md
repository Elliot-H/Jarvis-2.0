STATUS: done
TIME: 2026-11-09T20:45:00Z
REQUEST: Fix duplicate replies and mid-command cut-off; review Bluetooth/OBD interference.
RESULT:
Fixed the two priority bugs, Owner. Each spoken line is now delivered once: the server and the app both drop an identical reply that arrives within 20 seconds of the same one. Jarvis also no longer speaks over you or commits half a command: if you are mid-sentence, his reply waits, and the app keeps your words and waits for your pause instead of sending a cut-off command when the mic session ends. This is live after the Railway deploy, no APK reinstall needed. I did not change the Bluetooth and OBD dongle logic; I could not test it without the hardware, so the wrong readings are still unexplained and need a live look at the Activity log.
