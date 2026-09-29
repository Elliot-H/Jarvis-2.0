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
