# Self-Improve: 2026-06-28

scope: self-improvement · updated: 2026-06-28 · author: Kerri (automated)

Weekly automated self-improve run. Builds on [[2026-06-21-self-improve]], [[2026-06-17-self-improve]], and [[2026-06-14-self-improve]]. Headline: **still zero incidents across all 8 classes** (the safety record now holds ~18 days), no class at promotion threshold, and **one genuinely-new, mechanizable writing miss this period — Kerri drafts in a stiff expanded register (`there is` / `Let us` / `you are` / `I will`) and Brian restores contractions across multiple classes.** The two systemic fixes carried since 6/14 and 6/21 are **both still unshipped**: the scorecard script is unchanged since 2026-06-09 (3 measurement bugs, now 4th week), and the placeholder-token lint check (6/21 proposal #1) never landed in `presend-lint.mjs`.

## Scorecard snapshot

| Action class | Sent | Skipped | Unedited % | Edited | Incidents | Days | Tier | Readiness |
|---|---|---|---|---|---|---|---|---|
| internal-recipient-reply | 40 | 1 | 36.84% | 24 | 0 | 15 | auto-logged | NOT READY |
| scheduling-logistics-reply | 2 | 8 | 100% | 0 | 0 | 8 | ask | NOT READY |
| warm-thread-holding-reply | 7 | 12 | 57.14% | 3 | 0 | 7 | ask | NOT READY |
| sponsor-substantive-reply | 17 | 7 | 53.33% | 7 | 0 | 15 | ask | NOT READY |
| pipeline-nudge | 7 | 4 | 57.14% | 3 | 0 | 16 | ask | NOT READY |
| renewal-draft | 0 | 0 | n/a | 0 | 0 | 0 | ask | NOT READY |
| cold-send | 2 | 0 | 100% | 0 | 0 | 5 | ask-batch | NOT READY |
| gmail-draft-only | 2 | 10 | 0% | 2 | 0 | 1 | brian-sends | NOT READY |

Thresholds: 14+ days, 10+ sends, 95%+ unedited, 0 incidents. **No class meets all four.** Two classes now clear the 14-day window (`internal-recipient-reply` 15d, `sponsor-substantive-reply` 15d, `pipeline-nudge` 16d) but all fail the 95%-unedited gate — and those low unedited rates remain **corrupted by the still-unfixed stub-marker bug** (see Prompt-fix proposal #2). **Zero incidents across all classes** — the clean safety record held another week.

## Edit patterns found

42 sent jobs were flagged `originalDraft !== sentDraft`; after filtering bookkeeping/redaction stubs and empty `sentDraft` markers, **24 are real content edits**, but most are old jobs (6/10–6/18) already analyzed in prior runs. The genuinely-new edits this period (sent 6/22+) are: H531, G0031, H0189 (×2), H0157, H0496 (6/25), plus internal stubs. Two signals stand out.

### Pattern: stiff expanded register — Kerri avoids contractions, Brian restores them — NEW
- **Action class:** cross-class (pipeline-nudge + sponsor-substantive-reply)
- **Jobs affected:** H531 (Andustry, 6/24), H0157 (Renaud / Kinetic, 6/26), H0189 (Viam / Alyssa, 6/25)
- **What Brian changes:** restores contractions Kerri spelled out in full. H531: `there is`→`there's`, `Let us`→`Let's`, `you are`→`you're`. H0157: `that is easier`→`that's easier`. H0189: `I will`→`I'll`.
- **Inferred reason:** Kerri's default drafting register is one notch too formal — the expanded forms read like a press release, not how Brian talks. This is the **mechanical core of the "too clean / too sterile / butler-toned" note** already in voice.md (draft-learnings line 87), which warns against sterilizing tone but never names contractions as the concrete tell. It is a pure, deterministic, safe writing fix.
- **Proposed rule:** in external prose (and Brian-signed internal sends), default to contracted forms — `there's`, `let's`, `you're`, `I'll`, `that's`, `we'll`, `don't`, `it's`, `won't`. Reserve the expanded form only where the emphasis is deliberate. Codified below in draft-learnings.
- **Status:** NEW. Adjacent to the voice.md anti-sterile note but not previously codified as an explicit, checkable rule.

### Pattern: over-written warm follow-up (flattery + editorializing padding) — RECURRENCE, no new rule
- **Action class:** internal/warm follow-up (G0031, "Re: Intro call — Ari, Brian and David", 6/25)
- **Jobs affected:** G0031
- **What Brian changes:** cut the flattery and filler from a thank-you note — dropped "Thirty-five years in and you make it look easy," the "Ari and I are going to keep chewing on…" editorializing, and the "we're also going to look into SISO" line; tightened the close to "hope to see you at the next SISO!"
- **Status:** ALREADY COVERED — this is the trim-warm-replies cluster (draft-learnings [2026-06-15] venue reply, line 90; [2026-06-17] MFG Flow H0122 "too long for a warm contact," line 117). Flagged here only as a **documented rule still being re-corrected** (a STEP 2.4 / SKILL signal that the drafting path isn't applying the brevity rule to warm thank-yous).

**Recurring edit TYPE across classes (STEP 2b):** this week the dominant type is **tonal** — register stiffness (expanded forms, flattery padding) rather than the completion/factual last-mile misses that dominated 6/17–6/21. The contraction tell is the cleanest mechanizable instance and recurs across two classes, so it becomes ONE broad draft-learnings rule, not several narrow ones.

**Positive signal worth recording:** on H0189 (Viam, $300 budget), Kerri's *judgment* was right — steer the under-budget buyer to free editorial via Benji, name the $2–3K paid floor honestly, keep the door open. Brian's edit only **reordered** (lead with editorial as the recommendation, soften "underpowered") and kept every substantive call. The substance/strategy engine is sound; the gap this week was register, not reasoning.

## Prompt-fix proposals

1. **CARRIED (still open): land the three scorecard measurement-integrity fixes** first specified in [[2026-06-14-self-improve]] and re-queued 6/17 and 6/21. `scripts/autonomy-scorecard.mjs` is **still unchanged since 2026-06-09** (verified by git log this run). (a) stub/empty `sentDraft` strings counted as edits — write `sentDraft = originalDraft` when sent unedited, `null` when redacted; (b) `renewal-outreach`/`renewal-reengagement` actionClass vs the policy's `renewal-draft` class — one canonical spelling; (c) sent jobs carrying `actionClass = (none)` (this run: G0031, H0059) never enter the scorecard. Until (a) lands, the unedited rates on `internal-recipient-reply` (36.84%) and `sponsor-substantive-reply` (53.33%) are measurement artifacts and the 95%-unedited promotion gate stays structurally unreachable. **Code change → belongs to Brian / a PR; this read-only routine does not modify the script.**

2. **CARRIED (still open): add the placeholder-token check to `scripts/presend-lint.mjs`** (6/21 proposal #1). Verified this run: the lint gate still has no `[PASTE …]`/`[INSERT …]`/all-caps-bracket check (last touched 2026-06-19). The G0023 miss remains a memory-only rule (draft-learnings [2026-06-21]) instead of a mechanical block. Pure pattern test, same class as the existing em-dash and attachment-promise checks. **Code change → belongs to Brian / a PR.**

3. **NEW (codified this run, no code needed): contraction-default writing rule** appended to draft-learnings (see Step 4). Optionally, a future `presend-lint.mjs` soft-warn could flag a Brian-signed body with 2+ spelled-out contraction candidates (`\b(there|here|let|you|we|i|it|that|what|who) (is|are|will|us|am|would|had|have)\b` in conversational position) — lower priority than #1/#2 and easy to over-trigger, so a drafting-time rule is the primary fix.

## Promotion candidates

No classes at promotion threshold. `internal-recipient-reply`, `sponsor-substantive-reply`, and `pipeline-nudge` now clear the 14-day window but all fail the 95%-unedited gate (corrupted by the stub bug, proposal #1). Zero incidents everywhere. No candidate page written this run.

## Meta: routine improvements

- **The scorecard's headline numbers are still untrustworthy and that is now a 4-week-old, twice-re-queued blocker.** Three consecutive self-improve runs (6/14, 6/21, 6/28) have flagged the same three measurement bugs; the script has not moved. The binding constraint on autonomy promotion is no longer Kerri's behavior or even `daysCovered` — it is that **proposal #1 keeps being written and never shipped**. Recommend Brian treat the scorecard fix as the single highest-leverage build item: until it lands, every weekly run will keep reporting fake unedited rates and no class can ever cross the gate, regardless of real performance.
- **Signal quality this week was good without the scorecard's help.** The edit-pattern scan, pre-filtering stubs programmatically over `data/jobs.json`, surfaced a real, clean, mechanizable pattern (contractions) that the corrupted scorecard rates would have buried. The manual diff scan continues to be the load-bearing part of this routine.
- **Edit type rotated from completion/factual (6/17–6/21) to tonal/register (6/28).** The last-mile completion misses did not recur this period (no new placeholder tokens, no missing attachments in the new sends) — consistent with the Definition-of-Done gate taking hold. The remaining gap moved up the stack to voice register, which is a healthier place to be.
