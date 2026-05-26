import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const files = {
  morning: fs.readFileSync(new URL('../agent-prompts/kerri-morning-brief/SKILL.md', import.meta.url), 'utf8'),
  eod: fs.readFileSync(new URL('../agent-prompts/kerri-eod-meetings-review/SKILL.md', import.meta.url), 'utf8'),
  brainPush: fs.readFileSync(new URL('../agent-prompts/kerri-brain-push/SKILL.md', import.meta.url), 'utf8'),
  automations: fs.readFileSync(
    new URL('../agent-prompts/kerri-skill/references/automations.md', import.meta.url),
    'utf8'
  ),
  registry: fs.readFileSync(new URL('../brain/wiki/agents/registry.md', import.meta.url), 'utf8'),
  decision: fs.readFileSync(
    new URL('../brain/wiki/decisions/2026-05-26-parallel-core-automation-bundle.md', import.meta.url),
    'utf8'
  )
};

test('morning brief prompt is approval-safe and writes compact state', () => {
  for (const required of [
    'weekday HTML morning brief',
    "Today's Meetings",
    "Yesterday's Chase Spend",
    'Pending Tasks',
    'brian@kerrihq.com',
    'output/morning-brief/<YYYY-MM-DD>.html',
    'Never send external emails',
    'data/morning-brief-state.json',
    'SELF-GRADE',
    'GPT-5.5'
  ]) {
    assert.match(files.morning + files.automations, new RegExp(escapeRegExp(required), 'i'));
  }
});

test('EOD meetings review queues drafts instead of sending', () => {
  for (const required of [
    '6:30pm ET',
    'Granola',
    'Google Tasks',
    'Do NOT send any email',
    'data/eod-grades.json',
    'SELF-GRADE'
  ]) {
    assert.match(files.eod, new RegExp(escapeRegExp(required), 'i'));
  }
});

test('brain push validates before committing and excludes runtime state', () => {
  for (const required of [
    'npm run check',
    'npm test',
    'git diff --check',
    'NEVER stage',
    'data/brain-push-state.json',
    'Slack-alert Brian'
  ]) {
    assert.match(files.brainPush, new RegExp(escapeRegExp(required), 'i'));
  }
});

test('core automation bundle is registered as GPT-5.5 high', () => {
  for (const required of [
    'kerri-morning-brief',
    'kerri-eod-meetings-review',
    'kerri-brain-push',
    'GPT-5.5 high',
    'Parallel Core Automation Bundle'
  ]) {
    assert.match(files.automations + files.registry + files.decision, new RegExp(escapeRegExp(required), 'i'));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
