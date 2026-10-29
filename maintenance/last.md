STATUS: done
TIME: 2026-10-29T02:03:47Z
REQUEST: Voice (Fish Audio) outage contingency: backup voice, spoken notice, auto-restore, HUD indicator.
RESULT:
Done, Owner. If Fish Audio fails, times out or returns empty audio, Jarvis now voices that same line with the ElevenLabs backup voice, or the phone's own voice if that is not set up, so nothing is clipped or lost mid-reply. The first backup line opens by telling you the primary voice service is down and he is switching voices. He keeps testing Fish in the background and, when it answers again, says in one line that the primary voice is restored. The voice chip on the main screen turns amber and reads BACKUP VOICE while the backup is in use. It goes live after the Railway deploy, no APK reinstall needed. I tested the switch and recovery against a simulated 503, not the live Fish service.
