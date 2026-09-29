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
OPENROUTER_API_KEY, TALK_MODEL, TALK_SEARCH_ENGINE, TALK_REASONING, BRAIN, MONTHLY_BUDGET_USD, WORK_MONTHLY_BUDGET_USD, BENCH_BUDGET_USD, ANTHROPIC_API_KEY, CLAUDE_CODE_OAUTH_TOKEN (optional), FISH_API_KEY, FISH_VOICE_ID (optional), ELEVENLABS_API_KEY (restricted key, Text to Speech access), ELEVENLABS_VOICE_ID, JARVIS_PIN, GITHUB_TOKEN, GITHUB_REPO (default Elliot-H/Jarvis-2.0), WAKE_WORD, USER_TITLE, JARVIS_MODEL, JARVIS_CODE_MODEL, DAILY_BUDGET_USD (default 2), CHAT_BUDGET_USD (0.05), WORK_BUDGET_USD (0.75), TZ. See `.env.example`.

## Money: the story so far
- The first version burned about $84 (Anthropic balance went to −$84.52) because of huge prompts, one endless resumed conversation and the stronger model on every question. The Owner is angry about it and will not accept surprise bills.
- Fixes already shipped (commit a272bb9 and after): free local greeting (no AI call), no endless session, trimmed tools, stable prompt, Haiku for talk, hard daily cap `DAILY_BUDGET_USD`, per-turn budget caps, cost chip in the HUD. Measured about $0.0047 per chat question.
- STATE ON 2026-09-29: Anthropic credit is exhausted / balance negative, so the Claude brain currently answers "I am out of Anthropic credit". Fish Audio also reported "out of credit" until the Owner tops it up. The Owner has NOT confirmed he paid either.
- He first chose a free local model on his PC; that was checked and dropped (see Brain decision).

## Brain decision (2026-09-29): cloud, via OpenRouter
- Local brain was checked and dropped. The PC ("desktop-fmfb9nv") is Windows 11 Home, 32 GB RAM, but the GPU is an NVIDIA GeForce GTX 560 Ti (~1.2 GB VRAM, 2011). Ollama can't use it; CPU-only models are too slow and weak for tool use. Node LTS, Git and Ollama were being installed via winget (Ollama now unneeded).
- Overnight self-repair on the PC was also rejected: too slow on CPU, unreliable code, and electricity costs more than cloud repairs.
- The Owner wants speed and answers that are right the first time, total running cost about $15-20/month (Railway $5 + Fish voice + AI). He was burned before by a recommendation that wasn't checked against his real needs, so model choice is being made by TESTING, not by picking one.
- Long-term scope he described (drives model choice later): car part price hunting, marketing leads, business finances, calendar, business efficiency, building dropshipping sites, ordering parts, stock analysis and trades. Orders and trades must always be shown to him and confirmed before execution.

### What was built (this session)
- `brain.js`: talk mode runs on any OpenAI-compatible model through OpenRouter (`OPENROUTER_API_KEY`, `TALK_MODEL`). Own tool loop; web search is OpenRouter's server tool `openrouter:web_search` (engine `TALK_SEARCH_ENGINE`, default `parallel`, the cheapest). Cost comes from OpenRouter's `usage.cost`. External MCP servers (config/mcp.json) are NOT available in OpenRouter talk mode; future features should be native tools in tools.js.
- `tools.js`: one list of tool specs (HUD, failures, use_workshop) feeding both the Claude SDK and the OpenRouter brain.
- `BRAIN` defaults to `openrouter` once `OPENROUTER_API_KEY` is set; `BRAIN=claude` restores the old Haiku talk path. Workshop mode (self-repair) stays on Claude Sonnet and needs Anthropic credit (balance was negative).
- Caps: `MONTHLY_BUDGET_USD` (default 10, all AI), `WORK_MONTHLY_BUDGET_USD` (default 5, repairs), plus the existing daily and per-request caps. Tracked in data/stats.json under `month`.
- Model test: `/bench` page (PIN protected) runs 20 scripted Jarvis requests + 1 live web search on each candidate (bench/cases.js, bench/run.js), shows pass rate, median speed, cost per question and a monthly estimate at 100 questions/day. "USE THIS MODEL" sets `state.talkModel` (lost on redeploy if data/ is wiped, so also set `TALK_MODEL` in Railway). CLI: `OPENROUTER_API_KEY=... node bench/run.js [model ids]`. Cost capped by `BENCH_BUDGET_USD` (default 1).
- Candidates: Gemini Flash-Lite, Gemini Flash, GPT Luna, GPT-OSS 120B/20B (Groq preferred), DeepSeek Flash, Mistral Small, Claude Haiku (baseline). Slugs are resolved against OpenRouter's live model list.
- Prices checked 2026-09-29 (per 1M tokens in/out): GPT-OSS 20B $0.075/$0.30, GPT-OSS 120B $0.15/$0.60 (Groq), DeepSeek Flash $0.15-0.30/$0.60-1.20, GPT-5.6 Luna $0.20/$1.20, Gemini 3.1 Flash-Lite $0.25/$1.50, 3.5 Flash-Lite $0.30/$2.50, Gemini 3.8 Flash $0.75/$3.75 (doubles after Dec 31 2026), Claude Haiku 4.5 $1/$5. Fish TTS $15 per 1M bytes (lists a free s2.1-pro-free model, untested with the JARVIS voice). Railway Hobby $5/month with $5 usage included.

### Next steps
1. Owner: create OpenRouter account, add ~$5 credit, create a key with a credit limit, put it in Railway as `OPENROUTER_API_KEY`. (In progress when this was written.)
2. Open /bench, run the test, read the misses, pick the model; set `TALK_MODEL` in Railway.
3. Top up Anthropic a little for self-repair, with a monthly spend limit set in the Anthropic console.
4. Try Fish `s2.1-pro-free` with the JARVIS voice (FISH_MODEL env var).
5. Then the "functions" backlog.

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
