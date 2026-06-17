# Definition-of-Done Gate (pre-send / pre-deliverable)

scope: workflow · created: 2026-06-17 · author: Kerri · status: canonical

The single pre-flight gate Kerri runs before any external send or any "I handled it" claim. Born from the 2026-06-17 weekly retro ([[../improvements/2026-06-17-self-improve]]), which found that ~25% of net-new asks in the 6/10 to 6/17 week opened with a correction, and that nearly all of those corrections were **one root cause in different costumes**: producing a *holding* output instead of the *finished* deliverable, and acting before reading the state that already existed.

This page consolidates five separately-codified rules into one checklist so the behavior is a single gate, not five things to remember. The five component rules still hold and keep their detail; this is the umbrella that makes them one motion.

## The gate (run every time, in order)

Before drafting or sending anything Kerri composes (everything except Brian's verbatim words):

1. **READ THE FULL STATE FIRST.** Read the entire thread and Brian's last message on it. Then check `NOW.md` and grep `brain/log.md` for the topic (subject, company, event, jobId). The message must reflect what is already done or in flight. An answer that contradicts the brain log is a failing run. (Component: brain-log check, Brian rule 2026-06-11. Origin: the 6/11 Deep Tech Week miss.)

2. **NAME THE REAL DELIVERABLE, not the nearest reply.** Ask: what does this thread actually need? A package with prices, a contract, a metrics report, a customer-overlap list, an attendee roster? The deliverable is the thing, not an email that promises the thing. "Reply" is rarely the deliverable. (Component: follow-ups must be complete, Brian rule 2026-06-17. Origin: Protolabs H0106, Kickstarter H0154, C-Infinity H0119, and the Xometry "why didn't you propose actual packages" escalation.)

3. **RESEARCH AND INVENTORY before drafting.** For post-call follow-ups this is mandatory: read [[post-call-followup-protocol]] first, then pull the Granola transcript, the thread, the relevant wiki pages (audience, pricing, playbook), Drive, and local files. Inventory every promised deliverable. Never ask Brian what was discussed. (Component: post-call research first, Brian rule 2026-06-17.)

4. **ATTACH WHAT WE ALREADY HOLD.** If the message promises a deliverable that exists as a local file (media kit, one-pager, report, deck), attach it now via `job.routing.attachments` and word it "I have attached ...", never "I will send ...". Canonical media kit: `~/Projects/hwfyi-media-kit-2026/Hardware FYI Media Kit 2026.pdf`. (Component: attach what you have, Brian rule 2026-06-16.)

5. **COMPLETENESS TEST.** Does this give the recipient everything they need to act, in one message? If yes, send. If something is genuinely missing and Kerri cannot produce it, do NOT send a partial. Go to step 6.

6. **IF BLOCKED, ESCALATE, NEVER PARK.** When the deliverable can't be finished because of a missing access, capability, or input Kerri can't produce, email Brian the four-part request (the task, who it's for, the exact thing needed, what it unblocks) and tie the parked work to that escalation. A silent IOU only Kerri can see is not autonomy. In an interactive session, the blocked thing is often doable directly via Chrome takeover. (Component: escalate on block, Brian rule 2026-06-10.)

7. **RESTATE BEFORE SEND (new, from the 6/17 retro).** On anything non-trivial, lead the approval card / chat with one line: `Deliverable: <X>. Pulled from: <thread + Granola + media kit + ...>. Attached: <Y>.` This lets Brian catch a thin-context draft in five seconds instead of after it ships, and it closes the status-opacity gap the retro identified (the deep-tech-week omission, the Kinetic reshare, "are you actually working on this?").

## Why one gate instead of five rules

The retro's core finding: Brian kept giving the *same class* of correction in different threads, and each correction was being codified as its own new rule. Left unchecked, that produces rule #19 next week and the same miss the week after. Folding them into one ordered pre-flight means Kerri runs the whole motion every time, rather than remembering whichever fragment happens to be top of mind. If a new correction in this class appears, extend this gate rather than minting a parallel rule.

## Component rules (the detail lives here)

- [[draft-learnings]] — accumulated Brian-edit lessons (consult before drafting)
- [[post-call-followup-protocol]] — mandatory pre-draft research + asset inventory + completeness test
- [[hwfyi-package-quote-playbook]] — when the deliverable includes package pricing
- Memory layer: `feedback_definition_of_done_gate.md` is the interactive-session mirror of this gate; it cross-links the five component feedback memories.

## Where this is enforced

- **Interactive Kerri:** the consolidated `definition-of-done-gate` memory auto-loads each session.
- **Inbox sweep (scheduled):** P8 (brain-log check) + DRAFTING steps 1 and 6 in `agent-prompts/kerri-inbox-sweep/SKILL.md` already encode the components; the DRAFTING section references this gate as the umbrella.
- **kerri-skill:** the operating-rules section references this gate.

Send-authority files (`agent-prompts/kerri-skill/SKILL.md`, `agent-prompts/kerri-inbox-sweep/SKILL.md`) only change via an explicit reviewed commit, never an auto-push.
