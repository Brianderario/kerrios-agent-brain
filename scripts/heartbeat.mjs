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
// SAVANT RUN REPORTING (added 2026-06-12, Brian go-ahead over iMessage):
// after the local stamp, the heartbeat also best-effort POSTs the run to
// Savant's /api/v1/agent_runs (create_agent_run contract in
// brain/wiki/workflows/console-reporting.md) so the production agent
// reliability view reflects real runs instead of guessing. ok/quiet map to
// "succeeded", error maps to "failed". The POST needs the agents:write
// scope on KERRIHQ_AGENT_API_KEY (~/.kerri-chief/secrets/kerrihq.env).
// Reporting is skipped under --no-report, under the --data-dir test hook,
// or when no key is available; a failed POST is a stderr note, never a
// routine failure. Routines with richer telemetry (tokens, full output)
// can still file their own create_agent_run; external_id keeps that safe.
//
// Usage:
//   node scripts/heartbeat.mjs --routine <name>
//   node scripts/heartbeat.mjs --routine <name> --status ok|quiet|error
//   node scripts/heartbeat.mjs --routine <name> --no-report         # local stamp only
//   node scripts/heartbeat.mjs --routine <name> --now <ISO>        # test hook
//   node scripts/heartbeat.mjs --routine <name> --data-dir <dir>   # test hook (implies --no-report)

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const VALID_STATUS = new Set(['ok', 'quiet', 'error']);
const HEARTBEATS_FILE = 'routine-heartbeats.json';
const SAVANT_API_BASE = 'https://kerrihq-rails-xtua.onrender.com/api/v1';
const SECRETS_ENV_FILE = path.join(os.homedir(), '.kerri-chief', 'secrets', 'kerrihq.env');
const REPORT_TIMEOUT_MS = 8000;

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

// Pure payload builder for the Savant create_agent_run POST (exported for tests).
// ok/quiet both report "succeeded": a guarded no-op is still a healthy run.
export function buildRunPayload({ routine, status, nowIso }) {
  return {
    agent_run: {
      agent_slug: routine,
      status: status === 'error' ? 'failed' : 'succeeded',
      external_id: `${routine}-${nowIso}`,
      output: `Heartbeat report: routine finished with local status "${status}" at ${nowIso}.`,
      finished_at: nowIso
    }
  };
}

function loadAgentApiKey() {
  if (process.env.KERRIHQ_AGENT_API_KEY) return process.env.KERRIHQ_AGENT_API_KEY;
  try {
    const text = fs.readFileSync(SECRETS_ENV_FILE, 'utf8');
    const match = text.match(/^KERRIHQ_AGENT_API_KEY=(.*)$/m);
    if (match) return match[1].trim().replace(/^["']|["']$/g, '');
  } catch { /* no secrets file: skip reporting */ }
  return null;
}

// Best-effort Savant report. Any failure is a stderr note and nothing more —
// the local heartbeat already proved liveness, and a reporting outage must
// never break a routine.
async function reportRunToSavant({ routine, status, nowIso }) {
  const key = loadAgentApiKey();
  if (!key) {
    process.stderr.write('heartbeat: no KERRIHQ_AGENT_API_KEY, skipping Savant report\n');
    return;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REPORT_TIMEOUT_MS);
  try {
    const response = await fetch(`${SAVANT_API_BASE}/agent_runs`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRunPayload({ routine, status, nowIso })),
      signal: controller.signal
    });
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      process.stderr.write(`heartbeat: Savant report failed HTTP ${response.status} ${body.slice(0, 200)}\n`);
    }
  } catch (err) {
    process.stderr.write(`heartbeat: Savant report failed: ${err.message}\n`);
  } finally {
    clearTimeout(timer);
  }
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const routine = args.routine && args.routine !== true ? String(args.routine) : null;
  if (!routine) {
    process.stderr.write('heartbeat: --routine <name> is required\n');
    process.exit(0); // never fail the calling routine over a bad invocation
  }
  const status = VALID_STATUS.has(args.status) ? args.status : 'ok';
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  const nowIso = Number.isNaN(now.getTime()) ? new Date().toISOString() : now.toISOString();
  const customDataDir = Boolean(args['data-dir'] && args['data-dir'] !== true);
  const dataDir = path.resolve(customDataDir ? args['data-dir'] : path.join(repoRoot, 'data'));

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

  // Savant run report: skipped in test mode (--data-dir) and under --no-report.
  if (!args['no-report'] && !customDataDir) {
    await reportRunToSavant({ routine, status, nowIso });
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
