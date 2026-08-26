# Product Engineering Rules

These rules govern code and release assets under `products/`. They supplement the repository-root `AGENTS.md`.

## Architecture

- Build the smallest complete vertical slice that satisfies the approved acceptance checks. A micro-utility does not need an application framework merely to look structured.
- Keep dependency direction clear: presentation calls product use cases; use cases depend on domain logic; format, browser, filesystem, and packaging details stay at adapter boundaries.
- Keep business rules in one testable core. UI messages may explain results but must not independently reimplement validation or parsing rules.
- Prefer plain functions and small modules. Introduce a design pattern only for a concrete pressure:
  - use a pipeline for ordered parse, normalize, validate, and report stages;
  - use an adapter for external formats or runtime APIs;
  - use a strategy only when at least two algorithms are genuinely interchangeable;
  - use an explicit state machine only when transitions and invalid states matter;
  - use dependency injection at nondeterministic or environment-specific boundaries, not throughout the product.
- Avoid speculative base classes, service locators, generic repositories, and one-method wrapper layers.

## Code splitting

- Split by responsibility, runtime boundary, data ownership, or independent testability—not by line count alone.
- Keep files together while a feature is small and changes as one unit. Split when a module owns multiple reasons to change or when tests need to replace an external boundary.
- For browser utilities, separate domain/parsing logic from DOM rendering and browser/file adapters when those responsibilities exist. Keep fixtures and release packaging outside runtime source.
- Do not create circular imports, hidden global mutable state, or barrel files that obscure dependency direction.
- Keep release archives versioned and reproducible. Do not load tests, fixtures, source maps, secrets, or development-only dependencies into buyer artifacts unless intentionally required.

## Production readiness

- Define supported inputs, limits, browser/runtime expectations, and safe failure messages. Reject malformed or oversized inputs without hanging or leaking data.
- Keep local-first products local: no uploads, telemetry, remote fetches, analytics, or account requirement unless the approved proposal explicitly includes them.
- Test happy paths, malformed inputs, boundary cases, and at least one representative buyer workflow. Record observable acceptance evidence in the manifest.
- Verify the packaged artifact, not only source files. Required checks must exercise the same files the buyer receives.
- Preserve accessibility, keyboard use, readable error states, and clear recovery guidance where the product has a UI.

## Product review rules

- Flag a module that mixes parsing, business decisions, UI mutation, and packaging when those concerns cannot be tested independently.
- Flag duplicated validation, undocumented input limits, silent partial success, unsafe HTML rendering, or dependencies on network availability for an offline product.
- Flag archives that contain stale builds, unversioned filenames, development debris, or bytes that do not match recorded checksums.
