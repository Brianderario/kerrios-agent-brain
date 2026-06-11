#!/usr/bin/env node
/**
 * Ensure/read the Hardware FYI CY2026 revenue-goal tracker tab.
 *
 * The canonical HWFYI Sheet remains the source of truth. This script creates a
 * readable "CY2026 Revenue Goal" pipeline board at the top of the tab and keeps
 * a structured automation ledger lower on the same tab.
 *
 * Usage:
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --ensure
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --seed-contract-breakdown
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --seed-pipeline
 *   node scripts/hwfyi-revenue-goal-sheet.mjs --pipeline-summary
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
  ["Hardware FYI CY2026 Revenue Pipeline", "", "", ""],
  ["Goal", "Closed Won", "Pipeline Amount", "Gap to Goal"],
  [GOAL_AMOUNT, "", "", "=A3-B3"],
  ["Last verified at", "", "Freshness note", ""],
];
const BOARD_HEADER_ROW = 6;
const LEDGER_START_ROW = 80;
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
const AUTO_PIPELINE_SEED_NOTE = "Auto-seeded by scripts/hwfyi-revenue-goal-sheet.mjs --seed-pipeline from 2026-06-06 close-list evidence";
const PIPELINE_STATUSES = ["Prospect", "Interest", "Contract Won", "Contract Lost"];
const OPEN_PIPELINE_STATUSES = new Set(["Prospect", "Interest"]);
const PIPELINE_VIEW_TERMS = {
  "pipeline-2026-colab-renewal": [
    "Package A: $15K content-first renewal with authored review / campaign structure and newsletter support.",
    "Package B: $10K lower-friction renewal focused on the next newsletter/content experiment.",
    "Package C: $5K smaller test option if they want to restart with minimum commitment.",
  ],
  "pipeline-2026-aris-machina": [
    "Package A: about $15K content-led package, anchored on custom content plus HWFYI distribution.",
    "Package B: about $12K lighter test package for proving Protos demand before a larger push.",
    "Package C: Partner Program / recurring newsletter route around $10K, with monthly framing discussed in-thread.",
  ],
  "pipeline-2026-neural-concept": [
    "Starting point: $15K for content-led US awareness plus three placements.",
    "Mid option: $10K for a lighter placement / partner-program mix.",
    "Entry option: $5K for three primary placements.",
  ],
  "pipeline-2026-zenode-q3": [
    "Buyer counter: Q3 budget around $5K.",
    "Requested scope: one custom article, two primary placements, Tools From Our Sponsors listing, and at least one non-Zenode EE piece.",
    "Brian decision: accept friend-rate scope or counter with tighter deliverables.",
  ],
};
const PIPELINE_SEED_ROWS = [
  {
    recordId: "pipeline-2026-colab-renewal",
    company: "CoLab",
    jobId: "H0030",
    revenueCategory: "open-pipeline",
    product: "Content-led renewal / newsletter placements",
    amount: 15000,
    status: "Interest",
    probability: 0.7,
    expectedCloseDate: "2026-06-20",
    sourcePointer: "hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Peter Attia call happened; Brian sent Package A/B/C on 2026-05-29; prior Q4/Q1 spend.",
    nextAction: "Follow up with forced-choice Package A vs Package B close.",
  },
  {
    recordId: "pipeline-2026-aris-machina",
    company: "Aris Machina",
    jobId: "H0001",
    revenueCategory: "open-pipeline",
    product: "Content-led HWFYI package",
    amount: 15000,
    status: "Interest",
    probability: 0.65,
    expectedCloseDate: "2026-06-18",
    sourcePointer: "brain/wiki/companies/aris-machina.md; hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Package follow-up sent 2026-06-02; Sid replied 2026-06-03 that he would decide with William.",
    nextAction: "Hold late-June/July inventory and ask whether they want Package A or B.",
  },
  {
    recordId: "pipeline-2026-neural-concept",
    company: "Neural Concept",
    jobId: "H0024",
    revenueCategory: "open-pipeline",
    product: "US awareness package",
    amount: 15000,
    status: "Interest",
    probability: 0.6,
    expectedCloseDate: "2026-06-20",
    sourcePointer: "brain/wiki/companies/neural-concept.md; hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Call happened; $15K/$10K/$5K package options sent; Ariane asked audience-fit questions and received detailed answer.",
    nextAction: "Recommend $15K content plus three placements as the US awareness starter.",
  },
  {
    recordId: "pipeline-2026-xscape-photonics-wireside",
    company: "Xscape Photonics / Wireside",
    jobId: "H0041",
    revenueCategory: "open-pipeline",
    product: "2026 pilot menu / webinar / event package",
    amount: 0,
    status: "Interest",
    probability: 0,
    expectedCloseDate: "2026-06-25",
    sourcePointer: "brain/wiki/companies/xscape-photonics.md; hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Founder introduced marketing/PR team; call happened; Nick asked for pricing and 2027 brochure. No 2026 pricing is recorded as sent.",
    nextAction: "Send source-backed 2026 pilot menu only after Brian chooses the terms.",
  },
  {
    recordId: "pipeline-2026-ptc-onshape-repair",
    company: "PTC / Onshape",
    jobId: "",
    revenueCategory: "open-pipeline",
    product: "H2 digital / webinar activation",
    amount: 0,
    status: "Interest",
    probability: 0,
    expectedCloseDate: "2026-06-24",
    sourcePointer: "hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Inbound form, follow-up, scheduled meeting, missed 2026-06-05 call. No new H2 pricing is recorded as sent.",
    nextAction: "Repair scheduling first; add pricing only after source-backed terms are sent.",
  },
  {
    recordId: "pipeline-2026-protolabs-renewal",
    company: "Protolabs",
    jobId: "",
    revenueCategory: "open-pipeline",
    product: "Analytics-review renewal",
    amount: 0,
    status: "Interest",
    probability: 0,
    expectedCloseDate: "2026-06-24",
    sourcePointer: "hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Existing campaign completed; analytics report ready; top performer identified. No renewal pricing is recorded as sent.",
    nextAction: "Book analytics review; add pricing only after terms are sent.",
  },
  {
    recordId: "pipeline-2026-dirac-event",
    company: "Dirac",
    jobId: "",
    revenueCategory: "open-pipeline",
    product: "SF Tech Week / webinar / event slot",
    amount: 0,
    status: "Interest",
    probability: 0,
    expectedCloseDate: "2026-06-28",
    sourcePointer: "hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-1",
    evidence: "Existing sponsor; Gigi said both events sound interesting and asked for additional details. No new event/webinar pricing is recorded as sent.",
    nextAction: "Send details; assign value only after terms are sent.",
  },
  {
    recordId: "pipeline-2026-zenode-q3",
    company: "Zenode",
    jobId: "H0013",
    revenueCategory: "open-pipeline",
    product: "Q3 small H2 package",
    amount: 5000,
    status: "Interest",
    probability: 0.55,
    expectedCloseDate: "2026-06-21",
    sourcePointer: "brain/wiki/companies/zenode.md; hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-2",
    evidence: "Brandon counter-proposed a Q3 $5K-shaped content/placement package after package-options reply.",
    nextAction: "Decide whether to accept friend-rate scope or counter at a middle tier.",
  },
  {
    recordId: "pipeline-2026-simplexity-newsletter",
    company: "Simplexity Product Development",
    jobId: "H0082",
    revenueCategory: "open-pipeline",
    product: "Newsletter sponsorship",
    amount: 0,
    status: "Prospect",
    probability: 0,
    expectedCloseDate: "2026-06-30",
    sourcePointer: "brain/wiki/companies/simplexity-product-development.md",
    evidence: "Michael asked how much it would cost to have Simplexity in HWFYI for a few weeks or months; Brian-sender follow-up sent 2026-06-07.",
    nextAction: "Wait for budget/timing response; move to Interest if he asks for options or pricing.",
  },
  {
    recordId: "pipeline-2026-sosv-cross-promo",
    company: "SOSV",
    jobId: "",
    revenueCategory: "lost-pipeline",
    product: "Paid ad placement",
    amount: 0,
    status: "Contract Lost",
    probability: 0,
    expectedCloseDate: "",
    sourcePointer: "hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-3",
    evidence: "They asked for cross-promotion, not paid sponsorship.",
    nextAction: "Do not prioritize as paid revenue unless they accept a cash placement.",
  },
  {
    recordId: "pipeline-2026-fleetzero-paid",
    company: "Fleetzero",
    jobId: "H0054",
    revenueCategory: "lost-pipeline",
    product: "Paid sponsorship",
    amount: 0,
    status: "Contract Lost",
    probability: 0,
    expectedCloseDate: "",
    sourcePointer: "brain/wiki/companies/fleetzero.md; hwfyi-cy2026-high-likelihood-close-list-2026-06-06.md#tier-3",
    evidence: "Matt explicitly declined paid opportunity and asked only about earned/editorial paths.",
    nextAction: "Keep organic/editorial relationship only; no sponsorship nudge.",
  },
];

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
function normalizeTitle(value) {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}
function findSheet(meta, title) {
  const all = meta.data.sheets || [];
  const exact = all.find((s) => s.properties.title === title);
  if (exact) return exact;
  // Tolerate case/whitespace drift in the tab title, but only when exactly one
  // tab normalizes to the same string. This can never match a different tab
  // such as "CY2026 Revenue Goal & Inventory" because normalization does not
  // strip suffixes, only case and whitespace.
  const wanted = normalizeTitle(title);
  const fuzzy = all.filter((s) => normalizeTitle(s.properties.title) === wanted);
  if (fuzzy.length === 1) {
    console.error(`hwfyi-revenue-goal-sheet: note: resolved tab by normalized title match: "${fuzzy[0].properties.title}"`);
    return fuzzy[0];
  }
  return undefined;
}
function quoteTab(title) {
  return `'${String(title).replace(/'/g, "''")}'`;
}
function gridRowCount(sheet) {
  return sheet?.properties?.gridProperties?.rowCount || 1000;
}
async function resolveTab(sheets, spreadsheetId) {
  const meta = await getMeta(sheets, spreadsheetId);
  const sheet = findSheet(meta, TAB);
  if (!sheet) {
    const titles = (meta.data.sheets || []).map((s) => `"${s.properties.title}"`).join(", ");
    throw new Error(`Missing "${TAB}" tab in ${spreadsheetId}. Live tabs: ${titles}. Run --ensure first.`);
  }
  return sheet;
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
  const tabRef = quoteTab(sheet.properties.title);

  const summary = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabRef}!A1:D4`,
  });
  const existingTitle = summary.data.values?.[0]?.[0] || "";
  if (existingTitle !== SUMMARY_ROWS[0][0]) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabRef}!A1:D4`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: SUMMARY_ROWS },
    });
  }

  const header = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabRef}!A${LEDGER_START_ROW}:R${LEDGER_START_ROW}`,
  });
  const existingHeader = header.data.values?.[0] || [];
  if (existingHeader.join("\t") !== LEDGER_HEADER.join("\t")) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabRef}!A${LEDGER_START_ROW}:R${LEDGER_START_ROW}`,
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
            properties: { sheetId: sheet.properties.sheetId, gridProperties: { frozenRowCount: BOARD_HEADER_ROW } },
            fields: "gridProperties.frozenRowCount",
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId: sheet.properties.sheetId, dimension: "COLUMNS", startIndex: 0, endIndex: 4 },
            properties: { pixelSize: 260 },
            fields: "pixelSize",
          },
        },
      ],
    },
  });
}
async function readSummary(sheets, spreadsheetId) {
  const sheet = await resolveTab(sheets, spreadsheetId);
  const title = sheet.properties.title;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab(title)}!A1:R${gridRowCount(sheet)}`,
    valueRenderOption: "FORMATTED_VALUE",
  });
  return result.data.values || [];
}
async function readLedgerRows(sheets, spreadsheetId) {
  const sheet = await resolveTab(sheets, spreadsheetId);
  const title = sheet.properties.title;
  const result = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteTab(title)}!A${LEDGER_START_ROW + 1}:R${gridRowCount(sheet)}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  return (result.data.values || []).filter((row) => row.some((v) => v !== ""));
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
function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}
function numericCell(value) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(/[$,]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}
function parseSheetDate(value) {
  if (typeof value === "number") return new Date(Math.round((value - 25569) * 86400 * 1000));
  const d = new Date(value);
  return d;
}
function validatePipelineStatus(status) {
  if (!PIPELINE_STATUSES.includes(status)) {
    throw new Error(`Invalid pipeline status "${status}". Expected one of: ${PIPELINE_STATUSES.join(", ")}`);
  }
}
function buildPipelineSeedRow(entry, now) {
  validatePipelineStatus(entry.status);
  const amount = roundMoney(entry.amount);
  const probability = Number(entry.probability);
  if (!Number.isFinite(probability) || probability < 0 || probability > 1) {
    throw new Error(`Invalid probability for ${entry.recordId}: ${entry.probability}`);
  }
  const weightedAmount = OPEN_PIPELINE_STATUSES.has(entry.status) ? roundMoney(amount * probability) : 0;
  return [
    entry.recordId,
    entry.company,
    entry.jobId || "",
    entry.revenueCategory,
    entry.product,
    amount,
    entry.status,
    probability,
    weightedAmount,
    entry.expectedCloseDate || "",
    "CY2026",
    "KerriOS close-list / mailbox-derived evidence",
    entry.sourcePointer,
    entry.evidence,
    "Kerri / Brian",
    entry.nextAction,
    now,
    AUTO_PIPELINE_SEED_NOTE,
  ];
}
function summarizeLedger(rows) {
  let booked = 0;
  let open = 0;
  let weighted = 0;
  const byStatus = Object.fromEntries(PIPELINE_STATUSES.map((status) => [status, 0]));
  for (const row of rows) {
    const status = row[6] || "";
    if (status in byStatus) byStatus[status] += 1;
    const amount = numericCell(row[5]);
    const weightedAmount = numericCell(row[8]);
    if (status === "Contract Won") booked += amount;
    if (OPEN_PIPELINE_STATUSES.has(status)) {
      open += amount;
      weighted += weightedAmount;
    }
  }
  return {
    booked: roundMoney(booked),
    open: roundMoney(open),
    weighted: roundMoney(weighted),
    byStatus,
  };
}
function formatCurrency(value) {
  return `$${roundMoney(value).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function pipelineCard(row) {
  const [recordId, company, , , product, amount, status] = row;
  validatePipelineStatus(status);
  const amountLabel = OPEN_PIPELINE_STATUSES.has(status) && numericCell(amount) <= 0
    ? "TBD (no pricing sent yet)"
    : formatCurrency(amount);
  const lines = [
    `${company} - ${amountLabel}`,
    `Products: ${product || "To confirm"}`,
  ];
  const terms = PIPELINE_VIEW_TERMS[recordId] || [];
  if (terms.length) lines.push(`Proposed terms:\n${terms.join("\n\n")}`);
  return lines.join("\n");
}
function buildBoardRows(rows) {
  const byStatus = Object.fromEntries(PIPELINE_STATUSES.map((status) => [status, []]));
  for (const row of rows) {
    const status = row[6] || "";
    if (!PIPELINE_STATUSES.includes(status)) continue;
    byStatus[status].push(row);
  }
  for (const status of PIPELINE_STATUSES) {
    byStatus[status].sort((a, b) => numericCell(b[5]) - numericCell(a[5]) || String(a[1]).localeCompare(String(b[1])));
  }
  const maxRows = Math.max(...PIPELINE_STATUSES.map((status) => byStatus[status].length));
  const boardRows = [];
  for (let i = 0; i < maxRows; i += 1) {
    boardRows.push(PIPELINE_STATUSES.map((status) => {
      const row = byStatus[status][i];
      return row ? pipelineCard(row) : "";
    }));
  }
  return boardRows;
}
async function renderPipelineView(sheets, spreadsheetId, rows, now) {
  const sheet = await resolveTab(sheets, spreadsheetId);
  const tabRef = quoteTab(sheet.properties.title);
  const summary = summarizeLedger(rows);
  const summaryRows = [
    SUMMARY_ROWS[0],
    SUMMARY_ROWS[1],
    [GOAL_AMOUNT, summary.booked, summary.open, GOAL_AMOUNT - summary.booked],
    ["Last verified at", now, "Freshness note", `Readable pipeline view. Statuses: Prospect=${summary.byStatus.Prospect}, Interest=${summary.byStatus.Interest}, Contract Won=${summary.byStatus["Contract Won"]}, Contract Lost=${summary.byStatus["Contract Lost"]}. Cash collection still requires Stripe/invoice reconciliation.`],
    ["", "", "", ""],
    PIPELINE_STATUSES,
  ];
  const boardRows = buildBoardRows(rows);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabRef}!A1:R${LEDGER_START_ROW - 1}`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${tabRef}!A1:D${BOARD_HEADER_ROW + boardRows.length}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [...summaryRows, ...boardRows] },
  });
  const boardRowCount = Math.max(boardRows.length, 1);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          unmergeCells: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
          },
        },
        {
          mergeCells: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
            mergeType: "MERGE_ALL",
          },
        },
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true, fontSize: 14 },
                horizontalAlignment: "CENTER",
                backgroundColor: { red: 0.9, green: 0.94, blue: 0.98 },
              },
            },
            fields: "userEnteredFormat(textFormat,horizontalAlignment,backgroundColor)",
          },
        },
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: 1, endRowIndex: 3, startColumnIndex: 0, endColumnIndex: 4 },
            cell: { userEnteredFormat: { textFormat: { bold: true }, horizontalAlignment: "CENTER" } },
            fields: "userEnteredFormat(textFormat,horizontalAlignment)",
          },
        },
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: BOARD_HEADER_ROW - 1, endRowIndex: BOARD_HEADER_ROW, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                textFormat: { bold: true },
                horizontalAlignment: "CENTER",
                backgroundColor: { red: 0.93, green: 0.93, blue: 0.93 },
              },
            },
            fields: "userEnteredFormat(textFormat,horizontalAlignment,backgroundColor)",
          },
        },
        {
          repeatCell: {
            range: { sheetId: sheet.properties.sheetId, startRowIndex: BOARD_HEADER_ROW, endRowIndex: BOARD_HEADER_ROW + boardRowCount, startColumnIndex: 0, endColumnIndex: 4 },
            cell: {
              userEnteredFormat: {
                wrapStrategy: "WRAP",
                verticalAlignment: "TOP",
              },
            },
            fields: "userEnteredFormat(wrapStrategy,verticalAlignment)",
          },
        },
        {
          updateDimensionProperties: {
            range: { sheetId: sheet.properties.sheetId, dimension: "ROWS", startIndex: BOARD_HEADER_ROW, endIndex: BOARD_HEADER_ROW + boardRowCount },
            properties: { pixelSize: 145 },
            fields: "pixelSize",
          },
        },
      ],
    },
  });
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
  const tabSheet = await resolveTab(sheets, spreadsheetId);
  const tabRef = quoteTab(tabSheet.properties.title);
  const tabRows = gridRowCount(tabSheet);
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${tabRows}`,
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
      "contract-won",
      "Contract Breakdown 2026 rollup",
      rounded,
      "Contract Won",
      1,
      rounded,
      "",
      "CY2026",
      "Contract Breakdown",
      "Sum of 2026-dated rows by company",
      `${rowCount} total CY2026 source rows in Contract Breakdown; row is company rollup`,
      "Kerri / Brian",
      "Reconcile cash collection separately; retain open pipeline rows separately",
      now,
      AUTO_SEED_NOTE,
    ]);
  }

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${tabRows}`,
  });
  const finalRows = [...manualRows, ...generatedRows];
  if (finalRows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${LEDGER_START_ROW + finalRows.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: finalRows },
    });
  }
  await renderPipelineView(sheets, spreadsheetId, finalRows, now);
  console.log(
    `hwfyi-revenue-goal-sheet: seeded Contract Breakdown rollup ${Math.round(total * 100) / 100} from ${rowCount} CY2026 rows (${manualRows.length} manual kept, ${generatedRows.length} generated)`
  );
}
async function seedPipeline(sheets, spreadsheetId) {
  await ensureTab(sheets, spreadsheetId);
  const now = new Date().toISOString();
  const tabSheet = await resolveTab(sheets, spreadsheetId);
  const tabRef = quoteTab(tabSheet.properties.title);
  const tabRows = gridRowCount(tabSheet);
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${tabRows}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const existingRows = existing.data.values || [];
  const preservedRows = existingRows.filter((row) => (row[17] || "") !== AUTO_PIPELINE_SEED_NOTE);
  const generatedRows = PIPELINE_SEED_ROWS
    .map((entry) => buildPipelineSeedRow(entry, now))
    .sort((a, b) => {
      const statusSort = { Interest: 0, Prospect: 1, "Contract Lost": 2, "Contract Won": 3 };
      return (statusSort[a[6]] - statusSort[b[6]]) || String(a[1]).localeCompare(String(b[1]));
    });
  const finalRows = [...preservedRows, ...generatedRows];
  const summary = summarizeLedger(finalRows);

  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${tabRows}`,
  });
  if (finalRows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabRef}!A${LEDGER_START_ROW + 1}:R${LEDGER_START_ROW + finalRows.length}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: finalRows },
    });
  }
  await renderPipelineView(sheets, spreadsheetId, finalRows, now);
  console.log(
    `hwfyi-revenue-goal-sheet: seeded pipeline ${summary.open} open / ${summary.weighted} weighted (` +
    `Prospect=${summary.byStatus.Prospect}, Interest=${summary.byStatus.Interest}, ` +
    `Contract Won=${summary.byStatus["Contract Won"]}, Contract Lost=${summary.byStatus["Contract Lost"]}; ` +
    `${preservedRows.length} preserved, ${generatedRows.length} generated)`
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
    if (hasFlag("seed-pipeline")) {
      await seedPipeline(sheets, spreadsheetId);
      return;
    }
    if (hasFlag("check")) {
      const rows = await readSummary(sheets, spreadsheetId);
      const header = rows[LEDGER_START_ROW - 1] || [];
      if ((rows[0] || [])[0] !== SUMMARY_ROWS[0][0]) throw new Error("Summary title missing");
      if (header.join("\t") !== LEDGER_HEADER.join("\t")) throw new Error("Ledger header mismatch");
      const ledgerRows = await readLedgerRows(sheets, spreadsheetId);
      const invalidStatuses = ledgerRows
        .map((row) => row[6] || "")
        .filter((status) => status && !PIPELINE_STATUSES.includes(status));
      if (invalidStatuses.length) {
        throw new Error(`Invalid pipeline statuses in ledger: ${[...new Set(invalidStatuses)].join(", ")}`);
      }
      console.log(`hwfyi-revenue-goal-sheet: "${TAB}" exists with expected summary/header/statuses`);
      return;
    }
    if (hasFlag("pipeline-summary")) {
      const ledgerRows = await readLedgerRows(sheets, spreadsheetId);
      const summary = summarizeLedger(ledgerRows);
      console.log(JSON.stringify({
        tab: TAB,
        booked: summary.booked,
        open: summary.open,
        weighted: summary.weighted,
        byStatus: summary.byStatus,
      }, null, 2));
      return;
    }
    if (hasFlag("read")) {
      const rows = await readSummary(sheets, spreadsheetId);
      printRows(rows);
      return;
    }
    console.error("Usage: node scripts/hwfyi-revenue-goal-sheet.mjs --ensure|--seed-contract-breakdown|--seed-pipeline|--pipeline-summary|--check|--read [--spreadsheet <id>]");
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
