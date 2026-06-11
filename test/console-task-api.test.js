import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  buildUrl,
  consoleRequest,
  markApplied,
  parseEnvText,
  resolveConfig,
  taskCreatePayload,
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
