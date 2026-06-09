import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildScorecard, readJson, formatHumanReadable } from '../scripts/autonomy-scorecard.mjs';

const script = fileURLToPath(new URL('../scripts/autonomy-scorecard.mjs', import.meta.url));
const fixtureDir = fileURLToPath(new URL('./fixtures/autonomy-scorecard', import.meta.url));

function tmpDataDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-scorecard-'));
  return dir;
}

function run(dataDir, extra = []) {
  return spawnSync('node', [script, '--data-dir', dataDir, ...extra], { encoding: 'utf8' });
}

// ---- pure logic: buildScorecard ----

test('buildScorecard returns all 8 action classes even with empty jobs', () => {
  const result = buildScorecard({ jobs: [], policy: null, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(Object.keys(result.classes).length, 8);
  for (const stats of Object.values(result.classes)) {
    assert.equal(stats.totalSent, 0);
    assert.equal(stats.totalSkipped, 0);
    assert.equal(stats.readiness, 'NOT READY');
    assert.equal(stats.currentTier, 'ask'); // fail-closed default
  }
});

test('buildScorecard computes correct counts from mixed fixture', () => {
  const jobs = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'jobs-mixed.json'), 'utf8'));
  const policy = JSON.parse(fs.readFileSync(path.join(fixtureDir, 'policy-all-stage1.json'), 'utf8'));
  const result = buildScorecard({ jobs, policy, now: new Date('2026-06-09T17:00:00Z') });

  // scheduling-logistics-reply: 10 sent, 1 skipped
  const sched = result.classes['scheduling-logistics-reply'];
  assert.equal(sched.totalSent, 10);
  assert.equal(sched.totalSkipped, 1);
  // H0002 was edited, rest (9) unedited
  assert.equal(sched.editedCount, 1);
  assert.equal(sched.uneditedCount, 9);
  assert.equal(sched.uneditedRate, 90); // 9/10 = 90%
  assert.equal(sched.currentTier, 'ask');

  // sponsor-substantive-reply: 3 sent, 0 skipped
  const sponsor = result.classes['sponsor-substantive-reply'];
  assert.equal(sponsor.totalSent, 3);
  assert.equal(sponsor.editedCount, 1); // H0020 was edited
  assert.equal(sponsor.uneditedCount, 2);

  // cold-send: 1 sent, 1 skipped
  const cold = result.classes['cold-send'];
  assert.equal(cold.totalSent, 1);
  assert.equal(cold.totalSkipped, 1);
  assert.equal(cold.approvalRate, 50);

  // warm-thread-holding-reply: 0 sent (1 pending, pending is not sent)
  const warm = result.classes['warm-thread-holding-reply'];
  assert.equal(warm.totalSent, 0);
});

test('buildScorecard readiness is READY FOR REVIEW when all thresholds pass', () => {
  // Build a dataset of 15 sends spread over 15+ calendar days, all unedited, 0 incidents
  const jobs = [];
  for (let i = 0; i < 15; i++) {
    // Spread from May 15 to May 30 (16 days range)
    const day = 15 + i;
    const dateStr = `2026-05-${String(day).padStart(2, '0')}`;
    jobs.push({
      jobId: `H${String(i + 100).padStart(4, '0')}`,
      actionClass: 'internal-recipient-reply',
      status: 'sent',
      originalDraft: 'test body',
      sentDraft: 'test body',
      sentAt: `${dateStr}T14:00:00.000Z`,
      decidedAt: `${dateStr}T13:55:00.000Z`
    });
  }
  const policy = { tiers: { 'ask': 'Gated' }, classes: { 'internal-recipient-reply': { tier: 'ask' } } };
  const result = buildScorecard({ jobs, policy, now: new Date('2026-06-09T17:00:00Z') });
  const cls = result.classes['internal-recipient-reply'];
  assert.equal(cls.readiness, 'READY FOR REVIEW');
  assert.equal(cls.totalSent, 15);
  assert.equal(cls.uneditedRate, 100);
  assert.ok(cls.daysCovered >= 14, `daysCovered ${cls.daysCovered} should be >= 14`);
  assert.equal(cls.failReasons.length, 0);
});

test('buildScorecard NOT READY when daysCovered < 14', () => {
  const jobs = [];
  for (let i = 0; i < 12; i++) {
    jobs.push({
      jobId: `H${String(i + 200).padStart(4, '0')}`,
      actionClass: 'pipeline-nudge',
      status: 'sent',
      originalDraft: 'nudge',
      sentDraft: 'nudge',
      sentAt: '2026-06-05T14:00:00.000Z', // all same day
      decidedAt: '2026-06-05T13:55:00.000Z'
    });
  }
  const result = buildScorecard({ jobs, policy: null, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(result.classes['pipeline-nudge'].readiness, 'NOT READY');
  assert.ok(result.classes['pipeline-nudge'].failReasons.some((r) => r.includes('daysCovered')));
});

test('buildScorecard NOT READY when uneditedRate < 95%', () => {
  const jobs = [];
  for (let i = 0; i < 20; i++) {
    const day = 1 + i;
    const dateStr = `2026-05-${String(day).padStart(2, '0')}`;
    const edited = i < 3; // 3 out of 20 edited = 85% unedited
    jobs.push({
      jobId: `H${String(i + 300).padStart(4, '0')}`,
      actionClass: 'renewal-draft',
      status: 'sent',
      originalDraft: 'original',
      sentDraft: edited ? 'modified' : 'original',
      sentAt: `${dateStr}T14:00:00.000Z`,
      decidedAt: `${dateStr}T13:55:00.000Z`
    });
  }
  const result = buildScorecard({ jobs, policy: null, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(result.classes['renewal-draft'].readiness, 'NOT READY');
  assert.ok(result.classes['renewal-draft'].failReasons.some((r) => r.includes('uneditedRate')));
});

test('buildScorecard NOT READY with incidents > 0', () => {
  const jobs = [];
  for (let i = 0; i < 12; i++) {
    const day = 20 + i;
    const dateStr = `2026-05-${String(day).padStart(2, '0')}`;
    jobs.push({
      jobId: `H${String(i + 400).padStart(4, '0')}`,
      actionClass: 'gmail-draft-only',
      status: 'sent',
      originalDraft: 'draft',
      sentDraft: 'draft',
      sentAt: `${dateStr}T14:00:00.000Z`,
      decidedAt: `${dateStr}T13:55:00.000Z`,
      incident: i === 0 ? true : undefined // one incident
    });
  }
  const result = buildScorecard({ jobs, policy: null, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(result.classes['gmail-draft-only'].readiness, 'NOT READY');
  assert.equal(result.classes['gmail-draft-only'].incidents, 1);
  assert.ok(result.classes['gmail-draft-only'].failReasons.some((r) => r.includes('incidents')));
});

test('buildScorecard handles null policy gracefully (fail-closed to ask)', () => {
  const result = buildScorecard({ jobs: [], policy: null, now: new Date('2026-06-09T17:00:00Z') });
  for (const stats of Object.values(result.classes)) {
    assert.equal(stats.currentTier, 'ask');
  }
});

test('buildScorecard reads tier from policy when present', () => {
  const policy = {
    tiers: { 'auto-logged': 'Auto with logging', 'ask': 'Gated' },
    classes: {
      'scheduling-logistics-reply': { tier: 'auto-logged' },
      'internal-recipient-reply': { tier: 'ask' }
    }
  };
  const result = buildScorecard({ jobs: [], policy, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(result.classes['scheduling-logistics-reply'].currentTier, 'auto-logged');
  assert.equal(result.classes['internal-recipient-reply'].currentTier, 'ask');
  assert.equal(result.classes['cold-send'].currentTier, 'ask');
});

test('buildScorecard date range covers oldest to newest sentAt', () => {
  const jobs = [
    {
      actionClass: 'cold-send', status: 'sent',
      originalDraft: 'a', sentDraft: 'a',
      sentAt: '2026-05-10T14:00:00.000Z', decidedAt: '2026-05-10T13:55:00.000Z'
    },
    {
      actionClass: 'cold-send', status: 'sent',
      originalDraft: 'b', sentDraft: 'b',
      sentAt: '2026-06-08T14:00:00.000Z', decidedAt: '2026-06-08T13:55:00.000Z'
    }
  ];
  const result = buildScorecard({ jobs, policy: null, now: new Date('2026-06-09T17:00:00Z') });
  assert.equal(result.classes['cold-send'].oldestSentAt, '2026-05-10T14:00:00.000Z');
  assert.equal(result.classes['cold-send'].newestSentAt, '2026-06-08T14:00:00.000Z');
  assert.ok(result.classes['cold-send'].daysCovered >= 29);
});

// ---- formatHumanReadable ----

test('formatHumanReadable produces readable output without crashing', () => {
  const scorecard = buildScorecard({ jobs: [], policy: null, now: new Date('2026-06-09T17:00:00Z') });
  const output = formatHumanReadable(scorecard);
  assert.ok(output.includes('Autonomy Scorecard'));
  assert.ok(output.includes('NOT READY'));
  assert.ok(output.includes('scheduling-logistics-reply'));
});

// ---- CLI behavior ----

test('CLI exits 0 with no jobs.json', () => {
  const dir = tmpDataDir();
  const r = run(dir);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('no data/jobs.json'));
});

test('CLI --json exits 0 with no jobs.json', () => {
  const dir = tmpDataDir();
  const r = run(dir, ['--json']);
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.ok(out.error);
});

test('CLI with fixture data produces scorecard', () => {
  const dir = tmpDataDir();
  // Copy fixtures to the temp dir
  fs.copyFileSync(
    path.join(fixtureDir, 'jobs-mixed.json'),
    path.join(dir, 'jobs.json')
  );
  fs.copyFileSync(
    path.join(fixtureDir, 'policy-all-stage1.json'),
    path.join(dir, 'autonomy-policy.json')
  );
  const r = run(dir, ['--now', '2026-06-09T17:00:00Z']);
  assert.equal(r.status, 0);
  assert.ok(r.stdout.includes('scheduling-logistics-reply'));
  assert.ok(r.stdout.includes('Sent:'));
});

test('CLI --json with fixture data produces valid JSON', () => {
  const dir = tmpDataDir();
  fs.copyFileSync(
    path.join(fixtureDir, 'jobs-mixed.json'),
    path.join(dir, 'jobs.json')
  );
  fs.copyFileSync(
    path.join(fixtureDir, 'policy-all-stage1.json'),
    path.join(dir, 'autonomy-policy.json')
  );
  const r = run(dir, ['--json', '--now', '2026-06-09T17:00:00Z']);
  assert.equal(r.status, 0);
  const out = JSON.parse(r.stdout);
  assert.ok(out.classes);
  assert.equal(out.classes['scheduling-logistics-reply'].totalSent, 10);
  assert.equal(out.classes['scheduling-logistics-reply'].editedCount, 1);
});

test('CLI --root works as alias for --data-dir', () => {
  const dir = tmpDataDir();
  const r = run(dir, ['--root', dir]);
  assert.equal(r.status, 0);
});

// ---- readJson ----

test('readJson returns null on missing file', () => {
  assert.equal(readJson('/nonexistent/path/file.json'), null);
});

test('readJson returns null on corrupt JSON', () => {
  const dir = tmpDataDir();
  const f = path.join(dir, 'bad.json');
  fs.writeFileSync(f, '{not json');
  assert.equal(readJson(f), null);
});
