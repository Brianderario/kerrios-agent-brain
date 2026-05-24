# Decision: Lead Research Sub-Agent Launch

scope: decision · updated: 2026-05-24 · supersedes: "Partner Research" from original 6-agent plan

## Decision

Ship `kerri-lead-research` as a discovery sub-agent that feeds `kerri-cold-outreach`. Separation of concerns: lead-research finds + scores + queues prospects; cold-outreach drafts + sends. They are decoupled — either can be invoked independently or together.

Replaces "Partner Research" from the original 6-agent plan, since the broader-scope lead-research subsumes that narrower function.

## Why

Brian flagged that flat Apollo ICP search is the floor, not the ceiling. Hardware advertisers/sponsors come from richer signals: conference sponsor lists, lookalikes off proven sponsors, funding rounds, hiring momentum. Pulling those signals together gives the cold-outreach agent better material to personalize from — and `voice.md` mandates concrete hooks (otherwise the agent SKIPS the target rather than send generic).

The Kinetic 2026 sponsor roster ([[../candidates/2026-05-24-kinetic-2026-sponsor-roster.md]]) provides 23 strong lookalike seeds. Apollo's lookalike + funding + hiring data joins on those seeds. Conference scrapes add explicit-intent signal (a company sponsoring DesignCon is by definition in market for hardware-engineer-audience media).

## Architecture (five pluggable sources, scored merge)

| Source | Type | Signal |
|---|---|---|
| `conferences` | WebFetch + Apollo enrich | Highest — explicit purchase intent |
| `lookalikes` | Apollo similar-orgs off Kinetic 2026 / HWFYI sponsor seeds | High — proven peers |
| `funding-signal` | Apollo recent-raise filter | High — fresh budget |
| `hiring-signal` | Apollo job postings for marketing/growth roles | Medium-high — staffing up |
| `apollo-icp` | Baseline ICP search | Lowest — flat data, fallback only |

**Scoring (0–100):** base 10 + 20 per source after first + 25 if lookalike-to-Kinetic-sponsor + 20 if recent funding + 15 if hiring + 10 per conf + size penalties for too-small/too-large companies.

**Output:** top-N candidates appended to `data/cold-outreach-queue.json` with `hookSeed` strings the cold-outreach agent uses to personalize drafts.

## Initial conference seed list

Stored in `data/lead-research/conferences.json` (tracked, editable):
DesignCon · Reindustrialize · Sensors Converge · AUTOMATE · SEMICON West · embedded world · Hannover Messe · IMTS · productronica · MD&M West.

Add more by editing that JSON. Each entry has a `lastScrapedAt` field so the agent can skip recently-scraped conferences and rotate through.

## Cadence

- Scheduled: Sun 6:13pm ET (scheduler nudges to 6:16) — pre-populates the queue ahead of Mon 9:07am cold-outreach batch
- On-demand: invocation by Brian or by another agent (e.g., when cold-outreach finds the queue empty mid-week, it could trigger a lead-research on-demand run — v2)

## Boundary

HWFYI side only. No S/W lead research from this agent. The conference list intentionally omits defense-only and S/W-specific events. If Brian wants a separate S/W lead-research agent later, it gets its own SKILL with the S/W boundary rules baked in.

## What it does NOT do

- Draft emails (cold-outreach's job)
- Send anything (cold-outreach + inbox-sweep's job)
- Spend Apollo credits unbounded (per-run budget; halts on rate-limit)
- Modify `brain/wiki/companies/` durably — only writes to `data/lead-research/batches/` for audit; promotion to wiki happens after real relationship starts

## Open / deferred

- v2: Beehiiv newsletter engagement source (if API available — companies whose employees subscribe + click are pre-warmed)
- v2: LinkedIn engagement signal
- v2: Cross-conference correlation (companies sponsoring 3+ relevant conferences = highest priority)
- v2: cold-outreach auto-triggers lead-research on-demand when queue is dry

## Related

- [[2026-05-24-cold-outreach-launch]] — the consumer of this agent's output
- [[../agents/registry]] — agent roster
- [[../candidates/2026-05-24-kinetic-2026-sponsor-roster]] — lookalike seed
- [[../workflows/multi-agent-write-rules]] — multi-agent flow rules
