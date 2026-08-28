---
name: daily-utility-gumroad-release
description: Prepare, manually upload, publish, verify, and record an approved Daily Utility product on Gumroad; use only for Gumroad release work, not builds or promotion.
---

# Daily Utility Gumroad Release

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved proposal, release artifact, and existing publication evidence. Continue only when the issue is `APPROVED_RELEASE` and required checks passed. The verified release `/approve` is standing authorization to publish the exact reviewed version, so do not request another publish confirmation while the artifact, price, listing copy, support terms, seller destination, and reviewed KNA Software reverse-link destination remain unchanged. Do not request or store credentials, cookies, tokens, or a Gumroad API key.

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

Gumroad verification alone does not complete a new Daily Utility release. Continue with `daily-utility-lemonsqueezy-release` using the same approved bytes and shared USD price, then use `daily-utility-knasoftware-catalog` to publish the exact reviewed first-party page and verify both reciprocal-link pairs. Only after every live check may the release record set the manifest to `PUBLISHED` and move the issue to `PUBLISHED`.

Record Gumroad evidence in the schema-v2 `products/<product-id>/publication.json` sales-channel entry: stable public URL, price, publication timestamp, buyer-delivered checksum, and KNA backlink verification timestamp. Do not finalize the focused release record until the Lemon Squeezy and KNA evidence are also complete. Publication recording does not authorize promotion posts.
