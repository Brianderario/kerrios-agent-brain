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
  gapCloseTargets: fs.readFileSync(
    new URL('../brain/wiki/workflows/hwfyi-cy2026-gap-close-targets.md', import.meta.url),
    'utf8'
  ),
  dailyOutreachLoop: fs.readFileSync(
    new URL('../brain/wiki/workflows/hwfyi-daily-10-outreach-loop.md', import.meta.url),
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
    'NO TEXT HEADS-UP',
    'Codex-era note',
    'Under Claude Code, skip them',
    'data/morning-brief-state.json',
    'SELF-GRADE'
  ]) {
    assert.match(files.morning + files.automations, new RegExp(escapeRegExp(required), 'i'));
  }

  // Codex closing directives were retired 2026-06-09; the prompt must no longer instruct them.
  assert.doesNotMatch(files.morning, /ending with exactly two raw directive lines/i);

  // Approval queue section: digest-driven, first in the body, escalations surfaced in the email (not a text — Kerri stopped texting 2026-06-17).
  for (const required of [
    'node scripts/approval-queue-digest.mjs --json',
    'Approval Queue',
    'Approval queue (always first',
    'at the TOP of the body',
    'dollars then age',
    'totals line',
    'older than 3 days',
    'ESCALATION banner',
    'Decide or explicitly skip today',
    'Approval queue unavailable'
  ]) {
    assert.match(files.morning, new RegExp(escapeRegExp(required)));
  }

  // Auto-logged sends section: report-driven, never a text, ramp promotion stays Brian-only.
  for (const required of [
    'node scripts/autonomy-report.mjs --auto-logged --json',
    'node scripts/autonomy-report.mjs --ramp --json',
    'Auto-Logged Sends',
    'No auto-logged sends in the last day.',
    'NEVER earn a separate alert',
    'Kerri never does',
    'Auto-logged report unavailable'
  ]) {
    assert.match(files.morning, new RegExp(escapeRegExp(required)));
  }
});

test('EOD meetings review queues drafts instead of sending', () => {
  for (const required of [
    '6:30pm ET',
    'Granola',
    'Calendar is the source of truth',
    'Every included calendar meeting',
    'Kerri Console tasks',
    'mandatory for every proposed meeting follow-up',
    'Revenue/sponsor context merge is mandatory before drafting',
    'Search meeting memory for the same company and same non-Brian attendees from the last 30 days',
    'Search sent mail for Brian\'s most recent message to the company/contact',
    'Do not collapse it to "let\'s compare notes" or a vague "we can put together options."',
    'Existing-chain routing is mandatory before drafting',
    'The visible Console task title MUST use the stable customer `jobId`',
    'EOD source tag: EOD-<prefix><NN> for <YYYY-MM-DD> only',
    '"eodSourceTag": "<run-local source tag, e.g. EOD-H01; never use as the customer jobId>"',
    'Append the EOD draft to `data/jobs.json`',
    '"source": "eod-meetings-review"',
    'email heads-up',
    'no Brian-facing text, Slack, email, or task',
    'Codex-era note',
    'Under Claude Code, skip them',
    'Do NOT send any email',
    'data/eod-grades.json',
    'SELF-GRADE'
  ]) {
    assert.match(files.eod, new RegExp(escapeRegExp(required), 'i'));
  }

  // Codex closing directives were retired 2026-06-09; the prompt must no longer instruct them.
  assert.doesNotMatch(files.eod, /ending with exactly two raw directive lines/i);
});

test('brain push validates before committing and excludes runtime state', () => {
  for (const required of [
    'npm run check',
    'npm test',
    'git diff --check',
    'NEVER stage',
    'data/brain-push-state.json',
    'Failure alerts go by email',
    'no Brian-facing notification',
    'Codex-era note',
    'Under Claude Code, skip them'
  ]) {
    assert.match(files.brainPush, new RegExp(escapeRegExp(required), 'i'));
  }

  // Codex closing directives were retired 2026-06-09; the prompt must no longer instruct them.
  assert.doesNotMatch(files.brainPush, /ending with exactly two raw directive lines/i);
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
    'seed-pipeline',
    'pipeline-summary',
    'Hardware FYI CY2026 Revenue Pipeline',
    'Closed Won',
    'Pipeline Amount',
    'Gap to Goal',
    'hwfyi-cy2026-gap-close-targets.md',
    'hwfyi-daily-10-outreach-loop.md',
    '25 ready',
    '10 approval-ready',
    'COLD BATCH SHORT',
    'no pricing sent yet',
    'TBD',
    'source-backed',
    'Prospect',
    'Interest',
    'Contract Won',
    'Contract Lost',
    '1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk'
  ]) {
    assert.match(
      files.revenueGoal + files.gapCloseTargets + files.dailyOutreachLoop + files.leadResearch + files.coldOutreach + files.pipeline + files.registry + files.hardwareFyi + files.revenueGoalScript,
      new RegExp(escapeRegExp(required), 'i')
    );
  }

  for (const required of [
    'TOKEN BUDGET CONTRACT',
    'cheap preflight',
    'Inspect at most 25 queue entries',
    'queue already has at least 25 ready',
    'no raw Apollo',
    'no raw enrichment dumps',
    'company fit:',
    'person fit:',
    'qualification:',
    'paid-access behavior',
    'High-intent gate',
    'contextual relevance alone is not enough',
    'Generic contextual matching'
  ]) {
    assert.match(
      files.dailyOutreachLoop + files.leadResearch + files.coldOutreach,
      new RegExp(escapeRegExp(required), 'i')
    );
  }

  assert.match(files.pipeline, /never (auto-)?sends?/i);
  assert.match(files.revenueGoalScript, /seed-contract-breakdown/);
  assert.match(files.revenueGoalScript, /PIPELINE_SEED_ROWS/);
  assert.match(files.revenueGoalScript, /OPEN_PIPELINE_STATUSES/);
  assert.match(files.inbox + files.eod + files.pipeline + files.coldOutreach + files.leadResearch, /Contract Won/);
  assert.match(files.inbox + files.eod + files.pipeline + files.coldOutreach + files.leadResearch, /Contract Lost/);
  assert.match(files.leadResearch + files.coldOutreach, /uncontacted leads?/i);
});

test('inbox sweep carries trust instrumentation for the self-improvement dataset', () => {
  for (const required of [
    '"actionClass"',
    // 2026-06-10 rewrite (d052b09): the v1 "ACTION CLASS GUIDE" section became the
    // one-line enum header; the 8 class values below are unchanged.
    'ACTION CLASSES (exactly one per job)',
    'internal-recipient-reply',
    'scheduling-logistics-reply',
    'warm-thread-holding-reply',
    'sponsor-substantive-reply',
    'pipeline-nudge',
    'renewal-draft',
    'cold-send',
    'gmail-draft-only',
    '"sentDraft"',
    '"decidedAt"',
    'doubleEmailBlocks'
  ]) {
    assert.match(files.inbox, new RegExp(escapeRegExp(required)));
  }
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
