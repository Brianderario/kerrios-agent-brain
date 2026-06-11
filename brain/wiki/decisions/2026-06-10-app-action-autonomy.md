# 2026-06-10 — App & service action autonomy: act-and-report for non-send actions

**Decided by:** Brian (interactive session, 2026-06-10 night). Selected "Raise act-authority (bounded)" when asked how to make future email-triggered app/long-running tasks hands-off, without him having to intervene and ask whether Kerri is going to do it.

**Context:** The S&W beehiiv signup-flow task (same evening) exposed the gap. The change arrived as an email request, Kerri's inbox sweep handled the email coordination, but the actual work needed the beehiiv dashboard — and the headless sweep has no browser. It only got done because Brian opened an interactive session with Chrome connected and pushed Kerri through each step. Two things were missing: **capability** (the unattended runner could not reach the app) and **authority** (Kerri is approval-first, so it kept asking "should I do this?"). This decision fixes the authority half. See `NOW.md` S&W beehiiv entry + `brain/log.md` 2026-06-10 ~20:12.

## The two levers (mental model)

Autonomous "go into an app from email" requires both to be true:

1. **Capability** — the runner can reach the app. Priority order: (a) a connected MCP/API connector (headless-safe, the real answer — like Mercury/Stripe/email/DocuSign); (b) a live browser in an interactive session (claude-in-chrome); (c) native desktop/computer-use cannot run unattended (needs interactive per-app grants). Beehiiv has a public API; a beehiiv connector was offered and **not** greenlit this round (Brian chose authority-only for now).
2. **Authority** — Kerri is allowed to act without pre-asking, within a bounded envelope. This decision.

## What Brian approved — the `actions` block

A new dimension in `data/autonomy-policy.json`. The existing tiers/classes govern outbound **email**; `actions` governs **non-send actions** (operating connected apps/services, in-tool changes). Three tiers:

- **act-and-report** — execute now, no pre-ask, **verify the result**, then log (brain/log.md + NOW.md + morning-brief Auto-logged). For **reversible** settings/config changes in a connected tool (feature on/off, list/recommendation membership, automation enable/disable), **internal coordination/housekeeping** (scheduling, teammate invites, status, Kerri's own records), and source-backed Hardware FYI pipeline stage bookkeeping. Read/diagnostic actions always qualify.
- **draft-and-confirm** — show Brian the exact change first, like an email draft. For **customer/partner-facing content or copy** (welcome emails, public posts, newsletter body, website copy) and anything externally visible that is not a pure reversible toggle.
- **gate** — approval-first, never auto. Inherits `neverAuto`.

This mirrors how the beehiiv task actually went well: turning recommendations off (reversible config) would be act-and-report; editing the welcome-email copy (partner-facing content) was draft-and-confirm — Brian saw the exact wording first; replying to Zach (external send) stayed approval-first.

## Hard gates (unchanged, enforced everywhere)

`neverAuto`, now including irreversible/destructive actions: material CRM judgment calls; pricing/packages/tiers; legal/contracts/signatures; finance/any spend (refunds or COGS > $2,500); permission/access-control/identity changes; **irreversible or destructive actions (hard deletes, purges, anything with no one-step undo)**; anything crossing the S/W boundary as commercial/content/legal/finance substance. External email sends keep their existing approval gate. Source-backed Hardware FYI pipeline stage bookkeeping is the explicit exception: if an approved send, buyer reply, booked meeting, proposal/package/pricing send, contract event, or explicit decline clearly proves the stage move, Kerri updates the Console deal automatically and logs the evidence.

## Escalate-on-block (the safety net)

When a task is blocked on missing access or a capability the current runner lacks, Kerri does **not** silently park it. It emails Brian a 4-part request: (1) the task, (2) who it is for, (3) the exact access/session needed, (4) what it unblocks — and keeps the parked task tied to that escalation so it cannot go stale. In an interactive session the block is often removable directly (live browser via claude-in-chrome) — do it instead of emailing. Memory: `feedback_escalate_on_block`.

## Long-running tasks

The durable-state layer already exists (`NOW.md` baton + `data/jobs.json`), so a task survives across the 15-minute sweep runs. What makes a long task hands-off: persisted job + resumable steps + a **wake trigger** (a scheduled re-check, or a webhook/notification) so it resumes when the blocking state changes, with escalate-on-block as the backstop. The wake-trigger mechanics are not built in this decision; flagged as follow-up.

## Boundaries on Kerri's own authority (important)

- Kerri **never promotes its own tiers**. This `actions` block was authored at Brian's explicit instruction and lands via reviewed PR, not a silent push. Demotion (tightening) is always allowed; loosening is Brian-only.
- `data/autonomy-policy.json` and the agent-prompt SKILL files are send-authority files — excluded from the Stop-hook auto-commit; they land on `main` only via an explicit reviewed commit or PR.

## Enforcement

- `data/autonomy-policy.json` — `actions` block (tiers, act-and-report / draft-and-confirm / gate scopes + conditions, escalateOnBlock), `neverAuto` adds irreversible/destructive, `version` → 2, `decisionActions` pointer.
- `agent-prompts/kerri-skill/SKILL.md` — Operating-rules pointer to the actions policy.
- Memory: `feedback_escalate_on_block`.

## Follow-ups (not in this change)

- Beehiiv connector (MCP) — offered, deferred by Brian. Would move newsletter-ops fully headless.
- Headless-browser-with-stored-sessions path for apps without an API — bigger, more fragile (UI/2FA/session upkeep, credentials at rest); deferred.
- Long-running wake-trigger mechanics.
