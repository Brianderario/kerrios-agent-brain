# Kerri Automations — Codex Primary

These are scheduled routines Kerri runs through Codex. Old Claude and legacy Codex business schedules were removed on 2026-05-25. Rebuild each routine from the KerriOS living-brain model, not from old schedule names.

## Universal rule: Customer ID Protocol applies to every automation here

**EVERY** routine on this page that touches companies, leads, drafts, vendors, or brain entries runs [[../../../brain/wiki/workflows/customer-id-protocol]] BEFORE assigning any jobId or creating a `brain/wiki/companies/<slug>.md` page. Per-customer (not per-sweep): a company keeps the same jobId forever, across every thread, every draft, every meeting, every cold email, every event vendor inquiry. The H/S/G counter only bumps when a brand-new company enters `data/companies.json`. The lookup doubles as a QA gate. Brian stated 2026-05-24: "this should be reflected in all automations and in memory. Anytime there's a sweep of info and something to log, this is the process."

## Activation pattern

To activate a routine, create a Codex automation pointed at this repo and the canonical `agent-prompts/<agent>/SKILL.md`. Each routine writes back to KerriOS brain when material things happen.

**Loop requirement:** whenever Kerri schedules a task, builds an automation, rewrites an automation, or creates a recurring runner, the prompt must explicitly include the KerriOS loop from [[../../../brain/wiki/decisions/2026-05-25-agent-architecture-and-role-pods]]: perceive -> propose -> approve/act -> record -> improve. If the routine creates drafts, tasks, sends, CRM/source-of-truth updates, or deal/content state, it must say exactly what gets written back into KerriOS and where. No automation is complete if it only does the action and does not define the memory write-back.

## 1. Morning Briefing

**When:** 7am ET, M–F (`0 7 * * 1-5`)
**Where it lands:** Slack DM to Brian (until iMessage bridge is built)

**Prompt:**
```
You are Kerri. It's morning briefing time.

1. Read Brian's calendar for today (Reclaim.ai MCP + Google Calendar).
2. Sweep overnight inbox deltas in brian@kerrihq.com and brian@hardwarefyi.com.
3. Check KerriOS brain (brain/wiki/decisions/, brain/wiki/deals/, brain/candidates/) for any unresolved asks owned by Brian.
4. Compile a Slack DM to Brian with:
   - Today's calendar (compact, time + counterparty + ask)
   - Overnight inbox highlights (top 3-5 needing his attention, with one-line context)
   - Unresolved asks from yesterday/this week
   - Top-of-day priorities (max 3)
5. Send the DM to Brian.

Tone: terse, peer. Lead with the asks, not the throat-clearing.
```

## 2. 10-Minute Inbox Sweep (Primary Automation)

**When:** Every 10 minutes via six active Codex hourly shards (`kerri-inbox-sweep`, `kerri-inbox-sweep-10`, `-20`, `-30`, `-40`, `-50`). The prompt self-silences when there is nothing to do.
**Mailboxes:** kerri@hardwarefyi.com and brian@hardwarefyi.com (custom Hardware FYI email MCPs), brian@kerrihq.com (Gmail MCP, draft-only), brian@standardandworks.com (Superhuman MCP).
**Approval channel:** Google Tasks — three lists Brian created (Hardware FYI / Standard & Works / Kerri MG). Each job becomes a task; checkbox = send; ACTION line in notes for skip/redo. Full flow lives at `agent-prompts/kerri-inbox-sweep/SKILL.md` — that file is the source of truth.
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

**Prompt:**
```
You are Kerri. End-of-day review.

1. Pull today's Granola meeting transcripts.
2. For each meeting:
   - Extract entities (companies, people, deals).
   - Update brain/wiki/people/{slug}.md and brain/wiki/companies/{slug}.md with new facts (terse, source-linked).
   - Draft per-meeting recap + follow-up email drafts (save to brain/candidates/, do NOT send).
3. Compile a Slack DM to Brian:
   - Meetings recap (one line each)
   - Follow-ups drafted (with links to candidate drafts for review)
   - Anything that moved the deal pipeline
4. Send the DM.

Tone: terse. Lead with the asks. Match Brian's voice in any draft follow-ups.
```

## 4. Weekly What Got Done

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

## 5. Daily Industry Brief

**When:** TBD with Brian (suggested 6am ET, M–F)

**Prompt:**
```
You are Kerri. Daily industry brief for hardware / industrial base / advanced manufacturing.

1. Scan public sources (curated RSS, Apollo enrichments, industry news search).
2. Filter for relevance to Hardware FYI (semiconductors, robotics, EVs, energy, defense, manufacturing) and S&W (industrial policy, capex, infrastructure).
3. Compile 5-7 bullets: news + why it matters + potential angle for The Analog / Weekend Wire / S&W newsletter.
4. Send to Brian and (when activated) Benji via Slack.

Tone: factual, bulleted, with a clear "why it matters" line per item.
```

## 6. Monthly Partnership Research

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

## Notes

- **Inbox Sweep (#2) = ACTIVE in Codex as the first rebuilt automation.** Six active hourly shards create the 10-minute cadence. Canonical prompt: `agent-prompts/kerri-inbox-sweep/SKILL.md`.
- **All others = not yet scheduled in the rebuilt Codex layer.** Brian explicitly said "build-for-self-then-team" — activate remaining routines once the sweep is proven out.
- **All drafts route to Brian first.** No outbound to third parties without per-thread approval (see [[email.md]]).
- **Material brain writes go through approval gates.** See [[brain.md]] mutation rules.
