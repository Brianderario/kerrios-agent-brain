# Decision: Agent Folder Master

scope: decision · updated: 2026-05-26 · author: Brian + Codex

## Decision

Create a local filesystem context pack for each KerriOS role pod and subagent so future Codex automations can point at a folder before reading the canonical KerriOS brain.

Local master folder:

- `/Users/brianderario/Desktop/Codex Kerri Agent/Codex Kerri Agent Master`

## Structure

- `00-shared-context/` - universal KerriOS loop, approval gates, and automation build contract
- `01-brian-kerri-agent/` - Kerri chief-of-staff, sales, inbox, events, pipeline, brain maintenance
- `02-benji-cdo-agent/` - Benji content/growth pod
- `03-ari-cfo-agent/` - Ari finance/legal/M&A pod
- `04-standard-works-production/` - S&W newsletter production workflows with partnership boundary
- `99-archive/` - retired context packs

Each agent folder has a `README.md`. Each subagent folder has a `README.md` with purpose, status, canonical KerriOS prompt/context pointers, approval gate, and write-back expectations.

## Use

When building a new automation:

1. Point the automation workspace at the relevant folder under the master folder.
2. Read `00-shared-context/README.md`.
3. Read the target agent folder.
4. Read the target subagent folder.
5. Load only the KerriOS files named there.

The folder gives the runner an ergonomic local context entrypoint. KerriOS remains canonical.

## Boundaries

- Do not duplicate the whole brain into the master folder.
- Do not store raw email, Slack, transcripts, credentials, private partner internals, or runtime state there.
- Write durable company truth back into KerriOS.
- Keep Standard & Works as production workflow context, not an internal KMG role pod.

## Related

- [[2026-05-25-agent-architecture-and-role-pods]]
- [[2026-05-25-living-brain-and-autonomy-ladder]]
- [[2026-05-26-inbox-sweep-primary-automation]]
- [[../agents/registry]]
