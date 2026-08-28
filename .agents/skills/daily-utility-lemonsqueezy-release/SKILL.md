---
name: daily-utility-lemonsqueezy-release
description: Prepare, manually publish, verify, and record an approved Daily Utility product on Lemon Squeezy; use only for release work, not builds or promotion.
---

# Daily Utility Lemon Squeezy Release

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved proposal, exact release artifact, `marketing/lemonsqueezy-listing.md`, and current publication evidence. Seller-side draft preparation is permitted from `GUMROAD_PUBLISHED` only to enter and verify the already reviewed copy, price, artifact, KNA destination, and Live draft identity. Keep the product unpublished. Use `exact-url` review when the draft exposes its reusable `/checkout/buy/` URL. Use `publish-bootstrap` only when the dashboard and current platform documentation establish that Share is unavailable until publication; record the exact Live draft identifier, expected storefront host and `/checkout/buy/` shape, and every other listing and KNA fact before review. Publication is permitted only when the issue is `APPROVED_RELEASE` for a simultaneous release or `APPROVED_REMAINING_CHANNELS` for a Gumroad-first release, and all required checks passed. The applicable verified `/approve` is standing authorization to publish the exact reviewed version and selected review mode, so do not request another confirmation while the artifact, shared USD price, listing copy, support terms, store destination, and reviewed KNA Software reverse-link destination remain unchanged.

Use the authenticated Lemon Squeezy dashboard manually through the Codex desktop control plane. Do not request, expose, or store credentials, cookies, tokens, webhooks, API keys, customer data, or payment data. Do not add a Lemon Squeezy API call to repository code or GitHub Actions.

## Preflight

- Recompute the exact versioned artifact SHA-256 and require it to match the Gumroad-approved bytes.
- Reconcile the reviewed product name, English-first description, one-time USD price, tax category, product/variant structure, delivery file, media, support route, receipt copy, guarantee terms, and KNA backlink.
- Use a standard one-time payment and one reviewed buyer variant unless the proposal explicitly approved something else. Do not enable subscriptions, license keys, lead magnets, discounts, affiliates, or extra variants by inference.
- Create or update the product as a Live draft first. In `exact-url` mode, keep the stable share URL from the dashboard Share panel; it must contain `/checkout/buy/`. In `publish-bootstrap` mode, keep the exact seller-side draft URL or ID and expected checkout host while the reusable URL remains unavailable. Never record or publish a converted `/checkout/?cart=` URL because it is customer-specific and single-use.
- Stop on store activation or identity requirements, missing seller access, CAPTCHA, an unreviewed tax or policy decision, upload error, changed URL host, or any price, copy, artifact, support, or backlink mismatch.

## Publish and verify

1. Inspect the draft's public checkout presentation before publishing.
2. Publish only the exact reviewed product and variant.
3. Verify the reusable hosted checkout URL, product name, shared USD price, listing copy, media, support facts, and buyer-visible link to the exact KNA Software page.
4. Verify buyer delivery through an authorized seller/test-order path when available. Do not make a real paid purchase without separate authority. Confirm the delivered filename, version, archive contents, primary workflow, and SHA-256 against the approved artifact.
5. If Lemon Squeezy cannot expose the reviewed KNA backlink on a public buyer-visible surface, stop and report the platform limitation; do not claim reciprocal-link completion.

For `publish-bootstrap`, step 1 is the complete seller-side Live draft inspection because no public checkout exists yet. After the verified approval, publish that exact draft once, copy the Share URL without opening it, and require the reviewed storefront host plus `/checkout/buy/` shape before continuing. Then verify the checkout and persist the exact generated URL in the reviewed Lemon Squeezy and KNA sources. If any generated URL, checkout, price, file, media, copy, support, or backlink fact differs, unpublish immediately, keep KNA unchanged, record `publish_bootstrap_failed`, return to `GUMROAD_PUBLISHED`, and stop. Do not substitute a Test-mode URL, construct a URL from IDs, use the API, or treat the brief failed bootstrap as a release.

## Record and continue

Lemon Squeezy verification alone does not complete a release. Continue with `daily-utility-knasoftware-catalog`, publish the exact reviewed KNA page with separate Gumroad and Lemon Squeezy purchase anchors, and verify both reciprocal-link pairs.

Record the Lemon Squeezy entry in `products/<product-id>/publication.json`: the stable `/checkout/buy/` URL, shared price, publication timestamp, buyer-delivered checksum, and KNA backlink verification timestamp. Simultaneous releases complete schema v2. Gumroad-first releases update the existing schema-v3 partial evidence to `status: complete`, add Lemon Squeezy, clear `pending_channels`, preserve the approved artifact identity, and record both KNA links. Only after all entries validate may the release-record pull request mark the manifest and issue `PUBLISHED`.
