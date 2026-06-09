#!/usr/bin/env node
// cold-funnel-report.mjs
//
// Pure-read cold outreach funnel report from data/cold-outreach-state.json.
// This is the "background somewhere where I can manage it" surface Brian asked
// for: batch-level visibility into the cold outreach funnel without daily noise.
//
// Outputs a human-readable funnel summary (default) or machine-readable JSON
// (--json). Designed for the weekly revenue standup and on-demand inspection.
//
// Flags:
//   --json               machine output
//   --data-dir <path>    override the data directory (tests use fixtures)
//   --root <path>        alias for --data-dir (match other scripts)
//   --now <ISO8601>      override "now" for deterministic age computation (tests)
//   --threshold <days>   second-touch eligibility threshold (default 7)
//
// No external dependencies. Node >= 20.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DATA_DIR = path.join(SCRIPT_DIR, '..', 'data');

const DEFAULT_SECOND_TOUCH_THRESHOLD_DAYS = 7;

export function readJsonIfPresent(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
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

export function ageDaysEt(isoTimestamp, now) {
  if (!isoTimestamp) return null;
  const d = new Date(isoTimestamp);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, etDayNumber(now) - etDayNumber(d));
}

// Compute unique send days from sent[] entries.
function countUniqueSendDays(sentEntries) {
  const days = new Set();
  for (const entry of sentEntries) {
    if (entry.sentAt) {
      const d = new Date(entry.sentAt);
      if (!Number.isNaN(d.getTime())) {
        const formatted = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/New_York',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(d);
        days.add(formatted);
      }
    }
  }
  return days.size;
}

export function buildFunnelReport({ dataDir = DEFAULT_DATA_DIR, now = new Date(), thresholdDays = DEFAULT_SECOND_TOUCH_THRESHOLD_DAYS } = {}) {
  const coldState = readJsonIfPresent(path.join(dataDir, 'cold-outreach-state.json'));

  const sent = (coldState && Array.isArray(coldState.sent)) ? coldState.sent : [];
  const drafted = (coldState && Array.isArray(coldState.drafted)) ? coldState.drafted : [];
  const replied = (coldState && Array.isArray(coldState.replied)) ? coldState.replied : [];
  const secondTouchSent = (coldState && Array.isArray(coldState.secondTouchSent)) ? coldState.secondTouchSent : [];
  const secondTouchDrafted = (coldState && Array.isArray(coldState.secondTouchDrafted)) ? coldState.secondTouchDrafted : [];

  // Classify replies by sentiment (if tagged).
  const positiveReplies = replied.filter((r) => r.sentiment === 'positive');
  const neutralReplies = replied.filter((r) => r.sentiment === 'neutral');
  const negativeReplies = replied.filter((r) => r.sentiment === 'negative');
  const unclassifiedReplies = replied.filter((r) => !r.sentiment);

  // Build lookup sets for replied emails and second-touch-sent emails.
  const repliedEmails = new Set(replied.map((r) => (r.email || '').toLowerCase()));
  const secondTouchSentEmails = new Set(secondTouchSent.map((s) => (s.email || '').toLowerCase()));

  // Compute "awaiting reply" = sent entries with no reply, older than 5 days (standard window).
  const AWAITING_MIN_AGE_DAYS = 5;
  const awaiting = sent.filter((entry) => {
    const email = (entry.email || '').toLowerCase();
    if (repliedEmails.has(email)) return false;
    const age = ageDaysEt(entry.sentAt, now);
    return age != null && age >= AWAITING_MIN_AGE_DAYS;
  });

  // Compute second-touch eligible = sent entries older than threshold,
  // no reply, no second-touch already sent or drafted.
  const secondTouchDraftedEmails = new Set(secondTouchDrafted.map((s) => (s.email || '').toLowerCase()));
  const secondTouchEligible = sent.filter((entry) => {
    const email = (entry.email || '').toLowerCase();
    if (repliedEmails.has(email)) return false;
    if (secondTouchSentEmails.has(email)) return false;
    if (secondTouchDraftedEmails.has(email)) return false;
    const age = ageDaysEt(entry.sentAt, now);
    return age != null && age >= thresholdDays;
  });

  const totalSent = sent.length;
  const uniqueSendDays = countUniqueSendDays(sent);
  const replyRate = totalSent > 0 ? (replied.length / totalSent * 100) : 0;

  // Notable replies (for revenue standup compact summary).
  const notableReplies = replied.filter((r) => r.sentiment === 'positive').map((r) => {
    const company = r.company || (r.email && r.email.includes('@') ? r.email.split('@')[1] : 'unknown');
    const note = r.note || '';
    return { email: r.email, company, note };
  });

  return {
    generatedAt: now.toISOString(),
    thresholdDays,
    sent: {
      total: totalSent,
      uniqueSendDays
    },
    awaiting: {
      count: awaiting.length,
      minAgeDays: AWAITING_MIN_AGE_DAYS
    },
    replied: {
      total: replied.length,
      replyRate: Math.round(replyRate * 10) / 10,
      positive: positiveReplies.length,
      neutral: neutralReplies.length,
      negative: negativeReplies.length,
      unclassified: unclassifiedReplies.length,
      notable: notableReplies
    },
    drafted: {
      count: drafted.length
    },
    secondTouch: {
      eligible: secondTouchEligible.length,
      sent: secondTouchSent.length,
      drafted: secondTouchDrafted.length,
      eligibleEntries: secondTouchEligible.map((entry) => ({
        email: entry.email,
        jobId: entry.jobId ?? null,
        sentAt: entry.sentAt,
        ageDays: ageDaysEt(entry.sentAt, now)
      }))
    }
  };
}

export function renderReport(report) {
  const lines = [];
  const dateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(report.generatedAt));

  lines.push(`COLD OUTREACH FUNNEL (as of ${dateStr})`);

  const sendDayLabel = report.sent.uniqueSendDays === 1 ? '1 day' : `${report.sent.uniqueSendDays} days`;
  lines.push(`  Sent:         ${report.sent.total} (across ${sendDayLabel})`);
  lines.push(`  Awaiting:     ${report.awaiting.count} (no reply after ${report.awaiting.minAgeDays}+ days)`);
  lines.push(`  Replied:      ${report.replied.total > 0 ? `${report.replied.total} (${report.replied.replyRate}% reply rate)` : '0'}`);

  if (report.replied.total > 0) {
    lines.push(`    Positive:   ${report.replied.positive}`);
    if (report.replied.notable.length > 0) {
      for (const n of report.replied.notable) {
        const noteStr = n.note ? ` - ${n.note}` : '';
        lines.push(`                ${n.company}${noteStr}`);
      }
    }
    lines.push(`    Neutral:    ${report.replied.neutral}`);
    lines.push(`    Negative:   ${report.replied.negative}`);
    if (report.replied.unclassified > 0) {
      lines.push(`    Unclassified: ${report.replied.unclassified}`);
    }
  }

  lines.push(`  Drafted:      ${report.drafted.count} (pending batch approval)`);
  lines.push(`  Second-touch eligible: ${report.secondTouch.eligible} (sent ${report.thresholdDays}+ days ago, no reply, no second-touch yet)`);

  if (report.secondTouch.sent > 0 || report.secondTouch.drafted > 0) {
    lines.push(`  Second-touch sent: ${report.secondTouch.sent}, drafted: ${report.secondTouch.drafted}`);
  }

  return lines.join('\n');
}

function parseArgs(argv) {
  const args = {
    json: false,
    dataDir: DEFAULT_DATA_DIR,
    now: new Date(),
    thresholdDays: DEFAULT_SECOND_TOUCH_THRESHOLD_DAYS
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--data-dir' || arg === '--root') args.dataDir = argv[++i];
    else if (arg === '--now') args.now = new Date(argv[++i]);
    else if (arg === '--threshold') args.thresholdDays = parseInt(argv[++i], 10);
    else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }
  if (Number.isNaN(args.now.getTime())) {
    process.stderr.write('Invalid --now value; expected an ISO8601 timestamp.\n');
    process.exit(1);
  }
  if (Number.isNaN(args.thresholdDays) || args.thresholdDays < 1) {
    process.stderr.write('Invalid --threshold value; expected a positive integer.\n');
    process.exit(1);
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildFunnelReport({ dataDir: args.dataDir, now: args.now, thresholdDays: args.thresholdDays });
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderReport(report)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
