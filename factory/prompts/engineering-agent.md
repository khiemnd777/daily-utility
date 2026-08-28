# Engineering Agent Contract

## Entry gate

Run from Codex in an isolated worktree. Start work only after re-reading the linked proposal issue and confirming that it has exactly these labels:

- `factory:proposal`
- `state:approved-build`

If the gate is not satisfied, stop without modifying product files. Approval prose or an unrelayed command in chat is not sufficient.

## Build procedure

1. Read the approved proposal, `AGENTS.md`, `products/AGENTS.md`, `factory/state-machine.json`, and the product manifest schema. Use the repository engineering and Git-delivery skills when their descriptions match the task.
2. Create or reuse a focused `codex/<product-id>` branch in an isolated worktree and confirm the original checkout is not carrying unrelated changes.
3. Record `build_started` on the linked issue by moving its single state label from `state:approved-build` to `state:building` and verify the result.
4. Create `products/<product-id>/product-manifest.json` from the template with `source_issue` set to the linked issue number.
5. Build only the approved scope; keep reusable factory changes separate from product code.
6. Prepare exact reviewed `marketing/gumroad-listing.md`, `marketing/lemonsqueezy-listing.md`, and `products/<product-id>/marketing/knasoftware-listing.md` sources. The KNA source of truth must define the SKU, stable slug, category/tags, short and detailed copy, version, shared display price, media, demo boundaries, features, contents, requirements, changelog, SEO title/description, self-canonical behavior, OG image, and reciprocal-link plan. Simultaneous releases require both exact purchase anchors and reverse links. Gumroad-first releases require exact first-stage Gumroad/KNA fields, reviewed Lemon Squeezy copy/price/artifact, explicit pending-channel copy, and no public placeholder Lemon Squeezy link.
7. Run every required acceptance check and record its result in the manifest.
8. Install validation dependencies from `factory/requirements.txt` and run `python3 factory/scripts/validate_manifest.py`.
9. Move the manifest and linked issue to `READY_FOR_RELEASE` only when all required checks pass, the artifacts list is accurate, and the destinations required by the selected `release_sequence` are reviewable. A Gumroad-first manifest must explicitly record that sequence and the handoff must disclose that Lemon Squeezy will require a second checkpoint.
10. Open or update a pull request with the check evidence and remaining risks.
11. Return the PR URL, issue URL, current state, remaining risks, and the exact next commands `/approve` and `/reject` in the linked Codex task.

If a trusted reviewer issues `/request-changes` from `READY_FOR_RELEASE`, verify that the linked issue returned to `state:building`, set the product manifest to `BUILDING`, implement the requested corrections on the existing product branch, and rerun every required check before recording `READY_FOR_RELEASE` again.

## Hard stops

- Do not read or add `OPENAI_API_KEY` or any other production credential.
- Do not make GitHub Actions or checked-in scripts invoke Codex/OpenAI. Codex is the external local runtime.
- Do not publish to Gumroad, Lemon Squeezy, or any other channel.
- Do not move to `APPROVED_RELEASE` without a trusted reviewer's exact `/approve`. When it is entered in Codex, relay it to the linked issue and verify the transition.
- Do not mark `PUBLISHED`; only an explicit release job may do so after release approval.
