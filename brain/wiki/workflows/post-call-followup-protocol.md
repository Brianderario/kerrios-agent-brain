# Post-Call Follow-Up Protocol

scope: workflow · updated: 2026-06-17 · source: Brian flagged H0106 Protolabs, H0154 Kickstarter, H0119 C-Infinity (2026-06-17) for incomplete/empty follow-ups

**MANDATORY read before drafting ANY post-call or post-meeting follow-up email.** This protocol exists because Kerri repeatedly produced "I'll send details" placeholder emails when all the information was already available through existing tools. The follow-up IS the delivery. An empty follow-up creates work for Brian and makes KMG look unprepared.

## What went wrong (the pattern)

Kerri's default behavior on post-call follow-ups was:
1. Skip reading the call transcript
2. Skip inventorying available assets (Drive files, local attachments, brain wiki data)
3. Ask Brian what was discussed instead of using Granola
4. Draft a "great chatting, I'll send info soon" acknowledgment email
5. Leave Brian to produce and send the actual content himself

The final sent versions (after Brian's corrections) contained: metrics reports, audience data, packages with pricing, customer overlap lists, attendee lists, media kits, and engagement metrics. All of this was accessible before the first draft was ever written.

## Phase 1: Research (before writing a single word)

Do ALL of the following before opening a draft:

1. **Pull the Granola transcript.** Use `list_meetings` to find the call, then `get_meeting_transcript` for the full verbatim text. If Granola doesn't have it, check for meeting notes in the brain (`wiki/meetings/`). Never ask Brian what was discussed.

2. **Read the full email thread** (if one exists). Use the email search/read tools across all relevant mailboxes (brian@, kerri@, info@). The thread has context the transcript may not (prior pricing, past campaigns, existing relationship history).

3. **Read the brain wiki** for all relevant context:
   - Company/contact: Savant CRM API (`GET /api/v1/companies?domain=...`)
   - Audience data: `wiki/properties/hardware-fyi-audience.md`
   - Package playbook: `wiki/workflows/hwfyi-package-quote-playbook.md`
   - Product list + pricing: `wiki/properties/hardware-fyi.md`
   - Event details: `wiki/events/` (Kinetic, SF Tech Week, etc.)
   - Prior draft learnings: `wiki/workflows/draft-learnings.md`

4. **Search Drive** for referenced documents: metrics reports, media kits, rate cards, campaign reports. Use the Google Drive MCP tools.

5. **Check local files** for attachments: `data/attachments/`, `~/Projects/hwfyi-media-kit-2026/`, `~/Downloads/` for recently shared files.

6. **Check the ad calendar** (Savant Newsletter Inventory) if the email will reference or promise placement dates.

## Phase 2: Promise inventory

From the transcript, make an explicit list of everything Brian said he would send. For each item:

| Promised | Have it? | Source | Action |
|---|---|---|---|
| Metrics report | Yes/No | Drive doc / local PDF / ... | Attach or link |
| Package options | Yes/No | Playbook + pricing | Draft in body |
| Attendee list | Yes/No | Local file | Attach |
| Media kit | Yes/No | Local PDF | Attach |
| Audience breakdown | Yes/No | Brain wiki | Draft in body |
| ... | ... | ... | ... |

**If anything is genuinely unavailable** (a file only Brian has, a decision he hasn't made, a number he hasn't confirmed):
- Do NOT draft a partial follow-up
- Email Brian requesting exactly what's needed: "I need [X] to complete the [Company] follow-up. Once I have it I'll send the complete email."
- Wait for Brian to provide it, then draft the complete email

**If you think you're missing something, check your tools first.** The pattern that created this protocol was Kerri believing information was unavailable when it was sitting in Drive, the brain, or local files.

## Phase 3: Draft

1. Follow [[hwfyi-package-quote-playbook]] if the email includes package pricing
2. Follow the post-call send rule: from Brian (`brian@hardwarefyi.com`), signed `Brian`
3. Include ALL deliverables: in the body (data, packages, links) or as attachments (PDFs, spreadsheets, reports)
4. Structure for the recipient's next step: they need to take this to their team and make a decision. Give them everything they need to do that in one email.
5. Include a live issue link so they can see where placements sit
6. Close per the playbook: "Let me know if I can answer any other questions" (no Calendly unless the ask is a meeting)

## Phase 4: Completeness test (every draft, no exceptions)

Before presenting the draft to Brian:

- [ ] Does this email contain everything promised on the call?
- [ ] Are all attachments present and accounted for?
- [ ] Would Brian need to do ANY follow-up work after this sends?
- [ ] Can the recipient make a decision or take next steps from this email alone?
- [ ] Did I use my tools (Granola, Drive, brain, local files) to research, or did I ask Brian?

If any answer is wrong, the draft is not ready. Go back to Phase 1.

## Related

- [[hwfyi-package-quote-playbook]] -- package construction rules
- [[draft-learnings]] -- H0106/H0154/H0119 entries
- [[../properties/hardware-fyi-audience]] -- audience data for sponsor emails
- [[../properties/hardware-fyi]] -- products + pricing
- Memory: [[feedback-followups-complete]], [[feedback-post-call-followups]], [[feedback-attach-what-you-have]]
