# Savant

scope: product · updated: 2026-06-12

Savant is KMG's production operating system app for the company: the Rails app
formerly called **Kerri Console** / **KMG Console**. When Brian says "Savant"
in an operations, approvals, CRM, agent, or production-app context, treat it as
the live `kerrihq-rails` app and its API.

Current production surface:
- **App:** `kerrihq-rails`
- **Production URL:** `https://kerrihq-rails-xtua.onrender.com`
- **Deploy host:** Render service `srv-d8kvn767r5hc739fjo9g`
- **Repo:** `kerrihq/kerrihq-rails`
- **API base:** `https://kerrihq-rails-xtua.onrender.com/api/v1`
- **Old names / aliases:** Kerri Console, KMG Console, Console, production Rails app. If Brian casually says "Railway app" in this context, verify the live host; as of 2026-06-12 the app is on Render.

## Core facts

- **Parent:** [[kmg]]
- **Role:** central source of truth for structured operations: CRM, pipeline,
  tasks, approvals, revenue surfaces, newsletter inventory, agent run reporting,
  scoped brain records, and sponsor assets.
- **Human surface:** Brian/Ari/Benji/Zach see permissioned views based on their
  role and domain grants.
- **Agent surface:** agents read/write through the V1 API and MCP tools using
  scoped keys from `~/.kerri-chief/secrets/kerrihq.env`.
- **Slack:** `#savant`

## Operating Rules

- Savant is the source of truth for companies, contacts, deals, tasks,
  approvals, agent runs, and newsletter inventory.
- This git brain remains the source of truth for prompts, durable operating
  rules, decisions, and compact how-we-work context.
- Google Sheets mirrors and `data/companies.json` are verification/offline
  fallbacks only. Do not treat them as the primary store when Savant is
  reachable.
- `scripts/console-task-api.mjs` is still the helper filename, but it talks to
  Savant.

## Related

- [[kmg]] — parent
- [[../workflows/kmg-console-approvals]] — Savant approvals/tasks operating surface
- [[../workflows/console-reporting]] — agent reporting and task filing contract
- [[../workflows/customer-id-protocol]] — CRM lookup/write protocol
- [[../decisions/2026-06-11-brain-console-storage-split]] — storage split: brain vs Savant
- [[../decisions/2026-06-11-console-brain-port]] — permissioned brain port into Savant
