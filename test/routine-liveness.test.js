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
    // String values are raw file content (e.g. sweep-cadence.log); everything else is JSON.
    fs.writeFileSync(path.join(root, 'data', name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return root;
}

// Mirrors the REAL live inbox-sweep-state.json shape (schema in
// agent-prompts/kerri-inbox-sweep/SKILL.md): per-mailbox cursor entries with
// lastSuccessfulSweepAt, plus a top-level updatedAt.
function sweepState(iso) {
  return {
    schema: 'inbox-sweep-state-v1',
    mailboxes: {
      'kerri@hardwarefyi.com': mailboxEntry(iso),
      'brian@hardwarefyi.com': mailboxEntry(iso),
      'brian@kerrihq.com': mailboxEntry(iso),
      'brian@standardandworks.com': mailboxEntry(iso)
    },
    updatedAt: iso
  };
}
function mailboxEntry(lastSuccessfulSweepAt) {
  return {
    seenMessageIds: ['AAMk-example-1', 'AAMk-example-2'],
    lastErrorAt: null,
    lastErrorReason: null,
    lastErrorAlertedAt: null,
    lastSuccessfulSweepAt
  };
}
// The DEGRADED shape observed live on 2026-06-09: sweeps persisted only
// seenMessageIds + lastError*: no updatedAt, no per-mailbox lastSuccessfulSweepAt.
function degradedSweepState() {
  const s = sweepState(null);
  delete s.updatedAt;
  for (const m of Object.values(s.mailboxes)) delete m.lastSuccessfulSweepAt;
  return s;
}
// One sweep-cadence.log line as the sweep actually writes it (lead ISO = completion stamp).
function cadenceLine(iso) {
  return `${iso} quiet | gap 15min | cursors prev->${iso} | 4 mailboxes clean | grade 5\n`;
}

function run(root, now, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--now', now, ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('inbox-sweep fresh inside active window → healthy', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-29T17:50:00Z')
  });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 14:00 ET Fri
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
  assert.deepEqual(rep.darkCore, []);
});

test('inbox-sweep stale inside active window → dark core, ok=false', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-29T17:00:00Z')
  });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 60m stale at 14:00 ET
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.darkCore, ['kerri-inbox-sweep']);
});

test('inbox-sweep stale overnight → paused-ok (no false alarm)', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-30T01:00:00Z')
  });
  const rep = run(root, '2026-05-29T07:00:00Z'); // 03:00 ET Friday, outside window
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'paused-ok');
  assert.equal(rep.ok, true);
});

test('inbox-sweep weekend before first checkpoint → ok', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-06-05T22:00:00Z')
  });
  const rep = run(root, '2026-06-06T13:00:00Z'); // 09:00 ET Saturday
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
});

test('inbox-sweep weekend after missed morning checkpoint → dark core', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-06-05T22:00:00Z')
  });
  const rep = run(root, '2026-06-06T15:00:00Z'); // 11:00 ET Saturday
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.darkCore, ['kerri-inbox-sweep']);
});

test('inbox-sweep weekend after morning success and before afternoon checkpoint → ok', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-06-06T14:05:00Z')
  });
  const rep = run(root, '2026-06-06T19:00:00Z'); // 15:00 ET Saturday
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
});

test('inbox-sweep weekend after missed afternoon checkpoint → dark core', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-06-06T14:05:00Z')
  });
  const rep = run(root, '2026-06-06T21:00:00Z'); // 17:00 ET Saturday
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
  assert.equal(rep.ok, false);
  assert.deepEqual(rep.darkCore, ['kerri-inbox-sweep']);
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
    'inbox-sweep-state.json': sweepState('2026-05-29T17:00:00Z')
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
    'inbox-sweep-state.json': sweepState('2026-06-04T10:25:00Z')
  });
  const rep = run(root, '2026-06-04T11:10:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(rep.ok, true);
});

test('same 45m staleness OUTSIDE the morning window → dark (normal 35m budget)', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-06-04T17:15:00Z')
  });
  const rep = run(root, '2026-06-04T18:00:00Z'); // 45m stale at 14:00 ET
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
});

// --- inbox-sweep success sources: state stamps, cadence log, and the degraded shape ---
// (2026-06-09 incident: live sweeps persisted neither updatedAt nor per-mailbox
// lastSuccessfulSweepAt for hours, so a healthy sweep read "unknown" and a dark one
// would never have paged. The checker now also reads data/sweep-cadence.log.)

test('per-mailbox lastSuccessfulSweepAt alone (no top-level updatedAt) → ok', () => {
  const state = sweepState('2026-05-29T17:50:00Z');
  delete state.updatedAt;
  const root = fixture({ 'inbox-sweep-state.json': state });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 14:00 ET Fri
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
});

test('legacy minimal shape (top-level updatedAt only) still works', () => {
  const root = fixture({
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T17:50:00Z' }
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
});

test('degraded state (no timestamps anywhere) + fresh cadence log → ok via the log', () => {
  const root = fixture({
    'inbox-sweep-state.json': degradedSweepState(),
    'sweep-cadence.log': cadenceLine('2026-05-29T17:30:00Z') + cadenceLine('2026-05-29T17:50:00Z')
  });
  const rep = run(root, '2026-05-29T18:00:00Z'); // 14:00 ET Fri, log 10m fresh
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(sweep.lastSuccessAt, '2026-05-29T17:50:00Z');
});

test('degraded state + STALE cadence log → dark (the log does not weaken detection)', () => {
  const root = fixture({
    'inbox-sweep-state.json': degradedSweepState(),
    'sweep-cadence.log': cadenceLine('2026-05-29T17:00:00Z') // 60m stale at 14:00 ET
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'dark');
  assert.deepEqual(rep.darkCore, ['kerri-inbox-sweep']);
});

test('degraded state + no cadence log → unknown (the exact 2026-06-09 blind-spot shape)', () => {
  const root = fixture({ 'inbox-sweep-state.json': degradedSweepState() });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'unknown');
});

test('cadence log: malformed lead token ("undefined") is skipped, never trusted or fatal', () => {
  const root = fixture({
    'inbox-sweep-state.json': degradedSweepState(),
    // The live log really contains a line whose lead token is the string "undefined".
    'sweep-cadence.log':
      cadenceLine('2026-05-29T17:50:00Z') +
      'undefined material | gap ~8min | new reply -> task update | grade 5\n'
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(sweep.lastSuccessAt, '2026-05-29T17:50:00Z');
});

test('cadence log: only malformed lines → no stamp, stays unknown (no false ok)', () => {
  const root = fixture({
    'inbox-sweep-state.json': degradedSweepState(),
    'sweep-cadence.log': 'undefined material | gap ~8min | grade 5\n'
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'unknown');
});

test('max across sources: stale state stamps + fresher cadence log → the newest wins', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-29T16:00:00Z'), // 2h stale on its own
    'sweep-cadence.log': cadenceLine('2026-05-29T17:50:00Z') // but the log shows a 10m-fresh sweep
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(sweep.lastSuccessAt, '2026-05-29T17:50:00Z');
});

test('max across sources: fresh state + older log → state wins, still ok', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-29T17:50:00Z'),
    'sweep-cadence.log': cadenceLine('2026-05-29T16:00:00Z')
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
  assert.equal(sweep.lastSuccessAt, '2026-05-29T17:50:00Z');
});

test('short-form log stamps (e.g. 2026-06-09T19:18Z, as the live log writes) parse', () => {
  const root = fixture({
    'inbox-sweep-state.json': degradedSweepState(),
    'sweep-cadence.log': '2026-05-29T17:50Z quiet | gap ~11min | 4 mailboxes clean | grade 5\n'
  });
  const rep = run(root, '2026-05-29T18:00:00Z');
  const sweep = rep.routines.find((x) => x.routine === 'kerri-inbox-sweep');
  assert.equal(sweep.status, 'ok');
});

// --- morning-brief: crashed-mid-run vs never-fired vs completed-via-run-state ---

test('morning-brief crashed mid-run → dark, alert says it FIRED but crashed', () => {
  const root = fixture({
    // last successful brief was yesterday; today only a "started" run exists (crash)
    'morning-brief-state.json': { lastBriefAt: '2026-06-03T11:05:00Z' },
    'morning-brief-run-state.json': {
      schema: 'morning-brief-run-state-v1',
      lastRun: { date: '2026-06-04', startedAt: '2026-06-04T11:01:30Z', finishedAt: null, status: 'started' }
    }
  });
  const rep = run(root, '2026-06-04T12:00:00Z'); // 08:00 ET Thu, past fire+grace
  const mb = rep.routines.find((x) => x.routine === 'kerri-morning-brief');
  assert.equal(mb.status, 'dark');
  assert.equal(mb.crashed, true);
  assert.match(mb.detail, /fired .* but crashed/i);
});

test('morning-brief complete via run-state counts as success even if lastBriefAt is stale', () => {
  const root = fixture({
    'morning-brief-state.json': { lastBriefAt: '2026-06-03T11:05:00Z' }, // stale write
    'morning-brief-run-state.json': {
      schema: 'morning-brief-run-state-v1',
      lastRun: { date: '2026-06-04', startedAt: '2026-06-04T11:01:30Z', finishedAt: '2026-06-04T11:05:00Z', status: 'complete' }
    }
  });
  const rep = run(root, '2026-06-04T12:00:00Z');
  const mb = rep.routines.find((x) => x.routine === 'kerri-morning-brief');
  assert.equal(mb.status, 'ok');
});

test('morning-brief never fired → dark, alert says NEVER fired (not a crash)', () => {
  const root = fixture({
    'morning-brief-state.json': { lastBriefAt: '2026-06-03T11:05:00Z' }
    // no run-state at all today
  });
  const rep = run(root, '2026-06-04T12:00:00Z');
  const mb = rep.routines.find((x) => x.routine === 'kerri-morning-brief');
  assert.equal(mb.status, 'dark');
  assert.notEqual(mb.crashed, true);
  assert.match(mb.detail, /never fired/i);
});

test('morning-brief before fire+grace is ok even with a started run on disk', () => {
  const root = fixture({
    'morning-brief-state.json': { lastBriefAt: '2026-06-03T11:05:00Z' },
    'morning-brief-run-state.json': {
      schema: 'morning-brief-run-state-v1',
      lastRun: { date: '2026-06-04', startedAt: '2026-06-04T11:01:30Z', finishedAt: null, status: 'started' }
    }
  });
  const rep = run(root, '2026-06-04T11:10:00Z'); // 07:10 ET — inside grace
  const mb = rep.routines.find((x) => x.routine === 'kerri-morning-brief');
  assert.equal(mb.status, 'ok');
});

// --- industry-intel: ran-today vs never-succeeded vs missing state ---

test('industry-intel ran this morning (ET stamp format) → ok', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: '2026-06-04 06:35 EDT' }
  });
  const rep = run(root, '2026-06-04T12:00:00Z'); // 08:00 ET Thu
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'ok');
});

function touch(root, name, iso) {
  const when = new Date(iso);
  fs.utimesSync(path.join(root, 'data', name), when, when);
}

test('industry-intel bootstrap state with lastRunAt null after grace → dark (zero runs ever)', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: null, processedFeedGuids: [] }
  });
  // State file bootstrapped YESTERDAY: the routine had a fire opportunity and never succeeded.
  touch(root, 'industry-intel-state.json', '2026-06-03T15:00:00Z');
  const rep = run(root, '2026-06-04T12:00:00Z'); // 08:00 ET Thu, past 07:15 ET grace
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'dark');
  assert.match(ii.detail, /zero successful runs/i);
});

test('industry-intel state bootstrapped TODAY with null lastRunAt → ok (no false page before first fire)', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: null }
  });
  touch(root, 'industry-intel-state.json', '2026-06-04T14:30:00Z'); // 10:30 ET same day
  const rep = run(root, '2026-06-04T16:00:00Z'); // 12:00 ET Thu
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'ok');
  assert.match(ii.detail, /bootstrapped today/i);
});

test('industry-intel before fire+grace → ok even with null lastRunAt', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: null }
  });
  const rep = run(root, '2026-06-04T10:30:00Z'); // 06:30 ET Thu — inside grace
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'ok');
});

test('industry-intel stale from yesterday after grace → dark (missed today)', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: '2026-06-03 06:32 EDT' }
  });
  const rep = run(root, '2026-06-04T12:00:00Z');
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'dark');
  assert.match(ii.detail, /no industry-intel run recorded for today/i);
});

test('industry-intel weekend → paused-ok', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: null }
  });
  const rep = run(root, '2026-06-06T15:00:00Z'); // 11:00 ET Saturday
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'paused-ok');
});

test('industry-intel missing state file → unknown, not dark', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-04T12:00:00Z');
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'unknown');
});

test('industry-intel malformed lastRunAt → no crash, treated as stale', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: 'not-a-date' }
  });
  const rep = run(root, '2026-06-04T12:00:00Z');
  const ii = rep.routines.find((x) => x.routine === 'kerri-industry-intel');
  assert.equal(ii.status, 'dark');
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
    'inbox-sweep-state.json': sweepState('2026-05-29T17:00:00Z'),
    'routine-liveness-alert-state.json': { alerted: { 'kerri-inbox-sweep': { since: '2026-05-29T17:30:00Z' } } }
  });
  const rep = run(root, '2026-05-29T18:00:00Z', ['--alert', '--dry-run']);
  assert.equal(rep.alert, undefined); // already alerted → silent
  assert.ok(rep.alertState.alerted['kerri-inbox-sweep']); // stays open
});

test('CLI recovery: open alert + now healthy → recovery ping, alert closed', () => {
  const root = fixture({
    'inbox-sweep-state.json': sweepState('2026-05-29T17:55:00Z'), // fresh at 14:00 ET
    'routine-liveness-alert-state.json': { alerted: { 'kerri-inbox-sweep': { since: '2026-05-29T16:00:00Z' } } }
  });
  const rep = run(root, '2026-05-29T18:00:00Z', ['--alert', '--dry-run']);
  assert.ok(rep.recovery);
  assert.equal(rep.recovery.sent, false);
  assert.match(rep.recovery.message, /recovered.*kerri-inbox-sweep/);
  assert.equal(rep.alertState.alerted['kerri-inbox-sweep'], undefined);
});
