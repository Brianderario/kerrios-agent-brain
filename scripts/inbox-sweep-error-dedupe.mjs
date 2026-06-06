#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseArgs(values) {
  const out = { _: [] };
  for (let i = 0; i < values.length; i += 1) {
    const value = values[i];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = values[i + 1];
      if (next === undefined || next.startsWith('--')) {
        out[key] = true;
      } else {
        out[key] = next;
        i += 1;
      }
    } else {
      out._.push(value);
    }
  }
  return out;
}

function normalizeReason(reason) {
  return String(reason || '').trim().replace(/\s+/g, ' ');
}

function componentRecord(state, component) {
  if (state.mailboxes && state.mailboxes[component]) return state.mailboxes[component];
  state.components ||= {};
  state.components[component] ||= {};
  return state.components[component];
}

function parseTime(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : null;
}

function shouldAlert(record, reason, nowMs) {
  const previousReason = normalizeReason(record.lastErrorReason);
  const alertedAtMs = parseTime(record.lastErrorAlertedAt);
  const recoveredAtMs = parseTime(record.lastSuccessfulSweepAt);
  const sameReason = previousReason === reason;
  const alertedRecently = alertedAtMs != null && nowMs - alertedAtMs < DAY_MS;
  const recoveredSinceAlert = recoveredAtMs != null && alertedAtMs != null && recoveredAtMs > alertedAtMs;
  return !(sameReason && alertedRecently && !recoveredSinceAlert);
}

export function evaluateErrorDedupe(state, { component, reason, nowIso, markAlerted = false, clear = false }) {
  const normalized = normalizeReason(reason);
  if (!component) throw new Error('--component is required');
  if (!normalized && !clear) throw new Error('--reason is required unless --clear is used');
  const now = new Date(nowIso || new Date().toISOString());
  if (!Number.isFinite(now.getTime())) throw new Error(`invalid --now value: ${nowIso}`);

  const record = componentRecord(state, component);
  if (clear) {
    record.lastErrorAt = null;
    record.lastErrorReason = null;
    record.lastErrorAlertedAt = null;
    return { component, cleared: true, shouldAlert: false };
  }

  const alert = shouldAlert(record, normalized, now.getTime());
  record.lastErrorAt = now.toISOString();
  record.lastErrorReason = normalized;
  if (markAlerted) record.lastErrorAlertedAt = now.toISOString();

  return {
    component,
    reason: normalized,
    shouldAlert: markAlerted ? false : alert,
    lastErrorAlertedAt: record.lastErrorAlertedAt || null,
    markedAlerted: Boolean(markAlerted)
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = path.resolve(args.state || 'data/inbox-sweep-state.json');
  const state = JSON.parse(fs.readFileSync(file, 'utf8'));
  const result = evaluateErrorDedupe(state, {
    component: args.component,
    reason: args.reason,
    nowIso: args.now,
    markAlerted: Boolean(args['mark-alerted']),
    clear: Boolean(args.clear)
  });
  fs.writeFileSync(file, `${JSON.stringify(state, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
