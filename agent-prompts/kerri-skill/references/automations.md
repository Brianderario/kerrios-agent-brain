# Kerri Automations — Claude Code Primary

These are scheduled routines Kerri runs through Claude Code persistent scheduled tasks (`~/.claude/scheduled-tasks/`). Each is a shim that loads the canonical `agent-prompts/<name>/SKILL.md`. Codex automations under `~/.codex/automations/` are retired as of 2026-06-08 and should be disabled. History: old schedules removed 2026-05-25; Claude migration 2026-05-29; brief Codex re-entry 2026-06-05; permanent Claude Code return 2026-06-08.

## Universal rule: Customer ID Protocol applies to every automation here

**EVERY** routine on this page that touches companies, leads, drafts, vendors, or brain entries runs [[../../../brain/wiki/workflows/customer-id-protocol]] BEFORE assigning any jobId or registering a company. As of 2026-06-11 the lookup and registration run against the KMG Console API (the CRM of record); `data/companies.json` is a generated read-only snapshot for offline jobId reuse, and `brain/wiki/companies/` is frozen (relationship facts go in the Console record's `crm_notes`). Per-customer (not per-sweep): a company keeps the same jobId forever, across every thread, every draft, every meeting, every cold email, every event vendor inquiry. The H/S/G counter only bumps when a brand-new company enters the Console. The lookup doubles as a QA gate. Brian stated 2026-05-24: "this should be reflected in all automations and in memory. Anytime there's a sweep of info and something to log, this is the process."

## Activation pattern

To activate a routine, create a Claude Code persistent scheduled task under `~/.claude/scheduled-tasks/<name>/SKILL.md` that loads the canonical `agent-prompts/<agent>/SKILL.md`. Each routine writes back to KerriOS brain when material things happen.

**Loop requirement:** whenever Kerri schedules a task, builds an automation, rewrites an automation, or creates a recurring runner, the prompt must explicitly include the KerriOS loop from [[../../../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]]: perceive -> propose -> approve/act -> record -> improve. If the routine creates drafts, tasks, sends, CRM/source-of-truth updates, or deal/content state, it must say exactly what gets written back into KerriOS and where. No automation is complete if it only does the action and does not define the memory write-back.

**Durable output policy:** scheduled Claude Code tasks are not Brian's operating surface. Durable output must land in the external surface named by the prompt: Kerri Console tasks, email, HTML artifact, repo log, run ledger, CRM/source-of-truth note, or KerriOS state. (Kerri no longer texts Brian; the Sendblue/text path was retired from Kerri on 2026-06-17 and the separate Hermes agent owns texting now.) Codex `::inbox-item` / `::archive` closing directives are no longer needed — Claude Code scheduled tasks have no equivalent requirement. Canonical prompts may still contain those directive blocks as historical artifacts; shims instruct the runner to skip them.

**Hardware FYI revenue goal:** Brian's standing Hardware FYI goal for CY2026 is `$1,000,000` top-line revenue. Every active Hardware FYI automation must read or obey `brain/wiki/workflows/hwfyi-cy2026-revenue-goal.md` and classify work by whether it collects cash, advances pipeline, improves product value, or improves the revenue system. Do not claim fresh revenue totals unless the live tracker/CRM/payment source was actually refreshed.

**Daily 10-outreach loop:** `brain/wiki/workflows/hwfyi-daily-10-outreach-loop.md` is the contract for weekday net-new sponsor outreach. `kerri-lead-research` maintains at least 25 ready-to-draft prospects each evening; `kerri-cold-outreach` targets exactly 10 approval-ready one-to-one drafts each weekday morning; `kerri-inbox-sweep` sends only after Brian approves the Kerri Console batch and then promotes sent companies to `Prospect` in the central pipeline. Both new scheduled loops enforce cheap preflight and bounded context loading so no-op/healthy runs do not bloat token usage.

**Central revenue tracker:** current goal progress lives in the `CY2026 Revenue Goal` tab of the canonical Hardware FYI Sheet (`1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk`). Use `node scripts/hwfyi-revenue-goal-sheet.mjs --ensure` to create/repair the tab header, `--read` to inspect the summary, `--pipeline-summary` for status counts, and `--seed-contract-breakdown` / `--seed-pipeline` only when intentionally refreshing the generated rows. Existing CRM/tracker/Stripe surfaces are evidence feeds into this tab. Pipeline statuses are exactly `Prospect`, `Interest`, `Contract Won`, and `Contract Lost`. Outreach targets belong in `brain/wiki/workflows/hwfyi-cy2026-gap-close-targets.md`, not the pipeline. Do not add a pipeline dollar amount until pricing, a proposal, a buyer counter, a contract, or an invoice is source-backed.

**2026-05-26 activation gate (CLEARED 2026-05-31; REVENUE FOCUS EXPANDED 2026-06-07; CLAUDE CODE SOLE RUNNER 2026-06-08):** the first-day core automation audit passed; revenue agents promoted to scheduled. All routines now run as Claude Code scheduled tasks. Approval gates are unchanged: cold outreach drafts only and never auto-sends; lead research only researches + tops up the lead pool. Pipeline follow-up is scheduled weekly as the warm-deal owner for the CY2026 revenue goal.

## 1. Morning Briefing

**When:** 7am ET, M–F (`0 7 * * 1-5`)
**Where it lands:** HTML email from `kerri@hardwarefyi.com` to `brian@kerrihq.com`
**Canonical prompt:** `agent-prompts/kerri-morning-brief/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** today's meetings + yesterday's Chase alerts in `brian@kerrihq.com` Gmail + pending Kerri Console tasks + optional Kerri's Read -> polished local HTML brief -> HTML email delivery to Brian's KerriHQ inbox -> Sendblue heads-up only when the brief needs Brian attention -> state/grade write-back -> auto-archive the automation chat.
**HTML artifact:** `output/morning-brief/<YYYY-MM-DD>.html` and `output/morning-brief/latest.html`

### 1b. Morning Brief Retry

**When:** 7:18am ET, M-F (`18 7 * * 1-5`)
**Canonical prompt:** `agent-prompts/kerri-morning-brief-retry/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** guarded run-state check -> silent no-op when the 7:00am brief delivered -> recover the primary morning brief when it crashed or never fired -> write the same brief artifacts/state -> auto-archive the automation chat. This exists only as a recovery guard; it should not create duplicate brief emails on healthy mornings.

## 2. 15-Minute Inbox Sweep (Primary Automation)

**When:** Every 15 minutes (6am–10pm ET) via Claude Code scheduled task: `kerri-inbox-sweep`. The prompt sends no Brian-facing text/email/Slack noise when there is nothing to do. It must acquire `scripts/inbox-sweep-lock.mjs` with `--runner claude` before loading context, so overlapping runs exit silently instead of piling up.
**Mailboxes:** kerri@hardwarefyi.com and brian@hardwarefyi.com (custom Hardware FYI email MCPs), brian@kerrihq.com (Gmail MCP, draft-only), brian@standardandworks.com (Superhuman MCP).
**Approval channel:** Kerri Console production Tasks board. Each job becomes a Console task; Brian's approve/skip/redo resolution is the send authority; ACTION line in the task body remains the machine-readable intent for send/skip/redo. The Console task itself is Brian's attention signal; Kerri no longer texts Brian (the Sendblue/text path was retired from Kerri on 2026-06-17 and the separate Hermes agent owns texting now — do not call send-text-alert.mjs). Repeated identical connector errors are still deduped through `data/inbox-sweep-state.json`: first occurrence recorded, then silent fail-closed grading for the same reason inside the suppression window. Full flow lives at `agent-prompts/kerri-inbox-sweep/SKILL.md` — that file is the source of truth.
**Data files:**
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/job-counters.json` — persistent H/S/G counters
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/jobs.json` — open job registry (dedup + state)
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/inbox-sweep-state.json` — per-mailbox cursors + seen message IDs
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/inbox-sweep-grades.json` — per-run/daily/weekly self-grades
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/brain/wiki/workflows/draft-learnings.md` — accumulated draft lessons

**Prompt:** Lives at `agent-prompts/kerri-inbox-sweep/SKILL.md`. Approval channel is Kerri Console production Tasks. Console approve = send (auto-detects edited body); skip/redo are explicit Console resolutions, with ACTION line retained for compatibility. Kerri's build/workflow suggestions land as Console tasks with a `💡 SUGGESTION:` prefix (max 1/run, dedup'd against existing open suggestions).

**Self-grading:** Every sweep writes a compact quality score covering mailbox coverage, dedup/state, context quality, draft quality, approval safety, and brain write-back. Daily and weekly grade passes turn repeated misses into draft learnings, workflow updates, or Kerri MG improvement tasks.

## 3. End-of-Day Review

**When:** 6:30pm ET, M–F (`30 18 * * 1-5`)
**Canonical prompt:** `agent-prompts/kerri-eod-meetings-review/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** calendar-first meeting ledger + Granola evidence -> meeting/entity memory -> existing email-chain lookup for every client follow-up -> follow-up Console tasks plus matching `data/jobs.json` routing metadata for every proposed draft -> missing-recording/manual-recap Console tasks -> Sendblue heads-up when Brian attention is needed -> state/grade write-back -> auto-archive the automation chat.

## 3b. Brain Push / Knowledge Hygiene

**When:** 10pm ET daily (`0 22 * * *`)
**Canonical prompt:** `agent-prompts/kerri-brain-push/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** detect eligible brain/prompt changes -> validate safety/tests -> commit/push -> log -> hygiene grade -> Sendblue heads-up only on failure -> auto-archive the automation chat.

## 3c. Gap Sweep / Whole-System Health

**When:** 9:41pm ET daily (`41 21 * * *`)
**Canonical prompt:** `agent-prompts/kerri-gap-sweep/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** repo/docs/scripts/shims + live operating state -> gap list -> auto-fix only mechanical drift, PR material changes, task human decisions -> health ledger + log -> structural improvements. Checks `/Users/brianderario/.claude/scheduled-tasks/*/SKILL.md` for runner health; Codex automation records under `~/.codex/automations/` should be confirmed disabled.

## 3d. Revenue Research, Drafting, and Warm Pipeline

**Lead research:** 6:13pm ET, M-F (`13 18 * * 1-5`), `agent-prompts/kerri-lead-research/SKILL.md`, GPT-5.5 high. Researches and enriches Hardware FYI sponsor prospects, dedups against KerriOS/CRM/recent outreach, writes `data/leads-master.json` and research batches, mirrors to CRM/CSV fallback where available, and tops up `data/cold-outreach-queue.json` to at least 25 ready prospects for the next 10-outreach batch. It starts with compact queue/pool counts and stops quietly when the queue is healthy. It never drafts, sends, or promotes uncontacted leads into the central pipeline.

**Cold outreach:** 9:07am ET, M-F (`7 9 * * 1-5`), `agent-prompts/kerri-cold-outreach/SKILL.md`, GPT-5.5 high. Converts queued prospects into one daily Hardware FYI approval task targeting exactly 10 personalized drafts when 10 qualified prospects survive dedupe/enrichment. It starts with compact cap/queue counts, inspects at most 25 queue entries, and keeps the task payload compact. It never sends; the inbox sweep sends later only after Brian approves the task. Once an approved cold draft actually sends, inbox-sweep should create/update the central ledger row as `Prospect`.

**Pipeline follow-up:** 8:33am ET, Tuesdays (`33 8 * * 2`), `agent-prompts/kerri-pipeline-followup/SKILL.md`, GPT-5.5 high. Owns warm Hardware FYI/KMG deal nudges where Brian/Kerri sent last and the relationship-tier cadence has elapsed. It stages at most five approval-gated tasks, never sends directly, and maintains central statuses for source-backed warm-deal movement.

**Superseded path:** `hwfyi-weekday-outreach` remains paused. Do not run the old one-step outreach automation in parallel with the lead-research -> cold-outreach -> inbox-sweep approval path.

## 4. Weekly What Got Done (prompt only)

**When:** Fri 4pm ET (`0 16 * * 5`)

**Prompt:**
```
You are Kerri. Weekly "what got done" report.

1. Pull the week's brain updates: deals moved, decisions made, newsletters published, sponsors closed.
2. Pull the week's pipeline deltas from Savant (`GET /api/v1/deals` + `GET /api/v1/revenue_command`); `brain/wiki/deals/` is frozen, not a source.
3. Compile a one-page report:
   - Shipped this week (newsletters, events, contracts)
   - Pipeline movement (new deals, moved stages, lost deals)
   - Brain updates (new entities added, candidates promoted)
   - Open asks rolling to next week
4. Send the report to Brian via Slack DM.
5. If Brian flags it as shareable, prepare a redacted version for Zach (S/W 50/50 reporting cadence) — but DO NOT send to Zach without Brian's explicit "share with Zach" approval.

Tone: factual, numeric, terse.
```

## 5. Daily Industry Brief (not scheduled)

**When:** TBD with Brian (suggested 6am ET, M–F)

**Prompt:**
```
You are Kerri. Daily industry brief for hardware / industrial base / advanced manufacturing.

1. Scan public sources (curated RSS, Apollo enrichments, industry news search).
2. Filter for relevance to Hardware FYI (semiconductors, robotics, EVs, energy, defense, manufacturing) and S&W (industrial policy, capex, infrastructure).
3. Compile 5-7 bullets: news + why it matters + potential angle for the Hardware FYI newsletter / Weekend Wire / S&W newsletter.
4. Send to Brian and (when activated) Benji via Slack.

Tone: factual, bulleted, with a clear "why it matters" line per item.
```

## 6. Monthly Partnership Research (prompt only)

**When:** 1st of each month, 10am ET (`0 10 1 * *`)

**Prompt:**
```
You are Kerri. Monthly partnership research.

1. Use Apollo to enrich prospects in 4 categories:
   - Conference partners (industrial / hardware events)
   - Accelerators with hardware-heavy portfolios
   - VCs investing in hardware/manufacturing
   - Ad partners (newsletter sponsors with budget signals)
2. Cross-reference with the KMG Console CRM (GET /api/v1/companies?domain=<d>; read-only snapshot data/companies.json when offline) to avoid duplicates.
3. Add new prospects to brain/candidates/prospects-{month}.md.
4. Send Brian a Slack DM with the top 10 net-new prospects + one-line rationale each.
```

## 7. Supporting skills, not scheduled routines

These prompts can be invoked by Brian or by another approved workflow, but they are not recurring automations:

- `agent-prompts/send-partner-contract/SKILL.md` — partner/SOW contract packet prep. Finance, legal, payment, signature authority, and external sends stay approval-gated.
- `agent-prompts/kerri-event-logistics/SKILL.md` — on-demand venue/vendor/event logistics support.

## Notes

- **Inbox Sweep (#2) = ACTIVE in Claude Code.** `kerri-inbox-sweep` runs every 15 minutes (6am–10pm ET). Canonical prompt: `agent-prompts/kerri-inbox-sweep/SKILL.md`.
- **Core bundle = ACTIVE in Claude Code.** `kerri-eod-meetings-review`, `kerri-morning-brief`, `kerri-morning-brief-retry`, and `kerri-brain-push`.
- **Monitor = ACTIVE in Claude Code.** `kerri-gap-sweep` runs daily at 9:41pm ET; checks Claude scheduled-task health.
- **Revenue agents = ACTIVE in Claude Code.** `kerri-lead-research` (weekday ~6:13pm ET), `kerri-cold-outreach` (weekday ~9:07am ET), and `kerri-pipeline-followup` (Tuesday ~8:33am ET). Approval gates unchanged — cold outreach and pipeline follow-up draft only and never auto-send; lead research only researches + tops up the pool. `hwfyi-weekday-outreach` is paused/superseded.
- **S&W writer = ACTIVE in Claude Code.** `standard-works-issue-writer` runs Mon/Wed at 8pm ET. Stages Beehiiv review drafts only; never publishes.
- **All drafts route to Brian first.** No outbound to third parties without per-thread approval (see [[email.md]]).
- **Material brain writes go through approval gates.** See [[brain.md]] mutation rules.
