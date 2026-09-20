import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'agent-prompts', 'kmg-agent-playbook');
const files = ['PLAYBOOK.md', 'PLAYBOOK-KERRI.md', 'PLAYBOOK-CODEX.md'];
const editions = files.map((name) => ({ name, text: readFileSync(join(root, name), 'utf8') }));

test('interactive email policy names Kerri and keeps exact-action approval in every edition', () => {
  for (const { name, text } of editions) {
    assert.doesNotMatch(text, /Carry\/Kerri|Carry\/|Carry's Slack/, name);
    assert.match(text, /Kerri Slack|Kerri, Codex, or Muse/, name);
    assert.match(text, /actor.and.payload|exact final payload|exact sending mailbox|exact final email/, name);
  }
});

test('interactive email policy distinguishes queued from provider-verified sent', () => {
  for (const { name, text } of editions) {
    assert.match(text, /provider\/Sent Items evidence|provider evidence/, name);
    assert.match(text, /queued|uncertain/, name);
  }
});

test('Muse API key alone never substitutes for verified chat approval', () => {
  for (const { name, text } of editions) {
    assert.match(text, /Muse's current.*API-key/, name);
    assert.match(text, /Microsoft-backed.*approval page|Microsoft-backed broker page/, name);
  }
});
