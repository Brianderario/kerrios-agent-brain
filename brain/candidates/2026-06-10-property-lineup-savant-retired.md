# Property lineup change: Savant retired, S&W elevated to tracked property

scope: candidate (material org-structure change, PR pending) · created: 2026-06-10 · source: Brian, interactive Console-mockup session 2026-06-10

## What Brian decided (verbatim intent)

During the KMG Console (kerrihq-rails takeover) mockup review on 2026-06-10, Brian said:

1. "Savant has no revenue, so make sure it's not on there." Savant is removed from the Console entirely.
2. "The properties are Hardware FYI, Kinetic, Standard, and Works." Clarified via follow-up question: properties = **Hardware FYI, Kinetic, Standard & Works**; Savant is retired.
3. On S&W status: "We'll treat it as a full property and then remove it if we can't end up working out a deal with Zach in the future, but I want to keep it in here for tracking purposes."

## What this changes

- **Savant: retired as an active KMG property.** No revenue, no active workstreams. It does not appear in the Console (dashboards, pipeline, property switcher, revenue charts).
- **KMG property lineup is now: Hardware FYI, Kinetic, Standard & Works** (Console property colors: HWFYI amber #F59E0B, Kinetic violet #A78BFA, S&W teal #00ADA7).
- **S&W is a full property in the Console for tracking purposes only.** This is a tracking/visualization decision, not a legal or boundary change. It is conditional on the Zach deal continuing and may be reversed.

## What this does NOT change (critical)

- S&W remains a **separate legal entity** (Storm King Nexus Holdings LLC). The partnership boundary in [[wiki/companies/standard-and-works]] is fully intact: S/W internal ops, financials, staff comp, and S/W-authored content drafts still never enter Kerri's brain or the Console.
- Only **KMG-side data** (joint deals, KMG's share of revenue, KMG-side activity) is tracked under the S&W property in the Console.

## Proposed wiki edits (to land via PR)

1. `wiki/properties/savant.md`: mark status retired as of 2026-06-10, note "no revenue; removed from KMG Console per Brian 2026-06-10," keep page for history.
2. `wiki/companies/standard-and-works.md`: add a Core fact noting S&W is surfaced as a full property in the KMG Console for tracking purposes as of 2026-06-10 (conditional on the Zach deal; KMG-side data only; boundary rules unchanged).
3. `wiki/properties/kmg.md` (if it lists the property roster): update lineup to HWFYI / Kinetic / S&W-tracked.

## Why this is a candidate and not a direct wiki edit

Org structure + partnership status = material write per [[wiki/workflows/multi-agent-write-rules]], which requires a PR. The Bash/git tool was unavailable this session, so the PR could not be opened immediately. This candidate holds the decision so no agent acts on a stale property lineup in the meantime. Next session with working git: open the PR with the three edits above, then delete this candidate.
