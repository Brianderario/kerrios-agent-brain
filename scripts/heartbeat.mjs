#!/usr/bin/env node
// heartbeat.mjs: a routine's uniform "I fired and finished" stamp.
//
// Every scheduled routine calls this as its LAST action (including quiet/no-op
// runs, where Record + Improve still fire per the loop contract). It writes a
// single entry per routine into data/routine-heartbeats.json:
//   { lastRunAt, lastStatus, runCount }
// routine-liveness-check.mjs reads this file as an ADDITIVE success source: a
// routine's last-success is max(its bespoke state stamp(s), its heartbeat
// lastRunAt). So a routine wired to heartbeat OR still using only its old state
// file both read as alive, so wiring this in never weakens dark detection.
//
// The heartbeats file is RUNTIME STATE (gitignored, per-machine, snapshotted by
// scripts/backup-runtime-state.sh). data/routine-heartbeats.example.json is the
// git-tracked shape reference.
//
// Design: zero dependencies, tolerant of a missing/corrupt file (start fresh),
// atomic write (tmp + rename), always exits 0 so it can never fail a routine.
//
// Usage:
//   node scripts/heartbeat.mjs --routine <name>
//   node scripts/heartbeat.mjs --routine <name> --status ok|quiet|error
//   node scripts/heartbeat.mjs --routine <name> --now <ISO>        # test hook
//   node scripts/heartbeat.mjs --routine <name> --data-dir <dir>   # test hook

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VALID_STATUS = new Set(['ok', 'quiet', 'error']);
const HEARTBEATS_FILE = 'routine-heartbeats.json';

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v.startsWith('--')) {
      const key = v.slice(2);
      const next = values[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i += 1; }
    } else out._.push(v);
  }
  return out;
}

// Tolerant read: a missing or corrupt file starts fresh, never crashes a routine.
export function readHeartbeats(dataDir) {
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(dataDir, HEARTBEATS_FILE), 'utf8'));
    if (parsed && typeof parsed === 'object' && parsed.routines && typeof parsed.routines === 'object') {
      return parsed;
    }
  } catch { /* fall through to fresh */ }
  return { schema: 'routine-heartbeats-v1', routines: {} };
}

// Pure stamp logic: bump runCount, record lastRunAt + lastStatus for one routine.
// Returns the next whole-file object. Defensive about a corrupt prior runCount.
export function applyHeartbeat(state, { routine, status, nowIso }) {
  const routines = { ...(state.routines || {}) };
  const prior = routines[routine] || {};
  const priorCount = Number.isInteger(prior.runCount) && prior.runCount >= 0 ? prior.runCount : 0;
  routines[routine] = {
    lastRunAt: nowIso,
    lastStatus: status,
    runCount: priorCount + 1
  };
  return { schema: 'routine-heartbeats-v1', routines };
}

// Atomic write: write a sibling tmp file then rename over the target, so a
// concurrent reader (the 15-min liveness check) never sees a half-written file.
function writeAtomic(dataDir, state) {
  fs.mkdirSync(dataDir, { recursive: true });
  const target = path.join(dataDir, HEARTBEATS_FILE);
  const tmp = path.join(dataDir, `.${HEARTBEATS_FILE}.tmp-${process.pid}`);
  fs.writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`);
  fs.renameSync(tmp, target);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const routine = args.routine && args.routine !== true ? String(args.routine) : null;
  if (!routine) {
    process.stderr.write('heartbeat: --routine <name> is required\n');
    process.exit(0); // never fail the calling routine over a bad invocation
  }
  const status = VALID_STATUS.has(args.status) ? args.status : 'ok';
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  const nowIso = Number.isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();
  const dataDir = path.resolve(
    args['data-dir'] && args['data-dir'] !== true ? args['data-dir'] : path.join(repoRoot, 'data')
  );

  try {
    const state = readHeartbeats(dataDir);
    const next = applyHeartbeat(state, { routine, status, nowIso });
    writeAtomic(dataDir, next);
    process.stdout.write(`${JSON.stringify(next.routines[routine])}\n`);
  } catch (err) {
    // Even on an unexpected write error, exit 0: a heartbeat miss is recoverable
    // (the routine's bespoke state stamp still proves liveness), a crashed
    // routine is not.
    process.stderr.write(`heartbeat: ${err.message}\n`);
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
