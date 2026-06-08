# Hardware FYI Cold Prospect Full Run - 2026-06-07

scope: workflow handoff · updated: 2026-06-07 · owner: Brian / Kerri

## Summary

Codex ran a full Hardware FYI cold-prospect top-up for the daily 10-outreach loop.

- Starting queue: 15 prospects.
- Added to `data/cold-outreach-queue.json`: 85 ready-to-draft prospects.
- Ending queue: 100 prospects, the current queue cap.
- Selected from `data/leads-master.json` after ICP QA: 115 fits, 4 clear mismatches, 7 gray-zone review.
- Apollo run: 85 selected companies processed, 45 Apollo-verified US marketing contacts returned, 0 Apollo errors.
- CRM mirror: `node scripts/sheets-append.mjs --leads data/leads-master.json --since 2026-06-08T01:04:00.000Z` synced 85 rows to the live `Leads` tab.
- State validation: `node scripts/check-state-integrity.mjs` passed.

## Artifacts

- Selection / ICP QA: `data/lead-research/batches/2026-06-07-full-cold-prospect-selection.json`
- Apollo JSON: `data/lead-research/batches/2026-06-07-full-cold-prospect-apollo.json`
- Apollo CSV: `data/lead-research/batches/2026-06-07-full-cold-prospect-apollo.csv`
- Queue write audit: `data/lead-research/batches/2026-06-07-full-cold-prospect-queue-write.json`
- Apollo input: `artifacts/apollo/hwfyi-prospect-batch-2026-06-07-fullrun.json`

## Next Agent Instructions

- `kerri-cold-outreach` should drain from `data/cold-outreach-queue.json` using its normal cheap preflight and bounded 25-entry scan.
- Do not promote these uncontacted leads into the `CY2026 Revenue Goal` pipeline until an approved send actually happens.
- Prefer entries whose `sources` include `apollo-refreshed-2026-06-07`; those have fresh Apollo-verified marketing contacts from this run.
- Entries without `apollo-refreshed-2026-06-07` still have existing `leads-master` contacts and concrete hooks; draft only if the hook survives normal dedupe/enrichment.
- Clear mismatches and gray-zone records are preserved in the selection artifact for audit and should not be silently re-added to the queue without a human or lead-research review.

## Counts

```text
Input new pool leads: 126
Fits: 115
Clear mismatches: 4
Gray-zone review: 7
Selected for queue/Apollo: 85
Apollo verified contacts used: 45
Existing lead-pool contacts used: 40
Queue before: 15
Queue after: 100
```
