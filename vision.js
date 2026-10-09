// Photo analysis: one image + an optional question go to a vision-capable model through OpenRouter.
// Key and model come from Railway variables (OPENROUTER_API_KEY, VISION_MODEL); nothing is stored in code.
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

const SYSTEM = `You are Jarvis looking at a photo the Owner just took with his phone. Reply as JSON only: {"spoken": string, "title": string, "details": string}.
"spoken": two to four short sentences in your normal dry, direct style, no markdown, headline first. If it contains text, labels, readings or codes, read out the important ones.
"title": 2 to 5 words naming what the photo is.
"details": the key facts as lines starting with "- " (exact text read, part names and numbers, gauge or dashboard readings and warning lights, OBD codes with their meaning, receipt totals, anything he may want to act on). Say plainly if something is unreadable or you are unsure. Never invent text you cannot see.`;

export const visionConfig = (env = process.env) => ({
  baseUrl: (env.BRAIN_BASE_URL || 'https://openrouter.ai/api/v1').replace(/\/$/, ''),
  apiKey: env.BRAIN_API_KEY || env.OPENROUTER_API_KEY || '',
  model: env.VISION_MODEL || env.TALK_MODEL || 'google/gemini-3.8-flash'
});

export function parseDataUrl(s) {
  const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(s || ''));
  if (!m) return null;
  return { mime: m[1], b64: m[2], bytes: Math.floor(m[2].length * 3 / 4) };
}

const explain = (status, body) => {
  const b = String(body || '');
  if (status === 401) return 'The OpenRouter key is wrong or was deleted. Check OPENROUTER_API_KEY in Railway.';
  if (status === 402 || /credit|insufficient|limit exceeded/i.test(b)) return 'Out of OpenRouter credit, or the key hit its limit.';
  if (status === 429) return 'The vision model is rate limiting me. Try again in a moment.';
  if (status === 404 || /not a valid model|no endpoints|image/i.test(b) && status >= 400) return `The vision model cannot take images or is not available. Set VISION_MODEL in Railway to a vision model.`;
  return `The vision model returned error ${status}: ${b.slice(0, 160)}`;
};

// → { spoken, title, details, cost, ms } or throws Error with a spoken-friendly message
export async function analyzePhoto({ image, question = '', cfg = visionConfig(), signal, fetchImpl = fetch }) {
  if (!cfg.apiKey) throw new Error('The vision brain has no key yet. Add OPENROUTER_API_KEY in Railway.');
  const img = parseDataUrl(image);
  if (!img) throw new Error('That was not a usable photo. It must be a JPEG, PNG or WebP.');
  if (img.bytes > MAX_IMAGE_BYTES) throw new Error('That photo is too large to send.');
  const t0 = Date.now();
  let res;
  try {
    res = await fetchImpl(cfg.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + cfg.apiKey, 'Content-Type': 'application/json' },
      signal: signal || AbortSignal.timeout(60000),
      body: JSON.stringify({
        model: cfg.model, max_tokens: 2500, usage: { include: true },
        reasoning: { effort: 'low', exclude: true },
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: [
            { type: 'text', text: question ? `The Owner says: "${String(question).slice(0, 500)}". Analyze the photo for that.` : 'Describe and analyze this photo. Read any text, labels, gauges or codes.' },
            { type: 'image_url', image_url: { url: image } }
          ] }
        ]
      })
    });
  } catch (e) { throw new Error(`I could not reach the vision model: ${e.message}`); }
  const raw = await res.text();
  if (!res.ok) throw new Error(explain(res.status, raw));
  let j; try { j = JSON.parse(raw); } catch { throw new Error('The vision model sent back something unreadable.'); }
  const content = String(j.choices?.[0]?.message?.content || '').trim();
  if (!content) throw new Error(`The vision model gave no answer for that photo (it stopped because: ${j.choices?.[0]?.finish_reason || j.choices?.[0]?.native_finish_reason || 'unknown'}${j.error?.message ? '; ' + String(j.error.message).slice(0, 120) : ''}).`);
  let out;
  try { out = JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, '')); }
  catch { out = { spoken: content.slice(0, 500), title: 'Image analysis', details: content }; }
  const spoken = String(out.spoken || out.description || out.summary || out.details || '').trim().slice(0, 600) || (typeof out === 'object' ? '' : String(out).slice(0, 600));
  if (!spoken) throw new Error(`The vision model answered but with nothing readable (${content.slice(0, 100).replace(/\s+/g, ' ')}).`);
  return { spoken, title: String(out.title || 'Image analysis').slice(0, 60), details: String(out.details || '').trim(), cost: Number(j.usage?.cost) || 0, ms: Date.now() - t0 };
}
