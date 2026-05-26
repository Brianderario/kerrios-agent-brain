# KerriOS Brain Routing

Topic → file map. Use this to find the right wiki page without reading the full index. Read 1–3 pages on a routed topic; don't auto-load more.

## "How does the brain work?"

- [[wiki/workflows/llm-wiki-pattern]]
- [[wiki/workflows/agent-brain-protocol]]
- [[wiki/workflows/multi-agent-write-rules]]
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]]

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

## "How should we reply to a sponsor asking what products include?"

- [[wiki/workflows/hwfyi-sponsor-reply-templates]] — product-education reply shape based on Brian's H0001 Aris Machina send
- [[wiki/workflows/draft-learnings]] — reusable Brian-edit lessons from task drafts
- [[wiki/properties/hardware-fyi]] — current sponsor products, product-selection rules, and lead-gen positioning

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
- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — role-pod architecture and rebuild priorities

## "How should the company-agent architecture work?" / "Where do Benji/Ari/Brian agents fit?"

- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — Brian/Kerri, Benji/CDO, Ari/CFO pods and the perceive/propose/record/improve loop
- [[wiki/agents/registry]] — active and planned agents
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — autonomy ladder and living-brain bet

## "Where does Standard & Works fit?"

- [[wiki/companies/standard-and-works]] — partnership boundary
- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — not an internal KMG pod, but S&W newsletter remains an active Kerri production workflow
- [[wiki/decisions/2026-05-24-sw-newsletter-chain-launch]] — writer + editor + marketing chain

## "Is Codex or Claude running Kerri?"

- [[wiki/decisions/2026-05-25-codex-primary-operating-layer]] — Codex is primary; Claude Code is fallback during switch-over
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — why KerriOS is the living brain and how autonomy advances
- [[wiki/agents/registry]] — agent roster and canonical prompt locations

## "How autonomous is Kerri allowed to be?"

- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — personal assistant first, autonomous email second, full decision authority last
- [[wiki/workflows/agent-brain-protocol]] — current approval gates

## "How does the inbox sweep work?" / "What is the first rebuilt automation?"

- [[wiki/decisions/2026-05-26-inbox-sweep-primary-automation]] — primary Codex inbox loop, progressive enrichment, approval rail, and self-grading
- [[../agent-prompts/kerri-inbox-sweep/SKILL.md]] — canonical runnable prompt
- [[wiki/decisions/2026-05-24-google-tasks-approval]] — Google Tasks approval mechanics
- [[wiki/workflows/customer-id-protocol]] — company/jobId lookup before every logged company action

## "What's uncertain or pending review?"

- `candidates/<slug>.md`

## "Where's the raw evidence for X?"

- `raw/<YYYY-MM-DD>-<slug>.md`

## "Who's allowed to write X?"

- [[AGENTS]] (top-level) — write rules
- [[wiki/workflows/agent-brain-protocol]] — approval gates
- [[wiki/workflows/multi-agent-write-rules]] — multi-agent flow

## "How do I assign a job ID?" / "Is this customer already in the brain?"

- [[wiki/workflows/customer-id-protocol]] — **MANDATORY universal lookup** before any company/jobId write. Per-customer (not per-sweep); same company keeps same jobId forever. Lookup doubles as QA gate.
- `../data/companies.json` — the registry (domain → {jobId, …})
- `../data/job-counters.json` — counter state (only bumps on brand-new customer)

## "What's currently being worked on?"

- [[log]] — chronological recent events
- Open Google Tasks lists (Hardware FYI / Standard & Works / Kerri MG) — in Brian's Google account, not in this repo
