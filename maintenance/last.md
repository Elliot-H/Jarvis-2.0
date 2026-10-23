STATUS: needs-owner
TIME: 2026-10-23T01:50:00Z
REQUEST: Add a developer role/mode (MyGuru only) with developer_request and developer_status tools
RESULT:
Owner, the developer mode is built: Jarvis now has developer_request and developer_status, which work like the maintenance ones but hand off to a separate MyGuru engineer session. It goes live on the next Railway deploy, no APK reinstall. It needs you once: create a MyGuru Claude Code routine on claude.ai/code and put its ID and token in Railway as DEV_ROUTINE_ID and DEV_ROUTINE_TOKEN. Until then Jarvis will say developer mode is not connected. No separate voice is needed, replies come back in Jarvis's voice. The earlier voice-intercom idea was never in the code, so there was nothing to undo.
