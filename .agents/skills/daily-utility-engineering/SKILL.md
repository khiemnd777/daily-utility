---
name: daily-utility-engineering
description: Implement, harden, or review product code under products/, including architecture, design-pattern choices, code splitting, tests, and release packaging; do not use for idea-only, sales-channel publishing, or promotion work.
---

# Daily Utility Engineering

## Entry

Read `AGENTS.md`, `products/AGENTS.md`, the approved proposal, the product manifest schema, and the current product tree. For a new build, verify `APPROVED_BUILD` before starting and record `BUILDING` through the approved state transition. For an already published product, preserve released bytes and treat fixes as a new version pending a separate release decision.

## Shape the implementation

- Start with the narrow buyer workflow and acceptance checks, then build one complete vertical slice.
- Keep domain and parsing decisions independent from UI, browser, filesystem, and packaging adapters when those boundaries exist.
- Prefer plain modules. Add a pipeline, adapter, strategy, state machine, or injected boundary only when the concrete problem matches the rule in `products/AGENTS.md`.
- Split code when responsibilities, runtimes, data ownership, or test boundaries diverge. Do not split a tiny cohesive feature merely to satisfy a folder pattern.
- Keep reusable factory changes outside the product branch unless they are necessary for the approved product and reviewed separately in the diff.

## Prove buyer readiness

Test the actual delivered workflow, including representative success, malformed input, boundary limits, and safe recovery. Confirm offline/privacy behavior, supported runtime expectations, accessibility where relevant, and deterministic packaging.

Update the manifest only with observed results. Required checks remain `pending` or `failed` until the packaged artifact passes them. Run the product tests, inspect the release archive contents, verify checksums when present, then run `python3 factory/scripts/validate_manifest.py`.

Before `READY_FOR_RELEASE`, ensure the reviewed artifacts include separate Gumroad and Lemon Squeezy listing sources plus a KNA catalog source with both purchase anchors and both reverse-link anchors. Stop at `READY_FOR_RELEASE`. Return the PR, linked issue, check evidence, remaining risks, and exact release-review commands. Do not publish or infer release approval.
