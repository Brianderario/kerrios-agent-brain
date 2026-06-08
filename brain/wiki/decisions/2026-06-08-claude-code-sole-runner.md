# Decision: Claude Code Sole Runner

scope: decision · created: 2026-06-08 · author: Brian + Kerri

## Decision

Claude Code is the sole operating runner for all Kerri scheduled routines and interactive work, effective 2026-06-08. Codex is retired. This supersedes [[2026-05-25-codex-primary-operating-layer]] and the 2026-06-05 Codex re-entry.

## Context

Brian switched between Claude Code and Codex several times (Claude original → Codex 2026-05-25 → Claude migration 2026-05-29 → Codex re-entry 2026-06-05). On 2026-06-08, Brian confirmed he will permanently run Claude Code. The back-and-forth created documentation drift and operational complexity (cross-runner sync, double-run risk, Codex MCP availability issues). Consolidating to a single runner eliminates all of that.

## What changed

- **10 Claude Code scheduled tasks** now cover the full operating bundle: `kerri-inbox-sweep`, `kerri-morning-brief`, `kerri-morning-brief-retry`, `kerri-eod-meetings-review`, `kerri-brain-push`, `kerri-gap-sweep`, `kerri-lead-research`, `kerri-cold-outreach`, `kerri-pipeline-followup`, `standard-works-issue-writer`.
- **Codex automations** under `~/.codex/automations/` should be disabled to prevent double-runs.
- **Documentation updated:** `CLAUDE-ROUTINES.md`, `automations.md`, `registry.md`, `kerri.md`, `KerriOS CLAUDE.md`, `NOW.md` all reflect Claude Code as sole runner.
- **Cross-runner sync simplified:** no more Claude ↔ Codex handoff language. `NOW.md` is a session baton, not a runner-handoff baton.
- **Operational benefit:** the S&W Superhuman connector and kerri@hardwarefyi.com custom MCP, which were repeatedly failing in Codex, are available in Claude Code.

## What didn't change

- Approval gates, send rules, S&W boundary, Customer ID Protocol — all unchanged.
- Canonical prompts still live in `agent-prompts/*/SKILL.md` — runner-agnostic.
- The git brain + NOW.md pattern still works the same way across sessions.
- Codex `::inbox-item` / `::archive` closing directives remain in canonical prompts as historical artifacts; Claude Code shims skip them.

## Related

- [[2026-05-25-codex-primary-operating-layer]] (superseded)
- [[2026-05-23-kerrios-rebuild]]
- [[2026-05-24-brain-architecture]]
