# SOURCE 2 — LOOKALIKES (off existing relationships)

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

Seeds:
- Parse `brain/candidates/2026-05-24-kinetic-2026-sponsor-roster.md` for the 23 Kinetic 2026 sponsor company names + emails
- Any H-prefix company in the Console CRM (scan the read-only snapshot `data/companies.json` for HWFYI-scope records)

For each seed company:
1. Apollo-enrich the seed via `apollo_organizations_enrich` (use the domain) → get organization_id, industry, employee count, keywords.
2. Search for similar companies via `apollo_mixed_companies_search` with the same `organization_industries`, `organization_num_employees_ranges` ±50%, and `q_organization_keywords` matching the seed's keywords. Limit 10 per seed.
3. Filter results: drop the seed itself, drop dedup hits (per HARD RULES), drop companies that look like consultancies/services rather than product orgs.
4. For each survivor, find one marketing contact (same person query as [Source 1 contact lookup](source-1.md)).
5. Build candidate:
   ```
   {
     "email": "<from apollo>",
     "name": "<from apollo>",
     "title": "<from apollo>",
     "company": "<canonical>",
     "hookSeed": "lookalike to <seed-company>, our Kinetic 2026 sponsor",
     "sources": ["lookalike:<seed-slug>"],
     "score": <see scoring>
   }
   ```
