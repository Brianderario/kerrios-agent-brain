import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-state-integrity.mjs', import.meta.url));

function fixture(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-integrity-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  for (const [name, value] of Object.entries(files)) {
    const body = typeof value === 'string' ? value : JSON.stringify(value);
    fs.writeFileSync(path.join(root, 'data', name), body);
  }
  return root;
}

function run(root, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--json', ...extra], { encoding: 'utf8' });
  return { status: r.status, report: JSON.parse(r.stdout) };
}

test('clean state → ok, exit 0', () => {
  const root = fixture({
    'jobs.json': [{ jobId: 'H0035', prefix: 'H' }],
    'job-counters.json': { H: 35, S: 1, G: 9 },
    'inbox-sweep-state.json': { schema: 'inbox-sweep-state-v1', updatedAt: '2026-05-29T18:00:00Z', mailboxes: {} }
  });
  const { status, report } = run(root, ['--now', '2026-05-29T19:00:00Z']);
  assert.equal(status, 0);
  assert.equal(report.ok, true);
});

test('malformed json → hard error, exit 1', () => {
  const root = fixture({ 'jobs.json': '[{ broken' });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'malformed-json'));
});

test('counter behind max jobId → counter-behind error', () => {
  const root = fixture({
    'jobs.json': [{ jobId: 'H0035', prefix: 'H' }],
    'job-counters.json': { H: 30, S: 1, G: 9 }
  });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'counter-behind' && e.detail.includes('H')));
});

test('future-dated cursor → future-cursor error', () => {
  const root = fixture({
    'inbox-sweep-state.json': { updatedAt: '2027-01-01T00:00:00Z', mailboxes: {} }
  });
  const { status, report } = run(root, ['--now', '2026-05-29T19:00:00Z']);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'future-cursor'));
});

test('unparseable cursor → unparseable-cursor error', () => {
  const root = fixture({
    'inbox-sweep-state.json': { updatedAt: 'not-a-date', mailboxes: {} }
  });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'unparseable-cursor'));
});
