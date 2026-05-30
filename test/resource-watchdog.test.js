import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/resource-watchdog.mjs', import.meta.url));

// All gathers are overridable via flags, so these are fully deterministic.
function run(extra) {
  const r = spawnSync('node', [script, '--json', ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

test('healthy host → ok, no findings', () => {
  const rep = run(['--reaper-loaded', 'true', '--reaper-log-age', '2', '--claude-procs', '10', '--load', '3']);
  assert.equal(rep.ok, true);
  assert.equal(rep.healthy, true);
  assert.deepEqual(rep.findings, []);
});

test('reaper not loaded → high finding, not ok', () => {
  const rep = run(['--reaper-loaded', 'false', '--claude-procs', '10', '--load', '3']);
  assert.equal(rep.ok, false);
  assert.ok(rep.findings.some((f) => f.kind === 'reaper-not-loaded' && f.severity === 'high'));
});

test('reaper stalled (stale log) → high finding', () => {
  const rep = run(['--reaper-loaded', 'true', '--reaper-log-age', '40', '--claude-procs', '10', '--load', '3']);
  assert.ok(rep.findings.some((f) => f.kind === 'reaper-stalled'));
  assert.equal(rep.ok, false);
});

test('session pileup → high finding (the load-23 failure mode)', () => {
  const rep = run(['--reaper-loaded', 'true', '--reaper-log-age', '2', '--claude-procs', '48', '--load', '3']);
  assert.ok(rep.findings.some((f) => f.kind === 'session-pileup'));
  assert.equal(rep.ok, false);
});

test('normal multi-session count (10) does NOT alarm', () => {
  const rep = run(['--reaper-loaded', 'true', '--reaper-log-age', '2', '--claude-procs', '10', '--load', '3']);
  assert.ok(!rep.findings.some((f) => f.kind === 'session-pileup'));
});

test('load over ceiling → high finding', () => {
  const rep = run(['--reaper-loaded', 'true', '--reaper-log-age', '2', '--claude-procs', '10', '--load', '99']);
  assert.ok(rep.findings.some((f) => f.kind === 'load-high'));
  assert.equal(rep.ok, false);
});
