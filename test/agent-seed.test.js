import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const seed = fs.readFileSync(new URL('../data/kerrios.agent-seed.json', import.meta.url), 'utf8');
const oldRuntimeTerms = [
  ['Open', 'Claw'],
  ['Open ', 'Claw'],
  ['Rail', 'way'],
  ['Send', 'blue'],
  ['heart', 'beat'],
  ['inbox ', 'sweep'],
  ['cron ', 'job'],
  ['gate', 'way'],
  ['local Mac ', 'worker'],
  ['Superhuman ', 'MCP'],
  ['Outlook ', 'MCP']
].map((parts) => parts.join(''));

test('agent seed excludes personal and old runtime data', () => {
  const forbidden = [
    /Samantha|Charlotte|Vivian|Parrish|tirzepatide|2019376663/i,
    /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    /\b(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/,
    /\/Users\/brianderario/,
    /gho_|xox[baprs]-|AIza|refresh_token|private_key|client_secret/i
  ];

  for (const pattern of forbidden) {
    assert.equal(pattern.test(seed), false, `unexpected seed match: ${pattern}`);
  }

  for (const term of oldRuntimeTerms) {
    assert.equal(seed.toLowerCase().includes(term.toLowerCase()), false, `unexpected seed term: ${term}`);
  }

  assert.equal(seed.toLowerCase().includes(['auto', 'mation'].join('')), false);
});
