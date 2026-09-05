# SOURCE 3 — FUNDING SIGNAL

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

1. `apollo_mixed_companies_search` with filters: `organization_latest_funding_round_dates_range: [last 60 days]`, `organization_industries: [hardware, electronics manufacturing, industrial automation, robotics, semiconductors, energy, clean technology, manufacturing, mechanical or industrial engineering, electrical/electronic manufacturing, computer hardware, automotive, 3d printing, nanotechnology, packaging and containers]`, `organization_num_employees_ranges: ["11-50", "51-200", "201-500"]`. **Do NOT include defense, aerospace, military, or government industries in this filter.** Defense companies that happen to also raise funding should not enter the pool through this source.
2. For each result, get funding_amount, funding_round_type, funding_date.
3. Find one marketing contact per company (as above).
4. Build candidate:
   ```
   hookSeed: "raised $<amount> <round> on <date>"
   sources: ["funding"]
   ```
