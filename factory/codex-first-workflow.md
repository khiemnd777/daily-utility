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

Each verified approval grants checkpoint-scoped standing authorization. Build approval means Codex continues without reminders through implementation, testing, packaging, a draft product pull request, CI, and the `READY_FOR_RELEASE` handoff. Release approval follows the reviewed `distribution.release_sequence`: `simultaneous` continues through both sales channels, KNA publication, final evidence, and `PUBLISHED`; `gumroad-first` publishes and verifies Gumroad plus the KNA page, records schema-v3 partial evidence, and stops at `GUMROAD_PUBLISHED`. For the remaining channel, `remaining_channels_ready` records either `exact-url` review or the constrained `publish-bootstrap` review used when the seller platform withholds the URL until publication. A fresh `/approve` authorizes only that reviewed mode, exact draft and artifact, bounded destination, KNA update, final evidence, and completion through `PUBLISHED`. The authorization ends at the next approval checkpoint, after publication, or when state, scope, artifacts, price, copy, checks, access, backlink destinations, or other reviewed release facts materially differ.

`/request-changes` is a release-review correction loop. From `READY_FOR_RELEASE` it moves the proposal back to `BUILDING`; Codex must update the product manifest before modifying product files, then rerun all required checks. From `READY_FOR_REMAINING_CHANNELS` it returns to `GUMROAD_PUBLISHED`, preserving the immutable live Gumroad stage while the remaining-channel materials are corrected. Neither transition grants build or release approval.

## Build handoff

After `APPROVED_BUILD`, Codex starts the Engineering Agent in an isolated worktree and focused branch. The agent records `BUILDING`, implements only the approved scope, runs checks, validates the manifest, opens a pull request, and records `READY_FOR_RELEASE` only when all required checks pass. A simultaneous release needs both exact sales URLs before this transition. A Gumroad-first release may keep the Lemon Squeezy URL pending when the store is unavailable, but the manifest must explicitly set `release_sequence` to `gumroad-first`, the first-stage Gumroad and KNA fields must be exact, the Lemon Squeezy copy/price/artifact must already be reviewable, and no placeholder Lemon Squeezy link may be exposed publicly.

The release checkpoint uses the same approval relay. After the issue reaches `APPROVED_RELEASE`, Codex autonomously verifies and merges the linked product pull request and follows the reviewed release sequence. In a simultaneous release it publishes the same reviewed artifact through Gumroad and Lemon Squeezy, verifies both buyer paths, publishes the reviewed KNA page with both purchase links, and completes the final release record. In a Gumroad-first release it publishes and verifies only Gumroad, publishes the reviewed KNA page with the Gumroad purchase link and a truthful Lemon Squeezy-pending statement, verifies the Gumroad reciprocal-link pair, and merges a partial release-record pull request that moves the manifest and issue to `GUMROAD_PUBLISHED`. It does not publish Lemon Squeezy or expose a placeholder link under the first approval.

When Lemon Squeezy becomes available for a staged release, Codex first prepares and verifies an unpublished Live draft. Use `exact-url` mode when the draft exposes its reusable `/checkout/buy/` URL: add that exact URL to the reviewed Lemon Squeezy and KNA sources, run all required checks, and record `remaining_channels_ready`. Use `publish-bootstrap` only when the visible dashboard and current platform documentation establish that Share is unavailable until publication. That review must lock the exact seller-side Live draft identifier, store and expected checkout host, required `/checkout/buy/` shape, product name, one-time USD price, tax category, artifact filename/bytes/SHA-256, listing copy, media order, support/refund terms, KNA backlink, KNA purchase anchor and all other KNA fields; it may leave only the platform-generated checkout URL unresolved. The public KNA page remains unchanged with truthful pending copy and no placeholder link.

After either mode passes checks, Codex records `remaining_channels_ready` by moving the manifest and issue to `READY_FOR_REMAINING_CHANNELS`. `/approve` authorizes the exact remaining-channel materials. In `exact-url` mode it follows the existing reviewed URL. In `publish-bootstrap` mode it publishes only the exact reviewed Live draft, copies the dashboard Share URL without opening it, accepts only the reviewed host and reusable `/checkout/buy/` shape, verifies the live checkout and KNA backlink, persists the exact generated URL in the Lemon Squeezy and KNA sources, updates and verifies the live KNA page, verifies buyer delivery, and completes the release evidence. The generated URL is a bounded platform output, not permission to change any other reviewed fact. If any URL, checkout, price, artifact, copy, media, support, or backlink constraint fails, Codex immediately unpublishes Lemon Squeezy, leaves KNA unchanged, records `publish_bootstrap_failed`, returns the issue and manifest to `GUMROAD_PUBLISHED`, and stops. `/request-changes` before approval also returns to `GUMROAD_PUBLISHED` without changing the live Gumroad stage.

A simultaneous release-record pull request uses schema-v2 evidence, updates the product manifest to `PUBLISHED`, and records both sales URLs, the KNA URL, shared price, source and buyer-delivered checksums, and every reciprocal-link timestamp. A Gumroad-first partial record uses schema-v3 `status: partial`, contains only verified Gumroad and KNA evidence, declares `lemon-squeezy` pending, and updates the manifest to `GUMROAD_PUBLISHED`. Its final record keeps the same artifact identity, adds verified Lemon Squeezy evidence, sets `status: complete`, clears pending channels, and updates the manifest to `PUBLISHED`. `release-completed.yml` verifies each checked-in evidence transition and current issue state; it never calls Gumroad, Lemon Squeezy, or KNA Software.

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
