# KNA Software admin and discovery reference

This reference records the CMS behavior observed on 2026-08-27. Re-read the live UI before every publication because `knasoftware.com` is deployed outside this repository.

## Admin surfaces

- Login: `https://knasoftware.com/admin/login`
- Product list: `https://knasoftware.com/admin/products`
- New product: `https://knasoftware.com/admin/products/new`
- Categories: `https://knasoftware.com/admin/categories`
- Tags: `https://knasoftware.com/admin/tags`
- Public settings: `https://knasoftware.com/admin/settings`
- Public product route: `https://knasoftware.com/sources/<slug>`

The login uses Google authentication and grants access only when the signed-in UID exists in the site's admin collection. Use the existing authorized browser session; never persist authentication material in Git.

On the observation date, the catalog, categories, and tags were empty and the settings page offered a one-time default-data initializer. Treat that as mutable live state. Inspect it again and do not initialize or alter shared defaults unless the current release scope explicitly authorizes it.

## Product form mapping

### A. Basic information

The form exposes name, SKU, slug, category, short description, version, ordering, featured status, tech stack, and tags. The reviewed release materials must define the stable slug and SKU instead of inventing them at publish time.

Record the exact mapping in `products/<product-id>/marketing/knasoftware-listing.md`; this checked-in file is reviewed before release and prevents the live CMS from becoming the only copy of publication intent.

### B. Distribution

- `Free` exposes repository, download, and documentation URLs.
- `Contact` exposes display price, preferred contact channel, a product-specific message template, and documentation URL.

There is currently no dedicated external purchase URL for paid products. For Gumroad products, use a truthful `Contact` configuration only if that matches the reviewed page behavior, and place the direct Gumroad purchase link in the product Markdown with an explicit anchor such as `Buy on Gumroad`. Do not put a sales URL in `Documentation URL` unless it is genuinely documentation. If the site later adds an external-purchase field, prefer it and verify its buyer-visible CTA.

### C. Media and demo

Media fields accept external HTTPS URLs for thumbnail, gallery, and video; the CMS does not upload files. Demo fields include live/admin URLs, username, password, and instructions. Everything entered there is public after publication, so secrets and real customer or admin credentials are forbidden.

### D. Content and SEO

The form exposes detailed Markdown, features, package contents, system requirements, changelog, SEO title (70-character UI limit), SEO description (170-character UI limit), canonical override, OG image, and draft/published/hidden status.

Keep the canonical override empty unless an exact reviewed need exists, which preserves the product page's self-canonical URL. Use a distinct first-party description with explicit entity facts that search and answer engines can extract:

- product and maker name;
- audience and problem;
- version and update date;
- price and approved purchase URL;
- capabilities and output formats;
- operating environment and privacy behavior;
- supported limits and explicit non-capabilities;
- support route and refund/guarantee scope.

Use natural headings, concise facts, and descriptive link text. Do not duplicate the sales listing wholesale, keyword-stuff, hide links, fabricate reviews, or promise search rankings.

## Discovery checks

The public app currently updates title, description, OG metadata, and canonical client-side. At the observation time:

- `robots.txt` allowed the public site, disallowed `/admin`, and referenced the sitemap;
- `sitemap.xml` contained only static routes because no products were published;
- `/llms.txt` returned the generic SPA HTML rather than a dedicated AI-readable document;
- no useful `Product` or `SoftwareApplication` JSON-LD was observed on the public surfaces inspected.

After publishing, verify the actual product URL with a fresh public view and check that the sitemap includes it. Re-check JSON-LD and `llms.txt`; the deployment may have improved since this reference was written. Record unsupported discovery features as explicit platform gaps and route any site-code improvement through its own reviewed change. Reciprocal backlinks improve navigation and entity corroboration but do not by themselves prove ranking gains.
