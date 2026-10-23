import assert from 'node:assert/strict';
import test from 'node:test';
import {
  scanText,
  scanDiff,
  summarize,
  exitCodeFor,
  redactSnippet,
} from '../scripts/redact-check.mjs';

// Detection fixtures are format-valid but FAKE — that is how every secret-scanner's test
// suite works. The Slack token is ASSEMBLED at runtime via join() so no contiguous
// `xoxb-…` literal ever lands in the committed bytes; a literal would trip GitHub's own
// push-protection on this very repo (which is exactly the class of leak this guard exists
// to stop — proof the threat is real). The format still matches our regex at runtime.
const FAKE_SLACK = ['xoxb', '1111111111', '2222222222', 'ZZfakeFAKEtoken000000000'].join('-');

const ids = (findings) => findings.map((f) => f.ruleId).sort();

test('catches a Slack bot token (and the Bearer prefix around it)', () => {
  const f = scanText(`Authorization: Bearer ${FAKE_SLACK}`);
  assert.ok(f.some((x) => x.ruleId === 'slack-token'));
  assert.ok(f.some((x) => x.ruleId === 'bearer-token'));
});

test('catches GitHub PAT, OpenAI/Anthropic, AWS, Google keys and private-key blocks', () => {
  const f = scanText([
    'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab',
    'sk-ant-api03-ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    'AKIAIOSFODNN7EXAMPLE',
    'AIzaabcdefghijklmnopqrstuvwxyz012345678',
    '-----BEGIN RSA PRIVATE KEY-----',
  ].join('\n'));
  assert.deepEqual(ids(f), [
    'aws-access-key',
    'github-pat',
    'google-api-key',
    'openai-anthropic-key',
    'private-key-block',
  ]);
});

test('catches a hardcoded secret assignment', () => {
  const f = scanText('const apiKey = "a1b2c3d4e5f6g7h8i9j0klmnop"');
  assert.ok(f.some((x) => x.ruleId === 'secret-assignment'));
});

test('does NOT flag bare email addresses (a CoS brain is full of them)', () => {
  const f = scanText('Contact ari@kerrihq.com and ken@coffeewithken.com about the deal.');
  assert.equal(f.length, 0);
});

test('does NOT flag placeholders, env refs, or template vars (no crying wolf)', () => {
  const f = scanText([
    'token = "your-token-here"',
    'apiKey: process.env.API_KEY',
    'secret = "${SLACK_SECRET}"',
    'password = "<your-password>"',
    'access_token = "REDACTED"',
  ].join('\n'));
  assert.equal(f.length, 0);
});

test('does NOT flag the word "Bearer" in prose', () => {
  const f = scanText('The bearer of this note may enter. Bearer assets remain locked.');
  assert.equal(f.filter((x) => x.ruleId === 'bearer-token').length, 0);
});

test('flags SSN and card-shaped numbers as MEDIUM', () => {
  const f = scanText('SSN 123-45-6789 card 4111 1111 1111 1111');
  assert.deepEqual(summarize(f).medium.map((x) => x.ruleId).sort(), ['card-number', 'ssn']);
  assert.equal(summarize(f).high.length, 0);
});

test('flags the S/W legal entity name as LOW (boundary tripwire)', () => {
  const f = scanText('Per the agreement with Storm King Nexus Holdings LLC.');
  assert.equal(f.length, 1);
  assert.equal(f[0].severity, 'low');
});

test('redact-allow on a line suppresses all findings for that line', () => {
  const f = scanText('token = "a1b2c3d4e5f6g7h8i9j0kl" // redact-allow vetted example');
  assert.equal(f.length, 0);
});

test('scanDiff only scans ADDED lines, not context or removed lines', () => {
  const diff = [
    '--- a/brain/wiki/x.md',
    '+++ b/brain/wiki/x.md',
    ` context line with ${FAKE_SLACK}`,
    '-removed sk-ant-api03-REMOVEDREMOVEDREMOVEDREMOVED12345',
    `+added ${FAKE_SLACK}`,
  ].join('\n');
  const f = scanDiff(diff);
  assert.equal(f.filter((x) => x.ruleId === 'slack-token').length, 1);
  assert.equal(f.find((x) => x.ruleId === 'slack-token').file, 'brain/wiki/x.md');
});

test('scanDiff ignores the +++ file header itself', () => {
  const diff = ['--- a/f', '+++ b/f', '+clean content here'].join('\n');
  assert.equal(scanDiff(diff).length, 0);
});

test('exitCodeFor: 2 for HIGH, 1 for medium/low only, 0 for clean', () => {
  assert.equal(exitCodeFor(scanText(FAKE_SLACK)), 2);
  assert.equal(exitCodeFor(scanText('SSN 123-45-6789')), 1);
  assert.equal(exitCodeFor(scanText('just some normal brain prose about a meeting')), 0);
});

test('redactSnippet never reproduces the full secret', () => {
  const masked = redactSnippet(FAKE_SLACK);
  assert.ok(!masked.includes(FAKE_SLACK));
  assert.ok(masked.includes('…'));
});

test('empty / null input is safe', () => {
  assert.equal(scanText('').length, 0);
  assert.equal(scanText(null).length, 0);
  assert.equal(scanDiff('').length, 0);
});
