#!/usr/bin/env node
// Shared KMG Console task API helper. Scheduled agents use this instead of
// writing raw curl snippets or touching the retired Google Tasks approval rail.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

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
    due_on: args.dueOn,
    on_complete: onCompletePayload(args)
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
  const onComplete = onCompletePayload(args);
  if (onComplete !== undefined) payload.on_complete = onComplete;
  if (args.clearOnComplete) payload.on_complete = {};
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

// ---- close-job: atomic interactive/approved send close-out ----------------
// One command does the FULL lockstep — close the Console send card, close the
// paired recap card, log the sent receipt, AND flip the data/jobs.json job —
// card-first with a verify before the jobs.json write. This exists because on
// 2026-06-17 an interactive send flipped jobs.json to sent but left the cards
// in needs_approval (re-approvable / re-sendable for ~12h). Card-first ordering
// means a partial failure leaves the card CLOSED (not re-approvable), never a
// jobs.json-only state that the sweep would re-send.

const CLOSED_JOB_STATUSES = new Set(['done', 'sent', 'skipped', 'cancelled']);

export function resolveJobsFile(jobsFile) {
  if (jobsFile) return jobsFile;
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.join(here, '..', 'data', 'jobs.json');
}

export function loadJobs(jobsFile) {
  const data = JSON.parse(fs.readFileSync(jobsFile, 'utf8'));
  if (!Array.isArray(data)) throw new Error(`Expected ${jobsFile} to be a JSON array of jobs`);
  return data;
}

// Pick the jobs.json job to close. By --card: exact consoleTaskId match. By
// --job: the single OPEN job with that jobId (duplicates exist — old skipped +
// active). All-closed is treated as idempotent (re-runs are safe); ambiguous
// open duplicates require --card to disambiguate rather than guessing.
export function selectCloseTarget(jobs, { job, card }) {
  if (card) {
    const index = jobs.findIndex((j) => j && j.consoleTaskId === card);
    return { index, job: index >= 0 ? jobs[index] : null, cardId: card };
  }
  if (!job) throw new Error('close-job needs --job <jobId> or --card <consoleTaskId>');
  const matches = jobs.map((j, i) => ({ j, i })).filter(({ j }) => j && j.jobId === job);
  if (matches.length === 0) throw new Error(`No data/jobs.json job found with jobId ${job}`);
  const open = matches.filter(({ j }) => !CLOSED_JOB_STATUSES.has(String(j.status)));
  if (open.length === 1) return { index: open[0].i, job: open[0].j, cardId: open[0].j.consoleTaskId };
  if (open.length === 0) {
    const withCard = matches.filter(({ j }) => j.consoleTaskId);
    const pool = withCard.length ? withCard : matches;
    const pick = pool[pool.length - 1];
    return { index: pick.i, job: pick.j, cardId: pick.j.consoleTaskId, alreadyClosed: true };
  }
  throw new Error(
    `${open.length} open jobs.json jobs share jobId ${job}; pass --card <consoleTaskId> to pick one`
  );
}

function isBlankOnComplete(onComplete) {
  return !onComplete || (typeof onComplete === 'object' && Object.keys(onComplete).length === 0);
}

// Close one card if not already done. Honors the §3a on_complete safety:
// a non-blank on_complete fires server-side on done (unless resolution=skipped),
// so refuse rather than silently double-execute a create_deal etc.
async function closeOneCard({ id, resolution, proof, label, config, fetchImpl }) {
  const existing = await consoleRequest({ endpoint: `/tasks/${id}`, config, fetchImpl });
  const card = existing.data || existing;
  if (card.status === 'done') {
    return { id, label, changed: false, status: 'done', resolution: card.resolution, note: 'already done' };
  }
  if (!isBlankOnComplete(card.on_complete) && resolution !== 'skipped') {
    throw new Error(
      `Card ${id} (${label}) carries a non-blank on_complete: ${JSON.stringify(card.on_complete)}. ` +
      `Closing with resolution=${resolution} would fire it server-side. If you already performed that ` +
      `effect by hand, re-run with --resolution skipped (or clear it first: update --clear-on-complete).`
    );
  }
  // Carry completion proof so the server's status->done proof gate accepts the
  // close (it requires resolution_payload.completion_proof or applied_at).
  // Merge with any existing payload so we never clobber prior resolution data.
  const task = { status: 'done', resolution };
  if (proof && Object.keys(proof).length) {
    const existingPayload =
      card.resolution_payload && typeof card.resolution_payload === 'object' ? card.resolution_payload : {};
    task.resolution_payload = { ...existingPayload, completion_proof: proof };
  }
  const updated = await consoleRequest({
    endpoint: `/tasks/${id}`,
    method: 'PATCH',
    body: { task },
    config,
    fetchImpl
  });
  const u = updated.data || updated;
  return { id, label, changed: true, status: u.status, resolution: u.resolution };
}

export async function closeJob({
  job,
  card,
  recapCard,
  resolution = 'sent_interactively',
  messageId,
  note,
  jobsFile,
  dryRun = false,
  config = resolveConfig(),
  fetchImpl = globalThis.fetch,
  now = new Date()
}) {
  const jobsPath = resolveJobsFile(jobsFile);
  const jobs = loadJobs(jobsPath);
  const target = selectCloseTarget(jobs, { job, card });
  const jobObj = target.job;
  const sendCardId = target.cardId || (jobObj && jobObj.consoleTaskId);
  if (!sendCardId) {
    throw new Error(`No Console card id for ${job || card} (job has no consoleTaskId; pass --card)`);
  }
  const recapId = recapCard || (jobObj && jobObj.routing && jobObj.routing.recapCardId) || null;

  const plan = {
    jobId: jobObj ? jobObj.jobId : null,
    company: jobObj ? jobObj.company : null,
    sendCardId,
    recapCardId: recapId,
    resolution,
    messageId: messageId || null,
    jobStatusBefore: jobObj ? jobObj.status : '(no jobs.json job)'
  };
  if (dryRun) return { dryRun: true, jobsFile: jobsPath, plan };

  // 1) Close the cards FIRST (send, then recap). Each done-transition carries
  //    completion proof so the server's proof gate accepts it; `note`/messageId
  //    we already have is the natural proof.
  const sentAtIso = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const sendProof = compact({
    type: 'email_send',
    message_id: messageId,
    note: note || 'Sent interactively; card closed in lockstep.',
    completed_at: sentAtIso,
    source: 'close-job'
  });
  const recapProof = compact({
    type: 'recap_close',
    message_id: messageId,
    note: 'Recap closed in lockstep with the interactive follow-up send.',
    completed_at: sentAtIso,
    source: 'close-job'
  });
  const cards = [await closeOneCard({ id: sendCardId, resolution, proof: sendProof, label: 'send', config, fetchImpl })];
  if (recapId) cards.push(await closeOneCard({ id: recapId, resolution, proof: recapProof, label: 'recap', config, fetchImpl }));

  // 2) Log a sent receipt on the send card — only when we just closed it, so
  //    idempotent re-runs do not pile up duplicate receipts.
  let eventLogged = false;
  if (cards[0].changed && (messageId || note)) {
    await consoleRequest({
      endpoint: `/tasks/${sendCardId}/events`,
      method: 'POST',
      body: { event: compact({ event_type: 'sent', note, metadata: messageId ? { message_id: messageId } : undefined }) },
      config,
      fetchImpl
    });
    eventLogged = true;
  }

  // 3) VERIFY the send card reads done before mutating jobs.json.
  const verify = await consoleRequest({ endpoint: `/tasks/${sendCardId}`, config, fetchImpl });
  const verifyStatus = (verify.data || verify).status;
  if (verifyStatus !== 'done') {
    throw new Error(
      `Aborted before jobs.json flip: send card ${sendCardId} reads status=${verifyStatus}, expected done. ` +
      `Cards touched: ${JSON.stringify(cards)}`
    );
  }

  // 4) Flip jobs.json LAST, in lockstep.
  let jobFlip;
  if (target.index >= 0) {
    const j = jobs[target.index];
    const before = { status: j.status, resolution: j.resolution, sentAt: j.sentAt, sentMessageId: j.sentMessageId };
    j.status = 'done';
    j.resolution = resolution;
    if (!j.sentAt) j.sentAt = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
    if (messageId) j.sentMessageId = messageId;
    j.autoLogged = true;
    const after = { status: j.status, resolution: j.resolution, sentAt: j.sentAt, sentMessageId: j.sentMessageId };
    fs.writeFileSync(jobsPath, `${JSON.stringify(jobs, null, 2)}\n`);
    jobFlip = { changed: true, before, after };
  } else {
    jobFlip = { changed: false, note: 'no matching jobs.json job to flip (closed card only)' };
  }

  return { ok: true, jobsFile: jobsPath, plan, cards, eventLogged, jobFlip };
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
      case '--on-complete-json':
        args.onCompleteJson = rest[++i];
        break;
      case '--on-complete-file':
        args.onCompleteFile = rest[++i];
        break;
      case '--clear-on-complete':
        args.clearOnComplete = true;
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
      case '--job':
        args.job = rest[++i];
        break;
      case '--card':
        args.card = rest[++i];
        break;
      case '--recap-card':
        args.recapCard = rest[++i];
        break;
      case '--message-id':
        args.messageId = rest[++i];
        break;
      case '--jobs-file':
        args.jobsFile = rest[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!command) throw new Error('Missing command: health | list | show | create | update | mark-applied | event | close-job');
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
    case 'close-job':
      result = await closeJob({
        job: args.job || args.jobRef,
        card: args.card || args.id,
        recapCard: args.recapCard,
        resolution: args.resolution || 'sent_interactively',
        messageId: args.messageId,
        note: args.note,
        jobsFile: args.jobsFile,
        dryRun: args.dryRun,
        config
      });
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

// Structured "what happens when Brian marks this done" payload. The Console
// executes it server-side on completion (never on skip) — see the Rails
// TaskCompletionAction service. Shape: {"action":"create_deal","params":{...}}.
function onCompletePayload(args) {
  if (args.onCompleteJson) return JSON.parse(args.onCompleteJson);
  if (args.onCompleteFile) return JSON.parse(fs.readFileSync(args.onCompleteFile, 'utf8'));
  return undefined;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
