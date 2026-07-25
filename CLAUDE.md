# kerrios-agent-brain — Operational Context

This repo is the git home for KMG agent doctrine and local-automation state. It is **not the company brain**: the brain moved to **Savant Console** (`kerrihq-rails`, production on Render) on 2026-06-18. Read durable knowledge via `GET https://kerrihq-rails-xtua.onrender.com/api/v1/knowledge_records` (Bearer `KERRIHQ_AGENT_API_KEY`, scope `brain:read`) or the Savant `/brain` UI. The `brain/` tree here is an archive and offline fallback, not canonical.

## What is live in this repo

| What | Path | Status |
|---|---|---|
| Master agent playbook + editions | `agent-prompts/kmg-agent-playbook/` (`PLAYBOOK.md`, `PLAYBOOK-KERRI.md`, `PLAYBOOK-CODEX.md`) | Canonical source, mirrored to Savant brain records. When a playbook file and a canonical brain record disagree, the newer canonical record wins; flag the conflict for Brian either way. |
| Brian's global working standards | `agent-prompts/global-working-standards.md` | Canonical; `~/.claude/CLAUDE.md` is the per-machine shim that mirrors it. Edit here so changes show in git history. |
| Local automation prompts | `agent-prompts/<slug>/SKILL.md` | Source for the local routines still running on Brian's machine (e.g. `brian-ceo-social-signal`). |
| Live handoff baton | `NOW.md`, `brain/log.md` | Git-only state for local automations. Update `NOW.md` (Last action / Next action / Last touched) before you stop if you changed anything in flight. Append to `log.md` only via `node scripts/brain-log-entry.mjs` — never hand-edit it (a top-read rewrite once silently dropped ~1,698 lines; `scripts/guard-brain-log.mjs` hard-blocks shrinking commits). |
| Everything under `brain/` (wiki, candidates, raw) | `brain/` | Archive, superseded by Savant on 2026-06-18. Read only as offline fallback; do not extend. |

## Runner posture (corrected 2026-07-25)

There is no "sole runner," and Codex is not retired:

- **Kerri** — the Slack agent on the Savant harness (`kerrihq-rails`). Her schedules run as Savant AgentSchedules (git-mirrored in that repo's `config/agent_schedules/`); her operating doctrine is the Savant persona + playbook, not this repo.
- **Codex** — runs exactly ONE local automation: Standard & Works newsletter issue production (Mon/Wed 8pm ET). Its other 13 automations were archived 2026-07-20 (`~/.codex/automations/_archive/retired-20260720/`). Doctrine: `PLAYBOOK-CODEX.md`.
- **Claude Code** — interactive engineering and chief-of-staff sessions.

The pre-Savant local shims — `~/.claude/scheduled-tasks/kerri-*` and `~/.claude/skills/kerri/` — are retired leftovers; the Savant AgentSchedules are the executable authority. (The skill-shim directory can't be read from agent sessions — macOS permissions block it — so deleting it is Brian's manual step.)

## Rules that still bind local automations

- **Email approval gate (never skip):** external sends and drafts require `approved=true` plus an `approvalSource` naming where Brian approved. Sends from kerri@ auto-CC brian@hardwarefyi.com; `info-hardwarefyi-email` has no auto-CC by design and cites the 2026-06-10 standing authorization. Emails from brian@, ari@, benji@, zach@ with no external recipients are internal prompts and need no approval.
- **S/W boundary:** Standard & Works is a separate legal entity. Its internal ops, finances, staff comp, and content drafts do not enter any KMG brain, git or Savant. When Zach is a recipient, confirm you are on the KMG side.
- **Send-authority files** (the `SEND_AUTHORITY` list in `scripts/kerri-sync.sh`) only land on `main` via an explicit reviewed commit or PR — the sync script skips them on purpose.
- Never force-push. Material changes (org structure, finance, partnerships, hard rules) go via PR, not direct commit.
- No Notion (retired). Never respond as Hudson, Alfred, or Claude — the agent identity is Kerri.

## Sync scripts

`scripts/kerri-pull.sh` and `scripts/kerri-sync.sh` handle pull-on-start / commit-and-push-on-stop for sessions that have them wired as hooks. If you changed tracked files and no hook runs, commit and push yourself before stopping.
