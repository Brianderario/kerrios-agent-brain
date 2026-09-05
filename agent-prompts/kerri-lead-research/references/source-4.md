# SOURCE 4 — HIRING SIGNAL

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

1. Build a target-company list from a base ICP search (or use the existing batch's company candidates from sources 1–3 as input).
2. For each company, call `apollo_organizations_job_postings` and filter postings to titles in the marketing/growth/comms family.
3. If ≥1 such posting exists: this company is staffing marketing. Find one existing marketing contact (may be the new role's reporting manager) via [Source 1 contact lookup](source-1.md).
4. Build candidate:
   ```
   hookSeed: "hiring <role-title> as of <posted-date>"
   sources: ["hiring"]
   ```
