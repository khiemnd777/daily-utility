---
name: daily-utility-knasoftware-catalog
description: Prepare, publish, and verify a Daily Utility product page on knasoftware.com with reciprocal sales-channel links and truthful SEO/AI-discovery evidence; use during an approved release or an explicitly approved backfill, not product builds or community promotion.
---

# Daily Utility KNA Software Catalog

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved release copy, `products/<product-id>/marketing/knasoftware-listing.md`, both sales listings, and current publication evidence. Continue only when either:

- the issue is `APPROVED_RELEASE` and the exact KNA page fields, both sales URLs, and both reciprocal-link pairs were reviewed; or
- the product is already `PUBLISHED` and the user explicitly approved a backfill with the exact page copy and sales-listing change.

Use the Google-authenticated admin UI through the Codex desktop browser. Never request, expose, or store Google credentials, Firebase tokens, cookies, customer data, or private demo credentials. Stop on missing admin access, CAPTCHA, a material form change, an unreviewed destination, or a mismatch in price, version, support, or product claims.

Before using the live CMS, read [references/admin-and-seo.md](references/admin-and-seo.md) and re-check the visible form because the site can change independently of this repository.

## Prepare

- Treat `products/<product-id>/marketing/knasoftware-listing.md` as the release-review source of truth. It must define every CMS field needed for publication plus the Gumroad and Lemon Squeezy purchase anchors and both sales-channel reverse links.
- Use the approved product name, stable lowercase slug, version, price, media, factual feature set, support terms, and limitations.
- Write a first-party KNA description that represents the same product facts without copying either sales listing word-for-word.
- For paid utilities, keep the KNA distribution mode truthful. Do not disguise a purchase link as documentation. Put both approved sales URLs behind separate descriptive purchase anchors in Markdown until the CMS provides dedicated external-purchase fields.
- Keep the KNA URL self-canonical. Reciprocal links connect the entities; a canonical override must not point the KNA page to either sales channel.
- Use descriptive anchors in both directions: KNA to Gumroad and Lemon Squeezy, and each sales listing back to the exact KNA product page.
- Treat demo usernames and passwords as public. Enter only sanitized, intentionally public demo credentials, or leave them empty.

## Publish and verify

1. Create or update the KNA product as a draft and inspect every field before publishing.
2. Verify both approved sales listings are live and each reverse-link destination exactly matches the planned KNA URL. The URL may not resolve publicly while the KNA page is still a draft.
3. Publish the KNA page once the reviewed data and all destinations remain exact.
4. Verify the public KNA URL, catalog visibility, name, version, shared price, media, Markdown, support and limitation facts, both outbound sales links, and both sales-channel backlinks.
5. Verify title, description, self-canonical URL, OG image, crawlability, and sitemap membership. Check structured data and AI-readable discovery files when available.
6. Record the KNA URL, both sales URLs, all four link-verification timestamps, and any SEO/AI-discovery gaps in the focused release evidence.

Do not claim ranking improvement, structured-data coverage, or AI discoverability merely because reciprocal links exist. Missing JSON-LD, sitemap coverage, or a useful `llms.txt` is a platform gap to report, not evidence to fabricate. Do not mark the product `PUBLISHED` until the release checks required by `AGENTS.md` pass.
