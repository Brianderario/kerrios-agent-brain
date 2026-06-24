#!/usr/bin/env node
// guard-brain-log: refuse to let a commit shorten the brain log.
//
// The durable backstop behind scripts/brain-log-entry.mjs. Even if some path ever
// truncates brain/log.md again (a rogue rewrite, a future routine that forgets the
// helper, a bad manual edit), this guard makes it impossible to COMMIT the loss.
//
// Invariant: the total content-line count of brain/log.md PLUS every
// brain/log-archive/*.md file must never decrease across a commit.
//   • A truncation drops lines from log.md with no matching archive growth -> total
//     falls -> BLOCKED.
//   • A legitimate rotation (scripts/rotate-brain-log.mjs) MOVES lines from log.md
//     into log-archive and asserts kept+moved == original, so the total is unchanged
//     -> ALLOWED. (That is why the invariant is the sum, not log.md alone.)
//
// Installed as the repo's git pre-commit hook (scripts/git-hooks/pre-commit, put in
// place by scripts/install-git-hooks.sh). It runs on EVERY commit — the brain-push and
// gap-sweep routines each `git commit` directly, so a hook is the one chokepoint they
// all share. On a detected shrink it restores brain/log.md + brain/log-archive from
// HEAD (undoing the truncation in index and worktree), drops a marker, and aborts the
// commit so the run notices.
//
// Modes:
//   --mode staged    (default) compare the INDEX (what this commit will write) vs HEAD
//   --mode worktree  compare the working tree vs HEAD (pre-commit-step self-check)
//   --heal           on shrink, `git checkout HEAD -- brain/log.md brain/log-archive`
//   --json           machine-readable report
//   --quiet          no stdout on success
//   --root <dir>     repo root (default: parent of scripts/)
//
// Exit: 0 if the total did not shrink, 1 if it did (commit should abort), 2 on bad args.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MARKER_REL = path.join('data', 'brain-log-guard.marker');

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

// Content lines = lines of actual text, ignoring a single trailing newline. This is the
// exact accounting rotate-brain-log.mjs uses (kept + moved == original), so a rotation
// is a perfect zero-sum move under this metric and never trips the guard.
export function contentLines(text) {
  if (!text) return 0;
  const parts = text.split('\n');
  if (text.endsWith('\n')) parts.pop();
  return parts.length;
}

// Pure invariant: is the candidate total a shrink vs HEAD?
export function isShrink(headTotal, candidateTotal) {
  return candidateTotal < headTotal;
}

function git(root, args) {
  try {
    // stderr ignored: a missing ref/path (e.g. no HEAD on the first commit) is an
    // expected "absent -> 0 lines" signal here, not an error to surface.
    return execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore']
    });
  } catch {
    return null; // path/ref absent, or not a git repo
  }
}

// Lines of a tracked path at a ref. ref '' means the index (git show :path). Missing -> 0.
function linesAt(root, ref, p) {
  const spec = ref ? `${ref}:${p}` : `:${p}`;
  const out = git(root, ['show', spec]);
  return out == null ? 0 : contentLines(out);
}

function listTracked(root, mode, dir) {
  if (mode === 'worktree') {
    const abs = path.join(root, dir);
    let names = [];
    try {
      names = fs.readdirSync(abs).filter((n) => n.endsWith('.md')).map((n) => `${dir}/${n}`);
    } catch { names = []; }
    return names;
  }
  // index
  const out = git(root, ['ls-files', '--', dir]);
  return out == null ? [] : out.split('\n').filter(Boolean);
}

function linesInWorktree(root, p) {
  try { return contentLines(fs.readFileSync(path.join(root, p), 'utf8')); } catch { return 0; }
}

// Total over log.md + every archive file, for HEAD vs the candidate side (index or worktree).
export function computeTotals(root, mode) {
  const LOG = 'brain/log.md';
  const ARCHIVE = 'brain/log-archive';

  // HEAD side
  const headArchive = (git(root, ['ls-tree', '-r', '--name-only', 'HEAD', '--', ARCHIVE]) || '')
    .split('\n').filter(Boolean);
  let headTotal = linesAt(root, 'HEAD', LOG);
  for (const f of headArchive) headTotal += linesAt(root, 'HEAD', f);

  // Candidate side (what the commit will produce = index; or the working tree)
  const candArchive = listTracked(root, mode, ARCHIVE);
  const candFiles = new Set([LOG, ...candArchive, ...headArchive]); // union so a deletion counts as 0
  let candTotal = 0;
  for (const f of candFiles) {
    candTotal += mode === 'worktree' ? linesInWorktree(root, f) : linesAt(root, '', f);
  }

  return { headTotal, candTotal };
}

function writeMarker(root, text) {
  try { fs.writeFileSync(path.join(root, MARKER_REL), text); } catch { /* data/ may not exist in tests */ }
}

export function guardBrainLog(root, { mode = 'staged', heal = false } = {}) {
  // No HEAD yet (fresh repo / first commit) — nothing to protect against.
  if (git(root, ['rev-parse', '--verify', 'HEAD']) == null) {
    return { ok: true, headTotal: 0, candTotal: 0, mode, firstCommit: true };
  }
  const { headTotal, candTotal } = computeTotals(root, mode);
  if (!isShrink(headTotal, candTotal)) {
    return { ok: true, headTotal, candTotal, mode };
  }

  const shrunkBy = headTotal - candTotal;
  let healed = false;
  if (heal) {
    // Undo the truncation in index + worktree. Rotation never reaches here (it is
    // zero-sum), so restoring both paths only ever reverts a genuine loss.
    git(root, ['checkout', 'HEAD', '--', 'brain/log.md', 'brain/log-archive']);
    healed = true;
  }
  const ts = new Date().toISOString();
  writeMarker(
    root,
    `brain-log-guard BLOCKED a commit at ${ts}: brain/log.md + log-archive total fell ${headTotal} -> ${candTotal} lines (-${shrunkBy}). `
    + `${healed ? 'log restored from HEAD (index + worktree). ' : ''}`
    + `A routine truncated the log instead of appending. Re-add this run's entry with `
    + `\`node scripts/brain-log-entry.mjs --entry "..."\` and commit again.\n`
  );
  return { ok: false, headTotal, candTotal, shrunkBy, mode, healed };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const mode = args.mode === 'worktree' ? 'worktree' : 'staged';
  const report = guardBrainLog(root, { mode, heal: Boolean(args.heal) });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else if (!report.ok) {
    process.stderr.write(
      `✗ brain-log-guard: commit BLOCKED — brain log total shrank ${report.headTotal} -> ${report.candTotal} `
      + `(-${report.shrunkBy} lines).${report.healed ? ' log.md + archive restored from HEAD.' : ''}\n`
      + `  A routine truncated brain/log.md instead of appending. Use scripts/brain-log-entry.mjs to add entries.\n`
      + `  See ${MARKER_REL}.\n`
    );
  } else if (!args.quiet && !report.firstCommit) {
    process.stdout.write(`brain-log-guard: OK — total ${report.candTotal} >= HEAD ${report.headTotal} lines (${mode}).\n`);
  }
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
