If a `context7` MCP tool is available in this session, use it to fetch current documentation before writing code that calls into a library or framework's public API.

This applies when:
- Adding or modifying a call to a third-party library, framework, SDK, CLI, or cloud service
- Configuring a tool whose options change between versions
- Migrating code between major versions of a dependency

Look up the specific symbols, options, or commands you're about to use. Prefer the documentation result over your training-data recollection — the docs reflect what's current, your training does not.

Skip the lookup for:
- Standard-library APIs in mature languages
- Project-internal modules
- Code where you're only reading or refactoring without changing API usage

If `context7` is not available in this session, ignore this instruction.
