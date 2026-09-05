# SOURCE 1 — CONFERENCES (scrape + enrich)

Read only for this source lane. Shared ICP, dedup, exclusion, spend and output rules remain in [the parent skill](../SKILL.md). Commands and data paths are relative to the repository root.

For each conference in `data/lead-research/conferences.json` (or just the one Brian named on-demand):

1. If the conference entry has a `dataFeed` + `extraction` (MapYourShow-platform shows like Automate), use that FIRST — it's the reliable path. Curl the `dataFeed` JSON with a desktop browser User-Agent + `X-Requested-With: XMLHttpRequest` + `Referer: <sponsorsUrlHint>`, then parse per the entry's `extraction` note (e.g. MapYourShow → `DATA.results.exhibitor.hit[].fields` → `exhname_t`/`exhdesc_t`/`boothsdisplay_la`). One call returns the whole floor (Automate = ~1,200 exhibitors). Otherwise, WebFetch the `sponsorsUrlHint` URL and extract company names + (if listed) booth numbers, tier, website as a clean JSON array.
2. If a plain `sponsorsUrlHint` WebFetch returns a JS shell or auth wall, check whether it's a MapYourShow site (host `*.mapyourshow.com`, or the page references `mapyourshow`): if so, derive the feed `https://<show>.mapyourshow.com/8_0/ajax/remote-proxy.cfm?action=search&searchtype=exhibitorgallery&searchsize=3000` and pull it as in step 1 (this turns most "degraded" JS directories into a working source — record the feed URL onto the conference entry's `dataFeed` so the next run skips the wall). Only if that also fails: fall back to the main conference URL for an "exhibitor list" passage; if still empty, mark the entry `degraded` + log to Slack and skip that conf for this run.
3. For each company name extracted, attempt Apollo company match via `apollo_mixed_companies_search` with `q_organization_name`. Take the top match by employee-count + industry-fit heuristic.
4. For each matched company, find ONE marketing/comms/growth contact via `apollo_mixed_people_api_search` with `person_titles: ["VP Marketing", "Head of Growth", "CMO", "Director of Marketing", "Head of Demand Generation", "Head of Brand", "Head of Communications"]` and the matched company's organization_id.
5. Build candidate record:
   ```
   {
     "email": "<from apollo>",
     "name": "<from apollo>",
     "title": "<from apollo>",
     "company": "<canonical apollo name>",
     "hookSeed": "exhibited at <conf-name> <year>",
     "sources": ["conf:<conf-slug>"],
     "score": <see scoring below>
   }
   ```
6. Update `lastScrapedAt` for that conference in `conferences.json` (commit later).
