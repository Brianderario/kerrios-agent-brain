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
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXT_ALERT = '/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs';
// Persists which routines currently have an OPEN dark-alert, so we text Brian ONCE when a
// routine goes dark (not every 15-min tick) and ONCE when it recovers.
const ALERT_STATE_FILE = 'routine-liveness-alert-state.json';

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
// The deterministic run-lifecycle (scripts/morning-brief-run-state.mjs). Lets us
// tell "fired but crashed mid-run" (status=started) apart from "never fired" (no
// run today), and counts a run-state `complete` as success even if the brief's own
// lastBriefAt write is what failed.
function morningBriefRun(root) {
  const s = readJson(root, 'morning-brief-run-state.json');
  return s && s.lastRun ? s.lastRun : null;
}
function hhmmET(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  const p = etParts(new Date(t));
  return `${String(p.hour).padStart(2, '0')}:${String(p.minute).padStart(2, '0')}`;
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
function lastIndustryIntel(root) {
  const s = readJson(root, 'industry-intel-state.json');
  return s ? s.lastRunAt || null : null;
}
// Raw state object — lets evaluate() distinguish "state file present but the
// routine has NEVER succeeded" (lastRunAt null → dark after grace) from "no
// state file at all" (unknown). This closed the 2026-06-09 gap where
// kerri-industry-intel could sit at zero successful runs forever without an
// alert, because a null lastRunAt looked identical to a missing file.
// The state file's mtime is attached so the bootstrap day itself gets grace:
// a state file bootstrapped TODAY means the routine has not yet had a
// scheduled fire opportunity, so a null lastRunAt is expected, not dark.
function industryIntelState(root) {
  const s = readJson(root, 'industry-intel-state.json');
  if (!s) return null;
  try {
    s.__mtimeMs = fs.statSync(path.join(root, 'data', 'industry-intel-state.json')).mtimeMs;
  } catch { /* mtime unavailable → no bootstrap grace */ }
  return s;
}

// Routine registry: cadence + the rule that decides whether it should have run.
const ROUTINES = [
  {
    name: 'kerri-inbox-sweep',
    core: true,
    cadence: 'weekdays every 15 min, 06:00–22:45 ET; weekends 10:00 and 16:00 ET',
    read: lastInboxSweep,
    // Windowed: high-cadence on weekdays, intentionally sparse on weekends.
    evaluate(last, et, age) {
      if (et.isWeekend) {
        const weekendRuns = [10 * 60, 16 * 60];
        const grace = 35;
        const dueRuns = weekendRuns.filter((minute) => et.minutesOfDay >= minute + grace);
        if (dueRuns.length === 0) {
          return { status: 'ok', detail: 'before weekend first fire+grace' };
        }
        if (last == null) return { status: 'unknown', detail: 'no state file / cursor' };
        const lastEt = etParts(new Date(Date.parse(last)));
        const lastDueRun = dueRuns[dueRuns.length - 1];
        if (lastEt.isoDate === et.isoDate && lastEt.minutesOfDay >= lastDueRun) {
          return { status: 'ok' };
        }
        const label = `${String(Math.floor(lastDueRun / 60)).padStart(2, '0')}:00 ET`;
        return { status: 'dark', detail: `no weekend inbox sweep recorded for the ${label} checkpoint` };
      }
      const inWindow = et.minutesOfDay >= 6 * 60 && et.minutesOfDay <= 22 * 60 + 45;
      if (!inWindow) return { status: 'paused-ok', detail: 'outside 06:00–22:45 ET active window' };
      if (last == null) return { status: 'unknown', detail: 'no state file / cursor' };
      // The Claude desktop app auto-relaunches ~daily in the early morning and kills the
      // in-flight sweep mid-run; the reaper + lock self-heal recover within one ~15-min
      // cycle, so widen the staleness budget 06:45–07:45 ET. This avoids paging for a gap
      // that fixes itself, while a genuine outage that outlasts the window still trips.
      const relaunchWindow = et.minutesOfDay >= 6 * 60 + 45 && et.minutesOfDay <= 7 * 60 + 45;
      const limit = relaunchWindow ? 50 : 35;
      if (age != null && age <= limit) return { status: 'ok' };
      return { status: 'dark', detail: `last success ${age}m ago (expected ≤${limit}m in-window)` };
    }
  },
  {
    name: 'kerri-morning-brief',
    core: false,
    cadence: 'weekdays ~06:57 ET',
    read: lastMorningBrief,
    readExtra: morningBriefRun,
    evaluate(last, et, age, lastEt, run) {
      if (et.isWeekend) return { status: 'paused-ok', detail: 'weekend' };
      const today = et.isoDate;
      // Success = the brief stamped lastBriefAt today OR the run lifecycle marked
      // today's run complete (robust even if the LLM's lastBriefAt write failed).
      const runCompleteToday = Boolean(run && run.date === today && run.status === 'complete');
      if ((lastEt && lastEt.isoDate === today) || runCompleteToday) return { status: 'ok' };
      if (et.minutesOfDay < 7 * 60 + 30) return { status: 'ok', detail: 'before today’s fire+grace' };
      if (last == null && run == null) return { status: 'unknown', detail: 'no state file' };
      // After the fire+grace window with no success: distinguish a mid-run crash
      // (so the alert tells Brian it fired but died) from a routine that never fired.
      if (run && run.date === today && run.status === 'started') {
        const at = hhmmET(run.startedAt);
        return { status: 'dark', crashed: true, detail: `fired ${at ? `~${at} ET` : 'today'} but crashed before delivering (run started, never completed)` };
      }
      return { status: 'dark', detail: 'never fired today — no brief and no run start recorded after 07:30 ET' };
    }
  },
  {
    name: 'kerri-industry-intel',
    core: false,
    cadence: 'weekdays ~06:30 ET',
    read: lastIndustryIntel,
    readExtra: industryIntelState,
    evaluate(last, et, age, lastEt, state) {
      if (et.isWeekend) return { status: 'paused-ok', detail: 'weekend' };
      if (lastEt && lastEt.isoDate === et.isoDate) return { status: 'ok' };
      if (et.minutesOfDay < 7 * 60 + 15) return { status: 'ok', detail: 'before today’s fire+grace' };
      if (state == null) return { status: 'unknown', detail: 'no state file' };
      if (last == null) {
        // Bootstrap-day grace: if the state file was created/touched today,
        // the routine may simply not have had its first scheduled fire yet.
        const mtimeEt = Number.isFinite(state.__mtimeMs) ? etParts(new Date(state.__mtimeMs)) : null;
        if (mtimeEt && mtimeEt.isoDate === et.isoDate) {
          return { status: 'ok', detail: 'state bootstrapped today; first scheduled fire still pending' };
        }
        return { status: 'dark', detail: 'registered but zero successful runs ever recorded (state lastRunAt is null) after 07:15 ET' };
      }
      return { status: 'dark', detail: 'no industry-intel run recorded for today after 07:15 ET' };
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
    // Guard: a malformed timestamp must degrade to "no parsed stamp", not crash
    // the checker (Intl.formatToParts throws RangeError on an Invalid Date).
    const lastParsed = last ? Date.parse(last) : NaN;
    const lastEt = Number.isFinite(lastParsed) ? etParts(new Date(lastParsed)) : null;
    const extra = r.readExtra ? r.readExtra(root) : null;
    const verdict = r.evaluate(last, et, age, lastEt, extra);
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

// Pure alert decision: given the current report + the previously-persisted open-alert
// set, decide what to text NOW and what the next open-alert set is. The dedup discipline:
//   • newlyDark  — dark now AND no open alert yet  → send one ⚠️ alert, open it
//   • recovered  — had an open alert AND now ok/paused-ok → send one ✅ recovery, close it
//   • dark-but-already-alerted → silent (the whole point: no 15-min repeat spam)
//   • now 'unknown' (state file vanished) → keep the alert open; never a false all-clear
export function decideRoutineAlerts(report, prevState, now) {
  const prevAlerted = (prevState && prevState.alerted) || {};
  const statusByName = new Map(report.routines.map((r) => [r.routine, r.status]));
  const darkNames = report.routines.filter((r) => r.status === 'dark').map((r) => r.routine);

  const newlyDark = darkNames.filter((name) => !prevAlerted[name]);
  const recovered = Object.keys(prevAlerted).filter((name) => {
    const st = statusByName.get(name);
    return st === 'ok' || st === 'paused-ok';
  });

  const alerted = { ...prevAlerted };
  for (const name of recovered) delete alerted[name];
  for (const name of newlyDark) alerted[name] = { since: now.toISOString() };
  return { newlyDark, recovered, nextState: { alerted } };
}

function readAlertState(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'data', ALERT_STATE_FILE), 'utf8'));
  } catch {
    return { alerted: {} };
  }
}

function writeAlertState(root, state) {
  try {
    fs.writeFileSync(path.join(root, 'data', ALERT_STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
  } catch {}
}

function sendText(message, dryRun) {
  const out = { message, sent: false };
  if (dryRun) return out;
  const r = spawnSync(process.execPath, [TEXT_ALERT, '--message', message], { encoding: 'utf8' });
  if (r.error) {
    out.error = r.error.message;
  } else if (r.status !== 0) {
    let detail = `exit ${r.status}`;
    try { const j = JSON.parse(r.stdout); if (j && j.error) detail = j.error; } catch { /* keep */ }
    out.error = detail;
  } else {
    out.sent = true;
  }
  return out;
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

  if (args.alert) {
    const dryRun = Boolean(args['dry-run']);
    const prevState = readAlertState(root);
    const { newlyDark, recovered, nextState } = decideRoutineAlerts(report, prevState, now);

    // One alert when a routine first goes dark — deduped, so no repeat while it stays dark.
    if (newlyDark.length) {
      const dark = report.routines.filter((r) => newlyDark.includes(r.routine));
      const lines = dark.map((r) => `${r.routine}: ${r.detail}`).join(' · ');
      report.alert = sendText(`⚠️ Routine liveness: ${dark.length} dark — ${lines}`, dryRun);
    }
    // One recovery ping when a previously-alerted routine comes back to normal.
    if (recovered.length) {
      const back = report.routines.filter((r) => recovered.includes(r.routine));
      const lines = back
        .map((r) => `${r.routine}${r.ageMinutes != null ? ` (last success ${r.ageMinutes}m ago)` : ''}`)
        .join(' · ');
      report.recovery = sendText(`✅ Routine liveness recovered: ${lines}`, dryRun);
    }
    // Persist the open-alert set so the next run can dedup. Never persist on a dry run.
    if (!dryRun) writeAlertState(root, nextState);
    report.alertState = nextState;
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
