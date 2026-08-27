# KNA Software backfill: SVG Bundle Preflight

- Status: `PREPARED_FOR_REVIEW`
- Live KNA or Gumroad changes performed while preparing this file: none
- Factory source issue: [#10](https://github.com/khiemnd777/daily-utility/issues/10), verified `PUBLISHED`
- Gumroad listing: <https://khiemnd2.gumroad.com/l/svg-bundle-preflight>
- Planned KNA URL: <https://knasoftware.com/sources/svg-bundle-preflight>

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
| SVG | `svg` | Technology | `110` | Yes |
| Offline | `offline` | Feature | `100` | Yes |
| Etsy | `etsy` | Platform | `100` | Yes |
| Gumroad | `gumroad` | Platform | `110` | Yes |

## A · Basic information

| CMS field | Exact value |
| --- | --- |
| Product name | SVG Bundle Preflight |
| SKU | `KNA-SVG-BUNDLE-PREFLIGHT` |
| Slug | `svg-bundle-preflight` |
| Category | Seller QA Utilities (`seller-qa-utilities`) |
| Short description | Offline batch QA for SVG sellers: scan one ZIP for import blockers, duplicate files, and filename collisions before release. |
| Version | `1.0.0` |
| Order | `100` |
| Featured | Yes |
| Tags | JavaScript, SVG, Offline, Etsy, Gumroad |

### Tech stack

```text
HTML5
CSS3
JavaScript
JSZip
Saxes
Web Crypto API
```

## B · Distribution

| CMS field | Exact value |
| --- | --- |
| Mode | Contact |
| Display price | `$15 USD · Buy on Gumroad` |
| Preferred contact channel | Email |
| Message template | `I have a question about {{productName}} ({{sku}}).` |
| Documentation URL | `https://github.com/khiemnd777/daily-utility/blob/main/products/svg-bundle-preflight/README.md` |

The CMS currently has no external-purchase field. The primary public Contact CTA may still read “Liên hệ để mua”; the direct, buyer-visible purchase CTA is therefore included near the top and bottom of the detailed Markdown. Do not place the Gumroad URL in the Documentation field.

## C · Media

| CMS field | Exact value |
| --- | --- |
| Thumbnail URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/svg-bundle-preflight/marketing/gumroad-workflow.png` |
| Video URL | Leave empty |

### Gallery URLs, in order

```text
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/svg-bundle-preflight/marketing/gumroad-results.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/svg-bundle-preflight/marketing/gumroad-report-preview.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/svg-bundle-preflight/marketing/gumroad-contents.png
```

## D · Demo

Leave Live demo URL, Admin demo URL, Demo username, Demo password, and Demo instructions empty. This is an offline downloadable utility, not a hosted application. Never enter private buyer or admin credentials.

## E · Content

### Detailed Markdown

```markdown
## Release an SVG bundle with evidence, not guesswork

SVG Bundle Preflight is an offline batch QA utility from KNA Software for Etsy and Gumroad sellers who package original SVG cut-file bundles. It scans one ZIP or a direct SVG selection locally, then produces a reviewable inventory of compatibility blockers and bundle-hygiene warnings.

**Version 1.0.0 · $15 USD · Updated August 27, 2026**

[Buy SVG Bundle Preflight on Gumroad — $15 USD](https://khiemnd2.gumroad.com/l/svg-bundle-preflight)

### Who it is for

Use it before publishing or updating a bundle when opening hundreds of SVG files one at a time is too slow and sampling can miss a broken file, an exact duplicate, or a filename collision.

### What the scan reports

- malformed XML and files without an SVG root;
- missing or invalid sizing metadata;
- live text, clipping paths, pattern fills, and gradients;
- linked resources, embedded bitmap images, scripts, and active URL references;
- exact duplicate file bytes; and
- paths that collide on case-insensitive systems.

The result can be exported as CSV or a self-contained HTML evidence report for release records.

### Private, local workflow

Unzip the download and open `index.html` in a current desktop browser. Parsing and SHA-256 hashing stay on the device. There is no upload, account, API key, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Supported inputs and limits

- one ZIP up to 50 MB compressed;
- up to 100 MB of expanded SVG content;
- up to 500 SVG files;
- up to 2 MB per SVG;
- paths up to 240 characters; and
- current desktop browsers.

### Important limits

This is static preflight, not automatic repair or a cutting guarantee. It does not trace raster artwork, weld paths, validate DXF/EPS/PNG, recurse into nested archives, test physical cuts, automate Design Space, or provide licensing or legal advice. Import representative files into the target software and perform a real test cut before release.

SVG Bundle Preflight is not affiliated with or endorsed by Cricut, Etsy, Gumroad, or their respective owners.

### Package and support

The purchase includes one versioned offline browser ZIP, buyer instructions, and third-party notices under a single-buyer / single-business license with unlimited internal use. Buyers should reply to their Gumroad receipt for purchase access or documented core-functionality support. Normal response target: two business days. The seven-day limited functionality guarantee and exclusions are the terms shown on Gumroad and the purchase receipt.

[Get SVG Bundle Preflight from the official Gumroad listing](https://khiemnd2.gumroad.com/l/svg-bundle-preflight)
```

### Features, one per line

```text
Batch-scan one ZIP or a direct selection of SVG files
Flag documented SVG import blockers with file-level evidence
Detect exact duplicate bytes and case-insensitive path collisions
Export CSV and self-contained HTML release reports
Run locally with no upload, account, analytics, or network request
Fail safely on damaged, encrypted, unsafe, or over-limit inputs
```

### Package contents

```text
SVG Bundle Preflight v1.0.0 offline browser utility
Buyer README and usage instructions
Third-party dependency notices and license texts
CSV and self-contained HTML report export
Single-buyer / single-business license with unlimited internal use
```

### System requirements

```text
Current desktop browser with JavaScript and File API support
Ability to unzip a standard ZIP archive and open index.html locally
Maximum scan: one 50 MB ZIP, 100 MB expanded SVG content, 500 SVG files, 2 MB per SVG
No account, installer, API key, or internet connection required after download
```

### Changelog

```text
1.0.0 — Initial published release with offline ZIP/SVG scanning, deterministic blocker and warning rules, duplicate and path-collision detection, and CSV/HTML reports.
```

## F · SEO

| CMS field | Exact value |
| --- | --- |
| SEO title | SVG Bundle Preflight — Offline QA for SVG Sellers |
| SEO description | Scan an SVG ZIP locally for import blockers, duplicate files, and filename collisions. Version 1.0.0 for Etsy and Gumroad sellers. $15 USD. |
| Canonical URL override | Leave empty; preserve the self-canonical KNA URL |
| OG image URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/svg-bundle-preflight/marketing/gumroad-workflow.png` |

## G · Publication

Create the product as `Draft`. Do not select `Published` during the preparation or review phase.

## Reciprocal Gumroad backlink

Update the Gumroad description by inserting this exact paragraph immediately after the first product-identification paragraph and before “How it works”:

```markdown
For a first-party overview of capabilities, supported limits, privacy behavior, and updates, see the [official KNA Software page for SVG Bundle Preflight](https://knasoftware.com/sources/svg-bundle-preflight).
```

Expected link directions after the approved live backfill:

- KNA → Gumroad: `Buy SVG Bundle Preflight on Gumroad — $15 USD` → `https://khiemnd2.gumroad.com/l/svg-bundle-preflight`
- Gumroad → KNA: `official KNA Software page for SVG Bundle Preflight` → `https://knasoftware.com/sources/svg-bundle-preflight`

## Action-time sequence and evidence

1. Re-verify issue #10 and the manifest remain `PUBLISHED`, the Gumroad price is $15, and version 1.0.0 is unchanged.
2. Re-check the live form and taxonomy; create only the exact missing taxonomy records above.
3. Create the KNA page as Draft and inspect every field without publishing.
4. Add the exact Gumroad reverse-link paragraph and verify its destination matches the planned KNA URL.
5. Publish the reviewed KNA draft only under explicit backfill approval.
6. Verify the public KNA page, direct Gumroad CTA, Gumroad backlink, price/version/support facts, self-canonical URL, metadata, OG image, crawlability, sitemap membership, JSON-LD if available, and `/llms.txt` behavior.
7. Record the verification timestamp and any unsupported SEO/AI-discovery surfaces without claiming ranking improvement.
