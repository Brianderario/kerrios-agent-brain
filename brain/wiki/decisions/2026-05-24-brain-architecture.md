# Decision: KMG Brain Architecture (LLM Wiki on Git)

scope: decision · updated: 2026-05-24 · author: Kerri (drafted) + Brian (approved verbally)

## Decision

KMG's company brain and intelligence layer is built as a **Karpathy-style LLM wiki on Git**, with the existing private repo `Brianderario/kerrios-agent-brain` as canonical source. No Notion. No SaaS knowledge base. No bespoke database until file-grep demonstrably fails.

## Two layers

1. **The brain (durable, canonical):** this git repo. Markdown wiki + JSON seeds + agent prompts. All teammates' agents clone it.
2. **The intelligence layer (fast, regenerable):** a future MCP (`kerrios-brain-mcp`) that builds an SQLite + sqlite-vec index over the local clone for semantic search. **Not built yet.** Trigger: file-grep takes >2s per query OR brain exceeds ~50 wiki entities.

## Why this over the alternatives

- **Notion:** retired 2026-05-16. Not coming back.
- **Postgres / hosted DB:** schema migration overhead, hosting bill, vendor risk, no free audit log. Premature complexity for 3-person team.
- **SaaS knowledge base (Coda, Slab, etc.):** vendor lock-in, kills agent multi-player without bespoke API work.
- **Obsidian Sync / Drive sync:** works for humans, doesn't give agents a clean read protocol or branch-based approval.
- **Pure git markdown:** chosen. Cheap, auditable, agents speak it natively, survives vendor changes, scales to small-team multi-player.

## Multi-player model

Each teammate (Brian, Ari, Benji) has a local clone. Routine writes commit directly to `main`; material writes go through PR review by the affected domain owner. S/W content stays in `brain/.local/` (gitignored). See [[multi-agent-write-rules]].

## What stays out of git

Runtime state: `data/jobs.json`, `data/job-counters.json`, `data/gtasks-lists.json`, `data/kerrios.json`, `.env`, anything per-machine. Gitignore handles this.

## What's in scope for the repo

- `brain/` — the wiki (people, companies, properties, deals, decisions, workflows, meetings, agents)
- `brain/raw/` — append-only evidence
- `brain/candidates/` — uncertain/conflicting claims pending review
- `agent-prompts/` — canonical SKILL.md files for every team agent (sweep, kerri-skill, brain-push, etc.)
- `data/kerrios.agent-seed.json` — sanitized structured seed
- `scripts/` — brain-compile, agent-seed-export, lint

## Maintenance promise (Brian's rule, 2026-05-24)

> "No dead builds or databases."

Mechanism: the brain stays alive because **every agent action writes back to it**. Sweep learnings → `draft-learnings.md`. Meeting recaps → `meetings/`. Decisions (like this one) → `decisions/`. Nightly `kerri-brain-push` task commits + pushes. Weekly Friday lint flags decay.

## Open items

- Provision per-laptop git config for Ari + Benji when their agents activate.
- Decide trigger thresholds for splitting into `kerrios-brain-finance` (Ari) and per-property repos.
- Build the `kerrios-brain-mcp` intelligence MCP when file-grep latency justifies it.
- First lint pass scheduled for first Friday after rollout.

## Related

- [[llm-wiki-pattern]] — the Karpathy pattern this implements
- [[agent-brain-protocol]] — exact read/write contract
- [[multi-agent-write-rules]] — how team agents share the brain
- [[2026-05-23-kerrios-rebuild]] — the prior rebuild this extends
