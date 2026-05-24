# Decision: KerriOS v2 Rebuild

scope: decision · updated: 2026-05-24 · landed: 2026-05-23

## Decision

Tear down OpenClaw + Sheets-backed + Notion infrastructure. Rebuild as a clean Obsidian-vault brain + GitHub agent-seed. Collapse Hudson + kerri-brain skills into one agent: **Kerri**.

## What was retired

- **OpenClaw / Railway agent infrastructure** (Alfred + Edison + Hermes + Quinn personas, Telegram bot, OpenClaw admin UI). Retired 2026-05-16 to 23.
- **Codex execution layer** at `~/Documents/new project/`. Replaced by `~/Documents/.../KerriOS/`.
- **Hudson** as Brian's personal agent. Collapsed into Kerri 2026-05-23.
- **Notion workspace.** Eliminated 2026-05-16.
- **Sheets-as-canonical** (`KerriOS — Operating Books` file `1A-RZeW…`). File still exists in Drive, no longer canonical.
- **Telegram** as agent substrate. Dead.

## What landed

- **KerriOS local vault** at `~/Documents/Documents - Brian's MacBook Air/KerriOS/`.
- **GitHub agent-seed** at `Brianderario/kerrios-agent-brain` (private).
- **Unified Kerri** — chief of staff + org brain in one identity.
- **Kerri's external email:** kerri@hardwarefyi.com (Microsoft Graph).
- **KMG name** — final rename from KerriHQ Inc. on 2026-05-23.

## Why

OpenClaw + Sheets had become tangled. Multiple agent personas with overlapping responsibilities created confusion. Notion was a SaaS dependency that didn't earn its keep. Clean-spec rebuild lets the brain be small, transparent, and agent-native from day one.

## What extended this on 2026-05-24

- [[2026-05-24-google-tasks-approval]] — inbox sweep moved from Slack DM / Google Doc to Google Tasks.
- [[2026-05-24-superhuman-sw-mailbox]] — brian@standardandworks.com added under Superhuman.
- [[2026-05-24-brain-architecture]] — this brain promoted from scaffolding to live LLM-wiki.

## Related

- [[kerri]]
- [[kmg]]
- [[brian-derario]]
