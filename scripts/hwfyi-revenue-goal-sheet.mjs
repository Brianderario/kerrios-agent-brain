#!/usr/bin/env node
/**
 * Ensure/read the Hardware FYI CY2026 revenue-goal tracker tab.
 *
 * The canonical HWFYI Sheet remains the source of truth. This script creates a
 * dedicated "CY2026 Revenue Goal" tab in that sheet, with a summary block and a
 * revenue ledger header. It does not overwrite existing ledger rows.
 *
 * Usage:
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --ensure
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --seed-contract-breakdown
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --check
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --read
 *
 * Exit codes: 0 = ok · 3 = Sheets scope/permission missing · 1 = hard error
 */
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const GDOCS_DIR = join(homedir(), ".kerri-chief", "kerri-gdocs-mcp");
const require = createRequire(join(GDOCS_DIR, "package.json"));
const { google } = require("googleapis");
const { OAuth2Client } = require("google-auth-library");

const DEFAULT_SPREADSHEET_ID = "1mXauTrY5fTgQURfCE1VU2u65hc5nxd6waRVss-mcgYk";
const TAB = "CY2026 Revenue Goal";
const GOAL_AMOUNT = 1000000;
const SUMMARY_ROWS = [
  ["Hardware FYI CY2026 Revenue Goal", "", "", ""],
  ["Goal year", "2026", "Updated by", "Kerri / Brian"],
  ["Top-line revenue goal", GOAL_AMOUNT, "Basis", "CY2026 Hardware FYI earned/booked revenue; cash status tracked separately"],
  ["Booked/earned revenue", "", "Source", "Validated from Contract Breakdown / Revenue tabs / contracts"],
  ["Collected cash", "", "Source", "Stripe / invoice / payment evidence"],
  ["Open pipeline", "", "Source", "Active deal ledger rows"],
  ["Weighted pipeline", "", "Formula", "Sum of ledger amount * probability for open rows"],
  ["Remaining to goal", "=B3-B4", "Formula", "Goal minus booked/earned revenue"],
  ["Last verified at", "", "Rule", "Update only after live sheet/payment/source check"],
  ["Freshness note", "", "Rule", "If this tab is stale, automations must label revenue numbers as not current"],
];
const LEDGER_START_ROW = 13;
const LEDGER_HEADER = [
  "recordId",
  "company",
  "jobId",
  "revenueCategory",
  "product",
  "amount",
  "status",
  "probability",
  "weightedAmount",
  "expectedCloseDate",
  "runMonth",
  "sourceSurface",
  "sourcePointer",
  "evidence",
  "owner",
  "nextAction",
  "lastVerifiedAt",
  "notes",
];
const AUTO_SEED_NOTE = "Auto-seeded by scripts/hwfyi-revenue-goal-sheet.mjs --seed-contract-breakdown";

function hasFlag(flag) {
  return process.argv.includes(`--${flag}`);
}
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function loadEnv() {
  const envPath = join(GDOCS_DIR, ".env");
  if (!existsSync(envPath)) throw new Error(`Missing gdocs .env at ${envPath}`);
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
  for (const k of ["GDOCS_CLIENT_ID", "GDOCS_CLIENT_SECRET", "GDOCS_REFRESH_TOKEN"]) {
    if (!env[k]) throw new Error(`Missing ${k} in ${envPath}`);
  }
  return env;
}
function scopeIssue(err) {
  const msg = String(err && (err.message || err));
  return /insufficient|scope|PERMISSION_DENIED|forbidden|invalid_grant|403|not[\s_]?found|404/i.test(msg);
}
async function sheetsClient() {
  const env = loadEnv();
  const auth = new OAuth2Client(env.GDOCS_CLIENT_ID, env.GDOCS_CLIENT_SECRET);
  auth.setCredentials({ refresh_token: env.GDOCS_REFRESH_TOKEN });
  return google.sheets({ version: "v4", auth });
}
async function getMeta(sheets, spreadsheetId) {
  return sheets.spreadsheets.get({ spreadsheetId });
}
function findSheet(meta, title) {
  return (meta.data.sheets || []).find((s) => s.properties.title === title);
}
async function ensureTab(sheets, spreadsheetId) {
  let meta = await getMeta(sheets, spreadsheetId);
  let sheet = findSheet(meta, TAB);
  if (!sheet) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: TAB,
              gridProperties: { rowCount: 1000, columnCount: LEDGER_HEADER.length },
            },
          },
        }],
      },
    });
    meta = await getMeta(sheets, spreadsheetId);
    sheet = findSheet(meta, TAB);
  }

  const summary = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB}'!A1:D10`,
  });
  const existingTitle = summary.data.values?.[0]?.[0] || "";
  if (existingTitle !== SUMMARY_ROWS[0][0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB}'!A1:D10`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: SUMMARY_ROWS },
    });
  }

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB}'!A${LEDGER_START_ROW}:R${LEDGER_START_ROW}`,
  });
  const existingHeader = header.data.values?.[0] || [];
  if (existingHeader.join("\t") !== LEDGER_HEADER.join("\t")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB}'!A${LEDGER_START_ROW}:R${LEDGER_START_ROW}`,
      valueInputOption: "RAW",
      requestBody: { values: [LEDGER_HEADER] },
    });
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 14 },
                backgroundColor: { red: 0.9, green: 0.94, blue: 0.98 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: LEDGER_START_ROW - 1, endRowIndex: LEDGER_START_ROW },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                backgroundColor: { red: 0.93, green: 0.93, blue: 0.93 },
              },
            },
            fields: "userEnteredFormat(textFormat,backgroundColor)",
          },
        },
        {
          updateSheetProperties: {
            properties: { sheetId: sheet.properties.sheetId, gridProperties: { frozenRowCount: LEDGER_START_ROW } },
            fields: "gridProperties.frozenRowCount",
          },
        },
      ],
    },
  });
}
async function readSummary(sheets, spreadsheetId) {
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB}'!A1:R30`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return result.data.values || [];
}
function printRows(rows) {
  for (const row of rows) console.log(row.map((v) => String(v ?? "")).join("\t"));
}
function slug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "unknown";
}
function parseSheetDate(value) {
  if (typeof value === "number") return new Date(Math.round((value - 25569) * 86400 * 1000));
  const d = new Date(value);
  return d;
}
async function seedFromContractBreakdown(sheets, spreadsheetId) {
  await ensureTab(sheets, spreadsheetId);
  const source = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: "'Contract Breakdown'!A1:E1000",
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const rows = (source.data.values || []).slice(1).filter((r) => r.some((v) => v !== ""));
  const byRecord = new Map();
  let rowCount = 0;
  let total = 0;
  for (const row of rows) {
    const company = row[0] || "";
    const amount = Number(row[3] || 0);
    const date = parseSheetDate(row[4]);
    if (!company || !Number.isFinite(amount) || Number.isNaN(date.getTime())) continue;
    if (date.getUTCFullYear() !== 2026) continue;
    rowCount += 1;
    total += amount;
    const recordId = `contract-breakdown-2026-${slug(company)}`;
    const current = byRecord.get(recordId) || { company, amount: 0 };
    current.amount += amount;
    if (company.length > current.company.length) current.company = company;
    byRecord.set(recordId, current);
  }

  const now = new Date().toISOString();
  const summaryUpdates = [
    { range: `'${TAB}'!B4`, values: [[Math.round(total * 100) / 100]] },
    { range: `'${TAB}'!B9`, values: [[now]] },
    {
      range: `'${TAB}'!B10`,
      values: [[`Seeded from live Contract Breakdown tab (${rowCount} CY2026 rows). Cash collection and open pipeline not yet reconciled.`]],
    },
  ];
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: { valueInputOption: "USER_ENTERED", data: summaryUpdates },
  });

  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${TAB}'!A${LEDGER_START_ROW + 1}:R1000`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const existingRows = existing.data.values || [];

  const manualRows = existingRows.filter((row) => (row[17] || "") !== AUTO_SEED_NOTE);
  const generatedRows = [];
  for (const [recordId, entry] of [...byRecord.entries()].sort((a, b) => a[1].company.localeCompare(b[1].company))) {
    const company = entry.company;
    const amount = entry.amount;
    const rounded = Math.round(amount * 100) / 100;
    generatedRows.push([
      recordId,
      company,
      "",
      "booked-earned",
      "Contract Breakdown 2026 rollup",
      rounded,
      "booked-earned",
      1,
      rounded,
      "",
      "CY2026",
      "Contract Breakdown",
      "Sum of 2026-dated rows by company",
      `${rowCount} total CY2026 source rows in Contract Breakdown; row is company rollup`,
      "Kerri / Brian",
      "Reconcile cash collection and open pipeline separately",
      now,
      AUTO_SEED_NOTE,
    ]);
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${TAB}'!A${LEDGER_START_ROW + 1}:R1000`,
  });
  const finalRows = [...manualRows, ...generatedRows];
  if (finalRows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${TAB}'!A${LEDGER_START_ROW + 1}:R${LEDGER_START_ROW + finalRows.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: finalRows },
    });
  }
  console.log(
    `hwfyi-revenue-goal-sheet: seeded Contract Breakdown rollup ${Math.round(total * 100) / 100} from ${rowCount} CY2026 rows (${manualRows.length} manual kept, ${generatedRows.length} generated)`
  );
}
async function main() {
  const spreadsheetId = arg("spreadsheet", DEFAULT_SPREADSHEET_ID);
  const sheets = await sheetsClient();
  try {
    if (hasFlag("ensure")) {
      await ensureTab(sheets, spreadsheetId);
      console.log(`hwfyi-revenue-goal-sheet: ensured "${TAB}" in ${spreadsheetId}`);
      return;
    }
    if (hasFlag("seed-contract-breakdown")) {
      await seedFromContractBreakdown(sheets, spreadsheetId);
      return;
    }
    if (hasFlag("check")) {
      const meta = await getMeta(sheets, spreadsheetId);
      const sheet = findSheet(meta, TAB);
      if (!sheet) throw new Error(`Missing "${TAB}" tab in ${spreadsheetId}`);
      const rows = await readSummary(sheets, spreadsheetId);
      const header = rows[LEDGER_START_ROW - 1] || [];
      if ((rows[0] || [])[0] !== SUMMARY_ROWS[0][0]) throw new Error("Summary title missing");
      if (header.join("\t") !== LEDGER_HEADER.join("\t")) throw new Error("Ledger header mismatch");
      console.log(`hwfyi-revenue-goal-sheet: "${TAB}" exists with expected summary/header`);
      return;
    }
    if (hasFlag("read")) {
      const rows = await readSummary(sheets, spreadsheetId);
      printRows(rows);
      return;
    }
    console.error("Usage: node scripts/hwfyi-revenue-goal-sheet.mjs --ensure|--check|--read [--spreadsheet <id>]");
    process.exit(1);
  } catch (err) {
    if (scopeIssue(err)) {
      console.error(
        `hwfyi-revenue-goal-sheet: SHEETS_ACCESS_DENIED — ${err.message || err}\n` +
        "Run: node ~/.kerri-chief/kerri-gdocs-mcp/setup-auth.mjs"
      );
      process.exit(3);
    }
    throw err;
  }
}

main().catch((err) => {
  console.error(`hwfyi-revenue-goal-sheet: ${err.message || err}`);
  process.exit(1);
});
