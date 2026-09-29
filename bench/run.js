// Model test bench. Runs the Jarvis test cases against several talk models on OpenRouter and
// reports accuracy, speed and cost per model. Used by the /bench page, or from a PC:
//   OPENROUTER_API_KEY=... node bench/run.js            (all default candidates)
//   OPENROUTER_API_KEY=... node bench/run.js google/gemini-3.8-flash openai/gpt-oss-120b
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { talk, brainConfig, chatSystemPrompt } from '../brain.js';
import { HUD_TOOLS, FAILURE_TOOLS, MODE_TOOLS, CRYPTO_TOOLS } from '../tools.js';
import { CASES, GLOBAL_CHECK, contextFor, scriptedSearch } from './cases.js';

// Candidates are matched against OpenRouter's live model list, so newer versions get picked up automatically.
export const CANDIDATES = [
  { label: 'Gemini Flash-Lite', match: /^google\/gemini-[\d.]+-flash-lite$/ },
  { label: 'Gemini Flash', match: /^google\/gemini-[\d.]+-flash$/ },
  { label: 'GPT Luna', match: /^openai\/gpt-[\d.]+-luna$/ },
  { label: 'GPT-OSS 120B', match: /^openai\/gpt-oss-120b$/, provider: { order: ['groq', 'cerebras'], allow_fallbacks: true } },
  { label: 'GPT-OSS 20B', match: /^openai\/gpt-oss-20b$/, provider: { order: ['groq', 'cerebras'], allow_fallbacks: true } },
  { label: 'DeepSeek Flash', match: /^deepseek\/deepseek-v[\d.]+-flash$/ },
  { label: 'Mistral Small', match: /^mistralai\/mistral-small(-[\d.]+)?$/ },
  { label: 'Claude Haiku (current)', match: /^anthropic\/claude-haiku-[\d.]+$/ }
];

const WEB_SEARCH_TOOL = { name: 'web_search', description: 'Search the web for anything current: prices, weather, scores, news, hours, part availability. Returns short result snippets.', shape: { query: z.string() } };
const TOOLS = [...HUD_TOOLS, ...FAILURE_TOOLS, ...MODE_TOOLS, ...CRYPTO_TOOLS];

export async function resolveModels(cfg, ids) {
  const r = await fetch(`${cfg.baseUrl}/models`, { headers: cfg.apiKey ? { Authorization: `Bearer ${cfg.apiKey}` } : {} });
  if (!r.ok) throw new Error(`could not list models (${r.status})`);
  const list = (await r.json()).data || [];
  const price = m => ({ in: Number(m.pricing?.prompt || 0) * 1e6, out: Number(m.pricing?.completion || 0) * 1e6 });
  if (ids?.length) return ids.map(id => { const m = list.find(x => x.id === id); return m ? { label: m.name || id, id, price: price(m) } : { label: id, id, missing: true }; });
  return CANDIDATES.map(c => {
    const hits = list.filter(m => c.match.test(m.id)).sort((a, b) => (b.created || 0) - (a.created || 0));
    return hits.length ? { label: c.label, id: hits[0].id, price: price(hits[0]), provider: c.provider } : { label: c.label, id: null, missing: true };
  });
}

async function runCase(cfg, system, model, c) {
  const calls = [];
  let searches = 0;
  const r = await talk({
    cfg, model: model.id, provider: model.provider, system,
    prompt: contextFor(c),
    tools: c.live ? TOOLS : [...TOOLS, WEB_SEARCH_TOOL],
    webSearch: Boolean(c.live),
    budgetUsd: 0.05,
    run: async (name, args) => {
      if (name === 'web_search') { searches++; return scriptedSearch(c, String(args.query || '')); }
      if (name === 'use_workshop') return { text: 'Switching to workshop mode.', stop: true };
      if (name === 'get_hud') return JSON.stringify({ stats: { d: { label: 'Downloads · 7d', value: '412', delta: '+9%' }, a: { label: 'Ad spend · 7d', value: '$186' } }, panels: {} });
      if (name === 'list_failures') return 'a1b2 · 2026-09-29 15:02 · "order the 3M tint film" · no ordering connection';
      if (name === 'note_failure') return 'Remembered as failure c3d4.';
      if (name === 'crypto_scan') return JSON.stringify({ coins: [{ symbol: 'BTC', price: 98000, change24h: 1.2, change7d: 4.1 }, { symbol: 'SOL', price: 210, change24h: -7.8, change7d: -3 }], movers: ['SOL', 'BTC'] }) + '\n\nHow to use this: web-search news for the biggest movers (max 3 searches), then show_panel id crypto. Analysis, not financial advice; never place trades.';
      if (name === 'crypto_watch') return 'Watchlist: solana.';
      return 'Done.';
    }
  });
  const called = (name, pred) => calls.some(k => k.name === name && (!pred || (() => { try { return pred(k.args || {}); } catch { return false; } })()));
  for (const k of r.calls) calls.push(k);
  if (c.live && r.calls.some(k => k.name?.startsWith('openrouter'))) searches++;
  const ctx = { text: r.text || '', calls, called, searches };
  let verdict = r.error ? `error: ${r.error}` : c.check(ctx);
  if (verdict === true) verdict = GLOBAL_CHECK(ctx);
  return { id: c.id, area: c.area, pass: verdict === true, why: verdict === true ? '' : verdict, text: r.text, tools: calls.map(k => k.name), ms: r.ms, firstMs: r.firstMs, cost: r.cost, usage: r.usage };
}

/**
 * opts: { cfg, persona, ids, budgetUsd, onProgress, concurrency }
 */
export async function runBench({ cfg = brainConfig(), persona = '', ids, budgetUsd = 1, onProgress = () => {}, concurrency = 3 } = {}) {
  const system = chatSystemPrompt(persona);
  const models = await resolveModels(cfg, ids);
  const started = new Date().toISOString();
  let spent = 0, stoppedForBudget = false;
  const results = models.map(m => ({ ...m, cases: [] }));
  const total = results.filter(m => !m.missing).length * CASES.length;
  let done = 0;
  onProgress({ done, total, spent, models: results });

  const queue = results.filter(m => !m.missing);
  async function worker() {
    for (;;) {
      const m = queue.shift();
      if (!m) return;
      for (const c of CASES) {
        if (spent >= budgetUsd) { stoppedForBudget = true; return; }
        let res;
        try { res = await runCase(cfg, system, m, c); }
        catch (e) { res = { id: c.id, area: c.area, pass: false, why: `crashed: ${e.message}`, text: '', tools: [], ms: 0, firstMs: 0, cost: 0 }; }
        m.cases.push(res);
        spent += res.cost || 0;
        done++;
        onProgress({ done, total, spent, models: results });
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  for (const m of results) {
    if (m.missing) continue;
    const ok = m.cases.filter(c => c.pass).length;
    const times = m.cases.filter(c => c.ms).map(c => c.ms).sort((a, b) => a - b);
    const cost = m.cases.reduce((s, c) => s + (c.cost || 0), 0);
    const scripted = m.cases.filter(c => c.area !== 'live search');
    m.summary = {
      passed: ok, of: m.cases.length,
      medianMs: times.length ? times[Math.floor(times.length / 2)] : 0,
      slowestMs: times.at(-1) || 0,
      costPerQuestion: scripted.length ? scripted.reduce((s, c) => s + (c.cost || 0), 0) / scripted.length : 0,
      totalCost: cost,
      liveSearch: m.cases.find(c => c.area === 'live search')?.pass ?? null
    };
    m.summary.monthlyAt100PerDay = m.summary.costPerQuestion * 3000;
  }
  results.sort((a, b) => (b.summary?.passed || -1) - (a.summary?.passed || -1) || (a.summary?.medianMs || 9e9) - (b.summary?.medianMs || 9e9));
  return { started, finished: new Date().toISOString(), spent, stoppedForBudget, caseCount: CASES.length, models: results };
}

export function renderText(report) {
  const rows = report.models.map(m => m.missing
    ? `  ${m.label.padEnd(24)} not found on OpenRouter`
    : `  ${m.label.padEnd(24)} ${String(m.summary.passed).padStart(2)}/${m.summary.of}  ${(m.summary.medianMs / 1000).toFixed(1).padStart(5)}s median  $${m.summary.costPerQuestion.toFixed(5)}/question  ~$${m.summary.monthlyAt100PerDay.toFixed(2)}/month  live search ${m.summary.liveSearch ? 'ok' : 'FAILED'}  ${m.id}`);
  const misses = report.models.filter(m => !m.missing).map(m => {
    const f = m.cases.filter(c => !c.pass);
    return f.length ? `\n${m.label} missed:\n${f.map(c => `  - ${c.id}: ${c.why}\n      said: "${String(c.text || '').replace(/\s+/g, ' ').slice(0, 220)}"`).join('\n')}` : '';
  }).join('');
  return `Jarvis model test · ${report.caseCount} requests each · spent $${report.spent.toFixed(3)}${report.stoppedForBudget ? ' (stopped at budget)' : ''}\n\n${rows.join('\n')}\n${misses}`;
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
  try { (await import('dotenv')).config({ path: path.join(dir, '.env') }); } catch {}
  const persona = fs.readFileSync(path.join(dir, 'config', 'persona.md'), 'utf8');
  const ids = process.argv.slice(2);
  const report = await runBench({ persona, ids: ids.length ? ids : undefined, budgetUsd: Number(process.env.BENCH_BUDGET_USD || 1),
    onProgress: p => process.stdout.write(`\r  ${p.done}/${p.total} · $${p.spent.toFixed(3)}   `) });
  console.log('\n\n' + renderText(report));
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'data', 'bench-latest.json'), JSON.stringify(report, null, 2));
}
