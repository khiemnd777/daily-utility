---
name: daily-utility-git-delivery
description: Manage Daily Utility branches, isolated worktrees, commits, pull requests, merges, and explicit cleanup with repository-specific safety rules; use for Git delivery, not product design or publishing.
---

# Daily Utility Git Delivery

## Preflight

Inspect `git status`, the current branch, `git worktree list`, relevant local and remote branches, open pull requests, and the intended base/head diff. Confirm `main` is clean and current before creating a uniquely named `codex/<purpose>` branch and isolated worktree.

A stale worktree for the same product and phase must be inspected and either explicitly reused or cleaned before work continues. Never remove unrelated worktrees as collateral cleanup.

## Commit and pull request

- Keep one product or factory concern per branch.
- Stage only explicit paths and inspect staged and unstaged diffs before committing.
- Run the checks required by `AGENTS.md`, the product manifest, and changed workflows.
- Push the exact task branch and reuse its existing pull request when present.
- Create pull requests as drafts unless the user explicitly requests ready-for-review. Include scope, validation evidence, risks, and state implications.

## Merge

Before merge, verify the current head SHA, mergeability, required CI, blocking reviews, and that the PR still contains only the intended diff. A verified release `/approve` is standing merge authorization for the linked product pull request and its focused release-record pull request; do not request another confirmation for those two merges while their reviewed scope remains unchanged. Every other merge requires an explicit user request. Prefer the repository's established merge method; for a one-commit focused change, squash merge is acceptable.

## Cleanup

Cleanup is a separate destructive step and requires an explicit request. Resolve the exact remote branch, local worktree, and local branch before deletion. Remove the worktree with Git, not raw filesystem deletion. Try safe local branch deletion first; after a squash merge, force-delete only the exact branch after verifying its tree is represented in `main`. Reinspect worktrees and branches afterward and report anything intentionally retained.
