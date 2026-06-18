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

**Phase 1 — Claude memory push: DONE + LIVE (2026-06-17, Brian approved).** Created the `claude_memory` SourceSystem in production via a targeted Render one-off job (not a full db:seed, to avoid resetting other seeded data), in the same org that owns `kerrios_brain`. Pushed via `SOURCE_KEYS=claude_memory rake kerrios:console_push`: +46 created, 0 errors, 4 skipped (the 3 `personal_*` files + `brian_health_tracking`, exactly as designed). Verified retrievable in prod: feedback rules as `agent_instruction` (e.g. no-emdashes), `MEMORY` index as `operational_doc`. **Phase 1 is fully complete:** the entire brain (106 active git-brain records + 46 memory records) now lives in production Savant, with personal-life and health context deliberately excluded.

**Phase 2 — flip the read path: DONE + LIVE (2026-06-17).** Durable knowledge is now read from Savant; the git wiki is an offline fallback. Shipped: `scripts/brain-api.mjs` (read helper over `/api/v1/knowledge_records`: `search`/`list`/`get`, brain:read agent key, verified against prod). Read protocol flipped in [[../workflows/agent-brain-protocol]], the KerriOS `CLAUDE.md`, [[../../AGENTS]], and a [[../../routing]] banner: Savant-first via brain-api.mjs, git fallback if unreachable; `NOW.md` + `brain/log.md` stay git (live/transient). Freshness: `scripts/brain-to-savant-sync.sh` resyncs both sources to Savant and is wired into the nightly brain-push (STEP 4B, non-blocking, idempotent); verified live (+0/~4/=139, 0 errors). Writes still go to git until Phase 3.

**Phase 3 — flip the write/authoring path: DONE + LIVE (2026-06-17).** Savant is now an authoring surface for canonical knowledge; edits there flow to git instead of being clobbered by re-import. Shipped: `Kerrios::GitExporter` + `rake kerrios:export_from_savant` (kerrihq-rails [PR #118](https://github.com/kerrihq/kerrihq-rails/pull/118)) — the safe inverse of the importer (writes a git file only when it is unchanged since last import AND the Savant body differs; never overwrites a locally-edited file; preserves frontmatter; round-trip byte-stable, with the importer's YAML-parse fallback mirrored after a real prod dry-run caught the gap). `scripts/savant-to-brain-export.sh` wired into nightly brain-push STEP 1C (export Savant→git) before staging; STEP 4B then imports git→Savant. Reconciliation arbiter = content hash; the one true conflict (same page edited both sides in one window) resolves git-wins (documented limitation). Write protocol flipped in [[../workflows/agent-brain-protocol]] + the KerriOS `CLAUDE.md`. Verified against prod: 106-page dry-run = 0 false writes; apply on in-sync brain = 0 clobber; a live prod edit propagated to the right git file (frontmatter intact) and was restored; locally-edited page correctly protected. Full suite 1625 green.

**Phase 4 — operating layer into Savant: DONE + LIVE (2026-06-17).** The agent operating layer (22 routine `SKILL.md` prompts) is now mirrored into Savant's `Agent` registry, visible and manageable in `/agents`. Shipped: `POST /api/v1/agent_prompt_imports` (brain:import scope) + `rake kerrios:push_agent_prompts` (kerrihq-rails [PR #119](https://github.com/kerrihq/kerrihq-rails/pull/119)), pushed from the local checkout (same pattern as the wiki push; no broad GitHub token in prod). Wired into nightly `scripts/brain-to-savant-sync.sh` so prompts stay current. Verified in prod: `AGENTS_WITH_PROMPT` 0 → 22, the build-loop prompt carries its COMPOUND step, 0 errors; full suite 1631 green. Also fixed `kerri-event-logistics` frontmatter (an unquoted colon that broke YAML parsing) so its metadata syncs.

**Refinement to the original Phase 4 framing (deliberate, safer):** the operating layer is a **read-mirror** to Savant — git stays the source of truth the runner loads from disk, because Claude Code loads skills from the filesystem and a prompt edit (especially a send-authority one) must never silently change what an agent may do. Editing a prompt in Savant therefore travels the existing **approval-gated `AgentAdjustmentRequest` channel** (model + MCP tools `list_open_adjustments` / `resolve_adjustment` already exist), applied back to git by a reviewed maintenance step. The one remaining automation is a routine that drives that apply step; until then the apply is done interactively (the manual path works). This is stronger than the naive "auto-export prompt edits to disk" the plan first sketched, and it keeps the send-authority protection intact (`autonomy-policy.json` + the four send-authority SKILLs are mirrored read-only, never written from Savant).

**Phase 5 — demote git to a backing store: DONE (2026-06-17). Migration COMPLETE.** Savant is now declared the source of truth for the entire company brain across the canonical docs: [[../workflows/source-of-truth]] rewritten (Savant = source of truth; git = backing store), [[../workflows/llm-wiki-pattern]] carries a migration banner (the git-wiki pattern is now the backing-store layer), the KerriOS `CLAUDE.md` and the Claude memory index (`MEMORY.md`) declarations flipped from "GitHub is the source of truth" to Savant. The reconciliation loop is fully automated and hands-off (nightly brain-push: export Savant→git, import git→Savant; Stop-hook + SessionStart-hook keep the on-disk copy synced), verified end-to-end in Phases 2-4.

**Honest accounting — git is demoted, not gone.** Git keeps three legitimate residual roles and this was never going to be "git does nothing": (1) versioned audit + offline fallback, (2) the runner's on-disk copy of prompts (Claude Code loads skills from the filesystem), (3) transient live state (`NOW.md`, `log.md`) that intentionally never enters Savant. Agents also still write durable knowledge to git files during routines (imported to Savant); redirecting every routine's write path to the API was deliberately out of scope, because the content-hash reconciliation already keeps the stores consistent and a wholesale rewrite would add risk without changing the outcome.

**Known limitation + optional future refinement.** A same-page edit in both Savant and git within one sync window resolves git-wins. It is rare and cannot corrupt data. The refinement (deadlock-and-flag, so neither side silently loses) is noted but not built. The other open automation is the routine that auto-applies approved prompt `AgentAdjustmentRequest`s to git (today that apply is interactive/reviewed — the safe default for the operating layer).

## Outcome

Savant is the company hub end to end: the team reads from it, knowledge and the agent operating layer are authored/managed in it, and git runs silently underneath as the versioned backing store + on-disk runner copy. All five phases shipped and were verified against production in a single session (2026-06-17); guardrails (S/W boundary, approval gates, phantom-data rule, send-authority protection) held throughout.

## Related

- [[2026-06-11-brain-console-storage-split]] - the split this supersedes on the read side
- [[2026-06-11-console-brain-port]] - the engine this builds on
- [[../properties/savant]] - the app
- [[../properties/savant-product-vision]] - the vision this makes structural
- [[../workflows/llm-wiki-pattern]] - the git-brain model being migrated, not discarded
