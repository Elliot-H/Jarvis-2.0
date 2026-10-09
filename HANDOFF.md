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
- Phone install: PWA (manifest, service worker, icons). Icons (PWA + Android adaptive icon PNGs in drawable-nodpi) are a still frame of "Reactor Prime", drawn by `public/prime.js` (`drawPrime`); the boot screen runs the live Prime animation (`#bootReactor`). The in-app HUD reactor in app.js is separate and audio-reactive. Chrome ⋮ → Add to Home screen.
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
- The 2026-09-30 one-time auto-claim of the shop was removed the same evening (it could have claimed home by mistake). Places are saved by voice or in the Places box.
- Check-in: on `SHOP_DAYS` (default Mon-Sat), between `SHOP_ASK_FROM`-`SHOP_ASK_TO` (7-13 h), not at the shop, not yet asked or known today, rolled at `SHOP_ASK_CHANCE` (50%) on app open and on the 25-min idle loop. Asked at most once a day. State `workDay` {day,on} and `shopAsk` (in BACKUP_KEYS).
- Short answers (<= 6 words, within 10 min) are handled in server.js `shopAnswer` with no AI call. Yes: today's appointments (events whose colour meaning contains "job", else all timed events) + next one + a random shop reminder. No: "No worries, sir. Not in work mode today. Understood." Longer answers go to the brain, which calls the `shop_day` tool. Arriving inside the perimeter sets work mode on.
- Tested locally with a mock phone (claim, yes, no). Calendar part untested live.

## Places box (/places, PLACES button on the HUD) (2026-09-30)
- public/places.html + REST: GET /api/places, POST /api/places ({name, lat, lon} from the page's own GPS, or {name, address} geocoded with OpenStreetMap Nominatim, US only), PATCH /api/places/:name {radius}, DELETE /api/places/:name, POST /api/items (upsert), DELETE /api/items/:id. PIN-protected like the rest.
- Bucket items (`state.reminders`) now have kind reminder|mention|question, trigger at|away (away = only while NOT at that place, needs a location under 30 min old), and for questions optional yes/no replies. `cleanItem()` validates. A question's short yes/no answer is handled in `bucketAnswer` (no AI call); `state.pendingQ`.
- Quick chips for Home, The Camden House, The Shop. Nominatim could not be reached from the build sandbox; untested live.
- Address-pinned places: `SEED_PLACES` in server.js (the shop, 17399 S DuPont Hwy, US Census geocoder, 250 m) and the Railway variable `PLACES_JSON` for private ones (home). The repo is PUBLIC: never put the Owner's home address or coordinates in code. Seeds apply once per value (`state.placeSeeds`), and again after a phone-backup restore that lacks them.

## Comings and goings (2026-09-30)
- Android KeepAliveService now also reports position in the background (fused/network provider, every ~100 m, max 1/min) to POST /api/loc (cookie-authed). Foreground service type microphone|location; FOREGROUND_SERVICE_LOCATION in the manifest. Uses while-in-use location (no "allow all the time" needed) because the service starts while the app is open.
- server.js `onMove()` runs on every location (app websocket or /api/loc): hysteresis (+120 m to leave), arrive/leave events, `state.at`. Leave: leave-trigger items, a destination guess (`guessNext`: shop after 15:00 -> home; home on shop-day mornings -> shop) asked as "Headed home, sir?" (`pendingQ.type='dest'`, answered free in `destAnswer`), or a bring list for elsewhere. Arrive: "Welcome to X" first time a day (not home), bring list cleared ("Hope you remembered..."), arrive-trigger items.
- Items: trigger at|away|arrive|leave|heading, once (fire then delete), kind bring (to a place; cleared on arrival). Voice tools bring_add, bring_list, heading_to; reminder_add has trigger + once.
- `deliver()`: spoken if the app is connected (joins the greeting if one is about to happen), else Pushover. Max `MAX_REMARKS_HOUR` (4), quiet `QUIET_FROM`-`QUIET_TO` (22-6); bring/grab lines bypass the hourly cap.
- Starter items (seededMoves): "have you eaten" (heading home), check with Princess (leaving the shop), dogs' food (heading home). Tested locally with simulated moves.

## W2 client follow-ups (2026-09-30)
- The shop line is an iPhone (customer numbers are in its Contacts). iOS lets no app text on its own, so texts go out through an Apple Shortcut on that phone: GET /api/outbox?token=... (returns approved texts, marks them sending), then per message Find Contacts (name contains) -> Send Message -> GET /api/outbox/:id/sent?token=... (or ?status=notfound). Unconfirmed "sending" items return to approved after 2 h. Token `state.outboxToken` (random, in BACKUP_KEYS), not the PIN; the outbox routes sit before the PIN middleware.
- Drafting: `followupTick` at FOLLOWUP_AT (08:45) drafts for calendar jobs that ended FOLLOWUP_DAYS (3) ago; customer = event title before " - ". Announced in the greeting (mornings or at the shop). Page /followups (HUD button FOLLOW-UPS): approve/edit/skip, add by hand, review link + wording, and the Shortcut setup steps with the links filled in. Voice tools followup_list/approve/skip/edit/add.
- Tested locally (add, approve, outbox, token check, sent). The Shortcut itself is untested (built from the steps on the page).

## A17 vehicles via Bluetooth OBD (2026-09-30)
- android ObdBridge.java (JS `AndroidObd.scan/clearCodes(id, dongle)` -> `window.__obd(id, json)`): classic Bluetooth SPP to a PAIRED ELM327 dongle (match by name substring or address; falls back to RFCOMM channel 1 for clones). Reads ATRV volts, 0902 VIN, 0101 MIL + count, 03 codes, 012F fuel, 0105 coolant, 010C rpm, 0131 distance since clear. Mode 04 clear only via vehicle_clear_codes.
- Server: device actions obd_scan / obd_clear go through the existing device channel (app.js routes them to AndroidObd). `state.vehicles` (BACKUP_KEYS). Auto-scan each vehicle every OBD_EVERY_MIN (20) while the app is connected; out of range fails quietly. Alerts via deliver(): new codes, MIL on, resting volts < OBD_LOW_VOLTS (12.2, once/24h), fuel <= 15% (once/12h). Tools vehicle_add/scan/status/clear_codes/remove.
- Tested with a mock phone; never against a real dongle. Dongle must be a Bluetooth Classic ELM327 (BLE-only dongles are not supported yet).
- OBD additions: mode 07 pending codes, readiness from 0101 bytes B-D (inspection verdict in vSummary), fuel trims 0106-0109, freeze frame (mode 02 frame 0: code, load, coolant, rpm, speed, trims). Battery drain: resting readings only (engine off and not run for 2 h, `v.lastRun`), 14-day history `v.volts`, least-squares slope `voltDropPerDay`; alert at OBD_DRAIN_V_DAY (0.08 V/day, once/72 h). Tested with a mock phone.
- 2026-09-30 fix: in the Android app EVERY Jarvis clip must go through the native phone-route player. Fillers keep their server URL (not a blob) when `PHONE_AUDIO`; the instant ack is cached server-side and replayed by `/api/ack-clip/:id.mp3` (header X-Ack-Id). `PhoneClip._webFallback` never plays while Bluetooth audio is active (the page player follows music to the speaker). Owner rule: Jarvis is never heard anywhere but the phone unless explicitly programmed.
- "Hey Jarvis" alone -> `answerWake()` in app.js plays the cached filler `wake.generic` ("Yes, sir?") on the phone route, then opens the mic (goActive quiet). Falls back to the chime if the clip is missing. "Hey Jarvis, <command>" in one breath skips it.

## LED strip (A20)
`led_color` tool (tools.js) -> `handlers.led_color` (server.js) builds BanlanX packets `53 cmd 00 01 00 len data` (power 50, mode 53, color 52 r g b level, brightness 51) -> device action `led` -> `DeviceBridge.ledWrite` scans mfr id 20563 (data[1]==0x10), caches MAC in prefs "led", writes ffe1, disconnects. Needs BLUETOOTH_SCAN. Untested on hardware; if it fails, check ACTIVITY for the detail text.

### LED rework (2026-10-01, untested on hardware)
Owner report: asked green got red, purple got red, control only returned after asking blue; pulling a remote's battery fixed it once. Causes unconfirmed (candidates: RF remote overriding, wrong chip order/light type, old brightness scale).
- Fixed: level/brightness now 0-255 (was 100). `ledSend(packets)` in server.js reads state back (APK subscribes to ffe1 notifications, MTU 185, sends query `53 02 00 01 00 01 01`, parses frame -> JSON n,t,o,p,m,e,lv,wl,sp,rgb,drgb). Verify + 2 retries; honest FAILED text. Old APKs return plain 'sent' -> 'SUCCESS (unconfirmed)'.
- Effects: config/ledfx.json (SPI dynamic 141, SPI sound 18, PWM dynamic 12, PWM sound 3) generated from the uniled reference. `led_color` takes effect, speed 1-10, music. Mode 3 = effect (53 03 id), mode 5 = sound, speed cmd 54. SPI has no true strobe; party = Rainbow Jump (SPI) / Seven Color Strobe (PWM, via alias). Sound party = mode 5 effect 18.
- New tools: led_status, led_test (R,G,B 3 s each, then ask Owner what he saw), led_setup (chip order cmd 6B index RGB,RBG,GRB,GBR,BRG,BGR from seen colors; light_type cmd 6A only if explicitly asked; SPI RGB 0x86, workaround SPI RGB+1CH PWM 0x89).
- Light type codes: PWM 81,83,85,87,8A; SPI 82,84,8D,86,88,8B,8E,89,8C.

## Remote model test
Set `BENCH_TOKEN` (16+ chars) in Railway. Then `POST /api/bench?token=...` starts the test (body `{"ids":[...]}` optional), `GET /api/bench?token=...` returns progress/report/text, `POST /api/talk-model?token=...` sets the winner. Only those two routes accept the token.

## Model test result (2026-09-30)
Ran via GitHub Action `bench.yml` (push to `bench-trigger.txt`; needs repo secret OPENROUTER_API_KEY; results in `bench-results/`). Winner: deepseek/deepseek-v4.1-flash (21-23/24, ~$1-2.4/mo at 100 q/day). Owner set `TALK_MODEL` to it in Railway. Gemini Flash, GPT Luna, Haiku and Mistral hit 429s (likely provider throttling at concurrency 3), so their scores are understated; rerun at concurrency 1 if a fair comparison is wanted. Workshop (self-repair) model not yet tested.

## Maintenance mode (A22)
Voice -> `maintenance_request` (tools.js MAINT_TOOLS, server.js) -> POST api.anthropic.com/v1/claude_code/routines/{MAINT_ROUTINE_ID}/fire with bearer MAINT_ROUTINE_TOKEN (Railway) -> routine "Jarvis maintenance" (trig_017yUMN1pQPd3PtArSRC2bzh, runs on the Owner's Claude plan) edits repo, pushes, writes `maintenance/last.md` (STATUS/TIME/REQUEST/RESULT). `maintenance_status` reads that file via GitHub API. The routine's sandbox cannot reach Railway, so no callback; status is polled. Routine needs the repo attached and an API trigger token generated in its settings on claude.ai/code. Plan caps routine runs per day.

## Music off = close (2026-10-01)
- `music_control` has `close` (alias `stop`): runs `bluetooth_disconnect` (pause+stop keys, force-close Spotify via `close_app`, drop the speaker, re-check up to 3 times). Persona maps "Spotify off / turn off the music / stop the music / shut it off" to it; pause stays for "pause". Server-side only, no APK reinstall.

## Music never restarts by itself (2026-10-01)
- Bug: music came back on after "Spotify off". Cause (Android app only; server never auto-starts music and maintenance_status/redeploy touch nothing): SttBridge auto-resumes music after the mic closes, and the "do not resume" window after a deliberate stop was only 120 s. Now `noResumeUntil` is sticky (Long.MAX_VALUE) after pause/stop/close_app/bt_disconnect and cleared only by an explicit start/resume/play/search; a stale `musicBefore` (older than 60 s) never resumes. Needs an APK reinstall.

## Chart reading (2026-10-01)
- `chart.js` + tool `chart_read` (tools.js CHART_TOOLS, server.js handler, persona "Charts"). Bars from Yahoo's public chart API (no key; stocks and crypto as BTC-USD), indicators computed locally: SMA 20/50/200, RSI, MACD, Bollinger, ATR, volume vs avg, swing support/resistance with touches, candle patterns, breakout/double top-bottom/squeeze. Timeframes 5m,15m,1h,1d,1w,1mo. Server-side only, no APK reinstall. Yahoo is unofficial; if it blocks Railway IPs, swap `bars()` for Alpaca data (`/v2/stocks/{s}/bars`).

## Market scanner (A24)
`signals.js` (setupScore, stopLevel, exitSignal, backtest, scan) on top of chart.js bars (Yahoo, '1dlong' = 2y daily). `trade.trending()` pulls Alpaca screener movers + most-actives. Tools `signal_scan`, `signal_watch` (tools.js SIGNAL_TOOLS). `sigTick` every 15 min in market hours -> sell-warning push for state.sigWatch + Alpaca positions, one alert per ticker per 4h. Untested against live data from the sandbox (Yahoo/Alpaca blocked here); logic tested on synthetic candles.

## Ticker news (A25)
- `news.js` builds a search plan; the model's own web search (WebSearch / OpenRouter web_search) does the searching. `ticker_news` is in `NEWS_TOOLS` (tools.js) and talk-mode `TALK_TOOLS`; signal_scan, chart_read and crypto_scan results carry `news.AUTO_NEWS` telling Jarvis to call it per named symbol. HUD panel id `ticker_news`.

## Voice-first replies (2026-10-01)
- Owner is often voice-only. Spoken replies must carry the key numbers themselves and never say "on screen" / "on the HUD" unless he asks about the screen. HUD panels still get the detail. Rule lives in config/persona.md (Style) plus the guide strings in crypto.js, news.js, chart.js.

## Market outlook (2026-10-01)
- `outlook.js` + tool `market_outlook` (tools.js OUTLOOK_TOOLS, server.js handler, persona "Market outlook"). Reuses chart.read for 1w/1d/1h, adds frame `1d5y` in chart.js. `tagsAt()` detects setups on the last bar; `backtestSetups()` replays them over 5y daily (5-bar forward, non-overlapping) giving samples, win rate, avg move, avg drawdown. Only setups with 8+ samples, 55%+ win and positive avg move count toward the score/are presented. Score -100..100 -> bias (+-25), confidence capped 80 technical-only; `newsWeighting` tells the brain to adjust via ticker_news. Server-side only, no APK reinstall. Synthetic-candle tested only; Yahoo blocked from the build sandbox.

## Pre-market in outlook (2026-10-01)
- `premarket.js` (Yahoo 5m bars incl. pre/post, 4:00-9:30 ET): gap vs prior regular close, pre-market high/low/VWAP, volume vs same-time average of earlier days (heavy >=1.5x, thin <0.5x or <20k sh), optional Alpaca IEX prints via `trade.stockTrades`. `outlook.js` adds gap x conviction weight to the score, confidence +8 heavy / -10 thin, and returns `premarket` + `tradingMode`. Stocks only; mocked-data test only (Yahoo blocked in sandbox). Server-side, no APK reinstall.

## Awake = alarms off (2026-10-01)
- Tool `alarms_off` (tools.js, server.js handler, persona "Awake") -> device action `alarms_off` -> DeviceBridge.alarmsOff: AlarmClock.ACTION_DISMISS_ALARM with search mode ALL (manifest SET_ALARM permission), optionally also Tasker task `TASKER_ALARM_TASK`. Needs an APK reinstall. Untested on hardware: if the Samsung clock ignores the intent, build a Tasker task for it.

## Investment Watch (2026-10-01)
- server.js `watchTick` (setInterval `WATCH_INTERVAL_SEC`, default 60, min 20) + tool `watch_status` (tools.js TRADE_TOOLS). Uses trade.positions() (now with price/entry/prevClose), trade.orders() (now with stopPrice) and new read-only trade.latestPrices(). Alerts through push(): STOP HIT (signal_watch stop or resting broker stop), SUDDEN DROP (`WATCH_DROP_PCT` 3 within `WATCH_DROP_WINDOW_MIN` 15), DOWN ON THE DAY (2x drop pct vs prev close); repeat every `WATCH_COOLDOWN_MIN` 10. Stocks 9:30-16:00 ET weekdays only, crypto 24/7. Pushes if Alpaca fails 5 checks in a row. In-memory price history (resets on deploy). Untested against live Alpaca (sandbox blocked); syntax-checked only. The 15-min sigTick still covers uptrend-break rules.
- NOT DONE: real resting stop-loss orders at Alpaca (the auto-mode classifier blocked the unattended run from adding order-placing code). Plan: `trade.placeStop` (stocks type stop on whole shares, gtc; crypto stop_limit only; fractional stock positions cannot carry stops) + `stop_propose` tool reusing the pendingTrade/trade_confirm flow. Needs the Owner's explicit OK in an interactive session.


## Comings and goings fix (2026-10-01)
- Bug: onMove only spoke when an item matched, so leaving/arriving Home (and any place with no items) was silent; arrival at home was never greeted. Now every leave/arrive says one short line ("Leaving home, sir." / "Welcome home, sir." / "Welcome to X, sir." / "Arrived at X, sir."), only suppressed in quiet hours (no hourly cap). place_list now reports the age of the last phone position.
- App open: location is sent every 60 s (was 10 min). Background: relies on KeepAliveService /api/loc reports (100 m / 60 s); if these never arrive (location permission denied, battery restriction, cookie missing) "He is at Home now" stays stale. Could not verify the phone side from here; check place_list's "min ago". Server and app.js only, no APK reinstall needed for the foreground part; the background service is unchanged.

## Long-term memory (A29)
- `state.memory` = [{id, fact, topic, at}], tools `remember_fact` / `list_memory` / `forget_fact` (MEMORY_TOOLS in tools.js, handlers + `memoryServer` + `memoryContext()` in server.js). `memory` is in BACKUP_KEYS (phone backup restores it after a wipe; a Railway volume is still better). Injected into the `<context>` block of every chat/work request (latest 60). Persona section "Long-term memory" tells Jarvis when to save. Short-term `state.history` (12 lines, 6 h) is unchanged.

## Photo analysis (2026-10-01)
- `vision.js` + `POST /api/photo` (server.js, own 12mb JSON limit, PIN cookie auth). HUD camera button (`#camBtn`, hidden `#camInput` capture=environment), client shrinks to 1600px JPEG. Voice trigger regex `LOOK_RE` in app.js `submit()` opens the camera; because browsers need a tap, a "TAP TO OPEN CAMERA" button appears. Result: `say` (spoken) + panel `image_analysis` (shown directly, not held, since he asked for it). Failures call `recordFailure` and are spoken. Env: `VISION_MODEL` (optional, must support images; defaults to `TALK_MODEL`). Costs counted via `addSpend`. APK: `MainActivity.onShowFileChooser` added (reinstall needed); not compiled or run from the maintenance sandbox.

## Mic button fix (2026-10-01)
- Tap-to-talk left the recognizer deaf because startMic() reopened it 500 ms after asking the wake engine to stop, but the engine frees its AudioRecord on its own thread. startMic now waits for the wake engine's `stopped` event (2.5 s fallback). Tap while the mic is really open stops it (aborts the recognizer); a tap with a stale "listening" state now starts it. Page-only change (public/app.js), no APK reinstall.

## Arrival repeat fix (2026-10-01)
- Bug: repeated "Welcome to the shop" while he stayed there. Causes: `state.at` was not backed up, so every redeploy (data/ wiped) made the next fix look like a fresh arrival; and single stray fixes outside the 250 m + 120 m margin flipped at/away.
- `onMove()` now: first fix after a wipe only learns the place (no greeting); a change of place needs 3+ consecutive readings over `PLACE_CONFIRM_MIN` (3) before it counts; re-entering a place within `ARRIVE_REARM_MIN` (30) of leaving it updates state silently; arrival needs a confirmed leave first. `at, atSince, atInit, leftAt` are in BACKUP_KEYS. Server only, no APK reinstall. Tested with a simulated move sequence only.

## Free market-data feeds (A24)
- `marketdata.js` + tools `stock_quote`, `stock_fundamentals`, `stock_news`, `stock_earnings`, `data_feeds` (tools.js MARKETDATA_TOOLS, server.js handlers, persona 'Market data feeds'). Finnhub (quote/news/earnings/ratings, 60/min), Twelve Data (quote fallback + `series()`, 8/min and 800/day), FMP `/stable` API (profile, ratios, 250/day). Soft caps sit just under the free limits; quote falls back Finnhub -> Twelve Data -> FMP; 5-minute-or-less caching on quotes, hours on fundamentals. Keys are trimmed of quotes/spaces. Mock-tested only; no live keys were available. FMP and Finnhub move free endpoints behind paid plans from time to time, so a 402/403 means that endpoint left the free plan. `chart.js` still uses Yahoo (no key); Twelve Data `series()` is the ready fallback if Yahoo breaks.

## Prompt arrival/leave checks (2026-10-02)
- Bug: shop arrival at ~10:20 was only greeted ~10 min later. The debounce needed 3 fixes over 3 min, but a stationary phone sends no new fix (background reports only every ~100 m moved), so confirmation waited for the next report.
- `onMove()` now: confirms after 2 readings over `PLACE_CONFIRM_MIN` (default 1), at once when the fix is deep inside the perimeter (60% of radius) or well outside on leave, and sets a timer to re-check the stored fix after the window so a stationary phone still confirms within ~1 min. Arrive/leave items now always fire (no chance roll); heading_to too. Leaving a place with a destination guess also says its bring line.
- `findPlace()` loose voice names (camden, the camden house) for heading_to, bring_add, bring_list. `bring_list` = bring list + that place's arrive/leave/heading items (named place, else where he is). Server only, no APK reinstall. Tested with a simulated fix; real background reports depend on the phone sending them.

## Departure checklist (2026-10-02)
- server.js `onMove()` leave branch: leaving any saved place (not straight into another) calls `askChecklist(prev, dest)` and speaks "Before you go, anything you need to remember to bring [to dest], sir? Tools, food, gas, anything for the dogs, anything for Princess?" `state.pendingQ={type:'checklist',from,dest,at}`; `state.lastCheck {from,at,answered}` (in BACKUP_KEYS). It replaces the old "Headed home/to the shop?" question (guessNext still picks the destination; a shop guess still sets work mode).
- `checklistAnswer` (via `bucketAnswer`, no AI call, 3 min window): "no/nothing" closes it; otherwise splits on commas/"and", strips filler, and `bring_add`s each item to the guessed destination, or a saved place named in the answer ("for the camden house"), else asks "Where are you headed?". Questions/commands pass through to the brain. Missed/unanswered within 12 h -> asked again on the next arrival ("You left X before I got your list") and filed under the place he left. Quiet hours suppress it. Persona tells the brain to call bring_add if an answer reaches it. Timing uses the existing prompt confirm (~1 min). Server only, no APK reinstall. Tested with simulated fixes + a websocket client.

## Mic mute (2026-10-02)
- public/app.js `muteMic()/unmuteMic()/paintMute()`, `muted` flag (localStorage `jarvis.muted`) guards `startMic`, `goActive`, `resumeListening`, `answerWake`, `syncWake`, `__wake`. `submit()` catches `MUTE_RE` (<= 8 words) before the brain; client sends `{type:'mic_muted'}`, server (`server.js`) broadcasts the spoken confirmation. Unmute only via mic button / core click / SPACE. Web-only change: no APK reinstall.

## Market alerts: suggestions, no mode (2026-10-02)
- Alerts (stop hit, sudden drop, down on day, target reached, uptrend break) now carry trigger, symbol, price and an "I would ..." line with a number. PAPER/LIVE removed from alerts, trade_status, trade_propose/confirm, outlook and persona (`trade.mode()` remains only in key diagnostics). Not built: a "fresh high-score signal" auto-alert and other triggers beyond these five; the Owner's list of eight was not specified.

## Live feeds + real-time alerts (2026-10-02)
- `livefeed.js`: 1 s scheduler. Finnhub token bucket (`FINNHUB_POLL_PER_MIN` 42, `LIVE_MIN_REFRESH_SEC` 3) polls the stalest priority stock; Twelve Data paced to `TWELVE_ROUTINE_PER_DAY` 600 (10 s min gap, rest reserved on demand), also the only crypto source; FMP `FMP_ROUTINE_PER_DAY` 40, fundamentals once/day, never prices. Errors carry `.kind` (marketdata.js `quoteFrom`): rate 60 s, auth 1 h, nokey permanent, other 15 s cooldown, then the other feed covers. Priority = Alpaca positions (`watch.items`) + signal_watch. `lf.latest(sym)` gives ageSec, tradeAgeSec, source, cross-check diff.
- `alerts.js` + server.js `alertTick` (self-rescheduling, `intervalSec`), `slowAlertTick` (new signal, news). Config `state.alertCfg` (BACKUP_KEYS) via tool `alert_config`; `watchTick` now reads the same config (drop default now 2%/15 min, day 3%). Per the later 16:10 request alerts carry NO PAPER/LIVE and end with an "I would ..." line (`act` in alerts.js triggers). stop/drop keys are shared with watchTick so they do not double-alert. Tools `live_status`, `alert_config`.
- Mock-tested only (fake fetch). No new env keys; keys stay in Railway.

## Silent / text-only mode (2026-10-02)
- `state.silent` (BACKUP_KEYS). Server `broadcast()` forces `speak:false` on every `say` while silent; `silentAnswer()` in server.js toggles it by voice before any AI call; client (`public/app.js`) gets `{type:"silent",on}`, blocks `speak()` and filler clips, chip shows TEXT ONLY. `/api/tts` returns 204 while silent.

## Chart links on alerts (2026-10-02)
- Every outgoing investment push (stop/drop/day/target/resistance/spike/volume, new buy-watch signal, news catalyst, sell warning, crypto briefs) carries a tappable link to `/chart?s=SYM&lv=stop:1.2&lv=target:3` (public/chart.html: candlesticks, 5m/15m/1h/1d/1w, dashed lines for Jarvis's stop/target/entry plus swing support/resistance; data from `/api/chart`, Yahoo bars). Built by `chartLink()` in server.js; `push(title, body, link)` sends it as Pushover `url`, ntfy `Click`, and appended text on Telegram. Needs `PUBLIC_URL` (or Railway's `RAILWAY_PUBLIC_DOMAIN`, set automatically); without a base URL no link is added. Page is PIN-protected; the login form returns to the chart after the PIN. Yahoo blocked from the build sandbox, so the chart data was not tested live.

## Longer spoken replies + chunked voice (2026-10-02)
- Persona no longer caps replies at 1-3 sentences (up to ~150 words when needed); talk `maxTokens` 700->1500. `speak()` in public/app.js now voices replies in ~350-char sentence chunks played back to back (short /api/tts URLs, first audio fast, no 2500-char cut-off); a chunk failure falls back to browser speech for the remaining text. Web/server only, no APK reinstall. Not tested on the live phone or Fish.
- Holdings box (2026-10-02): server.js watchTick broadcasts {type:'holdings'} (positions from trade.positions) every WATCH_INTERVAL_SEC and on WS connect; public/app.js renderHoldings fills the left-column HOLDINGS frame (ticker, price, value, P/L % and $, total; positions under $1 in a dust footer; hidden when none). Untested against live Alpaca.
- Tappable symbols (2026-10-02): holdings tickers are links to `/chart?s=SYM` (crypto as BTC-USD); holdings carry `watch:true` (symbol in state.sigWatch) and show a WATCH tag. HUD panels whose title mentions watch/signal/crypto/alert/holding/position/buy get uppercase 2-5 letter tokens linkified (`linkTickers` in app.js, stoplist `NOTK`). No dedicated watch-list panel exists; the watch list is those text panels. Syntax-checked only; no APK reinstall (web assets).
- Watch list box (2026-10-02): `watchlistMsg()` in server.js now also carries verdict (BUY score>=75, WATCH 55-74, AVOID below or exit warning), stop and target from `sig.evaluate`, cached 15 min per symbol (`wlEval`, refreshed in the background, rebroadcast when ready). Symbols need not be holdings; price comes from `watch.items` (includes sigWatch extras). Untested live.

## Alert "Add to watch list" button (2026-10-02)
- `push()` derives the symbol from the alert's chart link and adds a signed one-tap action (`watchLink`, HMAC with SECRET): ntfy action button, Telegram inline button, Pushover HTML link. Target `GET /watch-add?s=SYM&k=SIG` (public route, signature-checked) only calls `signal_watch add`; it never buys. Applies to every alert that has a chart link (BUY-WATCH, dips/drops, sell warnings, targets, news). Untested against the real push services.

## Watch box always on + Buy button on alerts (2026-10-02)
- HUD WATCH LIST frame is always visible (placeholder when empty) and lists signal_watch symbols plus Alpaca positions (tagged "auto"). `sigWatch` added to BACKUP_KEYS so QTEX/SDEV/SCKT survive a data/ wipe once the phone has synced.
- Every alert with a chart link now has two buttons: Buy (`/?buy=SYM`; HUD asks Jarvis to start the buy flow, still needs the Owner's spoken confirm in a later turn) and Add to watch list. ntfy `Actions` (two, `;` separated), Telegram inline row, Pushover HTML links. Login page returns to `/?buy=SYM`. If an alert has no chart link (no PUBLIC_URL / RAILWAY_PUBLIC_DOMAIN) neither button appears. Untested against real push services; syntax-checked only. No APK reinstall.

## Watch list rows complete (2026-10-02, maintenance)
- Every watch list row (signal_watch symbols AND Alpaca positions tagged auto) now gets a verdict, stop and target: `wlRefresh` evaluates all of `wlSymbols()`, not just sigWatch. Rows also show entry (sigWatch entry, or the position's avg entry via `holdings.positions[].entry`). Row: symbol, price, BUY/WATCH/AVOID, "in X · stop Y · tgt Z". Same BUY/WATCH/AVOID wording as the alerts. Untested live; syntax-checked only. No APK reinstall.

## Holdings microchart recommendation (2026-10-02, maintenance)
- server.js `holdingsOut()` enriches each position with verdict/stop/target (same `wlEval` + `wlVerdict` as alerts and the watch list), a 5-day 15m sparkline (`sparkFor`, cached 15 min), and a signed `wk` for `/watch-add` (watch only). public/app.js `renderHoldings` adds a second line per holding: sparkline, verdict, stop, target, chart link, "+ watch" button.

## Trailing stops (2026-10-02, maintenance)
- Every open position and watch row now has an alert-level TRAILING stop: `trailUpdate()` in server.js keeps `state.trail[SYM] = {high, stop}` (in BACKUP_KEYS); stop = `trailPct` (default 10, env `TRAIL_PCT`, change by voice with `alert_config set trailPct N`, no redeploy) below the highest price seen since entry, and it only ever ratchets up. Updated each watchTick from the position's entry and live price; applies from first sight of each position, so existing positions start at 10% under the higher of entry and current price. An explicit stop given to `signal_watch add` or a resting broker stop acts only as a floor.
- Holdings box shows "trail stop X" and the watch list "trail X" (current level, updates as it rises). Stop-hit, drop, day, target and uptrend-break alerts use it; alert format and chart/watch buttons unchanged. Target for alerts = signal target, else entry +2x trail%.
- Also fixed a latent bug in watchTick (entry/tgt used before declaration in the stop-hit alert).
- Still alert-level only: no resting stop orders at the broker. Syntax-checked and ratchet logic unit-tested; not run against live Alpaca.

## Volatility-aware trailing stop + scale-out ladder (2026-10-02, maintenance)
- Replaces the fixed-% trail. `trailUpdate()` in server.js: stop = highest price since entry minus `atrMult` (2) x the symbol's own 14-day ATR (`volFor`, daily bars, cached 6h), or just under the 10-day swing low (minus 0.5 ATR) if higher; ratchets up only. No ATR data -> old `trailPct` fallback. Existing trails are reset once (`t.v=2`) so volatile names are not shaken out by the old 10%.
- Ladder: R = atrMult x ATR at first sight. Tier 1 at entry+1R, tier 2 at entry+2R; alert "SCALE OUT n" says "I would sell a third" (with share count) and the last third rides the trail. From tier 1 the stop floor is entry*(1+`costPct` 0.2%) (breakeven plus costs). Both knobs via `alert_config`. Alert-level only; nothing is sold.
- HUD: Holdings rows show trail stop, next scale-out level, breakeven+costs level, open P&L and realised P&L (`trade.sellFills` read-only, filled sells since the symbol was first tracked; refreshed 5 min). Watch list rows show the next level.
- NOT DONE: real resting stop / scale-out limit orders at Alpaca. Needs the Owner's explicit OK in an interactive session (order-placing code; see Investment Watch note). Plan unchanged: `trade.placeStop` + `stop_propose` via the pendingTrade/trade_confirm flow; whole shares only for stops; crypto stop_limit.
- Untested live (Alpaca/Yahoo blocked); syntax-checked, ratchet/tier logic unit-tested with stub ATR.

## Dust filter (2026-10-02)
- `dustUsd` in alerts.js DEFAULTS (default $1, `DUST_USD` env, tunable by voice via alert_config). server.js `isDustVal`/`dustKeys` skip held positions under it in watchTick (stop/target/scale/drop), sigTick (sell warning), prioritySyms (live alerts, news), new-signal alerts and the auto watch-list rows. Independent of the watch list and of wlHide. Holdings box still shows a one-line dust summary (info only).

## Watch list persistence fix (2026-10-02, maintenance)
- Bug: HUD watch list emptied on every app restart and refilled with Alpaca holdings. Cause 1: after a data/ wipe the server stamped a NEW backup (any saveState, e.g. trail updates) before the phone's `restore` arrived, so the older phone backup was rejected and the empty memory overwrote it. Fix: `freshBoot` in server.js: while data/ has no `backupStamp`, no stamp/broadcast is made and the first `restore` is accepted regardless of stamp (if none arrives within 8 s of a connection, it starts fresh). Cause 2: `wlAuto()` auto-added holdings; now returns [] and `wlRows()` (= state.sigWatch minus held symbols) is the only source of HUD watch rows. `wlSymbols()` still evaluates open positions so Holdings keeps verdict/stop/target. Alerts on positions (sigTick, watchTick) are unchanged. APK reinstall not needed.

## Full-market sweep (2026-10-02)
- server.js `sweepTick` (60 s timer, runs when `sweepEveryMin` (alerts.js, default 18) has passed, market hours, Alpaca configured). Pool = trade.trending(40) + `trade.SWEEP_UNIVERSE` (static list) + signal_watch; `trade.snapshots` prefilters to up-today, price >= $2; `sig.scan` scores `sweepSize`; alerts via `liveAlert` key `SYM:newsig` (shared cooldown with slowAlertTick). Stats in `state.sweep` / `state.sweepCount`, shown by watch_status. Syntax-checked only; Alpaca snapshots untested live. No APK reinstall.

## Biggest-mover sweep, stocks + crypto (2026-10-02, maintenance)
- server.js `moverTick` (60 s timer, runs when `moverEveryMin` (alerts.js, default 30) has passed). Stocks only in market hours (Alpaca snapshots over trending gainers/losers/actives + SWEEP_UNIVERSE + signal_watch, price >= $2; `trade.trending` now also returns `losers`); crypto 24/7 (crypto.js scan top 100, 24h). Picks the ONE largest |move|; alerts via `liveAlert` key `SYM:mover`, title `MOVER: SYM`, only if it passes alertCfg (spikePct with spikeVolRatio, dropDayPct, or unusualVolRatio with spikePct). No qualifier = fully silent. Volume ratio from `alerts.context` (Yahoo); if unavailable the volume test is skipped. Crypto 24h move comes from CoinGecko (rate limits possible without COINGECKO_API_KEY; a failed call just skips crypto that run). Separate from the 18-min BUY-WATCH `sweepTick`. Syntax-checked only; untested live. No APK reinstall.

## Volume-first staged alerts (2026-10-02, maintenance)
- Stage 1 = volume UP vs the 20-day average (`volFirstRatio`, default 1.5, 0 = off; tunable live via `alert_config`), no price move needed. Then stage 2 price confirming up (not down, not fading), stage 3 price above a rising 20-day MA plus spike volume (`unusualVolRatio`). alerts.js `triggers`: "VOLUME FIRST (EARLY)" until stage 2+3 pass, then "VOLUME FIRST, CONFIRMED". The old INFO unusual-volume alert only runs when volFirstRatio is 0. server.js `moverTick` checks the top 8 gainers for stage 1 first. Sweep/new-signal score (`newSignalScore`) still gates the separate BUY-WATCH setup alerts. Informational only, never trades. Syntax-checked and unit-tested on synthetic quotes; not run live. No APK reinstall.

## Maintenance 2026-10-02: truck auto-connect + pinned meal prompts
- OBD: `state.vehicles` is seeded once (`seededTruck`) with {name:'truck', dongle:'OBDII'}. `obdTick` (every 60 s, app connected): not yet connected / last try failed -> retry every `OBD_RETRY_MIN` (3) so it connects as soon as the dongle is in range; connected -> read every `OBD_EVERY_MIN` (20). `v.lastOk` tracks success. Alerts unchanged (only new/concerning). Server only, no APK reinstall (needs the phone app open/background as before).
- Meals: `mealTick` (60 s) is clock-pinned, NOT the random bucket. On a work day (`workDay.on`) at 10:00 (`MEAL_ASK_FROM_MIN` 600, catch-up 45 min) asks coffee/breakfast. Answer (`mealAnswer` via bucketAnswer, or tool `meal_answer`): both -> lunch asked 14:00 (`LUNCH_LATE_MIN`); coffee/none/unanswered -> lunch 12:00 (`LUNCH_EARLY_MIN`). Each asked once per day, state.meal (backed up). Untested against a live phone.

## NIGHT routed to crypto (2026-10-02)
- NIGHT (CoinGecko id `night`) is a coin, not a stock. `crypto.js` `COIN_IDS`/`coinIdFor` map such tickers to CoinGecko; `stock_quote` for NIGHT / "NIGHT USD" now returns the CoinGecko quote (price, 24h, 7d, volume) instead of the equity feeds. `resolveId` short-circuits to the id; `night` is seeded once into the watchlist (`state.nightSeeded`) so the tile, crypto_scan and crypto_trending data include it. NIGHT added to the crypto ticker sets in chart.js, news.js and public/app.js. Add other stock-looking coins to `COIN_IDS`. Untested live (network blocked).

## Vehicle start = departure trigger (2026-10-02)
- `obdScan` (server.js): engine seen running (rpm>0) after >`DEPART_GAP_MIN` (30) of not running -> `vehicleDeparture()` asks once per drive "Are you leaving X, or headed somewhere? <up to 3 places>?" (pendingQ type `depart`). While parked and in range the dongle is polled every `OBD_WATCH_MIN` (2) so a start is caught fast.
- `departAnswer`: a named place -> leave reminders for the current place + `bringLine(dest)` + `heading` reminders (same lines as `heading_to`); "leaving" with no place -> guessNext or leave reminders only; "no/staying" -> "Very good, sir." `state.departed` stops the normal leave-the-perimeter checklist from asking again for 45 min. Tested: syntax and boot only, not with a real dongle.

## Coin tickers on the stock watch list (2026-10-02)
- `cgRefresh` (server.js) now also fetches CoinGecko ids for `state.sigWatch` symbols that `crypto.coinIdFor` knows (NIGHT), so a NIGHT row there gets a live price/24h change instead of blank. Add more tickers to `COIN_IDS` in crypto.js. Syntax-checked only.

## Watch list written verdicts (2026-10-02, maintenance)
- server.js `wlCall(ev, entry)` builds a written call per watch row: action (BUY/HOLD/SELL/WATCH/AVOID; HOLD/SELL when the row has an entry price, SELL/AVOID on an exit warning), trend, confidence, plain-English reasons, stop/target, back-test line. Stored in `wlEval[sym].call`, sent as `call` in `watchlistMsg` rows; app.js `renderWatchlist` prints it as a second line under every row. Crypto watchlist coins (NIGHT) are now evaluated too (`wlSymbols`) so they get a call; if Yahoo has no candles for a coin, that row shows price only. Spoken replies unchanged. Untested live; syntax-checked and wlCall unit-run. No APK reinstall.

## Departure trigger fix (2026-10-02)
- Bug: key off then restart within `DEPART_GAP_MIN` (30) never re-fired the vehicle-start ask (gate was time since last seen running). Now a start counts if never seen running, OR seen off/unreachable since (`v.sawOff`, set when a scan shows rpm 0 or the dongle drops), OR gap > 30 min. 3-min guard stops a double ask.
- `state.departed` now suppresses the normal leave announcement only once the vehicle-start question was ANSWERED; unanswered = the leave announcement still fires. Leave announcements ignore quiet hours and always `push()` too (`deliver(..., alsoPush)`), since a connected-but-backgrounded app can't speak.
- Debug: `dlog()` keeps the last 60 departure decisions (vehicle-start with rpm/volts/newStart/fired, vehicle-unreachable, leave, leave-announce with spoken/text) in `state.departLog`; open `/api/depart-log`. Also in server logs as `depart: {...}`.

## Google Maps navigation awareness (2026-10-03)
- Tasker (Event > Notification, app Maps) -> HTTP POST `/api/nav?token=<state.outboxToken>` with body `{"title":"%antitle","text":"%antext","sub":"%ansubtext","big":"%anbigtext"}` (also accepts dest, eta, event=arrived|end). Setup steps + the URL: PIN-protected `GET /api/nav-setup`. Tasker needs Notification access.
- server.js `parseNav`/`navUpdate`: destination from "to X" text, ETA from a clock time, minutes from "N min". State `state.nav` {on,dest,place,eta,minutes,updatedAt,...}. New trip to a saved place (findPlace) = heading: leave items for where he is, bring list, heading items, via deliver() (+push); once per place per 30 min. "arrived"/end clears; arrival at a saved place runs the arrive logic (`navArrive`). No update for `NAV_STALE_MIN` (10) = not navigating. Tool `maps_nav_status` (read-only). No APK change.
- Untested against a real Maps notification (tested with simulated POSTs). If the destination is not in the notification text on his phone, send `dest` from a Tasker variable or check what %antext holds.


## Driving co-pilot (A34, 2026-10-03)
- server.js `copilotTick` (60 s) / `copilotAnswer` / `isDriving` / `foodPref` / `nearbySpot`; `state.copilot` {day,sent,declined,ate,topics,trip,tripEnd,lastAt} in BACKUP_KEYS. Driving = `navLive()` or a vehicle with `lastRun` < 25 min and no `sawOff`. Only topic so far: meal nudge, delivered via deliver(..., push) with `pendingQ {type:'copilot'}`; answers: decline -> `declined` for that slot today, "already ate" -> `ate`, tool `ate_now`. Limits: `COPILOT_MAX_DAY` 2, `COPILOT_SETTLE_MIN` 6, 40 min between nudges, one per topic per trip.
- Food preference is read from memory facts (phrases like "likes X", "usually gets X", optional "at/from Chain"); the Owner must have told Jarvis (remember_fact) e.g. "likes breakfast burritos from Wawa". Place lookup is optional: set `GOOGLE_PLACES_KEY` (Places API New, Text Search) on Railway; without it the line has no place. "On the right" is not computed.
- Meal defaults (2026-10-03, maintenance): `MEAL_DEFAULTS` in server.js: breakfast = Wawa breakfast burritos, lunch = Chick-fil-A. `foodPref(slot)` order: memory fact naming that meal, built-in default, any generic liked-food fact. Place lookup searches the chain name near the phone.
- Open: the Owner trailed off after "because..." in the request; there may be an extra rule. Ask him. More co-pilot topics (gas when fuel low, calendar running late) not built. Syntax-checked only; server boot not run (no node_modules in the sandbox). No APK reinstall.

## Travel protocol: engine start, then movement (2026-10-03, maintenance)
- Two stages off ONE detector. Stage 1 (engine start, OBD rpm>0) asks "leaving X or headed somewhere?" + bring/leave/heading lines (unchanged, `vehicleDeparture`/`departAnswer`). Stage 2 = vehicle MOVEMENT: `driveSignal`/`driveFix`/`driveStart` (server.js, above `isDriving`). `state.drive` {moving,since,lastMoveAt,mph,src,fix}. Moving = phone GPS speed or OBD speed >= `MOVE_MPH` (5); stays moving `MOVE_HOLD_MIN` (5) after the last signal; Maps nav live also counts. Engine on alone is NOT movement.
- `isDriving()` = nav live or `state.drive.moving` (the old "engine seen in last 25 min" rule is gone). `copilotTick` (meal nudge) only runs while moving, no stored food preference needed now (generic "you haven't had breakfast, there's a X nearby" if GOOGLE_PLACES_KEY, else offers to find a spot). Arrive/leave lines (`onMove`) use the same location fixes.
- Why it never fired Oct 2: engine-on OBD was polled only every 20 min, a single failed dongle read set `sawOff` (killed driving), and the phone sent no speed. Now: connected dongle polled every 2 min (`OBD_WATCH_MIN`), `/api/loc` and the websocket both feed `driveFix` (speed derived from consecutive fixes if absent), and if movement starts without the engine-start question having been asked (app asleep, dongle missed) `driveStart` asks it then.
- Android (needs APK reinstall to get): background location every 30 s / 50 m (was 60 s / 100 m), sends `speed` (m/s), ObdBridge reads PID 010D `speedKph`. Without the new APK the server still works from derived GPS speed. Debug: `/api/depart-log` shows `drive-start` / `drive-end`. Syntax-checked only; not tested on a live drive.

## Alert "Add to watch list" for coins (2026-10-03, maintenance)
- Bug: the button on a crypto alert (e.g. RAIN/USD) sent RAINUSD to `signal_watch add`, which treated it as a stock and failed ("Chart data source returned 404 for RAINUSD"). Now `signal_watch add` recognises RAIN/USD, RAIN-USD, RAINUSD(T): looks the coin up on CoinGecko by exact symbol (`coinFallback`), learns it (`state.coinIds`) and puts it on the crypto watch list (`state.watchlist`); live price from Kraken WS, candles/verdict from Kraken OHLC when Kraken lists it. Reply starts with "Watching" so `/watch-add` shows success.
- Follow-up fix (2026-10-03): the Owner's tap at 12:42 hit the old build (fix e4bd8b9 deployed 12:44). Two holes closed in `coinFallback`: (1) a coin already learned (or built in, e.g. NIGHT) was rejected because `resolveId` returns the id as its symbol, so a second tap on RAIN/USD failed with the stock 404; now `coinIdFor` short-circuits. (2) A CoinGecko hiccup/429 dropped through to the stock chart feed; now one retry after 2 s, price is optional (watch list fills it later), and RAINUSD-style symbols (6+ letters) never fall through to the stock path; the page says the real reason (rate limit -> set `COINGECKO_API_KEY`). Stub-tested; untested live.
- 2026-10-04: coin adds now work (BTW/USD confirmed added), but the tap left the Owner on a browser page. `/watch-add` success page now names the coin ("BTW (name)", not "BTWUSD"), tries `window.close()` after 1.2 s then `history.back()`, and has a "Back to Jarvis" button (Android intent for package `app.jarvis.hud`). Pushover links always open the browser; a fully silent add would need a `jarvis://` deep link in the APK.
- 2026-10-04 root cause of "BTW added but not on the HUD": no Railway volume (confirmed via Railway API: project has 0 volumes). The tap at 01:18 added BTW on the server; the Jarvis app was not connected, so the phone backup never got it; the 01:20 push redeployed, wiped data/, and the phone restored its older backup without BTW. Fix = Railway volume (server picks up `RAILWAY_VOLUME_MOUNT_PATH` automatically). Also fixed: watch list adds used `.slice(0, 25)` after appending, so on a full list the new coin was silently dropped; now the newest 25 are kept. Volume `jarvis-2.0-volume` mounted at /data (2026-10-04). Phone-backup restore now merges `watchlist`, `sigWatch`, `coinIds` with what the server already has (an alert tap while the app was closed is no longer overwritten by an older phone copy). `/watch-add` logs `watch-add SYM: result | crypto list` to the Railway deploy log.

## Watchlist additions: single acknowledgement (2026-10-03)
- Standing rule in `config/persona.md` ("Watchlist additions") plus a note in the `crypto_watch` tool description: adding a ticker/coin to the watchlist gets one short acknowledgement, no re-confirmation, no "see it on screen?" offer; crypto adds never get a follow-up question.

## Music vs resume-last-media (2026-10-03)
- Bug: "get some tunes going" resumed YouTube. Cause: `spotify_resume` opened Spotify but pressed a GLOBAL media Play key, which Android gives to the most recent media session. Now `DeviceBridge.mediaKeyToSpotify` sends the key only to com.spotify.music (needs an APK reinstall; until then the old behaviour remains).
- `music_control` start/play/resume = Spotify only. New action `resume_last` = global media Play key (YouTube etc.), persona: "resume YouTube / what I was watching / last media".
- `pickSpeaker` now never returns a headset (Arctis/Nova/Omni) for the shop; it falls back to the taught Rockville. Default volume stays 65%. Live speaker data lives on the phone backup, so say "list my speakers" to confirm shop = Rockville.

## Music playback verification (2026-10-03)
- `music_control` start/play/resume no longer reports unconfirmed success. Server `startAndVerify` runs up to 3 start attempts (device action `spotify_resume` mode launch / search), polling device action `media_status` (Android `DeviceBridge.mediaStatus`: audio active, Bluetooth route, volume, media sessions with state/track/artist). Result is `SUCCESS: ...` or `FAILED: <reason>`. `status` returns the real track/artist/playing.
- Track/artist and 'is it Spotify' need Notification access for Jarvis (Android Settings > Notifications > Device & app notifications > Jarvis); `JarvisNotificationListener` is an empty listener only for MediaSessionManager. Without it, only 'audio playing or not' is known and the reply says so. Needs APK rebuild+reinstall. Android code was not compiled in the maintenance sandbox.
- Spotify Web API path also verifies via `spoVerify`. `DEFAULT_VOLUME` is now 40 (speaker saved volume still wins).

## Departure trigger hardening (2026-10-03)
- Engine-start "Are you leaving the shop, or headed somewhere?" now uses `hereNow()` (placeFor with hysteresis, so a rounded fix just outside the 250 m perimeter still counts as at the shop), and also fires when OBD run time since engine start (`runSec`, PID 011F, new in ObdBridge.java, needs APK reinstall) shows a key cycle between two 2-min scans. Without the APK it behaves as before. Check GET /api/depart-log for `vehicle-start` (`restarted`, `runSec`) and `leave` decisions.

## Wake-up call (2026-10-03)
- Tool `wakeup_call` (tools.js, server.js handler, persona "Wake-up call") -> say line, wait 4.5 s, device action `siren` -> DeviceBridge.siren (AudioTrack, USAGE_ALARM, STREAM_ALARM forced to max then restored, prefers the built-in speaker) -> say "I'm over here." `siren_stop` is called by alarms_off. Server part is live on redeploy; the siren needs an APK rebuild and reinstall. Not compiled here (no Android SDK).

## Shut the shop down (2026-10-03)
- `handlers.shut_shop_down` in server.js (block before Maintenance mode). Steps: music_control close (Spotify force-stop + speaker disconnect; bluetooth_disconnect as retry), then `state.shutdown` {active, deadline, round, dongleSeen} + real `setTimeout` (`shutdownArm`, re-armed on boot) + `shutdownHunt` (obdTick every `HUNT_GAP_SEC`=30 s, all vehicles). Running engine seen in obdScan -> `shutdownSeen` ends the hunt, normal `vehicleDeparture` question follows. Deadline -> `shutdownFire` speaks + pushes the leaving/staying question (pendingQ type `stay`, then `stay_music`, answered in `stayAnswer` with no AI call). Untested on hardware; no node_modules in the maintenance sandbox so only `node --check` was run.

## Alert "Add to watch list" fix (2026-10-04)
- `/watch-add` success page used `window.close()`/`history.back()`, which dropped the Owner into whatever app opened the link (social media). It now redirects to the Jarvis app intent (`app.jarvis.hud`); the Back to Jarvis button stays as fallback.
- `push()` stores the full alert (title, body, entry/stop/target levels) in `state.recs[symbol]` (in BACKUP_KEYS) via `rememberRec`; `watchlistMsg` rows carry `rec`; `renderWatchlist` shows a "JARVIS RECOMMENDATION" row (entry, trailing stop, next level, full analysis text). Also fixed `pushTelegram` missing `buy` param.

## Two-way departure alerts (2026-10-04)
- Problem: departure/"before you go, anything to bring?"/vehicle-start alerts went out by Pushover (one-way). `deliver()` now routes question alerts (`state.pendingQ` set within 15 s) through `alertOut()`: Telegram when `TELEGRAM_BOT_TOKEN` is set (reply right from the notification), else the normal push with a link that opens Jarvis.
- `tgPoll()` long-polls Telegram getUpdates; text from the Owner's chat (must equal `tgChatId()`) goes through silentAnswer/panelAnswer/shopAnswer/bucketAnswer (so checklist/depart answers work with no AI call) else `ask(text,{spoken:false})`. For 90 s after a reply, every `say` broadcast is echoed back to Telegram. Needs the Telegram bot already set up (token in Railway, Owner messaged the bot once). Mock-untested against real Telegram; syntax checked only. Server only, no APK reinstall.

## Arrival vs departure fix (2026-10-04)
- While a departure question is open (`pendingQ` dest/checklist/depart), a statement like "no, I'm over at the Camden house now" is caught first by `arrivalStatement()` (server.js, before the answer handlers): it closes the question, runs `navArrive()` (bring items for that place cleared, arrive items, "Welcome to X"/"Hope you remembered ...") and never says "safe travels".
- GPS arrival no longer asks the missed departure checklist. The vehicle-start question offers only the guessed next place, never every saved place.

## Departure alerts late / via wrong app (2026-10-04)
- Owner: left The Camden House ~12:18, nothing at engine start or leaving; only alert was a Pushover at 12:46 on arriving Home.
- Log: 16:18Z drive-start (GPS, 16 mph) with `pendingQ: true` -> a stale question blocked the departure ask. No `vehicle-start`/OBD lines (dongle never read). 16:27Z leave confirmed, question routed by `alertOut` to Telegram (Owner watches Pushover). 16:46Z arrival re-ask (now removed by 34c6a9f).
- Fixes: `driveStart` ignores/clears a `pendingQ` older than 3 min. `alertOut` always sends question alerts by Pushover; Telegram only gets an extra reply-able copy; logs `alert-out "title": sent|error`. Pushover link label "Open Jarvis" unless /chart. OBD logs (max every 30 min) when the phone app is not connected as a device or a scan fails.
- Open: engine start needs the Jarvis Android app alive as a device client; if Android kills it, GPS movement is the trigger.

## Watch list default entry (2026-10-04)
- Adding to the watch list without an entry now always uses today's live price as the entry and computes the trailing stop from it. Stocks: signal_watch already did. Crypto: `cryptoDefaults()` in server.js stores `state.cEntry[coinId]` (in BACKUP_KEYS) when crypto_watch / a coin fallback adds it, and lazily for old rows with no entry; crypto rows now show entry + trailing stop. Remove clears it.

## Leaving prompts are live voice, not notifications (2026-10-04)
- `deliver(text, title, question)` in server.js: for the departure questions ("Where are you headed?", "Before you go, anything to bring?", truck-start prompts) the third arg now means question. App connected -> spoken at once (0.3 s) through the app/HUD and NO push; his spoken answer goes through the existing `pendingQ` handlers (`departAnswer`, `checklistAnswer` -> heading_to / bring_add). App not connected -> notification as a last resort, and the question is held 10 min and spoken when he opens the app (`takePendingSay` ttl). Trigger timing unchanged. Server only, no APK reinstall. Syntax-checked only.


## Departure prompt 3: vehicle check offer (2026-10-04)
- `obdScan` engine-start arms `state.vscan {vehicle, at, offered}`. After the departure/bring-list answer succeeds, `vscanTail()` (server.js, above `departAnswer`) appends `vscanOfferText()` to the spoken reply and sets `pendingQ` type `vscan`; `vscanAnswer` handles yes (reads `vSpoken`: volts, MIL, codes, pending, readiness, trims, freeze frame, coolant, fuel) / no (dropped, never repeated that trip) with no AI call. Offered once per engine start (20 min window). Spoken live via the same answer path as the other prompts. Only chained when he actually answers a leaving question; syntax-checked and offer text tested, not driven live. No APK change.

## Silent mode = full silence (2026-10-04)
- `silentAnswer` (server.js): silent on mutes the mic client-side (`silentMuted` in app.js, reuses muteMic/unmuteMic), all speech stripped in `broadcast`, `wakeup_call` refused. Wake (opening the app) no longer clears silent. Off phrases unchanged; they must be typed (or Telegram) while the mic is muted.

## Silent mode fix (2026-10-04)
- Silent mode no longer mutes the mic (muted mic made "silent mode off" impossible by voice). It ends by voice (also "death mode off", "stop silent mode"...), by tapping the TEXT ONLY chip (`silent_off` ws message), and automatically after `SILENT_MAX_HOURS` (default 8; `silentActive()` / `setSilent()` in server.js; `state.silentAt` in BACKUP_KEYS).

## Gaming mode (2026-10-04)
- `handlers.gaming_mode` / `gaming_config` in server.js (block before Maintenance mode), tools in tools.js, persona section "Gaming mode". State `state.gaming` {rooms{house|home:{screen,input,soundbar}}, defaultRoom, defaultGame, games{name:{titleId}}} (in BACKUP_KEYS). HUD panel id `gaming`.
- Reality: Railway cannot reach the TV or PlayStation (home LAN), and the phone app has no PlayStation control. So each step (tv_on, soundbar_on, tv_input, ps_wake, ps_connect, ps_launch) is sent to a LAN bridge at `GAMING_BRIDGE_URL` (+ optional `GAMING_BRIDGE_TOKEN`): POST /step, answer {ok, confirmed, detail}. Only confirmed:true counts. No bridge = every step NOT DONE with what it needs. The bridge itself is NOT built yet.
- Likely bridge: Pi/PC on each LAN (house, home) with HDMI-CEC (cec-client: TV on, active source, console wake via One Touch Play) and playactor or ps5-mqtt (wake, connect, launch by title id; needs the PSN login and PS5 "turn on from network" enabled). Remote Play from the cloud is not workable (needs the console on a reachable network and a PSN session). IR blaster is the fallback for TV/soundbar.
- Needs from the Owner: bridge hardware, PlayStation title id for the default game, which HDMI input the PS is on in each room.
- UPDATE 2026-10-04: the PHONE is now the bridge when GAMING_BRIDGE_URL is unset (Owner has no PC/Pi at the house). `ps5.js` holds the Remote Play protocol (ported from pyremoteplay; registration packet + AES-CFB/HMAC IV + wake credential verified byte-for-byte against pyremoteplay 0.7.6 with a fixed nonce). The phone only moves bytes: new device actions `udp` {host|'broadcast', port, b64, waitMs, max} -> [{from,b64}] and `tcp` {host, port, b64, waitMs} -> {b64} (DeviceBridge.lanUdp/lanTcp; ACCESS_WIFI_STATE added; reply() now posts to the UI thread). Needs an APK rebuild + reinstall.
- Pairing (one time, tool `gaming_pair`): no PSN account id -> broadcast `open_url` /api/ps/login -> Sony login INSIDE the WebView (MainActivity now keeps sony/playstation hosts in-app and turns the remoteplay redirect into /api/ps/oauth?code=) -> server swaps code for token + user_id -> base64 LE account id in state.gaming.ps. Then the Owner reads the 8-digit Link Device code -> gaming_pair pin -> phone: DDP SRCH broadcast (9302), UDP SRC3/RES3 (9295), TCP POST /sie/ps5/rp/sess/rgst -> RegistKey saved in state.gaming.ps.
- Gaming mode in phone mode: order ps_wake (DDP WAKEUP with credential, polls SRCH up to ~30 s for 200 Ok), ps_connect (status + running app), then TV/soundbar/input rows marked "follows the PS5 over HDMI" (CEC One-Touch Play already works at the house; not confirmable). ps_launch: PS5 has no network launch command; CONFIRMED only if the requested title is already running, else NOT DONE "press X".
- Untested on hardware. If pairing fails: check the phone is on the house Wi-Fi, the PS5 is ON (not rest) with the Link Device code on screen, and that Sony's login page still accepts the Remote Play client id.

## Mic deaf after old silent mode (2026-10-05)
- Cause: the old full-silence build saved `jarvis.muted=1` on the phone; the newer build never clears it after a reload, so the mic stayed muted. Fix: one-time clear of `jarvis.muted` (flag `jarvis.muteFix1`) in public/app.js. Deliberate voice mutes made afterwards still persist. Web fix only, no APK reinstall.

## Real resting stop orders (2026-10-05, maintenance)
- trade.js: `stopOrders`, `stopCheck`, `placeStop` (stocks: `stop` or `trailing_stop` with trail_percent/trail_price, whole shares, gtc; crypto: `stop_limit` only, limit 1% under stop), `amendStop` (PATCH /v2/orders/{id}), `cancelOrder`, `stopError` (strips mode wording). server.js: tools `stop_list`, `stop_propose`, `stop_confirm` (module `pendingStop`, same propose -> later-turn confirm -> 2 min expiry guard as trades; refused unless turn.origin is user; `trade_cancel` clears it). Rejections and "cannot support a stop" cases call `recordFailure`.
- watchTick now carries `brokerStop` (the resting order) per item. Alerts: `ALERT LEVEL TOUCHED` (+ "you need to act" when no broker stop) vs `BROKER STOP TRIGGERED` (order resting at the broker); same in alerts.js. watch_status lists restingBrokerStops, heldWithoutBrokerStop and alertLevels. `GET /api/stop-orders` is read-only.
- Not done: the trailing alert level (trailUpdate) is independent of broker stops; an amended broker stop does not move it. Untested against live Alpaca (mock fetch only). No APK reinstall.

## Quiet ("not now") mode (2026-10-05)
- server.js `quietAnswer` / `quietActive` / `quietBlocks`. Gates: `push()` (4th arg `force` skips it; `phone_alert` uses force), `deliver()` (all unprompted remarks), the 25-min idle loop. Critical regex `CRITICAL_ALERT` passes unless `state.quiet.absolute`. Chain order: silentAnswer, panelAnswer (pending questions win over a bare "not now"), quietAnswer, shopAnswer, bucketAnswer. Held-back alerts are dropped, not queued. Clients get `{type:'quiet'}` (no HUD chip yet).

## Auto "build deployed" notice (2026-10-05, maintenance)
- server.js `deployNoteTick` (20 s after boot, then every 60 s until sent). When `state.maintLast` (now in BACKUP_KEYS) is not `announced` and the deployed `maintenance/last.md` TIME is not older than the request, it builds a line from STATUS/TIME/RESULT (first two sentences) via `deployNoteText`, speaks it with `deliver()` if the app is connected, and always `push()`es "Jarvis updated". Sends once, then sets `maintLast.announced`. Quiet mode holds it (retries each minute) instead of dropping it. A fresh manual "maintenance status" also marks it announced. The code push deploys first with the old last.md (silent); the last.md push deploys the build that announces. Server only, no APK reinstall. Syntax-checked only.

## Always-on dongle watch (2026-10-05)
- The OBD watch was already independent of "shut the shop down" (obdTick runs whenever the phone app is connected as a device), but it ran only every 60 s tick, retried a missing dongle every 3 min, and skipped entirely while the brain was `busy`. Now: tick 15 s, `OBD_RETRY_MIN` default 0.75 (about 45 s), busy no longer pauses it. Running engine on first sight (or after the dongle dropped) = engine-start trigger at any place/hour (`vehicleDeparture` -> where to / bring list -> `vscanTail` offer, unchanged). New depart-log entries: `dongle-seen` (dongle came into range), `obd-skipped` (phone app not connected as a device). If the dongle is still never seen, check /api/depart-log: `obd-skipped` means the Android app's websocket is asleep (not a server problem). Server only, no APK reinstall. node --check only.

## Holdings DUST group (2026-10-06)
- HUD Holdings splits by market value: under $5 (`DUST_MAX` in public/app.js `renderHoldings`) goes to a "DUST" sub-group beneath the main table, one row each, sorted by value; main TOTAL excludes dust. Display only: server alert/watch dust (`dustUsd`, default $1) is unchanged.

## Alert chart link: TradingView (2026-10-06)
- `/chart` (public/chart.html, same URL alerts already use) now embeds the TradingView free widget (tv.js): range buttons 1D/1W/1M/3M/1Y/ALL, pan/zoom, symbol change. Crypto maps to COINBASE:XXXUSD, stocks to the bare ticker. Alert levels (stop/target/entry) show as text above the chart; the JARVIS LEVELS button toggles the old canvas chart (Yahoo/Kraken data, 1w max) which still draws them as lines. No server or APK change. Untested against live TradingView from the build workspace.

## Departure dialogue: restart + notification fixes (2026-10-06, maintenance)
- The three-stage spoken sequence (where to / bring list / vehicle-check offer) was already live dialogue via `deliver(..., question)`. Fixes: (1) Oct 2 miss: `obdScan` ignored a restart inside 3 min of the last ask (`recent`); after a seen key-off/restart (`sawOff`/`restarted`) the guard is now 45 s. (2) When the app is NOT connected the notification no longer carries the question; it only says "Open Jarvis, sir. I have a question for you." and the question is held 10 min and spoken on open. (3) `departAnswer` accepts an unsaved destination ("headed to Lowe's") and still chains the vehicle-check offer. Server only, no APK reinstall. node --check only; not driven live.

## Spoken arrive/leave when the app is closed (2026-10-06)
- `deliver()` (server.js): app connected = spoken live (unchanged). App not connected = every line (arrive, leave, vehicle-data offer, questions) is now held 10 min and spoken aloud when the app opens, AND sent as a Jarvis-voice (Fish) audio clip via Telegram `sendAudio` (`sendVoiceClip`, needs FISH_API_KEY + TELEGRAM_BOT_TOKEN; clip cached in data/). The normal push still goes out. A push alone can't speak; the clip plays in the Telegram chat. Server only, no APK reinstall. Syntax-checked only.

## Silent/mic phrases widened (2026-10-09, maintenance)
- Silent mode and mic mute already existed (see above). Added triggers: "no mic no talk" (client mutes the mic AND sends the text to the server, which turns silent mode on), "talk again", "unmute", "voice back" now end silent mode. Bare "mute"/"quiet mode" still mean Quiet (no unprompted output), unchanged. Mic unmute is by tapping the mic button (a muted mic cannot hear a voice command). Web/server only, no APK reinstall.
- Maintenance routine failure "credit balance is too low": the routine runs on the Owner's Claude plan via MAINT_ROUTINE_TOKEN; if the error shows, the key in use is an API key with no credit. Owner must check which Anthropic key the Railway fire path uses; not fixable from the repo.

## Post media (2026-10-09, maintenance)
- `media.js`: raw uploads (private) in DATA_DIR/media/raw, finished posts in media/out served publicly at /m/<16 hex>.jpg|mp4 (PUBLIC_FILES regex in server.js). Upload page GET /media, POST /api/media (raw body, 300 MB, PIN cookie). Tools in tools.js MEDIA_TOOLS (media_list, media_prepare); social_draft takes mediaFile and refuses Instagram without media and YouTube without video. social.js publish sends `assets: [{ video: { url } }]` or image.
- Needs ffmpeg: `nixpacks.toml` adds it on Railway. sharp is an npm dependency. Font bundled at config/fonts (Railway has none); media.js points FONTCONFIG_FILE at it.
- Unknown: whether Buffer needs extra YouTube/Instagram video metadata (title, reel type) via API; first real Short will show. Without a Railway Volume, media is wiped on every push.

## Social button (2026-10-09, maintenance)
- public/index.html #socBtn + app.js (SOC_RE, openSocial, uploadSocial): upload to /api/media then `submit('Social post: new upload <file>, brand X ...')`. Persona section 'Social button' tells the brain the workflow. Tools media_describe (vision.js analyzePhoto on a resized photo or ffmpeg frame), media_prepare music param (media.js pickMusic, MUSIC dir, amix under original sound, fade out). SOCIAL_AUTOPOST=1 makes social_draft send immediately. Voice trigger opens the picker; browsers only allow that from a tap, so a TAP TO PICK button shows if the open is blocked. No APK change: the existing file chooser handles image/video.
