---
name: daily-utility-gumroad-release
description: Prepare, manually upload, publish, verify, and record an approved Daily Utility product on Gumroad; use only for Gumroad release work, not builds or promotion.
---

# Daily Utility Gumroad Release

## Gate

Read `AGENTS.md`, the linked issue, product manifest, approved proposal, release artifact, and existing publication evidence. Continue only when the issue is `APPROVED_RELEASE`, required checks passed, and the user explicitly instructed Codex to publish. Do not request or store credentials, cookies, tokens, or a Gumroad API key.

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
- the primary product workflow from delivered files.

## Record

Only after live verification, create or update `products/<product-id>/publication.json`, set the manifest to `PUBLISHED`, and open a focused release-record pull request. Record the verified URL, price, artifact path, checksum, and publication timestamp. Publication recording does not authorize promotion.
