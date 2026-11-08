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
    assigneeEmail: 'benji@hardwarefyi.com',
    propertySlug: 'hardware-fyi',
    agentSlug: 'kerri-task'
  });

  assert.deepEqual(create, {
    task: {
      title: 'H0100 — Acme — Follow up',
      body: 'ACTION: send',
      status: 'needs_approval',
      assignee_email: 'benji@hardwarefyi.com',
      job_ref: 'H0100',
      external_ref: 'kerrios:H0100:abc'
    },
    agent_slug: 'kerri-task',
    property_slug: 'hardware-fyi'
  });

  assert.equal(parseArgs(['create', '--assignee-email', 'ari@kerrihq.com']).assigneeEmail, 'ari@kerrihq.com');

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

test('completion-first inbox guard rejects an Andrew-style vague decision handoff', () => {
  assert.throws(
    () => taskCreatePayload({
      title: 'Andrew Wilkinson replied: decide what business context to share',
      body: 'ACTION: request-info\nNo reply is drafted. Ping Codex when ready.',
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep',
      externalRef: 'kerrios:H0571:andrew'
    }),
    /require --completion-evidence-file or --completion-evidence-json/
  );
});

test('completion-first inbox guard accepts a routed structured reply with auditable evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-first-reply-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'andrew@example.com',
    cc: [],
    bcc: [],
    subject: 'Re: Context',
    body: 'Here is the context I recommend sharing.',
    overview: 'Completed: checked the thread and CRM.\nRecommendation: send the concise context reply.'
  }));

  const payload = taskCreatePayload({
    title: 'Reply to Andrew with concise business context',
    emailDraftFile: draftFile,
    status: 'needs_approval',
    agentSlug: 'kerri-inbox-sweep',
    externalRef: 'kerrios:H0571:andrew',
    replyToMessageId: 'message-andrew',
    replyToMailbox: 'brian@hardwarefyi.com',
    replyToConversationId: 'conversation-andrew',
    completionEvidenceJson: JSON.stringify({
      completed_internal_actions: ['Read the full thread', 'Checked CRM context'],
      remaining_human_actions: ['Approve the external send'],
      options_considered: ['Share concise business context', 'Share detailed portfolio context'],
      recommendation: 'Share concise business context',
      sources_checked: ['Mailbox thread conversation-andrew', 'Savant CRM H0571']
    })
  });

  assert.equal(payload.task.body, undefined);
  assert.equal(payload.task.source_details.email_draft.subject, 'Re: Context');
  assert.equal(payload.task.source_details.completion_first.remaining_human_actions.length, 1);
});

test('completion-first inbox guard rejects a vendor fact request without source reconciliation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-first-vendor-gap-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'Please send the revised venue agreement and confirm current pricing.',
    overview: 'Completed: checked the venue thread.\nRecommendation: request the final agreement.'
  }));

  assert.throws(
    () => taskCreatePayload({
      title: 'Request final venue agreement',
      emailDraftFile: draftFile,
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep',
      replyToMessageId: 'message-venue',
      replyToMailbox: 'brian@hardwarefyi.com',
      replyToConversationId: 'conversation-venue',
      completionEvidenceJson: JSON.stringify({
        completed_internal_actions: ['Read the venue thread'],
        remaining_human_actions: ['Approve the external send'],
        options_considered: ['Request the agreement', 'Book without it'],
        recommendation: 'Request the agreement',
        sources_checked: ['Venue thread']
      })
    }),
    /require completion evidence fact_reconciliation/
  );
});

test('completion-first inbox guard accepts a reconciled vendor fact request', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-first-vendor-proof-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'We have the current catering proposal. Please send the venue agreement and confirm cancellation terms.',
    overview: 'Completed: checked both vendor threads and the proposal.\nRecommendation: request only the contract gap.'
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
      completed_internal_actions: ['Read both vendor threads', 'Inspected the current proposal'],
      remaining_human_actions: ['Approve the external send'],
      options_considered: ['Request only the contract gap', 'Repeat the full scope request'],
      recommendation: 'Request only the contract gap',
      sources_checked: ['Venue thread', 'Catering thread and proposal'],
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

test('completion-first inbox guard rejects a fact listed as both known and unresolved', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-first-vendor-duplicate-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'venue@example.com',
    subject: 'Re: Venue scope',
    body: 'Please send the current proposal and confirm the guest count.',
    overview: 'Completed: checked the proposal.\nRecommendation: request confirmation.'
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
        completed_internal_actions: ['Read the proposal'],
        remaining_human_actions: ['Approve the external send'],
        options_considered: ['Ask again', 'Use the proposal'],
        recommendation: 'Ask again',
        sources_checked: ['Proposal'],
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

test('completion-first inbox guard accepts an exact Brian-only request-info packet', () => {
  const body = [
    'ACTION: request-info',
    'Completed: Read the thread, checked CRM, and prepared the supported context.',
    'Options: Share the supported context now, or add the private operating fact.',
    'Recommendation: Add the private operating fact, then use the prepared reply.',
    'Blocked on: The private operating fact only Brian knows.',
    'On approval: Insert the fact and stage the exact routed reply.'
  ].join('\n');

  const payload = taskCreatePayload({
    title: 'Provide the one private fact needed for Andrew reply',
    body,
    status: 'needs_approval',
    agentSlug: 'kerri-inbox-sweep',
    externalRef: 'kerrios:H0571:andrew-info',
    completionEvidenceJson: JSON.stringify({
      completed_internal_actions: ['Read the full thread', 'Prepared supported context'],
      remaining_human_actions: ['Provide the private operating fact'],
      options_considered: ['Send supported context only', 'Add the private operating fact'],
      recommendation: 'Add the private operating fact',
      sources_checked: ['Mailbox thread conversation-andrew', 'Savant CRM H0571']
    })
  });

  assert.equal(payload.task.body, body);
  assert.equal(payload.task.source_details.completion_first.recommendation, 'Add the private operating fact');
});

test('completion-first inbox guard rejects more than one remaining human action', () => {
  assert.throws(
    () => taskCreatePayload({
      title: 'Choose several things',
      body: 'ACTION: request-info\nCompleted: Research done.\nOptions: A or B.\nRecommendation: A.\nBlocked on: Choice.\nOn approval: Execute A.',
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep',
      completionEvidenceJson: JSON.stringify({
        completed_internal_actions: ['Research done'],
        remaining_human_actions: ['Choose A or B', 'Write the reply'],
        options_considered: ['A', 'B'],
        recommendation: 'A',
        sources_checked: ['Live source']
      })
    }),
    /exactly one action/
  );
});

test('completion-first inbox guard also blocks vague updates to existing approval cards', () => {
  assert.throws(
    () => taskUpdatePayload({
      title: 'Andrew Wilkinson replied: decide what business context to share',
      body: 'No reply is drafted. Brian should reply.',
      status: 'needs_approval',
      agentSlug: 'kerri-inbox-sweep'
    }),
    /require --completion-evidence-file or --completion-evidence-json/
  );
});

test('completion-first inbox updates preserve a structured draft, route, and evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'completion-first-update-'));
  const draftFile = path.join(dir, 'draft.json');
  fs.writeFileSync(draftFile, JSON.stringify({
    to: 'sponsor@example.com',
    subject: 'Re: Placement timing',
    body: 'I recommend moving the content while preserving the booked placement.',
    overview: 'Completed: checked live inventory and CRM.\nRecommendation: preserve booked inventory.'
  }));

  const payload = taskUpdatePayload({
    emailDraftFile: draftFile,
    status: 'needs_approval',
    agentSlug: 'kerri-inbox-sweep',
    replyToMessageId: 'message-sponsor',
    replyToMailbox: 'brian@hardwarefyi.com',
    replyToConversationId: 'conversation-sponsor',
    completionEvidenceJson: JSON.stringify({
      completed_internal_actions: ['Checked live inventory', 'Updated CRM facts'],
      remaining_human_actions: ['Approve the external send'],
      options_considered: ['Move content only', 'Move booked placement'],
      recommendation: 'Move content only',
      sources_checked: ['Live inventory', 'Savant CRM']
    })
  });

  assert.equal(payload.task.source_details.email_draft.subject, 'Re: Placement timing');
  assert.equal(payload.task.source_details.reply_to_message_id, 'message-sponsor');
  assert.equal(payload.task.source_details.completion_first.recommendation, 'Move content only');
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
