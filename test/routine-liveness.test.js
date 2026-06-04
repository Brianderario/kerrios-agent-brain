import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { decideRoutineAlerts } from '../scripts/routine-liveness-check.mjs';

const script = fileURLToPath(new URL('../scripts/routine-liveness-check.mjs', import.meta.url));

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-liveness-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, 'data', name), JSON.stringify(value));
  }
  return root;
}

function run(root, now, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--now', now, ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('inbox-sweep fresh inside active window → healthy', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:50:00Z' }
  });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 14:00 ET Fri
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
  assert.deepEqual(rep.darkCore, []);
});

test('inbox-sweep stale inside active window → dark core, ok=false', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:00:00Z' }
  });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 60m stale at 14:00 ET
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.darkCore, ['kerri-inbox-sweep']);
});

test('inbox-sweep stale overnight → paused-ok (no false alarm)', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-30T01:00:00Z' }
  });
  const rep = run(root, '2026-05-30T07:00:00Z'); // 03:00 ET, outside window
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'paused-ok');
  assert.equal(rep.ok, true);
});

test('missing state file → unknown, not dark', () => {
  const root = fixture({});
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'unknown');
  assert.equal(rep.ok, true); // unknown never trips the core alarm
});

test('--alert --dry-run surfaces the message without sending', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:00:00Z' }
  });
  const rep = run(root, '2026-05-29T18:00:00Z', ['--alert', '--dry-run']);
  assert.ok(rep.alert);
  assert.equal(rep.alert.sent, false);
  assert.match(rep.alert.message, /kerri-inbox-sweep/);
});

// --- morning relaunch grace: a self-healing gap must not page Brian ---

test('inbox-sweep mildly stale DURING the morning relaunch window → ok (grace)', () => {
  const root = fixture({
    // 45m stale at 07:10 ET (11:10Z) — inside the 06:45–07:45 ET widened budget of 50m.
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-06-04T10:25:00Z' }
  });
  const rep = run(root, '2026-06-04T11:10:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
});

test('same 45m staleness OUTSIDE the morning window → dark (normal 35m budget)', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-06-04T17:15:00Z' }
  });
  const rep = run(root, '2026-06-04T18:00:00Z'); // 45m stale at 14:00 ET
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
});

// --- alert dedup + recovery (pure decision) ---

const dark = (name) => ({ routine: name, status: 'dark', detail: 'stale', ageMinutes: 60 });
const ok = (name, age = 5) => ({ routine: name, status: 'ok', ageMinutes: age });
const NOW = new Date('2026-06-04T18:00:00Z');

test('decideRoutineAlerts: first time dark → alert once, open the alert', () => {
  const report = { routines: [dark('kerri-inbox-sweep')] };
  const { newlyDark, recovered, nextState } = decideRoutineAlerts(report, { alerted: {} }, NOW);
  assert.deepEqual(newlyDark, ['kerri-inbox-sweep']);
  assert.deepEqual(recovered, []);
  assert.ok(nextState.alerted['kerri-inbox-sweep']);
});

test('decideRoutineAlerts: still dark with an open alert → no repeat (the anti-spam guarantee)', () => {
  const report = { routines: [dark('kerri-inbox-sweep')] };
  const prev = { alerted: { 'kerri-inbox-sweep': { since: '2026-06-04T17:00:00Z' } } };
  const { newlyDark, recovered, nextState } = decideRoutineAlerts(report, prev, NOW);
  assert.deepEqual(newlyDark, []);
  assert.deepEqual(recovered, []);
  assert.ok(nextState.alerted['kerri-inbox-sweep']); // stays open
});

test('decideRoutineAlerts: recovered → one recovery ping, close the alert', () => {
  const report = { routines: [ok('kerri-inbox-sweep', 3)] };
  const prev = { alerted: { 'kerri-inbox-sweep': { since: '2026-06-04T17:00:00Z' } } };
  const { newlyDark, recovered, nextState } = decideRoutineAlerts(report, prev, NOW);
  assert.deepEqual(newlyDark, []);
  assert.deepEqual(recovered, ['kerri-inbox-sweep']);
  assert.equal(nextState.alerted['kerri-inbox-sweep'], undefined); // closed
});

test('decideRoutineAlerts: paused-ok counts as recovered', () => {
  const report = { routines: [{ routine: 'kerri-inbox-sweep', status: 'paused-ok' }] };
  const prev = { alerted: { 'kerri-inbox-sweep': { since: '2026-06-04T17:00:00Z' } } };
  const { recovered, nextState } = decideRoutineAlerts(report, prev, NOW);
  assert.deepEqual(recovered, ['kerri-inbox-sweep']);
  assert.equal(nextState.alerted['kerri-inbox-sweep'], undefined);
});

test('decideRoutineAlerts: went unknown → NOT a false all-clear, alert stays open', () => {
  const report = { routines: [{ routine: 'kerri-inbox-sweep', status: 'unknown' }] };
  const prev = { alerted: { 'kerri-inbox-sweep': { since: '2026-06-04T17:00:00Z' } } };
  const { newlyDark, recovered, nextState } = decideRoutineAlerts(report, prev, NOW);
  assert.deepEqual(newlyDark, []);
  assert.deepEqual(recovered, []);
  assert.ok(nextState.alerted['kerri-inbox-sweep']); // kept open — no premature recovery
});

// --- alert dedup + recovery (end-to-end via CLI, dry-run so no real text is sent) ---

test('CLI dedup: still-dark routine with an open alert produces NO new alert', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:00:00Z' },
    'routine-liveness-alert-state.json': { alerted: { 'kerri-inbox-sweep': { since: '2026-05-29T17:30:00Z' } } }
  });
  const rep = run(root, '2026-05-29T18:00:00Z', ['--alert', '--dry-run']);
  assert.equal(rep.alert, undefined); // already alerted → silent
  assert.ok(rep.alertState.alerted['kerri-inbox-sweep']); // stays open
});

test('CLI recovery: open alert + now healthy → recovery ping, alert closed', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:55:00Z' }, // fresh at 14:00 ET
    'routine-liveness-alert-state.json': { alerted: { 'kerri-inbox-sweep': { since: '2026-05-29T16:00:00Z' } } }
  });
  const rep = run(root, '2026-05-29T18:00:00Z', ['--alert', '--dry-run']);
  assert.ok(rep.recovery);
  assert.equal(rep.recovery.sent, false);
  assert.match(rep.recovery.message, /recovered.*kerri-inbox-sweep/);
  assert.equal(rep.alertState.alerted['kerri-inbox-sweep'], undefined);
});
