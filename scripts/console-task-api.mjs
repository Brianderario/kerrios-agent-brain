#!/usr/bin/env node
// Shared KMG Console task API helper. Scheduled agents use this instead of
// writing raw curl snippets or touching the retired Google Tasks approval rail.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const DEFAULT_BASE_URL = 'https://kerrihq-rails-xtua.onrender.com/api/v1';
export const DEFAULT_ENV_FILE = path.join(os.homedir(), '.kerri-chief', 'secrets', 'kerrihq.env');

export function parseEnvText(text) {
  const env = {};
  for (const rawLine of String(text || '').split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[match[1]] = value;
  }
  return env;
}

export function loadConsoleEnv(envFile = DEFAULT_ENV_FILE) {
  try {
    return parseEnvText(fs.readFileSync(envFile, 'utf8'));
  } catch {
    return {};
  }
}

export function resolveConfig({ env = process.env, envFile = DEFAULT_ENV_FILE } = {}) {
  const fileEnv = loadConsoleEnv(envFile);
  const token = env.KERRIHQ_SYNC_TOKEN || fileEnv.KERRIHQ_SYNC_TOKEN;
  const baseUrl = env.KERRIHQ_API_BASE || fileEnv.KERRIHQ_API_BASE || DEFAULT_BASE_URL;
  if (!token) {
    throw new Error(`Missing KERRIHQ_SYNC_TOKEN. Expected it in environment or ${envFile}`);
  }
  return { token, baseUrl: baseUrl.replace(/\/+$/, '') };
}

export function buildUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(endpoint.replace(/^\//, ''), `${baseUrl.replace(/\/+$/, '')}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === false || value === '') continue;
    url.searchParams.set(key, value === true ? 'true' : String(value));
  }
  return url;
}

export async function consoleRequest({
  endpoint,
  method = 'GET',
  params = {},
  body,
  config = resolveConfig(),
  fetchImpl = globalThis.fetch
}) {
  if (typeof fetchImpl !== 'function') throw new Error('No fetch implementation available');
  const response = await fetchImpl(buildUrl(config.baseUrl, endpoint, params), {
    method,
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/json',
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const text = await response.text();
  const json = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const message = json?.message || json?.error || text || `${method} ${endpoint} failed`;
    throw new Error(`Console API ${response.status}: ${message}`);
  }
  return json;
}

export function taskCreatePayload(args) {
  const task = {
    title: required(args.title, '--title'),
    body: args.bodyFile ? fs.readFileSync(args.bodyFile, 'utf8') : required(args.body, '--body or --body-file'),
    status: args.status || 'needs_approval',
    job_ref: args.jobRef,
    external_ref: args.externalRef,
    due_on: args.dueOn
  };
  return compact({
    task: compact(task),
    agent_slug: args.agentSlug,
    property_slug: args.propertySlug
  });
}

export function taskUpdatePayload(args) {
  const payload = {};
  for (const [argName, apiName] of [
    ['title', 'title'],
    ['body', 'body'],
    ['status', 'status'],
    ['jobRef', 'job_ref'],
    ['externalRef', 'external_ref'],
    ['dueOn', 'due_on'],
    ['resolution', 'resolution']
  ]) {
    if (args[argName] !== undefined) payload[apiName] = args[argName];
  }
  if (args.bodyFile) payload.body = fs.readFileSync(args.bodyFile, 'utf8');
  if (args.resolutionPayloadJson) payload.resolution_payload = JSON.parse(args.resolutionPayloadJson);
  if (args.resolutionPayloadFile) {
    payload.resolution_payload = JSON.parse(fs.readFileSync(args.resolutionPayloadFile, 'utf8'));
  }
  if (args.clearResolution) payload.resolution = null;
  if (args.clearResolutionPayload) payload.resolution_payload = {};
  return { task: payload };
}

export function taskEventPayload(args) {
  return {
    event: compact({
      event_type: required(args.eventType, '--event-type'),
      note: args.note,
      occurred_at: args.occurredAt,
      metadata: metadataPayload(args)
    })
  };
}

export async function markApplied({ id, note, config, fetchImpl, now = new Date() }) {
  const existing = await consoleRequest({ endpoint: `/tasks/${required(id, '--id')}`, config, fetchImpl });
  const currentPayload = existing.data?.resolution_payload || {};
  return consoleRequest({
    endpoint: `/tasks/${id}`,
    method: 'PATCH',
    body: {
      task: {
        resolution_payload: compact({
          ...currentPayload,
          applied_at: now.toISOString(),
          applied_note: note
        })
      }
    },
    config,
    fetchImpl
  });
}

export function parseArgs(argv) {
  const [command, ...rest] = argv;
  const args = { command };
  for (let i = 0; i < rest.length; i += 1) {
    const arg = rest[i];
    switch (arg) {
      case '--json':
        args.json = true;
        break;
      case '--open':
        args.open = true;
        break;
      case '--id':
        args.id = rest[++i];
        break;
      case '--title':
        args.title = rest[++i];
        break;
      case '--body':
        args.body = rest[++i];
        break;
      case '--body-file':
        args.bodyFile = rest[++i];
        break;
      case '--status':
        args.status = rest[++i];
        break;
      case '--job-ref':
        args.jobRef = rest[++i];
        break;
      case '--external-ref':
        args.externalRef = rest[++i];
        break;
      case '--source':
        args.source = rest[++i];
        break;
      case '--resolved':
        args.resolved = rest[++i];
        break;
      case '--resolution':
        args.resolution = rest[++i];
        break;
      case '--resolution-payload-json':
        args.resolutionPayloadJson = rest[++i];
        break;
      case '--resolution-payload-file':
        args.resolutionPayloadFile = rest[++i];
        break;
      case '--clear-resolution':
        args.clearResolution = true;
        break;
      case '--clear-resolution-payload':
        args.clearResolutionPayload = true;
        break;
      case '--due-on':
        args.dueOn = rest[++i];
        break;
      case '--agent-slug':
        args.agentSlug = rest[++i];
        break;
      case '--property-slug':
        args.propertySlug = rest[++i];
        break;
      case '--note':
        args.note = rest[++i];
        break;
      case '--event-type':
        args.eventType = rest[++i];
        break;
      case '--metadata-json':
        args.metadataJson = rest[++i];
        break;
      case '--metadata-file':
        args.metadataFile = rest[++i];
        break;
      case '--occurred-at':
        args.occurredAt = rest[++i];
        break;
      case '--per-page':
        args.perPage = rest[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!command) throw new Error('Missing command: health | list | show | create | update | mark-applied | event');
  return args;
}

export async function run(argv = process.argv.slice(2), io = { stdout: process.stdout, stderr: process.stderr }) {
  const args = parseArgs(argv);
  const config = resolveConfig();
  let result;
  switch (args.command) {
    case 'health':
      result = await consoleRequest({ endpoint: '/task_queue_health', config });
      break;
    case 'list':
      result = await consoleRequest({
        endpoint: '/tasks',
        params: compact({
          open: args.open,
          status: args.status,
          job_ref: args.jobRef,
          external_ref: args.externalRef,
          source: args.source,
          resolved: args.resolved,
          resolution: args.resolution,
          per_page: args.perPage
        }),
        config
      });
      break;
    case 'show':
      result = await consoleRequest({ endpoint: `/tasks/${required(args.id, '--id')}`, config });
      break;
    case 'create':
      result = await consoleRequest({ endpoint: '/tasks', method: 'POST', body: taskCreatePayload(args), config });
      break;
    case 'update':
      result = await consoleRequest({
        endpoint: `/tasks/${required(args.id, '--id')}`,
        method: 'PATCH',
        body: taskUpdatePayload(args),
        config
      });
      break;
    case 'mark-applied':
      result = await markApplied({ id: args.id, note: args.note, config });
      break;
    case 'event':
      result = await consoleRequest({
        endpoint: `/tasks/${required(args.id, '--id')}/events`,
        method: 'POST',
        body: taskEventPayload(args),
        config
      });
      break;
    default:
      throw new Error(`Unknown command: ${args.command}`);
  }
  io.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

function required(value, label) {
  if (value === undefined || value === null || value === '') throw new Error(`Missing ${label}`);
  return value;
}

function compact(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function metadataPayload(args) {
  if (args.metadataJson) return JSON.parse(args.metadataJson);
  if (args.metadataFile) return JSON.parse(fs.readFileSync(args.metadataFile, 'utf8'));
  return undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
