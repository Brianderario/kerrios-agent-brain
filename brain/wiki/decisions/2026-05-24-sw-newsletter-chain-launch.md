# Decision: S&W Industrialist Newsletter Chain — Writer + Editor + Marketing

scope: decision · updated: 2026-05-24

## Decision

Ship sub-agent #2 of the planned six as a **three-agent chain**: writer → editor → marketing. Each links into the next via shared draft state in `brain/.local/sw-newsletter-drafts/` (gitignored) and the beehiiv post being edited. Brian's instruction (2026-05-24): "**You own the writing.** Zach and I will add our own stories/email you suggestions to ingest but you are deciding what deserves writing. You should also develop sub agents for editing the newsletter and creating marketing copy for social."

## Cadence (locked 2026-05-24)

- **Mon 8:14pm ET → writer** drafts for Tue ~2pm publish
- **Mon 10:21pm ET → editor** polishes the Tue draft
- **Tue 2:24pm ET → marketing** detects publish, drafts socials
- **Wed 8:14pm ET → writer** drafts for Thu ~2pm publish
- **Wed 10:21pm ET → editor** polishes the Thu draft
- **Thu 2:24pm ET → marketing** detects publish, drafts socials

Brian draft-Mon-for-Tue / draft-Wed-for-Thu cadence overrides the original Mon/Wed publish I had in the plan.

## Format reverse-engineered from the public archive

Read 10 issues at `standardandworks.com` (Feb–May 2026). Two dominant formats:

**Standard ("Plus" format, ~3 min read):** Markets snapshot (5 indicators with arrows) → Lead (2-graf analytical writeup of THE story) → 5–6 category roundups (Defense & Space / Semis & Electronics / Energy & Materials / Mfg & Automation / Maritime & Shipbuilding / Supply Chain & Freight, 3 bullets each with numbers + links) → Dealbook (4 transactions) → "Back Tuesday/Thursday."

**Long-form (~4 min):** Location-anchored opener → named-source quote → coalition/policy mechanism → specifics with dollar magnitudes → strategic framework → forward action. Used for original reporting and big single stories. Kerri's writer agent defaults to standard format; long-form is reserved for stories Brian/Zach are bringing.

## Voice file

New: `agent-prompts/kerri-skill/references/voice-sw-industrialist.md` — distinct from `voice.md` because the audience is different (capex investors/policymakers vs HWFYI engineer-founders). Captures: sober analytical register, named-source standard, "Plus:" preview convention, anti-patterns (no exclamation marks, no hype words, no anonymous sources, no vague-magnitude phrasing).

## Lead-selection logic (Brian's rule, 2026-05-24)

> "Huge fundraises or partnerships deserve the spotlight, but whenever we can provide a unique perspective via a story will always be preferred."

Writer ranks candidates by: (1) unique-thesis hook → highest, (2) magnitude, (3) strategic/policy significance. Picks the highest-ranked candidate where it can defend two solid paragraphs.

## Suggestion ingestion

Brian and Zach contribute via tagged email — subject contains `[SW]`, `[Industrialist]`, `S&W suggestion`, or sent from brian@standardandworks.com / zach@standardandworks.com. `[REQUIRED]` tag forces inclusion. Writer scans three inboxes (kerri@hwfyi, brian@hwfyi, brian@sw via Superhuman) every run.

## Sources

`data/sw-newsletter/sources.json` — editable. Categories seeded with 3–5 sources each (Breaking Defense, USNI, IndustryWeek, SemiWiki, Utility Dive, Supply Chain Dive, etc.). Brian and Zach can add their preferred feeds. Markets tickers seeded: ITA, SOXX, XLI, CL=F, HG=F (Yahoo Finance).

## Boundary

S&W published content is the 50/50 partnership output (public when shipped). **Pre-publish drafts stay in `brain/.local/sw-newsletter-drafts/` (gitignored)** — internal editorial deliberation isn't shared brain content. Once an issue is published at `standardandworks.com/p/<slug>`, the `brain/log.md` records the publish event with the URL.

## beehiiv integration

Primary: Chrome MCP automates `/posts/template-library → "S&w industrialist" template → Start writing → paste body → save draft`. Fallback when bridge fails: post the full Markdown as a Google Task in the Standard&Works list with paste-into-beehiiv instructions at the top.

## What stays manual

- Hitting Send in beehiiv (Brian or Zach)
- Posting to Twitter / LinkedIn (Brian or Zach, after reviewing marketing task)
- Long-form essays and original reporting (writer skips long-form; chain is for standard issues only)

## Related

- [[../agents/registry]] — agent roster
- [[../workflows/agent-brain-protocol]] — read/write rules
- [[2026-05-24-brain-architecture]] — brain architecture
- [[2026-05-24-cold-outreach-launch]] — sub-agent #1
- [[2026-05-24-lead-research-launch]] — discovery agent

## Open / deferred

- v2 of writer: support long-form format when Brian/Zach flag a story as "go long"
- v2 of marketing: detect engagement on prior socials; tailor cadence by what performs
- v2 of editor: deeper fact-check (cross-reference numbers against source links automatically, not just flag)
- v2 markets snapshot: real-time financial API instead of WebFetch on Yahoo (when WebFetch breaks)
