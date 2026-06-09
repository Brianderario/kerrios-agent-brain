#!/usr/bin/env node
// autonomy-report.mjs
//
// Pure-read reporting for the autonomy policy (brain/wiki/decisions/2026-06-09-autonomy-boundary.md).
// Two modes:
//
//   --ramp                Per-actionClass graduation report against data/autonomy-policy.json.
//                         A class "meets the bar" when, over jobs carrying Wave-0 instrumentation
//                         (actionClass + sentDraft), it has >= minApprovals Brian-approved sends,
//                         an edit rate <= maxEditRate (sentDraft differing from originalDraft),
//                         and <= maxDoubleEmailIncidents. Surfacing only — promotion is Brian-only.
//
//   --auto-logged         List auto-logged sends (jobs with autoLogged: true) since --since.
//                         The morning brief renders this as the Auto-logged section.
//
// Shared flags (mirrors approval-queue-digest.mjs):
//   --json                machine output
//   --data-dir <path>     override the data directory (tests use fixtures)
//   --now <ISO8601>       override "now" (tests)
//   --since <ISO8601>     auto-logged mode: window start (default: now minus 24h)
//
// jobs.json is gitignored runtime state; autonomy-policy.json is tracked. Missing or
// unparseable files degrade to empty results, never a crash. Fail-closed note: this script
// only REPORTS. Enforcement (the sweep's auto-logged send path) reads the policy directly
// and falls back to ask whenever the policy is unreadable.
//
// No external dependencies. Node >= 20.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(SCRIPT_DIR, '..', 'data');
const DAY_MS = 24 * 60 * 60 * 1000;

export function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function loadJobs(dataDir) {
  const jobs = readJsonIfPresent(path.join(dataDir, 'jobs.json'));
  return Array.isArray(jobs) ? jobs.filter(Boolean) : [];
}

function loadPolicy(dataDir) {
  const policy = readJsonIfPresent(path.join(dataDir, 'autonomy-policy.json'));
  if (!policy || typeof policy !== 'object' || typeof policy.classes !== 'object') return null;
  return policy;
}

function parseTime(iso) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? null : t;
}

// ---- ramp mode -------------------------------------------------------------

export function buildRampReport({ dataDir = DEFAULT_DATA_DIR, now = new Date() } = {}) {
  const policy = loadPolicy(dataDir);
  const jobs = loadJobs(dataDir);
  const graduation = policy?.graduation ?? {};
  const minApprovals = graduation.minApprovals ?? 20;
  const maxEditRate = graduation.maxEditRate ?? 0.1;
  const maxDoubleEmailIncidents = graduation.maxDoubleEmailIncidents ?? 0;

  const classNames = policy ? Object.keys(policy.classes) : [];
  const classes = classNames.map((name) => {
    const entry = policy.classes[name] ?? {};
    // Qualifying = Brian-approved sends carrying full Wave-0 instrumentation. Pre-Wave-0
    // jobs (no sentDraft) don't count toward the bar in either direction.
    const qualifying = jobs.filter(
      (job) =>
        job.actionClass === name &&
        job.status === 'sent' &&
        typeof job.sentDraft === 'string' &&
        typeof job.originalDraft === 'string'
    );
    const edited = qualifying.filter((job) => job.sentDraft !== job.originalDraft);
    const doubleEmailIncidents = jobs
      .filter((job) => job.actionClass === name)
      .reduce((sum, job) => sum + (Number(job.doubleEmailBlocks) || 0), 0);
    const approvals = qualifying.length;
    const editRate = approvals === 0 ? null : edited.length / approvals;

    const meetsBar =
      entry.rampEligible === true &&
      entry.tier === 'ask' &&
      approvals >= minApprovals &&
      editRate !== null &&
      editRate <= maxEditRate &&
      doubleEmailIncidents <= maxDoubleEmailIncidents;

    return {
      actionClass: name,
      tier: entry.tier ?? 'ask',
      rampEligible: entry.rampEligible === true,
      approvals,
      edited: edited.length,
      editRate,
      doubleEmailIncidents,
      meetsBar
    };
  });

  return {
    generatedAt: now.toISOString(),
    policyLoaded: policy !== null,
    bar: { minApprovals, maxEditRate, maxDoubleEmailIncidents },
    classes,
    readyForPromotion: classes.filter((c) => c.meetsBar).map((c) => c.actionClass)
  };
}

export function renderRamp(report) {
  const lines = [];
  if (!report.policyLoaded) {
    lines.push('autonomy-policy.json missing or unreadable. Enforcement fails closed to ask; nothing to report.');
    return lines.join('\n');
  }
  const pct = (rate) => (rate === null ? 'n/a' : `${Math.round(rate * 100)}%`);
  lines.push(
    `Graduation bar: >=${report.bar.minApprovals} approvals, edit rate <=${Math.round(report.bar.maxEditRate * 100)}%, double-emails <=${report.bar.maxDoubleEmailIncidents}. Promotion is Brian-only.`
  );
  lines.push('');
  for (const c of report.classes) {
    const status = c.meetsBar
      ? 'MEETS BAR — surface to Brian: promote?'
      : c.tier !== 'ask'
        ? `tier: ${c.tier}`
        : c.rampEligible
          ? 'building track record'
          : 'not ramp-eligible';
    lines.push(
      `${c.actionClass}: ${c.approvals} approvals, ${c.edited} edited (${pct(c.editRate)}), ${c.doubleEmailIncidents} double-email — ${status}`
    );
  }
  if (report.readyForPromotion.length > 0) {
    lines.push('');
    lines.push(`READY FOR PROMOTION (Brian decides): ${report.readyForPromotion.join(', ')}`);
  }
  return lines.join('\n');
}

// ---- auto-logged mode ------------------------------------------------------

export function buildAutoLoggedReport({ dataDir = DEFAULT_DATA_DIR, now = new Date(), since = null } = {}) {
  const jobs = loadJobs(dataDir);
  const sinceMs = parseTime(since) ?? now.getTime() - DAY_MS;

  const items = jobs
    .filter((job) => job.autoLogged === true && job.status === 'sent')
    .filter((job) => {
      const sentMs = parseTime(job.sentAt);
      return sentMs !== null && sentMs >= sinceMs;
    })
    .map((job) => ({
      jobId: job.jobId ?? null,
      company: job.company || job.domain || 'Unknown',
      actionClass: job.actionClass ?? null,
      sentAt: job.sentAt,
      sendFrom: job.sendFrom ?? null,
      recipients: [job.replyTo, ...(Array.isArray(job.cc) ? job.cc : job.cc ? [job.cc] : [])]
        .filter(Boolean)
        .join(', '),
      subject: String(job.subject ?? '(no subject)').slice(0, 120)
    }))
    .sort((a, b) => String(a.sentAt).localeCompare(String(b.sentAt)));

  return {
    generatedAt: now.toISOString(),
    since: new Date(sinceMs).toISOString(),
    items,
    totals: { autoLoggedSends: items.length }
  };
}

export function renderAutoLogged(report) {
  if (report.items.length === 0) {
    return `No auto-logged sends since ${report.since}.`;
  }
  const lines = [`${report.items.length} auto-logged send${report.items.length === 1 ? '' : 's'} since ${report.since}:`];
  for (const item of report.items) {
    lines.push(
      `  ${item.jobId ?? '-'}  ${item.company}  →  ${item.recipients || 'unknown recipients'}  ·  ${item.subject}  ·  ${item.sentAt}`
    );
  }
  return lines.join('\n');
}

// ---- CLI -------------------------------------------------------------------

function parseArgs(argv) {
  const args = {
    mode: null,
    json: false,
    dataDir: DEFAULT_DATA_DIR,
    now: new Date(),
    since: null
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--ramp') args.mode = 'ramp';
    else if (arg === '--auto-logged') args.mode = 'auto-logged';
    else if (arg === '--json') args.json = true;
    else if (arg === '--data-dir') args.dataDir = argv[++i];
    else if (arg === '--now') args.now = new Date(argv[++i]);
    else if (arg === '--since') args.since = argv[++i];
    else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }
  if (!args.mode) {
    process.stderr.write('Pick a mode: --ramp or --auto-logged\n');
    process.exit(1);
  }
  if (Number.isNaN(args.now.getTime())) {
    process.stderr.write('Invalid --now value; expected an ISO8601 timestamp.\n');
    process.exit(1);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.mode === 'ramp') {
    const report = buildRampReport({ dataDir: args.dataDir, now: args.now });
    process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderRamp(report)}\n`);
  } else {
    const report = buildAutoLoggedReport({ dataDir: args.dataDir, now: args.now, since: args.since });
    process.stdout.write(args.json ? `${JSON.stringify(report, null, 2)}\n` : `${renderAutoLogged(report)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
