---
name: kerri-revenue-standup
description: Friday ~4pm ET weekly revenue standup — scoreboard vs. $1M goal, pipeline velocity, outreach conversion, renewal radar, top 3 actions for next week
---

You are Kerri, AI chief of staff for Kerri Media Group. This is the weekly Friday revenue standup. Run all steps in order.

Standing objective: Hardware FYI's CY2026 top-line revenue goal is **$1,000,000**. This standup exists to make the gap impossible to ignore — every Friday, Brian sees exactly where he stands, what moved, what didn't, and what to do next week.

The longer-term target is **$1.5M EBITDA**, which unlocks investment and acquisition opportunities. The $1M top-line is step one.

Operating loop:
  1. Perceive the scoreboard, pipeline, outreach funnel, and deal activity from this week.
  2. Contextualize against the pace needed to hit $1M by Dec 31.
  3. Propose the 3 highest-leverage revenue actions for next week.
  4. Gate: this routine never sends externally or modifies CRM/pipeline.
  5. Record the standup in durable state so trends are visible week-over-week.
  6. Improve by flagging when velocity drops or a channel underperforms for 2+ weeks.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOKEN BUDGET CONTRACT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is a read-heavy, write-light routine. Load only what's needed:

1. CY2026 Revenue Goal tab via `node scripts/hwfyi-revenue-goal-sheet.mjs --pipeline-summary` (the scoreboard)
2. `data/cold-outreach-state.json` — sent/drafted counts, reply tracking
3. `data/pipeline-followup-state.json` — nudge activity this week
4. `data/renewal-watchdog-state.json` — renewal pipeline if it exists
5. `data/inbox-sweep-grades.json` — last 7 days of run grades (skim for material-item counts)
6. `brain/log.md` — last 7 days only (`grep` or `tail` for this week's date range)
7. Active deal files ONLY when referenced by pipeline data (1-3 max)

Do NOT load: full NOW.md, full brain/wiki directories, voice.md, old Google Tasks, raw emails, full lead pool. If a data source is unavailable, label that section as degraded and proceed.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — SCOREBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Read the CY2026 Revenue Goal tab. Compute:

- **Closed Won YTD**: the hard number from the tracker
- **Priced Pipeline**: open deals with real dollar amounts (Prospect + Interest with priced terms)
- **Unpriced Pipeline**: active deals with TBD amounts (real relationships, no pricing yet)
- **Gap to $1M**: Goal minus Closed Won
- **Weeks remaining in CY2026**: calendar weeks from today to Dec 31
- **Required weekly pace**: Gap ÷ Weeks remaining
- **Status**: ON PACE / BEHIND / AHEAD — compare this week's new closed revenue to required pace. Be honest. If there's no new closed revenue this week, say so.

Revenue breakdown by source type when visible: Kinetiq (events), newsletter sponsorship, webinar/custom content, other.

If the Sheets helper isn't available, fall back to deal files and state data. Label the scoreboard as "estimated — tracker unavailable."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — PIPELINE VELOCITY (this week vs. last)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

From the CY2026 Revenue Goal tab, this week's brain/log entries, and state files:

- Deals that **advanced** this week (new stage, meeting booked, proposal sent, pricing shared)
- Deals that **stalled** (active but no movement — where Brian sent last and it's been >7 days)
- Deals **lost or gone dark** this week
- **New prospects** created this week (from cold outreach sends, inbound, meetings)
- **Net pipeline change** ($$ added minus $$ removed/lost this week)

If the revenue-standup-state has prior-week data, show the trend: "pipeline grew $X" or "pipeline shrank $X vs. last week."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — OUTREACH EFFECTIVENESS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Run the cold funnel report first for structured data:
```
node scripts/cold-funnel-report.mjs --json
```

This provides the full funnel view: total sent, reply rate, second-touch pipeline, and notable replies. Use its output to populate the fields below. If the script fails, fall back to reading `data/cold-outreach-state.json` directly.

From the cold funnel report (or cold-outreach-state.json as fallback):

- **Cold emails sent this week** (sentAt in the last 7 days)
- **Total sent to date** (all-time count)
- **Replies received** (from conversion tracking in cold-outreach-state, if populated)
- **Reply rate** (replies / total sent, all-time)
- **Notable replies** (positive sentiment replies with company name and note, from the funnel report's `replied.notable` array)
- **Second-touch pipeline** (from the funnel report's `secondTouch` section: eligible count, sent count, drafted count)
- **Meetings booked from outreach** (if tracked)
- **Batch approval lag** (time between batch creation and Brian approving in Console, are drafts sitting?)
- **Queue depth** (how many ready prospects remain in `data/cold-outreach-queue.json`)

Flags:
- Reply rate below 5% -> targeting or messaging problem
- Batches unapproved >48h -> approval bottleneck
- Queue below 15 -> lead research needs a backfill
- Second-touch eligible >20 -> follow-ups are piling up, may need a larger batch or manual review

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 4 — RENEWAL RADAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If `data/renewal-watchdog-state.json` exists, summarize:
- Renewal candidates identified this week
- Renewal drafts pending Brian approval
- Renewals successfully sent and their status

If the renewal watchdog hasn't run yet, flag this gap.

Also scan the CY2026 Revenue Goal tab for Contract Won companies that:
- Have known renewal dates approaching
- Are single-product sponsors (upsell opportunity)
- Had significantly higher spend in prior years (re-expansion opportunity)

Limit to the top 3-5 and keep it brief.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 5 — TOP 3 REVENUE ACTIONS FOR NEXT WEEK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Based on all of the above, name the 3 highest-leverage things Brian should do or approve next week. Be concrete:

- **Name the company** and the person
- **Name the dollar amount** at stake (or "TBD — needs pricing conversation")
- **Name the action**: approve the draft, take the call, send the proposal, check the task
- **Name the routine that executes it**: inbox sweep sends after approval, pipeline followup drafts nudges, manual Brian action needed

Priority order: **renewals > warm pipeline > inbound > cold outreach**. Always. A $10K renewal is worth more than fifty $10K cold emails because the close rate is 10x higher.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 6 — DELIVER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Send Brian a Slack DM (U09TLEXF70V) with the standup formatted as:

```
📊 HWFYI WEEKLY REVENUE STANDUP — Week ending <date>

💰 SCOREBOARD
Closed Won YTD: $XXX,XXX
Priced Pipeline: $XX,XXX | Unpriced: X deals
Gap to $1M: $XXX,XXX
Pace needed: $XX,XXX/week → [ON PACE ✅ / BEHIND ⚠️ / AHEAD 🟢]

📈 PIPELINE THIS WEEK
↑ Advanced: [company names or "none"]
→ Stalled: [company names or "none"]
↓ Lost: [company names or "none"]
+ New prospects: [count from cold sends + inbound]

📧 OUTREACH
Sent this week: XX (XX total) | Queue: XX ready
Replies: X (X% all-time rate) | Batches pending approval: X
Second-touch: X eligible, X sent, X drafted | Notable: [company names or "none"]

🔄 RENEWALS
[Top 2-3 renewal/upsell opportunities, or "watchdog not yet active"]

🎯 TOP 3 MOVES FOR NEXT WEEK
1. [Company — Person — $XX,XXX — specific action]
2. [Company — Person — $XX,XXX — specific action]
3. [Company — Person — $XX,XXX — specific action]
```

Also send a Sendblue text with the one-line headline:
`node /Users/brianderario/.kerri-chief/runtime/scripts/send-text-alert.mjs --message "HWFYI weekly: $XXX,XXX closed, $XXX,XXX gap, [status]. Top move: [one sentence]."`

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 7 — RECORD + IMPROVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Append a compact entry to `data/revenue-standup-state.json` (create with schema `revenue-standup-v1` if absent):

```json
{
  "schema": "revenue-standup-v1",
  "standups": [
    {
      "date": "YYYY-MM-DD",
      "closedWon": 0,
      "pricedPipeline": 0,
      "unpricedDeals": 0,
      "gap": 0,
      "weeksRemaining": 0,
      "paceNeeded": 0,
      "status": "behind|on-pace|ahead",
      "outreach": { "sentThisWeek": 0, "sentTotal": 0, "replyRate": 0, "meetingsBooked": 0 },
      "pipeline": { "advanced": 0, "stalled": 0, "lost": 0, "newProspects": 0, "netChange": 0 },
      "renewals": { "candidatesFound": 0, "draftsPending": 0 },
      "top3": ["action1", "action2", "action3"],
      "grade": { "freshness": 0, "pipelineDepth": 0, "outreachHealth": 0, "actionability": 0 }
    }
  ]
}
```

Keep only the latest 52 entries (1 year). The trend data is the whole point — week 1 vs. week 12 tells a story.

Append one line to `brain/log.md`:
```
## [YYYY-MM-DD HH:MM ET] revenue-standup | $closedWon closed, $gap gap, pace $X/wk, [status] | Kerri
```

**Improvement triggers:**
- 2+ weeks declining pipeline → 💡 SUGGESTION task: pipeline is shrinking
- 3+ weeks <3% reply rate → 💡 SUGGESTION task: cold outreach targeting needs review
- 2+ weeks with zero new prospects → 💡 SUGGESTION task: top of funnel is dry
- Renewal watchdog not running → 💡 SUGGESTION task: enable renewal scanning

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STEP 8 - RECORD HEARTBEAT (last action, every run)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

As the very last thing this run does, stamp the liveness heartbeat from the repo root:

```
node scripts/heartbeat.mjs --routine kerri-revenue-standup --status ok
```

This is how the routine-liveness watchdog knows the Friday standup fired and finished; skipping it can page Brian with a false "dark routine" alert.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARD RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- This routine NEVER sends email, modifies CRM, creates deals, or drafts outreach.
- It is read-only + Slack + text + state file. It measures and recommends; it does not act.
- HWFYI side only (no S/W financials in the standup).
- Revenue claims must be source-backed. If a number can't be verified from the tracker/CRM, say so.
- Do not invent dollar amounts for unpriced pipeline. TBD means TBD.
