#!/usr/bin/env node
// approval-queue-digest.mjs
//
// Pure-read digest of everything currently waiting on Brian's approval:
//   - data/jobs.json entries with status "pending" (inbox sweep / EOD / pipeline jobs)
//   - data/cold-outreach-state.json#drafted[] (cold batch drafts awaiting batch approval)
//
// Output (default): human-readable table sorted by dollars at stake (desc), then age (desc),
// with a totals line. Items older than 3 days get a warning marker.
// Output (--json): machine-readable digest for the morning brief and other agents.
//
// Both runtime files are gitignored; this script tolerates absence of either file
// (missing or unparseable file means zero items from that source, never a crash).
//
// Flags:
//   --json               machine output
//   --data-dir <path>    override the data directory (tests use fixtures)
//   --now <ISO8601>      override "now" for deterministic age computation (tests)
//
// No external dependencies. Node >= 20.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(SCRIPT_DIR, '..', 'data');

const STALE_AGE_DAYS = 3; // strictly older than this earns the warning marker
const WARNING_MARKER = '⚠';

// Resolution order for a priced amount on a job. First numeric field wins.
const DOLLAR_FIELDS = [
  'dollarsAtStake',
  'amountUSD',
  'amount',
  'dealValue',
  'priceUSD',
  'price'
];

export function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null; // absent or unparseable: treat as empty, never crash a pure read
  }
}

// ET-aware calendar-day number for a timestamp (days since epoch, America/New_York).
function etDayNumber(date) {
  const formatted = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
  const [y, m, d] = formatted.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

export function ageDaysEt(createdAtIso, now) {
  if (!createdAtIso) return null;
  const created = new Date(createdAtIso);
  if (Number.isNaN(created.getTime())) return null;
  return Math.max(0, etDayNumber(now) - etDayNumber(created));
}

export function resolveDollars(job) {
  for (const field of DOLLAR_FIELDS) {
    const value = job?.[field];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
  }
  return null; // unpriced: rendered as TBD
}

function oneLineAskForJob(job) {
  const text = job.summary || job.subject || '(no subject)';
  return String(text).replace(/\s+/g, ' ').trim().slice(0, 120);
}

function jobToItem(job, now) {
  return {
    jobId: job.jobId ?? null,
    company: job.company || job.domain || 'Unknown',
    actionClass: job.actionClass ?? null,
    ageDays: ageDaysEt(job.createdAt, now),
    dollarsAtStake: resolveDollars(job),
    senderIdentity: job.sendFrom ?? null,
    oneLineAsk: oneLineAskForJob(job),
    source: 'jobs.json'
  };
}

function coldDraftToItem(entry, now) {
  const email = entry.email || '';
  const domain = email.includes('@') ? email.split('@')[1] : null;
  const draftRef = entry.batchIndex != null ? `draft #${entry.batchIndex}` : 'draft';
  return {
    jobId: entry.jobId ?? null,
    company: entry.company || domain || 'Unknown',
    actionClass: 'cold-send',
    ageDays: ageDaysEt(entry.draftedAt, now),
    dollarsAtStake: resolveDollars(entry),
    senderIdentity: entry.sendFrom ?? 'kerri@hardwarefyi.com',
    oneLineAsk: `Cold outreach ${draftRef} to ${email || 'unknown recipient'} awaiting batch approval`,
    source: 'cold-outreach-state.json'
  };
}

export function buildDigest({ dataDir = DEFAULT_DATA_DIR, now = new Date() } = {}) {
  const jobs = readJsonIfPresent(path.join(dataDir, 'jobs.json'));
  const coldState = readJsonIfPresent(path.join(dataDir, 'cold-outreach-state.json'));

  const items = [];

  if (Array.isArray(jobs)) {
    for (const job of jobs) {
      if (job && job.status === 'pending') items.push(jobToItem(job, now));
    }
  }

  if (coldState && Array.isArray(coldState.drafted)) {
    for (const entry of coldState.drafted) {
      if (entry) items.push(coldDraftToItem(entry, now));
    }
  }

  // Sort: priced dollars first (desc), unpriced last; within a tier, oldest first.
  items.sort((a, b) => {
    const da = a.dollarsAtStake ?? -1;
    const db = b.dollarsAtStake ?? -1;
    if (db !== da) return db - da;
    return (b.ageDays ?? -1) - (a.ageDays ?? -1);
  });

  const pricedTotal = items.reduce(
    (sum, item) => sum + (item.dollarsAtStake ?? 0),
    0
  );
  const oldestAgeDays = items.reduce(
    (max, item) => Math.max(max, item.ageDays ?? 0),
    0
  );

  return {
    generatedAt: now.toISOString(),
    staleAgeDays: STALE_AGE_DAYS,
    items: items.map((item) => ({
      ...item,
      stale: (item.ageDays ?? 0) > STALE_AGE_DAYS
    })),
    totals: {
      pending: items.length,
      pricedDollarsAtStake: pricedTotal,
      oldestAgeDays
    }
  };
}

function formatDollars(value) {
  if (value == null) return 'TBD';
  return `$${value.toLocaleString('en-US')}`;
}

export function renderTable(digest) {
  const lines = [];
  if (digest.items.length === 0) {
    lines.push('Approval queue is empty. Nothing is waiting on Brian.');
    lines.push('0 pending, $0 priced at stake, oldest 0 days');
    return lines.join('\n');
  }

  const rows = digest.items.map((item) => [
    item.stale ? WARNING_MARKER : ' ',
    item.jobId ?? '-',
    item.company,
    item.actionClass ?? '-',
    item.ageDays == null ? '?' : `${item.ageDays}d`,
    formatDollars(item.dollarsAtStake),
    item.senderIdentity ?? '-',
    item.oneLineAsk
  ]);
  const header = [' ', 'JOB', 'COMPANY', 'CLASS', 'AGE', 'DOLLARS', 'FROM', 'ASK'];
  const widths = header.map((h, col) =>
    Math.max(h.length, ...rows.map((row) => String(row[col]).length))
  );
  const renderRow = (row) =>
    row.map((cell, col) => String(cell).padEnd(widths[col])).join('  ').trimEnd();

  lines.push(renderRow(header));
  lines.push(widths.map((w) => '-'.repeat(w)).join('  ').trimEnd());
  for (const row of rows) lines.push(renderRow(row));

  const { pending, pricedDollarsAtStake, oldestAgeDays } = digest.totals;
  lines.push('');
  lines.push(
    `${pending} pending, $${pricedDollarsAtStake.toLocaleString('en-US')} priced at stake, oldest ${oldestAgeDays} days`
  );
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { json: false, dataDir: DEFAULT_DATA_DIR, now: new Date() };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--data-dir') args.dataDir = argv[++i];
    else if (arg === '--now') args.now = new Date(argv[++i]);
    else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }
  if (Number.isNaN(args.now.getTime())) {
    process.stderr.write('Invalid --now value; expected an ISO8601 timestamp.\n');
    process.exit(1);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const digest = buildDigest({ dataDir: args.dataDir, now: args.now });
  if (args.json) {
    process.stdout.write(`${JSON.stringify(digest, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderTable(digest)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
