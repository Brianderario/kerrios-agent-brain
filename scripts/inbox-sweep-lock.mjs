#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const command = args._[0] || 'status';
const root = path.resolve(args.root || repoRoot);
// TTL is the crash-fuse for a holder that died without releasing. Codex-owned locks
// rely on this TTL only because the Claude-session reaper cannot observe Codex runner
// liveness. Claude fallback locks can still be reclaimed faster by that reaper when it
// can prove no scheduled inbox-sweep session is alive. Kept comfortably longer than any
// real sweep (~1-2 min of work) but far below the old 90 min so a failed recovery still
// self-heals inside half an hour. A sweep never legitimately runs this long.
const ttlMinutes = Number.parseInt(args['ttl-minutes'] || '30', 10);
const lockDir = path.join(root, 'data', '.inbox-sweep-run-lock');
const metaPath = path.join(lockDir, 'lock.json');

if (!Number.isFinite(ttlMinutes) || ttlMinutes < 5) {
  fail(1, 'ttl-minutes must be an integer >= 5');
}

switch (command) {
  case 'acquire':
    acquire();
    break;
  case 'release':
    release();
    break;
  case 'status':
    status();
    break;
  default:
    fail(1, `unknown command: ${command}`);
}

function acquire() {
  const runner = resolveRunner(args);
  fs.mkdirSync(path.dirname(lockDir), { recursive: true });

  const existing = readMeta();
  if (existing && isStale(existing)) {
    fs.rmSync(lockDir, { recursive: true, force: true });
  }

  try {
    fs.mkdirSync(lockDir);
  } catch (error) {
    if (error && error.code === 'EEXIST') {
      const current = readMeta();
      print({
        acquired: false,
        reason: 'busy',
        lockDir,
        holder: current || null
      });
      process.exit(2);
    }
    throw error;
  }

  const now = new Date();
  const meta = {
    pid: process.pid,
    host: os.hostname(),
    runner: runner.name,
    runnerSource: runner.source,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
    ttlMinutes
  };
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  print({ acquired: true, lockDir, lock: meta });
}

function resolveRunner(parsedArgs) {
  const explicit = parsedArgs.runner || process.env.KERRI_INBOX_SWEEP_RUNNER || process.env.KERRI_LOCK_RUNNER;
  if (explicit) return normalizeRunner(explicit, parsedArgs.runner ? 'cli' : 'env');

  const detected = detectRunnerFromProcessTree(process.pid);
  return { name: detected || 'unknown', source: detected ? 'process-tree' : 'fallback' };
}

function normalizeRunner(value, source) {
  const name = String(value || '').trim().toLowerCase();
  if (!['codex', 'claude', 'local', 'unknown'].includes(name)) {
    fail(1, `runner must be one of: codex, claude, local, unknown`);
  }
  return { name, source };
}

function detectRunnerFromProcessTree(startPid) {
  let pid = Number(startPid);
  const seen = new Set();
  for (let i = 0; i < 16 && Number.isFinite(pid) && pid > 1 && !seen.has(pid); i += 1) {
    seen.add(pid);
    const proc = processInfo(pid);
    if (!proc) return null;
    const command = proc.command || '';
    if (command.includes('/Applications/Codex.app/') || command.includes('@openai/codex') || /\bcodex\b/i.test(command)) {
      return 'codex';
    }
    if (/claude-code\/[^/]+\/claude\.app\/Contents\/MacOS\/claude/.test(command)) {
      return 'claude';
    }
    pid = proc.ppid;
  }
  return null;
}

function processInfo(pid) {
  try {
    const out = execFileSync('ps', ['-p', String(pid), '-o', 'ppid=,command='], { encoding: 'utf8' }).trim();
    const match = out.match(/^(\d+)\s+([\s\S]+)$/);
    if (!match) return null;
    return { ppid: Number(match[1]), command: match[2] };
  } catch {
    return null;
  }
}

function release() {
  fs.rmSync(lockDir, { recursive: true, force: true });
  print({ released: true, lockDir });
}

function status() {
  const meta = readMeta();
  print({
    locked: Boolean(meta && !isStale(meta)),
    stale: Boolean(meta && isStale(meta)),
    lockDir,
    lock: meta || null
  });
}

function readMeta() {
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } catch {
    return fs.existsSync(lockDir)
      ? { startedAt: null, expiresAt: null, unreadable: true }
      : null;
  }
}

function isStale(meta) {
  // TTL-only staleness. This lock is held ACROSS invocations: `acquire` writes
  // the lock and exits; the sweep runs in a separate process; `release` removes
  // it later. The recorded pid is therefore the short-lived acquire process,
  // never the live holder — so PID-liveness cannot be used to reclaim it (doing
  // so makes every same-host lock instantly reclaimable and defeats mutual
  // exclusion). The TTL is the crash fuse for a holder that died without
  // releasing.
  if (!meta.expiresAt) return true;
  return Date.parse(meta.expiresAt) <= Date.now();
}

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      out[key] = values[i + 1];
      i += 1;
    } else {
      out._.push(value);
    }
  }
  return out;
}

function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function fail(code, message) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}
