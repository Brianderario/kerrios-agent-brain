# Hardware FYI CY2026 Revenue Goal

scope: workflow · updated: 2026-06-07 · owner: Brian / Kerri

Brian's Hardware FYI operating goal for calendar year 2026 is **$1,000,000 of top-line revenue**.

This is a standing priority for every Hardware FYI automation and interactive run. The default question is:

> Does this move revenue, protect revenue, or improve the revenue machine?

## Operating Lens

Classify every Hardware FYI item into one of these buckets:

- **Cash collected:** invoice, payment, SOW, signed contract, renewal, receivable, Stripe/payment reconciliation.
- **Pipeline advanced:** warm follow-up, buyer-goal discovery, proposal, call scheduling, sponsor next step, approval-ready reply.
- **Product value improved:** clearer package, pricing proof, webinar/event/content bundle, lead guarantee, reporting packet, audience proof, renewal evidence.
- **Revenue system improved:** CRM/ad-tracker cleanup, dedupe, sponsor memory, queue health, automation health, source-of-truth routing.

If an item does none of those, it should not displace a revenue action unless it is a safety, legal, finance, event-critical, or Brian-explicit priority.

## System Of Record

The **KMG Console CRM** is the system of record for companies, contacts, and deals. Use the Console API for pipeline writes:

- Companies: `GET /api/v1/companies?domain=<domain>` or `?job_id=<jobId>`
- Deals: `GET /api/v1/deals`, `POST /api/v1/deals`, `PATCH /api/v1/deals/:id`, `PATCH /api/v1/deals/:id/update_stage`
- Helper: `node scripts/console-pipeline-update.mjs --apply --job-id <H####> --status "<Prospect|Interest|Contract Won|Contract Lost>" --source "<thread/task/log pointer>" --evidence "<one-line evidence>"`

The **`CY2026 Revenue Goal`** tab in the canonical Hardware FYI Sheet is now the revenue scoreboard and verification mirror:

- Sheet: https://docs.google.com/spreadsheets/d/1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk/edit
- Tab: `CY2026 Revenue Goal`
- Maintainer helper: `node scripts/hwfyi-revenue-goal-sheet.mjs --ensure|--check|--read`

Use the tab when Brian asks "where are we against the $1M goal?" or when an automation needs current revenue totals. Existing tracker, Console CRM, Stripe, contracts, and thread evidence feed the scoreboard. Do not create a Brian task because the old sheet helper cannot write a row; update the Console deal first, then refresh/check the sheet mirror when available.

If the tab's `Last verified at` / freshness note is stale, say so and refresh from source surfaces before making a current revenue claim.

## Pipeline Stage Taxonomy

Use exactly these Hardware FYI statuses in revenue-facing notes and the sheet mirror:

- **Prospect:** real contact has happened, but no proposal/package/price has been sent yet. Raw uncontacted lead-research rows do not qualify.
- **Interest:** buyer has replied with intent, asked for pricing/audience/details, taken a meeting, received a proposal/package, or has a verbal renewal / active commercial next step.
- **Contract Won:** signed/accepted/booked CY2026 revenue with source evidence from Contract Breakdown, contract, invoice, Stripe, or an explicit acceptance.
- **Contract Lost:** explicit no, paid path declined, organic-only/cross-promo-only response, or Brian/Benji closes the paid opportunity.

Console deal stage mapping:

- `Prospect` -> `lead`
- `Interest` -> `qualified`
- `proposal/package/pricing sent` -> `proposal_sent`
- `contract sent` -> `contract_sent`
- `negotiation` -> `negotiation`
- `Contract Won` -> `closed_won`
- `Contract Lost` -> `closed_lost`

Stage changes require source-backed evidence. Cold outreach only creates a `Prospect` after an approved send actually goes out; lead research alone must not create pipeline rows. Inbox sweep and EOD meetings review must update the Console deal when replies, approved sends, meetings, contracts, or skips provide new stage evidence. Pipeline follow-up can update the Console deal when its own nudges are approved/sent or when it observes a source-backed stale/lost condition, but it must not overwrite live Contract Won/Lost rows without fresh evidence.

Pipeline stage bookkeeping is automatic. Do not ask Brian to approve a clerical stage move when the source evidence is clear. Run `scripts/console-pipeline-update.mjs --apply`, verify the returned deal stage, append a compact `brain/log.md` line, and refresh `data/companies.json` or the sheet mirror when the run touched CRM state. Create a `⚠️ PIPELINE UPDATE NEEDED` discuss task only when the evidence is ambiguous, the Console API is unavailable, the company cannot be matched safely, or the intended change would regress or reopen a terminal deal.

Dollar values require source-backed commercial terms. If Brian/Kerri has touched the company but no pricing/proposal/counter/contract/invoice has been sent or received, keep the company in pipeline as `Prospect` or `Interest` with amount `TBD` / zero ledger value. Do not add estimated pricing from the target list, prior sponsor norms, or "likely close" analysis. The summary `Pipeline Amount` is priced open pipeline only; unpriced real opportunities stay visible but do not count toward the amount.

Keep outreach targets separate in `brain/wiki/workflows/hwfyi-cy2026-gap-close-targets.md`. That page can hold companies Kerri should pursue to close the gap, but it is not pipeline and should not be used for revenue claims.

## Evidence Surfaces

Use live/source-backed surfaces before acting on revenue state:

- `Hardware FYI Advertising Tracker`, especially `Revenue (2024-Present)`, `Ad Calendar`, and `Brian 2026 Pricing Sheet`.
- `Hardware FYI CRM`, especially `Contract List`, `Contract Breakdown`, `Leads`, `Newsletter Ad Calendar`, and `Event, Webinar & Custom Content Schedule`.
- Stripe, invoice, contract, or DocuSign evidence when cash/booking status matters.
- Custom Hardware FYI/Kerri mailbox threads for current buyer intent and sent-history proof.
- Kerri Console approval packets for drafted asks and pending sends.
- `data/leads-master.json`, `data/cold-outreach-queue.json`, `data/cold-outreach-state.json`, and `data/pipeline-followup-state.json` as local operating ledgers, never as a substitute for live CRM/payment truth.

If a run cannot refresh a live source, label the recommendation as not-current and avoid claiming fresh revenue totals.

## Current Automation Mapping

- `kerri-morning-brief`: keeps the goal top of mind with a daily Revenue Focus based on pending tasks, active deals, recent logs, and refreshed tracker data when available.
- `kerri-inbox-sweep`: catches sponsor/customer replies, approval decisions, payment/admin blockers, and approved sends; it must tag Hardware FYI items by revenue bucket and update `Prospect` / `Interest` / `Contract Won` / `Contract Lost` when the source evidence supports a stage change.
- `kerri-eod-meetings-review`: converts sponsor/prospect meetings into source-backed follow-up tasks, deal memory, and central-tab stage changes when the meeting creates or changes a commercial state.
- `kerri-lead-research`: keeps the top of funnel full with ICP-scored sponsor targets tied to likely Hardware FYI products. It does not create central pipeline rows for uncontacted leads.
- `kerri-cold-outreach`: turns the top ready leads into approval-gated, one-to-one outreach drafts; it never sends directly. After inbox-sweep sends an approved cold draft, the company becomes `Prospect` in the Console deal pipeline, then appears in the sheet mirror.
- `kerri-pipeline-followup`: owns warm-deal nudges where Brian/Kerri sent last and the counterparty has gone quiet; it never sends directly. It reads and maintains the same central statuses.
- `kerri-gap-sweep`: checks that the above machinery remains live, deduped, approval-gated, and wired to this goal.
- `kerri-brain-push`: ships eligible prompt/brain improvements so the revenue system keeps learning.

## Product Default

When choosing or drafting a Hardware FYI offer, start from the buyer's goal:

- **Lead generation:** webinar, gated custom content, private event, dinner/happy hour, newsletter CTA path, and post-campaign lead/reporting packet.
- **Brand awareness:** newsletter placements, sponsored content, open-distribution custom content, audience proof, and category positioning.
- **Enterprise/strategic partner:** annual industrial growth partner package with bundled 2026 deliverables and Kinetic 2027 as upside, not as the core 2026 earned-revenue basis.

Do not dump a pricing menu before understanding the buyer's objective unless Brian explicitly asks to send pricing.

## Daily Revenue Standard

Every weekday should produce at least one of these unless live evidence says no action is due:

- one warm pipeline move,
- one approval-ready sponsor/customer draft,
- one cash/contract/renewal unblock,
- one high-fit outreach batch,
- or one durable improvement to the revenue machine.

Keep external sends, pricing commitments, contracts, finance, legal, destructive actions, and material CRM judgment calls approval-gated. Keep source-backed pipeline stage bookkeeping automatic.
