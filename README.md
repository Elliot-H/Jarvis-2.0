# J.A.R.V.I.S. — Claude-powered voice assistant + HUD

Say **"Jarvis"**, talk, and it answers out loud in an ElevenLabs voice. It works from a full-screen, Iron-Man-style display. The brain is Claude (the Claude Agent SDK, which is Claude Code under the hood), so it can search the web, read files and use any connection (MCP) you give it.

## Setup (one time, ~5 min)

1. **Install Node.js LTS** from https://nodejs.org.
2. Unzip this folder somewhere permanent, e.g. `C:\Jarvis`.
3. Double-click **`start-jarvis.bat`** (on Mac or Linux, run `./start-jarvis.sh`). The first run installs everything and opens `.env` in Notepad.
4. In `.env`, fill in:
   - **Brain** (pick one):
     - `ANTHROPIC_API_KEY`: an API key from console.anthropic.com (pay per use).
     - `CLAUDE_CODE_OAUTH_TOKEN`: uses your Claude subscription. Run `npx @anthropic-ai/claude-code setup-token` in a terminal, log in, and paste the token it prints.
   - **Voice**: `ELEVENLABS_API_KEY` from elevenlabs.io (Profile → API Keys). The default voice is "George" (British male). For a different voice, copy any Voice ID from your ElevenLabs Voice Library into `ELEVENLABS_VOICE_ID`.
5. Save and double-click `start-jarvis.bat` again. Jarvis opens full-screen in Chrome (or Edge).
6. Click **INITIALIZE** once to allow the mic. After that it listens hands-free.

## Talking to it

| Say / do | What happens |
|---|---|
| "Jarvis, what's the weather in Dover tomorrow?" | Wake word plus a command in one breath |
| "Jarvis" … (chime) … "remind me what's on screen" | Wake word, then a pause; it listens for about 8 seconds |
| "Jarvis, wake up" / "Jarvis, I'm home" / "Jarvis, good morning" | Runs the wake-up briefing (`config/briefing.md`) |
| "Jarvis, stop" | Cuts it off |
| **SPACE**, the mic button, or clicking the reactor | Push-to-talk, or interrupt while it's speaking |
| Typing in the command bar | Same as speaking |
| **NEW** button (Comms Log) | Starts a fresh conversation (otherwise it remembers context) |

The reactor changes with its state: **cyan** = standby, **white** = listening, **amber** = thinking, pulsing to the voice = speaking.

## Running it in the cloud (use it from your phone, no PC)

1. Put this folder in a private GitHub repo.
2. At railway.app, choose **New Project → Deploy from GitHub repo** and pick the repo.
3. Under **Variables**, add `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` and `JARVIS_PIN` (the unlock PIN for your devices; it's required when Jarvis is online).
4. Under **Settings → Networking**, choose **Generate Domain**. Open that link in Chrome on your phone, enter the PIN, and tap INITIALIZE.

The wake word works while the Jarvis tab is open and the screen is on. Phones stop the mic when the screen locks.

## Self-repair

Jarvis can change and fix its own code: "Jarvis, make the reactor purple", "Jarvis, check your logs and fix the mic", "Jarvis, roll back your last change".

How it stays safe:
- It edits a copy of its code, then checks it: syntax, a scan for leaked keys, and a real startup test of the new version.
- It tells you what changed and asks **"Shall I deploy, sir?"**. Nothing goes live until you say yes in your next message.
- A deploy is a commit to GitHub, so Railway rebuilds (about 2 minutes). If the new version fails Railway's health check, the old one keeps running.
- "Roll back" restores the previous version.
- If the main screen ever breaks, open **/safe** on the same link. It's a plain backup screen where you can still type to Jarvis.
- Jarvis can't read its own keys, and it can only edit files in its code copy.

Setup: add `GITHUB_TOKEN` in Railway → Variables. Create it as a GitHub fine-grained token with access to only this repo and **Contents: Read and write**.

## Extra screens (office Pi, shop monitors, phone)

Open `http://<PC-IP>:7777/?display=1` on any device on the network. That gives a mirror of the HUD with no mic and no voice, which is right for your Jarvis V2 Pi kiosks (Chromium kiosk mode). Voice stays on the main PC.

## Customizing

- `config/persona.md`: how Jarvis talks (tone, "sir", response length).
- `config/briefing.md`: what the wake-up and scheduled briefings do.
- `config/mcp.json`: connections (Meta Ads, a real browser, etc.). Set `"enabled": true` to turn one on.
- `.env`: `WAKE_WORD`, `USER_TITLE`, `BRIEFING_EVERY_MINUTES`, `JARVIS_ALLOW_SHELL=1` (lets it run commands and edit files inside `./workspace`).

## Notes

- Voice recognition uses the browser's built-in speech engine, so use **Chrome or Edge**.
- While Jarvis is speaking it pauses the mic so it doesn't hear itself. Press SPACE to talk over it.
- With no ElevenLabs key it falls back to the computer's built-in voice. The **VOICE** chip on the top bar shows which one is active.
