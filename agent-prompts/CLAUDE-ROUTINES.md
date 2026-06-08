# Claude Code Routines — Primary

scope: routine spec · updated: 2026-06-08 · author: Brian + Kerri

Claude Code is the **sole scheduled runner** for all Kerri routines as of 2026-06-08. This file and [`kerri-skill/references/automations.md`](kerri-skill/references/automations.md) are now aligned — both describe the same Claude Code scheduled tasks. Codex automations under `~/.codex/automations/` are retired and should be disabled.

Organized by **role pod + operating loop**, per [[../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] (design implication: automations are grouped by pod and loop, never by old schedule names). The slide framework Brian shared 2026-05-29 is a 1:1 visual of that decision: every agent perceives the world, acts inside gates, and **constantly feeds data back to KerriOS**.

## Substrate: Claude Code persistent scheduled-tasks MCP

All routines run as **persistent `scheduled-tasks` MCP jobs** under `~/.claude/scheduled-tasks/<name>/SKILL.md` on Brian's MacBook. Each shim loads its canonical `agent-prompts/<name>/SKILL.md`. These are persistent and do not auto-expire.

Key operational facts:

1. **Claude Code must be running for jobs to fire.** If the Mac is asleep or no session is open, nothing runs. `com.kerri.routine-liveness` (launchd, every 15m) catches a routine that has gone dark and texts Brian.
2. **No expiry.** The scheduled-tasks MCP jobs are persistent. No re-arm job needed. `kerri-gap-sweep` class I + the liveness watchdog watch that tasks stay `enabled` and keep firing.

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

## Context budget discipline — the anti-bloat contract

Token cost is real. Last week routines burned through Brian's allocation in 3 days because context loading was unchecked. These rules exist to prevent that while keeping Kerri fully informed when she needs to be.

**NOW.md stays under 25 lines.** It's loaded by every routine, including the inbox sweep that runs 44×/day. Historical `> PRIOR` entries and shipped `✅` items must be pruned — they've served their handoff purpose. The nightly gap-sweep (STEP 1.5) enforces this automatically.

**Preflight before context.** Routines with a TOKEN BUDGET CONTRACT (currently: `kerri-lead-research`, `kerri-cold-outreach`) run a cheap structured-data preflight BEFORE loading NOW.md, brain files, voice.md, or calling external tools. If the preflight shows a no-op (queue healthy, caps full), the routine writes compact state/grade and exits without loading broad context. The shims for these routines explicitly override the "read NOW.md first" instruction from CLAUDE.md.

**Load brain pages by routing, not by directory.** The LLM-wiki pattern exists for a reason. Read `brain/routing.md` → load 1–3 routed pages. Never glob `brain/wiki/` or load the full index into context. See `brain/wiki/workflows/llm-wiki-pattern.md`.

**No stale reference context.** Do not load files from retired systems (e.g. `/Desktop/Codex Kerri Agent/`). If a prompt references a path that predates KerriOS, the gap-sweep should flag it for removal.

**Compact durable output.** State files, grades, logs, Slack digests, and NOW.md handoffs get counts + summaries + top examples + blockers + next action. Never raw API payloads, full email bodies, or unbounded history in handoff surfaces.

## Migration deltas from the Codex prompts (apply when porting)

- **Codex closing directives are skipped.** Canonical `agent-prompts/*/SKILL.md` files may still end with `::inbox-item{...}` + `::archive{...}` blocks from the Codex era. The Claude Code shims instruct the runner to skip them. Under Claude Code, durable output is the routine's named surface (Tasks/email/text/ledger/commit).
- **Local deps carry over unchanged:** `scripts/inbox-sweep-lock.mjs`, the Sendblue adapter `/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs`, local state files, local email MCPs. Claude Code prompts acquire the inbox-sweep lock with `--runner claude`.
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

Lead research + cold outreach were promoted to live scheduled-tasks crons after the core bundle proved stable. As of 2026-06-08 Claude Code owns the complete Hardware FYI revenue loop: lead research, cold outreach, twice-weekly pipeline follow-up, weekly renewal watchdog, and Friday revenue standup. Approval gates are unchanged: cold outreach, pipeline follow-up, and renewal watchdog draft only and never auto-send; lead research only researches + tops up the pool; revenue standup is read-only (Slack + text). The daily 10-outreach contract lives at `brain/wiki/workflows/hwfyi-daily-10-outreach-loop.md`: lead research maintains 25 ready prospects and cold outreach targets 10 approval-ready drafts each weekday morning. Cold-outreach conversion tracking (inbox-sweep STEP 2c) closes the measurement loop by tagging replies from cold-contacted prospects. Both loops must use cheap preflight and bounded context loading to avoid token bloat on healthy/no-op runs.

| Routine | cron | Prompt | Status |
|---|---|---|---|
| Monthly Partnership Research | `0 10 1 * *` | inline (automations.md §6) → promote to `kerri-lead-research` | superseded by scheduled `kerri-lead-research` |
| Weekly "What Got Done" | `0 16 * * 5` | inline (automations.md §4) | superseded by `kerri-revenue-standup` (covers pipeline + outreach + actions) |
| Revenue standup | `0 16 * * 5` | `kerri-revenue-standup/SKILL.md` | **Claude Code scheduled task** (Friday ~4pm ET); read-only scoreboard vs $1M, pipeline velocity, outreach conversion, renewal radar, top 3 actions → Slack DM + text |
| Lead research | `13 18 * * 1-5` | `kerri-lead-research/SKILL.md` | **Claude Code scheduled task** (weekday ~6:13pm ET); maintains 25 ready prospects |
| Outbound sales | `7 9 * * 1-5` | `kerri-cold-outreach/SKILL.md` | **Claude Code scheduled task** (weekday ~9:07am ET); targets 10 approval-ready drafts, never auto-sends |
| Pipeline follow-up | `33 8 * * 2,4` | `kerri-pipeline-followup/SKILL.md` | **Claude Code scheduled task** (Tue+Thu ~8:33am ET); approval-gated, never sends |
| Renewal watchdog | `0 10 * * 3` | `kerri-renewal-watchdog/SKILL.md` | **Claude Code scheduled task** (Wednesday ~10am ET); scans CRM for expiring contracts, lapsed sponsors, upsell opportunities; max 5 renewal drafts per run, approval-gated |
| **Inbound sales triage** | — | **prompt does not exist (gap)** | deferred per registry until volume justifies; cold-outreach conversion tracking (STEP 2c in inbox-sweep) partially covers inbound from cold prospects |
| **Event sales** | — | **prompt does not exist (gap)** | tree lists it; only `kerri-event-logistics` exists today |

## Loop 3 · Standard & Works newsletter (event/issue-triggered, not cron)

`kerri-sw-newsletter-writer` / `-editor` / `-marketing`. Boundary + approval rules per [[../brain/wiki/companies/standard-and-works]]. Not scheduled — driven by issue cadence; never auto-posts.

## Loops 5–6 · Benji content + Ari finance (defined, not built)

Prompts not yet authored; sequence last. Ari pod stays behind explicit approval-gate design before any activation. Out of scope for this scheduling pass.

---

## Activation checklist (HISTORICAL — activated 2026-05-29, Claude Code sole runner 2026-06-08)

All routines are now live as Claude Code scheduled tasks. The 12 active tasks: `kerri-inbox-sweep`, `kerri-morning-brief`, `kerri-morning-brief-retry`, `kerri-eod-meetings-review`, `kerri-brain-push`, `kerri-gap-sweep`, `kerri-lead-research`, `kerri-cold-outreach`, `kerri-pipeline-followup`, `kerri-revenue-standup`, `kerri-renewal-watchdog`, `standard-works-issue-writer`. Codex automations should be disabled to prevent double-runs.
