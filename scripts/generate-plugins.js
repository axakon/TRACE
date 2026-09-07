#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const HOSTS = ['claude', 'codex'];
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

function files(dir, ignore = []) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en')).flatMap((entry) => {
    if (ignore.includes(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not a package input: ${full}`);
    return entry.isDirectory() ? files(full, ignore) : [full];
  });
}

function parseSkill(text) {
  const match = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(text);
  if (!match) throw new Error('Skill must have LF-delimited frontmatter');
  const metadata = {};
  for (const line of match[1].split('\n')) {
    const field = /^([\w-]+): (.*)$/.exec(line);
    if (!field) throw new Error(`Unsupported source frontmatter: ${line}`);
    metadata[field[1]] = field[2];
  }
  return { metadata, body: match[2] };
}

function outputRoot(host, name) {
  return host === 'claude' ? `deliverable/plugins/${name}` : `plugins/${name}`;
}

function generate(root = ROOT) {
  const source = path.join(root, 'plugin-src');
  const catalog = JSON.parse(fs.readFileSync(path.join(source, 'catalog.json'), 'utf8'));
  const result = new Map();
  const put = (file, content) => {
    const bytes = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (result.has(file) && !result.get(file).equals(bytes)) throw new Error(`Conflicting package input: ${file}`);
    result.set(file, bytes);
  };
  const names = Object.keys(catalog.plugins);
  for (const host of HOSTS) {
    const adapter = JSON.parse(fs.readFileSync(path.join(source, 'adapters', `${host}.json`), 'utf8'));
    for (const name of names) {
      const target = outputRoot(host, name);
      const members = host === 'codex' && name === 'trace-full' ? names.filter((n) => n !== 'trace-full') : [name];
      const skillName = (owner, skill) => `${host === 'claude' ? '/' : '$'}${name === 'trace-full' && host === 'codex' ? name : owner}:${skill}`;
      function render(text) {
        text = text.replace(/\{\{([\w-]+)\}\}/g, (all, key) => {
          if (key === 'installation') return host === 'claude'
            ? `Install from the TRACE marketplace:\n\n\`\`\`text\n/plugin marketplace add axakon/TRACE\n/plugin install ${name}@trace\n/reload-plugins\n\`\`\`\n\nClaude installs declared dependencies automatically.`
            : `Add the TRACE marketplace, then install this package:\n\n\`\`\`sh\ncodex plugin marketplace add axakon/TRACE\n${['trace-plan', 'trace-git'].includes(name) ? 'codex plugin add trace@trace\n' : ''}codex plugin add ${name}@trace\n\`\`\`\n\nStart a new session after installation. In Codex desktop, install from the TRACE marketplace in the Plugins view. Review and trust plugin hooks in the host hook controls. Choose either trace-full or individual packages; enabling both duplicates skill listings.`;
          if (key === 'bundle-description') return host === 'claude'
            ? 'This package installs trace, trace-plan, and trace-git through Claude’s plugin dependencies. Invoke skills under their original plugin namespaces.'
            : 'This package contains all ten skills, the core hooks, and the viewer. It needs no other TRACE package. Invoke its skills under the trace-full namespace. Individual add-ons require a separate trace core install.';
          if (!(key in adapter)) throw new Error(`Unknown adapter field: ${key}`);
          return adapter[key];
        });
        text = text.replace(/\{\{skill:([\w-]+):([\w-]+)\}\}/g, (_, owner, skill) => skillName(owner, skill));
        if (/\{\{/.test(text)) throw new Error(`Unexpanded template in ${name}`);
        return text;
      }
      for (const member of members) {
        const base = path.join(source, member);
        for (const file of files(base, ['node_modules'])) {
          const rel = path.relative(base, file).split(path.sep).join('/');
          if (rel.split('/').includes('node_modules') || rel.startsWith('viewer/src/') || rel.startsWith('viewer/fixtures/') || /^viewer\/(package.*\.json|\.gitignore)$/.test(rel)) continue;
          if (name === 'trace-full' && member !== name && rel === 'README.md') continue;
          if (name === 'trace-full' && rel === 'hooks/hooks.json' && member !== 'trace') continue;
          if (host === 'codex' && rel === '.mcp.json') continue; // Claude's disabled optional server is not an auto-install request.
          let content = fs.readFileSync(file);
          if (rel.endsWith('/SKILL.md')) {
            const { metadata, body } = parseSkill(content.toString());
            const fields = host === 'claude'
              ? Object.entries(metadata).filter(([key]) => key !== 'when_to_use')
              : Object.entries(metadata).filter(([key]) => ['name', 'description'].includes(key));
            const frontmatter = fields.map(([key, value]) => `${key}: ${value === 'true' || value === 'false' ? value : JSON.stringify(render(value))}`).join('\n');
            const trigger = metadata.when_to_use ? `\nWhen to use: ${metadata.when_to_use}\n` : '';
            content = `---\n${frontmatter}\n---\n${render(body + trigger)}`;
            if (host === 'codex' && metadata['disable-model-invocation'] === 'true') {
              const title = `TRACE ${metadata.name}`;
              const description = render(metadata.description).slice(0, 64).replace(/\s+\S*$/, '');
              put(`${target}/${path.posix.dirname(rel)}/agents/openai.yaml`, `interface:\n  display_name: ${JSON.stringify(title)}\n  short_description: ${JSON.stringify(description)}\npolicy:\n  allow_implicit_invocation: false\n`);
            }
          } else if (rel.endsWith('.md') || rel.endsWith('.json')) content = render(content.toString());
          put(`${target}/${rel}`, content);
        }
      }
      if (host === 'codex' && name === 'trace-full') {
        put(`${target}/README.md`, render(fs.readFileSync(path.join(source, 'trace-full', 'README.md'), 'utf8')));
      }
      if (['trace-plan', 'trace-git'].includes(name)) {
        put(`${target}/shared/authoring-rules.md`, fs.readFileSync(path.join(source, 'trace/shared/authoring-rules.md')));
      }
      put(`${target}/runtime.json`, json({ host, version: catalog.version, specCommand: skillName('trace-plan', 'spec') }));
      put(`${target}/GENERATED.md`, `Generated by scripts/generate-plugins.js from plugin-src/. Edit the source and regenerate both harnesses.\n`);
      const metadata = { ...catalog.plugins[name], version: catalog.version };
      if (host === 'codex') {
        delete metadata.dependencies;
        metadata.skills = './skills/';
        metadata.interface = {
          displayName: name === 'trace-full' ? 'TRACE — complete suite' : name,
          shortDescription: metadata.description.split('.')[0],
          longDescription: metadata.description,
          developerName: 'byBrick Tech', category: 'Productivity', capabilities: ['Read', 'Write'],
          defaultPrompt: [name === 'trace-full' || name === 'trace' ? 'Use TRACE to set up durable project context.' : name === 'trace-plan' ? 'Use TRACE to plan this change.' : 'Use TRACE to draft a commit message.'],
        };
      }
      put(`${target}/.${host}-plugin/plugin.json`, json(metadata));
    }
  }
  put('.claude-plugin/marketplace.json', json({
    name: 'trace', description: 'TRACE — durable context, planning, and delivery.', owner: { name: 'byBrick Tech' },
    plugins: names.map((name) => ({ name, source: `./${outputRoot('claude', name)}`, description: catalog.plugins[name].description })),
  }));
  put('.agents/plugins/marketplace.json', json({
    name: 'trace', interface: { displayName: 'TRACE' },
    plugins: names.map((name) => ({ name, source: { source: 'local', path: `./${outputRoot('codex', name)}` },
      policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' })),
  }));
  const release = fs.readFileSync(path.join(source, 'maintainer/release/SKILL.md'), 'utf8');
  put('.claude/skills/release/SKILL.md', release);
  const parsedRelease = parseSkill(release);
  put('.agents/skills/release/SKILL.md', `---\nname: release\ndescription: ${JSON.stringify(parsedRelease.metadata.description)}\n---\n${parsedRelease.body}`);
  put('.agents/skills/release/agents/openai.yaml', 'interface:\n  display_name: "TRACE release"\n  short_description: "Release Claude and Codex packages together"\npolicy:\n  allow_implicit_invocation: false\n');
  return { result, catalog };
}

function differences(root, result, catalog) {
  const changes = [];
  for (const [rel, expected] of result) {
    const file = path.join(root, rel);
    if (!fs.existsSync(file)) changes.push({ kind: 'missing', file: rel });
    else if (!fs.readFileSync(file).equals(expected)) changes.push({ kind: 'changed', file: rel });
  }
  for (const host of HOSTS) for (const name of Object.keys(catalog.plugins)) {
    for (const file of files(path.join(root, outputRoot(host, name)))) {
      const rel = path.relative(root, file).split(path.sep).join('/');
      if (!result.has(rel)) changes.push({ kind: 'obsolete', file: rel });
    }
  }
  return changes;
}

function main() {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--check')) throw new Error('Usage: node scripts/generate-plugins.js [--check]');
  const { result, catalog } = generate();
  const changes = differences(ROOT, result, catalog);
  if (args.includes('--check')) {
    for (const change of changes) console.error(`${change.kind}: ${change.file}`);
    if (changes.length) process.exitCode = 1;
    else console.log(`Both harness distributions match source (${result.size} files, v${catalog.version}).`);
    return;
  }
  for (const change of changes) {
    const dest = path.join(ROOT, change.file);
    if (change.kind === 'obsolete') fs.unlinkSync(dest);
    else { fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.writeFileSync(dest, result.get(change.file)); }
  }
  console.log(`Generated both harness distributions: ${changes.length} updates, v${catalog.version}.`);
}

module.exports = { ROOT, HOSTS, files, parseSkill, outputRoot, generate, differences };
if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
