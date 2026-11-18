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
