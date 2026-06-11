import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/connector-probe.mjs', import.meta.url));

function fixture({ consoleTasks = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-conn-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  const envFile = path.join(root, 'kerrihq.env');
  spawnSync('git', ['init', '-q'], { cwd: root }); // make the git probe reachable
  if (consoleTasks) fs.writeFileSync(envFile, 'KERRIHQ_SYNC_TOKEN=krri_test\nKERRIHQ_API_BASE=https://example.test/api/v1\n');
  return { root, envFile };
}

function run(fx, extra = []) {
  const env = { ...process.env };
  delete env.KERRIHQ_SYNC_TOKEN;
  delete env.KERRIHQ_API_BASE;
  const r = spawnSync('node', [
    script,
    '--root',
    fx.root,
    '--json',
    '--skip-live',
    '--console-env-file',
    fx.envFile,
    ...extra
  ], { encoding: 'utf8', env });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

const ALL_SESSION = 'kerri-hardwarefyi-email,brian-hardwarefyi-email,gmail,superhuman,granola,reclaim,slack';

test('all connectors present in session → ok', () => {
  const rep = run(fixture(), ['--available', ALL_SESSION]);
  assert.equal(rep.ok, true);
  assert.deepEqual(rep.down, []);
});

test('missing granola in session → down + eod at risk', () => {
  const present = ALL_SESSION.split(',').filter((c) => c !== 'granola').join(',');
  const rep = run(fixture(), ['--available', present]);
  assert.equal(rep.ok, false);
  assert.ok(rep.down.includes('granola'));
  assert.ok(rep.routinesAtRisk.includes('kerri-eod-meetings-review'));
});

test('session connectors are non-fatal when no --available given', () => {
  const rep = run(fixture());
  const granola = rep.connectors.find((c) => c.name === 'granola');
  assert.equal(granola.status, 'session-scoped');
  assert.equal(rep.ok, true); // unverified session connectors never fail the probe
});

test('missing Console task config → down', () => {
  const rep = run(fixture({ consoleTasks: false }));
  const consoleTasks = rep.connectors.find((c) => c.name === 'console-tasks');
  assert.equal(consoleTasks.status, 'down');
  assert.equal(rep.ok, false);
});

test('sendblue adapter is checked and reachable on this host', () => {
  const rep = run(fixture(), ['--available', ALL_SESSION]);
  const sb = rep.connectors.find((c) => c.name === 'sendblue');
  assert.equal(sb.status, 'reachable');
});
