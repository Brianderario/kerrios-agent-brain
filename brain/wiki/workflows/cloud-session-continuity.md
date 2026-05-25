# Cloud session continuity

How Kerri (and any other agent on `kerrios-agent-brain`) survives dropped connections in Claude Code on the web.

## Problem

Cloud Claude Code sessions run in **ephemeral containers**. The repo is cloned fresh on session start; the container is reclaimed after inactivity or when the session ends. Anything not committed and pushed is gone.

This is fine for short tasks. It's a real problem when:
- A multi-turn job (drafting, research, refactor) is interrupted mid-flight.
- The user leaves the house, loses connection, and a new session can't see what the previous one was doing.
- The harness creates a fresh branch (`claude/job-<id>-<slug>-<suffix>`) per session but provides no built-in continuity across sessions on the same job.

The brain repo is the durable channel. Inflight files use it as one.

## Solution: `brain/inflight/<job-id>.md`

A per-job working-state file. Cloud sessions write it on every consequential turn; the SessionStart hook reads it and loads it into context.

### Write discipline

Any agent on a `claude/job-<id>-*` branch:

1. **First consequential turn:** create `brain/inflight/<id>.md` from the template in [[../../inflight/README]]. Commit + push.
2. **Every consequential turn after:** update Current state / Next step / Latest draft fields. Commit + push **before** any long-running or risky tool call (external send, MCP write, large generation).
3. **Final turn:** delete the inflight file as part of the same commit as the final deliverable. Git history preserves the working state.

"Consequential" = anything that produces new artifacts (drafts, decisions, code, research synthesis). Pure reads don't need to update inflight.

### Read mechanism

`.claude/hooks/session-start.sh` runs on every session:

1. Detects current branch.
2. Fast-forwards from `origin/<branch>` (best-effort, never overwrites).
3. Extracts job ID from `claude/job-<id>-...` pattern.
4. If `brain/inflight/<id>.md` exists → loads it as `hookSpecificOutput.additionalContext`.
5. If not → emits a brief "no inflight state yet" hint.
6. On non-job branches → exits silently.

The hook is **synchronous** so that resumption context is available before the agent's first action.

### S/W boundary

`brain/inflight/` is tracked in git. **S/W content does NOT belong here.** For S work-in-progress, use `brain/.local/inflight/` (gitignored, per-machine). Local sessions on Brian's Mac have persistent filesystem state, so the cloud-continuity problem doesn't apply.

### Failure modes & handling

| Failure | What the hook does |
|---|---|
| Not a `claude/job-*` branch | Exits silently, no context emitted. |
| `git fetch` fails (network / auth) | Skips, continues with local state. |
| `git merge --ff-only` would conflict | Skips, continues with local state. Brain wiki writes never live-edit inflight, so divergence is rare. |
| `brain/inflight/<id>.md` missing | Emits a "create one" hint with template pointer. |
| `jq` not available | Hook fails silently rather than blocking session start. |

The hook never aborts session startup. Worst case: zero context loaded, agent behaves like a fresh session.

## Why this isn't async

The skill template defaults to async hooks for dependency installs (long-running, post-startup OK). For continuity, the **context must be available before the agent's first read**, so this hook is sync. The work is tiny (git fetch + file read) so the latency cost is small — typically < 1s.

If startup latency ever becomes a problem, the right fix is faster `git fetch`, not async — async would race the agent's first turn.

## What this does NOT solve

- **State that lives in MCPs only** (Google Tasks, Apollo, etc.): if a session writes to a local-only MCP that the cloud can't reach, the cloud can't read it back. Mitigation: mirror critical state into the inflight file. Longer-term: port local MCPs to cloud (see `brain/log.md` 2026-05-25 entry on local→cloud MCP plan).
- **State across different jobs:** inflight is keyed by job ID. Cross-job context still goes through the wiki.
- **Local-session continuity:** local sessions on Brian's Mac don't need this; the filesystem is persistent. The hook still runs and is a no-op when there's no inflight file.

## Related

- [[agent-brain-protocol]] — full read/write contract
- [[multi-agent-write-rules]] — how to merge inflight writes from parallel agents (rare; one job = one agent at a time in practice)
- [[../../inflight/README]] — template + lifecycle
- `.claude/hooks/session-start.sh` — implementation
- `.claude/settings.json` — hook registration
