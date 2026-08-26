# Daily Utility Factory

Daily Utility Factory is a guarded workflow for proposing, building, reviewing, and eventually releasing one small utility product at a time.

This repository currently contains only the factory skeleton. It does **not** connect to OpenAI/Codex, does **not** contain an `OPENAI_API_KEY`, and does **not** publish to Gumroad.

## Lifecycle

```text
READY_FOR_BUILD
  --/approve--> APPROVED_BUILD
  --build starts--> BUILDING
  --checks pass--> READY_FOR_RELEASE
  --/approve--> APPROVED_RELEASE
  --explicit release job--> PUBLISHED
```

At either approval checkpoint, `/reject` moves the proposal to `REJECTED`. The canonical transition definition is [`factory/state-machine.json`](factory/state-machine.json).

## Approval protocol

Approval happens on a GitHub proposal issue carrying the `factory:proposal` label.

- `/approve` at `state:ready-for-build` moves the issue to `state:approved-build`.
- `/approve` at `state:ready-for-release` moves the issue to `state:approved-release`.
- `/reject` at either approval checkpoint moves the issue to `state:rejected`.
- Only comments from an `OWNER`, `MEMBER`, or `COLLABORATOR` are accepted.
- Commands on pull requests, unlabelled issues, or issues in any other state are ignored or rejected.

Approval never runs Codex and never publishes a product. Those integrations are deliberately left for a later, separately reviewed change.

## Repository layout

```text
factory/
  prompts/                         Agent contracts; not executable integrations
  schemas/product-manifest.schema.json
  scripts/validate_manifest.py
  state-machine.json
products/                          Built products, one folder per product id
templates/
  product-manifest.json
  proposal-issue.md
.github/workflows/
  approval-gate.yml
  daily-idea.yml
  manifest-check.yml
```

## Working agreement

1. Create or generate a proposal issue from `templates/proposal-issue.md` with labels `factory:proposal` and `state:ready-for-build`.
2. Review the proposal and comment `/approve` or `/reject`.
3. Build only after the issue reaches `APPROVED_BUILD`.
4. Store the product in `products/<product-id>/` with a valid `product-manifest.json`.
5. Move to `READY_FOR_RELEASE` only after required checks pass.
6. Release only after a second `/approve` produces `APPROVED_RELEASE`.

Validate manifests locally with:

```bash
python3 -m pip install jsonschema==4.23.0
python3 factory/scripts/validate_manifest.py
```

## Automation switch

The scheduled idea workflow is inert by default. A future integration can set the repository variable `FACTORY_AUTOMATION_ENABLED=true` after credentials and execution boundaries are reviewed. The current enabled path creates only a manual proposal shell; it still does not call an AI provider.
