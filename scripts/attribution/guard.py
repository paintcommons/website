#!/usr/bin/env python3
"""Reject agent attribution in commit metadata and pull request text. MIT licensed."""
import json
import os
from pathlib import Path
import re
import subprocess
import sys

HERE = Path(__file__).resolve().parent
POLICY = json.loads(Path(os.environ.get('ATTRIBUTION_POLICY', HERE / 'policy.json')).read_text())
AGENT = re.compile(r'\b(codex|claude|anthropic|openai|copilot|cursor|gemini|devin|aider|windsurf|cline|roo[ -]?code|amazon[ -]?q|codeium|tabnine|augment[ -]?code)\b', re.I)
CREDIT = re.compile(r'(?:generated|co[ -]?authored|authored|written|created|assisted|powered|implemented|developed)\s+(?:with|by|using)\b|\b(?:ai[ -]generated|ai[ -]assisted)\b', re.I)
TRAILER = re.compile(r'^\s*(?:co-authored-by|signed-off-by|assisted-by|generated-by|authored-by)\s*:\s*(.*)$', re.I | re.M)


def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()


def identity_error(identity, committer=False):
    if AGENT.search(identity):
        return 'agent author or committer identity'
    match = re.search(r'<([^<>]+)>', identity)
    email = match.group(1).lower() if match else ''
    allowed = POLICY.get('authorEmails')
    if committer and email in POLICY.get('committerEmails', []):
        return None
    if allowed is not None and email not in allowed:
        return 'author email is not approved in scripts/attribution/policy.json'
    return None


def text_errors(text):
    errors = []
    for credit in TRAILER.findall(text):
        if identity_error(credit):
            errors.append('unapproved attribution trailer')
    for line in text.splitlines():
        if CREDIT.search(line) and (AGENT.search(line) or re.search(r'\b(?:AI|LLM|artificial intelligence)\b', line, re.I)):
            errors.append('agent generation or assistance credit')
    return sorted(set(errors))


def check_commits(base, head):
    revisions = [head] if base is None else [f'{base}..{head}']
    commits = git('rev-list', *revisions).splitlines()
    errors = []
    for sha in commits:
        author, committer, message = git('show', '-s', '--format=%an <%ae>%n%cn <%ce>%n%B', sha).split('\n', 2)
        for error in [identity_error(author), identity_error(committer, True), *text_errors(message)]:
            if error:
                errors.append(f'{sha[:12]}: {error}')
    return errors


def pre_push(remote, stream):
    errors = []
    # Check changes introduced to an existing remote ref. For a new ref, omit
    # commits already on that remote: historical attribution is a separate cleanup.
    for line in stream.splitlines():
        local_ref, local_sha, remote_ref, remote_sha = line.split()
        if set(local_sha) == {'0'}:
            continue
        if set(remote_sha) == {'0'}:
            # Invalid remote names cannot turn into git options.
            if not re.fullmatch(r'[\w./-]+', remote) or remote.startswith('-'):
                raise ValueError('Push using a named Git remote (for example origin).')
            commits = git('rev-list', local_sha, '--not', f'--remotes={remote}').splitlines()
            for sha in commits:
                errors.extend(f'{sha[:12]}: {error}' for error in check_one(sha))
        else:
            # A missing remote object is an error, never a silently skipped check.
            errors.extend(check_commits(remote_sha, local_sha))
    return errors


def ci():
    event = json.loads(Path(os.environ['GITHUB_EVENT_PATH']).read_text())
    pr = event.get('pull_request')
    errors = []
    if pr:
        errors.extend(text_errors((pr.get('title') or '') + '\n' + (pr.get('body') or '')))
        if AGENT.search(pr['user']['login']):
            errors.append('agent pull request author')
        base, head = pr['base']['sha'], pr['head']['sha']
        # Fetch objects only; never check out or execute untrusted PR code.
        present = subprocess.run(['git', 'cat-file', '-e', head + '^{commit}'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if present.returncode:
            git('fetch', '--no-tags', 'origin', head)
    elif 'before' in event:
        head = event['after']
        if set(head) == {'0'}:
            return []
        base = event['before']
        if set(base) == {'0'}:
            default = event['repository']['default_branch']
            base = git('rev-parse', f'origin/{default}') if event['ref'] != f'refs/heads/{default}' else None
    else:
        head = os.environ['GITHUB_SHA']
        # Manual runs check the selected commit, not legacy history.
        return check_one(head)
    return errors + check_commits(base, head)


def check_one(sha):
    author, committer, message = git('show', '-s', '--format=%an <%ae>%n%cn <%ce>%n%B', sha).split('\n', 2)
    return [e for e in [identity_error(author), identity_error(committer, True), *text_errors(message)] if e]


def main():
    mode, *args = sys.argv[1:]
    if mode == 'commit-msg':
        errors = text_errors(Path(args[0]).read_text())
        errors += [e for e in [identity_error(git('var', 'GIT_AUTHOR_IDENT')), identity_error(git('var', 'GIT_COMMITTER_IDENT'), True)] if e]
    elif mode == 'pre-push':
        errors = pre_push(args[0], sys.stdin.read())
    elif mode == 'ci':
        errors = ci()
    elif mode == 'range':
        errors = check_commits(*args)
    else:
        raise ValueError('Unknown guard mode')
    if errors:
        print('Attribution guard rejected this change:\n' + '\n'.join(sorted(set(errors))), file=sys.stderr)
        print('Use your human Git identity and remove agent credit. Do not bypass the guard.', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    try:
        sys.exit(main())
    except (ValueError, OSError, subprocess.CalledProcessError, KeyError) as error:
        print(f'Attribution guard could not validate this change: {error}', file=sys.stderr)
        sys.exit(1)
