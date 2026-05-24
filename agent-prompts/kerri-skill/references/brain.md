# Brain Query Patterns

How Kerri reads and writes the KerriOS company brain.

## Locations

- **Local vault (live store):** `/Users/brianderario/Documents/Documents - Brian's MacBook Air/KerriOS/`
- **GitHub agent-seed (sanitized):** https://github.com/Brianderario/kerrios-agent-brain
- **Live data file:** `KerriOS/data/kerrios.json` (gitignored — never read directly to share with external agents)
- **Sanitized export:** `KerriOS/data/kerrios.agent-seed.json` (safe for external agents)

## Read order (every consequential read)

1. **`KerriOS/AGENTS.md`** — entry instructions
2. **`KerriOS/brain/AGENTS.md`** — mutation rules
3. **`KerriOS/brain/index.md`** — top-level entry
4. **`KerriOS/brain/routing.md`** — topic map (which wiki dir maps to which question)
5. **One to three routed wiki pages** (e.g., `brain/wiki/companies/{slug}.md`, `brain/wiki/people/{slug}.md`, `brain/wiki/deals/{slug}.md`)
6. **`KerriOS/data/kerrios.agent-seed.json`** for structured context
7. **`brain/raw/`** only when evidence is required

## Routing (topic → wiki dir)

Per `brain/routing.md`:

| Question type | Where to read |
|---|---|
| Source-of-truth boundaries / what's canonical | `wiki/workflows/source-of-truth.md` |
| Person profile / contact | `wiki/people/{slug}.md` |
| Company context / outreach history | `wiki/companies/{slug}.md` |
| Property / portfolio | `wiki/properties/` |
| Deals / external commitments | `wiki/deals/` + `wiki/decisions/` |
| Meeting recap / notes | `wiki/meetings/` |
| Workflow / operating contract | `wiki/workflows/` |
| Uncertain or unowned claim | `candidates/` |
| Raw evidence (chat, email export) | `raw/` (append-only) |

## Write rules

- **Wiki edits = compiled durable truth.** Compact, source-linked, no raw dumps.
- **Candidates = uncertain claims.** Use when sources conflict, owner unknown, or sensitive — promote to wiki only after review.
- **Raw = append-only evidence.** Never edit; only add new entries.
- **Approval gate.** Writes that change external sends, CRM, pricing, legal, finance, permissions, or identity → require Brian approval before commit.

## Source priority (when sources conflict)

1. `brain/wiki/` (durable truth)
2. `data/kerrios.agent-seed.json` (sanitized snapshot of #1)
3. `brain/raw/` (evidence)
4. Chat / email threads (working context — NEVER canonical)

## Common patterns

**"What do we know about Acme Corp?"**
```
Read brain/routing.md → companies route
Read brain/wiki/companies/acme.md (if exists)
If missing, check data/kerrios.agent-seed.json for "Acme" mentions
If still missing, flag the gap, ask Brian, propose a candidate
```

**"Update the deal status for D-1234."**
```
Read brain/wiki/deals/D-1234.md
Confirm change is approved (deal stage changes may need Brian sign-off)
Edit the wiki page with the new status + source line
Record the edit in brain/audit/ if material
```

**"Brian just had a call with X — capture the recap."**
```
Append the Granola transcript pointer to brain/raw/{date}-{topic}.md
Draft a compact recap → propose as brain/wiki/meetings/{date}-{slug}.md
Update brain/wiki/people/{x}.md with any new facts (Brian approves first)
Propose follow-up tasks via Kerri's task surface (TBD: tasks layer)
```

## What NOT to read

- Do NOT read `KerriOS/data/.kerrios-api-token.local` (gitignored, credentials).
- Do NOT read OpenClaw, Codex layer, or `~/Documents/new project/` — retired/gone.
- Do NOT read Notion as canonical — retired.
- Do NOT treat chat history as canonical — working context only.

## How to refresh the GitHub agent-seed

When the local brain has material changes that should propagate to the sanitized seed:

```bash
cd "/Users/brianderario/Documents/Documents - Brian's MacBook Air/KerriOS"
npm run export:agent-seed
git add data/kerrios.agent-seed.json brain/
git commit -m "Update agent-seed: <summary of changes>"
git push
```

The export script (`scripts/export-agent-seed.mjs`) handles sanitization — strips people, conversations, approvals, emails, phone numbers, Slack IDs, local paths, secrets.
