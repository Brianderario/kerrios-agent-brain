import assert from 'node:assert/strict';
import test from 'node:test';

import { decideStaleness, DEMOTE_MAP, daysBetween } from '../scripts/pipeline-staleness.mjs';

const NOW = new Date('2026-06-14T12:00:00Z');
const daysAgo = (n) => new Date(NOW.getTime() - n * 86400000).toISOString();

test('daysBetween counts whole days, null on bad input', () => {
  assert.equal(daysBetween(daysAgo(30), NOW), 30);
  assert.equal(daysBetween('not-a-date', NOW), null);
});

test('fresh outbound (<30d) takes no action', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(10), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'none');
});

test('exactly 30d no reply demotes one phase', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(30), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'demote');
  assert.equal(d.toStage, 'qualified');
});

test('29d does not yet demote (boundary)', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(29), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'none');
});

test('60d no reply proposes close, never auto-closes', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(75), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'propose_close');
});

test('inbound last message never demotes — we owe the reply', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(90), last_msg_direction: 'inbound' }, { now: NOW });
  assert.equal(d.action, 'owe_reply');
});

test('stale lead has no lower stage -> flag, not demote', () => {
  const d = decideStaleness({ stage: 'lead', last_msg_at: daysAgo(40), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'flag_stale');
});

test('very stale lead (>=60d) still proposes close', () => {
  const d = decideStaleness({ stage: 'lead', last_msg_at: daysAgo(120), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'propose_close');
});

test('direction "none" (never two-way) is treated as waiting-on-them', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: daysAgo(45), last_msg_direction: 'none' }, { now: NOW });
  assert.equal(d.action, 'demote');
  assert.equal(d.toStage, 'qualified');
});

test('negotiation and contract_sent collapse back to proposal_sent', () => {
  assert.equal(DEMOTE_MAP.negotiation, 'proposal_sent');
  assert.equal(DEMOTE_MAP.contract_sent, 'proposal_sent');
  const d = decideStaleness({ stage: 'negotiation', last_msg_at: daysAgo(35), last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'demote');
  assert.equal(d.toStage, 'proposal_sent');
});

test('closed deals are never touched', () => {
  for (const stage of ['closed_won', 'closed_lost']) {
    const d = decideStaleness({ stage, last_msg_at: daysAgo(400), last_msg_direction: 'outbound' }, { now: NOW });
    assert.equal(d.action, 'none');
  }
});

test('missing timestamp on outbound -> no action, needs inbound check', () => {
  const d = decideStaleness({ stage: 'proposal_sent', last_msg_at: null, last_msg_direction: 'outbound' }, { now: NOW });
  assert.equal(d.action, 'none');
  assert.match(d.reason, /needs an inbound check/);
});

test('custom thresholds are honored', () => {
  const d = decideStaleness({ stage: 'qualified', last_msg_at: daysAgo(20), last_msg_direction: 'outbound' },
    { now: NOW, demoteDays: 14, closeDays: 45 });
  assert.equal(d.action, 'demote');
  assert.equal(d.toStage, 'lead');
});
