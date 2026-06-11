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
Skip buttons. Google Tasks is being retired as Brian's surface; it currently
remains the behind-the-scenes queue store only, because the whole agent fleet
(inbox-sweep etc.) reads and writes it. End state: the Console's own database
becomes the queue store and Google Tasks goes away entirely (not done yet).

## Where the code lives (all on GitHub)

| Piece | Local path | GitHub | Deployed |
|---|---|---|---|
| KMG Console web app (Rails 8) | `~/Projects/kerrihq-rails` | `kerrihq/kerrihq-rails` (push to main auto-deploys) | Render service `srv-d8kvn767r5hc739fjo9g`, https://kerrihq-rails-xtua.onrender.com |
| Sync server + local backup console | `~/Projects/kerri-console` | `Brianderario/kerri-console` (private) | launchd agent `com.kerri.console` on Brian's Mac, http://localhost:4180 |
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
- `app/controllers/api/v1/tasks_controller.rb` — adds `?resolved=pending` and serializes `resolution`, `resolution_payload`, `resolved_at`
- `app/services/console_status.rb` — shared read model for shell/dashboard counts and task-sync freshness
- `app/models/task_sync_heartbeat.rb` + `app/controllers/api/v1/task_sync_heartbeats_controller.rb` — bridge heartbeat contract
- `app/views/dashboard/index.html.erb` — Brian Tasks / Agent Activity / CRM-Pipeline / Sync-Revenue operating surface
- `app/views/shared/shell/_topbar.html.erb` — topbar task count and sync-state indicators
- migration `20260611060000_add_resolution_payload_to_tasks.rb` — jsonb payload (edited draft body, redo guidance, skip reason, `applied_at` stamp)

Key file in kerri-console: `server.mjs` (zero-dependency Node). Its `README.md`
documents the architecture; `public/index.html` is the local backup UI.

## How the data flows

1. The **kerri-inbox-sweep** agent (KerriOS `agent-prompts/kerri-inbox-sweep/`)
   writes approval tasks into three Google Tasks lists (Hardware FYI /
   Standard&Works / KerriMG) with a strict notes format: line-1 `ACTION:`,
   prose context, then a `━━━ DRAFT ━━━` section with the exact email between
   `>>>>>>>` and `<<<<<<<` markers.
2. **kerri-console `server.mjs`** runs a sync loop every 120 seconds (and on
   `POST /api/sync-now`):
   - **Outbound mirror:** every open queue item is upserted into the Console
     as a Task row via the rails API, FULL notes in `body`,
     `external_ref = gtask_<google task id>` (same convention as the June-10
     one-time import, so legacy rows upgraded in place). Status mapping:
     sendable draft → `needs_approval`, you-only items → `action_needed`,
     everything else → `discuss`.
   - **Inbound decisions:** `GET /api/v1/tasks?resolved=pending` returns
     decisions Brian made in the web UI. The sync executes each against the
     source Google Task (approve → completes it, with the edited body written
     into the notes if he edited; skip → rewrites `ACTION: skip` + completes;
     redo → `ACTION: redo` + guidance line, stays open), then stamps
     `resolution_payload.applied_at` back so nothing executes twice.
   - **Cleanup:** mirrored cards whose source task disappeared (sent/handled
     elsewhere) close as `closed_at_source`.
   - **Heartbeat:** after each sync pass it posts `POST /api/v1/task_sync_heartbeat`
     so the production Console can show `TASK SYNC: LIVE` even when a clean
     idempotent sync did not change any task rows. Do not replace this with
     artificial task-row touches; the heartbeat is the source of truth.
3. The **inbox-sweep still performs every actual send** through its existing
   approval gate (`approved=true` + `approvalSource`, auto-CC brian@). Nothing
   in this system sends email directly. A Console approve = the same thing as
   Brian checking the task box in Google Tasks.

## Credentials (never in any repo)

- Google Tasks access: reuses the kerri-gdocs MCP OAuth2 creds at
  `~/.kerri-chief/kerri-gdocs-mcp/.env`.
- Rails API: `~/.kerri-chief/secrets/kerrihq.env` → `KERRIHQ_SYNC_TOKEN`,
  an ApiKey named `kerri-console-sync` scoped tasks:read + tasks:write,
  minted digest-only (raw token generated locally, only its SHA-256 digest was
  written to production, so it never appeared in Render logs).
- Render API (deploys, one-off jobs): `~/.kerri-chief/secrets/render.env`.

## State as of 2026-06-11 ~02:12 ET

- Review page + actions are deployed. Production URL:
  https://kerrihq-rails-xtua.onrender.com/organizations/c7ec4a59-c794-492a-aa61-d926ee8c61d1/tasks
- Render deploy `dep-d8l51e6k1jcs73e6hkfg` is live at Rails commit `6c19640`.
- Local bridge commit `c4d3ecf` is pushed and launchd `com.kerri.console` was
  restarted after the deploy.
- The current Console UX separates the three things Brian asked to keep clear:
  Brian's tasks, what agents are doing, and CRM/revenue/pipeline context.
- Topbar shows the current Brian task count and task-sync state (`TASK SYNC: LIVE`
  when the bridge heartbeat is fresh).
- The old Approvals page is now "Other approvals"; task items there are
  REVIEW-only and cannot approve/skip from summary context.
- Sync LIVE: latest manual sync returned `{"ok":true,"mirrored":20,"decisionsApplied":0}`.
- Approve buttons on the production board are REAL: an approve queues an
  actual external send at the next sweep (~hourly).
- Validation on `6c19640`: full Rails suite 1190 examples / 0 failures / 1
  pending; rubocop clean; brakeman 0 warnings; `yarn build` + `yarn build:css`
  clean except the existing Browserslist caniuse-lite age warning; kerri-console
  `node --check`; KerriOS `npm run check` and `npm test` green.
- Production `/up` was green. Authenticated production Playwright smoke with
  Brian login verified dashboard, task board, card-body click-through into the
  H0119 review page, review actions/context/draft, agents, revenue, Other
  approvals, mobile task board, and topbar `TASK SYNC: LIVE` after sync-now.

## Open / next steps

1. **Retire Google Tasks for real** (the stated end goal): make the Console DB
   the queue store. That means the inbox-sweep (and the other KerriOS agents
   that file/read approval tasks) write to the rails API instead of Google
   Tasks, and the local sync becomes unnecessary. Touches send-authority
   prompts → changes go via reviewed PR, never silent edits (see
   `multi-agent-write-rules`).
2. The sync depends on Brian's Mac being awake; if the Console must be live
   while the laptop sleeps, move the sync into the rails app itself (needs the
   Google creds in Render env) or accept the staleness window.
3. Continue CRM/revenue polish inside the Console so the old sheet views become
   reference surfaces rather than the daily control plane.

## How to verify it still works (any session)

1. `curl -s http://127.0.0.1:4180/api/queue | head -c 300` — local server up,
   queue parsing.
2. `curl -s -X POST http://127.0.0.1:4180/api/sync-now` — expect `{"ok":true,...}`.
3. Open the production tasks URL in Brian's authenticated Chrome, click any
   card, confirm the full email shows.
4. Confirm the task board has no board-level task APPROVE/SKIP buttons; decisions
   should only happen on the full review page.
5. `tail ~/Projects/kerri-console/audit.log` — every action and sync is logged.
6. Rails: `cd ~/Projects/kerrihq-rails && BUNDLE_PATH=/tmp/kerrihq-rails-bundle bundle exec rspec`.
