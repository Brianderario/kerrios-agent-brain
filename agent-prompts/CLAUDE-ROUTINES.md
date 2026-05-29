# Claude-Side Routines (canonical)

scope: routine spec · updated: 2026-05-29 · author: Brian + Kerri

The Claude Code counterpart to [`kerri-skill/references/automations.md`](kerri-skill/references/automations.md) ("Codex Primary"). This file defines how Kerri's scheduled routines run on **local Claude Code durable cron** — the substrate Brian chose 2026-05-29 to replace Codex's automations.

Organized by **role pod + operating loop**, per [[../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] (design implication: automations are grouped by pod and loop, never by old schedule names). The slide framework Brian shared 2026-05-29 is a 1:1 visual of that decision: every agent perceives the world, acts inside gates, and **constantly feeds data back to KerriOS**.

## Substrate: local Claude Code durable cron

Routines run via `CronCreate` with `durable=true` on Brian's MacBook, inside a running Claude Code session. This gives full local access (files, `scripts/*`, git brain, local email MCPs, the Sendblue text adapter) — the closest 1:1 replacement for Codex.

Two substrate facts that are NOT optional to plan around:

1. **A Claude Code REPL must be running and idle for any job to fire.** If the Mac is asleep or no session is open, nothing runs. (Codex's cloud runner had no such constraint.)
2. **Recurring jobs auto-expire after 7 days.** `durable=true` survives restarts but does not defeat the 7-day expiry. Routines need a **re-arm mechanism** (a weekly job that re-creates the set) or migration to the `scheduled-tasks` MCP / `~/.claude/scheduled-tasks/` shim system — the same mechanism the retired Codex shims used. **Open decision — verify before activation.** `kerri-gap-sweep` (gap class I) watches for expired/unarmed routines and escalates.

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
- **Local deps carry over unchanged:** `scripts/inbox-sweep-lock.mjs`, the Sendblue adapter `/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs`, local state files, local email MCPs.
- **Approval gate unchanged:** external sends still require `approved=true` + `approvalSource`; every send still auto-CCs brian@hardwarefyi.com.
- **Customer ID Protocol unchanged:** runner-agnostic; applies to any routine touching companies/leads/drafts.

Cron times below are ET (assumes the Mac clock is ET) and use off-:00/:30 minutes to avoid fleet-wide collisions.

---

## Loop 1 · Brian / Kerri assistant (schedule first)

| Routine | cron | Prompt | Perceive → Propose → Gate → Act → Record → Improve |
|---|---|---|---|
| `kerri-inbox-sweep` | `*/15 * * * *` | `kerri-inbox-sweep/SKILL.md` | 4 mailboxes → drafts/tasks → Google Tasks checkbox → send on approval → `jobs.json` + cursors + grades + `draft-learnings.md` → `💡 SUGGESTION` task |
| `kerri-morning-brief` | `57 6 * * 1-5` | `kerri-morning-brief/SKILL.md` | today's mtgs + Chase alerts + Tasks → HTML brief → none (read-only) → email kerri→brian@kerrihq + text if attention needed → `output/morning-brief/` + grade → brief-quality miss |
| `kerri-brain-push` | `0 22 * * *` | `kerri-brain-push/SKILL.md` | brain/prompt diff → commit set → push gate → push → `brain/log.md` + `brain-push-state.json` → hygiene fix. *(Overlaps the Stop-hook auto-sync `kerri-sync.sh` — open decision: keep as belt-and-suspenders or drop.)* |
| `kerri-gap-sweep` | `41 21 * * *` | `kerri-gap-sweep/SKILL.md` | repo/shims/scripts/docs → gap list → auto-fix vs PR vs task gate → safe commits + PRs + Kerri MG tasks → `gap-sweep-state.json` + log line → propose structural guards. **NEW — independent code/workflow hygiene agent (2026-05-29).** Runs before the 22:00 push so safe fixes ship that night. |

## Loop 4 · Meeting / context

| Routine | cron | Prompt | Loop |
|---|---|---|---|
| `kerri-eod-meetings-review` | `28 18 * * 1-5` | `kerri-eod-meetings-review/SKILL.md` | calendar + Granola → follow-up drafts + recap → Google Tasks approval → drafts → meeting/entity memory + `jobs.json` routing → recap/recording miss |

## Loop 2 · Sales pod (on-demand until first-day core audit passes, then schedule)

| Routine | proposed cron | Prompt | Status |
|---|---|---|---|
| Monthly Partnership Research | `0 10 1 * *` | inline (automations.md §6) → promote to `kerri-lead-research` | gated on audit |
| Weekly "What Got Done" | `0 16 * * 5` | inline (automations.md §4) | gated on audit |
| Outbound sales | on-demand | `kerri-cold-outreach/SKILL.md` | approval-gated, never auto-sends |
| Lead research | on-demand | `kerri-lead-research/SKILL.md` | feeds outbound queue |
| Pipeline follow-up | on-demand | `kerri-pipeline-followup/SKILL.md` | approval-gated |
| **Inbound sales triage** | — | **prompt does not exist (gap)** | deferred per registry until volume justifies |
| **Event sales** | — | **prompt does not exist (gap)** | tree lists it; only `kerri-event-logistics` exists today |

## Loop 3 · Standard & Works newsletter (event/issue-triggered, not cron)

`kerri-sw-newsletter-writer` / `-editor` / `-marketing`. Boundary + approval rules per [[../brain/wiki/companies/standard-and-works]]. Not scheduled — driven by issue cadence; never auto-posts.

## Loops 5–6 · Benji content + Ari finance (defined, not built)

Prompts not yet authored; sequence last. Ari pod stays behind explicit approval-gate design before any activation. Out of scope for this scheduling pass.

---

## Activation checklist (when Brian gives the go)

1. Resolve the **re-arm mechanism** (open decision above) — no point scheduling routines that silently die at day 7.
2. Add a `## Runner` section + strip Codex closing directives in each Loop-1/Loop-4 prompt being ported.
3. Confirm the Mac clock is ET (or offset the cron fields).
4. Create the Loop-1 routines first (`inbox-sweep`, `morning-brief`, `brain-push`, `gap-sweep`), then Loop-4 (`eod-meetings-review`).
5. Run in parallel with Codex for one cycle before hard-swapping (cutover decision — open).
6. Update `brain/wiki/agents/registry.md` scheduled-tasks table to reflect the Claude runner (material write → PR).
