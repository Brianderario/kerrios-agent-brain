#!/usr/bin/env node
// resource-watchdog: is the host healthy + is the inbox-sweep reaper doing its job?
//
// kerri-gap-sweep class N. The failure mode this guards against is real: the
// desktop scheduled-task runner leaked one ~75MB kerri-inbox-sweep session per
// 15-min run until RAM was exhausted and the Mac thrashed at load 23. The
// com.kerri.inbox-sweep-reaper LaunchAgent kills those leaks every 5 min — but
// nothing was watching the reaper itself. This watchdog does.
//
// It is read-only: it never kills a process (the reaper owns that, and verifies
// session identity by transcript). It MONITORS and alerts Brian when:
//   • the reaper LaunchAgent is not loaded (leaks would pile up unreaped)
//   • the reaper hasn't logged recently (it may be stalled)
//   • the reaper's last scan saw an abnormal number of claude processes (pileup)
//   • system load or free memory crosses a ceiling
//
// It leans on the reaper's own log rather than re-implementing the ps+transcript
// identity check, so the two stay in agreement.
//
// Usage:
//   node scripts/resource-watchdog.mjs                 # gather + print JSON
//   node scripts/resource-watchdog.mjs --alert          # + text Brian on a high finding
//   node scripts/resource-watchdog.mjs --json --reaper-loaded false --load 25 ...   # test hooks

import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEXT_ALERT = '/Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs';
const REAPER_LABEL = 'com.kerri.inbox-sweep-reaper';
const REAPER_LOG = path.join(os.homedir(), '.kerri-chief', 'runtime', 'logs', 'inbox-sweep-reaper.log');

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

const DEFAULT_THRESHOLDS = {
  // Total resident claude procs. Interactive + handoff + a couple scheduled
  // tasks legitimately run ~10; the leak incident hit ~48. 20 only fires on a
  // genuine pileup (the reaper keeps leaked sweeps near 1 when it's working).
  maxClaudeProcs: 20,
  reaperLogStaleMin: 15, // reaper runs every 5 min → a 15-min gap means it's stalled
  loadCeiling: Math.max(8, os.cpus().length * 2.5) // incident peaked at load 23
};

// Pure verdict: given gathered metrics + thresholds, decide findings + health.
// Note: deliberately NO os.freemem() check — on macOS free pages are kept tiny
// by the file cache, so freemem is not a reliable OOM signal and would false-
// alarm constantly. Session-pileup + load are the proxies for RAM exhaustion
// (which is exactly how the incident escalated: pileup → load 23).
export function assessResources(metrics, thresholds = DEFAULT_THRESHOLDS) {
  const findings = [];
  if (metrics.reaperLoaded === false) {
    findings.push({ kind: 'reaper-not-loaded', severity: 'high', detail: `${REAPER_LABEL} is not loaded — leaked inbox-sweep sessions will not be reaped` });
  } else if (metrics.reaperLoaded === true && metrics.reaperLogAgeMin != null && metrics.reaperLogAgeMin > thresholds.reaperLogStaleMin) {
    findings.push({ kind: 'reaper-stalled', severity: 'high', detail: `reaper loaded but last logged ${metrics.reaperLogAgeMin}m ago (>${thresholds.reaperLogStaleMin}m) — may be stalled` });
  }
  if (metrics.claudeProcs != null && metrics.claudeProcs > thresholds.maxClaudeProcs) {
    findings.push({ kind: 'session-pileup', severity: 'high', detail: `${metrics.claudeProcs} claude processes resident (>${thresholds.maxClaudeProcs}) — possible session leak` });
  }
  if (metrics.load1 != null && metrics.load1 > thresholds.loadCeiling) {
    findings.push({ kind: 'load-high', severity: 'high', detail: `1-min load ${metrics.load1.toFixed(1)} over ceiling ${thresholds.loadCeiling.toFixed(1)}` });
  }
  const high = findings.filter((f) => f.severity === 'high');
  return { ok: high.length === 0, healthy: findings.length === 0, findings };
}

function reaperLoaded() {
  const r = spawnSync('launchctl', ['list', REAPER_LABEL], { encoding: 'utf8' });
  return r.status === 0;
}

function reaperLogAgeMin() {
  try {
    const st = fs.statSync(REAPER_LOG);
    return Math.round((Date.now() - st.mtimeMs) / 60000);
  } catch {
    return null;
  }
}

// Last "scan: N claude procs" the reaper logged — its own count, no duplicate ps.
function lastClaudeProcCount() {
  try {
    const lines = fs.readFileSync(REAPER_LOG, 'utf8').trimEnd().split('\n');
    for (let i = lines.length - 1; i >= 0 && i >= lines.length - 50; i -= 1) {
      const m = lines[i].match(/scan:\s*(\d+)\s*claude procs/);
      if (m) return Number(m[1]);
    }
  } catch { /* fall through */ }
  return null;
}

function gather(args) {
  const num = (k) => (args[k] != null && args[k] !== true ? Number(args[k]) : undefined);
  const bool = (k) => (args[k] === 'true' ? true : args[k] === 'false' ? false : undefined);
  return {
    reaperLoaded: bool('reaper-loaded') ?? reaperLoaded(),
    reaperLogAgeMin: num('reaper-log-age') ?? reaperLogAgeMin(),
    claudeProcs: num('claude-procs') ?? lastClaudeProcCount(),
    load1: num('load') ?? os.loadavg()[0]
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const metrics = gather(args);
  const verdict = assessResources(metrics);
  const report = { checkedAt: new Date().toISOString(), reaperLabel: REAPER_LABEL, metrics, ...verdict };

  const high = report.findings.filter((f) => f.severity === 'high');
  if (args.alert && high.length) {
    const msg = `⚠️ Host/reaper: ${report.findings.map((f) => f.detail).join(' · ')}`;
    report.alert = { message: msg, sent: false };
    if (!args['dry-run']) {
      try { spawnSync('node', [TEXT_ALERT, '--message', msg], { stdio: 'ignore' }); report.alert.sent = true; }
      catch (e) { report.alert.error = e.message; }
    }
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`resource-watchdog: ${report.ok ? 'OK' : report.findings.length + ' finding(s)'}\n`);
    process.stdout.write(`  reaper=${metrics.reaperLoaded} logAge=${metrics.reaperLogAgeMin}m claudeProcs=${metrics.claudeProcs} load=${metrics.load1 != null ? metrics.load1.toFixed(1) : '?'}\n`);
    for (const f of report.findings) process.stdout.write(`  ${f.severity === 'high' ? '✗' : '⚠'} [${f.kind}] ${f.detail}\n`);
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
