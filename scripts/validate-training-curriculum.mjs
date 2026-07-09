#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(SCRIPT_DIR, '..');

function blockFor(frontmatter, key) {
  const lines = frontmatter.split('\n');
  const start = lines.findIndex((line) => line === `  ${key}:`);
  if (start < 0) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    if (/^  [a-z_]+:/.test(lines[i])) break;
    out.push(lines[i]);
  }
  return out;
}

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^  ${key}:\\s*(.+)$`, 'm'));
  if (!match) return null;
  return match[1].trim().replace(/^['"]|['"]$/g, '');
}

function listValues(lines) {
  return lines.flatMap((line) => {
    const match = line.match(/^    -\s+(.+)$/);
    return match ? [match[1].trim().replace(/^['"]|['"]$/g, '')] : [];
  });
}

function rubric(lines) {
  const rows = [];
  let current = null;
  for (const line of lines) {
    const item = line.match(/^    - key:\s*(.+)$/);
    if (item) {
      current = { key: item[1].trim(), weight: null };
      rows.push(current);
      continue;
    }
    const weight = line.match(/^      weight:\s*(\d+)$/);
    if (current && weight) current.weight = Number(weight[1]);
  }
  return rows;
}

export function validateTrainingCurriculum(root = DEFAULT_ROOT) {
  const directory = path.join(root, 'brain', 'wiki', 'training');
  const errors = [];
  let files = [];
  try {
    files = fs.readdirSync(directory).filter((file) => /^\d+.*\.md$/.test(file)).sort();
  } catch {
    return { ok: false, modules: [], errors: [`training directory not found: ${directory}`] };
  }

  const modules = [];
  for (const file of files) {
    const relativePath = path.join('brain', 'wiki', 'training', file);
    const content = fs.readFileSync(path.join(root, relativePath), 'utf8');
    const match = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!match) {
      errors.push(`${relativePath}: missing YAML frontmatter`);
      continue;
    }
    const frontmatter = match[1];
    const module = {
      file: relativePath,
      moduleId: scalar(frontmatter, 'module_id'),
      order: Number(scalar(frontmatter, 'order')),
      competency: scalar(frontmatter, 'competency'),
      passScore: Number(scalar(frontmatter, 'pass_score')),
      freshnessDays: Number(scalar(frontmatter, 'freshness_days')),
      sourcePaths: listValues(blockFor(frontmatter, 'source_paths')),
      scenarios: listValues(blockFor(frontmatter, 'scenarios')),
      rubric: rubric(blockFor(frontmatter, 'rubric'))
    };
    modules.push(module);

    if (!frontmatter.match(/(?:^|\n)tags:[\s\S]*?agent-training/)) errors.push(`${relativePath}: tags must include agent-training`);
    if (!module.moduleId) errors.push(`${relativePath}: training.module_id is required`);
    if (!Number.isInteger(module.order)) errors.push(`${relativePath}: training.order must be an integer`);
    if (!module.competency) errors.push(`${relativePath}: training.competency is required`);
    if (!Number.isInteger(module.passScore) || module.passScore < 0 || module.passScore > 100) errors.push(`${relativePath}: pass_score must be 0-100`);
    if (!Number.isInteger(module.freshnessDays) || module.freshnessDays < 0) errors.push(`${relativePath}: freshness_days must be a non-negative integer`);
    if (module.sourcePaths.length === 0) errors.push(`${relativePath}: at least one source_path is required`);
    if (module.scenarios.length < 2) errors.push(`${relativePath}: at least two assessment scenarios are required`);
    if (module.rubric.length === 0) errors.push(`${relativePath}: rubric is required`);
    if (module.rubric.reduce((sum, row) => sum + (row.weight || 0), 0) !== 100) errors.push(`${relativePath}: rubric weights must total 100`);
    if (new Set(module.rubric.map((row) => row.key)).size !== module.rubric.length) errors.push(`${relativePath}: rubric keys must be unique`);

    for (const sourcePath of module.sourcePaths) {
      if (!fs.existsSync(path.join(root, sourcePath))) errors.push(`${relativePath}: missing source ${sourcePath}`);
    }
  }

  for (const [field, values] of [
    ['module_id', modules.map((module) => module.moduleId)],
    ['order', modules.map((module) => module.order)]
  ]) {
    const duplicates = values.filter((value, index) => value != null && values.indexOf(value) !== index);
    if (duplicates.length) errors.push(`duplicate training ${field}: ${[...new Set(duplicates)].join(', ')}`);
  }

  return { ok: errors.length === 0, modules, errors };
}

function parseArgs(argv) {
  const args = { root: DEFAULT_ROOT, json: false };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--json') args.json = true;
    if (argv[i] === '--root') args.root = path.resolve(argv[++i]);
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const report = validateTrainingCurriculum(args.root);
  if (args.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else {
    process.stdout.write(`training-curriculum: ${report.modules.length} module(s), ${report.errors.length} error(s)\n`);
    report.errors.forEach((error) => process.stdout.write(`  ✗ ${error}\n`));
  }
  process.exit(report.ok ? 0 : 1);
}

