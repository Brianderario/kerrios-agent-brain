# Decision: Hardware FYI Outreach Motion — Scale-Up

scope: decision · updated: 2026-05-29 · builds on: [[2026-05-24-cold-outreach-launch]], [[2026-05-24-lead-research-launch]]

## Decision

Develop the existing cold-outreach + lead-research sub-agents into a durable sponsor-sales engine for Hardware FYI: source a thousands-deep lead pool, hand enriched contacts to the marketing team via the CRM Sheet, and ship ~10 personalized cold emails every weekday morning that Brian approves as a single daily batch.

Not a rebuild — a ramp plus three targeted changes to live agents.

## Brian's calls (2026-05-29 chat)

1. **Batch approval.** The morning send is one approval, not ten. Cold-outreach posts a single `☀️ COLD BATCH <date>` Google Task with all drafts inlined; one checkbox sends the lot. Per-draft drop via changing `SEND #n`→`SKIP #n`. (Autonomy stays Stage 1 — still gated, just batched. See [[2026-05-25-living-brain-and-autonomy-ladder]].)
2. **Slow & safe, one domain.** ~10/day from hardwarefyi.com with warmup. The existing 10/day + 50/rolling-7 caps already encode this (10×5 = 50/wk). No multi-domain infra.
3. **Leads land in the CRM Sheet.** New "Leads" tab in the canonical HWFYI Sheet (`fileId 1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk`) — no new documents. This is the marketing-team handoff.
4. **Broad ICP, 3 lanes:** lookalikes of proven sponsors · sponsors/exhibitors of major ME/EE & manufacturing conferences · anyone selling software to US hardware manufacturers. "You should know best what is best."

## What changed

| Piece | Change |
|---|---|
| `agent-prompts/kerri-cold-outreach/SKILL.md` | Weekly Mon → daily M–F. One `☀️ COLD BATCH` task replaces per-email `❄️ COLD-` tasks. CAN-SPAM footer (opt-out + postal address) now mandatory on every draft. |
| `agent-prompts/kerri-inbox-sweep/SKILL.md` | New COLD BATCH handler: one checkbox sends all `SEND #n` drafts. New STEP 2b auto-DNC: unsubscribe replies + hard NDR bounces auto-append to `cold-do-not-contact.json` and flip lead `status` to DNC. Lead `status` write-back to pool + CRM on send. |
| `agent-prompts/kerri-lead-research/SKILL.md` | 3-lane ICP made explicit. Canonical pool `data/leads-master.json` (superset of queue). Apollo bulk endpoints + `backfill N` mode for scale. CRM mirror via `sheets-append.mjs`. Daily evening top-up cadence. |
| `data/lead-research/conferences.json` | Expanded 10 → 20 (IPC APEX, PCB West, 3DEXPERIENCE/SOLIDWORKS World, Autodesk University, ASME IMECE, RoboBusiness, The Battery Show, IEEE ECCE, Advanced Mfg/IME, CES). |
| `scripts/sheets-append.mjs` (new) | Sheets v4 upsert (by jobId) into the "Leads" tab. Reuses kerri-gdocs OAuth + node_modules. CSV fallback + exit 3 when the spreadsheets scope is missing. |
| `data/leads-master.json` (new) | Canonical lead pool, gitignored (PII). |

## Funnel + lead lifecycle

`lead-research` (evening) → **pool** `leads-master.json` (`status: new`) → **CRM tab** (marketing works it) → top of pool with a hook → **queue** (`queued`) → `cold-outreach` (morning) drafts batch → Brian approves → `inbox-sweep` sends (`emailed`) → reply (`replied`) or unsubscribe/bounce (`DNC`). jobId is the stable per-company key across all stages ([[../workflows/customer-id-protocol]]).

## Open items / dependencies

- **One-time re-auth required:** the kerri-gdocs OAuth token only had `documents + drive.file + tasks`. Added `spreadsheets` to `~/.kerri-chief/kerri-gdocs-mcp/setup-auth.mjs`; Brian must re-run it once before the CRM tab writes succeed. Until then `sheets-append.mjs` writes a CSV fallback (verified: exit 3 + `data/leads-crm-export-<date>.csv`).
- **Postal address — DROPPED as a blocker (Brian, 2026-05-30).** Brian's call: don't gate sends on a CAN-SPAM postal address (he's run cold email without one; at 10/day the enforcement risk is negligible, and it was a restriction Kerri introduced unprompted, not an existing org rule). Cold emails now carry only the one-line "reply unsubscribe" opt-out (kept because the auto-suppression keys on it); the postal address is included ONLY if recorded in `brain/wiki/properties/hardware-fyi.md`, otherwise omitted silently. If Brian later wants full CAN-SPAM compliance, record an address (real LLC address, PO box, or virtual mailbox all qualify) and the footer picks it up automatically.
- **Scheduled tasks not yet wired:** these two agents have canonical prompts but no live cron. Daily activation (lead-research evening top-up + cold-outreach ~9am M–F) and the initial large Apollo backfill are held pending Brian's go (credit spend + live automation).
- **Deliverability warmup:** verify SPF/DKIM/DMARC on hardwarefyi.com and ramp gradually to the 10/day steady state.

## Related

- [[2026-05-24-cold-outreach-launch]] · [[2026-05-24-lead-research-launch]]
- [[../properties/hardware-fyi]] — products, pricing, canonical Sheet, (postal address)
- [[../candidates/2026-05-24-kinetic-2026-sponsor-roster]] — lookalike seed
