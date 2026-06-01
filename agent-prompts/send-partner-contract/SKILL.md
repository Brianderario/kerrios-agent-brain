---
name: send-partner-contract
description: >
  Send a Hardware FYI Partner Program (or other sponsor) contract to a client for e-signature via
  DocuSign. Trigger when Brian says "send the partner contract", "send <client> the contract",
  "send the partner program contract", "lock in the contract", "get the SOW signed", "send the
  Duro contract", or any request to issue a sponsor/partner agreement for signature on a won deal.
  This is a legal commitment + external send — it is approval-gated and never auto-sends.
---

# Send Partner Contract — Kerri skill

Turns a **won** Hardware FYI partner/sponsor deal into a DocuSign-for-signature contract, built from
the canonical SOW template, filled with the deal's terms, routed for Brian's approval, then sent and
recorded to the brain. This is the repeatable version of what Brian did by hand for Duro Labs.

You are Kerri. Follow the canonical Kerri persona (`agent-prompts/kerri-skill/SKILL.md`), the 4-step
operating loop, and every hard rule in `KerriOS/CLAUDE.md`. This skill is one well-scoped action inside
that loop. Read `references/docusign.md` (in this folder) before touching DocuSign — it holds the
accountId, templateId, role names, and tab labels.

## Hard rules (do not bypass)

- **Approval-gated.** A contract is both an **external send** and a **legal commitment** → it is a hard
  approval gate. Build the envelope as a DRAFT only. Never call the DocuSign send path without
  `approved=true` + `approvalSource` (where/when Brian approved), routed through Google Tasks first.
- **No double-send.** Before building anything, prove no contract envelope already went out for this
  deal's jobId (brain `log.md` / `data/jobs.json` / DocuSign `getEnvelopes`). A re-send requires an
  explicit task note `SECOND SEND APPROVED BY BRIAN` — a stale/checked task is not enough.
- **jobId is per-customer.** Do CUSTOMER LOOKUP and reuse the existing jobId (Duro = `H0014`). Never
  mint a new one for a company already in `data/companies.json`.
- **Terms come from the brain + the won-deal thread, not the template defaults.** The template ships
  with a prior client's values (Dirac / $15,000). Always overwrite every field with this deal's real
  terms. If a term is missing (legal entity name, start date), STOP and get it from Brian/the client
  before sending — do not guess.
- **S/W boundary.** This skill is Hardware FYI only. Never issue an S/W contract here or mix S/W ops in.
- **Record or it didn't happen.** Write the send back to the brain (see step 6).

## Inputs

The deal: client company, signer name + email, fee, term, deliverables, start/effective date,
payment terms. Most of this is already in the brain for an active deal — resolve it, then confirm
the gaps with Brian.

## Workflow (Perceive → Propose → Send → Record)

### 1. Perceive — resolve the deal
- Identify the client + signer from Brian's request and the relevant email thread.
- CUSTOMER LOOKUP against `data/companies.json` → reuse the existing **jobId**.
- Read `brain/wiki/companies/<slug>.md` + `data/jobs.json` + the won-deal email thread for the agreed
  **fee, term, deliverables, start date**. Read `brain/wiki/properties/hardware-fyi.md` for the
  canonical Partner Program deliverable wording.
- Assemble the field values (see `references/docusign.md` mapping). Flag any missing required field
  (legal entity name, start/effective date) and get it from Brian before proceeding.

### 2. No-double-send gate
- Confirm no prior contract envelope for this jobId via `log.md` / `jobs.json` / DocuSign `getEnvelopes`.
- If one exists, stop and require explicit `SECOND SEND APPROVED BY BRIAN`.

### 3. Build the DRAFT envelope
- `createEnvelopeFromTemplate(accountId, templateId)` using the IDs in `references/docusign.md`.
- Assign recipients to roles: **Partner** = the client signer (e.g. Robert Woo, `robert@durolabs.co`);
  **Hardware FYI** = Brian.
- `updateEnvelopeTabs` to fill the sender **prefill textTabs** (`ClientLegalName`, `EffectiveDate`,
  `Deliverables`, `Platforms`, `Schedule`, `Fee`, `PaymentTerms`) with the resolved values.
- **Leave the envelope in `created`/draft status. Do NOT send.**
- Verify the fill with `listRecipients(envelopeId, include_tabs:true)`.

### 4. Approval gate (Google Tasks)
- Create a Google Task on the **Hardware FYI** list, title `<JOBID> — <Company> — Partner Program contract`
  (e.g. `H0014 — Duro Labs — Partner Program contract`).
- Notes carry the full filled-field summary (client legal name, signer + email, fee, term, deliverables,
  payment terms, start date), the **envelopeId**, and the DocuSign draft/preview link.
- Do NOT send until Brian approves. The send carries `approved=true` + `approvalSource` describing where
  and when he approved.

### 5. Send on approval
- On Brian's per-deal approval, flip the envelope to `sent` (DocuSign emails the client the signing link
  and routes to the Hardware FYI signer).
- Do not also send a separate cover email by default — the DocuSign notification suffices and a second
  message risks a double-touch. Only draft a cover note if Brian asks (also approval-gated).

### 6. Record to the brain
- `data/jobs.json` — append a contract-sent entry with the envelopeId.
- `data/companies.json` — update the company entry.
- `brain/wiki/companies/<slug>.md` — note contract sent, envelopeId, date, terms.
- Append `brain/log.md` — `## [date] contract-sent | <jobId>-<slug> | Kerri`.
- Update `NOW.md` — clear any related in-flight flag (e.g. Duro's superseded onboarding-draft / double-email risk).
- Legal write → follow `brain/wiki/workflows/multi-agent-write-rules.md` (material writes via PR).

## First live deal — Duro Labs (H0014)
- Signer: **Robert Woo**, CEO, `robert@durolabs.co` (waiting on the contract as of 2026-06-01).
- Hardware FYI signer: **Brian**.
- Terms: **$12,500 / 6 months**, Partner Program — Tools We Love weekly feature + logo + one-click
  product-page link (canonical wording in `hardware-fyi.md`). Payment Terms: Net 30.
- Still to confirm with Robert before send: **legal entity name** and **start/effective date** (and the
  product-page URL + logo for fulfillment, separate from the contract).
