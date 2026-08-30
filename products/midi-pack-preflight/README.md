# MIDI Pack Preflight

MIDI Pack Preflight is an English-first, offline browser utility for release-level QA of original Standard MIDI packs. It reads one ZIP or up to 2,000 direct `.mid`/`.midi` files locally, validates deterministic SMF structure, inventories musical and timing facts, identifies bundle-level duplicates and collisions, and exports CSV plus self-contained HTML evidence.

## Buyer workflow

1. Unzip the versioned download.
2. Open `index.html` in a current desktop browser.
3. Choose one release ZIP or direct MIDI files.
4. Review blockers and review findings, then export evidence.

No installer, account, API key, upload, analytics, telemetry, persistent browser storage, or network connection is required.

## Checks

- SMF `MThd` and `MTrk` structure, lengths, formats, track counts, timing division, variable-length quantities, running status, event data bytes, and end-of-track markers;
- format, timing, tracks, names, channels, notes, pitch/velocity range, tick length, duration when deterministic, tempo, key, time signature, SysEx, and SHA-256 facts;
- review-only signals for empty musical content, unmatched notes, format 2, SMPTE timing, SysEx, conflicting same-tick declarations, and non-ASCII text;
- exact byte duplicates, probable normalized performance duplicates, case-insensitive path collisions, and non-MIDI release files; and
- CSV and dependency-free HTML release evidence.

## Limits

- One ZIP up to 100 MB compressed
- Up to 150 MB expanded content
- Up to 2,000 MIDI files and 5,000 archive entries
- Up to 10 MB per MIDI file
- Paths up to 240 characters

Nested archives are inventoried but not opened. The utility does not repair, convert, rename, synthesize, play, judge musical quality, infer BPM/key labels, review rights, or guarantee playback or import behavior in every DAW, plugin, instrument, or device.

## Development

Requires Node.js 22 and a current Chrome installation for local browser acceptance.

```sh
npm ci
npm test
npm run test:browser
npm run marketing
```

`npm test` rebuilds and packages the buyer artifact before running deterministic parser, bundle, source-boundary, report, marketing-asset, and release-integrity checks. `npm run test:browser` opens the packaged `file://` workflow, blocks outbound traffic, scans representative fixtures, exports both report formats, and verifies CSP plus zero persistent browser storage.
