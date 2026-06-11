# Candidate: Brain ↔ Console storage split

**Date:** 2026-06-11
**Source:** Brian, interactive session (direct instruction): "what I would like for the brain to have is an understanding of how we work, what we do, tasks, jobs, etc. All the storage of company information and contacts, I would like to move to the Kerri console software we built."
**Status:** Direction confirmed by Brian; migration plan pending his sign-off on the details below. Promote to `wiki/decisions/` once cutover order is approved.

## The split

| Layer | Keeps | System |
|---|---|---|
| **Brain (KerriOS git wiki)** | How we work: workflows, agent prompts, decisions, operating rules, properties, log, NOW.md, job/task *process* knowledge | This repo |
| **KMG Console (kerrihq-rails on Render)** | Company records, contacts/people, deals, contracts, pipeline — all structured CRM data | Postgres + V1 API |

## Why it's feasible today

kerrihq-rails already has the models: `Company` (incl. enrichment JSONB), `Person`, `Deal` (pipeline stages, value, probability), `Contract`, `Activity` (audit log), `Task`, plus an authenticated V1 JSON API (`/api/v1/companies`, `/api/v1/people`, `/api/v1/deals`, `/api/v1/tasks`) that agents can read/write with an ApiKey. The local kerri-console app is a UI/proxy layer, not a store — the Rails app is the actual system of record.

## What moves out of the brain

- `brain/wiki/companies/*` (11 pages) → Console Company records
- `brain/wiki/people/*` external-contact pages → Console Person records (team pages brian/ari/benji/zach STAY — they're how-we-work)
- `data/companies.json` (jobId ↔ company map) → Console Company records (jobId stored as a field)
- Hardware FYI CRM Google Sheet → superseded by Console pipeline **(needs Brian's explicit confirmation — currently canonical per 2026-06 memory)**

## What must NOT break (migration constraints)

1. **Inbox-sweep customer lookup** (`wiki/workflows/customer-id-protocol`) reads `data/companies.json` to reuse jobIds. Cutover = backfill Console from companies.json, repoint lookup at the V1 API, only then freeze the JSON. Two live sources of truth is exactly the H0049/H0050 failure class — hard cutover, no dual-write period without a single declared winner.
2. **Render availability:** if the Console API is unreachable mid-sweep, customer lookup must fail closed (no new jobIds minted blind), with a local read-only snapshot as fallback.
3. **CRM mutations stay approval-gated** per the existing `neverAuto` gate — the store changes, the gate does not.
4. **S/W boundary applies to the Console too** — S/W internal ops don't enter Console records any more than they enter the brain.

## Proposed cutover order

1. Backfill: script companies.json + wiki/companies + wiki/people (external) into Console via V1 API; verify counts + jobIds match.
2. Repoint: customer-id-protocol + sweep CUSTOMER LOOKUP read/write the Console API (with snapshot fallback).
3. Freeze: companies.json becomes a generated read-only cache; wiki company/people pages replaced with one-line pointers to Console records.
4. Retire: CRM Google Sheet marked superseded (after Brian confirms).
