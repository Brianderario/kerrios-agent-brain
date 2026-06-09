import assert from "node:assert/strict";
import test from "node:test";

import {
  CLAUDE_BIN_RE,
  matchesClaudeBin,
  SCHED_RUN_MARKER,
  SCHED_RUN_WRAPPER_MARKER,
  lineMarksScheduledRun,
  lineMarksInboxSweepRun,
  reaperCanObserveLockRunner,
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

// The CURRENT scheduled-tasks runtime wraps the first user message in a
// <scheduled-task name="..."> tag and does NOT include the legacy RUNNER boilerplate.
// This is the exact shape observed in live transcripts on 2026-06-09 — the gate must
// recognize it, or self-exit/reaper fast paths are blind to every Claude scheduled run.
const wrapperFirstMsg = (task) =>
  `<scheduled-task name="${task}" file="/Users/brianderario/.claude/scheduled-tasks/${task}/SKILL.md">\n` +
  "This is an automated run of a scheduled task. The user is not present to answer questions.";

test("identifies a scheduled run from the runtime's <scheduled-task> wrapper (no legacy marker)", () => {
  for (const task of [
    "kerri-inbox-sweep", "kerri-morning-brief", "kerri-gap-sweep", "kerri-brain-push",
    "kerri-lead-research", "kerri-cold-outreach", "kerri-eod-meetings-review",
  ]) {
    const line = userLine(wrapperFirstMsg(task));
    assert.equal(line.includes(SCHED_RUN_MARKER), false, "wrapper must not contain the legacy marker (that's the bug)");
    assert.equal(line.includes(SCHED_RUN_WRAPPER_MARKER), true, "JSON-encoded user line must carry the wrapper prefix");
    assert.equal(lineMarksScheduledRun(line), true, `should identify wrapped ${task}`);
  }
});

test("wrapper marker still requires a user line — assistant turns discussing it never match", () => {
  assert.equal(lineMarksScheduledRun(assistantLine(`the wrapper is ${SCHED_RUN_WRAPPER_MARKER}"kerri-inbox-sweep">`)), false);
});

// --- inbox-sweep identity: used to decide whether the run-lock has a live owner ---

test("identifies the inbox-sweep run specifically", () => {
  const msg = `This is the scheduled \`kerri-inbox-sweep\` run. ${SCHED_RUN_MARKER}.`;
  assert.equal(lineMarksInboxSweepRun(userLine(msg)), true);
});

test("identifies the inbox-sweep run from the runtime wrapper shape", () => {
  assert.equal(lineMarksInboxSweepRun(userLine(wrapperFirstMsg("kerri-inbox-sweep"))), true);
  assert.equal(lineMarksInboxSweepRun(userLine(wrapperFirstMsg("kerri-gap-sweep"))), false);
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

test("releases a Claude-owned lock when held, owner gone, and past the acquire-race grace", () => {
  // The core fix: holder killed mid-run (Claude app relaunch), lock still held, no live
  // inbox-sweep session → reclaim so the next scheduled sweep can run.
  assert.equal(
    shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 3 * MIN, lockRunner: "claude" }),
    true,
  );
});

test("NEVER releases while a Claude inbox-sweep session is alive (would clobber a working sweep)", () => {
  assert.equal(
    shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 1, lockAgeMs: 30 * MIN, lockRunner: "claude" }),
    false,
  );
});

test("NEVER releases Codex/local/unknown locks because this reaper cannot observe their owners", () => {
  for (const lockRunner of ["codex", "local", "unknown", undefined, null, ""]) {
    assert.equal(
      shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 30 * MIN, lockRunner }),
      false,
      `should not release ${String(lockRunner)} lock`,
    );
  }
});

test("documents the only lock runner this reaper can observe", () => {
  assert.equal(reaperCanObserveLockRunner("claude"), true);
  assert.equal(reaperCanObserveLockRunner("CLAUDE"), true);
  assert.equal(reaperCanObserveLockRunner("codex"), false);
  assert.equal(reaperCanObserveLockRunner("unknown"), false);
});

test("does not release an unheld lock, or one younger than the grace", () => {
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: false, liveInboxSweepSessions: 0, lockAgeMs: 30 * MIN, lockRunner: "claude" }), false);
  // Just-acquired lock whose owning session the reaper may not have observed yet.
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 30 * 1000, lockRunner: "claude" }), false);
});

test("does not release on an unparseable lock age (NaN)", () => {
  assert.equal(shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: NaN, lockRunner: "claude" }), false);
});

test("respects a custom minLockAgeMs override", () => {
  assert.equal(
    shouldReleaseInboxSweepLock(
      { lockHeld: true, liveInboxSweepSessions: 0, lockAgeMs: 90 * 1000, lockRunner: "claude" },
      { minLockAgeMs: 60 * 1000 },
    ),
    true,
  );
});
