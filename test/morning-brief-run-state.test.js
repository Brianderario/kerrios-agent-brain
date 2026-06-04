import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  computeStart,
  computeFinish,
  isBriefNeeded,
  isComplete,
  etParts,
  skeletonHtml,
  SCHEMA
} from '../scripts/morning-brief-run-state.mjs';

const script = fileURLToPath(new URL('../scripts/morning-brief-run-state.mjs', import.meta.url));

// 11:05Z on a 2026-06-04 (Thursday) is 07:05 ET — inside a normal brief run.
const THU_0705 = '2026-06-04T11:05:00Z';
const THU_0720 = '2026-06-04T11:20:00Z';
const SAT_0705 = '2026-06-06T11:05:00Z'; // Saturday

function tmpRoot() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-mbrs-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  return root;
}

function run(root, now, extra = []) {
  return spawnSync('node', [script, '--root', root, '--now', now, ...extra], { encoding: 'utf8' });
}

// ── pure helpers ──────────────────────────────────────────────────────────────

test('etParts maps a UTC instant to the correct ET date/weekend flag', () => {
  assert.equal(etParts(new Date(THU_0705)).isoDate, '2026-06-04');
  assert.equal(etParts(new Date(THU_0705)).isWeekend, false);
  assert.equal(etParts(new Date(SAT_0705)).isWeekend, true);
});

test('computeStart stamps a started run for today', () => {
  const { state, wroteRun, alreadyComplete } = computeStart(null, new Date(THU_0705), 'claude-scheduled');
  assert.equal(state.schema, SCHEMA);
  assert.equal(state.lastRun.date, '2026-06-04');
  assert.equal(state.lastRun.status, 'started');
  assert.equal(state.lastRun.finishedAt, null);
  assert.equal(state.lastRun.runner, 'claude-scheduled');
  assert.equal(wroteRun, true);
  assert.equal(alreadyComplete, false);
});

test('computeStart is idempotent — never downgrades an already-complete run', () => {
  const done = computeFinish(null, new Date(THU_0705));
  assert.equal(isComplete(done, '2026-06-04'), true);
  const { state, wroteRun, alreadyComplete } = computeStart(done, new Date(THU_0720), 'claude-scheduled');
  assert.equal(alreadyComplete, true);
  assert.equal(wroteRun, false);
  assert.equal(state.lastRun.status, 'complete'); // unchanged
});

test('computeFinish marks today complete and preserves the original startedAt', () => {
  const started = computeStart(null, new Date(THU_0705), 'x').state;
  const done = computeFinish(started, new Date(THU_0720));
  assert.equal(done.lastRun.status, 'complete');
  assert.equal(done.lastRun.startedAt, started.lastRun.startedAt);
  assert.ok(done.lastRun.finishedAt);
});

test('computeFinish is defensive when no start was recorded', () => {
  const done = computeFinish(null, new Date(THU_0705));
  assert.equal(done.lastRun.status, 'complete');
  assert.ok(done.lastRun.startedAt);
  assert.ok(done.lastRun.finishedAt);
});

test('isBriefNeeded: weekday with no run today → needed', () => {
  assert.equal(isBriefNeeded(null, new Date(THU_0705)), true);
});

test('isBriefNeeded: completed today → not needed (retry self-suppresses)', () => {
  const done = computeFinish(null, new Date(THU_0705));
  assert.equal(isBriefNeeded(done, new Date(THU_0720)), false);
});

test('isBriefNeeded: only STARTED (crashed) today → still needed (recover it)', () => {
  const started = computeStart(null, new Date(THU_0705), 'x').state;
  assert.equal(isBriefNeeded(started, new Date(THU_0720)), true);
});

test('isBriefNeeded: weekend → never needed', () => {
  assert.equal(isBriefNeeded(null, new Date(SAT_0705)), false);
});

test('skeletonHtml is email-safe-ish and labels itself in progress', () => {
  const html = skeletonHtml(new Date(THU_0705));
  assert.match(html, /in progress/i);
  assert.match(html, /2026-06-04/);
  assert.doesNotMatch(html, /display:\s*flex/i); // no flexbox in the email-safe skeleton
});

// ── CLI: disk side-effects + exit codes ────────────────────────────────────────

test('CLI --start writes run-state + a skeleton into output/', () => {
  const root = tmpRoot();
  const r = run(root, THU_0705, ['--start', '--runner', 'claude-scheduled']);
  assert.equal(r.status, 0, r.stderr);
  const state = JSON.parse(fs.readFileSync(path.join(root, 'data', 'morning-brief-run-state.json'), 'utf8'));
  assert.equal(state.lastRun.status, 'started');
  const skeleton = fs.readFileSync(path.join(root, 'output', 'morning-brief', '2026-06-04.html'), 'utf8');
  assert.match(skeleton, /in progress/i);
  const latest = fs.readFileSync(path.join(root, 'output', 'morning-brief', 'latest.html'), 'utf8');
  assert.equal(latest, skeleton);
});

test('CLI --start --no-html stamps state but writes no skeleton', () => {
  const root = tmpRoot();
  const r = run(root, THU_0705, ['--start', '--no-html']);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(root, 'data', 'morning-brief-run-state.json')));
  assert.equal(fs.existsSync(path.join(root, 'output', 'morning-brief', '2026-06-04.html')), false);
});

test('CLI --finish then --start does NOT clobber the delivered brief HTML', () => {
  const root = tmpRoot();
  // simulate a delivered brief: real HTML on disk + a complete run
  const outDir = path.join(root, 'output', 'morning-brief');
  fs.mkdirSync(outDir, { recursive: true });
  const realHtml = '<html><body>REAL BRIEF</body></html>';
  fs.writeFileSync(path.join(outDir, '2026-06-04.html'), realHtml);
  fs.writeFileSync(path.join(outDir, 'latest.html'), realHtml);
  run(root, THU_0705, ['--finish']);
  // a stray re-start later in the day must not overwrite the real brief
  run(root, THU_0720, ['--start']);
  assert.equal(fs.readFileSync(path.join(outDir, 'latest.html'), 'utf8'), realHtml);
});

test('CLI --check-needed exit codes: 0 when owed, 3 when already delivered', () => {
  const root = tmpRoot();
  const needed = run(root, THU_0705, ['--check-needed']);
  assert.equal(needed.status, 0, 'weekday, nothing delivered → exit 0 (needed)');

  run(root, THU_0705, ['--finish']);
  const notNeeded = run(root, THU_0720, ['--check-needed']);
  assert.equal(notNeeded.status, 3, 'already complete today → exit 3 (not needed)');
});

test('CLI --check-needed exit 3 on a weekend', () => {
  const root = tmpRoot();
  const r = run(root, SAT_0705, ['--check-needed']);
  assert.equal(r.status, 3);
});
