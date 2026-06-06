# Kerri Automations — Codex Primary

These are scheduled routines Kerri runs through Codex. Old Claude and legacy Codex business schedules were removed on 2026-05-25; a Claude scheduled-tasks migration happened on 2026-05-29; Brian brought the agentic work back into Codex on 2026-06-05. Rebuild each routine from the KerriOS living-brain model, not from old schedule names.

**2026-06-05 Codex re-entry:** Codex is again the primary scheduled runner for the core operating bundle, gap sweep, and revenue research/drafting pair. Claude scheduled-task shims under `~/.claude/scheduled-tasks/` may still exist as legacy/fallback artifacts; do not treat their presence as ownership. `kerri-gap-sweep` must inspect both Codex automation records and Claude shims so double-run risk is surfaced quickly.

## Universal rule: Customer ID Protocol applies to every automation here

**EVERY** routine on this page that touches companies, leads, drafts, vendors, or brain entries runs [[../../../brain/wiki/workflows/customer-id-protocol]] BEFORE assigning any jobId or creating a `brain/wiki/companies/<slug>.md` page. Per-customer (not per-sweep): a company keeps the same jobId forever, across every thread, every draft, every meeting, every cold email, every event vendor inquiry. The H/S/G counter only bumps when a brand-new company enters `data/companies.json`. The lookup doubles as a QA gate. Brian stated 2026-05-24: "this should be reflected in all automations and in memory. Anytime there's a sweep of info and something to log, this is the process."

## Activation pattern

To activate a routine, create a Codex automation pointed at this repo and the canonical `agent-prompts/<agent>/SKILL.md`. Each routine writes back to KerriOS brain when material things happen.

**Loop requirement:** whenever Kerri schedules a task, builds an automation, rewrites an automation, or creates a recurring runner, the prompt must explicitly include the KerriOS loop from [[../../../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]]: perceive -> propose -> approve/act -> record -> improve. If the routine creates drafts, tasks, sends, CRM/source-of-truth updates, or deal/content state, it must say exactly what gets written back into KerriOS and where. No automation is complete if it only does the action and does not define the memory write-back.

**Automation chat archive policy:** scheduled Codex automations are not Brian's operating surface. Their durable output must land in the external surface named by the prompt: Google Tasks, Sendblue/text, email, HTML artifact, repo log, run ledger, CRM/source-of-truth note, or KerriOS state. Codex scheduled runs currently inject a higher-priority requirement to return exactly one `::inbox-item{...}` directive, so the archive rule must satisfy both directives: end with exactly one required inbox-item directive, then a raw `::archive{reason="Durable automation output already written outside this chat"}` directive on the next line as the final line. Do this even for no-op/quiet runs that sent no external alert. Do not wrap either directive in backticks or a code block, and do not write anything after the archive directive. Do not auto-archive only when the chat itself is the only deliverable, Brian explicitly needs to continue inside that automation chat, or the run is blocked before it can write any durable state or alert.

**2026-05-26 activation gate (CLEARED 2026-05-31; RE-ENTERED CODEX 2026-06-05):** the first-day core automation audit passed, then the 2026-06-05 Codex re-entry reactivated the core bundle and ported revenue research/drafting back to Codex. Approval gates are unchanged: cold outreach drafts only and never auto-sends; lead research only researches + tops up the lead pool. Pipeline follow-up remains on-demand until its volume justifies a schedule.

## 1. Morning Briefing

**When:** 7am ET, M–F (`0 7 * * 1-5`)
**Where it lands:** HTML email from `kerri@hardwarefyi.com` to `brian@kerrihq.com`
**Canonical prompt:** `agent-prompts/kerri-morning-brief/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** today's meetings + yesterday's Chase alerts in `brian@kerrihq.com` Gmail + pending Google Tasks + optional Kerri's Read -> polished local HTML brief -> HTML email delivery to Brian's KerriHQ inbox -> Sendblue heads-up only when the brief needs Brian attention -> state/grade write-back -> auto-archive the automation chat.
**HTML artifact:** `output/morning-brief/<YYYY-MM-DD>.html` and `output/morning-brief/latest.html`

### 1b. Morning Brief Retry

**When:** 7:18am ET, M-F (`18 7 * * 1-5`)
**Canonical prompt:** `agent-prompts/kerri-morning-brief-retry/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** guarded run-state check -> silent no-op when the 7:00am brief delivered -> recover the primary morning brief when it crashed or never fired -> write the same brief artifacts/state -> auto-archive the automation chat. This exists only as a recovery guard; it should not create duplicate brief emails on healthy mornings.

## 2. 15-Minute Inbox Sweep (Primary Automation)

**When:** Every 15 minutes via one active Codex automation: `kerri-inbox-sweep`. Model: GPT-5.5 high. The prompt sends no Brian-facing text/email/Slack noise when there is nothing to do, but still emits the required closing directives so the automation chat can archive. It must acquire `scripts/inbox-sweep-lock.mjs` with `--runner codex` before loading context, so overlapping runs exit silently instead of piling up; Codex lock recovery is TTL-based because the local Claude-session reaper cannot observe Codex-owned runs.
**Mailboxes:** kerri@hardwarefyi.com and brian@hardwarefyi.com (custom Hardware FYI email MCPs), brian@kerrihq.com (Gmail MCP, draft-only), brian@standardandworks.com (Superhuman MCP).
**Approval channel:** Google Tasks — three lists Brian created (Hardware FYI / Standard & Works / Kerri MG). Each job becomes a task; checkbox = send; ACTION line in notes for skip/redo. When the sweep creates a new task or any automation output needs Brian's attention, it sends Brian one brief Sendblue/text heads-up through `node /Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs --message "<one-line alert>"`; if there is no task, decision, blocker, error, or other Brian action, it sends no text. Repeated identical connector errors are deduped through `data/inbox-sweep-state.json`: first outage alert only, then silent fail-closed grading for the same reason inside the suppression window. This Sendblue adapter is separate from iMessage Handoff. Full flow lives at `agent-prompts/kerri-inbox-sweep/SKILL.md` — that file is the source of truth.
**Data files:**
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/job-counters.json` — persistent H/S/G counters
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/jobs.json` — open job registry (dedup + state)
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/inbox-sweep-state.json` — per-mailbox cursors + seen message IDs
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/inbox-sweep-grades.json` — per-run/daily/weekly self-grades
- `~/Documents/Documents - Brian's MacBook Air/KerriOS/brain/wiki/workflows/draft-learnings.md` — accumulated draft lessons

**Prompt:** Lives at `agent-prompts/kerri-inbox-sweep/SKILL.md`. Approval channel is Google Tasks (Hardware FYI / Standard & Works / Kerri MG lists). Checkbox = send (auto-detects edits); ACTION line in notes for skip/redo. Kerri's build/workflow suggestions land in the Kerri MG list with a `💡 SUGGESTION:` prefix (max 1/run, dedup'd against existing open suggestions).

**Self-grading:** Every sweep writes a compact quality score covering mailbox coverage, dedup/state, context quality, draft quality, approval safety, and brain write-back. Daily and weekly grade passes turn repeated misses into draft learnings, workflow updates, or Kerri MG improvement tasks.

## 3. End-of-Day Review

**When:** 6:30pm ET, M–F (`30 18 * * 1-5`)
**Canonical prompt:** `agent-prompts/kerri-eod-meetings-review/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** calendar-first meeting ledger + Granola evidence -> meeting/entity memory -> existing email-chain lookup for every client follow-up -> follow-up Google Tasks plus matching `data/jobs.json` routing metadata for every proposed draft -> missing-recording/manual-recap Tasks -> Sendblue heads-up when Brian attention is needed -> state/grade write-back -> auto-archive the automation chat.

## 3b. Brain Push / Knowledge Hygiene

**When:** 10pm ET daily (`0 22 * * *`)
**Canonical prompt:** `agent-prompts/kerri-brain-push/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** detect eligible brain/prompt changes -> validate safety/tests -> commit/push -> log -> hygiene grade -> Sendblue heads-up only on failure -> auto-archive the automation chat.

## 3c. Gap Sweep / Whole-System Health

**When:** 9:41pm ET daily (`41 21 * * *`)
**Canonical prompt:** `agent-prompts/kerri-gap-sweep/SKILL.md`
**Model:** GPT-5.5 high
**Loop:** repo/docs/scripts/shims + live operating state -> gap list -> auto-fix only mechanical drift, PR material changes, task human decisions -> health ledger + log -> structural improvements. The Codex re-entry prompt explicitly checks both `/Users/brianderario/.codex/automations/*/automation.toml` and `/Users/brianderario/.claude/scheduled-tasks/*/SKILL.md` for runner drift.

## 3d. Revenue Research + Drafting

**Lead research:** 6:13pm ET, M-F (`13 18 * * 1-5`), `agent-prompts/kerri-lead-research/SKILL.md`, GPT-5.5 high. Researches and enriches Hardware FYI sponsor prospects, dedups against KerriOS/CRM/recent outreach, writes `data/leads-master.json` and research batches, mirrors to CRM/CSV fallback where available, and tops up `data/cold-outreach-queue.json`. It never drafts or sends.

**Cold outreach:** 9:07am ET, M-F (`7 9 * * 1-5`), `agent-prompts/kerri-cold-outreach/SKILL.md`, GPT-5.5 high. Converts queued prospects into one daily Hardware FYI approval task. It never sends; the inbox sweep sends later only after Brian approves the task.

**Superseded path:** `hwfyi-weekday-outreach` remains paused. Do not run the old one-step outreach automation in parallel with the lead-research -> cold-outreach -> inbox-sweep approval path.

## 4. Weekly What Got Done (prompt only)

**When:** Fri 4pm ET (`0 16 * * 5`)

**Prompt:**
```
You are Kerri. Weekly "what got done" report.

1. Pull the week's brain updates: deals moved, decisions made, newsletters published, sponsors closed.
2. Pull the week's pipeline deltas from brain/wiki/deals/.
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
2. Cross-reference with brain/wiki/companies/ to avoid duplicates.
3. Add new prospects to brain/candidates/prospects-{month}.md.
4. Send Brian a Slack DM with the top 10 net-new prospects + one-line rationale each.
```

## 7. Supporting skills, not scheduled routines

These prompts can be invoked by Brian or by another approved workflow, but they are not recurring automations:

- `agent-prompts/send-partner-contract/SKILL.md` — partner/SOW contract packet prep. Finance, legal, payment, signature authority, and external sends stay approval-gated.
- `agent-prompts/kerri-event-logistics/SKILL.md` — on-demand venue/vendor/event logistics support.
- `agent-prompts/kerri-pipeline-followup/SKILL.md` — on-demand deal follow-up drafting and state checks.

## Notes

- **Inbox Sweep (#2) = ACTIVE in Codex.** One active runner, `kerri-inbox-sweep`, runs every 15 minutes on GPT-5.5 high. Canonical prompt: `agent-prompts/kerri-inbox-sweep/SKILL.md`.
- **First parallel bundle = ACTIVE in Codex.** `kerri-eod-meetings-review`, `kerri-morning-brief`, and `kerri-brain-push` are rebuilt together on GPT-5.5 high.
- **Monitor = ACTIVE in Codex.** `kerri-gap-sweep` runs daily at 9:41pm ET and checks Codex automation records plus Claude shims for runner drift.
- **Morning recovery = ACTIVE in Codex.** `kerri-morning-brief-retry` runs weekdays at 7:18am ET and self-suppresses unless the primary brief is missing/crashed.
- **Revenue agents = ACTIVE in Codex.** `kerri-lead-research` (`13 18 * * 1-5`, weekday ~6:13pm ET) and `kerri-cold-outreach` (`7 9 * * 1-5`, weekday ~9:07am ET) are now Codex automations. Approval gates unchanged — cold outreach drafts only and never auto-sends; lead research only researches + tops up the pool. `hwfyi-weekday-outreach` is paused/superseded. `kerri-pipeline-followup` remains on-demand until its volume justifies a schedule.
- **All drafts route to Brian first.** No outbound to third parties without per-thread approval (see [[email.md]]).
- **Material brain writes go through approval gates.** See [[brain.md]] mutation rules.
