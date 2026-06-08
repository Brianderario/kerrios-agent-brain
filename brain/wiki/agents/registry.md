# KMG Agent Registry

scope: agent index · updated: 2026-06-05

Every active or planned team agent that reads/writes this brain. Source of truth for "who is Kerri / who is Ari's agent / etc."

## Active

| Agent | Owner | Canonical prompt | Status |
|---|---|---|---|
| [[kerri]] | [[brian-derario]] | `agent-prompts/kerri-skill/SKILL.md` | Active |

## Current runner posture

As of [[../decisions/2026-05-25-codex-primary-operating-layer]], Codex is Brian's primary operating runner for Kerri. A 2026-05-29 Claude scheduled-tasks migration is now legacy/fallback after the 2026-06-05 Codex re-entry. Claude Code may remain available as a manual fallback, but the active scheduled-run truth is the Codex automation set unless Brian explicitly switches runners again. The agent identity and source of truth remain Kerri + KerriOS, not a runner-specific chat history.

## Role-pod architecture

As of [[../decisions/2026-05-25-agent-architecture-and-role-pods]], agents are organized by role pod:

- **Brian / Kerri pod:** Kerri, chief-of-staff brain, digital newsletter sales, event sales, inbound sales, outbound sales, pipeline follow-up, and company strategy/growth support.
- **Benji / CDO pod:** copywriting/email assistant, social-focused copywriting, technical newsletter writing, editor agent, and content/newsletter marketing support.
- **Ari / CFO pod:** primary CFO agent, accounting agent, M&A agent, and legal agent.

All pods share the same KerriOS loop: perceive -> propose -> approve/act -> record -> improve.

## Local automation context folders

Future Codex automations can start from local context packs before loading the canonical brain:

- Master: `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master`
- Brian/Kerri pod: `01-brian-kerri-agent/`
- Benji/CDO pod: `02-benji-cdo-agent/`
- Ari/CFO pod: `03-ari-cfo-agent/`
- S&W Writing Agent: `S&W Writing Agent/`

These folders are ergonomic automation entrypoints, not canonical truth. Durable facts and decisions still write back to KerriOS.

## Scheduled tasks (Kerri runs these)

| Task | Cron | Canonical prompt |
|---|---|---|
| `kerri-inbox-sweep` | every 15 minutes, Codex automation, GPT-5.5 high | `agent-prompts/kerri-inbox-sweep/SKILL.md` |
| `kerri-morning-brief` | 7:00am ET, weekdays, Codex automation, GPT-5.5 high | `agent-prompts/kerri-morning-brief/SKILL.md` |
| `kerri-morning-brief-retry` | 7:18am ET, weekdays, Codex automation, GPT-5.5 high; guarded recovery only | `agent-prompts/kerri-morning-brief-retry/SKILL.md` |
| `kerri-eod-meetings-review` | 6:30pm ET, weekdays, Codex automation, GPT-5.5 high | `agent-prompts/kerri-eod-meetings-review/SKILL.md` |
| `kerri-brain-push` | 10:00pm ET, daily, Codex automation, GPT-5.5 high | `agent-prompts/kerri-brain-push/SKILL.md` |
| `kerri-gap-sweep` | 9:41pm ET, daily, Codex automation, GPT-5.5 high; checks Codex records plus Claude shims | `agent-prompts/kerri-gap-sweep/SKILL.md` |
| `kerri-lead-research` | 6:13pm ET, weekdays, Codex automation, GPT-5.5 high; maintains 25 ready prospects for the daily 10-outreach loop; cheap preflight/no-op quiet | `agent-prompts/kerri-lead-research/SKILL.md` |
| `kerri-cold-outreach` | 9:07am ET, weekdays, Codex automation, GPT-5.5 high; targets 10 approval-ready drafts, inspects at most 25 queue entries, never auto-sends | `agent-prompts/kerri-cold-outreach/SKILL.md` |
| `kerri-pipeline-followup` | 8:33am ET, Tuesdays, Codex automation, GPT-5.5 high; warm-deal nudges only, never auto-sends | `agent-prompts/kerri-pipeline-followup/SKILL.md` |
| `standard-works-issue-writer` | 8:00pm ET, Mondays and Wednesdays, Codex automation, GPT-5.5 high; stages Beehiiv review drafts only | `S&W Writing Agent` + `standard-works-issue-writer` skill |

2026-06-05 note: Brian brought the scheduled agentic work back into Codex. The visible Claude shims are legacy/fallback artifacts; do not infer live ownership from them. `kerri-gap-sweep` is responsible for surfacing any double-run risk between Codex and Claude surfaces.

2026-05-26 audit note (RESOLVED 2026-05-31; Codex re-entry 2026-06-05; Hardware FYI revenue focus expanded 2026-06-07): the first-day core automation audit passed, so cold outreach and lead research were promoted from on-demand to scheduled routines. They now run as Codex automations, and pipeline follow-up is scheduled weekly as the warm-deal owner for the `$1,000,000` CY2026 Hardware FYI revenue goal. Approval gates unchanged: cold outreach and pipeline follow-up draft only and never auto-send; lead research only researches + tops up the pool. S&W issue writing is active in Codex; marketing/social/posting remains approval-gated.

## Sub-agent roadmap (under Kerri's identity)

All sub-agents send as `kerri@hardwarefyi.com` (or `brian@hardwarefyi.com` for founder threads). Externally invisible — counterparties see one face. Internally, each logs as its own slug for auditability.

| # | Sub-agent | Status | Build order |
|---|---|---|---|
| 1 | Cold Outreach | Active Codex automation; approval-gated draft batch only, never sends without Brian. | 1st |
| 1b | Lead Research | Active Codex automation; feeds Cold Outreach queue, never drafts or sends. | shipped alongside #1 |
| 2 | S&W Newsletter Writer | Active Codex automation for Monday/Wednesday issue prep and Beehiiv review staging. | 2nd ✅ |
| 2b | S&W Newsletter Editor | Task-driven/editor-pass prompt. Used inside issue production when invoked; no standalone schedule. | shipped alongside #2 |
| 2c | S&W Newsletter Marketing | Task-driven/on-demand prompt. Never auto-posts. | shipped alongside #2 |
| 4 | Event Logistics | Active on demand. Venue/vendor research, inquiry drafting, RoS. Project-scoped per event. Seeded with stubs for sf-tech-week-2026, dc-maritime-defense-2026, kinetic-2027. | 3rd ✅ |
| 3 | Inbound Sales Triage | Deferred (no inbound flow yet — Brian holds until volume justifies the playbook) | TBD |
| 5 | Pipeline Follow-Up | Active Codex automation, Tuesdays 8:33am ET. Warm Hardware FYI/KMG deal nudges only; approval-gated and never sends. | shipped |
| ~~6~~ | ~~Partner Research~~ — folded into Lead Research above | — | superseded |

## Supporting skills and prompts

| Prompt/skill | Mode | Notes |
|---|---|---|
| `send-partner-contract` | Skill, not a scheduled routine | Used for partner/SOW contract packet prep. Finance/legal/signature authority remains approval-gated. |
| `kerri-event-logistics` | On-demand | Venue/vendor research, inquiry drafting, run-of-show support. |
| `kerri-pipeline-followup` | Scheduled Codex automation | Deal follow-up drafting and state checks for warm deals where Brian/Kerri sent last; no direct sends. |

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

Local context pack:

- `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master/S&W Writing Agent`

Use that folder for future S&W writing automations. Do not recreate `04-standard-works-production`.

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
