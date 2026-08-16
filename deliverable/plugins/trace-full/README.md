# trace-full

Everything [TRACE](../../../README.md) ships, behind one install.

No content of its own — the manifest is a `dependencies` array. Installing it brings [`trace`](../trace/), [`trace-plan`](../trace-plan/), and [`trace-git`](../trace-git/).

```
/plugin marketplace add axakon/TRACE
/plugin install trace-full@trace
/reload-plugins
```

Use this if you don't want to choose. To opt out of the planning or delivery add-ons, install the individual plugins instead — [which one do I want?](../README.md#why-youd-skip-one)

---

## Changing your mind

Uninstalling the bundle leaves the three plugins in place. To drop just one:

```
claude plugin uninstall trace-git@trace
```

To remove the bundle and everything it brought along:

```
claude plugin uninstall trace-full@trace --prune
```

`--prune` removes auto-installed dependencies nothing else needs. Plugins you installed yourself are never pruned.
