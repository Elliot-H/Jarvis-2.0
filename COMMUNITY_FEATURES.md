# Jarvis: community feature list (compiled 2026-10-13)

What people build into their own Jarvis-style assistants, from public repos and write-ups (isair/jarvis, PersonalJarvis, danielsantos2310/jarvis, Julian-Ivanov, amanimran786, Home Assistant's AI release notes, an XDA voice-command article, and OpenClaw use-case lists from Hostinger, Latenode and foxessellfaster).

Numbering continues IDEAS.md (1-50), so Owner picks by number: "build 61 and 95". **Status** says what Jarvis already has or lists; blank = new.


## H. Voice and conversation

| # | Feature | Seen in | Status |
|---|---|---|---|
| 51 | Wake word works anywhere in a sentence ("so, Jarvis, what's…") | isair |  |
| 52 | Follow-up questions without repeating the wake word (conversation window stays open) | isair, Home Assistant |  |
| 53 | Echo detection: ignores its own voice and the shop radio | isair |  |
| 54 | Knows when you are talking to someone else in the room and stays out of it | isair |  |
| 55 | Interrupt mid-sentence with "stop" | isair | partly (silent mode) |
| 56 | Streaming speech: starts talking before the whole answer is ready (about 9-13x faster in HA's tests) | Home Assistant |  |
| 57 | Instant "On it, sir" reply while the slow brain keeps working | PersonalJarvis |  |
| 58 | Realtime speech-to-speech mode (OpenAI Realtime / Gemini Live) with fallback to the normal pipeline | PersonalJarvis |  |
| 59 | Different voice/model per device or room | Home Assistant |  |
| 60 | Room-aware answers: knows which room or device you spoke to | Home Assistant |  |
| 61 | Adaptive tone: technical with the shop, business with Nexus, calm for wellbeing | isair |  |
| 62 | Custom dictionary for names and jargon (film brands, car models, customers) | isair |  |
| 63 | Extra wake phrases and custom wake phrase | PersonalJarvis | idea A19 |
| 64 | Bilingual auto-detect (Spanish customers) | PersonalJarvis, isair |  |
| 65 | Jarvis starts the conversation from an automation: "Bay door is still open, close up?" | Home Assistant | partly (departure questions) |
| 66 | "Broadcast: dinner's ready" announces on every speaker | XDA voice commands |  |
| 67 | "Nevermind" aborts any routine in progress | XDA voice commands |  |
| 68 | Voice dictation into any app on the PC by hotkey, with filler-word clean-up | isair |  |
| 69 | Double-clap to launch the workspace | Julian-Ivanov |  |
| 70 | Voice cloning and emotion control for the voice | isair | partly (Fish voice) |

## I. Daily rhythm

| # | Feature | Seen in | Status |
|---|---|---|---|
| 71 | Morning briefing: weather, calendar, tasks, email, overnight market move | OpenClaw lists, Hostinger | idea #1 |
| 72 | Weather-based recommendations (rain on a tint day, ice for the R8) | OpenClaw | idea #8 |
| 73 | Interest-based news digest (car audio, tint, your tickers) | OpenClaw, isair |  |
| 74 | Evening wrap-up | OpenClaw | idea #5 |
| 75 | Weekend planning briefing | OpenClaw |  |
| 76 | Travel-day briefing | OpenClaw |  |
| 77 | Holiday, birthday and special-date reminders | OpenClaw |  |
| 78 | Startup greeting with weather and open tasks | Julian-Ivanov | have (greeting + weather) |
| 79 | Habit check-ins and goal progress updates | OpenClaw |  |
| 80 | Focus mode: filters notifications while you work | OpenClaw |  |
| 81 | Automatic time tracking per job | OpenClaw |  |
| 82 | Weekly status report across all your businesses | OpenClaw |  |
| 83 | Weekend/work-day modes that change what Jarvis offers | community |  |

## J. Memory and knowledge

| # | Feature | Seen in | Status |
|---|---|---|---|
| 84 | Diary + knowledge graph memory, auto-split by topic (customers, vehicles, projects) | isair | today: flat memory |
| 85 | Semantic memory search (finds meaning, not just keywords) | isair, aman |  |
| 86 | Memory viewer page: see, edit and delete what Jarvis knows | isair |  |
| 87 | Redacts passwords, tokens and card numbers before saving anything | isair |  |
| 88 | Learns your preferences over time | isair | partly (long-term memory) |
| 89 | Awareness model of you, built across sessions | PersonalJarvis |  |
| 90 | Markdown knowledge vault (Obsidian-style) | PersonalJarvis, aman |  |
| 91 | Searchable knowledge base over your own files: manuals, wiring diagrams, quotes, customer notes | OpenClaw |  |
| 92 | Private documents answered by a local model, nothing leaves your hardware | Hostinger |  |
| 93 | Semantic search over saved bookmarks and posts | OpenClaw |  |
| 94 | Lessons learned after a failure, saved only after you approve | aman |  |
| 95 | Reverse prompting: when idle, Jarvis proposes what to do next | OpenClaw |  |
| 96 | Mission statement in the prompt so everything serves your goals | OpenClaw |  |

## K. Proactive triggers and watchers

| # | Feature | Seen in | Status |
|---|---|---|---|
| 97 | General when-then triggers ("when X happens tell me"), not just stocks | PersonalJarvis | have for stocks |
| 98 | Folder or file watcher: alert when a file lands or a condition is met | OpenClaw |  |
| 99 | Deferred tasks: "tomorrow at 8, send me X" | OpenClaw | partly |
| 100 | Jarvis writes itself a new watcher skill ("track new Nexus jobs"), you approve it | OpenClaw |  |
| 101 | Knows when to stay quiet | danielsantos2310 | have (quiet mode) |
| 102 | Approvals queue for anything outbound or sensitive | OpenClaw | have for social posts |
| 103 | Risk tiers per action: safe / watch / ask / block | PersonalJarvis |  |
| 104 | AI cost tracking and alerts; flags overpaid model use | OpenClaw | partly (budgets) |
| 105 | Self-modification of settings by voice, backed up and reversible | PersonalJarvis | have (maintenance mode) |

## L. Home, shop and presence

| # | Feature | Seen in | Status |
|---|---|---|---|
| 106 | Presence awareness: who is home, where you are, since when | danielsantos2310 | have (A43) |
| 107 | Arrive-home scene: lights, music, speaker | XDA, Home Assistant | idea #35 |
| 108 | "Good morning" scene: lights, coffee, playlist, weather | XDA |  |
| 109 | "Goodbye" scene: lights off, doors locked, thermostat eco, alarm armed | XDA | idea #36 |
| 110 | "Lights out" bedtime scene | XDA |  |
| 111 | Thermostat and heater control by presence (shop heat off when closed) | Home Assistant |  |
| 112 | Camera AI: describes snapshots, counts things, tells you what is at the door | Home Assistant |  |
| 113 | Camera snapshot on motion after hours | Home Assistant | idea #39 |
| 114 | Energy monitoring plugs: usage alerts, compressor left on | Home Assistant, OpenClaw | idea #40 |
| 115 | Water-leak and temperature/humidity sensors for the shop (film curing) | Home Assistant |  |
| 116 | Motion sensors that turn lights on and off by presence | Home Assistant |  |
| 117 | Door and window sensors: "is everything closed?" | Home Assistant | planned (our sensor plan) |
| 118 | Smart plug / switch control by voice | OpenClaw, Home Assistant | planned (lights) |
| 119 | Shared shopping list: "add milk" | XDA, Hostinger |  |
| 120 | Home maintenance reminders (filters, smoke alarms, gutters) | OpenClaw |  |
| 121 | Garden and yard tracking | OpenClaw |  |
| 122 | Wildlife/yard camera that logs what showed up | Home Assistant |  |

## M. Email, messages and calls

| # | Feature | Seen in | Status |
|---|---|---|---|
| 123 | Email triage: urgent flags, daily top 3 | Hostinger, OpenClaw | idea #48 |
| 124 | Draft replies in your own voice | OpenClaw |  |
| 125 | Follow-up reminders on unanswered messages | OpenClaw | idea #10 |
| 126 | Meeting scheduling by CC'ing Jarvis on an email | OpenClaw |  |
| 127 | Real-time translation | OpenClaw |  |
| 128 | Channel summaries (Slack/Discord/Telegram) | OpenClaw |  |
| 129 | Jarvis places an outbound phone call (supplier, parts counter) via Twilio | PersonalJarvis |  |
| 130 | Call Jarvis from any phone and talk to it | OpenClaw (ClawdTalk) |  |
| 131 | One brain across HUD, Telegram, Discord and text | PersonalJarvis | partly (HUD + Telegram) |
| 132 | Customer text auto-replies with your approval | OpenClaw | idea W5 |
| 133 | Family digest (school messages, schedules) | OpenClaw |  |
| 134 | Thank-you notes and review requests after a job | OpenClaw | idea #23 |

## N. Shop and business

| # | Feature | Seen in | Status |
|---|---|---|---|
| 135 | Job log by voice, searchable history | OpenClaw | idea W4 |
| 136 | Quotes/estimates by voice, PDF ready | OpenClaw | idea W6 |
| 137 | Invoice generation and payment reminders | OpenClaw | idea #19 |
| 138 | Receipt photo to expense sheet | OpenClaw, Hostinger | idea W12 |
| 139 | KPI snapshot to your phone on a schedule | Hostinger | idea #50 |
| 140 | Customer DM/Facebook/Instagram message triage | OpenClaw |  |
| 141 | Google review reply drafts | OpenClaw |  |
| 142 | Lead follow-up sequences with approval | OpenClaw |  |
| 143 | Personal CRM with engagement scoring: "haven't seen Mike in 8 months" | OpenClaw |  |
| 144 | Competitor and supplier price monitoring | OpenClaw | idea W11 |
| 145 | Brand mention monitoring for Defiant Audio | Hostinger |  |
| 146 | Reorder alerts for film and consumables | OpenClaw | idea #21 |
| 147 | Supplier research on a named part | OpenClaw |  |
| 148 | Onboarding doc and SOPs for a new tech | OpenClaw |  |
| 149 | Expense categorization and anomaly alerts | OpenClaw |  |
| 150 | Deadline tracker: rent, insurance, taxes, licences | OpenClaw | idea #27 |
| 151 | Contract/lease analysis and deadline extraction | OpenClaw |  |
| 152 | Purchase negotiation helper (parts, vehicles) | OpenClaw |  |
| 153 | Zero-inbox overnight triage | OpenClaw | idea #48 |
| 154 | Package tracking from email | Hostinger | idea #46 |

## O. Content and social

| # | Feature | Seen in | Status |
|---|---|---|---|
| 155 | Content repurposing: one post to Facebook, Instagram, YouTube, TikTok | OpenClaw | have (social posting) |
| 156 | Auto-pick the best moments from a long video and cut 9:16 clips | OpenClaw | partly (9:16 trim) |
| 157 | Auto-captions/subtitles burned into videos | OpenClaw |  |
| 158 | Writing-style clone so posts sound like you | OpenClaw |  |
| 159 | Content calendar planning | OpenClaw |  |
| 160 | YouTube titles, scripts and thumbnail concepts from your logged jobs | OpenClaw | idea W13 |
| 161 | Trending-topic alerts for car audio and tint | OpenClaw |  |
| 162 | Hashtag research per network | OpenClaw | have (per network) |
| 163 | Comment reply drafts | OpenClaw |  |
| 164 | Social analytics summary | OpenClaw |  |
| 165 | Video transcript to blog/SEO post | OpenClaw |  |
| 166 | Newsletter drafting | OpenClaw |  |
| 167 | Podcast/show notes | OpenClaw |  |

## P. Health and personal

| # | Feature | Seen in | Status |
|---|---|---|---|
| 168 | Meal and calorie tracking with goal awareness | isair | partly (meal prompts) |
| 169 | Wearable data sync (Oura, Strava, Hevy, Withings) | OpenClaw |  |
| 170 | Workout logging by voice | OpenClaw | partly (workout protocol) |
| 171 | Medication and supplement reminders | OpenClaw |  |
| 172 | Weekly meal plan with a combined grocery list | Hostinger |  |
| 173 | Grocery ordering | OpenClaw |  |
| 174 | Voice-note journal, turned into an evening entry | Hostinger | idea #16 |
| 175 | Gift and special-occasion ideas | OpenClaw |  |
| 176 | Interview/appointment prep sheets from your calendar | OpenClaw |  |

## Q. Markets and money

| # | Feature | Seen in | Status |
|---|---|---|---|
| 177 | Trading behaviour review of your own past trades | OpenClaw | idea #43 |
| 178 | Prediction-market and on-chain data feeds (high risk, analysis only) | OpenClaw |  |
| 179 | Tax document organizing | OpenClaw |  |
| 180 | Budget monitoring and spending questions in plain English | OpenClaw |  |
| 181 | Daily revenue report | OpenClaw | idea #50 |

## R. Developer and operations

| # | Feature | Seen in | Status |
|---|---|---|---|
| 182 | Server monitoring: disk, CPU, memory alerts for Railway | OpenClaw |  |
| 183 | CI/CD alerts for failed builds and finished deploys | OpenClaw | partly (APK builds) |
| 184 | Pull-request summaries | OpenClaw |  |
| 185 | Dependency check and upgrade plan | OpenClaw |  |
| 186 | Shell commands by chat | OpenClaw | have (maintenance mode) |
| 187 | Mission-control dashboard: tasks, calendar, memory, activity feed | OpenClaw | partly (HUD) |
| 188 | Specialist sub-agents (research, security, QA, finance) | aman, PersonalJarvis |  |
| 189 | Critic pass: a second model reviews work before Jarvis reports it | PersonalJarvis |  |
| 190 | Local-model fallback when credits run out or an API is down | OpenClaw |  |
| 191 | Cheap model for easy requests, strong model for hard ones | OpenClaw | partly |
| 192 | Detects fabricated results: checks claims against the tool log | aman |  |

## S. Computer, screen and vision

| # | Feature | Seen in | Status |
|---|---|---|---|
| 193 | "What's on my screen": screenshot reading | isair, Julian-Ivanov |  |
| 194 | Browser automation: fill forms, pull data from sites | OpenClaw, isair |  |
| 195 | Computer use: mouse and keyboard control with an on-screen indicator | PersonalJarvis |  |
| 196 | Meeting assist: live transcript and action items | aman, Hostinger |  |
| 197 | Photo analysis from the phone camera | aman | have (A30) |
| 198 | Window/app launch by voice on the PC | Julian-Ivanov |  |

## T. Hardware and wearables

| # | Feature | Seen in | Status |
|---|---|---|---|
| 199 | Wear OS / Apple Watch companion | OpenClaw |  |
| 200 | Camera glasses with visual memory ("where did I leave the wrench?") | OpenClaw (LUCI) | idea A13 |
| 201 | Voice satellites in every room (Pi + mic + speaker) | danielsantos2310, Home Assistant | planned |
| 202 | Room displays with widgets | danielsantos2310 | planned |
| 203 | BLE tags on tools | community | idea #38 |

## U. Safety, privacy and control

| # | Feature | Seen in | Status |
|---|---|---|---|
| 204 | Offline/local-only mode toggle | isair, danielsantos2310 |  |
| 205 | Per-tool permission controls | danielsantos2310 |  |
| 206 | Full audit log of every action Jarvis took | PersonalJarvis | partly (logs) |
| 207 | "Freeze everything" kill switch by voice | PersonalJarvis |  |
| 208 | Guest mode: ignore other voices; voice or face check before sensitive actions | Avinashb722 repo |  |
| 209 | Encrypted backups with restore | danielsantos2310 | partly (phone backup) |
