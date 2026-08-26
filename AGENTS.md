# Agent Operating Contract

These rules apply to automated and human-assisted agents working in this repository.

## Safety boundaries

- Never commit API keys, tokens, cookies, payment data, or customer data.
- Do not add or request `OPENAI_API_KEY` until a separately reviewed integration change explicitly authorizes it.
- Do not call Codex, OpenAI, Gumroad, payment, deployment, or publishing APIs from the current factory skeleton.
- Do not bypass either approval checkpoint or infer approval from prose. Only the `/approve` command handled by `approval-gate.yml` is authoritative.
- Never publish from `READY_FOR_RELEASE`; publishing is allowed only from `APPROVED_RELEASE`.

## State contract

The required happy path is:

`READY_FOR_BUILD -> APPROVED_BUILD -> BUILDING -> READY_FOR_RELEASE -> APPROVED_RELEASE -> PUBLISHED`

`/reject` is valid only from `READY_FOR_BUILD` or `READY_FOR_RELEASE` and moves the proposal to `REJECTED`. Keep issue state labels, the product manifest state, and `factory/state-machine.json` consistent.

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
