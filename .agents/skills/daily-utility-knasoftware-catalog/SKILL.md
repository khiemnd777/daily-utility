---
name: daily-utility-knasoftware-catalog
description: Prepare, publish, and verify a Daily Utility product page on knasoftware.com with reciprocal sales-channel links and truthful SEO/AI-discovery evidence; use during an approved release or an explicitly approved backfill, not product builds or community promotion.
---

# Daily Utility KNA Software Catalog

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved release copy, `products/<product-id>/marketing/knasoftware-listing.md`, both sales listings, and current publication evidence. Continue only when either:

- the issue is `APPROVED_RELEASE` for a simultaneous release and the exact KNA page fields, both sales URLs, and both reciprocal-link pairs were reviewed; or
- the issue is `APPROVED_RELEASE` for an explicit Gumroad-first release and the exact first-stage KNA fields, Gumroad URL, Gumroad reciprocal-link pair, and truthful Lemon Squeezy-pending copy were reviewed; or
- the issue is `APPROVED_REMAINING_CHANNELS` and either the exact Lemon Squeezy URL was reviewed or the approved `publish-bootstrap` has just produced a URL matching the reviewed storefront host and `/checkout/buy/` constraint; in both cases the KNA purchase anchor, every other KNA field, and the Lemon Squeezy reciprocal-link destination must have been reviewed; or
- the product is already `PUBLISHED` and the user explicitly approved a backfill with the exact page copy and sales-listing change.

Use the Google-authenticated admin UI through the Codex desktop browser. Never request, expose, or store Google credentials, Firebase tokens, cookies, customer data, or private demo credentials. Stop on missing admin access, CAPTCHA, a material form change, an unreviewed destination, or a mismatch in price, version, support, or product claims.

Before using the live CMS, read [references/admin-and-seo.md](references/admin-and-seo.md) and re-check the visible form because the site can change independently of this repository.

## Prepare

- Treat `products/<product-id>/marketing/knasoftware-listing.md` as the release-review source of truth. It must define every CMS field needed for the applicable checkpoint. A simultaneous release includes both purchase anchors and reverse links. A Gumroad-first first stage includes the exact Gumroad pair and explicit Lemon Squeezy-pending copy, with no placeholder or inactive Lemon Squeezy purchase link. A remaining-channel `publish-bootstrap` review fixes the Lemon Squeezy purchase anchor and all page fields while declaring the approved Live draft and bounded generated-URL rule; persist the exact URL after bootstrap and before editing the live CMS.
- Use the approved product name, stable lowercase slug, version, price, media, factual feature set, support terms, and limitations.
- Write a first-party KNA description that represents the same product facts without copying either sales listing word-for-word.
- For paid utilities, keep the KNA distribution mode truthful. Do not disguise a purchase link as documentation. Put every active approved sales URL behind its own descriptive purchase anchor. During a Gumroad-first partial release, show Gumroad only and state that Lemon Squeezy is pending; add the Lemon Squeezy anchor only after its remaining-channel approval.
- Keep the KNA URL self-canonical. Reciprocal links connect the entities; a canonical override must not point the KNA page to either sales channel.
- Use descriptive anchors in both directions for every active channel: KNA to the sales listing and that listing back to the exact KNA product page. Add the Lemon Squeezy pair only at the applicable checkpoint.
- Treat demo usernames and passwords as public. Enter only sanitized, intentionally public demo credentials, or leave them empty.

## Publish and verify

1. Create or update the KNA product as a draft and inspect every field before publishing. For `publish-bootstrap`, do not add the Lemon Squeezy purchase link until the exact generated URL has passed its host/path and checkout checks.
2. Verify every sales listing active in the applicable checkpoint is live and its reverse-link destination exactly matches the planned KNA URL. The URL may not resolve publicly while the KNA page is still a draft.
3. Publish the KNA page once the reviewed data and all destinations remain exact.
4. Verify the public KNA URL, catalog visibility, name, version, shared price, media, Markdown, support and limitation facts, plus every outbound sales link and backlink required by the applicable checkpoint.
5. Verify title, description, self-canonical URL, OG image, crawlability, and sitemap membership. Check structured data and AI-readable discovery files when available.
6. Record the KNA URL, active sales URLs, applicable link-verification timestamps, and any SEO/AI-discovery gaps in the focused release evidence. Gumroad-first partial evidence must declare Lemon Squeezy pending; completed evidence must contain both sales channels and all four directions.

Do not claim ranking improvement, structured-data coverage, or AI discoverability merely because reciprocal links exist. Missing JSON-LD, sitemap coverage, or a useful `llms.txt` is a platform gap to report, not evidence to fabricate. Do not mark the product `PUBLISHED` until the release checks required by `AGENTS.md` pass.
