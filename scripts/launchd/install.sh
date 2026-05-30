#!/usr/bin/env bash
# install.sh — install + (re)load KerriOS LaunchAgents from this directory.
#
# Idempotent: copies every com.kerri.*.plist here into ~/Library/LaunchAgents,
# then bootout + bootstrap each so a changed interval/args takes effect. Safe to
# re-run. Pass a label to (re)load just one, e.g.:
#   bash scripts/launchd/install.sh com.kerri.routine-liveness
# With no args it installs all plists in this directory.

set -uo pipefail
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEST_DIR="$HOME/Library/LaunchAgents"
GUI="gui/$(id -u)"
mkdir -p "$DEST_DIR" "$HOME/.kerri-chief/runtime/logs"

only="${1:-}"
shopt -s nullglob
for plist in "$SRC_DIR"/com.kerri.*.plist; do
  label="$(basename "$plist" .plist)"
  [ -n "$only" ] && [ "$label" != "$only" ] && continue
  cp "$plist" "$DEST_DIR/$label.plist"
  launchctl bootout "$GUI/$label" >/dev/null 2>&1 || true
  if launchctl bootstrap "$GUI" "$DEST_DIR/$label.plist" >/dev/null 2>&1; then
    echo "loaded  $label"
  else
    echo "FAILED  $label (check: launchctl print $GUI/$label)"
  fi
done
