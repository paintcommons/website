# Paint Commons website: agent instructions

Read `README.md`, `COPY_STYLE.md`, `package.json`, and the relevant tests before editing. This repo owns paintcommons.org and the shared `@paintcommons/paint-groups` package. Public paint facts belong in `paintcommons/catalog`; account data belongs in Stipplewise.

## Working with contributors

- Inspect `git status`, `git worktree list`, and branch history before starting. Use your own worktree and topic branch from `main` (Codex branches use `codex/<topic>`). Do not edit another contributor's checkout or absorb unfinished branches.
- Coordinate overlapping files with Jim. This repo has no `npm run wip`; check the Stipplewise WIP board too when a task spans both repos on Jim's Mac.
- Keep one topic per branch and commit plain, descriptive messages. Agents working for Jim use his configured human identity; human contributors use their own. Never add agent authors, co-authors, signatures, or generation credits, and never bypass attribution hooks/checks.
- Use the Codex in-app browser for browser interactions unless Jim explicitly requests an exception.

## Implementation rules

- `dist/` contains versioned source. Do not delete or regenerate it as if it were build output. There is no frontend build step.
- Follow `COPY_STYLE.md`: British spelling, sentence case, factual wording, and manufacturer names preserved as published.
- Calculated colour families, wall packing, and generated swatch effects are presentation data. Never write them into public manufacturer facts, fabricate missing swatches, or publish generated gradient stops.
- Preserve source identifiers, attribution, licences, and record links. Catalog records and colours are approximate facts with source-specific provenance; do not describe all upstream material as CC0.
- Canonical shared grouping/ramp/packing code lives in `dist/catalogue/color/` and is exported by `package.json`. Coordinate any rule changes with Stipplewise's pinned archive revision, lockfile, and backend module mapping where relevant. Run tests for both consumers. Do not copy proprietary Stipplewise code into this open repo without Jim's authorization.
- Keep corrections behind Turnstile and the shared validation rules. User input must not inject HTML, mentions, or issue references. Correction issues require maintainer review before data changes.

## Checks and live services

- Run `npm test` before review. Preview affected pages at phone and desktop widths. A static server does not run Pages Functions; use the README's local Wrangler setup for those.
- Use `CORRECTIONS_DRY_RUN=1` and Turnstile test keys for local correction tests. Never file live correction issues as test data. Keep `.dev.vars`, private keys, tokens, and sender information out of Git and chat.
- Routine production releases use **Deploy website to Cloudflare Pages** after authorized changes to `main`. The workflow has path filters and currently does not run tests. Run checks locally and monitor the release result.
- Ask Jim before pushing `main` unless the task already authorizes publication. Secret provisioning, GitHub App installation, Turnstile, rate limits, and DNS are separate infrastructure tasks requiring authorization.
