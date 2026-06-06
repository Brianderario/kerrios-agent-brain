# Claude-Side Routines (legacy/fallback)

scope: legacy routine spec · updated: 2026-06-05 · author: Brian + Kerri

The Claude Code counterpart to [`kerri-skill/references/automations.md`](kerri-skill/references/automations.md) ("Codex Primary"). This file now preserves the 2026-05-29 Claude scheduled-tasks migration as a fallback/historical reference. As of the 2026-06-05 Codex re-entry, Codex is again the primary scheduled runner for Kerri's operating bundle, gap sweep, and revenue research/drafting pair.

Do not use this file as proof that Claude owns a live routine. The visible shims under `~/.claude/scheduled-tasks/` may remain on disk, but the active source of scheduled-run truth is the Codex automation records under `/Users/brianderario/.codex/automations/`. `kerri-gap-sweep` should keep checking both surfaces and escalate any double-run risk.

Organized by **role pod + operating loop**, per [[../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] (design implication: automations are grouped by pod and loop, never by old schedule names). The slide framework Brian shared 2026-05-29 is a 1:1 visual of that decision: every agent perceives the world, acts inside gates, and **constantly feeds data back to KerriOS**.

## Substrate: local Claude Code scheduled-tasks MCP (legacy/fallback)

Routines were migrated to **persistent `scheduled-tasks` MCP jobs** under `~/.claude/scheduled-tasks/<name>/SKILL.md` on Brian's MacBook on 2026-05-29. Each shim loads its canonical `agent-prompts/<name>/SKILL.md`. That substrate is no longer the primary runner after the 2026-06-05 Codex re-entry.

If Brian explicitly asks to fall back to Claude, first verify the scheduled-tasks MCP state from inside Claude, confirm Codex equivalents are paused, and update `brain/wiki/agents/registry.md` plus `kerri-skill/references/automations.md` in the same handoff. Never run Claude scheduled tasks and Codex automations for the same routine in parallel without an explicit controlled test.

Two legacy substrate facts that still matter if Claude is reactivated:

1. **A Claude Code REPL must be running and idle for any job to fire.** If the Mac is asleep or no session is open, nothing runs. (Codex's cloud runner had no such constraint.) `com.kerri.routine-liveness` (launchd, every 15m) now catches a routine that has gone dark and texts Brian.
2. **7-day expiry — RESOLVED (not applicable).** That expiry was a property of the older `CronCreate durable=true` approach. The scheduled-tasks MCP jobs above are **persistent and do not auto-expire**, so no weekly "re-arm" job is needed. (Decision settled 2026-05-30: scheduled-tasks MCP is the chosen substrate; durable cron is not used — there is no `~/.claude/crons/`.) `kerri-gap-sweep` class I + the liveness watchdog still watch that the tasks stay `enabled` and keep firing.

## Date & time handling — ET clock, never the harness `currentDate`

Every `<YYYY-MM-DD>`, `<date>`, and `HH:MM ET` a routine writes — NOW.md baton, `brain/log.md`, commit messages, task titles, ledger/state keys, meeting + fallback filenames — is an **ET calendar date** and MUST be derived from the machine clock:

- date  → `TZ='America/New_York' date +%F`                    (e.g. `2026-06-01`)
- stamp → `TZ='America/New_York' date +'%Y-%m-%d %H:%M %Z'`   (e.g. `2026-06-01 22:08 EDT`)

**Never label a write with the harness-provided `currentDate`.** That value is **UTC**, so in the **8pm–midnight ET window** it has already rolled to the next day and silently mis-dates ET writes by **+1** (root cause: gap-sweep run #4, 2026-06-01 — baton read `2026-06-02` while real ET was `2026-06-01`). The Mac clock is ET, so `TZ='America/New_York'` is both the correct source and robust if the clock ever drifts off ET. Affected runners explicitly carry this rule at their date-stamp step: `kerri-inbox-sweep`, `kerri-gap-sweep`, `kerri-brain-push` (all write inside the window).

## The loop contract every routine must satisfy

A routine prompt is **incomplete** unless it names all six (per the role-pods decision, lines 104–111):

| Field | Meaning |
|---|---|
| **Perceive** | the live surface it inspects (mailbox, calendar, repo, Tasks…) |
| **Propose** | the action/draft it produces |
| **Gate** | which approval gate applies before anything leaves the building |
| **Act** | what it may do *after* approval |
| **Record** | the durable memory it writes back to KerriOS, and where |
| **Improve** | how repeated misses become a workflow/prompt fix |

**Record + Improve fire on every run — including quiet/no-op runs** (a grade/state write is still a write). That is the "constantly feed data back" principle. Write-back is constrained to the allowed list in the role-pods decision (company/contact facts, thread state, task lifecycle, Brian-edit rules, approved pricing/packaging, deal/event status, content decisions, repeated-miss fixes). Never raw thread dumps, partner internals, or chat logs.

## Migration deltas from the Codex prompts (apply when porting)

- **Strip the Codex closing directives.** Every existing `agent-prompts/*/SKILL.md` ends with a required `::inbox-item{...}` + `::archive{...}` block. Those are Codex-runner only. Under Claude Code, durable output is the routine's named surface (Tasks/email/text/ledger/commit) — no closing directives. Add a `## Runner` section to each prompt (as `kerri-gap-sweep` does) so the runner-specific behavior is explicit and lives in git.
- **Local deps carry over unchanged:** `scripts/inbox-sweep-lock.mjs`, the Sendblue adapter `/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs`, local state files, local email MCPs. Claude fallback prompts that acquire the inbox-sweep lock must pass `--runner claude` so the local reaper may fast-release a proven orphaned Claude lock; Codex primary prompts pass `--runner codex` and recover through the lock TTL instead.
- **Approval gate unchanged:** external sends still require `approved=true` + `approvalSource`; every send still auto-CCs brian@hardwarefyi.com.
- **Customer ID Protocol unchanged:** runner-agnostic; applies to any routine touching companies/leads/drafts.

Cron times below are the historical Claude schedule in ET (assumes the Mac clock is ET) and use off-:00/:30 minutes to avoid fleet-wide collisions.

---

## Loop 1 · Brian / Kerri assistant (schedule first)

| Routine | cron | Prompt | Perceive → Propose → Gate → Act → Record → Improve |
|---|---|---|---|
| `kerri-inbox-sweep` | `*/15 * * * *` | `kerri-inbox-sweep/SKILL.md` | 4 mailboxes → drafts/tasks → Google Tasks checkbox → send on approval → `jobs.json` + cursors + grades + `draft-learnings.md` → `💡 SUGGESTION` task |
| `kerri-morning-brief` | `57 6 * * 1-5` | `kerri-morning-brief/SKILL.md` | today's mtgs + Chase alerts + Tasks → HTML brief → none (read-only) → email kerri→brian@kerrihq + text if attention needed → `output/morning-brief/` + grade → brief-quality miss. STEP 0 preflight (`scripts/morning-brief-run-state.mjs --start`) stamps run-started + writes an in-progress HTML skeleton so a mid-run crash is never silent; STEP 4 `--finish` marks the run complete. |
| `kerri-morning-brief-retry` | `15 7 * * 1-5` | `kerri-morning-brief-retry/SKILL.md` | guard `morning-brief-run-state.mjs --check-needed` → if brief already delivered (or weekend) silent no-op, else re-run `kerri-morning-brief/SKILL.md` → recovers a crashed/missing 7:00am run ~07:18 ET, before the 07:30 liveness dark threshold. Auto-recovery counterpart to the STEP 0 crash-evidence stamp. |
| `kerri-brain-push` | `0 22 * * *` | `kerri-brain-push/SKILL.md` | brain/prompt diff → commit set → push gate → push → `brain/log.md` + `brain-push-state.json` → hygiene fix. *(Overlaps the Stop-hook auto-sync `kerri-sync.sh` — open decision: keep as belt-and-suspenders or drop.)* |
| `kerri-gap-sweep` | `41 21 * * *` | `kerri-gap-sweep/SKILL.md` | repo/shims/scripts/docs **+ live operating state** (routine execution liveness, cross-runner sync, state-file integrity, connector availability, host/resource health, safety-gate integrity, approval-queue hygiene) → gap list → auto-fix vs PR vs task gate (mechanical hygiene auto-fixes; system-health findings are inspect-and-escalate only) → safe commits + PRs + KerriMG tasks → `gap-sweep-state.json` health ledger + log line → propose structural guards/monitors. **Independent whole-system health & hygiene agent** — expanded 2026-05-29 from code/workflow-only to a full operating-system check (classes A–I machinery, J–P system health). Runs before the 22:00 push so safe fixes ship that night. |

## Loop 4 · Meeting / context

| Routine | cron | Prompt | Loop |
|---|---|---|---|
| `kerri-eod-meetings-review` | `28 18 * * 1-5` | `kerri-eod-meetings-review/SKILL.md` | calendar + Granola → follow-up drafts + recap → Google Tasks approval → drafts → meeting/entity memory + `jobs.json` routing → recap/recording miss |

## Loop 2 · Sales pod (first-day core audit passed 2026-05-31 — revenue agents now scheduled)

Lead research + cold outreach were promoted to live scheduled-tasks crons after the core bundle (inbox sweep, morning brief, EOD, brain push) proved stable. Approval gates are unchanged: cold outreach drafts only and never auto-sends; lead research only researches + tops up the pool. Pipeline follow-up stays on-demand until its volume justifies a schedule.

| Routine | cron | Prompt | Status |
|---|---|---|---|
| Monthly Partnership Research | `0 10 1 * *` | inline (automations.md §6) → promote to `kerri-lead-research` | superseded by scheduled `kerri-lead-research` |
| Weekly "What Got Done" | `0 16 * * 5` | inline (automations.md §4) | on-demand (not yet scheduled) |
| Lead research | `13 18 * * 1-5` | `kerri-lead-research/SKILL.md` | **scheduled** (weekday ~6:16pm ET); feeds outbound queue |
| Outbound sales | `7 9 * * 1-5` | `kerri-cold-outreach/SKILL.md` | **scheduled** (weekday ~9:16am ET); drafts only, never auto-sends |
| Pipeline follow-up | on-demand | `kerri-pipeline-followup/SKILL.md` | approval-gated |
| **Inbound sales triage** | — | **prompt does not exist (gap)** | deferred per registry until volume justifies |
| **Event sales** | — | **prompt does not exist (gap)** | tree lists it; only `kerri-event-logistics` exists today |

## Loop 3 · Standard & Works newsletter (event/issue-triggered, not cron)

`kerri-sw-newsletter-writer` / `-editor` / `-marketing`. Boundary + approval rules per [[../brain/wiki/companies/standard-and-works]]. Not scheduled — driven by issue cadence; never auto-posts.

## Loops 5–6 · Benji content + Ari finance (defined, not built)

Prompts not yet authored; sequence last. Ari pod stays behind explicit approval-gate design before any activation. Out of scope for this scheduling pass.

---

## Activation checklist (HISTORICAL — activated 2026-05-29, superseded by Codex 2026-06-05)

1. ~~Resolve the **re-arm mechanism**~~ — **DONE.** Migrated to the persistent scheduled-tasks MCP, which does not expire; no re-arm job needed.
2. Add a `## Runner` section + strip Codex closing directives in each Loop-1/Loop-4 prompt being ported.
3. Confirm the Mac clock is ET (or offset the cron fields).
4. Create the Loop-1 routines first (`inbox-sweep`, `morning-brief`, `brain-push`, `gap-sweep`), then Loop-4 (`eod-meetings-review`).
5. ~~Run in parallel with Codex before hard-swapping (cutover — open)~~ — **DONE for the 2026-05-29 Claude migration, then superseded.** Codex equivalents were disabled on 2026-05-30, but Codex was reactivated on 2026-06-05.
6. Registry and automation docs now reflect Codex as primary again; this file is fallback reference only.
