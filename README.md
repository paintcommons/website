# Paint Commons website

The landing page for **paintcommons.org**, an open, living miniature paint reference maintained by the community. This website is separate from the [catalog](https://github.com/paintcommons/catalog) and the Stipplewise app.

## Development

The website is plain HTML and CSS. There are no application dependencies or build step. Serve `dist/` with any static HTTP server:

```sh
python3 -m http.server 8765 --directory dist
```

## Cloudflare Pages

- Project: `paintcommons`
- Production branch: `main`
- Build command: leave empty
- Build output directory: `dist`
- Framework preset: None

To deploy manually with an authorized Cloudflare account:

```sh
npx wrangler@4.164.0 pages deploy dist --project-name paintcommons --branch main
```

## Content

Contributions through pull requests, APIs, and Stipplewise are described as a planned workflow. Only explicitly submitted and approved information belongs in the public catalog. Published catalog data is CC0; no live submission API is claimed.

The visual identity and wording follow the project’s brand brief, while giving Paint Commons its own reference-library character.

## Automatic deployment setup

The initial release is deployed directly to [Cloudflare Pages](https://paintcommons.pages.dev). Cloudflare's native GitHub integration could not be created because its GitHub App is not installed/configured for the organization. This project therefore uses the supported Direct Upload + GitHub Actions route.

The workflow in `.github/workflows/deploy.yml` deploys changes to `dist/` on `main` (or a manual workflow run). Until credentials are configured, it reports a warning and skips deployment.

1. Create a Cloudflare API token with **Account → Cloudflare Pages → Edit**, restricted to the hosting account. Follow [Cloudflare's CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
2. Add the token as the **CLOUDFLARE_API_TOKEN** [repository Actions secret](https://github.com/paintcommons/website/settings/secrets/actions). Never commit the token or paste it into an issue.
3. The **CLOUDFLARE_ACCOUNT_ID** repository variable is configured separately; it is not a secret.
4. Run **Deploy website to Cloudflare Pages** from the Actions tab to verify the connection. Subsequent website changes on `main` deploy automatically.

The custom domain [paintcommons.org](https://paintcommons.org) is connected to this Pages project through a proxied root CNAME targeting `paintcommons.pages.dev`. The `pages.dev` address also remains available.

## Browsable catalogue

`/catalogue/` provides search by name, code or barcode; brand, range, type and availability filters; a colour wall, cards/list views, grouping by paint type or brand/range, and pagination for cards/list; and shareable paint records with sources and barcode provenance. Paint swatches are explicitly approximate. No collection or account data is used.

`dist/data/catalogue.json` is a bundled, revision-labelled public catalog snapshot. The browser checks GitHub for a newer revision and loads it in the background, falling back to the bundled data on network errors or rate limits. Source records and corrections link back to the canonical catalog repository.

To refresh the bundled fallback from a local checkout of the public catalog:

```sh
node scripts/sync-catalog.mjs /path/to/catalog
node --test scripts/catalogue.test.mjs
```

Catalog data carries the repository’s CC0 dedication in `dist/data/LICENSE`; upstream source credits are retained in the JSON and shown in record details.

## WWW redirect

Cloudflare Single Redirect matches `http.host eq "www.paintcommons.org"` and returns HTTP 301 to `concat("https://paintcommons.org", http.request.uri.path)`, preserving the query string. A proxied `www` A record uses Cloudflare’s redirect-only address `192.0.2.1`.

### Colour wall ordering

The wall adapts Stipplewise’s existing shared OKLab colour ramps, paint categories, and dark-to-light rack packing. The adapted MIT modules and their licence are in `dist/catalogue/color/`. Similar swatches across brands combine by default using Stipplewise’s OKLab distance threshold (< 0.025), within a colour family and paint group. The wall shows both record and swatch counts. Combined tiles open a chooser for the individual records; the checkbox restores one tile per paint. Missing colours, distinct finishes, colour-shift ranges, and paints from the same brand stay separate. Grouping compares against the lead swatch, preventing transitive chains. Family assignments are derived presentation data and do not modify the catalog schema or imply a paint equivalence. Wall grouping can be switched to brand and range. Swatch size controls reveal names at larger sizes.

Swatch finish rendering follows Stipplewise: speedpaints show three illustrative shadow/base/highlight bands; every metallic, including airbrush metallics, gets a generated sheen. Source gradient stops remain unmodified in the catalog data and are shown separately in paint details. Missing swatches are never generated from names.

## Shared paint grouping package

The canonical rules are `dist/catalogue/color/categories.mjs`, exported as **@paintcommons/paint-groups** by this repository’s package manifest. The catalogue imports that module directly; Stipplewise installs an immutable GitHub archive revision of the same package. It uses no runtime network access for classification. When changing these rules, update Stipplewise’s pinned dependency and lockfile in the same release; its parity test checks its wrapper against this package.

Groups distinguish Airbrush colours, Airbrush metallics, and other Metallics. The shared predicates also drive metallic and speedpaint rendering, keeping group and finish decisions consistent. Range names identify airbrush application only where the published range explicitly says Air/Airbrush. Paint records and their source metadata remain unchanged.
