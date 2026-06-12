# Console Improvement Suggestions (💡)

scope: workflow · updated: 2026-06-12 (Brian-directed approve/deny redesign; was "Google Tasks Improvement Suggestions")

The KMG Console tasks board is the approval rail for Kerri build and workflow improvements. Brian's standing direction (2026-06-12): **self-improvement is Kerri recommending and Brian approving or denying.** He moves fast and will not read an analysis essay or answer open-ended policy questions on a card. A suggestion card is a decision, not a discussion.

## Rule

Any Kerri runner, including interactive Claude Code sessions, may create a Kerri MG suggestion card when it finds a concrete improvement to the KerriOS build, prompts, data files, approval flow, or automation behavior.

Before filing, check the current canonical prompt/runtime state and classify:

- `relevant` — current KerriOS still has the gap.
- `already-solved` — current KerriOS already covers it. Do not file.
- `obsolete` — assumes a retired runner, file, cadence, or state shape. Do not file.
- `needs-human-policy` — the change affects pricing, legal, finance, send authority, identity, or another approval boundary. File it, but pick a recommended default (see below) and set `requires_interactive` when it touches send-authority surfaces.

## Card Contract (mandatory since 2026-06-12)

Title: `💡 SUGGESTION: <short noun phrase>`. Status: `needs_approval`.

Body leads with the decision, evidence comes after:

```text
ACTION: approve
(marking done applies this change; skipping denies it and Kerri will not re-raise it)

RECOMMENDATION
<one or two sentences: the exact change Kerri will make, in plain language>

WHY
<2-4 lines of evidence: run result, latency, repeated miss, Brian correction>

WHAT CHANGES
<file(s) + one-line description of each edit>

COST / RISK
<one line>
```

Rules for the body:

- **No open policy questions.** If the suggestion has a genuine fork (e.g. "should approved sends fire overnight?"), Kerri picks the safer option as the recommendation and states the alternative in one line ("If you'd rather X, skip this and say so"). Brian approves or denies; he does not fill in blanks.
- One card = one decision. Two independent changes = two cards.
- A suggestion that cannot name the file and behavior it changes does not get filed.

Every suggestion card MUST carry a machine-executable `on_complete` payload so approval is self-executing:

```text
scripts/console-task-api.mjs create ... --status needs_approval --on-complete-json '{"action":"agent_apply","params":{"summary":"<one-line change for the Console banner>","instructions":"<exact edit spec: file paths + edits + log line>","requires_interactive":<true|false>}}'
```

- `requires_interactive: false` — the next inbox sweep applies the change itself (edit, commit, push, `brain/log.md` line, then mark-applied).
- `requires_interactive: true` — REQUIRED when the change touches send-authority surfaces (`data/autonomy-policy.json`, `agent-prompts/kerri-inbox-sweep/SKILL.md`, `agent-prompts/kerri-skill/SKILL.md`, `agent-prompts/kerri-skill/references/email.md`, `agent-prompts/kerri-morning-brief/SKILL.md`) or harness permission config. Scheduled runs never self-modify those. On approval the sweep adds the item to `NOW.md` as a queued interactive apply, texts Brian once, and marks the decision acknowledged; the next interactive session applies it as a Brian-pre-approved change (explicit commit per multi-agent write rules).

The Console review page renders the payload as a banner ("When this is marked done: Kerri applies this change automatically…") so Brian sees the consequence before clicking. A suggestion card without an `on_complete` payload is a filing defect.

## Approval Semantics

- **Approve / mark done** = apply it. Non-interactive changes land within ~15 min (next sweep). Interactive-gated changes are queued and confirmed by text when applied.
- **Skip** = denied. The sweep marks the decision acknowledged, logs one `brain/log.md` denial line (with the skip reason if Brian gave one), and the suggestion is never re-filed. A materially NEW version of the idea (different evidence, different change) may be filed later; the same change may not.
- Completed suggestions are reflected in `brain/log.md` when the implementation changes prompts, workflow docs, data shape, or automation behavior.

## Dedup And Noise Rules

- Scan open Kerri MG `💡 SUGGESTION:` cards AND recent `brain/log.md` denial lines before creating a new one.
- Max one new suggestion per scheduled run or interactive session unless Brian explicitly asks for a full audit.
- No cards for vague style preferences or speculative refactors.

## Draft Redo Provenance

When an interactive Claude Code/Kerri session rewrites a Console card's DRAFT block, it must also update the matching `data/jobs.json` entry's `originalDraft` in the same flow and add a short provenance line in the task notes:

```text
DRAFT SOURCE: Claude Code interactive redo at <YYYY-MM-DD HH:MM ET>
```

If the session cannot sync `jobs.json`, it must leave the task unapproved and flag the sync gap. The inbox sweep must not treat a DRAFT diff caused by a Kerri redo as a Brian edit or turn it into a `draft-learnings.md` rule.
