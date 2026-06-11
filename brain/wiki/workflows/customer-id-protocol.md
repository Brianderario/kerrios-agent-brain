---
name: customer-id-protocol
description: Universal rule for assigning + reusing customer jobIds across every KMG automation and brain write. Per-customer (not per-sweep) — same company keeps the same jobId forever. Lookup-first is mandatory and doubles as a QA gate. As of 2026-06-11 the lookup runs against the KMG Console API (CRM of record), with data/companies.json as a read-only offline snapshot.
---

# Customer ID Protocol

scope: workflow · updated: 2026-06-11 · authority: Brian (2026-05-24 iMessage instruction; 2026-06-11 interactive: Console is the CRM of record)

**This is universal.** Every KMG automation, sub-agent, or ad-hoc Claude session that creates a brain entry, drafts an email, queues a lead, registers a vendor, or otherwise logs a company → MUST follow this protocol before assigning any new identifier.

## Where company records live (2026-06-11 storage split)

The **KMG Console (kerrihq-rails on Render) is the system of record** for companies, contacts, and deals. Decision: [[../decisions/2026-06-11-brain-console-storage-split]].

- **Lookup + writes:** V1 API at `https://kerrihq-rails-xtua.onrender.com/api/v1` with `Authorization: Bearer $KERRIHQ_AGENT_API_KEY` (from `~/.kerri-chief/secrets/kerrihq.env`). Endpoints: `GET /companies?domain=<d>` (matches `domain` and `aliases`), `GET /companies?job_id=<id>`, `POST /companies`, `PATCH /companies/:id`, same shapes for `/people`.
- **`data/companies.json` is now a generated READ-ONLY snapshot** of the Console, refreshed by `scripts/console-crm-snapshot.mjs` (run after any company write, and nightly by kerri-brain-push). It exists only as the offline fallback. Never hand-edit it.
- **`brain/wiki/companies/` is frozen** — legacy pages remain in git history; new companies do NOT get wiki pages. Relationship facts go in the Console record's `crm_notes` (compact, source-linked, same hygiene as wiki writes).
- The CRM Google Sheet (`Console Companies` / `Console Contacts` / `Console Deals` tabs) is a one-way verification mirror written by `scripts/crm-sheet-mirror.mjs`. Never read or write CRM truth there.

## The rule

A company has ONE jobId. Forever. Across every thread, every draft, every meeting recap, every cold email, every event vendor inquiry. The jobId is the customer's stable identity in KMG's CRM, stored on the Console company record (`job_id`, unique per organization — the API rejects duplicates).

The H/S/G counter in `data/job-counters.json` (still local) only increments when a brand-new company enters the CRM. Existing customers always reuse their existing jobId.

This doubles as a QA gate: forcing the lookup before any write means every new entry is checked against the CRM first, which catches duplicates, misspellings, and missed-relationship-context cases.

**Hard gate for cold outreach (added 2026-06-08):** When the lookup finds an existing company, the cold-outreach agent MUST read that company's Console record (`crm_notes` + any deals) and check for any existing business relationship (sponsor, advertiser, partner, pipeline, event participant). If any relationship exists, the target is SKIPPED — never cold-emailed. This is not advisory; it is a hard stop.

## Lookup procedure (every automation runs this)

1. Extract sender / contact / vendor domain. Lowercase.
2. **Normalize obvious mail/marketing subdomains to the root.** `mail.acme.com` / `marketing.acme.com` / `email.acme.com` / `news.acme.com` / `notifications.acme.com` → `acme.com`. Use judgment for ambiguous subdomains that might be a distinct business unit — when in doubt, normalize to root and note it.
3. `GET /api/v1/companies?domain=<domain>` (covers aliases automatically).
   - **If the Console API is unreachable:** fall back to the snapshot `data/companies.json#companies[domain]` (then alias scan) for READ-ONLY reuse of an existing jobId. **Fail closed on misses:** while the API is down, never mint a new jobId or register a new company — mark the item review-required and retry next run. A blind new id is exactly the H0049/H0050 duplicate-identity failure.
4. If found AND has `job_id` → **reuse that jobId.** Do NOT increment any counter.
5. If found but no `job_id` → assign next counter value for the prefix, `PATCH /companies/:id` with `job_id`, increment the local counter.
6. If NOT found by domain → **sanity-check that this isn't an existing company under a new domain.** Fuzzy-match the sender's display name / signature / org name against Console company names (snapshot is fine for this scan). If a match: this is a domain alias — `PATCH` the new domain into that record's `aliases` and reuse the existing jobId. Only assign a fresh jobId if you're confident it's genuinely a new company.
7. New company path: assign next counter value, `POST /companies` with `{ name, domain, job_id, slug, aliases: [], crm_notes (1-2 line who/why), first_seen_at }`, increment the local counter, then refresh the snapshot (`node scripts/console-crm-snapshot.mjs`). Register the primary contact as a person: `POST /people { name, email, contact_type: "sponsor_contact", company_id }`.
8. Also scan existing `data/jobs.json` entries for the domain before assigning ANY fresh jobId: if a jobId exists anywhere for this company, REUSE it (a split jobId defeats the no-double-email gate; this was the Summit Interconnect H0126/H0028 incident).

## Slug rule

Lowercase the company name. Replace whitespace and `&`/`+`/`/` with `-`. Strip remaining punctuation. Max 60 chars.

Examples:
- `Aris Machina AB` → `aris-machina`
- `Standard & Works` → `standard-and-works`
- `SendCutSend` → `sendcutsend`

## Prefix assignment

- **H** — HWFYI advertiser, partner, industry contact, sponsor, anything @hardwarefyi.com adjacent
- **S** — Standard & Works. ANY thread received at brian@standardandworks.com is S regardless of sender. Also anything @standardandworks.com or from Zach Silber on any mailbox. (S/W boundary still applies — see [[../companies/standard-and-works]]. S/W *internal ops* never enter the Console either.)
- **G** — KMG general: vendors, ops, legal, miscellaneous. Default for ambiguous.

A company's prefix is fixed at first registration. Don't reprefix later — it would break Tasks list routing.

## Where this applies (audit list)

Every one of these calls into this protocol before logging companies or assigning jobIds:

- [[../../../agent-prompts/kerri-inbox-sweep/SKILL.md]] — STEP 3 CUSTOMER LOOKUP (canonical detailed implementation)
- [[../../../agent-prompts/kerri-cold-outreach/SKILL.md]] — before drafting any cold email, lookup target's company; reuse jobId or register new
- [[../../../agent-prompts/kerri-lead-research/SKILL.md]] — dedup queue candidates against the Console CRM (not just snapshot presence)
- [[../../../agent-prompts/kerri-eod-meetings-review/SKILL.md]] — meeting entities are CRM updates now: lookup, then write meeting context into the company's `crm_notes`
- [[../../../agent-prompts/kerri-event-logistics/SKILL.md]] — venues + vendors are companies too; same protocol applies (typically G-prefix)
- [[../../../agent-prompts/kerri-skill/SKILL.md]] — operating rules reference; ad-hoc draft requests via Slack/iMessage handoff invoke this through the kerri skill

## Pre-seeded customers

- `H0001` — Aris Machina (arismachina.com)
- `S0001` — Standard & Works (standardandworks.com) — pre-seeded 2026-05-24 per Brian; boundary rules still apply

## Why it's not optional

Without this rule the CRM accumulates orphan records: same company under different IDs, missed context when a known contact emails from a personal account, duplicate approval tasks for the same relationship, conflicting state in jobs.json. The lookup is cheap; the cleanup of a fragmented registry is not.

## Related

- [[../decisions/2026-06-11-brain-console-storage-split]] — why the Console is the CRM of record
- [[kmg-console-approvals]] — the Console itself (approvals surface + sync architecture)
- `data/companies.json` — READ-ONLY snapshot of the Console (offline fallback only)
- `data/job-counters.json` — counter state (still local; only bumps on new customers)
- `data/jobs.json` — per-draft action log (may have multiple entries per jobId for repeat threads with same customer)
- [[agent-brain-protocol]] — general brain read/write contract this lives under
