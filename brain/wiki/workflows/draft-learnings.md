# Draft Learnings — Kerri Email Sweep

Accumulated lessons from grading Kerri's email drafts against Brian's edits.
Each entry captures what changed, why it mattered, and the rule extracted.

Format:
```
## [DATE] Job [JOBID] — [Company]
**What changed:** ...
**Why:** ...
**Rule:** ...
```

---

<!-- Lessons will be appended here by the sweep automation -->

## [2026-05-27] EOD-H02 — Duro Labs

**What changed:** The original EOD draft treated Nehemoyia's meeting as a standalone post-call note: dinner went well, two strong dinners, broader content before each, send SF Tech Week details, check the Renaissance invoice, and regroup after Duro compares notes. Brian's sent email instead merged the Nehemoyia call, the prior Robert Woo sales call, and Duro's current partnership history. It addressed Nehemoyia, Shaun, and Robert; cc'd Benji; used the subject `Hardware FYI x Duro 2026`; named concrete surfaces (6-month Partner Program, custom content, dinner series, SF Tech Week); included a Drafter-style custom-content proof point with 10,000+ downloads/leads; suggested two content angles; and sequenced custom content first, always-on partner visibility throughout the year, and SF Tech Week as the broader event surface.

**Why:** This was not a generic "thanks for meeting" follow-up. It was a warm sponsor expansion note after Duro's Kinetic dinner, with Robert already asking for Hardware FYI product options and lead-generation fit. A useful draft had to synthesize the account thread and multiple meetings into a commercial recommendation. The weak draft lost buyer context, omitted Robert/Shaun, skipped proof points, and failed to turn Brian's thinking into a package recommendation.

**Rule:** For Hardware FYI sponsor/customer EOD follow-ups, run an **account-context merge** before drafting: current transcript + same-company meeting notes from the last 30 days + latest sent email/catalog + company/person pages. If the merged context shows budget/timing/product discussion, draft a concrete recommendation with product surfaces, proof point(s), proposed sequence, and the next decision. Do not ship a soft "compare notes and circle back" draft when the account is ready for a package recommendation.

## [2026-05-25] Job H0001 — Aris Machina sent-version comparison

**What changed:** Brian sent a version that kept Kerri's product-education frame and direct numbered answers, but made the prose more conversational and less like a formal memo. He removed the explicit package menu and did not quote fresh package pricing. He led with "best to discuss this all on a call" because the right mix depends on budget, target audience, and goals. He answered the three format questions directly, added a human terminology aside, used CoLab as the comparable sponsor with a private-performance caveat, then introduced custom content and happy-hour/SF-Tech-Week products as additional options.

**Why:** The buyer was not ready for a package proposal. William and Sid first needed to understand what the products actually look like. Brian's final send educates and steers toward a call without prematurely locking scope, price, guarantees, or the three-package menu. It preserves the consultative posture: answer the question, show proof, broaden the product set, then build the package live.

**Rule:** For warm sponsor threads where the buyer asks "what does this include?" and already has rough pricing, draft a **product-education reply**, not a proposal. Open with the call frame, answer their numbered questions in their order, include live examples, deconfuse terms plainly, use a comparable sponsor without revealing private performance, then introduce adjacent lead-gen products as "other products you may be interested in." Save package pricing and guarantees for the call or a later proposal unless Brian explicitly asks to include them.

**Template:** Use [[hwfyi-sponsor-reply-templates]] § Product-education reply after sponsor asks "what does this actually include?"

## [2026-05-25] Job H0001 — Aris Machina

**What changed:** Brian noted I should have his Calendly link in memory and inserted it himself in his guidance after my draft offered "a 15-min call" with no booking URL. Same link is referenced multiple times in [[../agents/kerri]] voice rules and recent log entries — it's already in the brain, I just didn't reach for it.

**Why:** When the close of a draft is a meeting offer, the natural next click is the calendar. Making Brian remind me to drop it in adds a manual step every send. The Calendly link is a fixed reflex, not a per-draft decision.

**Rule:** **Any draft that offers a call, demo, intro, or meeting MUST include Brian's Calendly link inline.** Standard URL: `https://calendly.com/brian-hardwarefyi/30min`. Phrasing for Brian-as-sender: "My calendar's here: <url>" or "Grab time here: <url>". Phrasing for Kerri-as-sender: "Here's Brian's calendar link: <url>" (locked phrasing per [[../../agent-prompts/kerri-skill/references/voice]]). Never offer a call without the URL.

## [2026-05-24] Voice-rewrite from sent-mail corpus — not a job-specific lesson, a baseline reset

**Sample:** 8 emails read from brian@hardwarefyi.com Sent folder, dates 2026-05-21 to 2026-05-23. Counterparts: Ian Slamen (Celedon — sponsor re-engagement), Sid Khullar (Aris Machina — webinar pricing), Brandon Bourn (Zenode — partnership re-engagement), Gigi Schadrack (Dirac — post-event + future events), Janine Khraishah (Flow — photo deliverable), David Tusick (Hellbender — routing to Benji), James Redd (Complement — scheduling fix), Nicole Latva (SendCutSend — post-event sponsor follow-up), Wendy Hom (Westin — vendor ack).

**What changed in voice.md:**

1. **Reversed:** "I hope you're doing well!" is NOT throat-clearing in Brian's actual usage. He uses it deliberately for warm re-engagement to dormant sponsors. Kept as a context-appropriate opener.
2. **Reversed:** "Don't apologize for follow-ups" softened. Brian apologizes when a real lapse occurred (e.g., "So sorry this got dropped"). Don't strip apologies that match reality.
3. **Reversed:** "I would be happy to..." flagged as servile in old voice.md. Brian uses "Happy to..." constantly as an offer phrase ("Happy to share details", "I'm happy to answer"). Reframed as a Brian staple, not butler tone.
4. **Refined:** Length is context-calibrated, not "3 sentences usually wins." Brian writes 4-word vendor acks AND 4-paragraph sponsor pitches. Added length-by-context table.
5. **Added:** Real sign-off discipline — `Brian` on its own line, no comma, no "Best," "Regards," "Cheers."
6. **Added:** Forward-looking close as a Brian signature move ("Looking forward to hearing your thoughts!", "Have a great weekend!").
7. **Added:** Routing pattern — when an inquiry isn't for him, Brian names the right teammate, says what they own, then pitches what he owns ("If you want this to be covered in the Kinetic newsletter, that would be Benji! I handle all of our sponsored options...").
8. **Added:** Colloquialisms he actually uses — "crushed his talk", "photo dump", "tapped in", "give or take". Don't sterilize.
9. **Added:** Specific-time-anchor habit — "1.5 weeks give or take", "next 2 weeks". Brian commits to ranges, not vague "soon."
10. **Added:** Numbers-in-pitch habit — "20,000 hardware engineering leaders every week across two newsletters." Always lead pitches with concrete reach numbers.

**Rule:** Voice extraction has to be grounded in actual sends. Prior voice.md was speculative — derived from generalized "good email" advice, not from Brian's behavior. The new voice.md is observational, with the source corpus cited and example emails quoted verbatim. Refresh this rewrite quarterly or when Brian flags more than 3 drafts in a row for tone reasons.

**Implication for sweeps:** Drafts that feel "too clean / too sterile / butler-toned" should be checked against this voice.md before sending. Especially: don't strip "I hope you're doing well" from re-engagement openers; don't strip "Happy to..." offer phrasing; don't replace `Brian` with `Best, Brian`.
