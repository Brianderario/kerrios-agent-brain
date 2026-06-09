import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ageDaysEt, buildDigest, renderTable, resolveDollars } from '../scripts/approval-queue-digest.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(TEST_DIR, '..', 'scripts', 'approval-queue-digest.mjs');
const FIXTURE_DIR = path.join(TEST_DIR, 'fixtures', 'approval-digest');

// Fixed "now": Tuesday 2026-06-09 3:00pm ET. All fixture ages are relative to this.
const NOW_ISO = '2026-06-09T15:00:00-04:00';
const NOW = new Date(NOW_ISO);

function makeDataDir({ withJobs = true, withColdState = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'approval-digest-'));
  if (withJobs) {
    fs.copyFileSync(path.join(FIXTURE_DIR, 'jobs.sample.json'), path.join(dir, 'jobs.json'));
  }
  if (withColdState) {
    fs.copyFileSync(
      path.join(FIXTURE_DIR, 'cold-outreach-state.sample.json'),
      path.join(dir, 'cold-outreach-state.json')
    );
  }
  return dir;
}

test('digest tolerates missing runtime files (worktree default)', () => {
  const dir = makeDataDir({ withJobs: false, withColdState: false });
  const digest = buildDigest({ dataDir: dir, now: NOW });
  assert.deepEqual(digest.items, []);
  assert.deepEqual(digest.totals, { pending: 0, pricedDollarsAtStake: 0, oldestAgeDays: 0 });

  const table = renderTable(digest);
  assert.match(table, /Approval queue is empty/);
  assert.match(table, /0 pending, \$0 priced at stake, oldest 0 days/);

  // CLI must also exit 0 with no files present.
  const out = execFileSync(process.execPath, [SCRIPT_PATH, '--data-dir', dir, '--now', NOW_ISO], {
    encoding: 'utf8'
  });
  assert.match(out, /0 pending/);
});

test('digest tolerates unparseable runtime files', () => {
  const dir = makeDataDir({ withJobs: false, withColdState: false });
  fs.writeFileSync(path.join(dir, 'jobs.json'), '{not json');
  fs.writeFileSync(path.join(dir, 'cold-outreach-state.json'), '');
  const digest = buildDigest({ dataDir: dir, now: NOW });
  assert.equal(digest.totals.pending, 0);
});

test('age computation is ET-calendar-day aware', () => {
  // Created 11:30pm ET on June 8 = 03:30 UTC June 9. A naive UTC-day diff would say 0;
  // the ET-aware diff must say 1.
  assert.equal(ageDaysEt('2026-06-08T23:30:00-04:00', NOW), 1);
  assert.equal(ageDaysEt('2026-06-04T10:00:00-04:00', NOW), 5);
  assert.equal(ageDaysEt('2026-06-09T08:00:00-04:00', NOW), 0);
  // Garbage and missing timestamps degrade to null, not a crash.
  assert.equal(ageDaysEt('not-a-date', NOW), null);
  assert.equal(ageDaysEt(undefined, NOW), null);
});

test('dollars resolve from the first priced field, else null for TBD', () => {
  assert.equal(resolveDollars({ dollarsAtStake: 15000 }), 15000);
  assert.equal(resolveDollars({ dealValue: 8000 }), 8000);
  assert.equal(resolveDollars({ amount: 0 }), 0);
  assert.equal(resolveDollars({ subject: 'no price here' }), null);
  assert.equal(resolveDollars({ amount: 'not-a-number' }), null);
});

test('digest includes pending jobs plus cold drafts, excludes sent/skipped', () => {
  const dir = makeDataDir();
  const digest = buildDigest({ dataDir: dir, now: NOW });

  // 4 pending jobs + 2 cold drafts; the status=sent fixture job is excluded.
  assert.equal(digest.totals.pending, 6);
  const ids = digest.items.map((item) => item.jobId);
  assert.ok(!ids.includes('H0033'), 'sent job must not appear in the queue');
  assert.ok(ids.includes('H0099') && ids.includes('H0100'), 'cold drafts appear');

  const cold = digest.items.find((item) => item.jobId === 'H0099');
  assert.equal(cold.actionClass, 'cold-send');
  assert.equal(cold.company, 'coldco.com');
  assert.equal(cold.senderIdentity, 'kerri@hardwarefyi.com');
  assert.match(cold.oneLineAsk, /awaiting batch approval/);

  const unpriced = digest.items.find((item) => item.jobId === 'G0007');
  assert.equal(unpriced.dollarsAtStake, null);
  assert.equal(unpriced.actionClass, null);
});

test('sort order is dollars descending, then age descending, unpriced last', () => {
  const dir = makeDataDir();
  const digest = buildDigest({ dataDir: dir, now: NOW });
  const ids = digest.items.map((item) => item.jobId);

  // Priced first: H0042 ($15,000) then H0050 ($8,000).
  assert.deepEqual(ids.slice(0, 2), ['H0042', 'H0050']);
  // Unpriced sorted by age descending: H0099 (4d), G0007 (3d), H0061 (1d), H0100 (0d).
  assert.deepEqual(ids.slice(2), ['H0099', 'G0007', 'H0061', 'H0100']);
});

test('totals line counts pending, priced dollars, and oldest age', () => {
  const dir = makeDataDir();
  const digest = buildDigest({ dataDir: dir, now: NOW });
  assert.equal(digest.totals.pricedDollarsAtStake, 23000);
  assert.equal(digest.totals.oldestAgeDays, 5);

  const table = renderTable(digest);
  assert.match(table, /6 pending, \$23,000 priced at stake, oldest 5 days/);
});

test('items strictly older than 3 days get the warning flag', () => {
  const dir = makeDataDir();
  const digest = buildDigest({ dataDir: dir, now: NOW });

  const byId = Object.fromEntries(digest.items.map((item) => [item.jobId, item]));
  assert.equal(byId.H0042.ageDays, 5);
  assert.equal(byId.H0042.stale, true);
  assert.equal(byId.H0099.ageDays, 4);
  assert.equal(byId.H0099.stale, true);
  // Exactly 3 days old is NOT stale; the flag is strictly "older than 3 days".
  assert.equal(byId.G0007.ageDays, 3);
  assert.equal(byId.G0007.stale, false);
  assert.equal(byId.H0061.stale, false);
  assert.equal(byId.H0100.stale, false);

  const tableLines = renderTable(digest).split('\n');
  const flagged = tableLines.filter((line) => line.startsWith('⚠'));
  assert.equal(flagged.length, 2);
  assert.match(flagged.join('\n'), /H0042/);
  assert.match(flagged.join('\n'), /H0099/);
});

test('--json CLI output is machine-readable and matches buildDigest', () => {
  const dir = makeDataDir();
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--data-dir', dir, '--now', NOW_ISO],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.deepEqual(parsed, JSON.parse(JSON.stringify(buildDigest({ dataDir: dir, now: NOW }))));
  assert.equal(parsed.totals.pending, 6);
  assert.equal(parsed.staleAgeDays, 3);
});
