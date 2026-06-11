import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

// Guards the tracked autonomy policy against drift from the decision Brian approved on
// 2026-06-09 (brain/wiki/decisions/2026-06-09-autonomy-boundary.md). If any of these
// fail, either the decision changed (update the test alongside the decision page) or
// someone widened send authority without Brian — which is exactly what must not happen.

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const POLICY_PATH = path.join(TEST_DIR, '..', 'data', 'autonomy-policy.json');

// The Wave 0 actionClass enum, verbatim from agent-prompts/kerri-inbox-sweep/SKILL.md.
const ACTION_CLASSES = [
  'internal-recipient-reply',
  'scheduling-logistics-reply',
  'warm-thread-holding-reply',
  'sponsor-substantive-reply',
  'pipeline-nudge',
  'renewal-draft',
  'cold-send',
  'gmail-draft-only'
];

const policy = JSON.parse(fs.readFileSync(POLICY_PATH, 'utf8'));

test('policy parses and carries the decision pointer', () => {
  // Version 2 = the 2026-06-10 act-authority amendment (Brian, interactive — PR #18):
  // it added the `actions` block for NON-SEND app/service actions and its own decision
  // page. The email send tiers/classes were not changed by the bump, which the tier
  // tests below keep pinning independently.
  assert.equal(policy.version, 2);
  assert.equal(policy.decision, 'brain/wiki/decisions/2026-06-09-autonomy-boundary.md');
  assert.equal(policy.decisionActions, 'brain/wiki/decisions/2026-06-10-app-action-autonomy.md');
  assert.ok(policy.actions && policy.actions.tiers, 'version 2 is defined by the actions block; missing it means the file drifted');
});

test('classes cover exactly the 8-value actionClass enum', () => {
  assert.deepEqual(Object.keys(policy.classes).sort(), [...ACTION_CLASSES].sort());
});

test('every class tier is a defined tier', () => {
  const tierNames = Object.keys(policy.tiers);
  for (const [name, entry] of Object.entries(policy.classes)) {
    assert.ok(tierNames.includes(entry.tier), `${name} has unknown tier ${entry.tier}`);
  }
});

test('only internal-recipient-reply is auto-logged; everything else stays gated', () => {
  for (const [name, entry] of Object.entries(policy.classes)) {
    if (name === 'internal-recipient-reply') {
      assert.equal(entry.tier, 'auto-logged');
    } else {
      assert.notEqual(entry.tier, 'auto-logged', `${name} must not be auto-logged without Brian`);
      assert.notEqual(entry.tier, 'auto', `${name} must not be full-auto`);
    }
  }
});

test('internal-recipient-reply carries the six fail-closed conditions', () => {
  const conditions = policy.classes['internal-recipient-reply'].conditions;
  assert.equal(conditions.length, 6);
  const all = conditions.join(' ');
  assert.match(all, /trustedInternal/);
  assert.match(all, /One non-matching address means this is not an internal reply: use the external flow/);
  assert.match(all, /kerri@hardwarefyi\.com/);
  // Amended 2026-06-10 (Brian, recorded in policy.approvedBy): internal-only S-prefix
  // replies may auto-send via Superhuman — the old blanket "S-prefix never auto-sends"
  // was replaced by boundary protections inside the condition itself.
  assert.match(all, /internal-only S-prefix thread \(no HWFYI auto-CC, boundary scrubs apply\)/);
  assert.match(all, /no-double-email gate runs exactly as for approved sends/);
  // Amended 2026-06-10 PM (Brian): gated topics gate ENACTMENT, not conversation —
  // the reply must not enact a gated decision, but discussing it and routing the
  // decision to Brian is required, never grounds to hold the reply.
  assert.match(all, /does not ENACT a gated decision/);
  assert.match(all, /mutating CRM/);
  assert.match(all, /NOT grounds to hold the reply/);
  // Policy file unreadable → the hard rules still bind.
  assert.match(all, /identity, boundary, and no-double-email rules remain mandatory/);
});

test('graduation bar matches the decision: 20 approvals, 10% edits, zero double-emails', () => {
  assert.equal(policy.graduation.minApprovals, 20);
  assert.equal(policy.graduation.maxEditRate, 0.1);
  assert.equal(policy.graduation.maxDoubleEmailIncidents, 0);
});

test('ramp eligibility matches the proposal table', () => {
  const eligible = Object.entries(policy.classes)
    .filter(([, entry]) => entry.rampEligible === true)
    .map(([name]) => name)
    .sort();
  assert.deepEqual(eligible, ['pipeline-nudge', 'scheduling-logistics-reply', 'warm-thread-holding-reply']);
});

test('trustedInternal is the 8-address team list, KMG + S/W domains only', () => {
  const list = policy.trustedInternal;
  assert.equal(list.length, 8);
  assert.ok(list.includes('brian@kerrihq.com'));
  assert.ok(list.includes('kerri@hardwarefyi.com'));
  for (const addr of list) {
    assert.match(
      addr,
      /@(kerrihq\.com|hardwarefyi\.com|standardandworks\.com|carryhq\.com)$/,
      `${addr} is not a known internal domain`
    );
  }
});

test('auto-logged notifications are brief + auto-CC, never text', () => {
  assert.deepEqual(policy.notifications.autoLogged, [
    'morning-brief-auto-logged-section',
    'auto-cc-on-send'
  ]);
  assert.match(policy.notifications.neverText, /never use the Sendblue\/text path/);
});

test('neverAuto preserves every permanent hard gate', () => {
  const all = policy.neverAuto.join(' ');
  for (const gate of ['CRM', 'pricing', 'legal', 'finance', 'identity', 'S/W boundary']) {
    assert.ok(all.includes(gate), `neverAuto missing ${gate}`);
  }
});
