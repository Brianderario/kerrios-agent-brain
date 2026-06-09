# 2026-06-09 — Autonomy boundary: class-based auto-vs-ask split approved

**Decided by:** Brian (interactive session, 2026-06-09 evening).
**Proposal:** `brain/candidates/2026-06-09-autonomy-boundary-proposal.md` (now decided; kept as the full tier table).
**Context:** Brian's stated end state is Kerri as a fully autonomous worker across KMG and sub-brands, escalating only genuine judgment calls. Autonomy grows by Brian handing Kerri categories, never by Kerri self-promoting.

## What Brian approved

1. **`internal-recipient-reply` → AUTO-LOGGED.** Replies where every recipient is internal/trusted (brian@, ari@, benji@, zach@) send without per-thread approval, with an immediate notification to Brian after each send. All other actionClasses keep their current ASK gate.
2. **The graduation ramp** ("definitely agreed on earning it"): a class moves ASK → AUTO-LOGGED only when (a) ≥20 approvals in class AND Brian edit rate ≤10% AND zero double-email incidents, and (b) Brian explicitly flips it. Demotion back to ASK is automatic on any double-email, any Brian "that was wrong," or edit rate regression.
3. **Stale-approval escalation:** items waiting 7+ days are ESCALATED — red banner at top of the morning brief Approval Queue + a line in the morning text, priced or not. Shipped same session: `scripts/approval-queue-digest.mjs` (`escalated` flag, `escalateAgeDays: 7`, `totals.escalated`, 🔴 escalation line) + morning-brief SKILL consumption rules. Tests 225/225, check exit 0.

## What stays gated (unchanged)

`sponsor-substantive-reply`, `renewal-draft`, `cold-send` (batch gate), and all permanent NEVER-AUTO gates: CRM mutations, pricing, legal/contracts, finance/spend, permissions, identity, S/W boundary.

## Enforcement status

- Escalation (item 3): **LIVE** (merged to main this session).
- AUTO-LOGGED for `internal-recipient-reply` (item 1) + the ramp metrics (item 2): **approved, not yet enforced** — the inbox-sweep prompt change is send-authority-affecting, so it lands via the Wave 3 PR (`autonomy-policy.json` + sweep prompt edit + tests). Until that PR merges, internal replies still route through Google Tasks.
- Notification channel for AUTO-LOGGED sends: pending Brian's channel decision (Slack disliked — sends appear from Brian himself with no notification; candidates are internal email from kerri@ and/or the existing Sendblue text rail).
