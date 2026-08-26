# Daily Utility Factory

Daily Utility Factory is a Codex-first, approval-gated workflow for proposing, building, reviewing, and eventually releasing one small utility product at a time.

Codex runs outside GitHub Actions as the scheduler, control plane, and implementation runtime. GitHub stores proposal state, code, pull requests, and CI evidence. The repository does **not** contain an `OPENAI_API_KEY`, GitHub Actions do not invoke an AI provider, and Gumroad publishing is not configured.

The durable runtime contract is documented in [`factory/codex-first-workflow.md`](factory/codex-first-workflow.md).

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

Every Codex idea run creates a complete GitHub proposal issue carrying `factory:proposal` and exactly one state label. The issue is the durable audit ledger; the linked Codex task is the primary review surface.

- Reply `/approve` or `/reject` in the linked Codex task.
- Codex relays the exact command to the linked proposal issue.
- `approval-gate.yml` accepts commands only from an `OWNER`, `MEMBER`, or `COLLABORATOR` and records the authoritative state transition.
- Codex verifies the resulting issue label before starting or continuing work.
- A trusted reviewer may comment directly on the issue as a fallback.

Approval alone never publishes a product. Build work starts only after `APPROVED_BUILD`, and publishing remains a separate, unconfigured step after `APPROVED_RELEASE`.

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
  manifest-check.yml
```

## Working agreement

1. The Codex scheduled task researches one idea and creates a proposal issue from `templates/proposal-issue.md` with labels `factory:proposal` and `state:ready-for-build`.
2. Codex returns the full proposal, issue URL, current state, and exact next command.
3. A reviewer replies `/approve` or `/reject` in Codex; Codex relays the command and verifies the issue transition.
4. After `APPROVED_BUILD`, Codex starts the Engineering Agent in an isolated worktree and focused branch.
5. Store the product in `products/<product-id>/` with a valid `product-manifest.json`, run checks, and open a pull request.
6. Move to `READY_FOR_RELEASE` only after required checks pass.
7. Release only after a second `/approve` produces `APPROVED_RELEASE`.

Validate manifests locally with:

```bash
python3 -m pip install -r factory/requirements.txt
python3 factory/scripts/validate_manifest.py
```

## Automation ownership

The active schedule belongs to the Codex project automation named `Daily Utility Idea Agent`. There is no GitHub Actions cron for idea generation and no ChatGPT web task in the supported path. If Codex cannot create the proposal issue, the run must fail visibly instead of returning an orphaned proposal.
