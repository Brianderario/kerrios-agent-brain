import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/connector-probe.mjs', import.meta.url));

function fixture({ gtasks = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-conn-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  spawnSync('git', ['init', '-q'], { cwd: root }); // make the git probe reachable
  if (gtasks) fs.writeFileSync(path.join(root, 'data', 'gtasks-lists.json'), JSON.stringify({ H: 'x', S: 'y', G: 'z' }));
  return root;
}

function run(root, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--json', '--skip-live', ...extra], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout);
}

const ALL_SESSION = 'kerri-hardwarefyi-email,brian-hardwarefyi-email,gmail,superhuman,gtasks,granola,reclaim,slack';

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

test('missing gtasks config (cli proxy) → down', () => {
  const rep = run(fixture({ gtasks: false }));
  const gtasks = rep.connectors.find((c) => c.name === 'gtasks');
  assert.equal(gtasks.status, 'down');
  assert.equal(rep.ok, false);
});

test('sendblue adapter is checked and reachable on this host', () => {
  const rep = run(fixture(), ['--available', ALL_SESSION]);
  const sb = rep.connectors.find((c) => c.name === 'sendblue');
  assert.equal(sb.status, 'reachable');
});
