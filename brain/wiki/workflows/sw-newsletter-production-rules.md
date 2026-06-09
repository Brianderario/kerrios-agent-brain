# Standard & Works Newsletter Production Rules

scope: workflow · updated: 2026-05-26

## Canonical Voice Source

Use the actual sent Standard & Works issues in `brian@kerrihq.com` Gmail as the voice source. Search:

`from:editor@standardandworks.com newer_than:90d`

Strongest examples:

- `AMCA, SendCutSend, and The New Factory Middle`
- `Camden Becomes A Missile Factory Town`
- `Colossus Sized Bet`
- `AI Finds The Factory Floor In El Segundo`

Do not use recent local Claude/Codex voice-rebuild files as style authority unless Brian explicitly revives a specific line.

## Mailbox Routing

- `brian@kerrihq.com` → Gmail plugin.
- `brian@standardandworks.com` → Superhuman.
- `brian@hardwarefyi.com` and `kerri@hardwarefyi.com` → custom local Outlook MCP.

## Format Direction

Brian likes the writing style of the recent sent issues. The change is format depth: make the newsletter more comprehensive without changing the voice.

That means:

- fuller lead when the lead can carry a real industrial thesis
- 5-6 strong sections when the candidate pool supports them
- 3-5 one-sentence bullets per active section when the issue window supports them
- 6-10 Dealbook items when the funding, M&A, financing, facility, or contract tape supports it
- internal source notes and claims-to-check preserved outside the reader-facing body

## Story Freshness Gate (HARD RULE — Brian, 2026-06-09)

**Every bullet and Dealbook item must have been published AFTER the last sent issue and BEFORE the current issue's staging date.** No exceptions. The window is last-issue-send-date → today. If the last issue went out Thursday June 4, only stories published June 4 evening through the current staging date qualify.

Before staging, verify every source URL's publication date. A story is stale if:
- it was published before the last sent issue's date, OR
- it already appeared in a prior S&W issue (dedup against at least the last 2 sent issues), OR
- the source article is a roundup/listicle with no specific announcement date in-window.

If a section has zero in-window stories, **omit the section entirely** rather than padding with stale items. Linking to a months-old source makes the newsletter look uninformed. This is the single fastest way to lose credibility with a serious industrial reader.

Bottom-of-issue coverage should be fuller rather than sparse. Include every credible in-window story that fits Standard & Works, especially fundraises, M&A, facility/capacity moves, contracts, public financing, workforce programs, supply-chain infrastructure, and regional economic-development items. Omit only when the story is stale, off-topic, soft thought leadership, conference-only, earnings-only, consumer-only, or too weak for a serious industrial reader.

Pacing model: TBPN's shape is useful inspiration (quick setup, fuller lead, fast linked items underneath) but do NOT copy TBPN's voice or signature lines. S&W's own opener is "The build this week: [X]." (see Intro spec below). The lead should name what is weird, mispriced, misunderstood, or newly visible in an industrial story, then land on capacity, procurement, capital formation, supply chains, power, or buyer behavior.

Default lead lens: economic development. The lead should usually pull the chosen story back to how a specific company, factory, contract, defense award, energy project, chip facility, data-center buildout, logistics project, or funding round is developing a named region. Look for jobs, local supplier formation, workforce pathways, facility reuse, capex, tax base, power, ports, training, infrastructure, and opportunity. The story should feel less random when it is tied to how a place is becoming more industrially capable.

## Brian-Approved May 26 Rule

Brian approved the May 26, 2026 Celestica/AMD/AI hardware buildout draft style as the rule for future S&W issues.

When Brian or Zach has already written the opening or lead, preserve it exactly unless explicitly asked to change it. Fill below the lead by expanding each relevant category with sourced one-sentence bullets, prioritizing company fundraises, announced deals, contracts, factory/capacity moves, customer wins, and other concrete commercial activity.

## Voice Rules

Write like a sharp industrial editor, not a policy memo and not a press-release aggregator.

Prefer:

- concrete actors, dollars, facilities, contracts, dates, customers, locations
- currency symbols for non-dollar amounts, such as `€17.5M`, instead of letter codes like `EUR17.5M`
- plain verbs such as `raised`, `won`, `opened`, `selected`, `expanded`, `began`, `filed`
- analysis that lands on production, procurement, supply chain, capital, power, or buyer behavior

Avoid:

- `this matters because`, `the signal is`, `the takeaway`
- `not just X, but Y` or `not only X, but Y`
- `landscape`, `inflection point`, `strategic imperative`, `unlock`
- hype language
- narrative mini-essays outside the lead

## Reader-Facing Structure

1. Subject/headline (witty, curiosity-bearing; see Subject Line Rule).
2. Preview text beginning with `Plus:`.
3. **Intro** (3 short paragraphs before Markets): greeting ("Happy Tuesday." / "Happy Thursday."), thesis line ("The build this week: [X]." — Brian, 2026-06-09; replaces the retired TBPN-derived "current thing" line), and a fast scan paragraph naming key stories with concrete dollars.
4. `Markets` / THE FLOOR dashboard (see Markets Rule below).
5. `The Lead`. NO inline source links in the Lead (Brian, 2026-06-09) — keep it clean analytical prose. Keep the lead story's sources in the local draft notes for verification; inline links live only on the category bullets + Dealbook. Minimize specific news dates in the Lead (Brian, 2026-06-09) — they add bloat and age fast; use them only when the date itself is the story (e.g., a deadline, a vote sequence). Drop "On June X" openers in favor of actor-first sentences.
6. Industry sections with linked bullets (see Bullet Format below).
7. `Dealbook` (same bullet format).
8. Short close ("Back Tuesday." / "Back Thursday.").

## Bullet Format (standardized 2026-06-09)

Every category bullet and Dealbook item uses this shape:

`**Company** [action verb phrase](source-url) rest of one-sentence description.`

- **Bold the company/actor name** at the start.
- **Link the action phrase** (the verb + key fact) to the primary source. The link IS the citation; do not add a separate parenthetical source name.
- The rest of the sentence is plain text. One sentence per bullet; no narrative.
- Use plain verbs: `won`, `raised`, `committed`, `cleared`, `signed`, `began`, `is building`.
- Each section uses the same H2 heading level.

**Canonical section names and order** (from AMCA, the Brian-approved standard):

1. Defense & Space
2. Semiconductors & Electronics
3. Energy & Materials
4. Manufacturing & Automation
5. Maritime & Shipbuilding
6. Supply Chain & Freight

Omit a section only when the candidate pool has zero credible in-window stories for it. Do not rename sections issue-to-issue (e.g., "Critical Minerals & Energy" or "Supply Chain & Industrial Assets" are retired variants; use the canonical names above).

## Subject Line Rule (updated Brian + Codex 2026-06-09)

The subject line is the most important line in the issue. It earns the open. Treat it like a headline at Payload, Tectonic, or Morning Brew: **witty, concrete, curiosity-bearing, and short enough to scan on a phone.** Brian wants subject lines that make people want to click, not just describe what's inside.

Good subject lines name a specific place, company, object, or constraint, then frame it with a verb or angle that makes the reader curious. They hint at a story without giving away the punchline. Examples from sent issues and Brian/Codex direction:
- "AMCA, SendCutSend, and The New Factory Middle"
- "Camden Becomes A Missile Factory Town"
- "Modine Sells The Factory Calendar"
- "A Factory for Factories Just Opened in Rural Missouri" (Brian/Codex 2026-06-09)

Before staging, generate 5-8 options and choose the one most likely to earn an open while staying relevant to the lead story. Bias toward the interesting/witty option over the safe/descriptive one.

Avoid: generic newsletter labels, vague abstractions, joke-first phrasing, emojis, hype language, titles that could fit any issue, and purely descriptive slugs that just summarize the lead.

## Research Gate

For production issues:

- build a candidate pool before drafting
- include 3-5 possible leads
- include 40+ raw candidates when a full production run is requested
- include links for every selected item
- verify live news, markets, dates, funding rounds, contracts, policy moves, and company status

## Argument Soundness Gate

Before staging or showing a Standard & Works issue, audit the lead thesis. Verify the factual spine and the economic-development spine against primary sources when possible, including jobs, facility location, capex, suppliers, workforce, infrastructure, public incentives, tax base, or regional opportunity. Use at least one credible context source for broader market or operating-model claims, separate supported facts from bounded inference and speculation, rewrite any inference stated as certainty, and save a compact argument audit in `research/argument-audit-YYYY-MM-DD.md` or the candidate pool. Do not stage a draft if the lead sounds clever but the sourcing does not support the mechanism.

## Markets Rule — "THE FLOOR" dashboard (Brian-approved 2026-06-08)

The markets block is **THE FLOOR**, a dark dashboard card that opens the issue (first body node, above The Lead). Brian approved this design 2026-06-08 and wants it **repeatable on every Tue + Thu issue** with the variables refreshed. The canonical HTML lives at [`data/sw-newsletter/the-floor.template.html`](../../../data/sw-newsletter/the-floor.template.html) — reproduce its styling byte-for-byte; only the values change. (This supersedes the earlier stacked plain-text markets format.)

Design (do not alter): dark gradient card (`#0f0f0f`→`#1a1a1a`), 12px radius, monospace (`'SF Mono', ui-monospace, Menlo, Monaco`), gold (`#c9a961`) `THE FLOOR` label top-left, a `MARKET CLOSE · <Day Mon D>` label top-right (prior session's close for a ~2pm publish), a 3-column table (security / price / change), and a `WATCH` macro line at the bottom. Change column: ▲ green `#4ade80` for up, ▼ red `#f87171` for down.

**Canonical basket — 6 rows in this order** (Brian, 2026-06-08; S&P 500 first):

1. **S&P 500** (`^GSPC`) — index level, no `$` (e.g. 7,391.60)
2. **Aerospace & Defense (ITA)** — `$` price
3. **Semiconductors (SOXX)** — `$` price
4. **Industrials (XLI)** — `$` price
5. **WTI Crude** (`CL=F`) — `$X.XX/bbl`
6. **Copper** (`HG=F`) — `$X.XX/lb` (dollars per lb in THE FLOOR, not cents)

Each row carries price + a day-change arrow + day-change % to one decimal. The `WATCH` line is one current macro/industrial datapoint with a number and a named source (ISM PMI, Philly Fed, durable goods, housing starts, etc.). Refresh every value live before staging (Yahoo, with Trading Economics / stockanalysis.com fallbacks per `sources.json#marketsTickers`); never carry stale numbers.

In the beehiiv "S&w industrialist" template, THE FLOOR already exists as the first htmlSnippet node — **update that node's HTML in place** (do not delete + re-add) so the block keeps its position, then verify via the snippet's Preview toggle. Mechanics for driving it via Chrome are in `the-floor.template.html`.

## Authorship Rule (Brian, 2026-06-09)

Zach is the sole listed author on The Industrialist. Do NOT add Brian as a co-author in Beehiiv. If the template carries Brian's name, remove it and leave only Zach Silber.

## Beehiiv Draft Setup Rule

Recurring S&W automation runs should create the review draft from Beehiiv's template library: Beehiiv -> Newsletter -> Template Library -> The Industrialist -> Use Template. Then replace the template title, preview/subtitle, and body with the current issue. Stage only the reader-facing body in Beehiiv; source notes, claims-to-check, handoff email, and LinkedIn copy stay in the local draft. Remove stale template body/image content unless Brian explicitly asks to keep it. Leave the post as an unscheduled synced draft for review.

## Boundary

Published issues are shareable S&W output. Pre-publish drafts and editorial deliberation stay local or in the agreed draft surface until Brian/Zach approve staging or sending.
