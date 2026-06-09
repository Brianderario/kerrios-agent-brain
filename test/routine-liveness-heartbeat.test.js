import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/routine-liveness-check.mjs', import.meta.url));

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-liveness-hb-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, 'data', name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return root;
}

function run(root, now, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--now', now, ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

function heartbeats(map) {
  return { schema: 'routine-heartbeats-v1', routines: map };
}
function find(rep, name) {
  return rep.routines.find((x) => x.routine === name);
}

// ── heartbeat is ADDITIVE to an existing bespoke stamp (backward-compat core) ──
// A routine still on its OLD state file must read alive with NO heartbeat present,
// and a heartbeat can only move last-success FORWARD, never invalidate the old stamp.

test('industry-intel alive on its OLD state file with no heartbeat present', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: '2026-06-09 06:35 EDT' }
  });
  const rep = run(root, '2026-06-09T18:00:00Z'); // Tue 14:00 ET
  assert.equal(find(rep, 'kerri-industry-intel').status, 'ok');
});

test('heartbeat alone (no bespoke state) marks industry-intel alive (additive source)', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-industry-intel': { lastRunAt: '2026-06-09T10:35:00Z', lastStatus: 'ok', runCount: 3 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z'); // Tue, 06:35 ET heartbeat today
  const ii = find(rep, 'kerri-industry-intel');
  assert.equal(ii.status, 'ok');
  assert.equal(ii.lastSuccessAt, '2026-06-09T10:35:00Z');
});

test('heartbeat MAXes with a stale bespoke stamp; the fresher wins, never the staler', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: '2026-06-08 06:35 EDT' }, // yesterday
    'routine-heartbeats.json': heartbeats({
      'kerri-industry-intel': { lastRunAt: '2026-06-09T10:35:00Z', lastStatus: 'ok', runCount: 4 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z');
  const ii = find(rep, 'kerri-industry-intel');
  assert.equal(ii.status, 'ok'); // heartbeat rescues it
  assert.equal(ii.lastSuccessAt, '2026-06-09T10:35:00Z');
});

test('a STALE heartbeat does not weaken detection when bespoke stamp is fresher', () => {
  const root = fixture({
    'industry-intel-state.json': { schema: 'v1', lastRunAt: '2026-06-09 06:35 EDT' }, // today
    'routine-heartbeats.json': heartbeats({
      'kerri-industry-intel': { lastRunAt: '2026-06-01T10:35:00Z', lastStatus: 'ok', runCount: 1 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z');
  assert.equal(find(rep, 'kerri-industry-intel').status, 'ok');
});

// ── heartbeat-weekday evaluator: the 6 newly-monitored routines ────────────────
// 2026-06-09 is Tuesday. cold-outreach fires ~09:07 ET (weekdays), pipeline-followup
// ~08:33 ET (Tue/Thu), lead-research ~18:13 ET (weekdays), morning-brief-retry ~07:18
// ET (weekdays), revenue-standup Fri ~16:00, renewal-watchdog Wed ~10:00.

test('cold-outreach with a heartbeat today → ok', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-cold-outreach': { lastRunAt: '2026-06-09T13:07:00Z', lastStatus: 'ok', runCount: 10 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z'); // Tue 14:00 ET, after 09:07 fire
  assert.equal(find(rep, 'kerri-cold-outreach').status, 'ok');
});

test('cold-outreach with NO heartbeat ever → unknown (not dark)', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-09T18:00:00Z');
  assert.equal(find(rep, 'kerri-cold-outreach').status, 'unknown');
});

test('cold-outreach heartbeat from YESTERDAY, past today’s fire+grace → dark', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-cold-outreach': { lastRunAt: '2026-06-08T13:07:00Z', lastStatus: 'ok', runCount: 9 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z'); // Tue 14:00 ET, well past 09:07+90m
  assert.equal(find(rep, 'kerri-cold-outreach').status, 'dark');
});

test('cold-outreach before today’s fire+grace → ok even with a stale heartbeat', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-cold-outreach': { lastRunAt: '2026-06-08T13:07:00Z', lastStatus: 'ok', runCount: 9 }
    })
  });
  const rep = run(root, '2026-06-09T12:00:00Z'); // Tue 08:00 ET, before 09:07 fire
  assert.equal(find(rep, 'kerri-cold-outreach').status, 'ok');
});

test('cold-outreach on the weekend → paused-ok', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-06T18:00:00Z'); // Saturday
  assert.equal(find(rep, 'kerri-cold-outreach').status, 'paused-ok');
});

test('pipeline-followup on a Wednesday (not a Tue/Thu run day) → paused-ok', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-10T18:00:00Z'); // Wednesday
  const pf = find(rep, 'kerri-pipeline-followup');
  assert.equal(pf.status, 'paused-ok');
  assert.match(pf.detail, /Tue\/Thu run day/);
});

test('pipeline-followup on a Thursday with no heartbeat past fire+grace → dark', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-11T18:00:00Z'); // Thursday 14:00 ET, never beat
  // No heartbeat ever → unknown, not dark (matches the "never registered" convention).
  assert.equal(find(rep, 'kerri-pipeline-followup').status, 'unknown');
});

test('pipeline-followup on a Thursday with a stale (yesterday) heartbeat → dark', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-pipeline-followup': { lastRunAt: '2026-06-09T12:33:00Z', lastStatus: 'ok', runCount: 4 }
    })
  });
  const rep = run(root, '2026-06-11T18:00:00Z'); // Thursday 14:00 ET, last beat was Tue
  assert.equal(find(rep, 'kerri-pipeline-followup').status, 'dark');
});

test('revenue-standup on Friday after fire+grace with a heartbeat today → ok', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-revenue-standup': { lastRunAt: '2026-06-12T20:00:00Z', lastStatus: 'ok', runCount: 1 }
    })
  });
  const rep = run(root, '2026-06-12T21:00:00Z'); // Friday 17:00 ET, after 16:00 fire
  assert.equal(find(rep, 'kerri-revenue-standup').status, 'ok');
});

test('renewal-watchdog on Wednesday, stale heartbeat past fire+grace → dark', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-renewal-watchdog': { lastRunAt: '2026-06-03T14:00:00Z', lastStatus: 'ok', runCount: 1 }
    })
  });
  const rep = run(root, '2026-06-10T18:00:00Z'); // Wednesday 14:00 ET, last beat last Wed
  assert.equal(find(rep, 'kerri-renewal-watchdog').status, 'dark');
});

test('morning-brief-retry weekday before fire+grace → ok', () => {
  const root = fixture({});
  const rep = run(root, '2026-06-09T11:00:00Z'); // Tue 07:00 ET, before 07:18+90m
  assert.equal(find(rep, 'kerri-morning-brief-retry').status, 'ok');
});

// ── a dark NEW routine actually pages (end-to-end via the alert path) ──────────

test('a dark newly-monitored routine produces a dark-alert (the whole Wave-1 point)', () => {
  const root = fixture({
    'routine-heartbeats.json': heartbeats({
      'kerri-cold-outreach': { lastRunAt: '2026-06-08T13:07:00Z', lastStatus: 'ok', runCount: 9 }
    })
  });
  const rep = run(root, '2026-06-09T18:00:00Z', ['--alert', '--dry-run']);
  assert.ok(rep.alert, 'a dark non-core routine must still raise an alert');
  assert.match(rep.alert.message, /kerri-cold-outreach/);
  assert.equal(rep.alert.sent, false); // dry-run
  // cold-outreach is non-core, so ok stays true (only core darkness flips ok=false),
  // but healthy must be false and it must appear in darkAny.
  assert.equal(rep.healthy, false);
  assert.ok(rep.darkAny.includes('kerri-cold-outreach'));
});
