#!/usr/bin/env node
// decay-sweep.mjs: the "nothing is silently dropped, hygiene actually gets cleaned up"
// half of the Wave-1 operations-loop mandate. PURE READ. It SCANS for hygiene decay and
// REPORTS a prioritized list (human + --json); it NEVER mutates live state, edits a file,
// touches a gate, or sends anything. It proposes; humans (or the gap-sweep's gated
// auto-fix lane) dispose.
//
// What it detects:
//   (a) NOW.md over its line budget (CLAUDE-ROUTINES.md: NOW.md must stay under 25 lines)
//       + a count of prunable ✅ / "> PRIOR" lines that have served their handoff purpose.
//   (b) Approval-queue items aging past a threshold (7 days), via the Wave-0
//       scripts/approval-queue-digest.mjs buildDigest() (imported, not re-implemented).
//   (c) routine-heartbeats entries that are stale (a routine that has not heart-beat in
//       well over its cadence), a cross-check on routine-liveness-check.mjs.
//   (d) brain/log.md exceeding a size threshold (rotation handled by
//       scripts/rotate-brain-log.mjs; this only flags that a rotation is overdue).
//
// Priority: high = needs attention now (approval items aging, a routine gone stale,
// NOW.md materially over budget); medium = housekeeping (log rotation overdue, a few
// prunable NOW.md lines).
//
// Usage:
//   node scripts/decay-sweep.mjs
//   node scripts/decay-sweep.mjs --json
//   node scripts/decay-sweep.mjs --root <dir> --data-dir <dir> --now <ISO>   # test hooks
//
// Tolerates absent files (a fresh worktree reports clean). Always exits 0 (like the
// liveness checker, health is in the report, not the exit code).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildDigest } from './approval-queue-digest.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Thresholds (kept here, referenced in comments where they mirror another script).
const NOW_MD_LINE_BUDGET = 25;           // CLAUDE-ROUTINES.md "NOW.md stays under 25 lines"
const APPROVAL_STALE_DAYS = 7;           // an approval item older than this is flagged
const HEARTBEAT_STALE_HOURS = 36;        // a daily routine silent > this is stale (1.5 days)
const LOG_MD_BYTES_BUDGET = 200 * 1024;  // brain/log.md over ~200KB → rotation overdue

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

function readText(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

// (a) NOW.md line budget + prunable handoff lines.
export function checkNowMd(root) {
  const text = readText(path.join(root, 'NOW.md'));
  if (text == null) return null;
  const lines = text.split('\n');
  // Trailing blank lines are not "content"; count up to the last non-empty line.
  let lastContent = lines.length;
  while (lastContent > 0 && lines[lastContent - 1].trim() === '') lastContent -= 1;
  const lineCount = lastContent;
  const prunable = lines.filter((l) => l.includes('✅') || l.includes('> PRIOR') || /\bPRIOR\b/.test(l)).length;
  const overBudget = lineCount > NOW_MD_LINE_BUDGET;
  if (!overBudget && prunable === 0) return null;
  return {
    kind: 'now-md-bloat',
    priority: overBudget ? 'high' : 'medium',
    detail: `NOW.md is ${lineCount} lines (budget ${NOW_MD_LINE_BUDGET})`
      + (prunable ? `; ${prunable} prunable ✅ / PRIOR line(s) can be pruned to brain/log.md` : ''),
    lineCount,
    budget: NOW_MD_LINE_BUDGET,
    prunableLines: prunable
  };
}

// (b) Approval-queue items aging past APPROVAL_STALE_DAYS, reusing the Wave-0 digest.
export function checkApprovalQueue(dataDir, now) {
  const digest = buildDigest({ dataDir, now });
  const aging = digest.items.filter((it) => (it.ageDays ?? 0) >= APPROVAL_STALE_DAYS);
  if (aging.length === 0) return null;
  const oldest = aging.reduce((m, it) => Math.max(m, it.ageDays ?? 0), 0);
  const top = aging
    .slice()
    .sort((a, b) => (b.ageDays ?? 0) - (a.ageDays ?? 0))
    .slice(0, 5)
    .map((it) => `${it.jobId ?? '-'} ${it.company} (${it.ageDays}d)`);
  return {
    kind: 'approval-queue-aging',
    priority: 'high',
    detail: `${aging.length} approval item(s) aging ≥${APPROVAL_STALE_DAYS}d (oldest ${oldest}d): ${top.join(', ')}`,
    count: aging.length,
    oldestAgeDays: oldest,
    thresholdDays: APPROVAL_STALE_DAYS,
    items: aging.map((it) => ({ jobId: it.jobId, company: it.company, ageDays: it.ageDays, source: it.source }))
  };
}

// (c) Stale routine heartbeats: a cross-check on the liveness checker.
export function checkHeartbeats(dataDir, now) {
  const hb = readJson(path.join(dataDir, 'routine-heartbeats.json'));
  if (!hb || !hb.routines) return null;
  const stale = [];
  for (const [name, entry] of Object.entries(hb.routines)) {
    if (!entry || !entry.lastRunAt) continue;
    const t = Date.parse(entry.lastRunAt);
    if (!Number.isFinite(t)) continue;
    const hours = (now.getTime() - t) / 3600000;
    if (hours > HEARTBEAT_STALE_HOURS) {
      stale.push({ name, lastRunAt: entry.lastRunAt, ageHours: Math.round(hours) });
    }
  }
  if (stale.length === 0) return null;
  stale.sort((a, b) => b.ageHours - a.ageHours);
  return {
    kind: 'heartbeat-stale',
    priority: 'high',
    detail: `${stale.length} routine heartbeat(s) stale >${HEARTBEAT_STALE_HOURS}h: `
      + stale.map((s) => `${s.name} (${s.ageHours}h)`).join(', '),
    thresholdHours: HEARTBEAT_STALE_HOURS,
    routines: stale
  };
}

// (d) brain/log.md rotation overdue (rotate-brain-log.mjs does the actual move).
export function checkBrainLog(root) {
  const p = path.join(root, 'brain', 'log.md');
  let bytes;
  try { bytes = fs.statSync(p).size; } catch { return null; }
  if (bytes <= LOG_MD_BYTES_BUDGET) return null;
  return {
    kind: 'brain-log-overdue',
    priority: 'medium',
    detail: `brain/log.md is ${Math.round(bytes / 1024)}KB (budget ${Math.round(LOG_MD_BYTES_BUDGET / 1024)}KB)`
      + '; run scripts/rotate-brain-log.mjs to archive prior months',
    bytes,
    budgetBytes: LOG_MD_BYTES_BUDGET
  };
}

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

export function runDecaySweep({ root = repoRoot, dataDir = path.join(root, 'data'), now = new Date() } = {}) {
  const findings = [
    checkNowMd(root),
    checkApprovalQueue(dataDir, now),
    checkHeartbeats(dataDir, now),
    checkBrainLog(root)
  ].filter(Boolean);
  findings.sort((a, b) => (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9));
  return {
    sweptAt: now.toISOString(),
    clean: findings.length === 0,
    counts: {
      total: findings.length,
      high: findings.filter((f) => f.priority === 'high').length,
      medium: findings.filter((f) => f.priority === 'medium').length
    },
    findings
  };
}

export function renderReport(report) {
  const lines = [];
  if (report.clean) {
    lines.push('decay-sweep: clean, no hygiene decay detected.');
    return lines.join('\n');
  }
  lines.push(`decay-sweep: ${report.counts.total} finding(s) (${report.counts.high} high, ${report.counts.medium} medium). PROPOSE-ONLY: nothing was changed.`);
  for (const f of report.findings) {
    const tag = f.priority === 'high' ? '‼' : '·';
    lines.push(`  ${tag} [${f.priority}] ${f.kind}: ${f.detail}`);
  }
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const dataDir = path.resolve(
    args['data-dir'] && args['data-dir'] !== true ? args['data-dir'] : path.join(root, 'data')
  );
  const now = args.now && args.now !== true ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) {
    process.stderr.write('invalid --now\n');
    process.exit(1);
  }
  const report = runDecaySweep({ root, dataDir, now });
  if (args.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else process.stdout.write(`${renderReport(report)}\n`);
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
