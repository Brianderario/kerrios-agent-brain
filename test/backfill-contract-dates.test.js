import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { buildGapReport, parseFrontmatter, renderGapReport, scanDeals } from '../scripts/backfill-contract-dates.mjs';

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(TEST_DIR, '..', 'scripts', 'backfill-contract-dates.mjs');
const FIXTURE_ROOT = path.join(TEST_DIR, 'fixtures', 'deals');

test('parseFrontmatter extracts YAML fields correctly', () => {
  const content = [
    '---',
    'slug: test-co',
    'company: "Test Company"',
    'status: active',
    'relationship_tier: warm',
    'contract_end_date: 2026-09-30',
    'jobId: H0042',
    '---',
    '',
    '# Test Company'
  ].join('\n');

  const fm = parseFrontmatter(content);
  assert.equal(fm.slug, 'test-co');
  assert.equal(fm.company, 'Test Company');
  assert.equal(fm.status, 'active');
  assert.equal(fm.relationship_tier, 'warm');
  assert.equal(fm.contract_end_date, '2026-09-30');
  assert.equal(fm.jobId, 'H0042');
});

test('parseFrontmatter treats null and empty as null', () => {
  const content = '---\nslug: test\ncontract_end_date: null\n---\n';
  const fm = parseFrontmatter(content);
  assert.equal(fm.contract_end_date, null);
});

test('parseFrontmatter returns null for files without frontmatter', () => {
  const fm = parseFrontmatter('# Just a heading\nNo frontmatter here.');
  assert.equal(fm, null);
});

test('scanDeals finds active and dormant deals in fixture directory', () => {
  const result = scanDeals(FIXTURE_ROOT);
  assert.equal(result.error, null);
  // 3 deal files: acme-corp (active, has end date), beta-labs (active, missing), gamma-old (dormant, missing)
  assert.equal(result.deals.length, 3);
});

test('scanDeals tolerates missing deals directory', () => {
  const result = scanDeals('/tmp/nonexistent-root-for-test');
  assert.match(result.error, /not found/);
  assert.equal(result.deals.length, 0);
});

test('buildGapReport identifies deals missing contract_end_date', () => {
  const report = buildGapReport(FIXTURE_ROOT);
  assert.equal(report.error, null);
  assert.equal(report.totalScanned, 3);
  assert.equal(report.withEndDate, 1, 'acme-corp has an end date');
  assert.equal(report.missingEndDate, 2, 'beta-labs and gamma-old are missing');
});

test('gap report sorts warm/active before cold/dormant', () => {
  const report = buildGapReport(FIXTURE_ROOT);
  // beta-labs is warm+active (priority), gamma-old is cold+dormant (lower priority)
  assert.equal(report.gaps[0].company, 'Beta Labs');
  assert.equal(report.gaps[1].company, 'Gamma Industries');
});

test('human-readable gap report includes key sections', () => {
  const report = buildGapReport(FIXTURE_ROOT);
  const text = renderGapReport(report);
  assert.match(text, /CONTRACT END DATE GAP REPORT/);
  assert.match(text, /Missing contract_end_date: 2/);
  assert.match(text, /Beta Labs/);
  assert.match(text, /Gamma Industries/);
  assert.match(text, /DocuSign/);
});

test('gap report for directory with all dates filled shows no gaps', () => {
  // Create a temp fixture with only acme-corp (which has a date)
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deals-all-filled-'));
  const dealsDir = path.join(root, 'brain', 'wiki', 'deals');
  fs.mkdirSync(dealsDir, { recursive: true });
  fs.copyFileSync(
    path.join(FIXTURE_ROOT, 'brain', 'wiki', 'deals', 'acme-corp.md'),
    path.join(dealsDir, 'acme-corp.md')
  );

  const report = buildGapReport(root);
  assert.equal(report.missingEndDate, 0);
  const text = renderGapReport(report);
  assert.match(text, /All deals have contract end dates/);
});

test('--json CLI output is valid JSON', () => {
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--root', FIXTURE_ROOT],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.totalScanned, 3);
  assert.equal(parsed.missingEndDate, 2);
  assert.equal(parsed.gaps.length, 2);
});

test('--root flag correctly redirects scan directory', () => {
  const out = execFileSync(
    process.execPath,
    [SCRIPT_PATH, '--json', '--root', FIXTURE_ROOT],
    { encoding: 'utf8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.error, null);
  assert.ok(parsed.totalScanned > 0);
});
