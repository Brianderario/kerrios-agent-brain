#!/usr/bin/env node
// resource-watchdog: is the host healthy + is the scheduled-task reaper doing its job?
//
// kerri-gap-sweep class N. The failure mode this guards against is real: the
// desktop scheduled-task runner leaks one idle ~300MB session per run (across ALL
// Kerri scheduled tasks) until RAM is exhausted and the Mac thrashes (this hit load
// 53 on 2026-05-31). The com.kerri.inbox-sweep-reaper LaunchAgent kills those leaks
// every 5 min — but nothing was watching the reaper itself. This watchdog does.
// (Reaper scope was generalized 2026-05-31 from inbox-sweep-only to every scheduled
// task; this watchdog reads the reaper's own log, so it tracks that scope for free.)
//
// It is read-only: it never kills a process (the reaper owns that, and verifies
// session identity by transcript). It MONITORS and alerts Brian when:
//   • the reaper LaunchAgent is not loaded (leaks would pile up unreaped)
//   • the reaper hasn't logged recently (it may be stalled)
//   • leaked scheduled sessions are resident past the reaper's own reap limits
//     (the reaper should keep this at ~0; a pileup means it's blind or failing)
//   • TOTAL claude processes cross a high catch-all ceiling (runaway pileup)
//   • system load crosses a ceiling
//
// It runs the reaper's OWN scan (imported from inbox-sweep-reaper.mjs, read-only)
// rather than re-implementing the ps+transcript identity check, so the two stay in
// agreement. It deliberately does NOT trust the reaper's log for counts: a blind
// reaper logs healthy numbers (the 2026-05-31 incident logged "0 claude procs"
// while 70 piled up), and the raw total conflates Brian's open interactive desktop
// chats with leaks (2026-06-10: 16 idle-but-legitimate open chats pushed the total
// past the old threshold of 20 and false-alarmed his phone).
//
// Usage:
//   node scripts/resource-watchdog.mjs                 # gather + print JSON
//   node scripts/resource-watchdog.mjs --alert          # + text Brian on a high finding
//   node scripts/resource-watchdog.mjs --json --reaper-loaded false --leaked-scheduled 5 --load 25 ...   # test hooks

import fs from 'node:fs';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scanScheduledSessions } from './inbox-sweep-reaper.mjs';

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
  // Leaked scheduled sessions resident RIGHT NOW (already past the reaper's own
  // age+idle limits). A healthy reaper clears these within one 5-min scan, so a
  // straggler or two is a race, but 3+ means the reaper is blind or failing.
  maxLeakedScheduled: 2,
  // Catch-all on TOTAL claude procs, for pileups the identity check can't see
  // (e.g. the marker regex going blind — then leakedScheduled reads 0 too).
  // Brian's normal desktop use runs ~28-30 procs with many chats open
  // (measured 2026-06-10); the leak incident hit 48-70. 40 splits those.
  maxClaudeProcs: 40,
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
    findings.push({ kind: 'reaper-not-loaded', severity: 'high', detail: `${REAPER_LABEL} is not loaded — leaked scheduled-task sessions will not be reaped` });
  } else if (metrics.reaperLoaded === true && metrics.reaperLogAgeMin != null && metrics.reaperLogAgeMin > thresholds.reaperLogStaleMin) {
    findings.push({ kind: 'reaper-stalled', severity: 'high', detail: `reaper loaded but last logged ${metrics.reaperLogAgeMin}m ago (>${thresholds.reaperLogStaleMin}m) — may be stalled` });
  }
  if (metrics.leakedScheduled != null && metrics.leakedScheduled > thresholds.maxLeakedScheduled) {
    findings.push({ kind: 'leaked-scheduled', severity: 'high', detail: `${metrics.leakedScheduled} leaked scheduled sessions resident past reap limits (>${thresholds.maxLeakedScheduled}) — reaper is missing them` });
  }
  if (metrics.claudeProcs != null && metrics.claudeProcs > thresholds.maxClaudeProcs) {
    findings.push({ kind: 'session-pileup', severity: 'high', detail: `${metrics.claudeProcs} claude processes resident (>${thresholds.maxClaudeProcs}) — runaway pileup` });
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

// Live counts via the reaper's own exported scan (read-only — it kills nothing).
// Returns nulls if the scan itself throws, so a broken scan can never read as
// "0 leaks, all healthy".
async function liveSessionCounts() {
  try {
    const { procs, toKill } = await scanScheduledSessions();
    return { claudeProcs: procs.size, leakedScheduled: toKill.length };
  } catch {
    return { claudeProcs: null, leakedScheduled: null };
  }
}

async function gather(args) {
  const num = (k) => (args[k] != null && args[k] !== true ? Number(args[k]) : undefined);
  const bool = (k) => (args[k] === 'true' ? true : args[k] === 'false' ? false : undefined);
  // Only pay for the ps+transcript scan when a test flag doesn't override both counts.
  const counts = (num('claude-procs') !== undefined && num('leaked-scheduled') !== undefined)
    ? { claudeProcs: undefined, leakedScheduled: undefined }
    : await liveSessionCounts();
  return {
    reaperLoaded: bool('reaper-loaded') ?? reaperLoaded(),
    reaperLogAgeMin: num('reaper-log-age') ?? reaperLogAgeMin(),
    claudeProcs: num('claude-procs') ?? counts.claudeProcs,
    leakedScheduled: num('leaked-scheduled') ?? counts.leakedScheduled,
    load1: num('load') ?? os.loadavg()[0]
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const metrics = await gather(args);
  const verdict = assessResources(metrics);
  const report = { checkedAt: new Date().toISOString(), reaperLabel: REAPER_LABEL, metrics, ...verdict };

  const high = report.findings.filter((f) => f.severity === 'high');
  if (args.alert && high.length) {
    const msg = `⚠️ Host/reaper: ${report.findings.map((f) => f.detail).join(' · ')}`;
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
    process.stdout.write(`resource-watchdog: ${report.ok ? 'OK' : report.findings.length + ' finding(s)'}\n`);
    process.stdout.write(`  reaper=${metrics.reaperLoaded} logAge=${metrics.reaperLogAgeMin}m claudeProcs=${metrics.claudeProcs} leakedScheduled=${metrics.leakedScheduled} load=${metrics.load1 != null ? metrics.load1.toFixed(1) : '?'}\n`);
    for (const f of report.findings) process.stdout.write(`  ${f.severity === 'high' ? '✗' : '⚠'} [${f.kind}] ${f.detail}\n`);
  }
  process.exit(0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((e) => {
    process.stderr.write(`resource-watchdog error: ${e && e.message}\n`);
    process.exit(1);
  });
}
