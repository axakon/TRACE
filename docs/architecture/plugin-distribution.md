# Plugin distribution

TRACE MUST generate Claude Code and Codex packages from one authored source tree. Each release MUST contain both distributions at one version. See [ADR 0010](../adr/0010-shared-source-for-two-harnesses.md).

## Source and packages

`plugin-src/` owns skill text, templates, scripts, viewer source, harness adapters, and release metadata. `scripts/generate-plugins.js` assembles complete packages and catalogs. Generated files MUST be committed with their source changes.

Claude packages remain under `deliverable/plugins/`. Codex packages live under `plugins/`. Each package MUST contain its referenced resources. Runtime references MUST NOT traverse into another installed plugin.

Shared workflows MUST have one source. Adapters MUST hold harness-specific controls and substitution rules. Codex skill metadata MUST preserve explicit-only invocation where the Claude skill already requires it.

## Workflow behaviour

Each harness MUST support the same workflow outcomes and approval points. Native controls can differ. TRACE MUST respect the active mode and permissions. A skill instruction MUST NOT claim to switch a host mode that it cannot control.

Planning skills MUST open previews explicitly. They MUST present the same plan for approval and implementation. Viewer success MUST NOT count as developer approval. See [ADR 0011](../adr/0011-explicit-review-with-native-controls.md).

Existing configuration and epic formats remain compatible. This change does not require session transfer or a storage migration.

## Release contract

CI MUST validate generation, package resources, hook payloads, and viewer behaviour on macOS. CI MUST reject missing, stale, or obsolete generated files. CI MUST NOT commit fixes or open release PRs.

Release preflight MUST validate both distributions before publication. The source catalog owns the version. Both distributions use the same changelog and release tag.

Windows validation is outside the current support claim. Runtime scripts SHOULD retain portable Node APIs.
