# Automation ownership

Read this reference only when running or maintaining a scheduled workflow. Establish the current owner, enabled state, cadence, model, prompt, and delivery contract in Savant AgentSchedules or the Codex automation manager. Local Claude shims, old model names, and `schedule` frontmatter are compatibility records, not permission to run or create a second schedule.

## Local workflow sources

`agent-prompts/<slug>/SKILL.md` supplies a local workflow only when the owning runtime or invocation selects it. Search for the named slug instead of loading the full fleet. Common sources:

- `kerri-morning-brief` and `kerri-morning-brief-retry`: brief production and guarded recovery. Preserve the delivered-state guard and quiet no-op.
- `kerri-inbox-sweep`: legacy local compatibility/reconciliation mechanics. The retired local worker must not compete with Savant's inbox owner. Savant's deterministic sender owns approved task sends and delivery receipts.
- `kerri-lead-research`, `kerri-cold-outreach`, `kerri-pipeline-followup`: discovery, draft preparation, and warm follow-up respectively. Keep no-work preflights, recipient-level deduplication, and approval gates. Research never sends.
- `kerri-eod-meetings-review`: source-backed meeting follow-up; protect Standard & Works separation.
- `kerri-brain-push`, `kerri-gap-sweep`, `kerri-self-improve`: local maintenance workflows only where explicitly selected. Inspect actual consumers before retiring compatibility files or changing hooks.
- `brian-ceo-social-signal`: its own standalone digest, with its own collection and quiet-run rules.

`agent-prompts/routines.manifest.json` describes local liveness checks. A monitored entry is not proof that a schedule is enabled; an unmonitored entry is not proof that no runtime uses the prompt. Do not repair a stale monitor by activating a retired routine.

## Execution and completion

- Follow the current KMG playbook and live workflow. Define the actual output, completion proof, and stopping conditions; do not add a universal perceive/propose/record/improve ceremony.
- Complete authorized reversible work; approval remains required for external sends, new pricing, legal commitments, money, permissions/identity, and destructive actions. Existing per-action authorization is not permission for a duplicate send.
- Durable company facts go to Savant through the registered identity. Keep local runtime state with its actual owner and preserve cursors, locks, counters, and receipts. Archived wiki pages are not a new write destination.
- Use the current low-noise reporting policy. A no-work run can finish quietly. Do not copy retired text/Slack notification instructions or old Codex closing directives into a new runner.
- This reference does not enable, disable, reschedule, or change the permissions of any workflow. Change only the requested owning configuration and verify it when scheduling work is explicitly authorized.
