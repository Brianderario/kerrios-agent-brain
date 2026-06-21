# Self-Improve: 2026-06-21

scope: self-improvement · updated: 2026-06-21 · author: Kerri (automated)

Weekly automated self-improve run. Builds on [[2026-06-17-self-improve]] (working-relationship retro) and [[2026-06-14-self-improve]] (first scorecard, three measurement bugs). Headline: **zero incidents across all 8 classes**, no class at promotion threshold, and one genuinely-new mechanizable miss — drafts shipping with an unresolved `[PASTE … LINK]` placeholder token (job G0023). The three scorecard measurement bugs flagged 6/14 and re-queued 6/17 are **still unfixed** (script untouched since 6/09), so `internal-recipient-reply`'s 41% remains structurally meaningless.

## Scorecard snapshot

| Action class | Sent | Skipped | Unedited % | Edited | Incidents | Days | Tier | Readiness |
|---|---|---|---|---|---|---|---|---|
| internal-recipient-reply | 36 | 0 | 41.18% | 20 | 0 | 9 | auto-logged | NOT READY |
| scheduling-logistics-reply | 1 | 6 | 100% | 0 | 0 | 0 | ask | NOT READY |
| warm-thread-holding-reply | 7 | 6 | 57.14% | 3 | 0 | 7 | ask | NOT READY |
| sponsor-substantive-reply | 11 | 4 | 60% | 4 | 0 | 8 | ask | NOT READY |
| pipeline-nudge | 4 | 2 | 75% | 1 | 0 | 1 | ask | NOT READY |
| renewal-draft | 0 | 0 | n/a | 0 | 0 | 0 | ask | NOT READY |
| cold-send | 2 | 0 | 100% | 0 | 0 | 10 | ask-batch | NOT READY |
| gmail-draft-only | 3 | 7 | 33.33% | 2 | 0 | 3 | brian-sends | NOT READY |

Thresholds: 14+ days, 10+ sends, 95%+ unedited, 0 incidents. **No class meets all four.** Every class fails on `daysCovered` (max 10 < 14) and/or `totalSent`, and the low unedited rates are still corrupted by the stub-marker bug below. **Zero incidents across all classes** — the safety record held another week.

## Edit patterns found

32 sent jobs were flagged `originalDraft !== sentDraft`. On inspection, **23 are `sentDraft` bookkeeping/redaction stubs or empty strings** (the same measurement bug as 6/14, still unfixed), and several more of the "real-looking" ones (G0020, H0104, H0059) were sent empty or manually via Console, so they are not measurable content edits. After filtering, the genuinely-new Brian content edits this period are **two**, plus the three already analyzed 6/14 (H0034, H0028, H0122).

### Pattern: unresolved `[PASTE … LINK]` placeholder token left in a finished body — NEW
- **Action class:** gmail-draft-only (G0023, "Re: Meeting with Phil Strazzulla")
- **Jobs affected:** G0023
- **What Brian changes:** the draft read "Kinetic … at `[PASTE KINETIC LINK]`, and Future Proof … at `[PASTE FUTURE PROOF LINK]`." Brian filled the real URLs (`https://kinetic.hardwarefyi.com/`, `https://futureproofhq.com/festival/`) before sending.
- **Inferred reason:** the body was otherwise complete and on-voice — this is not the empty-placeholder follow-up failure (rule [2026-06-17]). It is a narrower, **mechanically-detectable** wrinkle: a literal bracketed `[PASTE …]`/`[INSERT …]` token survived into the approval-ready draft instead of being resolved (or escalated) at draft time. Both links were trivially knowable.
- **Proposed rule:** never let a draft reach the approval queue containing a bracketed placeholder token (`[PASTE …]`, `[INSERT …]`, `[LINK]`, `[TBD]`, `[XXX]`). Resolve the real value before drafting, or, if genuinely unknown, ask Brian for that one fact rather than shipping the placeholder. Codified below in draft-learnings.
- **Status:** NEW. The existing [2026-06-17] post-call rule covers *empty* "I'll send details later" follow-ups; it does not cover a placeholder token embedded in an otherwise-finished body.

### Pattern: known fact + owed attachment left for Brian to fill — recurring (no new rule)
- **Action class:** sponsor-substantive-reply (H0496, "Hardware FYI – Media Kit, Pricing + Recap")
- **Jobs affected:** H0496
- **What Brian changes:** added the SF happy-hour date ("End of July") and attached the media kit + happy-hour guest list — both knowable/holdable at draft time.
- **Status:** already covered — this is the [[feedback_definition_of_done_gate]] / [[feedback-attach-what-you-have]] cluster and the [2026-06-17] post-call protocol. Reinforces, does not extend. Flagged here because it shows a documented rule **still being re-corrected**, i.e. the drafting path isn't applying it consistently yet (SKILL STEP 2.4 signal).

**Recurring edit TYPE across classes (STEP 2b):** the dominant type remains **completion/factual** — Kerri ships with an unresolved value (placeholder URL, missing date, missing attachment) that Brian fills. This is the same last-mile thesis as the 6/17 retro, now with a concrete mechanizable instance (G0023). The secondary type is **removal** (drop Calendly link / proactive pricing CTA on warm/nurture sends — H0034, H0122), already fully covered in draft-learnings.

## Prompt-fix proposals

1. **Add a deterministic placeholder-token check to `scripts/presend-lint.mjs`** (the existing PreToolUse lint gate). Add a sixth check to `runChecks()` that hard-blocks any outbound body matching roughly `/\[\s*(paste|insert|link|url|tbd|xxx|placeholder|name|date)\b[^\]]*\]/i` or an all-caps bracketed token `/\[[A-Z][A-Z _]{2,}\]/`. This is a pure pattern test, exactly the class of rule the gate already enforces (em-dash, "the Industrialist", attachment-promise). It converts the G0023 miss into a mechanical block instead of relying on memory. **Code change → belongs to Brian / a PR; this read-only routine does not modify the hook.** Note: a mid-session hook edit needs one `/hooks` reload to activate (per [[presend_lint_gate]]).

2. **Land the three scorecard measurement-integrity fixes from [[2026-06-14-self-improve]]** (still open as of today — `scripts/autonomy-scorecard.mjs` is unchanged since 2026-06-09, and 6/17 retro item 6 re-queued them as build work that hasn't shipped): (a) stub `sentDraft` strings counted as edits — write `sentDraft = originalDraft` when sent unedited, `null` when redacted; (b) `renewal-outreach`/`renewal-reengagement` actionClass vs the policy's `renewal-draft` class — one canonical spelling; (c) 16 of 83 sent jobs carry `actionClass = (none)` and never enter the scorecard. Until (a) lands, `internal-recipient-reply`'s 41% is a measurement artifact (≈20 of its 20 "edits" are stubs), and the 95%-unedited promotion gate is structurally unreachable regardless of Kerri's real behavior.

## Promotion candidates

No classes at promotion threshold. Every class fails on `daysCovered` (max 10 < 14) and/or `totalSent` (< 10), with zero incidents but corrupted unedited-rate signal. No candidate page written this run.

## Meta: routine improvements

- **The edit-pattern scan is still doing real work the scorecard can't:** 23 of 32 flagged "edits" this run were stub/empty `sentDraft` markers. A naive run would invent patterns from redaction artifacts. Until proposal #2(a) lands at the source, future self-improve runs must keep pre-filtering single-line `<…>`/`(…)`/empty `sentDraft` bodies before diffing (the coarse filter this run still let three through — G0020/H0104/H0059 — caught only on manual inspection; a tighter filter would also drop empty-string and the long "sent manually by Brian via Console" stub).
- **The binding constraint stays `daysCovered`/`totalSent`, not edit quality.** Promotion is not in reach for any class for at least ~1 more week of steady sends; the 14-day window only just became achievable for cold-send (10d) and internal-recipient-reply (9d).
- **Recurrence is the real signal this week:** the same last-mile/completion miss the 6/17 retro made its headline thesis showed up again (G0023, H0496) despite being codified in the Definition-of-Done gate. The fix is not another rule — it is enforcement (proposal #1 makes the placeholder half mechanical) plus the drafting path actually running the DoD gate before queueing.
