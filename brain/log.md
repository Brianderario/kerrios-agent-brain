# KerriOS Brain Log

Append-only chronological record. Newest entries at top. Format: `## [YYYY-MM-DD HH:MM ET] <action> | <slug> | <agent>`.

## [2026-05-24 02:00 ET] decision | brain-architecture | Kerri

Promoted KerriOS from scaffolding to live LLM-wiki on git. See [[wiki/decisions/2026-05-24-brain-architecture]]. Local KerriOS dir is now a working clone of `Brianderario/kerrios-agent-brain`. `agent-prompts/` directory added with canonical Kerri prompts (sweep, skill, brain-push). Initial wiki populated with KMG/properties/people/decisions/agents pages. Nightly `kerri-brain-push` task to run at 22:00 ET keeps the brain alive in git.

## [2026-05-24 01:30 ET] decision | superhuman-sw-mailbox | Kerri

Added brian@standardandworks.com as fourth mailbox in inbox sweep, via Superhuman MCP. See [[wiki/decisions/2026-05-24-superhuman-sw-mailbox]]. Boundary rules tightened — S body content scrubbed from jobs.json after send; S-prefix learnings go to gitignored `brain/.local/s-learnings.md`.

## [2026-05-24 01:00 ET] decision | google-tasks-approval | Kerri

Replaced Google Doc approval channel with three Google Tasks lists. See [[wiki/decisions/2026-05-24-google-tasks-approval]]. Sweep skill rewritten; `kerri-gdocs` MCP rebuilt with `gtasks_*` tools; setup-auth.mjs extended to request the `tasks` OAuth scope. Pending: Brian re-runs setup-auth to grant scope.

## [2026-05-23] decision | kerrios-rebuild | Brian + Kerri

Clean rebuild of KerriOS. OpenClaw retired. Notion eliminated. Hudson collapsed into Kerri. KMG name finalized. Kerri's external email = kerri@hardwarefyi.com. See [[wiki/decisions/2026-05-23-kerrios-rebuild]].
