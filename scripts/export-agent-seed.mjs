#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(import.meta.dirname, '..');
const sourcePath = path.join(repoRoot, 'data', 'kerrios.json');
const outputPath = path.join(repoRoot, 'data', 'kerrios.agent-seed.json');
const blockedPersonalTerms = [
  'personal-assistant',
  'Personal assistant',
  'Samantha',
  'Charlotte',
  'Vivian',
  'Parrish',
  'wife',
  'daughter',
  'birthday',
  'gift',
  'tirzepatide',
  'cake',
  'personal life'
];

const blockedRuntimeRecordTerms = [
  ['Open', 'Claw'],
  ['Open ', 'Claw'],
  ['Rail', 'way'],
  ['Send', 'blue'],
  ['Blue', 'Bubbles'],
  ['heart', 'beat'],
  ['inbox ', 'sweep'],
  ['cron ', 'job'],
  ['gate', 'way'],
  ['local Mac ', 'worker'],
  ['text ', 'bridge'],
  ['Superhuman ', 'MCP'],
  ['Outlook ', 'MCP'],
  ['auto', 'mation system ', 'map'],
  ['conversation auto', 'sweep'],
  ['kinetic-daily-event-ops-', 'check-in'],
  ['kinetic-event-', 'countdown']
].map((parts) => parts.join(''));

const blockedRuntimeLineTerms = [...blockedRuntimeRecordTerms, ['auto', 'mation'].join('')];

const OLD_RUNTIME_NOTE_PATTERN = new RegExp(
  `\\b(${blockedRuntimeLineTerms.map(escapeRegExp).join('|')})\\b`,
  'i'
);

function redact(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, child] of Object.entries(value)) {
      if (
        /^(email|slackUserId|slackUserIds|agentEmail|anchoredAccount|importedMcporterName|setupPath|apiKey|apiSecret|token|secret|webhookSecret)$/i.test(
          key
        )
      ) {
        out[key] = Array.isArray(child) ? [] : null;
      } else {
        out[key] = redact(child);
      }
    }
    return out;
  }
  if (typeof value !== 'string') return value;
  return value
    .split('\n')
    .filter((line) => !OLD_RUNTIME_NOTE_PATTERN.test(line))
    .join('\n')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9._%+-]+(?:\.[A-Z]{2,})?/gi, '[redacted-email]')
    .replace(/\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/g, '[redacted-phone]')
    .replace(/U[0-9A-Z]{8,}/g, '[redacted-slack-id]')
    .replace(/D[0-9A-Z]{8,}/g, '[redacted-slack-channel]')
    .replace(/\/Users\/brianderario/g, '$HOME')
    .replace(/Brian D'Erario/g, 'Brian')
    .replace(/Brianderario/g, 'Brian')
    .replace(/brianderario/g, 'brian');
}

function includeMemory(record) {
  const ownerType = record.metadata?.ownerType;
  if (ownerType === 'person') return false;
  const text = [record.title, record.body, record.source, JSON.stringify(record.metadata || {})].join('\n');
  const shouldBlock = [...blockedPersonalTerms, ...blockedRuntimeRecordTerms].some((term) =>
    text.toLowerCase().includes(term.toLowerCase())
  );
  if (shouldBlock) {
    return false;
  }
  return (
    ownerType === 'company' ||
    ownerType === 'property' ||
    (record.metadata?.core && !/person_brian|person_/i.test(text))
  );
}

if (!fs.existsSync(sourcePath)) {
  throw new Error(`Live KerriOS store not found: ${sourcePath}`);
}

const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
const memory = source.memory.filter(includeMemory).map(redact);

const seed = {
  version: source.version,
  createdAt: source.createdAt,
  updatedAt: new Date().toISOString(),
  sanitization: {
    generatedAt: new Date().toISOString(),
    source: 'local data/kerrios.json',
    rules: [
      'includes company/property/core memory only',
      'excludes person profiles, personal assistant records, conversations, proposals, approvals, and audit trail',
      'redacts email addresses, phone numbers, Slack IDs, local home paths, and secret-like account fields',
      'excludes old runtime and recurring workflow notes',
      'preserves siloed company records only after redaction because the GitHub repository is private and agent-accessible'
    ],
    sourceCounts: {
      memory: source.memory.length,
      people: source.people.length,
      assistants: source.assistants.length,
      audit: source.audit.length
    },
    exportedCounts: { memory: memory.length }
  },
  people: [],
  assistants: [],
  memberships: [],
  memory,
  memoryCandidates: [],
  proposals: [],
  approvals: [],
  connectors: [],
  conversations: [],
  conversationMessages: [],
  textMessages: [],
  audit: []
};

fs.writeFileSync(outputPath, `${JSON.stringify(seed, null, 2)}\n`);
console.log(
  JSON.stringify(
    {
      outputPath,
      exportedMemory: memory.length,
      sourceMemory: source.memory.length
    },
    null,
    2
  )
);

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
