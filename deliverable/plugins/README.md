# The TRACE plugins

Four plugins, one marketplace. Take the whole thing, or just the part you want.

| Plugin | What you get | Skills |
|---|---|---|
| **[`trace`](trace/)** | The core. Where durable context lives, how it's written, how it stays current. | `init`, `agents-md-setup`, `scaffold-docs`, `adr`, `distil`, `doctor` |
| **[`trace-plan`](trace-plan/)** | Planning. Plan mode with acceptance criteria, multi-phase epics, a browser viewer. | `spec`, `epic` |
| **[`trace-git`](trace-git/)** | Delivery. Commit messages and PR descriptions in a predictable shape. | `commit-message`, `pr-description` |
| **[`trace-full`](trace-full/)** | All three, one install. No content of its own. | — |

---

## Installing

Everything:

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Or pick and choose:

```
/plugin install trace@trace          # docs core only
/plugin install trace-git@trace      # core + commit/PR skills, no planning
```

Both add-ons depend on `trace`, so either one brings the core with it. The core depends on nothing.

---

## Why you'd skip one

Every installed skill's description sits in your context window for the entire session, whether or not you use it.

| | Skill descriptions | Also ships |
|---|---|---|
| `trace` | ~380 words | — |
| `trace-plan` | ~270 words | A Node server and a 3.5 MB browser bundle |
| `trace-git` | ~380 words | Nothing — pure markdown |

A core-only install is the lightest thing TRACE offers: no viewer, no bundle, and roughly 650 fewer words in every session.

Changing your mind is cheap — `claude plugin install trace-plan@trace` adds one, `claude plugin uninstall trace-git@trace` drops one. Disabling `trace` while an add-on is installed is refused, and the error tells you what depends on it.

---

## Versioning

All four share one version and ship together, even when only one changed. One version number means one thing across the suite.

Releases are tagged `v<version>` for the repo plus `<plugin>--v<version>` for each plugin — the per-plugin tags are what Claude Code resolves dependency constraints against.

The changelog for all four lives at [the repo root](../../CHANGELOG.md).

---

## Working on the plugins

Start with [`AGENTS.md`](AGENTS.md) — layout, the release loop, and the constraints that shaped the split (chiefly: a plugin can't read files outside its own directory, which is why add-ons delegate to core skills rather than reading core files).
