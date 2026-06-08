# Decision: Codex Primary Operating Layer (SUPERSEDED)

scope: decision · updated: 2026-05-25 · superseded: 2026-06-08 · author: Brian + Codex

> **SUPERSEDED** by [[2026-06-08-claude-code-sole-runner]]. Claude Code is now the sole runner. Codex is retired.

## Decision (historical)

Codex is now the primary operating layer for Brian's Kerri work. Treat Claude Code as a live fallback runner while the switch-over is tested, not as the source of truth.

Kerri's identity does not change: Kerri is still Brian's chief of staff and the KMG org brain. Codex is the runner Brian is asking to operate that role from now on.

## Operating posture

- **Primary runner:** Codex.
- **Fallback runner:** Claude Code can be used manually if Codex misses or blocks, but old Claude scheduled tasks were removed on 2026-05-25.
- **Source of truth:** KerriOS wiki + seed + local runtime state, not either runner's chat history.
- **Comparison bar:** Codex will be constantly compared against the existing Claude Code behavior; the expected posture is complete execution, not partial plans.
- **Surface ownership target:** Codex should own interactive Kerri conversations, inbox drafting, approval/task routing, iMessage/Slack status surfaces, scheduled work, and brain maintenance once each surface is verified.
- **Immediate guardrail:** do not blindly reactivate or port old Codex automations. They were removed on 2026-05-25 and should be rebuilt from scratch after MCP/approval rails are confirmed.

## MCP posture

Codex should prefer the custom Hardware FYI mailbox MCPs for Kerri/Brian HWFYI mail, matching Brian's standing routing rule. Generic Gmail or Outlook plugins are fallback paths only when Brian explicitly asks for them, the custom MCP cannot answer, or the mailbox is outside the custom MCP scope.

As of this decision, Codex local config should include:

- `Kerri@hardwarefyi.com-email` → local Microsoft Graph MCP for `kerri@hardwarefyi.com`
- `Brian@hardwarefyi.com-email` → local Microsoft Graph MCP for `brian@hardwarefyi.com`
- `superhuman-standardandworks` → Superhuman MCP for `brian@standardandworks.com`
- Plugin connectors for Slack, Gmail, Outlook Email, Google Drive, Google Calendar, Granola, GitHub, Notion, Browser/Chrome, and supporting document/spreadsheet/presentation work

Any external send still requires Brian approval through the applicable approval path. Codex being primary does not relax approval gates.

## What this replaces

This supersedes older assumptions that KerriOS work should default to Claude Code simply because the current shims and scheduled tasks were originally built there. Canonical prompts remain in this repo; runner-specific shims are replaceable.

Old Claude scheduled tasks and old Codex business automations were removed on 2026-05-25 so the new automation layer can be rebuilt around the KerriOS living-brain model instead of inherited stale paths.

## Related

- [[2026-05-24-brain-architecture]]
- [[agent-brain-protocol]]
- [[multi-agent-write-rules]]
- [[registry]]
