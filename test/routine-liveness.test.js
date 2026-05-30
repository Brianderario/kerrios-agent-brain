import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

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
