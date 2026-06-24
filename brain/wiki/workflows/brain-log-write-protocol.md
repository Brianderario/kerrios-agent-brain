# brain/log.md write protocol

**Rule: never hand-edit `brain/log.md`. Add entries only with `scripts/brain-log-entry.mjs`.**

## Why

`brain/log.md` is an append-only operating log that has grown past 875KB / ~1700 lines.
Routines used to add a line by hand ("Prepend ONE line to `brain/log.md`"): the agent read
the top of the file and rewrote it. On a file this large the agent reads only a slice and
writes back the slice — silently truncating everything below.

On **2026-06-23** two evening routines (lead-research 18:13 / eod-meetings-review 18:28, both
told to "prepend") did exactly this and dropped ~1698 lines from the working tree. The 21:41
gap-sweep caught it (class L) and restored the history from git HEAD (commit `48b021b`). Root
cause: a fragile write method shared by every routine, with nothing stopping a shrunk log from
being committed.

## The fix (two layers)

1. **Prevent — `scripts/brain-log-entry.mjs`** is the only sanctioned writer. It reads the
   whole file with `fs.readFileSync` (no token budget, no truncation), prepends the entry at the
   top, writes atomically (temp file + rename), and asserts the result is strictly larger than the
   input. It is structurally incapable of shortening the log.

   ```bash
   node scripts/brain-log-entry.mjs --stdin <<'LOGENTRY'
   ## [<YYYY-MM-DD HH:MM ET>] <routine> | <compact summary> | Kerri
   <one-line detail>
   LOGENTRY
   ```

   Use a **quoted** heredoc (`<<'LOGENTRY'`) so `|`, `$`, and backticks in the entry are not
   expanded by the shell. `--entry "..."` works for a simple single-line entry.

2. **Contain — `scripts/guard-brain-log.mjs`**, installed as the repo's `pre-commit` hook by
   `bash scripts/install-git-hooks.sh`. Invariant: the total content-line count of `brain/log.md`
   plus every `brain/log-archive/*.md` file may never decrease across a commit. A truncation drops
   the total and the commit is **blocked**; the hook restores `log.md` from HEAD (`--heal`) and
   drops `data/brain-log-guard.marker`. A legitimate rotation (`scripts/rotate-brain-log.mjs`) moves
   lines from `log.md` into the archive and is exactly zero-sum, so it is never blocked. The hook is
   the one chokepoint every committer shares — the brain-push and gap-sweep routines each `git
   commit` directly, so a Stop-hook-only guard would miss them.

## If a commit is ever blocked

`data/brain-log-guard.marker` explains the shrink. The log has already been restored from HEAD
(index + worktree). Re-add the run's entry with `scripts/brain-log-entry.mjs` above and commit again.

## Related

- `[[feedback-no-emdashes]]`, the pre-send lint gate, and `check-state-integrity` are the other
  deterministic write-safety guards.
- Reads stay unchanged: newest entries are at the top of `log.md`; `tail`/`grep`-based readers
  (morning-brief, revenue-standup, build-loop) are unaffected.
