---
name: customer-id-protocol
description: Universal rule for assigning + reusing customer jobIds across every KMG automation and brain write. Per-customer (not per-sweep) — same company keeps the same jobId forever. Lookup-first is mandatory and doubles as a QA gate.
---

# Customer ID Protocol

scope: workflow · updated: 2026-05-24 · authority: Brian (2026-05-24 iMessage instruction)

**This is universal.** Every KMG automation, sub-agent, or ad-hoc Claude session that creates a brain entry, drafts an email, queues a lead, registers a vendor, or otherwise logs a company → MUST follow this protocol before assigning any new identifier.

## The rule

A company has ONE jobId. Forever. Across every thread, every draft, every meeting recap, every cold email, every event vendor inquiry. The jobId is the customer's stable identity in KMG's brain.

The H/S/G counter in `data/job-counters.json` only increments when a brand-new company enters the registry. Existing customers always reuse their existing jobId.

This doubles as a QA gate: forcing the lookup before any write means every new entry is checked against the brain first, which catches duplicates, misspellings, and missed-relationship-context cases.

**Hard gate for cold outreach (added 2026-06-08):** When the customer-id-protocol lookup finds an existing company in `data/companies.json`, the cold-outreach agent MUST read `brain/wiki/companies/<slug>.md` and check for any existing business relationship (sponsor, advertiser, partner, pipeline, event participant). If any relationship exists, the target is SKIPPED — never cold-emailed. This is not advisory; it is a hard stop. The previous gap (checking people but not companies) resulted in cold emails being drafted to Kinetic 2026 sponsors and existing HWFYI advertisers.

## Lookup procedure (every automation runs this)

1. Extract sender / contact / vendor domain. Lowercase.
2. **Normalize obvious mail/marketing subdomains to the root.** `mail.acme.com` / `marketing.acme.com` / `email.acme.com` / `news.acme.com` / `notifications.acme.com` → `acme.com`. Use judgment for ambiguous subdomains that might be a distinct business unit — when in doubt, normalize to root and note it.
3. Look up `data/companies.json#companies[domain]` directly. If miss, scan every entry's `aliases` array for that domain.
4. If found AND has `jobId` → **reuse that jobId.** Do NOT increment any counter. Confirm `brain/wiki/companies/<slug>.md` exists; create from registry data if missing.
5. If found but no `jobId` → assign next counter value for the prefix, write back to companies.json, increment counter, update wiki page frontmatter.
6. If NOT found by domain → **sanity-check that this isn't an existing company under a new domain.** Scan companies.json `name` values for fuzzy matches against the sender's display name, signature, or organization name from enrichment. If a match: this is a domain alias — add the new domain to that entry's `aliases` array and reuse the existing jobId. Only assign a fresh jobId if you're confident it's genuinely a new company.
7. New company path: assign next counter value, create a new companies.json entry (`{ jobId, name, slug, prefix, primaryContact, aliases: [], firstSeenAt, wikiPage }`), create `brain/wiki/companies/<slug>.md` with `jobId` + `prefix` + `domain` + `slug` in frontmatter and a minimal `# <Name>` body + scope/updated header line, increment counter, save companies.json.

## Slug rule

Lowercase the company name. Replace whitespace and `&`/`+`/`/` with `-`. Strip remaining punctuation. Max 60 chars.

Examples:
- `Aris Machina AB` → `aris-machina`
- `Standard & Works` → `standard-and-works`
- `SendCutSend` → `sendcutsend`

## Prefix assignment

- **H** — HWFYI advertiser, partner, industry contact, sponsor, anything @hardwarefyi.com adjacent
- **S** — Standard & Works. ANY thread received at brian@standardandworks.com is S regardless of sender. Also anything @standardandworks.com or from Zach Silber on any mailbox. (S/W boundary still applies — see [[../companies/standard-and-works]].)
- **G** — KMG general: vendors, ops, legal, miscellaneous. Default for ambiguous.

A company's prefix is fixed at first registration. Don't reprefix later — it would break Tasks list routing.

## Where this applies (audit list)

Every one of these calls into this protocol before logging companies or assigning jobIds:

- [[../../../agent-prompts/kerri-inbox-sweep/SKILL.md]] — STEP 3 CUSTOMER LOOKUP (canonical detailed implementation)
- [[../../../agent-prompts/kerri-cold-outreach/SKILL.md]] — before drafting any cold email, lookup target's company; reuse jobId or register new
- [[../../../agent-prompts/kerri-lead-research/SKILL.md]] — dedup queue candidates against companies.json (not just wiki/companies/ presence)
- [[../../../agent-prompts/kerri-eod-meetings-review/SKILL.md]] — before writing or updating any `brain/wiki/companies/<slug>.md` page, run lookup
- [[../../../agent-prompts/kerri-event-logistics/SKILL.md]] — venues + vendors are companies too; same protocol applies (typically G-prefix)
- [[../../../agent-prompts/kerri-skill/SKILL.md]] — operating rules reference; ad-hoc draft requests via Slack/iMessage handoff invoke this through the kerri skill

## Pre-seeded customers

- `H0001` — Aris Machina (arismachina.com)
- `S0001` — Standard & Works (standardandworks.com) — pre-seeded 2026-05-24 per Brian; boundary rules still apply

## Why it's not optional

Without this rule the brain accumulates orphan records: same company under different IDs, missed context when a known contact emails from a personal account, duplicate Google Tasks for the same relationship, conflicting state in jobs.json. The lookup is cheap; the cleanup of a fragmented registry is not.

## Related

- [[../../../data/companies.json]] — the registry itself (source of truth for lookup)
- [[../../../data/job-counters.json]] — counter state (only bumps on new customers)
- [[../../../data/jobs.json]] — per-draft action log (may have multiple entries per jobId for repeat threads with same customer)
- [[agent-brain-protocol]] — general brain read/write contract this lives under
