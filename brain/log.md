# KerriOS Brain Log

Append-only chronological record. Newest entries at top. Format: `## [YYYY-MM-DD HH:MM ET] <action> | <slug> | <agent>`.

## [2026-05-24 19:35 ET] fix | kerri-gdocs-mcp-gtasks-handlers | Kerri

Diagnosed + fixed inbox sweep failure ("Unknown tool: gtasks_list_lists"). Root cause: the prior session added 5 gtasks tool DEFINITIONS to `src/index.ts` (ListToolsRequestSchema) but never wrote the corresponding CASE branches in the CallToolRequestSchema handler. Result: MCP advertised the tools but had no code to execute them, so every gtasks_* call fell through to the default `throw new McpError(ErrorCode.MethodNotFound, "Unknown tool: ${name}")`.

Fix: added 5 handlers (gtasks_list_lists / list_tasks / get_task / create_task / update_task) using the `tasksClient` that was already imported and instantiated. Rebuilt `dist/index.js` (1 file at `~/.kerri-chief/kerri-gdocs-mcp/dist/index.js`, mtime now 2026-05-24 02:32 PT). Scheduled tasks spawn fresh MCPs per run, so the next inbox sweep picks up the fix automatically. Interactive sessions need a Claude Code restart or `/mcp` reconnect.

**Process improvement:** when adding MCP tools, the LLM-wiki-pattern checklist must verify (a) tool DEF in ListToolsRequestSchema, (b) CASE branch in CallToolRequestSchema, (c) `npm run build` succeeded, (d) `grep -c "name === \"<tool>\"" dist/index.js` ≥ 1. Added to `wiki/workflows/mcp-tool-add-checklist.md` (TBD).

**Side note:** `~/.kerri-chief/kerri-gdocs-mcp/` is not under git locally. Hardening item — should be its own private repo so source changes have version history.

## [2026-05-24 19:00 ET] eod-review | 0 meetings, 0 drafts, 0 flagged | Kerri

No meetings found today (Sunday / Memorial Day weekend). Checked Reclaim, Google Calendar (all calendars), and Outlook — all returned zero events in the 00:00–19:00 ET window. Granola cache empty. No Slack digest sent (all-zero rule). State bootstrapped to `data/eod-state.json`.

## [2026-05-24 04:00 ET] task-shipped | kerri-eod-meetings-review | Kerri

New scheduled task. Cron `0 19 * * *` daily. Pulls today's calendar (Reclaim + Google + Outlook fallback), matches each meeting against Granola transcripts. Meetings WITH transcripts → writes a per-meeting recap to `brain/wiki/meetings/<date>-<slug>.md`, updates affected person/company pages, drafts a follow-up email, posts as a Google Task `🌙 EOD-<prefix>NN` in the matching list (HWFYI / S&W / Kerri MG). Meetings WITHOUT transcripts → flagged as `⚠️ NO TRANSCRIPT:` tasks in Kerri MG list. Slack digest to Brian. Granola tool discovery happens at runtime via ToolSearch. Per-day dedup via `data/eod-state.json`. S/W boundary respected — S meetings go to `brain/.local/meetings/` (gitignored). Canonical at `agent-prompts/kerri-eod-meetings-review/SKILL.md`. Registry updated.

## [2026-05-24 03:30 ET] voice-rewrite | brian-hardwarefyi-sent-corpus | Kerri

Rewrote canonical [[wiki/workflows/llm-wiki-pattern]]-referenced voice.md from a sample of 8 sent emails from brian@hardwarefyi.com (2026-05-21 to 2026-05-23). Several prior rules were speculative and contradicted Brian's actual sends — corrected (see [[wiki/workflows/draft-learnings]] §2026-05-24-voice-rewrite for the full delta). Canonical now at `agent-prompts/kerri-skill/references/voice.md`.

## [2026-05-24 02:00 ET] decision | brain-architecture | Kerri

Promoted KerriOS from scaffolding to live LLM-wiki on git. See [[wiki/decisions/2026-05-24-brain-architecture]]. Local KerriOS dir is now a working clone of `Brianderario/kerrios-agent-brain`. `agent-prompts/` directory added with canonical Kerri prompts (sweep, skill, brain-push). Initial wiki populated with KMG/properties/people/decisions/agents pages. Nightly `kerri-brain-push` task to run at 22:00 ET keeps the brain alive in git.

## [2026-05-24 01:30 ET] decision | superhuman-sw-mailbox | Kerri

Added brian@standardandworks.com as fourth mailbox in inbox sweep, via Superhuman MCP. See [[wiki/decisions/2026-05-24-superhuman-sw-mailbox]]. Boundary rules tightened — S body content scrubbed from jobs.json after send; S-prefix learnings go to gitignored `brain/.local/s-learnings.md`.

## [2026-05-24 01:00 ET] decision | google-tasks-approval | Kerri

Replaced Google Doc approval channel with three Google Tasks lists. See [[wiki/decisions/2026-05-24-google-tasks-approval]]. Sweep skill rewritten; `kerri-gdocs` MCP rebuilt with `gtasks_*` tools; setup-auth.mjs extended to request the `tasks` OAuth scope. Pending: Brian re-runs setup-auth to grant scope.

## [2026-05-23] decision | kerrios-rebuild | Brian + Kerri

Clean rebuild of KerriOS. OpenClaw retired. Notion eliminated. Hudson collapsed into Kerri. KMG name finalized. Kerri's external email = kerri@hardwarefyi.com. See [[wiki/decisions/2026-05-23-kerrios-rebuild]].
