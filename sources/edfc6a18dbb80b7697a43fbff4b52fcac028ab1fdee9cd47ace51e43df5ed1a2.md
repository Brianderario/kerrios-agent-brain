---
name: feedback-no-double-send
description: "HARD rule — never double-send an external email; verify recipients before sending, fix gaps surgically"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c7a290d5-1b8f-4e3b-91cf-18fa0357ca58
---

**Never double-send an external email. It is a strict, non-negotiable rule.** (Brian, 2026-07-02, after I sent the Xometry vendor onboarding package twice.)

**What I did wrong:** On the Xometry onboarding reply, my explicit `cc` param to `reply_email` *replaced* the reply-all recipients instead of adding to them, so the first send dropped Antonella + Rachel. Instead of a surgical fix, I sent a second full copy reply-all — so Madison, Benji, and vendormanagement@ each received the identical package + attachments twice.

**Why it matters:** Double-sends look sloppy/unprofessional to external partners and can re-trigger workflows (re-processing, duplicate records). "No double-send" pairs with the [[feedback_interactive_send_clears_task]] / no-double-email gate.

**How to apply:**
- **Verify the recipient list BEFORE every external send.** With `reply_email`, remember `cc` is a *replacement*, not additive, and `approved_external` mode forces `replyAll=true` — so pass the COMPLETE intended cc list (original recipients + any additions) in one shot. Read back the To/cc in my head (or via a Sent-folder check on a prior message) before firing.
- **A delivery gap is NEVER fixed by re-sending to people who already got it.** If a send missed someone, forward to ONLY the missing party, or leave it and let the primary recipient loop them in. Do not reply-all a second copy.
- When unsure whether the first send was complete, check the Sent item's actual To/cc first, then decide the minimal corrective action.
