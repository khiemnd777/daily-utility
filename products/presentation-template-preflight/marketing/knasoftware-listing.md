# KNA Software catalog source — Presentation Template Preflight 1.0.0

This file is the release-review source of truth for the Gumroad-first KNA Software page. The first stage exposes only the exact Gumroad purchase link and truthfully identifies Lemon Squeezy as pending.

## Basic information

- Name: `Presentation Template Preflight`
- SKU: `DU-PRESENTATION-TEMPLATE-PREFLIGHT-100`
- Slug: `presentation-template-preflight`
- Public URL: `https://knasoftware.com/sources/presentation-template-preflight`
- Category: `Utilities`
- Tags: `PowerPoint`, `Presentation QA`, `Offline Tools`, `Digital Product Sellers`
- Short description: `Offline OOXML release QA for editable PowerPoint templates, with package-link, font, hidden-content, metadata, and evidence-report checks.`
- Version: `1.0.0`
- Ordering: `30`
- Featured: `false`
- Tech stack: `JavaScript`, `HTML`, `CSS`, `OOXML`, `JSZip`, `Saxes`
- Maker: `KNA Software`

## Distribution

- Mode: `Contact` until the CMS exposes dedicated paid external-purchase fields
- Display price: `$19 USD`
- Preferred contact: `Email`
- Contact address: `khiemnd777@gmail.com`
- Contact message template: `Presentation Template Preflight purchase question — include the preferred Gumroad or Lemon Squeezy channel and do not include payment data.`
- Documentation URL: leave empty; neither sales URL is documentation
- Gumroad purchase URL: `https://khiemnd2.gumroad.com/l/presentation-template-preflight`
- Gumroad purchase anchor: `Buy Presentation Template Preflight on Gumroad`
- Lemon Squeezy availability: `Pending store review; do not render an inactive or placeholder purchase link during the Gumroad-first stage.`
- Gumroad reverse-link destination: `https://knasoftware.com/sources/presentation-template-preflight`
- Gumroad reverse-link anchor: `View product details, privacy behavior, and support on KNA Software`

The later remaining-channel update will add the exact Lemon Squeezy `/checkout/buy/` URL, the anchor `Buy Presentation Template Preflight on Lemon Squeezy`, and the reverse link to this same KNA URL only after those fields reach `READY_FOR_REMAINING_CHANNELS` and receive a fresh exact `/approve`.

## Media

- Thumbnail: `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/presentation-template-preflight/marketing/sales-workflow.png`
- Gallery 1: `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/presentation-template-preflight/marketing/sales-results.png`
- Gallery 2: `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/presentation-template-preflight/marketing/sales-report-preview.png`
- Gallery 3: `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/presentation-template-preflight/marketing/sales-contents.png`
- OG image: `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/presentation-template-preflight/marketing/sales-workflow.png`
- Video: leave empty
- Demo URL, admin URL, username, password, and instructions: leave empty; there is no hosted demo or public credential

## Detailed Markdown

## Evidence-led PowerPoint template QA, without uploading the deck

Presentation Template Preflight by KNA Software is a version 1.0.0 offline utility for freelance PowerPoint template designers and small presentation studios. It addresses a recurring final-delivery problem: editable `.pptx` and `.potx` files can retain broken package links, machine-specific assets, font portability risks, comments, notes, hidden slides, embedded objects, macros, or author metadata even when the slides look finished.

The utility reads one OOXML package locally in a current desktop browser. It inventories slides, layouts, masters, dimensions, aspect ratio, package parts, and relationships; maps referenced font families to PowerPoint embedded-font records; and exports a CSV plus self-contained HTML release report with file name, byte size, SHA-256, scan timestamp, severity totals, check IDs, and exact slide or package-part evidence.

### Privacy and operating boundaries

The presentation stays on the buyer's computer. The utility has no account, upload, telemetry, analytics, remote fetch, API integration, or persistent storage, and it never rewrites the input. The supported input is one unencrypted `.pptx` or `.potx` file up to 100 MB, with documented package-part and expansion limits.

This is static OOXML inspection. It does not render or repair slides, prove visual fidelity or universal compatibility, determine whether a font is installed or licensed, certify accessibility, judge design or animation quality, execute macros or embedded objects, open legacy `.ppt`, validate Keynote/Google Slides/PDF, or decrypt protected files. Buyers should still perform a visual check in their target PowerPoint versions. The product is not affiliated with or endorsed by Microsoft.

### Purchase

- [Buy Presentation Template Preflight on Gumroad](https://khiemnd2.gumroad.com/l/presentation-template-preflight)

Lemon Squeezy availability is pending store review and will be added here only after its remaining-channel approval. It will deliver the same version 1.0.0 ZIP at the same `$19 USD` price. Primary support is by purchase-receipt reply, with `khiemnd777@gmail.com` as fallback and a normal response target of two business days. A verified buyer may request a full refund within seven days only when the documented core workflow is defective and support cannot resolve it; the explicit non-capabilities above are excluded.

## Features

1. Internal relationship target resolution with blocker evidence
2. External local-file, media, data, and web relationship inventory
3. Referenced-versus-embedded font comparison with non-legal portability warnings
4. Comments, notes, hidden slides, objects, macros, and personal metadata checks
5. Slide, layout, master, dimension, aspect-ratio, and package-part inventory
6. SHA-256, CSV, and self-contained HTML release evidence
7. Local-only processing with restrictive browser security policy

## Package contents

- `index.html`, `app.js`, and `styles.css`
- `README.txt`
- `SUPPORT.txt`
- `THIRD_PARTY_NOTICES.txt`
- CSV and HTML reports generated by the buyer

## System requirements

- Current desktop Chrome, Edge, Firefox, or Safari with File, Blob, Web Crypto, and standard JavaScript support
- Ability to unzip a downloaded archive and open a local `index.html`
- One `.pptx` or `.potx` file no larger than 100 MB
- No Microsoft PowerPoint installation is required for scanning; PowerPoint is still recommended for the final visual delivery check

## Changelog

- `1.0.0` — Initial offline release with OOXML relationship, font, hidden-content, metadata, package inventory, CSV, and HTML checks.

## SEO and publication

- SEO title: `Presentation Template Preflight — Offline PowerPoint QA`
- SEO description: `Check PPTX and POTX templates offline for broken links, font portability risks, hidden content, metadata, and exportable release evidence.`
- Canonical override: leave empty so the public KNA URL remains self-canonical
- Status before release approval: `Draft`
- Status after verified release approval and exact-field review: `Published`
- Structured data claim: none until verified live
- Sitemap claim: none until verified live
- `llms.txt` claim: none until verified live
- Discovery verification after publication: title, description, self-canonical, OG image, crawlability, sitemap membership, reciprocal links, available `Product`/`SoftwareApplication` JSON-LD, and a real AI-readable `llms.txt`; record unsupported surfaces as gaps

## Gumroad-first release review status

The first-stage KNA fields, Gumroad destination, Gumroad reverse-link pair, `$19 USD` price, version 1.0.0 artifact, support terms, and media are reviewable. Lemon Squeezy is explicitly pending, and this source contains no inactive or placeholder Lemon Squeezy purchase link. After `GUMROAD_PUBLISHED`, add the exact reusable Lemon Squeezy `/checkout/buy/` Share URL through the separately reviewed remaining-channel update.
