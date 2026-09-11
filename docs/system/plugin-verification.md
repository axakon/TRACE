# Plugin verification

Run `node scripts/verify-plugins.js` from the repository root. This command checks generated output, manifests, local resources, JavaScript syntax, hook payloads, viewer endpoints, doc-structure copies, doctor findings, context-graph fixture parity, and changelog agreement.

The tests use Node built-ins and temporary directories. Viewer tests bind localhost ports and stop their servers after completion. CI runs the same checks on macOS without model credentials. Branch protection must require the `Verify both harnesses (macOS)` job to prevent merging failed checks.

## Live checks

Automated tests cannot establish native skill discovery, interviews, approval controls, or browser behaviour. Use fresh installed packages in disposable projects for each client: Claude Code, Codex CLI, and Codex desktop.

Record the client version and actual commands or observations. Do not replace unverified behaviour with a passing script-test result.

| Check | Observe |
|---|---|
| install | Fresh individual and full-suite installs expose the expected skills and required resources |
| init | Select a docs folder; confirm canonical files and persisted config |
| agents-md-setup | Review and approve AGENTS.md; confirm its CLAUDE.md forwarder |
| scaffold-docs | Select useful docs; confirm only approved files are written |
| adr | Review and approve a qualifying decision; confirm numbering and template |
| distil | Review a real change; approve a candidate; confirm the sentinel clears |
| doctor | Diagnose a deliberate fixture violation and verify the approved repair |
| spec | Interview, preview, approve, implement, and verify a small feature |
| epic | Preview and approve an epic, then manage its tickets |
| commit-message | Draft a message from a fixture diff without committing |
| pr-description | Draft a description from a fixture diff without publishing |
| spec-revise-reject-approve | Revise a plan, reject it, and confirm no implementation; then approve and observe implementation |
| epic-preview-board-seed | Revise a preview, confirm final files remain unchanged, approve, update the board, and inspect the native spec seed |
| hooks | Observe startup context, code-edit sentinel, docs-only filtering, reminder, and clear in the live host |

Use the fixtures in `plugin-src/trace-plan/viewer/fixtures/` for browser checks. Use copies so board edits do not modify source fixtures. Test a parent directory containing spaces.

## Evidence and release gate

`verification/live-smoke.json` records live results. Its `clients` object uses `claude-code`, `codex-cli`, and `codex-desktop` keys. Each client record includes `version`, `packageHash`, and `checks`. Each check contains `status` and a concrete `evidence` string.

Get the current package hash with `node scripts/verify-plugins.js --hash`. Use `met` only after observing the behaviour. Use `unverified` when a required environment or interaction is unavailable.

`node scripts/verify-plugins.js --release` requires every listed check to be met for the current packages. It also checks the release version and date. Recording a gap does not waive the gate.

Windows live checks are excluded from this change. Keep that limitation explicit in release claims.
