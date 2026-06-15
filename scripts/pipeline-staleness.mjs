#!/usr/bin/env node
// pipeline-staleness.mjs — the "deals don't rot silently in proposal_sent" rule.
//
// THE LOGIC (built in, not assumed by an LLM each run):
//   For every OPEN deal, the routine supplies the latest thread touch: when it was and
//   whether the last message was OUTBOUND (we're waiting on them) or INBOUND (they're
//   waiting on us). This rule acts ONLY on real two-way signal, never on the CRM's
//   last_activity_at (which is bumped by our own edits/outreach and is therefore a lie
//   about whether the prospect actually replied — see process_inbound_email_job: inbound
//   only reaches the CRM via a SendGrid webhook that HWFYI's Outlook/Gmail mail never hits).
//
//   Decision per open deal (DEMOTE_DAYS=30, CLOSE_DAYS=60 by default):
//     - last message INBOUND  -> 'owe_reply'  (ball is in OUR court; never demote for this)
//     - waiting on them >= CLOSE_DAYS         -> 'propose_close' (approval-gated; never auto-close)
//     - waiting on them >= DEMOTE_DAYS        -> 'demote' one phase toward the funnel start
//                                                (lead has no lower stage -> 'flag_stale')
//     - otherwise                             -> 'none'
//
//   Demote tier = act-and-report (source-backed stage bookkeeping). Close tier = a
//   suggestion only; closing a deal is a human judgment call ("until a new opportunity
//   arises"). Demotions execute through console-pipeline-update.mjs so they inherit its
//   evidence-logging, --force regression handling, and value-preservation.
//
// Usage:
//   node scripts/pipeline-staleness.mjs --signals signals.json            # dry-run (default)
//   node scripts/pipeline-staleness.mjs --signals signals.json --apply    # demote stale deals
//   node scripts/pipeline-staleness.mjs --signals signals.json --json     # machine output
//   node scripts/pipeline-staleness.mjs --demote-days 30 --close-days 60 ...
//
//   signals.json = [ { "deal_id": "uuid", "last_msg_at": "2026-05-01T..Z",
//                      "last_msg_direction": "outbound" | "inbound" | "none" }, ... ]
//   "none" = we have NEVER had a two-way message (treat as waiting-on-them since deal age).

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';

import { resolveConfig, fetchAll, updatePipeline } from './console-pipeline-update.mjs';

export const OPEN_STAGES = ['lead', 'qualified', 'proposal_sent', 'contract_sent', 'negotiation'];

// One phase back toward the start of the funnel. Post-proposal stages collapse to
// proposal_sent; lead is the floor (nothing lower -> flag instead of demote).
export const DEMOTE_MAP = {
  negotiation: 'proposal_sent',
  contract_sent: 'proposal_sent',
  proposal_sent: 'qualified',
  qualified: 'lead',
  lead: null
};

export const DEFAULT_DEMOTE_DAYS = 30;
export const DEFAULT_CLOSE_DAYS = 60;

export function daysBetween(fromIso, now) {
  const from = new Date(fromIso);
  if (Number.isNaN(from.getTime())) return null;
  return Math.floor((now.getTime() - from.getTime()) / 86400000);
}

// PURE rule engine. signal = { stage, last_msg_at, last_msg_direction }.
export function decideStaleness(signal, { now, demoteDays = DEFAULT_DEMOTE_DAYS, closeDays = DEFAULT_CLOSE_DAYS } = {}) {
  const stage = signal.stage;
  if (!OPEN_STAGES.includes(stage)) {
    return { action: 'none', reason: `stage ${stage} is not open` };
  }

  const direction = signal.last_msg_direction || 'none';
  const waitingDays = signal.last_msg_at ? daysBetween(signal.last_msg_at, now) : null;

  // They replied last -> the ball is in our court. Not a staleness demotion.
  if (direction === 'inbound') {
    return { action: 'owe_reply', waitingDays, reason: 'last message was inbound; we owe the reply' };
  }

  // direction 'outbound' or 'none' -> we are waiting on the prospect.
  if (waitingDays === null) {
    return { action: 'none', reason: 'no usable last-message timestamp; needs an inbound check' };
  }

  if (waitingDays >= closeDays) {
    return {
      action: 'propose_close',
      waitingDays,
      reason: `no reply in ${waitingDays}d (>= ${closeDays}); propose closed_lost (approval-gated)`
    };
  }

  if (waitingDays >= demoteDays) {
    const toStage = DEMOTE_MAP[stage];
    if (!toStage) {
      return { action: 'flag_stale', waitingDays, reason: `no reply in ${waitingDays}d; ${stage} has no lower stage` };
    }
    return {
      action: 'demote',
      toStage,
      waitingDays,
      reason: `no reply in ${waitingDays}d (>= ${demoteDays}); demote ${stage} -> ${toStage}`
    };
  }

  return { action: 'none', waitingDays, reason: `waiting ${waitingDays}d (< ${demoteDays}); fresh` };
}

// ---- I/O layer (not exercised by the pure unit tests) ----

function parseArgs(argv) {
  const args = { apply: false, json: false, demoteDays: DEFAULT_DEMOTE_DAYS, closeDays: DEFAULT_CLOSE_DAYS, maxDemote: 8 };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--apply') args.apply = true;
    else if (a === '--dry-run') args.apply = false;
    else if (a === '--json') args.json = true;
    else if (a === '--signals') args.signals = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--demote-days') args.demoteDays = Number(argv[++i]);
    else if (a === '--close-days') args.closeDays = Number(argv[++i]);
    else if (a === '--max-demote') args.maxDemote = Number(argv[++i]);
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.signals) throw new Error('Missing --signals <file.json>');
  return args;
}

export async function run(argv = process.argv.slice(2), deps = {}) {
  const args = parseArgs(argv);
  const now = deps.now || new Date();
  const config = deps.config || resolveConfig();
  const fetchImpl = deps.fetchImpl || globalThis.fetch;

  const signals = JSON.parse(fs.readFileSync(args.signals, 'utf8'));
  const signalByDeal = new Map(signals.map((s) => [s.deal_id, s]));

  const allDeals = await fetchAll('/deals', { config, fetchImpl });
  const openDeals = allDeals.filter((d) => OPEN_STAGES.includes(d.stage));

  const results = [];
  for (const deal of openDeals) {
    const sig = signalByDeal.get(deal.id);
    if (!sig) {
      results.push({ deal_id: deal.id, company: deal.company_name, stage: deal.stage, action: 'no_signal',
        reason: 'no inbound signal supplied for this open deal' });
      continue;
    }
    const decision = decideStaleness({ stage: deal.stage, last_msg_at: sig.last_msg_at, last_msg_direction: sig.last_msg_direction },
      { now, demoteDays: args.demoteDays, closeDays: args.closeDays });
    results.push({ deal_id: deal.id, company_id: deal.company_id, company: deal.company_name,
      stage: deal.stage, last_msg_at: sig.last_msg_at, last_msg_direction: sig.last_msg_direction, ...decision });
  }

  // Execute demotions (act-and-report). Closes are emitted as proposals only.
  const demotions = results.filter((r) => r.action === 'demote');
  const proposeClose = results.filter((r) => r.action === 'propose_close');

  // Safety cap: if an unexpectedly large number of deals demote in one run, that is
  // almost always a bad/empty signal feed, not 9 deals genuinely going cold the same
  // day. Fail closed — report, do not mutate — and let a human look.
  let abortedApply = null;
  if (args.apply && demotions.length > args.maxDemote) {
    abortedApply = `refused to apply: ${demotions.length} demotions exceeds --max-demote ${args.maxDemote} (likely a signal-feed problem)`;
  }

  if (args.apply && !abortedApply) {
    for (const d of demotions) {
      const evidence = `Auto-demote (staleness sweep): last message was outbound from us ${d.waitingDays} days ago with no reply. `
        + `Demoting ${d.stage} -> ${d.toStage} per the 30-day no-reply rule (Brian 2026-06-14). Last touch ${d.last_msg_at}.`;
      try {
        const res = await updatePipeline({ companyId: d.company_id, stage: d.toStage, force: true, apply: true,
          source: 'pipeline-staleness sweep', evidence, now }, { config, fetchImpl });
        d.applied = true; d.new_stage = res.deal.stage;
      } catch (err) {
        d.applied = false; d.error = err.message;
      }
    }
  }

  const report = {
    generated_at: now.toISOString(),
    thresholds: { demote_days: args.demoteDays, close_days: args.closeDays },
    counts: {
      open_deals: openDeals.length,
      demote: demotions.length,
      propose_close: proposeClose.length,
      owe_reply: results.filter((r) => r.action === 'owe_reply').length,
      flag_stale: results.filter((r) => r.action === 'flag_stale').length,
      no_signal: results.filter((r) => r.action === 'no_signal').length,
      fresh: results.filter((r) => r.action === 'none').length
    },
    applied: args.apply && !abortedApply,
    aborted_apply: abortedApply,
    demotions, propose_close: proposeClose,
    owe_reply: results.filter((r) => r.action === 'owe_reply'),
    flag_stale: results.filter((r) => r.action === 'flag_stale'),
    no_signal: results.filter((r) => r.action === 'no_signal')
  };

  if (args.out) fs.writeFileSync(args.out, JSON.stringify(report, null, 2));
  if (args.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    const c = report.counts;
    process.stdout.write(`Pipeline staleness sweep ${report.applied ? '(APPLIED)' : '(dry-run)'} — ${c.open_deals} open deals\n`);
    if (abortedApply) process.stdout.write(`  ⚠ ${abortedApply}\n`);
    process.stdout.write(`  demote: ${c.demote} | propose_close: ${c.propose_close} | owe_reply: ${c.owe_reply} | flag_stale: ${c.flag_stale} | no_signal: ${c.no_signal} | fresh: ${c.fresh}\n`);
    for (const d of demotions) process.stdout.write(`  DEMOTE  ${d.company}: ${d.stage} -> ${d.toStage} (${d.waitingDays}d no reply)${args.apply ? (d.applied ? ' [applied]' : ` [FAILED: ${d.error}]`) : ''}\n`);
    for (const d of proposeClose) process.stdout.write(`  CLOSE?  ${d.company}: ${d.stage} (${d.waitingDays}d no reply) -> approval-gated suggestion\n`);
    for (const d of report.owe_reply) process.stdout.write(`  REPLY   ${d.company}: ${d.stage} — they replied ${d.waitingDays}d ago, we owe a response\n`);
    for (const d of report.no_signal) process.stdout.write(`  ?       ${d.company}: ${d.stage} — no inbound signal supplied\n`);
  }
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((e) => { process.stderr.write(`${e.message}\n`); process.exit(1); });
}
