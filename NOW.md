# NOW — live handoff baton

> The single source of "where things stand right now." Whichever runner (Claude or Codex)
> you open reads this FIRST and updates it LAST. Keep it short (~20 lines) — this is a
> snapshot, not a log. Durable truth goes in `brain/wiki/`; the running history goes in
> `brain/log.md`. This file is only the current state of in-flight work.

**Last touched:** 2026-05-29 02:08 ET · **by:** Kerri (Codex inbox sweep)

## In flight
- ROUTINE MIGRATION (Claude): Codex automations being ported to local Claude Code durable cron. New spec `agent-prompts/CLAUDE-ROUTINES.md` (pod-organized, 6-field loop contract per routine). NEW agent `agent-prompts/kerri-gap-sweep/SKILL.md` — independent daily code/workflow hygiene agent (~21:41 ET, before brain push). Registry scheduled-tasks table updated (material-ish edit — Brian may want a PR). Plan-only on actually creating crons. OPEN DECISIONS: (1) re-arm vs scheduled-tasks MCP for the 7-day expiry, (2) strip Codex `::` directives via `## Runner` block, (3) keep/drop brain-push given Stop-hook sync, (4) parallel-run vs hard-swap cutover. GAPS found: Inbound-sales + Event-sales prompts don't exist.
- H0034 Jiga (task SnR1REdJMVYyMk5Ebm9USQ): Brian-sender draft for Khay Garcia's June placement thread now lists the Brian-approved 9-placement spread — June 6/9,6/16,6/20,6/27 + July 7/4,7/11,7/14,7/21,7/25 (4 June / 5 July), leading with "Build Real Supplier Relationships." Pending Brian approval; no send. On approval: book these 9 slots in the HWFYI schedule sheet (1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk; mounted as canonical schedule SoT in properties/hardware-fyi.md). Count caveat: Jiga has no contract row in the sheet, so "9 remaining" is Khay-asserted.
- NEW package-email logic: brain/wiki/workflows/hwfyi-package-quote-playbook.md (built from Brian's gold-standard Modelwise send). properties/hardware-fyi.md + draft-learnings.md updated. Sponsor package drafts redrafted into A/B/C bundle style: H0030 CoLab marked sent manually by Brian at 01:31 ET; H0013 Zenode sent by Kerri after Brian approval at 02:05 ET; H0015 ATOMS still sender-locked to Brian and reopened manual-send-needed. Remaining package drafts are Brian-sender w/ sender locks; pending approval, no sends.
- PENDING Brian decision: item 5 — wire the playbook into kerri-inbox-sweep / eod / kerri-skill prompts (send-adjacent → wants a PR). Not done yet.

## Last action
- Inbox sweep processed completed approvals: sent H0013 Zenode from brian@hardwarefyi.com and H0019 Werqwise from kerri@hardwarefyi.com after live-thread checks; skipped H0026 AllSpice and H0029 Shah Capital Ventures; reopened H0015 ATOMS as manual-send-needed because senderLock=brian must be honored. Sendblue alert for H0015 failed due missing runtime config. H0034 Jiga remains pending.

## Next action
- Wait for Brian approval/edit/skip on H0034 Jiga + remaining redrafted sponsor follow-ups (H0015 ATOMS, H0021 Flow). ATOMS requires Brian manual send from brian@hardwarefyi.com or explicit edit/skip. Get Brian's go-ahead on item 5 (prompt wiring via PR).

## Decisions waiting on Brian
- Item 5: wire package playbook into the automation prompts (PR)? 
- ATOMS: send manually from brian@hardwarefyi.com, or explicitly edit/skip H0015.

## Notes
- codex sync test 2026-05-28 16:30:03 EDT
- Update the three lines above (Last action / Next action / Last touched) before you stop. That's the handoff.
