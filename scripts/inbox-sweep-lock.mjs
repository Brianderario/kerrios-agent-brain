#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));
const command = args._[0] || 'status';
const root = path.resolve(args.root || repoRoot);
const ttlMinutes = Number.parseInt(args['ttl-minutes'] || '90', 10);
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
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMinutes * 60_000).toISOString(),
    ttlMinutes
  };
  fs.writeFileSync(metaPath, `${JSON.stringify(meta, null, 2)}\n`);
  print({ acquired: true, lockDir, lock: meta });
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
