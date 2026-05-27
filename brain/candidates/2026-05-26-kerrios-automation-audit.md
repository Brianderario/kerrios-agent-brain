# KerriOS Automation Audit — 2026-05-26

scope: audit · updated: 2026-05-26 · owner: Brian + Codex

## What Was Checked

- Active Codex automation records under `~/.codex/automations/`.
- KerriOS automation registry and canonical prompts.
- Codex Kerri Agent Master context-pack status labels.
- Open Google Tasks across Kerri MG and HardwareFYI surfaces.
- Local runtime state files under `data/`.
- High-impact KerriOS data gaps that can affect sponsor sends or commitments.

## Cleaned During Audit

- Closed the stale Brian / Benji no-transcript task as skipped.
- Marked Zenode H0013 as handled directly in Google Tasks and `data/jobs.json`, preventing a stale send if the inbox sweep sees the completed task.
- Updated Bananaz H0002 task notes with the verified Ari CC suggestion and kept the Wednesday 2026-05-27 reminder.
- Updated KerriOS docs so active recurring Codex automations are: `kerri-inbox-sweep`, `kerri-morning-brief`, `kerri-eod-meetings-review`, and `kerri-brain-push`.
- Downgraded cold outreach, lead research, S&W newsletter chain, and pipeline follow-up from active scheduled claims to prompt-ready / needs activation decision where no active Codex automation record exists.
- Marked the old Google Tasks OAuth-scope item as resolved because `gtasks_*` calls worked in this audit.

## Google Tasks Created

- `bkctVjRSYU94ZFJwbkFTOA` — Reconcile prompt-ready agents with active Codex automations.
- `emVBSGs5NVZybWtZd0dWWg` — Resolve 2026-05-25 cold outreach fallback draft batch.
- `VUd5SkRLVnpKaGRYU2t0MQ` — Verify first 24h outputs from active Kerri automations, due 2026-05-27.
- `S09pdmRlSDljMWw4d0NIUA` — Clean duplicate Brian / Benji 1:1 calendar series.
- `YWVqeEJDZ2ZyQW5sS2lOQQ` — Confirm current HWFYI webinar pricing before sponsor quotes.
- `c0ZLb1M3QkItRlQ0Q2FVSQ` — Scope SF Tech Week event before promising lead floors.

## Residual Risk

- The active core automation bundle has not yet completed a full calendar day of runs as of the 01:00 ET audit. The verification task above should be checked after the 2026-05-26 22:00 ET brain push.
- Cold outreach has real fallback drafts and a live queue, but no active Codex automation record. Treat it as parked until Brian chooses whether to activate or regenerate.
- Pricing and event-capacity gaps should block firm sponsor commitments until resolved.
