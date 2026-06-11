# Decision: info@hardwarefyi.com Joins the Inbox Sweep, Handled Autonomously

scope: decision · updated: 2026-06-10 · author: Brian + Kerri

## Decision

`info@hardwarefyi.com` is now a Kerri-handled mailbox, covered by the every-15-min inbox sweep, and its routine traffic is handled **autonomously** (auto-logged tier, no per-thread approval task).

Brian, interactive session 2026-06-10, after Benji granted Microsoft Graph access to the mailbox: "That's where we've got an outreach from and inbound, so you should be able to handle that autonomously moving forward."

## Connector

- New custom MS Graph MCP: `info-hardwarefyi-email` at `~/.kerri-chief/info-hardwarefyi-email-mcp/` (registered user-scope in Claude Code).
- Same Azure app registration as the kerri@/brian@ servers; mailbox access granted by Benji 2026-06-10, verified live same day (inbox read + folder list).
- Tools: search_email, read_email, read_thread, reply_email, send_email, create_draft, archive_email, mark_read, list_folders, attachments, create_event.
- **No auto-CC.** Unlike kerri@/brian@, `GRAPH_DEFAULT_CC` is intentionally empty (the server treats empty as "none"): outreach sent from info@ must not auto-CC Brian or Kerri, consistent with the standing rule that cold outreach stays out of Brian's daily view.
- Runs in `approved_external` mode like the other two; autonomous sends cite the standing authorization as `approvalSource`, so the gate mechanics are never bypassed.

## Autonomy scope (recorded in data/autonomy-policy.json → mailboxOverrides)

Auto-logged at info@: scheduling-logistics-reply, warm-thread-holding-reply, pipeline-nudge replies to mail received at info@, and cold-send sent from info@.

Still Brian's call, unchanged: sponsor-substantive-reply, renewal-draft, and everything on the `neverAuto` list (pricing, contracts, finance/spend, CRM mutations, permissions, S/W boundary). Any reply that would quote pricing or commit Brian's time or money falls back to an approval task.

Interpretation note: Brian's grant was broad ("handle that autonomously"). Kerri scoped it to routine traffic and kept commercial substance at the existing class tiers, because those tiers were set deliberately on 2026-06-09 and "never makes commitments without approval" is a standing hard rule. If Brian wants sponsor-substantive replies at info@ autonomous too, that is a one-line tier change he makes in autonomy-policy.json.

## Related

- [[2026-05-26-inbox-sweep-primary-automation]]
- [[2026-06-09-autonomy-boundary]]
- [[../workflows/hwfyi-daily-10-outreach-loop]]
