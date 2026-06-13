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
5. **One to three routed wiki pages** (e.g., `brain/wiki/people/{slug}.md`, `brain/wiki/deals/{slug}.md`). Company context is the exception: it lives in the KMG Console, not the wiki (see the routing table and lookup pattern below). `brain/wiki/companies/` is frozen (legacy pages remain for git history only).
6. **`KerriOS/data/kerrios.agent-seed.json`** for structured context
7. **`brain/raw/`** only when evidence is required

## Routing (topic → wiki dir)

Per `brain/routing.md`:

| Question type | Where to read |
|---|---|
| Source-of-truth boundaries / what's canonical | `wiki/workflows/source-of-truth.md` |
| Person profile / contact (external) | Savant CRM (`GET /api/v1/people?company_id={id}`); `wiki/people/` is frozen (internal team pages brian/ari/benji/zach only, in git history) |
| Company context / outreach history / CRM | Savant record (`GET /api/v1/companies?domain={d}`, read `crm_notes` + the `deals` summary); `wiki/companies/` is frozen, legacy pages in git history only |
| Property / portfolio | `wiki/properties/` |
| Deals / pipeline / external commitments | Savant CRM (`GET /api/v1/deals?stage={s}` or `GET /api/v1/companies/{id}` for a company's deals); `wiki/deals/` is frozen; deal *rationale/decisions* live in `wiki/decisions/` |
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

**"What do we know about Acme Corp?"** (CRM questions route to the KMG Console, the system of record for companies/contacts/deals as of 2026-06-11)
```
GET https://kerrihq-rails-xtua.onrender.com/api/v1/companies?domain=acme.com
  (header: Authorization: Bearer $KERRIHQ_AGENT_API_KEY, token in ~/.kerri-chief/secrets/kerrihq.env;
   the lookup matches aliases too, or use ?job_id=<id>)
Read the record: crm_notes (relationship facts), jobId, deals; people via GET /api/v1/people
If the Console API is down: read the snapshot data/companies.json (READ-ONLY offline fallback;
   never mint a jobId or register a company while the API is down: fail closed, mark review-required)
If still missing, flag the gap, ask Brian; register new companies via POST /companies
   per brain/wiki/workflows/customer-id-protocol.md
Do NOT read or write brain/wiki/companies/ (frozen; legacy pages exist only for git history)
```

**"Update the deal status for Acme."**
```
Find the deal in Savant (GET /api/v1/deals or GET /api/v1/companies/{id})
Move the stage with source-backed evidence: scripts/console-pipeline-update.mjs --apply
  (or PATCH /api/v1/deals/:id/update_stage). Material judgment calls still get Brian sign-off.
Do NOT read or edit brain/wiki/deals/ (frozen). The Savant deal is the system of record.
```

**"Brian just had a call with X — capture the recap."**
```
Append the Granola transcript pointer to brain/raw/{date}-{topic}.md
Draft a compact recap → propose as brain/wiki/meetings/{date}-{slug}.md (the narrative is brain knowledge)
Record any new ENTITY facts in Savant: company crm_notes (PATCH /api/v1/companies/:id),
  a new/updated contact (POST/PATCH /api/v1/people), or a deal stage move via console-pipeline-update.mjs.
  Do NOT write external contact facts to brain/wiki/people/ (frozen).
Propose follow-up tasks via the Savant Console task board.
```

## What NOT to read

- Do NOT read `KerriOS/data/.kerrios-api-token.local` (gitignored, credentials).
- Do NOT read OpenClaw, old Codex workspace (`~/Desktop/Codex Kerri Agent/`), or `~/Documents/new project/` — retired/gone.
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
