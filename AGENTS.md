# Paint Commons website: agent instructions

## Production deployment

- Every push to `main` automatically runs **Deploy website to Cloudflare Pages** in GitHub Actions. The workflow validates and bundles the public catalogue, runs the website tests, and deploys the triggering website revision and Pages Functions to the existing `paintcommons` project.
- Deploy only through GitHub Actions. Do not run local Wrangler uploads, use dashboard uploads, or deploy through Sites or another service. Legacy commands in old notes are not permission to use them.
- After an authorized push or merge, monitor the workflow and report its result and URL. If it fails, fix or retry the workflow; do not fall back to a local deployment. Manual **Run workflow** requests must select `main`.
- Daily catalogue refreshes also run through this workflow. Keep its validation, attribution, permanent-ID checks and production concurrency group intact. Never drop paints or invent IDs to force a deployment.
- The workflow summary and `/deployment.json` identify the website commit and bundled catalogue revision. A run superseded by newer `main` skips publication. To undo a release, revert the change on `main` and let Actions publish it.
- Keep credentials out of chat and git. Deployment credentials belong in GitHub Actions secrets; runtime secrets stay in Cloudflare. Ask the user to enter new credentials directly in the relevant settings.

## Development

Run `npm test` before merging. Local static serving, catalogue bundling and `wrangler pages dev` are available for development. Read `README.md` for setup and the canonical shared paint-grouping package contract with Stipplewise.
