STATUS: done
TIME: 2026-10-01T04:12:39Z
REQUEST: music turned back on by itself when asking about maintenance status; stop it
RESULT:
Owner, I found it. Checking maintenance status and redeploys never start music on the server; the culprit was the phone app's auto-resume after the microphone closes.
After you said off, its do-not-resume window lasted only two minutes, so a later mic opening could press Play. Now an off, pause or stop sticks until you explicitly ask for music again, and stale resumes are ignored.
This is an app change, so you need to reinstall the APK to get it. The server side needs nothing.
