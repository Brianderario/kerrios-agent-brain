#!/bin/bash
# Daily reconcile of the Hardware FYI newsletter calendar across its two surfaces
# (Savant system-of-record <-> HWFYI CRM Google Sheet) during the Savant transition.
# Runs the safe auto-mirror, logs the report, and files ONE Console card (deduped
# by external_ref) when an unresolved cross-surface CONFLICT needs Brian's call.
# Retire this job once Ari + Benji are fully on Savant.
set -uo pipefail
REPO="$HOME/Projects/kerrios-agent-brain"
NODE="/opt/homebrew/bin/node"
LOG="$REPO/data/logs"
mkdir -p "$LOG"
cd "$REPO" || exit 1

STAMP="$(date '+%Y-%m-%d %H:%M')"
REPORT="$("$NODE" scripts/newsletter-calendar-reconcile.mjs --apply 2>&1)"
CODE=$?
{ echo "=== $STAMP (exit $CODE) ==="; echo "$REPORT"; echo; } >> "$LOG/newsletter-sync.log"

if [ "$CODE" -eq 2 ]; then
  REF="kerrios:newsletter-sync-conflict"
  # dedupe: only create the card if an open one with this ref isn't already present
  EXISTING="$("$NODE" scripts/console-task-api.mjs list --json 2>/dev/null | grep -c "$REF")"
  if [ "${EXISTING:-0}" -eq 0 ]; then
    CONFLICTS="$(printf '%s\n' "$REPORT" | sed -n '/^CONFLICTS/,/^Savant -> Sheet/p' | sed '$d')"
    "$NODE" scripts/console-task-api.mjs create \
      --status needs_approval --agent-slug newsletter-calendar-reconcile --property-slug hardware-fyi \
      --external-ref "$REF" \
      --title "Newsletter calendar: Savant <> Sheet conflict needs a call" \
      --body "Daily reconcile found a date booked to different sponsors on each surface. Resolve in whichever is correct, then the daily sync will agree.

$CONFLICTS

(Auto-filed by newsletter-calendar-reconcile. Close this card once resolved.)" >/dev/null 2>&1
  fi
fi
exit 0
