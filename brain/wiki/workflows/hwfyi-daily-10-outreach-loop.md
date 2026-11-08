# Hardware FYI Daily 10-Outreach Loop

scope: workflow · updated: 2026-07-13 · owner: Brian / Kerri

Goal: every weekday, Kerri should prepare 10 approval-ready, one-to-one Hardware FYI sponsor outreach drafts for Brian to approve.

This is a draft-and-approval loop, not an auto-send loop.

## Loop Contract

1. **Research / queue top-up** — `kerri-lead-research`, weekdays 6:13pm ET.
   - Maintain at least 25 ready-to-draft prospects in `data/cold-outreach-queue.json`.
   - Each queued prospect must have a concrete personalization hook and plausible CY2026 revenue path.
   - Each queued prospect must also pass the high-intent gate: at least two of paid-access behavior, direct marketing/BD buyer, prior HWFYI/Kerri relationship or hard rep, editorial/story fit, or budget/timing signal.
   - Contextual matching alone is not queue-worthy. Software-to-manufacturing or broad hardware relevance without intent evidence stays in the lead pool as `qualified-hold` or `needs-qualification`.
   - Uncontacted leads are not real pipeline and do not go into `CY2026 Revenue Goal`.

2. **Draft set** — `kerri-cold-outreach`, weekdays 9:07am ET.
   - Target exactly 10 approval-ready drafts per weekday when at least 10 qualified queue entries exist.
   - Hard caps remain 10/day and 50/rolling-7.
   - If fewer than 10 survive dedupe/enrichment, draft the surviving qualified count and create one `COLD BATCH SHORT` deficit task that states how many more qualified prospects are needed.
   - Post exactly one Hardware FYI Savant `needs_approval` card per recipient. Every card contains one sender, one recipient, one subject, and one sendable draft. Never combine recipients or draft sections in one approval card.
   - Use a stable recipient-scoped external reference keyed by date and jobId. A run rollup may be logged, but it is not an approval or send card.
   - FullEnrich is the exclusive contact-search and verified work-email provider. Do not call Apollo. Poll FullEnrich enrichment jobs to completion, accept only exact person/company work-email matches, and use public/company sources for current hooks.
   - Standing phone-data hard rule: never request, enrich, export, store, or use phone numbers. `contact.phones` is prohibited unless Brian explicitly asks for a phone-number lookup in the current request. See `contact-enrichment-policy.md`.

3. **Approve / send** — `kerri-inbox-sweep`.
   - Sends only after Brian approves the individual recipient card in Savant.
   - One approval authorizes one recipient send only.
   - Records each sent draft in `data/cold-outreach-state.json`.
   - Promotes the contacted company to `Prospect` in `CY2026 Revenue Goal` only after the send actually happens.

4. **Record / improve**.
   - Lead pool and queue update in `data/leads-master.json` and `data/cold-outreach-queue.json`.
- Draft-card and send state update in `data/cold-outreach-state.json`.
   - Replies, bounces, opt-outs, skips, and Brian edits feed dedupe and prompt quality.

## Token Budget / Context Discipline

Default scheduled runs are cheap preflight runs first. They should load compact counters before loading broad context or calling paid/external tools.

- Start with the smallest structured checks: queue length, cold-outreach cap counters, lead-pool counts/status counts, do-not-contact count, and a small queue sample.
- Do not load full `NOW.md`, old `brain/log.md` history, full company/person wiki directories, old approval-queue history, raw email threads, raw FullEnrich/WebFetch dumps, or the full lead pool unless the compact preflight proves the run needs that material.
- Do not write no-op scheduled-run detail into `NOW.md` or long handoff prose. Healthy/no-op runs write compact state/grade only.
- Lead research stops once the queue is back to at least 25 ready entries. It sources only the number needed to restore that threshold plus a skip buffer, uses bulk/paginated APIs for backfills, saves raw discovery batches to `data/lead-research/batches/`, and logs only compact summaries.
- Cold outreach scans a bounded queue slice. Inspect at most 25 queue entries to produce the 10 approval-ready drafts; if fewer than 10 survive that slice, create individual cards for the qualified survivors plus one `COLD BATCH SHORT` task instead of continuing unbounded.
- Cold outreach loads voice rules, draft learnings, company/person detail, and revenue proof only after cap and queue preflight show draft work will actually happen.
- Savant task output stays compact: one approval card per recipient, one deficit task if needed, two or three metadata lines per card, and no raw enrichment payloads.

## Source-Of-Truth Rules

- Queue != pipeline.
- Drafted != sent.
- Sent first-touch = `Prospect`.
- Reply/interest/proposal = `Interest`.
- Pipeline dollars require source-backed pricing/proposed terms.
- No automation sends cold outreach without Brian approval.
