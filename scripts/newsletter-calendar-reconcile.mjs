#!/usr/bin/env node
// Two-way reconcile between the Hardware FYI newsletter calendar's two surfaces
// during the Savant transition (until Ari + Benji are fully on Savant):
//   1. Savant (system of record)  -> GET /api/v1/newsletter_slots
//   2. HWFYI CRM Google Sheet "Newsletter Ad Calendar" (Ari/Benji still edit here)
//
// SAFE BY DESIGN:
//   - Mirrors a booking that exists on exactly ONE side into the OTHER side
//     ONLY when the other side's slot is empty/open. Never overwrites a
//     non-empty cell or a booked Savant slot.
//   - A date booked on BOTH sides to DIFFERENT sponsors = CONFLICT: reported,
//     never auto-resolved.
//   - Sheet-only booking whose Savant issue does not exist = reported, skipped
//     (we don't fabricate issue dates).
//
// Usage:
//   node scripts/newsletter-calendar-reconcile.mjs            # dry-run report
//   node scripts/newsletter-calendar-reconcile.mjs --apply    # perform safe mirrors
//   node scripts/newsletter-calendar-reconcile.mjs --apply --json   # machine output
//
// Auth: KERRIHQ_AGENT_API_KEY + KERRIHQ_BRAIN_IMPORT_KEY in ~/.kerri-chief/secrets/kerrihq.env;
//       Google OAuth via ~/.kerri-chief/kerri-gdocs-mcp/.env (spreadsheets scope).

import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const APPLY = process.argv.includes('--apply');
const JSON_OUT = process.argv.includes('--json');
const SHEET_ID = '1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk';
const TAB = 'Newsletter Ad Calendar';
const API = 'https://kerrihq-rails-xtua.onrender.com/api/v1';

function loadEnv(p) {
  const o = {};
  for (const l of readFileSync(p, 'utf8').split('\n')) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) o[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  return o;
}
const K = loadEnv(join(homedir(), '.kerri-chief/secrets/kerrihq.env'));
const G = loadEnv(join(homedir(), '.kerri-chief/kerri-gdocs-mcp/.env'));

const today = new Date().toISOString().slice(0, 10);
const normDate = (d) => {
  const m = String(d).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return `${m[3]}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
  const m2 = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m2 ? m2[0] : null;
};
// Compare sponsor identity loosely: strip parenthetical qualifiers like (HOLD)/(3x).
const canon = (s) => String(s || '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]/g, '');
const sameSponsor = (a, b) => {
  const x = canon(a), y = canon(b);
  if (!x || !y) return false;
  return x === y || x.startsWith(y.slice(0, 5)) || y.startsWith(x.slice(0, 5));
};

async function googleToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: G.GDOCS_CLIENT_ID, client_secret: G.GDOCS_CLIENT_SECRET,
      refresh_token: G.GDOCS_REFRESH_TOKEN, grant_type: 'refresh_token',
    }),
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('google token failed: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}
async function sheetGet(token, range) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`,
    { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`sheet get ${range} -> ${r.status}`);
  return (await r.json()).values || [];
}
async function sheetPut(token, range, values) {
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    { method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ values }) });
  if (!r.ok) throw new Error(`sheet put ${range} -> ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}
async function savantImport(rows) {
  const r = await fetch(`${API}/newsletter_inventory_imports`, {
    method: 'POST', headers: { Authorization: `Bearer ${K.KERRIHQ_BRAIN_IMPORT_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  if (!r.ok) throw new Error(`savant import -> ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

// ---- pull both surfaces ----
const slotsRes = await (await fetch(`${API}/newsletter_slots`, { headers: { Authorization: `Bearer ${K.KERRIHQ_AGENT_API_KEY}` } })).json();
const savant = new Map();
for (const s of slotsRes.data) savant.set(s.date, { status: s.status, sponsor: (s.sponsor_name || '').trim(), edition: s.edition, issueStatus: s.issue_status });

const token = await googleToken();
const rows = await sheetGet(token, `${TAB}!A2:G1052`);
const sheet = new Map();
rows.forEach((r, i) => {
  const d = normDate(r[0]);
  if (!d) return;
  const placement = (r[3] || '').trim();
  const cTrue = String(r[2]).toUpperCase() === 'TRUE';
  const booked = cTrue || (placement && placement !== '-');
  sheet.set(d, { row: i + 2, booked, placement, cTrue, day: (r[1] || '').trim() });
});

const savantBooked = (s) => s && (s.status === 'sold' || s.status === 'reserved');
const report = { conflict: [], toSheet: [], toSavant: [], skippedNoIssue: [], agree: 0, applied: { toSheet: 0, toSavant: 0 } };

const dates = [...new Set([...savant.keys(), ...sheet.keys()])].filter((d) => d >= today).sort();
const savantRows = [];
const sheetWrites = [];

for (const d of dates) {
  const a = savant.get(d), b = sheet.get(d);
  const aB = savantBooked(a), bB = b && b.booked;
  if (aB && bB) {
    if (sameSponsor(a.sponsor, b.placement)) report.agree++;
    else report.conflict.push({ date: d, savant: `${a.sponsor} (${a.status})`, sheet: b.placement, sheetRow: b.row });
  } else if (aB && !bB) {
    // Savant booked, sheet slot empty -> mirror to sheet (only if a row exists)
    if (!b) { report.skippedNoIssue.push({ date: d, side: 'sheet-row-missing', who: a.sponsor }); continue; }
    const label = a.status === 'reserved' ? `${a.sponsor} (HOLD)` : a.sponsor;
    report.toSheet.push({ date: d, row: b.row, who: label });
    sheetWrites.push({ range: `${TAB}!C${b.row}:E${b.row}`, values: [['TRUE', label, `Auto-synced from Savant ${today}`]] });
  } else if (bB && !aB) {
    // Sheet booked, savant open/empty
    if (!a) { report.skippedNoIssue.push({ date: d, side: 'savant-issue-missing', who: b.placement }); continue; }
    const sponsor = b.placement.replace(/\(.*?\)/g, '').trim();
    const reserved = !sameSponsor(sponsor, ''); // always true if sponsor present
    if (!sponsor) continue;
    report.toSavant.push({ date: d, who: sponsor });
    savantRows.push({
      sponsor_name: sponsor, commitment_type: 'newsletter_primary', commitment_status: 'active',
      notes: `Auto-synced from HWFYI CRM sheet ${today}.`,
      issue_date: d, edition: a.edition || (b.day.toLowerCase().startsWith('sat') ? 'saturday' : 'tuesday'),
      issue_status: a.issueStatus || 'scheduled',
      placement_type: 'primary', placement_status: 'reserved',
      source_row_id: `sheet-mirror:${canon(sponsor)}:${d}`,
      placement_notes: `Auto-synced from CRM sheet ${today}`,
    });
  } else {
    // both open/empty -> nothing
  }
}

if (APPLY) {
  if (sheetWrites.length) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values:batchUpdate`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: sheetWrites }),
    }).then((r) => { if (!r.ok) throw new Error('sheet batchUpdate failed'); });
    report.applied.toSheet = sheetWrites.length;
  }
  if (savantRows.length) { await savantImport(savantRows); report.applied.toSavant = savantRows.length; }
}

if (JSON_OUT) { console.log(JSON.stringify(report, null, 2)); }
else {
  console.log(`Newsletter calendar reconcile ${today} (${APPLY ? 'APPLY' : 'dry-run'})`);
  console.log(`Compared ${dates.length} future issues. Agree: ${report.agree}`);
  console.log(`\nCONFLICTS (manual, different sponsor each side): ${report.conflict.length}`);
  report.conflict.forEach((c) => console.log(`  ${c.date} R${c.sheetRow} | Savant: ${c.savant} | Sheet: ${c.sheet}`));
  console.log(`\nSavant -> Sheet ${APPLY ? '(applied)' : '(would mirror)'}: ${report.toSheet.length}`);
  report.toSheet.forEach((x) => console.log(`  ${x.date} R${x.row} <= ${x.who}`));
  console.log(`\nSheet -> Savant ${APPLY ? '(applied)' : '(would mirror)'}: ${report.toSavant.length}`);
  report.toSavant.forEach((x) => console.log(`  ${x.date} <= ${x.who}`));
  if (report.skippedNoIssue.length) {
    console.log(`\nSkipped (no matching row/issue, needs human): ${report.skippedNoIssue.length}`);
    report.skippedNoIssue.forEach((x) => console.log(`  ${x.date} (${x.side}) ${x.who}`));
  }
}
process.exit(report.conflict.length ? 2 : 0); // exit 2 signals unresolved conflicts
