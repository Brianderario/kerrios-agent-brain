#!/usr/bin/env node
// One-time backfill for the 2026-06-11 brain -> Console storage split.
// Pushes every company in data/companies.json (plus richer context extracted
// from brain/wiki/companies + brain/wiki/people) into the production KMG
// Console (kerrihq-rails) via its V1 API, which is the CRM of record from
// this date forward. Idempotent: matches existing Console rows by jobId,
// then domain, then exact name, and PATCHes instead of duplicating.
//
// Usage:
//   node scripts/console-crm-backfill.mjs            # dry run (prints plan)
//   node scripts/console-crm-backfill.mjs --apply    # execute
//
// Auth: KERRIHQ_AGENT_API_KEY in ~/.kerri-chief/secrets/kerrihq.env
// (companies + people read/write scopes).

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const RAILS_BASE = process.env.KERRIHQ_API_BASE || 'https://kerrihq-rails-xtua.onrender.com/api/v1';
const APPLY = process.argv.includes('--apply');
const EXTRACT_PATH = process.argv.find(a => a.startsWith('--extract='))?.slice(10)
  || '/tmp/kerri-crm-extract.json';

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const TOKEN = loadEnv(join(homedir(), '.kerri-chief/secrets/kerrihq.env')).KERRIHQ_AGENT_API_KEY;
if (!TOKEN) { console.error('KERRIHQ_AGENT_API_KEY missing from ~/.kerri-chief/secrets/kerrihq.env'); process.exit(1); }

// ~80 requests/min keeps us safely under the API's 100/min rate limit.
const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastCall = 0;
async function api(path, { method = 'GET', body } = {}) {
  const wait = lastCall + 750 - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${RAILS_BASE}${path}`, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 429 && attempt <= 5) { await sleep(15000); continue; }
    const text = await res.text();
    if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  }
}

async function fetchAll(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await api(`${path}${path.includes('?') ? '&' : '?'}page=${page}&per_page=100`);
    all.push(...data);
    if (!meta.has_more) return all;
  }
}

const nameKey = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

// ---------- load sources ----------
const companiesJson = JSON.parse(readFileSync(join(ROOT, 'data/companies.json'), 'utf8')).companies;
let extract = { companies: [], people: [] };
try { extract = JSON.parse(readFileSync(EXTRACT_PATH, 'utf8')); }
catch { console.warn(`WARN: no wiki extract at ${EXTRACT_PATH}; backfilling from companies.json only`); }
const extractByJobId = new Map(extract.companies.filter(c => c.jobId).map(c => [c.jobId, c]));
const extractBySlug = new Map(extract.companies.map(c => [c.slug, c]));

// ---------- fetch current Console state ----------
console.log('Fetching current Console companies + people...');
const existing = await fetchAll('/companies');
const people = await fetchAll('/people');
const byJobId = new Map(existing.filter(c => c.job_id).map(c => [c.job_id, c]));
const byDomain = new Map(existing.filter(c => c.domain).map(c => [c.domain, c]));
const byName = new Map(existing.map(c => [nameKey(c.name), c]));
const peopleByEmail = new Map(people.filter(p => p.email).map(p => [p.email.toLowerCase(), p]));
console.log(`Console now has ${existing.length} companies, ${people.length} people.`);

const stats = { created: 0, updated: 0, peopleCreated: 0, peopleSkipped: 0, errors: [] };

// Verified merges (2026-06-11 collision review): incoming registry nameKey ->
// existing Console-import nameKey. The Console row is the same real company
// under a variant (or, for Blue Clover, misspelled) name. The registry name
// wins on merge. NOT in this list and intentionally kept separate: MFG Flow
// vs Flow, Machina Labs vs Aris Machina, East West Mfg vs EMI, ANELLO vs
// Xscape, ECM PCB Stator vs Advanced PCB, Shah Capital vs Embedded Ventures.
const NAME_OVERRIDES = new Map([
  ['durolabs', 'duro'],
  ['flowengineering', 'flow'],
  ['expressmanufacturingemi', 'expressmanufacturingincemi'],
  ['bluecloverdevices', 'bluecoverdevices'],
]);

// A name-based match is only valid when it can't collide two different
// customers: if both sides carry a jobId and they differ, it is NOT a match.
const jobIdCompatible = (rec, jobId) => !jobId || !rec.job_id || rec.job_id === jobId;

function findExisting({ jobId, domain, name }) {
  if (jobId && byJobId.has(jobId)) return byJobId.get(jobId);
  if (domain && byDomain.has(domain)) return byDomain.get(domain);
  const k = nameKey(name);
  const exact = byName.get(k);
  if (exact && jobIdCompatible(exact, jobId)) return exact;
  const o = NAME_OVERRIDES.get(k);
  if (o && byName.has(o) && jobIdCompatible(byName.get(o), jobId)) return byName.get(o);
  // Loose containment fallback for variants like "Onshape" vs "Onshape by
  // PTC", guarded to keys of 5+ chars so short names can't false-positive.
  if (k.length >= 5) {
    for (const [key, c] of byName) {
      if (key.length >= 5 && (key.includes(k) || k.includes(key)) && jobIdCompatible(c, jobId)) return c;
    }
  }
  return null;
}

function indexRecord(rec) {
  if (rec.job_id) byJobId.set(rec.job_id, rec);
  if (rec.domain) byDomain.set(rec.domain, rec);
  byName.set(nameKey(rec.name), rec);
}

async function upsertCompany(payload, label) {
  const match = findExisting({ jobId: payload.job_id, domain: payload.domain, name: payload.name });
  if (!APPLY) {
    console.log(`${match ? 'UPDATE' : 'CREATE'} company ${label} (${payload.job_id || 'no jobId'})`);
    match ? stats.updated++ : stats.created++;
    // Index a simulated record so dry-run dedupe mirrors apply-mode behavior.
    const simulated = match || { id: `dry-${label}`, ...payload };
    indexRecord({ ...simulated, ...payload, name: simulated.name });
    return simulated;
  }
  try {
    let rec;
    if (match) {
      // Never blank out fields the Console already has.
      const body = Object.fromEntries(Object.entries(payload).filter(([k, v]) =>
        v != null && v !== '' && !(Array.isArray(v) && v.length === 0) && (match[k] == null || match[k] === '' || ['crm_notes', 'aliases', 'last_touched_at'].includes(k))));
      // On a verified merge the registry name is canonical (fixes e.g. the
      // Console's "Blue Cover Devices" typo).
      if (NAME_OVERRIDES.get(nameKey(payload.name)) === nameKey(match.name)) body.name = payload.name;
      rec = (await api(`/companies/${match.id}`, { method: 'PATCH', body: { company: body } })).data;
      stats.updated++;
    } else {
      rec = (await api('/companies', { method: 'POST', body: { company: payload } })).data;
      stats.created++;
    }
    indexRecord(rec);
    return rec;
  } catch (e) {
    stats.errors.push(`company ${label}: ${e.message}`);
    return null;
  }
}

async function upsertPerson(payload, label) {
  const email = payload.email?.toLowerCase();
  if (email && peopleByEmail.has(email)) { stats.peopleSkipped++; return; }
  if (!APPLY) { console.log(`CREATE person ${label}`); return; }
  try {
    const rec = (await api('/people', { method: 'POST', body: { person: payload } })).data;
    if (rec.email) peopleByEmail.set(rec.email.toLowerCase(), rec);
    stats.peopleCreated++;
  } catch (e) {
    stats.errors.push(`person ${label}: ${e.message}`);
  }
}

// ---------- companies.json (the jobId registry — authoritative for jobIds) ----------
for (const [domain, c] of Object.entries(companiesJson)) {
  const wiki = (c.jobId && extractByJobId.get(c.jobId)) || extractBySlug.get(c.slug);
  const notes = [c.note, c.lastNote, wiki?.summary].filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i).join('\n\n');
  const company = await upsertCompany({
    name: c.name || domain,
    domain,
    job_id: c.jobId || null,
    slug: c.slug || null,
    aliases: c.aliases || [],
    crm_notes: notes || null,
    first_seen_at: c.firstSeenAt || c.createdAt || null,
    last_touched_at: c.lastTouchedAt || c.updatedAt || null,
    website: wiki?.website || null,
    industry: wiki?.industry || null,
    source: c.source || 'kerrios-brain-backfill',
  }, c.name || domain);

  if (company && c.primaryContact && c.primaryContact.includes('@')) {
    const local = c.primaryContact.split('@')[0];
    const guessName = local.replace(/[._-]+/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    await upsertPerson({
      name: guessName, email: c.primaryContact, contact_type: 'sponsor_contact',
      company_id: company.id,
    }, `${guessName} <${c.primaryContact}>`);
  }
}

// ---------- wiki companies not in companies.json (no jobId yet) ----------
const jobIdsInRegistry = new Set(Object.values(companiesJson).map(c => c.jobId).filter(Boolean));
for (const w of extract.companies) {
  if (w.jobId && jobIdsInRegistry.has(w.jobId)) continue; // already handled above
  if (findExisting({ jobId: w.jobId, domain: w.domain, name: w.name })) continue;
  if (!w.jobId && !w.domain) { console.log(`SKIP wiki company ${w.slug}: no jobId and no domain (likely a test/person page)`); continue; }
  await upsertCompany({
    name: w.name, domain: w.domain || null, job_id: w.jobId || null, slug: w.slug || null,
    crm_notes: w.summary || null, website: w.website || null, industry: w.industry || null,
    source: 'kerrios-wiki-backfill',
  }, w.name);
}

// ---------- wiki people (external contacts with real names/titles) ----------
for (const p of extract.people.filter(p => !p.internal)) {
  let company = findExisting({ jobId: null, domain: p.companyDomain, name: p.companyName });
  if (!company && p.companyName) {
    company = await upsertCompany({ name: p.companyName, domain: p.companyDomain || null, source: 'kerrios-wiki-backfill' }, p.companyName);
  }
  if (!company) { stats.errors.push(`person ${p.name}: no company resolvable`); continue; }
  const email = p.email?.toLowerCase();
  if (email && peopleByEmail.has(email)) {
    // Upgrade the email-derived stub with the real name/title.
    if (APPLY) {
      const stub = peopleByEmail.get(email);
      try {
        await api(`/people/${stub.id}`, { method: 'PATCH', body: { person: { name: p.name, title: p.title || undefined, linkedin_url: p.linkedin || undefined } } });
      } catch (e) { stats.errors.push(`person upgrade ${p.name}: ${e.message}`); }
    } else console.log(`UPGRADE person ${p.name}`);
    continue;
  }
  await upsertPerson({
    name: p.name, email: p.email || null, title: p.title || null, linkedin_url: p.linkedin || null,
    contact_type: 'sponsor_contact', company_id: company.id,
  }, p.name);
}

console.log(`\n${APPLY ? 'DONE' : 'DRY RUN'}: companies created ${stats.created}, updated ${stats.updated}; people created ${stats.peopleCreated}, already present ${stats.peopleSkipped}.`);
if (stats.errors.length) {
  console.log(`ERRORS (${stats.errors.length}):`);
  for (const e of stats.errors) console.log('  -', e);
  process.exitCode = 1;
}
