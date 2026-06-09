import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-doc-reality.mjs', import.meta.url));

// Build a fake repo: prompt dirs (each optionally with SKILL.md) + a routines doc
// + an optional routines.manifest.json.
function fixture({ prompts = {}, routinesDoc = '', manifest = null } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-docreal-'));
  const ap = path.join(root, 'agent-prompts');
  fs.mkdirSync(ap, { recursive: true });
  for (const [name, hasSkill] of Object.entries(prompts)) {
    fs.mkdirSync(path.join(ap, name), { recursive: true });
    if (hasSkill) fs.writeFileSync(path.join(ap, name, 'SKILL.md'), `# ${name}`);
  }
  fs.writeFileSync(path.join(ap, 'CLAUDE-ROUTINES.md'), routinesDoc);
  if (manifest) fs.writeFileSync(path.join(ap, 'routines.manifest.json'), JSON.stringify(manifest));
  return root;
}

function run(root, extra = []) {
  const r = spawnSync('node', [script, '--root', root, '--json', '--no-shims', ...extra], { encoding: 'utf8' });
  return { status: r.status, report: JSON.parse(r.stdout) };
}

test('clean: documented prompt with SKILL.md → ok', () => {
  const root = fixture({ prompts: { 'kerri-foo': true }, routinesDoc: 'runs kerri-foo/SKILL.md nightly' });
  const { status, report } = run(root);
  assert.equal(status, 0);
  assert.equal(report.ok, true);
});

test('prompt dir without SKILL.md → missing-skill error', () => {
  const root = fixture({ prompts: { 'kerri-bar': false }, routinesDoc: 'kerri-bar/SKILL.md' });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'missing-skill'));
});

test('doc references a non-existent prompt → dangling-reference error', () => {
  const root = fixture({ prompts: { 'kerri-foo': true }, routinesDoc: 'kerri-foo/SKILL.md and kerri-ghost/SKILL.md' });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.ok(report.errors.some((e) => e.kind === 'dangling-reference' && e.detail.includes('kerri-ghost')));
});

test('undocumented prompt dir → warning only, still ok', () => {
  const root = fixture({ prompts: { 'kerri-foo': true, 'kerri-lonely': true }, routinesDoc: 'kerri-foo/SKILL.md' });
  const { status, report } = run(root);
  assert.equal(status, 0);
  assert.equal(report.ok, true);
  assert.ok(report.warnings.some((w) => w.kind === 'undocumented-prompt' && w.detail.includes('kerri-lonely')));
});

test('manifest: monitored routine with no prompt dir → hard error', () => {
  const root = fixture({
    prompts: { 'kerri-foo': true },
    routinesDoc: 'kerri-foo/SKILL.md runs nightly; kerri-ghost is also scheduled',
    manifest: { schema: 'routines-manifest-v1', routines: [
      { name: 'kerri-foo', monitored: true, core: false, cron: '0 1 * * *', cadenceDescription: 'nightly' },
      { name: 'kerri-ghost', monitored: true, core: false, cron: '0 2 * * *', cadenceDescription: 'nightly' }
    ] }
  });
  const { status, report } = run(root);
  assert.equal(status, 1);
  assert.equal(report.manifestChecked, true);
  assert.ok(report.errors.some((e) => e.kind === 'manifest-missing-prompt' && e.detail.includes('kerri-ghost')));
});

test('manifest: unmonitored event-triggered routine with no prompt dir → warning only', () => {
  const root = fixture({
    prompts: { 'kerri-foo': true },
    routinesDoc: 'kerri-foo/SKILL.md; standard-works-issue-writer fires on issue cadence',
    manifest: { schema: 'routines-manifest-v1', routines: [
      { name: 'kerri-foo', monitored: true, core: false, cron: '0 1 * * *', cadenceDescription: 'nightly' },
      { name: 'standard-works-issue-writer', monitored: false, core: false, cron: null, cadenceDescription: 'event-triggered' }
    ] }
  });
  const { status, report } = run(root);
  assert.equal(status, 0);
  assert.ok(report.warnings.some((w) => w.kind === 'manifest-no-prompt-dir' && w.detail.includes('standard-works-issue-writer')));
});

test('manifest: doc routine slug absent from the manifest → warning (drift heads-up)', () => {
  const root = fixture({
    prompts: { 'kerri-foo': true, 'kerri-newbie': true },
    routinesDoc: '`kerri-foo` and `kerri-newbie` both run nightly',
    manifest: { schema: 'routines-manifest-v1', routines: [
      { name: 'kerri-foo', monitored: true, core: false, cron: '0 1 * * *', cadenceDescription: 'nightly' }
    ] }
  });
  const { status, report } = run(root);
  assert.equal(status, 0);
  assert.ok(report.warnings.some((w) => w.kind === 'doc-not-in-manifest' && w.detail.includes('kerri-newbie')));
});

test('orphan scheduled-tasks shim → warning', () => {
  const root = fixture({ prompts: { 'kerri-foo': true }, routinesDoc: 'kerri-foo/SKILL.md' });
  const stDir = path.join(root, 'fake-scheduled-tasks');
  fs.mkdirSync(path.join(stDir, 'kerri-orphan'), { recursive: true });
  const r = spawnSync('node', [script, '--root', root, '--json', '--scheduled-tasks-dir', stDir], { encoding: 'utf8' });
  const report = JSON.parse(r.stdout);
  assert.equal(report.shimsChecked, true);
  assert.ok(report.warnings.some((w) => w.kind === 'orphan-shim' && w.detail.includes('kerri-orphan')));
});
