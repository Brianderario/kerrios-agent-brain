# Hardware FYI (HWFYI)

scope: property · updated: 2026-06-12

## Newsletter ad calendar — SOURCE OF TRUTH

**Savant** (Newsletter Inventory) is the source of truth for the Hardware FYI newsletter ad calendar as of 2026-06-12. All issue dates, primary placements, partner program slots, and sponsor commitments live there.

- **Savant inventory:** `https://kerrihq-rails-xtua.onrender.com/organizations/.../newsletter_inventory` (web UI) or via the V1 API `/api/v1/newsletter_inventory_imports` (bulk upsert, `brain:import` scope).
- **Read Savant before answering any "what's booked / what's open / when does X run" question.** It supersedes memory of placement dates -- always check live, since slots get booked between sessions.

### Google Sheet (verification mirror, contracts, revenue)

The Google Sheet retains contracts, revenue ledger, CY2026 revenue goal, and Partner Program tracker tabs. It is NOT authoritative for the ad calendar (issue dates / sponsor placements) -- Savant is.

- **Sheet:** https://docs.google.com/spreadsheets/d/1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk/edit (fileId `1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk`)
- **Tabs/sections:** Contracts list · Product/revenue ledger · ~~Ad calendar~~ (legacy, use Savant) · Partner Program tracker · monthly event/webinar/panel rollups.
- **CY2026 goal tab:** `CY2026 Revenue Goal` is the central `$1,000,000` revenue tracker and pipeline. It was created 2026-06-07 and seeded from the live `Contract Breakdown` tab at `$578,164.73` booked/earned CY2026 revenue from 408 source rows. The top of the tab is a readable board: Goal / Closed Won / Pipeline Amount / Gap to Goal, then status columns `Prospect`, `Interest`, `Contract Won`, `Contract Lost` with compact deal cards. The structured automation ledger starts lower on the same tab. Current strict seed: `$50,000` priced open pipeline / `$32,000` weighted, from 1 Prospect, 9 Interest, 33 Contract Won, and 2 Contract Lost rows. The board excludes untouched outreach targets and does not assign dollar value until pricing/proposed terms are source-backed; unpriced real opportunities stay visible as `TBD`. Cash collection still needs separate Stripe/invoice reconciliation. Maintain/check it with `node scripts/hwfyi-revenue-goal-sheet.mjs --ensure|--seed-contract-breakdown|--seed-pipeline|--pipeline-summary|--check|--read`.

KMG-owned media property. Industry newsletter + community + events for hardware / industrial base / advanced manufacturing.

## Core facts

- **Parent:** [[kmg]] (Kerri Media Group)
- **Domain:** hardwarefyi.com
- **Lead:** [[brian-derario]] (CEO) — content + sponsor relationships
- **Ops:** [[benji-chia]] (CDO) — distribution, growth, automation
- **Active newsletter:** Hardware FYI newsletter -- twice weekly (Tue/Sat). Former names for the two editions ("The Analogue" for Tuesday, "Weekend Wire" for Saturday) are retired; sponsors see one newsletter.
- **Event flagship:** [[kinetic]] (annual SF conference, last edition 2026-05-12 to 13)
- **Job-prefix code in sweep:** `H####`
- **Approval list (Google Tasks):** "Hardware FYI"

## Mailbox routing

- `kerri@hardwarefyi.com` — Kerri's external sending address
- `brian@hardwarefyi.com` — Brian's branded email
- `benji@hardwarefyi.com` — Benji
- `info@hardwarefyi.com` — general inbound
- Auto-CC safety net: `brian@hardwarefyi.com` on every Kerri/Brian HWFYI send

## Audience

Demographic splits (industry / seniority / geography / company size) live in **[[hardware-fyi-audience]]** — read it before answering any sponsor audience-fit question. Tier A = directional Apollo sample; Tier B = canonical media-kit numbers (pending Brian/Benji).

## Editorial stance

Industry-base focused. Semiconductors, robotics, EVs, energy, defense, advanced manufacturing. Peer-tone, non-fluffy, builder-audience. See [[editorial-voice]] (TBD).

## Sponsor relationships

Tracked under [[wiki/deals/]]. Apollo enrichment cadence in [[partnership-research-monthly]] (TBD).

## Sponsor product formats (as of 2026-05-26)

Two packages on the Hardware FYI newsletter. Use these consistently in sponsor conversations.

### Current format

- **Primary Placement** — $1,500 line-item placement anchor for quote-menu conversations. Older package anchors were $10K / 6 sends or $6K / 3 sends; use the current line-item anchor when Brian asks for product-by-product pricing. Full ad unit (image + copy + CTA) inside the Hardware FYI newsletter. Reference example: [Colab ad in "what the datasheets don't say"](https://hardwarefyi.substack.com/p/what-the-datasheets-dont-say).
- **Partner Program** — $12.5K / 6 months standard. **Sold in flexible durations** — Brian uses **2-month and 3-month** terms inside package bundles (observed in the 2026-05-29 Modelwise quote), not only the 6-mo standard. Sales-list format: Partner Program (6 Months); 2x per week feature in Tools We Love; 3x Primary Placement, with one usable during an approved one-month trial; logo in the Partner Program sponsor image + on the website. Reference examples below.
- **Custom Content / Custom Content Article** — **starts at $5,000** (Brian-corrected 2026-06-18 on the H0059 GrayMatter quote). This **supersedes the earlier $2.5K figure**, which was stale — **do not quote $2,500**. A full editorial feature where Benji captures the company/customer story; runs as content, not an ad. Price scales up from $5K with scope/execution; research reports are a separate, higher product (below).
- **Custom research report** — starts at $6K.

### Package quoting (observed practice, 2026-05-29)

When Brian quotes a post-call sponsor, he sends **2–3 mixed-product bundles (Package A/B/C), anchored high → low**, with **rate-card anchoring on the top tier** (e.g., `$20K ($25K rate card pricing)`). Pricing is holistic/rounded, not strict line-item (e.g., **3x Primary Placements ≈ $5K**). Full pattern: [[../workflows/hwfyi-package-quote-playbook]].

### Reference example issues

- **"industry-40-was-early-not-wrong"** (current, 2026-05): Jiga ad = Primary Placement; "Tools From Our Sponsors" = Partner Program slot. Best current visual example for sponsor quotes.
- ["what the datasheets don't say"](https://hardwarefyi.substack.com/p/what-the-datasheets-dont-say): CoLab unit = Primary Placement; recurring sponsor/logo section = Partner Program.

### Format shift — starts August 2026

- **Primary Placement** becomes a single "in partnership with [sponsor]" logo lockup at the **top** of the newsletter, tied to the current Primary Placement ad unit which moves to the **second-story** slot.
- **Partner Program** logo image moves to the **bottom** of the newsletter.

### Positioning rule

Either tier can be tuned for **brand awareness** OR **lead generation** — driven by how the sponsor positions copy + CTA, not by the tier itself. When a sponsor states a numeric goal (e.g. "1000 paid users in 3 months"), that's CTA-led — pull examples from past CTA-driven placements, not awareness-driven ones.

## Lead-gen products (beyond newsletter)

Newsletter placements are awareness-leaning even when CTA-driven. When a sponsor's stated goal is lead volume or signups (not impressions), lean these tools first:

### Webinars
- **Floor:** 125 attendees guaranteed (per Brian, 2026-05-25).
- **Ceiling:** up to 250 attendees when the content is strong enough to drive organic share.
- Sponsor's effective product is the attendee list + the warm intros from a live audience that opted in for the topic.
- **Line-item price:** $5K when Brian asks for product-by-product pricing.
- **Sales guardrail:** Kerri may quote the standalone webinar price in product line-item menus. Do not quote bundle price or discount percentage in sponsor drafts unless the price is already approved in that exact thread or a current pricing record is added here.

### Happy hours
- **Range:** 200–500 leads per event.
- Highest-yield lead-gen product HWFYI runs. Use these as the centerpiece of any lead-volume conversation.
- **Table sponsorship — $5,000 standalone** (Brian-set 2026-06-17 on the H0059 GrayMatter quote; first time the quarterly SF happy hour was priced as a standalone line rather than bundled into a larger package). Sponsor gets a table + swag/demo presence, ~150–300 attendees (students through mid-level engineers — strongest in-person fit for a **recruiting / new-grad / intern** buyer), and the full attendee lead list afterward. Prior precedent only bundled "2x happy hour" into $25K+ packages (Summit Interconnect 2026-05-29); this is the canonical à-la-carte number now. SF Tech Week event remains the more senior, priced event ($15K Presenting / $6K Supporting).
- **SF Tech Week tier inclusions (first itemized to a client 2026-06-20, Almond Robotics / H0156; drafted by Kerri, NOT yet formally confirmed by Brian as a canonical rate-card):** Supporting ($6K) = demo space at the event, logo on event materials, guest passes for the sponsor's team, full attendee list afterward. Presenting ($15K) = everything in Supporting plus headline/presenting billing, a short speaking slot, premium demo placement, and a newsletter mention promoting the event. Before this, no SFTW tier deliverables were documented anywhere (brain, media kit, Drive, or the Duro SOW, which only listed "Presenting Sponsorship $20K" with no line items). FORMALIZE: confirm these inclusions with Brian and build a canonical SFTW sponsor-tier sheet so every quote and SOW matches. Price variance to resolve: Almond was quoted Presenting at the canonical $15K; Duro's bundled SOW valued Presenting at $20K.

### Bundle pattern — "near-lead-guarantee" offer

For lead-gen prospects with a hard numeric target (e.g. Aris Machina at 1000 paid Protos users in 3–4 months), the strategic shape is **2 webinars + Partner Program**. This combines (a) ~250–500 guaranteed warm leads from the webinars with (b) 26 weeks of recurring presence to convert the long tail. Sells as a single bundle, not three line items.

Pricing for that bundle is not quote-ready until Brian/Benji confirm the current webinar price and bundle discount authority. Do not reuse the older ~$17K range as a live quote without fresh approval.

### Product-selection rule for lead-gen conversations
1. Lead with **happy hours** if the prospect can attend / sponsor a date that fits their cycle.
2. Lead with the **webinar bundle** (above) when timing or geography rules out a happy hour.
3. Standalone Partner Program / Primary Placement should NOT be the primary recommendation in a lead-gen conversation — they're support layers, not the lead-gen engine.

## Media kit

- **Editable source (Canva): "Hardware FYI Media Kit 2026"**, design id `DAHMMxqPVjo` (created 2026-06-10 by Kerri from a page-filtered copy of Benji's "Hardware FYI Sponsor Deck Y2.pptx" `DAGuGiB0yNs`; the Y2 original is untouched). 21 pages, all 2026 content edits committed: cover year, 20,000+ subs, 30% growth, Weekend Wire (replaces First Principles), Kinetic proof page (replaces a leftover "The Rebooting" template page that had $20K pricing), Digital Workshops retitle, 2026 roadmap, fixed overlapping stats layout. Scratch/reference pages from other newsletters' kits (TLDR, Milk Road, The Rundown, Payload) were excluded from the copy.
  - **Full-deck QA passed 2026-06-10 (second pass, Brian flagged formatting):** now 19 pages. Fixed: Weekend Wire body (was all-orange with stray bullet, now white paragraphs), Kinetic page spacing, and DELETED a leftover "The Rundown" partner-logo page (IBM/AWS logos from another newsletter) that had survived the initial page selection.
  - **Manual items for Benji (Canva API page-inserts fail on PPTX-imported designs):** (1) re-add the education/university-logos page, lost during failed API page operations; copy it from the Y2 original. (2) Add the four new product pages (Partner Program, Content & Research, SF Tech Week, Executive Dinners); finished versions in the local PDF/PPTX below. (3) Swap the B/W stock photo on the Kinetic page for a real Kinetic photo. (4) Update the numbers-page growth chart, which still shows Q3 2024 to Q2 2025 (~19.5K); chart data is not API-editable.
- **Sponsor-ready file:** `~/Projects/hwfyi-media-kit-2026/Hardware FYI Media Kit 2026.pdf` (19 pages) + same-name `.pptx` (created same day, content-identical decisions; includes the four product pages missing from Canva). Rebuilt image-based from the 2025 kit PDF.
- Changes vs 2025 kit: headline subscriber count 16,000+ → **20,000+** (Brian's call; kit's own chart shows ~23K Q1 2026), growth claim corrected from "112% quarterly" to "over 30% quarterly", cover year → 2026, products overview expanded to six items, and five new pages: Partner Program, Content & Research, Kinetic year-one proof (350 attendees / 27 sponsors / 8.4/10 satisfaction + 2 approved survey quotes), SF Tech Week (Oct 5-9, 2026), Executive Dinners. **No pricing anywhere**, per Brian.
- The 2025 kit's 16,000+ and "112% quarterly growth" claims are retired — do not quote them.

## Related

- [[kinetic]] — flagship event
- [[kmg]] — parent company
- [[draft-learnings]] — what Kerri's learned about replying on this property
