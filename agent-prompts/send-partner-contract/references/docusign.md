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
- **Signature block (2026-06-02):** two columns (`[Company]` left / `Hardware FYI` right), each with three
  fields — `Name:`, `Signature:`, `Date:`. The skill places a tab on every one (see "Signature block"
  below). The old `Title:` field was replaced by `Date:` on this date.

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

### Signature block — three fields per party: **Name / Signature / Date**

Per Brian (2026-06-02), each column's signature block has three fields that the skill MUST populate:
`Name:`, `Signature:`, `Date:` (the template's old `Title:` line was changed to `Date:` — MASTER updated
2026-06-02). So every signer gets **three** tabs: a pre-filled **Name** text tab, a **signHere**, and a
**dateSigned**.

All labels (`Name:` / `Signature:` / `Date:`) appear in BOTH columns, so the label text is NOT unique —
DON'T anchor on the labels directly (DocuSign places a tab at every match). Instead, anchor every tab off
the single unique string `Content Approval:` and use `anchorXOffset` to pick the column + `anchorYOffset`
to pick the line:

- **Anchor string:** `Content Approval:` — appears exactly once, inside the always-present "General
  Terms" paragraph just above the signature block. The vertical gap from it to each signature line is
  **constant** (that boilerplate is fixed), so placement holds even as `[Deliverables]` length varies.
- **Anchor settings (all tabs):** `anchorUnits` `pixels`, `anchorMatchWholeWord` `true`.
- **⚠ Per-tab-type Y quirk:** at the SAME anchorYOffset, DocuSign renders `text`/`dateSigned` tabs ~22px
  LOWER than a `signHere`. The offsets below already bake in that correction — use them verbatim.

**Calibrated offsets — VERIFIED 2026-06-02** (resolved x/y read back from draft probes against the
current MASTER; all six tabs land exactly on their label lines):

| Tab (type) | Party | anchorXOffset | anchorYOffset | resolves to (x, y) |
|---|---|---|---|---|
| Name (`textTabs`) | client / left | `-34` | `97` | (124, 443) — on left Name line |
| Signature (`signHereTabs`) | client / left | `-14` | `148` | (140, 472) — on left Signature line |
| Date (`dateSignedTabs`) | client / left | `-39` | `159` | (119, 505) — on left Date line |
| Name (`textTabs`) | Hardware FYI / right | `251` | `97` | (409, 443) — on right Name line |
| Signature (`signHereTabs`) | Hardware FYI / right | `271` | `148` | (425, 472) — on right Signature line |
| Date (`dateSignedTabs`) | Hardware FYI / right | `251` | `159` | (409, 505) — on right Date line |

- **Name** is a `textTabs` entry pre-filled with `value` = the signer's name (client signer name for the
  left column, `Brian D'Erario` for the right). It renders the typed name on the Name line.
- **Date** is a `dateSignedTabs` entry — DocuSign auto-stamps each party's actual signing date when they
  sign. No value to pre-fill.
- These offsets are template-specific (the current MASTER layout). If the MASTER signature block is ever
  re-laid-out, RE-CALIBRATE: drop probe `signHere` tabs anchored on `Name:` / `Signature:` / `Date:` /
  `Content Approval:` in a `status:"created"` draft, read resolved x/y via `listRecipients`
  (`include_tabs=true`), recompute, and re-verify before sending.

> History: the pre-2026-06-02 calibration placed a single `signHere` at `anchorXOffset 60/360`,
> `anchorYOffset 110` → resolved to x≈214/514, y≈497, which drifted into the column gap and floated
> between the Signature and Date lines. That's the "off" placement Robert Woo flagged on the Duro send.
> Replaced by the table above.

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
    // CLIENT — left column. Name + Signature + Date.
    { recipientId: "1", routingOrder: "1", name: "<Client signer>", email: "<client email>",
      tabs: {
        textTabs:       [{ documentId: "1", recipientId: "1", tabLabel: "name-client",  value: "<Client signer>", anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "-34", anchorYOffset: "97"  }],
        signHereTabs:   [{ documentId: "1", recipientId: "1", tabLabel: "sig-client",                              anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "-14", anchorYOffset: "148" }],
        dateSignedTabs: [{ documentId: "1", recipientId: "1", tabLabel: "date-client",                            anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "-39", anchorYOffset: "159" }]
      } },
    // HARDWARE FYI — right column. Name + Signature + Date.
    { recipientId: "2", routingOrder: "2", name: "Brian D'Erario", email: "brian@hardwarefyi.com",
      tabs: {
        textTabs:       [{ documentId: "1", recipientId: "2", tabLabel: "name-hfyi",  value: "Brian D'Erario", anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "251", anchorYOffset: "97"  }],
        signHereTabs:   [{ documentId: "1", recipientId: "2", tabLabel: "sig-hfyi",                            anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "271", anchorYOffset: "148" }],
        dateSignedTabs: [{ documentId: "1", recipientId: "2", tabLabel: "date-hfyi",                           anchorString: "Content Approval:", anchorUnits: "pixels", anchorXOffset: "251", anchorYOffset: "159" }]
      } }
  ] }
})
```

Offsets are the VERIFIED 2026-06-02 values from the calibration table above. The client Name `value` is the
client signer's name; the HFYI Name `value` is the counter-signer (default `Brian D'Erario`).

- Build with `status: "created"` (draft) for the approval gate; only flip to `"sent"` after Brian's
  approval (`approved=true` + `approvalSource`).
- Routing order shown client-first; adjust if Brian should counter-sign first.

## Duro Labs (H0014) — first run, FINAL approved values (2026-06-01)

Filled doc: `Duro x Hardware FYI 2026` — docId `1eqRnbhCm06LsA2xlnH6PWypwD_g97znH2eQuwBiPRhU`
(in CONTRACTS_FOLDER). PDF: `…/1eqRnbhCm06LsA2xlnH6PWypwD_g97znH2eQuwBiPRhU/export?format=pdf`

- `[Company]`: `Duro` (they sign as "Duro" — confirmed via the signed Kinetic SOW)
- `[Date]`: `June 1, 2026`
- `[Deliverables]`:
  - Partner Program (6 Months)
  - 1x per week feature in the Tuesday Issue
  - 3x Primary Placements
  - Logo in the Partner Program sponsor image + website placement
  - One-click product page link
- `[Platforms]`: `Email Newsletter` · `[Schedule]`: `June 2026 – December 2026 (6 months)` · `[Fee]`: `$12,500 USD`
- Payment Terms: Net 30 (default)
- Signers: Robert Woo `robert@durolabs.co` (client) · Brian D'Erario (Hardware FYI, "Head of Partnerships")
- Copy title: `Duro x Hardware FYI 2026`
- Status: **reviewed + approved by Brian; awaiting upload to DocuSign.**
