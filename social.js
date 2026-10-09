// Social posting through Buffer's API (https://developers.buffer.com): one Buffer account (one API key) per brand.
// Keys live in Railway variables named BUFFER_KEY_<BRAND> (BUFFER_KEY_DEFIANT, BUFFER_KEY_MYONLINECARGUY, BUFFER_KEY_NEXUS, BUFFER_KEY_MYGURU...).
// Jarvis only DRAFTS; a post goes to Buffer after the Owner approves it (voice or signed link). Never posts on its own.
const API = process.env.BUFFER_API_URL || 'https://api.buffer.com';
const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
export const brands = () => Object.entries(process.env).filter(([k, v]) => /^BUFFER_KEY_[A-Z0-9_]+$/.test(k) && v && v.trim()).map(([k, v]) => ({ id: k.slice(11).toLowerCase(), key: v.trim() }));
export function findBrand(q) {
  const list = brands(), n = norm(q);
  if (!n) return list.length === 1 ? list[0] : null;
  return list.find(b => norm(b.id) === n) || list.find(b => norm(b.id).includes(n) || n.includes(norm(b.id))) || null;
}
async function gql(key, query) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(20000) });
  const t = await r.text(); let j; try { j = JSON.parse(t); } catch { throw new Error(`Buffer answered ${r.status}: ${t.slice(0, 120)}`); }
  if (j.errors?.length) throw new Error(j.errors.map(e => e.message).join('; ').slice(0, 300));
  if (!r.ok) throw new Error(`Buffer answered ${r.status}`);
  return j.data;
}
const cache = new Map();
// Every channel (Facebook page, Instagram, YouTube...) connected in that brand's Buffer account.
export async function channelsFor(brand) {
  const hit = cache.get(brand.id); if (hit && Date.now() - hit.at < 10 * 60e3) return hit.list;
  const d = await gql(brand.key, 'query { account { organizations { id name } } }');
  const list = [];
  for (const o of d.account?.organizations || []) {
    const c = await gql(brand.key, `query { channels(input: { organizationId: ${JSON.stringify(o.id)} }) { id name service } }`);
    for (const ch of c.channels || []) list.push({ id: ch.id, name: ch.name, service: ch.service });
  }
  cache.set(brand.id, { at: Date.now(), list }); return list;
}
// Create the post on each channel. whenISO (UTC) schedules it; without it the post goes to the next queue slot.
export async function publish(brand, { text, imageUrl, channelIds, whenISO }) {
  const out = [];
  for (const ch of channelIds) {
    const q = `mutation { createPost(input: { text: ${JSON.stringify(text)}, channelId: ${JSON.stringify(ch)}, schedulingType: automatic, mode: ${whenISO ? 'customScheduled' : 'addToQueue'}${whenISO ? `, dueAt: ${JSON.stringify(whenISO)}` : ''}${imageUrl ? `, assets: [{ image: { url: ${JSON.stringify(imageUrl)} } }]` : ''} }) { ... on PostActionSuccess { post { id dueAt } } ... on MutationError { message } } }`;
    try { const d = await gql(brand.key, q), r = d.createPost || {}; out.push(r.post ? { ch, ok: true, id: r.post.id, dueAt: r.post.dueAt } : { ch, ok: false, error: r.message || 'no result' }); }
    catch (e) { out.push({ ch, ok: false, error: e.message }); }
  }
  return out;
}
