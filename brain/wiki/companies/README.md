# FROZEN — companies live in the KMG Console CRM

As of 2026-06-11 (decision: [[../decisions/2026-06-11-brain-console-storage-split]]), the KMG Console (kerrihq-rails) is the system of record for companies, contacts, and deals. Every page in this directory was backfilled into the Console.

- **Do not create or update pages here.** New companies get Console records (`POST /api/v1/companies`); relationship facts go in the record's `crm_notes`.
- Lookup: `GET /api/v1/companies?domain=<d>` or `?job_id=<id>` with `KERRIHQ_AGENT_API_KEY` from `~/.kerri-chief/secrets/kerrihq.env`. Offline fallback: read-only snapshot `data/companies.json`.
- Legacy pages below remain for git history and one-time reference only; they are no longer maintained and may be stale.
- **Exception:** [[standard-and-works]] stays live — the S/W partnership boundary is how-we-work knowledge, not CRM data.
