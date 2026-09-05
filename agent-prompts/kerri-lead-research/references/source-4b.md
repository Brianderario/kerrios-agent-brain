# SOURCE 4B — ENGINEERING-RECRUITING SIGNAL (lane 4: manufacturers hiring engineers)

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

Distinct from SOURCE 4 (which looks for marketing hires as a buy signal): this source finds hardware manufacturers actively hiring ENGINEERS, because HWFYI's audience is the talent pool they need. These get the recruiting-angle pitch from cold-outreach.

1. Build a target company list from an Apollo search: `organization_industries: [hardware, electronics manufacturing, robotics, industrial automation, semiconductors, automotive, 3d printing]`, `organization_num_employees_ranges: ["51-200", "201-500", "501-1000"]`, `country = US`. Apply HARD RULE 4 (no defense/aerospace/gov).
2. For each company, call `apollo_organizations_job_postings` and filter to engineering titles: hardware, mechanical, electrical, firmware, embedded, manufacturing, process, test, or product engineer.
3. If ≥2 such postings are active: this company is staffing engineering. Find one marketing/growth/BD contact via [Source 1 contact lookup](source-1.md) (a talent/recruiting lead also works for this lane: "Head of Talent", "VP People", "Technical Recruiter" as fallback titles).
4. Build candidate:
   ```
   hookSeed: "hiring <N> engineering roles (<top 1-2 titles>) as of <date>"
   sources: ["recruiting-signal"]
   lane: "recruiting-mfg"
   ```
5. These leads get the +15 recruiting-angle scoring bonus. Add +5 more if >3 open engineering roles.
