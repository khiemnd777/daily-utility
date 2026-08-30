# Gumroad listing: MIDI Pack Preflight

- Status: `DRAFT_FOR_RELEASE_REVIEW`
- Factory source issue: [#41](https://github.com/khiemnd777/daily-utility/issues/41)
- Planned Gumroad URL: <https://khiemnd2.gumroad.com/l/midi-pack-preflight>
- Required KNA backlink: <https://knasoftware.com/sources/midi-pack-preflight>

This file is the exact release-review source for the Gumroad product. Do not upload, create, or publish the listing before issue #41 reaches `APPROVED_RELEASE`.

## Product name

MIDI Pack Preflight

## Price

$19 USD

## Summary

Offline release QA for MIDI packs—find malformed or empty clips, portability risks, duplicate performances, and path collisions before buyers do.

## Description

Audit the whole MIDI pack before buyers import it.

**Version 1.0.0 · 59.3 KB ZIP · Prepared August 30, 2026**

MIDI Pack Preflight is a private, offline release-QA utility for independent producers and boutique sample-pack labels that sell original Standard MIDI files.

For the exact technical scope, privacy behavior, and compatibility limits, see [Technical checks, privacy details, and compatibility limits on KNA Software](https://knasoftware.com/sources/midi-pack-preflight).

### How it works

1. Drop in one release ZIP or choose up to 2,000 `.mid` / `.midi` files.
2. Review structural blockers, empty-content and portability signals, duplicate performances, path collisions, and other release files.
3. Export CSV or self-contained HTML evidence for your release record.

### It checks

- Standard MIDI header, track, timing, variable-length, running-status, event-data, and end-of-track structure;
- declared format, timing, tracks, names, channels, notes, pitch and velocity ranges, duration when deterministic, tempo, key, time-signature, and SysEx facts;
- no-note files, unmatched notes, format 2, SMPTE timing, SysEx, conflicting declarations, and non-ASCII text as review findings;
- exact duplicate bytes and probable duplicate performance streams that ignore only non-performance labels and serialization differences;
- case-insensitive path collisions; and
- non-MIDI files that should be confirmed as intentional buyer content.

Files stay in your browser. There is no upload, account, API key, subscription, analytics, telemetry, persistent browser storage, or outbound network request. Input files are never modified.

### Preview a sanitized report

- [Download the HTML sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/sample-report.html)
- [Download the CSV sample](https://raw.githubusercontent.com/khiemnd777/daily-utility/main/products/midi-pack-preflight/marketing/sample-report.csv)

The samples come from deterministic fictional MIDI files and contain no customer or confidential data.

### What you receive

- one ready-to-run versioned ZIP;
- browser application files, buyer instructions, support details, and third-party notices;
- no installer—unzip and open `index.html`;
- English interface and reports; and
- a single-buyer / single-business license with unlimited internal use.

### Supported limits

- one ZIP up to 100 MB compressed, or up to 2,000 direct MIDI files;
- up to 150 MB expanded release content;
- up to 10 MB per MIDI, 5,000 archive entries, and 240-character paths; and
- current desktop browsers.

### Important boundaries

This is deterministic Standard MIDI structural preflight, not repair, conversion, playback, synthesis, musical review, originality or rights advice, or a universal compatibility guarantee. Probable performance duplicates are review signals, not proof of copying. Nested archives and non-MIDI files are inventoried but not opened or scanned. Test representative files in every DAW, plugin, instrument, or device you claim to support.

Not affiliated with or endorsed by the MIDI Association, Apple, Ableton, FL Studio, or Gumroad.

### Support

After purchase, reply to your Gumroad receipt. Include your order ID, browser/OS, exact error message, reproducible steps, and a minimal sanitized MIDI or ZIP when needed. Do not send payment data, credentials, customer information, confidential music, client assets, unreleased material, or files you cannot share. Normal response target: two business days.

### Seven-day functionality guarantee

If a documented core feature fails to work as described and we cannot resolve it after one reasonable troubleshooting attempt within the guarantee period, you will receive a full refund. See the refund policy for scope and exclusions.

## Attributes

| Name | Value |
| --- | --- |
| Runs | Offline in your browser |
| Version | 1.0.0 |
| Download | 59.3 KB ZIP |
| Checks | Standard MIDI structure and pack hygiene |
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
| File | `midi-pack-preflight-v1.0.0.zip` |
| Size | 60,713 bytes (59.3 KB) |
| SHA-256 | `e24d14d0bb871c010cad66d22b5db9d7a359e061f2c9ef31383e9de15fda08eb` |

## Refund policy fine print

Seven-day limited functionality guarantee. If a documented core feature fails to work as described and we cannot resolve it after one reasonable troubleshooting attempt within the guarantee period, you will receive a full refund.

Contact us through your Gumroad receipt within seven calendar days of purchase. Include your order ID, current desktop browser and operating system, the exact error message, reproducible steps, and either a minimal sanitized MIDI/ZIP or enough detail to reproduce the failure. A corrected copy may be offered, but you are not required to accept it instead of a refund if the confirmed core defect remains unresolved.

Not covered: failure to follow the included instructions or disclosed limits; unsupported devices or browsers; corrupt, encrypted, nested, unsafe, or over-limit archives; unsupported file types or MIDI variants; unusual third-party exporter behavior; DAW, device, marketplace, or Gumroad policy changes; review findings; musical, creative, compatibility, originality, or rights disagreements; feature requests; customization; file repair or conversion; business outcomes; indirect losses; misuse; sharing; redistribution; resale; or repackaging. Accidental duplicate purchases will be reviewed promptly.

Support is limited to purchase access and documented core functionality and normally receives a response within two business days. Nothing here limits non-waivable consumer rights or Gumroad's discretion under its policies.
