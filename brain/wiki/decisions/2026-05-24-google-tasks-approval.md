# Decision: Google Tasks as Inbox Sweep Approval Channel

scope: decision · updated: 2026-05-26

## Decision

Switch the Kerri inbox sweep approval channel from a single Google Doc to **three Google Tasks lists** (one per property prefix: Hardware FYI, Standard & Works, Kerri MG). Each new job becomes a Google Task. Checkbox = send.

## Why

- The Google Doc forced Brian to scan a growing single document to find what needed action.
- Google Tasks lets him use the existing mobile + desktop apps, with the checkbox UI native to "approve."
- One list per property keeps boundaries (esp. S/W) explicit and gives a working canvas Brian can scan in 5 seconds.

## Mechanics (full detail in `agent-prompts/kerri-inbox-sweep/SKILL.md`)

- Title: `<JOBID> — <Company> — <Subject>`
- Notes contain `ACTION:` line (`send`/`skip`/`redo`) + CONTEXT + WHAT I NEED YOU TO DO + DRAFT block.
- Approve & send = check the task. The sweep auto-detects in-place edits to DRAFT.
- Skip / redo = edit the ACTION line to `skip` or `redo`.
- After send: title gets `✅ sent HH:MM ET` prefix; task marked completed.
- Kerri's own workflow suggestions land in the Kerri MG list with `💡 SUGGESTION:` prefix (dedup'd, max 1/run).
- Task-created attention alert: when the inbox sweep actually creates a new Google Task, Brian gets one very brief Sendblue/text heads-up. This is separate from iMessage Handoff and does not require handoff to be active. If the sweep creates no task, it sends no text.
- Interactive Codex sessions use the same Kerri MG suggestion rail for build improvements, after checking current KerriOS relevance so Claude-era or retired-runner suggestions are not blindly carried forward. Full mechanics: [[../workflows/google-tasks-improvement-suggestions]].

## Bootstrap

`data/gtasks-lists.json` caches the three list IDs after first `gtasks_list_lists` call. Title-matched on first run.

## Retired

- The approval Google Doc (`1KQHfRJ4c0bueOwCXlh69Uiqn3Uzv7lRivT_RkJ-tst0`) — no longer read or written.
- Slack DM approvals — only used now for fail-closed error alerts.

## Resolved Setup Item

- 2026-05-26 audit confirmed `gtasks_list_lists`, `gtasks_list_tasks`, `gtasks_create_task`, and `gtasks_update_task` work from Codex. No current OAuth-scope action is open.

## Related

- [[2026-05-24-superhuman-sw-mailbox]] — S/W mailbox added same day
- [[2026-05-24-brain-architecture]] — brain architecture (same day)
