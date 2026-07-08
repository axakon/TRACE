#!/usr/bin/env node
// Localhost HTTP server that renders Claude Code plan files with the committed
// viewer bundle. Node built-ins only; the markdown/mermaid rendering happens
// client-side in dist/viewer.bundle.js.
//
// Usage: node plan-server.js [--port N] [--plans-dir DIR]
// Env:   PLAYBOOK_PLAN_VIEWER_PORT overrides the default port.

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BUNDLE_PATH = path.join(__dirname, '..', 'viewer', 'dist', 'viewer.bundle.js');
const DEFAULT_PORT = 7526; // "PLAN" on a phone keypad
const DEFAULT_PLANS_DIR = path.join(os.homedir(), '.claude', 'plans');

function parseArgs(argv) {
  const opts = {
    port: Number(process.env.PLAYBOOK_PLAN_VIEWER_PORT) || DEFAULT_PORT,
    plansDir: DEFAULT_PLANS_DIR,
  };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--port' && argv[i + 1]) opts.port = Number(argv[++i]);
    else if (argv[i] === '--plans-dir' && argv[i + 1]) opts.plansDir = path.resolve(argv[++i]);
  }
  return opts;
}

const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

function planPath(plansDir, slug) {
  if (!SLUG_RE.test(slug) || slug.includes('..')) return null;
  return path.join(plansDir, `${slug}.md`);
}

function listPlans(plansDir) {
  let entries;
  try {
    entries = fs.readdirSync(plansDir);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const slug = f.slice(0, -3);
      let stat;
      try {
        stat = fs.statSync(path.join(plansDir, f));
      } catch {
        return null;
      }
      let title = slug;
      try {
        const firstLine = fs
          .readFileSync(path.join(plansDir, f), 'utf8')
          .split('\n')
          .find((l) => l.startsWith('# '));
        if (firstLine) title = firstLine.slice(2).trim();
      } catch {}
      return { slug, title, mtimeMs: stat.mtimeMs };
    })
    .filter(Boolean)
    .sort((a, b) => b.mtimeMs - a.mtimeMs);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Dark palette, defined once and applied two ways: via prefers-color-scheme
// when no explicit choice is made, and via [data-theme="dark"] when the
// toggle forces it.
const DARK_VARS = `
    color-scheme: dark;
    --bg: #0d1117; --fg: #f0f6fc; --muted: #9198a1; --border: #3d444d;
    --code-bg: #151b23; --inline-code-bg: rgba(129,139,152,.25);
    --accent: #4493f8;
    --pill-bg: #121d2f; --pill-fg: #4493f8;
    --card-bg: rgba(129,139,152,.09);
    --row-alt: rgba(129,139,152,.09);
    --mark-bg: rgba(187,128,9,.3); --mark-border: #9a6700;
    --note-bg: #2a2312; --note-fg: #f0f6fc; --note-accent: #d4a72c;
`;

const PAGE_CSS = `
  :root {
    color-scheme: light;
    --font-size: 16px; --line-height: 1.6;
    --font-body: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    --bg: #ffffff; --fg: #1f2328; --muted: #59636e; --border: #d1d9e0;
    --code-bg: #f6f8fa; --inline-code-bg: rgba(129,139,152,.2);
    --accent: #0969da;
    --pill-bg: #ddf4ff; --pill-fg: #0969da;
    --card-bg: rgba(129,139,152,.06);
    --row-alt: rgba(129,139,152,.08);
    --mark-bg: rgba(255,213,0,.35); --mark-border: #d4a72c;
    --note-bg: #fff8c5; --note-fg: #1f2328; --note-accent: #9a6700;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {${DARK_VARS}}
  }
  :root[data-theme="dark"] {${DARK_VARS}}
  * { box-sizing: border-box; }
  html { font-size: var(--font-size); }
  body {
    margin: 0; padding: 0;
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: var(--line-height);
    background: var(--bg); color: var(--fg);
  }
  main { max-width: min(1400px, 94vw); margin: 0 auto; padding: 2rem 1.5rem 4rem; }
  h1, h2, h3 { line-height: 1.25; }
  h1, h2 { border-bottom: 1px solid var(--border); padding-bottom: .3em; }
  h2 { margin-top: 1.6em; }
  code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: .9em; }
  :not(pre) > code { background: var(--inline-code-bg); padding: .15em .35em; border-radius: 4px; }
  pre { background: var(--code-bg); border-radius: 6px; padding: 1em; overflow-x: auto; }
  pre.mermaid { background: transparent; text-align: center; }
  table { border-collapse: collapse; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--border); padding: .4em .8em; }
  tr:nth-child(2n) td { background: var(--row-alt); }
  blockquote { border-left: 4px solid var(--border); margin-left: 0; padding-left: 1em; color: var(--muted); }
  a { color: var(--accent); }
  .meta { color: var(--muted); font-size: .85rem; margin-bottom: 2rem; }
  .page-tools { float: right; display: flex; gap: .4em; position: relative; }
  .theme-toggle {
    font: inherit; font-size: 1em; line-height: 1; cursor: pointer;
    padding: .1em .4em;
    background: transparent; border: 1px solid var(--border); border-radius: 6px;
    color: var(--muted);
  }
  .theme-toggle:hover { color: var(--accent); border-color: var(--accent); }
  .settings-panel {
    position: absolute; right: 0; top: 2.2em; z-index: 20;
    width: 250px; padding: .9em 1em 1em;
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    box-shadow: 0 6px 20px rgba(0,0,0,.25);
    color: var(--fg); font-size: .9rem;
  }
  .settings-panel label {
    display: flex; justify-content: space-between;
    margin: .7em 0 .15em; color: var(--muted); font-size: .85em;
  }
  .settings-panel label:first-child { margin-top: 0; }
  .settings-panel input[type=range] { width: 100%; accent-color: var(--accent); }
  .settings-panel select {
    width: 100%; font: inherit; padding: .25em;
    background: var(--bg); color: var(--fg);
    border: 1px solid var(--border); border-radius: 4px;
  }
  .settings-reset { display: inline-block; margin-top: .9em; font-size: .85em; }
  .plan-list { list-style: none; padding: 0; }
  .plan-list li { padding: .6em 0; border-bottom: 1px solid var(--border); }
  .plan-list .slug { color: var(--muted); font-size: .85em; margin-left: .5em; }
  li.user-story {
    list-style: none;
    border: 1px solid var(--border); border-radius: 8px;
    padding: .7em 1em; margin: .6em 0 .6em -1.2em;
    display: flex; flex-wrap: wrap; align-items: baseline; gap: .35em .6em;
    background: var(--card-bg);
  }
  .story-role {
    font-weight: 600; font-size: .82em; white-space: nowrap;
    background: var(--pill-bg); color: var(--pill-fg);
    border-radius: 999px; padding: .15em .7em;
  }
  .story-want { flex: 1 1 auto; min-width: 60%; }
  .story-outcome { flex-basis: 100%; color: var(--muted); font-size: .92em; }
  mark.plan-mark {
    background: var(--mark-bg);
    border-bottom: 2px solid var(--mark-border);
    color: inherit; padding: 0 .05em;
  }
  .mark-note {
    display: inline-flex; gap: .35em; align-items: center;
    background: var(--note-bg); border: 1px solid var(--mark-border); border-radius: 6px;
    padding: .1em .45em; margin: 0 .35em;
    font-size: .82em; line-height: 1.5; vertical-align: baseline;
    color: var(--note-fg);
  }
  .note-text { min-width: 9em; outline: none; }
  .note-text:empty::before { content: 'add comment…'; color: var(--note-accent); opacity: .75; }
  .note-del {
    font: inherit; font-size: .9em; cursor: pointer;
    background: transparent; border: 0; padding: 0; color: var(--note-accent);
  }
  .story-add {
    font: inherit; font-size: .55em; line-height: 1; cursor: pointer;
    margin-left: .6em; vertical-align: middle;
    width: 1.8em; height: 1.8em; border-radius: 50%;
    border: 1px solid var(--border); background: transparent; color: var(--muted);
  }
  .story-add:hover { background: var(--pill-bg); color: var(--pill-fg); border-color: var(--pill-fg); }
  li.draft-story { border-style: dashed; }
  li.draft-story .note-del { order: 1; margin-left: auto; }
  .draft-field {
    display: inline-block; min-width: 5em; outline: none;
    border-bottom: 1px dashed var(--note-accent); padding: 0 .15em;
  }
  .draft-field:empty::before { content: attr(data-placeholder); opacity: .55; }
`;

// Cog-wheel settings: font size, line height, font family. Applied as CSS
// variables on the root element and persisted in localStorage.
const SETTINGS_SCRIPT = `
(() => {
  const DEFAULTS = { fontSize: 16, lineHeight: 1.6, font: 'system' };
  const FONTS = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    serif: 'Georgia, "Iowan Old Style", "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  };
  let settings = Object.assign({}, DEFAULTS);
  try {
    Object.assign(settings, JSON.parse(localStorage.getItem('plan-viewer-settings') || '{}'));
  } catch {}

  const root = document.documentElement;
  function apply() {
    root.style.setProperty('--font-size', settings.fontSize + 'px');
    root.style.setProperty('--line-height', settings.lineHeight);
    root.style.setProperty('--font-body', FONTS[settings.font] || FONTS.system);
  }
  function save() {
    localStorage.setItem('plan-viewer-settings', JSON.stringify(settings));
  }
  apply();

  const cog = document.getElementById('settings-toggle');
  const panel = document.getElementById('settings-panel');
  panel.innerHTML =
    '<label>Font size <span id="fs-val"></span></label>' +
    '<input id="set-fs" type="range" min="13" max="22" step="1">' +
    '<label>Line height <span id="lh-val"></span></label>' +
    '<input id="set-lh" type="range" min="1.2" max="2" step="0.1">' +
    '<label>Font</label>' +
    '<select id="set-font">' +
    '<option value="system">System sans</option>' +
    '<option value="serif">Serif</option>' +
    '<option value="mono">Monospace</option>' +
    '</select>' +
    '<a href="#" class="settings-reset" id="set-reset">Reset to defaults</a>';

  const fs = panel.querySelector('#set-fs');
  const lh = panel.querySelector('#set-lh');
  const font = panel.querySelector('#set-font');
  function sync() {
    fs.value = settings.fontSize;
    lh.value = settings.lineHeight;
    font.value = FONTS[settings.font] ? settings.font : 'system';
    panel.querySelector('#fs-val').textContent = settings.fontSize + 'px';
    panel.querySelector('#lh-val').textContent = settings.lineHeight;
  }
  sync();

  fs.addEventListener('input', () => { settings.fontSize = Number(fs.value); apply(); save(); sync(); });
  lh.addEventListener('input', () => { settings.lineHeight = Number(lh.value); apply(); save(); sync(); });
  font.addEventListener('change', () => { settings.font = font.value; apply(); save(); });
  panel.querySelector('#set-reset').addEventListener('click', (e) => {
    e.preventDefault();
    settings = Object.assign({}, DEFAULTS);
    apply(); save(); sync();
  });

  cog.addEventListener('click', () => { panel.hidden = !panel.hidden; });
  document.addEventListener('click', (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== cog) panel.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) panel.hidden = true;
  });
})();
`;

// Applies a saved theme before first paint and wires the toggle button.
const THEME_SCRIPT = `
(() => {
  const root = document.documentElement;
  const saved = localStorage.getItem('plan-viewer-theme');
  if (saved) root.dataset.theme = saved;
  document.getElementById('theme-toggle').addEventListener('click', () => {
    const current = root.dataset.theme ||
      (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    localStorage.setItem('plan-viewer-theme', next);
    document.dispatchEvent(new CustomEvent('theme-changed'));
  });
})();
`;

function planPage(slug) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plan: ${escapeHtml(slug)}</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>
  <div class="meta">
    <span class="page-tools">
      <button id="theme-toggle" class="theme-toggle" title="Toggle light/dark">◐</button>
      <button id="settings-toggle" class="theme-toggle" title="Settings">⚙</button>
      <div id="settings-panel" class="settings-panel" hidden></div>
    </span>
    <a href="/">← all plans</a> · <span id="status">loading…</span><span id="rev-toolbar"></span>
  </div>
  <div id="content"></div>
</main>
<script>${THEME_SCRIPT}</script>
<script>${SETTINGS_SCRIPT}</script>
<script src="/assets/viewer.js"></script>
<script>
(() => {
  const slug = ${JSON.stringify(slug)};
  let lastMtime = 0;
  PlanViewer.initAnnotations({
    contentEl: document.getElementById('content'),
    toolbarEl: document.getElementById('rev-toolbar'),
    slug,
  });
  async function refresh(force) {
    try {
      const res = await fetch('/api/plan/' + slug);
      if (!res.ok) { document.getElementById('status').textContent = 'plan not found'; return; }
      const data = await res.json();
      if (force || data.mtimeMs !== lastMtime) {
        lastMtime = data.mtimeMs;
        await PlanViewer.render(data.markdown, document.getElementById('content'));
        document.getElementById('status').textContent =
          'updated ' + new Date(data.mtimeMs).toLocaleTimeString();
      }
    } catch {
      document.getElementById('status').textContent = 'server unreachable';
    }
  }
  document.addEventListener('theme-changed', () => refresh(true));
  refresh();
  setInterval(() => refresh(), 1500);
})();
</script>
</body>
</html>`;
}

function indexPage(plans) {
  const items = plans
    .map(
      (p) =>
        `<li><a href="/plan/${encodeURIComponent(p.slug)}">${escapeHtml(p.title)}</a>` +
        `<span class="slug">${escapeHtml(p.slug)}</span></li>`
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Plans</title>
<style>${PAGE_CSS}</style>
</head>
<body>
<main>
  <div class="meta">
    <span class="page-tools">
      <button id="theme-toggle" class="theme-toggle" title="Toggle light/dark">◐</button>
      <button id="settings-toggle" class="theme-toggle" title="Settings">⚙</button>
      <div id="settings-panel" class="settings-panel" hidden></div>
    </span>
  </div>
  <h1>Plans</h1>
  <ul class="plan-list">${items || '<li>No plans found.</li>'}</ul>
</main>
<script>${THEME_SCRIPT}</script>
<script>${SETTINGS_SCRIPT}</script>
</body>
</html>`;
}

function send(res, status, body, type) {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function main() {
  const { port, plansDir } = parseArgs(process.argv);

  const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    const parts = url.pathname.split('/').filter(Boolean);

    if (url.pathname === '/') {
      return send(res, 200, indexPage(listPlans(plansDir)), 'text/html; charset=utf-8');
    }

    if (url.pathname === '/api/info') {
      return send(
        res,
        200,
        JSON.stringify({ service: 'playbook-plan-viewer', plansDir, pid: process.pid }),
        'application/json'
      );
    }

    if (url.pathname === '/assets/viewer.js') {
      let bundle;
      try {
        bundle = fs.readFileSync(BUNDLE_PATH);
      } catch {
        return send(res, 500, 'viewer bundle missing — run npm run build in viewer/', 'text/plain');
      }
      return send(res, 200, bundle, 'application/javascript');
    }

    if (parts.length === 2 && parts[0] === 'plan') {
      const slug = decodeURIComponent(parts[1]);
      const file = planPath(plansDir, slug);
      if (!file || !fs.existsSync(file)) return send(res, 404, 'plan not found', 'text/plain');
      return send(res, 200, planPage(slug), 'text/html; charset=utf-8');
    }

    if (parts.length === 3 && parts[0] === 'api' && parts[1] === 'plan') {
      const slug = decodeURIComponent(parts[2]);
      const file = planPath(plansDir, slug);
      let markdown, stat;
      try {
        markdown = fs.readFileSync(file, 'utf8');
        stat = fs.statSync(file);
      } catch {
        return send(res, 404, JSON.stringify({ error: 'not found' }), 'application/json');
      }
      return send(
        res,
        200,
        JSON.stringify({ slug, markdown, mtimeMs: stat.mtimeMs }),
        'application/json'
      );
    }

    send(res, 404, 'not found', 'text/plain');
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`plan viewer serving ${plansDir} at http://127.0.0.1:${port}/`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Another instance is already serving; nothing to do.
      process.exit(0);
    }
    throw err;
  });
}

main();
