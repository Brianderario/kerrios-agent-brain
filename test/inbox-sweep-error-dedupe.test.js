import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { evaluateErrorDedupe } from '../scripts/inbox-sweep-error-dedupe.mjs';

function state() {
  return {
    schema: 'inbox-sweep-state-v1',
    mailboxes: {
      'brian@standardandworks.com': {
        lastSuccessfulSweepAt: '2026-06-06T21:35:21.459Z',
        seenMessageIds: [],
        lastErrorAt: null,
        lastErrorReason: null,
        lastErrorAlertedAt: null
      }
    }
  };
}

test('first connector outage is alertable and records reason', () => {
  const s = state();
  const result = evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T22:10:00Z'
  });
  assert.equal(result.shouldAlert, true);
  assert.equal(s.mailboxes['brian@standardandworks.com'].lastErrorReason, 'S/W Superhuman connector unavailable');
});

test('same outage inside 24h after an alert is suppressed', () => {
  const s = state();
  evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T22:10:00Z',
    markAlerted: true
  });
  const repeat = evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T22:25:00Z'
  });
  assert.equal(repeat.shouldAlert, false);
});

test('changed reason and post-recovery repeat are alertable', () => {
  const s = state();
  evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T22:10:00Z',
    markAlerted: true
  });
  const changed = evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'Google Tasks unavailable',
    nowIso: '2026-06-06T22:25:00Z'
  });
  assert.equal(changed.shouldAlert, true);

  evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T22:40:00Z',
    markAlerted: true
  });
  s.mailboxes['brian@standardandworks.com'].lastSuccessfulSweepAt = '2026-06-06T23:00:00Z';
  const afterRecovery = evaluateErrorDedupe(s, {
    component: 'brian@standardandworks.com',
    reason: 'S/W Superhuman connector unavailable',
    nowIso: '2026-06-06T23:05:00Z'
  });
  assert.equal(afterRecovery.shouldAlert, true);
});

test('CLI updates the state file', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inbox-sweep-error-dedupe-'));
  const stateFile = path.join(root, 'state.json');
  fs.writeFileSync(stateFile, `${JSON.stringify(state(), null, 2)}\n`);
  const script = fileURLToPath(new URL('../scripts/inbox-sweep-error-dedupe.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [
    script,
    '--state',
    stateFile,
    '--component',
    'brian@standardandworks.com',
    '--reason',
    'S/W Superhuman connector unavailable',
    '--now',
    '2026-06-06T22:10:00Z',
    '--mark-alerted'
  ], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const next = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  assert.equal(next.mailboxes['brian@standardandworks.com'].lastErrorAlertedAt, '2026-06-06T22:10:00.000Z');
});
