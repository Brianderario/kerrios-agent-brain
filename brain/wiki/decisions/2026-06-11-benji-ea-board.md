# 2026-06-11 — Benji EA board greenlit (benji@ joins the sweep, private by default)

**Decision (Brian, interactive Claude session 2026-06-11 ~08:45 ET):** Benji's EA board is greenlit. Wire benji@hardwarefyi.com into Kerri's 15-minute inbox sweep so Kerri acts as Benji's EA (triage, drafts, sends, missed-email flagging). Closes ⚙️ G-list task `V0lSX2g2emFjZ3BCQzFDNQ` (Benji's ask 6/11 ~02:57 ET on the "use you as my EA" thread).

## Terms Brian set

1. **Privacy by default.** Benji approves his own outbound; Brian does NOT see Benji's drafts or sends. No shared or Brian-visible board for Benji's queue.
2. **Brian-CC is opt-in only.** Kerri offered Benji the option of CC'ing brian@ on his outbound as a second check (mirroring Brian's own auto-CC safety net). Benji's call; default stays private.
3. **Per-email approval.** Nothing external sends from benji@ without Benji's ok on that specific email.

## Design (consistent with the no-new-surfaces rule)

- **Approval surface = Benji's own mailbox, not a board.** Google Tasks lists are account-bound (a list on Brian's account would put Benji's outbound in Brian's view, violating term 1). Instead: Kerri writes drafts directly into Benji's Outlook **Drafts folder** + sends a one-line heads-up; Benji hits send himself or replies `send` / `edit: <changes>` / `skip`.
- **Connector:** new Microsoft Graph MCP for benji@ on the same Azure app as kerri@/brian@/info@, onboarded via one device-code sign-in by Benji (identical flow to the info@ onboarding, [[2026-06-10-info-mailbox-autonomous]]). `GRAPH_DEFAULT_CC` **empty** (like info@): no auto-CC of Brian on benji@ traffic.
- **Step-by-step sent to Benji** 6/11 ~08:50 ET on the EA thread (job `INT-BENJI-EA-GREENLIGHT-20260611`): reply "ready" → Kerri generates the device code live → sign in as benji@ at microsoft.com/devicelogin → approve. Nothing else on his end.

## Implementation checklist (pending Benji's "ready")

- [ ] Run device-code OAuth with Benji live (code expires ~15 min; coordinate in real time)
- [ ] Build `benji-hardwarefyi-email` MCP (`~/.kerri-chief/`, empty default CC, approved_external mode)
- [ ] Wire benji@ into `agent-prompts/kerri-inbox-sweep/SKILL.md` as 6th mailbox + define his draft-to-Drafts approval loop (send-authority file: explicit reviewed commit, never auto-committed)
- [ ] Add `mailboxOverrides["benji@hardwarefyi.com"]` to `data/autonomy-policy.json`: external sends gated on Benji per-email ok; no Brian CC unless Benji opts in
- [ ] Verify live (inbox read, draft placement, send) before telling Benji he's covered

## Source

- Benji's ask: "use you as my EA" thread, kerri@ inbox, 2026-06-11 06:53–07:18Z
- Brian's greenlight + privacy/opt-in framing: interactive Claude session 2026-06-11 ~08:45 ET
- Related: [[2026-06-09-autonomy-boundary]] (P1 internal autopilot), [[2026-06-10-info-mailbox-autonomous]] (onboarding precedent)
