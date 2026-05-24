# KerriOS Brain Routing

Topic → file map. Use this to find the right wiki page without reading the full index. Read 1–3 pages on a routed topic; don't auto-load more.

## "How does the brain work?"

- [[wiki/workflows/llm-wiki-pattern]]
- [[wiki/workflows/agent-brain-protocol]]
- [[wiki/workflows/multi-agent-write-rules]]

## "Who is X?" (person)

- `wiki/people/<slug>.md` — primary
- Slug convention: lowercase-kebab. Example: `brian-derario.md`

## "What is X?" (company / property / partner)

- KMG entities: `wiki/properties/<slug>.md`
- External companies (incl. partners): `wiki/companies/<slug>.md`

## "Why did we do X?" (decision history)

- `wiki/decisions/<YYYY-MM-DD>-<slug>.md` — primary
- [[log]] for chronological scan

## "What's our policy on X?" / "How do we do X?"

- `wiki/workflows/<slug>.md`

## "What happened in meeting X?"

- `wiki/meetings/<YYYY-MM-DD>-<slug>.md`

## "What deals are open?"

- `wiki/deals/<slug>.md`

## "What's the status of <event>?" / "Venues / vendors for X event"

- `wiki/events/<slug>.md` — durable per-event summary
- On-demand sub-agent: `agent-prompts/kerri-event-logistics/SKILL.md` — fires on "find venues", "AV options", "draft inquiry", "RoS", etc.

## "What agents do we have?"

- [[wiki/agents/registry]] — index
- `wiki/agents/<slug>.md` — per-agent profile (e.g. [[wiki/agents/kerri]])

## "What's uncertain or pending review?"

- `candidates/<slug>.md`

## "Where's the raw evidence for X?"

- `raw/<YYYY-MM-DD>-<slug>.md`

## "Who's allowed to write X?"

- [[AGENTS]] (top-level) — write rules
- [[wiki/workflows/agent-brain-protocol]] — approval gates
- [[wiki/workflows/multi-agent-write-rules]] — multi-agent flow

## "What's currently being worked on?"

- [[log]] — chronological recent events
- Open Google Tasks lists (Hardware FYI / Standard & Works / Kerri MG) — in Brian's Google account, not in this repo
