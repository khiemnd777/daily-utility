# Gumroad listing: CUBE LUT Pack Preflight

- Status: `DRAFT — DO NOT PUBLISH`
- Factory source issue: [#36](https://github.com/khiemnd777/daily-utility/issues/36)
- Planned Gumroad URL: <https://khiemnd2.gumroad.com/l/cube-lut-pack-preflight>
- Required KNA backlink: <https://knasoftware.com/sources/cube-lut-pack-preflight>

This file is the exact release-review source for the Gumroad product. Do not upload, create, or publish the listing before issue #36 reaches `APPROVED_RELEASE`.

## Product name

CUBE LUT Pack Preflight

## Price

$19 USD

## Summary

Offline release QA for CUBE LUT packs—find structural blockers, duplicate transforms, mixed grids, and filename collisions before buyers do.

## Description

Audit the whole CUBE LUT pack before buyers install it.

**Version 1.0.0 · 55.5 KB ZIP · Prepared August 29, 2026**

CUBE LUT Pack Preflight is a private, offline release-QA utility for independent creators who sell downloadable LUT packs on Gumroad.

For a first-party overview of checks, limits, privacy behavior, and support, see the [official KNA Software page for CUBE LUT Pack Preflight](https://knasoftware.com/sources/cube-lut-pack-preflight).

### How it works

1. Drop in one release ZIP or choose up to 100 `.cube` files.
2. Review structural blockers, duplicate transforms, title and path collisions, mixed grids, and non-CUBE release files.
3. Export CSV or self-contained HTML evidence for your release record.

### It checks

- standalone 1D/3D CUBE declaration syntax, order, uniqueness, domains, numeric triplets, finite values, and exact table row counts;
- output values outside the common 0–1 range as manual-review findings;
- exact duplicate bytes and equivalent parsed table payloads;
- repeated titles attached to distinct data;
- mixed LUT types or declared grid sizes;
- paths that collide on case-insensitive systems; and
- non-CUBE files that should be confirmed as intentional buyer content.

Your LUTs stay in your browser. There is no upload, account, API key, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Preview a sanitized report

- [Download the HTML sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/sample-report.html)
- [Download the CSV sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/cube-lut-pack-preflight/marketing/sample-report.csv)

The samples come from deterministic fictional LUTs and contain no customer or confidential data.

### What you receive

- one ready-to-run versioned ZIP;
- browser application files, buyer instructions, and third-party notices;
- no installer—unzip and open `index.html`;
- English interface and reports; and
- a single-buyer / single-business license with unlimited internal use.

### Supported limits

- one ZIP up to 100 MB compressed, or up to 100 direct CUBE LUTs;
- up to 150 MB expanded release content;
- up to 20 MB per LUT, 1,000 archive entries, and 240-character paths; and
- current desktop browsers.

### Important boundaries

This utility performs deterministic structural preflight, not visual rendering or a color-accuracy, creative-quality, or compatibility guarantee. It does not repair, resample, convert, install, inspect color profiles, review licenses, validate other LUT formats, or recurse into nested archives. Test representative LUTs in every application and device you claim to support.

Not affiliated with or endorsed by Adobe, Blackmagic Design, or Gumroad.

### Support

After purchase, reply to your Gumroad receipt. Include your order ID, browser/OS, exact error message, reproducible steps, and a minimal sanitized LUT or ZIP when needed. Do not send payment data, credentials, customer information, confidential footage, client assets, or LUTs you cannot share. Normal response target: two business days.

### Seven-day functionality guarantee

If a documented core feature fails to work as described and we cannot resolve it after one reasonable troubleshooting attempt within the guarantee period, you will receive a full refund. See the refund policy for scope and exclusions.

## Attributes

| Name | Value |
| --- | --- |
| Runs | Offline in your browser |
| Version | 1.0.0 |
| Download | 55.5 KB ZIP |
| Checks | CUBE structure and pack hygiene |
| Exports | CSV and self-contained HTML |
| Browsers | Current desktop browsers |
| License | One buyer / one business |

## Content button

Download the ZIP

## Carousel order

1. `marketing/gumroad-workflow.png`
2. `marketing/gumroad-results.png`
3. `marketing/gumroad-report-preview.png`
4. `marketing/gumroad-contents.png`

## Exact buyer artifact

| Field | Reviewed value |
| --- | --- |
| File | `cube-lut-pack-preflight-v1.0.0.zip` |
| Size | 56,861 bytes (55.5 KB) |
| SHA-256 | `35e773db153f6efdc7833bf5c1a15db8c8411588e49d0b529d581bd07c248ea9` |

## Refund policy fine print

Seven-day limited functionality guarantee. If a documented core feature fails to work as described and we cannot resolve it after one reasonable troubleshooting attempt within the guarantee period, you will receive a full refund.

Contact us through your Gumroad receipt within seven calendar days of purchase. Include your order ID, current desktop browser and operating system, the exact error message, reproducible steps, and either a minimal sanitized CUBE/ZIP or enough detail to reproduce the failure. A corrected copy may be offered, but you are not required to accept it instead of a refund if the confirmed core defect remains unresolved.

Not covered: failure to follow the included instructions or disclosed limits; unsupported devices or browsers; corrupt, encrypted, nested, unsafe, or over-limit archives; unsupported file types or CUBE dialects; unusual third-party exporter behavior; application, device, marketplace, or Gumroad policy changes; review findings; color or creative disagreements; compatibility claims; feature requests; customization; file repair; business outcomes; indirect losses; misuse; sharing; redistribution; resale; or repackaging. Accidental duplicate purchases will be reviewed promptly.

Support is limited to purchase access and documented core functionality and normally receives a response within two business days. Nothing here limits non-waivable consumer rights or Gumroad's discretion under its policies.
