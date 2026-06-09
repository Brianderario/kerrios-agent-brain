import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { runDecaySweep, renderReport } from '../scripts/decay-sweep.mjs';

const script = fileURLToPath(new URL('../scripts/decay-sweep.mjs', import.meta.url));

const NOW_ISO = '2026-06-09T15:00:00-04:00'; // Tue 3:00pm ET
const NOW = new Date(NOW_ISO);

function fixture({ nowMd, jobs, heartbeats, logBytes } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-decay-'));
  const dataDir = path.join(root, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(path.join(root, 'brain'), { recursive: true });
  if (nowMd != null) fs.writeFileSync(path.join(root, 'NOW.md'), nowMd);
  if (jobs != null) fs.writeFileSync(path.join(dataDir, 'jobs.json'), JSON.stringify(jobs));
  if (heartbeats != null) {
    fs.writeFileSync(path.join(dataDir, 'routine-heartbeats.json'), JSON.stringify(heartbeats));
  }
  if (logBytes != null) fs.writeFileSync(path.join(root, 'brain', 'log.md'), 'x'.repeat(logBytes));
  return { root, dataDir };
}

test('fresh worktree (no files) → clean, exit 0', () => {
  const { root, dataDir } = fixture({});
  const report = runDecaySweep({ root, dataDir, now: NOW });
  assert.equal(report.clean, true);
  assert.equal(report.counts.total, 0);
  assert.match(renderReport(report), /clean/);

  const r = spawnSync('node', [script, '--root', root, '--data-dir', dataDir, '--now', NOW_ISO], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.match(r.stdout, /clean/);
});

test('NOW.md over the 25-line budget → high-priority finding', () => {
  const big = Array.from({ length: 30 }, (_, i) => `line ${i + 1}`).join('\n');
  const { root, dataDir } = fixture({ nowMd: big });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'now-md-bloat');
  assert.ok(f);
  assert.equal(f.priority, 'high');
  assert.equal(f.lineCount, 30);
});

test('NOW.md within budget but with prunable ✅ lines → medium finding', () => {
  const nowMd = ['# NOW', 'Last action: shipped ✅ thing', '> PRIOR: old handoff', 'Next action: do X'].join('\n');
  const { root, dataDir } = fixture({ nowMd });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'now-md-bloat');
  assert.ok(f);
  assert.equal(f.priority, 'medium');
  assert.ok(f.prunableLines >= 2);
});

test('NOW.md clean (short, no prunable lines) → no finding', () => {
  const nowMd = ['# NOW', 'Last action: in flight', 'Next action: do X'].join('\n');
  const { root, dataDir } = fixture({ nowMd });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  assert.ok(!report.findings.some((x) => x.kind === 'now-md-bloat'));
});

test('approval-queue items aging ≥7 days → high finding (via the Wave-0 digest)', () => {
  const jobs = [
    { jobId: 'H0001', status: 'pending', company: 'OldCo', createdAt: '2026-06-01T10:00:00-04:00', dollarsAtStake: 10000 }, // 8d
    { jobId: 'H0002', status: 'pending', company: 'FreshCo', createdAt: '2026-06-08T10:00:00-04:00' }, // 1d
    { jobId: 'H0003', status: 'sent', company: 'GoneCo', createdAt: '2026-05-01T10:00:00-04:00' } // not pending
  ];
  const { root, dataDir } = fixture({ jobs });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'approval-queue-aging');
  assert.ok(f);
  assert.equal(f.priority, 'high');
  assert.equal(f.count, 1); // only the 8-day pending item
  assert.equal(f.oldestAgeDays, 8);
  assert.match(f.detail, /H0001/);
});

test('approval-queue exactly 7 days old is flagged (>= threshold)', () => {
  const jobs = [{ jobId: 'H0007', status: 'pending', company: 'EdgeCo', createdAt: '2026-06-02T10:00:00-04:00' }]; // 7d
  const { root, dataDir } = fixture({ jobs });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'approval-queue-aging');
  assert.ok(f);
  assert.equal(f.count, 1);
});

test('stale routine heartbeat (>36h) → high finding; fresh ones ignored', () => {
  const heartbeats = {
    schema: 'routine-heartbeats-v1',
    routines: {
      'kerri-cold-outreach': { lastRunAt: '2026-06-09T13:07:00-04:00', lastStatus: 'ok', runCount: 10 }, // ~2h
      'kerri-renewal-watchdog': { lastRunAt: '2026-06-05T10:00:00-04:00', lastStatus: 'ok', runCount: 1 } // ~4 days
    }
  };
  const { root, dataDir } = fixture({ heartbeats });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'heartbeat-stale');
  assert.ok(f);
  assert.equal(f.priority, 'high');
  assert.equal(f.routines.length, 1);
  assert.equal(f.routines[0].name, 'kerri-renewal-watchdog');
});

test('heartbeat with malformed/absent lastRunAt is skipped, never crashes', () => {
  const heartbeats = {
    schema: 'routine-heartbeats-v1',
    routines: {
      'kerri-a': { lastRunAt: 'not-a-date', lastStatus: 'ok', runCount: 1 },
      'kerri-b': { lastStatus: 'ok', runCount: 1 }
    }
  };
  const { root, dataDir } = fixture({ heartbeats });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  assert.ok(!report.findings.some((x) => x.kind === 'heartbeat-stale'));
});

test('brain/log.md over the size budget → medium finding flagging rotation', () => {
  const { root, dataDir } = fixture({ logBytes: 250 * 1024 });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  const f = report.findings.find((x) => x.kind === 'brain-log-overdue');
  assert.ok(f);
  assert.equal(f.priority, 'medium');
  assert.match(f.detail, /rotate-brain-log/);
});

test('findings are sorted high-priority first', () => {
  const big = Array.from({ length: 30 }, (_, i) => `line ${i}`).join('\n');
  const { root, dataDir } = fixture({ nowMd: big, logBytes: 250 * 1024 });
  const report = runDecaySweep({ root, dataDir, now: NOW });
  assert.ok(report.findings.length >= 2);
  assert.equal(report.findings[0].priority, 'high');
  assert.equal(report.findings[report.findings.length - 1].priority, 'medium');
});

test('--json CLI output matches runDecaySweep and never mutates input files', () => {
  const jobs = [{ jobId: 'H0001', status: 'pending', company: 'OldCo', createdAt: '2026-06-01T10:00:00-04:00' }];
  const nowMd = '# NOW\nLast action: x\n';
  const { root, dataDir } = fixture({ jobs, nowMd });
  const before = fs.readFileSync(path.join(dataDir, 'jobs.json'), 'utf8');
  const out = spawnSync('node', [script, '--root', root, '--data-dir', dataDir, '--now', NOW_ISO, '--json'], { encoding: 'utf8' });
  assert.equal(out.status, 0);
  const parsed = JSON.parse(out.stdout);
  assert.deepEqual(parsed, JSON.parse(JSON.stringify(runDecaySweep({ root, dataDir, now: NOW }))));
  // propose-only: the scanned files are unchanged.
  assert.equal(fs.readFileSync(path.join(dataDir, 'jobs.json'), 'utf8'), before);
});
