import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(ROOT, relativePath), 'utf8');

const workflow = read('brain/wiki/workflows/savant-task-board-workflow.md');

const columns = new Map([
  ['needs_approval', "Brian's Tasks"],
  ['action_needed', 'Team Tasks'],
  ['discuss', 'Discuss'],
  ['waiting_reply', 'Waiting / On Hold'],
  ['kerri_upgrades', 'Kerri Upgrades'],
  ['agent_working', 'Approved to Send'],
  ['done', 'Archived off the active board']
]);

test('canonical workflow maps every stable task status to its current column', () => {
  for (const [status, label] of columns) {
    const row = workflow.split('\n').find((line) => line.startsWith(`| \`${status}\` |`));
    assert.ok(row, `${status} must have a canonical workflow row`);
    assert.ok(row.includes(label), `${status} must map to ${label}`);
  }
});

test('scheduled routing keeps approval packets separate from result cards', () => {
  assert.match(workflow, /result card uses `task_status`/);
  assert.match(workflow, /defaults to\s+`action_needed`/);
  assert.match(workflow, /approval[\s\S]*separate[\s\S]*`needs_approval`/);
  assert.match(workflow, /may not target `agent_working`/);
  assert.match(workflow, /`NO_UPDATES` means no result card/);
});

test('current operating entrypoints point to the live registry and column contract', () => {
  const files = [
    'AGENTS.md',
    'NOW.md',
    'agent-prompts/CLAUDE-ROUTINES.md',
    'brain/wiki/agents/registry.md',
    'brain/wiki/workflows/console-reporting.md'
  ];

  for (const file of files) {
    const contents = read(file);
    assert.doesNotMatch(contents, /Claude Code is the sole (?:operating |scheduled )?runner/);
    assert.doesNotMatch(contents, /Codex (?:automations (?:are )?)?retired/);
  }

  assert.match(read('AGENTS.md'), /Savant AgentSchedules/);
  assert.match(read('agent-prompts/CLAUDE-ROUTINES.md'), /Task board routing, canonical 2026-07-10/);
  assert.match(read('brain/wiki/workflows/console-reporting.md'), /\[\[savant-task-board-workflow\]\]/);
});
