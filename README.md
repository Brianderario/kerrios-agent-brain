# KerriOS

KerriOS is the durable company brain for Kerri Media Group agents.

Scope of this repository (updated 2026-05-24):

- the Karpathy-style LLM wiki (`brain/`) — people, companies, properties, decisions, workflows, agents, meetings, deals
- canonical agent prompts (`agent-prompts/`) — every team agent's SKILL.md, so prompt evolution lives in git history
- sanitized structured seed (`data/kerrios.agent-seed.json`) for fast cross-cutting context
- supporting scripts (`scripts/`) — export, lint, future brain compilation

Not in scope: runtime state (jobs queue, counters, live data store), credentials,
text-message plumbing, S/W internal content. Those stay local-only (gitignored)
on individual laptops.

See `brain/wiki/workflows/llm-wiki-pattern.md` for the architecture pattern,
`brain/wiki/workflows/multi-agent-write-rules.md` for how the team shares this brain.

## Quick Start

```bash
npm run export:agent-seed
npm test
```

## Agent-Readable GitHub Seed

This repository is safe to share with approved agents through a private GitHub
repo when the live local store is excluded.

- `data/kerrios.agent-seed.json` is the sanitized company-memory seed.
- `data/kerrios.json` is the local live store and is intentionally ignored.
- `data/.kerrios-api-token.local`, `.env*`, runtime logs, browser profiles, and
  generated `output/` exports are intentionally ignored.

The agent seed keeps company/property/core memory while removing person profiles,
personal-assistant records, conversations, proposals, approvals, audit logs,
emails, phone numbers, Slack IDs, local home paths, credential-like fields, and
old runtime notes.

Agents should read:

1. `AGENTS.md`
2. `brain/AGENTS.md`
3. `brain/index.md`
4. `brain/routing.md`
5. `data/kerrios.agent-seed.json` for structured company context

The private GitHub repo is for agent accessibility and versioning. The live
KerriOS store remains local unless Brian explicitly promotes a reviewed seed
back into production.

## Mental Model

```text
Approved agent
  -> read AGENTS.md
  -> read brain/index.md and brain/routing.md
  -> load data/kerrios.agent-seed.json only as needed
  -> cite sources and propose compact updates
```

## Safety Defaults

- Do not commit personal-life data.
- Do not commit raw emails, transcripts, logs, credentials, or local runtime state.
- Do not treat this repo as approval to send email, mutate CRM, make purchases,
  change legal/finance details, or edit permissions.
- Keep updates compact, source-linked, and reviewable.
