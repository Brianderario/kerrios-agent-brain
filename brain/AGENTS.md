# Historical brain and local handoff state

Savant owns current company knowledge. This directory is an archive and offline fallback, except `log.md`, which remains the git-only local activity log.

- Search `index.md` or `routing.md` only when historical/offline context is needed, then read the matching records. Raw sources are evidence, not current operational state.
- Query Savant for current records and confirm approvals, CRM changes, money, inventory, and delivery against their owning live sources. If unavailable, label fallback facts as stale and hold consequential actions that need current proof.
- Do not add company facts, candidates, raw dumps, or new wiki pages here. Write compact source-backed facts through the registered Savant identity under the current KMG playbook.
- Preserve archived source provenance. Do not rewrite historical records to make them appear current.
- Append local activity to `log.md` only with `node scripts/brain-log-entry.mjs` from the repository root; never truncate or rewrite it.
- Standard & Works private operations, finances, compensation, and content drafts stay outside KMG brain and automation state. Approval requirements for sends, pricing, legal, money, permissions, and material CRM judgments remain in force.
