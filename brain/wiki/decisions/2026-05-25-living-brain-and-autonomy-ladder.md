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

## Related

- [[2026-05-25-codex-primary-operating-layer]]
- [[2026-05-24-brain-architecture]]
- [[agent-brain-protocol]]
- [[source-of-truth]]
