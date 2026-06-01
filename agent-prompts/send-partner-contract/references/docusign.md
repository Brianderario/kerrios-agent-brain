# Contract send — DocuSign + Google Docs reference

Flow: **duplicate the MASTER Google Doc → fill it → export to PDF URL → upload to DocuSign via
`createEnvelope` (remoteUrl) → send.** No stored DocuSign template (Brian's call — the DocuSign-built
template was "horrible").

## MASTER template (Google Doc)

- **Title:** `[MASTER TEMPLATE] Company x Hardware FYI — Partner Program SOW`
- **fileId:** `1s_hJDii3rx466ymtDyQKEyDFxKuMkZKDsfD8ME19BSY`
- **Owner:** brian@kerrihq.com · current parent folder: `1Mq7iHmhwyj8ZvQJf4J-jTEx5M7ksSeQA`
- Tokenized copy of Brian's "(TEMPLATE) Hardware FYI SOW Contract" (`1Wrs4XltleQ9TCMLsAJWB95lYHOeyCe8QV4eHbJHyJzA`),
  formatting preserved, prior-client specifics removed.
- **Never edit the MASTER per-deal.** Always `copy_file` it first, then fill the copy.

### Fill tokens (square brackets — matches Brian's style)

| Token in doc | Fill with | Notes |
|---|---|---|
| `[Company]` | client legal entity name | appears 2x (intro line + left signature header) — one replace fills both |
| `[Date]` | effective/start date | |
| `[Deliverables]` | deal deliverables | pull canonical Partner Program wording from `brain/wiki/properties/hardware-fyi.md` |
| `[Platforms]` | e.g. "Email Newsletter (The Analog)" | |
| `[Schedule]` | e.g. "6 months from start" | |
| `[Fee]` | e.g. "$12,500 USD" | |
| Payment Terms | literal default `Net 30 upon receipt of invoice` | only change if the deal differs |

### Signature anchors (clean unique labels — no junk tokens)

The two signature labels are made **unique** so DocuSign can anchor each party's field correctly:

- Left (client): label is `Signature ([Company]):` in the MASTER → becomes e.g. `Signature (Duro):` after
  fill. Anchor the client `signHere` to that exact string (`Signature (<Company>):`).
- Right (Hardware FYI): label is `Signature (Hardware FYI):` (constant). Anchor the HFYI `signHere` to it.
- **No `dateSigned` tabs needed** — DocuSign auto-stamps the signing date. (Add one with `anchorXOffset`
  off the signature label only if a visible date field is ever required.)
- Name/Title lines are left blank for signers (DocuSign captures signer identity); pre-fill as text tabs
  only if Brian asks.

## DocuSign account (sender)

- Benjamin Chia / `info@hardwarefyi.com` · **accountId** `8a7d430a-a272-455a-8d51-b5732d2becf4`
- Sender account only; Brian + client are the signing parties.

## Publicly-fetchable PDF (required for `createEnvelope` remoteUrl)

`createEnvelope` ingests the document from a **public** `remoteUrl` (no base64 upload). Google Docs
export URL: `https://docs.google.com/document/d/<COPY_ID>/export?format=pdf`. For DocuSign's servers to
fetch it, the copy must be link-viewable.

- **There is no Drive permission-set MCP tool** (only `get_file_permissions`). So the copy must inherit
  public link-sharing from its **parent folder**.
- **One-time setup:** Brian creates/sets a folder to "Anyone with the link → Viewer", e.g.
  `Hardware FYI — Contracts (link-view)`. Record its folderId here:
  - **CONTRACTS_FOLDER_ID:** `1Rgz0F1A20lVNfwCD2C0PKhMB4W2XUsuX` (confirmed link-shared, anyone-with-link, 2026-06-01)
- The skill copies the MASTER into that folder (`copy_file(parentId: CONTRACTS_FOLDER_ID)`); the export
  URL is then publicly fetchable. Security note: the contract is briefly reachable by anyone with the
  long unguessable URL. Acceptable for send; can be tightened after completion.

## `createEnvelope` call shape (remoteUrl + anchor tabs)

```
createEnvelope(accountId, envelopeDefinition: {
  status: "sent",                       // "created" while building/awaiting approval
  emailSubject: "<Company> x Hardware FYI — Partner Program Agreement",
  documents: [{ documentId: "1", name: "<Company> x Hardware FYI <Year>.pdf",
               remoteUrl: "https://docs.google.com/document/d/<COPY_ID>/export?format=pdf" }],
  recipients: { signers: [
    { recipientId: "1", routingOrder: "1", name: "<Client signer>", email: "<client email>",
      tabs: { signHereTabs: [{ documentId: "1", recipientId: "1", anchorString: "Signature (<Company>):", anchorUnits: "pixels", anchorXOffset: "5", anchorYOffset: "-6" }] } },
    { recipientId: "2", routingOrder: "2", name: "Brian D'Erario", email: "brian@hardwarefyi.com",
      tabs: { signHereTabs: [{ documentId: "1", recipientId: "2", anchorString: "Signature (Hardware FYI):", anchorUnits: "pixels", anchorXOffset: "5", anchorYOffset: "-6" }] } }
  ] }
})
```

- Build with `status: "created"` (draft) for the approval gate; only flip to `"sent"` after Brian's
  approval (`approved=true` + `approvalSource`).
- Routing order shown client-first; adjust if Brian should counter-sign first.

## Duro Labs (H0014) — first run values

- `[Company]`: Duro legal entity — **confirm full legal name with Robert**
- `[Date]`: **TBD** — start date from Robert
- `[Deliverables]`: Partner Program (6 months) — 2x/week feature in Tools We Love; logo in Partner
  Program sponsor image + website; one-click product-page link
- `[Platforms]`: Email Newsletter (The Analog) · `[Schedule]`: 6 months from start · `[Fee]`: $12,500 USD
- Signers: Robert Woo `robert@durolabs.co` (client) · Brian (Hardware FYI)
- Copy title: `Duro x Hardware FYI 2026`
