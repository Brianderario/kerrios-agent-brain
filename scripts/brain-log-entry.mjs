#!/usr/bin/env node
// brain-log-entry: the ONLY safe way for a routine to add an entry to brain/log.md.
//
// Why this exists: brain/log.md is an 875KB+ append-only log. The routines used to
// add entries by hand ("Prepend ONE line to brain/log.md") — an LLM agent reads the
// top of the file, then rewrites it. On a file this large the agent reads only a
// slice and rewrites with the slice, silently truncating everything below. That is
// exactly what dropped ~1698 lines on 2026-06-23 (caught + restored by the nightly
// gap-sweep). See brain/wiki/workflows/brain-log-write-protocol.md.
//
// This script removes the failure mode: it reads the WHOLE file with fs.readFileSync
// (Node reads every byte — no token budget, no truncation), prepends the new entry at
// the very top (where the newest entries already live; the `# KerriOS Brain Log` H1 is
// buried mid-file), writes to a temp file, asserts the result is strictly LARGER than
// the original, and only then atomically renames it into place. A crash, a bad arg, or
// a failed assertion leaves brain/log.md byte-for-byte untouched. It is impossible for
// this script to shorten the log.
//
// Usage:
//   node scripts/brain-log-entry.mjs --entry "## [2026-06-23 18:13 ET] lead-research | ... | Kerri"
//   node scripts/brain-log-entry.mjs --stdin <<'LOGENTRY'
//   ## [2026-06-23 18:13 ET] lead-research | 12 found, 5 queued | Kerri
//   one-line summary
//   LOGENTRY
//
// Flags:
//   --entry <text>   entry text (single arg; use --stdin for multi-line with | $ ` etc.)
//   --stdin          read the entry from STDIN (use a quoted heredoc to avoid shell expansion)
//   --file <path>    read the entry from a file
//   --root <dir>     repo root (default: parent of scripts/); --log overrides the target file
//   --log <path>     target log file (default: <root>/brain/log.md) — test hook
//   --quiet          suppress the success line

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v.startsWith('--')) {
      const key = v.slice(2);
      const next = values[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i += 1; }
    } else out._.push(v);
  }
  return out;
}

const countLines = (s) => (s === '' ? 0 : s.split('\n').length);

// Pure core, unit-tested without touching the filesystem. Given the current file
// contents and a new entry, returns the new contents with the entry prepended and a
// blank-line separator, preserving every original byte. Newest entry ends up at the
// top, matching the file's existing head.
export function composeLogEntry(existing, entry) {
  const block = String(entry).replace(/\s+$/, ''); // trim trailing whitespace only
  if (block.trim() === '') throw new Error('refusing to write an empty log entry');
  // Already the newest entry? (immediate-retry idempotency) — leave the file alone.
  if (existing.replace(/^\s+/, '').startsWith(block)) return { content: existing, skipped: true };
  const body = existing.replace(/^\n+/, ''); // collapse leading blank lines; we re-add exactly one separator
  const content = `${block}\n\n${body}`;
  return { content, skipped: false };
}

export function addLogEntry({ logPath, entry }) {
  const existing = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8') : '';
  const { content, skipped } = composeLogEntry(existing, entry);
  if (skipped) {
    return { skipped: true, beforeLines: countLines(existing), afterLines: countLines(existing) };
  }

  const beforeBytes = Buffer.byteLength(existing, 'utf8');
  const afterBytes = Buffer.byteLength(content, 'utf8');
  const beforeLines = countLines(existing);
  const afterLines = countLines(content);
  const entryLines = countLines(String(entry).replace(/\s+$/, ''));

  // Hard guards: this script must only ever GROW the log. If either fails we never
  // touch brain/log.md — the temp file is discarded.
  if (afterBytes <= beforeBytes) {
    throw new Error(`brain-log-entry: composed file is not larger (before=${beforeBytes}B, after=${afterBytes}B) — aborting, log untouched`);
  }
  if (afterLines < beforeLines + entryLines) {
    throw new Error(`brain-log-entry: line accounting failed (before=${beforeLines}, after=${afterLines}, entry=${entryLines}) — aborting, log untouched`);
  }

  // Atomic write: temp file in the same dir, fsync, then rename. A crash mid-write
  // leaves the original in place (rename is atomic on the same filesystem).
  const tmp = `${logPath}.tmp-${process.pid}`;
  const fd = fs.openSync(tmp, 'w');
  try {
    fs.writeFileSync(fd, content);
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(tmp, logPath);

  return { skipped: false, beforeLines, afterLines, beforeBytes, afterBytes };
}

function readEntry(args) {
  if (typeof args.entry === 'string') return args.entry;
  if (typeof args.file === 'string') return fs.readFileSync(args.file, 'utf8');
  if (args.stdin || !process.stdin.isTTY) return fs.readFileSync(0, 'utf8');
  return '';
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const logPath = args.log && args.log !== true
    ? path.resolve(args.log)
    : path.join(root, 'brain', 'log.md');

  const entry = readEntry(args);
  if (!entry || entry.trim() === '') {
    process.stderr.write('brain-log-entry: no entry text (pass --entry "..." or pipe via --stdin)\n');
    process.exit(2);
  }

  let result;
  try {
    result = addLogEntry({ logPath, entry });
  } catch (e) {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  }

  if (!args.quiet) {
    if (result.skipped) {
      process.stdout.write('brain-log-entry: entry already at top of log — skipped (idempotent)\n');
    } else {
      process.stdout.write(`brain-log-entry: prepended entry to ${path.relative(root, logPath) || logPath} (${result.beforeLines} -> ${result.afterLines} lines)\n`);
    }
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
