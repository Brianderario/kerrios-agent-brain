# NOW — live handoff baton

> The single source of "where things stand right now." Whichever runner (Claude or Codex)
> you open reads this FIRST and updates it LAST. Keep it short (~20 lines) — this is a
> snapshot, not a log. Durable truth goes in `brain/wiki/`; the running history goes in
> `brain/log.md`. This file is only the current state of in-flight work.

**Last touched:** 2026-05-28 16:05 ET · **by:** Kerri (Claude)

## In flight
- _none — sync system shipped._

## Last action
- Shipped cross-runner sync: `NOW.md` baton + `scripts/kerri-{pull,sync}.sh` + SessionStart/Stop hooks in both runners. Committed + pushed (47b0317).

## Next action
- Sanity check: open Codex, confirm it pulled and reads this file first. Then start using NOW.md as the day-to-day baton.

## Decisions waiting on Brian
- _none_

## Notes
- Update the three lines above (Last action / Next action / Last touched) before you stop. That's the handoff.
