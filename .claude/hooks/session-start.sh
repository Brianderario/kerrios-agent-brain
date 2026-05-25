#!/bin/bash
# SessionStart hook for kerrios-agent-brain.
#
# Loads inflight job state into session context so cloud sessions can resume
# after a dropped connection. See brain/wiki/workflows/cloud-session-continuity.md
# for the convention.
#
# Behavior:
#   - Determines the current branch.
#   - Fast-forwards from origin to pick up any pushed inflight updates
#     (best-effort; never overwrites local work).
#   - If branch matches claude/job-<id>-..., reads brain/inflight/<id>.md
#     and emits it as additionalContext for the session.
#   - On any other branch, exits cleanly with no context.
#
# Designed to be idempotent and to never block session startup on failure.

set -uo pipefail

REPO_DIR="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
cd "$REPO_DIR" 2>/dev/null || exit 0

emit_context() {
    # Emit a SessionStart additionalContext payload. Uses jq for safe escaping.
    local context="$1"
    jq -nc --arg ctx "$context" \
        '{hookSpecificOutput: {hookEventName: "SessionStart", additionalContext: $ctx}}'
}

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
if [ -z "$BRANCH" ] || [ "$BRANCH" = "HEAD" ]; then
    exit 0
fi

# Best-effort fast-forward from origin so we pick up any pushed inflight state
# from a prior session. Never force, never merge — silent skip on failure.
if git rev-parse --abbrev-ref --symbolic-full-name "@{u}" >/dev/null 2>&1; then
    git fetch --quiet origin "$BRANCH" 2>/dev/null || true
    git merge --quiet --ff-only "origin/$BRANCH" >/dev/null 2>&1 || true
fi

# Extract job ID from claude/job-<id>-<description>-<suffix>
JOB_ID=""
if [[ "$BRANCH" =~ ^claude/job-([a-zA-Z0-9]+)- ]]; then
    JOB_ID="$(echo "${BASH_REMATCH[1]}" | tr '[:upper:]' '[:lower:]')"
fi

if [ -z "$JOB_ID" ]; then
    # Not a harness job branch — nothing to resume.
    exit 0
fi

INFLIGHT_FILE="$REPO_DIR/brain/inflight/${JOB_ID}.md"

if [ -f "$INFLIGHT_FILE" ]; then
    CONTEXT="# Resuming job ${JOB_ID}

A prior session left inflight state at brain/inflight/${JOB_ID}.md. Loaded contents below.

Per brain/wiki/workflows/cloud-session-continuity.md: update this file before any long-running or risky tool call, and on every consequential turn, so the next session can resume cleanly if the connection drops. Commit and push as part of the same write.

---

$(cat "$INFLIGHT_FILE")"
else
    CONTEXT="# New job ${JOB_ID}

No inflight state file at brain/inflight/${JOB_ID}.md yet. Per brain/wiki/workflows/cloud-session-continuity.md, create one on the first consequential turn (use brain/inflight/README.md as the template) and update + commit it before risky operations so the next session can resume if the connection drops."
fi

emit_context "$CONTEXT"
