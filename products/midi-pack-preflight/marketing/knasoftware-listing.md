# KNA Software listing: MIDI Pack Preflight

- Status: `DRAFT_FOR_RELEASE_REVIEW`
- Factory source issue: [#41](https://github.com/khiemnd777/daily-utility/issues/41)
- Planned Gumroad listing: <https://khiemnd2.gumroad.com/l/midi-pack-preflight>
- Canonical KNA URL: <https://knasoftware.com/sources/midi-pack-preflight>

This file is the exact release-review source for every KNA CMS field and both reciprocal-link destinations. Create the product as a draft first and publish only after issue #41 reaches `APPROVED_RELEASE`. Stop if the live form, product facts, artifact, price, or destinations differ.

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
| Standard MIDI | `standard-midi` | Technology | `130` | Yes |
| Offline | `offline` | Feature | `100` | Yes |
| Gumroad | `gumroad` | Platform | `110` | Yes |

## A · Basic information

| CMS field | Exact value |
| --- | --- |
| Product name | MIDI Pack Preflight |
| SKU | `KNA-MIDI-PACK-PREFLIGHT` |
| Slug | `midi-pack-preflight` |
| Category | Seller QA Utilities (`seller-qa-utilities`) |
| Short description | Offline release QA for MIDI-pack sellers: find malformed or empty files, portability risks, duplicate performances, and path collisions before launch. |
| Version | `1.0.0` |
| Order | `120` |
| Featured | Yes |
| Tags | JavaScript, Standard MIDI, Offline, Gumroad |

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
| Documentation URL | `https://github.com/khiemnd777/daily-utility/blob/main/products/midi-pack-preflight/README.md` |

If the CMS still has no external-purchase field, keep Gumroad out of the Documentation field. The direct buyer-visible purchase CTA is present near the top and bottom of the detailed Markdown.

## C · Media

| CMS field | Exact value |
| --- | --- |
| Thumbnail URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/gumroad-workflow.png` |
| Video URL | Leave empty |

### Gallery URLs, in order

```text
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/gumroad-results.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/gumroad-report-preview.png
https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/gumroad-contents.png
```

## D · Demo

Leave Live demo URL, Admin demo URL, Demo username, Demo password, and Demo instructions empty. This is an offline downloadable utility, not a hosted application. Never enter buyer or admin credentials.

## E · Content

### Detailed Markdown

```markdown
## Check the MIDI pack before buyers import it

MIDI Pack Preflight is an offline release-QA utility from KNA Software for independent producers and boutique labels selling original Standard MIDI packs. It scans one release ZIP or direct MIDI selection locally and records file-level evidence for structural blockers, empty-content and portability signals, duplicate performances, and bundle hygiene.

**Version 1.0.0 · $19 USD · Prepared August 30, 2026**

[Buy MIDI Pack Preflight on Gumroad](https://khiemnd2.gumroad.com/l/midi-pack-preflight)

### Who it is for

Use it before publishing or updating a chord, melody, bassline, arpeggio, or drum MIDI pack when importing hundreds of files one at a time is slow and sampling can miss a broken, empty, repeated, or less-portable clip.

### What the scan reports

- Standard MIDI header, track, timing, variable-length, running-status, event-data, and end-of-track structure;
- format 0/1/2, timing division, tracks, names, channels, notes, ranges, duration when deterministic, tempo, key, time signature, SysEx, and SHA-256;
- review signals for no-note files, unmatched notes, format 2, SMPTE timing, SysEx, conflicting declarations, and non-ASCII text;
- exact byte duplicates and probable normalized performance duplicates;
- case-insensitive path collisions; and
- non-MIDI release files to confirm as intentional buyer content.

Export the result as CSV or a self-contained HTML evidence report.

### Private, local workflow

Unzip the download and open `index.html` in a current desktop browser. Parsing and SHA-256 hashing stay on the device. There is no upload, account, API key, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Supported inputs and limits

- one ZIP up to 100 MB compressed, or up to 2,000 direct `.mid` / `.midi` files;
- up to 150 MB expanded release content;
- up to 10 MB per MIDI and 5,000 archive entries;
- paths up to 240 characters; and
- current desktop browsers.

### Important limits

This is deterministic structural preflight, not MIDI repair or conversion, playback, synthesis, musical-quality judgment, BPM/key inference, originality or rights advice, or a universal compatibility guarantee. A probable performance duplicate is a review signal, not proof of copying. Nested archives and non-MIDI files are inventoried but not opened or scanned. Test representative files in every DAW, plugin, instrument, or device you claim to support.

MIDI Pack Preflight is not affiliated with or endorsed by the MIDI Association, Apple, Ableton, FL Studio, Gumroad, or their respective owners.

### Package and support

The purchase includes one versioned offline browser ZIP, buyer instructions, support details, and third-party notices under a single-buyer / single-business license with unlimited internal use. Buyers should reply to their Gumroad receipt for purchase access or documented core-functionality support. Normal response target: two business days. The seven-day limited functionality guarantee and exclusions are the terms shown on Gumroad and the purchase receipt.

[Get MIDI Pack Preflight from the official Gumroad listing](https://khiemnd2.gumroad.com/l/midi-pack-preflight)
```

### Features, one per line

```text
Batch-scan one ZIP or up to 2,000 direct Standard MIDI files
Validate deterministic SMF headers, tracks, timing, and event structure
Inventory note, timing, metadata, SysEx, duration, and SHA-256 facts
Detect exact bytes, probable performance duplicates, and path collisions
Export CSV and self-contained HTML evidence reports
Run locally with no upload, account, analytics, storage, or network request
```

### Package contents

```text
MIDI Pack Preflight v1.0.0 offline browser utility
Buyer README and usage instructions
Support terms and third-party dependency notices
CSV and self-contained HTML report export
Single-buyer / single-business license with unlimited internal use
```

### System requirements

```text
Current desktop browser with JavaScript, File API, and Web Crypto support
Ability to unzip a standard ZIP archive and open index.html locally
Maximum scan: one 100 MB ZIP, 150 MB expanded content, 2,000 MIDI files, 10 MB per MIDI
No account, installer, API key, or internet connection required after download
```

### Changelog

```text
1.0.0 — Initial release with offline ZIP/MIDI scanning, deterministic SMF checks, duplicate and collision detection, and CSV/HTML evidence reports.
```

## F · SEO

| CMS field | Exact value |
| --- | --- |
| SEO title | MIDI Pack Preflight — Offline QA for MIDI Sellers |
| SEO description | Scan MIDI packs locally for malformed or empty clips, portability risks, duplicate performances, and path collisions. Offline v1.0.0. $19 USD. |
| Canonical URL override | Leave empty; preserve the self-canonical KNA URL |
| OG image URL | `https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/gumroad-workflow.png` |

## G · Publication

Create the product as `Draft`. Do not select `Published` during preparation or release review.

## Reciprocal links

- KNA → Gumroad: `Buy MIDI Pack Preflight on Gumroad` → `https://khiemnd2.gumroad.com/l/midi-pack-preflight`
- Gumroad → KNA: `Technical checks, privacy details, and compatibility limits on KNA Software` → `https://knasoftware.com/sources/midi-pack-preflight`

## Action-time sequence and evidence

1. Re-verify issue #41 and the manifest are `APPROVED_RELEASE`, and the reviewed ZIP checksum, price, copy, support terms, and destinations are unchanged.
2. Re-check the live KNA form and taxonomy; create only exact missing taxonomy records.
3. Create the KNA product as Draft and inspect every field without publishing.
4. Create the Gumroad draft, upload only the reviewed ZIP, and apply the exact listing, refund, media, price, and backlink fields.
5. Publish both reviewed destinations only under the verified release approval.
6. Verify Gumroad price, buyer delivery, support route, downloaded checksum, public KNA page, direct purchase CTA, reciprocal links, self-canonical URL, metadata, OG image, crawlability, sitemap membership, structured data, and `llms.txt` behavior.
7. Record supported evidence and platform gaps without claiming ranking improvement.
