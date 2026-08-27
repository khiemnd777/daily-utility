# Agent Operating Contract

These rules apply to automated and human-assisted agents working in this repository.

## Safety boundaries

- Never commit API keys, tokens, cookies, payment data, or customer data.
- Do not add or request `OPENAI_API_KEY` until a separately reviewed integration change explicitly authorizes it.
- GitHub Actions and checked-in scripts must not call Codex, OpenAI, Gumroad, payment, deployment, or publishing APIs. The Codex desktop app is the external control plane and runtime for this repository.
- Do not bypass either approval checkpoint or infer approval from prose. A reviewer must issue an exact `/approve`, `/reject`, or `/request-changes` command in the linked Codex task or directly on the linked GitHub proposal issue.
- A command issued in Codex authorizes Codex to relay that exact command to the linked proposal issue. The transition is authoritative only after `approval-gate.yml` confirms it by updating the issue state label.
- Never publish from `READY_FOR_RELEASE`; publishing is allowed only from `APPROVED_RELEASE`.

## State contract

The required happy path is:

`READY_FOR_BUILD -> APPROVED_BUILD -> BUILDING -> READY_FOR_RELEASE -> APPROVED_RELEASE -> PUBLISHED`

`/reject` is valid only from `READY_FOR_BUILD` or `READY_FOR_RELEASE` and moves the proposal to `REJECTED`. `/request-changes` is valid only from `READY_FOR_RELEASE` and moves the proposal back to `BUILDING` without granting release approval. Keep the linked issue state label, the product manifest state, and `factory/state-machine.json` consistent.

## Checkpoint-scoped autonomy

- After Codex relays an exact `/approve` and verifies the expected issue state label, continue autonomously through every in-scope action authorized by that checkpoint. Do not wait for reminders or ask for repeated confirmation while the approved scope, reviewed artifacts, price, listing terms, checks, and destinations remain unchanged.
- Build approval authorizes implementation, tests, packaging, commits, a draft product pull request, CI follow-through, and preparation of the `READY_FOR_RELEASE` handoff. It does not authorize release or promotion.
- Release approval authorizes final verification and merge of the linked product pull request, manual Gumroad publication of the exact approved version, live buyer verification, creation and merge of the focused release-record pull request, and follow-through until the issue reaches `PUBLISHED`. It does not authorize external promotion posts.
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

## Release and promotion rules

- Gumroad work is manual through the Codex desktop control plane. Publishing requires `APPROVED_RELEASE` on the linked issue; the verified release `/approve` is the explicit instruction to publish the exact reviewed product version without another confirmation.
- Before upload, identify the exact versioned artifact, compute its SHA-256, and verify price, listing copy, support terms, and buyer delivery contents. Never silently replace an already published artifact.
- After publishing, verify the public page, price, buyer-visible delivery, support route, and downloaded artifact checksum before creating publication evidence or marking `PUBLISHED`.
- Promotion begins only after `PUBLISHED`. Research current communities and their self-promotion rules before proposing targets.
- Posting, commenting, messaging, or sharing on behalf of the seller requires action-time approval for the exact destination and copy. Do not spam, conceal seller affiliation, fabricate testimonials, or make claims that the product evidence does not support.

## Change protocol

- Work on a focused branch and use a pull request.
- Keep generated artifacts out of Git unless they are intentional release assets.
- Run `python3 factory/scripts/validate_manifest.py` before requesting review.
- Run `python3 factory/scripts/validate_skills.py` when changing `.agents/skills/`.
- When modifying a workflow, preserve least-privilege permissions and avoid untrusted code execution from issue comments.

## Code Review Rules

- Flag any issue label, manifest state, or state-machine transition that disagrees with another authoritative record.
- Flag checked-in code or GitHub Actions that call Codex, OpenAI, Gumroad, payment, publishing, or social posting APIs.
- Flag release evidence whose URL, price, artifact path, checksum, or timestamp was not verified against the live buyer experience.
- Flag product architecture that duplicates business rules across UI and parsers, introduces circular dependencies, or adds abstraction without a concrete second implementation or test boundary.
- Flag changes to published release bytes without a new version and fresh release approval.
- Flag promotional claims that lack product evidence or outreach performed without the exact target and copy being approved.
