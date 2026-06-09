# Autonomy boundary proposal — what Kerri handles vs. always escalates

**Status:** DECIDED 2026-06-09 — Brian approved item #1 (internal-recipient-reply → AUTO-LOGGED), the graduation ramp, and stale escalation. See `brain/wiki/decisions/2026-06-09-autonomy-boundary.md`. This file kept as the full tier table.
**Author:** Kerri (interactive, 2026-06-09), at Brian's direction ("push toward autonomy; you handle your own work, escalate when you don't know what to do").
**Decision owner:** Brian.
**Implements:** the Wave 3 `autonomy-policy.json` slot in the Loop Build. Backbone reuses Wave 0's 8-value `actionClass` enum + the `sentDraft`/`decidedAt`/`doubleEmailBlocks` instrumentation already on every job.
**Hard rule preserved:** external sends, CRM, pricing, legal, finance/spend, permissions, identity stay approval-gated unless Brian explicitly promotes a specific class. Kerri never self-promotes.

---

## The four tiers

- **AUTO** — Kerri acts with no approval. Allowed only where there is no external-send and no commercial/financial risk.
- **AUTO-LOGGED** — Kerri acts, but immediately posts a notification (Slack/brief) and the action is fully reversible/auditable. This is the "trained wheels off, but visible" tier — the target state for most low-risk email once a class has earned it.
- **ASK** — current default. Draft to Google Tasks, send only after Brian checks the box.
- **NEVER-AUTO** — permanent hard gate. No amount of track record promotes these; they always require Brian.

---

## Proposed mapping (the decision)

| # | actionClass | Today | Proposed end-state | Recommend now |
|---|---|---|---|---|
| 1 | `internal-recipient-reply` (all recipients internal/trusted, no external send) | ASK | **AUTO-LOGGED** | **Promote now.** Lowest risk — no external recipient exists by definition. |
| 2 | `scheduling-logistics-reply` (calendar/venue/travel, no commercial substance) | ASK | AUTO-LOGGED | Graduate after track record (see ramp). Start ASK. |
| 3 | `warm-thread-holding-reply` (ack / "on it" / status, no new pricing/scope) | ASK | AUTO-LOGGED | Graduate after track record. Start ASK. |
| 4 | `sponsor-substantive-reply` (pricing, packages, proposals, deliverables) | ASK | **ASK (stays)** | Keep gated. Commercial substance = Brian's call. |
| 5 | `pipeline-nudge` (templated follow-up on a quiet thread) | ASK | AUTO-LOGGED | Graduate after track record. Start ASK. |
| 6 | `renewal-draft` (renewal outreach for existing sponsor) | ASK | ASK (stays) | Keep gated — money implications. Revisit later. |
| 7 | `cold-send` (first-touch cold batch) | ASK (batch) | ASK (batch) | Keep the one-checkbox batch gate. Brand + volume risk. |
| 8 | `gmail-draft-only` (brian@kerrihq Gmail; Brian sends manually) | Brian-sends | unchanged | No change — Kerri can't send these anyway. |

**Non-email, for completeness:**

| Category | Tier | Note |
|---|---|---|
| Routine brain writes (wiki/candidate/log, jobs.json, companies.json) | **AUTO** | Already effectively auto; formalize it. |
| Triage: auto-skip newsletters, dedup, unsubscribe suppression, NDR→do-not-contact | **AUTO** | Already auto; formalize it. |
| Suggestion tasks (`💡 SUGGESTION:`) | **AUTO** | Create freely; acting on them still follows the class gates. |
| CRM mutations | **NEVER-AUTO** | Existing gate. |
| Pricing / packages / tiers | **NEVER-AUTO** | Existing gate + package-quote playbook. |
| Legal / contracts / signatures | **NEVER-AUTO** | Existing gate. |
| Finance / any spend; refunds or COGS > $2,500 | **NEVER-AUTO** | Existing gate (+ S/W gates). |
| Permission or identity changes | **NEVER-AUTO** | Existing gate. |
| Anything crossing the S/W boundary | **NEVER-AUTO** | Boundary is absolute. |

---

## The ramp — how a class earns AUTO-LOGGED (data-earned, Brian-confirmed)

A class graduates from ASK → AUTO-LOGGED **only when both** are true:

1. **The data clears the bar** (computed from existing Wave 0 instrumentation):
   - ≥ 20 approvals in that class, AND
   - Brian's edit rate on those drafts ≤ 10% (i.e. he sends Kerri's draft essentially as-written ≥ 90% of the time — measured via `sentDraft` vs `originalDraft` diff), AND
   - zero double-email incidents (`doubleEmailBlocks` clean) in that class.
2. **Brian flips it** in `autonomy-policy.json`. Kerri surfaces "class X has met the bar — promote?" in the morning brief; Brian decides. **Kerri never promotes itself.**

Demotion is automatic: any double-email, any Brian "that was wrong" on an AUTO-LOGGED send, or edit rate rising back above threshold drops the class to ASK and flags it.

---

## What changes operationally if Brian approves item #1 only (recommended first step)

- `internal-recipient-reply` jobs (replies where every recipient is brian@/ari@/benji@/zach@) send automatically, with a Slack note to Brian after each.
- The approval queue Brian sees shrinks by exactly that volume — the highest-safety slice goes away first.
- Everything else is unchanged and still gated.
- We watch it for ~2 weeks, confirm zero surprises, then consider promoting #2/#3/#5 on the same evidence.

## Open questions for Brian

1. Approve promoting **#1 `internal-recipient-reply` to AUTO-LOGGED now?** (recommended)
2. Agree with the **20-approval / ≤10%-edit / zero-double-email** graduation bar, or set different numbers?
3. AUTO-LOGGED notifications — **Slack DM, morning-brief digest, or both?**
4. Confirm `sponsor-substantive-reply`, `renewal-draft`, and `cold-send` **stay gated** for now (recommended).
