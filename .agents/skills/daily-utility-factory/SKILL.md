---
name: daily-utility-factory
description: Coordinate Daily Utility idea, build, release, and promotion work when a request spans lifecycle phases or needs the next approval-gated handoff; do not use for a single isolated code edit.
---

# Daily Utility Factory

Use the repository state machine as the lifecycle authority and GitHub proposal issues as the state ledger.

## Start

1. Read `AGENTS.md`, `factory/state-machine.json`, `factory/codex-first-workflow.md`, and the linked proposal issue.
2. Determine exactly one active phase: idea, build, release review, publish, publication recording, or promotion.
3. Reconcile the issue state label, product manifest state, and requested action. Stop on disagreement instead of guessing which state is newer.
4. Inspect the relevant product, open pull requests, Git history, and worktrees before choosing the next action.

## Route the work

- Idea research follows `factory/prompts/idea-agent.md` and stops after a verified `READY_FOR_BUILD` issue.
- Product implementation or hardening uses `daily-utility-engineering` and `daily-utility-git-delivery`.
- Manual Gumroad publishing uses `daily-utility-gumroad-release` only after `APPROVED_RELEASE`; the verified release `/approve` is the explicit publish instruction for the reviewed version and release sequence.
- Manual Lemon Squeezy publishing uses `daily-utility-lemonsqueezy-release` under `APPROVED_RELEASE` for simultaneous releases or `APPROVED_REMAINING_CHANNELS` for an explicitly reviewed Gumroad-first release.
- An unpublished Lemon Squeezy Live draft may be prepared from `GUMROAD_PUBLISHED` under that skill. Prefer `exact-url` review when the draft exposes the reusable URL. Use the constrained `publish-bootstrap` review mode only when the platform demonstrably withholds that URL until publication; it must lock the exact draft identifier, expected storefront host and `/checkout/buy/` shape, and every other release and KNA fact before the second approval. Neither mode permits publication before that approval.
- First-party catalog publication and reciprocal sales-channel linking use `daily-utility-knasoftware-catalog` after `APPROVED_RELEASE`, after `APPROVED_REMAINING_CHANNELS` for a staged update, or under an explicitly approved backfill for an already `PUBLISHED` product.
- Community research or posting uses `daily-utility-promotion` only after the product is `PUBLISHED`.

Do not collapse approval relay, build, publish, publication recording, and promotion into one implied authorization. Finish the active phase and present the next boundary clearly.

After a verified approval, continue autonomously through the actions authorized by that checkpoint without asking for reminders or repeated confirmation. Build approval runs through implementation, checks, a draft product pull request, CI, and the `READY_FOR_RELEASE` handoff. Simultaneous release approval runs through both sales channels, KNA publication, final evidence, and `PUBLISHED`. Gumroad-first release approval runs only through Gumroad, the first-stage KNA page, partial schema-v3 evidence, and `GUMROAD_PUBLISHED`; a second exact approval from `READY_FOR_REMAINING_CHANNELS` is required for Lemon Squeezy, the KNA update, and final `PUBLISHED` evidence. Stop at either next checkpoint or when reviewed facts change materially.

After `PUBLISHED`, automatically research promotion targets and prepare tailored drafts. Do not publish promotion content until the exact destination, account context, and final copy receive action-time approval.

## Handoff

Every reviewable handoff must state:

- what was created or changed;
- issue and pull request URLs when applicable;
- the verified factory state;
- completed checks and unresolved risks;
- the exact next command or instruction;
- the effect of that instruction.

If persistence, labeling, state verification, or live publication verification fails, report the concrete blocker and do not advertise the next approval command.
