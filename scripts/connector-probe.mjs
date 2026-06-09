#!/usr/bin/env node
// connector-probe: are the external surfaces each routine depends on reachable?
//
// kerri-gap-sweep class M. Two kinds of connector:
//   • CLI-checkable (cli): things this standalone process can actually verify —
//     the Sendblue text-alert path (how every watchdog reaches Brian), git,
//     and the gtasks list-id config. These get a real reachable/down verdict.
//   • Session-scoped (session): MCP connectors (email mailboxes, Granola,
//     Reclaim, Slack) only exist inside a Claude/Codex session, so a CLI can't
//     probe them. Run from a session (e.g. the gap-sweep) and pass
//     --available "<csv of present MCP connectors>" to get a real verdict;
//     otherwise they report 'session-scoped' and don't fail the probe.
//
// `ok` is false only when a REQUIRED, verifiable connector is DOWN. The most
// important one is sendblue: if the alert path is down, the watchdogs can't
// warn Brian — so this probe surfaces that loudly.
//
// Usage:
//   node scripts/connector-probe.mjs
//   node scripts/connector-probe.mjs --available "kerri-hardwarefyi-email,gtasks,granola"
//   node scripts/connector-probe.mjs --alert            # text Brian if a required connector is down
//   node scripts/connector-probe.mjs --json --root <dir> --skip-live   # test hooks

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TEXT_ALERT = '/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs';

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const v = values[i];
    if (v.startsWith('--')) {
      const key = v.slice(2);
      const next = values[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i += 1; }
    } else out._.push(v);
  }
  return out;
}

// connector → kind + which routines need it
const CONNECTORS = {
  sendblue: { kind: 'cli', requiredBy: ['all-watchdogs', 'kerri-inbox-sweep', 'kerri-morning-brief', 'kerri-eod-meetings-review', 'kerri-gap-sweep'] },
  git: { kind: 'cli', requiredBy: ['kerri-brain-push', 'kerri-gap-sweep'] },
  gtasks: { kind: 'session', cliProxy: 'gtasks-lists.json', requiredBy: ['kerri-inbox-sweep', 'kerri-eod-meetings-review', 'kerri-gap-sweep'] },
  'kerri-hardwarefyi-email': { kind: 'session', requiredBy: ['kerri-inbox-sweep'] },
  'brian-hardwarefyi-email': { kind: 'session', requiredBy: ['kerri-inbox-sweep'] },
  gmail: { kind: 'session', requiredBy: ['kerri-inbox-sweep', 'kerri-morning-brief'] },
  superhuman: { kind: 'session', requiredBy: ['kerri-inbox-sweep'] },
  granola: { kind: 'session', requiredBy: ['kerri-eod-meetings-review'] },
  reclaim: { kind: 'session', requiredBy: ['kerri-morning-brief', 'kerri-eod-meetings-review'] },
  slack: { kind: 'session', requiredBy: ['kerri-inbox-sweep'] }
};

function probeSendblue(skipLive) {
  if (!fs.existsSync(TEXT_ALERT)) return { status: 'down', detail: 'send-text-alert.mjs not found' };
  if (skipLive) return { status: 'reachable', detail: 'adapter present (live dry-run skipped)' };
  const r = spawnSync(process.execPath, [TEXT_ALERT, '--dry-run', '--message', 'connector-probe'], { encoding: 'utf8', timeout: 20000 });
  if (r.status === 0) return { status: 'reachable', detail: 'dry-run ok' };
  let detail = (r.stderr || r.stdout || '').trim().split('\n').slice(-1)[0] || `exit ${r.status}`;
  try { const j = JSON.parse(r.stdout); if (j && j.error) detail = j.error; } catch { /* keep detail */ }
  return { status: 'down', detail: `dry-run failed: ${detail}` };
}

function probeGit(root) {
  const r = spawnSync('git', ['-C', root, 'rev-parse', '--git-dir'], { encoding: 'utf8' });
  return r.status === 0
    ? { status: 'reachable', detail: 'repo present' }
    : { status: 'down', detail: 'not a git repo / git missing' };
}

export function probeConnectors(root, opts = {}) {
  const available = opts.available; // Set or null
  const results = [];
  for (const [name, cfg] of Object.entries(CONNECTORS)) {
    let verdict;
    if (cfg.kind === 'cli') {
      if (name === 'sendblue') verdict = probeSendblue(opts.skipLive);
      else if (name === 'git') verdict = probeGit(root);
      else verdict = { status: 'unverified', detail: 'no probe' };
    } else {
      // session connector
      const proxyOk = cfg.cliProxy ? fs.existsSync(path.join(root, 'data', cfg.cliProxy)) : null;
      if (available) {
        verdict = available.has(name)
          ? { status: 'reachable', detail: 'present in session' }
          : { status: 'down', detail: 'not present in session this run' };
      } else if (proxyOk === false) {
        verdict = { status: 'down', detail: `config ${cfg.cliProxy} missing` };
      } else {
        verdict = { status: 'session-scoped', detail: 'run from a session with --available for live status' };
      }
    }
    results.push({ name, kind: cfg.kind, requiredBy: cfg.requiredBy, ...verdict });
  }
  const down = results.filter((r) => r.status === 'down');
  const routinesAtRisk = [...new Set(down.flatMap((r) => r.requiredBy))];
  return {
    checkedAt: new Date().toISOString(),
    ok: down.length === 0,
    connectors: results,
    down: down.map((r) => r.name),
    routinesAtRisk
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root && args.root !== true ? args.root : repoRoot);
  const available = args.available && args.available !== true
    ? new Set(String(args.available).split(',').map((s) => s.trim()).filter(Boolean))
    : null;
  const report = probeConnectors(root, { available, skipLive: Boolean(args['skip-live']) });

  if (args.alert && report.down.length) {
    const msg = `⚠️ Connectors down: ${report.down.join(', ')} — at risk: ${report.routinesAtRisk.join(', ')}`;
    report.alert = { message: msg, sent: false };
    if (!args['dry-run']) {
      const r = spawnSync(process.execPath, [TEXT_ALERT, '--message', msg], { encoding: 'utf8' });
      if (r.error) {
        report.alert.error = r.error.message;
      } else if (r.status !== 0) {
        let detail = `exit ${r.status}`;
        try { const j = JSON.parse(r.stdout); if (j && j.error) detail = j.error; } catch { /* keep */ }
        report.alert.error = detail;
      } else {
        report.alert.sent = true;
      }
    }
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`connector-probe: ${report.ok ? 'OK' : report.down.length + ' down'}\n`);
    for (const c of report.connectors) {
      const mark = c.status === 'reachable' ? '✓' : c.status === 'down' ? '✗' : '·';
      process.stdout.write(`  ${mark} ${c.name.padEnd(26)} ${c.status.padEnd(14)} ${c.detail}\n`);
    }
    if (report.routinesAtRisk.length) process.stdout.write(`  at risk: ${report.routinesAtRisk.join(', ')}\n`);
  }
  process.exit(0); // monitor: health is in the report, not the exit code
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
