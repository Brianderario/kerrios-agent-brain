---
name: 2026-06-11-console-brain-port
description: The Kerri Console now hosts a permissioned brain layer ported from KerriOS — knowledge records with provenance, domain/sensitivity grants, scoped agents, approval proof trails, and an idempotent KerriOS importer.
---

# Decision: Console hosts the permissioned brain (KerriOS port)

scope: decision · updated: 2026-06-11 · authority: Brian (implementation prompt, Codex Kerri Agent Master/00-shared-context/kerri-console-brain-port-implementation-prompt.md)

## What shipped

kerrihq-rails commit `77e061e` (branch `kerri/brain-port`, merged to main) adds the permissioned brain layer to the Console:

- **Domains + permission grants** — explicit per-user and per-agent access (domain, record kind, source, sensitivity ceiling, action list). Brian = master via owner membership; Ari = finance/legal breadth; Benji = Hardware FYI + content; Zach = Standard & Works only. Agents get the intersection of their own grants and their owner's.
- **Knowledge records** — durable facts imported from this repo with provenance (path, content hash, timestamps) and lifecycle (imported → candidate → canonical, stale, superseded). Candidates need human promotion.
- **Source registry** — 14 sources (this repo, tracker sheet, mailboxes, Granola, Beehiiv, Slack, ...) with sync policy + health.
- **Approval requests with proof trails** — first-class decision records for sends/pricing/finance/legal/publication/memory promotion; only the responsible human decides; execution proof recorded.
- **KerriOS importer** — dry-run/apply, idempotent, conservative: skips credentials, `data/` runtime state, frozen legacy company/people pages, agent prompts (AgentPromptSyncJob path unchanged), S&W internals, transcripts; raw/ imports pointer-only; secret-shaped strings scrubbed.
- **API** — `brain:*` and `approvals:*` scopes; agents read/write via `agent_slug` and are capped by their grants; agents can only file candidate memory.

## What this means for agents working in this repo

- This repo stays the **source of truth for prompts and durable how-we-work pages**; the Console mirrors the wiki as permissioned records via the importer (Sources → KerriOS Brain → Run import). Nothing about the write rules here changes.
- The Console approval queue (`/organizations/<org>/approval_requests` + API) is the audit lane for sensitive actions; the task board remains the day-to-day card surface.
- Full architecture + extension guide: `docs/brain-architecture.md` in kerrihq-rails.
