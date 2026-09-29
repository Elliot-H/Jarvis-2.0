# Jarvis 2.0 — Handoff

Read this first. It lets a fresh Claude session (for example one opened from the Owner's own PC) pick up exactly where the last one stopped. No secrets are in this file; variable names only.

## Who and how
- The Owner (GitHub: Elliot-H) wants a personal Jarvis: Claude as the brain, an Iron-Man-style HUD, hands-free voice ("Jarvis" wake word), and the real Jarvis-sounding voice.
- Style: terse, direct, no preamble. Never over-explain. He is often on his phone, not at a PC.
- In any work document or deliverable, call him "Owner" or "MyGuru Admin". Never "Captn".
- He gets frustrated when he is told to do things Claude could do. Do everything possible yourself; say plainly what only he can do (signing into accounts, creating keys, paying).
- Feature #1 he asked for: Jarvis modifies and repairs himself so the Owner does not have to come back to Claude Code for changes.
- After voice and icon, next topic is "functions" (see Backlog).

## What exists (all working, deployed)
- Repo: github.com/Elliot-H/Jarvis-2.0, branch main. Hosted on Railway (auto-deploys on every push to main; `railway.json` healthcheck `/health`, so a broken build keeps the old version running).
- Server: Node 18+, ESM, Express 5 + `ws`. Entry `server.js`. Self-repair in `self.js`. Client in `public/` (HUD, mic, speech). Persona in `config/persona.md`, MCP connections in `config/mcp.json` (browser and meta_ads off by default). State in `data/` (stats.json), scratch in `workspace/`.
- Brain: Claude Agent SDK (`@anthropic-ai/claude-agent-sdk`). Two modes: chat = Haiku (fast, cheap), work = Sonnet (self-repair and heavy jobs). `use_workshop` tool hands chat over to work. All in-process MCP servers use `alwaysLoad: true` (otherwise Haiku loops on ToolSearch).
- Voice, in priority order: Fish Audio (community "JARVIS 1" model, voice id `b841fc010afe43efa1b9fb702832988d`, used when `FISH_API_KEY` is set) → ElevenLabs (default voice Daniel `onwK4e9ZLuTAKqWW03F9`, model `eleven_flash_v2_5`) → browser speech synthesis. `/api/voice-status` and the Comms Log show the plain-English reason when the real voice fails.
- Listening: browser SpeechRecognition (Chrome). Android quirks handled: mic stream released on mobile, utterance stitching with silence timer, wake-word variants, auto re-listen after Jarvis asks a question.
- Security: PIN lock (`JARVIS_PIN`, cookie HMAC, rate limit 8 tries / 10 min, WS verifyClient). `/safe` fallback page, `/health`, `/api/logs`.
- Phone install: PWA (manifest, service worker, arc-reactor icons). Chrome ⋮ → Add to Home screen.
- Self-repair: uses the GitHub REST API (no git binary needed). Flow: checkout → edit `./self` copy → `self_check` (syntax, secret scan, boot test on a random port) → Jarvis asks "Shall I deploy, sir?" → `self_deploy` only after the Owner says yes in a LATER turn → commit to GitHub → Railway rebuilds. `self_rollback` makes a revert commit. Needs `GITHUB_TOKEN` (fine-grained, repo Contents: Read and write).

## Environment variables (names only)
ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN (optional), FISH_API_KEY, FISH_VOICE_ID (optional), ELEVENLABS_API_KEY (restricted key, Text to Speech access), ELEVENLABS_VOICE_ID, JARVIS_PIN, GITHUB_TOKEN, GITHUB_REPO (default Elliot-H/Jarvis-2.0), WAKE_WORD, USER_TITLE, JARVIS_MODEL, JARVIS_CODE_MODEL, DAILY_BUDGET_USD (default 2), CHAT_BUDGET_USD (0.05), WORK_BUDGET_USD (0.75), TZ. See `.env.example`.

## Money: the story so far
- The first version burned about $84 (Anthropic balance went to −$84.52) because of huge prompts, one endless resumed conversation and the stronger model on every question. The Owner is angry about it and will not accept surprise bills.
- Fixes already shipped (commit a272bb9 and after): free local greeting (no AI call), no endless session, trimmed tools, stable prompt, Haiku for talk, hard daily cap `DAILY_BUDGET_USD`, per-turn budget caps, cost chip in the HUD. Measured about $0.0047 per chat question.
- CURRENT STATE: Anthropic credit is exhausted / balance negative, so the Claude brain currently answers "I am out of Anthropic credit". Fish Audio also reported "out of credit" until the Owner tops it up. The Owner has NOT confirmed he paid either.
- The Owner decided he does not want to keep paying per question. He chose "option two": run a free open model on his own gaming PC.

## The plan he chose: local brain on his PC
Goal: Jarvis brain = an open model on his own hardware (via Ollama), nothing billed per question. Claude stays only for rare, explicitly requested self-repair, capped.
Steps to do first, in this order:
1. Check the PC: graphics card model and VRAM (`nvidia-smi`), RAM, OS, whether Node 18+ and git are installed. The card decides the model size (12 GB+ VRAM is comfortable for a good mid-size model; less means slower and weaker).
2. Install Ollama, pull a tool-calling-capable model that fits (Qwen, Llama, Gemma families; test tool calling, it is the weak point).
3. Rewrite the brain layer. `server.js` currently uses the Claude Agent SDK `query()` and only talks to Anthropic. Add a provider switch (`BRAIN=claude|local`) that talks to Ollama's OpenAI-compatible endpoint (`http://localhost:11434/v1`) with a simple tool loop for the existing tools (update_stats, get_hud, show_panel, hide_panel, failures, use_workshop). Keep the HUD, voice, PIN, panels, PWA unchanged.
4. Run Jarvis on the PC and make it reachable from the phone with a free tunnel (Tailscale or Cloudflare Tunnel), keeping the PIN lock. Decide whether to keep Railway as a fallback or retire it.
5. Voice: Fish Audio is the voice the Owner picked ("perfect"). It costs a little; Kokoro (free, local) was rejected as "not the proper voice". Keep Fish.
6. Self-repair with a local model is unreliable; keep the Claude-backed work mode for it, behind its cap, and only on request.
Cheaper alternative he was offered but did not pick: Gemini free tier for talk mode.
Also offered: Claude subscription via Claude Code on the PC instead of API credits. Unclear whether Anthropic's terms allow it for something like Jarvis; ask Anthropic support before relying on it.

## Backlog (the "functions" discussion, not started)
- MyGuru stats (the Owner's app, myguru.app: creators host paid live broadcasts, Q-Coins currency).
- Meta Ads: Pipeboard MCP (`https://meta-ads.mcp.pipeboard.co/?token=...`, slot exists in `config/mcp.json`) or an open-source Meta Ads MCP (attainmentlabs/meta-ads-mcp, amekala/ads-mcp).
- YouTube stats (his channel MyOnlineCarGuy1), browser MCP, Gmail/Drive.
- Open-source Jarvis builds looked at: ethanplusai/jarvis (Fish Audio, no built-in integrations, MCP plug-ins), iamnabink/claude-jarvis (macOS-only integrations, not usable here).

## Gotchas learned
- Anthropic API is prepaid credit, but in-flight requests can push the balance negative. Suggest a monthly spend limit and auto-reload OFF.
- Do not run `pkill -f "node server.js"` in the same shell call as other work; it can kill the shell.
- To test locally: `npm install`, then `PORT=3999 JARVIS_PIN= node server.js`. A mock Fish server was used for testing the Fish path (`FISH_API_URL` overrides the endpoint).
- Jarvis commits to GitHub himself (author jarvis@users.noreply.github.com). ALWAYS `git pull` before editing, or you will conflict with his commits.
- Do NOT rewrite git history to "fix" unverified commits (a stop hook complains about commits by Jarvis and by the Owner). Those commits are published, Railway deploys from main, and Jarvis's rollback relies on the hashes. Set `git config user.email noreply@anthropic.com` and `user.name Claude` for your own commits and leave older ones alone.
- The workspace where earlier sessions ran could not reach Railway, Render, Fly, HuggingFace or api.elevenlabs.io from the shell. A session on the Owner's PC will not have that limit.
- Owner cannot create keys or sign in for Claude; he does those steps when asked (Railway Variables, ElevenLabs/Fish keys, Anthropic billing, GitHub token).
