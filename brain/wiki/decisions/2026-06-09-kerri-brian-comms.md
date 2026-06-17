# 2026-06-09 — Kerri ↔ Brian communication channels

> **SUPERSEDED IN PART 2026-06-17 — the text interrupt lane is removed.** Brian stood up a separate Hermes agent to own the Sendblue text path and asked that Kerri stop texting him. As of 2026-06-17 Kerri sends NO texts: the Sendblue/iMessage interrupt lane below is retired for Kerri. Brian-attention now rides on the Console task itself plus email (the two-way backbone). The Sendblue adapter and credentials are retained only for Hermes. Everything else in this decision (email backbone, Slack retired, no-text for auto-logged sends) still holds. Kerri's routines were updated the same day to drop every send-text-alert.mjs call.

**Decided by:** Brian (interactive session, 2026-06-09 evening: "Perfect. Go with your recommendation.").
**Context:** Brian asked how he and Kerri should flow back and forth outside an interactive chat. He explicitly dislikes the Slack agent flow: the Slack connector authenticates AS Brian, so Kerri's DMs arrive self-sent and trigger no notification.

## The channel map

| Channel | Role |
|---|---|
| Google Tasks | **Approval book of record.** Every draft, every checkbox, every skip/redo. Unchanged. |
| Email (kerri@hardwarefyi.com ↔ brian@kerrihq.com) | **Two-way backbone.** Already works in both directions: the inbox sweep reads kerri@ every 15 minutes and treats internal senders (brian@, ari@, benji@, zach@) as trusted prompts, so Brian can email Kerri work from any device. Kerri's briefs and digests arrive here. |
| Sendblue text / iMessage | **RETIRED for Kerri 2026-06-17.** Kerri no longer texts Brian; the separate Hermes agent owns the Sendblue text path now. The former interrupt-lane role (new approval task, escalated item, blocker) is carried by the Console task itself plus, when faster eyes are needed, a short email. Adapter + credentials retained for Hermes only. |
| Slack | **Retired as the Kerri↔Brian personal channel** (self-sent DMs, no notifications). Stays only where a prompt explicitly requires supporting error detail. |

## Auto-logged send notices

Per `brain/wiki/decisions/2026-06-09-autonomy-boundary.md`: morning-brief `Auto-Logged Sends` section (`scripts/autonomy-report.mjs --auto-logged`) + the standard auto-CC to brian@hardwarefyi.com on every kerri@ send. Never texts.

## Where this is enforced

- `agent-prompts/kerri-skill/SKILL.md` (Identity → channel rules) and `references/email.md` (send rules).
- `agent-prompts/kerri-inbox-sweep/SKILL.md` (text-alert rules + AUTO-LOGGED SEND PATH).
- `agent-prompts/kerri-morning-brief/SKILL.md` (Auto-Logged Sends section + never-text rule).
- `data/autonomy-policy.json` `notifications` block.
