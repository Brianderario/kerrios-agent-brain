---
name: kerri-event-logistics
description: Research venues or vendors, prepare inquiries, and maintain event status or run-of-show plans for a named KMG event.
---

# Event logistics

Resolve the named event and reuse its existing records and task folder. Read the owning brand's instructions and the current KMG playbook. This workflow handles tactical logistics; it does not authorize new commercial terms or external sends.

## Choose the requested mode

| Request | Guidance |
|---|---|
| Scope a new event (INIT) | [Planning](references/planning.md#scope) |
| Find venues (VENUE) or vendors (VENDOR) | [Research](references/research.md) |
| Prepare an inquiry (INQUIRY) | [Inquiry](references/inquiry.md) |
| Draft a run of show (ROS) | [Planning](references/planning.md#run-of-show) |
| Check status (STATUS) | Summarize existing event records and current inquiry receipts; do not restart research. Report dates/location, venue, vendors, open inquiries and unresolved decisions with their evidence dates. |

Use the request and existing records to choose the mode. Ask only for a material missing constraint; a missing local state file does not require a new-event questionnaire when the scope is already known.

## Shared boundaries and state

- Draft inquiries in Savant for Brian's approval. Never send automatically, sign contracts, pay vendors, or commit to dates, headcounts, prices or terms without approval. Treat unconfirmed scope as a proposal.
- Check the existing company by domain, alias and name before assigning a customer/job ID or registering a venue/vendor. Reuse its ID across events. A local company snapshot is read-only fallback; authoritative lookup failure holds new registration.
- Savant owns current company/event knowledge, CRM and approval receipts. Reconcile provider proof before reporting an inquiry sent. Do not create or update archived `brain/wiki/events/` pages.
- Keep working research and run-of-show files in the owning event's existing task folder. Preserve any existing KMG-only `data/events/<slug>/state.json` and its callers; do not move, reset or reinterpret it as send authority. No-op/status requests need not create a state file.
- Standard & Works internal operations and drafts stay in its owning workspace, never KMG brain or local KMG event state. Use its approved identity/transport for S&W-side work; joint events do not erase this boundary.
- Record compact, source-backed changes only for meaningful decisions/actions. Do not create CRM entries for every search result or write raw research dumps to the brain. Use the repository log helper only when a local activity entry is needed.
