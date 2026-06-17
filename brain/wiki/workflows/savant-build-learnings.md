# Savant Build Learnings

scope: workflow · created: 2026-06-17

The code-side learnings store for Savant ([[../properties/savant]] / `kerrihq-rails`). The compound step of the build loop ([[../../../agent-prompts/build-loop/SKILL.md]] Phase 6) appends here after every item, and reads this page during brainstorm so past lessons shape new work before any code is written. This is the [[compound-engineering]] two-tier model in practice; it is the code-side sibling of [[draft-learnings]] (email).

Two kinds of entry live here, and they age differently:

- **Learning** = one solution to one past problem (a bug fix, a convention discovered, a workflow that worked). Incident-level. Append freely; never edit an earlier entry.
- **Pattern doc** = a rule generalized from several Learnings. Higher leverage, higher risk when stale. Promote a Learning into the Patterns section only after several incidents point the same way, never from a single case. Review Patterns for freshness; Learnings need no upkeep.

## Learning format

```
## [YYYY-MM-DD] <module/area> — <one-line title>
**Problem:** what broke or was unclear, with the production evidence.
**Fix:** what was actually done (commit SHAs welcome).
**Lesson:** the durable takeaway the next agent should carry, in one or two sentences.
**Tags:** area keywords for retrieval (e.g. migrations, authz, api-compat, n+1, deploy).
```

Keep each entry plain enough that Don could read it cold and a future agent could grep it. The date lives in the entry, not a filename.

---

<!-- Learnings appended below by the build loop (newest at the bottom). No entries yet. -->

## Patterns (generalized from multiple Learnings)

<!-- Promote a rule here only after several Learnings above point the same way. Each pattern cites the Learnings it came from. None yet. -->
