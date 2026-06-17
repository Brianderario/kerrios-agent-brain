# Compound Engineering (how we build Savant)

scope: workflow · created: 2026-06-17 · source: Every Inc compound-engineering plugin, adapted to KMG by Brian + Kerri

How we build Savant ([[../properties/savant]] / `kerrihq-rails`) so that each unit of work makes the next one easier instead of harder. Adapted from Every Inc's compound-engineering methodology to KMG's one-approver, agent-built reality. The build loop ([[../../../agent-prompts/build-loop/SKILL.md]]) is the runnable expression of this page.

## The thesis

Each unit of engineering work should make subsequent units easier, not harder. Normal development accumulates debt: every feature adds complexity, every fix leaves behind local knowledge someone has to rediscover later, and the next change gets slower. Compound engineering inverts that. The leverage is in planning and review, not raw typing: a sharp brainstorm makes the plan smaller, a good plan makes execution trivial, a good review catches the pattern and not just the one bug, and a written learning means the next agent never relearns the lesson from scratch.

This is the same bet the brain already makes ([[llm-wiki-pattern]]): knowledge accretes on git so the toolset gets smarter every run. Compound engineering is that bet applied to how we ship code into Savant.

## The loop

strategy / vision -> brainstorm -> plan -> work -> review -> **compound** -> repeat with better context

The build loop runs brainstorm -> plan -> work -> review -> ship-and-verify per item. Compounding is the closing step that was missing, and it is what makes the loop actually compound. It has two halves:

1. **Write the learning** after each item ships or fails: the durable lesson, not the diary entry. Stored in [[savant-build-learnings]].
2. **Read prior learnings** at the start of the next item, during brainstorm, so a past mistake or convention shapes the new approach before any code is written. A learning nobody reads is just a log.

The vision doc ([[../properties/savant-product-vision]]) is upstream of the whole loop: it is the grounding that says which item is worth building next.

## Two-tier knowledge: Learnings vs Pattern docs

We separate the incident from the rule, because they age differently and carry different risk.

- **Learning** = one documented solution to one past problem: a bug fix, a convention discovered, a workflow that worked. Incident-level. Cheap to write, low risk if it goes stale (it described one moment).
- **Pattern doc** = a rule generalized from several Learnings into broader guidance. Higher leverage (future work treats it as broadly true) and therefore higher risk when stale, so pattern docs get reviewed for freshness, Learnings do not.

Both live in [[savant-build-learnings]] with a fixed entry format. A Learning is promoted into a Pattern only after several incidents point the same way, never from a single case. This mirrors how email learnings already work in [[draft-learnings]]; this page is the code-side sibling.

## Autofix classes (how this extends Kerri's approval gating)

Every change a review surfaces, and by extension every action an agent can take, is classified by how safely it can be applied without a human. This is the same instinct as Kerri's read-only-by-default posture ([[agent-brain-protocol]]), made explicit and reusable:

| Class | Meaning | Example in our world |
|-------|---------|----------------------|
| Silent | Apply automatically, no confirmation | rubocop autoformat, additive migration, new test |
| Confirm | Apply only after the owner says yes | renaming a field other agents read, schema change |
| Human-only | Leave for a person to resolve, never auto-apply | anything touching send authority, pricing, legal, finance, identity, permissions |
| Advisory | Record the finding, take no action | "this could be cleaner", a noted future refactor |

The overnight build loop operates strictly in the Silent + Advisory lanes. Confirm and Human-only items get parked with a written note and surfaced in the morning report, never guessed at. This is the autofix taxonomy doing the same job as the build-loop hard rails, stated as a general rule so it transfers to code review, the inbox sweep, and any future autonomous routine.

## Headless mode = the build-loop posture

"Headless mode" in the source methodology means: run unattended, produce a written report as the deliverable, and conservatively defer genuinely ambiguous decisions rather than guess. That is exactly the build loop's contract and the [[agent-brain-protocol]] escalation rule (escalate on block, do not silently park). The standard to hold: defer-and-report always beats guess-and-hope when no human is in the room.

## Token discipline: model tiers + evidence dossier

To keep large agent runs affordable, sub-agents are spent by cost tier, not all on the ceiling model:

- **Extraction** (cheapest capable): retrieval, quoting, scanning the schema/API/logs.
- **Generation** (mid): evidence-driven drafting and mechanical verification.
- **Ceiling** (the orchestrator's own model): judgment calls only.

A cheap scout agent gathers bulk evidence (verbatim quotes with source pointers) into an **evidence dossier** written to scratch storage, and the orchestrator carries only a short gist while downstream agents read the dossier themselves. This keeps the expensive context small. Concretely for us: cheap models do the Savant schema/API/log sweeps and write the dossier to OS temp; the loop reads the gist and only escalates the ceiling model for the actual design decision.

## Reviewer personas + confidence anchors

The review phase improves when it runs as a panel of single-lens reviewers (correctness, security/authz, scope, API backward-compatibility, design) rather than one pass that rubber-stamps. Each finding gets a self-scored confidence on a small fixed scale tied to behavioral criteria, and corroboration across personas promotes a finding by one level. This is how we keep "everything looks fine" from passing as a review, and it applies to code review on Savant and to draft review before any external send.

## Related

- [[../../../agent-prompts/build-loop/SKILL.md]] - the runnable build loop; Phase 6 COMPOUND implements this page
- [[savant-build-learnings]] - the code-side Learnings + Pattern docs store
- [[../properties/savant]] - the app we build (kerrihq-rails)
- [[../properties/savant-product-vision]] - what is worth building next
- [[llm-wiki-pattern]] - the brain's accretion model this generalizes
- [[draft-learnings]] - the email-side sibling of savant-build-learnings
- [[agent-brain-protocol]] - approval gates the autofix classes formalize
- [[multi-agent-write-rules]] - how these pages get written without collisions
