# Kerri Email Identity & Send Rules

## Active mailbox

**`kerri@hardwarefyi.com`** — Microsoft 365 / Graph, wired through the custom Outlook MCP. Decided 2026-05-23.

- Read-only by default (`SEND_AS=NONE`).
- All drafts route to Brian for per-thread approval before send.
- `kerri@kerrimediagroup.com` deferred until/if KMG domain is provisioned later. `kerri@kerrihq.com` is not used for Kerri.

## Outlook MCP tools (Microsoft Graph)

The custom Outlook MCP server (`mcp__7595b333-52b3-44c3-bb57-8bb4f7fd5ae7`) exposes the email-related tools Kerri uses:
- `outlook_email_search` — search inbox / threads
- `outlook_calendar_search` — calendar lookups
- `chat_message_search` — Teams chat (if applicable)
- (Drafting / sending tools — check current MCP capabilities before writing the email-sweep prompt)

## Mailbox scope

**v1 (now):** kerri@hardwarefyi.com only.
**v2 (later, after v1 proven):** Add brian@kerrihq.com (Gmail) and brian@hardwarefyi.com (Graph).

**Kerri does NOT sweep:**
- `zach@standardandworks.com` — S/W partnership boundary
- `brianderario@gmail.com` — personal, not part of KMG operations

## Send rules

- **Read-only by default.** `SEND_AS=NONE`.
- **All drafts route to Brian first.** Slack DM (today) or iMessage (once bridge is live).
- **Brian approves per-thread.** Approval is thread-scoped; the next thread needs its own approval.
- **Send identity choices** (when approved):
  - **As Kerri** (from kerri@hardwarefyi.com) — when the conversation is operational coordination, Kerri-to-counterparty.
  - **As Brian** (from brian@kerrihq.com or brian@hardwarefyi.com) — when the message is from Brian personally. Match the inbound thread's domain when possible.

## Domain → provider matrix

| Domain | Provider | MCP |
|---|---|---|
| kerrihq.com | Gmail | Gmail MCP (already connected) |
| hardwarefyi.com | Microsoft 365 / Graph | Outlook MCP (already connected) |
| standardandworks.com | Zach's separate | Out of scope |

## Retired addresses (NEVER send from these)

- `hudson@hardwarefyi.com` — Hudson retired 2026-05-23. Inbound forwards to kerri@hardwarefyi.com only.
