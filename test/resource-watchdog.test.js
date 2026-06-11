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

const HEALTHY = ['--reaper-loaded', 'true', '--reaper-log-age', '2', '--claude-procs', '10', '--leaked-scheduled', '0', '--load', '3'];

function withOverrides(overrides) {
  const out = [...HEALTHY];
  for (const [flag, value] of Object.entries(overrides)) {
    const i = out.indexOf(flag);
    out[i + 1] = String(value);
  }
  return out;
}

test('healthy host → ok, no findings', () => {
  const rep = run(HEALTHY);
  assert.equal(rep.ok, true);
  assert.equal(rep.healthy, true);
  assert.deepEqual(rep.findings, []);
});

test('reaper not loaded → high finding, not ok', () => {
  const rep = run(withOverrides({ '--reaper-loaded': 'false' }));
  assert.equal(rep.ok, false);
  assert.ok(rep.findings.some((f) => f.kind === 'reaper-not-loaded' && f.severity === 'high'));
});

test('reaper stalled (stale log) → high finding', () => {
  const rep = run(withOverrides({ '--reaper-log-age': '40' }));
  assert.ok(rep.findings.some((f) => f.kind === 'reaper-stalled'));
  assert.equal(rep.ok, false);
});

test('leaked scheduled sessions past reap limits → high finding (reaper blind/failing)', () => {
  const rep = run(withOverrides({ '--leaked-scheduled': '3' }));
  assert.ok(rep.findings.some((f) => f.kind === 'leaked-scheduled' && f.severity === 'high'));
  assert.equal(rep.ok, false);
});

test('1-2 leaked stragglers (scan race with the reaper) do NOT alarm', () => {
  const rep = run(withOverrides({ '--leaked-scheduled': '2' }));
  assert.ok(!rep.findings.some((f) => f.kind === 'leaked-scheduled'));
});

test('runaway total pileup → high finding (the load-23 failure mode)', () => {
  const rep = run(withOverrides({ '--claude-procs': '48' }));
  assert.ok(rep.findings.some((f) => f.kind === 'session-pileup'));
  assert.equal(rep.ok, false);
});

// Regression for the 2026-06-10 false alarm: 16 open interactive desktop chats put
// ~28 claude procs resident with ZERO leaked scheduled sessions, and the old
// total-count threshold of 20 texted Brian about a healthy machine.
test('many open interactive chats (28 procs, 0 leaks) does NOT alarm', () => {
  const rep = run(withOverrides({ '--claude-procs': '28' }));
  assert.equal(rep.ok, true);
  assert.deepEqual(rep.findings, []);
});

test('load over ceiling → high finding', () => {
  const rep = run(withOverrides({ '--load': '99' }));
  assert.ok(rep.findings.some((f) => f.kind === 'load-high'));
  assert.equal(rep.ok, false);
});
