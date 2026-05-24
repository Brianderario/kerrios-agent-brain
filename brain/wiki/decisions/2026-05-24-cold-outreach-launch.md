# Decision: Cold Outreach Sub-Agent Launch

scope: decision · updated: 2026-05-24 · build order: #1 of 6 sub-agents

## Decision

Ship the cold outreach sub-agent as the first of Kerri's six planned sub-agents. Build-and-test cadence: Monday weekly batch + on-demand. **Hard volume caps: 10 drafts/day, 50 drafts/rolling-7-days, never exceeded.** Drafts only — never sends. All sends route through the existing inbox sweep checkbox-approval flow.

Identity: all sends from `kerri@hardwarefyi.com` (default) or `brian@hardwarefyi.com` (founder-to-founder threads). Externally there is one face; sub-agents are functional differentiations only. See [[../agents/registry]].

## Why first (over the recommended order)

My recommendation was to build cold outreach LAST after the other agents proved themselves and HWFYI sending reputation was characterized. Brian overruled with reason: top-of-funnel growth is the immediate need; he wants the highest-leverage agent online while he can actively monitor week one.

Honoring that, but the safety rails are non-negotiable:

- Volume caps enforced in state (not just guidelines)
- Personalization mandatory — agent SKIPS targets where it can't find a concrete hook from Apollo
- Dedup against `brain/wiki/people/`, `data/jobs.json`, the do-not-contact list, and 90-day cold history
- Approval-gated send (no auto-send ever)
- M–F send-time windows (no weekend cold)
- Domain health monitoring (manual in v1, automated bounce detection deferred to v2)

## Architecture

| Piece | Path | Notes |
|---|---|---|
| Canonical prompt | `agent-prompts/kerri-cold-outreach/SKILL.md` | Tracked in git |
| Local shim | `~/.claude/scheduled-tasks/kerri-cold-outreach/SKILL.md` | Auto-picks up canonical changes |
| Scheduled task | cron `7 9 * * 1` (Mondays ~9am ET) | Scheduler nudges to 09:16 |
| Queue | `data/cold-outreach-queue.json` | Gitignored — pre-contact PII |
| State (counters + dedup) | `data/cold-outreach-state.json` | Gitignored |
| Do-not-contact | `data/cold-do-not-contact.json` | Gitignored |
| Approval canvas | Google Tasks `❄️ COLD-<HSG>NN` in matching list | Same flow as inbox sweep |
| Brain writes | `brain/wiki/people/<slug>.md` after send completes | Backfilled by inbox sweep on successful send (v2 enhancement) |

## Two invocation modes

1. **Scheduled (Mon 9:07am cron):** drains `cold-outreach-queue.json` up to the day's budget. If queue empty, posts a "queue empty" task to remind Brian to seed.
2. **On-demand:** Brian invokes in chat. Two payload shapes:
   - Explicit list ("Kerri, cold outreach to: Jane, jane@acme.com, Acme; …")
   - Discovery ("Kerri, find me 10 cold prospects in advanced manufacturing") — Apollo search → filter → queue → process.

## Voice

Strict adherence to `agent-prompts/kerri-skill/references/voice.md`. Forbidden cold tropes: "came across your profile", "noticed you", "love to connect", "let me know if of interest". Required structure: hook (specific to them) → credibility (HWFYI reach numbers) → ask (concrete next step) → Brian's sign-off.

## What this agent does NOT do

- Send email (drafts only)
- Cross the S/W boundary (no cold from brian@standardandworks.com — would be a separate sub-agent if needed)
- Use Apollo for sending (Apollo is enrichment-only; sends via Microsoft Graph through `kerri-hardwarefyi-email` MCP)
- Mass-merge or template — every draft is distinct
- Cold an existing relationship

## Open / deferred to v2

- Auto-bounce detection: inbox sweep should detect NDRs referencing cold-thread IDs and add to do-not-contact. Manual today.
- Auto-unsubscribe detection: inbox sweep should detect explicit "remove me" replies. Manual today.
- Post-send brain page writes: when Brian checks an `❄️ COLD-` task and the inbox sweep sends, sweep should create `brain/wiki/people/<slug>.md` automatically. Manual backfill in v1.
- S/W cold outreach as a separate sub-agent (different ICP, different sender identity).

## Related

- [[../agents/registry]] — Kerri sub-agent roster
- [[../workflows/agent-brain-protocol]] — read/write rules
- [[../workflows/multi-agent-write-rules]] — multi-agent flow + conflict rules
- [[../people/brian-derario]] — voice + working style this agent honors
