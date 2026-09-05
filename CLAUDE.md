# kerrios-agent-brain — Operational Context

This repo is the git home for KMG agent doctrine and local-automation state. It is **not the company brain**: the brain moved to **Savant Console** (`kerrihq-rails`, production on Render) on 2026-06-18. Read durable knowledge via `GET https://kerrihq-rails-xtua.onrender.com/api/v1/knowledge_records` (Bearer `KERRIHQ_AGENT_API_KEY`, scope `brain:read`) or the Savant `/brain` UI. The `brain/` tree here is an archive and offline fallback, not canonical.

## What is live in this repo

| What | Path | Status |
|---|---|---|
| Master agent playbook + editions | `agent-prompts/kmg-agent-playbook/` (`PLAYBOOK.md`, `PLAYBOOK-KERRI.md`, `PLAYBOOK-CODEX.md`) | Canonical source, mirrored to Savant brain records. When a playbook file and a canonical brain record disagree, the newer canonical record wins; flag the conflict for Brian either way. |
| Brian's global working standards | `agent-prompts/global-working-standards.md` | Canonical; `~/.claude/CLAUDE.md` is the per-machine shim that mirrors it. Edit here so changes show in git history. |
| Local automation prompts | `agent-prompts/<slug>/SKILL.md` | Source for any explicitly approved local routines still running on Brian's machine. Production Kerri schedules belong in `kerrihq-rails`. |
| Live handoff baton | `NOW.md`, `brain/log.md` | Git-only state for local automations. Update `NOW.md` (Last action / Next action / Last touched) before you stop if you changed anything in flight. Append to `log.md` only via `node scripts/brain-log-entry.mjs` — never hand-edit it (a top-read rewrite once silently dropped ~1,698 lines; `scripts/guard-brain-log.mjs` hard-blocks shrinking commits). |
| Archived wiki, candidates and raw sources (excluding the local activity log above) | `brain/` | Archive, superseded by Savant on 2026-06-18. Read only as offline fallback; do not extend. |

## Runner ownership

Savant AgentSchedules own Savant runs; the Codex automation manager owns Codex runs. Inspect the live owner to establish enabled state, cadence, model, and delivery permissions. Local Claude scheduled-task shims and this repository's `schedule` metadata are compatibility records, not executable authority. Do not infer activation from a file or maintain a second schedule from an old list.

Interactive sessions can use Codex or Claude Code. The runner does not change the Kerri identity or business boundaries. Read the relevant workflow only when the task needs it.

## Rules that still bind local automations

- **Email approval gate (never skip):** external sends require `approved=true` plus an `approvalSource` naming where Brian approved. Sends from kerri@ auto-CC brian@hardwarefyi.com; `info-hardwarefyi-email` has no auto-CC by design and cites the 2026-06-10 standing authorization. Emails from brian@, ari@, benji@, zach@ with no external recipients are internal prompts and need no approval.
- **S/W boundary:** Standard & Works is a separate legal entity. Its internal ops, finances, staff comp, and content drafts do not enter any KMG brain, git or Savant. When Zach is a recipient, confirm you are on the KMG side.
- **Send-authority files** (the `SEND_AUTHORITY` list in `scripts/kerri-sync.sh`) only land on `main` via an explicit reviewed commit or PR — the sync script skips them on purpose.
- Never force-push. Material changes (org structure, finance, partnerships, hard rules) go via PR, not direct commit.
- No Notion (retired). Never respond as Hudson, Alfred, or Claude — the agent identity is Kerri.

## Sync scripts

`scripts/kerri-pull.sh` and `scripts/kerri-sync.sh` handle pull-on-start / commit-and-push-on-stop for sessions that have them wired as hooks. Verify actual Git state before reporting synchronization. Keep material policy and send-authority edits in the reviewed commit/PR path; do not push unrelated working-tree changes through a routine sync.
