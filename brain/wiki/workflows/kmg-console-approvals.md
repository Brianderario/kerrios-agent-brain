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

Key files in kerrihq-rails (commit `1e13991`):
- `app/views/tasks/show.html.erb` — the per-card review page
- `app/services/task_notes.rb` — parses sweep-formatted task notes into context + draft email (13 specs in `spec/services/task_notes_spec.rb`)
- `app/controllers/tasks_controller.rb` — show / approve (optional `edited_body`) / skip (optional `reason`) / redo (with `guidance`)
- `app/controllers/api/v1/tasks_controller.rb` — adds `?resolved=pending` and serializes `resolution`, `resolution_payload`, `resolved_at`
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

## State as of 2026-06-11 ~01:30 ET

- Review page + actions DEPLOYED and verified live in Brian's Chrome on the
  production URL (H0119 C-Infinity renders fully; suite 1190 examples 0
  failures, rubocop + brakeman clean).
- Sync LIVE: first run mirrored 20 cards (full bodies), applied one
  pre-existing harmless web skip (H0026 record card), auto-closed the stale
  already-sent Flux card.
- Approve buttons on the production board are REAL: an approve queues an
  actual external send at the next sweep (~hourly).

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
3. Mobile polish of the review page; surface a "decisions waiting" count in
   the Console header.
4. Per-person assignment of mirrored cards (currently unassigned = visible to
   all org members; fine for a 3-person team, revisit with more users).

## How to verify it still works (any session)

1. `curl -s http://127.0.0.1:4180/api/queue | head -c 300` — local server up,
   queue parsing.
2. `curl -s -X POST http://127.0.0.1:4180/api/sync-now` — expect `{"ok":true,...}`.
3. Open the production tasks URL, click any card, confirm the full email shows.
4. `tail ~/Projects/kerri-console/audit.log` — every action and sync is logged.
5. Rails: `cd ~/Projects/kerrihq-rails && bundle exec rspec` (needs the PATH
   export from `kerrihq-rails-dev-env` memory).
