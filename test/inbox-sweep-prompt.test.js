import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

// Safety tests for agent-prompts/kerri-inbox-sweep/SKILL.md (an email-sending agent).
//
// Rewritten 2026-06-10 for the full prompt rewrite in commit d052b09 (Brian-approved,
// see brain/log.md 2026-06-10 17:25 ET) and the P4 correction in 3f25280 (17:40 ET).
// The v1 prompt's scattered exception blocks were consolidated into seven OPERATING
// PRINCIPLES (P1-P7) plus numbered steps; each test below maps a v1 invariant to its
// new home, or covers a new principle. Invariants the rewrite deliberately removed are
// noted inline with the decision that removed them.
//
// These assertions pin exact prompt text on purpose: the prompt IS the program for the
// scheduled sweep, so a reworded safety rule is a behavior change and should fail here
// until the test is updated alongside a reviewed prompt edit (SEND_AUTHORITY files only
// land on main via explicit reviewed commits, never the auto-sync hook).

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
const eodMeetingsPrompt = fs.readFileSync(
  new URL('../agent-prompts/kerri-eod-meetings-review/SKILL.md', import.meta.url),
  'utf8'
);
const autonomyPolicy = JSON.parse(
  fs.readFileSync(new URL('../data/autonomy-policy.json', import.meta.url), 'utf8')
);

function assertAll(haystack, snippets) {
  for (const required of snippets) {
    assert.match(haystack, new RegExp(escapeRegExp(required)));
  }
}

test('operating principles cover all seven safety invariants', () => {
  assertAll(prompt, [
    'OPERATING PRINCIPLES (these outrank everything below',
    'P1. INTERNAL TEAMMATES ALWAYS GET AN ANSWER.',
    'P2. NOTHING IS DISMISSED WITHOUT PROOF.',
    'P3. EVERY REAL HUMAN EMAIL LEAVES AN ARTIFACT.',
    'P4. EMPTY IS VERIFIED, NOT ASSUMED.',
    'P5. EXTERNAL SENDS STAY APPROVAL-GATED.',
    'P6. NEVER DOUBLE-EMAIL.',
    'P7. GRADE HONESTLY.'
  ]);
});

// v1: "preserves approval gates and mailbox routing".
// New home: REFERENCE section (connectors by name), SEND IDENTITY, S/W BOUNDARY,
// STEP 8 error rules, SESSION NOTES.
test('inbox sweep prompt preserves approval gates and mailbox routing', () => {
  assertAll(prompt, [
    "Resolve MCP connectors BY NAME from the session's tool list, never by hardcoded UUID",
    'kerri@hardwarefyi.com → `kerri-hardwarefyi-email`',
    'brian@hardwarefyi.com → `brian-hardwarefyi-email`',
    'brian@kerrihq.com → the Gmail connector',
    'NO send. Kerri never sends as brian@kerrihq.com',
    'brian@standardandworks.com → the Superhuman connector',
    'Savant tasks API → `node scripts/console-task-api.mjs ...`',
    'APPROVAL CHANNEL: Savant production Tasks board',
    'that mailbox fails closed this run',
    'never silently shrink coverage',
    'Never send email if the Savant queue cannot be read first.',
    'enforce approved=true + approvalSource on every send',
    'The S/W boundary, the no-double-email gate, and the external approval gate are permanent.'
  ]);
  // No connector may ever be addressed by a literal UUID again (three stale UUIDs in
  // v1 pointed at nothing — d052b09 rewrite finding).
  assert.doesNotMatch(
    prompt,
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i
  );
});

test('S/W boundary rules isolate Standard & Works threads', () => {
  assertAll(prompt, [
    'S/W BOUNDARY: S-prefix jobs are coordination markers only.',
    'No S/W internal financials, staff, vendor, or content-draft material',
    'S-prefix → from brian@standardandworks.com via Superhuman. Never CC the HWFYI side into an S/W thread',
    'never send from a HWFYI address into an S/W thread',
    'scrub originalDraft and sentDraft to "<sent — body retained in Superhuman thread>"',
    'Every kerri@/brian@hardwarefyi send auto-CCs brian@hardwarefyi.com. Never suppress it.'
  ]);
});

// v1: "blocks overlapping scheduled runs before loading context" — unchanged in spirit;
// the lock step survived the rewrite as STEP -1.
test('inbox sweep prompt blocks overlapping scheduled runs before loading context', () => {
  assertAll(prompt, [
    'STEP -1 — SINGLE-RUN GUARD',
    'Before reading any other KerriOS files or calling any MCP',
    'node scripts/inbox-sweep-lock.mjs acquire --ttl-minutes 30 --runner claude',
    'Exit code 2 / reason "busy"',
    'Stop immediately and silently',
    'node scripts/inbox-sweep-lock.mjs release',
    'The TTL is not permission to overlap.'
  ]);

  assert.match(automationDoc, /inbox-sweep-lock\.mjs/);
  assert.match(automationDoc, /overlapping runs exit silently/i);
});

// New P1 invariant (Brian decision 2026-06-10 PM): internal teammates are answered
// autonomously, but ONLY when no outside recipient is anywhere on the chain, and
// gated topics gate enactment, not conversation.
test('internal autopilot is scoped to trustedInternal with no outside recipients', () => {
  assertAll(prompt, [
    'NO outside recipients anywhere on the chain (To + Cc of the inbound and of your reply)',
    'One outside recipient anywhere on the chain → not internal. Use the external flow.',
    'gate ENACTMENT, not conversation',
    'Never hold an internal reply because its topic is gated.',
    'INTERNAL AUTOPILOT (P1): sender is trustedInternal AND no outside recipient anywhere on the chain',
    'Run the no-double-email gate first.',
    'approvalSource: "auto: internal teammate reply per P1 (Brian decision 2026-06-10); all recipients trustedInternal"',
    'Record the job (actionClass internal-recipient-reply, autoLogged true, status sent, consoleTaskId null)',
    'No task, no text.',
    "The morning brief's auto-logged section is the recap surface.",
    'Brian-must-act carve-out'
  ]);
});

// New P2 invariant (the C-Infinity drop, 2026-06-10 17:25 ET log): "already handled"
// claims require sent-items proof. Replaces v1's weaker already-handled heuristics.
test('dismissals require sent-items proof before any email is recorded handled', () => {
  assertAll(prompt, [
    'search the sent items of the relevant mailbox for an outbound reply on that thread NEWER than the inbound',
    'No reply found = NOT handled',
    'Never assert handling from memory, from thread vibes, or from "Brian is on the thread."',
    'ALREADY-HANDLED CHECK (P2)',
    'PROVE it from the sent folder of the relevant mailbox (outbound on the same thread, newer than this inbound)',
    'record disposition "handled-by-<who> (verified sent <ET>)"',
    'contains a NEW ask that the outbound did not answer, it is not handled'
  ]);
});

// New P3 invariant: every real human email leaves an artifact; teammate-owned and
// warm-prospect threads get trackers (data/trackers.json) instead of vanishing.
test('every real email leaves an artifact via reply, task, or tracker', () => {
  assertAll(prompt, [
    'The only emails that may vanish without trace are true automation noise (AUTO-SKIP list)',
    'FOLLOW-UP TRACKER',
    '`data/trackers.json` — FOLLOW-UP TRACKERS (P3)',
    'kind: "teammate-owned" | "warm-prospect"',
    'still unanswered by anyone after 48h, the tracker escalates to a task',
    'Warm revenue signals never get dropped as no-ask.',
    'TEAMMATE-OWNED EXTERNAL THREAD (P3)',
    '{ kind: "teammate-owned", owner, dueAt: now+48h }',
    '⏰ unanswered 48h, owner <name>',
    'WARM-PROSPECT NO-ASK (P3)',
    'default now+7d',
    'surfaces as a pipeline-nudge draft task'
  ]);
});

// New P4 invariant. NOTE the 17:40 ET correction (commit 3f25280): an empty S&W inbox
// is a NORMAL state, not an outage — the guard is a cheap liveness check plus a
// sent-items canary, never an empty-equals-dead alarm. v1's "S/W Superhuman connector
// unavailable every 15 minutes" example text is intentionally gone.
test('empty mailboxes get a liveness check and sent-items canary, not an outage alarm', () => {
  assertAll(prompt, [
    'a genuinely empty mailbox is a normal state, not an error',
    'confirm the connector is alive with one cheap read',
    'Alive + empty = clean run for that mailbox; cursor advances normally',
    'SENT-ITEMS CANARY',
    'a connector that cannot read its own recent sends is broken even when its calls return cleanly',
    'APPLY P4: zero results from any mailbox triggers the empty-vs-dead verification',
    'its cursor does NOT advance'
  ]);
});

// v1: "blocks double emails before approval sends". New home: P6 + the STEP 2 gate,
// which now explicitly covers the internal autopilot and auto-logged paths too.
test('inbox sweep prompt blocks double emails before every send on every path', () => {
  assertAll(prompt, [
    "P6. NEVER DOUBLE-EMAIL. Brian's strictest rule.",
    'HARD NO-DOUBLE-EMAIL GATE (before EVERY send on EVERY path, including internal autopilot and auto-logged sends)',
    'every internetMessageIds[] value',
    'If Brian or Kerri already replied after the task/draft was created, fail closed',
    'SECOND SEND APPROVED BY BRIAN',
    'If duplicate status cannot be verified (Savant queue, mailbox, or state unreachable), send nothing.',
    'count it in `doubleEmailBlocks`'
  ]);
});

// v1: "cross-checks live task status before trusting the listing". The LIVE-STATUS
// CROSS-CHECK header is gone; the invariant lives in STEP 1's triage load and STEP 2's
// precedence rule (the 3.5-hour missed-approval incident is now cited inline).
test('inbox sweep cross-checks live task status before trusting the listing', () => {
  assertAll(prompt, [
    'node scripts/console-task-api.mjs list --resolved pending --per-page 100',
    'The Savant task row is the live source of truth.'
  ]);
});

test('console health attention only halts on structural queue failures', () => {
  assertAll(prompt, [
    'If health returns `status: attention`, inspect the failing checks before deciding.',
    'halt only when a structural/integrity check is failing',
    'If `pending_decisions` is the only failing check and the structural checks are clean, continue into STEP 2 and process those decisions',
    "Brian's approvals/skips/redos are waiting for agent acknowledgement, not that the board is structurally mismatched",
    'If the only attention check is `pending_decisions`, process STEP 2 instead of deadlocking the queue.'
  ]);
});

// v1: "keeps EOD approvals on existing email chains" + orphan handling. The rewrite
// collapsed v1's EOD title-rewrite micro-procedure (🌙 <jobId> renaming, EOD-H01 source
// tags, job.source checks) into two hard rules: orphan tasks fail closed, and
// EOD-sourced tasks are sendable only with a matching routed job (d052b09).
test('unmatched and EOD-sourced tasks fail closed instead of sending', () => {
  assertAll(prompt, [
    'ORPHAN FAIL-CLOSED',
    'never send, never blind-backfill',
    '⚠ ORPHAN — no jobs.json entry; needs interactive reconciliation',
    'EOD-sourced tasks (`🌙` titles / `EOD source tag:`) are sendable only when the EOD runner wrote the matching job with routing metadata',
    'Existing-chain routing is mandatory: reply on the stored thread',
    'if the stored route is missing or stale, send nothing and update the Savant task to `status=action_needed` with `⚠️ route needed` in the title/body'
  ]);
});

// v1: ACTION-line semantics; deletion-is-not-approval was a Brian-decided branch
// (2026-06-08 log) and survived as STEP 2 branch E + P5.
test('task decisions follow ACTION-line precedence and deletion is never approval', () => {
  assertAll(prompt, [
    'No exceptions, no inference of approval. Deletion of a task is closure, not approval.',
    'ACTION: send | skip | redo | discuss',
    'PRECEDENCE: an ACTION of skip or redo wins over a generic approval signal',
    'an approved task with ACTION: skip is a deliberate close, not a send approval',
    'Savant task missing/deleted while the job is still pending → closure, NOT approval',
    'skipReason "Savant task removed by Brian; deletion is not approval"'
  ]);
});

// v1: "requires context, enrichment, and full thread reads before drafting".
// "Do not draft from the latest email alone" became the threadState requirement plus
// the redo-not-send fallback when the chain cannot be loaded.
test('inbox sweep prompt requires lookup, enrichment, and full thread reads before drafting', () => {
  assertAll(prompt, [
    'CUSTOMER LOOKUP (mandatory before any jobId use)',
    'if a jobId exists anywhere for this company, REUSE it and never bump the counter',
    'a split jobId defeats the no-double-email gate',
    'ENRICHMENT (progressive, never bloat)',
    'none (known company',
    'light (default human inbound',
    'deep (sponsor or pricing/contract/finance/event signal',
    'FULL THREAD READ (mandatory whenever a draft will be written)',
    'Quoted tails inside the latest message do NOT count',
    'a drafted job with no threadState is a counted process miss',
    'the task ships as ACTION: redo with a ⚠ "drafted from latest message only" line, never as send'
  ]);
});

// v1: "keeps quiet runs cheap" via a TOKEN BUDGET CONTRACT with GPT-5.5 model pins and
// STAGE 1/2 names. Dropped by d052b09: Codex/GPT runners were retired 2026-06-08 and
// the rewrite folded cost control into STEP 1's two-stage load. The invariant —
// quiet runs stay cheap, material context loads only when needed — is preserved.
test('two-stage load keeps quiet runs cheap and material context lazy', () => {
  assertAll(prompt, [
    'STEP 1 — LOAD STATE (two-stage, cheap by default)',
    'TRIAGE LOAD (every run)',
    'pending jobs only from jobs.json (id/routing/task fields, not old sent jobs)',
    'MATERIAL LOAD (only when',
    'NOW.md and brain/log.md only on material runs',
    'Material drafting loads the full writing context',
    'Baseline triage context is never enough to draft.'
  ]);
});

// v1: "enforces answer-every-ask coverage on replies" — survived in DRAFTING #2 and
// the task-notes ask bullets.
test('inbox sweep enforces answer-every-ask coverage on replies', () => {
  assertAll(prompt, [
    'ANSWER EVERY ASK: enumerate every distinct ask, instruction, and sub-question',
    'still-live sensitivit',
    'Every item maps to a line in the draft or an explicit deferral',
    'silently dropping one is a coverage miss even if the latest message is fully answered',
    '• <ask> — <how the draft handles it>',
    '• <ask> — <answered, or deferred because ...>'
  ]);
});

// v1: "makes internal CC suggestions explicit and approval-gated". Explicit people-page
// paths (ari-lewis.md / benji-chia.md) became "the Ari/Benji people pages" in the
// rewrite; the safety property — never silently add a CC, verified addresses only,
// visible opt-out line — is unchanged.
test('inbox sweep prompt makes internal CC suggestions explicit and approval-gated', () => {
  assertAll(prompt, [
    'Internal CC suggestions: only role-matched (Ari finance, Benji HWFYI ops/events/content)',
    "only with a verified address from the person's page",
    'always via the visible `Internal CC:` line in the task notes, never silently added',
    'Internal CC: add <Name> <<email>> — <why>. Leave in to include, delete to drop.'
  ]);
});

// v1: "sends brief Sendblue alerts only for newly-created tasks". The Codex-era notes
// ("Codex-era note", "Under Claude Code, skip them", send-update.js prohibition) were
// removed by d052b09 along with the Codex runner itself (SESSION NOTES: "Retired:
// Codex runner"); the alert discipline survived in STEP 4 and STEP 8.
test('inbox sweep prompt sends brief text alerts only for tasks and real attention needs', () => {
  assertAll(prompt, [
    'node /Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs --message',
    'Slack → supporting error detail only, never the primary alert path.',
    'TEXT ALERT after each successful task creation (and only then)',
    'Max 5 per run',
    'Stamp taskAlertedAt on success',
    'no Slack fallback, no retry spam',
    'Never include email bodies, S/W internals, or pricing in a text.',
    'Quiet run (no new artifacts, no decisions, no alert-worthy issue): no texts, no Slack, no email, no task',
    'Texts exist for new tasks and genuine attention needs only.'
  ]);

  // Codex closing directives were retired 2026-06-09; the prompt must not reintroduce them.
  assert.doesNotMatch(prompt, /ending with exactly two raw directive lines/i);
  assert.doesNotMatch(prompt, /::inbox-item|::archive/);

  assert.match(automationDoc, /brief Sendblue\/text heads-up/);
  assert.match(automationDoc, /send-text-alert\.mjs --message/);
  assert.match(automationDoc, /separate from iMessage Handoff/);
  assert.match(
    automationDoc,
    /if there is no task, decision, blocker, error, or other Brian action, it sends no text/
  );
  assert.match(automationDoc, /Durable output policy/);
  assert.match(automationDoc, /Codex.*closing directives are no longer needed/);
});

// v1: "suppresses repeated identical error texts". The REPEATED FAILURE ALERT DEDUPE
// block became STEP 6 error bookkeeping + STEP 8 error rules, gated through the
// dedicated script (which has its own behavioral test file).
test('inbox sweep prompt suppresses repeated identical error texts', () => {
  assertAll(prompt, [
    'lastErrorAt, lastErrorReason, lastErrorAlertedAt',
    'stamp lastErrorAt + a short stable lastErrorReason via `scripts/inbox-sweep-error-dedupe.mjs`',
    'on recovery, clear the error fields so the next distinct outage can alert once',
    'one brief text per NEW failure',
    'Always gate through `scripts/inbox-sweep-error-dedupe.mjs` first',
    'stays silent in texts but keeps being recorded in state/grades',
    're-alerts when the reason changes materially',
    'Savant queue readability itself is at risk, which stays the highest-priority alert at most hourly',
    'errorAlertSuppressed'
  ]);

  assert.match(automationDoc, /Repeated identical connector errors are deduped/);
  assert.match(automationDoc, /first outage alert only/);
  assert.match(automationDoc, /silent fail-closed grading/);
});

// v1: "protects redo provenance and stale-task markers". "DRAFT SOURCE: Codex
// interactive redo" became "DRAFT SOURCE: inbox-sweep redo" (Codex retired). v1's
// 🆕-strip-on-send micro-rules were dropped by d052b09: approval tasks are now deleted
// on send/skip/close, so the marker's lifecycle ends with the task.
test('inbox sweep prompt protects redo provenance and new-reply markers', () => {
  assertAll(prompt, [
    'diff the task-body DRAFT block (between `>>>>>>>` and `<<<<<<<`) against job.originalDraft',
    'skip the lesson when notes carry a `DRAFT SOURCE:` provenance line from a Kerri redo',
    'rewrite the same Savant task body with `DRAFT SOURCE: inbox-sweep redo at <ET>`',
    'prefix the title 🆕 if not already. No duplicate task.'
  ]);
});

// v1: "updates cold outreach state after approved sends". Legacy single ❄️ COLD- task
// handling was dropped by d052b09 (only the ☀️ COLD BATCH path remains). "Do NOT
// change the cold cap counters" became "Cap counters were already incremented at
// draft time".
test('inbox sweep prompt updates cold outreach state after approved sends', () => {
  assertAll(prompt, [
    'COLD BATCH (title starts `☀️ COLD BATCH`)',
    'drafts live in cold-outreach-state.json#drafted',
    'move drafted→sent',
    'SKIP #n (drafted→skipped, lead back to new)',
    'A batch task removed while never approved = Brian declining the batch after replacement-check',
    'Cap counters were already incremented at draft time; never re-send an already-sent index.'
  ]);
});

test('inbox sweep performs CRM pipeline updates after revenue sends and replies', () => {
  assertAll(prompt, [
    'CRM PIPELINE AUTO-UPDATE (mandatory after every H-prefix send/reply/disposition)',
    'after any approved send, autonomous info@ send, buyer reply, booked meeting, proposal/package/pricing send, contract event, or explicit decline',
    'node scripts/console-pipeline-update.mjs --apply --job-id <JOBID> --signal "<signal>"',
    '`approved-send` for first real outreach/contact with no pricing',
    '`asked-for-info` when the buyer asks for audience, pricing, examples, details, or wants to learn more',
    '`proposal-sent` / `package-sent` / `pricing-sent` when our sent email includes a proposal, package menu, or pricing',
    '`wants-to-do-deal` when they say they want to move forward or do a deal',
    '`declined`, `moving-on`, `not-doing-deal`, or `organic-only` for lost evidence',
    'A sent proposal email is not complete until the CRM update has succeeded',
    'For every H-prefix sent job, immediately run the CRM PIPELINE AUTO-UPDATE rule below before marking the Savant task applied'
  ]);
});

test('EOD meetings review converts commercial meeting signals into Savant CRM stages', () => {
  assertAll(eodMeetingsPrompt, [
    'Buyer requests package/pricing/details, wants to learn more, receives proposal, accepts a next commercial step, or gives verbal renewal intent',
    'Buyer says they want to move forward or do a deal -> active sales conversation / `--signal wants-to-do-deal`',
    'Explicit no / paid path declined / organic-only path / moving on',
    'node scripts/console-pipeline-update.mjs --apply --job-id <JOBID> --signal "<signal>"',
    'Do not leave a source-backed active sales conversation out of the pipeline.'
  ]);
});

// New in the rewrite: cold-outreach suppression (opt-outs, bounces, replies) is a
// send-safety surface — DNC must be permanent and a decline must not equal a DNC.
test('cold outreach suppression records opt-outs permanently and converts warm replies', () => {
  assertAll(prompt, [
    'data/cold-do-not-contact.json',
    'Suppression is idempotent and permanent',
    '#replied with sentiment positive/neutral/negative',
    'a decline is not a DNC'
  ]);
});

// v1: "mandates trust instrumentation on jobs and run grades". The exact-8-value
// actionClass enum, sentDraft/decidedAt stamps, and the doubleEmailBlocks counter all
// survived; the prose around them changed.
test('inbox sweep prompt mandates trust instrumentation on jobs and run grades', () => {
  assert.match(
    prompt,
    /ACTION CLASSES \(exactly one per job\): internal-recipient-reply, scheduling-logistics-reply, warm-thread-holding-reply, sponsor-substantive-reply, pipeline-nudge, renewal-draft, cold-send, gmail-draft-only\./
  );
  assertAll(prompt, [
    '"actionClass": "<one of the 8 classes below>"',
    '"originalDraft": "...", "sentDraft": null, "decidedAt": null',
    'Update job (status sent, sentAt, sentDraft, decidedAt, approvalSource)',
    'job skipped, decidedAt stamped',
    'close the duplicate with decidedAt stamped'
  ]);
  // doubleEmailBlocks is counted at the gate and lands in the run scorecard.
  assert.match(prompt, /count it in `doubleEmailBlocks`/);
  assert.match(prompt, /doubleEmailBlocks, trackersOpened\/Escalated/);
});

// v1: "auto-logged path is fail-closed and scoped to internal-recipient-reply".
// The AUTO-LOGGED SEND PATH section moved: scoping/conditions now live in
// data/autonomy-policy.json (asserted directly below) and the prompt's AUTONOMY TIER
// paragraph. v1's "S-prefix NEVER auto-sends" was deliberately relaxed by Brian's
// 2026-06-10 amendments (autonomy-policy.json approvedBy): internal-only S-prefix
// replies may auto-send via Superhuman, with boundary scrubs and no HWFYI CC.
test('autonomy tiers are fail-closed and scoped to internal-recipient-reply', () => {
  assertAll(prompt, [
    'read data/autonomy-policy.json',
    'defaulting to an approval task',
    // Amended 2026-06-10 evening (Brian standing authorization, recorded in
    // autonomy-policy.json mailboxOverrides): auto-logged widened from
    // "internal-recipient-reply only" to also cover the info@ mailbox override.
    // The override's own safety floor (no autonomous pricing) is pinned with it.
    'auto-logged covers internal-recipient-reply (rung 3) plus the info@ mailbox override',
    'pricing/packages/terms NEVER go out autonomously',
    'any condition uncertainty falls back to ask',
    'The file is Brian-edited only; a sweep may demote a class to ask (on any double-email or Brian correction), never promote.',
    'Do not ask Brian to approve clerical pipeline movement.',
    'Never invent pricing, values, package commitments, or revenue claims from inbox context alone.'
  ]);

  // The policy file is the enforcement surface: only internal-recipient-reply may act
  // without per-thread approval; every other class requires Brian.
  assert.equal(autonomyPolicy.classes['internal-recipient-reply'].tier, 'auto-logged');
  for (const [name, cls] of Object.entries(autonomyPolicy.classes)) {
    if (name === 'internal-recipient-reply') continue;
    assert.ok(
      ['ask', 'ask-batch', 'brian-sends'].includes(cls.tier),
      `${name} must stay approval-gated, got tier "${cls.tier}"`
    );
  }
  assert.equal(autonomyPolicy.decision, 'brain/wiki/decisions/2026-06-09-autonomy-boundary.md');
  assert.ok(Array.isArray(autonomyPolicy.trustedInternal) && autonomyPolicy.trustedInternal.length > 0);
  for (const addr of ['brian@kerrihq.com', 'ari@kerrihq.com', 'benji@hardwarefyi.com', 'zach@standardandworks.com']) {
    assert.ok(autonomyPolicy.trustedInternal.includes(addr), `trustedInternal missing ${addr}`);
  }
  const neverAuto = autonomyPolicy.neverAuto.join(' ');
  for (const gated of ['CRM', 'pricing', 'legal', 'finance', 'permission', 'S/W boundary']) {
    assert.ok(neverAuto.includes(gated), `neverAuto missing "${gated}"`);
  }
  assert.match(neverAuto, /source-backed pipeline stage bookkeeping is act-and-report/);
  assert.match(autonomyPolicy.graduation.promotion, /only Brian flips the tier/);
  assert.match(autonomyPolicy.graduation.demotion, /demotion is always allowed; promotion never is/);
  assert.match(
    autonomyPolicy.classes['internal-recipient-reply'].conditions.join(' '),
    /no-double-email gate runs exactly as for approved sends/
  );
});

// v1: "includes self-grading and KerriOS write-back". STEP 6 SELF-GRADE became
// STEP 7 with P7 honest-grading hard floors; the six dimensions survived with
// "Context" renamed to "disposition integrity".
test('inbox sweep prompt includes honest self-grading with hard floors', () => {
  assertAll(prompt, [
    'STEP 7 — SELF-GRADE (honest, P7)',
    'coverage (every mailbox checked or failed closed',
    'dedup/state',
    'disposition integrity',
    'any unverified "handled" claim scores this 0',
    'draft quality, approval safety, brain write-back',
    'Daily (first run after 20:30 ET)',
    'Weekly (Friday after 16:00 ET)',
    'Hard floors: an unapproved send, wrong identity, wrong thread, or S/W leak is an automatic 0 on approval safety plus an immediate text.',
    'A run that cannot read the Savant queue sends nothing and records fail_closed.',
    'A silent drop of a real email caps the run grade at 2.'
  ]);
});

// v1: "routes suggestions through relevance-gated approval tasks". The standalone
// google-tasks-improvement-suggestions.md doc and Codex/Claude-era runner vocabulary
// are gone (d052b09); the relevance gate, dedupe, and no-self-modification rule remain.
test('inbox sweep prompt routes suggestions through relevance-gated Savant tasks', () => {
  assertAll(prompt, [
    'max one new `💡 SUGGESTION:` task per run',
    'OBSERVED / BUILD RELEVANCE (relevant | already-solved | obsolete | needs-human-policy, checked against current canonical files) / PROPOSED / COST-RISK',
    'Scan for an existing open duplicate first.',
    'the sweep itself never self-modifies its prompt or policy tiers'
  ]);
});

// New in the rewrite: cursor writes are validated read-after-write (two prior
// incidents wrote `undefined` cursors via uninitialized shell vars).
test('state writes are validated and timestamps computed in-process', () => {
  assertAll(prompt, [
    'WRITE VALIDATION (mandatory, fail closed)',
    'Compute timestamps INSIDE the writing process, never via an interpolated shell variable',
    'A failed validation means the sweep is NOT successful'
  ]);
});

test('cold outreach prompt keeps first-touch emails short and partnership-focused', () => {
  assertAll(coldOutreachPrompt, [
    '4-5 short sentences after the greeting',
    "I'm Kerri, and I work on partnerships at Hardware FYI.",
    "We're a media company with a newsletter covering hardware manufacturing, read by over 19,000 hardware engineering leaders and decision makers.",
    '<Company> seems like a strong fit because <specific fit>.',
    "If this is interesting, I'd love to have a conversation about partnering together. Happy to answer any questions.",
    'omit by default on first cold outreach'
  ]);
  assert.doesNotMatch(coldOutreachPrompt, /3–5 sentences/);
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
