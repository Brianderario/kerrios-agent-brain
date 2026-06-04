import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAUDE_BIN_RE,
  matchesClaudeBin,
  SCHED_RUN_MARKER,
  lineMarksScheduledRun,
  lineMarksInboxSweepRun,
  shouldReleaseInboxSweepLock,
} from "../scripts/inbox-sweep-reaper.mjs";

// Real-world command lines, as they appear in `ps -Ao command=`.
const SUPPORT = "/Users/brianderario/Library/Application Support/Claude";
const headless = (v) =>
  `${SUPPORT}/claude-code/${v}/claude.app/Contents/MacOS/claude --output-format stream-json --verbose --input-format stream-json`;
const disclaimerWrapped = (v) =>
  `/Applications/Claude.app/Contents/Helpers/disclaimer ${SUPPORT}/claude-code/${v}/claude.app/Contents/MacOS/claude --output-format stream-json`;

test("matches the current installed version (2.1.156)", () => {
  assert.equal(matchesClaudeBin(headless("2.1.156")), true);
});

test("regression: matches versions other than the once-hardcoded 2.1.149", () => {
  // The reaper went blind on the 2.1.149 -> 2.1.156 bump because the version was
  // pinned in a string literal. A version-independent matcher must accept BOTH the
  // old pinned version and the new one, or any future version.
  assert.equal(matchesClaudeBin(headless("2.1.149")), true);
  assert.equal(matchesClaudeBin(headless("2.1.156")), true);
});

test("matches arbitrary future versions, including prereleases", () => {
  for (const v of ["2.1.157", "2.2.0", "3.0.0", "3.0.0-beta.1", "10.20.30", "2.1.999"]) {
    assert.equal(matchesClaudeBin(headless(v)), true, `should match version ${v}`);
  }
});

test("matches the disclaimer wrapper line (path appears as an argument)", () => {
  assert.equal(matchesClaudeBin(disclaimerWrapped("2.1.156")), true);
  assert.equal(matchesClaudeBin(disclaimerWrapped("4.5.6")), true);
});

test("does NOT match the Claude desktop GUI app", () => {
  // The GUI app must never be a kill candidate — it has no claude-code/<ver>/ segment.
  assert.equal(matchesClaudeBin("/Applications/Claude.app/Contents/MacOS/Claude"), false);
  assert.equal(
    matchesClaudeBin("/Applications/Claude.app/Contents/Frameworks/Claude Helper (Renderer).app/Contents/MacOS/Claude Helper (Renderer)"),
    false,
  );
});

test("does NOT match unrelated processes or junk input", () => {
  assert.equal(matchesClaudeBin("/opt/homebrew/bin/node /Users/x/.kerri-chief/runtime/scripts/inbox-sweep-reaper.mjs"), false);
  assert.equal(matchesClaudeBin("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome Helper"), false);
  assert.equal(matchesClaudeBin(""), false);
  assert.equal(matchesClaudeBin(undefined), false);
  assert.equal(matchesClaudeBin(null), false);
});

test("the matcher is anchored to the claude-code app binary path, not a loose 'claude' substring", () => {
  // Guard against an over-broad matcher that would catch anything mentioning "claude".
  assert.equal(matchesClaudeBin("vim /Users/brianderario/notes/claude-ideas.md"), false);
  assert.equal(matchesClaudeBin("grep claude-code somefile"), false);
  // But the real binary path inside any version dir must match.
  assert.match(headless("2.1.156"), CLAUDE_BIN_RE);
});

// --- scheduled-run identity: the gate that decides what is reapable ---

// Transcript JSONL lines as they appear on disk.
const userLine = (text) => JSON.stringify({ type: "user", message: { role: "user", content: text } });
const assistantLine = (text) => JSON.stringify({ type: "assistant", message: { content: [{ type: "text", text }] } });

const SCHEDULED_FIRST_MSG =
  "You are Kerri, KMG chief of staff. This is the scheduled `kerri-gap-sweep` run. " +
  SCHED_RUN_MARKER + ". Do NOT emit Codex directives.";

test("identifies a scheduled-task run from its first user message", () => {
  assert.equal(lineMarksScheduledRun(userLine(SCHEDULED_FIRST_MSG)), true);
});

test("regression: covers ALL scheduled tasks, not just inbox-sweep", () => {
  // Every task shim carries the same RUNNER boilerplate, so one marker covers them all
  // (inbox-sweep used to be the only reaped task; the other six leaked uncleaned).
  for (const task of [
    "kerri-inbox-sweep", "kerri-morning-brief", "kerri-gap-sweep", "kerri-brain-push",
    "kerri-lead-research", "kerri-cold-outreach", "kerri-eod-meetings-review",
  ]) {
    const msg = `This is the scheduled \`${task}\` run. ${SCHED_RUN_MARKER}.`;
    assert.equal(lineMarksScheduledRun(userLine(msg)), true, `should identify ${task}`);
  }
});

test("NEVER identifies an interactive session as reapable", () => {
  // Brian's typed messages must never match — killing an interactive session is catastrophic.
  assert.equal(lineMarksScheduledRun(userLine("my computer died after our latest updates, can you diagnose?")), false);
  assert.equal(lineMarksScheduledRun(userLine("can you fix inbox sweep and imessage handoff?")), false);
  assert.equal(lineMarksScheduledRun(userLine("")), false);
});

test("does NOT match an assistant turn that merely mentions the marker", () => {
  // This QA session's transcript contains the marker string in assistant text. The gate
  // requires a `type:"user"` line, so discussing the marker can never make a session reapable.
  assert.equal(lineMarksScheduledRun(assistantLine(`the marker is "${SCHED_RUN_MARKER}"`)), false);
});

test("handles junk input without throwing", () => {
  assert.equal(lineMarksScheduledRun(undefined), false);
  assert.equal(lineMarksScheduledRun(null), false);
  assert.equal(lineMarksScheduledRun(123), false);
});

// --- inbox-sweep identity: used to decide whether the run-lock has a live owner ---

test("identifies the inbox-sweep run specifically", () => {
  const msg = `This is the scheduled \`kerri-inbox-sweep\` run. ${SCHED_RUN_MARKER}.`;
  assert.equal(lineMarksInboxSweepRun(userLine(msg)), true);
});

test("does NOT mark a non-inbox-sweep scheduled task as an inbox-sweep run", () => {
  // morning-brief, gap-sweep, etc. are scheduled runs but are NOT inbox-sweep, so they
  // must not be counted as owners of the inbox-sweep lock.
  for (const task of ["kerri-morning-brief", "kerri-gap-sweep", "kerri-brain-push", "kerri-eod-meetings-review"]) {
    const msg = `This is the scheduled \`${task}\` run. ${SCHED_RUN_MARKER}.`;
    assert.equal(lineMarksScheduledRun(userLine(msg)), true, `${task} is a scheduled run`);
    assert.equal(lineMarksInboxSweepRun(userLine(msg)), false, `${task} is NOT inbox-sweep`);
  }
});

test("inbox-sweep matcher still requires the user-line + marker gates", () => {
  // An assistant turn mentioning the task name must never match.
  assert.equal(lineMarksInboxSweepRun(assistantLine("running kerri-inbox-sweep now")), false);
  // The marker alone without the task name is a different scheduled task, not inbox-sweep.
  assert.equal(lineMarksInboxSweepRun(userLine(`some run. ${SCHED_RUN_MARKER}.`)), false);
  assert.equal(lineMarksInboxSweepRun(undefined), false);
});

// --- orphaned-lock self-heal decision ---

const MIN = 60 * 1000;

test("releases the lock when held, owner gone, and past the acquire-race grace", () => {
  // The core fix: holder killed mid-run (Claude app relaunch), lock still held, no live
  // inbox-sweep session → reclaim so the next scheduled sweep can run.
  assert.equal(
    shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 3 * MIN }),
    true,
  );
});

test("NEVER releases while an inbox-sweep session is alive (would clobber a working sweep)", () => {
  assert.equal(
    shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 1, lockAgeMs: 30 * MIN }),
    false,
  );
});

test("does not release an unheld lock, or one younger than the grace", () => {
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: false, liveInboxSweepSessions: 0, lockAgeMs: 30 * MIN }), false);
  // Just-acquired lock whose owning session the reaper may not have observed yet.
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 30 * 1000 }), false);
});

test("does not release on an unparseable lock age (NaN)", () => {
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: NaN }), false);
});

test("respects a custom minLockAgeMs override", () => {
  assert.equal(
    shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 90 * 1000 }, { minLockAgeMs: 60 * 1000 }),
    true,
  );
});
