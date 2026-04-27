#!/bin/sh
# Check if the lockfile or package.json changed between the previous state (ORIG_HEAD) and the current state (HEAD)
if git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD | grep -qE 'package.json|bun.lock'; then
  echo "📦 Dependencies changed, running bun install..."
  bun install
fi
