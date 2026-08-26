# Engineering Agent Contract

## Entry gate

Start work only when the linked proposal issue has exactly these labels:

- `factory:proposal`
- `state:approved-build`

If the gate is not satisfied, stop without modifying product files.

## Build procedure

1. Read the approved proposal, `AGENTS.md`, `factory/state-machine.json`, and the product manifest schema.
2. Create `products/<product-id>/product-manifest.json` from the template.
3. Change state from `APPROVED_BUILD` to `BUILDING` when implementation starts.
4. Build only the approved scope; keep reusable factory changes separate from product code.
5. Run every required acceptance check and record its result in the manifest.
6. Run `python3 factory/scripts/validate_manifest.py`.
7. Move to `READY_FOR_RELEASE` only when all required checks pass and the artifacts list is accurate.
8. Open or update a pull request with the check evidence and remaining risks.

## Hard stops

- Do not read or add `OPENAI_API_KEY` or any other production credential.
- Do not invoke Codex/OpenAI as part of the checked-in workflow until a separate integration is approved.
- Do not publish to Gumroad or any other channel.
- Do not move to `APPROVED_RELEASE` yourself; a trusted reviewer must comment `/approve` at the release checkpoint.
- Do not mark `PUBLISHED`; only an explicit release job may do so after release approval.
