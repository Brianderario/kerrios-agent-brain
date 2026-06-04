#!/usr/bin/env node
// morning-brief-run-state: make a mid-run morning-brief crash LOUD instead of silent.
//
// THE PROBLEM THIS SOLVES (post-mortems 2026-06-02 + 2026-06-04):
// the morning brief collects all its signals in memory and only persists anything
// at the very end (Step 4 writes HTML, Step 5 stamps state). A crash in the ~2-min
// collection window therefore left ZERO trace — no HTML, no email, stale yesterday
// content in latest.html, and no way for the safety net to tell "fired but crashed"
// apart from "never fired."
//
// THE FIX: stamp a "run started" record + write an in-progress HTML skeleton the
// MOMENT the brief launches (--start), and mark it complete only when delivery
// finishes (--finish). A crash now leaves: run-state status=started (not complete)
// + a skeleton in latest.html that plainly says "did not complete." The liveness
// checker reads this to alert precisely, and the retry routine reads --check-needed
// to recover. Lifecycle lives in its OWN state file so it never races the
// LLM-managed grade writes in morning-brief-state.json.
//
// Deterministic + side-effect-light: pure helpers are exported for tests; the CLI
// is the only thing that touches disk. --root/--now/--runner are test hooks.
//
// Usage:
//   node scripts/morning-brief-run-state.mjs --start [--runner <id>] [--no-html]
//   node scripts/morning-brief-run-state.mjs --finish
//   node scripts/morning-brief-run-state.mjs --check-needed   # exit 0 = brief still needed today, 3 = already delivered (or weekend)
//   node scripts/morning-brief-run-state.mjs --status          # print JSON, exit 0
//   node scripts/morning-brief-run-state.mjs --start --root <dir> --now <ISO>   # test hooks

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const RUN_STATE_FILE = 'morning-brief-run-state.json';
export const SCHEMA = 'morning-brief-run-state-v1';

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

// ── America/New_York calendar parts for a given instant ──────────────────────
export function etParts(date) {
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
    hhmm: `${String(hour).padStart(2, '0')}:${parts.minute}`,
    weekday: parts.weekday,
    isWeekend: parts.weekday === 'Sat' || parts.weekday === 'Sun'
  };
}

export function isComplete(state, isoDate) {
  const r = state && state.lastRun;
  return Boolean(r && r.date === isoDate && r.status === 'complete');
}

// Pure transition: mark today's run STARTED. Idempotent — never downgrades a run
// already marked complete for today (so a stray re-start can't clobber a delivered
// brief's record).
export function computeStart(prevState, now, runner) {
  const et = etParts(now);
  const nowIso = now.toISOString();
  if (isComplete(prevState, et.isoDate)) {
    return { state: prevState, isoDate: et.isoDate, alreadyComplete: true, wroteRun: false };
  }
  const state = {
    schema: SCHEMA,
    updatedAt: nowIso,
    lastRun: {
      date: et.isoDate,
      startedAt: nowIso,
      finishedAt: null,
      status: 'started',
      runner: runner || 'unknown'
    }
  };
  return { state, isoDate: et.isoDate, alreadyComplete: false, wroteRun: true };
}

// Pure transition: mark today's run COMPLETE. Defensive — if no start was recorded
// (e.g. the preflight itself never ran), still records a coherent completed run.
export function computeFinish(prevState, now) {
  const et = etParts(now);
  const nowIso = now.toISOString();
  const prevRun = prevState && prevState.lastRun;
  const startedAt = prevRun && prevRun.date === et.isoDate && prevRun.startedAt ? prevRun.startedAt : nowIso;
  return {
    schema: SCHEMA,
    updatedAt: nowIso,
    lastRun: {
      date: et.isoDate,
      startedAt,
      finishedAt: nowIso,
      status: 'complete',
      runner: (prevRun && prevRun.runner) || 'unknown'
    }
  };
}

// Is a brief still owed for today? Used by the retry routine to self-suppress.
// Weekends never owe a brief. A run already complete today does not owe one.
export function isBriefNeeded(prevState, now) {
  const et = etParts(now);
  if (et.isWeekend) return false;
  return !isComplete(prevState, et.isoDate);
}

// Minimal, email-safe in-progress skeleton. Not emailed — it is local crash
// evidence that replaces stale yesterday content in latest.html the instant the
// run starts, so a crash is visibly a crash.
export function skeletonHtml(now) {
  const et = etParts(now);
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Morning Brief — ${et.isoDate} (in progress)</title></head>
<body style="margin:0;padding:0;background:#f5f4f1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1;">
    <tr><td align="center" style="padding:24px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e2e0db;border-radius:8px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f1d1a;">
        <tr><td style="padding:28px 28px 8px 28px;">
          <p style="margin:0 0 4px 0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#8a857c;">Morning Brief — in progress</p>
          <h1 style="margin:0;font-size:22px;line-height:1.2;">${et.weekday}, ${et.isoDate}</h1>
        </td></tr>
        <tr><td style="padding:12px 28px 28px 28px;font-size:14px;line-height:1.5;color:#3f3b35;">
          <p style="margin:0 0 12px 0;">Kerri started generating today's brief at <strong>${et.hhmm} ET</strong> but it has not finished yet.</p>
          <p style="margin:0 0 12px 0;">If you are seeing this for more than a few minutes, the brief run did not complete — the safety net will retry the brief and text you if it stays down. No action needed from you.</p>
          <p style="margin:0;color:#8a857c;font-size:12px;">This placeholder exists so a mid-run failure is never silent.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;
}

// ── disk I/O (CLI only) ──────────────────────────────────────────────────────
function readState(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'data', RUN_STATE_FILE), 'utf8'));
  } catch {
    return null;
  }
}

function writeState(root, state) {
  const dir = path.join(root, 'data');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, RUN_STATE_FILE), `${JSON.stringify(state, null, 2)}\n`);
}

function writeSkeleton(root, now, isoDate) {
  const dir = path.join(root, 'output', 'morning-brief');
  fs.mkdirSync(dir, { recursive: true });
  const html = skeletonHtml(now);
  fs.writeFileSync(path.join(dir, `${isoDate}.html`), html);
  fs.writeFileSync(path.join(dir, 'latest.html'), html);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) { process.stderr.write('invalid --now\n'); process.exit(2); }
  const prev = readState(root);

  if (args.start) {
    const { state, isoDate, alreadyComplete, wroteRun } = computeStart(prev, now, args.runner === true ? undefined : args.runner);
    if (wroteRun) writeState(root, state);
    // Don't clobber a delivered brief's HTML with a skeleton.
    if (!alreadyComplete && !args['no-html']) writeSkeleton(root, now, isoDate);
    process.stdout.write(`${JSON.stringify({ action: 'start', isoDate, alreadyComplete, wroteRun, wroteSkeleton: !alreadyComplete && !args['no-html'] }, null, 2)}\n`);
    process.exit(0);
  }

  if (args.finish) {
    const state = computeFinish(prev, now);
    writeState(root, state);
    process.stdout.write(`${JSON.stringify({ action: 'finish', lastRun: state.lastRun }, null, 2)}\n`);
    process.exit(0);
  }

  if (args['check-needed']) {
    const needed = isBriefNeeded(prev, now);
    process.stdout.write(`${JSON.stringify({ action: 'check-needed', needed, lastRun: (prev && prev.lastRun) || null }, null, 2)}\n`);
    process.exit(needed ? 0 : 3);
  }

  // default: --status
  process.stdout.write(`${JSON.stringify({ action: 'status', lastRun: (prev && prev.lastRun) || null }, null, 2)}\n`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
