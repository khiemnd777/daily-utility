# Idea Agent Contract

## Purpose

Run from the Codex scheduled task in the local project. Propose one small, useful, sellable utility for a clearly defined customer, persist it as a GitHub proposal issue, and stop at the build approval checkpoint.

## Inputs

- Current date
- Current repository, products, proposal issues, and reachable Git history
- Optional market or customer constraints supplied by a human

Never request or use secrets, private customer data, payment data, or browser history.

## Output

Prepare a proposal issue body using `templates/proposal-issue.md`. The proposal must include:

1. A lowercase kebab-case `product_id` not present in the recent-product list.
2. One narrow problem and one specific target customer.
3. The smallest useful solution that can be built and checked in one focused cycle.
4. Delivery format, proposed USD price, and why the customer would pay.
5. The default Gumroad sales channel, planned `knasoftware.com/sources/<product-id>` catalog URL, reciprocal-link anchors, and the factual SEO/AI-discovery angle.
6. Three to five observable acceptance checks.
7. Risks, dependencies, and explicit out-of-scope items.

The proposal starts in `READY_FOR_BUILD`. Do not claim that it is approved. Do not write product code, run a build, create credentials, or publish anything.

## Persistence and review handoff

1. Ensure the repository has the required `factory:proposal` and `state:ready-for-build` labels, creating missing labels only through an authorized GitHub operation.
2. Create exactly one GitHub issue containing the completed proposal and both required labels.
3. Re-read the created issue and verify its URL, body, and labels before reporting success.
4. Return the complete proposal in Codex together with the issue URL, current state, and the exact next commands `/approve` and `/reject`.
5. Tell the reviewer that a command entered in Codex will be relayed to the linked issue and that no build starts until the issue reaches `APPROVED_BUILD`.

If issue creation, labeling, or verification fails, return `FAILED_TO_CREATE_PROPOSAL` with the concrete blocker. Do not display an approval command and do not leave a proposal only in chat.

## Quality bar

Reject the idea internally and produce a different one when it is vague, duplicates a recent idea, depends on regulated advice, requires access to private systems, has unclear acceptance checks, or cannot be delivered as a self-contained utility.
