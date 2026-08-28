---
name: daily-utility-knasoftware-catalog
description: Prepare, publish, and verify a Daily Utility product page on knasoftware.com with reciprocal sales-channel links and truthful SEO/AI-discovery evidence; use during an approved release or an explicitly approved backfill, not product builds or community promotion.
---

# Daily Utility KNA Software Catalog

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved release copy, `products/<product-id>/marketing/knasoftware-listing.md`, sales listing, and current publication evidence. Continue only when either:

- the issue is `APPROVED_RELEASE` and the exact KNA page fields plus both backlink destinations were reviewed; or
- the product is already `PUBLISHED` and the user explicitly approved a backfill with the exact page copy and sales-listing change.

Use the Google-authenticated admin UI through the Codex desktop browser. Never request, expose, or store Google credentials, Firebase tokens, cookies, customer data, or private demo credentials. Stop on missing admin access, CAPTCHA, a material form change, an unreviewed destination, or a mismatch in price, version, support, or product claims.

Before using the live CMS, read [references/admin-and-seo.md](references/admin-and-seo.md) and re-check the visible form because the site can change independently of this repository.

## Prepare

- Treat `products/<product-id>/marketing/knasoftware-listing.md` as the release-review source of truth. It must define every CMS field needed for publication plus both reciprocal-link anchors and destinations.
- Use the approved product name, stable lowercase slug, version, price, media, factual feature set, support terms, and limitations.
- Write a first-party KNA description that represents the same product facts without copying the Gumroad listing word-for-word.
- For a paid Gumroad utility, keep the KNA distribution mode truthful. Do not disguise a purchase link as documentation. Put the approved Gumroad URL behind a clear purchase anchor in Markdown until the CMS provides a dedicated external-purchase field.
- Keep the KNA URL self-canonical. Reciprocal links connect the entities; a canonical override must not point the KNA page to Gumroad.
- Use descriptive anchors in both directions: KNA to every approved active sales listing, and each sales listing back to the exact KNA product page.
- Treat demo usernames and passwords as public. Enter only sanitized, intentionally public demo credentials, or leave them empty.

## Publish and verify

1. Create or update the KNA product as a draft and inspect every field before publishing.
2. Verify the approved sales listing is live and its reverse-link destination exactly matches the planned KNA URL. The URL may not resolve publicly while the KNA page is still a draft.
3. Publish the KNA page once the reviewed data and both destinations remain exact.
4. Verify the public KNA URL, catalog visibility, name, version, price, media, Markdown, support and limitation facts, outbound sales link, and that both backlink destinations now resolve publicly.
5. Verify title, description, self-canonical URL, OG image, crawlability, and sitemap membership. Check structured data and AI-readable discovery files when available.
6. Record the KNA URL, both backlink destinations, verification timestamp, and any SEO/AI-discovery gaps in the focused release evidence.

Do not claim ranking improvement, structured-data coverage, or AI discoverability merely because reciprocal links exist. Missing JSON-LD, sitemap coverage, or a useful `llms.txt` is a platform gap to report, not evidence to fabricate. Do not mark the product `PUBLISHED` until the release checks required by `AGENTS.md` pass.
