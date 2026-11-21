# Attribution guard

Commits and pull requests must not credit coding agents as authors, co-authors,
signatories, or generators. Ordinary discussion of agents and app features is fine.
Existing history is not rewritten by this guard.

The dependency-free Python validator checks author and committer identities,
attribution trailers, and assistance/generation credit. Human contributors use
their own Git identities, including personal, work, and GitHub noreply addresses;
human co-authors and signatories are allowed. There is no per-person email
allowlist or enrollment requirement. Agents acting for Jim still use his
configured identity, as described in `AGENTS.md`.

Policy lives in `scripts/attribution/policy.json`. Setting `authorEmails` to `null`
allows human identities generally; the recognized-agent and credit checks still
run first. Paint Commons uses the same open-contributor policy. Repository access,
maintainer review, and branch protection control who can publish; an attribution
check is not proof of humanity or authorship. New agent names may need adding to
the recognizer. Existing GitHub Actions sync and GitHub web committer identities
remain accepted.

## Local hooks

Run `python3 scripts/attribution/install.py --global` to install shared hooks for
this Mac. It copies the validator and default policy to
`~/.config/git/attribution-guard` and sets global `core.hooksPath`. Existing default
repository hooks are chained, including hooks unrelated to attribution. An existing
global custom hook directory is never overwritten. Repositories with a local
`core.hooksPath` override the global setting and need their own integration.
The shared validator uses a repository's versioned policy when present.

For another machine, `python3 scripts/attribution/install.py` enables this repo's
`.githooks` instead. This refuses to overwrite an existing custom hook setting.

`commit-msg` rejects bad metadata before commit creation. `pre-push` validates
outgoing commits, including commits created with `--no-verify`. Existing remote
history is excluded on new branches; new changes to existing refs are checked
against the remote's previous commit. Missing remote objects fail closed: fetch
that named remote and retry. Neither hook rewrites messages or identities.
Local hooks can be disabled or bypassed, so they are not a security boundary.

To uninstall the shared hooks: `git config --global --unset core.hooksPath`.
The installed files can then be removed. No previous global setting is overwritten.

## GitHub

The **Attribution guard** job runs on pushes, PR creation/update/edit, and manual
runs. PR checks run the default branch's trusted validator and inspect head commit
objects as data; they never execute PR code or install its dependencies. PR titles,
bodies, and recognized agent PR authors are checked too. Push checks cover only
new commits. Manual runs validate the selected commit.

Require the **Attribution guard** status check on `main` with GitHub rulesets and
restrict bypass permissions. Private repositories on GitHub Free cannot enforce
branch protection; GitHub Pro (or a supported organization plan) is required.
A failed workflow on its own does not stop a merge or undo a push.
Stipplewise also makes its production deployment job depend on attribution
validation, so a failed check prevents deployment through that workflow.

Paint Commons' catalog sync deploy key retains its existing bypass so hourly
approved-data exports can continue. That sync validates its new commit locally
before pushing. The guard doesn't contact or change any live service.

Run tests with `python3 -m unittest discover -s scripts/attribution -p 'test_*.py'`.
