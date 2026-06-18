# Agent Brain Protocol

scope: workflow · updated: 2026-06-17

The minimum read/write contract every team agent honors. Implements [[llm-wiki-pattern]].

## Read protocol (every consequential action)

Durable knowledge is sourced from **Savant** (the company hub) as of [[../decisions/2026-06-17-savant-as-company-hub]]. The local git wiki under `brain/wiki/` is an **offline fallback only**.

1. **Always:** `CLAUDE.md` is auto-loaded by Claude Code at session start. Treat as the operating preamble.
2. **Live state (git):** read `NOW.md` (session baton) and the recent tail of `brain/log.md` for what is in flight. These stay in git: they are transient and intentionally not in Savant.
3. **Durable knowledge (Savant):** find the pages you need with `node scripts/brain-api.mjs search "<keywords>" [--kind workflow|decision|property|agent_instruction|...]`, then `node scripts/brain-api.mjs get <id>` for the full body. `brain/routing.md` + `brain/index.md` are still the topic map for *what to look for*; the content is read from Savant. Read only the 1-3 records the task needs.
4. **Offline fallback:** if Savant is unreachable (brain-api.mjs errors), read the matching `brain/wiki/...` file from git directly. Same content; git is the synced backing store.
5. **Evidence if needed:** raw evidence lives in Savant as `source_pointer` records; the bodies stay in `brain/raw/` (read the file only when you must verify).
6. **Stop.** Do not read more than the task requires. Context-window discipline.

> **Authoring is bidirectional (Phase 3 of [[../decisions/2026-06-17-savant-as-company-hub]], live 2026-06-17).** Canonical knowledge can be authored in **Savant** (the `/brain` UI) or in git. The nightly sync reconciles both directions: Savant edits export to git (`scripts/savant-to-brain-export.sh`), then git edits import to Savant (`scripts/brain-to-savant-sync.sh`). The arbiter is each record's content hash, so neither side clobbers the other. The one genuine conflict — the *same page* edited in both git and Savant inside one sync window — resolves git-wins (the Savant edit is dropped); so don't edit a given page in both places at once. `NOW.md` + `brain/log.md` stay git-only (live/transient).

## Write protocol (any new fact, decision, or learning)

Canonical knowledge has two authoring surfaces since 2026-06-17: humans edit in Savant's `/brain` UI (those edits export to git automatically), and agents/humans edit the git files below (which import to Savant). Either way the content lands in both. Agents writing brand-new durable knowledge still create the git file per the table below (it imports to Savant on the next sync), or file a candidate via `POST /api/v1/knowledge_records` (status `candidate`) for human promotion. The paths below are still authoritative for where a git write goes:

| Type of write | Where it lands | Approval gate |
|---|---|---|
| Raw evidence (transcript, email export, doc snapshot) | `brain/raw/<YYYY-MM-DD>-<slug>.md` | None — append-only, never edited |
| Uncertain claim, conflicting source, sensitive data | `brain/candidates/<slug>.md` | None to file; review to promote |
| Person/company/property fact update | `brain/wiki/{people,companies,properties}/<slug>.md` | Auto-merge on routine; PR review for material truth changes |
| Decision (something is now policy) | `brain/wiki/decisions/<YYYY-MM-DD>-<slug>.md` | PR review by affected stakeholders |
| Workflow change / agent learning | `brain/wiki/workflows/<slug>.md` | Auto-merge; flag in log if behavior-changing |
| Meeting recap | `brain/wiki/meetings/<YYYY-MM-DD>-<slug>.md` | None |
| Log entry | `brain/log.md` (append at top, dated) | None |

## Hard rules (do not bypass)

- **Source-link every non-obvious claim.** Use `(src: raw/<file>.md L<line>)` or `(src: meetings/<file>.md)`.
- **No raw transcripts in the wiki.** Compact + source-linked. Raw bodies live in `raw/`.
- **No chat-as-truth.** Slack/iMessage/email history is evidence, not canonical. Write it to the brain or it didn't happen.
- **No double emails.** Before any email send, prove the thread/task has not already been sent, skipped, or handled. A second email on the same thread requires fresh explicit Brian approval for that second send.
- **External sends, pricing, legal commitments, finance decisions, refunds >$2,500, permission changes, identity changes, destructive actions, and material CRM judgment calls:** Brian approval required (or per-domain owner — Ari for finance, Benji for digital). Source-backed Hardware FYI pipeline stage bookkeeping is act-and-report: update Console, verify, and log.
- **S/W partnership boundary:** S-prefix learnings, S/W internal financials, S/W staff comp, S/W content drafts go into `brain/.local/s-*.md` which is gitignored. Never enters the shared repo.

## After every wiki write

1. Append a one-line entry to `brain/log.md` prefixed `## [YYYY-MM-DD HH:MM ET] <action> | <slug> | <agent>`.
2. If you added a new page, add a one-line entry to `brain/index.md` under the right category.
3. If you changed truth in a way that contradicts a prior page, file a `candidates/` note flagging the contradiction — don't quietly overwrite.

## Lint duties (Kerri runs weekly, Fridays 4pm)

- Pages with no `updated:` field or `updated:` >90 days ago and still linked → flag for refresh.
- Pages with no inbound wikilinks → flag as orphan (delete or link from somewhere).
- Pages >2KB → flag for split.
- `candidates/` files older than 30 days → flag for promote-or-discard.
- Broken `[[wikilinks]]` → list with location for next-pass write.
