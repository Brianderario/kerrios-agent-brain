#!/usr/bin/env node
// routine-liveness-check: did each scheduled routine actually FIRE and SUCCEED?
//
// This is the always-on counterpart to kerri-gap-sweep's class J. The nightly
// gap-sweep can only notice a dark routine once a day (and only if a Claude
// session happens to be up); a routine can't reliably report its own death. So
// this runs on a short launchd interval, reads each routine's state/grade file,
// compares the last-success timestamp against the routine's cadence + active
// window (America/New_York), and texts Brian when a CORE routine has gone dark.
//
// Read-only. It never re-fires a routine, edits state, or touches a gate — it
// observes and alerts. That is the whole-system-check discipline: never operate
// the thing you are checking.
//
// Usage:
//   node scripts/routine-liveness-check.mjs                 # evaluate + print JSON
//   node scripts/routine-liveness-check.mjs --alert         # + text Brian if a core routine is dark
//   node scripts/routine-liveness-check.mjs --alert --dry-run   # show the alert, don't send
//   node scripts/routine-liveness-check.mjs --root <dir> --now <ISO>   # test hooks
//
// Exit code is always 0 on a successful evaluation (health is reported in JSON +
// via the text alert, not the exit code) and 1 only on an internal error.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXT_ALERT = '/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs';

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v.startsWith('--')) {
      const key = v.slice(2);
      const next = values[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i += 1;
      }
    } else {
      out._.push(v);
    }
  }
  return out;
}

// ── America/New_York calendar parts for a given instant ──────────────────────
function etParts(date) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  const hour = parts.hour === '24' ? 0 : Number(parts.hour);
  return {
    isoDate: `${parts.year}-${parts.month}-${parts.day}`,
    hour,
    minute: Number(parts.minute),
    minutesOfDay: hour * 60 + Number(parts.minute),
    weekday: parts.weekday, // Mon, Tue, ...
    isWeekend: parts.weekday === 'Sat' || parts.weekday === 'Sun'
  };
}

function ageMinutes(fromIso, now) {
  const t = Date.parse(fromIso);
  if (!Number.isFinite(t)) return null;
  return Math.round((now.getTime() - t) / 60000);
}

function readJson(root, file) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'data', file), 'utf8'));
  } catch {
    return null;
  }
}

// Last-success extractors — each tolerates a missing/odd file by returning null.
function lastInboxSweep(root) {
  const s = readJson(root, 'inbox-sweep-state.json');
  if (!s) return null;
  if (s.updatedAt) return s.updatedAt;
  const stamps = Object.values(s.mailboxes || {})
    .map((m) => m && m.lastSuccessfulSweepAt)
    .filter(Boolean)
    .sort();
  return stamps.length ? stamps[stamps.length - 1] : null;
}
function lastMorningBrief(root) {
  const s = readJson(root, 'morning-brief-state.json');
  return s ? s.lastBriefAt || s.updatedAt || null : null;
}
function lastEod(root) {
  const g = readJson(root, 'eod-grades.json');
  if (g && Array.isArray(g.runs) && g.runs.length) {
    const m = maxStamp(g.runs.map((r) => r && r.runAt).filter(Boolean));
    if (m) return m;
  }
  const st = readJson(root, 'eod-state.json');
  if (st && typeof st === 'object') {
    const m = maxStamp(Object.values(st).map((d) => d && d.lastRunAt).filter(Boolean));
    if (m) return m;
  }
  return null;
}
// Run arrays are NOT consistently ordered across state files (brain-push is
// newest-first, gap-sweep is oldest-first), so always take the MAX timestamp.
function maxStamp(values) {
  let best = null;
  let bestT = -Infinity;
  for (const v of values) {
    const t = Date.parse(v);
    if (Number.isFinite(t) && t > bestT) {
      bestT = t;
      best = v;
    }
  }
  return best;
}
function lastRunsField(root, file, field) {
  const s = readJson(root, file);
  if (s && Array.isArray(s.runs) && s.runs.length) {
    return maxStamp(s.runs.map((r) => r && r[field]).filter(Boolean));
  }
  return null;
}

// Routine registry: cadence + the rule that decides whether it should have run.
const ROUTINES = [
  {
    name: 'kerri-inbox-sweep',
    core: true,
    cadence: 'every 15 min, 06:00–22:45 ET',
    read: lastInboxSweep,
    // Windowed: only enforced inside the active window; paused overnight.
    evaluate(last, et, age) {
      const inWindow = et.minutesOfDay >= 6 * 60 && et.minutesOfDay <= 22 * 60 + 45;
      if (!inWindow) return { status: 'paused-ok', detail: 'outside 06:00–22:45 ET active window' };
      if (last == null) return { status: 'unknown', detail: 'no state file / cursor' };
      if (age != null && age <= 35) return { status: 'ok' };
      return { status: 'dark', detail: `last success ${age}m ago (expected ≤35m in-window)` };
    }
  },
  {
    name: 'kerri-morning-brief',
    core: false,
    cadence: 'weekdays ~06:57 ET',
    read: lastMorningBrief,
    evaluate(last, et, age, lastEt) {
      if (et.isWeekend) return { status: 'paused-ok', detail: 'weekend' };
      if (et.minutesOfDay < 7 * 60 + 30) return { status: 'ok', detail: 'before today’s fire+grace' };
      if (last == null) return { status: 'unknown', detail: 'no state file' };
      if (lastEt && lastEt.isoDate === et.isoDate) return { status: 'ok' };
      return { status: 'dark', detail: 'no brief recorded for today after 07:30 ET' };
    }
  },
  {
    name: 'kerri-eod-meetings-review',
    core: false,
    cadence: 'weekdays ~18:28 ET',
    read: lastEod,
    evaluate(last, et, age, lastEt) {
      if (et.isWeekend) return { status: 'paused-ok', detail: 'weekend' };
      if (et.minutesOfDay < 19 * 60 + 15) return { status: 'ok', detail: 'before today’s fire+grace' };
      if (last == null) return { status: 'unknown', detail: 'no state file' };
      if (lastEt && lastEt.isoDate === et.isoDate) return { status: 'ok' };
      return { status: 'dark', detail: 'no EOD run recorded for today after 19:15 ET' };
    }
  },
  {
    name: 'kerri-brain-push',
    core: false,
    cadence: 'daily 22:00 ET',
    read: (root) => lastRunsField(root, 'brain-push-state.json', 'runAt'),
    evaluate(last, et, age, lastEt) {
      if (et.minutesOfDay < 22 * 60 + 45 && (age == null || age <= 26 * 60)) {
        return { status: 'ok', detail: 'before today’s fire+grace' };
      }
      if (last == null) return { status: 'unknown', detail: 'no state file' };
      if (age != null && age <= 26 * 60) return { status: 'ok' };
      return { status: 'dark', detail: `last push ${age != null ? age + 'm' : 'unknown'} ago (expected daily 22:00 ET)` };
    }
  },
  {
    name: 'kerri-gap-sweep',
    core: false,
    cadence: 'daily 21:41 ET',
    read: (root) => lastRunsField(root, 'gap-sweep-state.json', 'timestamp'),
    evaluate(last, et, age) {
      if (et.minutesOfDay < 22 * 60 + 15 && (age == null || age <= 26 * 60)) {
        return { status: 'ok', detail: 'before today’s fire+grace' };
      }
      if (last == null) return { status: 'unknown', detail: 'no ledger' };
      if (age != null && age <= 26 * 60) return { status: 'ok' };
      return { status: 'dark', detail: `last sweep ${age != null ? age + 'm' : 'unknown'} ago (expected daily 21:41 ET)` };
    }
  }
];

export function evaluateRoutines(root, now) {
  const et = etParts(now);
  const results = ROUTINES.map((r) => {
    const last = r.read(root);
    const age = last ? ageMinutes(last, now) : null;
    const lastEt = last ? etParts(new Date(Date.parse(last))) : null;
    const verdict = r.evaluate(last, et, age, lastEt);
    return {
      routine: r.name,
      core: r.core,
      cadence: r.cadence,
      lastSuccessAt: last || null,
      ageMinutes: age,
      ...verdict
    };
  });
  const darkCore = results.filter((r) => r.core && r.status === 'dark');
  const darkAny = results.filter((r) => r.status === 'dark');
  return {
    checkedAt: now.toISOString(),
    etNow: `${et.isoDate} ${String(et.hour).padStart(2, '0')}:${String(et.minute).padStart(2, '0')} ET (${et.weekday})`,
    ok: darkCore.length === 0,
    healthy: darkAny.length === 0,
    routines: results,
    darkCore: darkCore.map((r) => r.routine),
    darkAny: darkAny.map((r) => r.routine)
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    process.stderr.write('invalid --now\n');
    process.exit(1);
  }

  const report = evaluateRoutines(root, now);

  if (args.alert && report.darkAny.length) {
    const dark = report.routines.filter((r) => r.status === 'dark');
    const lines = dark.map((r) => `${r.routine}: ${r.detail}`).join(' · ');
    const msg = `⚠️ Routine liveness: ${dark.length} dark — ${lines}`;
    report.alert = { message: msg, sent: false };
    if (!args['dry-run']) {
      try {
        execFileSync('node', [TEXT_ALERT, '--message', msg], { stdio: 'ignore' });
        report.alert.sent = true;
      } catch (e) {
        report.alert.error = e.message;
      }
    }
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
