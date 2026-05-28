#!/usr/bin/env bash
# kerri-pull.sh — pull the latest brain at session start so the incoming runner
# (Claude or Codex) is current with whatever the other one last pushed.
# Autostash protects any local dirty files. Exits 0 always; never blocks startup.

set -uo pipefail

BRAIN_DIR="/Users/brianderario/Documents/Documents - Brian's MacBook Air/KerriOS"
cd "$BRAIN_DIR" || exit 0

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
[ "$BRANCH" = "main" ] || exit 0

git pull --rebase --autostash origin main >/dev/null 2>&1 || git rebase --abort >/dev/null 2>&1
exit 0
