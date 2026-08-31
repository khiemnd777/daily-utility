# KNA Software listing: XMP Preset Pack Preflight

- Status: `DRAFT_REVIEW`
- Factory source issue: [#45](https://github.com/khiemnd777/daily-utility/issues/45)
- Planned Gumroad listing: <https://khiemnd2.gumroad.com/l/xmp-preset-pack-preflight>
- Planned self-canonical KNA URL: <https://knasoftware.com/sources/xmp-preset-pack-preflight>

This file is the exact release-review source for every KNA CMS field and both reciprocal-link destinations. Create the product as a draft first and publish only after issue #45 reaches `APPROVED_RELEASE`. Stop if the live form, product facts, artifact, price, support terms, or destinations differ.

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
| XMP Presets | `xmp-presets` | Technology | `140` | Yes |
| Offline | `offline` | Feature | `100` | Yes |
| Gumroad | `gumroad` | Platform | `110` | Yes |

## A · Basic information

| CMS field | Exact value |
| --- | --- |
| Product name | XMP Preset Pack Preflight |
| SKU | `KNA-XMP-PRESET-PACK-PREFLIGHT` |
| Slug | `xmp-preset-pack-preflight` |
| Category | Seller QA Utilities (`seller-qa-utilities`) |
| Short description | Offline release QA for Lightroom and Camera Raw preset sellers: find malformed XMP, identity collisions, duplicate settings, profile dependencies, and bundle mistakes before launch. |
| Version | `1.0.0` |
| Order | `130` |
| Featured | Yes |
| Tags | JavaScript, XMP Presets, Offline, Gumroad |

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
| Documentation URL | `https://github.com/khiemnd777/daily-utility/blob/main/products/xmp-preset-pack-preflight/README.md` |

If the CMS still has no external-purchase field, keep Gumroad out of the Documentation field. The direct buyer-visible purchase CTA appears near the top and bottom of the detailed Markdown.

## C · Media

| CMS field | Exact value |
| --- | --- |
| Thumbnail URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/gumroad-workflow.png` |
| Video URL | Leave empty |

### Gallery URLs, in order

```text
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/gumroad-results.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/gumroad-report-preview.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/gumroad-contents.png
```

## D · Demo

Leave Live demo URL, Admin demo URL, Demo username, Demo password, and Demo instructions empty. This is an offline downloadable utility, not a hosted application. Never enter buyer or admin credentials.

## E · Content

### Detailed Markdown

```markdown
## Check the preset pack before buyers import it

XMP Preset Pack Preflight is an offline release-QA utility from KNA Software for photographers, retouchers, and boutique preset brands selling original Lightroom or Camera Raw develop-preset packs. It reviews one release ZIP or a direct XMP selection locally and records file-level evidence plus pack-level identity and duplicate-setting groups.

**Version 1.0.0 · $19 USD · Prepared August 31, 2026**

[Buy XMP Preset Pack Preflight on Gumroad — $19 USD](https://khiemnd2.gumroad.com/l/xmp-preset-pack-preflight)

### Who it is for

Use it before publishing or updating a preset pack when importing hundreds of files one by one is slow and sampling can miss malformed XML, repeated identities, duplicate effective settings, profile dependencies, colliding filenames, or accidental release files.

### What the scan records

- XMP, RDF, and Camera Raw payload structure;
- preset name, group, identifier, type, process version, creator tool, namespaces, properties, and active-setting count;
- camera-profile references, support flags, camera-model restrictions, and unknown Camera Raw properties;
- exact-byte duplicates, normalized-setting matches, repeated identifiers, and duplicate names within a group;
- mixed process versions, preset types, support facts, and case-insensitive path collisions; and
- hidden OS artifacts, legacy presets, DNG files, nested archives, and other non-XMP release files.

Every file result includes a SHA-256 and stable finding IDs. Export the result as CSV or a self-contained HTML evidence report.

### Private, local workflow

Unzip the buyer download and open `index.html` in a current desktop browser. Parsing and SHA-256 hashing stay on the device. There is no upload, account, installer, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Supported inputs and limits

- one ZIP up to 50 MB compressed, or up to 500 direct XMP files;
- up to 100 MB expanded release content;
- up to 2 MB per XMP and 5,000 archive entries;
- paths up to 240 characters; and
- current desktop browsers.

### Important limits

This is deterministic static XMP preflight, not preset import, photo rendering, repair, conversion, visual-quality judgment, rights advice, or Adobe certification. Profile references and support facts require human review. A normalized-setting match is a review candidate, not proof of identical rendering or copying. Nested archives and non-XMP files are inventoried but not opened. Test representative presets in every Lightroom, Camera Raw, operating-system, camera, and profile workflow you claim to support.

XMP Preset Pack Preflight is not affiliated with or endorsed by Adobe, Lightroom, Camera Raw, Gumroad, or their owners.

### Package and support

The purchase includes one versioned offline browser ZIP, buyer instructions, support terms, and third-party notices under a single-buyer / single-business license with unlimited internal use. Buyers should reply to their Gumroad receipt for download access or reproducible core-functionality support. Normal response target: two business days. The seven-day limited core-defect refund terms and exclusions are the terms shown on Gumroad and the purchase receipt.

[Get XMP Preset Pack Preflight from the official Gumroad listing](https://khiemnd2.gumroad.com/l/xmp-preset-pack-preflight)
```

### Features, one per line

```text
Batch-scan one ZIP or up to 500 direct XMP preset files
Validate deterministic XML, XMP, RDF, and Camera Raw structure
Inventory identity, group, process, profile, support, namespace, and setting facts
Group exact duplicates, normalized-setting matches, repeated IDs, and repeated names
Flag mixed facts, case-insensitive path collisions, and accidental release files
Export CSV and self-contained HTML evidence reports
Run locally with no upload, account, analytics, storage, or network request
```

### Package contents

```text
XMP Preset Pack Preflight v1.0.0 offline browser utility
Buyer README and usage instructions
Support and limited core-defect refund terms
Third-party dependency notices and license text
CSV and self-contained HTML report export
Single-buyer / single-business license with unlimited internal use
```

### System requirements

```text
Current desktop browser with JavaScript, File API, and Web Crypto support
Ability to unzip a standard ZIP archive and open index.html locally
Maximum scan: one 50 MB ZIP, 100 MB expanded content, 500 XMP files, 2 MB per XMP
No account, installer, API key, or internet connection required after download
```

### Changelog

```text
1.0.0 — Initial release with offline ZIP/XMP scanning, deterministic structure and metadata facts, duplicate and collision grouping, and CSV/HTML evidence reports.
```

## F · SEO

| CMS field | Exact value |
| --- | --- |
| SEO title | XMP Preset Pack Preflight — Offline QA for Preset Sellers |
| SEO description | Scan Lightroom and Camera Raw preset packs locally for malformed XMP, duplicate settings, identity collisions, and profile dependencies. v1.0.0. $19 USD. |
| Canonical URL override | Leave empty; preserve the self-canonical KNA URL |
| OG image URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/gumroad-workflow.png` |

## G · Publication

Create the product as `Draft`. Do not select `Published` during preparation or release review.

## Reviewed buyer artifact

| Field | Exact reviewed value |
| --- | --- |
| File | `xmp-preset-pack-preflight-v1.0.0.zip` |
| Size | `60,587 bytes` (`59.2 KB`) |
| SHA-256 | `924f2816dc45153f6e2b04fe887975782bb176a46b9f546c3ee1bcccd31588bb` |
| Price | `$19 USD` |

## Reciprocal links

- KNA → Gumroad: `Buy XMP Preset Pack Preflight on Gumroad — $19 USD` → `https://khiemnd2.gumroad.com/l/xmp-preset-pack-preflight`
- Gumroad → KNA: `Technical checks, privacy details, and compatibility limits on KNA Software` → `https://knasoftware.com/sources/xmp-preset-pack-preflight`

## Action-time sequence and evidence

1. Re-verify issue #45 and the manifest are `APPROVED_RELEASE`, and the reviewed ZIP checksum, price, copy, support terms, and destinations are unchanged.
2. Re-check the live KNA form and taxonomy; create only exact missing taxonomy records.
3. Create the KNA product as Draft and inspect every field without publishing.
4. Create the Gumroad draft, upload only the reviewed ZIP, and apply the exact listing, refund, media, price, and backlink fields.
5. Publish both reviewed destinations only under the verified release approval.
6. Verify Gumroad price, buyer delivery, support route, downloaded checksum, public KNA page, direct purchase CTA, reciprocal links, self-canonical URL, metadata, OG image, crawlability, sitemap membership, available Product/SoftwareApplication structured data, and `llms.txt` behavior.
7. Record supported evidence and platform gaps without claiming ranking improvement.

## Release-review checklist

- KNA page remains a self-canonical first-party product page and does not canonicalize to Gumroad.
- Buyer-visible Gumroad CTAs use the exact reviewed destination and descriptive anchors above.
- Page copy is original KNA copy rather than a wholesale duplicate of the Gumroad listing.
- Factual fields, price, version, media, support terms, requirements, and limits match the reviewed product.
- No schema, reviews, compatibility, or ranking gains are fabricated.
- Publish only after issue #45 is verified as `APPROVED_RELEASE`.
