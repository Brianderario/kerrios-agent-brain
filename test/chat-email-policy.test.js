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

test('Muse delegated send is labeled as a narrow trust exception, not verified human approval', () => {
  for (const { name, text } of editions) {
    assert.match(text, /Muse-only delegated-send|Muse-only delegated|Muse's scoped delegated-send/, name);
    assert.match(text, /muse_delegated/, name);
    assert.match(text, /cannot independently verify|cannot authenticate|cannot verify|not independently verified/, name);
    assert.match(text, /other.*writes.*page|other.*broker.*writes.*page/i, name);
  }
});

test('Standard & Works is agent-accessible but brand-scoped away from Benji', () => {
  for (const { name, text } of editions) {
    assert.match(text, /authorized agents/i, name);
    assert.match(text, /standard-and-works/, name);
    assert.match(text, /Benji/, name);
    assert.doesNotMatch(text, /S&W content never enters|S&W content stays outside|S&W wall:.*never enter/i, name);
  }
});

test('the latest money and brain-write rules replace categorical bans and the retired gate', () => {
  for (const { name, text } of editions) {
    assert.match(text, /reversibly stag/i, name);
    assert.match(text, /exact.*(payee|counterparty)|payee.*material terms/i, name);
    assert.match(text, /direct.write path/i, name);
    assert.match(text, /Review Gate is retired|Review Gate is retired and must not be reintroduced/i, name);
    assert.doesNotMatch(text, /No sends of funds|transfers never|No money movement, ever|Mercury\/Stripe are read-only/i, name);
  }
});

test('pricing points to permissioned records instead of stale Ironclad or Kinetic lists', () => {
  const master = editions.find(({ name }) => name === 'PLAYBOOK.md').text;
  assert.match(master, /2846ff00/);
  assert.match(master, /cbff0c5b/);
  assert.match(master, /e9ae918c/);
  assert.doesNotMatch(master, /Panel Seat \$12K|Sponsored Panel \$15K|Ironclad tiers \(`f0a3e36c`\)/);
});
