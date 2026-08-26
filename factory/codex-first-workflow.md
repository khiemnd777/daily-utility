# Codex-first workflow contract

## Responsibilities

- **Codex scheduled task:** the only automatic idea scheduler; researches, deduplicates, and creates one complete proposal issue.
- **Codex task:** the primary human review surface and control plane. It relays exact approval commands and verifies resulting GitHub state before acting.
- **GitHub issue:** the durable proposal and state ledger.
- **GitHub pull request and CI:** the code review and quality gate.
- **GitHub Actions:** deterministic validation and state recording only. Actions do not invoke an AI provider.
- **Gumroad:** published manually by Codex after release approval; no credentials or publishing API are stored in this repository.

## Idea run

1. Read `AGENTS.md`, the state machine, Idea Agent contract, templates, products, proposal issues, and Git history.
2. Select exactly one unique, self-contained utility.
3. Create and verify one complete GitHub proposal issue in `READY_FOR_BUILD`.
4. Return the proposal, issue URL, current state, exact next command, and expected effect in Codex.
5. Stop. No build begins at this checkpoint.

An idea run that cannot create and verify the issue is failed. It must not show `/approve` and must not leave an orphaned proposal in chat.

## Approval relay

1. A trusted reviewer enters the exact `/approve`, `/reject`, or `/request-changes` command in the linked Codex task.
2. Codex relays that exact command as a comment on the linked GitHub issue.
3. `approval-gate.yml` authenticates the actor and updates the issue's single state label.
4. Codex re-reads the issue and continues only after the expected state is visible.

Direct issue comments remain a fallback. If a reviewer uses the fallback, Codex must still re-read the issue before acting.

`/request-changes` is a release-review correction loop. It is valid only from `READY_FOR_RELEASE`, moves the proposal back to `BUILDING`, and does not grant build or release approval. Codex must update the product manifest to `BUILDING` before modifying product files, then rerun all required checks before returning the issue and manifest to `READY_FOR_RELEASE`.

## Build handoff

After `APPROVED_BUILD`, Codex starts the Engineering Agent in an isolated worktree and focused branch. The agent records `BUILDING`, implements only the approved scope, runs checks, validates the manifest, opens a pull request, and records `READY_FOR_RELEASE` only when all required checks pass.

The release checkpoint uses the same approval relay. After the issue reaches `APPROVED_RELEASE`, Codex may publish manually through Gumroad, verify the live product page and download, and prepare a focused release-record pull request. That pull request must add `products/<product-id>/publication.json`, update the product manifest to `PUBLISHED`, and pass the manifest validator. When the pull request is merged, `release-completed.yml` verifies the checked-in URL, price, artifact path, artifact SHA-256, and current issue state before moving the issue from `state:approved-release` to `state:published`. The workflow records the release in GitHub only; it never calls Gumroad.

## Required handoff fields

Every Codex review handoff states:

- what was created or changed;
- the linked issue and, when applicable, pull request URL;
- the current factory state;
- the exact next command;
- what that command will do;
- any blocker that prevents the command from being offered.
