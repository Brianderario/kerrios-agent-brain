# KerriOS Agent Entry

KerriOS is the agent-readable company brain and policy layer for Kerri Media Group.

Current runner posture: Claude Code is the sole runner for all Kerri work
(interactive + scheduled) as of 2026-06-08. Codex is retired. This changes the
runner, not the agent identity: Kerri remains Brian's chief of staff + KMG org
brain, and this repo remains canonical.

KerriOS is the living company brain. Every meaningful interaction from email,
Slack, Codex/iMessage, meetings, Drive docs, and operational work should feed
back into this repo as compact wiki truth, candidates, raw evidence pointers, or
log entries. Brian remains the CEO decision maker until he explicitly advances
Kerri up the autonomy ladder in
`brain/wiki/decisions/2026-05-25-living-brain-and-autonomy-ladder.md`.

## Cross-runner sync (Codex ↔ Claude) — read this first

Brian works across two runners (Codex and Claude Code). The git brain is the shared state; **`NOW.md` is the live handoff baton.** To keep zero lag between runners:

- **On start:** the latest brain is pulled automatically (`scripts/kerri-pull.sh`, wired as a SessionStart hook). **Read `NOW.md` first** to see what's in flight before doing anything else.
- **On stop:** eligible brain writes are auto-committed + pushed automatically (`scripts/kerri-sync.sh`, wired as a Stop hook). Silent no-op on turns that didn't touch the brain.
- **Before you stop:** update `NOW.md` (Last action / Next action / Last touched) if you changed anything in flight. That single edit is the handoff to the other runner.
- Manual sync if ever needed: `bash scripts/kerri-sync.sh`. Never force-push.
- **Material writes still go via PR** (org structure, finance, partnerships, hard rules — see `multi-agent-write-rules.md`). The auto-sync handles routine writes to `main`; for a material change, open the PR before you stop rather than letting the hook push it.

Start here:

1. Read `NOW.md` — live handoff baton (what's in flight right now).
2. Read `README.md`.
3. Read `brain/AGENTS.md`.
4. Read `brain/index.md`.
5. Read `brain/routing.md`.
6. Load only the routed company or workflow records needed for the task.

If you are running an agent (Kerri, Ari's CFO agent, Benji's CDO agent, future):
- Your canonical prompt lives in `agent-prompts/<agent-slug>/SKILL.md`.
- See `brain/wiki/workflows/agent-brain-protocol.md` for the read/write contract.
- See `brain/wiki/workflows/multi-agent-write-rules.md` for branch/PR rules.
- See `brain/wiki/agents/registry.md` for the full agent roster.

Data rules:

- `data/kerrios.agent-seed.json` is the sanitized GitHub seed for agents.
- `data/kerrios.json` is the local live store and must not be committed.
- Runtime tokens, API keys, mailbox credentials, local logs, and generated exports must not be committed.
- Do not treat prompt history, Slack history, or raw email as canonical unless it has been written into KerriOS memory, a source-linked candidate, or a wiki page.

Write rules:

- Company facts can be proposed as memory candidates or wiki updates.
- External sends, CRM changes, pricing, legal, finance, permission changes, purchases, and deletes require an approval path.
- Keep changes compact and source-linked. Do not dump raw transcripts, raw emails, or broad logs into the brain.

For another agent:

- Use the sanitized seed to understand company/project context.
- Ask KerriOS for scoped context when the API is available.
- Prefer source pointers over copying source data.
