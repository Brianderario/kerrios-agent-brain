#!/usr/bin/env node
// redact-check: content-based secret / PII / boundary scanner for the brain push pipeline.
//
// Why this exists: kerri-sync.sh already has a PATH-based safety net — it unstages files
// whose NAME looks like a secret (.env, *.key, *credential*). But the real exposure on a
// repo that auto-commits and auto-pushes on every Stop hook is a secret pasted INSIDE an
// otherwise-innocent file: an API token quoted in a wiki page, a key in log.md, PII in a
// candidate. The filename is clean, so the path filter never sees it and it ships to the
// "sanitized, private" GitHub brain. This scans the exact bytes that will be committed
// (the staged diff's added lines) and catches that class.
//
// Severity tiers (adapted from gstack's redact-engine for KMG):
//   HIGH   — known credential/key formats (Slack/GitHub/OpenAI/Anthropic/AWS/Google keys,
//            private-key blocks, Bearer tokens, `secret=<20+ chars>` assignments). These
//            almost never appear legitimately in a company brain, so HIGH BLOCKS the push.
//   MEDIUM — SSN, spaced 16-digit card numbers. Logged for review; never blocks.
//   LOW    — the S/W legal-entity name (Storm King Nexus) appearing in a NEW addition, as a
//            boundary tripwire. Logged; never blocks.
//
// Deliberately NOT flagged: bare email addresses. A chief-of-staff brain is full of
// legitimate contact emails; flagging them would make the guard cry wolf and get it
// disabled — worse than no guard. Specificity over recall is the whole point here.
//
// False-positive escape hatch: put `redact-allow` anywhere on the offending line and that
// line is skipped (for documented examples, fixtures, or vetted strings).
//
// CLI contract (how kerri-sync.sh consumes it):
//   reads a unified diff on stdin → scans added lines → prints a human-readable report
//   exit 2 = at least one HIGH finding   (hook BLOCKS the push)
//   exit 1 = only MEDIUM/LOW findings    (hook logs a review marker, push proceeds)
//   exit 0 = clean                       (hook proceeds silently)

import { pathToFileURL } from "node:url";

// Each rule matches a FORMAT, not a literal secret, so this file does not trip its own
// scanner. `validate` is an optional second gate to suppress obvious placeholders.
export const RULES = [
  {
    id: "slack-token",
    severity: "high",
    label: "Slack token",
    regex: /xox[baprs]-[0-9A-Za-z-]{10,}/g,
  },
  {
    id: "github-pat",
    severity: "high",
    label: "GitHub personal access token",
    regex: /\bgh[pousr]_[A-Za-z0-9]{36,}\b/g,
  },
  {
    id: "openai-anthropic-key",
    severity: "high",
    label: "OpenAI/Anthropic API key",
    regex: /\bsk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}\b/g,
  },
  {
    id: "aws-access-key",
    severity: "high",
    label: "AWS access key id",
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    id: "google-api-key",
    severity: "high",
    label: "Google API key",
    regex: /\bAIza[0-9A-Za-z_-]{35}\b/g,
  },
  {
    id: "private-key-block",
    severity: "high",
    label: "Private key block",
    regex: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----/g,
  },
  {
    id: "bearer-token",
    severity: "high",
    label: "Bearer token",
    regex: /\bBearer\s+[A-Za-z0-9._~+/-]{20,}=*/g,
    // "Bearer <description>" prose is common; require the value to look like a token
    // (no spaces, mixed alnum) rather than words.
    validate: (m) => {
      const val = m.replace(/^Bearer\s+/, "");
      return /[0-9]/.test(val) && /[A-Za-z]/.test(val) && !/\s/.test(val);
    },
  },
  {
    id: "secret-assignment",
    severity: "high",
    label: "Hardcoded secret assignment",
    regex:
      /\b(?:api[_-]?key|secret|token|password|passwd|pwd|client[_-]?secret|access[_-]?token|auth[_-]?token)\b\s*[:=]\s*["']?([A-Za-z0-9/+_.~-]{20,})["']?/gi,
    // Suppress placeholders, env/template references, and prose. The captured value is the
    // first group; only treat it as a secret if it looks like an actual credential.
    validate: (_m, groups) => {
      const val = (groups && groups[0]) || "";
      if (!val) return false;
      if (/^(x{3,}|y{3,}|your[_-]?|example|placeholder|redacted|changeme|change_me|none|null|true|false|undefined|test|dummy|sample|xoxb-your)/i.test(val)) return false;
      if (/[$<>{}*]/.test(val)) return false; // ${VAR}, <token>, ***masked***
      if (/\.(md|js|mjs|ts|json|sh|png|jpg)$/i.test(val)) return false; // filename, not a key
      if (!/[0-9]/.test(val) || !/[a-z]/i.test(val)) return false; // real keys mix cases/digits
      return true;
    },
  },
  {
    id: "ssn",
    severity: "medium",
    label: "US Social Security Number",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
  },
  {
    id: "card-number",
    severity: "medium",
    label: "Card-number-shaped digits",
    regex: /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b/g,
  },
  {
    id: "sw-boundary",
    severity: "low",
    label: "S/W legal entity (boundary tripwire)",
    regex: /Storm King Nexus/gi,
  },
];

// Mask the middle of a matched secret so the report itself never reproduces it.
export function redactSnippet(s) {
  const str = String(s);
  if (str.length <= 8) return str[0] + "*".repeat(Math.max(1, str.length - 1));
  return `${str.slice(0, 4)}…${str.slice(-3)} (${str.length} chars)`;
}

// Scan a block of text line by line. Returns findings: {ruleId, severity, label, line, snippet}.
// `line` is 1-based within the supplied text. Lines containing `redact-allow` are skipped.
export function scanText(text, startLine = 1) {
  const findings = [];
  const lines = String(text ?? "").split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes("redact-allow")) continue;
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(line)) !== null) {
        if (rule.validate && !rule.validate(m[0], m.slice(1))) continue;
        findings.push({
          ruleId: rule.id,
          severity: rule.severity,
          label: rule.label,
          line: startLine + i,
          snippet: redactSnippet(m[0]),
        });
        if (m.index === rule.regex.lastIndex) rule.regex.lastIndex++; // avoid zero-width loop
      }
    }
  }
  return findings;
}

// Scan a unified diff: only ADDED lines (start with `+`, excluding the `+++` file header)
// are checked — we only care about what THIS push introduces, not pre-existing content.
// The reported `line` is the index of the added line within the diff (best-effort context).
export function scanDiff(diffText) {
  const findings = [];
  const lines = String(diffText ?? "").split("\n");
  let currentFile = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("+++ ")) {
      currentFile = line.slice(4).replace(/^b\//, "");
      continue;
    }
    if (line.startsWith("---")) continue;
    if (line[0] !== "+") continue;
    const added = line.slice(1);
    for (const f of scanText(added)) {
      findings.push({ ...f, file: currentFile, line: i + 1 });
    }
  }
  return findings;
}

// Group findings by severity.
export function summarize(findings) {
  return {
    high: findings.filter((f) => f.severity === "high"),
    medium: findings.filter((f) => f.severity === "medium"),
    low: findings.filter((f) => f.severity === "low"),
  };
}

// Human-readable report for the conflict/review marker.
export function formatReport(findings) {
  if (!findings.length) return "No findings.";
  const { high, medium, low } = summarize(findings);
  const fmt = (f) => `  [${f.severity.toUpperCase()}] ${f.label} — ${f.file ?? "?"} (+line ${f.line}): ${f.snippet}`;
  const out = [];
  if (high.length) out.push(`HIGH (${high.length}) — push blocked:`, ...high.map(fmt));
  if (medium.length) out.push(`MEDIUM (${medium.length}):`, ...medium.map(fmt));
  if (low.length) out.push(`LOW (${low.length}):`, ...low.map(fmt));
  return out.join("\n");
}

// exit 2 if any HIGH, 1 if only MEDIUM/LOW, 0 if clean.
export function exitCodeFor(findings) {
  const { high, medium, low } = summarize(findings);
  if (high.length) return 2;
  if (medium.length || low.length) return 1;
  return 0;
}

function readStdin() {
  return new Promise((resolve) => {
    let data = "";
    if (process.stdin.isTTY) return resolve("");
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", () => resolve(data));
  });
}

async function main() {
  const diff = await readStdin();
  const findings = scanDiff(diff);
  if (findings.length) process.stdout.write(`${formatReport(findings)}\n`);
  process.exit(exitCodeFor(findings));
}

// Only run as a CLI; never when imported by a test.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(() => process.exit(0)); // fail open: a scanner crash must not block the brain
}
