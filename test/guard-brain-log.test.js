import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { contentLines, isShrink, guardBrainLog } from '../scripts/guard-brain-log.mjs';

// guard-brain-log.mjs is the durable backstop: a commit may never shrink the total
// content-line count of brain/log.md + brain/log-archive. These tests build a real
// throwaway git repo and exercise the actual git plumbing the pre-commit hook uses.

test('contentLines ignores a single trailing newline (matches rotate accounting)', () => {
  assert.equal(contentLines(''), 0);
  assert.equal(contentLines('a'), 1);
  assert.equal(contentLines('a\n'), 1);
  assert.equal(contentLines('a\nb'), 2);
  assert.equal(contentLines('a\nb\n'), 2);
  assert.equal(contentLines('a\nb\n\n'), 3); // a blank line is content
});

test('isShrink is a strict less-than on totals', () => {
  assert.equal(isShrink(10, 9), true);
  assert.equal(isShrink(10, 10), false);
  assert.equal(isShrink(10, 11), false);
});

function tmpRepo() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainlog-guard-'));
  const g = (args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' });
  g(['init', '-q']);
  g(['config', 'user.name', 'Test']);
  g(['config', 'user.email', 'test@test']);
  g(['config', 'commit.gpgsign', 'false']);
  fs.mkdirSync(path.join(dir, 'brain', 'log-archive'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'data'), { recursive: true });
  return { dir, g };
}

function writeLog(dir, lines) {
  fs.writeFileSync(path.join(dir, 'brain', 'log.md'), lines.join('\n') + '\n');
}

test('guard allows growth (a normal appended entry)', () => {
  const { dir, g } = tmpRepo();
  writeLog(dir, ['## a', '## b', '## c']);
  g(['add', '-A']); g(['commit', '-qm', 'init']);

  writeLog(dir, ['## NEW', '## a', '## b', '## c']); // prepended one entry
  g(['add', '-A']);
  const r = guardBrainLog(dir, { mode: 'staged' });
  assert.equal(r.ok, true);
  assert.equal(r.candTotal, 4);
  assert.equal(r.headTotal, 3);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('guard allows a rotation (lines moved log.md -> archive, sum preserved)', () => {
  const { dir, g } = tmpRepo();
  writeLog(dir, ['## jun3', '## jun2', '## jun1', '## may2', '## may1']); // 5 lines
  g(['add', '-A']); g(['commit', '-qm', 'init']);

  // rotate: move the two "may" entries out to the archive; total stays 5.
  writeLog(dir, ['## jun3', '## jun2', '## jun1']);
  fs.writeFileSync(path.join(dir, 'brain', 'log-archive', 'log-2026-05.md'), '## may2\n## may1\n');
  g(['add', '-A']);
  const r = guardBrainLog(dir, { mode: 'staged' });
  assert.equal(r.ok, true, 'rotation is zero-sum and must not be blocked');
  assert.equal(r.headTotal, 5);
  assert.equal(r.candTotal, 5);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('guard BLOCKS a truncation and --heal restores log.md from HEAD', () => {
  const { dir, g } = tmpRepo();
  // commit a full log plus an existing archive
  writeLog(dir, Array.from({ length: 10 }, (_, i) => `## entry-${i}`));
  fs.writeFileSync(path.join(dir, 'brain', 'log-archive', 'log-2026-05.md'), '## old1\n## old2\n');
  g(['add', '-A']); g(['commit', '-qm', 'init']); // HEAD total = 12

  // a routine truncates log.md to 3 lines and stages it
  writeLog(dir, ['## entry-0', '## entry-1', '## entry-2']);
  g(['add', '-A']);

  const r = guardBrainLog(dir, { mode: 'staged', heal: true });
  assert.equal(r.ok, false, 'a shrink must be blocked');
  assert.equal(r.headTotal, 12);
  assert.equal(r.candTotal, 5); // 3 (log) + 2 (archive)
  assert.equal(r.shrunkBy, 7);
  assert.equal(r.healed, true);

  // heal restored the full log in BOTH worktree and index
  const restored = fs.readFileSync(path.join(dir, 'brain', 'log.md'), 'utf8');
  assert.equal(restored.split('\n').filter(Boolean).length, 10, 'worktree log.md back to 10 lines');
  const staged = execFileSync('git', ['show', ':brain/log.md'], { cwd: dir, encoding: 'utf8' });
  assert.equal(staged.split('\n').filter(Boolean).length, 10, 'index log.md restored too');

  // and it left a marker explaining the block
  const marker = fs.readFileSync(path.join(dir, 'data', 'brain-log-guard.marker'), 'utf8');
  assert.match(marker, /BLOCKED a commit/);
  assert.match(marker, /12 -> 5/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('guard is a no-op before the first commit (no HEAD to protect)', () => {
  const { dir } = tmpRepo();
  writeLog(dir, ['## a']);
  const r = guardBrainLog(dir, { mode: 'staged' });
  assert.equal(r.ok, true);
  assert.equal(r.firstCommit, true);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('guard --mode worktree catches a truncation that is not yet staged', () => {
  const { dir, g } = tmpRepo();
  writeLog(dir, Array.from({ length: 8 }, (_, i) => `## e${i}`));
  g(['add', '-A']); g(['commit', '-qm', 'init']);

  writeLog(dir, ['## e0']); // truncated in the working tree, not staged
  const r = guardBrainLog(dir, { mode: 'worktree' });
  assert.equal(r.ok, false);
  assert.equal(r.headTotal, 8);
  assert.equal(r.candTotal, 1);
  fs.rmSync(dir, { recursive: true, force: true });
});
