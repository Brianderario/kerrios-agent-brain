# Decision: Savant becomes the single company hub, end to end

scope: decision (material, architecture) · created: 2026-06-17 · owner: Brian · status: decided, build pending

## The decision

Brian's directive (2026-06-17, interactive): the brain should live fully in Savant ([[../properties/savant]] / `kerrihq-rails`), codified, with Savant as the central hub of the entire company end to end. This supersedes the read side of the 2026-06-11 storage split ([[2026-06-11-brain-console-storage-split]]), which kept how-we-work in the git brain and only mirrored a subset into Savant.

Two follow-on choices Brian made the same session:

1. **Scope: everything, end to end.** Both knowledge (decisions, workflows, notes, learnings, CRM context) and the agent operating layer (prompts, hooks, scheduled tasks) become Savant-owned.
2. **Git repo: kept as an automated backing store.** Savant is where everyone reads, writes, and authors. The git brain (`Brianderario/kerrios-agent-brain`) keeps running silently as version history plus the on-disk copy the runner needs. The direction of sync flips: today git -> Savant; target Savant -> git + disk.

## The one hard constraint (honest, not negotiable by preference)

"The brain" is two layers, and they move differently:

- **Knowledge** can live fully in Savant. It already partly does as `KnowledgeRecord`s. Making Savant the source of truth here is a real, achievable flip.
- **The agent operating layer** (the `SKILL.md` prompts, the `kerri-pull.sh` / `kerri-sync.sh` hooks, the scheduled tasks) is code that Claude Code physically loads from the filesystem at session start. A skill cannot be loaded out of a database. So "fully in Savant" for this layer means Savant **owns and authors** these records, with an automated **export-to-disk** so the runner still has files to load. Source of truth and authoring move to Savant; a synced disk copy stays because the engine requires it.

If we ever pretended prompts could run purely from the database, the agents would silently fail to load. The export-to-disk step is mandatory, not optional.

## Why (rationale)

This is the Savant Product Vision made structural ([[../properties/savant-product-vision]]): Savant as the company operating system, the team's single screen, with Brian as the one approval gate. One hub means: the team (Ari, Benji, Zach) reads and edits company knowledge through Savant's permissioned UI instead of a git repo they will never open; agents read one source instead of two; provenance, permissions, and audit live in one place. It maximizes revenue per Brian-hour by removing the split-brain coordination cost.

## What Savant already has (foundation, do not rebuild)

The `console-brain-port` work (kerrihq-rails) already shipped most of the engine:

- `KnowledgeRecord` model: kinds cover `workflow`, `decision`, `person`, `company`, `property`, `agent_instruction`, `operational_doc`, `memory`, `candidate_memory`, `source_pointer`, `raw_evidence`, `editorial_rule`, `approval_policy`. Status lifecycle `imported -> candidate -> canonical -> stale -> superseded` mirrors the git brain's candidate/canonical/raw distinction. Provenance fields + `source_system` + `source_path`.
- `BrainImport` + `KerriosImportJob` + `Kerrios::ImportService`: the idempotent importer (currently git -> Savant).
- `PermissionGrant` + `AgentSourceGrant` + `SensitivityLevels`: per-person and per-agent scoping (the multi-teammate moat).
- API: `/api/v1/knowledge_records` (index/show/create/update) + `/api/v1/knowledge_record_imports`.
- UI: `/brain` (knowledge_records index, by-domain, property cards, category sections).
- `download_brain_tool`: agents can already read the brain from Savant.

The missing work is the **flip** (Savant as source of truth, not mirror), **full coverage**, the **reverse exporter** (Savant -> git/disk), and the **operating-layer** representation.

## Build plan (phased; each phase ships independently and is reversible)

Git stays the intact fallback until the final phase, so nothing is one-way until we choose to make it so.

- **Phase 1 - Full knowledge coverage.** Extend `Kerrios::ImportService` so 100% of the git wiki, the Claude memory layer, and the new [[../workflows/compound-engineering]] + [[../workflows/savant-build-learnings]] pages land as `KnowledgeRecord`s with correct kind, status, sensitivity, and provenance. Verify: count parity (every git page maps to a canonical record; no orphans).
- **Phase 2 - Flip the read path.** Update the brain read order (this repo's `CLAUDE.md`, [[../workflows/agent-brain-protocol]], `brain/AGENTS.md`) so agents read from Savant's knowledge API / `download_brain_tool` first, with the git wiki as fallback. Verify: a representative agent (inbox sweep, build-loop) reads its routed pages from Savant correctly.
- **Phase 3 - Flip the write/authoring path.** New knowledge writes to Savant first (API/UI). Build the reverse exporter (Savant -> git wiki) so git stays a faithful backing store. `/brain` becomes the human read/edit surface. Verify: a write in Savant appears in the git wiki on the next sync.
- **Phase 4 - Operating layer into Savant.** Represent each `SKILL.md`, hook, and scheduled task as an `agent_instruction` / `operational_doc` record, and build the export-to-disk step (Savant -> `agent-prompts/` files + `~/.claude` shims) so Claude Code still loads them. Verify: editing the build-loop prompt in Savant regenerates the disk copy and the runner loads it.
- **Phase 5 - Demote git to backing store.** Reverse the sync hooks (`kerri-pull.sh` / `kerri-sync.sh` become Savant -> git/disk mirror jobs). Savant is now the source of truth; git is version history + the runner's disk copy. Update all docs. Verify end to end: edit in Savant -> git updated -> disk updated -> agent loads it.

## Guardrails preserved across every phase (unchanged)

- **S&W boundary holds.** Standard & Works internal content never enters Savant's general brain; `SensitivityLevels` + permission grants enforce the wall ([[../companies/standard-and-works]]).
- **Approval gates unchanged.** Read-only by default; external sends still need Brian's per-thread approval ([[../workflows/agent-brain-protocol]]).
- **Phantom-data rule.** No invented numbers, ever.
- **Send-authority files stay protected.** The `SEND_AUTHORITY` set ([[../workflows/multi-agent-write-rules]]) is never auto-exported or auto-imported without an explicit reviewed step, in either sync direction.

## Status

Decided 2026-06-17.

**Phase 1 — git brain coverage: SHIPPED + LIVE + VERIFIED (2026-06-17).** kerrihq-rails [PR #117](https://github.com/kerrihq/kerrihq-rails/pull/117) merged to `main` (squash `9134bbe`), deployed to Render. The importer now gives every brain file an intentional import-or-skip decision (zero catch-all fallthroughs): added `brain/wiki/improvements/`; made root operating/handoff docs and the `share/` S&W writer pack explicit reasoned skips; added the Claude memory layer as a second importer source (`claude_memory`) with personal-life + health files never imported. Pushed to production via `rake kerrios:console_push`: +10 created, +7 updated, 126 unchanged, 0 errors. Parity proven: 106 importable files = 106 active records = 0 active orphans = 0 files without a record; 37 legacy deal pages remain intentionally `stale` (history, excluded from active agent reads). Full suite green (1617 examples), rubocop + brakeman clean.

**Phase 1 — Claude memory push: PENDING one prod step.** The `console_push` task is generalized to push the memory source (`SOURCE_KEYS=claude_memory`), and the local dry-run shows 46 importable memory records (personal/health skipped). It is not yet in production because prod lacks the `claude_memory` SourceSystem (the seed change is merged but prod does not auto-run seeds). Remaining step: create the `claude_memory` source in prod (seed/console run), then push. Worth a quick Brian confirm that assistant-memory belongs in the team-visible hub before it lands.

**Phases 2-5: pending.** Each ships and verifies independently against production; can run interactively or as a build-loop task list ([[../../../agent-prompts/build-loop/SKILL.md]]).

## Related

- [[2026-06-11-brain-console-storage-split]] - the split this supersedes on the read side
- [[2026-06-11-console-brain-port]] - the engine this builds on
- [[../properties/savant]] - the app
- [[../properties/savant-product-vision]] - the vision this makes structural
- [[../workflows/llm-wiki-pattern]] - the git-brain model being migrated, not discarded
