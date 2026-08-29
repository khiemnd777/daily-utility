# KNA Software listing: CUBE LUT Pack Preflight

- Status: `DRAFT — DO NOT PUBLISH`
- Factory source issue: [#36](https://github.com/khiemnd777/daily-utility/issues/36)
- Planned Gumroad listing: <https://khiemnd2.gumroad.com/l/cube-lut-pack-preflight>
- Planned canonical KNA URL: <https://knasoftware.com/sources/cube-lut-pack-preflight>

This file is the exact release-review source for every KNA CMS field and both reciprocal-link destinations. Create the product as a draft first and publish only after issue #36 reaches `APPROVED_RELEASE`. Stop if the live form, product facts, artifact, price, or destinations differ.

## Taxonomy prerequisite

Reuse an exact active slug if it already exists. Create only missing records during approved publication; stop for review if an existing slug has different values.

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
| CUBE LUT | `cube-lut` | Technology | `120` | Yes |
| Offline | `offline` | Feature | `100` | Yes |
| Gumroad | `gumroad` | Platform | `110` | Yes |

## A · Basic information

| CMS field | Exact value |
| --- | --- |
| Product name | CUBE LUT Pack Preflight |
| SKU | `KNA-CUBE-LUT-PACK-PREFLIGHT` |
| Slug | `cube-lut-pack-preflight` |
| Category | Seller QA Utilities (`seller-qa-utilities`) |
| Short description | Offline release QA for CUBE LUT sellers: validate structure, duplicate transforms, mixed grids, and path collisions before launch. |
| Version | `1.0.0` |
| Order | `110` |
| Featured | Yes |
| Tags | JavaScript, CUBE LUT, Offline, Gumroad |

### Tech stack

```text
HTML5
CSS3
JavaScript
JSZip
Web Crypto API
```

## B · Distribution

| CMS field | Exact value |
| --- | --- |
| Mode | Contact |
| Display price | `$19 USD · Buy on Gumroad` |
| Preferred contact channel | Email |
| Message template | `I have a question about {{productName}} ({{sku}}).` |
| Documentation URL | `https://github.com/khiemnd777/daily-utility/blob/main/products/cube-lut-pack-preflight/README.md` |

If the CMS still has no external-purchase field, keep Gumroad out of the Documentation field. The direct buyer-visible purchase CTA is present near the top and bottom of the detailed Markdown.

## C · Media

| CMS field | Exact value |
| --- | --- |
| Thumbnail URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/gumroad-workflow.png` |
| Video URL | Leave empty |

### Gallery URLs, in order

```text
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/gumroad-results.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/gumroad-report-preview.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/gumroad-contents.png
```

## D · Demo

Leave Live demo URL, Admin demo URL, Demo username, Demo password, and Demo instructions empty. This is an offline downloadable utility, not a hosted application. Never enter buyer or admin credentials.

## E · Content

### Detailed Markdown

```markdown
## Audit the LUT pack before buyers install it

CUBE LUT Pack Preflight is an offline release-QA utility from KNA Software for independent creators who sell ZIP packs of original CUBE LUT files. It scans one release ZIP or direct CUBE selection locally and produces file-level evidence for structural blockers and bundle-hygiene findings.

**Version 1.0.0 · $19 USD · Prepared August 29, 2026**

[Buy CUBE LUT Pack Preflight on Gumroad — $19 USD](https://khiemnd2.gumroad.com/l/cube-lut-pack-preflight)

### Who it is for

Use it before publishing or updating a LUT pack when opening every file individually is slow and sampling can miss a broken table, duplicate transform, repeated title, mixed grid, or filename collision.

### What the scan reports

- standalone 1D/3D CUBE declaration syntax, order, domains, values, and exact table row counts;
- output values outside the common 0–1 range for manual review;
- exact byte duplicates and equivalent parsed table payloads;
- duplicate titles attached to distinct LUT data;
- mixed LUT types or declared grids;
- case-insensitive path collisions; and
- non-CUBE release files to confirm as intentional buyer content.

Export the result as CSV or a self-contained HTML evidence report.

### Private, local workflow

Unzip the download and open `index.html` in a current desktop browser. Parsing and SHA-256 hashing stay on the device. There is no upload, account, API key, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Supported inputs and limits

- one ZIP up to 100 MB compressed, or up to 100 direct CUBE LUTs;
- up to 150 MB expanded release content;
- up to 20 MB per LUT and 1,000 archive entries;
- paths up to 240 characters; and
- current desktop browsers.

### Important limits

This is deterministic structural preflight, not rendering or a guarantee of color quality, creative intent, or application/device compatibility. It does not repair, resample, convert, install, inspect color profiles, review licenses, validate other LUT formats, or recurse into nested archives. Test representative LUTs in every environment you claim to support.

CUBE LUT Pack Preflight is not affiliated with or endorsed by Adobe, Blackmagic Design, Gumroad, or their respective owners.

### Package and support

The purchase includes one versioned offline browser ZIP, buyer instructions, and third-party notices under a single-buyer / single-business license with unlimited internal use. Buyers should reply to their Gumroad receipt for purchase access or documented core-functionality support. Normal response target: two business days. The seven-day limited functionality guarantee and exclusions are the terms shown on Gumroad and the purchase receipt.

[Get CUBE LUT Pack Preflight from the official Gumroad listing](https://khiemnd2.gumroad.com/l/cube-lut-pack-preflight)
```

### Features, one per line

```text
Batch-scan one ZIP or up to 100 direct CUBE LUT files
Validate a documented standalone 1D/3D CUBE structure profile
Detect exact duplicates, equivalent payloads, repeated titles, and mixed grids
Flag case-insensitive path collisions and non-CUBE release files
Export CSV and self-contained HTML evidence reports
Run locally with no upload, account, analytics, or network request
```

### Package contents

```text
CUBE LUT Pack Preflight v1.0.0 offline browser utility
Buyer README and usage instructions
Third-party dependency notices and license text
CSV and self-contained HTML report export
Single-buyer / single-business license with unlimited internal use
```

### System requirements

```text
Current desktop browser with JavaScript, File API, and Web Crypto support
Ability to unzip a standard ZIP archive and open index.html locally
Maximum scan: one 100 MB ZIP, 150 MB expanded content, 100 LUTs, 20 MB per LUT
No account, installer, API key, or internet connection required after download
```

### Changelog

```text
1.0.0 — Initial release with offline ZIP/CUBE scanning, deterministic structure checks, duplicate and collision detection, and CSV/HTML evidence reports.
```

## F · SEO

| CMS field | Exact value |
| --- | --- |
| SEO title | CUBE LUT Pack Preflight — Offline QA for LUT Sellers |
| SEO description | Scan CUBE LUT packs locally for broken tables, duplicate transforms, mixed grids, and filename collisions. Offline v1.0.0 for Gumroad sellers. $19 USD. |
| Canonical URL override | Leave empty; preserve the self-canonical KNA URL |
| OG image URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/gumroad-workflow.png` |

## G · Publication

Create the product as `Draft`. Do not select `Published` during preparation or release review.

## Reciprocal links

- KNA → Gumroad: `Buy CUBE LUT Pack Preflight on Gumroad — $19 USD` → `https://khiemnd2.gumroad.com/l/cube-lut-pack-preflight`
- Gumroad → KNA: `official KNA Software page for CUBE LUT Pack Preflight` → `https://knasoftware.com/sources/cube-lut-pack-preflight`

## Action-time sequence and evidence

1. Re-verify issue #36 and the manifest are `APPROVED_RELEASE`, and the reviewed ZIP checksum, price, copy, support terms, and destinations are unchanged.
2. Re-check the live KNA form and taxonomy; create only exact missing taxonomy records.
3. Create the KNA product as Draft and inspect every field without publishing.
4. Create the Gumroad draft, upload only the reviewed ZIP, and apply the exact listing, refund, media, price, and backlink fields.
5. Publish both reviewed destinations only under the verified release approval.
6. Verify Gumroad price, buyer delivery, support route, downloaded checksum, public KNA page, direct purchase CTA, reciprocal links, self-canonical URL, metadata, OG image, crawlability, sitemap membership, structured data, and `llms.txt` behavior.
7. Record supported evidence and platform gaps without claiming ranking improvement.
