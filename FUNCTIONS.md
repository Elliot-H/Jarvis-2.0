# Jarvis function list

Two groups. **Work Functions** run the shop (Defiant Audio). **Assistant Functions** look after the Owner day to day.
Status: ✅ built · 🔧 next up · 💡 idea

## Work Functions
| # | Function | Status | Notes |
|---|----------|--------|-------|
| W1 | Calendar: read jobs, count by colour, add and change appointments | ✅ | Google Calendar (service account). Colour meanings taught by voice. |
| W2 | Client follow-ups from the calendar | ✅ | Drafted each morning for jobs that ended 3 days ago (title "Name - job"). Owner approves by voice or on /followups (FOLLOW-UPS on the HUD). Sent from the **shop iPhone** by an Apple Shortcut (3x a day), matched to its Contacts by name. Needs the Shortcut set up once. |
| W3 | Shop check-in: "Headed to the shop?" + today's jobs | ✅ | Shop days Mon-Sat mornings. |
| W4 | Job log by voice | 💡 | "Log it: black Tahoe, 5% rears, 35 fronts, Mike." Searchable history. |
| W5 | Missed-call catcher | 💡 | Shop line is an iPhone: apps can't read its call log. Possible via a Shortcut on missed-call notifications only in a limited way; revisit. |
| W6 | Quote by voice | 💡 | Parts prices + labour rate -> text-ready quote. |
| W7 | Money read-out: PayPal + Invoice Simple | 💡 | What came in, what's unpaid. |
| W8 | End-of-day wrap-up | 💡 | Leaving the shop: jobs done, invoices not sent, what's unfinished for tomorrow. |
| W9 | Tint weather check | 💡 | Rain/humidity on a tint day -> heads-up the day before. |
| W10 | No-show / running-late nudge | 💡 | Job start passed and he's not at the shop -> offer to reschedule. |
| W11 | Parts price hunt | 💡 | Watch prices on named parts; alert on drops. |
| W12 | Receipt snap | 💡 | Photo of a parts receipt -> logged expense. |
| W13 | Jobs -> YouTube ideas | 💡 | Logged jobs become MyOnlineCarGuy1 titles/hooks; reminder to film. |

## Assistant Functions
| # | Function | Status | Notes |
|---|----------|--------|-------|
| A1 | Voice, wake word, HUD, JARVIS voice | ✅ | Fish Audio voice, Android app + PWA. |
| A2 | Greeting + weather that follows the phone | ✅ | |
| A3 | Places + perimeters (Home, The Camden House, the shop) | ✅ | Places box on the HUD (PLACES). Private places via PLACES_JSON. |
| A4 | Comings and goings | ✅ | Background location; arrive/leave remarks; "Headed home, sir?"; quiet hours, 4/hour cap. |
| A5 | Reminder / mention / question box | ✅ | Per place: while there, arrive, leave, headed there, not there; once-only; yes/no replies. |
| A6 | Bring + grab lists | ✅ | "Bring the drill to the Camden house", "grab the film before I leave". |
| A7 | Everyday check-ins | ✅ | Eaten yet, check with Princess, dogs' food. Editable. |
| A8 | Music: Spotify + Rockville speaker | ✅ | Tasker for Bluetooth. |
| A9 | Phone alerts (Pushover, JARVIS sound) | ✅ | |
| A10 | Crypto watch + briefs | ✅ | Analysis only, never trades. |
| A11 | Self-repair | ✅ | Jarvis edits and redeploys himself after the Owner says yes. |
| A12 | Leave-now alerts with drive time | 💡 | "Leave in 5 minutes for your 10 o'clock." |
| A13 | "Where did I put it" | 💡 | Voice notes of where things are. |
| A14 | Routine learning | 💡 | "You're usually at the shop by 9." |
| A15 | Email triage | 💡 | Summary + urgent flags. |
| A16 | Stores on the way | 💡 | "When I'm near Lowe's, remind me..." |
| A17 | Vehicles: truck + R8 via Bluetooth OBD dongles | ✅ | Free (one-time dongle). Phone reads it when near: battery volts, check engine light, trouble codes (explained), fuel, coolant. Alerts on new codes, low resting battery, low fuel. Clears codes only on request. |
| A18 | Lights, compressor, bay door, heat (Shelly relays) | 💡 | Compressor through a motor contactor (electrician). Off freely, on only after confirmation. |
