#!/usr/bin/env node
// Source-backed pipeline stage updater for the KMG Console CRM.
//
// This is intentionally narrow: it updates factual deal stage bookkeeping from
// evidence already observed by an agent. It does not invent values, change
// pricing, send email, or override closed deals.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_BASE_URL = 'https://kerrihq-rails-xtua.onrender.com/api/v1';
const DEFAULT_ENV_FILE = path.join(os.homedir(), '.kerri-chief', 'secrets', 'kerrihq.env');
const STAGE_ORDER = {
  lead: 0,
  qualified: 1,
  proposal_sent: 2,
  contract_sent: 3,
  negotiation: 4,
  closed_won: 5,
  closed_lost: 5
};
const CLOSED_STAGES = new Set(['closed_won', 'closed_lost']);
const MAX_NOTE_LENGTH = 5000;

const STATUS_TO_STAGE = new Map([
  ['prospect', 'lead'],
  ['lead', 'lead'],
  ['interest', 'qualified'],
  ['qualified', 'qualified'],
  ['proposal', 'proposal_sent'],
  ['proposal sent', 'proposal_sent'],
  ['proposal_sent', 'proposal_sent'],
  ['pricing sent', 'proposal_sent'],
  ['package sent', 'proposal_sent'],
  ['contract sent', 'contract_sent'],
  ['contract_sent', 'contract_sent'],
  ['negotiation', 'negotiation'],
  ['contract won', 'closed_won'],
  ['closed won', 'closed_won'],
  ['closed_won', 'closed_won'],
  ['won', 'closed_won'],
  ['contract lost', 'closed_lost'],
  ['closed lost', 'closed_lost'],
  ['closed_lost', 'closed_lost'],
  ['lost', 'closed_lost'],
  ['declined', 'closed_lost'],
  ['pass', 'closed_lost'],
  ['passed', 'closed_lost']
]);

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

export function loadEnv(envFile = DEFAULT_ENV_FILE) {
  try {
    return parseEnvText(fs.readFileSync(envFile, 'utf8'));
  } catch {
    return {};
  }
}

export function resolveConfig({ env = process.env, envFile = DEFAULT_ENV_FILE } = {}) {
  const fileEnv = loadEnv(envFile);
  const token = env.KERRIHQ_AGENT_API_KEY || fileEnv.KERRIHQ_AGENT_API_KEY ||
    env.KERRIHQ_SYNC_TOKEN || fileEnv.KERRIHQ_SYNC_TOKEN;
  const baseUrl = env.KERRIHQ_API_BASE || fileEnv.KERRIHQ_API_BASE || DEFAULT_BASE_URL;
  if (!token) {
    throw new Error(`Missing KERRIHQ_AGENT_API_KEY or KERRIHQ_SYNC_TOKEN. Expected one in environment or ${envFile}`);
  }
  return { token, baseUrl: baseUrl.replace(/\/+$/, '') };
}

export function buildUrl(baseUrl, endpoint, params = {}) {
  const url = new URL(endpoint.replace(/^\//, ''), `${baseUrl.replace(/\/+$/, '')}/`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
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

export function normalizeStage(value) {
  const key = String(value || '').trim().toLowerCase().replace(/[-\s]+/g, ' ');
  const stage = STATUS_TO_STAGE.get(key) || STATUS_TO_STAGE.get(key.replace(/\s+/g, '_'));
  if (!stage) {
    throw new Error(`Unknown pipeline stage/status: ${value}`);
  }
  return stage;
}

export function transitionDecision(currentStage, targetStage, { force = false } = {}) {
  if (currentStage === targetStage) {
    return { allowed: true, noop: true, reason: 'already at target stage' };
  }
  if (!STAGE_ORDER.hasOwnProperty(currentStage)) {
    return { allowed: false, reason: `unknown current stage ${currentStage}` };
  }
  if (!STAGE_ORDER.hasOwnProperty(targetStage)) {
    return { allowed: false, reason: `unknown target stage ${targetStage}` };
  }
  if (CLOSED_STAGES.has(currentStage) && currentStage !== targetStage) {
    return { allowed: false, reason: `closed deal is terminal at ${currentStage}` };
  }
  if (!force && STAGE_ORDER[targetStage] < STAGE_ORDER[currentStage]) {
    return { allowed: false, reason: `refusing regression ${currentStage} -> ${targetStage}` };
  }
  return { allowed: true, noop: false, reason: 'source-backed forward or terminal move' };
}

export function evidenceLine({ targetStage, source, evidence, at = new Date() }) {
  const sourceText = source ? ` Source: ${source}.` : '';
  return `Pipeline update ${at.toISOString()}: stage=${targetStage}.${sourceText} Evidence: ${required(evidence, '--evidence')}`;
}

export function appendEvidence(notes, line) {
  const current = String(notes || '').trim();
  if (current.includes(line)) return current;
  const next = current ? `${current}\n\n${line}` : line;
  if (next.length <= MAX_NOTE_LENGTH) return next;
  return `${next.slice(0, MAX_NOTE_LENGTH - 120)}\n\n[truncated by console-pipeline-update.mjs; latest evidence retained]\n${line}`;
}

export async function fetchAll(endpoint, { params = {}, config, fetchImpl } = {}) {
  const all = [];
  for (let page = 1; ; page += 1) {
    const json = await consoleRequest({
      endpoint,
      params: { ...params, page, per_page: 100 },
      config,
      fetchImpl
    });
    all.push(...(json.data || []));
    if (!json.meta?.has_more) return all;
  }
}

export async function findCompany(args, deps = {}) {
  if (args.companyId) {
    const json = await consoleRequest({
      endpoint: `/companies/${args.companyId}`,
      config: deps.config,
      fetchImpl: deps.fetchImpl
    });
    return json.data;
  }

  const lookups = [];
  if (args.jobId) lookups.push({ job_id: args.jobId });
  if (args.domain) lookups.push({ domain: args.domain });

  for (const params of lookups) {
    const json = await consoleRequest({
      endpoint: '/companies',
      params,
      config: deps.config,
      fetchImpl: deps.fetchImpl
    });
    if ((json.data || []).length > 0) return json.data[0];
  }

  throw new Error('Company not found. Provide --company-id, --job-id, or --domain for an existing Console company.');
}

export function chooseDeal(deals, { dealId, dealType = 'sponsorship' } = {}) {
  if (dealId) {
    const match = deals.find((deal) => deal.id === dealId);
    if (!match) throw new Error(`Deal ${dealId} was not found for the selected company`);
    return match;
  }
  const matches = deals.filter((deal) => !dealType || deal.deal_type === dealType);
  if (matches.length === 0) return null;
  const open = matches.filter((deal) => !CLOSED_STAGES.has(deal.stage));
  return (open[0] || matches[0]);
}

export function dealCreatePayload(company, args) {
  return {
    deal: {
      name: args.dealName || `${company.name} Hardware FYI sponsorship`,
      deal_type: args.dealType || 'sponsorship',
      company_id: company.id,
      notes: evidenceLine({
        targetStage: normalizeStage(args.stage || args.status),
        source: args.source,
        evidence: args.evidence,
        at: args.now || new Date()
      })
    }
  };
}

export async function updatePipeline(args, deps = {}) {
  const targetStage = normalizeStage(args.stage || args.status);
  const config = deps.config || resolveConfig();
  const fetchImpl = deps.fetchImpl || globalThis.fetch;
  const now = args.now || deps.now || new Date();
  const apply = args.apply === true;

  const company = await findCompany(args, { config, fetchImpl });
  const allDeals = await fetchAll('/deals', { config, fetchImpl });
  const companyDeals = allDeals.filter((deal) => deal.company_id === company.id);
  let deal = chooseDeal(companyDeals, args);
  const operations = [];

  if (!deal) {
    if (args.noCreate) {
      throw new Error(`No deal found for ${company.name}; rerun without --no-create to create a source-backed deal`);
    }
    const createBody = dealCreatePayload(company, { ...args, now });
    operations.push({ type: 'create_deal', body: createBody });
    if (apply) {
      const created = await consoleRequest({
        endpoint: '/deals',
        method: 'POST',
        body: createBody,
        config,
        fetchImpl
      });
      deal = created.data;
    } else {
      deal = { id: '(new deal)', stage: 'lead', notes: createBody.deal.notes, deal_type: createBody.deal.deal_type };
    }
  }

  const previousStage = deal.stage;
  const decision = transitionDecision(previousStage, targetStage, { force: args.force });
  if (!decision.allowed) {
    throw new Error(decision.reason);
  }

  const line = evidenceLine({ targetStage, source: args.source, evidence: args.evidence, at: now });
  const nextNotes = appendEvidence(deal.notes, line);
  if (nextNotes !== (deal.notes || '')) {
    operations.push({ type: 'update_notes', deal_id: deal.id, body: { deal: { notes: nextNotes } } });
    if (apply && !String(deal.id).startsWith('(')) {
      deal = (await consoleRequest({
        endpoint: `/deals/${deal.id}`,
        method: 'PATCH',
        body: { deal: { notes: nextNotes } },
        config,
        fetchImpl
      })).data;
    }
  }

  if (!decision.noop) {
    operations.push({ type: 'update_stage', deal_id: deal.id, body: { stage: targetStage } });
    if (apply && !String(deal.id).startsWith('(')) {
      deal = (await consoleRequest({
        endpoint: `/deals/${deal.id}/update_stage`,
        method: 'PATCH',
        body: { stage: targetStage },
        config,
        fetchImpl
      })).data;
    }
  }

  return {
    applied: apply,
    company: { id: company.id, name: company.name, job_id: company.job_id },
    deal: { id: deal.id, stage: apply ? deal.stage : targetStage, previous_stage: previousStage },
    target_stage: targetStage,
    decision,
    operations
  };
}

export function parseArgs(argv) {
  const args = { apply: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    switch (arg) {
      case '--apply':
        args.apply = true;
        break;
      case '--dry-run':
        args.apply = false;
        break;
      case '--force':
        args.force = true;
        break;
      case '--no-create':
        args.noCreate = true;
        break;
      case '--company-id':
        args.companyId = argv[++i];
        break;
      case '--deal-id':
        args.dealId = argv[++i];
        break;
      case '--deal-name':
        args.dealName = argv[++i];
        break;
      case '--deal-type':
        args.dealType = argv[++i];
        break;
      case '--job-id':
        args.jobId = argv[++i];
        break;
      case '--domain':
        args.domain = argv[++i];
        break;
      case '--status':
        args.status = argv[++i];
        break;
      case '--stage':
        args.stage = argv[++i];
        break;
      case '--source':
        args.source = argv[++i];
        break;
      case '--evidence':
        args.evidence = argv[++i];
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  required(args.stage || args.status, '--stage or --status');
  required(args.evidence, '--evidence');
  if (!args.companyId && !args.jobId && !args.domain) {
    throw new Error('Missing company lookup. Provide --company-id, --job-id, or --domain.');
  }
  return args;
}

function required(value, label) {
  if (value === undefined || value === null || value === '') throw new Error(`Missing ${label}`);
  return value;
}

export async function run(argv = process.argv.slice(2), io = { stdout: process.stdout, stderr: process.stderr }) {
  const result = await updatePipeline(parseArgs(argv));
  io.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
}
