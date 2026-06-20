#!/usr/bin/env bash
# Export canonical Savant brain edits back into the local git brain, so Savant
# is the authoring surface and git stays a faithful backing store (Phase 3 of
# the 2026-06-17 "Savant as company hub" decision). Inverse of
# brain-to-savant-sync.sh.
#
# SAFE by construction (Kerrios::GitExporter): it only writes a git file when
# that file is unchanged since its last import (content-hash match) but the
# Savant body differs — i.e. a genuine Savant-side edit. A git file edited
# locally since import is NEVER overwritten; the importer carries it git ->
# Savant instead. Frontmatter is preserved (only the body is replaced).
#
# Run order matters: export (Savant -> git) runs BEFORE the git commit and
# BEFORE brain-to-savant-sync.sh (git -> Savant), so both directions reconcile.
set -euo pipefail

export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"

RAILS_DIR="${KERRIHQ_RAILS_DIR:-$HOME/Projects/kerrihq-rails}"
SECRETS="${KERRI_SECRETS_FILE:-$HOME/.kerri-chief/secrets/kerrihq.env}"
# Default the repo root in a plain assignment, then export it. As of kerrihq-rails#120
# (2026-06-19) kerrios.rake REQUIRES KERRIOS_ROOT and aborts if unset, so this export is
# mandatory. Plain assignment (not a ${VAR:-default} expansion) because the retired
# iCloud default ("Brian's MacBook Air") had an apostrophe that bash mis-parsed as an
# unterminated quote inside the expansion; the relocated path has none, but the form is kept.
if [ -z "${KERRIOS_ROOT:-}" ]; then
  KERRIOS_ROOT="$HOME/Projects/kerrios-agent-brain"
fi
export KERRIOS_ROOT

if [ ! -d "$RAILS_DIR" ]; then
  echo "savant-to-brain-export: kerrihq-rails not found at $RAILS_DIR; skipping (export unavailable on this host)." >&2
  exit 0
fi

# shellcheck disable=SC1090
set -a; . "$SECRETS" 2>/dev/null || true; set +a

if [ -z "${KERRIHQ_AGENT_API_KEY:-}" ]; then
  echo "savant-to-brain-export: KERRIHQ_AGENT_API_KEY (brain:read) missing; cannot pull from Savant." >&2
  exit 1
fi

export CONSOLE_URL="${CONSOLE_URL:-https://kerrihq-rails-xtua.onrender.com}"
export CONSOLE_API_KEY="$KERRIHQ_AGENT_API_KEY"
# APPLY defaults to 1 here (this script's whole job is to write); pass APPLY=0 to dry-run.
export APPLY="${APPLY:-1}"

cd "$RAILS_DIR"
echo "savant-to-brain-export: APPLY=$APPLY pulling canonical brain from $CONSOLE_URL"
bundle exec rails kerrios:export_from_savant
