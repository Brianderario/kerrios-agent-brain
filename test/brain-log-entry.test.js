import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { composeLogEntry, addLogEntry } from '../scripts/brain-log-entry.mjs';

// brain-log-entry.mjs is the safe replacement for hand-prepending to brain/log.md.
// The load-bearing property: it can only ever GROW the file. Every original byte
// survives; a truncation is impossible by construction.

const SAMPLE = [
  '## [2026-06-23 22:13 ET] brain-push | abc1234 | Kerri',
  '',
  'pushed 4 files',
  '',
  '## [2026-06-23 21:52 ET] gap-sweep | auto:1 | Kerri',
  'clean sweep',
  ''
].join('\n');

test('composeLogEntry prepends the entry and preserves every original byte', () => {
  const entry = '## [2026-06-23 23:00 ET] lead-research | 5 found | Kerri';
  const { content, skipped } = composeLogEntry(SAMPLE, entry);
  assert.equal(skipped, false);
  assert.ok(content.startsWith(entry), 'new entry is at the very top');
  assert.ok(content.includes(SAMPLE.replace(/^\n+/, '')), 'original content is fully retained');
  assert.ok(content.length > SAMPLE.length, 'result is strictly larger');
  // exactly one blank line between the new entry and the prior top entry
  assert.match(content, /Kerri\n\n## \[2026-06-23 22:13 ET\]/);
});

test('composeLogEntry preserves special characters verbatim (no shell/markdown mangling)', () => {
  const entry = '## [2026-06-23] cold | $1,000,000 goal | a|b|c `tick` | Kerri';
  const { content } = composeLogEntry(SAMPLE, entry);
  assert.ok(content.startsWith(entry));
});

test('composeLogEntry refuses an empty entry', () => {
  assert.throws(() => composeLogEntry(SAMPLE, '   \n  '), /empty log entry/);
});

test('composeLogEntry is idempotent when the entry is already the newest', () => {
  const entry = '## [2026-06-23 22:13 ET] brain-push | abc1234 | Kerri';
  const { skipped, content } = composeLogEntry(SAMPLE, entry);
  assert.equal(skipped, true);
  assert.equal(content, SAMPLE, 'unchanged when re-adding the current top entry');
});

test('composeLogEntry seeds an empty/new log file', () => {
  const entry = '## [2026-06-23] first | Kerri';
  const { content, skipped } = composeLogEntry('', entry);
  assert.equal(skipped, false);
  assert.ok(content.startsWith(entry));
});

test('addLogEntry grows the real file on disk and loses no prior lines', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainlog-entry-'));
  const logPath = path.join(dir, 'log.md');
  fs.writeFileSync(logPath, SAMPLE);
  const before = fs.readFileSync(logPath, 'utf8');
  const beforeLines = before.split('\n').length;

  const entry = '## [2026-06-23 23:30 ET] eod | reviewed 3 meetings | Kerri\none-line summary';
  const res = addLogEntry({ logPath, entry });

  const after = fs.readFileSync(logPath, 'utf8');
  assert.equal(res.skipped, false);
  assert.ok(after.length > before.length, 'file grew');
  assert.ok(after.endsWith(before.replace(/^\n+/, '')), 'all prior content still present at the tail');
  assert.ok(after.split('\n').length > beforeLines, 'line count increased');
  // no temp files left behind
  assert.deepEqual(fs.readdirSync(dir).sort(), ['log.md']);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('addLogEntry leaves the file untouched on an idempotent re-add', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainlog-entry-'));
  const logPath = path.join(dir, 'log.md');
  fs.writeFileSync(logPath, SAMPLE);
  const entry = '## [2026-06-23 22:13 ET] brain-push | abc1234 | Kerri';
  const res = addLogEntry({ logPath, entry });
  assert.equal(res.skipped, true);
  assert.equal(fs.readFileSync(logPath, 'utf8'), SAMPLE);
  fs.rmSync(dir, { recursive: true, force: true });
});
