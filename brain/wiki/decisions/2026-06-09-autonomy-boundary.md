# 2026-06-09 — Autonomy boundary: class-based auto-vs-ask split approved

**Decided by:** Brian (interactive session, 2026-06-09 evening).
**Proposal:** `brain/candidates/2026-06-09-autonomy-boundary-proposal.md` (now decided; kept as the full tier table).
**Context:** Brian's stated end state is Kerri as a fully autonomous worker across KMG and sub-brands, escalating only genuine judgment calls. Autonomy grows by Brian handing Kerri categories, never by Kerri self-promoting.

## What Brian approved

1. **`internal-recipient-reply` → AUTO-LOGGED.** Replies where every recipient is internal/trusted (brian@, ari@, benji@, zach@) send without per-thread approval, with an immediate notification to Brian after each send. All other actionClasses keep their current ASK gate.
2. **The graduation ramp** ("definitely agreed on earning it"): a class moves ASK → AUTO-LOGGED only when (a) ≥20 approvals in class AND Brian edit rate ≤10% AND zero double-email incidents, and (b) Brian explicitly flips it. Demotion back to ASK is automatic on any double-email, any Brian "that was wrong," or edit rate regression.
3. **Stale-approval escalation:** items waiting 7+ days are ESCALATED — red banner at top of the morning brief Approval Queue + a line in the morning text, priced or not. Shipped same session: `scripts/approval-queue-digest.mjs` (`escalated` flag, `escalateAgeDays: 7`, `totals.escalated`, 🔴 escalation line) + morning-brief SKILL consumption rules. Tests 225/225, check exit 0.

## Amendment 2026-06-10 — internal-only S-prefix auto-sends

**Decided by:** Brian (interactive, 2026-06-10). Corrects the original "S-prefix never auto-sends" condition, which was too broad.

The S/W boundary is about not pulling S/W internal **content** into Kerri's brain and not sending to **external** parties. A reply whose recipients are all trusted-internal (Brian and/or Zach, both already in `trustedInternal`) is internal S/W coordination, not a boundary crossing. So:

- `internal-recipient-reply` now auto-sends an **S-prefix** reply **when INTERNAL-ONLY** — every To+Cc recipient is in `trustedInternal` and no external party is on the thread. It sends via Superhuman from **brian@standardandworks.com** (no HWFYI auto-CC; Brian's notification is native to his S/W mailbox + the morning-brief Auto-logged section).
- **Still gated (unchanged):** any S-prefix reply with an external recipient, and anything touching S/W pricing / commercial terms / content drafts / legal / finance (the `neverAuto` substance gate applies regardless of recipients). Brain writes stay boundary-safe: body scrubbed from `jobs.json`, minimal queue marker only.
- **Net:** Benji, Ari, and Zach all auto-answer on internal-only threads. Enforced in `data/autonomy-policy.json` (conditions) + the AUTO-LOGGED SEND PATH and INTERNAL TEAMMATE DIRECT REQUEST branch in `agent-prompts/kerri-inbox-sweep/SKILL.md`.

## What stays gated (unchanged)

`sponsor-substantive-reply`, `renewal-draft`, `cold-send` (batch gate), and all permanent NEVER-AUTO gates: CRM mutations, pricing, legal/contracts, finance/spend, permissions, identity, S/W boundary.

## Enforcement status

- Escalation (item 3): **LIVE** (merged to main this session).
- AUTO-LOGGED for `internal-recipient-reply` (item 1) + the ramp metrics (item 2): **enforced via the Wave 3 PR** — `data/autonomy-policy.json` (tracked, Brian-edited tiers only) + the AUTO-LOGGED SEND PATH in `agent-prompts/kerri-inbox-sweep/SKILL.md` + `scripts/autonomy-report.mjs` (`--ramp` graduation report, `--auto-logged` send list) + tests.
- Notification channel for AUTO-LOGGED sends: **DECIDED 2026-06-09 ("Perfect. Go with your recommendation.")** — morning-brief Auto-Logged Sends section + the standard auto-CC to brian@hardwarefyi.com on every kerri@ send. Never texts (texts are the interrupt lane). See `brain/wiki/decisions/2026-06-09-kerri-brian-comms.md` for the full channel architecture.
