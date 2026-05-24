# Agent Brain Protocol

scope: workflow · updated: 2026-05-24

The minimum read/write contract every team agent honors. Implements [[llm-wiki-pattern]].

## Read protocol (every consequential action)

1. **Always:** `CLAUDE.md` is auto-loaded by Claude Code at session start. Treat as the operating preamble.
2. **Entry:** `brain/AGENTS.md` (mutation rules) → `brain/index.md` (catalog) → `brain/routing.md` (topic map).
3. **Routed reads:** pull the 1–3 wiki pages `routing.md` points to for the topic at hand. Read fully.
4. **Evidence if needed:** `brain/raw/` only when the wiki cites a raw file you need to verify.
5. **Stop.** Do not read more pages than the task requires. Context window discipline.

## Write protocol (any new fact, decision, or learning)

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
- **External sends, CRM mutations, pricing, legal commitments, finance decisions, refunds >$2,500, permission changes, identity changes:** Brian approval required (or per-domain owner — Ari for finance, Benji for digital).
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
