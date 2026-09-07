#!/usr/bin/env node
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { ROOT, HOSTS, files, outputRoot, parseSkill } = require('./generate-plugins');

function validate(root = ROOT) {
  const errors = [];
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'plugin-src/catalog.json'), 'utf8'));
  const fail = (file, message) => errors.push(`${path.relative(root, file)}: ${message}`);
  for (const host of HOSTS) for (const name of Object.keys(catalog.plugins)) {
    const base = path.join(root, outputRoot(host, name));
    const manifestPath = path.join(base, `.${host}-plugin/plugin.json`);
    let manifest;
    try { manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')); }
    catch (error) { fail(manifestPath, error.message); continue; }
    if (manifest.name !== name || manifest.version !== catalog.version) fail(manifestPath, 'Name/version differs from source catalog');
    if (host === 'codex' && manifest.dependencies) fail(manifestPath, 'Claude plugin dependencies are not supported in native Codex manifests');
    const expectedSkills = name === 'trace-full' ? (host === 'codex' ? 10 : 0) : name === 'trace' ? 6 : 2;
    const packageFiles = files(base);
    if (packageFiles.filter((f) => f.endsWith(`${path.sep}SKILL.md`)).length !== expectedSkills) fail(base, 'Wrong skill inventory');
    const contained = (from, relative) => {
      const target = path.resolve(path.dirname(from), relative);
      if (target !== base && !target.startsWith(base + path.sep)) { fail(from, `Reference escapes plugin: ${relative}`); return; }
      if (!fs.existsSync(target)) fail(from, `Missing resource: ${relative}`);
    };
    for (const file of packageFiles) {
      if (file.endsWith('.json')) {
        try { JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { fail(file, error.message); }
      }
      if (file.endsWith('SKILL.md')) {
        try {
          const { metadata } = parseSkill(fs.readFileSync(file, 'utf8'));
          if (!metadata.name || !metadata.description) fail(file, 'Missing name or description');
          if (host === 'codex' && Object.keys(metadata).some((key) => !['name', 'description'].includes(key))) fail(file, 'Host-specific Claude frontmatter in Codex skill');
        } catch (error) { fail(file, error.message); }
      }
      if (file.endsWith('.md') && file.includes(`${path.sep}skills${path.sep}`)) {
        const text = fs.readFileSync(file, 'utf8');
        if (/\{\{(?:skill:|[\w-]+\}\})/.test(text)) fail(file, 'Unexpanded adapter field');
        for (const match of text.matchAll(/\[[^\]\n]+\]\(([^)\s]+)\)/g)) {
          const link = match[1].split('#')[0];
          if (!link || /^(?:[a-z]+:|\/|<)/i.test(link) || /[<>{}]/.test(link)) continue;
          contained(file, link);
        }
      }
      if (file.endsWith('.js') && file.includes(`${path.sep}scripts${path.sep}`)) {
        const text = fs.readFileSync(file, 'utf8');
        for (const match of text.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)) {
          const ref = match[1];
          contained(file, path.extname(ref) ? ref : `${ref}.js`);
        }
      }
    }
    const hooksFile = path.join(base, 'hooks/hooks.json');
    if (fs.existsSync(hooksFile)) {
      const hooks = JSON.parse(fs.readFileSync(hooksFile, 'utf8')).hooks;
      const registered = new Set();
      for (const [event, groups] of Object.entries(hooks)) for (const group of groups) for (const hook of group.hooks) {
        const key = `${event}:${hook.command}`;
        if (registered.has(key)) fail(hooksFile, 'Duplicate hook registration');
        registered.add(key);
        if (hook.type !== 'command') fail(hooksFile, 'Unsupported hook type');
        for (const match of hook.command.matchAll(/\$\{(?:CLAUDE_PLUGIN_ROOT|PLUGIN_ROOT)\}\/([^"\s]+)/g)) contained(path.join(base, '_root'), match[1]);
      }
      if (!['trace', 'trace-full'].includes(name) && registered.size) fail(hooksFile, 'Only core registers ambient hooks');
    }
    if (['trace-plan', 'trace-full'].includes(name) && !(host === 'claude' && name === 'trace-full')) {
      if (!fs.existsSync(path.join(base, 'viewer/dist/viewer.bundle.js'))) fail(base, 'Viewer bundle missing');
    }
  }
  for (const host of HOSTS) {
    const file = path.join(root, host === 'claude' ? '.claude-plugin/marketplace.json' : '.agents/plugins/marketplace.json');
    try {
      const market = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (market.plugins.length !== Object.keys(catalog.plugins).length) fail(file, 'Marketplace inventory differs');
      for (const entry of market.plugins) {
        const source = host === 'claude' ? entry.source : entry.source.path;
        if (source !== `./${outputRoot(host, entry.name)}`) fail(file, `Wrong source for ${entry.name}`);
        if (host === 'codex' && (!entry.policy?.installation || !entry.policy?.authentication || !entry.category)) fail(file, 'Missing marketplace policy');
      }
    } catch (error) { fail(file, error.message); }
  }
  return errors;
}
module.exports = { validate };
if (require.main === module) {
  const errors = validate();
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('Both harness package inventories, resources, manifests, and hooks are valid.');
}
