#!/usr/bin/env node
// Mirrors the KMG Console CRM (the system of record as of 2026-06-11) into
// the Hardware FYI CRM Google Sheet so Brian can double-check the data in a
// surface he already knows. ONE-WAY: Console -> Sheet. Sheet edits are never
// read back; make changes in the Console.
//
// Writes three tabs (created if missing): "Console Companies",
// "Console Contacts", "Console Deals". Each run fully replaces tab contents
// and stamps the sync time in cell A1's header row note column.
//
// Usage: node scripts/crm-sheet-mirror.mjs
// Auth: KERRIHQ_AGENT_API_KEY in ~/.kerri-chief/secrets/kerrihq.env;
//       Google OAuth via ~/.kerri-chief/kerri-gdocs-mcp/.env (spreadsheets scope).

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const SHEET_ID = '1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk'; // Hardware FYI CRM
const RAILS_BASE = process.env.KERRIHQ_API_BASE || 'https://kerrihq-rails-xtua.onrender.com/api/v1';

function loadEnv(path) {
  const out = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return out;
}
const TOKEN = loadEnv(join(homedir(), '.kerri-chief/secrets/kerrihq.env')).KERRIHQ_AGENT_API_KEY;
const G = loadEnv(join(homedir(), '.kerri-chief/kerri-gdocs-mcp/.env'));
if (!TOKEN) { console.error('KERRIHQ_AGENT_API_KEY missing'); process.exit(1); }

const sleep = ms => new Promise(r => setTimeout(r, ms));
let lastCall = 0;
async function rails(path) {
  const wait = lastCall + 750 - Date.now();
  if (wait > 0) await sleep(wait);
  lastCall = Date.now();
  const res = await fetch(`${RAILS_BASE}${path}`, { headers: { Authorization: `Bearer ${TOKEN}` } });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
async function fetchAll(path) {
  const all = [];
  for (let page = 1; ; page++) {
    const { data, meta } = await rails(`${path}?page=${page}&per_page=100`);
    all.push(...data);
    if (!meta.has_more) return all;
  }
}

async function googleToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: G.GDOCS_CLIENT_ID, client_secret: G.GDOCS_CLIENT_SECRET,
      refresh_token: G.GDOCS_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
  });
  const json = await res.json();
  if (!json.access_token) throw new Error(`google token: ${JSON.stringify(json).slice(0, 200)}`);
  return json.access_token;
}

async function gapi(token, path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.json();
}

// ---------- pull Console data ----------
console.log('Pulling Console CRM...');
const [companies, people, deals] = [await fetchAll('/companies'), await fetchAll('/people'), await fetchAll('/deals')];
const companyById = new Map(companies.map(c => [c.id, c]));
const syncedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
console.log(`${companies.length} companies, ${people.length} contacts, ${deals.length} deals.`);

const TABS = {
  'Console Companies': [
    ['Synced from KMG Console (source of truth), do not edit here. Last sync: ' + syncedAt],
    ['Job ID', 'Name', 'Domain', 'Aliases', 'Website', 'Industry', 'First Seen', 'Last Touched', 'Notes'],
    ...companies
      .sort((a, b) => (a.job_id || 'zz').localeCompare(b.job_id || 'zz'))
      .map(c => [c.job_id || '', c.name || '', c.domain || '', (c.aliases || []).join(', '),
        c.website || '', c.industry || '', (c.first_seen_at || '').slice(0, 10),
        (c.last_touched_at || '').slice(0, 10), c.crm_notes || '']),
  ],
  'Console Contacts': [
    ['Synced from KMG Console (source of truth), do not edit here. Last sync: ' + syncedAt],
    ['Name', 'Email', 'Title', 'Company', 'Job ID', 'Type', 'LinkedIn'],
    ...people
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map(p => {
        const c = companyById.get(p.company_id) || {};
        return [p.name || '', p.email || '', p.title || '', c.name || '', c.job_id || '',
          p.contact_type || '', p.linkedin_url || ''];
      }),
  ],
  'Console Deals': [
    ['Synced from KMG Console (source of truth), do not edit here. Last sync: ' + syncedAt],
    ['Deal', 'Company', 'Job ID', 'Type', 'Stage', 'Value', 'Probability', 'Notes'],
    ...deals.map(d => {
      const c = companyById.get(d.company_id) || {};
      return [d.name || '', c.name || '', c.job_id || '', d.deal_type || '', d.stage || '',
        d.value || '', d.probability || '', d.notes || ''];
    }),
  ],
};

// ---------- push to the sheet ----------
const token = await googleToken();
const meta = await gapi(token, '?fields=sheets.properties');
const existingTitles = new Set(meta.sheets.map(s => s.properties.title));
const toAdd = Object.keys(TABS).filter(t => !existingTitles.has(t));
if (toAdd.length) {
  await gapi(token, ':batchUpdate', { method: 'POST', body: { requests: toAdd.map(title => ({ addSheet: { properties: { title } } })) } });
  console.log('Created tabs:', toAdd.join(', '));
}
for (const [title, rows] of Object.entries(TABS)) {
  await gapi(token, `/values/${encodeURIComponent(`'${title}'`)}:clear`, { method: 'POST' });
  await gapi(token, `/values/${encodeURIComponent(`'${title}'!A1`)}?valueInputOption=RAW`, {
    method: 'PUT', body: { values: rows },
  });
  console.log(`Wrote ${rows.length - 2} rows to "${title}".`);
}
console.log('Sheet mirror complete.');
