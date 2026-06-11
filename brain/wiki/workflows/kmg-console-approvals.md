# KMG Console approvals — system handoff

> Written 2026-06-11 for any agent (or human reviewer) picking this work up cold.
> Owner: Brian D'Erario (non-technical; judges by whether the system works).
> Built by Kerri (Claude) at Brian's direction across 2026-06-10/11.

## The goal

Brian reviews and approves every external email Kerri queues, plus decision
items, in ONE place: the **production KMG Console tasks board**,
https://kerrihq-rails-xtua.onrender.com/organizations/c7ec4a59-c794-492a-aa61-d926ee8c61d1/tasks

Clicking any card must show the FULL story (context, asks, warnings) and the
EXACT email body, with working Approve / Edit-then-approve / Ask-for-rewrite /
Skip buttons. As of the 2026-06-11 follow-up pass, Rails is the approval queue
store. Google Tasks is legacy history only and must not receive new approval
items.

## Where the code lives (all on GitHub)

| Piece | Local path | GitHub | Deployed |
|---|---|---|---|
| KMG Console web app (Rails 8) | `~/Projects/kerrihq-rails` | `kerrihq/kerrihq-rails` (push to main auto-deploys) | Render service `srv-d8kvn767r5hc739fjo9g`, https://kerrihq-rails-xtua.onrender.com |
| Legacy sync server + local backup console | `~/Projects/kerri-console` | `Brianderario/kerri-console` (private) | launchd agent `com.kerri.console` on Brian's Mac, http://localhost:4180, legacy/disabled by default after cutover |
| This handoff + session state | KerriOS brain (`NOW.md`, `brain/log.md` 2026-06-11 entry, this page) | `Brianderario/kerrios-agent-brain` (private) | n/a |

Key shipped Rails commits:
- `1e13991` — full task review page, parsed task notes, approve/edit/redo/skip actions, API decision payloads.
- `3008612` — whole-card task click targets and removal of task approve/skip from board-level summary context.
- `d2ea48a` — operating-surface refresh: clearer dashboard/shell/sidebar, task sync status, safer Other approvals lane, mobile review polish, and failed-agent visibility.
- `6c19640` — explicit task-sync heartbeat endpoint/status so clean idempotent syncs show as live without touching unchanged task rows.

Key shipped kerri-console commit:
- `c4d3ecf` — bridge posts `/api/v1/task_sync_heartbeat` after sync passes; launchd restarted after deploy.

Key files in kerrihq-rails:
- `app/views/tasks/show.html.erb` — the per-card review page
- `app/services/task_notes.rb` — parses sweep-formatted task notes into context + draft email (13 specs in `spec/services/task_notes_spec.rb`)
- `app/controllers/tasks_controller.rb` — show / approve (optional `edited_body`) / skip (optional `reason`) / redo (with `guidance`)
- `app/controllers/api/v1/tasks_controller.rb` — Rails-owned task queue API, `?resolved=pending`, job/external/source filters, and resolution payload serialization
- `app/controllers/api/v1/task_queue_health_controller.rb` + `app/services/task_queue_health.rb` — visible queue mismatch health (`QUEUE: RAILS OK`, waiting decisions, stale checks)
- `app/services/console_status.rb` — shared read model for shell/dashboard counts and queue health
- `app/views/dashboard/index.html.erb` — Brian Tasks / Agent Activity / CRM-Pipeline / Queue Health operating surface
- `app/views/shared/shell/_topbar.html.erb` — topbar task count and queue-state indicators
- migration `20260611060000_add_resolution_payload_to_tasks.rb` — jsonb payload (edited draft body, redo guidance, skip reason, `applied_at` stamp)

Key helper in KerriOS: `scripts/console-task-api.mjs`, which all scheduled
agents should use for `health`, `list`, `show`, `create`, `update`, and
`mark-applied`.

## How the data flows

1. Any KerriOS routine that needs Brian's attention creates a Rails Task row
   with `node scripts/console-task-api.mjs create`. The task body keeps the
   canonical machine-readable shape: line-1 `ACTION:`, prose context, then a
   `━━━ DRAFT ━━━` section with the exact email between `>>>>>>>` and
   `<<<<<<<` markers.
2. The routine stores the returned Rails `id` as `consoleTaskId`, plus a
   deterministic `consoleExternalRef` such as
   `kerrios:<routine>:<jobId>:<sha12>`, in `data/jobs.json` or the relevant
   routine state file.
3. Brian approves, skips, edits, or requests rewrite in the production Console.
   Rails archives approve/skip cards immediately and stores the decision in
   `resolution` / `resolution_payload`.
4. The **inbox-sweep** polls
   `node scripts/console-task-api.mjs list --resolved pending --per-page 100`.
   It sends approved drafts through the existing guarded mailbox MCPs
   (`approved=true` + `approvalSource`, auto-CC where required), skips skipped
   jobs, and rewrites redo jobs.
5. After applying a decision, inbox-sweep calls
   `node scripts/console-task-api.mjs mark-applied --id <taskId> --note "<result>"`
   so no approval can execute twice.

## Credentials (never in any repo)

- Rails API: `~/.kerri-chief/secrets/kerrihq.env` → `KERRIHQ_SYNC_TOKEN`,
  an ApiKey named `kerri-console-sync` scoped tasks:read + tasks:write,
  minted digest-only (raw token generated locally, only its SHA-256 digest was
  written to production, so it never appeared in Render logs).
- Render API (deploys, one-off jobs): `~/.kerri-chief/secrets/render.env`.

## State as of 2026-06-11 cutover pass

- Review page + actions are deployed. Production URL:
  https://kerrihq-rails-xtua.onrender.com/organizations/c7ec4a59-c794-492a-aa61-d926ee8c61d1/tasks
- Rails includes queue-health UI/API (`/api/v1/task_queue_health`) and task
  API filters for `job_ref`, `external_ref`, `resolution`, and `source`.
- KerriOS includes `scripts/console-task-api.mjs`, and the key scheduled
  approval producers have been updated to file Console tasks directly.
- The current Console UX separates the three things Brian asked to keep clear:
  Brian's tasks, what agents are doing, and CRM/revenue/pipeline context.
- Topbar shows the current Brian task count and queue-health state
  (`QUEUE: RAILS OK`, waiting decisions, or failing checks).
- The old Approvals page is now "Other approvals"; task items there are
  REVIEW-only and cannot approve/skip from summary context.
- Approve buttons on the production board are REAL: an approve queues an
  actual external send at the next sweep.

## Legacy bridge status

`~/Projects/kerri-console` remains a local backup/legacy reader for old Google
Tasks mirrors. It is not production infrastructure after the Console cutover.
Do not re-enable it as the approval source unless Brian explicitly asks for a
rollback.

## How to verify it still works (any session)

1. `node scripts/console-task-api.mjs health` — expect `QUEUE: RAILS OK` or a
   specific waiting/failing label.
2. `node scripts/console-task-api.mjs list --open --per-page 20` — confirms the
   agent-facing queue can be read.
3. Open the production tasks URL in Brian's authenticated Chrome, click any
   card, confirm the full email shows.
4. Confirm the task board has no board-level task APPROVE/SKIP buttons; decisions
   should only happen on the full review page.
5. Rails: `cd ~/Projects/kerrihq-rails && BUNDLE_PATH=/tmp/kerrihq-rails-bundle bundle exec rspec`.
6. KerriOS: `npm run check && npm test`.
