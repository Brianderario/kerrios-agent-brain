# DocuSign reference — send-partner-contract

## Connected account (sender)

- **Account:** Benjamin Chia / `info@hardwarefyi.com`
- **accountId:** `8a7d430a-a272-455a-8d51-b5732d2becf4`
- **Base URI:** https://na4.docusign.net · Plan: Standard Annual (unlimited envelopes)
- Brian/the client are the **signing parties inside the document**; Benji's account is only the
  sending account. (Confirmed with Brian 2026-06-01.)

## MCP tools (server `e2ce52e7-...`)

| Need | Tool |
|---|---|
| List/find templates | `getTemplates(accountId, search_text)` |
| Build envelope from template (PRIMARY) | `createEnvelopeFromTemplate(accountId)` |
| Fill prefill + recipient tabs | `updateEnvelopeTabs(accountId, envelopeId, documentId|recipientId, tabs)` |
| Verify recipients/tab values | `listRecipients(accountId, envelopeId, include_tabs:true)` |
| Double-send check | `getEnvelopes(...)` |

> The MCP has **no create-template endpoint** — the reusable template is built once in the DocuSign web UI
> (see below), then referenced here by `templateId`.

## Reusable template (one-time setup)

Built from Brian's **"(TEMPLATE) Hardware FYI SOW Contract 5.4.26"**
(`https://docs.google.com/document/d/1Wrs4XltleQ9TCMLsAJWB95lYHOeyCe8QV4eHbJHyJzA/edit`), after cleaning
out the prior client's specifics (Dirac, $15,000, Dirac presentation, fixed deliverables) so every
per-deal value is a blank field.

- **Cleaned upload-ready doc** (with `{{token}}` anchors + build instructions):
  `https://docs.google.com/document/d/1cPALOZ5wMnPrj9ashn_d5DFqznla8xwrlBEycI-te9g/edit`
  → upload THIS to DocuSign to build the template.

- **Template name:** `Hardware FYI Partner Program Agreement`
- **templateId:** `__TODO_FILL_AFTER_UI_BUILD__`  ← update once created; verify with `getTemplates(search_text:"Partner")`
- **Roles (recipients):**
  - `Partner` — signer 1 (the client; e.g. Robert Woo / Duro)
  - `Hardware FYI` — signer 2 (Brian)
- **Sender prefill textTabs:** `ClientLegalName`, `EffectiveDate`, `Deliverables`, `Platforms`,
  `Schedule`, `Fee`, `PaymentTerms`
- **Recipient tabs (each role):** Signature, Full Name, Title, DateSigned

## Field → tab mapping (source of values)

| Contract location | Tab label | Source |
|---|---|---|
| "between ___ and Hardware FYI" + signer block header | `ClientLegalName` | client legal entity name (confirm w/ client) |
| Date | `EffectiveDate` | agreed start date |
| Services/Deliverables Description | `Deliverables` | `brain/wiki/properties/hardware-fyi.md` Partner Program wording + deal specifics |
| Platforms | `Platforms` | usually "Email Newsletter" (+ events if in scope) |
| Campaign Schedule (Milestone Dates) | `Schedule` | term, e.g. "6 months from start" |
| Fees/Rate | `Fee` | agreed fee, e.g. "$12,500 USD" |
| Payment Terms | `PaymentTerms` | default "Net 30 upon receipt of invoice" |

## Duro Labs (H0014) values for first run

- `ClientLegalName`: Duro legal entity — **confirm with Robert** (page shows "Duro"; need full legal name)
- `EffectiveDate`: **TBD** — get start date from Robert
- `Deliverables`: Partner Program (6 months) — 2x/week feature in Tools We Love; logo in Partner Program
  sponsor image + website; one-click product-page link. (Trim to the exact Duro scope Brian closed.)
- `Platforms`: Email Newsletter (The Analog)
- `Schedule`: 6 months from start
- `Fee`: $12,500 USD
- `PaymentTerms`: Net 30 upon receipt of invoice
- Recipients: Partner = Robert Woo (`robert@durolabs.co`) · Hardware FYI = Brian

## Fallback (no stored template)

If the UI template isn't built, use `createEnvelope` with a cleaned PDF of the contract and place
fields via **anchor strings** (e.g. text tab anchored to `"Fees/Rate:"`, signature tab anchored to
`"Signature:"`). More per-send placement logic; only use if the stored-template path is unavailable.
