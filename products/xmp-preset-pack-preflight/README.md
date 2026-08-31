# XMP Preset Pack Preflight

XMP Preset Pack Preflight is an English-first, offline browser utility for release-level QA of original Lightroom and Camera Raw preset packs. It reads one ZIP or up to 500 direct `.xmp` files locally, records deterministic XMP/RDF and Camera Raw facts, groups likely duplicate settings, inventories other release files, and exports CSV plus self-contained HTML evidence.

## Use

1. Unzip the buyer download.
2. Open `index.html` in a current desktop browser.
3. Choose one release ZIP or direct XMP files.
4. Review blockers, review findings, identity, profile references, and declared support facts.
5. Export the CSV and HTML reports for the release record.

No account, installer, upload, or network connection is required. Input bytes are never modified, and the app does not use analytics, telemetry, cookies, local storage, session storage, or IndexedDB.

## Deterministic checks

- well-formed XML, XMP container, RDF container, and Camera Raw description presence;
- preset name, group, UUID, type, process version, creator tool, namespaces, and property inventory;
- active develop-setting count and names, profile references, support flags, camera-model restrictions, and unknown Camera Raw properties;
- exact-byte duplicates, normalized-setting matches, repeated identifiers, duplicate names within a group, and case-insensitive path collisions;
- mixed process versions, preset types, and compatibility flags across the selected pack; and
- hidden OS artifacts, legacy `.lrtemplate` files, DNG files, nested archives, and other non-XMP release files.

Every result includes its path, byte size, SHA-256, normalized-setting SHA-256 when available, stable check ID, severity, and evidence. Review findings are facts to confirm; a blocker means the static release input needs attention before relying on the report.

## Safety limits

- One ZIP up to 50 MB compressed, or up to 500 direct XMP files
- Up to 100 MB expanded release content
- Up to 2 MB per XMP file
- Up to 5,000 archive entries
- Up to 240 characters per release path

Encrypted, corrupt, unsafe, and over-limit archives fail closed. Nested archives and non-XMP files are inventoried but not opened.

## Important boundaries

This utility performs static XMP preflight. It does not import presets, render photos, repair or convert files, certify Adobe compatibility, prove that two presets render identically, evaluate image quality, verify ownership, or provide rights advice. Profile references, process versions, support flags, and unknown properties are review facts, not automatic proof of failure. Test representative presets in every Lightroom, Camera Raw, operating-system, camera, and profile workflow you claim to support.

XMP Preset Pack Preflight is not affiliated with or endorsed by Adobe, Lightroom, Camera Raw, Gumroad, or their owners.

## Development

```sh
npm ci
npm test
npm run test:browser
npm run marketing
```

The buyer ZIP is deterministic and contains only `index.html`, `app.js`, `styles.css`, `README.txt`, `SUPPORT.txt`, and `THIRD_PARTY_NOTICES.txt`.

## Support

Reply to the Gumroad receipt and include the order ID, browser/OS, exact error, reproducible steps, and a minimal sanitized XMP or ZIP if needed. Never send payment data, credentials, customer information, confidential client assets, unreleased work, or files you cannot share. Normal response target: two business days. Full terms are in `support/SUPPORT.txt` and the reviewed listings.
