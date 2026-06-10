# Candidate: Full contract / CY2026 revenue audit (2026-06-09)

**Status:** CLOSED (final) + Mercury invoice-side pass added 6/9 night (see section below; corrects the PTC "never invoiced" finding and resolves Quilter INV-125 as CANCELLED). 6/9 ~18:45 ET: Brian approved removals ("Make the edits and updates so as long as you feel confident everything is accurate"); removed Quilter HWFYI-2026-010 ($80K), Xometry HWFYI-2026-022 ($10K), nTop HWFYI-2026-018 ($12.5K), Loombotic HWFYI-2026-006 ($12.5K) -- 106 breakdown rows deleted, 4 Contract List rows annotated, per-contract sums verified before deletion. **Final clean CY2026 booked: $526,372.41** (39 companies). 2025-contract spillovers preserved (nTop $5,357.12, Loombotic $1,785.68); Quilter now $14,500 only. Loombotic removal is reversible if Benji confirms the deal. Removal script: /tmp/kerri-contract-audit/remove-phantom-contracts.mjs.

**Scope:** DocuSign envelopes, Google Drive (all contract docs, 39 unique CRM-linked docs read in full), 3 KMG mailboxes (brian@hardwarefyi, kerri@hardwarefyi, brian@kerrihq; S/W mailbox untouched), Savant export sheet, Kinetic 2026 MASTER sheet, AR reconciliation workbook. Trigger: Brian asked whether 2026 revenue is fully captured ("I feel like we're missing numbers").

## Headline

The CY2026 Revenue Goal board (Closed Won $578,164.73) is internally consistent and matches every signed contract doc dollar-for-dollar (zero value mismatches across all 39 docs). But it is missing real, evidenced revenue. Corrected booked CY2026:

| | Amount |
|---|---|
| CY2026 board today | $578,164.73 |
| + Dassault/Solidworks misdated to 2025 (term typo) | +$25,000.00 |
| - Quilter HWFYI-2025-001 misdated into 2026 (term typo) | -$12,500.00 |
| + Jiga signed SOW, 2026 portion (not in CRM at all) | +$12,500.00 |
| + Bananaz Kinetic signed 5/11 (feature + booth; CRM only has old $1K deal) | +$5,000.00 |
| + Colare Kinetic booth, signed 4/16, PAID 6/9 (not in CRM) | +$5,000.00 |
| + Embedded Ventures INV-141, SOW attached, past due (incremental to Zoo $20K) | +$5,900.00 |
| **Subtotal (pre-Brian-answers)** | **$619,064.73** |
| + Duro partner program $12,500 (Brian confirmed: signed) | +$12,500.00 |
| + Protolabs $10K moved from 2025 to 2026 (Brian confirmed) | +$10,000.00 |
| + PTC quarterly invoices (Brian confirmed: this year; total TBD, run rate $40K/yr) | +$TBD |
| **Updated corrected contract-booked CY2026** | **$641,564.73 + PTC** |
| + Kinetic ticket revenue (in NO ledger anywhere; MASTER basis) | +$109,050.00 |
| **Updated total CY2026** | **~$750,614.73 + PTC** |

Real gap to the $1M goal is ~$249K (before PTC quarterly), not $421,835.

### Brian's decisions (6/9 ~17:50 ET)
- **PTC quarterly:** confirmed as this year's contract. Total annual value TBD (run rate $40K/yr based on quarterly $10K invoices). Once confirmed, add to CRM.
- **Duro:** only the partner program ($12,500) is signed. The $44K event sponsorship SOW was sent but NOT signed -- stays as pipeline.
- **Protolabs $10K:** confirmed, move from 2025 into 2026.
- **CoLab:** $19.5K is correct (CRM figure). Savant $29K discrepancy resolved -- no change needed.
- **PCBnet/Imagineering $2K:** just paid. No revenue change (already in CRM).
- **Hampton Roads $50K:** in review, stays as pipeline.
- **OhioX $27,500:** REMOVED. This was an outbound commitment for the Frontier partnership, which is no longer being pursued. Not revenue.

## Execution verification (6/9 evening, second pass)

Trigger: the Quilter $80K phantom (HWFYI-2026-010 -- unsigned Jan SOW that email shows was negotiated down to the $14.5K deal locked 4/6, DocuSign-signed 4/8 as HWFYI-2026-020). First pass only verified dollar values vs docs; this pass verified EXECUTION per contract.

Method note: all CRM-linked Google Docs are unsigned source templates (all 23 checked have blank signature blocks). Execution evidence = completed DocuSign envelope, cash received (Ari's 6/3 "2100 Deferred Revenue" register, ending balance $445,601.45, plus Mercury receipts), or unambiguous written confirmation.

**Solid: 35 of 40 companies, ~$573K.** 22 contracts cash-confirmed (incl. Fictiv via Bill.com, AllSpice 2/27 deposit, Dassault $25K ACH 3/23 -- the prior "overdue" flag was wrong, it is PAID -- Array Labs $30K, CoLab $20K + Feb deposit, Flow $27K, Blitzpanel, EMI check 5/14, Protolabs Oct/Dec 2025 ACH, First Resonance INV-139 $10K landed 6/9, Eight Sleep, Cosmon, Circuitly $5K+$3K, Kipo INV-129). Rest have completed DocuSign envelopes (37 envelopes inventoried, acct 8a7d430a, sender Benji info@hardwarefyi.com). Onshape $40K executed via PO #US10004508.

**Problem lines ($130K):**
| Line | $ | Verdict |
|---|---|---|
| Quilter HWFYI-2026-010 | 80,000 | PHANTOM. Unsigned; superseded by $14.5K deal. Remove pending Brian. |
| Xometry HWFYI-2026-0xx | 10,000 | PHANTOM. Envelope sent 4/21 never signed; zero invoices/sends; Benji 5/28 "excited to see how we can work together" = prospect; H2 call 6/15. |
| nTop Q2 2026 (2026-018) | 12,500 | STALLED. Fynn balked at price 3/25-3/30; envelope 4/1 then total silence; no invoice/sends. 2025 nTop spillover (~$5.4K) is fine. |
| Loombotic 2026 | 12,500 | UNVERIFIABLE. Unsigned, no envelope, no payment, no email anywhere. Exists only in CRM. Ask Brian. |
| PTC Kinetic | 15,000 | REAL. Brenna Robillard 5/7: "our 15k investment"; delivered at Kinetic. ~~Never invoiced~~ CORRECTED 6/9 night via Mercury API: INV-131 $15,000 issued 4/15 under PO #US10004841, due 6/14, unpaid. The earlier "never invoiced" finding was wrong (email evidence missed it; Mercury ledger has it). |

Minor: Duro $12K dinner real (delivered 5/12 Bourbon Steak; original INV-140 cancelled, re-issued as INV-143 with Memo #Y126027606 to payables@altium.com 5/27, due 6/12, unpaid as of 6/9). Bananaz: $3,750 collected (INV-128 Paid) vs $5,000 booked -- $1,250 shortfall CONFIRMED via Mercury ledger. Quilter INV-125 $14.5K: RESOLVED via Mercury ledger -- invoice is CANCELLED, no replacement invoice exists, no cash received. Benji's 5/19 "squared away" evidently meant the invoice was cancelled, not paid. The signed $14.5K deal (HWFYI-2026-020, envelope completed 4/8) is booked in CRM with zero billing behind it. Likely connected to the AR-workbook line "Iryna Zhuravel $14,500/yr with $7,250 unearned owed back" -- if the deal half-terminated, CRM may need to come down $7,250. ASK BENJI.

## Mercury invoice-side reconciliation (6/9 night, via read-only API token from Brian)

Full AR ledger: 49 invoices all-time. Paid $424,371.45 / Unpaid $132,000 / Cancelled $45,000. Token used live only, NOT stored anywhere.

Unpaid breakdown ($132,000):
| INV | Customer | $ | Due | Note |
|---|---|---|---|---|
| INV-102 | PTC (Onshape 2026 Renewal) | 40,000 | 2026-01-18 | STALE DUPLICATE -- per Brian 6/9, Onshape $40K bills via quarterly $10K POs (INV-112 Q1 PAID 3/16; INV-133 Q2 due 6/26). INV-102 should be CANCELLED or PTC is double-billed. |
| INV-131 | PTC Kinetic (PO US10004841) | 15,000 | 2026-06-14 | Real; due this week. |
| INV-143 | Altium (Duro dinner, #Y126027606) | 12,000 | 2026-06-12 | Re-issue of cancelled INV-140; due this week. |
| INV-133 | PTC (PO US10004508, Onshape Q2) | 10,000 | 2026-06-26 | Current. |
| INV-139 | First Resonance | 10,000 | 2026-06-10 | Register shows $10K landed 6/9; Mercury still Unpaid = payment in transit/unmatched. Verify it clears. |
| INV-141 | Embedded Ventures | 5,900 | 2026-06-05 | PAST DUE 4 days. |
| INV-137 | Component AI (component20.dk) | 5,000 | 2026-06-08 | PAST DUE 1 day. |
| INV-132 | Advanced PCB | 5,000 | 2026-06-20 | Current. |
| INV-142 | "Benjamin Chia" info@hardwarefyi.com | 29,100 | 2026-09-30 | Internal-placeholder invoice; AR workbook pairs it with INV-141 as one $35K/yr Zoo/EV contract. Needs a real billing contact before 9/30. |

Other ledger notes: Colare INV-138 $5K Paid (landed 6/9, matches register). All 13 email-receipt invoices confirmed Paid in ledger. Initialized $1.5K (INV-111) + SOSV $1.5K (INV-134) paid -- look like Kinetic ticket sales, relevant to the unpinned ticket basis. Summit Interconnect $16K paid Sep-Oct 2025 (CY2025, out of scope). Luxonis INV-101 $2.5K cancelled.

If all four removals approved: CY2026 booked $526,372.41; + tickets ~$109K = ~$635K; real gap to $1M ~ $365K.

## The $389K Kinetic number

The exact figure exists nowhere in Drive, email, or DocuSign. The live "Kinetic 2026 MASTER" sheet (edited 6/9) shows Sponsored Content $277,000 + Tickets $109,050 = $386,050; an alternate tab totals $390,825. $389K is a point-in-time snapshot between the two. Ticket revenue has 5 conflicting bases across sources ($61,111 CRM / $75,139 P&L / $68,168 and $83,170 Ti.to variants / $109,050 MASTER). Pin the ticket basis before treating any Kinetic total as final.

## Proposed CRM fixes (need Brian approval before any sheet edit)

1. Dassault/Solidworks HWFYI-2026-003: move all 24 breakdown rows from 2025 dates to Jan-Dec 2026. Contract signed 2025-12-11 for 12 months; doc term "21.01.2025 - 12.31.2025" is an impossible year typo. Savant export independently shows Solidworks Jan-Dec 2026.
2. Quilter HWFYI-2025-001: move the 27 breakdown rows from Apr-Dec 2026 back to Apr-Dec 2025. Doc (signed Feb 2025, 26 weekly sends, ~6 months) says "Apr 2026 - Dec 2026", almost certainly a 2025 typo; the term as written overlaps Quilter's two newer 2026 contracts.
3. Add Jiga: signed SOW $20,000, Aug 2025 - Aug 2026, Net 30 (Drive doc + Revenue Growth Model corroboration, "pro-rated $12,500 to 2026"). Decide the 2025/2026 split basis.
4. Add Bananaz Kinetic $5,000 ($2,500 company feature + $2,500 booth; signed contract confirmed by Noy Nave email 5/11).
5. Add Colare $5,000 (signed SOW 4/16, INV-138 PAID via ACH 6/9). Colare is absent from the CRM entirely.
6. Add Embedded Ventures $5,900 (INV-141 to Jenna Bryant, SOW attached, due 6/5, UNPAID and past due; incremental to Zoo's $20,000 workshop).
7. Add Duro partner program $12,500 (signed; Jun-Dec 2026). New contract row alongside HWFYI-2026-025.
8. Move Protolabs HWFYI-2025-012 breakdown rows from Sep-Dec 2025 dates to spring 2026. Brian confirmed 2026 delivery.
9. Add PTC quarterly digital contract (annual value TBD; run rate $40K/yr). Need total from Brian before writing the row.
10. Add Kinetic ticket revenue as its own line/tab once the basis is pinned.

## Open questions (remaining after Brian's 6/9 answers)

- ~~**PTC quarterly invoices:**~~ **RESOLVED per Brian** -- the quarterly $10K invoices under PO #US10004508 are the billing mechanism for the Onshape contract (HWFYI-2026-002, $40K). Already fully captured in the CRM. No additional revenue.
- **Duro event sponsorship $44K:** SOW sent, NOT signed per Brian. Pipeline only. CRM stays at $12K Kinetic dinner + $12.5K partner program (newly added).
- **Zoo/EV AR pairing:** AR workbook pairs INV-141 ($5,900) with INV-142 ($29,100, billed to "Benjamin Chia") as one $35,000/yr contract starting 5/1. INV-142's billing name needs verification before booking anything beyond the $5,900.
- **Iryna Zhuravel:** $14,500/yr in AR workbook with $7,250 unearned owed back; no matching SOW found.

## Resolved (no longer open)

- **Protolabs $10K:** RESOLVED -- Brian confirmed move to 2026. Added to corrected figure.
- **CoLab $9.5K conflict:** RESOLVED -- Brian confirmed $19.5K (CRM figure) is correct.
- **PCBnet/Imagineering $2K:** RESOLVED -- Brian confirmed just paid. Already in CRM, no change needed.
- **Hampton Roads $50K:** RESOLVED -- in review, pipeline. Not booked.
- **OhioX $27.5K:** RESOLVED -- removed entirely. Was an outbound KMG commitment for Frontier (no longer pursued), not revenue.

## KerriHQ-entity contracts (separate ledger, not HFYI CRM)

- ~~OhioX Partnership: $27,500~~ **REMOVED per Brian** -- this was an outbound KMG commitment for the Frontier conference partnership, which is no longer being pursued. Not revenue.
- Hampton Roads Alliance: $50,000 (6 monthly installments) + 25% net event profit, in active redline as of 6/4 (Ironclad Maritime Summit, Oct 2026). **Per Brian: still in review.**
- Opterus R&D: $1,000 3-month trial from 1/5/2026.
- Astroscale US design partner agreement (9/26/2025): fee schedule not extracted (file too large for reader).
- KerriHQ x HardwareFYI internal event agreement (signed 1/1-1/2/2026): Kinetic profit split 40% KerriHQ / 60% HardwareFYI; material to any Kinetic profit allocation.

## Risk register

- Unsigned-but-booked in CRM: PTC $15K, Xometry $10K, nTop HWFYI-2026-018 $12.5K, Duro Kinetic $12K (no executed doc located; bookings rest on email confirmations).
- Overdue receivables (Kerri 5/1 sweep + this audit): Onshape $40K, Fictiv $30K, Solidworks $25K, CoLab $29K, DraftAid $8K, Flow Kinetic invoice, EV $5,900.
- Minor doc defects (no dollar impact): Flow 2025-005 end-year typo, DraftAid "Service Provider: DraftAid" drafting error, AllSpice 6-month label vs full-year deliverables, Xometry is the only Net-45 contract, several docs missing payment terms (Colab, First Resonance 2025, Onshape, DraftAid).
- Cosmon: MASTER tabs disagree ($12K vs $15K); CRM books $12K.

## Evidence trail

- Audit working files: /tmp/kerri-contract-audit/ (crm-contracts.txt, savant-export.txt, savant-event-tracker.txt, savant-legacy.txt, dump-sheet-tabs.mjs)
- Key sources: CRM sheet 1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk; Savant export 1uERm4zCBeXh1HrcYG5OV91xR7Lm9pJqTp3NmzhY7__0; Kinetic 2026 MASTER 1o8mSFybKptSeqxDkpOgnUbayNQstdIbC7wneXJLLAXk; Jiga SOW 1mfcIQrczNbL2Y4peo5sFnhiA2C-5VuXH4nRQ5pXWZ30; Colare SOW 1R7D-eAp0v2ltZFeHTFz-Ag1iP5Ka-X9i (DocuSign envelope 7abb49c2-b2d9-83bd-83db-4a2df9922bf1); Duro docs 1SOF9shDSUGCmnDEm_0vbb4bw4sOelqk5Amnk-en-MOM + 1eqRnbhCm06LsA2xlnH6PWypwD_g97znH2eQuwBiPRhU
