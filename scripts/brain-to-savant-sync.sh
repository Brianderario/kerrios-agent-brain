#!/usr/bin/env bash
# Push the git brain + Claude memory layer into Savant so the hub stays current
# with what agents have written to git. Until the Phase 3 write-path flip, git
# is still the write target, so this resync is what keeps Savant-as-read-source
# from drifting. Safe to run repeatedly: the importer is idempotent (content
# hash) and never overrides human status/sensitivity/domain decisions made in
# Savant.
#
# Wired into the nightly kerri-brain-push routine; also runnable by hand.
set -euo pipefail

export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"

RAILS_DIR="${KERRIHQ_RAILS_DIR:-$HOME/Projects/kerrihq-rails}"
SECRETS="${KERRI_SECRETS_FILE:-$HOME/.kerri-chief/secrets/kerrihq.env}"

if [ ! -d "$RAILS_DIR" ]; then
  echo "brain-to-savant-sync: kerrihq-rails not found at $RAILS_DIR; skipping (Savant resync unavailable on this host)." >&2
  exit 0
fi

# shellcheck disable=SC1090
set -a; . "$SECRETS" 2>/dev/null || true; set +a

if [ -z "${KERRIHQ_BRAIN_IMPORT_KEY:-}" ]; then
  echo "brain-to-savant-sync: KERRIHQ_BRAIN_IMPORT_KEY missing; cannot push to Savant." >&2
  exit 1
fi

export CONSOLE_URL="${CONSOLE_URL:-https://kerrihq-rails-xtua.onrender.com}"
export CONSOLE_API_KEY="$KERRIHQ_BRAIN_IMPORT_KEY"
export SOURCE_KEYS="${SOURCE_KEYS:-kerrios_brain,claude_memory}"

cd "$RAILS_DIR"
echo "brain-to-savant-sync: pushing [$SOURCE_KEYS] to $CONSOLE_URL"
bundle exec rails kerrios:console_push

# Phase 4: also mirror the agent operating layer (SKILL.md prompts) into the
# Savant Agent registry. Read-mirror only; git stays the source of truth the
# runner loads. Non-fatal if it fails, so a prompt-mirror hiccup never blocks
# the knowledge sync above.
echo "brain-to-savant-sync: mirroring agent prompts to $CONSOLE_URL"
bundle exec rails kerrios:push_agent_prompts || echo "brain-to-savant-sync: agent-prompt mirror failed (non-fatal)" >&2
