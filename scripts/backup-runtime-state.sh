#!/usr/bin/env bash
# backup-runtime-state.sh: snapshot gitignored runtime state before it can be lost.
#
# jobs.json, job-counters.json, gtasks-lists.json, inbox-sweep-state.json, and
# cold-outreach-state.json are deliberately gitignored (per-machine, never pushed),
# which means git is no safety net for them. This copies whichever of those exist
# into data/backups/runtime-state/<YYYY-MM-DD-HHMM>/ and keeps only the newest 14
# snapshots. Fast, silent, and always exits 0 so it never blocks the caller.
#
# Manual use:  bash scripts/backup-runtime-state.sh
# As a hook:   called at the top of scripts/kerri-sync.sh (session Stop)

set -uo pipefail

BRAIN_DIR="/Users/brianderario/Documents/Documents - Brian's MacBook Air/KerriOS"
cd "$BRAIN_DIR" || exit 0

FILES=(
  "data/jobs.json"
  "data/job-counters.json"
  "data/gtasks-lists.json"
  "data/inbox-sweep-state.json"
  "data/cold-outreach-state.json"
)

BACKUP_ROOT="$BRAIN_DIR/data/backups/runtime-state"
SNAP_DIR="$BACKUP_ROOT/$(date '+%Y-%m-%d-%H%M')"

mkdir -p "$SNAP_DIR" 2>/dev/null || exit 0

for f in "${FILES[@]}"; do
  [ -f "$f" ] && cp -p "$f" "$SNAP_DIR/" 2>/dev/null
done

# Prune: keep only the newest 14 snapshots (dir names sort chronologically,
# so reverse-sorted rows past the 14th are the oldest).
ls -1 "$BACKUP_ROOT" 2>/dev/null | sort -r | awk 'NR > 14' | while read -r old; do
  [ -n "$old" ] && rm -rf "${BACKUP_ROOT:?}/$old" 2>/dev/null
done

exit 0
