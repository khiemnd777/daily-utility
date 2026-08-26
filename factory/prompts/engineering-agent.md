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
6. Run every required acceptance check and record its result in the manifest.
7. Install validation dependencies from `factory/requirements.txt` and run `python3 factory/scripts/validate_manifest.py`.
8. Move the manifest and linked issue to `READY_FOR_RELEASE` only when all required checks pass and the artifacts list is accurate.
9. Open or update a pull request with the check evidence and remaining risks.
10. Return the PR URL, issue URL, current state, remaining risks, and the exact next commands `/approve` and `/reject` in the linked Codex task.

If a trusted reviewer issues `/request-changes` from `READY_FOR_RELEASE`, verify that the linked issue returned to `state:building`, set the product manifest to `BUILDING`, implement the requested corrections on the existing product branch, and rerun every required check before recording `READY_FOR_RELEASE` again.

## Hard stops

- Do not read or add `OPENAI_API_KEY` or any other production credential.
- Do not make GitHub Actions or checked-in scripts invoke Codex/OpenAI. Codex is the external local runtime.
- Do not publish to Gumroad or any other channel.
- Do not move to `APPROVED_RELEASE` without a trusted reviewer's exact `/approve`. When it is entered in Codex, relay it to the linked issue and verify the transition.
- Do not mark `PUBLISHED`; only an explicit release job may do so after release approval.
