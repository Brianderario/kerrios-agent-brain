# 2026 Conference Prospecting — HWFYI sponsor pipeline

scope: event/workflow · updated: 2026-06-01 · owner: [[brian-derario]] · source: Kerri interactive run 2026-05-31/06-01

HWFYI evaluated 4 industrial/advanced-mfg conferences as sources of **sponsor prospects** (companies that sell tools/services to HWFYI's hardware/mfg-engineer audience) and as attend targets.

## Fit verdict (attend + prospecting)

| Show | Dates | Location | Fit | Notes |
|---|---|---|---|---|
| **Reindustrialize** | Jun 16–17, 2026 | Detroit | 🥇 Best brand/audience | Hard-tech/American-Dynamism founders+VCs+defense. **No public exhibitor roster** (invite-only) — attend/relationships, not prospecting. |
| **Automate** | Jun 22–25, 2026 | Chicago (McCormick) | 🥈 Best scale+relevance | Robotics/automation. 1,168 exhibitors scraped (w/ domains+descriptions). |
| **IMTS** | Sep 14–19, 2026 | Chicago (McCormick) | 🥉 Volume prospecting | 1,565 exhibitors scraped (descriptions; **domains gated** behind Vue data layer). Skews machine-tool/job-shop. |
| **FABTECH** | Oct 21–23, 2026 | Las Vegas | Niche | Metal fab/weld/finish. Roster on SmallWorldLabs (paginated) — only partially scraped. |

Calendar holds on brian@kerrihq.com + personal Google Task "📅 Book 2026 HWFYI conferences" (due Jun 3; Reindustrialize+Automate are imminent).

## Prospecting methodology (reusable)

1. Scrape exhibitor rosters (Map Your Show `remote-proxy.cfm?action=search&show=all` for IMTS/Automate-directory; detail pages for domains+descriptions).
2. Cut non-fits (trade assocs/media/edu, overseas commodity-component makers).
3. **Propensity score** by what they sell (software/SaaS, additive, robotics, vision = high; machine-tool/components = mid; distributor/commodity = low).
4. **Enrich top tier in Apollo** → re-score "sponsor NOW" on firmographics: **US + growth-stage (~20–500 ppl) + has a marketing team = NOW**; giants w/ in-house media + micro/overseas = LATER.

## Results (Automate + IMTS, 2,591 fit-prospects)

- Tiers: SPONSOR-NOW 137 · STRONG 428 · WARM 266 · LOW 1,760.
- Enriched top tier → **34 true SPONSOR-NOW** (US growth-stage w/ marketing). Top names: Tractian, UnitX, Tristar AI, Ati Motors, Cobot, Tolomatic, Cattron, Headwall, HEBI, Inbolt, Robot.com, Eureka, Dane, Hellbender; flagship **Xometry** (IMTS, domain pending).
- Demoted: Renishaw, ZEISS, TE Connectivity, Aptiv, Macnica (giants, in-house media).

## Artifacts

- Scored "now vs not" sheet (Drive): https://docs.google.com/spreadsheets/d/1FMY6gb62_BO5qXy2IAUBwmJE-_OynRvj4ougS4-41QA/edit
- Local working data: `~/conf-prospects/` (rosters, scored CSVs, enrichment).
- Apollo: 268 domain-bearing NOW+STRONG accounts created 2026-06-01 (outreach motion). Caveat: Apollo bulk-create has no dedup/tag — Drive sheet is the canonical segment list.

## Open / next

- Enrich remaining Automate STRONG+WARM (~305 domains) to promote into NOW.
- Resolve IMTS prioritized domains (288) → enrich + create accounts (Xometry et al.).
- FABTECH full roster scrape if pursued.

Related: [[../properties/hardware-fyi]] (sponsor products + lead-gen), [[kinetic]].
