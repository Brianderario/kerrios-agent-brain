import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { applyHeartbeat, readHeartbeats } from '../scripts/heartbeat.mjs';

const script = fileURLToPath(new URL('../scripts/heartbeat.mjs', import.meta.url));

function tmpDataDir() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-heartbeat-'));
  const dir = path.join(root, 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function run(dataDir, routine, extra = []) {
  const r = spawnSync('node', [script, '--routine', routine, '--data-dir', dataDir, ...extra], {
    encoding: 'utf8'
  });
  return r;
}

function readFile(dataDir) {
  return JSON.parse(fs.readFileSync(path.join(dataDir, 'routine-heartbeats.json'), 'utf8'));
}

// ── pure logic ───────────────────────────────────────────────────────────────

test('applyHeartbeat creates a fresh entry with runCount 1', () => {
  const next = applyHeartbeat(
    { schema: 'routine-heartbeats-v1', routines: {} },
    { routine: 'kerri-cold-outreach', status: 'ok', nowIso: '2026-06-09T13:07:00.000Z' }
  );
  assert.deepEqual(next.routines['kerri-cold-outreach'], {
    lastRunAt: '2026-06-09T13:07:00.000Z',
    lastStatus: 'ok',
    runCount: 1
  });
});

test('applyHeartbeat bumps runCount and updates the stamp, leaving other routines intact', () => {
  const prior = {
    schema: 'routine-heartbeats-v1',
    routines: {
      'kerri-cold-outreach': { lastRunAt: '2026-06-08T13:07:00.000Z', lastStatus: 'ok', runCount: 5 },
      'kerri-lead-research': { lastRunAt: '2026-06-08T22:13:00.000Z', lastStatus: 'quiet', runCount: 3 }
    }
  };
  const next = applyHeartbeat(prior, {
    routine: 'kerri-cold-outreach',
    status: 'quiet',
    nowIso: '2026-06-09T13:07:00.000Z'
  });
  assert.equal(next.routines['kerri-cold-outreach'].runCount, 6);
  assert.equal(next.routines['kerri-cold-outreach'].lastStatus, 'quiet');
  assert.equal(next.routines['kerri-cold-outreach'].lastRunAt, '2026-06-09T13:07:00.000Z');
  // unrelated routine untouched
  assert.deepEqual(next.routines['kerri-lead-research'], prior.routines['kerri-lead-research']);
});

test('applyHeartbeat is defensive about a corrupt prior runCount', () => {
  const next = applyHeartbeat(
    { routines: { 'kerri-x': { runCount: 'oops' } } },
    { routine: 'kerri-x', status: 'ok', nowIso: '2026-06-09T13:00:00.000Z' }
  );
  assert.equal(next.routines['kerri-x'].runCount, 1);
});

test('readHeartbeats tolerates a missing or corrupt file (starts fresh)', () => {
  const dir = tmpDataDir();
  assert.deepEqual(readHeartbeats(dir), { schema: 'routine-heartbeats-v1', routines: {} });
  fs.writeFileSync(path.join(dir, 'routine-heartbeats.json'), '{not json');
  assert.deepEqual(readHeartbeats(dir), { schema: 'routine-heartbeats-v1', routines: {} });
});

// ── CLI behavior ─────────────────────────────────────────────────────────────

test('CLI stamps a heartbeat, exits 0, and writes the file', () => {
  const dir = tmpDataDir();
  const r = run(dir, 'kerri-cold-outreach', ['--status', 'ok', '--now', '2026-06-09T13:07:00.000Z']);
  assert.equal(r.status, 0);
  const file = readFile(dir);
  assert.equal(file.routines['kerri-cold-outreach'].lastStatus, 'ok');
  assert.equal(file.routines['kerri-cold-outreach'].runCount, 1);
  assert.equal(file.routines['kerri-cold-outreach'].lastRunAt, '2026-06-09T13:07:00.000Z');
});

test('CLI defaults status to ok and tolerates an invalid status', () => {
  const dir = tmpDataDir();
  run(dir, 'kerri-x'); // no --status
  assert.equal(readFile(dir).routines['kerri-x'].lastStatus, 'ok');
  run(dir, 'kerri-x', ['--status', 'bogus']);
  assert.equal(readFile(dir).routines['kerri-x'].lastStatus, 'ok');
});

test('CLI appends across runs and is multi-routine safe', () => {
  const dir = tmpDataDir();
  run(dir, 'kerri-cold-outreach', ['--now', '2026-06-09T13:07:00.000Z']);
  run(dir, 'kerri-cold-outreach', ['--now', '2026-06-10T13:07:00.000Z']);
  run(dir, 'kerri-lead-research', ['--status', 'quiet', '--now', '2026-06-10T22:13:00.000Z']);
  const file = readFile(dir);
  assert.equal(file.routines['kerri-cold-outreach'].runCount, 2);
  assert.equal(file.routines['kerri-cold-outreach'].lastRunAt, '2026-06-10T13:07:00.000Z');
  assert.equal(file.routines['kerri-lead-research'].runCount, 1);
  assert.equal(file.routines['kerri-lead-research'].lastStatus, 'quiet');
});

test('CLI recovers from a corrupt heartbeats file by starting fresh, never failing', () => {
  const dir = tmpDataDir();
  fs.writeFileSync(path.join(dir, 'routine-heartbeats.json'), 'garbage{');
  const r = run(dir, 'kerri-x', ['--now', '2026-06-09T13:00:00.000Z']);
  assert.equal(r.status, 0);
  assert.equal(readFile(dir).routines['kerri-x'].runCount, 1);
});

test('CLI exits 0 even with no --routine (never fails the calling routine)', () => {
  const dir = tmpDataDir();
  const r = spawnSync('node', [script, '--data-dir', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0);
});

test('the tracked example file matches the documented v1 shape', () => {
  const example = JSON.parse(
    fs.readFileSync(fileURLToPath(new URL('../data/routine-heartbeats.example.json', import.meta.url)), 'utf8')
  );
  assert.equal(example.schema, 'routine-heartbeats-v1');
  for (const [name, entry] of Object.entries(example.routines)) {
    assert.ok(entry.lastRunAt, `${name}: lastRunAt`);
    assert.ok(['ok', 'quiet', 'error'].includes(entry.lastStatus), `${name}: lastStatus`);
    assert.ok(Number.isInteger(entry.runCount), `${name}: runCount`);
  }
});

test('buildRunPayload maps local statuses onto the Savant create_agent_run contract', async () => {
  const { buildRunPayload } = await import('../scripts/heartbeat.mjs');
  const ok = buildRunPayload({ routine: 'kerri-x', status: 'ok', nowIso: '2026-06-12T12:00:00.000Z' });
  assert.equal(ok.agent_slug, 'kerri-x');
  assert.equal(ok.agent_run.status, 'succeeded');
  assert.equal(ok.agent_run.external_id, 'kerri-x-2026-06-12T12:00:00.000Z');
  assert.equal(ok.agent_run.finished_at, '2026-06-12T12:00:00.000Z');

  const quiet = buildRunPayload({ routine: 'kerri-x', status: 'quiet', nowIso: '2026-06-12T12:00:00.000Z' });
  assert.equal(quiet.agent_run.status, 'succeeded'); // a guarded no-op is a healthy run

  const err = buildRunPayload({ routine: 'kerri-x', status: 'error', nowIso: '2026-06-12T12:00:00.000Z' });
  assert.equal(err.agent_run.status, 'failed');
});

test('the --data-dir test hook never reaches the network (no Savant report)', () => {
  const dir = tmpDataDir();
  // If reporting fired here it would write a "Savant report" line to stderr
  // (success is silent, but failure/no-key paths log). With --data-dir the
  // reporting branch is skipped entirely, so stderr stays free of it.
  const r = spawnSync('node', [script, '--routine', 'kerri-x', '--data-dir', dir], { encoding: 'utf8' });
  assert.equal(r.status, 0);
  assert.ok(!r.stderr.includes('Savant report'), `unexpected stderr: ${r.stderr}`);
  assert.ok(!r.stderr.includes('skipping Savant report'), `unexpected stderr: ${r.stderr}`);
});
