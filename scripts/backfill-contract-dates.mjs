#!/usr/bin/env node
// backfill-contract-dates.mjs
//
// PROPOSE-ONLY script that scans deal files in brain/wiki/deals/ for active
// or dormant deals missing the contract_end_date frontmatter field.
//
// It does NOT auto-fill dates (we lack a reliable automated source for contract
// end dates without checking DocuSign or the CRM sheet). Instead it produces
// a prioritized gap list so a human or agent can backfill from authoritative
// sources.
//
// Output (default): human-readable list of deals needing contract end dates,
// ordered by relationship tier (warm first, then cold, then dormant).
// Output (--json): machine-readable array for integration with renewal watchdog.
//
// Flags:
//   --json            machine output
//   --root <path>     override repo root (tests use fixtures)
//
// No external dependencies. Node >= 20.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.join(SCRIPT_DIR, '..');

// Tier priority for sorting (lower = higher priority for backfill).
const TIER_PRIORITY = {
  renewal: 0,
  warm: 1,
  're-engagement': 2,
  'kinetic-2026-sponsor': 3,
  cold: 4
};

// Parse YAML frontmatter from a markdown file. Minimal parser, handles the
// fields we need (slug, company, status, relationship_tier, contract_end_date, jobId).
export function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const block = match[1];
  const result = {};
  for (const line of block.split('\n')) {
    const kv = line.match(/^(\w[\w_]*):\s*(.*)$/);
    if (kv) {
      let val = kv[2].trim();
      // Strip inline comments.
      const commentIdx = val.indexOf(' #');
      if (commentIdx > 0) val = val.substring(0, commentIdx).trim();
      // Strip quotes.
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (val === 'null' || val === '') val = null;
      result[kv[1]] = val;
    }
  }
  return result;
}

export function scanDeals(rootDir = DEFAULT_ROOT) {
  const dealsDir = path.join(rootDir, 'brain', 'wiki', 'deals');
  let files;
  try {
    files = fs.readdirSync(dealsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  } catch {
    return { deals: [], dealsDir, error: 'deals directory not found' };
  }

  const deals = [];
  for (const file of files) {
    const content = fs.readFileSync(path.join(dealsDir, file), 'utf8');
    const fm = parseFrontmatter(content);
    if (!fm) continue;

    const status = fm.status || 'unknown';
    if (status !== 'active' && status !== 'dormant') continue;

    const hasEndDate = fm.contract_end_date != null;
    deals.push({
      file,
      slug: fm.slug || file.replace('.md', ''),
      company: fm.company || fm.slug || file.replace('.md', ''),
      jobId: fm.jobId || null,
      status,
      relationshipTier: fm.relationship_tier || 'unknown',
      contractEndDate: fm.contract_end_date || null,
      hasEndDate
    });
  }

  return { deals, dealsDir, error: null };
}

export function buildGapReport(rootDir = DEFAULT_ROOT) {
  const { deals, dealsDir, error } = scanDeals(rootDir);

  if (error) {
    return { dealsDir, totalScanned: 0, withEndDate: 0, missingEndDate: 0, gaps: [], error };
  }

  const withEndDate = deals.filter((d) => d.hasEndDate);
  const missing = deals.filter((d) => !d.hasEndDate);

  // Sort by tier priority (warm first), then by status (active before dormant).
  missing.sort((a, b) => {
    const tierA = TIER_PRIORITY[a.relationshipTier] ?? 99;
    const tierB = TIER_PRIORITY[b.relationshipTier] ?? 99;
    if (tierA !== tierB) return tierA - tierB;
    if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
    return (a.company || '').localeCompare(b.company || '');
  });

  return {
    dealsDir,
    totalScanned: deals.length,
    withEndDate: withEndDate.length,
    missingEndDate: missing.length,
    gaps: missing.map((d) => ({
      file: d.file,
      company: d.company,
      jobId: d.jobId,
      status: d.status,
      relationshipTier: d.relationshipTier
    })),
    error: null
  };
}

export function renderGapReport(report) {
  const lines = [];

  if (report.error) {
    lines.push(`Error: ${report.error}`);
    return lines.join('\n');
  }

  lines.push('CONTRACT END DATE GAP REPORT');
  lines.push(`  Scanned: ${report.totalScanned} active/dormant deals`);
  lines.push(`  With contract_end_date: ${report.withEndDate}`);
  lines.push(`  Missing contract_end_date: ${report.missingEndDate}`);
  lines.push('');

  if (report.gaps.length === 0) {
    lines.push('All deals have contract end dates. No backfill needed.');
    return lines.join('\n');
  }

  lines.push('DEALS NEEDING BACKFILL (prioritized by relationship tier, active first):');
  lines.push('');

  let lastTier = null;
  for (const gap of report.gaps) {
    if (gap.relationshipTier !== lastTier) {
      if (lastTier !== null) lines.push('');
      lines.push(`  [${gap.relationshipTier}]`);
      lastTier = gap.relationshipTier;
    }
    const jobStr = gap.jobId ? ` (${gap.jobId})` : '';
    lines.push(`    ${gap.company}${jobStr} - ${gap.status} - ${gap.file}`);
  }

  lines.push('');
  lines.push('Backfill sources: DocuSign (getEnvelopes/getAgreementDetails), CRM Contract Breakdown tab, or manual entry.');

  return lines.join('\n');
}

function parseArgs(argv) {
  const args = { json: false, root: DEFAULT_ROOT };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') args.json = true;
    else if (arg === '--root') args.root = argv[++i];
    else {
      process.stderr.write(`Unknown argument: ${arg}\n`);
      process.exit(1);
    }
  }
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildGapReport(args.root);
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`${renderGapReport(report)}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
