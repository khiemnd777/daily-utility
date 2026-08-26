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
- Manual Gumroad publishing uses `daily-utility-gumroad-release` only after `APPROVED_RELEASE` and an explicit publish instruction.
- Community research or posting uses `daily-utility-promotion` only after the product is `PUBLISHED`.

Do not collapse approval relay, build, publish, publication recording, and promotion into one implied authorization. Finish the active phase and present the next boundary clearly.

## Handoff

Every reviewable handoff must state:

- what was created or changed;
- issue and pull request URLs when applicable;
- the verified factory state;
- completed checks and unresolved risks;
- the exact next command or instruction;
- the effect of that instruction.

If persistence, labeling, state verification, or live publication verification fails, report the concrete blocker and do not advertise the next approval command.
