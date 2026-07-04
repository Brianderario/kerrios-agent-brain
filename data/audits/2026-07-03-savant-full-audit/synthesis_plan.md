Plan published: https://claude.ai/code/artifact/338c6cbf-82b5-4b01-97cc-2f04ff852cbd

# Savant Console — Ranked Execution Plan

**106 findings → 101 shippable items** (5 duplicate pairs collapsed), ordered by value-to-blast-radius for a build loop shipping one PR at a time.

## Dedup pass (5 collapses)
- **#17 ≡ #53** — proof-gate bypass via idempotent create-replay (tasks-board + api-v1 filed it twice) → one PR covering the controller replay branch + `create_task_tool`.
- **#44 ≡ #56** — KnowledgeRecords `#update` missing write-grant check (brain-perms + api-v1) → one PR.
- **#16 · #22 · #35** — double-send / `send_started_at` cluster: kept as distinct fixes but sequenced adjacent.
- **#31 · #38 · #39** — outbound em-dash / GroundTruthGuard scrub cluster: sequenced adjacent.
- **#7 · #46 · #48** — AgentRuntimeHealth observability keys: bundled into one health-payload review window.

## Ordering logic
Confirmed correctness / security / double-send bugs lead every band, even though upgrades are weighted up per your ask. The two live-security items open SHIP-NOW: **SSRF via IPv4-mapped IPv6** (#1) and **sponsor assets vanishing on deploy** (#2). Then the privilege-escalation `merge()` bug that must land before the brand-wall PR8 flip (#3), then the double-send cluster.

## Three bands
- **SHIP-NOW (58)** — safe, high-value, buildable tonight. Additive fixes with a one-line verify each.
- **SHIP-CAREFULLY (37)** — real payoff but each needs a decision first: a param-compat contract for round-the-clock pollers, warn-then-enforce rollout, schema change, or coordination with the in-flight brand-wall stack. The two self-upgrade security items (CommandPolicy allowlist, ENV isolation) sit here because they need a live prod dry-run so the eval suite still boots.
- **PARK (6)** — held with a reason: refuted-in-its-dangerous-half, latent-until-console-tinkering, or a fix riskier than the bug. Plus a batched tail of 6 low-value bugs folded into adjacent PRs.

## Client-email — all 11 flagged, all OFF
Every mail-adjacent item carries the magenta lock chip and an inline re-confirmation. **None add a send path or re-enable a banned mailer.** They split into: gate-tighteners that can only convert a would-be send into a preview (#4 pull-back, #6 ConfirmationGate, #10 queue split, #47 executable ban, #52 forward throttle, #64 sweep filter), scrub/hold on already-approved sends (#25, #26, #27, #28, #63), and after-the-fact metadata (#38 ledger, #67 message-id). The two contract-signing items (#17, #48, #53, #55) are the sanctioned approval-gated e-sign path, not the banned asset/portal surface — flagged "mail on gate" and adding no new trigger.

Files, concrete implementation approach, and a one-sentence verification plan are in each card's expandable detail. The plan is structured so the loop can walk SHIP-NOW top-to-bottom, pause at each SHIP-CAREFULLY item for the flagged decision, and skip PARK.