# Decision: Savant-only tasks and mandatory brain writeback

date: 2026-07-09  
owner: Brian D'Erario  
status: active hard rule

## Decision

Savant Console is the single source of truth for Kerri Media Group business
tasks, scheduled-run actions, inbox-sweep tasks, external-email approvals,
email confirmations, follow-ups, decisions, and execution proof.

Google Tasks is completely retired as an operating workflow. It remains
read-only solely for reconciling legacy history. No agent, automation, helper,
or connector may create, edit, complete, or delete a Google Task, and a Google
Tasks checkbox never authorizes a send.

Every material task or email outcome must also push compact, source-linked
information back into the brain in the same run:

- Savant task/event: current status, approval, owner, due date, decision, and
  execution proof.
- Savant brain/CRM: durable company, person, relationship, commitment, and
  operating facts.
- KerriOS log: compact chronological handoff with source pointers.
- Agent memory: reusable workflow corrections and explicit operating
  preferences, not canonical company facts.

Raw email bodies, credentials, and broad mailbox dumps do not belong in the
brain. If brain writeback fails, the task stays open and records
`brain writeback blocked` with its source pointer. The action is not complete
until the Savant task/event and brain writeback are both verified.

## Supersedes

This decision supersedes every current-work instruction in:

- `2026-05-24-google-tasks-approval`
- `2026-05-26-inbox-sweep-primary-automation`
- the Google Tasks approval row in `2026-06-09-kerri-brian-comms`

Those pages remain historical evidence only.
