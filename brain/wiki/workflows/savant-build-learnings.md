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

## [2026-06-18] skills/prompt-fleet — auditing + improving the routine prompts (not Rails code)
**Problem:** Brian asked for a comprehensive pass over the ~30 agent-prompt skills/routines to make each one drive workflow, revenue, or growth. Risk: autonomously rewriting heavily-tuned operational prompts (where Brian never reads the diff) can silently regress hard-won rules.
**Fix:** Treated each prompt as a build-loop item. Fanned out 3 audit agents (sales / ops / content) to score every prompt vs the 3 goals + flag send-authority, then shipped ONLY additive, verifiable edits (new reporting lines, guards, quality gates) to non-send-authority files — 7 sales routines (commit de5b660), self-improve + the S&W newsletter trio (8cb2f81), plus the kerri-bot credential fix. Verification for a prompt edit = code-fence parity, insertion-present grep, six-field loop-contract preserved, and a hostile re-read; "ship" = git commit to the brain (no prod deploy).
**Lesson:** (1) Audit agents OVER-report headroom — verify every flagged "gap" against the live prompt before editing: eod-meetings orphan-dedup, lead-research lane-balance, and sw-writer recycled-frame were already handled; ~40% of flagged gaps were already dialed. Editing them would have been churn. (2) Keep every edit strictly ADDITIVE (a new gate/line, never a rewrite of an existing tuned rule) so regression risk is near-zero and Don can audit each as a clean insertion. (3) Two findings should become gap-sweep checks (system-level compounding): a **retired-endpoint reference scan** (grep prompts for `/api/v1/<x>` and probe each — `GET /api/v1/revenue_command` is now 404 but kerri-morning-brief STEP 2 still reads it for goal numbers, a live bug) and an **inline-credential scan** (grep skills/prompts for `xox[bap]-`/`sk-`/`Bearer <literal>` — a live Slack xoxb- token was hardcoded in the kerri-bot skill; secrets belong in `~/.kerri-chief/secrets/*.env`). (4) The send-authority rail correctly blocked the two highest-value fixes (morning-brief 404, kerri-skill pattern gate) from autonomous edit; propose-only via the report is the right channel.
**Tags:** skills, prompt-fleet, meta, build-loop, audit, gap-sweep, credentials, api-compat, send-authority, [[draft-learnings]]

## [2026-06-18] writing-craft — research-grounded craft playbooks + verified before/after, wired via the referenced page
**Problem:** Brian asked Kerri to become S-tier at two writing capabilities (B2B sales email/proposal and the S&W newsletter) and wire the craft into the agents. Risk in an unsupervised run: rewriting outbound voice Brian personally authored, editing send-authority drafting files, or shipping a "playbook" with no proof it improves output.
**Fix:** Treated each capability as a build-loop item. Fanned out 5 research agents over the real canon (sales: Lavender/Gong reply data + Braun/Holland/Coleman/Nelson; Cialdini/Voss/Challenger/Enns; Wiebe/Shleyner/Handley/Ogilvy. newsletter: Smart Brevity/Axios/Stratechery + a bullet-level re-read of Levine/Hobart/Doomberg/Potter/Packy), each returning imitable technique + micro-examples, not essays. Wrote a NEW synced `brain/wiki/workflows/hwfyi-sales-writing-playbook.md` (commit 53a2c90) and a PART 2 extension of the routine-loaded `agent-prompts/kerri-skill/references/sw-lead-writing-playbook.md` (commit e11023b). VERIFIED each with a real before/after scored against a per-playbook rubric, looped until it cleared. Wired via the referenced pages the routines already load (cold-outreach + pipeline-followup; writer + editor), additive only; held the one opinionated outbound change (the cold opener flip) as propose-only via report task d7304d47.
**Lesson:** (1) Verify which file the routine ACTUALLY loads before extending a playbook. The S&W Lead playbook had two copies (a `brain/.local` one my memory pointed at, and the committed `references/` one the writer+editor actually load); a grep saved me from extending the orphan, which I then reduced to a pointer to kill duplicate-drift. (2) Proof for a writing change is a real before/after that FAILS the rubric in the BEFORE and PASSES in the AFTER, not "the playbook reads well": the current cold opener fails 4 of 10 rubric points, and three real 6/18 bullets ended on a bare fact (rubric item 2). (3) The biggest craft lever is often the most opinionated (cold-outreach STEP 4 opens about us, the #1 reply-killer in the data); ship the additive craft + rubric now, fence the opinionated outbound-wording change as propose-only for the human. (4) Wire craft through ONE referenced page the routines load, not by bloating each routine prompt; and make the editor/critic wiring flag-don't-fabricate so a critic never invents an unsupported "so what" against the freshness/accuracy bar.
**Tags:** writing, sales, newsletter, prompt-fleet, build-loop, playbook, verification, send-authority, [[draft-learnings]], [[hwfyi-sales-writing-playbook]]

## Patterns (generalized from multiple Learnings)

<!-- Promote a rule here only after several Learnings above point the same way. Each pattern cites the Learnings it came from. None yet. -->
