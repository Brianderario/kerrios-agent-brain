# 2026-06-13 CRM Intelligence Build Loop

Invocation:
- Brian asked to use Savant's build loop skill to build the five CRM product upgrades selected from modern CRM research, without porting outside products or adding noisy routines.
- Product target: make Savant a stronger single source of truth for Kerri agents by adding intelligence and organization around existing CRM facts, not duplicate records or new settings.

Starting state:
- Savant Rails repo: `/Users/brianderario/Projects/kerrihq-rails`, clean on `main` at `e6dc1de Add Savant brain MCP export`.
- KerriOS dirty state: unrelated `data/companies.json` already modified; leave it untouched.
- Current Savant primitives found: companies, people, deals, activities, renewal case files, fulfillment rollups, newsletter inventory, sponsor assets, contracts, and placement metrics.

Ship order:
1. Account signal ledger: canonical structured "what happened" substrate across company, deal, person, and source records.
2. CRM hygiene score: computed missing/stale/conflicting data issues that agents can act on.
3. Deal health: risk level and concrete reasons derived from real CRM fields, fulfillment, renewal, stakeholders, and signals.
4. Stakeholder map: deal-specific roles, influence, relationship strength, and notes attached to existing people.
5. Proposal / asset engagement tracking: dedicated engagement slice backed by account signals and real sponsor/contract/activity records.

Rules:
- No external sends.
- No destructive data operations.
- No invented CRM facts.
- No new permissions or settings.
- Additive migrations only.
- Tests and documentation required before calling complete.

## ITEM 1 - Account Signal Ledger

Status: shipped locally, pending commit/deploy
Started: 2026-06-13 10:49 EDT

Brainstorm:
- Existing Activity and CaseFileEntry records are useful but too deal-specific and fragmented for agents trying to understand an account quickly.
- A structured account signal can safely normalize source-backed CRM events without replacing existing records.
- Signals should support direct API appends plus deterministic backfill/upsert from existing internal records.

Plan:
- Add `account_signals` table with organization, company, deal, person, occurred_at, signal_type, subject, body, strength, source, metadata, and optional source_record reference.
- Add uniqueness guard for source-backed signals to prevent duplicate derived records.
- Expose read/create API using existing `deals:read` and `deals:write` scopes.
- Render recent signals on company and deal pages.
- Add service-level backfill from source-backed records where safe.

Review:
- Added `AccountSignal` with org/company/deal/person targeting, source-backed uniqueness, signal strength, engagement classification, and target/org validations.
- Added source-backed recording callbacks for Activity, CaseFileEntry, Contract, SponsorAsset, SponsorCommitment portal views, and PlacementMetric.
- Added deterministic migration backfill and service backfill. Backfill skips records that do not resolve to a company/deal/person.
- Added `GET/POST /api/v1/account_signals` under existing `deals:read` / `deals:write` scopes.
- Rendered recent signals on company and deal pages.

Verification:
- `bin/rails db:migrate` succeeded.
- Focused RSpec passed: 60 examples, 0 failures.
- Full RSpec passed: 1531 examples, 0 failures, 1 pre-existing pending.
- `rails zeitwerk:check` passed.
- RuboCop on new app/spec files passed: 15 files, no offenses.
- Browser smoke in test env passed on deal and company pages, desktop and mobile, with no horizontal overflow.

## ITEM 2 - CRM Hygiene Score

Status: shipped locally, pending commit/deploy

Brainstorm:
- Agents need to know whether a CRM record is usable before acting on it.
- Hygiene should expose concrete fixes, not another opaque score.
- The score should derive from existing fields only.

Plan:
- Add `Crm::HygieneScorer` for Company and Deal.
- Include the hygiene object in company/deal API payloads.
- Render hygiene cards on company and deal pages.

Review:
- Company hygiene flags missing domain/job id, review flags, no contacts, no reachable email, duplicate aliases, and stale open accounts.
- Deal hygiene flags missing company/value/probability/expected close/primary contact/next action, stale activity, long stage age, missing stakeholder map, owed fulfillment, and renewal action gaps.
- The service returns issue codes, severity, summary, and action text. It does not write truth fields.

Verification:
- Covered by `spec/services/crm_hygiene_scorer_spec.rb`, API payload specs, company view spec, full suite, and browser smoke.

## ITEM 3 - Deal Health

Status: shipped locally, pending commit/deploy

Brainstorm:
- Deal health should answer "what is at risk and what should happen next" from real Savant records.
- It should combine next-action discipline, buyer coverage, engagement, fulfillment, and renewal status.

Plan:
- Add `Crm::DealHealth`.
- Include health in deal API payloads and company deal summaries.
- Render a Deal Health card on the deal page.

Review:
- Health returns score, tier, label, risk reasons, strengths, and next best action.
- It uses real deal fields, account signals, stakeholder roles, renewal status, and fulfillment_summary only.
- No values, probabilities, or buyer facts are inferred.

Verification:
- Covered by `spec/services/crm_deal_health_spec.rb`, deal API specs, deal page request spec, full suite, and browser smoke.

## ITEM 4 - Stakeholder Map

Status: shipped locally, pending commit/deploy

Brainstorm:
- Modern CRMs help teams reason about buying committees. Savant needed the same without duplicating contacts.
- The correct shape is deal-specific roles attached to existing `people`.

Plan:
- Add `deal_stakeholders` table and `DealStakeholder` model.
- Enforce organization scoping and require the person to belong to the deal company.
- Add nested API CRUD and a web deal-page map/form.

Review:
- Roles include champion, economic buyer, influencer, technical evaluator, procurement, legal, blocker, executive sponsor, day-to-day, and unknown.
- Duplicate `(deal, person, role)` rows are rejected.
- The web form uses existing company contacts only.

Verification:
- Covered by `spec/models/deal_stakeholder_spec.rb`, `spec/requests/api/v1/deal_stakeholders_spec.rb`, deal page request spec, full suite, and browser smoke.

## ITEM 5 - Proposal / Asset Engagement Tracking

Status: shipped locally, pending commit/deploy

Brainstorm:
- Engagement should not be a new disconnected event store.
- Savant already has real engagement facts: contracts, sponsor portal views, sponsor assets, placement metrics, case files, and activities.

Plan:
- Treat engagement as an account-signal subset.
- Backfill and record contract sent/viewed/signed, portal viewed, asset submitted/approved/rejected, placement delivered, and placement metrics recorded.
- Render engagement summaries on company and deal pages.

Review:
- Engagement stays source-backed and deduplicated through `AccountSignal`.
- Manual agent writes can add proposal/meeting/note/risk signals through the same API.
- No external CRM service, paid integration, or new setting was added.

Verification:
- Covered by AccountSignal model/API specs, page specs, full suite, and browser smoke.

## Final QA

- Migration: `bin/rails db:migrate` passed.
- Loader: `bundle exec rails zeitwerk:check` passed.
- Style: `bundle exec rubocop <new app/spec files>` passed, 15 files, no offenses.
- Focused tests: 60 examples, 0 failures.
- Full tests: 1531 examples, 0 failures, 1 pre-existing pending (`spec/models/user_spec.rb`).
- Browser smoke: local test server on port 3037; disposable test account; deal page and company page verified on desktop 1280px and mobile 390px. All new sections present, no horizontal overflow.
- Documentation: `docs/crm-intelligence.md` added; `docs/brain-architecture.md` updated.

Open deployment step:
- Commit, push to `main`, wait for Render deploy, and production-probe the new API/page surfaces.
