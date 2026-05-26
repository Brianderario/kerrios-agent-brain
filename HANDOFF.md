# Handoff — Kerri Media Group (KMG) Operating Context

> Read this if you are a sibling team agent (Ari's, Benji's, or a fresh Claude session) and need to understand the world Kerri operates in, where the knowledge lives, and how to read it without trampling anything.

**Date:** 2026-05-25
**Author:** Kerri (Brian's chief of staff + KMG org brain)

---

## 1. Who Kerri is

- **Role:** Brian D'Erario's personal chief of staff **and** the org-level brain for **Kerri Media Group (KMG)**. Unified 2026-05-23 — Hudson (retired) and the old kerri-brain skill merged into Kerri.
- **External email:** `kerri@hardwarefyi.com` (Microsoft Graph, gated by approval rules below).
- **Identity rule:** Kerri never responds as Hudson, Alfred, or Claude.

KMG is the parent. Properties: **Hardware FYI** (flagship newsletter + community), **Kinetic** (annual SF conference), **Savant** (placeholder, fills in next session).

**Standard & Works (S/W)** is an *external* 50/50 partnership (Storm King Nexus Holdings LLC) — a separate legal entity. The S/W boundary is a hard rule (see §5).

**Team:** Brian (CEO) · Ari (CFO) · Benji (CDO) · Zach Silber (S/W counterpart, boundary applies).

---

## 2. The brain — what it is and where it lives

The canonical knowledge base is **KerriOS**, a **Karpathy-style LLM wiki on git**. Architecture decision: [`brain/wiki/decisions/2026-05-24-brain-architecture.md`](brain/wiki/decisions/2026-05-24-brain-architecture.md). Pattern: [`brain/wiki/workflows/llm-wiki-pattern.md`](brain/wiki/workflows/llm-wiki-pattern.md).

**Local path:** `~/Documents/Documents - Brian's MacBook Air/KerriOS/`
**GitHub (canonical, private):** https://github.com/Brianderario/kerrios-agent-brain
**Nightly push:** `kerri-brain-push` scheduled task at 22:00 ET commits eligible files + pushes.

### Brain directory layout

```
KerriOS/
├── CLAUDE.md              ← operating context (auto-loaded when cwd is here)
├── AGENTS.md              ← top-level mutation rules
├── agent-prompts/         ← canonical agent prompts (skills are thin shims)
├── brain/
│   ├── AGENTS.md          ← brain-specific mutation rules
│   ├── index.md           ← page catalog (one line per page)
│   ├── routing.md         ← topic → file map
│   ├── log.md             ← append after consequential writes
│   ├── wiki/              ← compiled durable truth (the source of truth)
│   │   ├── agents/        ← every team agent + canonical prompt
│   │   ├── companies/     ← H-prefix (HWFYI sponsors), S-prefix (S/W)
│   │   ├── decisions/     ← dated decision records
│   │   ├── deals/         ← open + closed
│   │   ├── events/        ← Kinetic etc.
│   │   ├── meetings/      ← recaps
│   │   ├── people/        ← brian, ari, benji, zach…
│   │   ├── properties/    ← KMG, HWFYI, Kinetic, Savant
│   │   └── workflows/     ← protocols + checklists
│   ├── candidates/        ← uncertain / conflicting claims pending review
│   └── raw/               ← append-only evidence (never edit)
├── data/
│   ├── kerrios.json                 ← live data store (gitignored)
│   ├── kerrios.agent-seed.json      ← sanitized cross-cutting seed
│   └── {jobs,job-counters,gtasks-lists}.json  ← sweep state (gitignored)
└── scripts/, test/, package.json
```

### Brain read order (consequential actions only)

**Do NOT auto-load the whole brain.** That defeats the LLM-wiki pattern. Read in this order:

1. `brain/AGENTS.md` — mutation rules
2. `brain/index.md` — page catalog (terse)
3. `brain/routing.md` — topic → file map (terse)
4. **1–3 routed wiki pages** under `brain/wiki/`
5. `data/kerrios.agent-seed.json` only if structured cross-cutting context is needed
6. `brain/raw/` only when evidence verification is required

**Source priority:** wiki > seed JSON > raw > chat history. **Chat is never canonical.**

### Brain write rules

- **Wiki** = compiled truth. Edit when truth changes; keep compact + source-linked.
- **Candidates** = uncertain/sensitive/conflicting → `brain/candidates/`.
- **Raw** = append-only evidence → `brain/raw/`. Never edit.
- **Append to `brain/log.md`** after any consequential write.
- **Approval gate:** external sends, CRM, pricing, legal, finance, permissions, identity → Brian approves first.
- **Multi-agent rule:** routine writes commit to `main`; material writes go via PR. **Pull before write.** See [`brain/wiki/workflows/multi-agent-write-rules.md`](brain/wiki/workflows/multi-agent-write-rules.md).

---

## 3. Memory layer (what's in `~/.claude/`)

The local Claude memory at `~/.claude/projects/-Users-brianderario/memory/` is a **pointer index + transient notes layer only**. Anything durable belongs in the brain.

- `MEMORY.md` — index of pointer stubs
- Each stub (`org_structure.md`, `agent_personas.md`, `email_identities.md`, `sw_partnership.md`, etc.) is a thin pointer to the canonical wiki page

`~/CLAUDE.md` is the global Claude entry point — it tells any Claude session it's Kerri, where the brain lives, and the hard rules.

**Skills** (thin shims, code lives in `agent-prompts/`):
- `~/.claude/skills/kerri/SKILL.md` → `agent-prompts/kerri-skill/SKILL.md` — the full Kerri operating manual
- `~/.claude/scheduled-tasks/kerri-inbox-sweep/` — inbox triage runner
- `~/.claude/scheduled-tasks/kerri-brain-push/` — nightly git push

---

## 4. Active agents

See [`brain/wiki/agents/registry.md`](brain/wiki/agents/registry.md) for the full registry. Active right now:

| Agent | Owner | Status | Prompt |
|---|---|---|---|
| **Kerri** | Brian | active | [`brain/wiki/agents/kerri.md`](brain/wiki/agents/kerri.md) |
| Cold outreach sub-agent | Brian (under Kerri) | active | decision [`2026-05-24-cold-outreach-launch`](brain/wiki/decisions/2026-05-24-cold-outreach-launch.md) |
| Lead research sub-agent | Brian (under Kerri) | active | decision [`2026-05-24-lead-research-launch`](brain/wiki/decisions/2026-05-24-lead-research-launch.md) |
| S&W Industrialist newsletter chain | Brian (writer + editor + marketing) | active | decision [`2026-05-24-sw-newsletter-chain-launch`](brain/wiki/decisions/2026-05-24-sw-newsletter-chain-launch.md) |
| Ari's agent | Ari | TBD | — |
| Benji's agent | Benji | TBD | — |

---

## 5. Hard rules (never break these)

1. **Never send externally without `approved=true` + `approvalSource`.** Default is read-only. `approvalSource` must describe *where* Brian approved (e.g. "Brian said 'send it' in Slack DM at 2:30pm 2026-05-23"). Every send auto-CCs `brian@hardwarefyi.com`.
2. **Never cross the S/W boundary.** S/W internal ops, finances, staff comp, content drafts do not enter Kerri's brain. When Zach is a recipient, double-check you're on the KMG side.
3. **Never write to Notion.** Retired. Brain is the local vault + GitHub.
4. **Never respond as Hudson, Alfred, or Claude.** You are your own agent identity.
5. **Never treat chat history as canonical.** Wiki > seed > raw > chat.
6. **No commitments without approval** — meetings, money, agreements.

---

## 6. Active MCP tools

| MCP | Purpose |
|---|---|
| `kerri-hardwarefyi-email` | Kerri's full email (kerri@hardwarefyi.com) — search/read/draft/send/reply. Approval gate enforced. |
| `brian-hardwarefyi-email` | Brian's HWFYI email (brian@hardwarefyi.com). |
| `microsoft365` (cloud, read-only) | Fallback read for brian@hardwarefyi.com inbox. |
| `superhuman` | Brian's S/W mailbox (brian@standardandworks.com). **S-prefix sends only — never auto-CC HWFYI.** |
| `slack` | Slack read + send as Brian. |
| `google-drive` | Drive reads. |
| `gmail` | kerrihq.com Gmail. |
| `apollo` | Prospect enrichment. |
| `granola` | Meeting transcripts. |
| `reclaim-ai` | Calendar / scheduling. |

---

## 7. The 4-step operating loop

Every interaction:

1. **Perceive** — read the input + any thread context
2. **Propose** — combine input + brain context + voice → proposed action (show Brian)
3. **Record** — write key facts back to brain (wiki or candidate, compact + source-linked)
4. **Improve** — flag patterns, repeated corrections, broken workflows

Full protocol: [`brain/wiki/workflows/agent-brain-protocol.md`](brain/wiki/workflows/agent-brain-protocol.md).

---

## 8. What to do first (if you're the team agent reading this)

1. `cd` to `~/Documents/Documents - Brian's MacBook Air/KerriOS/` so `CLAUDE.md` auto-loads.
2. Read `brain/AGENTS.md`, `brain/index.md`, `brain/routing.md` — that's the terse intro.
3. Read [`brain/wiki/agents/registry.md`](brain/wiki/agents/registry.md) to see where you slot in and what the other agents do.
4. Read the workflow page closest to your job:
   - Cross-agent coordination → [`workflows/multi-agent-write-rules.md`](brain/wiki/workflows/multi-agent-write-rules.md)
   - Customer / company lookups → [`workflows/customer-id-protocol.md`](brain/wiki/workflows/customer-id-protocol.md)
   - Source-of-truth questions → [`workflows/source-of-truth.md`](brain/wiki/workflows/source-of-truth.md)
5. Before any consequential write: `git pull` first, then write, then append to `brain/log.md`.
6. Material writes (org structure, finance, partnerships, hard rules) → PR, not direct commit.

---

## 9. Where to ask if you're unsure

- **Boundary questions (S/W vs KMG):** [`brain/wiki/companies/standard-and-works.md`](brain/wiki/companies/standard-and-works.md)
- **Email identity / which mailbox to use:** [`brain/wiki/properties/`](brain/wiki/properties/) + the S&W page
- **Recent decisions:** [`brain/wiki/decisions/`](brain/wiki/decisions/) (dated, newest matters)
- **Anything else:** ask Brian. Chat is not canonical, but Brian is.
