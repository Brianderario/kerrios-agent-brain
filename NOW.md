# NOW — live handoff baton

> The single source of "where things stand right now." Whichever runner (Claude or Codex)
> you open reads this FIRST and updates it LAST. Keep it short (~20 lines) — this is a
> snapshot, not a log. Durable truth goes in `brain/wiki/`; the running history goes in
> `brain/log.md`. This file is only the current state of in-flight work.

**Last touched:** 2026-05-29 02:48 ET · **by:** Kerri (Claude inbox-sweep)

## In flight
- ROUTINE MIGRATION (Claude) — LIVE: 5 routines now created as PERSISTENT Claude scheduled-tasks MCP jobs (~/.claude/scheduled-tasks/, survive sessions, no 7-day expiry): kerri-inbox-sweep (*/15), kerri-morning-brief (wkday 6:57), kerri-eod-meetings-review (wkday 18:28), kerri-brain-push (22:00), kerri-gap-sweep (21:41, new independent code/workflow hygiene agent). Each is a shim that loads its canonical agent-prompts/*/SKILL.md with a Claude-runner override (skip Codex ::inbox-item/::archive; honor approval gates). Spec: agent-prompts/CLAUDE-ROUTINES.md. ⚠️ ACTION FOR CODEX/BRIAN: DISABLE the Codex equivalents (inbox-sweep, morning-brief, eod, brain-push) — they now run in BOTH runners and will double-send/double-task. Inbox-sweep file lock + shared cursor state partially dedupe but contention is real. GAPS: Inbound-sales + Event-sales prompts still don't exist.
- H0034 Jiga (task SnR1REdJMVYyMk5Ebm9USQ): Brian-sender draft for Khay Garcia's June placement thread now lists the Brian-approved 9-placement spread — June 6/9,6/16,6/20,6/27 + July 7/4,7/11,7/14,7/21,7/25 (4 June / 5 July), leading with "Build Real Supplier Relationships." Pending Brian approval; no send. On approval: book these 9 slots in the HWFYI schedule sheet (1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk; mounted as canonical schedule SoT in properties/hardware-fyi.md). Count caveat: Jiga has no contract row in the sheet, so "9 remaining" is Khay-asserted.
- NEW package-email logic: brain/wiki/workflows/hwfyi-package-quote-playbook.md (built from Brian's gold-standard Modelwise send). properties/hardware-fyi.md + draft-learnings.md updated. Sponsor package drafts redrafted into A/B/C bundle style: H0030 CoLab marked sent manually by Brian at 01:31 ET; H0013 Zenode sent by Kerri after Brian approval at 02:05 ET; H0015 ATOMS SENT 2026-05-29 from Brian (signed Brian) after Brian approval — task closed, do NOT re-send. Remaining package drafts are Brian-sender w/ sender locks; pending approval, no sends.
- PENDING Brian decision: item 5 — wire the playbook into kerri-inbox-sweep / eod / kerri-skill prompts (send-adjacent → wants a PR). Not done yet.

## Last action
- 2026-05-29 02:48 ET Claude kerri-inbox-sweep — quiet sweep. All 4 mailboxes searched cursor-first (since 06:29:54Z); 0 new inbound. STEP 2 no-op: 8 pending H/G jobs (H0034 Jiga, H0028 Summit, H0027 SHACK15, H0018 BuzzWorks, H0021 Flow, G0001 Ken, G0005 Pursue, G0008 Hilton) still ACTION: send, waiting on Brian. State cursors advanced, grade recorded, no Sendblue alert (no Brian action needed).
- 2026-05-29 02:34 ET Claude kerri-inbox-sweep — quiet sweep, no new external inbound. Reconciled H0015 ATOMS jobs.json status pending→sent so the local ledger matches the already-✅-prefixed Google Task and the Brian-interactive send recorded above. State + grade saved; no Sendblue alert (no Brian action needed).
- 2026-05-29 21:50 ET Claude kerri-gap-sweep first independent run — A/B/D/E/F/G(tracked)/H/I clean. 3 material findings (C1 registry runner-attribution drift after Codex→Claude migration, C3 missing `## Runner` sections on 4 core canonical prompts per CLAUDE-ROUTINES.md L35, G1 gap-sweep ledger not gitignored) bundled into PR https://github.com/Brianderario/kerrios-agent-brain/pull/1 for Brian review. Ledger written to data/gap-sweep-state.json (untracked on main; gitignore line is part of the PR). 0 auto-fixes, 0 new MG tasks. Sendblue text alert failed (same missing-config gap NOW.md already tracks).
- 2026-05-29 Brian approved + Kerri SENT the H0015 ATOMS / Shiv Patel post-call follow-up from brian@hardwarefyi.com (signed Brian), cc Benji + Kerri. Task U3YwM05iRWpqNTMyM2NGQg closed as sent. reply_email hit Graph ErrorInvalidIdMalformed (tool bug) → fell back to subject-threaded send_email. NEW STANDING RULE from Brian: every post-call client follow-up sends from Brian, never Kerri — recorded in brain/wiki/workflows/draft-learnings.md + log.md + Claude memory. ⚠️ FOLLOW-UP: fix the malformed-ID bug in brian-hardwarefyi-email reply_email/createReplyAll path.
- 2026-05-29 07:00 ET Claude kerri-morning-brief ran — HTML brief written (output/morning-brief/2026-05-29.html + latest.html) and emailed kerri@hardwarefyi.com → brian@kerrihq.com. 2 meetings (Romano tax 12:00, Ari/Sara-Axios 15:00), Chase $205.19 / 5 txns yesterday, 11 pending tasks (7 highlighted). Required Sendblue text heads-up FAILED again due missing config — recurring failure already tracked in open SUGGESTION task Sk41OXVfbGxqYVlndUNUUw. State, grade, brain/log updated.

## Next action
- Wait for Brian approval/edit/skip on H0034 Jiga + H0021 Flow. (H0015 ATOMS is DONE — sent from Brian 2026-05-29, do not re-send.) Get Brian's go-ahead on item 5 (prompt wiring via PR). Brian to review gap-sweep PR #1 (https://github.com/Brianderario/kerrios-agent-brain/pull/1) for the runner-attribution + Runner-section + ledger-gitignore bundle.

## Decisions waiting on Brian
- Item 5: wire package playbook into the automation prompts (PR)?
- Gap-sweep PR #1: review runner-attribution + `## Runner` section + ledger gitignore changes.

## Notes
- codex sync test 2026-05-28 16:30:03 EDT
- Update the three lines above (Last action / Next action / Last touched) before you stop. That's the handoff.
