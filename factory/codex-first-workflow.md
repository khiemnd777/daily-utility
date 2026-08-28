# Codex-first workflow contract

## Responsibilities

- **Codex scheduled task:** the only automatic idea scheduler; researches, deduplicates, and creates one complete proposal issue.
- **Codex task:** the primary human review surface and control plane. It relays exact approval commands and verifies resulting GitHub state before acting.
- **GitHub issue:** the durable proposal and state ledger.
- **GitHub pull request and CI:** the code review and quality gate.
- **GitHub Actions:** deterministic validation and state recording only. Actions do not invoke an AI provider.
- **Gumroad:** one sales and buyer-delivery channel, published manually by Codex after release approval; no credentials or publishing API are stored in this repository.
- **Lemon Squeezy:** the second sales and buyer-delivery channel, published manually by Codex after release approval; no credentials, tokens, webhooks, or sales APIs are stored in this repository.
- **KNA Software catalog:** the public first-party product record on `knasoftware.com`, created through the Google-authenticated admin UI after release approval and reciprocally linked with both approved sales listings. No admin credentials, tokens, or CMS API calls are stored in this repository.

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

Each verified approval grants checkpoint-scoped standing authorization. Build approval means Codex continues without reminders through implementation, testing, packaging, a draft product pull request, CI, and the `READY_FOR_RELEASE` handoff. Release approval means Codex continues without repeated confirmation through final product-PR verification and merge, manual Gumroad and Lemon Squeezy publication of the exact approved version, publication of the exact reviewed KNA Software product page, all reciprocal-link checks, live buyer verification on both channels, creation and merge of the release-record pull request, and verification of `PUBLISHED`. The authorization ends at the next approval checkpoint, after publication, or when state, scope, artifacts, price, copy, checks, access, backlink destinations, or other reviewed release facts materially differ.

`/request-changes` is a release-review correction loop. It is valid only from `READY_FOR_RELEASE`, moves the proposal back to `BUILDING`, and does not grant build or release approval. Codex must update the product manifest to `BUILDING` before modifying product files, then rerun all required checks before returning the issue and manifest to `READY_FOR_RELEASE`.

## Build handoff

After `APPROVED_BUILD`, Codex starts the Engineering Agent in an isolated worktree and focused branch. The agent records `BUILDING`, implements only the approved scope, runs checks, validates the manifest, opens a pull request, and records `READY_FOR_RELEASE` only when all required checks pass.

The release checkpoint uses the same approval relay. After the issue reaches `APPROVED_RELEASE`, Codex autonomously verifies and merges the linked product pull request, publishes the same reviewed artifact manually through Gumroad and Lemon Squeezy, verifies each live sales page and buyer download, creates or updates the reviewed KNA Software product page as a draft, establishes and verifies all four outbound and reverse sales links, publishes the KNA page, and prepares and merges a focused release-record pull request without asking for another confirmation. The reviewed release materials must include exact Gumroad and Lemon Squeezy listing sources plus `products/<product-id>/marketing/knasoftware-listing.md` with the exact KNA SKU, slug, category/tags, page copy, metadata, media, shared price/version facts, both sales URLs, both reverse-link destinations, and support terms before approval.

The release-record pull request must add a schema-v2 `products/<product-id>/publication.json`, update the product manifest to `PUBLISHED`, pass the manifest validator, and record both sales URLs, the KNA URL, shared price, source and buyer-delivered checksums, and every reciprocal-link verification timestamp. When the pull request is merged, `release-completed.yml` verifies the checked-in channel set, price, artifact path, artifact SHA-256, and current issue state before moving the issue from `state:approved-release` to `state:published`. Live catalog and link checks remain Codex-controlled release evidence; GitHub Actions never call Gumroad, Lemon Squeezy, or KNA Software.

Use `daily-utility-knasoftware-catalog` for the KNA publication step. Keep the KNA product URL self-canonical, use distinct factual copy rather than mirroring the Gumroad description word-for-word, and verify title, description, OG image, sitemap membership, crawlability, and any available structured data or AI-readable discovery files. Missing platform support must be reported as a gap rather than represented as completed SEO work.

## Post-publish promotion

Promotion is optional work after `PUBLISHED`; it is not a factory state transition and release approval does not authorize posting. Before new research, Codex reads `factory/promotion/channels.json` and the product's promotion log when present, reuses eligible known channels after a current rule check, treats same-product `published` and `pending` entries as already used, and researches only remaining audience gaps. Before sharing externally, it must present the exact destination, account context, and final copy and receive action-time approval for the item or clearly bounded batch. Every approved attempt is recorded durably in `products/<product-id>/marketing/promotion-log.json`, and genuinely new reusable destinations are added to the shared registry; credentials, cookies, and private account data never belong there.

## Required handoff fields

Every Codex review handoff states:

- what was created or changed;
- the linked issue and, when applicable, pull request URL;
- the current factory state;
- the exact next command;
- what that command will do;
- any blocker that prevents the command from being offered.

The handoff must finish with a visibly labeled **Recommended next action**. It must recommend one primary command or instruction that is appropriate for the verified current state and state its effect; do not leave the recommendation only in a collapsed UI element or implicit in preceding prose. When blocked, finish with the concrete blocker and exact prerequisite instead of an action that cannot safely run.
