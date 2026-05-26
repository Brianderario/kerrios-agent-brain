import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const prompt = fs.readFileSync(
  new URL('../agent-prompts/kerri-inbox-sweep/SKILL.md', import.meta.url),
  'utf8'
);
const automationDoc = fs.readFileSync(
  new URL('../agent-prompts/kerri-skill/references/automations.md', import.meta.url),
  'utf8'
);

test('inbox sweep prompt preserves approval gates and mailbox routing', () => {
  for (const required of [
    'kerri@hardwarefyi.com',
    'brian@hardwarefyi.com',
    'brian@kerrihq.com',
    'brian@standardandworks.com',
    'Google Tasks',
    'Gmail (brian@kerrihq.com): create_draft only',
    'Do NOT send any emails if you cannot read the task lists first',
    'S/W boundary check'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt requires context, enrichment, and full thread reads before drafting', () => {
  assert.match(prompt, /ENRICHMENT \(run after customer lookup and before drafting\):/);
  assert.match(prompt, /`none`/);
  assert.match(prompt, /`light`/);
  assert.match(prompt, /`deep`/);
  assert.match(prompt, /FULL THREAD READ \(mandatory before drafting\):/);
  assert.match(prompt, /Do not draft from the latest email alone\./);
});

test('inbox sweep prompt includes self-grading and KerriOS write-back', () => {
  for (const required of [
    'STEP 6 — SELF-GRADE AND IMPROVE',
    'Coverage',
    'Dedup/state',
    'Context',
    'Draft quality',
    'Approval safety',
    'Brain write-back',
    'Daily grade',
    'Weekly grade',
    'Write compact KerriOS memory updates'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('automation reference points at Codex primary inbox sweep', () => {
  assert.match(automationDoc, /Codex Primary/);
  assert.match(automationDoc, /Inbox Sweep \(#2\) = ACTIVE in Codex/);
  assert.match(automationDoc, /agent-prompts\/kerri-inbox-sweep\/SKILL\.md/);
  assert.match(automationDoc, /inbox-sweep-grades\.json/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
