# KerriOS Brain Index

This is the catalog. One line per page. Read [[routing]] for the topic map; read this for "what pages exist."

## Workflows

- [[wiki/workflows/llm-wiki-pattern]] — the Karpathy LLM-wiki pattern this brain implements
- [[wiki/workflows/agent-brain-protocol]] — exact read/write contract every agent follows
- [[wiki/workflows/multi-agent-write-rules]] — how team agents share the brain without stepping on each other
- [[wiki/workflows/source-of-truth]] — what's canonical vs evidence vs chat
- [[wiki/workflows/definition-of-done-gate]] — THE pre-send gate (7 steps): read full state, name the real deliverable, research+inventory, attach, completeness, escalate-not-park, restate. Umbrella over the brain-log/followups/attach/escalate fragment rules. From the 2026-06-17 retro.
- [[wiki/workflows/draft-learnings]] — accumulated lessons from Kerri's draft edits
- [[wiki/workflows/hwfyi-sponsor-reply-templates]] — reusable Hardware FYI sponsor reply structures based on Brian's sent emails
- [[wiki/workflows/hwfyi-cy2026-revenue-goal]] — standing $1M CY2026 Hardware FYI revenue operating goal and automation mapping
- [[wiki/workflows/mcp-tool-add-checklist]] — definition + handler discipline when extending MCP servers (born from the 2026-05-24 gtasks bug)
- [[wiki/workflows/customer-id-protocol]] — universal per-customer jobId lookup; ALL automations + ad-hoc drafts run this before any company/jobId write
- [[wiki/workflows/investor-update-distro]] — KMG quarterly investor update distribution list and send pattern
- [[wiki/workflows/post-call-followup-protocol]] — mandatory pre-draft research + asset inventory + completeness test for post-call follow-up emails
- [[wiki/workflows/compound-engineering]] — how we build Savant so each unit of work makes the next easier; the methodology behind the build loop
- [[wiki/workflows/savant-build-learnings]] — code-side Learnings + Pattern docs store; the build loop's compound step reads + appends here

## Agents

- [[wiki/agents/registry]] — every active/planned team agent + their canonical prompt
- [[wiki/agents/kerri]] — Brian's chief of staff + org brain (active)

## People

**External contacts live in Savant CRM since 2026-06-11** ([[wiki/decisions/2026-06-11-brain-console-storage-split]]) — query `/api/v1/people`. Legacy external-person pages under `wiki/people/` are frozen (git history). Team pages stay current:

- [[wiki/people/brian-derario]] — CEO, KMG
- [[wiki/people/ari-lewis]] — CFO, KMG
- [[wiki/people/benji-chia]] — CDO, KMG
- [[wiki/people/zach-silber]] — S/W counterpart (boundary)

## Properties

- [[wiki/properties/kmg]] — Kerri Media Group (parent)
- [[wiki/properties/hardware-fyi]] — flagship newsletter + community
- [[wiki/properties/hardware-fyi-audience]] — audience demographics (Tier A directional / Tier B canonical-pending) for sponsor audience-fit answers
- [[wiki/properties/kinetic]] — annual SF conference
- [[wiki/events/kinetic-2026]] — year-one event (May 2026, SF); post-event deliverables incl. canonical photos link
- [[wiki/events/sf-tech-week-2026-sponsor-prospects]] — tiered SF Tech Week sponsor prospect list (Kinetic roster + advertisers + Tech Week-history research, 2026-06-02)
- [[wiki/events/ai-for-hardware-vendor-universe]] — exhaustive ~350-vendor map of the software/AI-for-hardware stack across 9 floor lanes, for the proving-ground demo event; CRM-flagged existing vs net-new (2026-06-13, 7-agent sweep)
- [[wiki/properties/savant]] — production KMG operating app formerly called Kerri/KMG Console (`kerrihq-rails` on Render); source of truth for CRM, tasks, approvals, revenue surfaces, newsletter inventory, agent runs, and permissioned brain records

## Companies

**FROZEN 2026-06-11** — Savant CRM is the system of record for companies, contacts, and deals ([[wiki/decisions/2026-06-11-brain-console-storage-split]]). Lookup via `GET /api/v1/companies?domain=<d>` / `?job_id=<id>`; relationship context in `crm_notes`. All 163 legacy pages under `wiki/companies/` were backfilled into Savant and remain in git history only; do not create or update pages here. One exception stays live:

- [[wiki/companies/standard-and-works]] — S0001 — external 50/50 partnership (boundary page, kept in the brain because the boundary is how-we-work, not CRM data)

## Decisions

- [[wiki/decisions/2026-05-23-kerrios-rebuild]] — clean KerriOS v2 + Kerri unified
- [[wiki/decisions/2026-05-24-google-tasks-approval]] — inbox sweep approval moved to Google Tasks
- [[wiki/decisions/2026-05-24-superhuman-sw-mailbox]] — S/W mailbox added under Superhuman
- [[wiki/decisions/2026-05-24-brain-architecture]] — LLM-wiki-on-git architecture (this one)
- [[wiki/decisions/2026-05-24-cold-outreach-launch]] — sub-agent #1 (cold outreach) shipped with hard volume caps
- [[wiki/decisions/2026-05-24-lead-research-launch]] — discovery sub-agent that feeds cold-outreach with multi-source enriched prospects (conferences, lookalikes, funding, hiring)
- [[wiki/decisions/2026-05-24-sw-newsletter-chain-launch]] — sub-agent #2: S&W Industrialist newsletter chain (writer + editor + marketing). Kerri owns the writing Mon/Wed nights for Tue/Thu publish.
- [[wiki/decisions/2026-05-25-codex-primary-operating-layer]] — ~~Codex primary~~ SUPERSEDED by [[wiki/decisions/2026-06-08-claude-code-sole-runner]]
- [[wiki/decisions/2026-06-08-claude-code-sole-runner]] — Claude Code is the sole operating runner for all Kerri routines (supersedes Codex-primary decision)
- [[wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder]] — KerriOS is the living company brain; Kerri climbs from approval-gated assistant to eventual decision authority.
- [[wiki/decisions/2026-05-25-agent-architecture-and-role-pods]] — Brian's agent architecture distilled into role pods, feedback loops, and automation rebuild priorities.
- [[wiki/decisions/2026-05-26-inbox-sweep-primary-automation]] — first rebuilt Codex automation; inbox sweep routes email into KerriOS, Google Tasks approvals, and self-grading improvement loops.
- [[wiki/decisions/2026-05-26-agent-folder-master]] — local Codex Kerri Agent Master folder gives each role pod and subagent a pickable context pack for future automations.
- [[wiki/decisions/2026-05-26-parallel-core-automation-bundle]] — second rebuild wave: EOD Meetings Review, Morning Brief, and Brain Push/Knowledge Hygiene activated together.
- [[wiki/decisions/2026-06-09-autonomy-boundary]] — class-based auto-vs-ask split: internal-recipient-reply → AUTO-LOGGED, earned graduation ramp, 7-day approval escalation
- [[wiki/decisions/2026-06-09-kerri-brian-comms]] — channel map: Google Tasks = approvals BOR, email = two-way backbone, text = interrupt lane only, Slack retired as the personal channel
- [[wiki/decisions/2026-06-10-info-mailbox-autonomous]] — info@hardwarefyi.com joins the inbox sweep via new `info-hardwarefyi-email` MCP; routine outreach + inbound handled autonomously (no auto-CC), commercial substance stays Brian's call
- [[wiki/decisions/2026-06-11-benji-ea-board]] — Benji's EA board greenlit: benji@ joins the sweep, approvals live in his own mailbox (Drafts + send/edit/skip replies), private from Brian by default, Brian-CC opt-in only
- [[wiki/decisions/2026-06-11-brain-console-storage-split]] — brain keeps how-we-work; Savant is the CRM of record (companies/contacts/deals); CRM Google Sheet demoted to one-way verification mirror
- [[wiki/decisions/2026-06-11-console-brain-port]] — Savant hosts the permissioned brain: knowledge records with provenance, domain/sensitivity grants (Brian master, Ari finance/legal, Benji HWFYI/content, Zach S&W), scoped agents, approval proof trails, idempotent KerriOS importer (kerrihq-rails `77e061e`)
- [[wiki/decisions/2026-06-17-savant-as-company-hub]] — **Savant becomes the single company hub end to end**: brain (knowledge + agent operating layer) source of truth moves to Savant, git demoted to automated backing store + runner disk copy; supersedes the read side of the 6/11 split; 5-phase build plan inside

## Deals · Meetings · Candidates · Raw

- [[wiki/meetings/2026-05-27-brian-ken-catch-up]] — Coffee with Ken media/event collaboration discussion
- [[wiki/meetings/2026-05-27-hardware-fyi-colab]] — CoLab content/newsletter experiment discussion
- `wiki/deals/` — open + closed deals (empty; populated as work happens)
- [[wiki/meetings/2026-05-26-zenode-hardware-fyi]] — Zenode x Hardware FYI content-led partnership discussion
- [[wiki/meetings/2026-05-26-nehemoyia-young-and-brian-derario]] — Duro post-Kinetic events/content planning
- [[wiki/meetings/2026-05-26-james-redd-and-brian-derario]] — Complement partner-program trial discussion
- [[wiki/meetings/2026-05-27-summit-interconnect-hardware-fyi]] — Summit Interconnect 2026 HWFYI partnership scoping
- [[wiki/meetings/2026-05-28-modelwise-hardware-fyi]] — Modelwise HWFYI content/newsletter trial scoping
- [[wiki/meetings/2026-05-28-gabriel-louis-kayen-and-brian-derario]] — Flow Engineering HWFYI digital launch planning
- [[wiki/meetings/2026-05-28-shiv-hardware-fyi]] — ATOMS HWFYI requirements-management GTM discussion
- `candidates/` — uncertain/conflicting claims pending review
- `raw/` — append-only evidence
- wiki/workflows/kmg-console-approvals.md — Savant approvals system handoff (goals, code on GitHub, sync architecture, open steps)
