# KMG Agent Registry

scope: agent index · updated: 2026-06-09

Every active or planned team agent that reads/writes this brain. Source of truth for "who is Kerri / who is Ari's agent / etc."

## Active

| Agent | Owner | Canonical prompt | Status |
|---|---|---|---|
| [[kerri]] | [[brian-derario]] | `agent-prompts/kerri-skill/SKILL.md` | Active |

## Current runner posture

As of 2026-06-08, **Claude Code is the sole operating runner** for Kerri. All scheduled routines run as persistent Claude Code scheduled tasks under `~/.claude/scheduled-tasks/`. Codex automations under `~/.codex/automations/` are retired and should be disabled to prevent double-runs. This supersedes [[../decisions/2026-05-25-codex-primary-operating-layer]] and the 2026-06-05 Codex re-entry. The agent identity and source of truth remain Kerri + KerriOS, not any runner's chat history.

## Role-pod architecture

As of [[../decisions/2026-05-25-agent-architecture-and-role-pods]], agents are organized by role pod:

- **Brian / Kerri pod:** Kerri, chief-of-staff brain, digital newsletter sales, event sales, inbound sales, outbound sales, pipeline follow-up, and company strategy/growth support.
- **Benji / CDO pod:** copywriting/email assistant, social-focused copywriting, technical newsletter writing, editor agent, and content/newsletter marketing support.
- **Ari / CFO pod:** primary CFO agent, accounting agent, M&A agent, and legal agent.

All pods share the same KerriOS loop: perceive -> propose -> approve/act -> record -> improve.

## Functional desks (Savant console org chart)

As of 2026-06-15, the Savant console Agents page presents the routines as an org chart instead of a flat list: **Kerri** (chief of staff, the one external face) sits at the top, and every routine is grouped under one of three functional desks, each with a named lead we can call by name. This is the org-facing view of the same agents; the role-pod architecture above is the owner-facing view.

- **Sales (lead "Dex"), pure revenue pre-sale and post-sale:** inbox sweep (+weekend variant), cold outreach, lead research, pipeline follow-up, pipeline staleness, renewal + upsell watchdog, revenue standup, send-partner-contract.
- **Ops (lead "Miles"), support + customer success + event management + internal machine:** morning brief (+retry), EOD meetings review, event logistics, brain push, gap sweep, self-improve, build proposal.
- **Content (lead "Quill"), writing + the intel that feeds it:** S&W newsletter writer/editor/marketing, industry intel.

Desk definitions (Brian, 2026-06-15): Sales drives revenue only, both pre-sale and post-sale; Ops covers support, customer success, event management, and the internal machine; Content is writing plus the intel that feeds it. Event logistics is Ops (event management), not Sales; send-partner-contract is Sales (post-sale revenue).

Source of truth for the grouping is `Agent::DESK_BY_SLUG` in kerrihq-rails (`app/models/agent.rb`); keep this section and that map in sync. Any routine with a canonical `agent-prompts/<slug>/SKILL.md` syncs to the console automatically; one not listed in the map falls back to the Ops desk so it still appears. The weekend inbox sweep has no separate canonical prompt (it reuses the inbox-sweep prompt on a weekend cron) so it is not a distinct console card. Naming and grouping approved by Brian 2026-06-15.

## Local context folders (historical)

Legacy Codex automation context packs at `/Users/brianderario/Desktop/Codex Kerri Agent/` are no longer used. All routines now run from `~/.claude/scheduled-tasks/` shims that load canonical `agent-prompts/*/SKILL.md` prompts. Durable facts and decisions write back to KerriOS.

## Scheduled tasks (Kerri runs these)

| Task | Cron | Canonical prompt |
|---|---|---|
| `kerri-inbox-sweep` | every 15 minutes, Claude Code scheduled task | `agent-prompts/kerri-inbox-sweep/SKILL.md` |
| `kerri-morning-brief` | 7:00am ET, weekdays, Claude Code scheduled task | `agent-prompts/kerri-morning-brief/SKILL.md` |
| `kerri-morning-brief-retry` | 7:18am ET, weekdays, Claude Code scheduled task; guarded recovery only | `agent-prompts/kerri-morning-brief-retry/SKILL.md` |
| `kerri-eod-meetings-review` | 6:30pm ET, weekdays, Claude Code scheduled task | `agent-prompts/kerri-eod-meetings-review/SKILL.md` |
| `kerri-brain-push` | 10:00pm ET, daily, Claude Code scheduled task | `agent-prompts/kerri-brain-push/SKILL.md` |
| `kerri-gap-sweep` | 9:41pm ET, daily, Claude Code scheduled task; checks Claude shims, repo/prompt/doc hygiene, and live operating state (Codex retired 2026-06-08, no Codex records remain in scope) | `agent-prompts/kerri-gap-sweep/SKILL.md` |
| `kerri-lead-research` | 6:13pm ET, weekdays, Claude Code scheduled task; maintains 25 ready prospects for the daily 10-outreach loop; cheap preflight/no-op quiet | `agent-prompts/kerri-lead-research/SKILL.md` |
| `kerri-cold-outreach` | 9:07am ET, weekdays, Claude Code scheduled task; targets 10 approval-ready drafts, inspects at most 25 queue entries, never auto-sends | `agent-prompts/kerri-cold-outreach/SKILL.md` |
| `kerri-pipeline-followup` | 8:33am ET, Tuesdays and Thursdays, Claude Code scheduled task; warm-deal nudges only, never auto-sends | `agent-prompts/kerri-pipeline-followup/SKILL.md` |
| `standard-works-issue-writer` | 8:00pm ET, Mondays and Wednesdays, Claude Code scheduled task; stages Beehiiv review drafts only | `agent-prompts/kerri-sw-newsletter-writer/SKILL.md` |
| `kerri-industry-intel` | 6:30am ET, weekdays, Claude Code scheduled task; polls RSS + Google Alerts + intel emails, archives processed emails, no external sends | `agent-prompts/kerri-industry-intel/SKILL.md` |
| `kerri-renewal-watchdog` | 10am ET Wednesdays (cron `0 10 * * 3`); LIVE Claude Code scheduled task (last fired 2026-06-17); approval-gated, max 5 drafts | `agent-prompts/kerri-renewal-watchdog/SKILL.md` |
| `kerri-revenue-standup` | 4pm ET Fridays (cron `0 16 * * 5`); LIVE local Claude Code scheduled task, re-enabled 2026-06-23 off the retired Slack cloud routine. Read-only scoreboard; files a **Console task card** + reports the run into the Console (`create_agent_run` via the STEP 8 heartbeat), never Slack. See the 2026-06-23 note below. | `agent-prompts/kerri-revenue-standup/SKILL.md` |

| `kerri-self-improve` | Sundays 5pm ET (cron `0 17 * * 0`); weekly self-improvement: autonomy scorecard + edit-pattern analysis + brain improvement pages. 100% read + write-to-brain, no external sends, no policy mutations | `agent-prompts/kerri-self-improve/SKILL.md` |

2026-06-09 note: `kerri-self-improve` added as 14th scheduled task (Wave 3 autonomy ladder). Runs the autonomy scorecard against jobs.json, identifies repeated Brian-edit patterns, writes improvement pages to `brain/wiki/improvements/`, and surfaces promotion candidates when evidence thresholds are met (14+ days, 10+ sends, 95%+ unedited, 0 incidents). Never modifies autonomy-policy.json directly.

2026-06-09 note: `kerri-industry-intel` added as 13th scheduled task. Phase 1 (free tier): TechCrunch RSS, Crunchbase News RSS, Google Alerts email digests, Apollo enrichment (max 5/day). Read-only + archive only, no sends. **Status as of 2026-06-09: scheduled but zero successful runs.** Diagnosis (2026-06-09 PM): the routine was only created and registered 2026-06-09 ~10:59 ET, after that day's 6:30am slot, so it has never had a scheduled fire opportunity; first fire is 2026-06-10 ~6:37am ET. Not a failure. Gap found and fixed the same day: `scripts/routine-liveness-check.mjs` did not monitor it at all (its registry covered only 5 routines), so a genuinely dark industry-intel would never have alerted; it now goes dark-alert if no successful run is recorded by 7:15am ET on a weekday (with bootstrap-day grace).

2026-06-08 note: Claude Code is now the sole scheduled runner. All routines run as Claude Code persistent scheduled tasks. Codex automations are retired. Approval gates unchanged everywhere.

2026-06-23 note (off Slack, into the Console): Brian's call: no Kerri routine points at Slack anymore. **`kerri-revenue-standup` is back to a LOCAL Claude Code scheduled task** (Fridays ~4pm ET) that files its scoreboard as a Console task card and reports its run into the Console via the STEP 8 heartbeat (`create_agent_run`), so `report_interval_hours: 192` is valid again and the Console health-check sees real runs. The three Slack cloud routines created 2026-06-11 (`kerri-revenue-standup`, `kerri-morning-brief-fallback`, `kerri-eod-meetings-recap`) are being RETIRED: revenue-standup is replaced by the local task above, and the other two were Slack-only duplicators (their work already lands via the local EOD review + morning brief). Cloud routines can't be deleted by API, so Brian removes them at claude.ai/code/routines. Net: nothing reports via Slack.

Background (2026-06-11, superseded by the above): the three routines were originally moved to Anthropic cloud routines to drop the laptop dependency, delivering via Slack DM. That created the false "Agent overdue" cards (cloud routines didn't call `create_agent_run`), which is what prompted the 2026-06-23 move back to local Console reporting.

## Sub-agent roadmap (under Kerri's identity)

All sub-agents send as `kerri@hardwarefyi.com` (or `brian@hardwarefyi.com` for founder threads). Externally invisible — counterparties see one face. Internally, each logs as its own slug for auditability.

| # | Sub-agent | Status | Build order |
|---|---|---|---|
| 1 | Cold Outreach | Active Claude Code scheduled task; approval-gated draft batch only, never sends without Brian. | 1st |
| 1b | Lead Research | Active Claude Code scheduled task; feeds Cold Outreach queue, never drafts or sends. | shipped alongside #1 |
| 2 | S&W Newsletter Writer | Active Claude Code scheduled task for Monday/Wednesday issue prep and Beehiiv review staging. | 2nd ✅ |
| 2b | S&W Newsletter Editor | Task-driven/editor-pass prompt. Used inside issue production when invoked; no standalone schedule. | shipped alongside #2 |
| 2c | S&W Newsletter Marketing | Task-driven/on-demand prompt. Never auto-posts. | shipped alongside #2 |
| 4 | Event Logistics | Active on demand. Venue/vendor research, inquiry drafting, RoS. Project-scoped per event. Seeded with stubs for sf-tech-week-2026, dc-maritime-defense-2026, kinetic-2027. | 3rd ✅ |
| 3 | Inbound Sales Triage | Deferred (no inbound flow yet — Brian holds until volume justifies the playbook) | TBD |
| 5 | Pipeline Follow-Up | Active Claude Code scheduled task, Tuesdays 8:33am ET. Warm Hardware FYI/KMG deal nudges only; approval-gated and never sends. | shipped |
| ~~6~~ | ~~Partner Research~~ — folded into Lead Research above | — | superseded |

## Supporting skills and prompts

| Prompt/skill | Mode | Notes |
|---|---|---|
| `send-partner-contract` | Skill, not a scheduled routine | Used for partner/SOW contract packet prep. Finance/legal/signature authority remains approval-gated. |
| `kerri-event-logistics` | On-demand | Venue/vendor research, inquiry drafting, run-of-show support. |
| `kerri-pipeline-followup` | Claude Code scheduled task (Tuesdays and Thursdays) | Deal follow-up drafting and state checks for warm deals where Brian/Kerri sent last; no direct sends. |

## Planned (not yet activated)

| Agent | Owner | Scope | Activates when |
|---|---|---|---|
| Benji primary copywriting/email assistant | [[benji-chia]] | Content, email copy, newsletter/content marketing | Benji pod starts |
| Benji social-focused copywriting agent | [[benji-chia]] | Social copy variants, channel-specific posts, reuse of shipped content | Benji pod starts |
| Benji technical newsletter writing agent | [[benji-chia]] | Technical content/newsletter drafting and research | Benji pod starts |
| Benji editor agent | [[benji-chia]] | Editorial QA, style cleanup, source/claim flags | Benji pod starts |
| Ari primary CFO agent | [[ari-lewis]] | Finance, vendor management, books, budget support | Ari picks and approval gates are designed |
| Ari accounting agent | [[ari-lewis]] | Bookkeeping support, invoice/payment follow-up, monthly close prep | Ari picks and approval gates are designed |
| Ari M&A agent | [[ari-lewis]] | Acquisition diligence, deal rooms, buyer/seller research | Ari picks and approval gates are designed |
| Ari legal agent | [[ari-lewis]] | Contract review support and legal workflow triage | Ari picks and approval gates are designed |

## Standard & Works automation boundary

Standard & Works is not an internal KMG role pod. It remains an external partnership/boundary entity under [[../companies/standard-and-works]]. The S&W Industrialist newsletter chain is still an active Kerri-owned writing workflow because Brian/Kerri are responsible for the work product.

The S&W writer runs as a Claude Code scheduled task (`standard-works-issue-writer`) loading `agent-prompts/kerri-sw-newsletter-writer/SKILL.md`. Legacy Codex workspace at `/Users/brianderario/Desktop/Codex Kerri Agent/S&W Writing Agent/` is no longer used as the runtime entrypoint.

Canonical prompts:

- `kerri-sw-newsletter-writer`
- `kerri-sw-newsletter-editor`
- `kerri-sw-newsletter-marketing`

Do not treat Zach's S&W internal operations as KerriOS company-brain data. Do preserve published issue facts, source notes, Brian/Zach suggestions, and production lessons according to the S&W boundary rules.

## Retired

- **Hudson** — Brian's prior agent. Retired 2026-05-23, collapsed into Kerri.
- **OpenClaw / Alfred / Edison / Hermes / Quinn** — prior Railway-based agent infra. Retired 2026-05-16 to 23.

## Activation steps (for new team agents)

See [[../workflows/multi-agent-write-rules]] for the full flow. Short version:
1. Clone repo to laptop.
2. Set git author identity.
3. Wire the agent's SKILL.md as a shim pointing at the canonical `agent-prompts/<agent>/SKILL.md`.
4. Add an entry to this registry.
5. First write opens a PR to validate the approval flow works.
