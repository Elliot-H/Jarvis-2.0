// Jarvis's own tools, defined once. server.js attaches the handlers; the same specs feed
// the Claude SDK (workshop mode), the OpenRouter talk brain (brain.js) and the model test bench.
import { z } from 'zod';

export const HUD_TOOLS = [
  {
    name: 'update_stats',
    description: 'Put numbers on the Jarvis HUD. Each stat is a tile. Reuse the same id to update a tile. Call this whenever you pull real numbers (downloads, revenue, ad spend, ROAS, subscribers, jobs booked, etc).',
    shape: {
      stats: z.array(z.object({
        id: z.string().describe('stable slug, e.g. myguru_downloads_7d'),
        label: z.string().describe('short label, e.g. "Downloads · 7d"'),
        value: z.string().describe('display value, e.g. "2,459" or "$4,289"'),
        delta: z.string().optional().describe('change vs prior period, e.g. "+12%" or "-3%"'),
        trend: z.array(z.number()).optional().describe('optional sparkline points, oldest first'),
        group: z.string().optional().describe('tile group, e.g. "MyGuru", "Ads", "YouTube", "Shop"'),
        source: z.string().optional().describe('where the number came from')
      }))
    }
  },
  { name: 'get_hud', description: 'Read what is currently on the HUD (all stat tiles and panels).', shape: {} },
  {
    name: 'remove_stats',
    description: 'Remove tiles from the HUD by id. Pass ["*"] to clear everything.',
    shape: { ids: z.array(z.string()) }
  },
  {
    name: 'show_panel',
    description: 'Show a text panel on the HUD (a recommendation, a to-do list, a short report). Markdown-lite: lines starting with "- " become bullets. Reuse the id to replace it.',
    shape: { id: z.string(), title: z.string(), body: z.string() }
  },
  {
    name: 'hide_panel',
    description: 'Remove a panel from the HUD by id, or "*" for all.',
    shape: { id: z.string() }
  }
];

export const MEMORY_TOOLS = [
  {
    name: 'remember_fact',
    description: 'Save a durable long-term memory that survives across separate conversations: names, people, the Owner\'s preferences, saved info, ongoing topics, answers you gave that he may ask about later. Call it when he says "remember...", and on your own for any lasting fact worth keeping. One short self-contained sentence per fact. Does not duplicate: an identical fact is only refreshed.',
    shape: { fact: z.string().describe('one short, self-contained sentence'), topic: z.string().optional().describe('one or two words, e.g. person, preference, project') }
  },
  { name: 'list_memory', description: 'List everything in long-term memory, optionally filtered by a search word.', shape: { search: z.string().optional() } },
  { name: 'forget_fact', description: 'Delete a long-term memory by id, or "*" to wipe all. Only when the Owner asks to forget.', shape: { id: z.string() } }
];
export const FAILURE_TOOLS = [
  {
    name: 'note_failure',
    description: 'Remember a command you could not carry out: cut off mid-sentence, unclear, blocked, missing a connection, or it errored. Call this before replying whenever a request did not succeed.',
    shape: { command: z.string().describe('what the Owner asked, as heard'), reason: z.string().describe('why it failed, in a few words') }
  },
  { name: 'list_failures', description: 'List the commands that failed earlier and have not been resolved yet.', shape: {} },
  {
    name: 'resolve_failure',
    description: 'Forget a failed command once it has been done or the Owner no longer wants it. Pass "*" to clear all.',
    shape: { id: z.string() }
  }
];

export const MODE_TOOLS = [
  {
    name: 'use_workshop',
    description: 'ONLY when the Owner says "workshop" by name. For any other request to change, fix or add to your OWN code, screen, voice, settings or personality, use maintenance_request instead.',
    shape: {}
  }
];

export const MAINT_TOOLS = [
  { name: 'maintenance_request', description: 'MAINTENANCE MODE. Use when the Owner says "maintenance mode" or asks you to change, fix, repair, add to or roll back your OWN code, screen, voice, settings or personality. Hands the request to a Claude Code engineer session that edits the code and pushes it live (takes a few minutes). request = his full request in plain words with every detail he gave (if he only said "maintenance mode", ask what to change first). Tell him it is sent and that he can ask "maintenance status" later. Never claim it is done; only maintenance_status can say that.', shape: { request: z.string() } },
  { name: 'maintenance_status', description: 'Check the result of the last maintenance request ("maintenance status", "did the fix go through?"). Reads the engineer\'s report and tells the Owner what changed, whether it is live, and whether he must reinstall the app.', shape: {} }
];

export const PHONE_TOOLS = [
  {
    name: 'phone_alert',
    description: 'Send a short notification to the Owner\'s phone (through the ntfy app). Use when he asks for a test alert or asks you to notify or ping his phone. Keep the message under 200 characters.',
    shape: { title: z.string().describe('a few words'), message: z.string() }
  },
  { name: 'place_save', description: 'Save the Owner\'s current phone location as a named place (e.g. "home", "Brenda\'s", "the shop"). Use when he says "this is home", "I\'m at Brenda\'s, remember this place". home=true for his home.', shape: { name: z.string(), radius_m: z.number().optional(), home: z.boolean().optional() } },
  { name: 'place_list', description: 'List saved places and whether he is at one now.', shape: {} },
  { name: 'reminder_add', description: 'Add an item to the random contextual bucket: kind reminder, mention (a remark) or question (may have its own yes/no replies). It shows up at random (chance % per check, with a cooldown) when its triggers fit: place (saved place name) with trigger at (while there, at random), away (while not there), arrive (when he gets there), leave (when he leaves there) or heading (when he is headed there); once=true fires one time then deletes ("next time I\'m at X remind me..." = arrive+once; "remind me to grab X before I leave" = leave+once at his current place), time (morning|afternoon|evening|night), days (weekdays|weekends). Write text as Jarvis would say it to the Owner. The Owner can also edit everything in the Places box at /places.', shape: { text: z.string(), kind: z.enum(['reminder', 'mention', 'question']).optional(), trigger: z.enum(['at', 'away', 'arrive', 'leave', 'heading']).optional(), once: z.boolean().optional(), yes: z.string().optional(), no: z.string().optional(), place: z.string().optional(), time: z.enum(['morning', 'afternoon', 'evening', 'night']).optional(), days: z.enum(['weekdays', 'weekends']).optional(), chance: z.number().optional(), cooldown_hours: z.number().optional() } },
  { name: 'shop_day', description: 'Record whether the Owner is going to the shop today, when he answers "are you headed to the shop?" in a longer sentence. Returns the line to say (yes: today\'s appointments + a shop reminder; no: not in work mode today). Say it as returned.', shape: { going: z.boolean() } },
  { name: 'bring_add', description: 'Add something the Owner must bring TO a place ("I need to bring the drill to the Camden house"). He is reminded when he leaves elsewhere or says he is headed there; it clears when he arrives.', shape: { place: z.string(), item: z.string() } },
  { name: 'bring_list', description: 'Use for "do I need to bring anything" / "what do I need to grab": the bring list plus that place\'s arrive/leave/heading reminders (place named, else where he is now).', shape: { place: z.string().optional() } },
  { name: 'heading_to', description: 'He says he is heading to a saved place ("heading to the Camden house"): returns what to bring and any heads-up for that trip. Say it back briefly.', shape: { place: z.string() } },
  { name: 'followup_list', description: 'Customer follow-up texts (W2) drafted from finished calendar jobs, with ids and status. They go out from the SHOP phone, only after the Owner approves.', shape: {} },
  { name: 'followup_approve', description: 'Approve follow-ups to be sent from the shop phone. Only when the Owner clearly says to send them. all=true approves every waiting one.', shape: { ids: z.array(z.string()).optional(), all: z.boolean().optional() } },
  { name: 'followup_skip', description: 'Skip (never send) follow-ups by id.', shape: { ids: z.array(z.string()) } },
  { name: 'followup_edit', description: 'Change the wording of one follow-up before it is approved.', shape: { id: z.string(), text: z.string() } },
  { name: 'followup_add', description: 'Draft a follow-up for a customer by name (as saved in the shop phone contacts). Still needs his OK to send.', shape: { customer: z.string(), text: z.string().optional() } },
  { name: 'vehicle_add', description: 'Set up a vehicle (truck, R8...) with its Bluetooth OBD dongle: the dongle\'s paired Bluetooth name or address (use bluetooth_paired to see names). The phone then reads it whenever it is in range.', shape: { name: z.string(), dongle: z.string() } },
  { name: 'vehicle_scan', description: 'Read a vehicle now through its OBD dongle (phone must be near it): battery volts, check engine light, trouble + pending codes, emissions readiness (inspection), fuel trims, freeze frame, fuel, coolant, battery drain trend. Explain in plain words; use trims + freeze frame to reason about the cause.', shape: { name: z.string().optional() } },
  { name: 'vehicle_status', description: 'Last reading of one or all vehicles, without scanning.', shape: { name: z.string().optional() } },
  { name: 'vehicle_clear_codes', description: 'Clear trouble codes / check engine light on a vehicle. ONLY when the Owner explicitly asks to clear codes.', shape: { name: z.string() } },
  { name: 'vehicle_remove', description: 'Remove a vehicle.', shape: { name: z.string() } },
  { name: 'reminder_list', description: 'List the reminders in the bucket with their ids.', shape: {} },
  { name: 'reminder_remove', description: 'Remove a reminder by id.', shape: { id: z.string() } },
  {
    name: 'weather',
    description: 'Current weather and forecast at the Owner\'s phone location (wherever he is, any country). Use for any weather, forecast, rain, temperature or "do I need a jacket" question. days = 1-7 (default 3).',
    shape: { days: z.number().optional() }
  },
  {
    name: 'voice_check',
    description: 'Test your real JARVIS voice (Fish Audio) right now and get the exact reason if it fails. Use whenever the Owner says your voice or accent is wrong, sounds like the phone, or changed.',
    shape: {}
  }
];

export const CALENDAR_TOOLS = [
  {
    name: 'calendar_events',
    description: 'Read the Owner\'s Google Calendar between two dates (inclusive, YYYY-MM-DD; omit "to" for a single day). Each event has its colour and, once taught, what that colour MEANS (for example "job"). Use for "what is on today", "how many jobs this week", "what are the jobs Friday". Count by meaning, not just by colour. Put long lists on the HUD, say only the headline.',
    shape: { from: z.string().optional().describe('YYYY-MM-DD, default today'), to: z.string().optional().describe('YYYY-MM-DD, default same as from'), query: z.string().optional().describe('text to search for in titles') }
  },
  {
    name: 'calendar_colors',
    description: 'What each calendar colour means to the Owner. action "list" shows the saved meanings; "survey" shows how the colours are actually used lately (counts and sample titles) so you can propose meanings and ask him to confirm; "set" saves a meaning ONLY after he has said it (colorId is a Google colour name like Tangerine or a number 1 to 11, or "default" for uncoloured events).',
    shape: { action: z.enum(['list', 'survey', 'set']), colorId: z.string().optional(), meaning: z.string().optional().describe('short, e.g. "install job", "quote / estimate", "personal"') }
  },
  {
    name: 'calendar_add',
    description: 'Add an event to the Owner\'s calendar. ONLY call this after he has clearly asked for that specific appointment. Times are YYYY-MM-DDTHH:MM in his time zone (a bare date makes an all-day event). Set colorId from what the colours mean (see calendar_colors). Afterwards say back the title, day, time and colour.',
    shape: { title: z.string(), start: z.string(), end: z.string().optional().describe('default one hour after start'), colorId: z.string().optional(), location: z.string().optional(), notes: z.string().optional(), calendar: z.string().optional().describe('which calendar (full id or part of it); default is the first, the Owner\'s main one') }
  },
  {
    name: 'calendar_update',
    description: 'Change an existing event (title, time, colour, location, notes) by its id from calendar_events. ONLY after the Owner has clearly asked for the change; if more than one event could match, list them and ask which. Use colorId "default" to remove a colour. Afterwards say back what changed.',
    shape: { eventId: z.string(), calendar: z.string().optional().describe('the calendar field from calendar_events'), title: z.string().optional(), start: z.string().optional(), end: z.string().optional(), colorId: z.string().optional(), location: z.string().optional(), notes: z.string().optional() }
  }
];

export const CRYPTO_TOOLS = [
  {
    name: 'crypto_scan',
    description: 'Scan the crypto market: price, 24h and 7-day change, size and volume for the top coins by market cap plus the Owner\'s watchlist, and which coins moved most. Use this for any "how is crypto", "scan the market", "what should I watch" request, then follow the instructions in the result to research news on the movers.',
    shape: { top: z.number().int().min(5).max(100).optional().describe('how many top coins, default 25') }
  },
  {
    name: 'crypto_trending',
    description: 'Coins getting the most attention right now on CoinGecko (searches). A rough signal of hype, not a recommendation.',
    shape: {}
  },
  {
    name: 'crypto_watch',
    description: 'Manage the Owner\'s crypto watchlist. Ids are CoinGecko ids in lowercase, e.g. bitcoin, ethereum, solana, dogecoin. action: add, remove, or list.',
    shape: { action: z.enum(['add', 'remove', 'list']), ids: z.array(z.string()).optional() }
  }
];


export const CHART_TOOLS = [
  { name: 'chart_read', description: 'Read a price chart for a stock (TSLA) or crypto (BTC, ETH): candlesticks, trend, moving averages, RSI, MACD, Bollinger, volume, support and resistance, breakouts and candle patterns, for a timeframe (5m, 15m, 1h, 1d default, 1w, 1mo). Use for "how does the chart look", "is TSLA breaking out", "where is support". Compare two timeframes when asked about short vs long term. Analysis only.', shape: { symbol: z.string(), timeframe: z.enum(['5m', '15m', '1h', '1d', '1w', '1mo']).optional() } }
];

export const OUTLOOK_TOOLS = [
  { name: 'market_outlook', description: 'Morning-call capable. For stocks it also ingests PRE-MARKET data (gap vs prior close, pre-market high/low/VWAP, volume vs usual as a conviction signal: heavy = stronger, thin = low confidence, plus IEX prints). Use for "morning call on TSLA" too. Full predictive-style read of a stock or crypto: weekly + daily + hourly alignment, pattern and indicator signals, a back-test of every setup currently firing on THAT ticker\'s own 5-year history (win rate, average move, average drawdown, sample size; only setups with real history are presented), directional bias with confidence %, ATR stop/target, support/resistance, and what would invalidate it. Use for "what\'s your read on TSLA", "should I expect it up", "how reliable is this setup". Then call ticker_news and fold the catalyst into the confidence. Odds, not predictions; never promise returns; not advice; never trade from it alone.', shape: { symbol: z.string() } }
];

export const NEWS_TOOLS = [
  { name: 'ticker_news', description: 'Recent news for one stock or coin: top 3-5 headlines (filings, earnings, partnerships, listings, upgrades/downgrades, regulatory) with source and date, plus a one-line note on what it means for price. Returns a search plan: web-search it, then show_panel id "ticker_news". Call it for every symbol you name from signal_scan, chart_read or crypto_scan, and say whether the move has a confirmed catalyst or looks purely technical.', shape: { symbol: z.string(), kind: z.enum(['stock', 'crypto']).optional().describe('auto-detected if omitted') } }
];

export const SIGNAL_TOOLS = [
  { name: 'signal_scan', description: 'Scan trending stocks (Alpaca\'s top gainers and most active; or the symbols he names) and rank them by a rule-based candle/trend score with a stop-loss level, target, risk %, and how that same setup has worked on that ticker\'s own history. Use for "what\'s trending", "find me something to buy", "scan the market", "any good setups". Present results as SIGNALS from rules with the stop-loss, never as personal advice; say once, briefly, that it is not financial advice and no setup is certain. Never place a trade from this: if he wants in, use the trade_propose flow.', shape: { symbols: z.array(z.string()).optional(), top: z.number().optional() } },
  { name: 'signal_watch', description: 'Watch a stock he owns or just bought so Jarvis sends a phone alert when the rules say the uptrend is breaking (sell warning) or the stop is hit. action add (symbol, optional entry price and stop; stop is computed if omitted), remove, or list. Positions in the Alpaca account are watched automatically.', shape: { action: z.enum(['add', 'remove', 'list']), symbol: z.string().optional(), entry: z.number().optional(), stop: z.number().optional() } }
];

export const TRADE_TOOLS = [
  { name: 'trade_status', description: 'Trading account (Alpaca): cash, equity, open positions with profit/loss, open orders. Use for "how is my portfolio", "what do I own".', shape: {} },
  { name: 'trade_quote', description: 'Latest price of a stock (e.g. TSLA) or crypto (e.g. BTC, ETH, SOL).', shape: { symbol: z.string() } },
  { name: 'trade_propose', description: 'Step 1 of a buy or sell. Only when the Owner asked for a trade. Creates a PENDING order for a dollar amount and does NOT place it. Read it back to him (symbol, side, dollars, price) and ask "Say confirm to place it." Never call trade_confirm in the same turn.', shape: { symbol: z.string(), side: z.enum(['buy', 'sell']), dollars: z.number().positive() } },
  { name: 'trade_confirm', description: 'Step 2. Places the pending order ONLY after the Owner clearly said yes/confirm in his latest message (a later turn than the proposal). Refused by the server otherwise.', shape: {} },
  { name: 'watch_status', description: 'Investment Watch status: the fixed check interval in seconds, whether it is running, last check time, what it is watching (Alpaca positions + signal_watch list), the stop each has, and the alert thresholds. Use for "how often do you monitor", "are you watching my positions", "is the watch on".', shape: {} },
  { name: 'trade_cancel', description: 'Cancel the pending proposal, or with all=true cancel every open order at the broker. Also the "stop everything" kill switch.', shape: { all: z.boolean().optional() } }
];

// Spec + handler → OpenAI-style function tool
export function toFunctionTool({ name, description, shape }) {
  const schema = z.toJSONSchema(z.object(shape));
  delete schema.$schema;
  return { type: 'function', function: { name, description, parameters: schema } };
}


export const MARKETDATA_TOOLS = [
  { name: 'stock_quote', description: 'Live-ish stock/ETF quote from the free Finnhub, Twelve Data or Financial Modeling Prep feeds (price, day change, high/low, previous close). Use for "price of X", "how is X doing today". Facts only.', shape: { symbol: z.string() } },
  { name: 'stock_fundamentals', description: 'Company snapshot: sector, market cap, P/E, P/B, margins, debt, dividend yield, 52-week range, from Financial Modeling Prep (Finnhub backup). Use for "is X expensive", "what does X do", "how healthy is X". Facts only, not advice.', shape: { symbol: z.string() } },
  { name: 'stock_news', description: 'Recent headlines from Finnhub: for one stock (last 7 days) or, with no symbol, general market news. Summarise the 2-3 that matter.', shape: { symbol: z.string().optional() } },
  { name: 'stock_earnings', description: 'Next earnings date with estimates, and the latest analyst buy/hold/sell counts, for one stock (Finnhub).', shape: { symbol: z.string() } },
  { name: 'data_feeds', description: 'Which market-data feeds (Finnhub, Twelve Data, Financial Modeling Prep) have keys set and how much of each free allowance is used today.', shape: {} }
];

export const MUSIC_TOOLS = [
  {
    name: 'music_control',
    description: 'Control the Owner\'s Spotify and speaker (NOT for "god mode": that has its own tool, god_mode). action: "start" = connect the Bluetooth speaker AND play his most recent playlist (use for "let\'s get some tunes going", "put some music on", or when he says yes to your offer of background music); "play" (with query: song/artist/album/playlist name, and kind) or without query = latest playlist; "pause"; "resume"; "next"; "previous"; "volume" (0-100); "status" (what is playing); "close" (alias "stop") = FULLY CLOSE the Spotify app (force-stop) and disconnect the Bluetooth speaker. This is the DEFAULT for "Spotify off", "turn off the music", "stop the music", "shut it off", "music off"; use "pause" only when he literally says pause. Only report success if the result says so.',
    shape: {
      action: z.enum(['start', 'play', 'pause', 'resume', 'next', 'previous', 'volume', 'status', 'close', 'stop']),
      query: z.string().optional(),
      kind: z.enum(['track', 'artist', 'album', 'playlist']).optional(),
      volume: z.number().optional(),
      speaker: z.string().optional().describe('which taught speaker/area, e.g. "office"; omit to use the one for where he is')
    }
  },
  { name: 'bluetooth_paired', description: 'List the Bluetooth devices already paired with the phone (exact names). Use when teaching a speaker: read the list out, then save the one he names with speaker_save.', shape: {} },
  { name: 'speaker_save', description: 'Teach a Bluetooth speaker: name = EXACT Bluetooth name from bluetooth_paired, alias = what he calls it ("office speaker"), area = where it is ("office", "shop", "garage"), volume = its default % (omit for 30).', shape: { name: z.string(), alias: z.string().optional(), area: z.string().optional(), volume: z.number().optional() } },
  { name: 'speaker_list', description: 'List taught speakers with their areas and volumes.', shape: {} },
  { name: 'speaker_remove', description: 'Forget a taught speaker (by alias or Bluetooth name).', shape: { alias: z.string() } },
  { name: 'bluetooth_disconnect', description: 'Disconnect the Bluetooth speaker (music then pauses) (the phone\'s Bluetooth itself stays on; Android does not let Tasker switch it off, so say that if he asks). Use for "disconnect the speaker", "turn off the Bluetooth", "shut the music off and unplug the speaker". device = alias or area (omit for the current one).', shape: { device: z.string().optional(), leave_bluetooth_on: z.boolean().optional() } },
  { name: 'god_mode', description: 'GOD MODE. Whenever the Owner says "god mode" (or "take over the room / every speaker / the TV"), call THIS tool and nothing else: do NOT call music_control or bluetooth_connect. It scans the room, pairs every speaker/soundbar/TV in range (or just the named one, e.g. speaker_name "Vizio" or "TV"), connects them, then plays music (default "Back in Black"). Report exactly what its result says, including which devices were found, paired, or skipped. Never claim music is playing or devices are connected unless the result says SUCCESS.', shape: { speaker_name: z.string().optional(), area: z.string().optional(), song: z.string().optional() } },
  { name: 'alarms_off', description: 'The Owner says he is awake / up ("I am awake", "I am up", "got up", "morning alarms off", "stop the alarms"). Dismisses every remaining pending alarm on his phone for the day. Call it right away, no questions, then confirm in one short sentence using the result. Only claim they are cleared if the result says so.', shape: {} },
  { name: 'led_color', description: 'Control the Owner\'s Bluetooth LED strip controller (SP63XE). color = a name ("red", "warm white", "purple", "teal") or hex "#ff8800"; effect = an effect name or number ("party", "rainbow", "fire", "comet", "stars", "breath", "gradient", "rainbow jump"...), speed 1-10; music true = sound-reactive party mode using the controller\'s own microphone; brightness 0-100; power "on"/"off" (off alone turns the strip off). Pixel strips have no true strobe (party = Rainbow Jump). The result says whether the controller CONFIRMED the change: only report success if it says SUCCESS, and report FAILED plainly.', shape: { color: z.string().optional(), brightness: z.number().optional(), power: z.enum(['on', 'off']).optional(), effect: z.string().optional(), speed: z.number().optional(), music: z.boolean().optional() } },
  { name: 'led_status', description: 'Read the LED controller\'s real current state (power, mode, effect, color, level, speed, light type, chip order). Use when the Owner asks what the lights are doing or something looks wrong.', shape: {} },
  { name: 'led_test', description: 'Diagnose wrong LED colors: shows pure red, then green, then blue, 3 s each. Afterwards ask the Owner what colors he saw in order, then call led_setup if they differ.', shape: {} },
  { name: 'led_setup', description: 'Fix LED chip order from what the Owner saw during led_test (seen_red = the color shown when red was commanded, etc. e.g. "green","red","blue"), or set chip_order (RGB, RBG, GRB, GBR, BRG, BGR). light_type (number, e.g. 134 for SPI RGB) ONLY if the Owner explicitly asks. Never use it unprompted.', shape: { seen_red: z.string().optional(), seen_green: z.string().optional(), seen_blue: z.string().optional(), chip_order: z.string().optional(), light_type: z.number().optional() } },
  { name: 'bluetooth_connect', description: 'Connect a taught speaker without playing music. device = alias or area (omit to use the one for where he is). Sets its default volume (65% unless changed).', shape: { device: z.string().optional() } }
];
