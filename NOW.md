# NOW — live handoff baton

> The single source of "where things stand right now." Whichever runner (Claude or Codex)
> you open reads this FIRST and updates it LAST. Keep it short (~20 lines) — this is a
> snapshot, not a log. Durable truth goes in `brain/wiki/`; the running history goes in
> `brain/log.md`. This file is only the current state of in-flight work.

**Last touched:** 2026-05-28 16:00 ET · **by:** Kerri (Claude)

## In flight
- Cross-runner sync system ("the baton") — NOW.md + auto pull/push hooks for Claude & Codex. Just built.

## Last action
- Created `NOW.md`, `scripts/kerri-sync.sh`, `scripts/kerri-pull.sh`; wired Stop/SessionStart hooks in both runners.

## Next action
- Confirm the hooks fire on a real session switch (open Codex, verify it pulled this file).

## Decisions waiting on Brian
- _none_

## Notes
- Update the three lines above (Last action / Next action / Last touched) before you stop. That's the handoff.
