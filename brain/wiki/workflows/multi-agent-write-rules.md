# Multi-Agent Write Rules

scope: workflow · updated: 2026-05-24

How multiple team agents write into the same brain without stepping on each other.

## The setup

- One private GitHub repo: `Brianderario/kerrios-agent-brain`.
- Every teammate has a local clone at a stable path (default: `~/Documents/.../KerriOS/`).
- Every agent (Kerri for Brian, Ari's CFO agent, Benji's CDO agent, future hires) reads + writes via the local clone.

## Branch + commit model

- **Main branch is canonical.** What's on `main` IS the brain.
- Agents work directly on `main` for routine writes (draft-learnings, candidates, raw evidence, log entries, minor wiki edits). These auto-fast-forward.
- Agents open a feature branch + PR for **material writes**: new decisions, ownership changes, deal status transitions, person/company truth restatements, anything affecting external commitments.
- PR review: the affected domain owner reviews (Brian for KMG-wide, Ari for finance, Benji for digital). Auto-merge after approval.

## Conflict resolution

- **Wiki edits to different pages:** git auto-merges. No coordination needed.
- **Wiki edits to the same page by two agents within the same hour:** the later push gets a merge conflict. Resolution rule: timestamp wins, but the loser's content lands as a `candidates/` note flagging the disagreement. Domain owner reviews.
- **Append-only files** (`raw/`, `log.md`, `candidates/`): always append, never modify earlier entries. Conflict is mechanically impossible.
- **High-frequency contention (>5 conflicts/week on the same page):** that's a signal the page is too coarse. Split it.

## Pull-before-write

Every agent pulls `origin/main` before any write session:
```
cd ~/Documents/.../KerriOS && git pull --ff-only origin main
```
If fast-forward fails (local has uncommitted writes), commit-then-pull-rebase. The nightly `kerri-brain-push` task handles this for scheduled writes.

## Boundary enforcement

- **S/W content never enters this repo.** S-prefix learnings + S/W internal facts go in `brain/.local/` which is gitignored.
- **Finance-sensitive content** stays in the main repo until a second repo (`kerrios-brain-finance`) is provisioned (trigger: Ari activates a CFO agent). Once split, the main brain holds aggregate references; the finance repo holds detail.

## Agent identity in commits

Each agent commits as a distinct git author so the log shows who wrote what:
- Kerri (Brian's agent): `Kerri <kerri@hardwarefyi.com>`
- Ari's agent (TBD): set when activated
- Benji's agent (TBD): set when activated
- Brian (human): his GitHub identity

Set on each laptop via:
```
git config user.name "Kerri"
git config user.email "kerri@hardwarefyi.com"
```
(Per-laptop because each agent runs on a teammate's machine.)

## Push cadence

- **Routine writes** (sweep learnings, log entries, candidates): commit immediately, push nightly via `kerri-brain-push` (22:00 ET).
- **Material writes** (decisions, ownership changes): commit + push + open PR immediately. Don't wait for nightly batch.
- **Bulk imports** (a meeting transcript drop, an Apollo enrichment batch): commit + push at end of session.

## When this stops working

This protocol assumes <5 active agents and <100 writes/day. Triggers to evolve:
- Merge conflicts >5/week on the same page → split page.
- More than 10 commits/hour on `main` → introduce a write coordinator MCP that serializes.
- Repo cloning takes >10s → split into per-domain repos.
- Brian, Ari, Benji can't agree on a wiki page → that's a *decision*; file under `brain/wiki/decisions/`.
