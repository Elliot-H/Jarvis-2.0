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
