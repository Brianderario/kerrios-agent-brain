# Build Loop: Ask Savant actions + multi-user siloed access

## How to run
Start a fresh Claude Code session in the KMG context and invoke `/build-loop` with this file as the task list. It runs unattended. The build-loop SKILL governs the loop (per item: brainstorm -> plan -> work -> review -> ship -> compound; mandatory fail-closed gates; no external sends; morning report at the stop time). Repo: `~/Projects/kerrihq-rails` (Savant). Deploy = push `main` -> Render auto-deploys. Env note: every Bash call needs `export PATH="/opt/homebrew/opt/ruby@3.4/bin:/opt/homebrew/opt/postgresql@17/bin:$PATH"`; start Postgres if needed.

## Where we are (context)
Live in prod already:
- The Monaco redesign across all screens.
- The in-app "Ask Savant" copilot, read-only slice 1: a chat drawer on every signed-in page, `POST /ask_savant` -> `AskSavant::Agent` / `AskSavant::Tools` / `AskSavant::ToolExecutor` / `AskSavant::SystemPrompt`. It runs on Ollama via `OllamaClient` (model `glm-5.2`, overridable with `ASK_SAVANT_MODEL`); key is in ENV `OLLAMA_API_KEY` in prod and in `~/.kerri-chief/secrets/ollama.env` locally. Tools speak the OpenAI/Ollama function shape. Read tools today: `pipeline_summary`, `find_deals`, `list_tasks`, `search_brain`.
- Permission primitives already in the app to build on (do NOT reinvent): `Membership` (roles member/admin/owner/event_guest/sponsor), `PermissionResolver` + `PermissionGrant` + `Domain` (sensitivity-aware brain access), `AgentScopeResolver`, Pundit policies in `app/policies/`, `EventAccess` + the `event_guest` role for per-user event access, and `AgentRun` for an audit trail.

This run does two things: (1) give the agent the power to ACT inside the app, and (2) stand up real multi-user access with siloed workspaces and a specific visibility matrix, and make the agent respect it.

## The people
- Brian (owner) — brian@kerrihq.com (already the account).
- Ari (CFO) — ari@kerrihq.com.
- Benji (Chief Digital Officer) — benji@hardwarefyi.com.
- Zach (Standard & Works partner, a separate legal entity / external) — zach@standardandworks.com.

## The access matrix (this is the spec; enforce it exactly)

| Capability | Brian | Ari | Benji | Zach |
|---|---|---|---|---|
| Own profile + tasks, fully siloed (sees only their own) | yes | yes | yes | yes |
| Can see ANOTHER person's tasks (including Brian's) | NO | NO | NO | NO |
| Active pipeline (deals, revenue, pipeline worklist) | yes | yes | yes | NO |
| Ironclad Maritime Summit details | yes | yes | NO | yes |
| Ask Savant copilot, scoped to that person's access | yes | yes | yes | yes |

Rules in words:
- Tasks and personal workspace are FULLY siloed both ways. Each person (Brian included) sees only their own tasks. No one sees anyone else's. Brian does NOT want an all-tasks oversight view. (Brian's own existing tasks/approval queue stay exactly as they are for him; he just stops being able to see, and no teammate can ever see, anyone else's.)
- Pipeline (deals, revenue, pipeline worklist) is visible to Brian, Ari, Benji. NOT Zach.
- Ironclad Maritime Summit is visible to Brian, Ari, Zach only. NOT Benji, even though Benji is a full member.
- Zach is external (Standard & Works). HARD BOUNDARY: Zach sees ONLY the Ironclad event and his own workspace. Never the KMG pipeline, the KMG brain, other KMG events, or anyone's tasks. This matches the standing S/W boundary rule.
- The Ask Savant agent acts AS the signed-in user and must never be a permission bypass. Every read tool AND every action tool enforces that user's permissions. Zach's agent cannot read or touch pipeline; Benji's cannot read or touch Ironclad; no one's agent surfaces anyone else's tasks.

## Ironclad specifics (confirmed by Brian)
Ironclad Maritime Summit is a STANDARD & WORKS event: a joint venture between Standard & Works (Zach) and the Hampton Roads Alliance (HRA, Doug Smith's group). It is NOT a KMG/Hardware FYI event. Model it on the S/W side: the event already exists in the Console (created 2026-06-17, S/W event, contract_from_email = brian@standardandworks.com). Access to it: Zach (its S/W owner), plus Brian and Ari granted in. Benji and all other KMG-only members are excluded. Do not let S/W internals leak onto KMG surfaces, and do not expose KMG pipeline/brain to Zach via the shared Ironclad context. First inspect the real data model (is Ironclad under its own S/W org or an event inside KMG?) and pick the cleanest implementation (separate-org membership for Zach with Brian/Ari cross-access, or a restricted/confidential event with EventAccess) that satisfies this exactly.

## Hard constraints (do not violate, unattended)
- Security is the deliverable. Every access check FAILS CLOSED: if a check errors or is ambiguous, DENY. New resources default to deny.
- The agent enforces the same policies as the UI and API, keyed on `current_user`. An action tool that skips authorization is a defect, not a feature.
- NO external sends of any kind overnight: no invite emails, no notifications, no Slack, no DocuSign. Provisioning teammates means creating records and grants only. The actual invite / activation email is an interactive, approval-gated step Brian runs later. Document that step precisely; do not send it.
- Do NOT break the backend automation. The inbox-sweep and other routines hit `/api/v1` with `KERRIHQ_AGENT_API_KEY`. The new per-user siloing applies to HUMAN users and their agent sessions; system / API-key access must keep its current scope. Confirm the existing `/api/v1` specs stay green and the automation key is not locked out.
- API backward-compatible: never rename or remove an existing field (agents poll the API around the clock); only add.
- Every agent action writes an audit record (AgentRun or equivalent): actor, action, target id, before -> after, timestamp.
- S/W boundary holds: nothing about Standard & Works internals enters the KMG brain or any non-Ironclad surface.
- Additive and reversible. Ship one complete item at a time; roll back on any failure per the build-loop contract.

## Ordered task list (ship one at a time, safest first)
Order is deliberate: lock down visibility BEFORE adding write power.

1. Access foundation. One source of truth for "can user X see / do Y" on pipeline, events, and tasks, built on the existing Membership roles + PermissionResolver + Pundit. Add a clear teammate access model (for example: owner, member-with-pipeline, external-partner) or per-capability grants, whichever is cleaner in this codebase. No behavior change for Brian's own access to his own things. Deliverable: a permission helper / policy layer plus the scaffold of the matrix spec. Fail-closed.

2. Per-user siloed tasks + profile. Give tasks an owner and make visibility strictly per-user: each person sees only their own tasks across the tasks board, the dashboard "needs you" queue, and the `list_tasks` agent tool. No one (Brian included) sees anyone else's. Each user has their own profile / account surface.

3. Pipeline visibility gating. Gate the deals board, pipeline worklist, revenue screens, their controllers and API, and the agent's pipeline tools to users with pipeline access (Brian, Ari, Benji). Zach gets a clean empty / 403 state in the UI, and the agent declines pipeline questions for him.

4. Ironclad event restriction. Per the Ironclad specifics above: visible only to Brian, Ari, Zach; hidden from Benji and any non-granted member in the events UI, the API, and the agent. Implement on the S/W side without leaking S/W internals to KMG or KMG data to Zach.

5. Provision teammates. Create the membership / role / grant records so each person gets exactly their matrix access the moment they log in:
   - ari@kerrihq.com -> full member with pipeline access + Ironclad access; own siloed tasks.
   - benji@hardwarefyi.com -> full member with pipeline access; NO Ironclad; own siloed tasks.
   - zach@standardandworks.com -> external partner; Ironclad ONLY + own siloed tasks; no pipeline, no KMG brain.
   Do NOT send invites overnight. Output the exact interactive command or steps Brian runs to send each person their invite / activation.

6. Make Ask Savant permission-aware (read side). Route every read tool (pipeline_summary, find_deals, list_tasks, search_brain, and any new event/Ironclad tool) through the same policy scopes from items 1 to 4, keyed on the agent's current_user. Prove the agent cannot leak across the matrix.

7. Ask Savant slice 2: ACTIONS. Add mutation tools to the agent, each authorized as current_user (fail-closed), only on permitted resources, each writing an AgentRun audit row, with a confirmation step for consequential changes, and NO external sends:
   - `update_deal` (stage, value, next action / next step) for pipeline-access users only.
   - `create_task` / `update_task` (status, assignee defaults to self, notes), scoped to the user's own workspace.
   - log a deal note / activity.
   Reuse the existing AskSavant::Tools (OpenAI/Ollama function shape) and ToolExecutor pattern. Verify end-to-end with the real Ollama key the way slice 1 was verified (a local `rails runner` that has the agent move a seeded deal or create a task, confirm it persists and an audit row was written) and confirm a non-permitted user's agent refuses.

8. Stretch (only if time): "my work" personalization. Tools for the user's own queue ("what is on my plate", "make a task for me") and per-user agent context.

## Verification (the heart of this run)
Build one comprehensive PERMISSION MATRIX spec that, for factory users in each role (Brian, Ari, Benji, Zach), asserts BOTH the positive and the negative of every cell: who can and cannot reach own tasks, another person's tasks, pipeline, and Ironclad, and the same again through the Ask Savant agent (read AND action). Plus:
- Full `bundle exec rspec` green (the whole suite, not just new specs), `bin/rubocop` clean, `bin/brakeman --quiet` with no new warnings.
- Existing `/api/v1` specs still green; confirm the automation API key keeps its access.
- Agent actions verified end-to-end with the real Ollama key (a real glm-5.2 tool-call that mutates a seeded record and writes an audit row), per slice 1's method.
- Prod verification after each deploy (`/up`, plus a per-user check via request specs or a read-only prod one-off job).

## Definition of done (plain English for the morning report)
- Ari, Benji, and Zach each have their own private workspace, and no one (including Brian) can see anyone else's tasks.
- Ari and Benji see the pipeline; Zach does not.
- Ari and Zach see Ironclad; Benji does not.
- Ask Savant, for each person, answers and now ACTS only within what that person is allowed to see, and every action is on an audit trail. It still never sends anything externally.
- The three teammates' access is provisioned in records; the only remaining step is Brian sending their invites (documented, not sent).
