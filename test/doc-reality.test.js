import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../scripts/check-doc-reality.mjs', import.meta.url));

// Build a fake repo: prompt dirs (each optionally with SKILL.md) + a routines doc.
function fixture({ prompts = {}, routinesDoc = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kerrios-docreal-'));
  const ap = path.join(root, 'agent-prompts');
  fs.mkdirSync(ap, { recursive: true });
  for (const [name, hasSkill] of Object.entries(prompts)) {
    fs.mkdirSync(path.join(ap, name), { recursive: true });
    if (hasSkill) fs.writeFileSync(path.join(ap, name, 'SKILL.md'), `# ${name}`);
  }
  fs.writeFileSync(path.join(ap, 'CLAUDE-ROUTINES.md'), routinesDoc);
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

test('orphan scheduled-tasks shim → warning', () => {
  const root = fixture({ prompts: { 'kerri-foo': true }, routinesDoc: 'kerri-foo/SKILL.md' });
  const stDir = path.join(root, 'fake-scheduled-tasks');
  fs.mkdirSync(path.join(stDir, 'kerri-orphan'), { recursive: true });
  const r = spawnSync('node', [script, '--root', root, '--json', '--scheduled-tasks-dir', stDir], { encoding: 'utf8' });
  const report = JSON.parse(r.stdout);
  assert.equal(report.shimsChecked, true);
  assert.ok(report.warnings.some((w) => w.kind === 'orphan-shim' && w.detail.includes('kerri-orphan')));
});
