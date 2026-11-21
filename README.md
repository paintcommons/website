# Paint Commons website

The website and browsable catalogue for **paintcommons.org**, an open, living miniature paint reference maintained by the community. This website is separate from the [catalog](https://github.com/paintcommons/catalog) and the Stipplewise app.

## What's on the site

[The catalogue](https://paintcommons.org/catalogue/) lets you search paints by name, code, or barcode; filter by brand, range, type, and availability; and browse a colour wall, cards, or a list, grouped by paint type or by brand and range. Every paint has a shareable record with its sources and barcode provenance. Paint swatches are explicitly approximate, and no collection or account data is used.

The colour wall arranges paints in dark-to-light runs and folds near-identical swatches across brands into one tile, which opens to show each paint. Larger swatch sizes reveal names.

Each paint's details have a **Suggest a correction** form. Visitors don't need a GitHub account; a suggestion opens a review issue on the catalog and never edits records directly.

## Content and licence

Catalog pull requests and reviewed Stipplewise corrections feed the public catalog through its existing two-way sync. Website correction forms create review issues; they do not edit catalog records directly. Photos are not supported by that form. Only approved public information belongs in the catalogue.

The website's code is under the [MIT licence](LICENSE). Catalog data uses CC0 with source-specific exceptions and notices; see the [catalog licence and provenance rules](https://github.com/paintcommons/catalog#licence). Shared code in `dist/catalogue/color/` is MIT. Preserve upstream notices and do not transfer proprietary Stipplewise code here without explicit authorization.

The visual identity and wording follow the project's brand brief, while giving Paint Commons its own reference-library character.

## Contributing

Work on public paint records belongs in [paintcommons/catalog](https://github.com/paintcommons/catalog); changes to the app belong in [Stipplewise](https://github.com/Left47/stipplewise). Website changes come here as pull requests from a feature branch.

---

## For maintainers and contributors

Everything below covers working on the site: setup, checks, how the catalogue and colour wall work, the corrections backend, and deployment.

### Development

Read [AGENTS.md](AGENTS.md) and [COPY_STYLE.md](COPY_STYLE.md) before changing the site. Use a feature branch or separate worktree and open a pull request for review.

The website uses plain HTML, CSS, and JavaScript modules. `dist/` is checked-in source, not disposable build output. There is no application dependency installation or frontend compilation step. Production deployments rebuild the bundled data from the public catalogue. Use Node.js 22 for tests and Python 3 for a static preview:

```sh
npm test
```

Serve the site locally:

```sh
python3 -m http.server 8765 --directory dist
```

### Repository map and review checks

| Path | Purpose |
| --- | --- |
| `dist/index.html` | Landing page |
| `dist/catalogue/` | Browser UI, filters, colour wall, correction rules, and shared grouping modules |
| `dist/data/` | Bundled public fallback snapshot and its data licence |
| `functions/api/corrections.js` | Turnstile validation and GitHub correction issue creation |
| `scripts/catalogue.test.mjs` | Catalogue, wall, provenance, and correction regression tests |
| `scripts/sync-catalog.mjs` | Rebuilds the bundled snapshot from a committed catalog checkout |
| `wrangler.jsonc` | Public Pages configuration; secrets remain outside Git |

Before review, run `npm test` and `python3 -m unittest discover -s scripts/attribution -p 'test_*.py'` and preview the affected page at phone and desktop widths in a browser (agents working for Jim use their in-app browser). Check search/filters, paint details, wall grouping, and missing-colour behavior when those areas change. Test correction requests only in dry-run mode. Use [COPY_STYLE.md](COPY_STYLE.md) for British spelling and factual labels.

Keep changes to the shared package coordinated with Stipplewise's immutable dependency pin and lockfile; test both consumers for a shared-rule release. A website deployment alone does not update the app's installed package.

### Catalogue data snapshot

`dist/data/catalogue.json` is a bundled, revision-labelled public catalog snapshot. The browser checks GitHub for a newer revision and loads it in the background, falling back to the bundled data on network errors or rate limits. Source records and corrections link back to the canonical catalog repository.

To refresh the bundled fallback from a local checkout of the public catalog:

```sh
node scripts/sync-catalog.mjs /path/to/catalog
node --test scripts/catalogue.test.mjs
```

Catalog data carries the repository's CC0 dedication in `dist/data/LICENSE` and source-specific exceptions in `dist/data/THIRD_PARTY_NOTICES.md`. Full source credits are retained in the JSON and shown in record details. The generated `dist/data/catalogue-version.json` identifies the deployed catalogue revision. Scheduled deployments rebuild these files in the runner; they do not create website commits.

Duplicate paint IDs from the canonical catalogue are retained in the snapshot's `aliases` list. Old record URLs resolve to the canonical paint, including its current code, swatch and correction form. Alias IDs are never counted as extra paints.

### Colour wall ordering

The wall adapts Stipplewise's existing shared OKLab colour ramps, paint categories, and dark-to-light rack packing. Its foundation is the 27 Army Painter Fanatic-inspired runs. Six neighbouring runs extend that structure for the broader catalog: olive drabs, golden ochres, muted earths, golden skins, grey olives, and yellow olives. Their fixed paths use existing published catalog swatches; they are presentation groups, not official Army Painter categories. The original Fanatic anchor assignments are regression-tested. Historical uniform and camouflage names (including drab, khaki, field grey, and RLM codes) exclude skin runs while colour distance chooses among the remaining families; explicit skin/flesh names take precedence. The paths and parallel-column packing are exported by this repository for use in both the website and Stipplewise. The adapted MIT modules and their licence are in `dist/catalogue/color/`.

Similar swatches across brands combine by default using Stipplewise's OKLab distance threshold (< 0.025), within a colour family and paint group. The wall shows both record and swatch counts. Combined tiles open a chooser for the individual records; the checkbox restores one tile per paint. Missing colours, distinct finishes, colour-shift ranges, and paints from the same brand stay separate. Grouping compares against the lead swatch, preventing transitive chains. Family assignments are derived presentation data and do not modify the catalog schema or imply a paint equivalence.

Wall grouping can be switched to brand and range. Swatch size controls reveal names at larger sizes. Long runs split into parallel columns by hue/chroma deviation from their fixed anchor path, then each column sorts dark to light. Black, white, and greys; warm greys; and bone keep their continuous lightness order. Column assignment may adapt to the filtered paints and viewport; family assignment depends only on the paint. Outside the anchor lightness range, paths taper toward black or white while retaining a distance penalty for extrapolation.

Swatch finish rendering follows Stipplewise: speedpaints show three illustrative shadow/base/highlight bands; every metallic, including airbrush metallics, gets a generated sheen. Source gradient stops remain unmodified in the catalog data and are shown separately in paint details. Missing swatches are never generated from names.

Wash and glaze names use the same shared predicate for section grouping and smooth swatch rendering. Wash/glaze mediums remain flat auxiliary products in Effects; names such as Washed Out Blue remain ordinary acrylics. Published paint types, colours and gradients are unchanged.

### Shared paint grouping package

The canonical rules are `dist/catalogue/color/categories.mjs`, exported as **@paintcommons/paint-groups** by this repository's package manifest. The catalogue imports that module directly; Stipplewise installs an immutable GitHub archive revision of the same package. It uses no runtime network access for classification. When changing these rules, update Stipplewise's pinned dependency and lockfile in the same release; its parity test checks its wrapper against this package.

Groups distinguish Airbrush colours, Airbrush metallics, and other Metallics. The shared predicates also drive metallic and speedpaint rendering, keeping group and finish decisions consistent. Range names identify airbrush application only where the published range explicitly says Air/Airbrush. Paint records and their source metadata remain unchanged.

### Corrections backend

`functions/api/corrections.js`, a Cloudflare Pages Function, handles the **Suggest a correction** form in four steps:

1. It checks a Cloudflare Turnstile token.
2. It validates the suggestion with the rules in `dist/catalogue/correction-rules.mjs`, which the form also uses.
3. It reads the paint's current record from `paintcommons/catalog` on GitHub.
4. It opens an issue labelled `correction` and `needs-review`, authored by the **Paint Commons Corrections** GitHub App.

User text is escaped so it can't mention people, link issues or inject HTML. The issue ends with a hidden `paintcommons-correction` JSON comment for later automation. Nothing about the sender is stored. The settings below are in place on paintcommons.org. If any is missing (for example in a preview without secrets), `/api/corrections` reports itself disabled and the dialog falls back to a link to GitHub's editor. Photos aren't supported yet.

#### Setup

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
6. Redeploy through **Deploy website to Cloudflare Pages** on `main`, so `functions/` is included. Keep runtime secret provisioning separate from deploying the website; agents must not upload a local build.

#### Local testing

Create a git-ignored `.dev.vars` with Cloudflare's always-pass Turnstile test keys and dry-run mode:

```sh
TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
CORRECTIONS_DRY_RUN=1
```

Then run `npx wrangler@4.164.0 pages dev dist` from the repository root and open `/catalogue/` at the address it prints. Dry-run mode returns the issue it would create instead of calling GitHub. A static Python preview cannot execute the Pages Function. Keep `.dev.vars` ignored and do not copy production private keys into a contributor checkout.

### Deployment

- Cloudflare Pages project: `paintcommons`
- Production branch: `main`
- Build command: leave empty
- Build output directory: `dist`
- Framework preset: None

Every push to `main` deploys automatically through GitHub Actions after validation and tests. To retry or refresh on demand, use **Run workflow** on `main` in [Deploy website to Cloudflare Pages](https://github.com/paintcommons/website/actions/workflows/deploy.yml). Agents must use this workflow for production; do not upload locally, through the dashboard, or through Sites.

#### How the workflow runs

The site is deployed to [Cloudflare Pages](https://paintcommons.pages.dev) by Direct Upload from GitHub Actions. Cloudflare's native GitHub integration could not be created because its GitHub App is not installed/configured for the organization. That's why the project uses Direct Upload with GitHub Actions.

The workflow in `.github/workflows/deploy.yml` runs on **every push to `main`**, including documentation and configuration changes, and on manual runs selected from `main`. It also checks the public catalogue **daily at 07:37 UTC** and deploys when its revision differs from the live site's `data/catalogue-version.json`. This picks up merged PRs and automated sync commits without a cross-repository token. GitHub schedules can be delayed; use a manual workflow run when a refresh is needed sooner.

Each run checks out the exact triggering website commit and one immutable catalogue revision, validates the catalogue, bundles the records and full attribution notices, runs the website tests, then uploads to Cloudflare Pages. Unchanged daily runs skip deployment. Runs share one production concurrency group; a website commit superseded by newer `main` skips publication. Missing credentials or invalid data fail visibly before upload. The workflow verifies the deployed `/deployment.json` and records the website commit, catalogue revision and deployment URL in its summary. A verification failure after upload marks the run failed but does not automatically undo the deployment.

Retry transient failures through Actions on the current `main` commit. To undo a release, revert the change on `main` and let the workflow deploy the new commit. Do not retry an old release through local tools. Pull requests run the separate **Test website** workflow without publishing.

New paints receive permanent IDs through the catalogue's Stipplewise sync. If any are still missing, deployment waits and the workflow summary reports how many; the next daily run retries. Never invent IDs or drop pending paints to make a partial snapshot. The catalogue sync runs hourly, so ordinary imports should be ready before the next daily website refresh.

#### Credentials setup

1. Create a Cloudflare API token with **Account → Cloudflare Pages → Edit**, restricted to the hosting account. Follow [Cloudflare's CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
2. Add the token as the **CLOUDFLARE_API_TOKEN** [repository Actions secret](https://github.com/paintcommons/website/settings/secrets/actions). Never commit the token or paste it into an issue.
3. The **CLOUDFLARE_ACCOUNT_ID** repository variable is configured separately; it is not a secret.
4. Run **Deploy website to Cloudflare Pages** from the Actions tab to verify the connection. Subsequent website changes on `main` deploy automatically.

#### Domains

The custom domain [paintcommons.org](https://paintcommons.org) is connected to this Pages project through a proxied root CNAME targeting `paintcommons.pages.dev`. The `pages.dev` address also remains available.

Cloudflare Single Redirect matches `http.host eq "www.paintcommons.org"` and returns HTTP 301 to `concat("https://paintcommons.org", http.request.uri.path)`, preserving the query string. A proxied `www` A record uses Cloudflare's redirect-only address `192.0.2.1`.

### Website analytics

The public Google container is `GTM-MNJQ6CND`. `dist/analytics.js` loads it once
only on `https://paintcommons.org`; localhost and Cloudflare preview domains are
excluded. The home, catalogue, and privacy pages include the loader. Page URLs
omit query parameters and fragments, referrers retain only their origin, and
campaign tags accept only letters, numbers, underscores, and hyphens. No search
terms, selected paint IDs, or correction form contents are passed as event fields.
Google signals and advertising personalisation are disabled by the loader.

Google container settings control automatic events; keep enhanced measurement
off while validating traffic tracking. Test installation in the Paint Commons
GA4 property and confirm a visit in Realtime. The catalogue's filter updates do
not have custom page-view events. The footer link to Stipplewise uses
`utm_source=paintcommons&utm_medium=referral`. `/privacy/` describes analytics
and the site's providers. Tests cover production-only loading and URL sanitation.

### Contributor attribution

Human contributors use their own Git identities; no per-person email allowlist is required. Agents acting for Jim use his configured identity and must not add agent authors, co-authors, signatures, or generation credits. The local hooks and GitHub Actions use `scripts/attribution/policy.json`; see [ATTRIBUTION.md](ATTRIBUTION.md) for setup and enforcement. Repository access and maintainer review remain separate from attribution validation.
