// Talk brain: any model on an OpenAI-compatible API (OpenRouter by default).
// One simple tool loop; Jarvis's tools come from tools.js, web search runs server-side on OpenRouter.
import { toFunctionTool } from './tools.js';

export const TALK_MODE_RULES = `# Mode
You are in fast talk mode. Answer directly and briefly; your reply is spoken aloud, so never include links, URLs or a sources list.
Use web search for anything current (weather, news, prices, hours, scores) and give the actual answer (e.g. the forecast), not where to find it.
Tool results are the truth about the present: report exactly what the latest tool result says, and never repeat an earlier failure from the conversation if the latest result succeeded. If a result starts with SUCCESS, it worked; say so plainly.
You only have the tools you can see. If the Owner asks for something that needs a connection you don't have (calendar, email, ordering, trading, reminders and so on), say plainly that it isn't connected yet and call note_failure. Never pretend it was done.
You ARE an app: your screen has an arc-reactor core, telemetry tiles, a comms log and panels; you have a voice, a wake word, a personality file and a wake-up briefing. If the Owner wants any of that changed, fixed, restyled or rolled back (e.g. "make the reactor purple", "talk faster", "the mic keeps cutting off"), call use_workshop immediately and stop. Requests about the outside world (stocks, prices, orders, calendar, business) are NOT workshop requests: answer them, or say the connection isn't set up yet.

Each message starts with a <context> block (time, HUD, recent conversation, failed requests) supplied by the app, not typed by the Owner.`;

export const chatSystemPrompt = persona => `${persona}\n\n${TALK_MODE_RULES}`;

export function brainConfig(env = process.env) {
  return {
    baseUrl: (env.BRAIN_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
    apiKey: env.BRAIN_API_KEY || env.OPENROUTER_API_KEY || '',
    model: env.TALK_MODEL || 'google/gemini-3.8-flash',
    // web search engine for talk mode: parallel is the cheapest per search on OpenRouter
    searchEngine: env.TALK_SEARCH_ENGINE || 'parallel',
    reasoning: env.TALK_REASONING || 'low'
  };
}

// What OpenRouter actually said and which key was used, so a wrong-key / wrong-account / per-key-limit problem is visible instead of a generic "out of credit".
let KEY_NOTE = '';
export function setKeyNote(cfg, env = process.env) {
  const k = cfg?.apiKey || '', v = env.BRAIN_API_KEY ? 'BRAIN_API_KEY' : 'OPENROUTER_API_KEY';
  KEY_NOTE = k ? ` (Railway variable ${v}, key ending ${k.slice(-4)})` : ' (no API key set)';
}
const rawMsg = body => { try { const j = typeof body === 'string' ? JSON.parse(body) : body; return String(j?.error?.message || j?.message || '').slice(0, 220); } catch { return String(body || '').slice(0, 220); } };
function explain(status, body) {
  const b = String(body || '');
  const said = rawMsg(body);
  if (status === 402 || /credit|insufficient|limit exceeded/i.test(b)) return `OpenRouter refused the request${KEY_NOTE}${said ? ': "' + said + '"' : ''}, sir. Check that this is the key on the account you topped up, and that the key has no credit limit.`;
  if (status === 401) return 'The OpenRouter key is wrong or was deleted, sir. Check OPENROUTER_API_KEY in Railway.';
  if (status === 429) return 'The model is rate limiting me, sir. Try again in a moment.';
  if (status === 404 || /not a valid model|no endpoints/i.test(b)) return 'That talk model name is not available on OpenRouter, sir. Check TALK_MODEL in Railway.';
  return `My brain returned error ${status}: ${b.slice(0, 160)}`;
}

/**
 * Run one turn.
 * tools: [{name, description, shape}]   run(name, args) → string | { text, stop }
 * Returns { text, cost, ms, firstMs, rounds, calls, usage, error, stopped }
 */
export async function talk({ cfg = brainConfig(), model, system, prompt, history = [], tools = [], run, webSearch = true, maxRounds = 6, budgetUsd = 0.05, maxTokens = 1500, signal, onTool, provider, extraBody } = {}) {
  const t0 = Date.now();
  const out = { text: '', cost: 0, ms: 0, firstMs: 0, rounds: 0, calls: [], usage: { in: 0, out: 0, cached: 0 }, error: null, stopped: false, model: model || cfg.model };
  if (!cfg.apiKey) { out.error = 'no-key'; out.text = 'My talk brain has no key yet, sir. Add OPENROUTER_API_KEY in Railway.'; return out; }
  const fnTools = tools.map(toFunctionTool);
  if (webSearch) fnTools.push({ type: 'openrouter:web_search', parameters: { engine: cfg.searchEngine, max_results: 5, max_uses: 3 } });
  const messages = [{ role: 'system', content: system }, ...history, { role: 'user', content: prompt }];

  let nudged = false, body_tokens = maxTokens;
  for (let round = 0; round < maxRounds; round++) {
    out.rounds = round + 1;
    const body = {
      model: out.model,
      messages,
      ...(fnTools.length ? { tools: fnTools, tool_choice: 'auto' } : {}),
      max_tokens: body_tokens,
      ...(cfg.reasoning === 'none' ? { reasoning: { enabled: false } } : { reasoning: { effort: cfg.reasoning, exclude: true } }),
      ...(provider ? { provider } : {}),
      ...(extraBody || {})
    };
    let r, data;
    try {
      r = await fetch(`${cfg.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json', 'X-Title': 'Jarvis' },
        body: JSON.stringify(body),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(60000)]) : AbortSignal.timeout(60000)
      });
      const raw = await r.text();
      if (!r.ok) { out.error = `http-${r.status}`; out.text = explain(r.status, raw); break; }
      data = JSON.parse(raw);
    } catch (e) {
      out.error = e.name === 'AbortError' || e.name === 'TimeoutError' ? 'aborted' : 'network';
      out.text = out.error === 'aborted' ? 'Stopped, sir.' : `I could not reach my brain, sir: ${String(e.message || e).slice(0, 120)}`;
      break;
    }
    if (!out.firstMs) out.firstMs = Date.now() - t0;
    if (data.error) { out.error = 'api'; out.text = explain(data.error.code || 500, data.error.message); break; }
    const u = data.usage || {};
    out.cost += Number(u.cost) || 0;
    out.usage.in += u.prompt_tokens || 0;
    out.usage.out += u.completion_tokens || 0;
    out.usage.cached += u.prompt_tokens_details?.cached_tokens || 0;
    const msg = data.choices?.[0]?.message || {};
    const calls = (msg.tool_calls || []).filter(c => c.type === 'function' || c.function);
    if (!calls.length) {
      out.text = String(msg.content || '').trim();
      // Empty reply (often after web search or tools, or reasoning ate the token budget): ask once more for the spoken answer instead of letting the caller say a bare "Done".
      if (!out.text && !nudged && round < maxRounds - 1) {
        nudged = true;
        messages.push({ role: 'assistant', content: '' }, { role: 'user', content: 'Now give the Owner the actual answer in speech: the real findings, names and numbers, in a complete spoken answer. Never reply with just "Done".' });
        body_tokens = Math.max(maxTokens, 2000);
        continue;
      }
      break;
    }

    messages.push({ role: 'assistant', content: msg.content || '', tool_calls: msg.tool_calls, ...(msg.reasoning_details ? { reasoning_details: msg.reasoning_details } : {}) });
    let stop = false;
    for (const c of calls) {
      const name = c.function?.name;
      let args = {};
      try { args = c.function?.arguments ? JSON.parse(c.function.arguments) : {}; } catch { args = { _unparsed: c.function?.arguments }; }
      out.calls.push({ name, args });
      onTool?.(name, args);
      let result;
      try { result = await run(name, args); } catch (e) { result = `Tool error: ${String(e.message || e).slice(0, 200)}`; }
      if (result && typeof result === 'object') { stop ||= Boolean(result.stop); result = result.text; }
      messages.push({ role: 'tool', tool_call_id: c.id, content: String(result ?? 'Done.') });
    }
    if (stop) { out.stopped = true; break; }
    if (out.cost >= budgetUsd) { out.error = 'budget'; out.text = 'That one got too expensive for a quick answer, sir. Try asking it more simply.'; break; }
    if (round === maxRounds - 1) { out.error = 'rounds'; out.text = 'I went round in circles on that one, sir. Try asking it another way.'; }
  }
  out.ms = Date.now() - t0;
  return out;
}

/** OpenRouter's own view of the key Jarvis is using: per-key limit, usage, and the account credit balance. */
export async function keyStatus(cfg = brainConfig()) {
  const h = { Authorization: `Bearer ${cfg.apiKey}` }, out = { baseUrl: cfg.baseUrl, keyEnding: String(cfg.apiKey || '').slice(-4) };
  if (!cfg.apiKey) return { ...out, error: 'No API key set (OPENROUTER_API_KEY / BRAIN_API_KEY).' };
  try {
    const k = await (await fetch(cfg.baseUrl + '/key', { headers: h, signal: AbortSignal.timeout(12000) })).json();
    const d = k.data || {};
    out.key = { label: d.label, limit: d.limit ?? null, limit_remaining: d.limit_remaining ?? null, usage: d.usage, is_free_tier: d.is_free_tier, error: k.error?.message };
  } catch (e) { out.keyError = String(e.message || e); }
  try {
    const c = await (await fetch(cfg.baseUrl + '/credits', { headers: h, signal: AbortSignal.timeout(12000) })).json();
    const d = c.data || {};
    out.credits = d.total_credits != null ? { total: d.total_credits, used: d.total_usage, remaining: Math.round((d.total_credits - d.total_usage) * 100) / 100 } : { note: c.error?.message || 'balance not visible to this key' };
  } catch (e) { out.creditsError = String(e.message || e); }
  return out;
}
