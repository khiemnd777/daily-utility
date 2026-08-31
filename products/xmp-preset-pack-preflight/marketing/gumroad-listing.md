# Gumroad listing: XMP Preset Pack Preflight

Reviewed source of truth for the v1.0.0 Gumroad draft. Do not publish, change the price, replace the buyer ZIP, or alter this copy before verified release approval.

- Planned Gumroad URL: <https://khiemnd2.gumroad.com/l/xmp-preset-pack-preflight>
- Required KNA backlink: <https://knasoftware.com/sources/xmp-preset-pack-preflight>
- Version: `1.0.0`
- Price: `$19 USD`

## Product name

XMP Preset Pack Preflight

## Short description

Offline release QA for Lightroom and Camera Raw preset packs—find malformed XMP, identity collisions, duplicate settings, profile dependencies, and bundle mistakes before buyers do.

## Headline

Audit the preset pack before buyers import it.

## Description

XMP Preset Pack Preflight is a private, offline release-QA utility for photographers, retouchers, and boutique preset brands selling original Lightroom or Camera Raw develop-preset packs.

Drop in one release ZIP or choose direct `.xmp` files. The utility reads the files locally, records deterministic structure and metadata facts, groups likely duplicates and collisions across the pack, and exports CSV plus self-contained HTML evidence. No installer, account, upload, analytics, telemetry, or network connection is required.

For the exact technical scope, privacy behavior, and compatibility limits, see [Technical checks, privacy details, and compatibility limits on KNA Software](https://knasoftware.com/sources/xmp-preset-pack-preflight).

### How it works

1. Unzip the buyer download and open `index.html` in a current desktop browser.
2. Drop in one release ZIP or choose up to 500 direct `.xmp` files.
3. Review blockers, identity and group facts, profile references, support flags, duplicate-setting candidates, collisions, and other release files.
4. Export CSV and self-contained HTML reports for the release record.

### Deterministic checks

- well-formed XML, XMP container, RDF container, and Camera Raw description presence;
- preset name, group, identifier, type, process version, creator tool, declared namespaces, properties, and active-setting count;
- camera-profile references, support flags, camera-model restrictions, and unknown Camera Raw properties;
- exact-byte duplicates, normalized-setting matches, repeated identifiers, duplicate names within a group, and case-insensitive path collisions;
- mixed process versions, preset types, and compatibility flags across the pack; and
- hidden OS artifacts, legacy `.lrtemplate` presets, DNG files, nested archives, and other non-XMP buyer files.

Each file result includes its path, size, SHA-256, normalized-setting SHA-256 when available, stable check ID, severity, and evidence.

### Sample evidence

- [Download the fictional HTML sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/sample-report.html)
- [Download the fictional CSV sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/xmp-preset-pack-preflight/marketing/sample-report.csv)

The samples and screenshots are generated from deterministic fictional XMP fixtures. They contain no customer, payment, or confidential data.

### Privacy and security

All parsing and SHA-256 hashing happen locally in the browser. Input bytes are never modified. The app has no accounts, installer, upload, cookies, analytics, telemetry, local storage, session storage, IndexedDB, or outbound network request. Unsafe, damaged, encrypted, and over-limit archives fail closed. The buyer app includes a restrictive Content Security Policy and bundled dependency notices.

### Requirements and limits

- current desktop Chrome, Edge, Firefox, or Safari with JavaScript enabled;
- one ZIP up to 50 MB compressed, or up to 500 direct XMP files;
- up to 100 MB expanded release content;
- up to 2 MB per XMP, 5,000 archive entries, and 240 characters per path; and
- enough local memory for the selected release and exported report.

Nested archives and non-XMP files are inventoried but not opened.

### Important boundary

This is deterministic static XMP preflight, not preset import, photo rendering, file repair or conversion, visual-quality judgment, ownership or rights advice, or Adobe certification. Profile references, support flags, process versions, and unknown properties are factual review signals rather than automatic proof of failure. A normalized-setting match is a review candidate, not proof of identical rendering or copying. Test representative presets in every Lightroom, Camera Raw, operating-system, camera, and profile workflow you claim to support.

XMP Preset Pack Preflight is not affiliated with or endorsed by Adobe, Lightroom, Camera Raw, Gumroad, or their owners.

## Buyer delivery

| Field | Reviewed value |
| --- | --- |
| File | `xmp-preset-pack-preflight-v1.0.0.zip` |
| Version | `1.0.0` |
| Exact byte size | `60,587 bytes` (`59.2 KB`) |
| SHA-256 | `924f2816dc45153f6e2b04fe887975782bb176a46b9f546c3ee1bcccd31588bb` |
| Contents | `index.html`, `app.js`, `styles.css`, `README.txt`, `SUPPORT.txt`, `THIRD_PARTY_NOTICES.txt` |
| Install | Unzip once; open `index.html` |
| License | One purchaser may use the utility for their own or their business's preset-release QA. Redistribution, resale, repackaging, or sharing the buyer ZIP is not allowed. |

## Support

After purchase, reply to the Gumroad receipt. Include the order ID, browser and operating system, utility version, exact error, reproducible steps, and a minimal sanitized XMP or ZIP if needed. Never send payment data, credentials, customer information, confidential client assets, unreleased work, or files you cannot share. Normal response target: two business days.

## Core-defect refund terms

Contact us through the Gumroad receipt within seven calendar days of purchase. If a reproducible defect prevents the documented core workflow on a supported current desktop browser and remains unresolved, request a refund. A corrected copy may be offered, but the purchaser is not required to accept it instead of a refund for a confirmed unresolved core defect.

Not covered: disclosed safety limits; corrupt, encrypted, nested, unsafe, or over-limit archives; unsupported file types or unusual third-party exporter behavior; Adobe, operating-system, marketplace, browser, camera-profile, or Gumroad changes; review findings; rendering, compatibility, creative, ownership, or rights disagreements; feature requests; customization; indirect losses; misuse; sharing; redistribution; resale; or repackaging. Accidental duplicate purchases will be reviewed promptly.

## Media order

1. `marketing/gumroad-workflow.png` — local workflow and product promise
2. `marketing/gumroad-results.png` — fictional pack-level findings
3. `marketing/gumroad-report-preview.png` — self-contained HTML evidence
4. `marketing/gumroad-contents.png` — exact buyer ZIP contents, size, version, and SHA-256

All four images are exactly `1600 × 900` pixels.

## Release-review checklist

- Price is exactly `$19 USD`.
- Buyer ZIP path, byte size, SHA-256, contents, and version match the table above.
- The Gumroad description includes the exact KNA backlink and descriptive anchor shown above.
- Support and refund terms match `support/SUPPORT.txt`.
- Buyer-visible copy does not claim importing, rendering, repair, certification, or universal compatibility.
- Publish only after issue #45 is verified as `APPROVED_RELEASE`.
