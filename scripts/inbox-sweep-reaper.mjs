#!/usr/bin/env node
// inbox-sweep-reaper: kills LEAKED Kerri scheduled-task Claude sessions.
//
// Why this exists: the Claude desktop "persistent scheduled task" runner spawns a
// headless stream-json `claude` session per run but never closes its stdin, so each
// run leaves an idle ~300MB session resident (holding ~30 MCP connections) AFTER its
// work is done. Left alone they pile up until RAM is exhausted and the Mac thrashes on
// swap. This reaper, run on a short interval by launchd, keeps the pileup near zero.
//
// Scope: covers EVERY Kerri scheduled task — inbox-sweep, morning-brief, gap-sweep,
// brain-push, lead-research, cold-outreach, eod-meetings-review, and any future task —
// because they all carry the SCHED_RUN_MARKER boilerplate in their injected first user
// message. (Originally this reaped only inbox-sweep; the other six leaked uncleaned.)
//
// Safety — three independent gates, ALL must pass before a kill:
//   1. Identity: the session's FIRST user message must contain SCHED_RUN_MARKER. An
//      interactive chat's first message is whatever the user typed, so it never matches.
//   2. Idle: the transcript must have been untouched for > IDLE_LIMIT_MS. A task still
//      working keeps appending to its transcript, so a long-running daily task (or any
//      active interactive session) is never killed regardless of total age.
//   3. Min age: never touch a process younger than MIN_AGE_MS (startup grace).
//   Plus: never kills itself (SELF_PID) and never kills an unidentifiable process.

import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { fileURLToPath, pathToFileURL } from "node:url";

const HOME = os.homedir();
const SESSIONS_DIR = path.join(HOME, ".claude", "sessions");
const TRANSCRIPT_DIR = path.join(HOME, ".claude", "projects", "-Users-brianderario");

// Match ANY installed claude-code version, never a pinned one. A hardcoded version
// here silently blinds the reaper after every Claude update: on 2.1.149 -> 2.1.156
// the old literal "claude-code/2.1.149/..." matched zero processes, so leaked sweeps
// piled up to 70 and thrashed the machine on swap (incident 2026-05-31).
export const CLAUDE_BIN_RE = /claude-code\/[^/]+\/claude\.app\/Contents\/MacOS\/claude/;

// True for any claude-code session/wrapper process command line, across every version.
// This is the single chokepoint the reaper uses to recognize Claude processes — the
// regression test pins it so a future version bump can never silently blind the reaper.
export function matchesClaudeBin(command) {
  return CLAUDE_BIN_RE.test(String(command || ""));
}

// Boilerplate line present in EVERY Kerri scheduled-task prompt (and nowhere a human
// would type it). This is the identity signal that marks a session as a reapable
// scheduled run. Pinned by the regression test so a prompt-template change is caught.
export const SCHED_RUN_MARKER = "RUNNER = Claude Code persistent scheduled task";

// Structural marker for the CURRENT scheduled-tasks runtime: it wraps every run's
// first user message in a `<scheduled-task name="...">` tag. Verified against live
// scheduled transcripts on 2026-06-09 (e.g. febee641-….jsonl): the tag appears inside
// the `type:"user"` line with its quotes JSON-escaped, so we match only the stable
// prefix up to `name=`. The legacy SCHED_RUN_MARKER string never appears in that
// wrapper, which is why self-exit/reaper fast paths were blind to Claude scheduled
// runs (Kerri MG suggestion RjQycGw3aXdKQTR5S1JrQw).
export const SCHED_RUN_WRAPPER_MARKER = '<scheduled-task name=';

// A transcript line identifies a scheduled run iff it is a `user` event AND carries
// either marker (legacy prompt boilerplate OR the runtime's wrapper tag). Both gate
// conditions matter: an assistant turn that merely discusses a marker (as in this very
// QA session) is a `type:"assistant"` line and must NOT match.
export function lineMarksScheduledRun(line) {
  const s = String(line || "");
  return (
    s.includes('"type":"user"') &&
    (s.includes(SCHED_RUN_MARKER) || s.includes(SCHED_RUN_WRAPPER_MARKER))
  );
}

// Narrower identity: a scheduled run that is specifically the inbox-sweep. Used to
// decide whether the inbox-sweep run-lock has a LIVE owner. Same two-gate discipline as
// lineMarksScheduledRun (must be a `type:"user"` line carrying the marker), plus the
// task name. The inbox-sweep shim's first user message names "kerri-inbox-sweep"
// verbatim, and no other scheduled task does.
export function lineMarksInboxSweepRun(line) {
  const s = String(line || "");
  return lineMarksScheduledRun(s) && s.includes("kerri-inbox-sweep");
}

// The reaper can only prove liveness for Claude scheduled-task sessions. Codex runners
// are outside its process/transcript model, so Codex-owned locks must be left to the
// lock TTL crash fuse instead of being "helpfully" released out from under a live run.
export function reaperCanObserveLockRunner(lockRunner) {
  return String(lockRunner || "").toLowerCase() === "claude";
}

// Pure decision: should the reaper reclaim the inbox-sweep run-lock? Yes iff the lock is
// genuinely held (present and not TTL-stale — a stale lock is reclaimed by the next
// `acquire` on its own) AND it is owned by the Claude runner this reaper can observe AND
// no Claude inbox-sweep session is alive to own it AND the lock has existed long enough
// that we can't be racing a holder that just acquired it but whose session/transcript the
// reaper hasn't observed yet. This collapses a Claude orphaned lock (holder killed
// mid-run, e.g. by a Claude desktop auto-relaunch) from a ≤TTL outage down to one ~5-min
// reaper scan. It can NEVER fire while a Claude sweep is working, because a working
// Claude sweep is a live inbox-sweep session (liveInboxSweepSessions ≥ 1). It also never
// fires for Codex locks because this process cannot observe Codex runner liveness.
export function shouldReleaseInboxSweepLock(
  { lockHeld, liveInboxSweepSessions, lockAgeMs, lockRunner },
  { minLockAgeMs = MIN_LOCK_AGE_MS } = {}
) {
  return (
    Boolean(lockHeld) &&
    reaperCanObserveLockRunner(lockRunner) &&
    Number(liveInboxSweepSessions) === 0 &&
    Number.isFinite(Number(lockAgeMs)) &&
    Number(lockAgeMs) >= minLockAgeMs
  );
}

const IDLE_LIMIT_MS = 10 * 60 * 1000; // transcript untouched this long => finished leftover
const MIN_AGE_MS = 2 * 60 * 1000;     // startup grace; never touch a very fresh process
const MIN_LOCK_AGE_MS = 2 * 60 * 1000; // never reclaim a lock younger than this (acquire-race guard)
const LOG_PATH = path.join(HOME, ".kerri-chief", "runtime", "logs", "inbox-sweep-reaper.log");
// The inbox-sweep lock CLI lives beside this script (same scripts/ dir). We shell out to
// it rather than re-implementing staleness so there is ONE source of truth for the lock.
const LOCK_SCRIPT = path.join(path.dirname(fileURLToPath(import.meta.url)), "inbox-sweep-lock.mjs");
const SELF_PID = process.pid;

function log(msg) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${msg}\n`);
  } catch {}
}

// Lock state via the canonical lock CLI (single source of truth for staleness).
// execFileSync (not a shell string) because LOCK_SCRIPT's path contains spaces.
function lockStatus() {
  try {
    return JSON.parse(execFileSync(process.execPath, [LOCK_SCRIPT, "status"], { encoding: "utf8" }));
  } catch {
    return null;
  }
}
function releaseInboxSweepLock() {
  try {
    execFileSync(process.execPath, [LOCK_SCRIPT, "release"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// pid -> { ppid, command } for every running claude-code session/wrapper process
function listClaudeProcs() {
  let out = "";
  try {
    out = execSync("ps -Ao pid=,ppid=,command=", { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  } catch {
    return new Map();
  }
  const map = new Map();
  for (const line of out.split("\n")) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    const [, pid, ppid, command] = m;
    if (matchesClaudeBin(command)) {
      map.set(Number(pid), { ppid: Number(ppid), command });
    }
  }
  return map;
}

function readSession(pid) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, `${pid}.json`), "utf8"));
  } catch {
    return null;
  }
}

// Read only until the first user message; bail out fast on big transcripts. Returns the
// raw line so callers can apply both the scheduled-run and inbox-sweep matchers to it
// from a single read. Returns null if none found / unreadable.
async function firstUserLine(sessionId) {
  const file = path.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`);
  if (!fs.existsSync(file)) return null;
  return await new Promise((resolve) => {
    let done = false;
    const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }) });
    const finish = (val) => { if (!done) { done = true; rl.close(); resolve(val); } };
    let count = 0;
    rl.on("line", (line) => {
      if (++count > 400) return finish(null); // first user msg is always near the top
      if (line.includes('"type":"user"')) {
        finish(line);
      }
    });
    rl.on("close", () => finish(null));
    rl.on("error", () => finish(null));
  });
}

// Milliseconds since the transcript was last appended to. -1 if unknown (=> never reap).
function transcriptIdleMs(sessionId, now) {
  try {
    const st = fs.statSync(path.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`));
    return now - st.mtimeMs;
  } catch {
    return -1;
  }
}

async function main() {
  const procs = listClaudeProcs();
  const now = Date.now();
  const toKill = []; // [{ pid, ppid, ageMin, idleMin }]
  let liveInboxSweepSessions = 0; // alive inbox-sweep runs = real owners of the run-lock

  for (const [pid, info] of procs) {
    if (pid === SELF_PID) continue;
    const sess = readSession(pid);
    if (!sess || !sess.sessionId || !sess.startedAt) continue; // unidentifiable -> never kill
    const line = await firstUserLine(sess.sessionId);
    if (!lineMarksScheduledRun(line)) continue; // not a scheduled run -> never kill
    // Count live inbox-sweep sessions BEFORE any reap/age/idle filtering: while ANY
    // inbox-sweep session is alive, the run-lock has a legitimate owner and must not be
    // reclaimed — even if that session is young or briefly idle.
    if (lineMarksInboxSweepRun(line)) liveInboxSweepSessions += 1;
    const ageMs = now - Number(sess.startedAt);
    if (ageMs < MIN_AGE_MS) continue; // startup grace
    const idleMs = transcriptIdleMs(sess.sessionId, now);
    if (idleMs < IDLE_LIMIT_MS) continue; // still working (or unknown) -> spare
    toKill.push({ pid, ppid: info.ppid, ageMin: Math.round(ageMs / 60000), idleMin: Math.round(idleMs / 60000) });
  }

  if (toKill.length === 0) {
    log(`scan: ${procs.size} claude procs, 0 leaked scheduled sessions to reap`);
  } else {
    for (const { pid, ppid, ageMin, idleMin } of toKill) {
      // Kill the session, and its wrapper parent ONLY if the parent is itself a
      // claude-code process (never the Claude desktop app or launchd).
      const parent = procs.get(ppid);
      const killWrapper = parent && matchesClaudeBin(parent.command);
      try { process.kill(pid, "SIGKILL"); } catch {}
      if (killWrapper) { try { process.kill(ppid, "SIGKILL"); } catch {} }
      log(`reaped leaked scheduled session pid=${pid} (age ${ageMin}m, idle ${idleMin}m)${killWrapper ? ` + wrapper ${ppid}` : ""}`);
    }
  }

  reclaimOrphanedInboxSweepLock(now, liveInboxSweepSessions);
}

// Self-heal an orphaned inbox-sweep run-lock. If the lock is held but no inbox-sweep
// session is alive to own it, the holder was killed mid-run without releasing (the
// recurring failure: the Claude desktop app auto-relaunches ~daily and tears down the
// in-flight morning sweep). Releasing it here lets the next scheduled sweep run instead
// of bouncing off a dead lock until its TTL. Counting happens pre-kill in main(), so this
// can never race a working sweep.
function reclaimOrphanedInboxSweepLock(now, liveInboxSweepSessions) {
  const status = lockStatus();
  if (!status || !status.locked) return; // no lock, or already stale (acquire reclaims that)
  const startedAt = status.lock && status.lock.startedAt ? Date.parse(status.lock.startedAt) : NaN;
  const lockAgeMs = now - startedAt; // NaN if startedAt unparseable -> shouldRelease returns false
  const lockRunner = status.lock && status.lock.runner ? status.lock.runner : "unknown";
  if (!shouldReleaseInboxSweepLock({ lockHeld: true, liveInboxSweepSessions, lockAgeMs, lockRunner })) return;
  const heldMin = Math.round(lockAgeMs / 60000);
  if (releaseInboxSweepLock()) {
    log(`released orphaned inbox-sweep lock (runner=${lockRunner}, held ${heldMin}m, 0 live inbox-sweep sessions) — holder gone, unblocking next sweep`);
  } else {
    log(`WARNING: orphaned inbox-sweep lock detected (runner=${lockRunner}, held ${heldMin}m, 0 live sessions) but release failed`);
  }
}

// Only run when invoked directly (launchd / CLI), never when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => log(`error: ${e && e.message}`));
}
