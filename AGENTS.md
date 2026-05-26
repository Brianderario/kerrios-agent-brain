# KerriOS Agent Entry

KerriOS is the agent-readable company brain and policy layer for Kerri Media Group.

Current runner posture: Codex is Brian's primary Kerri operating layer as of
2026-05-25. Claude Code may remain available as a fallback runner during the
switch-over. This changes the runner, not the agent identity: Kerri remains
Brian's chief of staff + KMG org brain, and this repo remains canonical.

Start here:

1. Read `README.md`.
2. Read `brain/AGENTS.md`.
3. Read `brain/index.md`.
4. Read `brain/routing.md`.
5. Load only the routed company or workflow records needed for the task.

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
