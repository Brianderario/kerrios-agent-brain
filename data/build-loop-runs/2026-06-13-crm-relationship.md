# Build-loop run — CRM relationship view (company ↔ deals ↔ people)

**Started:** 2026-06-13 (Claude, build-loop, interactive invocation)
**Session-start baseline:** kerrihq-rails `9bb3f6f` (== origin/main, clean tree)
**Task (Brian):** "Analyze the entire CRM landscape and identify the gaps with what we have with Savant now. Make only recommendations relevant to the work we do. Suggest and execute. e.g. I want to click into a company and see the deals we've done and people who work there."

## Landscape analysis (what exists, what's missing)

Data model is rich and fully interconnected — the gap is the **display surface**, not the data.

- **Company** has_many :deals, :people, :contracts, :newsletter_placements; has_many :events through deals. `outreach_stats`, `crm_notes`, domain/industry/size all present.
- **Person** belongs_to :company; has_many :deals_as_primary_contact; outreach_status + email counts present.
- **Deal** belongs_to :company + :primary_contact; renewal_status, fulfillment_summary, weighted_value present.

**Company show page** today: name, website/phone card, Events chips, People table (name/email/type/events). **MISSING: the deals.** No way to see "what deals have we done with this company." ← Brian's exact ask.
**Person show page** today: just the `_person` card (name/type/email/phone/title/linkedin/events). **MISSING: company backlink, the deals they're the contact on, outreach status.**
**Deal show page**: already rich (renewal, fulfillment, contracts, activities, contacts, emails). No gap.

## Recommendations (relevant to the sponsor-sales work we actually do), safest-first

- **ITEM 1 — Company show: Deals section + roll-up.** List every deal for the company (name→deal, stage badge, value, renewal status, contract end), with a header roll-up (open count, won count, total booked $). Strictly additive, read-only. Directly answers Brian's ask. Also add an additive `deals` summary array to GET /api/v1/companies/:id (agents ask "what deals with X").
- **ITEM 2 — Person show: company backlink + their deals + outreach status.** Clickable company link, outreach status / email counts, and a "Deals" section from `deals_as_primary_contact`. Completes the click-through loop.
- **ITEM 3 — Company show: richer People + company context.** People table gains Title + outreach status; header card gains domain/industry/size/LinkedIn + an outreach roll-up (contacts / contacted / replied) via `outreach_stats`.

## Hard rails honored
Additive only (no rename/drop of API fields or columns). No external sends. No invented data — every number traces to a record (empty/blank when absent). RailsBlocks/Tailwind idiom matched. Pundit on every action (reusing existing authorize). Gates green each ship.

---

## Ledger

### ITEM 1 — SHIPPED + VERIFIED (rails 1c5a4f0 → Render live)
Company show now has a **Deals** section: every deal with that company (name→deal, stage dot, value, renewal chip, event) + roll-up (open / won / booked $). Additive `deals` array added to GET /api/v1/companies/:id, scope-gated on deals:read (company-only keys never see it), no field removed.
PROD PROOF: GET /api/v1/companies/29f853ce (Duro Labs) → deals:[Duro Partner Program $44,000 closed_won, Duro CY2026 $24,500 closed_won]; all base company fields intact. Gates: rubocop clean, rspec 1497/0, brakeman 0. Web page verified via request specs (behind login).

### ITEM 2 — SHIPPED + VERIFIED (rails 95962a6 → Render live)
Person show now has: a clickable backlink to their company, an outreach-status badge (Not contacted / Email sent / Replied), and a **Deals** section listing every deal they're the primary contact on (reuses the generalized companies/_deals partial). Closes the company↔person↔deal loop.
PROD PROOF: deploy 95962a6 live, /up 200. UI-only change behind login → verified by request specs (company backlink + path, outreach status, owned-deals list, empty-state). Gates: rubocop clean, rspec 1500/0, brakeman 0.

### ITEM 3 — SHIPPED + VERIFIED (rails cbaa6b2 → Render live)
Company card gains domain/industry/size/LinkedIn (shown only when present). People section gains a roll-up (contacts / contacted / replied via Company#outreach_stats) + Title and Outreach-status columns.
PROD PROOF: deploy cbaa6b2 live, /up 200. No API regression — company API still returns the deals summary + all base fields; /companies /people /deals /revenue_command all 200. UI verified by request specs. Gates: rubocop clean, rspec 1500/0, brakeman 0.

## RUN COMPLETE
All 3 items SHIPPED + VERIFIED. Additive only, real data only (every number traces to a record; blank/em-dash when absent), no API field removed/renamed, no new top-level surface, RailsBlocks idiom. Gates green each ship. Commits: 1c5a4f0 (company deals), 95962a6 (person backlink+deals), cbaa6b2 (company context+people). Brian's ask — "click into a company and see the deals we've done and people who work there" — is now fully satisfied, plus the reverse (click a person → see their company + the deals they own).
