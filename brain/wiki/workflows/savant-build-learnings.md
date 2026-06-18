# Savant Build Learnings

scope: workflow · created: 2026-06-17

The code-side learnings store for Savant ([[../properties/savant]] / `kerrihq-rails`). The compound step of the build loop ([[../../../agent-prompts/build-loop/SKILL.md]] Phase 6) appends here after every item, and reads this page during brainstorm so past lessons shape new work before any code is written. This is the [[compound-engineering]] two-tier model in practice; it is the code-side sibling of [[draft-learnings]] (email).

Two kinds of entry live here, and they age differently:

- **Learning** = one solution to one past problem (a bug fix, a convention discovered, a workflow that worked). Incident-level. Append freely; never edit an earlier entry.
- **Pattern doc** = a rule generalized from several Learnings. Higher leverage, higher risk when stale. Promote a Learning into the Patterns section only after several incidents point the same way, never from a single case. Review Patterns for freshness; Learnings need no upkeep.

## Learning format

```
## [YYYY-MM-DD] <module/area> — <one-line title>
**Problem:** what broke or was unclear, with the production evidence.
**Fix:** what was actually done (commit SHAs welcome).
**Lesson:** the durable takeaway the next agent should carry, in one or two sentences.
**Tags:** area keywords for retrieval (e.g. migrations, authz, api-compat, n+1, deploy).
```

Keep each entry plain enough that Don could read it cold and a future agent could grep it. The date lives in the entry, not a filename.

---

<!-- Learnings appended below by the build loop (newest at the bottom). -->

## [2026-06-18] crm/deal_brief — building an "analog" reporting service the right way
**Problem:** Needed an open-deal advancing brief as the analog of the shipped `Crm::RenewalBrief` (GET /api/v1/deals/:id/deal_brief), reusing the 6/13 DealHealth + stakeholder + engagement records without re-deriving anything or inventing numbers.
**Fix:** New `Crm::DealBrief` mirroring RenewalBrief's exact shape — same payload envelope, same `proof_points` builder spirit (one plain line per non-zero count, correctly pluralized), same null/empty discipline — and REUSING `deal.health_summary`, `deal.deal_stakeholders`, and `account_signals` engagement scope. `to_advance` = DealHealth `reasons` (the weak factors) + an engagement-derived "Proposal/Contract sent N days ago, not yet opened" from the proposal_sent/proposal_viewed signal pair. Thin controller action on DealsController + member route, gated `deals:read`. Commit 79e9395.
**Lesson:** When you build an analog of an existing reporting service, mirror the sibling exactly and reuse its scorer/associations rather than recomputing — the screen and the API stay one source of truth and the phantom-data discipline comes for free. Three concrete gotchas, all real here: (1) a nested hash embedded for a web view needs `.transform_keys(&:to_s)` or ERB (symbol keys) and JSON (string keys) read it differently — RenewalBrief already does this for `fulfillment_summary`; follow that precedent for any embedded hash. (2) `Deal#days_in_stage` returns `0` (not nil) when `stage_changed_at` is blank — if you want "null stays null," compute nil-safe in the service, don't reuse the model method. (3) The `track_stage_change` before_save CLOBBERS `stage_changed_at` + `last_activity_at` to `Time.current` on create, so factory-set timestamps don't stick; use `update_columns(...)` after create to age a deal in specs.
**Tags:** crm, services, api-compat, deals, deal-health, specs, factories, phantom-data, [[draft-learnings]]

## [2026-06-18] revenue/pipeline-worklist — zero-JS expandable worklist + DealBrief reuse
**Problem:** Needed a Pipeline worklist screen (open gap-closing deals: proposal_sent/negotiation/contract_sent, ranked value DESC then most-aging) under the existing Revenue nav, with each row expandable to its advancing brief, overflow-safe and with no new top-level surface.
**Fix:** `PipelineController` mirroring `RenewalsController` (read-only, Pundit org-show gate, preload the brief's associations to avoid N+1, order `value DESC NULLS LAST, stage_changed_at ASC`), a view reusing the renewals idioms (panel + `overflow-x-auto` table + native `<details>/<summary>`), and `@briefs = Crm::DealBrief` per deal so the screen and GET /deal_brief never drift. Web route `get "pipeline"` beside `get "renewals"`; one nav link added in the Revenue group. Commit 790424b.
**Lesson:** The renewals worklist's native `<details>/<summary>` + `overflow-x-auto`-wrapped table is the proven zero-JS, overflow-safe idiom for an expandable worked screen — reuse it wholesale, including the system spec that asserts `document.documentElement.scrollWidth <= window.innerWidth` at both 1440 and 390, collapsed AND expanded. Reuse the row's data service so the screen and API are one source of truth. Two gotchas: (1) rubocop chokes if you pass it an `.html.erb` path directly (it parses the template as Ruby → hundreds of false "offenses") — ERB is not a rubocop target, lint only `.rb` files and trust the project-wide `bin/rubocop` run. (2) A new link inside an existing nav group is NOT a "new top-level surface"; label it distinctly from any existing item (here the existing "Pipeline" = the deals kanban, so the new screen is "Pipeline worklist" at /pipeline) and key `nav-item-active` on its own path segment so the two don't both light up.
**Tags:** revenue, ui, views, system-specs, n+1, pundit, rubocop, nav, deals, [[draft-learnings]]

## [2026-06-18] pwa/mobile-shell — served PWA files are not installability
**Problem:** Savant had PWA routes, manifest links, and mobile meta tags, but the signed-in shell did not actively register the service worker or expose stable app shortcuts. The backlog item was "shipped" as a baseline, but phone use still felt like a responsive site instead of an installable app.
**Fix:** Added a small Stimulus `pwa` controller to register `/service-worker.js` and mark browser vs standalone display mode; enriched the manifest with `id`, `display_override`, portrait orientation, categories, and shortcuts; added redirect-only top-level shortcuts for Tasks, Approvals, Pipeline, and Events; replaced the placeholder worker with a conservative public-asset cache that never stores authenticated HTML. Commit cc03f7f.
**Lesson:** PWA work is not done when Rails serves `/manifest.json` and `/service-worker.js`; the authenticated shell must register the worker, manifest shortcuts need stable non-org-scoped routes, and private console pages must stay network-only. In Rails ERB JSON templates, use `raw path.to_json` for path helper values or the response can emit HTML entities such as `&quot;` instead of valid manifest strings.
**Tags:** pwa, mobile, stimulus, manifest, service-worker, auth, privacy, specs

## [2026-06-18] mobile/shell — fixed phone nav needs viewport proof, not visual confidence
**Problem:** Drawer-only mobile navigation was technically responsive but too slow for daily phone use. Adding a fixed bottom nav risked covering content, overflowing narrow pages, or breaking role-specific access if tested only by reading markup.
**Fix:** Added `shared/shell/_mobile_bottom_nav.html.erb` for signed-in non-sponsor users, with Home, Tasks, Approvals, Pipeline, and Menu for full users, event-safe links for event guests, badge counts from `ConsoleStatus`, and safe-area bottom padding on `.app-main`. Added a system spec at 390x844 that visits Overview, Tasks, Approvals, and Pipeline, asserts the nav is visible, main padding clears the nav height, and `scrollWidth <= innerWidth + 1`. Commit 4fb52c5.
**Lesson:** Treat fixed mobile navigation as a layout contract. Test it in a real browser at phone width, measure nav height against page padding, and assert no horizontal overflow on every high-use lane. Keep the bottom nav as a small overlay on the existing shell and use the existing drawer for secondary surfaces instead of creating a second app hierarchy.
**Tags:** mobile, ui, system-specs, safe-area, navigation, console-status, role-gating

## Patterns (generalized from multiple Learnings)

<!-- Promote a rule here only after several Learnings above point the same way. Each pattern cites the Learnings it came from. None yet. -->
