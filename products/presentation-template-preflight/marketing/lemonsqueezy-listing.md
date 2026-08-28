# Lemon Squeezy release source — Presentation Template Preflight 1.0.0

## Product configuration

- Product name: `Presentation Template Preflight`
- Product type: Standard digital download
- Variant: One-time purchase, one buyer variant
- Remaining-channel review mode: `publish-bootstrap`
- Seller dashboard product: Live product ID `1323100` at `https://app.lemonsqueezy.com/products/1323100`
- Seller dashboard status: `Draft` with Test mode off
- Stable hosted checkout URL: withheld by Lemon Squeezy until this exact Live draft is published after `APPROVED_REMAINING_CHANNELS`
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

## Remaining-channel preparation and verification

This checkpoint is `READY_FOR_REMAINING_CHANNELS` in constrained `publish-bootstrap` mode. The reviewed copy, `$19 USD` one-time price, `Software` tax category, versioned ZIP, checksum, support and refund terms, media order, KNA reverse-link destination, Live draft identity, and generated-URL boundary are fixed. The only unresolved field is the reusable Share URL that Lemon Squeezy generates after publication.

Pre-approval verification on 2026-08-28 established all of the following in the seller dashboard:

- Live product ID `1323100` is the only product selected for this checkpoint and remains `Draft`;
- Test mode is off;
- the product is a one-time purchase with Standard pricing at `$19.00 USD` and tax category `Software`;
- the delivery is `presentation-template-preflight-v1.0.0.zip`, displayed as `64.48 KB`, matching the reviewed `66,026` bytes and SHA-256 `720002d28820022b957653fb945ee772162c278b61023d3d9b5d54891266b550`;
- the four reviewed media files appear in the order above;
- the product links back to `https://knasoftware.com/sources/presentation-template-preflight` with label `Product details, privacy, and support`;
- license keys are disabled; and
- no `Share` control or reusable checkout URL is exposed while the Live product is Draft.

An exact `/approve` from this checkpoint authorizes Codex to publish only Live product `1323100` once, copy the generated dashboard Share URL without using a customer cart, and accept it only when the host is exactly `knasoftware.lemonsqueezy.com` and the path begins with `/checkout/buy/`. Never accept or publish a customer-specific `/checkout/?cart=` URL, a different host, a different product, or a changed listing fact.

After that URL passes the host, path, public checkout, `$19 USD` price, copy, artifact, support, and KNA-backlink checks, persist the exact URL in this source and the KNA source before changing the live KNA page. Then add the reviewed KNA purchase anchor, verify both reciprocal links and buyer delivery checksum, and complete the schema-v3 release evidence.

If the generated URL or any checkout fact differs, immediately return product `1323100` to Draft, leave the public KNA page unchanged, record `publish_bootstrap_failed`, return the factory state to `GUMROAD_PUBLISHED`, and stop. No Lemon Squeezy publication or KNA mutation is authorized before the fresh exact `/approve`.
