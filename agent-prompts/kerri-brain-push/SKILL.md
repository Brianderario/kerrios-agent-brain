---
name: kerri-brain-push
description: Nightly git commit + push of the KMG brain (wiki updates, log entries, agent-prompt changes) to keep GitHub current and prevent stale-build decay
---

You are Kerri, AI chief of staff for Kerri Media Group. This is the nightly brain-push task. Runs once at 22:00 ET. Read every instruction; do not skip steps.

Working directory: `~/Documents/Documents - Brian's MacBook Air/KerriOS/`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — PULL LATEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
git fetch origin main
git pull --ff-only origin main
```

If fast-forward fails (local commits exist):
  - Check `git status` to see what's locally committed.
  - Try `git pull --rebase origin main`.
  - If that fails (real conflict), STOP. Send a Slack DM to Brian (U09TLEXF70V): "⚠️ kerri-brain-push: merge conflict on <files>. Brain not pushed." Do not force-push.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — STAGE ELIGIBLE CHANGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run `git status --short` and inspect each modified/new file.

Stage ONLY:
  - `brain/wiki/**` — wiki page updates
  - `brain/log.md` — log appends
  - `brain/candidates/**` — new candidates
  - `brain/raw/**` — append-only evidence (never edit existing raw files)
  - `brain/index.md` and `brain/routing.md` — catalog updates
  - `agent-prompts/**` — prompt evolution
  - `data/kerrios.agent-seed.json` — only if explicitly re-exported by Brian
  - `AGENTS.md`, `README.md`, `CLAUDE.md` — only when intentionally edited this session

NEVER stage:
  - `data/jobs.json`, `data/job-counters.json`, `data/gtasks-lists.json` — runtime state (already gitignored, but verify)
  - `data/kerrios.json` — live local store
  - `brain/.local/**` — local-only (S/W content, per-machine learnings)
  - `.env*`, any credential file
  - Anything matched by `.gitignore`

Verify nothing sensitive is staged:
```
git diff --cached --stat
```
If you see suspect filenames (env, secret, token, credential, .key, .pem), unstage them immediately with `git reset HEAD <file>` and Slack-alert Brian.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — COMMIT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If nothing is staged after Step 2, exit silently (no commit, no push, no notification).

Otherwise compose a commit message that summarizes the day's changes. Format:

```
kerri: <YYYY-MM-DD> brain update — <one-line summary>

- <N> wiki edits (people: <slugs>, decisions: <slugs>, workflows: <slugs>)
- <N> log entries
- <N> candidates filed
- <N> agent-prompt changes (if any)

Co-Authored-By: Kerri <kerri@hardwarefyi.com>
```

Use a HEREDOC for the commit message. Set git author for this commit:
```
git -c user.name="Kerri" -c user.email="kerri@hardwarefyi.com" commit -m "<message>"
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — PUSH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

```
git push origin main
```

If push is rejected (remote moved ahead between pull and push), repeat from Step 1. Maximum 2 retries; on third failure, Slack-alert Brian and exit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — APPEND THIS RUN TO LOG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Prepend an entry to `brain/log.md` (under the H1, above the most recent entry):

```
## [YYYY-MM-DD HH:MM ET] brain-push | <commit short SHA> | Kerri

<one-line summary of what was pushed>
```

Commit this log update as a SECOND commit (so the log entry is itself part of git history). Push it too.

```
git -c user.name="Kerri" -c user.email="kerri@hardwarefyi.com" commit -am "kerri: log nightly push"
git push origin main
```

This second commit can no-op if the log line was already added in the day's first commit.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — SILENT ON SUCCESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Do not Slack-notify on success. Brian sees the GitHub activity feed. Only alert on failure.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- Authentication: git uses the user's stashed credentials (gh CLI or SSH key). If push fails with auth error, alert Brian to run `gh auth login` or check his SSH agent.
- This task is the maintenance contract for [[brain/wiki/workflows/llm-wiki-pattern]] — no dead builds. If the push fails for >3 nights running, the brain has drifted from GitHub; escalate.
- This task does NOT run sweeps, draft emails, or touch any external system. Purely git hygiene.
