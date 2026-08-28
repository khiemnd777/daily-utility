# Agent Operating Contract

These rules apply to automated and human-assisted agents working in this repository.

## Safety boundaries

- Never commit API keys, tokens, cookies, payment data, or customer data.
- Do not add or request `OPENAI_API_KEY` until a separately reviewed integration change explicitly authorizes it.
- GitHub Actions and checked-in scripts must not call Codex, OpenAI, Gumroad, Lemon Squeezy, KNA Software admin/CMS, payment, deployment, or publishing APIs. The Codex desktop app is the external control plane and runtime for this repository.
- Do not bypass either approval checkpoint or infer approval from prose. A reviewer must issue an exact `/approve`, `/reject`, or `/request-changes` command in the linked Codex task or directly on the linked GitHub proposal issue.
- A command issued in Codex authorizes Codex to relay that exact command to the linked proposal issue. The transition is authoritative only after `approval-gate.yml` confirms it by updating the issue state label.
- Never publish from `READY_FOR_RELEASE` or `READY_FOR_REMAINING_CHANNELS`; publishing is allowed only from `APPROVED_RELEASE`, or from `APPROVED_REMAINING_CHANNELS` for the exact pending channels of a reviewed staged release.

## State contract

The required happy path is:

`READY_FOR_BUILD -> APPROVED_BUILD -> BUILDING -> READY_FOR_RELEASE -> APPROVED_RELEASE -> PUBLISHED`

When a proposal explicitly selects `gumroad-first`, the approved staged-release path is:

`READY_FOR_RELEASE -> APPROVED_RELEASE -> GUMROAD_PUBLISHED -> READY_FOR_REMAINING_CHANNELS -> APPROVED_REMAINING_CHANNELS -> PUBLISHED`

`GUMROAD_PUBLISHED` means the exact approved bytes are live and verified on Gumroad, the KNA Software page is live with the Gumroad reciprocal-link pair, and Lemon Squeezy is still pending. It is not a completed release and does not authorize promotion. `remaining_channels_ready` is valid only after the exact Lemon Squeezy listing, reusable checkout URL, shared price, artifact, KNA update, and reverse-link destination are reviewable. A fresh exact `/approve` from `READY_FOR_REMAINING_CHANNELS` authorizes that remaining-channel checkpoint.

`/reject` is valid only from `READY_FOR_BUILD` or `READY_FOR_RELEASE` and moves the proposal to `REJECTED`. `/request-changes` from `READY_FOR_RELEASE` moves the proposal back to `BUILDING`; from `READY_FOR_REMAINING_CHANNELS` it returns to `GUMROAD_PUBLISHED` without changing the already-live first stage. Neither transition grants release approval. Keep the linked issue state label, the product manifest state, and `factory/state-machine.json` consistent.

## Checkpoint-scoped autonomy

- After Codex relays an exact `/approve` and verifies the expected issue state label, continue autonomously through every in-scope action authorized by that checkpoint. Do not wait for reminders or ask for repeated confirmation while the approved scope, reviewed artifacts, price, listing terms, checks, and destinations remain unchanged.
- Build approval authorizes implementation, tests, packaging, commits, a draft product pull request, CI follow-through, and preparation of the `READY_FOR_RELEASE` handoff. It does not authorize release or promotion.
- Release approval authorizes the exact reviewed release sequence. For `simultaneous`, it authorizes final verification and merge of the linked product pull request, manual Gumroad and Lemon Squeezy publication, KNA Software catalog publication, every reciprocal-link and buyer check, and completion through `PUBLISHED`. For `gumroad-first`, it authorizes only the first stage: final product-PR verification and merge, Gumroad publication, the KNA page with its Gumroad link, live Gumroad buyer verification, and a partial release record ending at `GUMROAD_PUBLISHED`. The later Lemon Squeezy listing and KNA link update require a fresh `/approve` from `READY_FOR_REMAINING_CHANNELS`. Neither approval authorizes external promotion posts.
- Stop at the next approval checkpoint or on a state mismatch, scope change, unexpected bytes, failed check, blocking review, CAPTCHA, missing seller access, credential request, changed price or copy, ambiguous destination, or any other condition that makes the standing approval no longer specific enough.
- After `PUBLISHED`, automatically research suitable promotion targets and prepare tailored drafts without waiting to be asked. Posting, commenting, messaging, or sharing still requires action-time approval for the exact destination, account context, and final copy.

## Codex-first handoff

- The Codex scheduled task is the only automatic idea scheduler. GitHub Actions must not run a competing daily idea schedule.
- An idea run must create one complete GitHub proposal issue before it presents approval commands. The issue is the durable proposal and state ledger.
- If issue creation or labeling fails, report the run as failed, do not display `/approve`, and do not continue to a build.
- Every review handoff must show what was created, the issue URL, the current factory state, the exact next command, and what that command will do.
- End every factory handoff with a clearly labeled **Recommended next action** in visible prose, not only in a collapsed UI directive or metadata. Recommend one primary command or instruction that is valid for the verified current state and explain its effect. If work is blocked, state the concrete blocker and the exact prerequisite to clear it instead of suggesting an inapplicable action.
- When a reviewer replies `/approve`, `/reject`, or `/request-changes` in Codex, relay the exact command to the linked issue and verify the resulting state label before continuing.
- Start implementation only in a focused branch and isolated worktree after the linked issue reaches `APPROVED_BUILD`.
- Direct commands on the GitHub proposal issue remain a fallback, but Codex must re-read and verify the issue state before acting.

## Product contract

- Create products under `products/<product-id>/`.
- Give every product a `product-manifest.json` that validates against `factory/schemas/product-manifest.schema.json`.
- Use lowercase kebab-case for `product_id` and its directory name.
- Record acceptance checks and artifacts in the manifest.
- Before `READY_FOR_RELEASE`, add `products/<product-id>/marketing/knasoftware-listing.md` as the reviewed source of truth for every KNA Software CMS field and list it in the manifest artifacts. A simultaneous release requires both exact sales destinations and reciprocal-link pairs. A reviewed Gumroad-first release may identify Lemon Squeezy as pending, but must contain the exact Gumroad destination, the first-stage KNA page fields, and the Gumroad reciprocal-link pair; it must not invent or publish a placeholder Lemon Squeezy link.
- Do not mark a product `READY_FOR_RELEASE` while a required check is pending or failed.

## Execution rules

- Identify the active lifecycle phase before acting. Do not mix idea research, product implementation, release, and promotion in one ungated step.
- Read the linked proposal issue and current state label again before every state-sensitive action; chat summaries and stale local files are not authoritative.
- Keep the change limited to the approved product and phase. Separate reusable factory changes from product work and give them their own focused pull request.
- Prefer deterministic, inspectable, self-contained utilities. Do not introduce a hosted service, account system, private integration, or customer-data dependency unless a separately approved proposal requires it.
- When modifying files under `products/`, read and follow `products/AGENTS.md` in addition to this file.

## Git and worktree rules

- Before a manual or scheduled factory run, inspect the main checkout, `git worktree list`, local branches, and remote tracking branches. A stale worktree for the same product and phase must be explicitly reused or cleaned before new work starts.
- Start task work from a clean, current `main` in a uniquely named `codex/<purpose>` branch and isolated worktree. Do not modify the main checkout for product implementation.
- Stage only named task files. Never use broad staging, force-push, history rewriting, or destructive checkout commands as routine cleanup.
- Open pull requests as drafts unless the user explicitly asks for ready-for-review. Merge only after required checks pass and blocking review threads are resolved. A verified release `/approve` is standing merge authorization only for the linked product pull request and its focused release-record pull request; every other merge still requires an explicit user request.
- Deleting a remote branch, local branch, or worktree requires an explicit cleanup request. A plain merge request does not authorize deletion. Squash-merged local branches may use force deletion only after verifying the merged tree contains their intended diff.
- Never clean unrelated worktrees or branches while handling the current task; report them separately.

## Release, catalog, and promotion rules

- Gumroad and Lemon Squeezy work is manual through the Codex desktop control plane. A simultaneous publication requires `APPROVED_RELEASE`. A reviewed Gumroad-first first stage also requires `APPROVED_RELEASE` and must stop at `GUMROAD_PUBLISHED`; Lemon Squeezy publication for that staged release requires `APPROVED_REMAINING_CHANNELS`. While the issue is `GUMROAD_PUBLISHED`, Codex may create or update an unpublished Lemon Squeezy draft using the already reviewed bytes, price, copy, support terms, and KNA destination solely to obtain the exact reusable URL for remaining-channel review. Draft preparation does not authorize publication. Never infer either publish checkpoint from prose.
- Before either upload, identify the exact versioned artifact, compute its SHA-256, and verify the shared USD price, channel-specific listing copy, support terms, and buyer delivery contents. Upload the same approved bytes to both channels. Never silently replace an already published artifact.
- Every released utility must also have a public product page on `https://knasoftware.com/`. The KNA Software page must link directly to every approved active sales listing, and each active sales listing must link back to the exact KNA Software product page. During `GUMROAD_PUBLISHED`, the KNA page links only to the verified Gumroad listing and truthfully marks Lemon Squeezy as pending without a dead or placeholder purchase link. All active destinations, anchor copy, page copy, price, version, support terms, and media must be part of the applicable checkpoint review.
- Use `daily-utility-knasoftware-catalog` for KNA Software catalog work. Log in only through the approved Google admin flow in the Codex desktop browser, never store credentials or tokens, create or update the product as a draft first, and publish only from `APPROVED_RELEASE`, from `APPROVED_REMAINING_CHANNELS` for the reviewed staged update, or under a separately approved backfill for an already `PUBLISHED` product.
- KNA Software pages must use a stable lowercase product slug, self-canonical URL, descriptive purchase anchors for every active channel, original page copy rather than a wholesale duplicate of either sales listing, and complete factual fields for product name, maker, audience, problem, version, price, features, limits, support, and current purchase availability. A `GUMROAD_PUBLISHED` page must identify Lemon Squeezy as pending without linking to an inactive destination; a `PUBLISHED` page must expose both approved purchase destinations. Do not point the KNA canonical URL at a sales channel, misuse a documentation field as a purchase field, keyword-stuff, fabricate schema or reviews, or promise ranking gains.
- For SEO and AI discoverability, verify the public KNA page, title, description, canonical, OG image, crawlability, sitemap membership, and reciprocal links. Check available `Product`/`SoftwareApplication` structured data and AI-readable discovery files such as `llms.txt`; if the platform does not expose them correctly, record the gap and do not claim SEO or AI-SEO completion.
- After any channel publication, verify its public sales page, shared USD price, buyer-visible delivery, support route, downloaded artifact checksum, and KNA backlink. A Gumroad-first partial record uses schema-v3 evidence and may move only to `GUMROAD_PUBLISHED`. Before final `PUBLISHED`, verify both public sales pages, both delivered checksums, the KNA page links to both listings, and both listings link back to KNA; schema-v3 evidence must then be `complete` with no pending channels.
- Promotion begins only after `PUBLISHED`. Read `factory/promotion/channels.json` and the product's promotion log when present before researching; reuse eligible known channels after a current rule check, skip same-product channels already marked `published` or `pending`, and search only for uncovered audiences.
- Posting, commenting, messaging, or sharing on behalf of the seller requires action-time approval for the exact destination and copy. Do not spam, conceal seller affiliation, fabricate testimonials, or make claims that the product evidence does not support.
- After an approved outreach attempt, record its `published`, `pending`, `rejected`, or `skipped` state in the product promotion log and add genuinely new reusable destinations to the shared registry. Never store credentials, cookies, or private account data in promotion artifacts.

## Change protocol

- Work on a focused branch and use a pull request.
- Keep generated artifacts out of Git unless they are intentional release assets.
- Run `python3 factory/scripts/validate_manifest.py` before requesting review.
- Run `python3 factory/scripts/validate_skills.py` when changing `.agents/skills/`.
- When modifying a workflow, preserve least-privilege permissions and avoid untrusted code execution from issue comments.

## Code Review Rules

- Flag any issue label, manifest state, or state-machine transition that disagrees with another authoritative record.
- Flag checked-in code or GitHub Actions that call Codex, OpenAI, Gumroad, Lemon Squeezy, KNA Software admin/CMS, payment, publishing, or social posting APIs.
- Flag release evidence whose URL, price, artifact path, checksum, or timestamp was not verified against the live buyer experience.
- Flag product architecture that duplicates business rules across UI and parsers, introduces circular dependencies, or adds abstraction without a concrete second implementation or test boundary.
- Flag changes to published release bytes without a new version and fresh release approval.
- Flag promotional claims that lack product evidence or outreach performed without the exact target and copy being approved.
- Flag a staged release that exposes a placeholder or inactive Lemon Squeezy purchase link, records `GUMROAD_PUBLISHED` without verified Gumroad/KNA reciprocal evidence, or advances the remaining channel without its second exact approval. Flag any v2/v3 release marked `PUBLISHED` without verified Gumroad and Lemon Squeezy listings, buyer-delivered checksums from both channels, a verified KNA Software product page, both sales-channel-to-KNA links, both KNA-to-sales links, or truthful SEO/AI-discovery evidence. Also flag external canonicals, misleading purchase links, duplicated keyword-stuffed copy, and claims of ranking improvement without measured evidence.
