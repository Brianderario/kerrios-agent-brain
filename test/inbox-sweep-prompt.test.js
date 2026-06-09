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
const coldOutreachPrompt = fs.readFileSync(
  new URL('../agent-prompts/kerri-cold-outreach/SKILL.md', import.meta.url),
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

test('inbox sweep prompt blocks overlapping scheduled runs before loading context', () => {
  for (const required of [
    'STEP -1 — SINGLE-RUN GUARD',
    'node scripts/inbox-sweep-lock.mjs acquire --ttl-minutes 30 --runner claude',
    'Before reading any other KerriOS files',
    'reason: "busy"',
    'Stop immediately and silently',
    'node scripts/inbox-sweep-lock.mjs release'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }

  assert.match(automationDoc, /inbox-sweep-lock\.mjs/);
  assert.match(automationDoc, /overlapping runs exit silently/i);
});

test('inbox sweep prompt requires context, enrichment, and full thread reads before drafting', () => {
  assert.match(prompt, /ENRICHMENT \(run after customer lookup and before drafting\):/);
  assert.match(prompt, /`none`/);
  assert.match(prompt, /`light`/);
  assert.match(prompt, /`deep`/);
  assert.match(prompt, /FULL THREAD READ \(mandatory before drafting\):/);
  assert.match(prompt, /Do not draft from the latest email alone\./);
});

test('inbox sweep prompt keeps quiet runs cheap and escalates only for material drafting', () => {
  for (const required of [
    'TOKEN BUDGET CONTRACT',
    'Default mode is cheap triage',
    'reasoning_effort = "medium"',
    'Use GPT-5.5 Extra High quality only for the material drafting path',
    'STAGE 1 — TRIAGE LOAD',
    'STAGE 2 — MATERIAL LOAD',
    'Do not read full `companies.json`, `draft-learnings.md`, sponsor templates, people pages, customer protocol, architecture docs, `NOW.md`, or `brain/log.md` yet',
    'Do not dump old sent/skipped jobs into context on quiet runs',
    'Do not call full `show_completed:true` list scans unless',
    'MATERIAL DRAFTING PASS',
    'Baseline triage context is not enough to draft'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
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

test('inbox sweep prompt routes suggestions through relevance-gated Google Tasks', () => {
  for (const required of [
    'google-tasks-improvement-suggestions.md',
    'BUILD RELEVANCE',
    'Source runner',
    'obsolete',
    'Claude-era',
    'Claude Code interactive',
    '💡 SUGGESTION:'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt sends brief Sendblue alerts only for newly-created tasks', () => {
  for (const required of [
    'Sendblue/text alert path',
    'node /Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs --message',
    'brief one-way notifications to Brian for newly-created tasks',
    "any automation output that needs Brian's attention",
    'separate from iMessage Handoff',
    'Do not call `/Users/brianderario/.codex/skills/imessage-handoff/scripts/send-update.js`',
    'SEND THE TASK-CREATED TEXT ALERT',
    'Text only after a new Google Task is actually created',
    'Do not text when the sweep finds no new task-worthy email',
    'Do not text for ordinary no-op sweeps',
    'taskAlertedAt = now',
    'do not fall back to Slack',
    'Still continue to STEP 8 so the automation chat can archive',
    'quiet" means no external attention channel',
    'If the sweep did not add a Google Task and did not hit a decision, blocker, error, or other concrete Brian action, do not text Brian',
    'send ONE brief Sendblue/text heads-up',
    'Codex-era note',
    'Under Claude Code, skip them'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }

  // Codex closing directives were retired 2026-06-09; the prompt must no longer instruct them.
  assert.doesNotMatch(prompt, /ending with exactly two raw directive lines/i);

  assert.match(automationDoc, /brief Sendblue\/text heads-up/);
  assert.match(automationDoc, /send-text-alert\.mjs --message/);
  assert.match(automationDoc, /separate from iMessage Handoff/);
  assert.match(automationDoc, /if there is no task, decision, blocker, error, or other Brian action, it sends no text/);
  assert.match(automationDoc, /Durable output policy/);
  assert.match(automationDoc, /Codex.*closing directives are no longer needed/);
});

test('inbox sweep prompt suppresses repeated identical error texts', () => {
  for (const required of [
    'REPEATED FAILURE ALERT DEDUPE',
    'lastErrorReason',
    'lastErrorAlertedAt',
    'same reason has already been alerted in the last 24 hours',
    'do NOT send another text',
    'errorAlertSuppressed: true',
    'avoid touching `NOW.md` or `brain/log.md` just to repeat the same outage',
    'Text again only when the failure reason changes materially',
    'On recovery, clear `lastErrorAt`, `lastErrorReason`, and `lastErrorAlertedAt`',
    'Google Tasks read failure remains the highest-risk case',
    'alert at most once per hour while it persists',
    'S/W Superhuman connector being unavailable every 15 minutes'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }

  assert.match(automationDoc, /Repeated identical connector errors are deduped/);
  assert.match(automationDoc, /first outage alert only/);
  assert.match(automationDoc, /silent fail-closed grading/);
});

test('inbox sweep prompt protects redo provenance and stale-task markers', () => {
  for (const required of [
    'DRAFT SOURCE: Codex interactive redo',
    'jobs.json.originalDraft',
    'do NOT infer a Brian edit',
    'real Brian edit and not a Kerri/Codex redo',
    '🆕',
    'strip any leading `🆕 ` marker',
    'Clear the `🆕 ` marker automatically on send, skip, or redo'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt makes internal CC suggestions explicit and approval-gated', () => {
  for (const required of [
    'brain/wiki/people/ari-lewis.md',
    'brain/wiki/people/benji-chia.md',
    'Internal teammate CC suggestions',
    'Never silently add an internal CC',
    'Internal CC suggestion: add <Name> <<email>>',
    'If Brian checks the task without deleting that line, include that address as CC',
    'Internal CC missing: <Name> email not verified in KerriOS',
    'Ari for finance, invoices, wire details, banking, legal/contract/payment/accounting',
    'Benji for Hardware FYI operations'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt blocks double emails before approval sends', () => {
  for (const required of [
    'HARD NO-DOUBLE-EMAIL GATE',
    'never send a double email',
    'every `internetMessageIds[]` value',
    'Brian/Kerri did not already reply after the task was created',
    'SECOND SEND APPROVED BY BRIAN',
    'If duplicate status cannot be verified'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt keeps EOD approvals on existing email chains', () => {
  for (const required of [
    'task title starts with `🌙 EOD-` or the notes contain `EOD source tag:` and no matching job exists in jobs.json',
    'rewrite the title to `🌙 <job.jobId> — <Company> — <subject/meeting>`',
    'keep the `EOD-H01` value only as a source tag in notes',
    'Existing-chain routing gate',
    'job.source == "eod-meetings-review"',
    "Use the connector's reply/thread-draft path only",
    'Never fall back to a fresh `send_email` with the same subject',
    'prefix title with `⚠️ route needed — `'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt updates cold outreach state after approved sends', () => {
  for (const required of [
    'data/cold-outreach-state.json',
    'COLD BATCH TASK HANDLING (title starts with `☀️ COLD BATCH`)',
    'move that email from `cold-outreach-state#drafted[]` to `#sent[]`',
    'Do NOT change the cold cap counters',
    'Never re-send an already-`sent[]` draft on a later sweep',
    'Legacy single `❄️ COLD-` tasks'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('cold outreach prompt keeps first-touch emails short and partnership-focused', () => {
  for (const required of [
    '4-5 short sentences after the greeting',
    "I'm Kerri, and I work on partnerships at Hardware FYI.",
    "We're a media company with a newsletter covering hardware manufacturing, read by over 17,000 hardware engineering leaders and decision makers.",
    '<Company> seems like a strong fit because <specific fit>.',
    "If this is interesting, I'd love to have a conversation about partnering together. Happy to answer any questions.",
    'omit by default on first cold outreach'
  ]) {
    assert.match(coldOutreachPrompt, new RegExp(escapeRegExp(required)));
  }
  assert.doesNotMatch(coldOutreachPrompt, /3–5 sentences/);
});

test('inbox sweep cross-checks live task status before trusting the listing', () => {
  for (const required of [
    'LIVE-STATUS CROSS-CHECK (run FIRST, before trusting any task listing):',
    'per-job `gtasks_get_task` lookup is the source of truth',
    '`status == pending`',
    'gtasks_get_task(tasklist_id = job.gtasksListKey',
    'the per-job lookup wins',
    'show_completed',
    'Brian-checked-but-listing-missed-it'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep enforces answer-every-ask coverage on replies', () => {
  for (const required of [
    'ANSWER EVERY ASK (mandatory coverage pass',
    'Enumerate EVERY distinct ask, question, instruction, and embedded request',
    'never silently omitted',
    'do not mark a draft send-ready until every enumerated item maps to a line',
    'These bullets ARE the coverage record now',
    'every ask must still appear here, addressed or explicitly deferred',
    '⚠ flag line'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('inbox sweep prompt mandates trust instrumentation on jobs and run grades', () => {
  // actionClass: mandatory field with the exact 8-value enum.
  for (const required of [
    '"actionClass"',
    'MANDATORY on every new job',
    'ACTION CLASS GUIDE',
    'every new jobs.json entry MUST carry `actionClass`',
    'exactly one of these 8 values, no others',
    'Set `actionClass` per the ACTION CLASS GUIDE'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
  for (const actionClass of [
    'internal-recipient-reply',
    'scheduling-logistics-reply',
    'warm-thread-holding-reply',
    'sponsor-substantive-reply',
    'pipeline-nudge',
    'renewal-draft',
    'cold-send',
    'gmail-draft-only'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(actionClass)));
  }

  // sentDraft + decidedAt: send-time and decision-time stamps.
  for (const required of [
    '"sentDraft"',
    '"decidedAt"',
    'sentDraft → the exact body actually sent',
    'originalDraft vs sentDraft',
    "decidedAt → the ISO timestamp this sweep observed Brian's decision (checkbox, ACTION line, or deletion)",
    'decidedAt → the ISO timestamp this sweep observed the skip decision',
    'decidedAt → now (the sweep observed the deletion)',
    'stamp `decidedAt`',
    'do not overwrite it'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }

  // doubleEmailBlocks: per-run counter in the grade ledger.
  assert.match(prompt, /`doubleEmailBlocks` \(integer/);
  assert.match(prompt, /count of sends the HARD NO-DOUBLE-EMAIL GATE held this run/);
  assert.match(prompt, /the count lands in the run grade as `doubleEmailBlocks`/);
});

test('inbox sweep auto-logged path is fail-closed and scoped to internal-recipient-reply', () => {
  for (const required of [
    'AUTO-LOGGED SEND PATH',
    'brain/wiki/decisions/2026-06-09-autonomy-boundary.md',
    'data/autonomy-policy.json',
    'a sweep NEVER promotes a class',
    'Fail closed, always',
    'Today that is `internal-recipient-reply` and nothing else',
    'trustedInternal',
    'One non-matching address → ASK',
    'S-prefix NEVER auto-sends',
    'The HARD NO-DOUBLE-EMAIL GATE passes for this job exactly as it does for approved sends',
    'pricing, legal, finance, spend, CRM, or scope',
    'never "send now, task later."',
    'auto-CC to brian@hardwarefyi.com stays on',
    '`autoLogged: true`',
    'no Google Task is created for an auto-logged send',
    'NO Sendblue/text alert for an auto-logged send',
    'node scripts/autonomy-report.mjs --auto-logged',
    'Demotion is always allowed; promotion never is'
  ]) {
    assert.match(prompt, new RegExp(escapeRegExp(required)));
  }
});

test('automation reference points at Claude Code primary inbox sweep', () => {
  assert.match(automationDoc, /Claude Code Primary/);
  assert.match(automationDoc, /Inbox Sweep \(#2\) = ACTIVE in Claude Code/);
  assert.match(automationDoc, /agent-prompts\/kerri-inbox-sweep\/SKILL\.md/);
  assert.match(automationDoc, /inbox-sweep-grades\.json/);
  assert.match(automationDoc, /every 15 minutes/i);
  assert.doesNotMatch(automationDoc, /six active .*shards/i);
});

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
