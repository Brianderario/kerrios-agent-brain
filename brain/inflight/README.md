# Inflight job state

Per-job working state written by cloud Claude Code sessions so work can resume after dropped connections.

**Why this exists:** cloud sessions run in ephemeral containers. If the connection breaks before work is committed and pushed, the container is reclaimed and the work is lost. Inflight files are the durable hand-off channel between sessions on the same job.

**How it's loaded:** `.claude/hooks/session-start.sh` reads the current branch (expected pattern `claude/job-<id>-...`), pulls latest from origin, and if `brain/inflight/<id>.md` exists, injects it as session context.

**File naming:** `<job-id>.md`, lowercase. Example: `h001.md` for branch `claude/job-h001-final-draft-VqsvE`.

**S/W boundary:** inflight files are tracked in git. S/W content does NOT go here — use `brain/.local/inflight/` for S work (gitignored, per-machine).

**Lifecycle:**
- **Create** on the first consequential turn of a job.
- **Update** before any long-running or risky tool call, and on every consequential turn after.
- **Commit + push** as part of the same write — uncommitted inflight state isn't durable.
- **Delete** in the same commit as the job's final deliverable. Git history preserves it.

See `brain/wiki/workflows/cloud-session-continuity.md` for the full workflow.

## Template

Copy this when starting a new inflight file:

```markdown
# Inflight: job <id>

**Branch:** claude/job-<id>-<slug>-<suffix>
**Started:** YYYY-MM-DD HH:MM ET
**Last updated:** YYYY-MM-DD HH:MM ET
**Status:** in-progress | blocked | done

## Goal

<one-sentence task description — what "done" looks like>

## Current state

- <what's been done so far>
- <key decisions made this session>

## Next step

<the single next action, concrete enough to act on>

## Latest draft / artifact

<if applicable, the current draft content inline — or a path to it in the repo>

## Blockers / questions for Brian

- <if any; otherwise omit this section>

## Source links

- <commit shas, file paths, brain pages touched, external URLs reviewed>
```
