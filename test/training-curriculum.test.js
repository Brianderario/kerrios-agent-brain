import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { validateTrainingCurriculum } from '../scripts/validate-training-curriculum.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('the Kerri core curriculum is complete, uniquely ordered, and source-backed', () => {
  const report = validateTrainingCurriculum(root);
  assert.equal(report.ok, true, report.errors.join('\n'));
  assert.equal(report.modules.length, 8);
  assert.deepEqual(report.modules.map((module) => module.order), [10, 20, 30, 40, 50, 60, 70, 80]);
});

test('validator catches missing sources and invalid rubric weights', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'kerri-training-'));
  const trainingDir = path.join(fixture, 'brain', 'wiki', 'training');
  fs.mkdirSync(trainingDir, { recursive: true });
  fs.writeFileSync(path.join(trainingDir, '01-bad.md'), `---
tags: [agent-training]
training:
  module_id: bad
  order: 10
  competency: test
  pass_score: 85
  freshness_days: 30
  source_paths:
    - brain/wiki/missing.md
  scenarios:
    - "One"
    - "Two"
  rubric:
    - key: grounding
      weight: 80
---
# Bad
`);

  const report = validateTrainingCurriculum(fixture);
  assert.equal(report.ok, false);
  assert.match(report.errors.join('\n'), /rubric weights must total 100/);
  assert.match(report.errors.join('\n'), /missing source brain\/wiki\/missing.md/);
});

