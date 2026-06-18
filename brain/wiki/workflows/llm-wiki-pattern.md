# LLM Wiki Pattern (KMG brain operating principle)

scope: workflow · updated: 2026-05-24 · sources: [Karpathy gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)

KMG's brain is built on Karpathy's LLM-wiki pattern, not RAG and not Notion. Three layers, three operations, zero auto-load.

> **Migrated to the Savant hub (2026-06-17).** Savant (`kerrihq-rails`) is now the source of truth for the brain; this git-wiki pattern is the **backing-store layer** beneath it (versioned audit, offline fallback, the runner's on-disk copy). The principles below still describe how the git layer is structured and why knowledge *compounds* rather than being re-retrieved; just read "the brain" as Savant-with-a-git-mirror now. See [[source-of-truth]] and [[../decisions/2026-06-17-savant-as-company-hub]].

## Three layers

1. **Raw sources** (`brain/raw/`) — append-only evidence. Transcripts, email pulls, meeting notes, exported reports. LLMs read these; never edit.
2. **Wiki** (`brain/wiki/`) — LLM-compiled markdown. Atomic, source-linked, interlinked via `[[wikilinks]]`. Small files (target <2KB each). One topic per page.
3. **Schema** (this repo's `AGENTS.md`, `brain/AGENTS.md`, `CLAUDE.md`, `agent-prompts/`) — defines structure, conventions, mutation rules.

Distinction from RAG: knowledge **compounds**. A fact added today is integrated into the wiki, not just indexed for later retrieval. Tomorrow's agent reads the same compiled page, not a re-synthesized chunk.

## Three operations

- **Ingest** — new source (email thread, meeting, decision) lands. The agent reads it, summarizes, updates 1–10 affected wiki pages, appends to `log.md`, files the source under `raw/`.
- **Query** — agent reads `index.md` → `routing.md` → the 1–3 specific wiki pages it needs. Synthesizes an answer with citations to source slugs. Files valuable explorations back as new wiki pages so the second time someone asks the question, it's already answered.
- **Lint** — periodic health pass (weekly). Flags contradictions, stale pages (no updates in 90+ days but still referenced), orphans (no inbound links), missing cross-references. See [[brain-lint]] (TBD).

## Why this works for KMG specifically

- **Multi-player without lock-in.** Brian, Ari, Benji each have their own agent reading the same git repo. No SaaS bill, no schema migrations, no vendor risk.
- **Context window stays clean.** Auto-loading is for `MEMORY.md` (tiny pointer index) and `CLAUDE.md` (operating context). The brain itself is pulled on demand — `index.md` → `routing.md` → 1–3 pages. No 50KB context dumps.
- **Auditable.** Every change has a git SHA + author. The PR-as-approval-gate replaces a bespoke permissions layer.
- **Compounding asset.** Knowledge added by one agent is queryable by every other agent forever. The brain literally gets smarter every week.

## Page-writing rules

- **One topic per page.** A person, a company, a deal, a decision, a workflow.
- **<2KB target.** If a page is bigger, split. If it's smaller and adjacent to another, merge.
- **Source-linked.** Every non-obvious claim cites: `(src: raw/2026-05-23-board-call.md L42)` or `(src: meetings/2026-05-12-kinetic-sf.md)`.
- **No prose dumps.** Write for grep + LLM scan, not for narrative reading. Bullets > paragraphs.
- **Wikilinks for everything related.** `[[ari-lewis]]`, `[[hardware-fyi]]`, `[[2026-05-23-kerrios-rebuild]]`. Broken links are fine — they mark pages worth writing.
- **Date stamps.** Every page has `updated: YYYY-MM-DD` in the first line. Stale = >90 days untouched.

## Page-reading rules (agents)

- Default read order: `CLAUDE.md` → `brain/index.md` → `brain/routing.md` → 1–3 wiki pages.
- Read `brain/log.md` only when chronology matters (recent decisions, "what changed").
- Read `data/kerrios.agent-seed.json` only when structured cross-cutting context is needed.
- **Never auto-load the full wiki.** That defeats the pattern.

## Maintenance contract

Every Kerri sweep, every meeting recap, every decision is *both* an action AND a wiki update. The act of working IS the act of maintaining the brain. If a step doesn't write to the brain, the brain decays — and Brian's stated rule (2026-05-24) is no dead builds.

See [[agent-brain-protocol]] for the exact read/write protocol agents follow.
See [[multi-agent-write-rules]] for how multiple agents avoid stepping on each other.
