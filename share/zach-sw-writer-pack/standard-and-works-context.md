# Standard & Works: agent context pack

Drop this file into your Claude project as `CLAUDE.md` (or paste it into your project's custom instructions). It gives your agent the same Standard & Works publication context the KMG side runs on. This is the shareable slice: publication canon, voice sources, and production rules for the jointly produced newsletter.

## The publication

- **Standard & Works** covers how the industrial economy actually gets built: factories, defense, energy, supply chains, capital, and the regions they remake.
- **Author:** Zach Silber, sole listed author on every issue.
- **Audience:** operators, investors, and policymakers tracking the industrial economy.
- **The Standard & Works Newsletter** lands twice a week, Tuesday and Thursday at 2pm ET, on beehiiv.
- **Site:** standardandworks.com.
- **Partnership:** jointly produced with Kerri Media Group (Brian D'Erario), 50/50 net revenue split on jointly produced output. Kerri (Brian's AI chief of staff, kerri@hardwarefyi.com) runs newsletter production support on the KMG side.

## Canonical voice source

The voice authority is the published sent issues, not any style guide written from scratch. Strongest reference issues:

- "AMCA, SendCutSend, and The New Factory Middle"
- "Camden Becomes A Missile Factory Town"
- "Colossus Sized Bet"
- "AI Finds The Factory Floor In El Segundo"

When in doubt, have the agent reread two recent sent issues before drafting.

## Newsletter structure (reader-facing)

1. Subject line: witty, concrete, curiosity-bearing (see the skill's headline rules).
2. Preview text beginning with "Plus:".
3. Intro, 3 short paragraphs: greeting ("Happy Tuesday." / "Happy Thursday."), thesis line ("The build this week: [X]."), and a fast scan paragraph naming key stories with concrete dollars.
4. THE FLOOR: the dark markets dashboard card that opens every issue. Six rows in order: S&P 500, Aerospace & Defense (ITA), Semiconductors (SOXX), Industrials (XLI), WTI Crude, Copper ($/lb). Each row carries price, day-change arrow, and day-change % to one decimal, plus a WATCH line with one current macro datapoint and a named source. All values refreshed live before staging, never carried stale.
5. The Lead: clean analytical prose, no inline source links, minimal dates.
6. Industry sections with linked one-sentence bullets. Canonical section names and order: Defense & Space; Semiconductors & Electronics; Energy & Materials; Manufacturing & Automation; Maritime & Shipbuilding; Supply Chain & Freight. Omit a section only when it has zero credible in-window stories. Never rename sections issue to issue.
7. Dealbook: 6-10 items when the funding, M&A, financing, facility, or contract tape supports it. Same bullet format.
8. Short close: "Back Tuesday." / "Back Thursday."

## Hard production rules

- **Freshness:** every linked item published after the last sent issue and before staging. Verify publication dates. Omit thin sections rather than pad with stale items.
- **Authorship:** Zach Silber only. No co-authors on the masthead.
- **Lead lens:** economic development. Tie the story to how a named region is becoming more industrially capable.
- **Bullets:** `**Company** [linked action phrase](url) one-sentence description.` The link is the citation.
- **Pre-publish drafts stay private** until both sides approve staging. Published issues are shareable.

## Working with the KMG side

- Kerri stages newsletter review drafts in beehiiv (synced drafts, never published without review).
- Coordination email: kerri@hardwarefyi.com (she reads and replies; Brian is CCed on her sends).
- Brian's S&W address: brian@standardandworks.com.
