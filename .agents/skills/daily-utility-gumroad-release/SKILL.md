---
name: daily-utility-gumroad-release
description: Prepare, manually upload, publish, verify, and record an approved Daily Utility product on Gumroad; use only for Gumroad release work, not builds or promotion.
---

# Daily Utility Gumroad Release

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved proposal, release artifact, and existing publication evidence. Continue only when the issue is `APPROVED_RELEASE` and required checks passed. The verified release `/approve` is standing authorization to publish the exact reviewed Gumroad version, so do not request another publish confirmation while the artifact, price, listing copy, support terms, seller destination, KNA reverse-link destination, and reviewed release sequence remain unchanged. Do not request or store credentials, cookies, tokens, or a Gumroad API key.

## Preflight

- Identify the exact versioned ZIP and compute SHA-256 before upload.
- Inspect archive contents and confirm they match the manifest artifacts and buyer workflow.
- Reconcile product name, English-first description, USD price, delivery instructions, version, cover/thumbnail, support contact, and limited guarantee terms.
- Ensure support requires order identification and sanitized diagnostics, excludes custom work and third-party failures, and gives a realistic response target.

Stop on a state mismatch, unexpected artifact bytes, missing seller access, CAPTCHA, upload error, or material listing mismatch. Do not create a replacement product or change price/scope to work around a blocker.

## Publish and verify

Use the authenticated browser session manually. Upload only the preflighted artifact and keep already published version bytes immutable. After the final publish action, verify:

- the public URL, title, price, and listing copy;
- the buyer-visible Library content and support route;
- the delivered filename and version;
- a downloaded buyer artifact checksum against the pre-upload SHA-256;
- the primary product workflow from delivered files;
- the reviewed direct link from the Gumroad listing to the exact KNA Software product URL, when the release materials include that URL.

## Hand off to the second channel

Gumroad verification alone does not complete a new Daily Utility release. For `simultaneous`, continue with `daily-utility-lemonsqueezy-release` using the same approved bytes and shared USD price, then publish the KNA page and finish `PUBLISHED`. For `gumroad-first`, publish the exact reviewed first-stage KNA page with the Gumroad purchase link and no inactive Lemon Squeezy link, verify the Gumroad reciprocal-link pair, then create schema-v3 partial evidence and stop at `GUMROAD_PUBLISHED`.

Record Gumroad evidence with the stable public URL, price, publication timestamp, buyer-delivered checksum, and KNA backlink verification timestamp. Simultaneous releases use schema v2. Gumroad-first releases use schema v3 with `status: partial` and `pending_channels: ["lemon-squeezy"]`; that partial record is durable release evidence but does not authorize promotion or claim full publication.
