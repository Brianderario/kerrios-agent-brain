# Agent Prompts (canonical)

Every team agent's SKILL.md lives here. Local Claude/Cursor/etc. installations point to these files via thin shims so prompt evolution shows up in git history, not in each teammate's laptop.

## Why this directory exists

The brain (`brain/`) is *what we know*. The agent-prompts (`agent-prompts/`) are *how agents act on what we know*. Both are durable company assets — both belong in git.

## Layout

```
agent-prompts/
├── kerri-skill/         # Kerri persona — fires on "Kerri", "my agent", etc.
│   ├── SKILL.md
│   └── references/
│       ├── automations.md
│       ├── brain.md
│       ├── email.md
│       └── voice.md
├── kerri-inbox-sweep/   # 15-min sweep across 4 mailboxes
│   └── SKILL.md
├── kerri-morning-brief/ # Weekday Brian command brief
│   └── SKILL.md
├── kerri-eod-meetings-review/ # Evening meeting-to-memory review
│   └── SKILL.md
├── kerri-brain-push/    # Nightly git commit + push of brain changes
│   └── SKILL.md
├── kerri-company-training/ # Source-backed orientation + recertification
│   └── SKILL.md
└── oliver-sw-content-agent/ # On-demand S&W/KMG content Slack agent, no email tools
    ├── SKILL.md
    └── references/
        └── standard-works-kmg-writing-style.md
```

## How the shim pattern works

Each laptop has a SKILL.md at the runtime location (e.g. `~/.claude/skills/kerri/SKILL.md`). That file contains:

1. **Frontmatter** (description that triggers the skill) — identical to canonical
2. **One-line body:** "Load and follow the canonical prompt at `<repo path>/SKILL.md`. Treat every instruction there as if written here. Read referenced files relative to that path."

When the skill fires, the local agent reads the canonical from this repo, follows it, writes back to `brain/` per the protocol. If the canonical updates and the laptop pulls latest, the next firing uses the new prompt automatically.

## Adding a new agent

1. Create `agent-prompts/<agent-slug>/SKILL.md` with the canonical prompt (Kerri's voice rules + the agent's specific job).
2. Add an entry to [[../brain/wiki/agents/registry]].
3. Wire a shim on each teammate's laptop.
4. Open a PR — registry update needs review.

## Updating an existing agent

Edit the canonical here. Commit + push. All teammates' agents pick up the change on next pull (nightly via `kerri-brain-push`, or on-demand).

Material prompt changes (anything affecting external sends, approval gates, identity, or boundary rules) should be a PR, not a direct push to `main`.

## Training Kerri

`kerri-company-training` is the executable companion to the curriculum under
`brain/wiki/training/`. It reads required records, works one due competency at
a time, and submits an evidence-backed assessment to Savant. Model-submitted
assessments always wait for human review; the prompt never grants Kerri the
ability to certify herself or to turn a training answer into external authority.
