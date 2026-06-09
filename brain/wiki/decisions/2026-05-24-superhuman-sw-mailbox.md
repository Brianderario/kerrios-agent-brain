# Decision: brian@standardandworks.com via Superhuman MCP

scope: decision · updated: 2026-06-09

## Decision

Wire `brian@standardandworks.com` (Brian's S/W primary Superhuman account, MCP UUID `52549600-ff50-4fab-9014-a0e476bfe09a`) as the **fourth mailbox** in the Kerri inbox sweep.

Verified 2026-05-24 by calling `query_email_and_calendar` on the MCP — it reported brian@standardandworks.com as the primary account address.

The previously-installed `superhuman-mail` connector (HTTP at `https://mcp.mail.superhuman.com/mcp`, unauthenticated placeholder) was redundant and was removed from the Claude config on the same day.

## Why

S/W partnership work was being done outside the sweep. Bringing the mailbox in gives Kerri the same drafting + approval flow for S-prefix work — but the boundary rules tighten what content is retained.

## Mechanics

- Search: `list_threads({ to: ["brian@standardandworks.com"], start_date: <lookback>, labels: ["INBOX"] })`.
- Read: `get_thread({ thread_id })` for the latest message body + message ID.
- Send: `create_or_update_draft({ type: "reply", thread_id, message_id, body: <HTML> })` then `send_draft({ draft_id })`. The MCP is connected as brian@standardandworks.com — the `from` field can be omitted (it'll default to that account).
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
