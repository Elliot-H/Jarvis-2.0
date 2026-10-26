STATUS: done
TIME: 2026-10-26T23:15:00Z
REQUEST: Rework vehicle-data prompt: fire on engine start anywhere, dynamic wording, second ask when leaving an area
RESULT:
Done, Owner. The vehicle-data question now fires on its own when the truck's engine starts and a live scan works, anywhere, within about 3 seconds, or 40 seconds if the where-to-question is also asked. The wording rotates and uses live fuel, battery volts or code count. When GPS shows you leaving a place, he asks again: first-time wording if you were never asked, or a short follow-up like "Still want that vehicle data, sir?" if you were. No nagging within 4 minutes, and none after a yes. Live-only honesty is unchanged. It goes live on the next Railway deploy, no APK reinstall. I could only syntax-check it, so tell me if it misbehaves.
