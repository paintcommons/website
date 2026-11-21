#!/usr/bin/env python3
"""Install attribution hooks without deleting existing Git hooks. MIT licensed."""
import argparse
from pathlib import Path
import shutil
import subprocess

SOURCE = Path(__file__).resolve().parent
HOOKS = ['applypatch-msg', 'pre-applypatch', 'post-applypatch', 'pre-commit', 'pre-merge-commit', 'prepare-commit-msg', 'commit-msg', 'post-commit', 'pre-rebase', 'post-checkout', 'post-merge', 'pre-push', 'pre-receive', 'update', 'proc-receive', 'post-receive', 'post-update', 'reference-transaction', 'push-to-checkout', 'post-rewrite', 'sendemail-validate', 'fsmonitor-watchman', 'p4-changelist', 'p4-prepare-changelist', 'p4-post-changelist', 'p4-pre-submit', 'post-index-change']


def install():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--global', dest='global_install', action='store_true')
    args = parser.parse_args()
    if not args.global_install:
        current = subprocess.run(['git', 'config', '--local', '--get', 'core.hooksPath'], text=True, capture_output=True)
        if current.returncode not in (0, 1) or current.stdout.strip() not in ('', '.githooks'):
            raise RuntimeError('Existing repository core.hooksPath found; refusing to replace it.')
        subprocess.run(['git', 'config', '--local', 'core.hooksPath', '.githooks'], check=True)
        print('Repository hooks enabled. Existing custom hooksPath must be migrated before using this mode.')
        return
    destination = Path.home() / '.config/git/attribution-guard'
    current = subprocess.run(['git', 'config', '--global', '--get', 'core.hooksPath'], text=True, capture_output=True)
    if current.returncode not in (0, 1):
        raise RuntimeError(current.stderr)
    if current.stdout.strip() and Path(current.stdout.strip()).expanduser() != destination:
        raise RuntimeError('Existing global core.hooksPath found; refusing to replace it.')
    destination.mkdir(parents=True, exist_ok=True)
    for name in ['guard.py', 'policy.json', 'dispatch.py', 'LICENSE']:
        shutil.copy2(SOURCE / name, destination / name)
    for name in HOOKS:
        target = destination / name
        target.write_text('#!/bin/sh\nexec python3 "$(dirname "$0")/dispatch.py" "$(basename "$0")" "$@"\n')
        target.chmod(0o755)
    subprocess.run(['git', 'config', '--global', 'core.hooksPath', str(destination)], check=True)
    print(f'Shared attribution hooks installed at {destination}')
    print('Existing repository hooks are chained. Repository-local core.hooksPath overrides the shared setting.')


if __name__ == '__main__':
    install()
