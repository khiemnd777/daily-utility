# KNA Software backfill: Template Delivery PDF Checker

- Status: `VERIFIED_LIVE`
- Live KNA or Gumroad changes performed: exact KNA page published and exact reciprocal Gumroad backlink added on August 27, 2026
- Factory source issue: [#3](https://github.com/khiemnd777/daily-utility/issues/3), verified `PUBLISHED`
- Gumroad listing: <https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker>
- Live KNA URL: <https://knasoftware.com/sources/template-delivery-pdf-checker>

This file is the exact review source for the KNA CMS page, the required taxonomy, and the reciprocal Gumroad backlink. Stop if the live form, price, version, product facts, or either destination differs at action time.

## Taxonomy prerequisite

The KNA catalog, categories, and tags were empty when re-checked on August 27, 2026. Do not create these records during preparation. During an explicitly approved live backfill, create an item only if its slug is absent; if a matching slug exists with different values, stop for review.

### Category

| Field | Exact value |
| --- | --- |
| Name | Seller QA Utilities |
| Slug | `seller-qa-utilities` |
| Icon / emoji | `✓` |
| Description | Offline quality-assurance tools for digital-product sellers. |
| Order | `100` |
| Active | Yes |

### Tags

| Name | Slug | Type | Order | Active |
| --- | --- | --- | --- | --- |
| JavaScript | `javascript` | Technology | `100` | Yes |
| PDF | `pdf` | Technology | `120` | Yes |
| Offline | `offline` | Feature | `100` | Yes |
| Canva | `canva` | Platform | `90` | Yes |
| Etsy | `etsy` | Platform | `100` | Yes |
| Gumroad | `gumroad` | Platform | `110` | Yes |

## A · Basic information

| CMS field | Exact value |
| --- | --- |
| Product name | Template Delivery PDF Checker |
| SKU | `KNA-TEMPLATE-DELIVERY-PDF-CHECKER` |
| Slug | `template-delivery-pdf-checker` |
| Category | Seller QA Utilities (`seller-qa-utilities`) |
| Short description | Offline QA for Canva delivery PDFs: inspect clickable links, risky share modes, and button placement before buyers receive the file. |
| Version | `1.0.0` |
| Order | `110` |
| Featured | Yes |
| Tags | JavaScript, PDF, Offline, Canva, Etsy, Gumroad |

### Tech stack

```text
HTML5
CSS3
JavaScript
PDF.js
```

## B · Distribution

| CMS field | Exact value |
| --- | --- |
| Mode | Contact |
| Display price | `$12 USD · Buy on Gumroad` |
| Preferred contact channel | Email |
| Message template | `I have a question about {{productName}} ({{sku}}).` |
| Documentation URL | `https://github.com/khiemnd777/daily-utility/blob/main/products/template-delivery-pdf-checker/README.md` |

The CMS currently has no external-purchase field. The primary public Contact CTA may still read “Liên hệ để mua”; the direct, buyer-visible purchase CTA is therefore included near the top and bottom of the detailed Markdown. Do not place the Gumroad URL in the Documentation field.

## C · Media

| CMS field | Exact value |
| --- | --- |
| Thumbnail URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-thumbnail.png` |
| Video URL | Leave empty |

### Gallery URLs, in order

```text
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-cover.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-workflow.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-results.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-report-preview.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-contents.png
```

## D · Demo

Leave Live demo URL, Admin demo URL, Demo username, Demo password, and Demo instructions empty. This is an offline downloadable utility, not a hosted application. Never enter private buyer or admin credentials.

## E · Content

### Detailed Markdown

```markdown
## Check the delivery PDF before the buyer discovers a broken link

Template Delivery PDF Checker is an offline QA utility from KNA Software for Etsy and Gumroad sellers who deliver editable Canva templates through downloadable PDF files. It inventories clickable annotations, shows where each clickable area sits on the page, and flags risky or malformed targets before the file reaches a customer.

**Version 1.0.0 · $12 USD · Updated August 27, 2026**

[Buy Template Delivery PDF Checker on Gumroad — $12 USD](https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker)

### Who it is for

Use it before a new listing, template update, or delivery-PDF replacement when a visually correct PDF still needs a final link and button-placement check.

### What the review surfaces

- PDFs with no clickable-link annotations;
- likely Canva template links and risky view, edit, or share modes;
- unrecognized Canva URLs that need manual review;
- duplicate, missing, malformed, non-HTTPS, and active-content targets; and
- clickable rectangles positioned in the wrong part of a page.

Every detected link includes its page and category. The result can be exported as Markdown or CSV for release records.

### Private, local workflow

Unzip the download and open `index.html` in a current desktop browser. The PDF and extracted URLs stay on the device. There is no upload, account, API key, subscription, analytics, telemetry, or outbound network request.

### Supported inputs and limits

- PDF files up to 25 MB;
- up to 200 pages;
- up to 2,000 clickable links; and
- current desktop Chrome, Edge, Firefox, and Safari.

### Important limits

The utility reads PDF link annotations and classifies URL patterns. It does not test live URL availability, Canva permissions, licensing, QR codes, OCR-only links, password-protected PDFs, or marketplace uploads. Results are conservative QA guidance, not a guarantee that a third-party link or service will remain available.

Template Delivery PDF Checker is not affiliated with or endorsed by Canva, Etsy, Gumroad, or their respective owners. Redistribution, resale, sharing, repackaging, or hosting the download for third parties is not allowed.

### Package and support

The purchase includes one versioned offline browser ZIP, buyer instructions, and third-party notices under a single-buyer / single-business license with unlimited internal use. Buyers should reply to their Gumroad receipt for purchase access or documented core-functionality support. Normal response target: two business days. The seven-day limited functionality guarantee and exclusions are the terms shown on Gumroad and the purchase receipt.

[Get Template Delivery PDF Checker from the official Gumroad listing](https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker)
```

### Features, one per line

```text
Inventory clickable PDF annotations with page numbers and target categories
Classify Canva template-like, view, edit, share, and unrecognized URL patterns
Flag duplicate, malformed, non-HTTPS, missing, and active-content targets
Overlay every detected clickable rectangle for visual placement review
Export Markdown and CSV QA reports
Run locally with no upload, account, analytics, or network request
```

### Package contents

```text
Template Delivery PDF Checker v1.0.0 offline browser utility
Buyer README and usage instructions
Third-party dependency notice and PDF.js license text
Markdown and CSV report export
Single-buyer / single-business license with unlimited internal use
```

### System requirements

```text
Current desktop Chrome, Edge, Firefox, or Safari
Ability to unzip a standard ZIP archive and open index.html locally
Maximum input: 25 MB, 200 pages, and 2,000 clickable links
No account, installer, API key, or internet connection required after download
```

### Changelog

```text
1.0.0 — Initial published release with offline PDF annotation parsing, Canva link-mode classification, clickable-area overlays, bounded failure handling, and Markdown/CSV reports.
```

## F · SEO

| CMS field | Exact value |
| --- | --- |
| SEO title | Template Delivery PDF Checker — Offline Canva Link QA |
| SEO description | Check Canva delivery PDF links, share modes, and clickable areas offline before buyers receive the file. Version 1.0.0 for Etsy and Gumroad sellers. $12 USD. |
| Canonical URL override | Leave empty; preserve the self-canonical KNA URL |
| OG image URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/template-delivery-pdf-checker/marketing/gumroad-cover.png` |

## G · Publication

Create the product as `Draft`. Do not select `Published` during the preparation or review phase.

## Reciprocal Gumroad backlink

Update the Gumroad description by inserting this exact paragraph immediately after the first product-identification paragraph and before “How it works”:

```markdown
For a first-party overview of capabilities, supported limits, privacy behavior, and updates, see the [official KNA Software page for Template Delivery PDF Checker](https://knasoftware.com/sources/template-delivery-pdf-checker).
```

Expected link directions after the approved live backfill:

- KNA → Gumroad: `Buy Template Delivery PDF Checker on Gumroad — $12 USD` → `https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker`
- Gumroad → KNA: `official KNA Software page for Template Delivery PDF Checker` → `https://knasoftware.com/sources/template-delivery-pdf-checker`

## Action-time sequence and evidence

1. Re-verify issue #3 and the manifest remain `PUBLISHED`, the Gumroad price is $12, and version 1.0.0 is unchanged.
2. Re-check the live form and taxonomy; create only the exact missing taxonomy records above.
3. Create the KNA page as Draft and inspect every field without publishing.
4. Add the exact Gumroad reverse-link paragraph and verify its destination matches the planned KNA URL.
5. Publish the reviewed KNA draft only under explicit backfill approval.
6. Verify the public KNA page, direct Gumroad CTA, Gumroad backlink, price/version/support facts, self-canonical URL, metadata, OG image, crawlability, sitemap membership, JSON-LD if available, and `/llms.txt` behavior.
7. Record the verification timestamp and any unsupported SEO/AI-discovery surfaces without claiming ranking improvement.

## Live verification evidence

Verified at `2026-08-27 20:56 ICT (UTC+07:00)` after the exact approved backfill.

### Publication and taxonomy

- Factory issue #3 and the local manifest were re-verified as `PUBLISHED` immediately before the live change.
- PR #19 was merged before publication. The KNA CMS record `ZXOlGsBbh9z19WWp8PX0` is published at the live URL above.
- The active `seller-qa-utilities` category and the exact JavaScript, PDF, Offline, Canva, Etsy, and Gumroad tag records were created before the product draft. The public page renders the Seller QA Utilities category.
- The live page renders version `1.0.0`, `$12 USD · Buy on Gumroad`, the approved Contact CTA, approved copy, media, features, package contents, requirements, and documentation link.

### Reciprocal links

- KNA → Gumroad: the buyer-visible anchor `Buy Template Delivery PDF Checker on Gumroad — $12 USD` resolves to `https://khiemnd2.gumroad.com/l/template-delivery-pdf-checker` with `rel="noopener noreferrer"`.
- Gumroad → KNA: the buyer-visible anchor `official KNA Software page for Template Delivery PDF Checker` resolves to the live KNA URL with `rel="noopener noreferrer nofollow"`.
- The Gumroad public page still renders `$12` and version `1.0.0`; the product file, delivery settings, refund policy, and support terms were not changed.
- The reciprocal links improve buyer navigation and corroborate the first-party product identity. No ranking improvement is claimed, and Gumroad's `nofollow` limits the reverse link's direct search-ranking signal.

### SEO and AI-discovery verification

- The JavaScript-rendered page sets the approved title, meta description, self-canonical URL, Open Graph title/description, and approved OG image.
- `robots.txt` allows `/`, disallows `/admin`, and declares `https://knasoftware.com/sitemap.xml`.
- Current platform gaps: `sitemap.xml` does not include this product URL; the page emits no Product or SoftwareApplication JSON-LD; `/llms.txt` returns the generic SPA HTML shell; and the initial non-JavaScript HTML contains the generic CodeChill title/description with an empty app root. Crawlers or AI agents that do not render JavaScript therefore receive weaker product evidence.
