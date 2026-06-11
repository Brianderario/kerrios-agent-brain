# Console reporting protocol (KMG Console / kerrihq-rails)

scope: workflow · created: 2026-06-10 · status: **ACTIVE** (Rails production Console is the approval queue)

Every scheduled KMG routine reports its runs to the Console (mission control) and files human-facing work onto the Tasks board there. Kerri Console Tasks is the approval book of record. Do not create new Google Tasks approval items.

## Connection

- REST/API base: `https://kerrihq-rails-xtua.onrender.com/api/v1`
- Local helper: `node scripts/console-task-api.mjs health|list|show|create|update|mark-applied`
- API key: `~/.kerri-chief/secrets/kerrihq.env` (`KERRIHQ_SYNC_TOKEN`, scopes `tasks:read tasks:write`; NEVER commit it)

## 1. Report every run (end of routine, success AND failure)

Call `create_agent_run` with:
- `agent_slug`: the routine's directory name in `agent-prompts/` (e.g. `kerri-inbox-sweep`)
- `status`: `succeeded` | `failed`
- `external_id`: this run's stable id (date + slot, e.g. `2026-06-11-0700`) — makes retries safe
- `output`: the same compact summary written to `brain/log.md` (markdown)
- `error`: when failed
- `tokens`, `cost_cents`, `started_at`, `finished_at` when known

A run that crashes before reporting is caught by the Console's daily health check, which files an "Agent overdue" card on Brian's board. Report failures explicitly anyway; a reported failure is diagnosable, a silent one is not.

## 2. File tasks on the board

When a routine needs Brian's attention, create a Console task:
- `title`: same `<JOBID> — <Company> — <Subject>` format
- `status`: `needs_approval` for approval-rail items; `action_needed` / `waiting_reply` / `discuss` per the situation
- `body`: ACTION line + context + draft
- `job_ref`: the H/S/G jobId
- `property_slug`: `hardware-fyi` | `kerri-media-group` | `standard-works`
- `external_ref`: deterministic idempotency key, usually `kerrios:<routine>:<jobId>:<sha12>`

## 3. Read approvals back

Brian resolving a `needs_approval` card moves it to `done` with `resolution` = `approved` | `skipped`; redo leaves it open with `resolution=redo_requested`. Poll `node scripts/console-task-api.mjs list --resolved pending --per-page 100`. After applying a decision, call `node scripts/console-task-api.mjs mark-applied --id <taskId> --note "<what happened>"` so the decision is acknowledged and will not execute twice.

## 4. Adjustment requests

`list_open_adjustments` returns Brian's plain-English feedback on agents filed in the Console. The brain-maintenance routine applies them to `agent-prompts/` here (normal PR/commit rules), then calls `resolve_adjustment` (`applied` | `dismissed`, with a note). Rails never pushes to this repo; prompts stay git-sourced.

## Related

- [[agent-brain-protocol]] — the 4-step loop these reports feed
- [[google-tasks-improvement-suggestions]] — legacy relevance rules for improvement suggestions; delivery is now Console tasks
- Console API docs: `/api_docs` in the Console (full tool list, 23 tools)

## 5. Outreach recording (Brian decision 2026-06-10, evening)

The Console NEVER sends email. Sends stay in Kerri's mailbox MCPs after Brian approves in Console. After a send completes, the sending agent calls `record_outreach` (deal_id, summary, contact_emails incl CCs, job_ref, thread_subject) so the Console stays the source of truth for who was contacted where. Same for calls/LinkedIn touches (channel param).

Division of record: **brain** = deep knowledge + quick text for agents; **Console** = the dynamic shared picture for humans AND agents (CRM, pipeline, tasks, revenue, agent runs). Update both; do not add a third Google Tasks control surface back into the loop.
