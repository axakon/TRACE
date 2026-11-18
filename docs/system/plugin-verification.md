# Plugin verification

Run `node scripts/verify-plugins.js` from the repository root. This command checks generated output, manifests, local resources, JavaScript syntax, hook payloads, viewer endpoints, doc-structure copies, doctor findings, context-graph fixture parity, and changelog agreement.

The tests use Node built-ins and temporary directories. Viewer tests bind localhost ports and stop their servers after completion. CI runs the same checks on macOS without model credentials. Branch protection must require the `Verify both harnesses (macOS)` job to prevent merging failed checks.

## Live checks

Automated tests cannot establish native skill discovery, interviews, approval controls, or browser behaviour. Before a release, install the packages in a disposable project and try the skills the release changed. Use the table below to decide what to observe. Nothing records or enforces these checks.

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

Use the fixtures in `plugin-src/trace/viewer/fixtures/` for browser checks. Use copies so board edits do not modify source fixtures. Test a parent directory containing spaces.

Windows live checks are outside the current support claim.
