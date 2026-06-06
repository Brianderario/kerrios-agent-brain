import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/inbox-sweep-lock.mjs', import.meta.url));

test('inbox sweep lock blocks overlapping runs and releases cleanly', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-lock-'));

  const first = run(['acquire', '--root', root, '--ttl-minutes', '5', '--runner', 'codex']);
  assert.equal(first.status, 0, first.stderr);
  const firstBody = JSON.parse(first.stdout);
  assert.equal(firstBody.acquired, true);
  assert.equal(firstBody.lock.runner, 'codex');
  assert.equal(firstBody.lock.runnerSource, 'cli');

  const second = run(['acquire', '--root', root, '--ttl-minutes', '5', '--runner', 'codex']);
  assert.equal(second.status, 2, second.stdout);
  const secondBody = JSON.parse(second.stdout);
  assert.equal(secondBody.reason, 'busy');
  assert.equal(secondBody.holder.runner, 'codex');

  const status = run(['status', '--root', root]);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).locked, true);

  const release = run(['release', '--root', root]);
  assert.equal(release.status, 0, release.stderr);
  assert.equal(JSON.parse(release.stdout).released, true);

  const reacquire = run(['acquire', '--root', root, '--ttl-minutes', '5', '--runner', 'codex']);
  assert.equal(reacquire.status, 0, reacquire.stderr);
});

test('inbox sweep lock replaces stale locks', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-stale-lock-'));
  const lockDir = path.join(root, 'data', '.inbox-sweep-run-lock');
  fs.mkdirSync(lockDir, { recursive: true });
  fs.writeFileSync(
    path.join(lockDir, 'lock.json'),
    JSON.stringify({ startedAt: '2026-01-01T00:00:00Z', expiresAt: '2026-01-01T00:05:00Z' })
  );

  const result = run(['acquire', '--root', root, '--ttl-minutes', '5', '--runner', 'local']);
  assert.equal(result.status, 0, result.stderr);
  const body = JSON.parse(result.stdout);
  assert.equal(body.acquired, true);
  assert.equal(body.lock.runner, 'local');
});

test('default TTL is the 30-min crash-fuse backstop (not the old 90)', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-ttl-'));
  const result = run(['acquire', '--root', root, '--runner', 'codex']); // no --ttl-minutes → default
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).lock.ttlMinutes, 30);
});

test('runner can be provided through the environment for wrapped runners', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-lock-runner-env-'));
  const result = run(['acquire', '--root', root, '--ttl-minutes', '5'], {
    KERRI_INBOX_SWEEP_RUNNER: 'claude'
  });
  assert.equal(result.status, 0, result.stderr);
  const body = JSON.parse(result.stdout);
  assert.equal(body.lock.runner, 'claude');
  assert.equal(body.lock.runnerSource, 'env');
});

test('invalid runner fails closed before acquiring a lock', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-lock-bad-runner-'));
  const result = run(['acquire', '--root', root, '--runner', 'banana']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /runner must be one of/);
  assert.equal(fs.existsSync(path.join(root, 'data', '.inbox-sweep-run-lock')), false);
});

test('status does not require valid runner config', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-lock-status-'));
  const result = run(['status', '--root', root], {
    KERRI_INBOX_SWEEP_RUNNER: 'banana'
  });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).locked, false);
});

function run(args, env = {}) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
}
