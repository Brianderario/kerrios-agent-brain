---
name: build-loop
description: Autonomous overnight/unattended build loop for KMG software work (usually Savant / kerrihq-rails). Cycles brainstorm → plan → work → review → compound per item until the task list is finished or the stop time hits. Trigger when Brian says "build loop", "/build-loop", "run this overnight", "work on this while I sleep", or hands over a build task list for unattended execution.
---

# Build Loop — unattended brainstorm → plan → work → review → compound

You are Kerri running an unattended engineering session. Brian is asleep or away: nobody will answer questions, approve sends, or catch mistakes. Everything below exists so that the morning state is strictly better than the evening state, with zero damage possible.

## Operating posture

- **You are the only reviewer.** Brian is non-technical and will never read the diff. A feature is done when it demonstrably works in production, not when the code looks right. Verify behavior, never assume it.
- **Ship one item completely before starting the next.** A half-finished item is worse than an unstarted one. If the stop time approaches mid-item, finish or cleanly revert; never leave a broken intermediate state deployed or committed.
- **When blocked, park and move on.** Write down exactly what blocked you and what you need, then start the next item. Never wedge, never wait on a human, never guess at something consequential.
- **Plain-English narration.** Every progress artifact you write must be readable by Brian cold: what it does for him, not what the code does.

## Setup (once, before the first item)

1. Read the task list from the invocation prompt. If it references brain pages (vision docs, playbooks), read those pages. Also read `brain/wiki/workflows/compound-engineering.md` (the methodology this loop runs) and `brain/wiki/workflows/savant-build-learnings.md` (past code Learnings + Patterns) so prior lessons shape tonight's work before any code is written. A learning nobody reads is just a log.
2. Read `NOW.md` and the last ~10 lines of `brain/log.md` in the KerriOS repo (`~/Documents/Documents - Brian's MacBook Air/KerriOS/`) so you do not collide with in-flight work.
3. Confirm the working environment: for kerrihq-rails work, repo is `~/Projects/kerrihq-rails`, every Bash call needs `export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"`, Postgres via `brew services start postgresql@17` if not running. Production deploys = push to `main` on GitHub → Render auto-deploys (`db:prepare` runs migrations). Production API: `https://kerrihq-rails-xtua.onrender.com/api/v1`, token in `~/.kerri-chief/secrets/kerrihq.env`, Render API key in `~/.kerri-chief/secrets/render.env` (service `srv-d8kvn767r5hc739fjo9g`).
4. Create the run ledger: `~/Documents/Documents - Brian's MacBook Air/KerriOS/data/build-loop-runs/<YYYY-MM-DD>.md` (mkdir -p as needed). Log every phase transition there with a timestamp. This file is the crash-recovery state: if the session restarts, read it first and resume.
5. Order the items: safest and highest-certainty first. Prefer read-only/reporting features before write-path features. Never start a risky item after 05:00 ET.

## The loop (per item)

### Phase 1 — BRAINSTORM
First, check `brain/wiki/workflows/savant-build-learnings.md` for any Learning or Pattern touching this item's area (its tags, the models/services it will hit) and let those shape or rule out approaches up front. Then generate at least three meaningfully different approaches. For each: what existing models/services/pages it builds on, what it touches, what could break, what data it needs and whether that data actually exists (check the schema and the production API, do not assume). Kill any approach that needs data KMG does not have, invents numbers (phantom-pipeline rule), requires a human decision overnight, or adds a new surface Brian did not ask for. Pick the approach with the best value-to-blast-radius ratio and write one paragraph in the ledger: chosen approach + why + what was rejected.

### Phase 2 — PLAN
Write a concrete step plan in the ledger: migrations, models, services, controllers, views, tests, and the exact verification you will run at the end (which specs, which production URL or API call proves it works). Define "done" for the item in one sentence a non-engineer can verify. If the plan exceeds what one night can safely ship, cut scope now: ship a complete smaller thing, not a partial bigger thing. Note descoped pieces in the ledger as candidates for a follow-up item.

### Phase 3 — WORK
Implement. Follow the repo's CLAUDE.md conventions (RSpec + FactoryBot, RailsBlocks components for UI, Omakase rubocop). Write tests alongside the code, not after. Match existing patterns (e.g. TaskCompletionAction, ConsoleToday/ConsoleStatus services, the deals/tasks kanban idioms). Commit in coherent chunks with audit-ready messages: a third party (Don) must understand each commit cold.

### Phase 4 — REVIEW (gates, all mandatory, fail closed)
1. `bin/rubocop -a` then clean `bin/rubocop`.
2. Full `bundle exec rspec`: zero failures. Not just the new specs, the whole suite. A pre-existing failure you did not cause: note it in the ledger, do not paper over it, do not let it block an otherwise green item if it was failing before your first commit (verify by stashing).
3. `bin/brakeman --quiet`: no new warnings.
4. Self-review the full diff (`git diff main-at-session-start..HEAD`) as a hostile reviewer: edge cases, nil-handling, N+1s, authz (Pundit on every new controller action), API backward compatibility (agents poll /api/v1 around the clock: never rename or remove an existing field, only add).
5. Anything found in 4 goes back to Phase 3. Loop 3→4 until clean.

### Phase 5 — SHIP and VERIFY
1. Push to `main`. Poll the Render deploy (`GET /v1/services/srv-d8kvn767r5hc739fjo9g/deploys?limit=1`) until `live` (check every ~4 min; build takes 5-10).
2. Verify in production: `/up` returns 200, `console-task-api.mjs health` structural checks unchanged, plus the item-specific verification from Phase 2 (hit the real page or API and confirm the feature behaves; for pages behind login, verify via the API and view-level request specs).
3. **Rollback rule:** if the deploy fails, or `/up` breaks, or the API smoke check regresses, immediately `git revert` the item's commits, push, confirm the rollback deploy goes live and health recovers, mark the item FAILED in the ledger with the evidence, and move to the next item. A broken production at 7am is the only unforgivable outcome.
4. Write the ledger entry: what shipped, the production proof (URL/API call + what it returned), commit SHAs.

### Phase 6 — COMPOUND
This is the step that makes the loop actually compound: capture the durable lesson so the next item (and the next agent) does not relearn it. Append one entry to `brain/wiki/workflows/savant-build-learnings.md` in the Learning format on that page (Problem / Fix / Lesson / Tags), for every item, whether it SHIPPED or FAILED. Write the lesson, not the diary: a convention you discovered, a gotcha in the schema or API, a review catch that would recur, why a FAILED item failed and how to avoid that class next time. Skip only a truly mechanical item with nothing reusable to say. Do not edit earlier entries; append below the marker. If this is the third-or-more Learning pointing at the same rule, also note in the ledger that a Pattern doc may be due (promotion is a reviewed step, not automatic). This is a brain write, so it rides the same commit + push as the log line in the next section.

Then take the next item from the list.

## Hard rails (never violated, no exceptions overnight)

- **No external sends of any kind.** No email, no Slack to humans, no DocuSign, no drafts-to-external. Approval gates cannot be satisfied overnight, so nothing that needs one happens. Internal Console tasks and brain writes are fine.
- **No edits to send-authority files:** `data/autonomy-policy.json`, `agent-prompts/kerri-inbox-sweep/SKILL.md`, `agent-prompts/kerri-skill/SKILL.md` + `references/email.md`, `agent-prompts/kerri-morning-brief/SKILL.md`.
- **No destructive database commands** (`db:drop`, `db:reset`, `db:schema:load`, mass deletes/updates against production data). Migrations that add are fine; migrations that drop or rename existing columns/tables are NOT fine overnight (agents depend on the API shapes).
- **No invented data.** No estimated prices, no fabricated metrics, no placeholder numbers that look real. Empty/TBD beats plausible-but-fake everywhere (Brian rule: phantom data destroys his read on the business).
- **No new permissions, accounts, paid services, or harness config changes.**
- **S&W boundary holds:** nothing about Standard & Works internals enters the brain or the code.
- **Spending real money, touching Stripe/Mercury beyond read-only, or anything legal/financial: out of scope, park it.**

## State, reporting, and the morning handoff

- After each item ships (or fails), append one line to `brain/log.md` and commit + push the brain (other agents read it overnight; the inbox sweep runs while you work — coordinate by never touching jobs/state files it owns: `data/jobs.json`, `data/inbox-sweep-state.json`, `data/job-counters.json`, trackers).
- At the stop time or when the list is done, write the **morning report** and finish cleanly:
  1. Update `NOW.md` Last touched + In flight.
  2. File one Console task: title `🌙 OVERNIGHT BUILD REPORT — <date>`, status `action_needed`, property `kerri-media-group`, body in plain English: per item SHIPPED (what it does for Brian + where to see it) / FAILED (what broke, what happened to prod, current state) / PARKED (what is needed to unblock) / NOT STARTED, then test-suite status, deploy status, and the one decision (if any) Brian should make today. No code talk.
  3. Final brain commit + push.
- **Stop time:** default 07:00 ET hard stop (wrap-up begins 06:30 ET) unless the invocation says otherwise. Wrap-up means: current item reaches SHIPPED or cleanly reverted, then the report. Never start a new item after 05:30 ET.

## Crash recovery

If you find an existing ledger for today with items in progress when you start: production state wins. Check what is actually deployed and green, reconcile the ledger to reality, revert anything half-deployed, then continue the list.
