# KMG Agent Registry

scope: agent index · updated: 2026-05-25

Every active or planned team agent that reads/writes this brain. Source of truth for "who is Kerri / who is Ari's agent / etc."

## Active

| Agent | Owner | Canonical prompt | Status |
|---|---|---|---|
| [[kerri]] | [[brian-derario]] | `agent-prompts/kerri-skill/SKILL.md` | Active |

## Current runner posture

As of [[../decisions/2026-05-25-codex-primary-operating-layer]], Codex is Brian's primary operating runner for Kerri. Claude Code may remain active as a fallback during the switch-over, but the agent identity and source of truth remain Kerri + KerriOS, not a runner-specific chat history.

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
| `kerri-eod-meetings-review` | 6:30pm ET, weekdays, Codex automation, GPT-5.5 high | `agent-prompts/kerri-eod-meetings-review/SKILL.md` |
| `kerri-brain-push` | 10:00pm ET, daily, Codex automation, GPT-5.5 high | `agent-prompts/kerri-brain-push/SKILL.md` |
| `kerri-cold-outreach` | `7 9 * * 1` (Mon AM batch + on-demand) | `agent-prompts/kerri-cold-outreach/SKILL.md` |
| `kerri-lead-research` | `13 18 * * 0` (Sun PM batch + on-demand) | `agent-prompts/kerri-lead-research/SKILL.md` |
| `kerri-sw-newsletter-writer` | `7 20 * * 1,3` (Mon + Wed 8pm) | `agent-prompts/kerri-sw-newsletter-writer/SKILL.md` |
| `kerri-sw-newsletter-editor` | `13 22 * * 1,3` (Mon + Wed 10pm, 2h after writer) | `agent-prompts/kerri-sw-newsletter-editor/SKILL.md` |
| `kerri-sw-newsletter-marketing` | `17 14 * * 2,4` (Tue + Thu 2:17pm, after publish) | `agent-prompts/kerri-sw-newsletter-marketing/SKILL.md` |
| `kerri-pipeline-followup` | `33 8 * * 2` (Tuesday 8:33am ET, weekly — scale up if active-deal count grows) | `agent-prompts/kerri-pipeline-followup/SKILL.md` |

## Sub-agent roadmap (under Kerri's identity)

All sub-agents send as `kerri@hardwarefyi.com` (or `brian@hardwarefyi.com` for founder threads). Externally invisible — counterparties see one face. Internally, each logs as its own slug for auditability.

| # | Sub-agent | Status | Build order |
|---|---|---|---|
| 1 | Cold Outreach | **Active** (2026-05-24) | 1st |
| 1b | Lead Research | **Active** (2026-05-24) — feeds Cold Outreach queue with multi-source enriched prospects (replaces what was scoped as "Partner Research") | shipped alongside #1 |
| 2 | S&W Newsletter Writer | **Active** (2026-05-24) — Mon+Wed 8pm draft for Tue+Thu PM publish. Kerri owns the writing; Brian + Zach ingest suggestions via [SW]-tagged emails. | 2nd ✅ |
| 2b | S&W Newsletter Editor | **Active** (2026-05-24) — Mon+Wed 10pm voice + anti-pattern + fact-check pass on the writer's draft | shipped alongside #2 |
| 2c | S&W Newsletter Marketing | **Active** (2026-05-24) — Tue+Thu 2:17pm. Detects published issue, drafts Twitter thread + LinkedIn post + short blurb. Never auto-posts. | shipped alongside #2 |
| 4 | Event Logistics | **Active** (2026-05-24) — on-demand. Venue/vendor research, inquiry drafting, RoS. Project-scoped per event. Seeded with stubs for sf-tech-week-2026, dc-maritime-defense-2026, kinetic-2027. | 3rd ✅ |
| 3 | Inbound Sales Triage | Deferred (no inbound flow yet — Brian holds until volume justifies the playbook) | TBD |
| 5 | Pipeline Follow-Up | **Active** (2026-05-24) — Tuesday 8:33am ET weekly nudge cron. Kinetic 2026 sponsor roster seeded as dormant deals. Conflict rule with inbox-sweep by last_sender. Approval-gated; never sends. Cadence weekly until active-deal volume justifies scaling up. | shipped |
| ~~6~~ | ~~Partner Research~~ — folded into Lead Research above | — | superseded |

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
