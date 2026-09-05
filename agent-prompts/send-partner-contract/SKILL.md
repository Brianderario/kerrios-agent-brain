---
name: send-partner-contract
description: Prepare a sponsor agreement from approved deal terms, then send for signature only after exact-action approval.
---

# Send Partner Contract — Kerri skill

Turns a **won** Hardware FYI partner/sponsor deal into a signed-contract send. The mechanics, per Brian
(2026-06-01): **duplicate the master Google Doc → fill in the outstanding info → upload that doc to
DocuSign → send.** No pre-built DocuSign template.

You are Kerri. Follow the current KMG playbook and the owning repository's approval boundaries. Read `references/docusign.md` (this folder)
before acting — it holds the MASTER doc fileId, the fill tokens, the signature anchors, the DocuSign
accountId, the contracts-folder requirement, and the exact `createEnvelope` call shape.

## Hard rules (do not bypass)

- **Approval-gated.** A contract is an **external send** + a **legal commitment** → hard gate. Build the
  envelope as a DRAFT (`status:"created"`). Never send without `approved=true` + `approvalSource`
  (where/when Brian approved), routed through Kerri Console first.
- **No double-send.** Before building, prove no contract already went out for this jobId (brain `log.md`
  / `data/jobs.json` / DocuSign `getEnvelopes`). A re-send needs explicit `SECOND SEND APPROVED BY BRIAN`.
- **jobId is per-customer.** CUSTOMER LOOKUP first; reuse the existing jobId.
- **Never edit the MASTER per-deal.** Always copy it first, fill the copy. The MASTER is the template.
- **Terms from the approved Savant deal + evidenced client thread, not template defaults.** Fill every `[token]`. If a required
  value is missing (legal entity name, start date), STOP and get it from Brian/the client — never guess.
- **S/W boundary.** Hardware FYI only. Never issue an S/W contract here.
- **Record or it didn't happen** (step 7).

## Workflow (Perceive → Build → Approve → Send → Record)

### 1. Perceive — resolve the deal
- Identify client + signer (name, email) from Brian's request and the deal email thread.
- CUSTOMER LOOKUP in the KMG Console (`GET /api/v1/companies?domain=<d>`, the CRM of record; snapshot
  `data/companies.json` is read-only offline fallback) → reuse the **jobId**.
- Pull agreed **fee, term, deliverables, start date, legal entity name** from the company's Console
  record (`crm_notes` + deals) + `data/jobs.json` + the won-deal thread. Use the canonical Partner
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

### 7. Record verified delivery
- `data/jobs.json` — contract-sent entry (envelopeId + filled-doc id).
- KMG Console: `PATCH /companies/:id` appends contract sent, envelopeId, doc link, date, terms to the
  record's `crm_notes` (compact, source-linked), then refresh the snapshot
  (`node scripts/console-crm-snapshot.mjs`). `brain/wiki/companies/` is frozen, no wiki page edit.
- Append any needed local activity entry through `node scripts/brain-log-entry.mjs`; do not hand-edit the log.
- Update `NOW.md` — clear any related in-flight flag.
- Preserve native envelope delivery proof in the owning Savant task/CRM record. Local legacy jobs are reconciliation state; do not create new archived wiki truth. Material policy changes follow the reviewed commit/PR path.
