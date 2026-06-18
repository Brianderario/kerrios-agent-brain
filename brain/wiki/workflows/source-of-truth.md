# Source Of Truth Boundaries

scope: workflow · updated: 2026-06-17

**Savant (`kerrihq-rails`) is the source of truth for the entire company brain** since the 2026-06-17 hub migration ([[../decisions/2026-06-17-savant-as-company-hub]]). It owns the dynamic production operating records (CRM companies/contacts/deals, tasks, approvals, revenue surfaces, newsletter inventory, agent runs) AND the durable knowledge (workflows, decisions, properties, events, meetings, learnings, agent-instruction/memory records, and the agent operating-layer prompts). Agents read it via `https://kerrihq-rails-xtua.onrender.com/api/v1` (`scripts/brain-api.mjs`), and humans read/author it in the `/brain` and `/agents` screens.

## What git (`brain/`) is now

The KerriOS git repo is the **backing store**, not the source of truth. After the migration it has three legitimate, reduced roles:

1. **Versioned audit + offline fallback.** Every knowledge record mirrors to a git file, so there is a full SHA-stamped history and a readable copy agents fall back to when Savant is unreachable.
2. **The runner's on-disk copy.** Claude Code loads skills/prompts from the filesystem, so the `agent-prompts/` working tree must exist on disk. Git is how that copy is maintained and synced.
3. **Transient live state.** `NOW.md` (session baton) and `brain/log.md` (running history) live only in git by design — they are working state, never durable knowledge, and are not imported into Savant.

The git wiki under `brain/wiki/` is no longer "the compiled view you edit." It is the mirror that the nightly sync keeps aligned with Savant.

## Reconciliation (how the two stay consistent)

The nightly brain-push reconciles both directions with each record's content hash as the arbiter: Savant edits export to git (`scripts/savant-to-brain-export.sh`), then git edits import to Savant (`scripts/brain-to-savant-sync.sh`). Neither side overwrites a change the other made since the last sync. The one true conflict — the *same page* edited in both Savant and git within one sync window — currently resolves git-wins; it is rare and cannot corrupt data (a future refinement is to deadlock-and-flag instead). Operating-layer prompts are mirrored read-only; prompt changes go through the approval-gated `AgentAdjustmentRequest` channel, never a silent write.

## Unchanged

- **Chat is never canonical.** Chat and email threads are evidence and working context; they become durable truth only when a reviewed Savant record (or its git mirror) is written.
- **Raw evidence** stays append-only (`brain/raw/`, mirrored as `source_pointer` records). **Uncertain claims** stay `candidates/` until a human promotes them in Savant.
- **The S/W boundary, approval gates, phantom-data rule, and send-authority protections all hold**, in both sync directions.
