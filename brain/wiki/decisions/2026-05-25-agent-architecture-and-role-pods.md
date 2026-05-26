# Decision: Agent Architecture And Role Pods

scope: decision · updated: 2026-05-25 · author: Brian + Codex

## Decision

KerriOS is the central operating brain for Kerri Media Group. Team agents are not separate brains. They are role-specific interfaces and workers that interact with the world, use KerriOS context, propose or execute approved actions, and write useful learning back into the brain.

This decision distills Brian's 3-page agent architecture PDF from 2026-05-25.

Raw evidence: [[../../raw/2026-05-25-agent-architecture-pdf]]

## Core loop

Every agent follows the same loop:

1. **Perceive:** receive or inspect a real interaction from email, Slack, text, meeting notes, tasks, CRM, docs, or browser work.
2. **Contextualize:** combine the live interaction with KerriOS brain context and that agent's role/personality.
3. **Propose action:** draft the email, suggest the CRM update, create the task, recommend the follow-up, or produce the content.
4. **Execute only inside gates:** external sends, commitments, money, legal, pricing, and sensitive data still require approval unless Brian explicitly promotes the autonomy level.
5. **Record:** write the useful interaction data back into KerriOS: company/contact facts, action taken, Brian edits, final decision, open loop, or process improvement.
6. **Improve:** when repeated friction appears, update the workflow or agent prompt rather than relying on memory.

Short form: perceive -> propose -> approve/act -> record -> improve.

## Role pods

### Brian / Kerri pod

Owner: [[../people/brian-derario]]

Purpose: CEO operating layer, chief-of-staff brain, sales, strategy, growth, and company direction.

Agents and automations:

- [[../agents/kerri]] - chief of staff, company-brain operator, Brian assistant
- Digital newsletter sales agent - sponsorship and newsletter revenue workflows
- Event sales agent - event sponsor sales and follow-up
- Inbound sales agent - triage inbound sponsor/customer interest
- Outbound sales agent - target discovery, outreach drafting, and follow-up
- Pipeline follow-up - active deal nudges and stale-loop detection

### Benji / CDO pod

Owner: [[../people/benji-chia]]

Purpose: content, digital growth, newsletter/content marketing, copywriting, social, technical writing, and editorial QA.

Planned agents:

- Primary copywriting/email assistant
- Social-focused copywriting agent
- Technical newsletter writing agent
- Editor agent

These agents should use KerriOS for context and learning, but should keep their outputs scoped to Benji's content/growth domain unless Brian explicitly routes them into sales or finance workflows.

### Ari / CFO pod

Owner: [[../people/ari-lewis]]

Purpose: accounting, finance, legal coordination, vendor/contract diligence, and M&A support.

Planned agents:

- Primary CFO agent
- Accounting agent
- M&A agent
- Legal agent

Ari-pod agents should be stricter than sales/content agents. Finance, legal, tax, payment, contract, cap table, bank, and acquisition decisions require explicit human approval until Brian creates a separate autonomy rule.

## Standard & Works placement

Standard & Works is intentionally not an internal KMG pod in Brian's PDF. It is contract/partnership work with Zach, and the [[../companies/standard-and-works]] boundary still applies.

However, KerriOS should keep a dedicated automation around writing the Standard & Works newsletter because Brian/Kerri are responsible for producing the work. The existing S&W chain remains active:

- `kerri-sw-newsletter-writer`
- `kerri-sw-newsletter-editor`
- `kerri-sw-newsletter-marketing`

The correct mental model is: Standard & Works is not part of the internal org chart, but the S&W newsletter is an active Kerri production workflow with its own boundary and approval rules.

## What gets written back

Agents should write back only durable, useful operating memory:

- company and contact facts
- conversation summaries and thread state
- tasks created, sent, completed, skipped, or redone
- Brian edits that reveal a reusable rule
- pricing, packaging, or positioning decisions after approval
- event/vendor/deal status changes
- content decisions and source notes
- repeated process misses and their fix

Agents should not write raw private thread dumps, confidential partner internals, or noisy chat logs into the shared brain.

## Design implications for automations

The next automation rebuild should be organized by role pod and operating loop, not by old Claude schedule names.

Priority rebuild order:

1. Brian/Kerri assistant loop: inbox sweep, Google Tasks approval, send-after-approval, brain write-back.
2. Sales loop: inbound sales triage, outbound sales, pipeline follow-up, lead research.
3. Standard & Works newsletter loop: writer, editor, marketing, source intake, published-issue logging.
4. Meeting/context loop: calendar + Granola + follow-up tasks + brain recaps.
5. Benji pod content agents.
6. Ari pod finance/legal/M&A agents, only after approval gates are designed.

## Related

- [[2026-05-25-living-brain-and-autonomy-ladder]]
- [[2026-05-25-codex-primary-operating-layer]]
- [[2026-05-24-brain-architecture]]
- [[2026-05-24-sw-newsletter-chain-launch]]
- [[../agents/registry]]
- [[../workflows/agent-brain-protocol]]
- [[../workflows/multi-agent-write-rules]]
