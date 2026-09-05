# Kerri agent policy and local workflows

This repository owns KMG playbooks, local workflow prompts, and local handoff state. Savant owns current company knowledge, CRM, tasks, approvals, and delivery receipts. `brain/wiki/`, `brain/candidates/`, `brain/raw/`, and exported seeds are historical/offline sources, not current authority; do not extend them with new company facts.

## Read what the task needs

- For business work, follow `agent-prompts/kmg-agent-playbook/PLAYBOOK.md` and the applicable runner edition. Preserve send approval, pricing, legal, money, permissions, and Standard & Works boundaries.
- For a local workflow, read its `agent-prompts/<slug>/SKILL.md`. A file's presence or `schedule` field does not mean the routine is enabled. Savant AgentSchedules and the Codex automation manager own executable schedules; legacy Claude shims do not authorize runs.
- For current company context, query Savant and the native evidence source. Read `brain/AGENTS.md` and the relevant index/routing entry only for historical or offline research. Mark fallback information as potentially stale; do not use it to infer live approval or sent state.
- For resumed or concurrent local work, read the relevant `NOW.md` entry and recent log context. Update the handoff if you change work in flight. Append log entries with `node scripts/brain-log-entry.mjs`; never rewrite the log.
- For repository tooling, see `CLAUDE.md` and `package.json`. Do not load the full wiki or every reference for a small edit.

## Writes and release boundaries

- Write compact, source-backed company facts to Savant through the registered identity. If a brain write is unavailable, retain the source in the owning task/CRM receipt and report the exact blocker; do not create a competing local wiki truth.
- Source-backed CRM bookkeeping is act-and-report: reconcile the existing record, verify the change, and preserve evidence. External sends, new pricing, legal/finance commitments, permissions, purchases, destructive actions, and material CRM judgment require the playbook's approval path.
- Standard & Works internal operations, finances, compensation, and content drafts never enter the KMG brain or KMG automation state.
- Never commit credentials, raw mailbox/transcript dumps, provider/runtime logs, or generated exports. Local runtime state stays untracked except the declared git-only `NOW.md` and `brain/log.md` handoff. Share only reviewed, sanitized seeds with approved agents.
- Preserve unrelated work. Material policy changes and the `SEND_AUTHORITY` files in `scripts/kerri-sync.sh` reach `main` only through an explicit reviewed commit or PR. Never force-push or use routine sync to bypass that boundary.
- `scripts/kerri-pull.sh` and `scripts/kerri-sync.sh` run automatically only in runners with those hooks configured. Check actual Git/hook state before relying on synchronization; a hook is not proof that a change was committed or pushed.
