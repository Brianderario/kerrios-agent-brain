# Decision: Parallel Core Automation Bundle

scope: decision · updated: 2026-05-26 · author: Brian + Codex

## Decision

Rebuild the next three Kerri automations in parallel after the inbox sweep:

- `kerri-eod-meetings-review`
- `kerri-morning-brief`
- `kerri-brain-push`

All three run in Codex on GPT-5.5 high and use the Codex Kerri Agent Master folder context before loading KerriOS.

## Rationale

These three cover the core company-brain rhythm around the inbox sweep:

- **EOD Meetings Review:** uses the calendar as the source of truth, turns calls into meeting memory, entity updates, follow-up Tasks, and transcript coverage/manual-recap signals.
- **Morning Brief:** turns today's meetings, yesterday's Chase spend alerts from `brian@kerrihq.com`, pending Tasks, recent brain activity, and optional Kerri's Read context into a Brian-facing HTML brief.
- **Brain Push / Knowledge Hygiene:** validates, commits, pushes, logs, and grades the brain so KerriOS does not drift.

Together with the inbox sweep, they create a daily loop:

1. Morning command.
2. Inbox perception and approval loop throughout the day.
3. Evening meeting capture.
4. Nightly brain hygiene.

## Live Codex Automations

- `kerri-morning-brief` — weekdays at 7:00am ET; writes `output/morning-brief/<YYYY-MM-DD>.html` and `latest.html`
- `kerri-eod-meetings-review` — weekdays at 6:30pm ET
- `kerri-brain-push` — daily at 10:00pm ET

Each uses GPT-5.5 high.

## Folder Context

- Morning: `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master/01-brian-kerri-agent/subagents/morning-briefing`
- EOD: `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master/01-brian-kerri-agent/subagents/eod-meetings-review`
- Brain Push: `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master/01-brian-kerri-agent/subagents/brain-push`

## Write-Back

- Morning writes a polished local HTML brief, compact state/grades, and only logs material escalations or system gaps. Chase transaction details stay out of wiki/log truth.
- EOD writes meeting pages, entity updates, follow-up Google Tasks for every proposed draft, missing-recording/manual-recap Tasks, state, grades, and a digest.
- Brain Push writes commits, push logs, hygiene state, and failure alerts only when needed.

## Boundaries

- No external emails send directly from these automations.
- Meeting follow-ups route through Google Tasks.
- S&W internal content stays local-only.
- Brain Push never stages runtime state, secrets, raw mail, or `brain/.local`.

## Related

- [[2026-05-26-inbox-sweep-primary-automation]]
- [[2026-05-26-agent-folder-master]]
- [[2026-05-25-living-brain-and-autonomy-ladder]]
- [[../workflows/agent-brain-protocol]]
