---
name: 2026-06-11-brain-console-storage-split
description: Brain keeps how-we-work knowledge; Savant (formerly KMG Console, kerrihq-rails) is the system of record for companies, contacts, and deals. The CRM Google Sheet stays as a one-way verification mirror for now.
---

# Decision: Brain ↔ Savant storage split

scope: decision · updated: 2026-06-12 · authority: Brian (interactive session 2026-06-11, "go for the changes. Make the console the source of truth but copy everything to the sheet crm for now for double checking"; product renamed to Savant 2026-06-12)

## The split

| Layer | Holds | System |
|---|---|---|
| **Brain (KerriOS git wiki)** | How we work: workflows, agent prompts, decisions, operating rules, properties, events, meetings, log, NOW.md | This repo |
| **Savant (formerly KMG Console; kerrihq-rails on Render)** | Companies, contacts/people, deals, contracts, pipeline — all structured CRM data | Postgres + V1 API |
| **CRM Google Sheet** | One-way verification mirror of Savant (legacy tab names: `Console Companies` / `Console Contacts` / `Console Deals`) | `scripts/crm-sheet-mirror.mjs` |

## What changed

- Companies gained CRM-of-record fields in kerrihq-rails (`domain` unique per org, `job_id` unique per org, `slug`, `aliases`, `crm_notes`, `first_seen_at`, `last_touched_at`) and the V1 API does domain/jobId lookup — commit `bdfdd67`.
- A dedicated `kerri-agent-crm` API key (companies/people/deals read+write, tasks read) authenticates agents; token in `~/.kerri-chief/secrets/kerrihq.env` as `KERRIHQ_AGENT_API_KEY`, never in the brain/GitHub.
- All brain company data was backfilled into Savant: `data/companies.json` (jobId registry) + `brain/wiki/companies/` (163 pages) + `brain/wiki/people/` external contacts, via `scripts/console-crm-backfill.mjs`.
- [[../workflows/customer-id-protocol]] now points lookups + registrations at the Savant API. `data/companies.json` became a generated read-only snapshot (offline fallback only, refreshed by `scripts/console-crm-snapshot.mjs`).
- `brain/wiki/companies/` is frozen: legacy pages stay in git history, new companies get Console records, relationship facts go in `crm_notes`.
- The old "canonical CRM is the Google Sheet" rule is superseded: the Sheet is now a mirror Brian can use to double-check Savant. Sheet edits are never read back.

## What did NOT change

- **Material CRM judgment stays approval-gated** per the `neverAuto` gate — the store moved, the gate did not. Source-backed Hardware FYI pipeline stage bookkeeping is act-and-report: if live evidence clearly proves a stage move, Kerri updates the Savant deal automatically and logs the evidence instead of asking Brian to approve clerical pipeline maintenance.
- **S/W boundary applies to Savant** exactly as it did to the brain: S/W internal ops never become Savant records.
- jobId semantics ([[../workflows/customer-id-protocol]]): one company, one jobId, forever; counters stay local in `data/job-counters.json`.
- The inbox sweep's send gate, no-double-email rules, and jobs.json task ledger.

## Failure posture

If the Savant API is unreachable mid-run: reuse jobIds from the snapshot (read-only), and **fail closed on new registrations** — mark review-required, never mint a jobId blind. Rationale: two live sources of truth caused the H0049/H0050 duplicate-identity incident.

## Supersedes

- `brain/candidates/2026-06-11-brain-console-storage-split.md` (promoted)
- The 2026-06-08 "canonical HWFYI CRM is the Google Sheet" rule (sheet demoted to mirror)
