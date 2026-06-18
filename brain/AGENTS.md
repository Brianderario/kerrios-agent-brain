# KerriOS Brain Instructions

This vault is the human-readable KerriOS company brain. As of 2026-06-17 durable knowledge is read from **Savant** (the company hub, see [[wiki/decisions/2026-06-17-savant-as-company-hub]]); this git vault is the offline fallback + backing store.

Read order for agents:

1. [[index]] + [[routing]] — the topic map: decide *what to look for*
2. [[log]] — recent in-flight activity (stays in git, not Savant)
3. One to three routed knowledge records from Savant: `node scripts/brain-api.mjs search "<keywords>"` then `get <id>`
4. Offline fallback: if Savant is unreachable, read the matching `wiki/...` page from this vault directly
5. Raw source files only when evidence is required

Mutation rules:

- Raw sources are append-only evidence.
- Wiki pages are compiled synthesis maintained by agents.
- Candidates hold uncertain, conflicting, sensitive, or unowned claims.
- Durable writes that affect external sends, pricing, legal, finance, permissions, identity, or material CRM judgment calls require Brian approval. Source-backed CRM bookkeeping is act-and-report: when live evidence clearly proves a pipeline stage change, update the Console CRM, verify the result, and log the evidence instead of asking Brian to do clerical stage maintenance.
- Do not use chat thread memory as a substitute for reviewed KerriOS memory.
