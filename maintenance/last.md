STATUS: done
TIME: 2026-10-26T22:11:06Z
REQUEST: Stop presenting stored vehicle data as live; run the vehicle-data offer on every departure from a saved place
RESULT:
Done, Owner. Jarvis now treats a vehicle reading as live only if a scan succeeded in the last few minutes; anything else is labelled as a stored reading with its date and never quoted as current. If Bluetooth is off or the dongle is silent, he says so and names the reason instead of reusing old numbers. The departure sequence already ran on any saved place; the offer is now "Sir, I've connected to the vehicle, would you like the vehicle data?", said only after a real connection. On yes he does a fresh full scan, reads it out, and asks if you want a new trouble code explained. It goes live on the next Railway deploy, no APK reinstall. I could only syntax-check it, so tell me if it misbehaves.
