# Savant task board workflow

scope: workflow · created: 2026-07-10 · updated: 2026-07-10 · status: **ACTIVE**

Savant Tasks is the only current business task and approval surface. The board
is organized by what can happen next, while the stored status keys remain
stable so prompts, APIs, schedules, and historical cards do not break when a
heading changes.

## Canonical status-to-column contract

| Stable status key | Visible column | Use |
|---|---|---|
| `needs_approval` | Brian's Tasks, or the assigned owner's Tasks | A human must approve, decide, sign, supply information, or authorize a send. |
| `action_needed` | Team Tasks | Concrete team work can proceed now. This is the default result column for a scheduled run. |
| `discuss` | Discuss | A real conversation or clarification is needed. |
| `waiting_reply` | Waiting / On Hold | The next move depends on an outside reply or an explicit hold. The card badge preserves which case applies. |
| `kerri_upgrades` | Kerri Upgrades | Product, automation, or agent-harness improvements. |
| `agent_working` | Approved to Send only when `resolution=approved` and delivery is still pending | System-managed send outbox. Never a manual or scheduled destination. |
| `done` | Archived off the active board | Work is complete and has proof. |

The enum keys and their stored numeric values are compatibility values and must
not be renamed or reordered. Every API or tool response should expose both the
stable `status` and its current human-facing board column.

Ordinary internal agent activity that still has `agent_working` for historical
compatibility renders with Team Tasks. Only an approved, unsent action belongs
in Approved to Send. Once delivery proof is recorded, the card moves to Done.

## Scheduled-run routing

- A schedule's automatic result card uses `task_status`. It defaults to
  `action_needed`, so routine summaries appear in Team Tasks.
- A real approval, missing-information request, or sendable draft is a separate
  `needs_approval` card assigned to Brian, so it appears in Brian's Tasks.
- A schedule may intentionally route a result to `discuss`, `waiting_reply`, or
  `kerri_upgrades`. It may not target `agent_working`.
- `NO_UPDATES` means no result card. Quiet runs remain visible only in the run
  audit trail.

Every active Codex automation carries the same routing block. Local Claude
scheduled-task shims are compatibility mirrors and must load this contract when
they are used. The live executable inventory is the union of Savant `/agents`
and the Codex automation manager, not an older runner table in git.

## Live Savant schedules, verified 2026-07-10

| Schedule | ID | Approval cards | Automatic result card |
|---|---|---|---|
| Hardware FYI Daily Cold Outreach | `4e9cbb6d-3650-41b1-89a5-2fe0363d75ed` | `needs_approval` → Brian's Tasks | `action_needed` → Team Tasks |
| Ironclad Maritime Summit Daily Cold Outreach | `d008ffd1-4407-4d74-8691-ed3b08aaf527` | `needs_approval` → Brian's Tasks | `action_needed` → Team Tasks |

Both stored prompts contain the canonical routing section. Their cadence,
business-day setting, next run, agent, owner, notification mode, and delivery
mode were preserved during the alignment. No maintenance run was triggered.

## Related

- [[console-reporting]]
- [[../decisions/2026-07-09-savant-only-tasks-and-brain-writeback]]
