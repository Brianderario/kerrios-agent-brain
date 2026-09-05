---
name: build-loop
description: Complete a requested unattended engineering task list within an explicit stop time and release boundary.
---

# Unattended build loop

Complete the authorized task list one coherent item at a time. Use the target repository's current instructions, setup commands, tests, and release path. An unattended build request does not itself authorize production deployment.

## Establish the run

- Read the task list, target repo instructions, and relevant code. Consult prior solutions only for the area being changed; do not load a full wiki or manufacture three alternative approaches for a routine fix.
- Check the relevant `NOW.md` entry and recent local activity for collisions. Preserve unrelated edits and use an isolated checkout when needed.
- Record the item list, acceptance evidence, release authorization (if any), and stop time in `data/build-loop-runs/<YYYY-MM-DD>.md` in the Kerri policy repo. Keep this ledger compact enough to resume after interruption.
- Default stop time is 07:00 ET, with wrap-up from 06:30 ET. Do not start risky work after 05:00 ET or any new item after 05:30 ET. An explicit invocation may choose another time.

## Work and validation

- Define what proves each item complete. Write a plan for work with meaningful dependencies or uncertainty; a small fix does not need a separate planning artifact. Consider alternative approaches only when the choice matters.
- Implement and test coherent changes. Run the relevant tests/checks and required repository CI before publishing; use the repository's scoped lint commands. Do not run root-wide autocorrect or repeat the full suite after every small step.
- Review the full diff for correctness, authorization, data integrity, API compatibility, and regressions. Fix findings, then rerun affected checks. Establish any pre-existing failure against an isolated baseline; never hide it or weaken a test.
- Keep existing externally consumed API shapes compatible. Do not remove or rename fields as incidental cleanup. Follow the repository's rules for new and touched code.
- If an item needs an unapproved consequential decision, preserve the work, record the exact blocker, and continue independent authorized items. Do not guess or turn a local build into an external message.

## Finish and release

- Without explicit release authorization, finish with validated commits and a reviewable PR under the repository's process. Do not push directly to `main`, merge, mark ready, or deploy merely because the task ran overnight.
- When release is explicitly authorized, use the target repository's gated release path. Verify the deployed revision and every affected service (for Savant, web and worker), health, and item-specific behavior. A local pass or a green build alone is not proof of production behavior.
- If a release fails, preserve evidence and follow the authorized rollback/recovery procedure. Confirm the actual deployed state before choosing a fix. Do not blindly revert or push while another deployment may be in flight; hold any action outside the granted recovery scope.
- Report each item as validated/PR ready, deployed and verified, failed, blocked, or not started, with the corresponding evidence. Never label an unmerged change shipped.
- Capture a reusable solution only when the work revealed a non-obvious lesson; avoid a mandatory diary entry per item. Keep technical lessons in the owning repository's docs, not the archived company wiki.

## Hard boundaries

- No email, Slack messages to humans, signature requests, or other external sends during an unattended build unless separately and explicitly authorized. A build-loop invocation alone supplies none of those approvals.
- Do not edit send-authority files during an unattended build: `data/autonomy-policy.json`, `agent-prompts/kerri-inbox-sweep/SKILL.md`, `agent-prompts/kerri-skill/SKILL.md`, its `references/email.md`, or `agent-prompts/kerri-morning-brief/SKILL.md`. A separately authorized policy-edit task follows the reviewed change path.
- No destructive database commands against existing databases or production data; never use reset as a repair shortcut. Follow the repo's explicit disposable-test-database policy where applicable. No overnight drop/rename migrations or mass data changes.
- No invented prices, revenue, metrics, commitments, permissions, accounts, paid services, or harness configuration changes. Stripe/Mercury access stays read-only; legal, financial and spend decisions stay with Brian.
- Standard & Works private operations, finances, compensation, and content drafts never enter KMG brain, code, or automation state.
- Do not touch another routine's jobs, cursors, trackers, counters, or delivery receipts. Preserve secrets and unrelated work; never force-push.

## Handoff and recovery

Update the ledger and relevant `NOW.md` entry with the actual last/next action. Use the approved local log helper if an activity entry is needed. A Console report is appropriate only for a real decision or requested delivery surface; ordinary progress belongs in the task and ledger.

On resumption, reconcile the ledger with Git, CI, and actual deployed revisions before acting. Resume the remaining authorized work; do not repeat a send, recreate a PR, or revert production merely because a ledger step is incomplete.
