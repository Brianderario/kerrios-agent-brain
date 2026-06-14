# Self-Improve: 2026-06-14

scope: self-improvement · updated: 2026-06-14 · author: Kerri (automated)

First real self-improve page (prior weeks were no-op / pre-data). Headline: the autonomy scorecard is being polluted by three measurement-integrity bugs, not by real Brian corrections. Only 3 of 18 flagged "edits" are genuine content edits, and all 3 are already captured in draft-learnings. No new writing patterns; no class at promotion threshold.

## Scorecard snapshot

| Action class | Sent | Skipped | Unedited % | Edited | Incidents | Days | Tier | Readiness |
|---|---|---|---|---|---|---|---|---|
| internal-recipient-reply | 20 | 0 | 33.33% | 12 | 0 | 2 | auto-logged | NOT READY |
| scheduling-logistics-reply | 0 | 4 | n/a | 0 | 0 | 0 | ask | NOT READY |
| warm-thread-holding-reply | 6 | 3 | 66.67% | 2 | 0 | 1 | ask | NOT READY |
| sponsor-substantive-reply | 7 | 1 | 71.43% | 2 | 0 | 2 | ask | NOT READY |
| pipeline-nudge | 4 | 0 | 75% | 1 | 0 | 1 | ask | NOT READY |
| renewal-draft | 0 | 0 | n/a | 0 | 0 | 0 | ask | NOT READY |
| cold-send | 1 | 0 | 100% | 0 | 0 | 0 | ask-batch | NOT READY |
| gmail-draft-only | 0 | 3 | n/a | 0 | 0 | 0 | brian-sends | NOT READY |

Thresholds: 14+ days, 10+ sends, 95%+ unedited, 0 incidents. **No class meets any threshold** — the data is too young (max 2 days covered) and, more importantly, the edit-rate signal is corrupted (see below). Zero incidents across all classes.

## Edit patterns found

18 sent jobs were flagged `originalDraft !== sentDraft`. On inspection only **3 are real Brian content edits**; the other 15 are `sentDraft` bookkeeping stubs (see measurement bug #3). None of the 3 real edits is a *new repeated* pattern — each is already a documented draft-learnings rule:

### Pattern: soften / shorten the closing CTA on renewal + nudge sends
- **Action class:** renewal-outreach (H0034), pipeline-nudge (H0122)
- **What Brian changes:** drops the proactive "I'll put a few options together" / specific-price recommendation and the Calendly link; replaces with a light "let me know if you'd be interested" close.
- **Status:** already in draft-learnings — covered by [2026-06-11 MFG Flow H0122] (mirror what was actually sent, Calendly only when the ask is a meeting), [2026-06-12 weekly review] (match length to inbound; relationship-context pull), and [2026-05-25 H0001] (Calendly only on meeting offers). No new rule.

### Pattern: prefer contractions (conversational tone)
- **Action class:** warm-thread-holding-reply (H0028)
- **What Brian changes:** "I am happy" → "I'm happy", "that is" → "that's".
- **Status:** single instance, not a repeated pattern. Already covered in spirit by the [2026-05-24] voice.md baseline reset (don't sterilize / keep conversational). No new rule.

**Conclusion:** no new safe writing rules to append to draft-learnings this week.

## Prompt-fix proposals

All three findings are measurement-integrity bugs in the trust-scoring path, not writing rules. They are deliberately surfaced here (not auto-applied) because the scorecard feeds the autonomy-promotion gate — touching it is gate-adjacent and belongs to Brian/a PR, not to this read-only routine.

1. **`sentDraft` stub placeholders are counted as edits** (`scripts/autonomy-scorecard.mjs` + `kerri-inbox-sweep`).
   `autonomy-scorecard.mjs:113-117` treats any `originalDraft !== sentDraft` as an edit. But the inbox-sweep writes redaction/bookkeeping stubs into `sentDraft` for internal + manually-sent jobs — e.g. `<sent — internal reply, retained in kerri@ thread>`, `<sent>`, `<same as originalDraft>`, `<sent manually by Brian via Console approval; body retained...>`. These are NOT Brian edits, yet they inflate `editedCount` and crater `uneditedRate`. This single bug is why `internal-recipient-reply` reads 33% (12 "edits") — nearly all 12 are stubs.
   - **Fix A (preferred, at the source):** when an internal reply is sent unedited, write `sentDraft = originalDraft` so it scores as unedited. When the body is genuinely redacted for privacy, leave `sentDraft = null` (the scorecard already treats null as unmeasurable) instead of a stub string.
   - **Fix B (defensive, in the scorecard):** treat single-line bodies matching `/^[<(]\s*(sent|same as|internal|auto-logged)/i` as unmeasurable, not edited.

2. **`renewal-outreach` is invisible to the scorecard** (actionClass tagger vs `data/autonomy-policy.json`).
   2 sent jobs (incl. H0034) carry actionClass `renewal-outreach`, but the policy + scorecard class is `renewal-draft`. The mismatch means renewal sends are counted in NO class — the `renewal-draft` row shows 0 sends while real renewal sends exist. Fix: align the tagger to emit `renewal-draft` (or rename the policy class), one canonical spelling.

3. **25% of sent jobs carry no actionClass at all.**
   13 of 53 sent jobs have `actionClass = (none)`, so they never enter the scorecard. The trust evidence is built on 40 of 53 sends. Fix: make the inbox-sweep require an actionClass tag before a job can reach `status: sent`, and backfill `(none)` jobs where the class is inferable from prefix/subject.

Net effect once fixed: the 95%-unedited gate becomes meaningful. Today it is structurally unreachable for `internal-recipient-reply` because stubs guarantee a low rate regardless of Brian's actual behavior.

## Promotion candidates

No classes at promotion threshold. Every class fails on `daysCovered` (max 2 < 14) and/or `totalSent` (< 10), and the edit-rate signal is not yet trustworthy (see proposals). No candidate page written this run.

## Meta: routine improvements

- The edit-pattern scan needs a stub filter of its own — this run, 15 of 18 flagged "edits" were `sentDraft` bookkeeping markers, which wasted analysis budget and would mislead a less careful run into inventing patterns from redaction artifacts. Until proposal #1 lands at the source, future self-improve runs should pre-filter sent jobs whose `sentDraft` is a single-line `<...>`/`(...)` marker before diffing.
- The scorecard's `daysCovered` will stay tiny until jobs accumulate; the 14-day gate is the binding constraint for now, so promotion is simply not in reach yet regardless of edit quality. Expect no promotion candidates for at least ~2 more weeks of steady sends.
- Self-improve is doing its job: this week it caught measurement bugs that would otherwise have silently blocked every autonomy promotion. That is higher-value than any individual writing rule would have been.
