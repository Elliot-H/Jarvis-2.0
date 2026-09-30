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
    description: 'Call this (and nothing else) when the Owner wants you to change, fix, repair, add to or roll back your OWN code, screen, voice, settings or personality. A stronger engineering mode then takes over the same request.',
    shape: {}
  }
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
  { name: 'bring_list', description: 'What he needs to bring, for one place or everywhere.', shape: { place: z.string().optional() } },
  { name: 'heading_to', description: 'He says he is heading to a saved place ("heading to the Camden house"): returns what to bring and any heads-up for that trip. Say it back briefly.', shape: { place: z.string() } },
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

// Spec + handler → OpenAI-style function tool
export function toFunctionTool({ name, description, shape }) {
  const schema = z.toJSONSchema(z.object(shape));
  delete schema.$schema;
  return { type: 'function', function: { name, description, parameters: schema } };
}

export const MUSIC_TOOLS = [
  {
    name: 'music_control',
    description: 'Control the Owner\'s Spotify and speaker. action: "start" = connect the Bluetooth speaker AND play his most recent playlist (use for "let\'s get some tunes going", "put some music on", or when he says yes to your offer of background music); "play" (with query: song/artist/album/playlist name, and kind) or without query = latest playlist; "pause"; "resume"; "next"; "previous"; "volume" (0-100); "status" (what is playing). Only report success if the result says so.',
    shape: {
      action: z.enum(['start', 'play', 'pause', 'resume', 'next', 'previous', 'volume', 'status']),
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
  { name: 'bluetooth_connect', description: 'Connect a taught speaker without playing music. device = alias or area (omit to use the one for where he is). Sets its default volume (65% unless changed).', shape: { device: z.string().optional() } }
];
