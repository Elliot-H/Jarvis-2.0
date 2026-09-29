// Talk brain: any model on an OpenAI-compatible API (OpenRouter by default).
// One simple tool loop; Jarvis's tools come from tools.js, web search runs server-side on OpenRouter.
import { toFunctionTool } from './tools.js';

export const TALK_MODE_RULES = `# Mode
You are in fast talk mode. Answer directly and briefly; your reply is spoken aloud, so never include links, URLs or a sources list.
Use web search for anything current (weather, news, prices, hours, scores) and give the actual answer (e.g. the forecast), not where to find it.
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

function explain(status, body) {
  const b = String(body || '');
  if (status === 401) return 'The OpenRouter key is wrong or was deleted, sir. Check OPENROUTER_API_KEY in Railway.';
  if (status === 402 || /credit|insufficient|limit exceeded/i.test(b)) return 'I am out of OpenRouter credit, or the key hit its spending limit, sir. Top up at openrouter dot ai.';
  if (status === 429) return 'The model is rate limiting me, sir. Try again in a moment.';
  if (status === 404 || /not a valid model|no endpoints/i.test(b)) return 'That talk model name is not available on OpenRouter, sir. Check TALK_MODEL in Railway.';
  return `My brain returned error ${status}: ${b.slice(0, 160)}`;
}

/**
 * Run one turn.
 * tools: [{name, description, shape}]   run(name, args) → string | { text, stop }
 * Returns { text, cost, ms, firstMs, rounds, calls, usage, error, stopped }
 */
export async function talk({ cfg = brainConfig(), model, system, prompt, history = [], tools = [], run, webSearch = true, maxRounds = 6, budgetUsd = 0.05, maxTokens = 700, signal, onTool, provider, extraBody } = {}) {
  const t0 = Date.now();
  const out = { text: '', cost: 0, ms: 0, firstMs: 0, rounds: 0, calls: [], usage: { in: 0, out: 0, cached: 0 }, error: null, stopped: false, model: model || cfg.model };
  if (!cfg.apiKey) { out.error = 'no-key'; out.text = 'My talk brain has no key yet, sir. Add OPENROUTER_API_KEY in Railway.'; return out; }
  const fnTools = tools.map(toFunctionTool);
  if (webSearch) fnTools.push({ type: 'openrouter:web_search', parameters: { engine: cfg.searchEngine, max_results: 5, max_uses: 3 } });
  const messages = [{ role: 'system', content: system }, ...history, { role: 'user', content: prompt }];

  for (let round = 0; round < maxRounds; round++) {
    out.rounds = round + 1;
    const body = {
      model: out.model,
      messages,
      ...(fnTools.length ? { tools: fnTools, tool_choice: 'auto' } : {}),
      max_tokens: maxTokens,
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
    if (!calls.length) { out.text = String(msg.content || '').trim(); break; }

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
