#!/usr/bin/env node
// rotate-brain-log.mjs: archive prior-month entries out of brain/log.md.
//
// brain/log.md is append-only and unbounded (360KB+ by 2026-06). This moves
// every entry from completed prior months into brain/log-archive/log-<YYYY-MM>.md
// and leaves the current month plus the file header in brain/log.md. Idempotent:
// re-running with nothing to archive changes nothing.
//
// Parsing rules (matches the file as it actually exists, not just the ideal):
//   - An entry starts at any line matching `## [YYYY-MM-DD ...` or the older
//     unbracketed `## YYYY-MM-DD ...` form, and runs until the next `#`/`##` line.
//   - The file header is the block starting `# KerriOS Brain Log`. Historically
//     agents prepended entries ABOVE it; rotation re-homes it to the top.
//   - A `## ` line with no parseable date is kept in log.md (never archived blind).
//   - Archived entries are moved byte-for-byte in their original relative order;
//     if a month's archive file already exists, new entries are appended.
//
// Loss guard: asserts lines(log.md before) == lines(log.md after) + lines moved.
//
// Usage: node scripts/rotate-brain-log.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LOG = path.join(ROOT, 'brain', 'log.md');
const ARCHIVE_DIR = path.join(ROOT, 'brain', 'log-archive');

const ENTRY_DATE = /^## \[?(\d{4})-(\d{2})-\d{2}/;

const now = new Date();
const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

const raw = fs.readFileSync(LOG, 'utf8');
const hadTrailingNewline = raw.endsWith('\n');
const lines = raw.split('\n');
if (hadTrailingNewline) lines.pop(); // drop the empty element after the final \n

// Split into blocks: preamble (anything before the first # heading), then one
// block per `#`/`##` heading line.
const blocks = []; // { type: 'preamble'|'header'|'entry'|'other', month, lines }
let cur = { type: 'preamble', lines: [] };
for (const line of lines) {
  if (/^#{1,2} /.test(line)) {
    if (cur.lines.length || cur.type !== 'preamble') blocks.push(cur);
    const m = line.match(ENTRY_DATE);
    if (m) cur = { type: 'entry', month: `${m[1]}-${m[2]}`, lines: [line] };
    else if (/^# /.test(line)) cur = { type: 'header', lines: [line] };
    else cur = { type: 'other', lines: [line] }; // ## line with no date: keep
  } else {
    cur.lines.push(line);
  }
}
blocks.push(cur);

const keep = [];           // blocks staying in log.md (original order, header first)
const toArchive = new Map(); // month -> array of line arrays
let headerBlock = null;
let preamble = null;

for (const b of blocks) {
  if (b.type === 'preamble') preamble = b;
  else if (b.type === 'header' && !headerBlock) headerBlock = b;
  else if (b.type === 'entry' && b.month < currentMonth) {
    if (!toArchive.has(b.month)) toArchive.set(b.month, []);
    toArchive.get(b.month).push(b.lines);
  } else {
    keep.push(b);
  }
}

if (toArchive.size === 0) {
  console.log('rotate-brain-log: nothing to archive (all entries are current-month).');
  process.exit(0);
}

fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

let movedLineCount = 0;
for (const [month, entryBlocks] of [...toArchive.entries()].sort()) {
  const dest = path.join(ARCHIVE_DIR, `log-${month}.md`);
  const movedLines = entryBlocks.flat();
  movedLineCount += movedLines.length;
  const chunk = movedLines.join('\n') + '\n';
  if (fs.existsSync(dest)) fs.appendFileSync(dest, chunk);
  else fs.writeFileSync(dest, chunk);
  console.log(`rotate-brain-log: moved ${entryBlocks.length} entries (${movedLines.length} lines) -> ${path.relative(ROOT, dest)}`);
}

const outLines = [
  ...(preamble ? preamble.lines : []),
  ...(headerBlock ? headerBlock.lines : []),
  ...keep.flatMap((b) => b.lines),
];
const out = outLines.join('\n') + (hadTrailingNewline ? '\n' : '');

// Loss guard: every original line must land in exactly one output file.
if (outLines.length + movedLineCount !== lines.length) {
  console.error(`rotate-brain-log: LINE COUNT MISMATCH (before=${lines.length}, kept=${outLines.length}, moved=${movedLineCount}). Aborting, log.md untouched.`);
  process.exit(1);
}

fs.writeFileSync(LOG, out);
console.log(`rotate-brain-log: log.md ${lines.length} -> ${outLines.length} lines; ${movedLineCount} lines archived.`);
