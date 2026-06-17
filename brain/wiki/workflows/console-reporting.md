# Savant reporting protocol (formerly KMG Console / kerrihq-rails)

scope: workflow · created: 2026-06-10 · updated: 2026-06-12 · status: **ACTIVE** (Savant production app is the approval queue)

Every scheduled KMG routine reports its runs to Savant (mission control) and files human-facing work onto the Tasks board there. Savant Tasks is the approval book of record. Do not create new Google Tasks approval items.

## Connection

- REST/API base: `https://kerrihq-rails-xtua.onrender.com/api/v1`
- Local helper: `node scripts/console-task-api.mjs health|list|show|create|update|mark-applied`
- API key: `~/.kerri-chief/secrets/kerrihq.env` (`KERRIHQ_SYNC_TOKEN`, scopes `tasks:read tasks:write`; NEVER commit it)
- Product aliases: Savant = formerly Kerri Console / KMG Console / Console.

## 1. Report every run (end of routine, success AND failure)

Call `create_agent_run` with:
- `agent_slug`: the routine's directory name in `agent-prompts/` (e.g. `kerri-inbox-sweep`)
- `status`: `succeeded` | `failed`
- `external_id`: this run's stable id (date + slot, e.g. `2026-06-11-0700`) — makes retries safe
- `output`: the same compact summary written to `brain/log.md` (markdown)
- `error`: when failed
- `tokens`, `cost_cents`, `started_at`, `finished_at` when known

A run that crashes before reporting is caught by Savant's daily health check, which files an "Agent overdue" card on Brian's board. Report failures explicitly anyway; a reported failure is diagnosable, a silent one is not.

## 2. File tasks on the board

When a routine needs Brian's attention, create a Savant task:
- `title`: same `<JOBID> — <Company> — <Subject>` format
- `status`: `needs_approval` for approval-rail items; `action_needed` / `waiting_reply` / `discuss` per the situation
- `body`: ACTION line + context + draft
- `job_ref`: the H/S/G jobId
- `property_slug`: `hardware-fyi` | `kerri-media-group` | `standard-works`
- `external_ref`: deterministic idempotency key, usually `kerrios:<routine>:<jobId>:<sha12>`

## 3. Read approvals back

Brian resolving a `needs_approval` card moves it to `done` with `resolution` = `approved` | `skipped`; redo leaves it open with `resolution=redo_requested`. Poll `node scripts/console-task-api.mjs list --resolved pending --per-page 100`. After applying a decision, call `node scripts/console-task-api.mjs mark-applied --id <taskId> --note "<what happened>"` so the decision is acknowledged and will not execute twice.

## 3a. Interactive sends clear their own card (Brian rule, 2026-06-15; hardened 2026-06-17)

When an email is sent **interactively from chat** (Brian riffs/edits a draft live, outside the sweep approval-card flow), the matching card must close the moment the send succeeds, so it cannot be approved again and double-send. **Use the one atomic command — never hand-do the steps separately:**

```
node scripts/console-task-api.mjs close-job --job <jobId> --message-id <id> --note "<what/where>"
```

`close-job` does the FULL lockstep in one shot, **card-first with a verify before the jobs.json write**:
1. closes the Console **send** card (`status=done`, `resolution=sent_interactively`),
2. closes the paired **recap** card (read from the job's `routing.recapCardId`) the same way,
3. logs a `sent` event receipt on the send card (only if newly closed — re-runs don't duplicate),
4. re-reads the send card to confirm it is `done`, then flips the `data/jobs.json` job (`status=done`, `resolution`, `sentAt`, `sentMessageId`).

It is **idempotent** (safe to re-run; already-closed cards/jobs are detected and left alone) and selects the single *open* job for that jobId automatically — if duplicates are ambiguous it asks for `--card <consoleTaskId>`. Options: `--card <id>` (target a specific send card instead of `--job`), `--recap-card <id>` (override), `--resolution <r>` (default `sent_interactively`), `--dry-run` (print the plan, mutate nothing).

**Why one command:** on 2026-06-17 an interactive send flipped `jobs.json` to sent but left the cards in `needs_approval` (re-approvable / re-sendable for ~12h). Doing the four steps by hand is what allowed the half-completion; `close-job` is card-first so a partial failure leaves the card closed (not re-approvable), never a `jobs.json`-only state the sweep would re-send.

Do NOT use `mark-applied` here (that path is the sweep acknowledging its own approved send). **Safety (built into `close-job`):** `--status done` fires a card's server-side `on_complete` only when the payload is non-blank and `resolution != "skipped"` (`TaskCompletionAction.run!`); queued email-reply cards carry a blank `on_complete`, so closing is side-effect-free. If a card carries a non-blank `on_complete` (e.g. `create_deal`) whose effect you already performed by hand, `close-job` refuses with an instructive error — re-run with `--resolution skipped` (or clear it first via `update --clear-on-complete`).

## 4. Adjustment requests

`list_open_adjustments` returns Brian's plain-English feedback on agents filed in Savant. The brain-maintenance routine applies them to `agent-prompts/` here (normal PR/commit rules), then calls `resolve_adjustment` (`applied` | `dismissed`, with a note). Rails never pushes to this repo; prompts stay git-sourced.

## Related

- [[agent-brain-protocol]] — the 4-step loop these reports feed
- [[google-tasks-improvement-suggestions]] — legacy relevance rules for improvement suggestions; delivery is now Savant tasks
- Savant API docs: `/api_docs` in Savant (full tool list, 23 tools)

## 5. Outreach recording (Brian decision 2026-06-10, evening)

Savant NEVER sends email. Sends stay in Kerri's mailbox MCPs after Brian approves in Savant. After a send completes, the sending agent calls `record_outreach` (deal_id, summary, contact_emails incl CCs, job_ref, thread_subject) so Savant stays the source of truth for who was contacted where. Same for calls/LinkedIn touches (channel param).

Division of record: **brain** = deep knowledge + quick text for agents; **Savant** = the dynamic shared picture for humans AND agents (CRM, pipeline, tasks, revenue, newsletter inventory, sponsor assets, agent runs). Update both; do not add a third Google Tasks control surface back into the loop.
