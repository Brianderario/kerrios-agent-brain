#!/usr/bin/env node
/**
 * sheets-append.mjs — mirror the KerriOS lead pool into the Hardware FYI CRM Google Sheet.
 *
 * Upserts leads (keyed by jobId) into a "Leads" tab of the canonical HWFYI Sheet.
 * Reuses the kerri-gdocs MCP OAuth credentials (~/.kerri-chief/kerri-gdocs-mcp/.env)
 * and that package's node_modules (googleapis, google-auth-library) — no new install.
 *
 * REQUIRES the spreadsheets scope on the kerri-gdocs OAuth token. The default kerri-gdocs
 * setup only grants documents+drive.file+tasks; setup-auth.mjs has been updated to add
 * https://www.googleapis.com/auth/spreadsheets but Brian must re-run it ONCE for this to work.
 * Until then this script falls back to writing a CSV and exits with code 3.
 *
 * Usage:
 *   node scripts/sheets-append.mjs [--leads data/leads-master.json] [--since <ISO>]
 *        [--spreadsheet <id>] [--tab Leads] [--csv-out <path>]
 *
 * Exit codes: 0 = synced to Sheet · 3 = scope/permission missing, wrote CSV fallback · 1 = hard error
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join, isAbsolute } from "node:path";

const GDOCS_DIR = join(homedir(), ".kerri-chief", "kerri-gdocs-mcp");
const require = createRequire(join(GDOCS_DIR, "package.json"));
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const REPO_ROOT = process.env.KERRIOS_ROOT ||
  join(homedir(), "Projects", "kerrios-agent-brain");
const DEFAULT_SPREADSHEET_ID = "1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk";
const TAB_DEFAULT = "Leads";
const HEADER = [
  "leadId", "jobId", "company", "domain", "name", "title", "email", "linkedin",
  "lane", "score", "sources", "hookSeed", "status", "addedAt", "lastTouch",
];
const LAST_COL = "O"; // 15 columns A..O

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function resolveRepoPath(p) {
  return isAbsolute(p) ? p : join(REPO_ROOT, p);
}

function loadEnv() {
  const envPath = join(GDOCS_DIR, ".env");
  if (!existsSync(envPath)) die(`Missing gdocs .env at ${envPath}`);
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  for (const k of ["GDOCS_CLIENT_ID", "GDOCS_CLIENT_SECRET", "GDOCS_REFRESH_TOKEN"]) {
    if (!env[k]) die(`Missing ${k} in ${envPath}`);
  }
  return env;
}

function die(msg) {
  console.error(`sheets-append: ${msg}`);
  process.exit(1);
}

function leadKey(l) {
  return l.leadId || l.domain || l.email || "";
}
function leadToRow(l) {
  return [
    leadKey(l), l.jobId || "", l.company || "", l.domain || "", l.name || "", l.title || "",
    l.email || "", l.linkedin || "", l.lane || "",
    l.score != null ? String(l.score) : "",
    Array.isArray(l.sources) ? l.sources.join(", ") : (l.sources || ""),
    l.hookSeed || "", l.status || "", l.addedAt || "", l.lastTouch || "",
  ];
}

function writeCsvFallback(leads, csvOut) {
  const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [HEADER.map(esc).join(",")];
  for (const l of leads) lines.push(leadToRow(l).map(esc).join(","));
  writeFileSync(csvOut, lines.join("\n") + "\n");
}

async function main() {
  const leadsPath = resolveRepoPath(arg("leads", "data/leads-master.json"));
  const since = arg("since", null);
  const spreadsheetId = arg("spreadsheet", DEFAULT_SPREADSHEET_ID);
  const tab = arg("tab", TAB_DEFAULT);
  const csvOut = resolveRepoPath(
    arg("csv-out", `data/leads-crm-export-${new Date().toISOString().slice(0, 10)}.csv`)
  );

  if (!existsSync(leadsPath)) die(`Leads file not found: ${leadsPath}`);
  const pool = JSON.parse(readFileSync(leadsPath, "utf8"));
  let leads = Array.isArray(pool) ? pool : pool.leads || [];
  if (since) leads = leads.filter((l) => (l.lastTouch || l.addedAt || "") >= since);
  if (leads.length === 0) {
    console.log("sheets-append: no leads to sync (after --since filter).");
    process.exit(0);
  }

  const env = loadEnv();
  const auth = new OAuth2Client(env.GDOCS_CLIENT_ID, env.GDOCS_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GDOCS_REFRESH_TOKEN });
  const sheets = google.sheets({ version: "v4", auth });

  try {
    // Ensure the tab exists; create it with a header row if missing.
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const exists = (meta.data.sheets || []).some((s) => s.properties.title === tab);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: tab } } }] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId, range: `${tab}!A1`, valueInputOption: "RAW",
        requestBody: { values: [HEADER] },
      });
    }

    // Read existing rows → map leadId (col A) -> 1-based sheet row number.
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId, range: `${tab}!A2:${LAST_COL}`,
    });
    const rows = existing.data.values || [];
    const rowByKey = new Map();
    rows.forEach((r, i) => { if (r[0]) rowByKey.set(r[0], i + 2); });

    const updates = [];
    const appends = [];
    for (const l of leads) {
      const row = leadToRow(l);
      const key = leadKey(l);
      const at = key && rowByKey.get(key);
      if (at) updates.push({ range: `${tab}!A${at}:${LAST_COL}${at}`, values: [row] });
      else appends.push(row);
    }

    if (updates.length) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: { valueInputOption: "RAW", data: updates },
      });
    }
    if (appends.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId, range: `${tab}!A1`,
        valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
        requestBody: { values: appends },
      });
    }
    console.log(`sheets-append: synced ${leads.length} leads to "${tab}" (${updates.length} updated, ${appends.length} appended).`);
    process.exit(0);
  } catch (err) {
    const msg = String(err && (err.message || err));
    // Before the spreadsheets scope is granted, the drive.file-only token cannot SEE an
    // externally-created sheet — the API returns "Requested entity was not found" (404) rather
    // than a 403. Treat not-found/permission/scope errors all as the "needs re-auth" path.
    const scopeIssue =
      /insufficient|scope|PERMISSION_DENIED|forbidden|invalid_grant|403|not[\s_]?found|404/i.test(msg);
    if (scopeIssue) {
      writeCsvFallback(leads, csvOut);
      console.error(
        `sheets-append: SHEETS_ACCESS_DENIED — could not reach the Sheet (${msg}).\n` +
        `  Most likely the kerri-gdocs OAuth token lacks the spreadsheets scope.\n` +
        `  Wrote CSV fallback: ${csvOut}\n` +
        `  Fix once: re-run  node ~/.kerri-chief/kerri-gdocs-mcp/setup-auth.mjs  ` +
        `(setup-auth now requests the spreadsheets scope), then re-run this script.\n` +
        `  If it still fails after re-auth, verify the --spreadsheet id.`
      );
      process.exit(3);
    }
    writeCsvFallback(leads, csvOut);
    console.error(`sheets-append: error (${msg}). Wrote CSV fallback: ${csvOut}`);
    process.exit(1);
  }
}

main().catch((e) => die(String(e && (e.message || e))));
