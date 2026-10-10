// Jarvis self-repair: lets Jarvis read, change, test and redeploy its own code.
//
// Flow:  self_checkout → edit files in ./self (Read/Edit/Write) → self_check (syntax + boot test)
//        → Jarvis asks "Shall I deploy, sir?" → user says yes → self_deploy (commit to GitHub → Railway rebuilds)
//        self_rollback undoes the last deployed change.
//
// Talks to GitHub over its REST API (no git binary needed). Needs GITHUB_TOKEN with
// "Contents: read and write" on the repo, and GITHUB_REPO (owner/name).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, execFileSync } from 'node:child_process';

const CONFIRM = /\b(yes|yeah|yep|yup|sure|confirm(ed)?|deploy( it)?|ship it|do it|go ahead|proceed|affirmative|make it so|send it)\b/i;
const DENY = /\b(no|nope|don'?t|do not|cancel|stop|wait|hold on|not yet)\b/i;
const ROLLBACK = /\b(roll(ed)?[\s-]*(it|that|this|those|them|the (last )?(change|update|version))?[\s-]*back|rollback|revert|undo|put it back|go back to the (old|previous|last)|previous version)\b/i;
const SKIP_DIRS = new Set(['node_modules', '.git', 'data', 'workspace']);

export function createSelfRepair({ tool, z, appDir, workspace, getTurn, broadcast, setPanel, logs }) {
  const REPO = process.env.GITHUB_REPO || 'Elliot-H/Jarvis-2.0';
  const BRANCH = process.env.GITHUB_BRANCH || 'main';
  const SELF_DIR = path.join(workspace, 'self');
  const HISTORY = path.join(appDir, 'data', 'self-history.json');
  let base = null;      // { sha, tree, blobs: {path: blobSha} }
  let pending = null;   // { turnId, changes, report, fingerprint }

  const text = t => ({ content: [{ type: 'text', text: String(t) }] });
  const fail = t => ({ content: [{ type: 'text', text: 'FAILED: ' + t }], isError: true });

  // ---------- GitHub ----------
  async function gh(p, opts = {}) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GITHUB_TOKEN is not set. The user needs to add a GitHub token in Railway → Variables before I can change my own code.');
    const r = await fetch(`${process.env.GITHUB_API || 'https://api.github.com'}/repos/${REPO}${p}`, {
      ...opts,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'jarvis-self-repair', ...(opts.body ? { 'Content-Type': 'application/json' } : {}) }
    });
    if (!r.ok) {
      const body = await r.text();
      const hint = r.status === 401 ? ' (token invalid or expired)' : r.status === 403 || r.status === 404 ? ' (token lacks access to this repo, or needs Contents: read and write)' : '';
      throw new Error(`GitHub ${r.status}${hint}: ${body.slice(0, 200)}`);
    }
    return r.status === 204 ? null : r.json();
  }
  const blobSha = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');

  // ---------- local working copy ----------
  function walk(dir, rel = '') {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (SKIP_DIRS.has(e.name) && !rel) continue;
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) out.push(...walk(path.join(dir, e.name), r));
      else if (e.isFile()) out.push(r);
    }
    return out;
  }
  function changes() {
    if (!base) return null;
    const now = new Set(walk(SELF_DIR));
    const modified = [], added = [], deleted = [];
    for (const p of now) {
      const sha = blobSha(fs.readFileSync(path.join(SELF_DIR, p)));
      if (!(p in base.blobs)) added.push(p);
      else if (base.blobs[p] !== sha) modified.push(p);
    }
    for (const p of Object.keys(base.blobs)) if (!now.has(p) && !SKIP_DIRS.has(p.split('/')[0])) deleted.push(p);
    return { modified, added, deleted, all: [...modified, ...added, ...deleted] };
  }
  function fingerprint(ch) {
    const h = crypto.createHash('sha256');
    for (const p of [...ch.modified, ...ch.added].sort()) h.update(p).update(fs.readFileSync(path.join(SELF_DIR, p)));
    h.update('del:' + ch.deleted.sort().join(','));
    return h.digest('hex');
  }

  async function checkout(force) {
    const ch = changes();
    if (ch && ch.all.length && !force) return { skipped: true, ch };
    const ref = await gh(`/git/ref/heads/${BRANCH}`);
    const commit = await gh(`/git/commits/${ref.object.sha}`);
    const tree = await gh(`/git/trees/${commit.tree.sha}?recursive=1`);
    fs.rmSync(SELF_DIR, { recursive: true, force: true });
    fs.mkdirSync(SELF_DIR, { recursive: true });
    const blobs = {};
    for (const item of tree.tree) {
      if (item.type !== 'blob') continue;
      const blob = await gh(`/git/blobs/${item.sha}`);
      const buf = Buffer.from(blob.content, 'base64');
      const dest = path.join(SELF_DIR, item.path);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, buf);
      blobs[item.path] = item.sha;
    }
    base = { sha: ref.object.sha, tree: commit.tree.sha, blobs, message: commit.message.split('\n')[0] };
    pending = null;
    return { skipped: false, files: Object.keys(blobs) };
  }

  // ---------- checks ----------
  function secretLeak(files) {
    const secrets = Object.entries(process.env)
      .filter(([k, v]) => /KEY|TOKEN|SECRET|PIN|PASSWORD/i.test(k) && v && v.length >= 6)
      .map(([k, v]) => [k, v]);
    for (const p of files) {
      const body = fs.readFileSync(path.join(SELF_DIR, p), 'utf8');
      for (const [k, v] of secrets) if (body.includes(v)) return `${p} contains the value of ${k}. Secrets must stay in Railway variables, never in code.`;
    }
    return null;
  }
  function syntaxCheck(files) {
    const problems = [];
    for (const p of files) {
      const full = path.join(SELF_DIR, p);
      if (/\.(m?js|cjs)$/.test(p)) {
        try { execFileSync(process.execPath, ['--check', full], { stdio: 'pipe', timeout: 20000 }); }
        catch (e) { problems.push(`${p}: ${String(e.stderr || e.message).split('\n').slice(0, 6).join(' ').slice(0, 400)}`); }
      } else if (/\.(json|webmanifest)$/.test(p)) {
        try { JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) { problems.push(`${p}: invalid JSON — ${e.message}`); }
      }
    }
    return problems;
  }
  function bootTest() {
    // Start the edited copy on a spare port and make sure it serves pages.
    return new Promise(resolve => {
      const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jarvis-smoke-'));
      fs.cpSync(SELF_DIR, tmp, { recursive: true });
      try { fs.symlinkSync(path.join(appDir, 'node_modules'), path.join(tmp, 'node_modules'), 'dir'); } catch {}
      const port = 20000 + Math.floor(Math.random() * 20000);
      const env = { PATH: process.env.PATH, HOME: process.env.HOME, NODE_ENV: 'test', PORT: String(port), HOST: '127.0.0.1', JARVIS_WORKSPACE: path.join(tmp, 'workspace'), JARVIS_SMOKE: '1' };
      const child = spawn(process.execPath, ['server.js'], { cwd: tmp, env, stdio: ['ignore', 'pipe', 'pipe'] });
      let out = '';
      child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
      const finish = (ok, why) => {
        clearInterval(poll); clearTimeout(timer);
        try { child.kill('SIGKILL'); } catch {}
        fs.rmSync(tmp, { recursive: true, force: true });
        resolve({ ok, why, output: out.slice(-1500) });
      };
      child.on('exit', code => finish(false, `server exited with code ${code} during startup`));
      const timer = setTimeout(() => finish(false, 'server did not answer within 25 seconds'), 25000);
      const poll = setInterval(async () => {
        try {
          const h = await fetch(`http://127.0.0.1:${port}/health`);
          if (!h.ok) return;
          const home = await fetch(`http://127.0.0.1:${port}/`);
          const js = await fetch(`http://127.0.0.1:${port}/app.js`);
          if (home.ok && js.ok) finish(true, 'server started and served the HUD');
          else finish(false, `server started but / returned ${home.status} and /app.js returned ${js.status}`);
        } catch {}
      }, 500);
    });
  }
  function diffSummary(ch) {
    const lines = [];
    for (const p of ch.modified) lines.push(`~ ${p} (changed)`);
    for (const p of ch.added) lines.push(`+ ${p} (new)`);
    for (const p of ch.deleted) lines.push(`- ${p} (deleted)`);
    return lines.join('\n');
  }
  function history(entry) {
    let h = []; try { h = JSON.parse(fs.readFileSync(HISTORY, 'utf8')); } catch {}
    h.unshift({ at: new Date().toISOString(), ...entry }); h = h.slice(0, 50);
    try { fs.mkdirSync(path.dirname(HISTORY), { recursive: true }); fs.writeFileSync(HISTORY, JSON.stringify(h, null, 2)); } catch {}
  }

  // ---------- commit ----------
  async function commitTree(treeEntries, baseTree, parent, message) {
    const tree = await gh('/git/trees', { method: 'POST', body: JSON.stringify({ base_tree: baseTree, tree: treeEntries }) });
    const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify({
      message, tree: tree.sha, parents: [parent],
      author: { name: 'Jarvis', email: 'jarvis@users.noreply.github.com' }
    }) });
    await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
    return commit.sha;
  }

  const tools = [
    tool('self_checkout',
      'Download my own current source code from GitHub into ./self so I can read and edit it. Call this first whenever the user asks me to change, fix, improve or add something to myself. If I already have unsaved edits it keeps them unless force=true.',
      { force: z.boolean().optional().describe('discard my local edits and download fresh') },
      async ({ force }) => {
        try {
          const r = await checkout(!!force);
          if (r.skipped) return text(`Kept existing working copy with my unsent edits: ${r.ch.all.join(', ')}. Pass force=true to start over.`);
          broadcast({ type: 'activity', text: `Loaded my source code (${r.files.length} files)` });
          return text(`Checked out ${REPO}@${base.sha.slice(0, 7)} ("${base.message}") into ./self.\nFiles:\n${r.files.join('\n')}\n\nKey files: server.js (routing, tool handlers, voice, PIN lock, caps), brain.js (talk brain on OpenRouter), tools.js (tool definitions), bench/ (model test), self.js (this self-repair system), public/app.js (screen, wake word, speech), public/style.css, public/index.html, config/persona.md (my personality), config/briefing.md (wake-up briefing), config/mcp.json (connections). Edit with Read/Edit/Write on paths under ./self, then call self_check.`);
        } catch (e) { return fail(e.message); }
      }),

    tool('self_check',
      'Test my edits in ./self: syntax check, secret scan, and a real startup test of the edited server. On success it records the change as ready and shows it on the HUD. After a successful check, briefly tell the user what changed and ask "Shall I deploy, sir?" — then STOP and wait for his answer. Never call self_deploy in the same turn.',
      { summary: z.string().describe('one or two sentences, plain English: what this change does for the user') },
      async ({ summary }) => {
        try {
          if (!base) return fail('Nothing checked out. Call self_checkout first.');
          const ch = changes();
          if (!ch.all.length) return fail('No changes found in ./self.');
          const leak = secretLeak([...ch.modified, ...ch.added]);
          if (leak) return fail(leak);
          const syntax = syntaxCheck([...ch.modified, ...ch.added]);
          if (syntax.length) return fail('Syntax problems:\n' + syntax.join('\n'));
          broadcast({ type: 'activity', text: 'Test-starting the changed version…' });
          const boot = await bootTest();
          if (!boot.ok) return fail(`Startup test failed: ${boot.why}\n--- output ---\n${boot.output}`);
          const t = getTurn();
          const fp = fingerprint(ch);
          // Re-checking the same, unchanged edit keeps the original "asked" turn, so a yes still counts.
          const turnId = pending && pending.fingerprint === fp ? pending.turnId : t.id;
          pending = { turnId, changes: ch, summary, fingerprint: fp };
          const files = diffSummary(ch);
          setPanel('self_change', { title: 'Proposed change — awaiting your OK', body: `${summary}\n\n${files.split('\n').map(l => '- ' + l).join('\n')}\n\nSay "yes, deploy" to ship it, or "no" to cancel.` });
          return text(`All checks passed (${boot.why}). Change is READY but NOT deployed.\nFiles:\n${files}\n\nNow ask the User: "Shall I deploy, sir?" and end your turn.`);
        } catch (e) { return fail(e.message); }
      }),

    tool('self_deploy',
      'Deploy the change that passed self_check: commit it to GitHub so Railway rebuilds me (about 2 minutes, then I restart). Only works if the user said yes in his latest message, after I asked. Never call this unless he just confirmed.',
      { commit_message: z.string().describe('short description of the change') },
      async ({ commit_message }) => {
        try {
          const t = getTurn();
          if (!pending) return fail('Nothing is waiting to deploy. Run self_check first.');
          if (pending.turnId === t.id) return fail('I must ask the user first and wait for his answer in a new message.');
          if (t.origin !== 'user' || !CONFIRM.test(t.text) || (DENY.test(t.text) && !/\bdo it\b/i.test(t.text))) return fail(`The user has not clearly said yes (he said: "${t.text}"). Ask again.`);
          const ch = changes();
          if (fingerprint(ch) !== pending.fingerprint) return fail('Files changed after the check. Run self_check again.');
          const ref = await gh(`/git/ref/heads/${BRANCH}`);
          if (ref.object.sha !== base.sha) return fail('My code on GitHub changed since I downloaded it. Call self_checkout with force=true and redo the change.');
          const entries = [];
          for (const p of [...ch.modified, ...ch.added]) {
            const blob = await gh('/git/blobs', { method: 'POST', body: JSON.stringify({ content: fs.readFileSync(path.join(SELF_DIR, p)).toString('base64'), encoding: 'base64' }) });
            entries.push({ path: p, mode: '100644', type: 'blob', sha: blob.sha });
          }
          for (const p of ch.deleted) entries.push({ path: p, mode: '100644', type: 'blob', sha: null });
          const sha = await commitTree(entries, base.tree, base.sha, `Jarvis: ${commit_message}\n\n${pending.summary}\n\nApproved by user: "${t.text.slice(0, 120)}"`);
          history({ action: 'deploy', sha, message: commit_message, files: ch.all });
          pending = null; base = null;
          setPanel('self_change', null);
          broadcast({ type: 'activity', text: `Deployed ${sha.slice(0, 7)} — rebuilding` });
          return text(`Committed ${sha.slice(0, 7)} to ${REPO}. Railway is rebuilding now; I will restart in about two minutes. If the new version fails its health check, Railway keeps the current one running.`);
        } catch (e) { return fail(e.message); }
      }),

    tool('self_cancel',
      'Throw away my proposed change (when the user says no).',
      {},
      async () => { pending = null; base = null; fs.rmSync(SELF_DIR, { recursive: true, force: true }); setPanel('self_change', null); return text('Proposed change cancelled and my working copy discarded.'); }),

    tool('self_rollback',
      'Undo the most recent change to my code on GitHub (creates a new commit restoring the previous version), so Railway redeploys the older version. Only when the user asks to roll back / revert / undo.',
      { reason: z.string() },
      async ({ reason }) => {
        try {
          const t = getTurn();
          if (t.origin !== 'user' || !ROLLBACK.test(t.text)) return fail('Only roll back when the user explicitly asks to roll back, revert or undo.');
          const ref = await gh(`/git/ref/heads/${BRANCH}`);
          const head = await gh(`/git/commits/${ref.object.sha}`);
          if (!head.parents?.length) return fail('Nothing to roll back to.');
          const parent = await gh(`/git/commits/${head.parents[0].sha}`);
          const commit = await gh('/git/commits', { method: 'POST', body: JSON.stringify({
            message: `Jarvis: roll back "${head.message.split('\n')[0]}"\n\n${reason}`, tree: parent.tree.sha, parents: [head.sha],
            author: { name: 'Jarvis', email: 'jarvis@users.noreply.github.com' }
          }) });
          await gh(`/git/refs/heads/${BRANCH}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
          history({ action: 'rollback', sha: commit.sha, undid: head.sha, message: head.message.split('\n')[0] });
          base = null; pending = null;
          return text(`Rolled back "${head.message.split('\n')[0]}". Railway is redeploying the previous version (about two minutes).`);
        } catch (e) { return fail(e.message); }
      }),

    tool('self_status',
      'Show my self-repair state: current version, recent changes to my code, whether a change is waiting for approval, and whether GitHub access works.',
      {},
      async () => {
        try {
          const commits = await gh(`/commits?sha=${BRANCH}&per_page=6`);
          const ch = changes();
          return text([
            `Repo: ${REPO} (${BRANCH})`,
            `Recent versions:\n${commits.map(c => `- ${c.sha.slice(0, 7)} ${c.commit.author.date.slice(0, 16).replace('T', ' ')} ${c.commit.message.split('\n')[0]}`).join('\n')}`,
            `Working copy: ${base ? `based on ${base.sha.slice(0, 7)}, edited: ${ch.all.join(', ') || 'none'}` : 'none'}`,
            `Waiting for approval: ${pending ? pending.summary : 'nothing'}`
          ].join('\n\n'));
        } catch (e) { return fail(e.message); }
      }),

    tool('self_logs',
      'Read my recent server log and errors reported by the user\'s screen (browser). Use this to diagnose problems before fixing them.',
      { lines: z.number().optional() },
      async ({ lines }) => text(logs.tail(Math.min(Number(lines) || 120, 400)) || '(log is empty)'))
  ];

  // True while a self-change is in progress (edited files or a change awaiting approval)
  const active = () => Boolean(pending || (base && changes()?.all.length));
  return { tools, SELF_DIR, active };
}
