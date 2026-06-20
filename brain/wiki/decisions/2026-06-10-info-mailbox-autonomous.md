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

Auto-logged at info@: scheduling-logistics-reply, warm-thread-holding-reply, pipeline-nudge, and sponsor-substantive-reply received at info@, plus cold-send sent from info@. renewal-draft keeps its class tier (money implications, not addressed by the grant). The `neverAuto` list is unchanged: autonomous replies never quote pricing, packages, or terms.

## Amendment, same session (Brian, 2026-06-10 evening)

Brian confirmed the broader scope and added four binding rules: "Yes, and please loop Benji and me in if somebody reaches out. Put my calendar up if they're looking for sponsorship, and put Benji's calendar up if they're looking for content. Never guess and only act if you definitively know. Always flag to me if there's an issue."

1. **Loop-in:** every autonomous reply to real human inbound at info@ CCs brian@hardwarefyi.com + benji@hardwarefyi.com. Cold outreach from info@ still CCs nobody.
2. **Calendar routing** (originally Calendly, verified 2026-06-10; **updated 2026-06-20: Brian's side moved to Reclaim, Benji's stays Calendly**):
   - Sponsorship / advertising / partnership-commercial intent → Brian: `https://app.reclaim.ai/m/brian-derario/hardware-fyi-meeting` (Reclaim, Hardware FYI side, 30 min, Zoom; owner Brian D'Erario; replaced his retired Calendly link 2026-06-20)
   - Content / editorial / newsletter-feature intent → Benji: `https://calendly.com/hardwarefyi/30min` (owner verified **Benjamin Chia** — the brand-neutral slug books with Benji, so never offer it for sponsorship; his personal alternate is `calendly.com/chiajbenjamin/30min`)
3. **Never guess:** facts in autonomous replies must be definitively known (wiki, verified thread history, canonical docs). Ambiguous or mixed intent → no calendar, fall back to an approval task. Pricing questions → offer the call + correct calendar, never numbers.
4. **Always flag issues:** errors, ambiguity, boundary questions, surprises at info@ → flagged to Brian (task or text), never silently handled or dropped.

## Related

- [[2026-05-26-inbox-sweep-primary-automation]]
- [[2026-06-09-autonomy-boundary]]
- [[../workflows/hwfyi-daily-10-outreach-loop]]
