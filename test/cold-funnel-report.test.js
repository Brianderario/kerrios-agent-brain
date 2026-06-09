import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ageDaysEt, buildFunnelReport, renderReport } from '../scripts/cold-funnel-report.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(TEST_DIR, '..', 'scripts', 'cold-funnel-report.mjs');
const FIXTURE_DIR = path.join(TEST_DIR, 'fixtures', 'cold-funnel');

// Fixed "now": Monday 2026-06-09 3:00pm ET. All fixture ages are relative to this.
const NOW_ISO = '2026-06-09T15:00:00-04:00';
const NOW = new Date(NOW_ISO);

function makeDataDir({ withColdState = true } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cold-funnel-'));
  if (withColdState) {
    fs.copyFileSync(
      path.join(FIXTURE_DIR, 'cold-outreach-state.sample.json'),
      path.join(dir, 'cold-outreach-state.json')
    );
  }
  return dir;
}

test('funnel report tolerates missing cold-outreach-state.json', () => {
  const dir = makeDataDir({ withColdState: false });
  const report = buildFunnelReport({ dataDir: dir, now: NOW });
  assert.equal(report.sent.total, 0);
  assert.equal(report.replied.total, 0);
  assert.equal(report.drafted.count, 0);
  assert.equal(report.secondTouch.eligible, 0);

  const text = renderReport(report);
  assert.match(text, /COLD OUTREACH FUNNEL/);
  assert.match(text, /Sent:\s+0/);
});

test('funnel report counts sent, replied, and drafted correctly', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW });

  assert.equal(report.sent.total, 6, 'total sent');
  assert.equal(report.replied.total, 2, 'total replied');
  assert.equal(report.replied.positive, 1);
  assert.equal(report.replied.neutral, 1);
  assert.equal(report.replied.negative, 0);
  assert.equal(report.drafted.count, 2, 'drafted count');
});

test('reply rate is computed correctly', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW });
  // 2 replied / 6 sent = 33.3%
  assert.equal(report.replied.replyRate, 33.3);
});

test('second-touch eligible filters correctly', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW, thresholdDays: 7 });

  // sent 6: alice (replied), bob (second-touch already sent), carol (8 days ago, eligible),
  // dave (6 days ago, not yet 7), eve (1 day ago, too recent), frank (replied)
  // Only carol@gamma.com qualifies: 8 days old, not replied, not second-touched.
  assert.equal(report.secondTouch.eligible, 1);
  assert.equal(report.secondTouch.eligibleEntries[0].email, 'carol@gamma.com');
  assert.equal(report.secondTouch.sent, 1, 'one second touch already sent');
});

test('second-touch eligible with lower threshold includes more entries', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW, thresholdDays: 5 });

  // With threshold=5: carol (8d, eligible), dave (6d, eligible) = 2 eligible.
  // alice and frank are replied. bob has second-touch sent. eve is only 1d.
  assert.equal(report.secondTouch.eligible, 2);
});

test('awaiting count excludes replied and recent sends', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW });

  // Awaiting = sent 5+ days ago, not replied.
  // alice (14d, replied - excluded), bob (12d, second-touch sent but NOT replied - included),
  // carol (8d, not replied - included), dave (6d, included),
  // eve (1d, too recent), frank (20d, replied - excluded)
  assert.equal(report.awaiting.count, 3);
});

test('notable replies captures positive sentiment with company info', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW });

  assert.equal(report.replied.notable.length, 1);
  assert.equal(report.replied.notable[0].company, 'Alpha Corp');
  assert.match(report.replied.notable[0].note, /warm referral/);
});

test('human-readable report includes key sections', () => {
  const dir = makeDataDir();
  const report = buildFunnelReport({ dataDir: dir, now: NOW });
  const text = renderReport(report);

  assert.match(text, /COLD OUTREACH FUNNEL/);
  assert.match(text, /Sent:\s+6/);
  assert.match(text, /Replied:\s+2/);
  assert.match(text, /Drafted:\s+2/);
  assert.match(text, /Second-touch eligible:\s+1/);
  assert.match(text, /Positive:\s+1/);
  assert.match(text, /Alpha Corp/);
});

test('--json CLI output is valid JSON matching buildFunnelReport', () => {
  const dir = makeDataDir();
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--data-dir', dir, '--now', NOW_ISO],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.sent.total, 6);
  assert.equal(parsed.replied.total, 2);
  assert.equal(parsed.secondTouch.eligible, 1);
});

test('--root flag works as alias for --data-dir', () => {
  const dir = makeDataDir();
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--root', dir, '--now', NOW_ISO],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.sent.total, 6);
});

test('--threshold flag adjusts second-touch eligibility', () => {
  const dir = makeDataDir();
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--data-dir', dir, '--now', NOW_ISO, '--threshold', '5'],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.secondTouch.eligible, 2);
  assert.equal(parsed.thresholdDays, 5);
});

test('age computation is ET-calendar-day aware (reuses etDayNumber pattern)', () => {
  assert.equal(ageDaysEt('2026-06-08T23:30:00-04:00', NOW), 1);
  assert.equal(ageDaysEt('2026-06-04T10:00:00-04:00', NOW), 5);
  assert.equal(ageDaysEt('2026-06-09T08:00:00-04:00', NOW), 0);
  assert.equal(ageDaysEt('not-a-date', NOW), null);
  assert.equal(ageDaysEt(undefined, NOW), null);
});
