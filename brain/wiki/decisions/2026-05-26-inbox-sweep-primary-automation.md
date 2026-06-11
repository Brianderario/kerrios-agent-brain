# Decision: Inbox Sweep Primary Automation

scope: decision · updated: 2026-05-26 · author: Brian + Codex

## Decision

The inbox sweep is the first rebuilt Codex automation and the primary world-intake loop for KerriOS.

It scans Brian/Kerri email surfaces, routes new human mail to the right company/job record, enriches only as much context as the thread requires, reads the full thread before drafting, creates Google Tasks for Brian approval, sends only after approval, records compact durable memory back into KerriOS, and self-grades its own performance.

When it creates a new Google Task, it sends Brian a very brief Sendblue/text heads-up through the configured text path. This alert is one-way and independent of iMessage Handoff. If the sweep creates no new task, it sends no text.

Canonical prompt: [[../../../agent-prompts/kerri-inbox-sweep/SKILL.md]]

Live Codex automation record:

- `kerri-inbox-sweep`

Cadence: every 15 minutes. Model: GPT-5.5 high. The first action is an atomic local lock (`scripts/inbox-sweep-lock.mjs acquire --ttl-minutes 30 --runner codex`); overlapping runs exit silently before loading context. The lock records its runner type. Codex locks recover through the 30-minute TTL crash fuse, while the local reaper only fast-releases Claude fallback locks it can prove have no live scheduled inbox-sweep session.

## Mailboxes

- `kerri@hardwarefyi.com` via custom Hardware FYI email MCP
- `brian@hardwarefyi.com` via custom Hardware FYI email MCP
- `info@hardwarefyi.com` via custom Hardware FYI email MCP (`info-hardwarefyi-email`), added 2026-06-10 — outreach + inbound, handled autonomously per [[2026-06-10-info-mailbox-autonomous]]
- `brian@kerrihq.com` via Gmail, draft-only by default
- `brian@standardandworks.com` via Superhuman, with S/W boundary rules

## Approval Surface

Google Tasks remains the approval rail:

- Hardware FYI list for `H####`
- Standard & Works list for `S####`
- Kerri MG list for `G####` and `💡 SUGGESTION:` improvements

Checkbox means approved to send, subject to the sender/boundary rules in the sweep prompt. Task edits become draft edits and training signals.

## Context Strategy

The sweep uses progressive enrichment to avoid both shallow replies and context bloat.

- `none`: known company, current wiki/deal state is enough.
- `light`: default for real human inbound; captures identity, company, mailbox, jobId, why it matters, and source pointers.
- `deep`: triggered by sponsor/customer/prospect signals, pricing/packages/contracts/legal/finance/events/invoices/commitments, active deals, high-value companies, named owner asks, attachments/proposals/meetings/decisions, or any case where Kerri cannot draft safely without more context.

Raw evidence remains pointer-based. Durable writes are compact: company/contact facts, thread state, deal state, Brian edits, approvals, sent/skipped/redone actions, and process improvements.

## Grading

The automation grades itself every run on:

- coverage
- dedup/state
- context quality
- draft quality
- approval safety
- brain write-back

It also runs daily and weekly reviews. Daily review turns the top repeated misses into a Kerri MG improvement task or safe workflow learning. Weekly review promotes repeated Brian edits into draft learnings and flags MCP/workflow gaps.

## Boundaries

- Brian remains approval authority for external sends and material commitments.
- Gmail/Kerri HQ threads are draft-only unless Brian explicitly routes the send through Kerri.
- S/W internal content is not copied into the shared brain.
- No raw emails or private thread dumps enter the repo.
- Failed Google Tasks read means fail closed: no sends.

## Related

- [[2026-05-25-living-brain-and-autonomy-ladder]]
- [[2026-05-25-agent-architecture-and-role-pods]]
- [[2026-05-24-google-tasks-approval]]
- [[../workflows/customer-id-protocol]]
- [[../workflows/draft-learnings]]
