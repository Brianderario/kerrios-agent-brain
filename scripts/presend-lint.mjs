#!/usr/bin/env node
// presend-lint.mjs
// PreToolUse gate for outbound mail. Reads the Claude Code hook JSON on stdin,
// and BLOCKS the tool call (deny) when an outbound email send/draft/reply
// violates a hard, mechanically-checkable rule.
//
// Why this exists: the no-em-dash rule (and a few siblings) are pure pattern
// checks that kept leaking when enforced by memory alone. This moves them into
// code that runs on every send, the same way the approval gate already does.
//
// Design:
//   - Fail CLOSED on a detected violation (exit 2 + stderr + deny JSON).
//   - Fail OPEN on parse/unexpected errors (exit 0) so a bug here never bricks
//     all outbound mail. Every run is logged so a silent failure is noticeable.
//
// Extending: add a check to runChecks(). Keep each check a pure string test
// with a one-line, actionable failure message.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.join(SCRIPT_DIR, '..', 'data', 'presend-lint.log');

// Tool-name fragments that mean "this call puts words in front of a recipient".
const EMAIL_TOOL_RE = /(send_email|create_draft|reply_email|send_draft|create_or_update_draft|gmail_send)/;

// Fancy dashes we never want in outbound copy: figure, en, em, horizontal bar.
const FANCY_DASH_RE = /[‒–—―]/;
const DASH_NAMES = {
  '‒': 'figure dash',
  '–': 'en dash',
  '—': 'em dash',
  '―': 'horizontal bar',
};

// "Deliverable" nouns: documents/assets a recipient is meant to receive.
const ASSET_NOUN =
  `(?:one[- ]?sheeter|one[- ]?pager|sheet|deck|slides?|proposal|draft|report|` +
  `contract|agreement|invoice|media ?kit|document|doc|file|pdf|quote|brief|` +
  `recap|write[- ]?up|summary|spec|mockup|wireframe)`;
// Verbs that mean "I will hand this over in a later message".
const DEFER_VERB =
  `(?:send|get|share|forward|shoot|deliver|provide|` +
  `put together|pull together|have ready|send over|shoot over)`;
// "I'll send you the one-sheeter" / "I'm going to put together a proposal".
const DEFER_PROMISE_RE = new RegExp(
  `\\b(?:i'?ll|i will|i'?m going to|i am going to|let me)\\s+` +
  `(?:${DEFER_VERB})\\b[^.!?\\n]{0,40}\\b${ASSET_NOUN}\\b`,
  'i',
);
// "Sending the deck shortly" / "the proposal is on its way" — same defer, reframed.
const DEFER_PROMISE_RE2 = new RegExp(
  `\\b(?:sending|forwarding)\\b[^.!?\\n]{0,40}\\b${ASSET_NOUN}\\b` +
  `|\\b${ASSET_NOUN}\\b[^.!?\\n]{0,25}\\b(?:is coming|to follow|on its way|` +
  `will follow|by (?:eod|end of day|tomorrow|this afternoon))`,
  'i',
);

function log(line) {
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch {
    // logging must never affect the decision
  }
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

// Pull just the recipient-facing strings out of the tool input.
function collectText(toolInput) {
  const KEYS = ['subject', 'body', 'comment', 'content', 'text', 'html', 'htmlBody', 'message'];
  const parts = [];
  for (const k of KEYS) {
    const v = toolInput?.[k];
    if (typeof v === 'string' && v.length) parts.push(v);
  }
  return parts.join('\n');
}

function hasAttachment(toolInput) {
  const a = toolInput?.attachments;
  return Array.isArray(a) && a.length > 0;
}

function looksBrianSigned(text) {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const last = lines[lines.length - 1] || '';
  if (/^brian( d'?erario)?$/i.test(last)) return true;
  if (/\b(thanks|best|cheers|regards|warmly|sincerely)[,!]?\s*\n+\s*brian\b/i.test(text)) return true;
  return false;
}

function runChecks(toolName, toolInput) {
  const text = collectText(toolInput);
  const violations = [];

  // 1. Fancy dashes (em/en/etc.) anywhere in outbound copy.
  if (FANCY_DASH_RE.test(text)) {
    const found = [...new Set([...text].filter((ch) => FANCY_DASH_RE.test(ch)))]
      .map((ch) => DASH_NAMES[ch] || 'dash')
      .join(', ');
    violations.push(`Contains a forbidden ${found}. Hard rule: no em/en dashes in any output. Replace with a hyphen, comma, colon, or split the sentence.`);
  }

  // 2. Brian-signed mail must not leave from the kerri@ mailbox.
  if (/kerri-hardwarefyi-email/.test(toolName) && looksBrianSigned(text)) {
    violations.push('Brian-signed body is going out from the kerri@ mailbox. Send Brian-signed mail from brian@ (brian-hardwarefyi-email), or sign it as Kerri.');
  }

  // 3. Stale newsletter name.
  if (/the industrialist/i.test(text)) {
    violations.push('Uses the retired name "the Industrialist". Call it "the Standard & Works Newsletter".');
  }

  // 4. Promises an attachment but none is attached on this call.
  if (/\b(attached|i'?ve attached|see attached|media kit|enclosed|attachment)\b/i.test(text) && !hasAttachment(toolInput)) {
    violations.push('Body references an attachment (e.g. "attached"/"media kit") but no attachment is on this call. Attach the file via the attachments param, or remove the promise.');
  }

  // 5. Promises to hand over a deliverable in a LATER message, nothing attached now.
  //    This is the "I'll send it later" failure: the job is meant to be finished now,
  //    but the email defers the asset to a send no background run will ever make.
  //    Fix: finish and attach it on this call, OR capture the hand-off as a durable
  //    one-time scheduled task / Console card so it actually happens. Never a bare promise.
  if (!hasAttachment(toolInput) && (DEFER_PROMISE_RE.test(text) || DEFER_PROMISE_RE2.test(text))) {
    violations.push('Body promises to send a deliverable later (e.g. "I\'ll send the one-sheeter") with nothing attached. Finish and attach it on this call, or remove the promise and capture the hand-off as a durable scheduled task / Console card so it actually happens.');
  }

  return violations;
}

function isoNow() {
  // Date is available in a normal node process (only restricted inside Workflow scripts).
  return new Date().toISOString();
}

function main() {
  const raw = readStdin();
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    log(`${isoNow()}\tPARSE_ERROR\t(failing open)`);
    process.exit(0); // fail open: never block on a malformed payload
  }

  const toolName = payload?.tool_name || '';
  const toolInput = payload?.tool_input || {};

  if (!EMAIL_TOOL_RE.test(toolName)) {
    process.exit(0); // not an outbound-mail tool; nothing to lint
  }

  let violations = [];
  try {
    violations = runChecks(toolName, toolInput);
  } catch (err) {
    log(`${isoNow()}\tCHECK_ERROR\t${toolName}\t${err?.message || err}`);
    process.exit(0); // fail open on an internal bug
  }

  if (violations.length === 0) {
    log(`${isoNow()}\tPASS\t${toolName}`);
    process.exit(0);
  }

  const reason =
    `Pre-send lint blocked this email (${violations.length} issue${violations.length > 1 ? 's' : ''}):\n` +
    violations.map((v, i) => `  ${i + 1}. ${v}`).join('\n') +
    `\nFix the draft and resend.`;

  log(`${isoNow()}\tBLOCK\t${toolName}\t${violations.length} issue(s)`);

  // Forward-compatible deny for PreToolUse (JSON on stdout)...
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason: reason,
      },
    }),
  );
  // ...and the broadly-supported blocking signal (exit 2 + stderr).
  process.stderr.write(reason + '\n');
  process.exit(2);
}

main();
