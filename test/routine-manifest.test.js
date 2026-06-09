import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  buildRegistry,
  evaluateRoutines,
  loadManifest
} from '../scripts/routine-liveness-check.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST_PATH = path.join(REPO_ROOT, 'agent-prompts', 'routines.manifest.json');
const ROUTINES_DOC = path.join(REPO_ROOT, 'agent-prompts', 'CLAUDE-ROUTINES.md');

const manifest = loadManifest(MANIFEST_PATH);

// ── THE WAVE-1 COMPLETENESS GUARANTEE ────────────────────────────────────────
// Adding a scheduled routine without registering it in the manifest must be a RED
// TEST, not a silent monitoring gap (the root cause this wave closes). Two
// cross-checks: the portable one against CLAUDE-ROUTINES.md (always runs in CI),
// and the machine-specific one against ~/.claude/scheduled-tasks (skipped when the
// dir is absent, like check-doc-reality.mjs does, so CI elsewhere does not false-fail).

test('manifest loads and is well-formed', () => {
  assert.ok(manifest, 'routines.manifest.json must parse');
  assert.equal(manifest.schema, 'routines-manifest-v1');
  assert.ok(Array.isArray(manifest.routines) && manifest.routines.length > 0);
  for (const r of manifest.routines) {
    assert.ok(r.name, 'every entry has a name');
    assert.equal(typeof r.core, 'boolean', `${r.name}: core is boolean`);
    assert.equal(typeof r.monitored, 'boolean', `${r.name}: monitored is boolean`);
    assert.ok('cron' in r, `${r.name}: cron present (null allowed for event-triggered)`);
    assert.ok(r.cadenceDescription, `${r.name}: cadenceDescription present`);
  }
});

test('every monitored:true entry maps to a working evaluator', () => {
  const { registry, skipped } = buildRegistry(manifest);
  const monitored = manifest.routines.filter((r) => r.monitored);
  // Every monitored routine must end up in the registry (none dropped for a missing evaluator).
  const missingEval = skipped.filter((s) => /no evaluator/.test(s.reason));
  assert.deepEqual(missingEval, [], `monitored routines without an evaluator: ${JSON.stringify(missingEval)}`);
  assert.equal(registry.length, monitored.length);
  // And each registry entry has the three callable hooks.
  for (const r of registry) {
    assert.equal(typeof r.read, 'function', `${r.name}: read()`);
    assert.equal(typeof r.evaluate, 'function', `${r.name}: evaluate()`);
  }
});

test('evaluateRoutines returns a verdict for every monitored routine, never throws', () => {
  // Empty data dir (worktree default): everything degrades to ok/paused-ok/unknown, never a crash.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-manifest-'));
  fs.mkdirSync(path.join(root, 'data'), { recursive: true });
  const monitored = manifest.routines.filter((r) => r.monitored).map((r) => r.name);
  for (const nowIso of ['2026-06-09T18:00:00Z', '2026-06-10T14:00:00Z', '2026-06-13T15:00:00Z']) {
    const rep = evaluateRoutines(root, new Date(nowIso), manifest);
    const names = rep.routines.map((r) => r.routine);
    for (const name of monitored) {
      assert.ok(names.includes(name), `${name} must be evaluated at ${nowIso}`);
    }
    for (const r of rep.routines) {
      assert.ok(['ok', 'paused-ok', 'dark', 'unknown'].includes(r.status), `${r.routine}: valid status`);
    }
  }
});

// Portable cross-check: the cron table in CLAUDE-ROUTINES.md and the manifest must
// not drift. Every routine the doc lists as a live scheduled task must be in the
// manifest. Names are matched by their `kerri-*` / `standard-works-*` slug.
test('every CLAUDE-ROUTINES.md routine slug appears in the manifest', () => {
  const doc = fs.readFileSync(ROUTINES_DOC, 'utf8');
  const manifestNames = new Set(manifest.routines.map((r) => r.name));
  // The activation checklist enumerates the 13 active tasks; harvest those slugs.
  const slugs = new Set();
  for (const m of doc.matchAll(/`(kerri-[a-z0-9-]+|standard-works-[a-z0-9-]+)`/g)) {
    slugs.add(m[1]);
  }
  // Slugs that name a prompt/skill but are NOT scheduled routines (helpers, references).
  const NOT_ROUTINES = new Set([
    'kerri-skill',
    'kerri-event-logistics',
    'kerri-sw-newsletter-writer',
    'kerri-sw-newsletter-editor',
    'kerri-sw-newsletter-marketing'
  ]);
  const missing = [...slugs].filter((s) => !NOT_ROUTINES.has(s) && !manifestNames.has(s));
  assert.deepEqual(
    missing,
    [],
    `routines named in CLAUDE-ROUTINES.md but missing from routines.manifest.json: ${missing.join(', ')}`
  );
});

test('every manifest routine appears in CLAUDE-ROUTINES.md', () => {
  const doc = fs.readFileSync(ROUTINES_DOC, 'utf8');
  const missing = manifest.routines.filter((r) => !doc.includes(r.name)).map((r) => r.name);
  assert.deepEqual(
    missing,
    [],
    `manifest routines not mentioned in CLAUDE-ROUTINES.md: ${missing.join(', ')}`
  );
});

// Machine-specific cross-check: every live ~/.claude/scheduled-tasks shim dir must
// have a manifest entry. Skipped when the dir is absent (CI on another machine),
// mirroring check-doc-reality.mjs's shim gating.
test('every ~/.claude/scheduled-tasks shim has a manifest entry (skipped if dir absent)', (t) => {
  const stDir = path.join(os.homedir(), '.claude', 'scheduled-tasks');
  if (!fs.existsSync(stDir)) {
    t.skip('~/.claude/scheduled-tasks not present on this machine');
    return;
  }
  const manifestNames = new Set(manifest.routines.map((r) => r.name));
  const shims = fs
    .readdirSync(stDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  const missing = shims.filter((s) => !manifestNames.has(s));
  assert.deepEqual(
    missing,
    [],
    `scheduled-task shims with no manifest entry (silent monitoring gap): ${missing.join(', ')}`
  );
});
