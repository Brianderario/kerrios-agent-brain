#!/usr/bin/env bash
# Install this repo's git hooks. Currently: a pre-commit guard that blocks any commit
# which would truncate brain/log.md (see scripts/git-hooks/pre-commit). Idempotent —
# safe to re-run. Run once per clone:  bash scripts/install-git-hooks.sh
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC="$REPO/scripts/git-hooks"
DEST="$REPO/.git/hooks"

[ -d "$REPO/.git" ] || { echo "install-git-hooks: $REPO has no .git/ — not a git repo" >&2; exit 1; }
[ -d "$SRC" ] || { echo "install-git-hooks: no $SRC to install from" >&2; exit 1; }
mkdir -p "$DEST"

for hook in "$SRC"/*; do
  [ -f "$hook" ] || continue
  name="$(basename "$hook")"
  dst="$DEST/$name"
  # Back up a pre-existing hook we don't manage, once, so we never clobber custom hooks.
  if [ -e "$dst" ] && ! grep -q "scripts/git-hooks" "$dst" 2>/dev/null; then
    cp "$dst" "$dst.local-backup.$(date +%s)" 2>/dev/null || true
    echo "install-git-hooks: backed up existing unmanaged $name"
  fi
  cp "$hook" "$dst"
  chmod +x "$dst"
  echo "install-git-hooks: installed $name -> $dst"
done
