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

import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { pathToFileURL } from "node:url";

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

// A transcript line identifies a scheduled run iff it is a `user` event AND carries the
// marker. Both conditions matter: an assistant turn that merely discusses the marker
// (as in this very QA session) is a `type:"assistant"` line and must NOT match.
export function lineMarksScheduledRun(line) {
  const s = String(line || "");
  return s.includes('"type":"user"') && s.includes(SCHED_RUN_MARKER);
}

const IDLE_LIMIT_MS = 10 * 60 * 1000; // transcript untouched this long => finished leftover
const MIN_AGE_MS = 2 * 60 * 1000;     // startup grace; never touch a very fresh process
const LOG_PATH = path.join(HOME, ".kerri-chief", "runtime", "logs", "inbox-sweep-reaper.log");
const SELF_PID = process.pid;

function log(msg) {
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, `${new Date().toISOString()} ${msg}\n`);
  } catch {}
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

// Read only until the first user message; bail out fast on big transcripts.
async function firstUserMessageIsScheduledRun(sessionId) {
  const file = path.join(TRANSCRIPT_DIR, `${sessionId}.jsonl`);
  if (!fs.existsSync(file)) return false;
  return await new Promise((resolve) => {
    let done = false;
    const rl = readline.createInterface({ input: fs.createReadStream(file, { encoding: "utf8" }) });
    const finish = (val) => { if (!done) { done = true; rl.close(); resolve(val); } };
    let count = 0;
    rl.on("line", (line) => {
      if (++count > 400) return finish(false); // first user msg is always near the top
      if (line.includes('"type":"user"')) {
        finish(lineMarksScheduledRun(line));
      }
    });
    rl.on("close", () => finish(false));
    rl.on("error", () => finish(false));
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

  for (const [pid, info] of procs) {
    if (pid === SELF_PID) continue;
    const sess = readSession(pid);
    if (!sess || !sess.sessionId || !sess.startedAt) continue; // unidentifiable -> never kill
    const isScheduled = await firstUserMessageIsScheduledRun(sess.sessionId);
    if (!isScheduled) continue; // not a scheduled run -> never kill
    const ageMs = now - Number(sess.startedAt);
    if (ageMs < MIN_AGE_MS) continue; // startup grace
    const idleMs = transcriptIdleMs(sess.sessionId, now);
    if (idleMs < IDLE_LIMIT_MS) continue; // still working (or unknown) -> spare
    toKill.push({ pid, ppid: info.ppid, ageMin: Math.round(ageMs / 60000), idleMin: Math.round(idleMs / 60000) });
  }

  if (toKill.length === 0) {
    log(`scan: ${procs.size} claude procs, 0 leaked scheduled sessions to reap`);
    return;
  }

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

// Only run when invoked directly (launchd / CLI), never when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => log(`error: ${e && e.message}`));
}
