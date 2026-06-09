import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildAutoLoggedReport,
  buildRampReport,
  renderAutoLogged,
  renderRamp
} from '../scripts/autonomy-report.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(TEST_DIR, '..', 'scripts', 'autonomy-report.mjs');

// Fixed "now": Tuesday 2026-06-09 3:00pm ET, same convention as approval-queue-digest tests.
const NOW_ISO = '2026-06-09T15:00:00-04:00';
const NOW = new Date(NOW_ISO);

// Minimal policy fixture mirroring data/autonomy-policy.json's shape.
const POLICY = {
  version: 1,
  classes: {
    'internal-recipient-reply': { tier: 'auto-logged' },
    'scheduling-logistics-reply': { tier: 'ask', rampEligible: true },
    'warm-thread-holding-reply': { tier: 'ask', rampEligible: true },
    'sponsor-substantive-reply': { tier: 'ask', rampEligible: false }
  },
  graduation: { minApprovals: 3, maxEditRate: 0.4, maxDoubleEmailIncidents: 0 }
};

function job(overrides) {
  return {
    jobId: 'H0001',
    company: 'Acme',
    status: 'sent',
    sentAt: '2026-06-09T10:00:00-04:00',
    originalDraft: 'draft',
    sentDraft: 'draft',
    ...overrides
  };
}

function makeDataDir({ policy = POLICY, jobs = [] } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'autonomy-report-'));
  if (policy !== null) {
    fs.writeFileSync(path.join(dir, 'autonomy-policy.json'), JSON.stringify(policy));
  }
  if (jobs !== null) {
    fs.writeFileSync(path.join(dir, 'jobs.json'), JSON.stringify(jobs));
  }
  return dir;
}

// ---- ramp mode -------------------------------------------------------------

test('ramp fails closed when the policy is missing or unparseable', () => {
  const dir = makeDataDir({ policy: null });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  assert.equal(report.policyLoaded, false);
  assert.deepEqual(report.classes, []);
  assert.deepEqual(report.readyForPromotion, []);
  assert.match(renderRamp(report), /missing or unreadable.*fails closed/i);

  fs.writeFileSync(path.join(dir, 'autonomy-policy.json'), '{not json');
  assert.equal(buildRampReport({ dataDir: dir, now: NOW }).policyLoaded, false);
});

test('ramp tolerates missing jobs.json (worktree default)', () => {
  const dir = makeDataDir({ jobs: null });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  assert.equal(report.policyLoaded, true);
  assert.equal(report.classes.length, 4);
  for (const c of report.classes) {
    assert.equal(c.approvals, 0);
    assert.equal(c.meetsBar, false);
  }
});

test('a ramp-eligible ask class meets the bar on clean track record', () => {
  const dir = makeDataDir({
    jobs: [
      job({ jobId: 'H0001', actionClass: 'scheduling-logistics-reply' }),
      job({ jobId: 'H0002', actionClass: 'scheduling-logistics-reply' }),
      job({ jobId: 'H0003', actionClass: 'scheduling-logistics-reply', sentDraft: 'edited by Brian' })
    ]
  });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  const c = report.classes.find((x) => x.actionClass === 'scheduling-logistics-reply');
  assert.equal(c.approvals, 3);
  assert.equal(c.edited, 1);
  assert.ok(Math.abs(c.editRate - 1 / 3) < 1e-9);
  assert.equal(c.meetsBar, true);
  assert.deepEqual(report.readyForPromotion, ['scheduling-logistics-reply']);
  assert.match(renderRamp(report), /READY FOR PROMOTION \(Brian decides\): scheduling-logistics-reply/);
});

test('edit rate above the bar blocks graduation', () => {
  const dir = makeDataDir({
    jobs: [
      job({ jobId: 'H0001', actionClass: 'warm-thread-holding-reply', sentDraft: 'edit 1' }),
      job({ jobId: 'H0002', actionClass: 'warm-thread-holding-reply', sentDraft: 'edit 2' }),
      job({ jobId: 'H0003', actionClass: 'warm-thread-holding-reply' })
    ]
  });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  const c = report.classes.find((x) => x.actionClass === 'warm-thread-holding-reply');
  assert.equal(c.approvals, 3);
  assert.equal(c.meetsBar, false);
});

test('any double-email incident blocks graduation', () => {
  const dir = makeDataDir({
    jobs: [
      job({ jobId: 'H0001', actionClass: 'scheduling-logistics-reply' }),
      job({ jobId: 'H0002', actionClass: 'scheduling-logistics-reply' }),
      job({ jobId: 'H0003', actionClass: 'scheduling-logistics-reply', doubleEmailBlocks: 1 })
    ]
  });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  const c = report.classes.find((x) => x.actionClass === 'scheduling-logistics-reply');
  assert.equal(c.doubleEmailIncidents, 1);
  assert.equal(c.meetsBar, false);
});

test('non-ramp-eligible and already-promoted classes never meet the bar', () => {
  const clean = (actionClass) => [
    job({ jobId: 'H0001', actionClass }),
    job({ jobId: 'H0002', actionClass }),
    job({ jobId: 'H0003', actionClass })
  ];
  const dir = makeDataDir({
    jobs: [...clean('sponsor-substantive-reply'), ...clean('internal-recipient-reply')]
  });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  for (const name of ['sponsor-substantive-reply', 'internal-recipient-reply']) {
    const c = report.classes.find((x) => x.actionClass === name);
    assert.equal(c.approvals, 3);
    assert.equal(c.meetsBar, false, `${name} must not surface for promotion`);
  }
  assert.deepEqual(report.readyForPromotion, []);
});

test('pre-Wave-0 jobs (no sentDraft/originalDraft) do not count toward the bar', () => {
  const dir = makeDataDir({
    jobs: [
      job({ jobId: 'H0001', actionClass: 'scheduling-logistics-reply' }),
      { jobId: 'H0090', actionClass: 'scheduling-logistics-reply', status: 'sent' },
      { jobId: 'H0091', actionClass: 'scheduling-logistics-reply', status: 'pending', originalDraft: 'x', sentDraft: 'x' }
    ]
  });
  const report = buildRampReport({ dataDir: dir, now: NOW });
  const c = report.classes.find((x) => x.actionClass === 'scheduling-logistics-reply');
  assert.equal(c.approvals, 1);
});

// ---- auto-logged mode ------------------------------------------------------

test('auto-logged lists only autoLogged sent jobs inside the window', () => {
  const dir = makeDataDir({
    jobs: [
      job({
        jobId: 'H0010',
        actionClass: 'internal-recipient-reply',
        autoLogged: true,
        sentAt: '2026-06-09T09:00:00-04:00',
        replyTo: 'ari@kerrihq.com',
        subject: 'Re: budget sync'
      }),
      // Outside the default 24h window.
      job({
        jobId: 'H0011',
        actionClass: 'internal-recipient-reply',
        autoLogged: true,
        sentAt: '2026-06-07T09:00:00-04:00'
      }),
      // Approved-by-Brian send: not auto-logged, must not appear.
      job({ jobId: 'H0012', actionClass: 'internal-recipient-reply', sentAt: '2026-06-09T09:00:00-04:00' }),
      // Auto-logged but not yet sent (should be impossible; excluded regardless).
      job({ jobId: 'H0013', autoLogged: true, status: 'pending', sentAt: '2026-06-09T09:00:00-04:00' })
    ]
  });
  const report = buildAutoLoggedReport({ dataDir: dir, now: NOW });
  assert.equal(report.totals.autoLoggedSends, 1);
  assert.equal(report.items[0].jobId, 'H0010');
  assert.equal(report.items[0].recipients, 'ari@kerrihq.com');
  assert.match(renderAutoLogged(report), /H0010.*Acme.*ari@kerrihq\.com.*budget sync/);
});

test('--since widens the auto-logged window', () => {
  const dir = makeDataDir({
    jobs: [
      job({ jobId: 'H0011', autoLogged: true, sentAt: '2026-06-07T09:00:00-04:00' })
    ]
  });
  const narrow = buildAutoLoggedReport({ dataDir: dir, now: NOW });
  assert.equal(narrow.totals.autoLoggedSends, 0);
  assert.match(renderAutoLogged(narrow), /No auto-logged sends since/);

  const wide = buildAutoLoggedReport({ dataDir: dir, now: NOW, since: '2026-06-06T00:00:00-04:00' });
  assert.equal(wide.totals.autoLoggedSends, 1);
});

// ---- CLI -------------------------------------------------------------------

test('CLI exits 0 in both modes, including with no data files', () => {
  const dir = makeDataDir({ policy: null, jobs: null });
  const ramp = execFileSync(process.execPath, [SCRIPT_PATH, '--ramp', '--data-dir', dir, '--now', NOW_ISO], {
    encoding: 'utf8'
  });
  assert.match(ramp, /fails closed/);

  const auto = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--auto-logged', '--data-dir', dir, '--now', NOW_ISO, '--json'],
    { encoding: 'utf8' }
  );
  assert.equal(JSON.parse(auto).totals.autoLoggedSends, 0);
});
