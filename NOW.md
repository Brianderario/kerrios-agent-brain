# NOW - live session baton

> Short current-state handoff only. Durable truth goes in `brain/wiki/`; running history goes in `brain/log.md`.
> Runner: Claude Code is the sole scheduled runner as of 2026-06-08. Codex is retired, but this entry records a Codex-runner gap-sweep check.

**Last touched:** 2026-06-11 ~01:48 ET (kerri-inbox-sweep, Claude scheduled - 2 autonomous internal replies to Benji: Protolabs/Renneke status + audience number, and KMG Console questions. Audience brain updated to 20,000+ across two newsletters. Gmail + Superhuman connectors still down. No external/customer sends.)

**Next action:** Brian review/sign the Westin Kinetic 2027 contract (attached in Gmail; $150K F&B min + rental; Benji handles CC link + wire). Then review current pending approvals in the live queue: G0008 Hilton Norfolk The Main (stale 15d), G0015 AeroXplorer, H0034 Jiga renewal, H0152 nTop renewal, H0028 Summit Interconnect, H0020 Westin St. Francis, H0018 BuzzWorks, H0119 C-Infinity.

## In flight
- 🖥️ KMG CONSOLE APPROVALS LIVE (6/11 ~01:25 ET): Brian's approval surface is now the production Console tasks board (kerrihq-rails on Render). Review flow shipped at 1e13991; clickability fix deployed at 3008612: the whole task card opens the full review page, approval cards no longer expose board-level APPROVE/SKIP buttons, and action decisions stay on the full-context page. Local kerri-console server (localhost:4180, launchd) runs a 120s two-way sync: mirrors the live H/S/G Google Tasks queue (full notes) into Console cards and executes Console decisions against the source task (applied_at stamped, no double-execution; sweep send-gate untouched). An approve in the web Console = real send next sweep. FYI: a pre-existing web SKIP on the H0026 record-card was applied (deliberate close, no send). Details: ~/Projects/kerri-console/README.md + brain/log.md.
- AllSpice June 23 dinner: main Luma `mav2sh1u` and DTW Luma `deep-wvnn` are live and approval-gated; watch RSVP queues. Perbacco contract signature/card guarantee remains critical path.
- S&W beehiiv ops: recommendations off, welcome email published, Zach notified. Brian must generate beehiiv API key (task `X1Z0RXlvNFd0cGtCNGJFZw`) before Kerri can build the scoped API/MCP path.
- QBO/Stripe/Mercury close: Ari asked for reconciled accrual entries for his decision, no QBO posting. Mercury API calls remain on hold due rate limit until Brian says go.
- Kickstarter inbound via Benji: Ali BenBen may book via Brian's Calendly; when booking lands, add benji@hardwarefyi.com to the calendar invite.
- Benji recurring Friday reminder live on brian@kerrihq.com; prune items as Benji confirms completion.
- EMI $20K renewal: Benji owes intro to Jason and Emily; renewal-watchdog task remains discussion-only.
- KMG Console: live localhost app at `http://localhost:4180` is the working spec for approvals. Use a real Chrome tab, not chat preview.
- Property-lineup change pending PR: Savant retired; KMG properties are Hardware FYI, Kinetic, Standard & Works. Candidate: `brain/candidates/2026-06-10-property-lineup-savant-retired.md`.
- ⚠️ CONNECTOR OUTAGE (ongoing since ~04:06Z / 12:06am ET 6/11): Gmail (brian@kerrihq) + Superhuman (brian@standardandworks) both returning net::ERR_FAILED on every read; inbox-sweep cursors frozen for both, no mail lost but those two mailboxes are uncovered until reconnected via claude.ai connector settings. The 3 Graph mailboxes (kerri@/brian@/info@ hardwarefyi) are healthy. Already texted ~04:38/04:46Z; re-alerts suppressed as one continuing outage.

## Decisions waiting on Brian
- Perbacco contract for June 23 dinner: review, sign, and card guarantee.
- S&W API key: generate in beehiiv or ask Zach for Owner if Admin cannot generate.
- QBO/Stripe close: Ari decides who posts reconciled entries and which period closes.
- Hardware FYI revenue audit loose ends: Kinetic ticket basis, Quilter cancelled-invoice mystery, Onshape duplicate, EV/Component AI past-due, Altium/PTC due dates, Zoo billing contact.
- PR/review backlog: redaction guard PR #6 and send-adjacent package playbook wiring.

## Last action
- 2026-06-11 ~01:48 ET Claude kerri-inbox-sweep - 2 autonomous internal replies to Benji (P1, all-internal): (a) Protolabs/Brent Renneke has not booked Brian's Calendly yet (ball in his court, tracker auto-escalates 48h); (b) recorded Benji's authoritative audience number 20,000+ across the two newsletters in brain (supersedes 17K/16K), flagged media-kit/pitch assets still stale; (c) confirmed KMG Console built on Claude Opus 4.8/4.7 + agreed beehiiv-API analytics follow-on, routed live walkthrough to Brian. Gmail + Superhuman still down (continuing outage, re-alert suppressed). No external/customer sends.
- 2026-06-11 ~01:25 ET Codex interactive - fixed the production KMG Console task-board click target: Rails commit 3008612 live on Render; local browser verified card-body click opens review page; local sync `POST /api/sync-now` returned ok with 20 mirrored / 0 decisions; full Rails suite 1177/0/1 pending. No external sends or task mutations.
- 2026-06-11 ~00:55 ET Codex kerri-gap-sweep - ran A-Q health sweep as Codex runner; checks green, Codex automation records paused, Claude shims present, revenue-goal sheet healthy. Recorded class-P stale approval G0008 (15d) and connector availability limits in Codex session; no high-severity text.
- 2026-06-11 ~03:15 ET Claude interactive - Zach starter-kit follow-up sent on-thread; ball with Zach.
- 2026-06-10 22:54 ET Claude kerri-inbox-sweep - Zach beehiiv admin grant handled; Brian API-key task created; no external sends.
