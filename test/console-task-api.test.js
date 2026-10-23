import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildUrl,
  consoleRequest,
  markApplied,
  parseArgs,
  parseEnvText,
  resolveConfig,
  taskCreatePayload,
  taskEventPayload,
  taskUpdatePayload
} from '../scripts/console-task-api.mjs';

test('env parser handles comments, quotes, and unquoted values', () => {
  const parsed = parseEnvText(`
    # comment
    KERRIHQ_SYNC_TOKEN="krri_test"
    KERRIHQ_API_BASE=https://example.test/api/v1
  `);

  assert.equal(parsed.KERRIHQ_SYNC_TOKEN, 'krri_test');
  assert.equal(parsed.KERRIHQ_API_BASE, 'https://example.test/api/v1');
});

test('config prefers process env and falls back to env file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'console-task-env-'));
  const envFile = path.join(dir, 'kerrihq.env');
  fs.writeFileSync(envFile, 'KERRIHQ_SYNC_TOKEN=file-token\nKERRIHQ_API_BASE=https://file.test/api/v1\n');

  assert.deepEqual(resolveConfig({ env: {}, envFile }), {
    token: 'file-token',
    baseUrl: 'https://file.test/api/v1'
  });
  assert.deepEqual(resolveConfig({ env: { KERRIHQ_SYNC_TOKEN: 'env-token' }, envFile }), {
    token: 'env-token',
    baseUrl: 'https://file.test/api/v1'
  });
});

test('buildUrl omits empty params and encodes active filters', () => {
  const url = buildUrl('https://example.test/api/v1/', '/tasks', {
    open: true,
    job_ref: 'H0100',
    external_ref: '',
    source: 'rails'
  });

  assert.equal(url.toString(), 'https://example.test/api/v1/tasks?open=true&job_ref=H0100&source=rails');
});

test('consoleRequest sends bearer auth and JSON body', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url: url.toString(), init });
    return {
      ok: true,
      status: 200,
      text: async () => '{"data":{"id":"task-1"}}'
    };
  };

  const result = await consoleRequest({
    endpoint: '/tasks',
    method: 'POST',
    body: { task: { title: 'Hello' } },
    config: { baseUrl: 'https://example.test/api/v1', token: 'secret' },
    fetchImpl
  });

  assert.equal(result.data.id, 'task-1');
  assert.equal(calls[0].url, 'https://example.test/api/v1/tasks');
  assert.equal(calls[0].init.headers.Authorization, 'Bearer secret');
  assert.equal(calls[0].init.body, '{"task":{"title":"Hello"}}');
});

test('task payload helpers map agent fields to Rails API fields', () => {
  const create = taskCreatePayload({
    title: 'H0100 — Acme — Follow up',
    body: 'ACTION: send',
    jobRef: 'H0100',
    externalRef: 'kerrios:H0100:abc',
    propertySlug: 'hardware-fyi',
    agentSlug: 'kerri-inbox-sweep'
  });

  assert.deepEqual(create, {
    task: {
      title: 'H0100 — Acme — Follow up',
      body: 'ACTION: send',
      status: 'needs_approval',
      job_ref: 'H0100',
      external_ref: 'kerrios:H0100:abc'
    },
    agent_slug: 'kerri-inbox-sweep',
    property_slug: 'hardware-fyi'
  });

  const update = taskUpdatePayload({
    status: 'done',
    resolution: 'approved',
    resolutionPayloadJson: '{"edited_body":"Approved body"}'
  });
  assert.deepEqual(update, {
    task: {
      status: 'done',
      resolution: 'approved',
      resolution_payload: { edited_body: 'Approved body' }
    }
  });

  const clear = taskUpdatePayload({
    status: 'needs_approval',
    clearResolution: true,
    clearResolutionPayload: true
  });
  assert.deepEqual(clear, {
    task: {
      status: 'needs_approval',
      resolution: null,
      resolution_payload: {}
    }
  });
});

test('reply task payloads preserve the exact mailbox thread route', () => {
  const create = taskCreatePayload({
    title: 'H0570 - Manny\'s - Venue estimate',
    body: 'ACTION: send-reply\nSubject: Re: SF Tech Week venue estimate',
    replyToMessageId: 'message-1',
    replyToMailbox: 'Brian@HardwareFYI.com',
    replyToConversationId: 'conversation-1'
  });

  assert.deepEqual(create.task.source_details, {
    reply_to_message_id: 'message-1',
    mailbox: 'brian@hardwarefyi.com',
    email_conversation_id: 'conversation-1'
  });
});

test('reply task payloads fail closed when the original message route is absent', () => {
  assert.throws(
    () => taskCreatePayload({
      title: 'Reply to venue',
      body: 'ACTION: send-reply\nSubject: Re: Venue'
    }),
    /--reply-to-message-id for a reply task/
  );
});

test('a reply subject inferred from the task title also requires routing', () => {
  assert.throws(
    () => taskCreatePayload({
      title: 'G0008 - Hotel - Re: Room block',
      body: 'ACTION: send\nTo: hotel@example.com\nThanks'
    }),
    /--reply-to-message-id for a reply task/
  );
});

test('reply route flags are parsed for the create command', () => {
  assert.deepEqual(parseArgs([
    'create',
    '--reply-to-message-id',
    'message-1',
    '--reply-to-mailbox',
    'Brian@HardwareFYI.com',
    '--reply-to-conversation-id',
    'conversation-1'
  ]), {
    command: 'create',
    replyToMessageId: 'message-1',
    replyToMailbox: 'Brian@HardwareFYI.com',
    replyToConversationId: 'conversation-1'
  });
});

test('inbox vendor fact requests require reconciled source evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-gap-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'Please send the revised venue agreement and confirm current pricing.'
  }));

  assert.throws(
    () => taskCreatePayload({
      title: 'Request final venue agreement',
      emailDraftFile: draftFile,
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep',
      replyToMessageId: 'message-venue',
      replyToMailbox: 'brian@hardwarefyi.com',
      replyToConversationId: 'conversation-venue'
    }),
    /require completion evidence fact_reconciliation/
  );
});

test('inbox vendor fact requests accept related threads and inspected attachments', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-proof-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'We have the current catering proposal. Please send the venue agreement and confirm cancellation terms.'
  }));

  const payload = taskCreatePayload({
    title: 'Request unresolved venue contract terms',
    emailDraftFile: draftFile,
    status: 'needs_approval',
    agentSlug: 'kerri-inbox-sweep',
    replyToMessageId: 'message-venue',
    replyToMailbox: 'brian@hardwarefyi.com',
    replyToConversationId: 'conversation-venue',
    completionEvidenceJson: JSON.stringify({
      fact_reconciliation: {
        known_facts: [{ fact: 'Catering proposal covers 125 guests.', source: 'June 30 proposal' }],
        unresolved_facts: [{ fact: 'Venue cancellation terms.', reason: 'No venue agreement is on file.' }],
        related_threads_checked: ['Venue thread', 'Catering thread'],
        attachments_checked: [{ name: 'proposal.pdf', source: 'Catering thread', result: '125 guests verified' }]
      }
    })
  });

  assert.equal(payload.task.source_details.completion_first.fact_reconciliation.known_facts.length, 1);
});

test('inbox vendor fact requests reject facts listed as both known and unresolved', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vendor-duplicate-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'Please send the current proposal and confirm the guest count.'
  }));

  assert.throws(
    () => taskCreatePayload({
      title: 'Confirm venue guest count',
      emailDraftFile: draftFile,
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep',
      replyToMessageId: 'message-venue',
      replyToMailbox: 'brian@hardwarefyi.com',
      replyToConversationId: 'conversation-venue',
      completionEvidenceJson: JSON.stringify({
        fact_reconciliation: {
          known_facts: [{ fact: 'The proposal covers 125 guests.', source: 'Proposal page one' }],
          unresolved_facts: [{ fact: 'The proposal covers 125 guests.', reason: 'Incorrectly treated as unresolved' }],
          related_threads_checked: ['Venue thread'],
          attachments_checked: [{ name: 'proposal.pdf', source: 'Venue thread', result: '125 guests verified' }]
        }
      })
    }),
    /cannot request a fact already listed as known/
  );
});

test('task event payload helper records proof events with metadata', () => {
  const payload = taskEventPayload({
    eventType: 'sent',
    note: 'Sent approved draft',
    metadataJson: '{"message_id":"abc123"}',
    occurredAt: '2026-06-11T12:00:00Z'
  });

  assert.deepEqual(payload, {
    event: {
      event_type: 'sent',
      note: 'Sent approved draft',
      occurred_at: '2026-06-11T12:00:00Z',
      metadata: { message_id: 'abc123' }
    }
  });

  assert.deepEqual(parseArgs([
    'event',
    '--id',
    'task-1',
    '--event-type',
    'sent',
    '--note',
    'Sent approved draft',
    '--metadata-json',
    '{"message_id":"abc123"}'
  ]), {
    command: 'event',
    id: 'task-1',
    eventType: 'sent',
    note: 'Sent approved draft',
    metadataJson: '{"message_id":"abc123"}'
  });
});

test('markApplied merges existing resolution payload instead of overwriting edits', async () => {
  const requests = [];
  const fetchImpl = async (url, init) => {
    requests.push({ url: url.toString(), init });
    if (init.method === 'GET') {
      return {
        ok: true,
        status: 200,
        text: async () => '{"data":{"id":"task-1","resolution_payload":{"edited_body":"Approved body"}}}'
      };
    }
    return { ok: true, status: 200, text: async () => '{"data":{"id":"task-1"}}' };
  };

  await markApplied({
    id: 'task-1',
    note: 'sent H0100',
    config: { baseUrl: 'https://example.test/api/v1', token: 'secret' },
    fetchImpl,
    now: new Date('2026-06-11T12:00:00Z')
  });

  assert.equal(requests.length, 2);
  assert.equal(requests[0].url, 'https://example.test/api/v1/tasks/task-1');
  assert.equal(requests[1].init.method, 'PATCH');
  assert.deepEqual(JSON.parse(requests[1].init.body), {
    task: {
      resolution_payload: {
        edited_body: 'Approved body',
        applied_at: '2026-06-11T12:00:00.000Z',
        applied_note: 'sent H0100'
      }
    }
  });
});
