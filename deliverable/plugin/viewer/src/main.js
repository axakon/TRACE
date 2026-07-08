import { marked } from 'marked';
import mermaid from 'mermaid';

function currentTheme() {
  const forced = document.documentElement.dataset.theme;
  if (forced) return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

mermaid.initialize({ startOnLoad: false });

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

marked.use({
  gfm: true,
  renderer: {
    code({ text, lang }) {
      if (lang === 'mermaid') {
        return `<pre class="mermaid">${escapeHtml(text)}</pre>`;
      }
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      return `<pre><code${cls}>${escapeHtml(text)}</code></pre>`;
    },
  },
});

// "As a <role>, I want <capability>, so that <consequence>" — the optional
// so-clause keeps plain two-part stories working.
const STORY_RE =
  /^as (an?)\s+(.+?),\s*i\s+(?:want|need|can|would like)\s+(.+?)(?:,?\s+so(?:\s+that)?\s+(.+?))?\.?$/i;

function span(cls, text) {
  const s = document.createElement('span');
  s.className = cls;
  s.textContent = text;
  return s;
}

function upgradeUserStories(el) {
  for (const li of el.querySelectorAll('li')) {
    const match = li.textContent.trim().replace(/\s+/g, ' ').match(STORY_RE);
    if (!match) continue;
    const [, article, role, want, outcome] = match;
    li.classList.add('user-story');
    li.replaceChildren(
      span('story-role', `As ${article} ${role}`),
      span('story-want', `I want ${want}`)
    );
    if (outcome) li.append(span('story-outcome', `so that ${outcome}`));
  }
}

export async function render(markdown, el) {
  // Re-read the theme every render so a toggle mid-session re-themes diagrams.
  mermaid.initialize({ startOnLoad: false, theme: currentTheme() === 'dark' ? 'dark' : 'default' });
  el.innerHTML = marked.parse(markdown);
  upgradeUserStories(el);
  await mermaid.run({ querySelector: '.mermaid', suppressErrors: true });
  el.dispatchEvent(new CustomEvent('plan-rendered'));
}

// ---------------------------------------------------------------------------
// Inline revision marks: select text → "Mark" → the passage stays highlighted
// in the document with a comment bubble attached where you type. Marks
// accumulate; "Copy revision prompt" combines them in document order. After a
// live-reload re-render, marks re-anchor by whitespace-tolerant text match;
// a passage that no longer exists keeps its comment as an orphan in the copy.

// Find `needle` in the rendered plan, tolerant of whitespace differences,
// and return a Range over it. Skips SVG internals and existing note bubbles.
function findTextRange(root, needle) {
  const map = []; // raw char index -> { node, offset }
  let hay = '';
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) =>
      n.parentElement && n.parentElement.closest('svg, .mark-note, .draft-story')
        ? NodeFilter.FILTER_REJECT
        : NodeFilter.FILTER_ACCEPT,
  });
  while (walker.nextNode()) {
    const n = walker.currentNode;
    for (let i = 0; i < n.data.length; i++) map.push({ node: n, offset: i });
    hay += n.data;
  }

  const rawIdx = [];
  let norm = '';
  let lastWasSpace = true;
  for (let i = 0; i < hay.length; i++) {
    const c = /\s/.test(hay[i]) ? ' ' : hay[i];
    if (c === ' ' && lastWasSpace) continue;
    norm += c;
    rawIdx.push(i);
    lastWasSpace = c === ' ';
  }

  const needleNorm = needle.replace(/\s+/g, ' ').trim();
  if (!needleNorm) return null;
  const at = norm.indexOf(needleNorm);
  if (at < 0) return null;

  const start = map[rawIdx[at]];
  const end = map[rawIdx[at + needleNorm.length - 1]];
  const range = document.createRange();
  range.setStart(start.node, start.offset);
  range.setEnd(end.node, end.offset + 1);
  return range;
}

// Wrap every text-node segment inside `range` in <mark> elements — handles
// selections spanning multiple blocks, where surroundContents() throws.
function wrapRange(range, id) {
  const root =
    range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentNode
      : range.commonAncestorContainer;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (!range.intersectsNode(n)) continue;
    if (n.parentElement && n.parentElement.closest('svg, .mark-note, .draft-story')) continue;
    nodes.push(n);
  }

  const wrapped = [];
  for (let n of nodes) {
    let startOff = n === range.startContainer ? range.startOffset : 0;
    let endOff = n === range.endContainer ? range.endOffset : n.data.length;
    if (startOff >= endOff) continue;
    if (startOff > 0) {
      n = n.splitText(startOff);
      endOff -= startOff;
    }
    if (endOff < n.data.length) n.splitText(endOff);
    if (!n.data.trim()) continue;
    const m = document.createElement('mark');
    m.className = 'plan-mark';
    m.dataset.markId = id;
    n.parentNode.insertBefore(m, n);
    m.append(n);
    wrapped.push(m);
  }
  return wrapped;
}

export function initAnnotations({ contentEl, toolbarEl, slug }) {
  const marks = []; // { id, text, comment }
  let nextId = 1;

  function button(label, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function attachNote(mark, anchorEl, focus) {
    const note = document.createElement('span');
    note.className = 'mark-note';
    note.dataset.noteFor = mark.id;
    const text = span('note-text', mark.comment);
    text.contentEditable = 'true';
    text.addEventListener('input', () => {
      mark.comment = text.textContent.trim();
    });
    text.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        text.blur();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        // Nothing typed yet: cancel the whole mark. Typed: keep it, stop editing.
        if (!text.textContent.trim()) removeMark(mark.id);
        else text.blur();
      }
    });
    const del = button('✕', () => removeMark(mark.id));
    del.className = 'note-del';
    note.append(text, del);
    anchorEl.after(note);
    if (focus) text.focus();
  }

  function addMark(range, text) {
    const mark = { id: String(nextId++), text, comment: '' };
    marks.push(mark);
    const els = wrapRange(range, mark.id);
    if (els.length) attachNote(mark, els[els.length - 1], true);
    renderToolbar();
  }

  function removeMark(id) {
    for (const note of contentEl.querySelectorAll(`.mark-note[data-note-for="${id}"]`)) {
      note.remove();
    }
    for (const el of contentEl.querySelectorAll(`mark.plan-mark[data-mark-id="${id}"]`)) {
      el.replaceWith(...el.childNodes);
    }
    for (const el of contentEl.querySelectorAll(`.draft-story[data-mark-id="${id}"]`)) {
      el.remove();
    }
    const i = marks.findIndex((m) => m.id === id);
    if (i >= 0) marks.splice(i, 1);
    renderToolbar();
  }

  // --- Draft user stories: the + on the "Core user stories" heading -------

  function findStoriesHeading() {
    return [...contentEl.querySelectorAll('h1, h2, h3')].find((h) =>
      /core user stories/i.test(h.textContent)
    );
  }

  function decorateStoryHeading() {
    const heading = findStoriesHeading();
    if (!heading || heading.querySelector('.story-add')) return;
    const add = button('+', () => {
      const story = { id: String(nextId++), type: 'story', role: '', want: '', outcome: '' };
      marks.push(story);
      insertStoryCard(story, true);
      renderToolbar();
    });
    add.className = 'story-add';
    add.title = 'Add a user story';
    heading.append(add);
  }

  function storiesListEl() {
    const heading = findStoriesHeading();
    if (!heading) return null;
    let el = heading.nextElementSibling;
    while (el && el.tagName !== 'UL') {
      if (/^H[1-6]$/.test(el.tagName)) break;
      el = el.nextElementSibling;
    }
    if (el && el.tagName === 'UL') return el;
    const ul = document.createElement('ul');
    heading.after(ul);
    return ul;
  }

  function editableField(value, placeholder, onInput) {
    const f = span('draft-field', value);
    f.contentEditable = 'true';
    f.dataset.placeholder = placeholder;
    f.addEventListener('input', () => onInput(f.textContent.trim()));
    f.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        f.blur();
      }
    });
    return f;
  }

  function insertStoryCard(story, focus) {
    const list = storiesListEl();
    if (!list) return;
    const li = document.createElement('li');
    li.className = 'user-story draft-story';
    li.dataset.markId = story.id;
    const role = span('story-role', 'As a ');
    const roleField = editableField(story.role, 'role', (v) => (story.role = v));
    role.append(roleField);
    const want = span('story-want', 'I want ');
    want.append(editableField(story.want, 'capability', (v) => (story.want = v)));
    const outcome = span('story-outcome', 'so that ');
    outcome.append(editableField(story.outcome, 'outcome', (v) => (story.outcome = v)));
    const del = button('✕', () => removeMark(story.id));
    del.className = 'note-del';
    li.append(role, del, want, outcome);
    li.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const empty = [...li.querySelectorAll('.draft-field')].every((f) => !f.textContent.trim());
      if (empty) removeMark(story.id);
    });
    list.append(li);
    if (focus) roleField.focus();
  }

  function reapplyAll() {
    decorateStoryHeading();
    for (const m of marks) {
      if (m.type === 'story') {
        insertStoryCard(m, false);
        continue;
      }
      const range = findTextRange(contentEl, m.text);
      if (!range) continue;
      const els = wrapRange(range, m.id);
      if (els.length) attachNote(m, els[els.length - 1], false);
    }
    renderToolbar();
  }
  contentEl.addEventListener('plan-rendered', reapplyAll);

  // Selecting text in the plan immediately becomes a comment: the passage is
  // highlighted and the attached bubble gets focus. ✕ on the bubble undoes it.
  document.addEventListener('mouseup', (e) => {
    if (e.target.closest && e.target.closest('.mark-note, .draft-story, .story-add')) return;
    const sel = window.getSelection();
    const text = sel ? sel.toString().trim() : '';
    if (!text || !sel.anchorNode || !contentEl.contains(sel.anchorNode)) return;
    const range = sel.getRangeAt(0).cloneRange();
    sel.removeAllRanges();
    addMark(range, text);
  });

  // Marks in document order; orphans (passage gone after a revision) last.
  function orderedMarks() {
    const seen = [];
    for (const el of contentEl.querySelectorAll('mark.plan-mark, .draft-story')) {
      if (!seen.includes(el.dataset.markId)) seen.push(el.dataset.markId);
    }
    const anchored = seen.map((id) => marks.find((m) => m.id === id)).filter(Boolean);
    const orphans = marks.filter((m) => !seen.includes(m.id));
    return [...anchored, ...orphans];
  }

  function buildPrompt() {
    const h1 = contentEl.querySelector('h1');
    const title = h1 ? h1.textContent.trim() : slug;
    const parts = [`Revise the plan "${title}". Requested changes:`];
    orderedMarks().forEach((m, i) => {
      if (m.type === 'story') {
        const story = `As a ${m.role || '<role>'}, I want ${m.want || '<capability>'}, so that ${m.outcome || '<outcome>'}.`;
        parts.push(`${i + 1}. Add this core user story:\n> ${story}`);
        return;
      }
      const quoted = m.text.split('\n').map((l) => `> ${l}`).join('\n');
      parts.push(`${i + 1}. Regarding:\n${quoted}${m.comment ? `\n\nChange: ${m.comment}` : ''}`);
    });
    return parts.join('\n\n');
  }

  function renderToolbar() {
    toolbarEl.replaceChildren();
    if (!marks.length) return;

    const count = span('rev-count', `${marks.length} change${marks.length === 1 ? '' : 's'}`);

    const copy = document.createElement('a');
    copy.href = '#';
    copy.textContent = 'Copy revision prompt';
    copy.addEventListener('click', async (e) => {
      e.preventDefault();
      const prompt = buildPrompt();
      window.__lastRevisionPrompt = prompt;
      let ok = false;
      try {
        await navigator.clipboard.writeText(prompt);
        ok = true;
      } catch {
        const ta = document.createElement('textarea');
        ta.value = prompt;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.append(ta);
        ta.select();
        try {
          ok = document.execCommand('copy');
        } catch {}
        ta.remove();
      }
      window.__lastCopyOk = ok;
      copy.textContent = ok ? 'copied ✓' : 'copy failed — see console';
      if (!ok) console.log(prompt);
      setTimeout(() => (copy.textContent = 'Copy revision prompt'), 1500);
    });

    const clear = document.createElement('a');
    clear.href = '#';
    clear.textContent = 'clear';
    clear.addEventListener('click', (e) => {
      e.preventDefault();
      for (const m of [...marks]) removeMark(m.id);
    });

    toolbarEl.append(' · ', count, ' · ', copy, ' · ', clear);
  }
}
