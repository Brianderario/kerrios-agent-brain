---
name: send-partner-contract
description: >
  Send a Hardware FYI Partner Program (or other sponsor) contract to a client for e-signature. Trigger
  when Brian says "send the partner contract", "send <client> the contract", "send the partner program
  contract", "lock in the contract", "get the SOW signed", "send the Duro contract", or any request to
  issue a sponsor/partner agreement for signature on a won deal. The skill duplicates the contract
  Google Doc, fills the deal's terms, uploads it to DocuSign, and sends — gated on Brian's approval.
  This is a legal commitment + external send: it builds a draft and never auto-sends.
---

# Send Partner Contract — Kerri skill

Turns a **won** Hardware FYI partner/sponsor deal into a signed-contract send. The mechanics, per Brian
(2026-06-01): **duplicate the master Google Doc → fill in the outstanding info → upload that doc to
DocuSign → send.** No pre-built DocuSign template.

You are Kerri. Follow the canonical Kerri persona (`agent-prompts/kerri-skill/SKILL.md`), the 4-step
operating loop, and every hard rule in `KerriOS/CLAUDE.md`. Read `references/docusign.md` (this folder)
before acting — it holds the MASTER doc fileId, the fill tokens, the signature anchors, the DocuSign
accountId, the contracts-folder requirement, and the exact `createEnvelope` call shape.

## Hard rules (do not bypass)

- **Approval-gated.** A contract is an **external send** + a **legal commitment** → hard gate. Build the
  envelope as a DRAFT (`status:"created"`). Never send without `approved=true` + `approvalSource`
  (where/when Brian approved), routed through Kerri Console first.
- **No double-send.** Before building, prove no contract already went out for this jobId (brain `log.md`
  / `data/jobs.json` / DocuSign `getEnvelopes`). A re-send needs explicit `SECOND SEND APPROVED BY BRIAN`.
- **jobId is per-customer.** CUSTOMER LOOKUP first; reuse the existing jobId (Duro = `H0014`).
- **Never edit the MASTER per-deal.** Always copy it first, fill the copy. The MASTER is the template.
- **Terms from the brain + won-deal thread, not template defaults.** Fill every `[token]`. If a required
  value is missing (legal entity name, start date), STOP and get it from Brian/the client — never guess.
- **S/W boundary.** Hardware FYI only. Never issue an S/W contract here.
- **Record or it didn't happen** (step 7).

## Workflow (Perceive → Build → Approve → Send → Record)

### 1. Perceive — resolve the deal
- Identify client + signer (name, email) from Brian's request and the deal email thread.
- CUSTOMER LOOKUP in `data/companies.json` → reuse the **jobId**.
- Pull agreed **fee, term, deliverables, start date, legal entity name** from
  `brain/wiki/companies/<slug>.md` + `data/jobs.json` + the won-deal thread. Use the canonical Partner
  Program deliverable wording in `brain/wiki/properties/hardware-fyi.md`.
- Flag any missing required value and get it from Brian before proceeding.

### 2. No-double-send gate
- Confirm no prior contract for this jobId. Stop if one exists (unless `SECOND SEND APPROVED BY BRIAN`).

### 3. Duplicate + fill the Google Doc
- `copy_file(fileId: <MASTER>, title: "<Company> x Hardware FYI <Year>", parentId: <CONTRACTS_FOLDER_ID>)`.
  Title format is exactly **`[Company] x Hardware FYI [Year]`**. The contracts folder must be the
  link-shared one (see `references/docusign.md`) so the PDF export is publicly fetchable.
- `gdocs_replace` on the **copy** for each fill token: `[Company]`, `[Date]`, `[Deliverables]`,
  `[Platforms]`, `[Schedule]`, `[Fee]` (and Payment Terms only if non-standard). **Do not touch the
  `Content Approval:` boilerplate or the signature block labels (`Name:` / `Signature:` / `Date:`)** —
  the DocuSign tabs anchor off `Content Approval:` by pixel offset, so changing that text or the block
  layout breaks placement (see `references/docusign.md`).
- Build the PDF export URL: `https://docs.google.com/document/d/<COPY_ID>/export?format=pdf`.
- Sanity-read the filled copy to confirm no stray `[token]` remains.

### 4. Build the DRAFT envelope
- `createEnvelope` with `status:"created"`, the export URL as the document `remoteUrl`, and the two
  signers. Each signer gets **three tabs** on their column — **Name** (`textTabs`, pre-filled `value` =
  signer's name), **Signature** (`signHereTabs`), **Date** (`dateSignedTabs`, auto-stamped) — all anchored
  off `Content Approval:` with the VERIFIED pixel offsets in `references/docusign.md`. Capture the returned
  **envelopeId**. (If you ever re-lay-out the MASTER signature block, re-calibrate the offsets per the
  reference before sending — placement is template-specific.)

### 5. Approval gate (Kerri Console)
- Create a Kerri Console task under **Hardware FYI**, title `<JOBID> — <Company> — Partner Program contract`.
- Use `node scripts/console-task-api.mjs create --status needs_approval --agent-slug send-partner-contract --property-slug hardware-fyi --job-ref <JOBID> --external-ref kerrios:contract:<JOBID>:<sha12>`.
- Body: filled-field summary (legal name, signer + email, fee, term, deliverables, payment terms, start
  date), the **filled Google Doc link**, and the **envelopeId**. Do NOT send until Brian approves.

### 6. Send on approval
- On Brian's per-deal approval, flip the envelope to `sent` (update status / send). DocuSign emails the
  client the signing link and routes to the Hardware FYI signer. `approvalSource` records where/when
  Brian approved. Don't also send a separate cover email by default (avoid double-touch).

### 7. Record to the brain
- `data/jobs.json` — contract-sent entry (envelopeId + filled-doc id).
- `data/companies.json` — update the company entry.
- `brain/wiki/companies/<slug>.md` — contract sent, envelopeId, doc link, date, terms.
- Append `brain/log.md` — `## [date] contract-sent | <jobId>-<slug> | Kerri`.
- Update `NOW.md` — clear any related in-flight flag.
- Legal write → follow `brain/wiki/workflows/multi-agent-write-rules.md` (material writes via PR).

## First live deal — Duro Labs (H0014)
- Copy title: **`Duro x Hardware FYI 2026`**.
- Signer: **Robert Woo**, CEO, `robert@durolabs.co` (waiting as of 2026-06-01). Hardware FYI signer: **Brian**.
- Terms: **$12,500 / 6 months** Partner Program — Tools We Love weekly feature + logo + one-click
  product-page link. Payment: Net 30.
- Confirm before send: **Duro legal entity name** + **start date** (logo + product-page URL are for
  fulfillment, separate from the contract).
