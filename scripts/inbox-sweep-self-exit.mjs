#!/usr/bin/env node
// inbox-sweep-self-exit: a scheduled run terminates ITS OWN claude session the moment
// its work is done, instead of leaving it resident for the idle-reaper to catch ~16min
// later.
//
// Why this exists: the Claude desktop "persistent scheduled task" runner spawns a
// headless `claude` session per run and never closes its stdin, so each run leaves a
// ~300MB session resident AFTER its work is done. The reaper (inbox-sweep-reaper.mjs)
// cleans those up, but only after IDLE_LIMIT (~10min). When the reaper has a blind spot
// the sessions pile up, the host gets loaded, and the scheduled-tasks scheduler drops
// */15 fires — the daytime inbox-sweep cron gaps diagnosed 2026-05-31. Doing the reap
// proactively from the run itself means sessions never accumulate in the first place.
//
// SAFETY — it terminates a process ONLY if ALL of these hold (strictly safer than the
// reaper, which scans every session):
//   1. ANCESTRY: the target is an ancestor of THIS script (walk the ppid chain). It can
//      never touch a sibling session, another scheduled run, or Brian's interactive chat.
//   2. CLAUDE BIN: the target's command matches the canonical claude-code matcher — never
//      the desktop app, launchd, or a shell.
//   3. SCHEDULED MARKER: the target session's FIRST user message carries SCHED_RUN_MARKER.
//      An interactive chat's first message is whatever the human typed, so it never
//      matches — running this from an interactive or Codex context is a safe no-op.
// If any gate fails it prints what it would do and exits 0 without killing anything.
// `--dry-run` forces print-only. Reuses the reaper's exported matcher + marker so the
// two stay in lockstep.

import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";
import { matchesClaudeBin, SCHED_RUN_MARKER, lineMarksScheduledRun } from "./inbox-sweep-reaper.mjs";

const HOME = os.homedir();
const SESSIONS_DIR = path.join(HOME, ".claude", "sessions");
const TRANSCRIPT_DIR = path.join(HOME, ".claude", "projects", "-Users-brianderario");
const GRACE_SECONDS = 5; // let this command + the model's closing turn finish before the kill fires

// Marker referenced for documentation/grep parity with the reaper; the gate uses it via
// lineMarksScheduledRun below.
void SCHED_RUN_MARKER;

// pid -> { ppid, command } for every running process.
export function psMap(psOutput) {
  const out = psOutput ?? execSync("ps -Ao pid=,ppid=,command=", { encoding: "utf8", maxBuffer: 8 * 1024 * 1024 });
  const map = new Map();
  for (const line of out.split("\n")) {
    const m = line.match(/^\s*(\d+)\s+(\d+)\s+(.*)$/);
    if (!m) continue;
    map.set(Number(m[1]), { ppid: Number(m[2]), command: m[3] });
  }
  return map;
}

// Walk the ppid chain upward from `startPid` and return the nearest ancestor whose
// command is a claude-code process, or null. Cycle- and root-safe.
export function findClaudeAncestor(procs, startPid) {
  let pid = startPid;
  const seen = new Set();
  while (pid && pid !== 0 && pid !== 1 && !seen.has(pid)) {
    seen.add(pid);
    const info = procs.get(pid);
    if (!info) return null;
    if (matchesClaudeBin(info.command)) return { pid, ppid: info.ppid };
    pid = info.ppid;
  }
  return null;
}

function readSession(pid) {
  try {
    return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, `${pid}.json`), "utf8"));
  } catch {
    return null;
  }
}

// Read only until the first user message; bail fast on big transcripts.
async function firstUserMessageIsScheduledRun(sessionId) {
  const file = path.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`);
  if (!fs.existsSync(file)) return false;
  return await new Promise((resolve) => {
    let done = false;
    let count = 0;
    const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }) });
    const finish = (v) => { if (!done) { done = true; rl.close(); resolve(v); } };
    rl.on("line", (line) => {
      if (++count > 400) return finish(false);
      if (line.includes('"type":"user"')) finish(lineMarksScheduledRun(line));
    });
    rl.on("close", () => finish(false));
    rl.on("error", () => finish(false));
  });
}

function out(obj) {
  process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`);
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const procs = psMap();

  const ancestor = findClaudeAncestor(procs, process.ppid);
  if (!ancestor) {
    out({ selfExit: false, reason: "no claude-code ancestor (not running under a claude session) — no-op" });
    return;
  }

  const sess = readSession(ancestor.pid);
  if (!sess || !sess.sessionId) {
    out({ selfExit: false, reason: "session metadata unreadable — refuse to kill", pid: ancestor.pid });
    return;
  }

  const scheduled = await firstUserMessageIsScheduledRun(sess.sessionId);
  if (!scheduled) {
    out({ selfExit: false, reason: "not a scheduled run (no SCHED_RUN_MARKER in first user message) — refuse to kill", pid: ancestor.pid, sessionId: sess.sessionId });
    return;
  }

  const parent = procs.get(ancestor.ppid);
  const killWrapper = Boolean(parent && matchesClaudeBin(parent.command));
  const targets = [ancestor.pid, ...(killWrapper ? [ancestor.ppid] : [])];

  if (dryRun) {
    out({ selfExit: "DRY-RUN", wouldKill: targets, sessionId: sess.sessionId, graceSeconds: GRACE_SECONDS });
    return;
  }

  // Detached, own process group: survives the session it is about to kill. TERM first
  // (clean), then KILL as a fuse. Runs after a short grace so this command and the
  // model's closing turn return cleanly.
  const list = targets.join(" ");
  const child = spawn(
    "/bin/sh",
    ["-c", `sleep ${GRACE_SECONDS}; kill -TERM ${list} 2>/dev/null; sleep 3; kill -KILL ${list} 2>/dev/null`],
    { detached: true, stdio: "ignore" }
  );
  child.unref();
  out({ selfExit: true, killing: targets, sessionId: sess.sessionId, graceSeconds: GRACE_SECONDS });
}

// Only run when invoked directly (CLI / scheduled run), never when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    out({ selfExit: false, reason: `error: ${e && e.message}` });
    process.exit(0);
  });
}
