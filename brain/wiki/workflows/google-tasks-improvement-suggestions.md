# Google Tasks Improvement Suggestions

scope: workflow · updated: 2026-05-26

Google Tasks is also the approval rail for Kerri/Codex build and workflow improvements.

## Rule

Any Kerri runner, including interactive Claude Code sessions, may create a Kerri MG task when it finds a concrete improvement to the KerriOS build, prompts, data files, approval flow, or automation behavior.

Use this only after checking the current canonical prompt/runtime state. Do not carry forward a Claude-era suggestion just because it exists in a task list. First classify it:

- `relevant` — current KerriOS still has the gap.
- `already-solved` — current KerriOS already covers it.
- `obsolete` — the old suggestion assumes a retired runner, file, cadence, or state shape.
- `needs-human-policy` — the change affects pricing, legal, finance, send authority, identity, or another approval boundary.

## Task Format

List: Kerri MG.

Title:

```text
💡 SUGGESTION: <short noun phrase>
```

Notes:

```text
ACTION: discuss

━━━ OBSERVED ━━━
<specific evidence: task id, job id, prompt section, run result, Brian correction, or repeated miss>

━━━ BUILD RELEVANCE ━━━
Status: <relevant | already-solved | obsolete | needs-human-policy>
Source runner: <Claude Code interactive | kerri-inbox-sweep | kerri-morning-brief | etc.>
Current file(s): <canonical prompt/workflow/data file checked>

━━━ PROPOSED ━━━
<the concrete change>

━━━ COST / RISK ━━━
<one line>
```

## Dedup And Noise Rules

- Scan open Kerri MG `💡 SUGGESTION:` tasks before creating a new one.
- Max one new suggestion per scheduled run or interactive session unless Brian explicitly asks for a full audit.
- Do not create suggestion tasks for vague style preferences, speculative refactors, or ideas that cannot name the current file or behavior they change.
- Close or mark obsolete suggestions once the relevance check shows the current build already solved them.

## Approval Semantics

- `ACTION: discuss` means Brian has not approved implementation yet.
- `ACTION: apply` means Brian approved the change in principle. Scheduled runners should still not edit code; they should surface the approved item for an interactive implementation run.
- Interactive Claude Code may implement an approved or directly requested suggestion when it is within the current task scope and does not cross an approval boundary.
- Completed suggestion tasks should be reflected in `brain/log.md` when the implementation changes prompts, workflow docs, data shape, or automation behavior.

## Draft Redo Provenance

When an interactive Claude Code/Kerri session rewrites a Google Tasks DRAFT block, it must also update the matching `data/jobs.json` entry's `originalDraft` in the same flow and add a short provenance line in the task notes:

```text
DRAFT SOURCE: Claude Code interactive redo at <YYYY-MM-DD HH:MM ET>
```

If the session cannot sync `jobs.json`, it must leave the task unapproved and flag the sync gap. The inbox sweep must not treat a DRAFT diff caused by a Kerri/Codex redo as a Brian edit or turn it into a `draft-learnings.md` rule.
