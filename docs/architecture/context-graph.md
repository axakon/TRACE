# Context graph

The context graph measures how much instruction context an agent carries at each directory of a project. This file is the contract for every implementation of it. The Node script `plugin-src/trace/scripts/context-graph.js` is the reference implementation. Any other implementation MUST produce the same JSON for the same tree. See [ADR 0012](../adr/0012-context-graph-contract-shared-by-implementations.md).

## Fixture

- `scripts/tests/fixtures/context-graph/` is the reference tree and `scripts/tests/fixtures/context-graph.expected.json` is its expected output with the `root` field removed.
- Every implementation MUST reproduce the expected output on that tree byte for byte after JSON normalisation. The Node test `scripts/tests/context-graph.test.js` enforces this.
- The expected file MUST change only together with a change to this contract. A behaviour change without a contract change is a bug.

## Nodes

- A node is a directory under the root that holds at least one instruction file: `AGENTS.md`, `CLAUDE.md`, or `CLAUDE.local.md`.
- The walk MUST skip the folders in `SKIP_DIRS` of `trace-lib.js` (`.git`, `node_modules`, `vendor`, `dist`, `build`, `out`, `target`, `.next`, `.nuxt`, `coverage`, `__pycache__`, `.venv`, `venv`) and every directory whose name starts with a dot.
- Nodes MUST be ordered by path, so every ancestor precedes its descendants.
- `parent` is the nearest ancestor node, or `null` for the root node. `depth` is the number of path segments below the root.
- `kind` is `marker` when the `AGENTS.md` first heading is `# Durable project context`, `scope` when an `AGENTS.md` exists with any other heading, and `claude-only` when no `AGENTS.md` exists.

## Measurement

- Token count is `ceil(characters / 4)` of the file text after HTML comments are removed. Source: Claude Code strips block HTML comments before injecting a memory file.
- HTML comments MUST NOT be removed inside a fenced code block. A fence is a line that starts with three backticks after optional whitespace.
- `words` is the count of whitespace-separated runs. `lines` is the count of newline-separated lines.
- `sections` splits on level-two headings (`## `). A section's text MUST include its heading line, so the sections of a file add up to the file within rounding. Text before the first heading is the `preamble` section and MUST be omitted when blank.
- `gotcha_tokens` is the sum of sections of the node's `AGENTS.md` whose heading contains `gotcha`, case-insensitive.

## Imports

- A bare `@path` is an import. It MUST be found outside inline code spans and fenced blocks only. Source: Claude Code import rules.
- The character before `@` MUST NOT be a word character, a backtick, `@`, or `/`. This excludes e-mail addresses and handles.
- A reference is a path candidate when it starts with `./`, `../`, `~/`, or `/`, or when its last segment has an extension. A reference without either MUST count only when the file exists, and MUST be dropped silently otherwise.
- Trailing `.`, `,`, `;`, `:`, `!`, `?`, `)`, and `]` MUST be trimmed from a reference.
- A relative reference resolves against the directory of the file that holds it. `~/` resolves to the home directory. `/` resolves to the filesystem root.
- Imports are followed from each of the node's own instruction files, which are hop 0, up to hop 4. A file already counted for the node MUST NOT be counted again. A cycle MUST terminate.
- A target outside the root MUST be listed under `external_imports` and MUST NOT be read or counted.
- A path candidate that does not exist or is a directory MUST be listed under `unresolved_imports`.
- `unresolved_imports` and `external_imports` MUST list each `from` and `ref` pair once, even when several nodes reach the same file.

## Pointers

- A backticked `@path` and a relative markdown link are pointers. They MUST NOT add to any weight.
- Pointers are read from each node's own instruction files only, not from the files those import.
- Links with a URL scheme and links to anchors MUST be ignored. The fragment after `#` MUST be dropped before resolving.
- A backticked `@path` resolves like an import. A link resolves against the directory of the file that holds it. A link that starts with `/` resolves against the root, the way GitHub renders it.
- A pointer that is not a path candidate, as defined under Imports, and does not exist MUST be dropped silently.
- Every other pointer MUST appear in `pointers` with `from`, `ref`, `target` (root-relative, or `null` when outside the root), and `exists`. Pointers whose target does not exist MUST also appear in `broken_pointers`.

## Weights

- `own_tokens` is the sum of the node's instruction files plus its resolved imports.
- `chain_tokens` is `own_tokens` plus the `chain_tokens` of the parent node. Files shared between nodes are counted once per node.
- `docs` is set for `scope` nodes only. The docs folder resolves by `docs-folder-resolution.md`: configured `docs_folder`, then a single marked folder, then `docs/`. When the folder exists, `docs` holds its root-relative `path`, the count of markdown `files` under it after the same skip rules, and their summed `tokens`. Otherwise `docs` is `null`.

## Output

- The JSON document has `schema_version` (integer, currently 1), `root` (absolute path), `token_estimate` (text), `nodes`, `totals`, `pointers`, `broken_pointers`, `unresolved_imports`, and `external_imports`.
- Each node has `path` (`.` for the root), `depth`, `parent`, `kind`, `files`, `imports`, `own_tokens`, `chain_tokens`, `gotcha_tokens`, and `docs`.
- Each file has `path`, `tokens`, `words`, `lines`, `marker`, and `sections`. Each import has `path`, `tokens`, `hop`, and `from`.
- `totals` has `nodes`, `scopes`, `markers`, `instruction_tokens`, `gotcha_tokens`, `docs_tokens`, and `heaviest_chain` (`path` and `tokens`, or `null`). `heaviest_chain` is the node with the largest `chain_tokens` among nodes that are not `marker`. The first in path order wins a tie.
- The reference script also renders a terminal tree (`--format tree`). Rendering is not part of the contract. The tree SHOULD hide marker nodes by default because they are template copies.
- Exit code 1 is reserved for caller errors. Findings are data and MUST NOT change the exit code.

## Known simplifications

- Hops are counted from every own file at hop 0. Claude Code starts at `CLAUDE.md` and reaches `AGENTS.md` through the forwarder at hop 1, so a file exactly four hops from `AGENTS.md` is counted here and not loaded there.
- `.claude/rules/` files are not counted.
- Counting is per node. Claude Code may deduplicate a file imported at two levels of the chain.
