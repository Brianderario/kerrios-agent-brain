#!/usr/bin/env bash
# kerri-sync.sh — low-latency brain sync between runners (Claude + Codex).
#
# Pulls latest, commits ONLY eligible brain files (strict whitelist — never
# secrets or runtime state), and pushes. Designed to run as a Stop hook so the
# brain stays current across tools with no manual step. Exits 0 even on failure
# so it never blocks the agent; failures drop a marker in data/ instead.
#
# Manual use:  bash scripts/kerri-sync.sh
# As a hook:   invoked on session Stop (see ~/.claude/settings.json, ~/.codex/hooks.json)

set -uo pipefail

BRAIN_DIR="/Users/brianderario/Projects/kerrios-agent-brain"
cd "$BRAIN_DIR" || exit 0

# Snapshot gitignored runtime state (jobs.json etc.) first; git can't recover
# those files, the local backup can. Silent, never blocks the sync.
bash "$BRAIN_DIR/scripts/backup-runtime-state.sh" 2>/dev/null

# Only sync on main.
BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"
[ "$BRANCH" = "main" ] || exit 0

# Eligible paths — mirrors the nightly kerri-brain-push whitelist.
# Never includes data/kerrios.json, data/*.json runtime state, brain/.local, or creds.
ELIGIBLE=(
  "NOW.md"
  "brain/wiki"
  "brain/log.md"
  "brain/log-archive"
  "brain/candidates"
  "brain/raw"
  "brain/index.md"
  "brain/routing.md"
  "agent-prompts"
  "scripts"
  "test"
  "AGENTS.md"
  "CLAUDE.md"
  "README.md"
  "HANDOFF.md"
)

# Send-authority files: NEVER auto-committed, even though they sit inside
# eligible paths. These define what Kerri may send or do autonomously, so they
# only land on main via an explicit reviewed commit or PR (see
# brain/wiki/workflows/multi-agent-write-rules.md). Added 2026-06-09 after the
# Stop hook pushed half-finished send-authority work to main mid-build.
SEND_AUTHORITY=(
  "data/autonomy-policy.json"
  "agent-prompts/kerri-inbox-sweep/SKILL.md"
  "agent-prompts/kerri-skill/SKILL.md"
  "agent-prompts/kerri-skill/references/email.md"
  "agent-prompts/kerri-morning-brief/SKILL.md"
)

# Anything changed (staged, unstaged, or untracked) within the eligible set?
CHANGES="$(git status --porcelain -- "${ELIGIBLE[@]}" 2>/dev/null)"
[ -z "$CHANGES" ] && exit 0   # nothing brain-relevant changed → silent no-op

# Hooks set KERRI_RUNNER (claude|codex); manual runs fall back to "manual".
RUNNER="${KERRI_RUNNER:-manual}"

# Stage only eligible paths.
git add -- "${ELIGIBLE[@]}" 2>/dev/null

# Safety net: unstage anything sensitive that slipped through.
for bad in $(git diff --cached --name-only 2>/dev/null | grep -iE '(\.env|secret|token|credential|\.key$|\.pem$|kerrios\.json$|/\.local/)'); do
  git reset -q HEAD -- "$bad" 2>/dev/null
done

# Send-authority guard: unstage send-authority files and leave them dirty in
# the working tree. They require a human-reviewed commit or PR; the Stop hook
# must never push them.
for sa in "${SEND_AUTHORITY[@]}"; do
  if ! git diff --cached --quiet -- "$sa" 2>/dev/null; then
    git reset -q HEAD -- "$sa" 2>/dev/null
    echo "kerri-sync: NOT auto-committing send-authority file '$sa'. It stays uncommitted; land it via a reviewed commit or PR." >&2
  fi
done

# Nothing left staged after safety filter → no-op.
git diff --cached --quiet && exit 0

TS="$(date '+%Y-%m-%d %H:%M %Z')"

# Content redaction guard: the path filter above catches files NAMED like secrets; this
# catches secrets/PII pasted INSIDE otherwise-innocent wiki/log/candidate content — the
# real exposure on a repo that auto-pushes. It scans the exact staged bytes. HIGH-severity
# (known token/key formats) BLOCKS the push and drops a marker, mirroring the red-build
# guard's fail-safe. The hook is non-interactive, so MEDIUM/LOW can't prompt — they are
# logged to a review marker and the push proceeds. False positive? Add `redact-allow` on
# the offending line. The scanner fails open (exit 0 on crash) so it can never wedge sync.
REDACT_OUT="$(git diff --cached -- "${ELIGIBLE[@]}" | node scripts/redact-check.mjs 2>/dev/null)"
REDACT_CODE=$?
if [ "$REDACT_CODE" = "2" ]; then
  git reset -q HEAD -- "${ELIGIBLE[@]}" 2>/dev/null
  { printf 'kerri-sync: BLOCKED push at %s (runner: %s) — redaction guard found HIGH-severity content (likely a credential/key) in the staged diff. Nothing committed; the changes remain in your working tree. Remove the secret, or add `redact-allow` on the line if it is a verified false positive.\n\n' "$TS" "$RUNNER"; printf '%s\n' "$REDACT_OUT"; } > "$BRAIN_DIR/data/kerri-sync-conflict.marker"
  exit 0
elif [ "$REDACT_CODE" = "1" ]; then
  { printf 'kerri-sync: REVIEW at %s (runner: %s) — redaction guard flagged MEDIUM/LOW items (possible PII or an S/W-boundary mention). The push PROCEEDED; please review and scrub if needed.\n\n' "$TS" "$RUNNER"; printf '%s\n' "$REDACT_OUT"; } > "$BRAIN_DIR/data/kerri-sync-review.marker"
fi

# Red-build guard: if this push touches test-relevant code (prompts, scripts, tests,
# or the package manifest), run the suite FIRST. A prompt rewrite that auto-pushed
# past its own regression tests is exactly how a red build landed on main unguarded
# (2026-05-31). On failure: do NOT commit or push — unstage, drop a marker, and leave
# the changes in the working tree for a human to fix. Pure brain/wiki markdown edits
# (the common sweep write-back) skip this gate, so no latency on routine no-ops.
if git diff --cached --name-only | grep -qE '^(agent-prompts/|scripts/|test/|package(-lock)?\.json$)'; then
  if ! npm test >/dev/null 2>&1; then
    git reset -q HEAD -- "${ELIGIBLE[@]}" 2>/dev/null
    printf 'kerri-sync: BLOCKED push at %s (runner: %s) — `npm test` failed on a code/prompt change. Nothing committed; fix the tests before this can sync to main.\n' "$TS" "$RUNNER" \
      > "$BRAIN_DIR/data/kerri-sync-conflict.marker"
    exit 0
  fi
fi

SUMMARY="$(git diff --cached --name-only | sed 's#^#  - #' | head -20)"
git commit -q -m "brain sync ($RUNNER) — $TS

$SUMMARY" 2>/dev/null

# Integrate the other runner's work, then push. Autostash protects any
# unrelated dirty files (tests, data/companies.json, etc.).
if ! git pull --rebase --autostash origin main >/dev/null 2>&1; then
  git rebase --abort >/dev/null 2>&1
  printf 'kerri-sync: rebase conflict on push at %s (runner: %s). Local commit made but NOT pushed. Resolve manually.\n' "$TS" "$RUNNER" \
    > "$BRAIN_DIR/data/kerri-sync-conflict.marker"
  exit 0
fi

if ! git push -q origin main 2>/dev/null; then
  printf 'kerri-sync: push failed at %s (runner: %s). Commit is local. Check network/auth.\n' "$TS" "$RUNNER" \
    > "$BRAIN_DIR/data/kerri-sync-conflict.marker"
  exit 0
fi

# Success — clear any stale conflict marker.
rm -f "$BRAIN_DIR/data/kerri-sync-conflict.marker" 2>/dev/null
exit 0
