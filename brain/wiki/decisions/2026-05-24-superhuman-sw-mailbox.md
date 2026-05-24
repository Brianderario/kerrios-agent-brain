# Decision: brian@standardandworks.com via Superhuman MCP

scope: decision · updated: 2026-05-24

## Decision

Add `brian@standardandworks.com` as a verified alias on Brian's Superhuman account (MCP UUID `760b1f3b-fde4-493d-a586-7b3da09fcbe9`). Wire it as the **fourth mailbox** in the Kerri inbox sweep.

## Why

S/W partnership work was being done outside the sweep. Bringing the mailbox in gives Kerri the same drafting + approval flow for S-prefix work — but the boundary rules tighten what content is retained.

## Mechanics

- Search: `list_threads({ to: ["brian@standardandworks.com"], start_date: <lookback>, labels: ["INBOX"] })`.
- Read: `get_thread({ thread_id })` for the latest message body + message ID.
- Send: `create_or_update_draft({ type: "reply", thread_id, message_id, from: "brian@standardandworks.com", body: <HTML> })` then `send_draft({ draft_id })`.
- Identity: always Brian (never Kerri's HWFYI address).
- **No auto-CC to HWFYI** (boundary).

## Routing rule

ANY email received at brian@standardandworks.com → **S-prefix**, regardless of sender. Goes into the "Standard & Works" Google Tasks list.

## Boundary enforcement (S/W)

- After a successful S-send, scrub `originalDraft` from `jobs.json` (replace with `"<sent — body retained in Superhuman thread>"`).
- S-prefix sweep learnings → `brain/.local/s-learnings.md` (gitignored, never enters shared repo).
- For threads containing S/W INTERNAL content (financials, staff comp, vendor invoices, S/W content drafts): create the task so Brian sees it, but use minimal CONTEXT ("S/W internal — see thread"). Do NOT copy body into jobs.json or wiki.

## Related

- [[standard-and-works]] — the entity
- [[zach-silber]] — counterpart
- [[2026-05-24-google-tasks-approval]] — approval flow for these jobs
