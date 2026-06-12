# Source Of Truth Boundaries

KerriOS owns durable company context and source-of-truth routing.

The brain folder owns the human-readable compiled wiki view. It is better than a raw chat thread for browsing and editing, but it is not the only source of truth.

Savant (`kerrihq-rails`, formerly Kerri/KMG Console) owns the dynamic production
operating records: CRM companies/contacts/deals, tasks, approvals, revenue
surfaces, newsletter inventory, agent runs, and permissioned brain records.
Use `https://kerrihq-rails-xtua.onrender.com/api/v1` for agent reads/writes
when Savant is reachable.

Chat threads and email threads can provide evidence and working context, but they do not become durable truth until a reviewed KerriOS seed or wiki update succeeds.

Raw sources belong under `raw/` and should stay append-only. Uncertain claims belong under `candidates/` until promoted.
