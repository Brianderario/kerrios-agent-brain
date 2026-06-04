#!/usr/bin/env node
/**
 * conferences-append.mjs — log conferences/events that HWFYI sponsors, partners,
 * and prospects mention they attend / sponsor / exhibit at / speak at.
 *
 * Writes to the "Conferences" tab of the canonical Hardware FYI CRM Google Sheet.
 * This is an intel log of WHERE OUR CONTACTS SHOW UP (distinct from the "Leads" tab,
 * whose lane=conference rows are HWFYI's own exhibit-prospecting). One row per
 * (event × company) mention. Dedupe key = conference|company|source so re-runs of the
 * meeting sweep don't double-log the same mention.
 *
 * Reuses the kerri-gdocs MCP OAuth credentials (~/.kerri-chief/kerri-gdocs-mcp/.env)
 * and that package's node_modules (googleapis, google-auth-library) — same pattern as
 * sheets-append.mjs. Requires the spreadsheets scope on the kerri-gdocs token (already
 * granted — the Leads tab is written this way).
 *
 * Usage:
 *   node scripts/conferences-append.mjs --rows <path-to-json>   # array of row objects
 *   echo '[{...}]' | node scripts/conferences-append.mjs        # rows on stdin
 *   node scripts/conferences-append.mjs --rows x.json --dry-run # print, don't write
 *
 * Row object fields (all optional except conference + company):
 *   conference, company, jobId, contact, involvement, timing, location,
 *   detail, source, capturedAt, capturedBy
 *
 * Exit codes: 0 = ok · 2 = nothing to write · 3 = scope/permission missing · 1 = hard error
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync, readFileSync as rf } from "node:fs";
import { homedir } from "node:os";
import { join, isAbsolute } from "node:path";

const GDOCS_DIR = join(homedir(), ".kerri-chief", "kerri-gdocs-mcp");
const require = createRequire(join(GDOCS_DIR, "package.json"));
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const REPO_ROOT = process.env.KERRIOS_ROOT ||
  join(homedir(), "Documents", "Documents - Brian's MacBook Air", "KerriOS");
const DEFAULT_SPREADSHEET_ID = "1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk";
const TAB = "Conferences";
const HEADER = [
  "conference", "company", "jobId", "contact", "involvement",
  "timing", "location", "detail", "source", "capturedAt", "capturedBy",
];
const LAST_COL = "K"; // 11 columns A..K

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const hasFlag = (n) => process.argv.includes(`--${n}`);
function die(msg) { console.error(`conferences-append: ${msg}`); process.exit(1); }
function resolveRepoPath(p) { return isAbsolute(p) ? p : join(REPO_ROOT, p); }

function loadEnv() {
  const envPath = join(GDOCS_DIR, ".env");
  if (!existsSync(envPath)) die(`Missing gdocs .env at ${envPath}`);
  const env = {};
  for (const line of rf(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  for (const k of ["GDOCS_CLIENT_ID", "GDOCS_CLIENT_SECRET", "GDOCS_REFRESH_TOKEN"]) {
    if (!env[k]) die(`Missing ${k} in ${envPath}`);
  }
  return env;
}

const norm = (s) => String(s == null ? "" : s).trim().toLowerCase();
function dedupeKey(o) {
  return [norm(o.conference), norm(o.company), norm(o.source)].join("|");
}
function rowToArray(o) {
  return HEADER.map((h) => (o[h] == null ? "" : String(o[h])));
}
function readRows() {
  const rowsArg = arg("rows", null);
  let raw;
  if (rowsArg) {
    const p = resolveRepoPath(rowsArg);
    if (!existsSync(p)) die(`rows file not found: ${p}`);
    raw = readFileSync(p, "utf8");
  } else if (!process.stdin.isTTY) {
    raw = readFileSync(0, "utf8");
  } else {
    die("no rows: pass --rows <file> or pipe JSON on stdin");
  }
  let arr;
  try { arr = JSON.parse(raw); } catch (e) { die(`invalid JSON rows (${e.message})`); }
  if (!Array.isArray(arr)) arr = arr.rows || [];
  return arr.filter((o) => o && (o.conference || o.company));
}

async function main() {
  const spreadsheetId = arg("spreadsheet", DEFAULT_SPREADSHEET_ID);
  const dryRun = hasFlag("dry-run");
  let rows = readRows();
  if (rows.length === 0) { console.log("conferences-append: no rows to write."); process.exit(2); }

  if (dryRun) {
    console.log(`conferences-append [DRY RUN]: ${rows.length} candidate row(s):`);
    for (const r of rows) console.log("  " + JSON.stringify(rowToArray(r)));
    process.exit(0);
  }

  const env = loadEnv();
  const auth = new OAuth2Client(env.GDOCS_CLIENT_ID, env.GDOCS_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GDOCS_REFRESH_TOKEN });
  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Ensure tab + header exist.
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = (meta.data.sheets || []).some((s) => s.properties.title === TAB);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
      });
    }
    const head = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${TAB}!A1:${LAST_COL}1` });
    if (!(head.data.values && head.data.values[0] && head.data.values[0].length)) {
      await sheets.spreadsheets.values.update({
        spreadsheetId, range: `${TAB}!A1`, valueInputOption: "RAW",
        requestBody: { values: [HEADER] },
      });
    }

    // Read existing rows → dedupe set on conference|company|source.
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${TAB}!A2:${LAST_COL}` });
    const seen = new Set();
    for (const r of existing.data.values || []) {
      seen.add([norm(r[0]), norm(r[1]), norm(r[8])].join("|"));
    }

    const fresh = [];
    let skipped = 0;
    for (const o of rows) {
      const k = dedupeKey(o);
      if (seen.has(k)) { skipped++; continue; }
      seen.add(k);
      fresh.push(rowToArray(o));
    }

    if (fresh.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId, range: `${TAB}!A1`,
        valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
        requestBody: { values: fresh },
      });
    }
    console.log(`conferences-append: ${fresh.length} appended, ${skipped} already present (dedup).`);
    process.exit(0);
  } catch (err) {
    const msg = String(err && (err.message || err));
    const scopeIssue = /insufficient|scope|PERMISSION_DENIED|forbidden|invalid_grant|403|not[\s_]?found|404/i.test(msg);
    if (scopeIssue) {
      console.error(
        `conferences-append: SHEETS_ACCESS_DENIED (${msg}).\n` +
        `  The kerri-gdocs OAuth token likely lacks the spreadsheets scope.\n` +
        `  Fix once: re-run  node ~/.kerri-chief/kerri-gdocs-mcp/setup-auth.mjs  then retry.`
      );
      process.exit(3);
    }
    die(`error (${msg})`);
  }
}

main().catch((e) => die(String(e && (e.message || e))));
