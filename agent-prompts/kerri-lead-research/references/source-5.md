# SOURCE 5 — APOLLO ICP (baseline)

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

The original v1 cold-outreach discovery mode. Keep as a fallback / supplementary source:
1. `apollo_mixed_people_api_search` with HWFYI ICP filters: `person_titles: ["VP Marketing", …]`, `organization_industries: [hardware, electronics, etc.]`, `organization_num_employees_ranges: ["11-200"]`, page size 30.
2. Build candidates with `hookSeed: "<role> at <company> in <industry>"` and `sources: ["apollo-icp"]`.
3. This source is weakest — only use when other sources are dry, or as a baseline floor.
