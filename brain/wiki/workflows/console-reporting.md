# Console reporting protocol (KMG Console / kerrihq-rails)

scope: workflow · created: 2026-06-10 · status: **STAGED, not yet active** (activates when the Console deploys to production and an API key is issued)

Every scheduled KMG routine reports its runs to the Console (mission control) and files human-facing work onto the Tasks board there. Google Tasks stays the approval book of record until Brian confirms board parity; during the transition, routines write to BOTH.

## Connection

- MCP endpoint: `https://kerrihq-rails.onrender.com/mcp/sse`, Bearer API key (scopes: `agents:write`, `tasks:read`, `tasks:write`)
- REST fallback: `POST https://kerrihq-rails.onrender.com/api/v1/agent_runs` and `/api/v1/tasks`
- The API key will live in `brain/.local/` (gitignored) once issued. NEVER commit it.

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

When a routine would create a Google Task today, ALSO call `create_task`:
- `title`: same `<JOBID> — <Company> — <Subject>` format
- `status`: `needs_approval` for approval-rail items; `action_needed` / `waiting_reply` / `discuss` per the situation
- `body`: ACTION line + context + draft, same as the Google Task notes
- `job_ref`: the H/S/G jobId
- `property_slug`: `hardware-fyi` | `kinetic` | `standard-and-works`
- `external_ref`: the Google Task id (keeps the two rails linked and the mirror idempotent)

## 3. Read approvals back

Brian resolving a `needs_approval` card moves it to `done` with `resolution` = `approved` | `skipped`. Poll via `list_tasks` (filter `status: done`) and treat `approved` exactly like a checked Google Tasks box, `skipped` like an explicit skip. During the transition, Google Tasks remains authoritative on conflicts.

## 4. Adjustment requests

`list_open_adjustments` returns Brian's plain-English feedback on agents filed in the Console. The brain-maintenance routine applies them to `agent-prompts/` here (normal PR/commit rules), then calls `resolve_adjustment` (`applied` | `dismissed`, with a note). Rails never pushes to this repo; prompts stay git-sourced.

## Related

- [[agent-brain-protocol]] — the 4-step loop these reports feed
- [[google-tasks-improvement-suggestions]] — suggestion rail (unchanged)
- Console API docs: `/api_docs` in the Console (full tool list, 23 tools)

## 5. Outreach recording (Brian decision 2026-06-10, evening)

The Console NEVER sends email. Sends stay on the existing approval rail (Google Tasks + Kerri's mailbox MCPs). After a send completes, the sending agent calls `record_outreach` (deal_id, summary, contact_emails incl CCs, job_ref, thread_subject) so the Console stays the source of truth for who was contacted where. Same for calls/LinkedIn touches (channel param).

Division of record: **brain** = deep knowledge + quick text for agents; **Console** = the dynamic shared picture for humans AND agents (CRM, pipeline, tasks, revenue, agent runs). Update both, the same way Google Tasks and the brain are updated today.
