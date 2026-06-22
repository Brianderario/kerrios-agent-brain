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
| Monaco look across all core screens (carried cohesively by the foundation; Tasks/Pipeline/Renewals/Revenue/Companies/kanban) + pipeline deal-card drag fix | 6/9 | 2026-06-18 (76b520b; 6/18 triage: remaining = optional editorial polish) |
| Ask Savant in-app copilot — slice 1 (read-only tools: pipeline_summary/find_deals/list_tasks/search_brain) on Ollama glm-5.2, global drawer from the Overview ask bar | 6 | 2026-06-18→19 (a4abee8, 42ce4c3) |
| Multi-user access matrix: capability helpers + restricted-event flag, strict per-user task siloing, pipeline gated to full members, Ironclad restricted to allow-list, Ari/Benji/Zach provisioned (Zach=event_guest), Ask Savant reads scoped per user — all prod-verified | - | 2026-06-19 (635c35e…aa39801, 8de18c5) |
| Ask Savant in-app ACTIONS — slice 2 (update_deal preview→confirm, create_task/update_task self-scoped, each Pundit-authorized as current_user + AgentRun audit, no external sends) | 6 | 2026-06-19 (98df743) |
| Savant queue-health badge clickable (failing-check popover) + Person `partner` contact_type (closes the recurring inbox-sweep enum gap) | - | 2026-06-19 (2ae39b7 #122, a49962b #121) |
| **Pricing intelligence read view** (candidate #1) — Revenue → Pricing intelligence: win/loss + win rate + realized price range by deal category and deal-size band, real closed deals only, full-members only | 7 | 2026-06-20 (0dff010, 2160915) |
| Dashboard calm-down + revenue quick-view (Brian-directed 6/19-20): revenue/forecast/won/$1M-gap strip on the deals board + Pipeline worklist (filter-aware), Overview event cards collapsed to a single summary line via `<details>` | 6/9 | 2026-06-20 (5c5e7ba, e9d7fb7, 216c177, 4448fee) |
| **Signal feed / prioritized prospect worklist** (candidate #2) — Revenue nav: companies ranked by recent `account_signal` activity (Crm::SignalFeed service + `/signals` screen), each row linking to company + signals, Pundit-scoped, full-members only, real signals only | 3 | 2026-06-21 (aa3f21f, b0f8619) |

## Directed active work — Monaco redesign (Brian directive 2026-06-18, takes priority)

Brian directed the build loop on 2026-06-18: "Execute the Monaco-inspired design (pure-black canvas, editorial serif display, floating pill nav, monochrome + violet→magenta accent, calm morning-brief home) across ALL of Savant. Keep the DATA whole; change the LAYOUT. Then wire a Claude SDK agent ('Ask Savant'). Run the loop until Savant looks like the future of a media company's OS." This is presentation-only (additive, view-layer, no migrations/API/sends) so it is overnight-safe AND it is Brian's standing same-day instruction — it outranks the generic candidates below until the screens are done. Foundation + Overview shipped 2026-06-18 (d4ddfda).

**SUBSTANTIALLY COMPLETE as of 2026-06-19.** The 6/18 triage found the foundation carried the Monaco look across every core screen cohesively, so the remaining reskin rows are optional editorial polish (deferred). The Ask Savant agent shipped both slices (read 6/18, actions 6/19) on Ollama glm-5.2, and the 6/19 run added the full multi-user access matrix (prod-verified). With the directed work done, the nightly routine now pulls from the generic Overnight-safe queue below until Brian directs fresh same-day work.

| Slice | Screens | Status |
|-------|---------|--------|
| Daily operating lanes | Tasks board, Approvals + Approval requests, Pipeline worklist + Deals kanban | **DONE** — absorbed by the foundation (6/18 triage); kanban drag fixed (76b520b); remaining = optional polish |
| CRM + knowledge | Companies + People, Knowledge records (Brain) | optional polish (foundation look already applied) |
| Revenue + content | Renewals + Revenue, Newsletter inventory + issues | optional polish (foundation look already applied) |
| Events + chrome | Events + Sponsor portal, Command palette + mobile bottom-nav polish + login screen | optional polish (foundation look already applied) |
| Ask Savant agent (Claude SDK) | additive read-only endpoint grounded in knowledge_records + CRM, streamed into the ask bar; any action approval-gated | **SHIPPED** — slice 1 read (a4abee8, Ollama 42ce4c3) + slice 2 actions scoped/audited (98df743) |

## Overnight-safe candidates (the queue — pull the top undone one when no directed work is open)

Ranked revenue/leverage first. All are additive, internal, real-data-only (phantom-pipeline rule), inside existing Savant nav, no external sends — i.e. safe for the unattended loop. Verified undone as of 2026-06-17. The directed Monaco/agent work above is now complete (2026-06-19), so this is the live queue: pull the top undone one each night.

| # | Candidate | Pillar | Value / revenue tie | Night-sized "done" | Status |
|---|-----------|--------|---------------------|--------------------|--------|
| ~~1~~ | ~~**Pricing intelligence read view**~~ | 7 | SHIPPED 2026-06-20 (run #2, 0dff010+2160915) → moved to Shipped table. | — | **SHIPPED 2026-06-20** |
| ~~2~~ | ~~**Signal feed / prioritized prospect worklist**~~ | 3 | SHIPPED 2026-06-21 (run, aa3f21f Crm::SignalFeed service + b0f8619 `/signals` screen) → moved to Shipped table. | — | **SHIPPED 2026-06-21** |
| 3 | **Touches-per-dollar / deal activity metric** | 4 | The efficiency number the vision manages by; shows which deals are over-worked vs neglected. | Deal show page + deals index show a touch count (from `activity`/outreach records) and, on closed-won, touches-per-dollar; real activity only. | **proposed 2026-06-21** |
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
- 2026-06-21 — Reconciled today's 6/21 build loop against origin/main. **#2 Signal feed SHIPPED** (proposed 6/20, Brian green-lit; commits aa3f21f `Crm::SignalFeed` service + b0f8619 `/signals` screen under Revenue nav, both on `origin/main`; the 6/21 ledger stalled mid-write at 07:58 ET but the commits landed) → moved to Shipped table. With #2 done, pulled the next undone Overnight-safe candidate = **#3 Touches-per-dollar / deal activity metric** and PROPOSED it for tonight. Novelty check: never proposed before (last 7 nights: 6/18 daily lanes, 6/19 #1 pricing intel, 6/20 #2 signal feed); codebase check confirmed `Activity`/`deal_activities` + `outbound_emails` data sources exist on Deal but `grep -i touch_count|touches_per_dollar|deal_activity` returns NOTHING → genuinely undone, with real data behind it. Revenue context sourced live from /api/v1/deals (paginated, 109 deals) + /api/v1/renewals: booked $653,422 / gap $346,578, open pipeline $229,500, late-stage 13 deals = $212K (11 proposal_sent $153K + Duro contract_sent $44K + Aris negotiation $15K), renewals 5 = $41,758. Remaining queue after this: #4 event sponsorship yield, #5 product pulse.
- 2026-06-20 — Reconciled run #2 + run #3 of the 6/19→20 build loop (NOW.md baton). Moved into Shipped: **#1 Pricing intelligence read view** (run #2, 0dff010+2160915, prod-verified won=41/lost=7, win 85%, median $10K) and the Brian-directed dashboard calm-down + revenue quick-view band (run #3, 5c5e7ba/e9d7fb7/216c177/4448fee). With #1 done, pulled the next undone Overnight-safe candidate = **#2 Signal feed / prioritized prospect worklist** and PROPOSED it for tonight. Novelty check: never proposed before; codebase check confirmed `AccountSignal` model + `api/v1/account_signals` + per-deal signal display all exist, but NO signal-ranked worklist screen (no `/signals` UI route) → genuinely undone. Revenue context sourced live from /api/v1/deals + /api/v1/renewals: booked $653,422 / gap $346,578, open late-stage 13 deals = $212K (11 proposal_sent $153K + Duro contract_sent $44K + 1 negotiation $15K), renewals 5 = $41,758; the 47 unpriced cold leads in open pipeline are exactly what a signal worklist would prioritize. Remaining queue after this: #3 touches-per-dollar, #4 event sponsorship yield, #5 product pulse.
- 2026-06-19 — Reconciled the 6/18 + 6/19 ledgers + origin/main. Moved into Shipped: Monaco look across all core screens + kanban drag fix (76b520b), Ask Savant slice 1 read (a4abee8 + Ollama 42ce4c3), the full multi-user access matrix (635c35e…aa39801, 8de18c5, prod-verified), Ask Savant slice 2 actions (98df743), and two cross-session wins (queue-health badge #122, Person `partner` contact_type #121). Marked the Directed active work SUBSTANTIALLY COMPLETE: Daily-operating-lanes DONE (absorbed by the foundation), Ask Savant agent SHIPPED (both slices), remaining reskin rows = optional polish. With no directed work open, pulled the top generic candidate = **#1 Pricing intelligence read view** and PROPOSED it for tonight (booked $653,422 / gap $346,578, $223.5K open across 24 priced deals incl. 10 proposals sent). Novelty check: Pricing intel was only ever "offered as a pivot option" 6/18, never the primary pick — clean to carry now. Told Brian in the email that the directed queue is clear and the overnight queue is down to a few revenue-analytics reads (signal feed, touches-per-dollar), inviting fresh ideas.
