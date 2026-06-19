# Savant Build Backlog

scope: workflow · updated: 2026-06-18 · owner: Brian + Kerri

The living queue of Savant product improvements. This is the memory that stops the nightly [[../../../agent-prompts/kerri-build-proposal/SKILL.md]] routine from re-proposing the same thing: it reconciles shipped items off the list, never proposes a retired/declined slice, and pulls the next undone candidate. Brian and Kerri groom this together; Brian can add ideas any time. Grounded in [[../properties/savant-product-vision]] (the ten pillars).

**How the nightly routine uses this page:** read the Candidates table, drop anything now Shipped/Retired (reconcile against the latest `data/build-loop-runs/` ledger), skip anything already `proposed` in the last 7 days that Brian has not actioned, pick the highest-value remaining Overnight-safe candidate, then mark it `proposed <date>`. When a candidate ships, move it to Shipped with its date + commit. When Brian declines one, move it to Retired/Declined with the reason.

## Permanent exclusions (never propose)

| Item | Why excluded |
|------|--------------|
| `$1M revenue_command` screen + `GET /api/v1/revenue_command` | **Retired by design 2026-06-14** (Brian confirmed the removal was intentional). Source live booked/gap from `/api/v1/deals` + `/api/v1/renewals` instead; never rebuild this surface or endpoint. |

## Shipped (reconcile OFF the candidate list; here so the routine remembers)

| Item | Pillar | Shipped |
|------|--------|---------|
| Renewals worklist + `GET /api/v1/renewals` + renewal_brief + case files | 5/8 | 2026-06-14 |
| Owed-deliverables roll-up (contracted vs delivered vs owed) | 1/5 | 2026-06-13 |
| Newsletter sell-through + editable placements (assign/schedule slots) | 1 | 2026-06-12 |
| Sponsor dashboard / proof-of-performance framework | 5 | 2026-06-12 |
| CRM relationship view (company→deals+people, person→deals) | - | 2026-06-13 |
| Front-page Overview redesign (NEEDS YOU queue + revenue band) | 6/9 | 2026-06-12 |
| Mobile nav drawer + PWA (Savant on the phone) | - | 2026-06-12 |
| Brain hub migration: full coverage, read-flip, write-flip, operating-layer, git-demote (Phases 1-5) | - | 2026-06-17 |
| Gap-closing pipeline: GET /api/v1/deals/:id/deal_brief (Crm::DealBrief) + Pipeline worklist screen under Revenue | 4/5 | 2026-06-18 (79e9395, 790424b) |
| PWA installability (active service worker, app shortcuts, safe offline) + mobile bottom nav for daily lanes | - | 2026-06-18 |
| Monaco redesign Phase 1: foundation (tokens/serif/pill component classes/shell) + Overview reskin | 6/9 | 2026-06-18 (d4ddfda) |

## Directed active work — Monaco redesign (Brian directive 2026-06-18, takes priority)

Brian directed the build loop on 2026-06-18: "Execute the Monaco-inspired design (pure-black canvas, editorial serif display, floating pill nav, monochrome + violet→magenta accent, calm morning-brief home) across ALL of Savant. Keep the DATA whole; change the LAYOUT. Then wire a Claude SDK agent ('Ask Savant'). Run the loop until Savant looks like the future of a media company's OS." This is presentation-only (additive, view-layer, no migrations/API/sends) so it is overnight-safe AND it is Brian's standing same-day instruction — it outranks the generic candidates below until the screens are done. Foundation + Overview shipped 2026-06-18 (d4ddfda).

| Slice | Screens | Status |
|-------|---------|--------|
| Daily operating lanes | Tasks board, Approvals + Approval requests, Pipeline worklist + Deals kanban | **proposed 2026-06-18** |
| CRM + knowledge | Companies + People, Knowledge records (Brain) | candidate |
| Revenue + content | Renewals + Revenue, Newsletter inventory + issues | candidate |
| Events + chrome | Events + Sponsor portal, Command palette + mobile bottom-nav polish + login screen | candidate |
| Ask Savant agent (Claude SDK) | additive read-only endpoint (anthropic gem + agents infra), grounded in knowledge_records + CRM, streamed into the ask bar; any action approval-gated | candidate (multi-item; sequence after the reskins) |

## Overnight-safe candidates (the queue — pull the top undone one when no directed work is open)

Ranked revenue/leverage first. All are additive, internal, real-data-only (phantom-pipeline rule), inside existing Savant nav, no external sends — i.e. safe for the unattended loop. Verified undone as of 2026-06-17. These wait behind the directed Monaco work above.

| # | Candidate | Pillar | Value / revenue tie | Night-sized "done" | Status |
|---|-----------|--------|---------------------|--------------------|--------|
| 1 | **Pricing intelligence read view** | 7 | Surfaces our own demand curve so quotes stop being guesses; informs every package price. | A read-only analytics page (under Revenue) showing win/loss count + realized price by package shape / category / deal size, from real `closed_won`/`closed_lost` deals only; zero invented numbers. | candidate |
| 2 | **Signal feed / prioritized prospect worklist** | 3 | Turns the `account_signal` data we already collect into a daily "why now" worklist, so outreach leads with a real trigger. | A read view (under Revenue or Network) listing companies ranked by recent signals (funding, hiring, engagement), each row linking to the company + its signals; real signals only. | candidate |
| 3 | **Touches-per-dollar / deal activity metric** | 4 | The efficiency number the vision manages by; shows which deals are over-worked vs neglected. | Deal show page + deals index show a touch count (from `activity`/outreach records) and, on closed-won, touches-per-dollar; real activity only. | candidate |
| 4 | **Event/Kinetic sponsorship yield view** | 8 | Treats event prospectus tiers as sellable inventory like newsletter slots; shows sold/reserved/open per tier. | An event page section showing each sponsorship tier's sold/reserved/open seats + sell-through %, from real `sponsorship_option`/`selection` records. | candidate |
| 5 | **Product pulse report (read-side)** | 6 | A time-windowed "what actually happened" report (sends, deals moved, approvals cleared, agent runs) so the next week anchors to real signal. | A read view summarizing a chosen window (7d/30d) from existing records; saved nowhere new, just a screen. | candidate |

## Supervised projects (NOT for the overnight loop)

Too big, or need external data / paid credits / external sends, which the build-loop hard rails forbid. Build these with Brian in a normal session.

| Project | Pillar | Why not overnight |
|---------|--------|-------------------|
| **Audience graph / subscriber moat** | 2 | The biggest strategic gap, but needs beehiiv subscriber ingestion + Apollo enrichment (external data + paid credits). Scoped separately in [[audience-graph-project]]. |
| Signal-driven autonomous outbound (send path) | 3/4 | Involves external sends; overnight runs never send. The signal *feed* (candidate #2) is the safe overnight half. |

## Grooming log

- 2026-06-17 — Backlog created. Seeded Shipped from the 6/12-6/14 ledgers + brain log; verified candidates 1-5 undone against the codebase; recorded the $1M screen permanent exclusion. Replaces "re-derive from scratch" with "pull next undone."
- 2026-06-18 — Reconciled the 6/18 ledger: moved gap-closing pipeline (deal_brief API + Pipeline worklist), PWA + mobile nav, and Monaco Phase 1 (foundation + Overview) into Shipped. Added Brian's 2026-06-18 Monaco-redesign directive as Directed active work (overnight-safe, presentation-only, outranks the generic queue) and PROPOSED tonight's slice = the 3 daily operating lanes (Tasks, Approvals, Pipeline + Deals kanban). Generic candidates 1-5 (Pricing intel, Signal feed, etc.) still undone, parked behind the directed work; offered Pricing intel as the pivot option in the email.
