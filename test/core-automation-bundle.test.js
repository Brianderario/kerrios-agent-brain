import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const files = {
  morning: fs.readFileSync(new URL('../agent-prompts/kerri-morning-brief/SKILL.md', import.meta.url), 'utf8'),
  eod: fs.readFileSync(new URL('../agent-prompts/kerri-eod-meetings-review/SKILL.md', import.meta.url), 'utf8'),
  inbox: fs.readFileSync(new URL('../agent-prompts/kerri-inbox-sweep/SKILL.md', import.meta.url), 'utf8'),
  leadResearch: fs.readFileSync(new URL('../agent-prompts/kerri-lead-research/SKILL.md', import.meta.url), 'utf8'),
  coldOutreach: fs.readFileSync(new URL('../agent-prompts/kerri-cold-outreach/SKILL.md', import.meta.url), 'utf8'),
  pipeline: fs.readFileSync(new URL('../agent-prompts/kerri-pipeline-followup/SKILL.md', import.meta.url), 'utf8'),
  gapSweep: fs.readFileSync(new URL('../agent-prompts/kerri-gap-sweep/SKILL.md', import.meta.url), 'utf8'),
  brainPush: fs.readFileSync(new URL('../agent-prompts/kerri-brain-push/SKILL.md', import.meta.url), 'utf8'),
  automations: fs.readFileSync(
    new URL('../agent-prompts/kerri-skill/references/automations.md', import.meta.url),
    'utf8'
  ),
  registry: fs.readFileSync(new URL('../brain/wiki/agents/registry.md', import.meta.url), 'utf8'),
  hardwareFyi: fs.readFileSync(new URL('../brain/wiki/properties/hardware-fyi.md', import.meta.url), 'utf8'),
  revenueGoal: fs.readFileSync(
    new URL('../brain/wiki/workflows/hwfyi-cy2026-revenue-goal.md', import.meta.url),
    'utf8'
  ),
  revenueGoalScript: fs.readFileSync(new URL('../scripts/hwfyi-revenue-goal-sheet.mjs', import.meta.url), 'utf8'),
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
    "Kerri's Read",
    'brian@kerrihq.com',
    'output/morning-brief/<YYYY-MM-DD>.html',
    'Never send external emails',
    'Sendblue/text heads-up',
    'ending with exactly two raw directive lines',
    '::archive{reason="Durable morning brief output already written outside this chat"}',
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
    'Calendar is the source of truth',
    'Every included calendar meeting',
    'Google Tasks',
    'mandatory for every proposed meeting follow-up',
    'Revenue/sponsor context merge is mandatory before drafting',
    'Search meeting memory for the same company and same non-Brian attendees from the last 30 days',
    'Search sent mail for Brian\'s most recent message to the company/contact',
    'Do not collapse it to "let\'s compare notes" or a vague "we can put together options."',
    'Existing-chain routing is mandatory before drafting',
    'The visible Google Task title MUST use the stable customer `jobId`',
    'EOD source tag: EOD-<prefix><NN> for <YYYY-MM-DD> only',
    '"eodSourceTag": "<run-local source tag, e.g. EOD-H01; never use as the customer jobId>"',
    'Append the EOD draft to `data/jobs.json`',
    '"source": "eod-meetings-review"',
    'Sendblue/text heads-up',
    'no Brian-facing text, Slack, email, or task',
    'ending with exactly two raw directive lines',
    '::archive{reason="Durable EOD review output already written outside this chat"}',
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
    'Sendblue/text path as the primary Brian attention channel',
    'no Brian-facing notification',
    'ending with exactly two raw directive lines',
    '::archive{reason="Durable brain push output already written outside this chat"}'
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
    'Automation chat archive policy',
    'exactly one `::inbox-item{...}` directive',
    '::archive{reason="Durable automation output already written outside this chat"}',
    'Parallel Core Automation Bundle'
  ]) {
    assert.match(files.automations + files.registry + files.decision, new RegExp(escapeRegExp(required), 'i'));
  }
});

test('Hardware FYI revenue goal is wired into active revenue automations', () => {
  const requiredPromptTexts = [
    files.morning,
    files.inbox,
    files.eod,
    files.leadResearch,
    files.coldOutreach,
    files.pipeline,
    files.gapSweep
  ];

  for (const text of requiredPromptTexts) {
    assert.match(text, /hwfyi-cy2026-revenue-goal\.md/);
  }

  for (const required of [
    '$1,000,000',
    'cash collected',
    'pipeline advanced',
    'product value improved',
    'revenue system improved',
    'kerri-pipeline-followup',
    'kerri-lead-research',
    'kerri-cold-outreach',
    'kerri-inbox-sweep',
    'kerri-eod-meetings-review',
    'kerri-morning-brief',
    'CY2026 Revenue Goal',
    'hwfyi-revenue-goal-sheet.mjs',
    '1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk'
  ]) {
    assert.match(
      files.revenueGoal + files.automations + files.registry + files.hardwareFyi + files.revenueGoalScript,
      new RegExp(escapeRegExp(required), 'i')
    );
  }

  assert.match(files.automations + files.registry, /Pipeline follow-up.*8:33am ET/is);
  assert.match(files.automations + files.registry, /never (auto-)?sends?/i);
  assert.match(files.revenueGoalScript, /seed-contract-breakdown/);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
