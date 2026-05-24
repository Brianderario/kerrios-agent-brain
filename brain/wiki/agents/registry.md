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
| `kerri-brain-push` | `0 22 * * *` | `agent-prompts/kerri-brain-push/SKILL.md` |

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
