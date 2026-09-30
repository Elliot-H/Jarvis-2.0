# Jarvis 2.0 — Handoff

Read this first. It lets a fresh Claude session (for example one opened from the Owner's own PC) pick up exactly where the last one stopped. No secrets are in this file; variable names only.

## Who and how
- The Owner (GitHub: Elliot-H) wants a personal Jarvis: Claude as the brain, an Iron-Man-style HUD, hands-free voice ("Jarvis" wake word), and the real Jarvis-sounding voice.
- Style: terse, direct, no preamble. Never over-explain. He is often on his phone, not at a PC.
- In any work document or deliverable, call him "Owner" or "MyGuru Admin". Never "Captn".
- Whenever you send him to Railway (or any site), the very last line of your message must be "Here is the link:" with the direct link.
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
- Phone install: PWA (manifest, service worker, icons). Icons (PWA + Android adaptive icon PNGs in drawable-nodpi) are a still frame of the HUD reactor, rendered from the same drawing code; the boot screen shows the live reactor (`#bootReactor`). Chrome ⋮ → Add to Home screen.
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

## Features built
- Crypto watch (crypto.js + tools crypto_scan / crypto_trending / crypto_watch, talk mode on OpenRouter only). Market data: CoinGecko free API (optional `COINGECKO_API_KEY` demo key in Railway; shared cloud IPs can get rate limited without it). News: the talk model web-searches the biggest movers, then writes a "Crypto watch" HUD panel with what happened, likely effect, confidence, and what would change its mind. Framed as analysis, never advice or predictions; it must never place or offer to place trades (Owner does those himself). Untested against the live CoinGecko API from the build workspace (network blocked); format follows their documented /coins/markets fields. Watchlist stored in data/stats.json (`watchlist`, CoinGecko ids). Scheduled briefs (schedule.js + server.js): morning 08:00, midday 12:30 (runs only if a top coin moved `CRYPTO_ALERT_PCT`=6%+ in 24h, or a watchlist coin two thirds of that), evening 18:30, in TZ; each can be set to "off" (`CRYPTO_BRIEF_MORNING/MIDDAY/EVENING`). Silent: they update the "crypto" HUD panel and comms log; optional phone alert via ntfy.sh (`NTFY_TOPIC`, Owner installs the free ntfy app; Owner has set it up). Jarvis also has a `phone_alert` tool ("send a test alert to my phone"). The wake greeting says "your crypto watch is on screen" when the panel exists. A slot missed by a restart is caught up within 90 minutes; if Railway wipes data/ on redeploy a brief may repeat once. Only runs with the OpenRouter brain, and obeys the daily/monthly caps. Estimated cost about $1-2/month (scan + up to 3 searches per brief).
- Future hardware (Arduino/Pi) plan: keep Jarvis in Node; a small Python device program runs beside the hardware (PC or Pi) and connects OUT to Jarvis; Arduinos over USB serial, ESP32 boards straight over WiFi/MQTT; one tool per device action in tools.js; anything that moves or powers something needs the Owner's confirmation.

## Voice fallback + alert clip (2026-09-29)
- Fish now retries on `s2.1-pro-free` (override `FISH_FALLBACK_MODEL`) when `FISH_MODEL` (default s1) fails for any reason except a bad key (401). `/api/voice-status` shows which model spoke.
- `voice_check` talk tool: live 1-word Fish test so Jarvis can state the exact reason the voice is off.
- `/api/alert-sound.mp3` (PIN-authed): Jarvis-voice notification clip, made once and cached in data/ (`?remake` regenerates, `?text=` custom line, `ALERT_LINE` env). Owner downloads it on the phone and sets it as the ntfy notification sound.

## Phone alerts: Telegram (2026-09-29)
- Why: ntfy on the Owner's Samsung has no sound picker and plays the phone default. Telegram allows a custom sound per chat, so only Jarvis gets the clip. Setup by Owner: @BotFather /newbot, token into Railway `TELEGRAM_BOT_TOKEN`, send the bot any message once; chat id is found automatically (or `TELEGRAM_CHAT_ID`). Then in that Telegram chat: Notifications, Sound, Custom, pick jarvis-alert.mp3 (download it from /api/alert-sound.mp3).
- `push()` sends via Telegram when the token is set, falls back to ntfy (`NTFY_TOPIC`, priority 4 via `NTFY_PRIORITY`) if Telegram fails. Crypto briefs and `phone_alert` both use it. Tested only against a mock Telegram API.

## Phone alerts: Pushover (2026-09-29, preferred)
- Owner wants ONE notification-only app with his own sound. `push()` order: Pushover (`PUSHOVER_APP_TOKEN`, `PUSHOVER_USER_KEY`, `PUSHOVER_SOUND` default `jarvis`) then Telegram then ntfy, each falling back to the next. Sound is uploaded once on pushover.net (Custom Sounds) using /api/alert-sound.mp3, named to match `PUSHOVER_SOUND`. Untested against the real API.

## Calendar (2026-09-29)
- calendar.js + tools calendar_events / calendar_colors / calendar_add / calendar_update (talk brain). Google Calendar API through a SERVICE ACCOUNT (no consent screen, no expiring token): Owner shares his calendar with the service account email ("Make changes to events"); env `GOOGLE_CALENDAR_KEY` (JSON key, one line) and `GOOGLE_CALENDAR_ID`. The private iCal link was rejected: read-only and has no colours.
- Colour meanings live in `state.calendarColors` (data/stats.json) and are taught by voice ("survey" then "set"). If Railway wipes data/, set `CALENDAR_COLOR_MEANINGS` (JSON) or add a Railway volume for data/.
- Tested only against a mock Google API. Google event colours are the fixed 11 (Lavender, Sage, Grape, Flamingo, Banana, Tangerine, Peacock, Graphite, Blueberry, Basil, Tomato); custom hex colours are not readable via the API.

- Calendar update: `GOOGLE_CALENDAR_ID` can list several calendars, comma separated (read from all, new events go to the first unless `calendar` is named). Owner's appointments live on defiantaudio1@gmail.com (Samsung calendar app account); DEFIANT AUDIO (owner elliothernandez41@gmail.com) is a second calendar. Each calendar must be shared with the robot email ("Make changes to events") from ITS owning Google account. `/api/calendar-check` reports per-calendar status.

## Backlog (the "functions" discussion)
- MyGuru stats (the Owner's app, myguru.app: creators host paid live broadcasts, Q-Coins currency).
- Meta Ads: Pipeboard MCP (`https://meta-ads.mcp.pipeboard.co/?token=...`, slot exists in `config/mcp.json`) or an open-source Meta Ads MCP (attainmentlabs/meta-ads-mcp, amekala/ads-mcp).
- YouTube stats (his channel MyOnlineCarGuy1), browser MCP, Gmail/Drive.
- Account access approach agreed: official OAuth/API connections first (Google, Meta, etc.), then a browser the Owner signs into himself; never store passwords. Banks/brokerages read-only; no money movement without his yes each time.
- Open-source Jarvis builds looked at: ethanplusai/jarvis (Fish Audio, no built-in integrations, MCP plug-ins), iamnabink/claude-jarvis (macOS-only integrations, not usable here).

## Gotchas learned
- Anthropic API is prepaid credit, but in-flight requests can push the balance negative. Suggest a monthly spend limit and auto-reload OFF.
- Do not run `pkill -f "node server.js"` in the same shell call as other work; it can kill the shell.
- To test locally: `npm install`, then `PORT=3999 JARVIS_PIN= node server.js`. A mock Fish server was used for testing the Fish path (`FISH_API_URL` overrides the endpoint).
- Jarvis commits to GitHub himself (author jarvis@users.noreply.github.com). ALWAYS `git pull` before editing, or you will conflict with his commits.
- Do NOT rewrite git history to "fix" unverified commits (a stop hook complains about commits by Jarvis and by the Owner). Those commits are published, Railway deploys from main, and Jarvis's rollback relies on the hashes. Set `git config user.email noreply@anthropic.com` and `user.name Claude` for your own commits and leave older ones alone.
- The workspace where earlier sessions ran could not reach Railway, Render, Fly, HuggingFace or api.elevenlabs.io from the shell. A session on the Owner's PC will not have that limit.
- Owner cannot create keys or sign in for Claude; he does those steps when asked (Railway Variables, ElevenLabs/Fish keys, Anthropic billing, GitHub token).

## Filler lines (ack + "still working")
- `server.js`: `FILLERS()` (10 `ack` lines, 8 `still` lines, use USER_TITLE), `GET /api/fillers` (URL list), `GET /api/filler/:kind/:n.mp3` (Fish JARVIS voice, made once, cached `data/filler-<sha>.mp3`; 204 if no FISH key).
- `public/app.js`: fillers are context-aware: `fillerTopic(text)` returns null for chit-chat (no filler), else generic|calendar|weather|crypto|lookup|action; ack + ~4s progress lines come from that topic group; a generic "still" line only after ~30s. `FILLERS()` on the server is nested {ack,progress,still}.{group}[]; endpoints `/api/fillers` and `/api/filler/:kind/:group/:n.mp3`.
- To change wording, edit `FILLERS()` (new text = new cached clip automatically).

## Open-app greeting + weather (server.js `localGreeting`, `weatherLine`)
- First open of the day: full greeting (day, date, temp + conditions). Later opens: "At your service, sir." only, unless the weather changed since the last check ("it has stopped raining" / "started raining") or earlier requests failed.
- Weather: Open-Meteo, no key. Default Harrington DE; set `WEATHER_LAT` / `WEATHER_LON` in Railway to change. Last seen weather + greeted day live in `data/stats.json` (`weather`, `greetedDay`); a redeploy wiping data/ just makes the next open a "first of day".

## Weather follows the phone
- App asks the browser for location on open (one-time permission) and sends `{type:'location',lat,lon}` before `wake`. Server keeps it in `state.location` (+ timezone). Moving >~35 miles resets the weather memory, so the new place is reported fresh. Greeting date/time uses the phone's timezone.
- Units: F/mph for US timezones, otherwise C/km/h. `WEATHER_LAT/LON` are only the fallback if location is never granted.
- New `weather` tool (tools.js PHONE_TOOLS, `handlers.weather`): now + up to 7-day forecast at the phone's location. Persona has a Weather section.

## Places + random contextual reminders (server.js "places & random contextual reminders")
- Places: `place_save` stores the phone's current position under a name (radius default 150 m; "home" gets kind home). `state.places`, matched by distance to `state.location` (must be under 6h old). App sends location on open, before every command, and every 10 min.
- Arrival remark ("I see you're at Brenda's this morning, sir.") only when the place differs from `state.lastPlace`; nothing for home.
- Reminder bucket `state.reminders` {id,text,place,time(morning|afternoon|evening|night),days,chance%,cooldownHours,lastShown}; tools reminder_add/list/remove. `pickReminder()` filters by triggers + cooldown, then rolls chance; max one per check. Checked on app open (appended to greeting) and every 25 min while the app is open (35% roll, only when idle, spoken). Seeded once with the dogs-food reminder (home, morning, 45%).
- Not built: notifications when the app is closed (a web app cannot see location in the background).

## Redeploys wipe data/ (important)
- Every push to main redeploys and erases `data/` (stats.json: places, reminders, calendar colour meanings, watchlist, location...). Fix = attach a Railway Volume; server now uses `DATA_DIR` or `RAILWAY_VOLUME_MOUNT_PATH` automatically (no code change needed after the volume is added).
- Until then the greeting memory (`greetedDay`, last weather) is kept on the phone (localStorage `jarvis.memo`) and sent with `wake`; the server echoes it back in the `say` message's `memo`.

## Phone backup of Jarvis's memory (no Railway volume needed)
- `BACKUP_KEYS` in server.js (places, reminders, calendarColors, watchlist, lastPlace, talkModel, seededReminders). Any change broadcasts `{type:'backup', data:{..., stamp}}`; the app stores it in localStorage `jarvis.backup`. On every WebSocket connect the app sends `{type:'restore', data}`; the server applies it only if `data.stamp` is newer than its own `state.backupStamp` (a freshly wiped server has none), so a redeploy restores everything the next time the app opens.
- A Railway volume is still better (also keeps spend history etc.) but no longer required for these.

## Music: Spotify + speaker (spotify.js, `music_control` tool, android DeviceBridge)
- Spotify Web API. Env: `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`. Redirect URI to register: `<public url>/api/spotify/callback`. Owner approves once at `/api/spotify/login`; refresh token kept in `state.spotifyRefresh` (in BACKUP_KEYS, so the phone restores it after a wipe). `/api/spotify/status` shows connection + players. Premium required for control.
- `music_control` actions: start (connect speaker + latest playlist), play(query,kind), pause, resume, next, previous, volume, status. "Latest playlist" = most recent playlist context in recently-played.
- If no Spotify player is listed, the server asks the Android app to open Spotify (`open_app`), waits up to 15s, then plays.
- Device channel: server sends `{type:'device', id, action, ...}` to clients that said `hello {device:true}` (only the Android app, which exposes `window.AndroidDevice`); app answers `device_result`. Actions: `open_app {package}`; `bt_connect {name, task}`: app checks A2DP connected devices, fires Tasker intent (`net.dinglisch.android.tasker.ACTION_TASK`, task_name) and polls up to 20s until a connected device name contains `name`, then reports. Android does not let normal apps connect Bluetooth, hence Tasker (Owner sets a task named JarvisBT: Bluetooth on, wait, BT Connect Rockville; Tasker > Preferences > Misc > Allow External Access). `BT_SPEAKER_NAME`, `TASKER_BT_TASK` env override defaults.
- Spoken reminders/greetings are now `remember()`ed so a "yes" to an offer ("some music?") has context. Persona has a Music section.
- No-API fallback (used when Spotify Web API isn't configured/approved; Spotify now requires the developer-app owner to hold Premium and the Owner's family-plan account couldn't create an app): `musicViaPhone` in server.js sends device actions `spotify_resume` (open Spotify + media Play key: resumes last-played), `spotify_search` (Android MEDIA_PLAY_FROM_SEARCH to com.spotify.music), `media_key` (pause/next/previous), `set_volume`. Status ("what's playing") unavailable in this mode. Unconfirmable actions report as such.
- Speakers: `state.speakers` [{name(exact BT name), alias, area, volume}] (in BACKUP_KEYS). Tools: bluetooth_paired (device action `bt_paired` lists the phone's bonded devices), speaker_save/list/remove, bluetooth_connect. `pickSpeaker(hint)`: match alias/area/name; else the speaker whose area matches the saved place he is at; else the only one; else asks. Connecting sets the speaker's volume (default `DEFAULT_VOLUME`=30). The one Tasker task (`JarvisBT`) reads the device name from `%par1` (the app sends extra `par1`): actions = Bluetooth on, Wait 3s, BT Connect Name `%par1`.

## Bluetooth via Tasker: working setup (2026-09-30)
- Tasker is the Play Store build (package `net.dinglisch.android.taskerm`); Jarvis broadcasts ACTION_TASK to both taskerm and tasker packages.
- Jarvis needs the `net.dinglisch.android.tasker.PERMISSION_RUN_TASKS` permission (declared in the manifest, requested at startup). Tasker needs Nearby devices permission, unrestricted battery, Allow External Access on.
- Task `JarvisBT` = one action "Bluetooth Connection", Action Connect, Device = the speaker's hardware address typed in (no trailing period). Rockville = 64:F8:5E:04:90:E1.
- `%par1` did NOT reach the action (hardcoded address works, `%par1` does not). So one Tasker task per speaker: extend `speakers` records with a task name if a second speaker is added. Jarvis also reports exact failure reasons in the Activity feed ("Speaker FAILED: ...").

## The shop: perimeter + "headed to the shop?" (2026-09-30)
- Shop = saved place named "the shop" (placeKey ignores a leading "the", so "shop" matches). Perimeter `SHOP_RADIUS_M` (default 250 m, wider than normal places because location is rounded to ~100 m). Reminders with place "shop" fire inside it.
- One-time claim: the Owner said he was at the shop on 2026-09-30 afternoon. The first phone location within 15 km of Harrington before `SHOP_CLAIM_UNTIL` (default 2026-09-30 19:30 ET) is saved as the shop, and Jarvis says so. If it missed, he says "this is the shop" (place_save).
- Check-in: on `SHOP_DAYS` (default Mon-Sat), between `SHOP_ASK_FROM`-`SHOP_ASK_TO` (7-13 h), not at the shop, not yet asked or known today, rolled at `SHOP_ASK_CHANCE` (50%) on app open and on the 25-min idle loop. Asked at most once a day. State `workDay` {day,on} and `shopAsk` (in BACKUP_KEYS).
- Short answers (<= 6 words, within 10 min) are handled in server.js `shopAnswer` with no AI call. Yes: today's appointments (events whose colour meaning contains "job", else all timed events) + next one + a random shop reminder. No: "No worries, sir. Not in work mode today. Understood." Longer answers go to the brain, which calls the `shop_day` tool. Arriving inside the perimeter sets work mode on.
- Tested locally with a mock phone (claim, yes, no). Calendar part untested live.
