# Distillation criteria

Use this checklist to decide whether a change has produced anything worth capturing in the project's permanent context (CLAUDE.md or the scope's durable-context folder, typically `docs/`).

A change is worth distilling if it introduces or modifies any of the following:

1. **A new convention.** A pattern that future similar work should follow — e.g. "rate limits go through the `RateLimiter` middleware, not custom per-route logic." If a developer doing a similar task next month would benefit from knowing this, it's distillable.

2. **A security or trust boundary.** Where untrusted input is validated, where authentication is enforced, what's allowed to bypass authorization. Changes to these need to outlive the change itself.

3. **A durable design choice.** A decision that constrains how future work fits in — choice of state management, message bus, caching strategy, event schema. Not the *implementation*, but the *choice*.

4. **A non-obvious gotcha.** Something that would surprise a developer who didn't make the change. Configuration values that look arbitrary but aren't, implicit ordering requirements, version-specific quirks, integration points that fail silently.

5. **A correction to existing context.** If the change makes anything in CLAUDE.md or the context files outdated or wrong, the context needs updating regardless of whether the change itself is "interesting."

A change is **not** worth distilling if:

- It's purely additive within an established pattern (adding another endpoint that follows the existing route structure)
- It's a typo, dependency bump, formatting fix, or cosmetic tweak with no behavioural impact
- The information is already discoverable from standard project files without specific guidance
- It's a rollback or revert — the previous state is what's documented

When in doubt, ask: *would a developer working on something related six months from now be glad someone wrote this down?* If yes, distill. If no, skip.
