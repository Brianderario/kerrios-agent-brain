# KerriOS Brain Routing

Topic → file map. Use this to find the right wiki page without reading the full index. Read 1–3 pages on a routed topic; don't auto-load more.

## "Savant / KMG Console / approvals / task board / where Brian approves emails"

- [[wiki/properties/savant]] — canonical definition: production KMG operating app (`kerrihq-rails` on Render), formerly Kerri/KMG Console
- [[wiki/workflows/kmg-console-approvals]] — system handoff: goals, code locations (GitHub), sync architecture, state, next steps

## "How does the brain work?"

- [[wiki/workflows/llm-wiki-pattern]]
- [[wiki/workflows/agent-brain-protocol]]
- [[wiki/workflows/multi-agent-write-rules]]
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]]

## "Who is X?" (person)

- KMG team + Zach: `wiki/people/<slug>.md` (brian-derario, ari-lewis, benji-chia, zach-silber)
- External contacts: **Savant CRM** — `GET /api/v1/people?company_id=…` or search by email (token `KERRIHQ_AGENT_API_KEY` in `~/.kerri-chief/secrets/kerrihq.env`). Legacy `wiki/people/` pages are frozen (git history).

## "What is X?" (company / property / partner)

- KMG entities: `wiki/properties/<slug>.md`
- External companies (incl. partners): **Savant CRM is the system of record** (2026-06-11 split, [[wiki/decisions/2026-06-11-brain-console-storage-split]]) — `GET /api/v1/companies?domain=<d>` / `?job_id=<id>`; relationship context lives in the record's `crm_notes`. `wiki/companies/` is frozen (legacy pages in git history; exception: [[wiki/companies/standard-and-works]] remains the boundary page). Offline fallback: snapshot `data/companies.json` (read-only).

## "Why did we do X?" (decision history)

- `wiki/decisions/<YYYY-MM-DD>-<slug>.md` — primary
- [[log]] for chronological scan

## "What's our policy on X?" / "How do we do X?"

- `wiki/workflows/<slug>.md`

## "Which email tool should I use?"

- `brian@kerrihq.com` → Gmail plugin.
- `brian@standardandworks.com` → Superhuman.
- `brian@hardwarefyi.com` and `kerri@hardwarefyi.com` → custom local Outlook MCP.
- Match the exact account Brian names before searching or reading mail. Do not treat Gmail, Superhuman, and Outlook as interchangeable.

## "How do routines report runs / file tasks to Savant?"

- [[wiki/workflows/console-reporting]] — Savant MCP/API contract for run reporting, board tasks, approvals readback, adjustments

## "How should we reply to a sponsor asking what products include?"

- [[wiki/workflows/hwfyi-sponsor-reply-templates]] — product-education reply shape based on Brian's H0001 Aris Machina send
- [[wiki/workflows/draft-learnings]] — reusable Brian-edit lessons from task drafts
- [[wiki/properties/hardware-fyi]] — current sponsor products, product-selection rules, and lead-gen positioning

## "What's our audience / readership / demographics?" / sponsor asks for industry / seniority / geography / company-size splits

- [[wiki/properties/hardware-fyi-audience]] — audience demographics. Tier A = directional Apollo sample (quote with caveat); Tier B = canonical media-kit numbers (pending Brian/Benji). Read before answering any audience-fit question.

## "How do I quote a sponsor package / pricing / tiers?" / "post-call package options" / "how much for X"

- [[wiki/workflows/hwfyi-package-quote-playbook]] — **MANDATORY read before writing or editing any sponsor price/package/tier.** Bundle construction rules (never a single Primary Placement; placements come in multiples and scale with the tier), high→low anchoring, the Modelwise reference ladder, and the "new prices need Brian's confirmation" gate.
- [[wiki/properties/hardware-fyi]] — canonical product list + rate-card pricing
- [[wiki/workflows/hwfyi-sponsor-reply-templates]] — sibling: product-education reply (buyer asks "what's included?")

## "What happened in meeting X?"

- `wiki/meetings/<YYYY-MM-DD>-<slug>.md`

## "Which conferences do our sponsors / partners / prospects attend?" / "Where do our contacts show up?"

- **CRM "Conferences" tab** (Hardware FYI CRM Sheet `1mXauTrY5…mcgYk`) — running intel log of events our contacts said they attend/sponsor/exhibit/speak at. Distinct from the Leads tab's `lane=conference` rows (HWFYI's own exhibit-prospecting).
- Captured automatically by the EOD meeting sweep — see `agent-prompts/kerri-eod-meetings-review/SKILL.md` STEP 5A.G. Helper: `scripts/conferences-append.mjs` (dedupes on `conference|company|source`).
- HWFYI's own attend/exhibit targets: [[wiki/events/2026-conference-prospecting]].

## "What deals are open?"

- `wiki/deals/<slug>.md`

## "What's the status of <event>?" / "Venues / vendors for X event"

- `wiki/events/<slug>.md` — durable per-event summary
- On-demand sub-agent: `agent-prompts/kerri-event-logistics/SKILL.md` — fires on "find venues", "AV options", "draft inquiry", "RoS", etc.

## "What agents do we have?"

- [[wiki/agents/registry]] — index
- `wiki/agents/<slug>.md` — per-agent profile (e.g. [[wiki/agents/kerri]])
- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — role-pod architecture and rebuild priorities
- [[wiki/decisions/2026-05-26-agent-folder-master]] — local filesystem context packs for each agent/subagent

## "How should the company-agent architecture work?" / "Where do Benji/Ari/Brian agents fit?"

- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — Brian/Kerri, Benji/CDO, Ari/CFO pods and the perceive/propose/record/improve loop
- [[wiki/decisions/2026-06-11-benji-ea-board]] — Kerri as Benji's EA: benji@ sweep coverage, in-mailbox approvals, privacy-from-Brian default
- [[wiki/agents/registry]] — active and planned agents
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — autonomy ladder and living-brain bet
- [[wiki/decisions/2026-05-26-agent-folder-master]] — folder-level context entrypoints for building automations around a specific agent or subagent

## "Where does Standard & Works fit?"

- [[wiki/companies/standard-and-works]] — partnership boundary
- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — not an internal KMG pod, but S&W newsletter remains an active Kerri production workflow
- [[wiki/decisions/2026-05-24-sw-newsletter-chain-launch]] — writer + editor + marketing chain
- [[wiki/workflows/sw-newsletter-production-rules]] — canonical newsletter writing rules, Gmail voice examples, mailbox routing, and more-comprehensive format direction
- [[wiki/decisions/2026-05-26-agent-folder-master]] — local folder is `Codex Kerri Agent Master/S&W Writing Agent`, not `04-standard-works-production`

## "What runner does Kerri use?"

- [[wiki/decisions/2026-06-08-claude-code-sole-runner]] — Claude Code is the sole runner (supersedes Codex-primary)
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — why KerriOS is the living brain and how autonomy advances
- [[wiki/agents/registry]] — agent roster and canonical prompt locations

## "How autonomous is Kerri allowed to be?"

- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — personal assistant first, autonomous email second, full decision authority last
- [[wiki/workflows/agent-brain-protocol]] — current approval gates

## "How does the inbox sweep work?" / "What is the first rebuilt automation?"

- [[wiki/decisions/2026-05-26-inbox-sweep-primary-automation]] — primary Codex inbox loop, progressive enrichment, approval rail, and self-grading
- [[wiki/decisions/2026-06-10-info-mailbox-autonomous]] — info@hardwarefyi.com mailbox: connector, no-auto-CC design, autonomous-handling scope
- [[../agent-prompts/kerri-inbox-sweep/SKILL.md]] — canonical runnable prompt
- [[wiki/decisions/2026-05-24-google-tasks-approval]] — Google Tasks approval mechanics
- [[wiki/workflows/customer-id-protocol]] — company/jobId lookup before every logged company action

## "How should Kerri or Codex suggest build improvements?"

- [[wiki/workflows/google-tasks-improvement-suggestions]] — Kerri MG `💡 SUGGESTION:` task format, relevance gate, dedup rules, and Codex interactive redo provenance
- [[wiki/decisions/2026-05-24-google-tasks-approval]] — Google Tasks approval mechanics

## "What daily automations are active after inbox sweep?"

- [[wiki/decisions/2026-05-26-parallel-core-automation-bundle]] — Morning Brief, EOD Meetings Review, and Brain Push/Knowledge Hygiene
- [[../agent-prompts/kerri-morning-brief/SKILL.md]] — morning command brief
- [[../agent-prompts/kerri-eod-meetings-review/SKILL.md]] — meeting-to-memory and follow-up drafts
- [[../agent-prompts/kerri-brain-push/SKILL.md]] — nightly knowledge hygiene and git push

## "What's uncertain or pending review?"

- `candidates/<slug>.md`

## "Where's the raw evidence for X?"

- `raw/<YYYY-MM-DD>-<slug>.md`

## "Who's allowed to write X?"

- [[AGENTS]] (top-level) — write rules
- [[wiki/workflows/agent-brain-protocol]] — approval gates
- [[wiki/workflows/multi-agent-write-rules]] — multi-agent flow

## "How do I assign a job ID?" / "Is this customer already in the CRM?"

- [[wiki/workflows/customer-id-protocol]] — **MANDATORY universal lookup** before any company/jobId write. Per-customer (not per-sweep); same company keeps same jobId forever. Lookup doubles as QA gate. Runs against the Savant API since 2026-06-11.
- `../data/companies.json` — READ-ONLY Savant snapshot (offline fallback only; refreshed by `scripts/console-crm-snapshot.mjs`)
- `../data/job-counters.json` — counter state (only bumps on brand-new customer)

## "Who gets the investor update?" / "investor update distribution list" / "quarterly update"

- [[wiki/workflows/investor-update-distro]] — canonical distribution list, cadence, and send pattern for KMG quarterly investor updates (brian@kerrihq.com via Gmail)

## "What's currently being worked on?"

- [[log]] — chronological recent events
- Open Google Tasks lists (Hardware FYI / Standard & Works / Kerri MG) — in Brian's Google account, not in this repo
