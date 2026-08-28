---
name: daily-utility-lemonsqueezy-release
description: Prepare, manually publish, verify, and record an approved Daily Utility product on Lemon Squeezy; use only for release work, not builds or promotion.
---

# Daily Utility Lemon Squeezy Release

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved proposal, exact release artifact, `marketing/lemonsqueezy-listing.md`, and current publication evidence. Continue only when the issue is `APPROVED_RELEASE` and all required checks passed. The verified release `/approve` is standing authorization to publish the exact reviewed version, so do not request another confirmation while the artifact, shared USD price, listing copy, support terms, store destination, and reviewed KNA Software reverse-link destination remain unchanged.

Use the authenticated Lemon Squeezy dashboard manually through the Codex desktop control plane. Do not request, expose, or store credentials, cookies, tokens, webhooks, API keys, customer data, or payment data. Do not add a Lemon Squeezy API call to repository code or GitHub Actions.

## Preflight

- Recompute the exact versioned artifact SHA-256 and require it to match the Gumroad-approved bytes.
- Reconcile the reviewed product name, English-first description, one-time USD price, tax category, product/variant structure, delivery file, media, support route, receipt copy, guarantee terms, and KNA backlink.
- Use a standard one-time payment and one reviewed buyer variant unless the proposal explicitly approved something else. Do not enable subscriptions, license keys, lead magnets, discounts, affiliates, or extra variants by inference.
- Create or update the product as a draft first. Keep the stable share URL from the dashboard's Share panel; it must contain `/checkout/buy/`. Never record or publish a converted `/checkout/?cart=` URL because it is customer-specific and single-use.
- Stop on store activation or identity requirements, missing seller access, CAPTCHA, an unreviewed tax or policy decision, upload error, changed URL host, or any price, copy, artifact, support, or backlink mismatch.

## Publish and verify

1. Inspect the draft's public checkout presentation before publishing.
2. Publish only the exact reviewed product and variant.
3. Verify the reusable hosted checkout URL, product name, shared USD price, listing copy, media, support facts, and buyer-visible link to the exact KNA Software page.
4. Verify buyer delivery through an authorized seller/test-order path when available. Do not make a real paid purchase without separate authority. Confirm the delivered filename, version, archive contents, primary workflow, and SHA-256 against the approved artifact.
5. If Lemon Squeezy cannot expose the reviewed KNA backlink on a public buyer-visible surface, stop and report the platform limitation; do not claim reciprocal-link completion.

## Record and continue

Lemon Squeezy verification alone does not complete a release. Continue with `daily-utility-knasoftware-catalog`, publish the exact reviewed KNA page with separate Gumroad and Lemon Squeezy purchase anchors, and verify both reciprocal-link pairs.

Record the Lemon Squeezy entry in schema-v2 `products/<product-id>/publication.json`: the stable `/checkout/buy/` URL, shared price, publication timestamp, buyer-delivered checksum, and KNA backlink verification timestamp. The same file records Gumroad evidence, the KNA URL, the approved artifact, and the source checksum. Only after all entries validate may the release-record pull request mark the manifest and issue `PUBLISHED`. Publication recording does not authorize promotion posts.
