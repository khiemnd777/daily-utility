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

## Codex-first handoff

- The Codex scheduled task is the only automatic idea scheduler. GitHub Actions must not run a competing daily idea schedule.
- An idea run must create one complete GitHub proposal issue before it presents approval commands. The issue is the durable proposal and state ledger.
- If issue creation or labeling fails, report the run as failed, do not display `/approve`, and do not continue to a build.
- Every review handoff must show what was created, the issue URL, the current factory state, the exact next command, and what that command will do.
- When a reviewer replies `/approve`, `/reject`, or `/request-changes` in Codex, relay the exact command to the linked issue and verify the resulting state label before continuing.
- Start implementation only in a focused branch and isolated worktree after the linked issue reaches `APPROVED_BUILD`.
- Direct commands on the GitHub proposal issue remain a fallback, but Codex must re-read and verify the issue state before acting.

## Product contract

- Create products under `products/<product-id>/`.
- Give every product a `product-manifest.json` that validates against `factory/schemas/product-manifest.schema.json`.
- Use lowercase kebab-case for `product_id` and its directory name.
- Record acceptance checks and artifacts in the manifest.
- Do not mark a product `READY_FOR_RELEASE` while a required check is pending or failed.

## Change protocol

- Work on a focused branch and use a pull request.
- Keep generated artifacts out of Git unless they are intentional release assets.
- Run `python3 factory/scripts/validate_manifest.py` before requesting review.
- When modifying a workflow, preserve least-privilege permissions and avoid untrusted code execution from issue comments.
