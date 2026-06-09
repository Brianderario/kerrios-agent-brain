#!/usr/bin/env node
// check-doc-reality: do the routine docs agree with the actual prompt files?
//
// kerri-gap-sweep class C, made standalone + deterministic for `npm run check`.
// The ledger flagged Codex→Claude migration drift on consecutive runs; this is
// the guard that improvementCandidate proposed.
//
// It checks ROBUST EXISTENCE invariants (not brittle cadence-string parsing,
// which would false-red across three differently-formatted tables):
//   HARD ERRORS (exit 1):
//     • an agent-prompts/<agent>/ dir with no SKILL.md (a broken prompt)
//     • a doc that references <agent>/SKILL.md which does not exist (dangling ref)
//   WARNINGS (exit 0):
//     • a prompt dir mentioned in none of the routine docs (likely fine if it's
//       on-demand, but worth surfacing)
//     • a ~/.claude/scheduled-tasks shim with no matching prompt dir (the repo is
//       canonical, so this is a heads-up, not a failure)
//
// Usage:
//   node scripts/check-doc-reality.mjs
//   node scripts/check-doc-reality.mjs --json
//   node scripts/check-doc-reality.mjs --root <dir> --scheduled-tasks-dir <dir> --no-shims

import fs from 'node:fs';
import os from 'node:os';
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

function listDirs(p) {
  try {
    return fs.readdirSync(p, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}
function read(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

export function checkDocReality(root, opts = {}) {
  const errors = [];
  const warnings = [];
  const promptsDir = path.join(root, 'agent-prompts');
  const promptDirs = listDirs(promptsDir);

  // 1. every prompt dir must have a SKILL.md
  for (const name of promptDirs) {
    if (!fs.existsSync(path.join(promptsDir, name, 'SKILL.md'))) {
      errors.push({ kind: 'missing-skill', detail: `agent-prompts/${name}/ has no SKILL.md` });
    }
  }

  // 2. gather doc text + dangling <agent>/SKILL.md references
  const docPaths = [
    path.join(promptsDir, 'CLAUDE-ROUTINES.md'),
    path.join(root, 'brain', 'wiki', 'agents', 'registry.md'),
    path.join(promptsDir, 'kerri-skill', 'SKILL.md'),
    path.join(promptsDir, 'kerri-skill', 'references', 'automations.md')
  ].filter((p) => fs.existsSync(p));
  const docText = docPaths.map(read).join('\n');

  const referenced = new Set();
  for (const m of docText.matchAll(/([A-Za-z0-9._-]+)\/SKILL\.md/g)) referenced.add(m[1]);
  for (const name of referenced) {
    if (!fs.existsSync(path.join(promptsDir, name, 'SKILL.md'))) {
      errors.push({ kind: 'dangling-reference', detail: `docs reference ${name}/SKILL.md but it does not exist` });
    }
  }

  // 3. prompt dirs mentioned in no doc → warning
  for (const name of promptDirs) {
    if (!docText.includes(name)) {
      warnings.push({ kind: 'undocumented-prompt', detail: `agent-prompts/${name}/ is mentioned in no routine doc` });
    }
  }

  // 3b. manifest ↔ CLAUDE-ROUTINES.md drift guard (Wave 1). The routine fleet now has
  //     a single source of truth (agent-prompts/routines.manifest.json). Keep it and the
  //     doc from drifting, without brittle cron-string matching:
  //       HARD ERROR: a MONITORED manifest routine whose prompt dir is missing (it cannot
  //                   run and the liveness checker references an evaluator for it).
  //       WARNING:    a manifest routine not mentioned in CLAUDE-ROUTINES.md, or a doc
  //                   routine slug absent from the manifest (soft mismatch / heads-up).
  const manifestPath = path.join(promptsDir, 'routines.manifest.json');
  const routinesDoc = read(path.join(promptsDir, 'CLAUDE-ROUTINES.md'));
  let manifestChecked = false;
  let manifest = null;
  try { manifest = JSON.parse(read(manifestPath)); } catch { /* absent/unparseable */ }
  if (manifest && Array.isArray(manifest.routines)) {
    manifestChecked = true;
    const manifestNames = new Set();
    for (const r of manifest.routines) {
      if (!r || !r.name) continue;
      manifestNames.add(r.name);
      // A monitored routine MUST have a runnable prompt; an event-triggered/unmonitored
      // one (e.g. standard-works-issue-writer) legitimately may not, so only warn there.
      const hasPromptDir = fs.existsSync(path.join(promptsDir, r.name, 'SKILL.md'));
      if (!hasPromptDir) {
        if (r.monitored) {
          errors.push({ kind: 'manifest-missing-prompt', detail: `manifest routine ${r.name} (monitored) has no agent-prompts/${r.name}/SKILL.md` });
        } else {
          warnings.push({ kind: 'manifest-no-prompt-dir', detail: `manifest routine ${r.name} has no prompt dir (ok if event-triggered/external)` });
        }
      }
      if (routinesDoc && !routinesDoc.includes(r.name)) {
        warnings.push({ kind: 'manifest-doc-drift', detail: `manifest routine ${r.name} is not mentioned in CLAUDE-ROUTINES.md` });
      }
    }
    // Reverse: doc routine slugs absent from the manifest (likely a new routine added to
    // the doc but never registered for monitoring (the exact Wave-1 gap), surfaced soft here
    // and hard in test/routine-manifest.test.js).
    const NOT_ROUTINES = new Set([
      'kerri-skill', 'kerri-event-logistics',
      'kerri-sw-newsletter-writer', 'kerri-sw-newsletter-editor', 'kerri-sw-newsletter-marketing'
    ]);
    const docSlugs = new Set();
    for (const m of routinesDoc.matchAll(/`(kerri-[a-z0-9-]+|standard-works-[a-z0-9-]+)`/g)) docSlugs.add(m[1]);
    for (const slug of docSlugs) {
      if (!NOT_ROUTINES.has(slug) && !manifestNames.has(slug)) {
        warnings.push({ kind: 'doc-not-in-manifest', detail: `CLAUDE-ROUTINES.md names ${slug} but it is not in routines.manifest.json` });
      }
    }
  }

  // 4. optional: ~/.claude/scheduled-tasks shims vs prompt dirs (repo is canonical)
  let shimsChecked = false;
  if (!opts.noShims) {
    const stDir = opts.scheduledTasksDir || path.join(os.homedir(), '.claude', 'scheduled-tasks');
    if (fs.existsSync(stDir)) {
      shimsChecked = true;
      for (const shim of listDirs(stDir)) {
        if (!promptDirs.includes(shim)) {
          warnings.push({ kind: 'orphan-shim', detail: `~/.claude/scheduled-tasks/${shim} has no matching agent-prompts/ dir` });
        }
      }
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    ok: errors.length === 0,
    promptDirs: promptDirs.length,
    docsScanned: docPaths.map((p) => path.relative(root, p)),
    shimsChecked,
    manifestChecked,
    errors,
    warnings
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const report = checkDocReality(root, {
    noShims: Boolean(args['no-shims']),
    scheduledTasksDir: args['scheduled-tasks-dir'] && args['scheduled-tasks-dir'] !== true ? args['scheduled-tasks-dir'] : undefined
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`doc-reality: ${report.promptDirs} prompt dir(s) vs ${report.docsScanned.length} doc(s) — ${report.ok ? 'OK' : report.errors.length + ' error(s)'}\n`);
    for (const e of report.errors) process.stdout.write(`  ✗ [${e.kind}] ${e.detail}\n`);
    for (const w of report.warnings) process.stdout.write(`  ⚠ [${w.kind}] ${w.detail}\n`);
  }
  process.exit(report.ok ? 0 : 1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
