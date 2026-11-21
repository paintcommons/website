# Paint Commons website

The website and browsable catalogue for **paintcommons.org**, an open, living miniature paint reference maintained by the community. This website is separate from the [catalog](https://github.com/paintcommons/catalog) and the Stipplewise app.

## Development

Read [AGENTS.md](AGENTS.md) and [COPY_STYLE.md](COPY_STYLE.md) before changing the site. Use a feature branch or separate worktree and open a pull request for review. Work on public paint records belongs in [paintcommons/catalog](https://github.com/paintcommons/catalog); changes to the app belong in [Stipplewise](https://github.com/Left47/stipplewise).

The website uses plain HTML, CSS, and JavaScript modules. `dist/` is checked-in source, not disposable build output. There is no bundling step or application dependency installation. Use Node.js 22 for tests and Python 3 for a static preview:

```sh
npm test
```

Serve the site locally:

```sh
python3 -m http.server 8765 --directory dist
```

## Cloudflare Pages

- Project: `paintcommons`
- Production branch: `main`
- Build command: leave empty
- Build output directory: `dist`
- Framework preset: None

Routine production releases use **Deploy website to Cloudflare Pages** in GitHub Actions. Changes under `dist/`, `functions/`, `wrangler.jsonc`, or the deploy workflow trigger it on `main`; documentation-only commits do not. Obtain Jim's authorization before publishing to `main` or changing live service configuration. Monitor the workflow after a release. The workflow currently deploys without running the test suite, so run `npm test` before review.

## Content

Catalog pull requests and reviewed Stipplewise corrections feed the public catalog through its existing two-way sync. Website correction forms create review issues; they do not edit catalog records directly. Photos are not supported by that form. Only approved public information belongs in the catalogue.

Catalog data uses CC0 with source-specific exceptions and notices; see the [catalog licence and provenance rules](https://github.com/paintcommons/catalog#licence). Shared code in `dist/catalogue/color/` is MIT. Preserve upstream notices and do not transfer proprietary Stipplewise code here without explicit authorization.

The visual identity and wording follow the project’s brand brief, while giving Paint Commons its own reference-library character.

## Automatic deployment setup

The initial release is deployed directly to [Cloudflare Pages](https://paintcommons.pages.dev). Cloudflare's native GitHub integration could not be created because its GitHub App is not installed/configured for the organization. This project therefore uses the supported Direct Upload + GitHub Actions route.

The workflow in `.github/workflows/deploy.yml` deploys matching site, function, configuration, or workflow changes on `main` (or a manual workflow run). Until credentials are configured, it reports a warning and skips deployment.

1. Create a Cloudflare API token with **Account → Cloudflare Pages → Edit**, restricted to the hosting account. Follow [Cloudflare's CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
2. Add the token as the **CLOUDFLARE_API_TOKEN** [repository Actions secret](https://github.com/paintcommons/website/settings/secrets/actions). Never commit the token or paste it into an issue.
3. The **CLOUDFLARE_ACCOUNT_ID** repository variable is configured separately; it is not a secret.
4. Run **Deploy website to Cloudflare Pages** from the Actions tab to verify the connection. Subsequent website changes on `main` deploy automatically.

The custom domain [paintcommons.org](https://paintcommons.org) is connected to this Pages project through a proxied root CNAME targeting `paintcommons.pages.dev`. The `pages.dev` address also remains available.

## Browsable catalogue

`/catalogue/` provides search by name, code, or barcode; brand, range, type, and availability filters; a colour wall, cards/list views, grouping by paint type or brand/range, and pagination for cards/list; and shareable paint records with sources and barcode provenance. Paint swatches are explicitly approximate. No collection or account data is used.

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

The wall adapts Stipplewise’s existing shared OKLab colour ramps, paint categories, and dark-to-light rack packing. Its foundation is the 27 Army Painter Fanatic-inspired runs. Six neighbouring runs extend that structure for the broader catalog: olive drabs, golden ochres, muted earths, golden skins, grey olives, and yellow olives. Their fixed paths use existing published catalog swatches; they are presentation groups, not official Army Painter categories. The original Fanatic anchor assignments are regression-tested. Historical uniform and camouflage names (including drab, khaki, field grey, and RLM codes) exclude skin runs while colour distance chooses among the remaining families; explicit skin/flesh names take precedence. The paths and parallel-column packing are exported by this repository for use in both the website and Stipplewise. The adapted MIT modules and their licence are in `dist/catalogue/color/`. Similar swatches across brands combine by default using Stipplewise’s OKLab distance threshold (< 0.025), within a colour family and paint group. The wall shows both record and swatch counts. Combined tiles open a chooser for the individual records; the checkbox restores one tile per paint. Missing colours, distinct finishes, colour-shift ranges, and paints from the same brand stay separate. Grouping compares against the lead swatch, preventing transitive chains. Family assignments are derived presentation data and do not modify the catalog schema or imply a paint equivalence. Wall grouping can be switched to brand and range. Swatch size controls reveal names at larger sizes. Long runs split into parallel columns by hue/chroma deviation from their fixed anchor path, then each column sorts dark to light. Black, white, and greys; warm greys; and bone keep their continuous lightness order. Column assignment may adapt to the filtered paints and viewport; family assignment depends only on the paint. Outside the anchor lightness range, paths taper toward black or white while retaining a distance penalty for extrapolation.

Swatch finish rendering follows Stipplewise: speedpaints show three illustrative shadow/base/highlight bands; every metallic, including airbrush metallics, gets a generated sheen. Source gradient stops remain unmodified in the catalog data and are shown separately in paint details. Missing swatches are never generated from names.

## Shared paint grouping package

The canonical rules are `dist/catalogue/color/categories.mjs`, exported as **@paintcommons/paint-groups** by this repository’s package manifest. The catalogue imports that module directly; Stipplewise installs an immutable GitHub archive revision of the same package. It uses no runtime network access for classification. When changing these rules, update Stipplewise’s pinned dependency and lockfile in the same release; its parity test checks its wrapper against this package.

Groups distinguish Airbrush colours, Airbrush metallics, and other Metallics. The shared predicates also drive metallic and speedpaint rendering, keeping group and finish decisions consistent. Range names identify airbrush application only where the published range explicitly says Air/Airbrush. Paint records and their source metadata remain unchanged.

## Corrections from the catalogue

Each paint's details have a **Suggest a correction** form. Visitors don't need a GitHub account. `functions/api/corrections.js`, a Cloudflare Pages Function, does four things:

1. It checks a Cloudflare Turnstile token.
2. It validates the suggestion with the rules in `dist/catalogue/correction-rules.mjs`, which the form also uses.
3. It reads the paint's current record from `paintcommons/catalog` on GitHub.
4. It opens an issue labelled `correction` and `needs-review`, authored by the **Paint Commons Corrections** GitHub App.

User text is escaped so it can't mention people, link issues or inject HTML. The issue ends with a hidden `paintcommons-correction` JSON comment for later automation. Nothing about the sender is stored. Until every setting below is in place, the form stays hidden and the dialog links to GitHub's editor as before. Photos aren't supported yet.

### Setup

1. **GitHub App.** In the paintcommons organisation, go to Settings → Developer settings → GitHub Apps → New GitHub App:
   - name: Paint Commons Corrections
   - homepage: `https://paintcommons.org`
   - Webhook: inactive
   - Repository permissions: **Issues: Read and write** only (Metadata: read is added automatically)
   - Where can this be installed: only this account

   Generate a private key, then install the App on **paintcommons/catalog** only. Note the App ID, and the installation ID from the end of the installation's settings URL.
2. **Labels.** Create `correction` and `needs-review` in paintcommons/catalog.
3. **Turnstile.** In Cloudflare go to Turnstile → Add widget for `paintcommons.org` (and `paintcommons.pages.dev`), mode Managed. Note the site key and secret key.
4. **Pages settings.** The public values are in `wrangler.jsonc` under `vars`: `TURNSTILE_SITE_KEY`, `GITHUB_APP_ID` (5820966) and `GITHUB_INSTALLATION_ID` (183418682; it changes if the App is uninstalled and reinstalled). Because the file declares `vars`, Cloudflare takes plain-text variables from it rather than from the dashboard. Set the two secrets yourself, never in chat or the repository:

   ```sh
   npx wrangler@4.164.0 pages secret put TURNSTILE_SECRET_KEY --project-name paintcommons
   npx wrangler@4.164.0 pages secret put GITHUB_APP_PRIVATE_KEY --project-name paintcommons < key.pem
   ```

   The private key can be PKCS#1 or PKCS#8. Delete the downloaded `.pem` afterwards, or keep it only in a password manager.
5. **Rate limit.** In Cloudflare go to Security → WAF → Rate limiting rules. Add a rule for URI path equals `/api/corrections` and method `POST`: block for 10 seconds when an IP exceeds 3 requests in 10 seconds.
6. Run **Deploy website to Cloudflare Pages** on the authorized `main` revision so `functions/` is included. Secret provisioning is a separate maintainer task, not part of normal contributor setup.

### Local testing

Create a git-ignored `.dev.vars` with Cloudflare's always-pass Turnstile test keys and dry-run mode:

```sh
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
CORRECTIONS_DRY_RUN=1
```

Then run `npx wrangler@4.164.0 pages dev dist` from the repository root and open `/catalogue/` at the address it prints. Dry-run mode returns the issue it would create instead of calling GitHub. A static Python preview cannot execute the Pages Function. Keep `.dev.vars` ignored and do not copy production private keys into a contributor checkout.

## Repository map and review checks

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Landing page |
| `dist/catalogue/` | Browser UI, filters, colour wall, correction rules, and shared grouping modules |
| `dist/data/` | Bundled public fallback snapshot and its data licence |
| `functions/api/corrections.js` | Turnstile validation and GitHub correction issue creation |
| `scripts/catalogue.test.mjs` | Catalogue, wall, provenance, and correction regression tests |
| `scripts/sync-catalog.mjs` | Rebuilds the bundled snapshot from a committed catalog checkout |
| `wrangler.jsonc` | Public Pages configuration; secrets remain outside Git |

Before review, run `npm test` and preview the affected page at phone and desktop widths in the Codex in-app browser. Check search/filters, paint details, wall grouping, and missing-colour behavior when those areas change. Test correction requests only in dry-run mode. Use [COPY_STYLE.md](COPY_STYLE.md) for British spelling and factual labels.

Keep changes to the shared package coordinated with Stipplewise's immutable dependency pin and lockfile; test both consumers for a shared-rule release. A website deployment alone does not update the app's installed package.

## Contributor attribution

Human contributors use their own Git identities; no per-person email allowlist is required. Agents acting for Jim use his configured identity and must not add agent authors, co-authors, signatures, or generation credits. `scripts/attribution/policy.json` supplies this policy to the shared attribution hooks when installed; the policy file itself does not install hooks or a CI check. Repository access and maintainer review remain separate from attribution validation.
