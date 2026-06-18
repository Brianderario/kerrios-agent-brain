# Audience Graph project (subscriber moat — supervised build)

scope: workflow · created: 2026-06-17 · owner: Brian + Kerri · status: scoped, not started

The biggest strategic gap in Savant and pillar 2 of [[../properties/savant-product-vision]] (the moat). Savant has companies, contacts, deals, and events, but **no model of the newsletter readership** — so it cannot answer the question that sells sponsorships: "how many of your target buyers actually read us?" This page scopes that build. It is deliberately a **supervised** project, not an overnight build-loop item, for the reasons under Constraints.

## What it is

Turn the raw subscriber list into a queryable graph: each subscriber enriched into person + title + company, rolled up to an account-level map. Then Savant can sell audience *composition* instead of impressions: "412 readers match your ICP; 38 target accounts have 3+ weekly readers; engineers at Anduril clicked twice." It compounds with list growth and is uncopyable, and it permanently answers the Tier-B demographics question as a live, self-regenerating page.

## What it needs (the build, roughly phased)

1. **Ingest** — a `subscriber` model + a beehiiv pull (subscribers, status, engagement events). Establishes the raw list in Savant.
2. **Enrich** — resolve each subscriber to person + title + company (Apollo or similar), with a confidence score; dedupe to the existing CRM `company`/`person` where they overlap.
3. **Roll up** — an account-level audience map: readers per company, seniority mix, ICP-match flag, engagement per account. Link it to the deal/CRM side so a sponsor's target accounts light up against real readership.
4. **Surface** — an audience screen + a sponsor-facing "your audience with us" view (feeds proof-of-performance and the first-touch audience-fit pitch).

## Why this is supervised, not an overnight loop item

The build-loop hard rails forbid exactly what this needs, so it must run with Brian in a normal session:

- **External data ingestion** (beehiiv subscriber pull) and a likely new connector/credential.
- **Paid enrichment** — Apollo credits at list scale (mass enrichment, not the pre-approved one-off lookups); a real spend decision.
- **PII / privacy weight** — subscriber identities are sensitive; sensitivity tier + permission grants need Brian's call before ingestion, and the S/W boundary still holds.
- It is multi-session and schema-heavy, not a single safe night.

## Open decisions for Brian before starting

- beehiiv API access (the standing blocker: Brian must generate the beehiiv API key — see NOW.md S&W beehiiv ops note).
- Enrichment budget + provider (Apollo mass credits vs alternative).
- Sensitivity tier for subscriber PII and who on the team may see account-level audience data.

## Related

- [[savant-build-backlog]] — listed there as a supervised project, not an overnight candidate
- [[../properties/savant-product-vision]] — pillar 2
- [[../properties/hardware-fyi-audience]] — current Tier A / Tier B demographics this would make live
