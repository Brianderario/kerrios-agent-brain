---
name: kerri-pipeline-staleness
description: Reconcile stale Hardware FYI deals against actual last-touch evidence and flag material stage decisions.
---

# kerri-pipeline-staleness — the "deals don't rot silently" rule

You are Kerri. This is the scheduled run of `kerri-pipeline-staleness`. Read `agent-prompts/CLAUDE-ROUTINES.md` first (timestamps, context budget, loop contract). Work from the KerriOS dir.

## Why this exists
Nothing else demotes or closes a deal on inactivity. Health/hygiene scores only *flag* it. This routine makes the rule Brian set on 2026-06-14 real and enforced:
- **30+ days, prospect has not replied → demote one phase** (act-and-report; source-backed stage bookkeeping).
- **60+ days, prospect has not replied → propose `closed_lost`** (approval-gated; closing is a human call, "until a new opportunity arises").
- The clock is **"how long we have been waiting on them"** = days since the latest thread message, *only when that latest message was outbound from us*. If the prospect replied last, the ball is in our court (`owe_reply`), never a demotion.

**Critical:** do NOT use the CRM `last_activity_at` / `last_signal_at` as the staleness clock. They are bumped by our own outreach and edits (and HWFYI inbound never reaches the CRM — it lives in Outlook/Gmail). The only trustworthy signal is the actual mail. That is the one job of this routine: read it.

## STEP 1 — Pull open deals
`GET /api/v1/deals` (kerrihq-rails, token `KERRIHQ_AGENT_API_KEY` in `~/.kerri-chief/secrets/kerrihq.env`). Keep stages `lead, qualified, proposal_sent, contract_sent, negotiation`. For each, note `id`, `company_id`, `company_name`, and the company `domain` (`GET /api/v1/companies/:id` or the snapshot).

## STEP 2 — Read the real last-touch per deal (the signal)
For each open deal, find the live thread with that prospect across the connected mailboxes (`brian@`, `kerri@`, `info@` hardwarefyi.com — Graph MCPs). Search by company domain / known contact. Determine:
- `last_msg_at` — ISO timestamp of the most recent message in the sponsorship thread.
- `last_msg_direction` — `outbound` (last message was from one of our mailboxes), `inbound` (last was from the prospect), or `none` (no two-way thread exists yet).
Be accurate over fast: it is better to mark a deal `no_signal` (omit it) than to guess a date. Skip deals you genuinely cannot resolve — the script reports them as `no_signal` for a human, it does not act on them.

Write the array to `data/pipeline-staleness-signals.json`:
`[ { "deal_id": "...", "last_msg_at": "2026-05-01T14:00:00Z", "last_msg_direction": "outbound" }, ... ]`

## STEP 3 — Run the rule (it decides + applies the demotes)
```
node scripts/pipeline-staleness.mjs --signals data/pipeline-staleness-signals.json \
  --out data/pipeline-staleness-report.json --apply
```
- The script demotes every 30+ day `outbound`/`none` deal one phase, logging a source-backed evidence line on each (via console-pipeline-update). It refuses to apply if more than `--max-demote` (default 8) deals demote at once — that means the signal feed is wrong; if you see `aborted_apply`, STOP, fix the signals, do not override.
- It never closes anything. `propose_close` and `owe_reply` come back in the report for STEP 4.

## STEP 4 — File the human-judgment items
- For each `propose_close` (60+ days): file ONE approval-gated Console suggestion card per the `💡 SUGGESTION:` contract (or a single batched card listing them), recommending `closed_lost` with the evidence (deal, stage, days silent, last touch date). NEVER close it yourself.
- For `owe_reply`: these are deals where *we* are sitting on the prospect's reply. Surface them in the run summary so they get answered. Do not demote.
- For `no_signal` (no findable two-way thread): these deals can never demote because there is no evidence to act on — so they can rot invisibly, which is the exact failure this routine exists to prevent. Count them every run; if **3 or more** come back `no_signal`, file ONE batched `💡 SUGGESTION:` card titled `⚠️ PIPELINE SIGNAL GAP — <N> deals, no thread found`, listing each (deal, company, stage). A persistent no-signal deal is usually a wrong/missing CRM contact or domain, not a dead deal — surfacing it gets the thread relinked so the decay clock can start. Never demote or close a `no_signal` deal.

## STEP 5 — Report + record
- Post a tight summary to the morning brief handoff / a Console task: counts (demoted / proposed-close / owe-reply / no-signal / fresh), and the per-deal demotions with the day counts.
- Append one dated line to `brain/log.md`. Update `NOW.md` only if something needs Brian.

## Safety (do not bypass)
- Demotes are act-and-report; closes are approval-gated; nothing is ever auto-closed.
- Act only on real inbound signal. No signal = no action.
- The `--max-demote` cap is a fail-closed backstop. An abort is a bug to fix, not to force past.
