# Decision: KerriOS Living Brain And Autonomy Ladder

scope: decision · updated: 2026-05-25 · author: Brian + Codex

## Decision

KerriOS is the constant living brain of the company. Every meaningful interaction with the world should feed back into KerriOS so Kerri's understanding improves over time.

The long-term bet is that Kerri's decision quality rises as the brain accumulates more context from email, Slack, Codex conversations, meetings, documents, and operational work. Humans remain the gatherers, operators, and approvers while Kerri becomes the primary director of company context and next actions.

## Operating model

- **KerriOS is canonical.** Runner chat, Claude memory, Slack threads, email threads, and meeting notes are evidence until compacted into KerriOS.
- **Every surface should feed the brain.** Email, Slack, iMessage/Codex, meetings, Drive docs, customer conversations, sales work, and team edits should create either wiki truth, candidate notes, raw evidence pointers, or compact log entries.
- **Humans are the data gatherer / execution layer.** Brian, Ari, Benji, Zach, and external counterparties expose reality through their work. Kerri turns that into structured memory, recommended action, and eventually decisions.
- **Kerri is expected to improve.** The current system is the least-informed version it will be. The architecture assumes future Kerri has better judgment because it has more complete company context.
- **No dead schedules.** Old Claude and old Codex scheduled tasks were removed on 2026-05-25. New automations should be rebuilt from scratch against this KerriOS model.

## Autonomy ladder

1. **Personal assistant first.** Kerri needs Brian approval for every external email send and every material commitment.
2. **Autonomous email later.** After repeated evidence that Kerri drafts, routes, and sends better than Brian would manually, Brian may grant narrower email autonomy.
3. **Full decision authority last.** Only after Brian trusts Kerri's judgment as consistently better and more informed than his own does final decision-making move to Kerri.

Brian remains the CEO and final decision maker until he explicitly promotes Kerri to the next autonomy level.

## Current gates

- External email sends still require Brian approval.
- Commitments, pricing, legal, finance, identity, permissions, purchases, deletes, and CRM/source-of-truth mutations still require the applicable approval path.
- Google Tasks and the custom Hardware FYI email MCPs are crucial to the working flow and must be fixed/wired before rebuilding the automation set.

## Automation rebuild principle

Do not port the old schedules one-for-one. Rebuild around the exact flow that now works:

- perceive from live tools and human messages
- propose concrete actions or drafts
- route approvals through the chosen approval surface
- record compact durable memory into KerriOS
- improve the workflow when repeated misses appear

## Implementation (2026-06-09)

Wave 3 of the operations-hardening program makes the autonomy ladder concrete. The ladder is now a measured, fail-closed, git-tracked system. No new authority was granted in this wave; it only builds the infrastructure so Brian can grant autonomy later when the evidence warrants it.

### Measurement infrastructure (Wave 0, shipped)

Every email draft carries an `actionClass` (one of 8 types: internal-recipient-reply, scheduling-logistics-reply, warm-thread-holding-reply, sponsor-substantive-reply, pipeline-nudge, renewal-draft, cold-send, gmail-draft-only). Both `originalDraft` and `sentDraft` are preserved on every job so the diff between what Kerri wrote and what Brian actually sent is the durable evidence dataset.

### Policy file: `data/autonomy-policy.json`

The fail-closed authority lookup. Git-tracked so every change shows in git history and requires a PR.

- Maps each actionClass to a stage (1 = approval required, 2 = autonomous send with auto-CC + undo window).
- ALL classes start at stage 1. The file is the single source of truth for what Kerri may do without asking.
- Safety invariants: auto-CC brian@ is never disabled (even at stage 2), 4-hour undo window, and fail-closed when the file is missing or a class is not found.

### Promotion criteria

An action class is READY FOR REVIEW when all of:
- 14+ calendar days of send history
- 10+ total sends in that class
- 95%+ unedited rate (Brian sent Kerri's exact draft without changes)
- 0 incidents

Meeting the criteria does not auto-promote. It only surfaces a candidate page.

### Promotion process

1. The `kerri-self-improve` routine (weekly, Sundays 17:00 ET) runs the autonomy scorecard (`scripts/autonomy-scorecard.mjs`) and writes evidence to `brain/wiki/improvements/`.
2. If a class hits READY FOR REVIEW, the routine writes a candidate page to `brain/candidates/` with the evidence summary and a recommended policy change.
3. Brian (or Kerri at Brian's direction) opens a PR that changes `data/autonomy-policy.json` to set that class to stage 2.
4. Brian merges the PR. Merge = promotion. The inbox sweep reads the policy file on every run (STEP 3.5, autonomy policy consultation).
5. The promotion is visible in git history and the decision page.

Kerri may NEVER promote herself. Only removing authority (demotion) is self-applicable.

### Demotion process

- Any incident (wrong send, missed safety gate, identity error, boundary violation) automatically demotes the affected class back to stage 1.
- Kerri may self-demote by opening a PR to lower a stage. She may never self-promote.
- Demotion is immediate and does not require a review period.

### Safety invariants

- Auto-CC brian@hardwarefyi.com on every external send, at every stage, forever. This is a safety net, not a feature to disable.
- 4-hour undo window on autonomous sends (stage 2).
- Fail-closed: if autonomy-policy.json is missing, unreadable, or a class is not found, treat as stage 1 (approval required).
- The inbox sweep's HARD NO-DOUBLE-EMAIL GATE, live-thread re-read, and full job stamping remain mandatory at all stages.

### Scorecard script: `scripts/autonomy-scorecard.mjs`

Read-only evidence compiler. Reads jobs.json + autonomy-policy.json, outputs per-actionClass statistics (totalSent, uneditedRate, editedCount, incidents, daysCovered) and a readiness assessment. Flags: `--json`, `--data-dir`, `--now`, `--root`.

### Self-improve routine: `agent-prompts/kerri-self-improve/SKILL.md`

Weekly (Sundays 17:00 ET). Runs the scorecard, scans for repeated Brian-edit patterns, writes improvement pages to `brain/wiki/improvements/`, and surfaces promotion candidates. 100% read + write-to-brain. No external sends, no policy mutations.

### Inbox-sweep consultation gate: STEP 3.5

Added to `agent-prompts/kerri-inbox-sweep/SKILL.md`. After drafting, before Google Tasks creation, reads autonomy-policy.json and checks the job's actionClass stage. Stage 1 = proceed to approval task (current behavior for all classes). Stage 2 = send without approval task (future, when Brian promotes a class). Missing file or unknown class = fail closed to stage 1.

## Related

- [[2026-05-25-codex-primary-operating-layer]]
- [[2026-05-24-brain-architecture]]
- [[agent-brain-protocol]]
- [[source-of-truth]]
