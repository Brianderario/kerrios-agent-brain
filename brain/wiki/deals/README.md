# Deals — open + dormant pipeline

scope: deals index · updated: 2026-05-24 · owner: kerri

One markdown file per deal. Each file is the canonical record for a single counterparty relationship that Kerri's pipeline-follow-up agent tracks. Inbox sweep handles *inbound replies*; pipeline-followup handles *outbound nudges when the ball is in our court and they've gone quiet*. Mutually exclusive by `last_sender`.

## Schema (frontmatter)

```yaml
---
slug: aris-machina               # kebab-case; mirrors brain/wiki/companies/<slug>.md
company: Aris Machina            # display name
jobId: H0001                     # null if no inbound has materialized this customer in companies.json yet
prefix: H                        # H | S | G
domain: arismachina.com          # primary domain
status: active                   # active | dormant | won | lost | paused
relationship_tier: cold          # cold | warm | re-engagement | renewal | kinetic-2026-sponsor
primary_contact_name: Sid Khullar
primary_contact_email: sid@arismachina.com
secondary_contacts: []           # list of "Name <email>"
mailbox: brian@hardwarefyi.com   # which mailbox the thread lives in
send_from: brian@hardwarefyi.com # which identity sends nudges (Brian vs Kerri)
last_contact_date: 2026-05-23    # last MESSAGE (in or out) in the thread
last_sender: them                # us | them
last_message_subject: "Re: Aris Machina <> Hardware FYI"
thread_internet_message_ids: []  # latest first
next_action_date: null           # ISO date when next nudge is allowed (pipeline sets this)
last_nudge_date: null            # last time pipeline drafted a nudge for this deal
nudge_count: 0                   # total nudges drafted (sent or skipped)
contract_end_date: null            # ISO date (YYYY-MM-DD) when the current contract expires; null if unknown.
                                   # Canonical field for renewal-watchdog expiring-contract detection (category A).
                                   # Backfill from DocuSign envelopes or CRM Contract Breakdown tab when available.
created_at: 2026-05-24
updated_at: 2026-05-24
source: inbox-sweep              # inbox-sweep | manual | kinetic-2026-roster | cold-outreach
---
```

## Status semantics

- `active` — in-flight conversation. Eligible for pipeline-followup if `last_sender: us` and the cadence threshold is hit.
- `dormant` — known relationship, no live conversation. Pipeline NEVER nudges. Brian flips to `active` to start a renewal/re-engagement push.
- `won` — closed, sponsor contract signed (or equivalent positive outcome). No nudges.
- `lost` — explicit no, or 45+ days no reply after `re-engagement` nudges. No nudges. Kept for memory.
- `paused` — manual hold (e.g., Brian decided to wait a quarter). No nudges until manually flipped.

## Cadence by relationship tier (days since last_contact_date)

| Tier | First nudge | Second nudge | Third nudge | Close as dormant |
|---|---|---|---|---|
| `cold` | 10 | 21 | 35 | 45 |
| `warm` | 5 | 12 | 21 | 45 |
| `re-engagement` | 7 | 18 | 30 | 45 |
| `renewal` | 10 | 21 | 35 | 60 |
| `kinetic-2026-sponsor` | manual only (status=dormant by default) | — | — | — |

Pipeline writes `next_action_date` based on these and re-reads it each run. Manual edits override the calculated date.

## What this directory is NOT

- Not the customer registry — that's `data/companies.json` (domain → jobId source of truth).
- Not the conversation log — that's `data/jobs.json` (per-draft history).
- Not the company profile — that's `brain/wiki/companies/<slug>.md` (who they are, what we know about them).

This directory is *deal state*: where each relationship sits in the pipeline cadence right now.

## Files

Open + dormant deal files live alongside this README. Files use the slug as filename: `aris-machina.md`, `astranis.md`, etc.
