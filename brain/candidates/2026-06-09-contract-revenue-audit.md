# Candidate: Full contract / CY2026 revenue audit (2026-06-09)

**Status:** AWAITING BRIAN. Read-only audit, nothing mutated. Every proposed CRM fix below is approval-gated; nothing has been applied to the CY2026 sheet.

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
| **Corrected contract-booked CY2026** | **$619,064.73** |
| + Kinetic ticket revenue (in NO ledger anywhere; MASTER basis) | +$109,050.00 |
| **Corrected total CY2026** | **~$728,114.73** |

Real gap to the $1M goal is ~$272K, not $421,835.

## The $389K Kinetic number

The exact figure exists nowhere in Drive, email, or DocuSign. The live "Kinetic 2026 MASTER" sheet (edited 6/9) shows Sponsored Content $277,000 + Tickets $109,050 = $386,050; an alternate tab totals $390,825. $389K is a point-in-time snapshot between the two. Ticket revenue has 5 conflicting bases across sources ($61,111 CRM / $75,139 P&L / $68,168 and $83,170 Ti.to variants / $109,050 MASTER). Pin the ticket basis before treating any Kinetic total as final.

## Proposed CRM fixes (need Brian approval before any sheet edit)

1. Dassault/Solidworks HWFYI-2026-003: move all 24 breakdown rows from 2025 dates to Jan-Dec 2026. Contract signed 2025-12-11 for 12 months; doc term "21.01.2025 - 12.31.2025" is an impossible year typo. Savant export independently shows Solidworks Jan-Dec 2026.
2. Quilter HWFYI-2025-001: move the 27 breakdown rows from Apr-Dec 2026 back to Apr-Dec 2025. Doc (signed Feb 2025, 26 weekly sends, ~6 months) says "Apr 2026 - Dec 2026", almost certainly a 2025 typo; the term as written overlaps Quilter's two newer 2026 contracts.
3. Add Jiga: signed SOW $20,000, Aug 2025 - Aug 2026, Net 30 (Drive doc + Revenue Growth Model corroboration, "pro-rated $12,500 to 2026"). Decide the 2025/2026 split basis.
4. Add Bananaz Kinetic $5,000 ($2,500 company feature + $2,500 booth; signed contract confirmed by Noy Nave email 5/11).
5. Add Colare $5,000 (signed SOW 4/16, INV-138 PAID via ACH 6/9). Colare is absent from the CRM entirely.
6. Add Embedded Ventures $5,900 (INV-141 to Jenna Bryant, SOW attached, due 6/5, UNPAID and past due; incremental to Zoo's $20,000 workshop).
7. Add Kinetic ticket revenue as its own line/tab once the basis is pinned.

## Open questions (money likely missing but needs Brian / verification)

- **PTC quarterly invoices:** signed contract per email ("we're all set with the contract", 4/4), PO #US10004508, quarterly $10,000 invoices (INV-112, INV-133). Implies ~$40K/yr run rate; CRM only captures $15K Kinetic. No PTC doc in the CRM contract list. Potentially +$25K-40K for 2026.
- **Duro side deals (docs modified 6/1, execution status unknown):** "Event Sponsorship" $44,000 (2x dinners @ $12K + SF Tech Week presenting $20K; one dinner already in CRM, so +$32K incremental) and Partner Program $12,500 (Jun-Dec 2026). If executed, Duro 2026 = $56,500+, not $12,000. Matches the 5/x pipeline doc's "Duro $18K verbal" upgrade path.
- **Protolabs $10K timing:** CRM books it Sep-Dec 2025; Savant and campaign evidence say spring 2026 delivery. If moved: +$10K to 2026.
- **CoLab digital conflict:** Savant says $29,000 (Q4 2025 - Q1 2026); main CRM has $18,000 (Jan-Mar 2026) + $1,500 (2025). ~$9.5K unexplained.
- **Zoo/EV AR pairing:** AR workbook pairs INV-141 ($5,900) with INV-142 ($29,100, billed to "Benjamin Chia") as one $35,000/yr contract starting 5/1. INV-142's billing name needs verification before booking anything beyond the $5,900.
- **Iryna Zhuravel:** $14,500/yr in AR workbook with $7,250 unearned owed back; no matching SOW found.
- **Imagineering/PCBnet $2,000 (INV-110, due 3/19):** sponsor says paid (6/2 email) but no payment receipt on file; verify in Mercury before counting as collected.

## KerriHQ-entity contracts (separate ledger, not HFYI CRM)

- OhioX Partnership: $27,500 Net 15 of event + $15,000 bonus clause, SIGNED 1/21/2026 (Powering AI Conference).
- Hampton Roads Alliance: $50,000 (6 monthly installments) + 25% net event profit, in active redline as of 6/4 (Ironclad Maritime Summit, Oct 2026).
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
