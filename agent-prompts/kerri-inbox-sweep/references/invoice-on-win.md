# Invoice on win — a function of the inbox sweep

scope: reference · called by `kerri-inbox-sweep` (CRM PIPELINE AUTO-UPDATE step) · updated 2026-06-23 · owner: Brian + Kerri

This is a **function of the inbox sweep, not a standalone routine** (Brian, 2026-06-22). The sweep is the agent that reads the signed-contract email and flips the deal to `closed_won`; so the moment it does, while it is still holding the thread + the executed contract attachment, it prepares the invoice info and emails it to Brian.

**Operating model (Brian, 2026-06-23): email Brian the ready-to-send invoice info on every signing, so he issues it in Mercury himself in seconds.** Brian's exact ask: "email me this info once we sign a contract so I can quickly send it out, like now." Kerri does NOT create or send the Mercury invoice and does NOT email the customer. Kerri sends ONE internal email to Brian with the paste-ready fields + the executed contract attached; Brian creates + sends it in Mercury. (This replaced the earlier Console-card design on 2026-06-23 because Brian wants the speed of issuing it himself from an email.)

---

## CONFIG

- `INVOICE_RECIPIENT`: **Brian** — to `brian@kerrihq.com`, cc `brian@hardwarefyi.com`. Sent from `kerri@hardwarefyi.com`. This is an INTERNAL email to Brian (no external recipients), so it is autonomous per OPERATING PRINCIPLE P1 — no approval task, no external-send gate. Kerri never puts the customer on this email.
- `MERCURY_INVOICE_API`: **live as of 2026-06-23** (Brian enabled invoicing on the Mercury plan; `mcp__mercury__create_customer` / `create_invoice` now work, and `list_invoices` is usable for the dedup check). Even though the API works, the chosen model is **email-Brian-then-he-sends** — do NOT auto-create or auto-send a Mercury invoice unless Brian explicitly switches the model (e.g. "just create it and I'll approve"). If he ever does, create it with `sendNow:false` (draft) and still email him; never `sendNow:true` autonomously.
- Deposit account: **Brian's choice at creation** (he has used Savings ••4721 `31045296-2553-11ef-905a-a73458f7f27b` and Checking ••4504 `3101744a-2553-11ef-905a-77d817841c71`). The email may note a suggested account but Brian picks it in the Mercury UI.

## WHEN THE SWEEP CALLS THIS (trigger)

From the sweep's CRM PIPELINE AUTO-UPDATE step, immediately after a won classification, call this function **only when ALL hold**:
1. The signal is won evidence (`signed` / `accepted` / `booked-revenue`).
2. **This run is the one that transitions the deal to `closed_won`** (it was NOT already `closed_won` before this run). Never call it on a deal that was already won.
3. The deal's company `jobId` prefix is `H` or `G` (never `S` — S/W bills separately and stays out of Kerri's brain).
4. Real execution evidence is in hand: the signed contract PDF on the thread, or a DocuSign `completed` envelope for the company. No executed contract → do NOT email an invoice; leave a one-line deal note ("won, awaiting executed contract before invoice") and move on.

## HARD RULES

1. **Kerri never creates/sends the Mercury invoice and never emails the customer.** Kerri sends one internal email to Brian; Brian issues it. (The neverAuto money/external gate is honored because Kerri performs no external send and no money action.)
2. **One invoice email per signed deal, EVER.** Before emailing, BOTH dedup gates must pass: (a) the Savant deal note has no `invoice info emailed` marker, AND (b) `mcp__mercury__list_invoices` shows no non-cancelled invoice to that customer for that amount. If either says "already exists," do NOT email again — record and move on. (Prevents nagging Brian twice for the same signing.)
3. **Amount + terms + bill-to come ONLY from the executed contract / deal. Never invent or estimate.** If the value is null/ambiguous or the bill-to can't be sourced, email Brian a short "signed, but I need the <amount|bill-to> before I can give you the invoice line" note instead of a guessed invoice (phantom-data rule).
4. **Attach the executed contract** to the email so Brian is billing against the right paper.
5. **Bill-to is sourced.** Resolve in order: an explicit instruction in the contract thread ("send the invoice to X") → the company AP/billing contact → the primary deal contact. Watch for pay-through-a-parent cases (e.g. **Duro bills through Altium**, `payables@altium.com`); use the paying entity, and say which on the email.

## STEPS

**1 — Capture the executed contract.** The won-triggering email carries the signed PDF (or pull the completed doc from DocuSign). Fetch it via the mailbox `attachments` tool, save to a local path to attach to Brian's email.

**2 — Assemble the invoice fields** (sourced facts only):
- **Customer / bill-to**: legal name + bill-to email (STEP HARD RULE 5).
- **Amount**: deal `value`.
- **Terms → due date**: parse from the contract ("Net 30" → invoiceDate + 30). Default Net 30 only if silent, and say so.
- **Line item**: "<Property> <package> — <term window>" (one bundled line unless the contract itemises).
- **Suggested invoice #**: `mcp__mercury__list_invoices` (desc) highest `INV-NNN` + 1 (Mercury also auto-numbers).
- **No sales tax** unless the contract specifies it.

**3 — Dedup cross-check (mandatory).** Deal-note `invoice info emailed` marker absent AND no matching non-cancelled Mercury invoice (HARD RULE 2). If a match exists, skip + record.

**4 — Email Brian** (autonomous P1; from `kerri@hardwarefyi.com` to `brian@kerrihq.com`, cc `brian@hardwarefyi.com`; run the HARD NO-DOUBLE-EMAIL gate first; approvalSource "auto: internal invoice-ready notice to Brian per P1"). Attach the executed contract. Subject: `🧾 Invoice ready to send: <Company> — $<amount>`. Body, plain and paste-ready so he can create it in Mercury in under a minute:
```
<Company> just signed (<package>, executed <date>). Here's the invoice to send in Mercury:

  Customer / bill to:  <legal name> — <bill-to email>   [<note, e.g. "Duro bills through Altium">]
  Amount:              $<amount>
  Terms / due:         <Net N> — due <date>
  Line item:           <line name>
  (no tax · suggested # INV-<NNN> · deposit: your usual operating account)

Executed contract attached. Reply if you want me to tweak anything.
```

**5 — Record.** Append to the Savant deal note (`PATCH /api/v1/deals/:id`): `[YYYY-MM-DD] invoice info emailed to Brian, $<amount> <terms>, bill-to <email>`. The sweep's normal STEP 6 state write + one brain/log line cover the rest. **No separate state file** — the deal-note marker + Mercury cross-check are the dedup ledger.

## WHAT THIS NEVER DOES
- Create or send a Mercury invoice (Brian does). · Email the customer (Kerri emails only Brian). · Email Brian twice for the same signing. · Invoice without an executed contract. · Invent an amount/term/bill-to. · Touch S-prefix / S&W deals.
