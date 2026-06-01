import assert from 'node:assert/strict';
import test from 'node:test';
import { psMap, findClaudeAncestor } from '../scripts/inbox-sweep-self-exit.mjs';

const CLAUDE = '/Applications/Claude.app/Contents/Resources/app/node_modules/.bin/claude-code/2.1.156/claude.app/Contents/MacOS/claude --stream-json';
const NODE = '/opt/homebrew/bin/node scripts/inbox-sweep-self-exit.mjs';
const SH = '/bin/sh -c whatever';

test('psMap parses pid/ppid/command from ps output', () => {
  const sample = ['  101 1 launchd', '  202   101 ' + CLAUDE, '  303 202 ' + NODE].join('\n');
  const m = psMap(sample);
  assert.equal(m.get(303).ppid, 202);
  assert.equal(m.get(202).ppid, 101);
  assert.match(m.get(202).command, /claude/);
});

test('findClaudeAncestor walks the ppid chain to the nearest claude-code process', () => {
  // 303 (node script) -> 202 (claude session) -> 101 (launchd)
  const procs = new Map([
    [101, { ppid: 1, command: 'launchd' }],
    [202, { ppid: 101, command: CLAUDE }],
    [303, { ppid: 202, command: NODE }],
  ]);
  const found = findClaudeAncestor(procs, 303);
  assert.equal(found.pid, 202);
  assert.equal(found.ppid, 101);
});

test('findClaudeAncestor returns null when no claude-code ancestor exists', () => {
  const procs = new Map([
    [101, { ppid: 1, command: 'launchd' }],
    [202, { ppid: 101, command: SH }],
    [303, { ppid: 202, command: NODE }],
  ]);
  assert.equal(findClaudeAncestor(procs, 303), null);
});

test('findClaudeAncestor is cycle-safe and never loops forever', () => {
  const procs = new Map([
    [202, { ppid: 303, command: SH }],
    [303, { ppid: 202, command: NODE }], // 202<->303 cycle, neither is claude
  ]);
  assert.equal(findClaudeAncestor(procs, 303), null);
});

test('findClaudeAncestor stops at a missing parent (returns null, never throws)', () => {
  const procs = new Map([[303, { ppid: 999, command: NODE }]]); // 999 not in map
  assert.equal(findClaudeAncestor(procs, 303), null);
});
