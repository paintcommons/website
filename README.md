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

Contributions through pull requests, APIs, and Stipplewise are described as a planned workflow. Only explicitly submitted and approved information belongs in the public catalog. No final catalog license or live submission API is claimed.

The visual identity and wording follow the project’s brand brief, while giving Paint Commons its own reference-library character. The project has no affiliation with Wikipedia or Creative Commons.

## Automatic deployment setup

The initial release is deployed directly to [Cloudflare Pages](https://paintcommons.pages.dev). Cloudflare's native GitHub integration could not be created because its GitHub App is not installed/configured for the organization. This project therefore uses the supported Direct Upload + GitHub Actions route.

The workflow in `.github/workflows/deploy.yml` deploys changes to `dist/` on `main` (or a manual workflow run). Until credentials are configured, it reports a warning and skips deployment.

1. Create a Cloudflare API token with **Account → Cloudflare Pages → Edit**, restricted to the hosting account. Follow [Cloudflare's CI guide](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/).
2. Add the token as the **CLOUDFLARE_API_TOKEN** [repository Actions secret](https://github.com/paintcommons/website/settings/secrets/actions). Never commit the token or paste it into an issue.
3. The **CLOUDFLARE_ACCOUNT_ID** repository variable is configured separately; it is not a secret.
4. Run **Deploy website to Cloudflare Pages** from the Actions tab to verify the connection. Subsequent website changes on `main` deploy automatically.

The custom domain `paintcommons.org` still requires domain activation and DNS configuration. The `pages.dev` address works independently.
