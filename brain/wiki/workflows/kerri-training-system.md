# Kerri Training System

scope: workflow · created: 2026-07-09 · owner: Brian / Kerri · status: active

Kerri's company fluency is managed as a living curriculum, not assumed from a large prompt. The curriculum connects what Kerri must know to canonical Savant brain records, realistic scenarios, a weighted rubric, versioned assessment evidence, and a human review gate.

## The operating loop

1. **Orient.** Kerri reads the curriculum index and selects the first module that is unassessed, failed, stale, or has a missing source.
2. **Ground.** She reads every required record from Savant and treats live operating surfaces as authoritative for dynamic facts.
3. **Apply.** She answers the module's scenarios with citations, including what she knows, what she infers, what is still unknown, and what she would do next.
4. **Assess.** She scores each rubric criterion and submits the evidence. Her result is always `needs_review`; an agent never certifies itself.
5. **Review.** A human verifies pass/fail in `Agents -> Kerri -> Training`. The score and module content hash remain auditable.
6. **Refresh.** A changed module invalidates old certification. Missing or old source records surface as brain work instead of becoming silent context drift.
7. **Compound.** Repeated misses become workflow or prompt changes. New company truth updates the owning brain record, not the training answer.

## What belongs where

- **Training modules:** `brain/wiki/training/`, mirrored into Savant as `training_module` records tagged `agent-training`.
- **Company direction and strategic synthesis:** `brain/wiki/strategy/`, mirrored as `strategy` records. These synthesize decided direction and open bets; they do not silently create decisions.
- **Dynamic truth:** Savant CRM, Tasks, inventory, revenue, schedules, and live threads.
- **Durable truth:** Savant Brain records and their git backing files.
- **Assessment evidence:** Savant `AgentTrainingAttempt` records.
- **Behavior changes:** the normal AgentAdjustmentRequest and reviewed prompt-change path.

## Human contribution contract

People improve Kerri by editing the owning brain record or a module in Savant. Every non-obvious fact needs provenance. Mark hypotheses and open questions plainly. Do not paste raw email, Slack, meeting transcripts, private personal details, credentials, or unsourced model memory into a module.

When a module changes materially, update its required sources, scenarios, and rubric together. That content-hash change intentionally makes prior passes historical.

## Passing standard

A passing Kerri response is not a memory recital. It must:

- route to the correct live source of truth;
- distinguish decided fact, current live state, inference, and open question;
- preserve property, identity, approval, and Standard & Works boundaries;
- connect the work to KMG's goals and current constraints;
- recommend a concrete next move with evidence and completion proof;
- write durable learning back to the correct record when the work changes what the company knows.

## Related

- [[agent-brain-protocol]]
- [[source-of-truth]]
- [[definition-of-done-gate]]
- [[../strategy/kmg-direction-and-bets]]

