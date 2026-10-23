STATUS: done
TIME: 2026-10-23T01:45:08Z
REQUEST: Add a "developer" role so the Owner can relay messages to and from his Claude Code Figma session
RESULT:
Owner, the developer role is added. Say "ask the developer" or "tell the developer" and Jarvis queues your message; the reply is spoken as "The developer says" and shows on the HUD in amber as DEVELOPER, while Jarvis keeps his own voice. It works by typing too, so the mic fault does not block it. The channel is a small mailbox on Jarvis behind the normal PIN login: the Claude Code session signs in with the PIN, then reads messages at /api/dev/outbox and answers at /api/dev/reply. I did not add a token shortcut around the PIN, because that is a security change for you to decide. It is not tested against a live session, and the page reloads with the deploy, so no APK reinstall is needed.
