# KMG Agent Registry

scope: agent index · updated: 2026-05-24

Every active or planned team agent that reads/writes this brain. Source of truth for "who is Kerri / who is Ari's agent / etc."

## Active

| Agent | Owner | Canonical prompt | Status |
|---|---|---|---|
| [[kerri]] | [[brian-derario]] | `agent-prompts/kerri-skill/SKILL.md` | Active |

## Scheduled tasks (Kerri runs these)

| Task | Cron | Canonical prompt |
|---|---|---|
| `kerri-inbox-sweep` | `*/10 6-21 * * *` | `agent-prompts/kerri-inbox-sweep/SKILL.md` |
| `kerri-eod-meetings-review` | `0 19 * * *` | `agent-prompts/kerri-eod-meetings-review/SKILL.md` |
| `kerri-cold-outreach` | `7 9 * * 1` (Mon AM batch + on-demand) | `agent-prompts/kerri-cold-outreach/SKILL.md` |
| `kerri-lead-research` | `13 18 * * 0` (Sun PM batch + on-demand) | `agent-prompts/kerri-lead-research/SKILL.md` |
| `kerri-sw-newsletter-writer` | `7 20 * * 1,3` (Mon + Wed 8pm) | `agent-prompts/kerri-sw-newsletter-writer/SKILL.md` |
| `kerri-sw-newsletter-editor` | `13 22 * * 1,3` (Mon + Wed 10pm, 2h after writer) | `agent-prompts/kerri-sw-newsletter-editor/SKILL.md` |
| `kerri-sw-newsletter-marketing` | `17 14 * * 2,4` (Tue + Thu 2:17pm, after publish) | `agent-prompts/kerri-sw-newsletter-marketing/SKILL.md` |
| `kerri-brain-push` | `0 22 * * *` | `agent-prompts/kerri-brain-push/SKILL.md` |

## Sub-agent roadmap (under Kerri's identity)

All sub-agents send as `kerri@hardwarefyi.com` (or `brian@hardwarefyi.com` for founder threads). Externally invisible — counterparties see one face. Internally, each logs as its own slug for auditability.

| # | Sub-agent | Status | Build order |
|---|---|---|---|
| 1 | Cold Outreach | **Active** (2026-05-24) | 1st |
| 1b | Lead Research | **Active** (2026-05-24) — feeds Cold Outreach queue with multi-source enriched prospects (replaces what was scoped as "Partner Research") | shipped alongside #1 |
| 2 | S&W Newsletter Writer | **Active** (2026-05-24) — Mon+Wed 8pm draft for Tue+Thu PM publish. Kerri owns the writing; Brian + Zach ingest suggestions via [SW]-tagged emails. | 2nd ✅ |
| 2b | S&W Newsletter Editor | **Active** (2026-05-24) — Mon+Wed 10pm voice + anti-pattern + fact-check pass on the writer's draft | shipped alongside #2 |
| 2c | S&W Newsletter Marketing | **Active** (2026-05-24) — Tue+Thu 2:17pm. Detects published issue, drafts Twitter thread + LinkedIn post + short blurb. Never auto-posts. | shipped alongside #2 |
| 3 | Inbound Sales Triage | Planned (enhancement to inbox sweep) | 3rd |
| 4 | Event Logistics | Planned (on-demand) | 4th |
| 5 | Pipeline Follow-Up | Planned (daily nudge) | 5th |
| ~~6~~ | ~~Partner Research~~ — folded into Lead Research above | — | superseded |

## Planned (not yet activated)

| Agent | Owner | Scope | Activates when |
|---|---|---|---|
| Ari's CFO agent | [[ari-lewis]] | Finance, vendor mgmt, books | Ari picks |
| Benji's CDO agent | [[benji-chia]] | Distribution, growth, automation | Benji picks |

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
