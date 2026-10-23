STATUS: done
TIME: 2026-10-23T01:50:32Z
REQUEST: Add a "developer" role so the Owner can relay messages to and from his Claude Code Figma session
RESULT:
Owner, I added a live developer chat next to the developer mode built a few minutes earlier. Say "ask the developer" and Jarvis queues your message; the reply is spoken as "The developer says" and shows on the HUD in amber as DEVELOPER, with Jarvis keeping his own voice. It works by typing too, so the mic fault does not block it. The Claude Code session signs in with the PIN, reads messages at /api/dev/outbox and answers at /api/dev/reply. I added no shortcut around the PIN, since that is a security change for you to decide. It is untested against a live session, goes live on the Railway deploy, and needs no APK reinstall.
