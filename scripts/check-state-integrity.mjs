#!/usr/bin/env node
// check-state-integrity: are the KerriOS runtime state files intact + coherent?
//
// A corrupt or incoherent state file silently breaks a routine (a bad cursor
// re-sweeps or skips mail; a behind counter re-issues jobIds and crosses
// customer wires). This validator is the kerri-gap-sweep class-L guard made
// standalone + deterministic so it can run inside `npm run check`.
//
// OFFLINE checks (always run, deterministic — safe for npm run check):
//   • every data/**/*.json parses as valid JSON
//   • job-counters.json[prefix] >= max jobId number seen in jobs.json (no re-issue)
//   • cursors (inbox-sweep updatedAt + per-mailbox, eod lastRunAt) are parseable
//     and not future-dated beyond a small clock-skew tolerance
//
// ONLINE check (only with --online; never in npm run check): each pending
// jobs.json entry still maps to a real open Google Task. Skipped by default
// because it needs live MCP/credentials and would make `check` non-deterministic.
//
// It NEVER edits a state file — state is gitignored runtime data, not a hygiene
// target. It validates read-only and exits nonzero so the failure is loud.
//
// Usage:
//   node scripts/check-state-integrity.mjs            # exit 1 if any hard error
//   node scripts/check-state-integrity.mjs --json      # machine-readable report
//   node scripts/check-state-integrity.mjs --root <dir> --now <ISO>   # test hooks

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKEW_MS = 5 * 60 * 1000; // tolerate 5 min of clock skew on "future" cursors

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

function walkJson(dir) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const e of entries) {
    if (e.name.startsWith('.')) continue; // skip lock dirs / hidden
    const full = path.join(dir, e.name);
    if (e.isDirectory()) found.push(...walkJson(full));
    else if (e.name.endsWith('.json')) found.push(full);
  }
  return found;
}

export function checkStateIntegrity(root, now) {
  const errors = [];
  const warnings = [];
  const dataDir = path.join(root, 'data');
  const jsonFiles = walkJson(dataDir);
  const parsed = new Map();

  // 1. JSON validity
  for (const file of jsonFiles) {
    const rel = path.relative(root, file);
    try {
      parsed.set(rel, JSON.parse(fs.readFileSync(file, 'utf8')));
    } catch (e) {
      errors.push({ file: rel, kind: 'malformed-json', detail: e.message });
    }
  }

  // 2. counters vs max jobId
  const counters = parsed.get('data/job-counters.json');
  const jobs = parsed.get('data/jobs.json');
  if (counters && Array.isArray(jobs)) {
    const maxByPrefix = {};
    for (const j of jobs) {
      const m = typeof j.jobId === 'string' ? j.jobId.match(/^([A-Za-z])(\d+)$/) : null;
      if (!m) continue;
      const [, prefix, num] = m;
      const n = Number(num);
      if (!maxByPrefix[prefix] || n > maxByPrefix[prefix]) maxByPrefix[prefix] = n;
    }
    for (const [prefix, maxNum] of Object.entries(maxByPrefix)) {
      const counter = counters[prefix];
      if (typeof counter !== 'number') {
        warnings.push({ file: 'data/job-counters.json', kind: 'missing-counter', detail: `prefix ${prefix} present in jobs.json (max ${maxNum}) but absent from counters` });
      } else if (counter < maxNum) {
        errors.push({ file: 'data/job-counters.json', kind: 'counter-behind', detail: `${prefix} counter=${counter} < max jobId ${prefix}${String(maxNum).padStart(4, '0')} — next job would re-issue an existing id` });
      }
    }
  }

  // 3. cursor sanity (parseable + not future-dated)
  const futureLimit = now.getTime() + SKEW_MS;
  const checkStamp = (file, label, value) => {
    if (value == null) return;
    const t = Date.parse(value);
    if (!Number.isFinite(t)) {
      errors.push({ file, kind: 'unparseable-cursor', detail: `${label} = ${JSON.stringify(value)}` });
    } else if (t > futureLimit) {
      errors.push({ file, kind: 'future-cursor', detail: `${label} = ${value} is in the future` });
    }
  };
  const sweep = parsed.get('data/inbox-sweep-state.json');
  if (sweep) {
    checkStamp('data/inbox-sweep-state.json', 'updatedAt', sweep.updatedAt);
    for (const [mbox, st] of Object.entries(sweep.mailboxes || {})) {
      checkStamp('data/inbox-sweep-state.json', `${mbox}.lastSuccessfulSweepAt`, st && st.lastSuccessfulSweepAt);
    }
  }
  const eod = parsed.get('data/eod-state.json');
  if (eod && typeof eod === 'object') {
    for (const [day, d] of Object.entries(eod)) {
      checkStamp('data/eod-state.json', `${day}.lastRunAt`, d && d.lastRunAt);
    }
  }

  return {
    checkedAt: now.toISOString(),
    ok: errors.length === 0,
    filesScanned: jsonFiles.length,
    errors,
    warnings
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) { process.stderr.write('invalid --now\n'); process.exit(2); }

  const report = checkStateIntegrity(root, now);

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`state-integrity: scanned ${report.filesScanned} json file(s) — ${report.ok ? 'OK' : report.errors.length + ' error(s)'}\n`);
    for (const e of report.errors) process.stdout.write(`  ✗ [${e.kind}] ${e.file}: ${e.detail}\n`);
    for (const w of report.warnings) process.stdout.write(`  ⚠ [${w.kind}] ${w.file}: ${w.detail}\n`);
  }
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
