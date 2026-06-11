import assert from 'node:assert/strict';
import test from 'node:test';

import {
  appendEvidence,
  normalizeStage,
  parseArgs,
  transitionDecision,
  updatePipeline
} from '../scripts/console-pipeline-update.mjs';

test('normalizes Hardware FYI pipeline vocabulary to Console deal stages', () => {
  assert.equal(normalizeStage('Prospect'), 'lead');
  assert.equal(normalizeStage('Interest'), 'qualified');
  assert.equal(normalizeStage('proposal sent'), 'proposal_sent');
  assert.equal(normalizeStage('Contract Won'), 'closed_won');
  assert.equal(normalizeStage('declined'), 'closed_lost');
});

test('stage transition policy allows forward and terminal moves but refuses regressions', () => {
  assert.deepEqual(transitionDecision('lead', 'qualified'), {
    allowed: true,
    noop: false,
    reason: 'source-backed forward or terminal move'
  });
  assert.equal(transitionDecision('qualified', 'closed_lost').allowed, true);
  assert.equal(transitionDecision('proposal_sent', 'qualified').allowed, false);
  assert.match(transitionDecision('closed_won', 'closed_lost').reason, /terminal/);
  assert.equal(transitionDecision('proposal_sent', 'qualified', { force: true }).allowed, true);
});

test('appendEvidence is idempotent for the same evidence line', () => {
  const line = 'Pipeline update 2026-06-11T00:00:00.000Z: stage=qualified. Evidence: buyer asked for details';
  assert.equal(appendEvidence('', line), line);
  assert.equal(appendEvidence(line, line), line);
});

test('parseArgs requires evidence and a company lookup key', () => {
  assert.deepEqual(parseArgs([
    '--apply',
    '--job-id',
    'H0118',
    '--status',
    'Contract Lost',
    '--evidence',
    'Buyer declined paid path'
  ]), {
    apply: true,
    jobId: 'H0118',
    status: 'Contract Lost',
    evidence: 'Buyer declined paid path'
  });

  assert.throws(() => parseArgs(['--status', 'Interest', '--evidence', 'asked for pricing']), /Missing company lookup/);
  assert.throws(() => parseArgs(['--job-id', 'H0118', '--status', 'Interest']), /Missing --evidence/);
});

test('updatePipeline updates notes and stage for an existing company deal', async () => {
  const calls = [];
  const fetchImpl = fakeFetch(calls, {
    'GET /companies?job_id=H0118': {
      data: [{ id: 'company-1', name: 'Flux', job_id: 'H0118' }],
      meta: { has_more: false }
    },
    'GET /deals?page=1&per_page=100': {
      data: [{ id: 'deal-1', company_id: 'company-1', deal_type: 'sponsorship', stage: 'qualified', notes: 'Old note' }],
      meta: { has_more: false }
    },
    'PATCH /deals/deal-1': {
      data: { id: 'deal-1', company_id: 'company-1', deal_type: 'sponsorship', stage: 'qualified', notes: 'updated' }
    },
    'PATCH /deals/deal-1/update_stage': {
      data: { id: 'deal-1', company_id: 'company-1', deal_type: 'sponsorship', stage: 'closed_lost', notes: 'updated' }
    }
  });

  const result = await updatePipeline({
    apply: true,
    jobId: 'H0118',
    status: 'Contract Lost',
    source: 'H0118 Flux thread',
    evidence: 'Adrian declined the paid path on 2026-06-10.',
    now: new Date('2026-06-11T12:00:00Z')
  }, {
    config: { baseUrl: 'https://console.test/api/v1', token: 'secret' },
    fetchImpl
  });

  assert.equal(result.applied, true);
  assert.equal(result.deal.previous_stage, 'qualified');
  assert.equal(result.deal.stage, 'closed_lost');
  assert.deepEqual(result.operations.map((op) => op.type), ['update_notes', 'update_stage']);
  assert.equal(calls.at(-1).path, '/deals/deal-1/update_stage');
});

test('updatePipeline creates a source-backed deal when none exists', async () => {
  const calls = [];
  const fetchImpl = fakeFetch(calls, {
    'GET /companies?job_id=H0119': {
      data: [{ id: 'company-2', name: 'C-Infinity', job_id: 'H0119' }],
      meta: { has_more: false }
    },
    'GET /deals?page=1&per_page=100': {
      data: [],
      meta: { has_more: false }
    },
    'POST /deals': {
      data: {
        id: 'deal-2',
        company_id: 'company-2',
        deal_type: 'sponsorship',
        stage: 'lead',
        notes: 'Pipeline update 2026-06-11T12:00:00.000Z: stage=qualified. Evidence: Melissa booked a sponsor call and requested the media kit.'
      }
    },
    'PATCH /deals/deal-2/update_stage': {
      data: { id: 'deal-2', company_id: 'company-2', deal_type: 'sponsorship', stage: 'qualified', notes: 'updated' }
    }
  });

  const result = await updatePipeline({
    apply: true,
    jobId: 'H0119',
    status: 'Interest',
    evidence: 'Melissa booked a sponsor call and requested the media kit.',
    now: new Date('2026-06-11T12:00:00Z')
  }, {
    config: { baseUrl: 'https://console.test/api/v1', token: 'secret' },
    fetchImpl
  });

  assert.equal(result.deal.previous_stage, 'lead');
  assert.equal(result.deal.stage, 'qualified');
  assert.deepEqual(result.operations.map((op) => op.type), ['create_deal', 'update_stage']);
  assert.equal(calls.find((call) => call.method === 'POST').path, '/deals');
});

function fakeFetch(calls, responses) {
  return async (url, init = {}) => {
    const parsed = new URL(url);
    const method = init.method || 'GET';
    const query = parsed.search ? `?${parsed.searchParams.toString()}` : '';
    const key = `${method} ${parsed.pathname.replace('/api/v1', '')}${query}`;
    calls.push({
      method,
      path: parsed.pathname.replace('/api/v1', ''),
      query: parsed.searchParams.toString(),
      body: init.body ? JSON.parse(init.body) : undefined
    });
    if (!responses[key]) {
      return { ok: false, status: 404, text: async () => JSON.stringify({ error: `No fake for ${key}` }) };
    }
    return { ok: true, status: 200, text: async () => JSON.stringify(responses[key]) };
  };
}
