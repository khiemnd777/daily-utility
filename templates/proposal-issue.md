# Product proposal: <name>

## Product id

`<lowercase-kebab-case-id>`

## Problem

What narrow, recurring problem exists, and what evidence suggests it matters?

## Target customer

Who specifically experiences the problem?

## Proposed utility

What is the smallest useful deliverable? State explicit out-of-scope items.

## Distribution and price

- Format: `<download | template | script | web-app | guide | bundle>`
- Sales channels: `Gumroad` and `Lemon Squeezy` (manual through Codex after release approval)
- Release sequence: `simultaneous` unless an observed channel-access dependency justifies reviewed `gumroad-first`
- First-party catalog: `https://knasoftware.com/sources/<product-id>`
- Reciprocal links: Gumroad → KNA, Lemon Squeezy → KNA, and KNA → both sales listings
- Proposed price: `$<amount> USD`
- Why the customer would pay:

## Catalog and discovery plan

- KNA slug: `<product-id>`
- Distinct first-party angle:
- Gumroad sales-link anchor:
- Lemon Squeezy sales-link anchor:
- Gumroad reverse-link anchor:
- Lemon Squeezy reverse-link anchor:
- SEO/AI-discovery facts to expose: audience, problem, maker, version, shared price, capabilities, limits, privacy behavior, support, and both purchase URLs
- Platform gaps that must be verified rather than assumed: sitemap membership, structured data, and `llms.txt`

## Acceptance checks

- [ ] Check 1 is observable and repeatable
- [ ] Check 2 is observable and repeatable
- [ ] Check 3 is observable and repeatable

## Risks and dependencies

- Credentials required: none
- Private customer data required: none
- External dependencies:
- Main risks:

## Factory state

`READY_FOR_BUILD`

Required labels: `factory:proposal`, `state:ready-for-build`

Primary review surface: the linked Codex task that created this issue.

Next action: reply with the exact command `/approve` or `/reject` in Codex. Codex will relay the command to this issue and verify the state transition. A trusted reviewer may comment the same exact command directly on this issue as a fallback.
