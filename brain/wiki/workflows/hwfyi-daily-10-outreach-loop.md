# Hardware FYI Daily 10-Outreach Loop

scope: workflow · updated: 2026-06-07 · owner: Brian / Kerri

Goal: every weekday, Kerri should prepare 10 approval-ready, one-to-one Hardware FYI sponsor outreach drafts for Brian to approve.

This is a draft-and-approval loop, not an auto-send loop.

## Loop Contract

1. **Research / queue top-up** — `kerri-lead-research`, weekdays 6:13pm ET.
   - Maintain at least 25 ready-to-draft prospects in `data/cold-outreach-queue.json`.
   - Each queued prospect must have a concrete personalization hook and plausible CY2026 revenue path.
   - Uncontacted leads are not real pipeline and do not go into `CY2026 Revenue Goal`.

2. **Draft batch** — `kerri-cold-outreach`, weekdays 9:07am ET.
   - Target exactly 10 approval-ready drafts per weekday when at least 10 qualified queue entries exist.
   - Hard caps remain 10/day and 50/rolling-7.
   - If fewer than 10 survive dedupe/enrichment, draft the surviving qualified count and create one `COLD BATCH SHORT` deficit task that states how many more qualified prospects are needed.
   - Post one Hardware FYI Google Task: `☀️ COLD BATCH <date> — <N> drafts`.

3. **Approve / send** — `kerri-inbox-sweep`.
   - Sends only after Brian checks the batch approval task.
   - Honors per-draft `SEND #n`, `SKIP #n`, and `REDO #n` controls.
   - Records each sent draft in `data/cold-outreach-state.json`.
   - Promotes the contacted company to `Prospect` in `CY2026 Revenue Goal` only after the send actually happens.

4. **Record / improve**.
   - Lead pool and queue update in `data/leads-master.json` and `data/cold-outreach-queue.json`.
   - Batch and send state update in `data/cold-outreach-state.json`.
   - Replies, bounces, opt-outs, skips, and Brian edits feed dedupe and prompt quality.

## Source-Of-Truth Rules

- Queue != pipeline.
- Drafted != sent.
- Sent first-touch = `Prospect`.
- Reply/interest/proposal = `Interest`.
- Pipeline dollars require source-backed pricing/proposed terms.
- No automation sends cold outreach without Brian approval.
