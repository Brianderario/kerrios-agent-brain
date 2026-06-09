#!/usr/bin/env node
// autonomy-scorecard.mjs: compile per-actionClass trust evidence from jobs.json.
//
// This is a READ-ONLY evidence compiler. It reads jobs.json (the gitignored
// runtime state where every email job lives with its actionClass, originalDraft,
// sentDraft, decidedAt, status) and autonomy-policy.json (the git-tracked
// authority table), then produces per-actionClass statistics and a READINESS
// assessment for each class.
//
// Readiness criteria (all must pass):
//   - daysCovered >= 14
//   - totalSent >= 10
//   - uneditedRate >= 95%
//   - incidents == 0
//
// Usage:
//   node scripts/autonomy-scorecard.mjs
//   node scripts/autonomy-scorecard.mjs --json
//   node scripts/autonomy-scorecard.mjs --data-dir <dir>       # test hook
//   node scripts/autonomy-scorecard.mjs --root <dir>           # alias for --data-dir
//   node scripts/autonomy-scorecard.mjs --now <ISO>            # test hook
//
// Always exits 0. Tolerates missing/corrupt files gracefully.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const ACTION_CLASSES = [
  'internal-recipient-reply',
  'scheduling-logistics-reply',
  'warm-thread-holding-reply',
  'sponsor-substantive-reply',
  'pipeline-nudge',
  'renewal-draft',
  'cold-send',
  'gmail-draft-only'
];

const READINESS_THRESHOLDS = {
  daysCovered: 14,
  totalSent: 10,
  uneditedRate: 95,
  maxIncidents: 0
};

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

export function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

// ---- ET date helpers ----

function etDateString(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date);
}

function etDayNumber(date) {
  const formatted = etDateString(date);
  const [y, m, d] = formatted.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86400000;
}

// ---- Core logic (pure, exported for tests) ----

export function buildScorecard({ jobs, policy, now }) {
  const results = {};

  for (const cls of ACTION_CLASSES) {
    const tier = (policy && policy.classes && policy.classes[cls])
      ? policy.classes[cls].tier
      : 'ask'; // fail-closed: unknown class defaults to ask

    const classJobs = Array.isArray(jobs) ? jobs.filter((j) => j && j.actionClass === cls) : [];
    const sent = classJobs.filter((j) => j.status === 'sent');
    const skipped = classJobs.filter((j) => j.status === 'skipped');

    const totalSent = sent.length;
    const totalSkipped = skipped.length;
    const totalDecided = totalSent + totalSkipped;
    const approvalRate = totalDecided > 0
      ? Math.round((totalSent / totalDecided) * 10000) / 100
      : null;

    // Unedited = originalDraft matches sentDraft exactly
    let uneditedCount = 0;
    let editedCount = 0;
    for (const job of sent) {
      if (job.originalDraft != null && job.sentDraft != null) {
        if (job.originalDraft === job.sentDraft) {
          uneditedCount += 1;
        } else {
          editedCount += 1;
        }
      }
      // If either field is null/undefined, we cannot determine edit status.
      // Do not count toward either bucket (conservative).
    }
    const measurableSent = uneditedCount + editedCount;
    const uneditedRate = measurableSent > 0
      ? Math.round((uneditedCount / measurableSent) * 10000) / 100
      : null;

    // Incidents: count jobs with an incident marker (future-proofed; 0 for now)
    const incidents = classJobs.filter((j) => j.incident === true || j.incidentAt != null).length;

    // Date range from sentAt timestamps
    const sentDates = sent
      .map((j) => j.sentAt ? new Date(j.sentAt) : null)
      .filter((d) => d && !Number.isNaN(d.getTime()));

    let oldestSentAt = null;
    let newestSentAt = null;
    let daysCovered = 0;

    if (sentDates.length > 0) {
      sentDates.sort((a, b) => a.getTime() - b.getTime());
      oldestSentAt = sentDates[0].toISOString();
      newestSentAt = sentDates[sentDates.length - 1].toISOString();
      daysCovered = Math.max(0, etDayNumber(sentDates[sentDates.length - 1]) - etDayNumber(sentDates[0]));
    }

    // Readiness assessment
    let readiness = 'NOT READY';
    const failReasons = [];

    if (daysCovered < READINESS_THRESHOLDS.daysCovered) {
      failReasons.push(`daysCovered ${daysCovered} < ${READINESS_THRESHOLDS.daysCovered}`);
    }
    if (totalSent < READINESS_THRESHOLDS.totalSent) {
      failReasons.push(`totalSent ${totalSent} < ${READINESS_THRESHOLDS.totalSent}`);
    }
    if (uneditedRate != null && uneditedRate < READINESS_THRESHOLDS.uneditedRate) {
      failReasons.push(`uneditedRate ${uneditedRate}% < ${READINESS_THRESHOLDS.uneditedRate}%`);
    }
    if (uneditedRate == null && totalSent > 0) {
      failReasons.push('uneditedRate unmeasurable (missing draft fields)');
    }
    if (incidents > READINESS_THRESHOLDS.maxIncidents) {
      failReasons.push(`incidents ${incidents} > ${READINESS_THRESHOLDS.maxIncidents}`);
    }

    if (failReasons.length === 0 && totalSent >= READINESS_THRESHOLDS.totalSent) {
      readiness = 'READY FOR REVIEW';
    }

    results[cls] = {
      totalSent,
      totalSkipped,
      approvalRate,
      uneditedRate,
      uneditedCount,
      editedCount,
      incidents,
      oldestSentAt,
      newestSentAt,
      daysCovered,
      currentTier: tier,
      readiness,
      failReasons
    };
  }

  return {
    generatedAt: now.toISOString(),
    thresholds: { ...READINESS_THRESHOLDS },
    classes: results
  };
}

export function formatHumanReadable(scorecard) {
  const lines = [];
  lines.push('=== Autonomy Scorecard ===');
  lines.push(`Generated: ${scorecard.generatedAt}`);
  lines.push(`Thresholds: ${scorecard.thresholds.daysCovered}+ days, ${scorecard.thresholds.totalSent}+ sends, ${scorecard.thresholds.uneditedRate}%+ unedited, ${scorecard.thresholds.maxIncidents} incidents max`);
  lines.push('');

  for (const [cls, stats] of Object.entries(scorecard.classes)) {
    const tierLabel = stats.currentTier.toUpperCase();
    lines.push(`--- ${cls} [${tierLabel}] ---`);
    lines.push(`  Readiness:    ${stats.readiness}`);
    lines.push(`  Sent:         ${stats.totalSent}  |  Skipped: ${stats.totalSkipped}`);

    if (stats.approvalRate != null) {
      lines.push(`  Approval rate: ${stats.approvalRate}%`);
    }
    if (stats.uneditedRate != null) {
      lines.push(`  Unedited rate: ${stats.uneditedRate}% (${stats.uneditedCount} unedited, ${stats.editedCount} edited)`);
    } else if (stats.totalSent > 0) {
      lines.push('  Unedited rate: unmeasurable (missing draft fields)');
    }

    lines.push(`  Incidents:    ${stats.incidents}`);

    if (stats.oldestSentAt) {
      lines.push(`  Date range:   ${stats.oldestSentAt.slice(0, 10)} to ${stats.newestSentAt.slice(0, 10)} (${stats.daysCovered} days)`);
    } else {
      lines.push('  Date range:   no sends recorded');
    }

    if (stats.failReasons.length > 0) {
      lines.push(`  Fail reasons: ${stats.failReasons.join('; ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dataDir = args['data-dir'] && args['data-dir'] !== true
    ? path.resolve(args['data-dir'])
    : args.root && args.root !== true
      ? path.resolve(args.root)
      : path.join(repoRoot, 'data');

  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  const nowSafe = Number.isNaN(now.getTime()) ? new Date() : now;

  const jobs = readJson(path.join(dataDir, 'jobs.json'));
  const policy = readJson(path.join(dataDir, 'autonomy-policy.json'));

  if (!jobs) {
    const msg = 'autonomy-scorecard: no data/jobs.json found (no jobs data to analyze)';
    if (args.json) {
      process.stdout.write(JSON.stringify({ error: msg, classes: {} }) + '\n');
    } else {
      process.stdout.write(msg + '\n');
    }
    process.exit(0);
  }

  const jobsArray = Array.isArray(jobs) ? jobs : [];
  const scorecard = buildScorecard({ jobs: jobsArray, policy, now: nowSafe });

  if (args.json) {
    process.stdout.write(JSON.stringify(scorecard, null, 2) + '\n');
  } else {
    process.stdout.write(formatHumanReadable(scorecard) + '\n');
  }

  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
