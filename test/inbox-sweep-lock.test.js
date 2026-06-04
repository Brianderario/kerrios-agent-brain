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

  const first = run(['acquire', '--root', root, '--ttl-minutes', '5']);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(JSON.parse(first.stdout).acquired, true);

  const second = run(['acquire', '--root', root, '--ttl-minutes', '5']);
  assert.equal(second.status, 2, second.stdout);
  assert.equal(JSON.parse(second.stdout).reason, 'busy');

  const status = run(['status', '--root', root]);
  assert.equal(status.status, 0, status.stderr);
  assert.equal(JSON.parse(status.stdout).locked, true);

  const release = run(['release', '--root', root]);
  assert.equal(release.status, 0, release.stderr);
  assert.equal(JSON.parse(release.stdout).released, true);

  const reacquire = run(['acquire', '--root', root, '--ttl-minutes', '5']);
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

  const result = run(['acquire', '--root', root, '--ttl-minutes', '5']);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).acquired, true);
});

function run(args) {
  return spawnSync(process.execPath, [script, ...args], {
    encoding: 'utf8'
  });
}
