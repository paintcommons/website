#!/usr/bin/env python3
"""Chain existing repository hooks after the shared attribution check. MIT licensed."""
from pathlib import Path
import os
import subprocess
import sys

HERE = Path(__file__).resolve().parent
hook, *args = sys.argv[1:]
data = sys.stdin.buffer.read() if hook in {'pre-push', 'pre-receive', 'post-receive', 'post-rewrite', 'reference-transaction'} else None
if hook in {'commit-msg', 'pre-push'}:
    # Use the installed validator, with a repository policy when one is present.
    top = subprocess.check_output(['git', 'rev-parse', '--show-toplevel'], text=True).strip()
    policy = Path(top) / 'scripts/attribution/policy.json'
    env = dict(os.environ)
    if policy.exists():
        env['ATTRIBUTION_POLICY'] = str(policy)
    checked = subprocess.run(['python3', str(HERE / 'guard.py'), hook, *args], input=data, env=env)
    if checked.returncode:
        sys.exit(checked.returncode)
# git init invokes reference hooks before the repository is fully initialized.
resolved = subprocess.run(['git', 'rev-parse', '--path-format=absolute', '--git-common-dir'], text=True, capture_output=True)
if resolved.returncode:
    sys.exit(0)
common = Path(resolved.stdout.strip())
original = common / 'hooks' / hook
if original.is_file() and os.access(original, os.X_OK) and original.resolve() != (HERE / hook).resolve():
    sys.exit(subprocess.run([str(original), *args], input=data).returncode)
