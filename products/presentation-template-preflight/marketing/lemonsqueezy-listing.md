# Lemon Squeezy release source — Presentation Template Preflight 1.0.0

## Product configuration

- Product name: `Presentation Template Preflight`
- Product type: Standard digital download
- Variant: One-time purchase, one buyer variant
- Next remaining-channel review mode: `exact-url`; this checked-in source is the review candidate while issue #23 and the manifest remain `GUMROAD_PUBLISHED`
- Seller dashboard product: Live product ID `1323100` at `https://app.lemonsqueezy.com/products/1323100`
- Seller dashboard status: `Draft` with Test mode off after required rollback
- Stable hosted checkout URL for review: `https://knasoftware.lemonsqueezy.com/checkout/buy/429ed96b-ad38-4f63-92c4-bdcac78059a7` (verified during the approved bootstrap and intentionally inactive while the product is Draft)
- Expected checkout host: `knasoftware.lemonsqueezy.com`
- Required reusable checkout path prefix: `/checkout/buy/`
- Price: `$19 USD`
- Tax category: `Software`
- Version: `1.0.0`
- Delivery file: `presentation-template-preflight-v1.0.0.zip`
- Delivery bytes: `66,026`
- Delivery SHA-256: `720002d28820022b957653fb945ee772162c278b61023d3d9b5d54891266b550`
- KNA Software external link URL: `https://knasoftware.com/sources/presentation-template-preflight`
- KNA Software external link label: `Product details, privacy, and support`
- Subscriptions, license keys, lead magnets, discounts, affiliates, and extra variants: disabled

## Short description

Offline PowerPoint-template release QA for package links, fonts, hidden content, metadata, and exportable evidence.

## Description

Run a final evidence-led check before you deliver an editable PowerPoint template.

Presentation Template Preflight opens one `.pptx` or `.potx` package locally in your browser and reports:

- missing internal OOXML parts;
- linked local media, external data, and intentional web destinations;
- referenced fonts without matching embedded-font records;
- comments, speaker notes, hidden slides, embedded objects, macros, and personal metadata;
- the exact input SHA-256 plus CSV and self-contained HTML findings.

Nothing is uploaded or changed. There is no account, telemetry, analytics, or network dependency inside the utility.

Use the output as a release record, then perform a visual check in the PowerPoint versions your buyers use. Static inspection cannot prove rendered appearance, font licensing, accessibility, animation quality, or universal compatibility, and the utility does not repair presentations or execute embedded content.

[Product details, privacy, and support](https://knasoftware.com/sources/presentation-template-preflight)

Not affiliated with or endorsed by Microsoft.

## Buyer delivery and support

The buyer receives the versioned offline ZIP, bundled dependency notices, buyer guide, and support file. Primary support is by replying to the Lemon Squeezy receipt; fallback is `khiemnd777@gmail.com`, with a normal response target of two business days.

If the verified buyer cannot complete the documented core workflow and support cannot resolve the defect, the buyer may request a full refund within seven days of purchase. Unsupported formats, presentation repair, design advice, font licensing, accessibility certification, third-party outages, and changed requirements are excluded.

## Reviewed media order

1. `marketing/sales-workflow.png`
2. `marketing/sales-results.png`
3. `marketing/sales-report-preview.png`
4. `marketing/sales-contents.png`

## Publish-bootstrap failure record

Issue #23 reached `APPROVED_REMAINING_CHANNELS` and the constrained `publish-bootstrap` ran on 2026-08-28. The reviewed copy, `$19 USD` one-time price, `Software` tax category, versioned ZIP, checksum, support and refund terms, media order, KNA reverse-link destination, and Live product identity remained unchanged.

Pre-approval verification on 2026-08-28 established all of the following in the seller dashboard:

- Live product ID `1323100` was the only product selected for this checkpoint;
- Test mode is off;
- the product is a one-time purchase with Standard pricing at `$19.00 USD` and tax category `Software`;
- the delivery is `presentation-template-preflight-v1.0.0.zip`, displayed as `64.48 KB`, matching the reviewed `66,026` bytes and SHA-256 `720002d28820022b957653fb945ee772162c278b61023d3d9b5d54891266b550`;
- the four reviewed media files appear in the order above;
- the product links back to `https://knasoftware.com/sources/presentation-template-preflight` with label `Product details, privacy, and support`;
- license keys are disabled; and
- Lemon Squeezy generated the reusable Share URL `https://knasoftware.lemonsqueezy.com/checkout/buy/429ed96b-ad38-4f63-92c4-bdcac78059a7` after publication.

The captured URL has HTTPS scheme, exact host `knasoftware.lemonsqueezy.com`, path `/checkout/buy/429ed96b-ad38-4f63-92c4-bdcac78059a7`, and no query string. It is not a customer-specific `/checkout/?cart=` URL. The public checkout was opened only after those constraints passed and showed the exact product name, `$19.00` price, reviewed description, and link to `https://knasoftware.com/sources/presentation-template-preflight`.

The bootstrap could not continue because every visible KNA admin product edit route rendered a blank page after access verification, including both the target record and a control product. The public KNA page therefore could not receive or verify the required Lemon Squeezy reciprocal link, and it remained unchanged with no inactive placeholder link.

Following the approved failure rule, product `1323100` was returned to `Draft` at 2026-08-28T13:09:37Z. The exact checkout URL then returned `404: Page Not Found`, confirming that no Lemon Squeezy sale remains active. This is `publish_bootstrap_failed`; the factory state returns to `GUMROAD_PUBLISHED`, and `publication.json` remains the existing schema-v3 partial record with Lemon Squeezy pending.

## Exact-url checkpoint recovery

The two blockers from the failed bootstrap were cleared on 2026-08-28:

- the KNA admin edit route rendered the complete existing product form again and was inspected read-only; no KNA field changed; and
- the reviewer explicitly authorized one real Live verification purchase for product `1323100` at `$19 USD` plus any tax displayed by checkout, with an instruction to stop immediately before payment for action-time confirmation.

Lemon Squeezy's official Test Mode documentation states that file downloads are disabled for test purchases, and its Testing and Going Live guide states that Test and Live products, orders, IDs, and checkout URLs are separate. The authorized Live purchase is therefore the buyer-delivery verification path for this exact product. No purchase, customer-data entry, payment-data entry, or financial transaction occurred while preparing this source.

After this review source is merged and issue #23 plus the manifest are synchronized to `READY_FOR_REMAINING_CHANNELS`, a fresh exact `/approve` will authorize only this `exact-url` release: publish Live product `1323100`, require the exact URL above to reactivate, and verify its product name, one-time `$19.00 USD` price, listing copy, media, support terms, artifact identity, and KNA backlink. A different host, path, product, price, tax category, artifact, copy, media order, support term, or backlink is a material mismatch and must stop the release.

At the buyer checkout, Codex must stop immediately before the payment action as instructed. Only after the required action-time confirmation may the authorized payment be submitted. The delivered file must then be downloaded through the buyer order, confirmed as `presentation-template-preflight-v1.0.0.zip`, checked for the documented contents and primary offline workflow, and hash to `720002d28820022b957653fb945ee772162c278b61023d3d9b5d54891266b550`.

Only after buyer delivery passes may Codex apply the exact reviewed KNA Markdown update, preserve the Gumroad destination, add the Lemon Squeezy purchase anchor, verify both KNA outbound links and both sales-channel backlinks, and record the schema-v3 completed publication evidence. The public KNA page must remain unchanged until the issue reaches `APPROVED_REMAINING_CHANNELS`; no inactive checkout URL may be exposed before republication.
