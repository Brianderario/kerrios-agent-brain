# HWFYI Sales-Writing Playbook

scope: workflow · created: 2026-06-18 · author: Kerri (build-loop deep-craft pass) · status: canonical-candidate (opener template change to cold-outreach is PROPOSED, awaiting Brian)

The master craft reference for every Hardware FYI sales message Kerri drafts: cold first-touches, follow-ups, reply handling, price objections, and post-call package quotes. Built from a research pass over the modern outbound canon (Lavender/Gong/Salesloft reply data; Josh Braun, Becc Holland, Kyle Coleman, Sam Nelson, Jason Bay, Aaron Ross), the persuasion + value-pricing canon (Cialdini, Chris Voss, The Challenger Sale, Blair Enns), and the sentence-level copy canon (Joanna Wiebe, Eddie Shleyner, Ann Handley, April Dunford, David Ogilvy).

This page is the HOW (the craft). It does not override Brian's hard rules; it operationalizes the craft inside them. The WHAT (which packages, which prices, which audience claims) lives in:
- [[hwfyi-package-quote-playbook]] — the package shape, discount ladder, never-negotiate-price rule.
- [[../properties/hardware-fyi]] / [[../properties/hardware-fyi-audience]] — real product list, pricing, audience data + tier caveats.
- `agent-prompts/kerri-skill/references/voice.md` — Brian's voice (apply every rule).
- [[draft-learnings]] — accumulated Brian-edit lessons.
- [[definition-of-done-gate]] — the pre-send gate that wraps all of this.

Drafting routines that should load this: [[../../agent-prompts/kerri-cold-outreach]] (cold first-touch + follow-up), [[../../agent-prompts/kerri-pipeline-followup]] (warm nudges + reply handling), [[../../agent-prompts/kerri-lead-research]] (hook + relevance craft, Part A3), [[../../agent-prompts/kerri-renewal-watchdog]] (renewal outreach). The inbox-sweep DRAFTING section (replies + package quotes) should reference it too, but that is a send-authority file → proposed, not auto-edited. (kerri-cold-outreach, kerri-pipeline-followup, and kerri-renewal-watchdog are wired as of 2026-06-18. kerri-lead-research finds leads but does not draft emails, so it is not wired; cold-outreach applies Part A3's relevance lens to the hooks lead-research selects. The inbox-sweep DRAFTING pointer is the only remaining send-authority proposal, see the run report.)

## The stance everything is built on (cross-links, not duplicated)

- **Value-first, never display.** We sell deliberate access to a unique, hard-to-reach engineering audience, never impressions. Every line shows the specific value to THAT buyer. [[feedback_sales_value_first]]
- **First-touch = audience fit, not product.** The opener leads with "our readers are your buyers / your hires," not a product pitch. Product-to-goal mapping is for the post-call quote. [[feedback_first_touch_audience_fit]]
- **Never negotiate price.** Reframe to ROI against their stated goal; reshape the package to fit budget; never defend or itemize a number. [[feedback_no_price_negotiation]]
- **Brian's external title is "leads partnerships at Hardware FYI."** Never owner/founder/CEO externally. [[feedback_brian_external_title]]
- **Sign-off matches the sending mailbox.** Kerri-sent → "Kerri"; Brian-sent → "Brian." [[feedback_sender_signature_match]]
- **No em dashes. No AI-writing tells.** Enforced by the pre-send lint gate. [[feedback_no_emdashes]] [[feedback_no_ai_tells]]

---

## PART A — THE COLD FIRST-TOUCH (and follow-ups)

### A1. The structure (the upgrade)

The old cold template opened about us ("I'm Kerri, I work on partnerships at Hardware FYI. We're a media company..."). The reply data is blunt: opening about yourself is the number-one reply-killer, and "I'd love to have a conversation" is the number-three. Leading with our identity also buries the one thing the buyer cares about, which is themselves.

The fix keeps everything Brian values (honest identification, the real audience proof, a warm 1:1 tone, no footer) and only changes the ORDER and the ask. Open on their world, identify in one tight line, tie our audience to their goal, ask for interest not time.

The four-beat cold first-touch:
1. **Their world (1 line).** A specific, true observation about them or their situation. This earns the second line.
2. **Who we are (1 line, compressed).** "I lead partnerships at Hardware FYI, the newsletter 19,000+ hardware engineers and engineering leaders read each week." Identity and proof in one breath, after the hook, not before it.
3. **The fit (1 line).** Tie our audience to their specific goal (their buyers, or their hires). One sentence, concrete.
4. **One low-friction ask (1 line).** An interest CTA or a value offer, never "I'd love a conversation" and never a meeting time on a cold first touch.

Total: 4-5 short sentences, under ~75 words, then `Best,` / sign-off. Same as today's length rule, sharper order.

### A2. Opener patterns (pick one; the first line must earn the second)

- **Trigger premise (Becc Holland):** anchor to a real event, then its implication. "You're hiring four field-application engineers in Austin. Usually that means a product line that needs design-engineer mindshare fast."
- **Poke the bear (Josh Braun):** a neutral question that makes them question the status quo, never a leading pitch. "How are you reaching the engineers who actually spec your part today, outside of search and trade shows?"
- **Activity-based (Gong/30MPC):** reference something they DID (a launch, a post, a talk). Highest-performing personalization for Director+ buyers. "Saw the dev kit you shipped in March."
- **Quiet-coverage gap (Kyle Coleman):** "Your competitor is all over the embedded-systems press and you are quiet there. Deliberate, or just not the focus yet?"
- **Hidden-cost open (Braun, status-quo disruption):** "Most semiconductor marketers reach buyers on LinkedIn but never the engineers who pick the part."

Never open with "I came across your profile," "I noticed you," "I'd love to connect," or "Hope this finds you well." Dead signals (already banned in cold-outreach STEP 4).

### A3. Relevance that scales (Becc Holland, Kyle Coleman)

True 1:1 research does not scale; relevance does. Write one strong email per SEGMENT, then drop in one specific token. Four relevance levers, in order of power:
1. **Trigger** (best): hiring, funding, launch, press, conference, a role change in the last 60 days.
2. **Technographic:** their stack, their category, what they build.
3. **Firmographic:** semiconductor vs robotics vs industrial software.
4. **Demographic:** CTO vs demand-gen lead vs head of talent.

The move is always **observation → implication → ask**. Observation: "You launched a dev kit in March." Implication: "Dev-kit adoption lives or dies on whether design engineers ever hear about it." Ask: "Worth seeing who in our reader base is already in that buying seat?" State the implication as THEIR stake, not as a lesson (a teaching/informative tone cuts replies ~26% in Lavender's data).

### A4. The one CTA (Gong data; Braun's one-goal rule)

One ask per email, always. Hierarchy, best to worst:
- **Value offer (strongest):** give something, do not take a meeting. "Want the breakdown of which five robotics vendors our readers engaged with most last quarter?"
- **Interest-based (2x the reply rate of a specific time ask):** "Worth a look?" / "Open to seeing if our readers match your target accounts?"
- **Time-based (weakest on a first touch):** avoid "Do you have 15 minutes Thursday?" until they have shown interest.

Aaron Ross's fallback when you may have the wrong person: "If audience fit is not your call, who owns it?" Never stack two asks.

### A5. Length, format, mobile (Lavender; 30MPC)

- **25-50 words is the target, ~75 the hard cap.** Under 75 words gets ~83% more replies.
- **Reading grade 3-5.** Short Anglo-Saxon words, one idea per sentence. (Grade 8+ tanks replies.)
- **Write for the phone, with real whitespace (Brian, 2026-06-18 — hard rule).** Put a BLANK LINE between every beat so the email is scannable in one glance: greeting, then the hook, then who-we-are plus the fit, then the one CTA, then the sign-off, each its own short paragraph. Never run the beats together as one block. In particular, the "I work on partnerships" identity line is its own paragraph, spaced from the opener. Bunched, wall-of-text drafts are a fail even when the words are good.

### A6. Subject lines (Lavender; Salesloft)

For a serious engineering buyer, boring beats clever. Rules: ~2 words, Title Case, neutral internal-memo tone. Avoid questions (-56% opens), numbers (-46%), punctuation (-36%), first names (-12% replies), emojis. Strong: `Reader Overlap` · `Audience Fit` · `Engineering Reach` · `Sponsorship Question` · `Q3 Lineup` · `Design Engineers` · `Recruiting Reach` (for manufacturers). The current `Hardware FYI x <Company>` default is acceptable and on-brand; the two-word noun phrases above test better and are the upgrade to A/B.

### A7. Follow-up cadence (Sam Nelson Agoge; Lavender)

Plan ~4-5 touches; closing a first meeting averages 4-5. Every follow-up must ADD one new thing: a different reader-segment angle, a fresh proof point, a relevant content asset, or a new trigger. Never "just checking in," "circling back," or "bumping this." The clean takeaway/breakup reliably reopens dead threads: "Assuming reaching our engineering readers is not a priority this quarter, I will close this out. If that changes, reply and I will send the audience breakdown."

### A8. The eight reply-killers (each with the fix)

1. Opening about us → open on their world; identity goes in line two.
2. Pitching the product (cuts replies up to 57%) → lead with their problem; we are the bridge.
3. "Happy to / I'd love to" tone → low-pressure pull ("might not be a fit, but...").
4. Two or more CTAs → one ask.
5. Question or first-name subject line → two-word neutral noun phrase.
6. Teaching/informative tone (-26%) → frame the insight as their stake.
7. Over 75 words / grade-8 prose → cut to 50 words, grade 5.
8. Generic "engineers are hard to reach" with no specific token → one concrete relevance signal.

---

## PART B — THE PERSUASION + VALUE ENGINE (replies, quotes, objections)

### B1. Cialdini moves → sentence-level (unity is the accelerator)

- **Unity** (speak as one of their tribe): "You are building for the same engineers who already read us every week."
- **Authority** (reduce perceived risk): "The people specifying your category open us before they open their own dashboards."
- **Reciprocity** (give first): "I pulled three reader segments that map to your buyer and put them below, yours to keep either way."
- **Scarcity** (frame as loss, and only when true): "We hold one anchor partner per category each quarter." Use only if it is factually true; no invented scarcity.

### B2. Chris Voss moves (Never Split the Difference)

- **Accusation audit** (defuse the objection before they say it): "You are probably reading this thinking a newsletter cannot move enterprise pipeline."
- **Label** (name the emotion, then go quiet): "It sounds like the number feels high against what you have spent on display before."
- **Calibrated how/what question** (hand them the math): "What would one new design win at your account size be worth against this?"
- **No-oriented question** (lower the stakes; "no" makes people feel safe): "Is reaching this audience off the table for this quarter?"
- **Aim for "that's right," not "you're right."** "You're right" means they want you to stop talking.

### B3. The value conversation (Blair Enns; cost-of-inaction)

Anchor on the buyer's desired outcome and the cost of inaction before any number appears. Diagnose first: "What does winning this audience this year actually do for your pipeline?" Then make the status quo expensive: 40-60% of B2B deals are lost to "do nothing," so the real competitor is delay, not another vendor. Price the client and the outcome, never the work or the line items.

### B4. The Challenger reframe

Teach them something about their own problem, then tailor it to them: "The usual read is you need more impressions. The real gap is that the engineers who pick your category never see you in a context they trust." Lead the reframe with insight, not with our product.

### B5. Objection handling, especially price

Never defend, justify, or itemize the price, and never preemptively discount (this is the existing hard rule, [[feedback_no_price_negotiation]]). The sequence: accusation audit → label → calibrated question that converts price into value → reshape if needed.
- "I would rather reshape this to fit your budget than hand you a thinner version of the wrong thing. What is the ceiling you are working inside?" (reshape, not discount, Enns + Voss)
- Reshaping the package (different bundle, shorter term, smaller scope) changes the value delivered and is fine. Haggling on the same package is not.

---

## PART C — THE POST-CALL QUOTE / PROPOSAL

The package SHAPE, the discount ladder, the concrete content titles, and the Calendly rule are all in [[hwfyi-package-quote-playbook]]. Use it for the body. This section adds the NARRATIVE and the option psychology that wrap it.

### C1. The narrative arc

Their world → the gap and its cost → the bridge → the options → a low-friction next step.
- Open in their world (Challenger tailor): "You are trying to reach hardware and semiconductor engineers who ignore most ads."
- Name the gap and its cost: "Right now they do not meet you where they already pay attention, and that quiet costs you pipeline every month."
- Bridge to the audience, not the product (value-first).
- Present the packages (per [[hwfyi-package-quote-playbook]]).
- Close on one small step. When the ask is "review and reply," close with "Let me know if I can answer any other questions!" and no Calendly (per the quote playbook's Calendly rule).

### C2. Presenting tiered options (Enns)

Three options changes the buyer's question from "Is this good value?" to "Which is the best value?", and the brain cannot answer the first without answering the second. Anchor high to low with the deepening discount ladder (top tier is priciest AND deepest discount, per the quote playbook). Recommend by naming, not arguing: "Most partners with your goal land on the middle option." Let them self-select the value level.

### C3. ROI / value framing language (in the buyer's terms, never display metrics)

- "One specified design win inside our reader base pays for the full year of this partnership."
- "Every quarter you wait is a quarter your competitor owns the inbox the buying committee already trusts."
Tie the cost of delay to a priority the buyer already named on the call.

---

## PART D — SENTENCE-LEVEL CRAFT (applies to every message above)

- **Hook craft (Shleyner):** the only job of sentence one is to make them read sentence two. Lead on a hard fact, a contradiction, or a pointed question. Would the line still pull if it ran alone (Ogilvy)?
- **One idea (Shleyner; Dunford):** decide the single point before writing; every sentence advances it or gets cut.
- **Specificity + the "so what / prove it" test (Wiebe; Ogilvy):** replace adjectives with facts. "Trusted by leading teams" fails "prove it." "The firmware team at [named company] runs every board through it before tape-out" passes. The more concrete facts, the more you sell.
- **Rhythm (Handley):** vary sentence length on purpose. Long, long, short verdict line. The short one is the hammer. Read it aloud; cut where you stumble; delete hedges (just, really, very, I think, we believe, potentially).
- **Message hierarchy (Wiebe):** lead with what the reader cares about. For a busy CTO, the consequence goes first, the mechanism second.
- **Words to cut:** leverage, unlock, robust, seamless, synergy, best-in-class, cutting-edge, solutions, "it's important to note," and the AI-tell negation formula ("not just X, but Y" / "no longer X, it's Y"). Start at the point; cut the windup.

---

## THE 10-POINT PRE-SEND SALES RUBRIC

Run this on every sales draft (the drafter writes to it; a critic pass checks against it). A draft ships only when all ten pass.

1. **Opens on THEM.** First sentence is about the buyer's world, not about us. (A1, A8.1)
2. **One specific, true relevance token.** A real trigger/technographic/firmographic signal, not "engineers are hard to reach." No invented facts. (A3)
3. **Audience-fit, not product, on a first touch.** ([[feedback_first_touch_audience_fit]])
4. **Exactly one CTA**, interest- or value-based on a cold touch (not a time ask). (A4)
5. **Length, grade, and SPACING:** under ~75 words on a cold touch, reading grade 3-5, and laid out for a phone with a blank line between each beat (greeting / hook / identity + fit / CTA / sign-off), each its own short paragraph, never one bunched block. (A5)
6. **Subject** is a short neutral noun phrase, Title Case, no question/number/emoji/first name. (A6)
7. **Value framed in the buyer's terms,** never display metrics; price (if any) is downstream of value. (B3, C3, [[feedback_sales_value_first]])
8. **Price objections reframed, never defended/itemized/pre-discounted.** (B5, [[feedback_no_price_negotiation]])
9. **No em dashes; no AI-writing tells** (especially the negation formula, rule-of-three, hype adjectives, Wikipedia voice, setup-payoff). ([[feedback_no_emdashes]], [[feedback_no_ai_tells]])
10. **Sign-off matches sender; Brian's external title is "leads partnerships."** ([[feedback_sender_signature_match]], [[feedback_brian_external_title]])

---

## WORKED BEFORE / AFTER

### Cold first-touch (illustrative prospect: a robotics company hiring engineers)

BEFORE (current cold-outreach STEP 4 template):
> Subject: Hardware FYI x Acme Robotics
>
> Jane,
> I'm Kerri, and I work on partnerships at Hardware FYI. We're a media company with a newsletter covering hardware manufacturing, read by over 19,000 hardware engineering leaders and decision makers. Acme Robotics seems like a strong fit because you build hardware. If this is interesting, I'd love to have a conversation about partnering together. Happy to answer any questions.
> Best,
> Kerri

Fails rubric 1 (opens about us), 4 (soft "conversation" ask), 2 (generic fit), 3 (no real token).

AFTER (this playbook) — note the blank line between every beat:
> Subject: Recruiting Reach
>
> Jane,
>
> You are hiring four robotics engineers in Boston right now. That usually means a product push that needs senior engineering mindshare fast.
>
> I work on partnerships at Hardware FYI, the newsletter 19,000+ hardware engineers and engineering leaders read every week. That audience is the exact talent pool those roles compete for.
>
> Want the breakdown of how other robotics teams have used us to put their employer brand in front of those engineers?
>
> Best,
> Kerri

Passes all ten. Opens on their hiring trigger, identity in its own line-two paragraph (spaced from the opener), audience tied to their goal (hiring), one value-offer CTA, ~70 words, a blank line between each beat so it scans on a phone, neutral two-word subject, no em dashes, no AI tells, sign-off matches sender.

### Price-objection reply

BEFORE: "Our $20K package is priced fairly given everything included: 6 placements, a custom article, and a 3-month partner term. I can do $17K if that helps."
(Defends the price, itemizes, pre-discounts. Three hard-rule violations.)

AFTER: "It sounds like $20K feels high against what you have spent on display before. Fair. What would one specified design win at your account size be worth against it? If the goal is qualified conversations with senior buyers rather than reach, I would rather reshape the package to fit your budget than hand you a thinner version of the wrong thing. What is the ceiling you are working inside?"
(Label, calibrated question, value reframe, reshape-not-discount. No defense of the number.)

### Quote cover-note (uses Brian's REAL Modelwise packages from [[hwfyi-package-quote-playbook]], no invented prices)

> Thanks again for the time today. The thing not many publications can offer you is the audience itself: the engineering decision-makers you are trying to sell are the people who already open us every week.
> A first campaign usually lands best leading with content, so I built three options around that. [Packages A/B/C exactly as in the package-quote-playbook: A $20K ($25K rate card) / B $12K / C $5K.]
> Most partners with your goal pick the middle option. Here is a recent issue so you can see where your placements would run [link]. Let me know if I can answer any other questions!
> Brian

---

## Related

- [[hwfyi-package-quote-playbook]] — the package shape this wraps.
- [[definition-of-done-gate]] — the umbrella pre-send gate.
- [[draft-learnings]] — Brian-edit lessons; consult before drafting.
- [[feedback_first_touch_audience_fit]], [[feedback_sales_value_first]], [[feedback_no_price_negotiation]] — the stance memories.
