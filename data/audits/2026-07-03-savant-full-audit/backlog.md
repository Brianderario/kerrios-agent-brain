# Savant Codebase Audit — Ranked Backlog (2026-07-03)

106 verified findings from a 14-subsystem Fable audit. **5 SHIPPED tonight** (marked ✅). The rest are ranked for follow-up. All 11 client-email-adjacent items keep sends OFF.

## ✅ Shipped tonight (5)

- **Non-object tool-call arguments crash the entire agent run instead of self-correcting** — medium bug [asksavant-core]
- **ConfirmationGate authorizes external sends off incidental words: mid-message affirmatives and noun-form 'reply' bypass the preview** — high bug [asksavant-core]
- **TaskQueueHealth runs an unbounded N+1 over every done agent task on every page render (topbar badge)** — high upgrade [tasks-board]
- **Console and API sponsor-asset file uploads land on ephemeral Render disk and silently vanish on the next deploy** — critical bug [sponsor-hub]
- **SafeHttp SSRF guard bypassed by IPv4-mapped IPv6 addresses (metadata endpoint reachable)** — critical bug [external-clients]

## Backlog (101), ranked by severity then confidence

### 1. [high·confirmed·upgrade·slack] Socket Mode connection has no liveness detection — a silently dead socket makes the bot deaf until restart
- **Files:** app/services/slack/socket_mode_connection.rb:48; app/services/slack/socket_mode_connection.rb:57; app/services/slack/socket_mode_runner.rb:48
- **Value/failure:** Concrete value: Kerri/Oliver stop answering Slack silently and stay deaf indefinitely (Brian on his phone sees no reply at all, no error) until someone restarts the socket worker. A read deadline turns every dead-socket scenario into an automatic reconnect within ~90 seconds inst
- **Fix:** In SocketModeConnection#run, track `last_read_at = Time.current` after each successful readpartial, and replace the blocking read with a select-with-timeout: `readable = IO.select([io.to_io], nil, nil, 15)` (expose the underlying SSL socket via a WebSocketIo#t

### 2. [high·confirmed·bug·slack] default_user_email fallback lets any unmapped Slack workspace member or guest act as Brian
- **Files:** app/services/slack/user_resolver.rb:12; app/services/slack/event_processor.rb:47
- **Value/failure:** A single-channel guest or new hire added to the Slack workspace (contractor, S&W collaborator, event vendor) DMs the Kerri app. Their profile email matches no Savant user, so they resolve to Brian's User and the agent runs with Brian's full capability set: reading Brian's mailbox
- **Fix:** Constrain the fallback in UserResolver#resolve: only use default_user_email when the Slack user id appears in workspace.user_email_by_slack_id, OR when the Slack profile email's domain is on an allowlist derived from the org (e.g. domains of existing member em

### 3. [high·confirmed·bug·tasks-board] 🔒client-email(OFF) Pull-back ignores the in-flight send claim, so an email can go out after a 'successful' pull-back (double-send risk)
- **Files:** app/controllers/tasks_controller.rb:226; app/controllers/tasks_controller.rb:230; app/jobs/send_approved_drafts_job.rb:157
- **Value/failure:** Brian approves a card; within the ~2-minute window the job claims it and starts a slow send (Drive fetch + network). Brian taps 'PULL BACK TO EDIT' on his phone: the guard passes (applied_at is nil), the card returns to needs_approval and he's told 'It won't send until you approv
- **Fix:** In pull_back's with_lock block, before the applied_at check, add: if payload["send_started_at"].present? && fresh (< SendApprovedDraftsJob::UNCONFIRMED_SEND_GRACE old) -> set a third flag (e.g. sending_now = true) and redirect with alert 'Kerri is sending this

### 4. [high·confirmed·bug·tasks-board] API create's idempotent-replay path bypasses the completion-proof gate (and can regress live cards)
- **Files:** app/controllers/api/v1/tasks_controller.rb:39; app/controllers/api/v1/tasks_controller.rb:45; app/controllers/api/v1/tasks_controller.rb:181
- **Value/failure:** An agent with only tasks:write POSTs /api/v1/tasks with an existing external_ref and task[status]=done and no proof: the card silently archives as done with zero completion proof — exactly the done-without-proof failure mode the gate and the QUEUE badge were built to prevent — an
- **Fix:** In the replay branch: (1) run the same completion_write_allowed?(existing.status) check before existing.update! when refresh_attrs['status'] == 'done' and the card isn't already done; (2) drop 'status' from refresh_attrs when existing.resolution.present? (a re

### 5. [high·confirmed·upgrade·tasks-board] Held cards (numeric mismatch, sign-off mismatch, unconfirmed send, missing attachments) look identical to fresh cards on the board and review page
- **Files:** app/jobs/send_approved_drafts_job.rb:196; app/jobs/send_approved_drafts_job.rb:265; app/views/tasks/show.html.erb:44
- **Value/failure:** Concrete value: Brian on his phone sees a card back in Needs approval, assumes Kerri filed a fresh draft, and taps APPROVE & SEND without reading the proof trail. For held_reason=send_unconfirmed that is exactly the dangerous move — the hold text says 'check the Sent folder befor
- **Fix:** In show.html.erb, right above the resolution panel (line 44), render a warn-styled panel when @task.resolution_payload.to_h['held_reason'].present?: headline per reason ('Held before send — do not re-approve until you check the Sent folder' for send_unconfirme

### 6. [high·confirmed·upgrade·crm-pipeline] Stage moves never emit the proposal_sent/contract_sent engagement signals DealBrief and DealHealth are built to track
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/crm/account_signal_recorder.rb:174-182; /Users/brianderario/Projects/kerrihq-rails/app/services/crm/deal_brief.rb:20-23; /Users/brianderario/Projects/kerrihq-rails/app/models/account_signal.rb:28-39
- **Value/failure:** Concrete value: the deal_brief payload is what Kerri/Vaughn draft advancing follow-ups from. Today its proposal tracking is dead weight -- Brian drags a deal to 'Proposal sent' on his phone and the brief still says nothing was sent. Wiring the stage move to the engagement signal 
- **Fix:** In Crm::AccountSignalRecorder#from_activity (or activity_signal_type), when record.action == 'stage_changed' and record.metadata['to'] == 'proposal_sent', return signal_type 'proposal_sent' (strength 1); when metadata['to'] == 'contract_sent', return 'contract

### 7. [high·confirmed·upgrade·sponsor-hub] Newsletter inventory horizon is hardcoded to 2026 — 2027 slots can't be seen or sold from sell-through or the agent slots API
- **Files:** app/services/newsletter_sell_through.rb:25; app/controllers/newsletter_inventory_controller.rb:42-44; app/services/newsletter_slot_seeder.rb:14
- **Value/failure:** KMG's stated goal is $150K of 2027 revenue booked before EOY 2026, and 2027 goal-setting starts 2026-09-01 — selling 2027 slots is imminent. Today an agent asking the slots API for open inventory gets zero 2027 slots (none seeded, default window ends 2026-12-31), Brian's sell-thr
- **Fix:** NewsletterSellThrough: default year: Date.current.year. Controller: @sell_through = NewsletterSellThrough.new(organization: @organization, year: params[:year]&.to_i&.clamp(2024, 2100) || Date.current.year); add prev/next-year links in the sell_through view. Ne

### 8. [high·confirmed·upgrade·mail] Unified outbound-mail ledger: no single record of what actually left the mailboxes
- **Files:** app/services/microsoft_graph_client.rb:175; app/services/microsoft_graph_client.rb:199; app/services/gmail_mailbox_client.rb:129
- **Value/failure:** Concrete value: (1) audit-ready answers to Brian's most common question ('did that email actually go out?') without grepping Render logs; (2) a reliable data source for the 'check email before cold' warm/cold rule and duplicate-send forensics (e.g. after a send_unconfirmed hold, 
- **Fix:** Additive migration: outbound_mail_logs (provider, mailbox, kind[send/reply], to/cc/bcc jsonb, subject, provider_message_id, conversation_id, source tag, task_id/outbound_email_id nullable, sent_at, has_attachments). At the tail of GmailMailboxClient#send_messa

### 9. [high·confirmed·bug·agents-infra] FlowExecutor holds a DB transaction + row lock across entire step execution, so a crash mid-step rolls back the ledger after external sends already happened (duplicate-send risk)
- **Files:** app/services/agents/flow_executor.rb:54; app/services/agents/flow_executor.rb:121-142; app/services/agents/flow_executor.rb:499-501
- **Value/failure:** Concrete failure: flow = [approval step (succeeded), tool step send_mail]. The tool step executes: Graph API sends the mail, step.succeed! is written inside the still-open transaction, then Render restarts the dyno mid-commit window. The transaction rolls back, the step is back t
- **Fix:** Split step! into claim/execute/record phases: (1) short `with_lock` transaction that finds the next actionable step, transitions it to running with a lease token (e.g. `executor_lease` + `lease_expires_at` columns, additive migration) and COMMITS; (2) execute 

### 10. [high·confirmed·bug·brain-perms] AgentScopeResolver merge() widens an agent's scope to its owner's grants (privilege escalation)
- **Files:** app/services/agent_scope_resolver.rb:31-32; app/controllers/api/v1/knowledge_records_controller.rb:78; app/services/permission_resolver.rb:56-65
- **Value/failure:** Agent owned by a non-master user (e.g. Benji once brand-wall memberships land, or Ari without master_access): agent grant = read pipeline domain up to normal_internal; owner grant = read all domains up to finance_sensitive. GET /api/v1/knowledge_records?agent_slug=... returns pip
- **Fix:** Stop using merge for intersection. In AgentScopeResolver#readable_knowledge_scope: `agent_scope = agent_resolver.readable_knowledge_scope(base); owner_scope = owner_resolver.readable_knowledge_scope(base); scoped = agent_scope.where(id: owner_scope.select(:id)

### 11. [high·confirmed·bug·brain-perms] BrainExporter (download_brain MCP tool + brain resource) bypasses the brand wall entirely
- **Files:** app/services/brain_exporter.rb:56-60; app/services/brain_exporter.rb:89-103; app/tools/brain/download_brain_tool.rb:29
- **Value/failure:** Once brand_enforcement flips: Benji's HFYI-restricted API key calls the download_brain MCP tool (requires only brain:read) and receives every S&W-boundary-adjacent, finance, and executive knowledge record with bodies — the entire wall defeated by one tool call, while /api/v1/know
- **Fix:** Give BrainExporter a `restricted_to_property:` kwarg. In DownloadBrainTool and BrainResource, resolve the caller's restriction the same way BaseController does (Current.api_key -> ApiPolicyContext#brand_restriction_in(Current.organization)) and pass it in. In 

### 12. [high·confirmed·bug·brain-perms] API knowledge_records#update enforces no agent write grants and lets agents rewrite provenance
- **Files:** app/controllers/api/v1/knowledge_records_controller.rb:58-70; app/controllers/api/v1/knowledge_records_controller.rb:45-48; app/controllers/api/v1/knowledge_records_controller.rb:98-102
- **Value/failure:** Kerri's agent, granted read+create only, PATCHes /api/v1/knowledge_records/:id with agent_slug=kerri and body='<hallucinated fact>' on a stale imported record: succeeds, silently corrupting brain history with no grant covering update. Setting source_path='brain/wiki/other.md' det
- **Fix:** In #update: (1) mirror create's gate — `if acting_agent && !agent_scope_resolver.allowed?(action: :update, domain: record.domain, sensitivity: record.sensitivity, kind: record.kind, source_system: record.source_system, property: record.property)` render 403; (

### 13. [high·confirmed·upgrade·brain-perms] Agent-filed brain records are never brand-tagged (property_id always nil via the API)
- **Files:** app/controllers/api/v1/knowledge_records_controller.rb:52-55; app/controllers/api/v1/knowledge_records_controller.rb:99-101; app/models/knowledge_record.rb:33-38
- **Value/failure:** Concrete value: when brand enforcement flips (PR8), every candidate Kerri filed since the backfill — including plainly Hardware-FYI facts — is invisible to Benji (HFYI-restricted), so the person meant to review HFYI brain candidates can't see them; meanwhile the promotion queue f
- **Fix:** Additive only: (1) permit an optional `property` slug in record_params, resolve via `Property.find_by!(slug:)`, and include it in the create attrs; (2) include `property:` in the agent grant check at line 45 so a property-scoped grant is honored; (3) default w

### 14. [high·confirmed·upgrade·external-clients] Render rollback (the canary dead-man lever) is a single POST with no retry — a transient blip strands bad code live
- **Files:** app/services/render_client.rb:58; app/services/render_client.rb:77; app/jobs/self_upgrade_canary_job.rb:105
- **Value/failure:** Canary detects a degraded agent, calls rollback!, the Render API returns a transient 502 or the connection times out once -> result is 'rollback_failed', self-upgrades freeze, but the broken code stays live on all services until a human intervenes. A couple of retries would have 
- **Fix:** Wrap rollback! (and ideally deploys reads it depends on) in a small retry loop: 3 attempts with exponential backoff on Net::OpenTimeout/Net::ReadTimeout/5xx before raising. Consider verifying the resulting live deploy afterward (poll live_deploy) so a silent n

### 15. [high·confirmed·bug·contracts] 🔒client-email(OFF) Contract flow 500s end-to-end for deals without an event (newsletter deals)
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/contracts_controller.rb:19; /Users/brianderario/Projects/kerrihq-rails/app/controllers/contracts_controller.rb:26; /Users/brianderario/Projects/kerrihq-rails/app/models/contract_template.rb:15
- **Value/failure:** Open 'New contract' on any deal that has no event (the newsletter pipeline, an increasing share of HWFYI revenue): NoMethodError on nil at contract_template.rb:15 -> 500 page. Even a contract created another way and sent for signing crashes SendContractForSigningJob inside the ma
- **Fix:** Nil-safe the event everywhere: (1) contract_template.rb for_event -> ->(event) { event ? where(event_id: [event.id, nil]) : where(event_id: nil) }; (2) contracts_controller.rb#new title fallback "#{@deal.company.name} - #{@deal.name} Sponsorship Agreement" whe

### 16. [high·confirmed·upgrade·contracts] 🔒client-email(OFF) Persist the fully-executed PDF in Postgres and stop regenerating it with headless Chrome on every download
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/models/contract.rb:21; /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_fully_executed_contract_email_job.rb:16; /Users/brianderario/Projects/kerrihq-rails/app/controllers/contracts_controller.rb:118
- **Value/failure:** Value: (1) a byte-stable, sha256-stamped legal artifact that is guaranteed identical to what was emailed to the sponsor and survives deploys; (2) instant PDF downloads (send_data from Postgres) instead of a Chrome cold-start per tap, removing the single heaviest request on the we
- **Fix:** Additive migration: add kind (string, default 'external_upload') to contract_documents and replace the model's contract_id uniqueness validation with uniqueness scoped to kind (validation change only, no column drop). In SendFullyExecutedContractEmailJob#perfo

### 17. [high·confirmed·bug·api-v1] Completion proof gate bypassed via idempotent create replay on tasks
- **Files:** app/controllers/api/v1/tasks_controller.rb:39-53; app/controllers/api/v1/tasks_controller.rb:181-190
- **Value/failure:** Any key with tasks:write POSTs { task: { external_ref: "job-123", status: "done" } } for an existing card -> the card flips to done with zero completion proof, exactly what the done-without-proof queue-health check exists to prevent. An agent that hits a 422 on PATCH can (and eve
- **Fix:** In the replay branch, before existing.update!, run the same guard as #update: return unless completion_write_allowed?(existing.status) (generalize the method to take the task, since it currently reads @task implicitly via params only — it already only inspects

### 18. [high·confirmed·bug·api-v1] Brand wall not enforced on nested deal endpoints, account signals, company deal payloads, and approval decide/execute
- **Files:** app/controllers/api/v1/case_file_entries_controller.rb:24; app/controllers/api/v1/deal_stakeholders_controller.rb:36; app/controllers/api/v1/deals/deliverables_controller.rb:38
- **Value/failure:** A Benji HFYI-restricted key that gets 404 on GET /api/v1/deals/<sw-deal-id> can still GET /api/v1/deals/<sw-deal-id>/contracts/<id>/document and download the other brand's signed contract PDF, list its stakeholders' emails, and read its case file; GET /api/v1/companies/<id> leaks
- **Fix:** In each nested set_deal, use brand_scoped(current_organization.deals).find(params[:deal_id]) exactly like DealsController#set_deal. Brand-scope ApprovalRequests#decide/#execute lookups the same way index/show already do. In serialize_with_deals, filter deals t

### 19. [high·confirmed·upgrade·jobs] Long agent runs share the single 2-thread default worker with the 2-minute outbound send sweeps — approved emails can wait tens of minutes
- **Files:** /Users/brianderario/Projects/kerrihq-rails/config/queue.yml:8-15; /Users/brianderario/Projects/kerrihq-rails/app/jobs/agent_flow_step_job.rb:15; /Users/brianderario/Projects/kerrihq-rails/app/jobs/scheduled_agent_run_job.rb:64-69
- **Value/failure:** Concrete value: today, two concurrent long agent runs (e.g. a scheduled inbox sweep plus an AgentFlow step, or the 4am eval overlapping a routine) occupy both threads; every 2-minute SendApprovedDraftsJob tick queues behind them, so an email Brian approved sits unsent for 15-30+ 
- **Fix:** Additive queue split, no job renames: (1) in queue.yml add a dedicated worker block `queues: "outbound,default"` (or a separate `outbound`-only worker) with its own threads, and keep a `queues: "agents"` worker for long work; (2) set `queue_as :outbound` on Se

### 20. [high·confirmed·upgrade·jobs] A worker death mid ScheduledAgentRunJob leaves the AgentRun stuck 'running' forever — the routine silently skips and no failure alert ever fires
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/scheduled_agent_run_job.rb:52-69; /Users/brianderario/Projects/kerrihq-rails/app/jobs/agent_schedule_dispatcher_job.rb:26-34
- **Value/failure:** Failure: a deploy lands at 7:44am while the 7:45am S&W LinkedIn routine's run is mid-model-call. The run row stays 'running' forever, Brian gets no DM, no delivery-failure card, no failure alert — the sweep just didn't happen and nobody knows. Bonus hazard: the stuck run has fini
- **Fix:** Add a sweep to AgentScheduleDispatcherJob#perform mirroring resume_stale_agent_flows: `AgentRun.where(status: :running).where("external_id LIKE 'agent-schedule:%'").where(started_at: ..(now - 1.hour))` → update!(status: :failed, error: "worker died mid-run (st

### 21. [high·confirmed·bug·jobs] Self-upgrade canary chain has no backstop: one unexpected raise or a worker kill mid-check permanently strands the canary, so a degraded deploy never rolls back
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/self_upgrade_canary_job.rb:32-77; /Users/brianderario/Projects/kerrihq-rails/app/jobs/self_upgrade_step_job.rb:8-13; /Users/brianderario/Projects/kerrihq-rails/app/jobs/agent_schedule_dispatcher_job.rb:26-34
- **Value/failure:** Failure: mid-canary, the upgraded deploy restarts the worker while the canary check is executing → chain dead → upgrade stuck in :canary forever, the degraded-agent rollback and kill-switch freeze never engage, and a bad self-merged change stays live with nobody alerted. This def
- **Fix:** Two layers: (1) add `rescue StandardError => e` to SelfUpgradeCanaryJob#perform that logs and `requeue(upgrade, wait: 3.minutes) if upgrade&.canary?` (same shape as the existing RenderClient::Error rescue). (2) Add a chain-repair sweep to the every-minute Agen

### 22. [high·confirmed·bug·self-upgrade] CommandPolicy is a denylist that misses every shell and interpreter, allowing arbitrary code execution in the workspace
- **Files:** app/services/workspace_runner/command_policy.rb:9; app/services/workspace_runner/command_policy.rb:38
- **Value/failure:** An agent (or a user driving start_workspace_run, gated only to Brian/Ari/Benji) submits command `bin/rails runner "puts Rails.application.credentials.to_yaml"`; CommandPolicy allows it; the runner executes it on the production container and captures the dumped credentials into th
- **Fix:** Invert to an ALLOWLIST: permit only the specific executables self-upgrade/workspace runs need (git with the existing subcommand guard, bundle, bin/rails with an allowlisted subcommand set that excludes runner/console/dbconsole, rubocop, rspec, yarn/npm ci). At

### 23. [high·confirmed·bug·self-upgrade] Workspace subprocesses inherit the full production ENV (no unsetenv_others), exposing GitHub/Render/DB/SendGrid secrets
- **Files:** app/services/workspace_runner/runner.rb:192; app/services/workspace_runner/runner.rb:259
- **Value/failure:** A workspace command such as `sh -c 'set'` or a Ruby-based tool step prints/uses the inherited RENDER_API_KEY or GITHUB_CODE_WRITE_TOKEN; the value lands in event stdout/stderr and the DB, and is returned to the agent — a credential that grants deploy/rollback and code-write on th
- **Fix:** Pass `unsetenv_others: true` to Open3.popen3 so only safe_env is present, and explicitly whitelist just the vars the toolchain needs (PATH, HOME, CI, RAILS_ENV, NODE_ENV, BUNDLE_*). Ensure GITHUB_*, RENDER_*, DATABASE_URL, SENDGRID_*, and master key are never 

### 24. [medium·confirmed·bug·asksavant-core] LLM context compaction can split an assistant tool_calls block from its tool results, producing an invalid transcript
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:1263; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:1286
- **Value/failure:** Exactly the longest, most valuable runs (big scheduled sweeps, multi-step research) are the ones that reach compaction. On the next request after a mid-block split, OpenAI-compatible servers typically 400 on a tool message with no preceding tool_calls (or the chat template mis-re
- **Fix:** After computing recent_start in summarize_older_context!, advance the boundary past any leading tool-role messages so the kept region never starts mid-block: `recent_start_pos = non_system.index(recent_start); recent_start_pos += 1 while messages[non_system[re

### 25. [medium·confirmed·upgrade·asksavant-core] Upgrade: top-level crash guard + 'crashed' stop reason in Agent#respond
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:288; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/run_telemetry.rb:28
- **Value/failure:** Value: the copilot can never return a raw 500 to Brian, every run — including crashed ones — emits its one-line [AskSavant][telemetry] record with a stable stop_reason, and regressions in the agent harness show up as a countable 'crashed' stop reason instead of scattered stack tr
- **Fix:** In Agent#respond add a final `rescue StandardError => e` mirroring the OllamaClient::Error branch: log e.class/e.message/top backtrace frames, telemetry.finish(stop_reason: "crashed"), log_telemetry, notify @observer, and return Result.new(text: "I hit an inte

### 26. [medium·confirmed·bug·asksavant-core] Post-answer false-claim grounding ignores the deadline and can hang an interactive request for up to 180 extra seconds
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:270; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:1023
- **Value/failure:** On the :app surface the user is waiting in the browser with a 240s run budget. A coding conversation that ends at ~t=235s with text like 'there is no PR #57' triggers a further 180s blocking GitHub poll — total request time up to ~420s, past typical proxy/HTTP timeouts on Render,
- **Fix:** In ground_false_code_nonexecution_claim (or at its call sites), skip checked_code_status_from_claim when past_deadline?; when not past deadline, clamp the wait to remaining budget: `wait = [[(@deadline - monotonic).to_i - 5, FORCED_CODE_CHECK_WAIT_SECONDS].min

### 27. [medium·confirmed·bug·asksavant-core] Forced merge/check scrapes the PR number from loose text and can act on the wrong (green Kerri) PR
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:917; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:946; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:973
- **Value/failure:** Brian says 'deploy it now' after a session that discussed two PRs (the new fix #250 and a referenced older #233). If the most recent PR-number mention in the transcript is #233, the harness force-merges #233. CodeShippingClient limits blast (kerri/ branch + CI green required, cod
- **Fix:** Tighten resolution order in direct_merge_pull_request_result/direct_check_pull_request_result: (1) if the user's latest message contains an explicit number (extend DEPLOYMENT_BOUNDARY_REQUEST_HINT to capture it), use exactly that; (2) otherwise use latest_code

### 28. [medium·confirmed·upgrade·asksavant-core] Upgrade: expose per-tool circuit-breaker state in agent_runtime_status / runtime health
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/tool_circuit_breaker.rb:38; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/tool_executor.rb:3931; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/tool_executor.rb:171
- **Value/failure:** Concrete value: when Graph mail or Apollo is flapping, scheduled sweeps silently degrade for whole runs and Brian's 'is Kerri healthy?' question in Slack answers 'all good'. With breaker state surfaced, the agent (and the QUEUE badge / task_queue_health path already used for diag
- **Fix:** Add ToolCircuitBreaker#snapshot: iterate ToolExecutor::EXTERNAL_TOOLS (the full key space is known), read each cache key, and return entries where state != closed as [{ tool:, state:, retry_after_seconds:, failures: }]. Merge it into AgentRuntimeHealth.snapsho

### 29. [medium·confirmed·upgrade·asksavant-core] Upgrade: make tool-result digestion and compaction summarization deadline-aware
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:465; /Users/brianderario/Projects/kerrihq-rails/app/services/ask_savant/agent.rb:1296
- **Value/failure:** Concrete value: faster interactive turns on Brian's phone — the :app surface is where he waits live, and each large tool result currently costs an extra synchronous condense round-trip even when the turn is about to be cut off. Skipping digestion under deadline pressure (falling 
- **Fix:** Add a helper `remaining_budget = @deadline - monotonic`. In prepared_tool_content, `return json if remaining_budget < 45` before calling condense_tool_result. In summarize_older_context!, skip the LLM summary (fall straight through to stub/prune, which compact

### 30. [medium·confirmed·bug·slack] Messages from OTHER bots are attributed to the agent itself as assistant turns in conversation history
- **Files:** app/services/slack/event_processor.rb:335; app/services/slack/event_processor.rb:245; app/services/slack/event_processor.rb:220
- **Value/failure:** Kerri and Oliver (two installs, same Slack team) share a channel like #kerri-jam. A user mentions @Kerri in a thread where Oliver has replied: Oliver's messages arrive in Kerri's history as Kerri's OWN prior assistant turns. Kerri then 'remembers saying' things it never said — it
- **Fix:** Split bot_message? into own_bot_message? (user == workspace.bot_user_id, or bot_id matches a stored own-bot id — capture the workspace's bot_id once via auth.test or from its own posted messages) and foreign_bot_message?. In conversation_history: own bot => ro

### 31. [medium·confirmed·bug·slack] accept_bot_messages workspaces can never actually be answered: EventProcessor drops every bot event that WorkspacePolicy approved
- **Files:** app/services/slack/event_processor.rb:94; app/services/slack/workspace_policy.rb:49; app/services/slack/configuration.rb:87
- **Value/failure:** Configure a workspace with accept_bot_messages: true so another agent (e.g. the Kerri bot identity relaying to OpenClaw agents) can talk to Savant: the sender bot posts, a task is created and 'succeeds', and nothing ever replies. The feature is a silent no-op end to end, plus it 
- **Fix:** Thread the workspace's accept_bot_messages? into EventProcessor#actionable_event?: allow bot events when the resolved workspace has accept_bot_messages? AND the event's bot_id is not the workspace's own bot (loop safety), e.g. move the bot_id check after resol

### 32. [medium·confirmed·bug·slack] First-ever concurrent events race on session/task creation and SlackEventJob has no retry — the losing Slack message is dropped with no reply
- **Files:** app/services/slack/session_queue.rb:50; app/services/slack/session_queue.rb:67; app/jobs/slack_event_job.rb:5
- **Value/failure:** Brian opens a fresh DM with a new install (or the first message after a session-key change) and fires two messages back to back: message #2's job dies with RecordNotUnique, no task, no reply, no error surfaced in Slack — it looks like the bot ignored him. Any transient DB deadloc
- **Fix:** Two-line hardening plus a rescue: (1) In SlackEventJob add `retry_on ActiveRecord::RecordNotUnique, ActiveRecord::Deadlocked, wait: 2.seconds, attempts: 3` — the whole enqueue path is idempotent (find_or_initialize on unique keys), so a retry converges to find

### 33. [medium·confirmed·upgrade·slack] Progress draft message is left behind above every answer — delete it after the final reply posts (phone UX)
- **Files:** app/services/slack/progress_draft.rb:28; app/services/slack/event_processor.rb:71; app/services/slack/client.rb:11
- **Value/failure:** Concrete value: every Slack conversation gets half as many bot messages; scrollback on mobile reads as clean Q→A pairs. Also removes the misleading permanent 'Blocked' stub duplication on error turns (the error reply already says the same thing).
- **Fix:** Add Client#delete_message(channel:, ts:) calling chat.delete. In EventProcessor#call, after post_reply succeeds (line 71), if @agent_task&.metadata&.dig("progress_message_ts") is present, delete it (rescue Client::Error and log; if delete fails, fall back to t

### 34. [medium·confirmed·upgrade·tasks-board] The tasks board never live-updates — Brian's phone approval surface goes stale between manual reloads
- **Files:** app/views/tasks/index.html.erb:37; app/models/task.rb:12
- **Value/failure:** Brian works the queue on his phone; a tab left open shows cards that were already sent (tapping through wastes time, and the stale 'Approved... pull it back' bar invites pulling back a card that's long gone) and misses new needs_approval cards until he pull-to-refreshes. A live b
- **Fix:** Use Rails 8 page-refresh broadcasts to stay silo-safe: (1) in Task, after_commit broadcast_refresh_later_to [organization, assignee, 'tasks'] (per-assignee stream, so no cross-lane leak; the refresh re-runs TasksController#index under current_user's own scope)

### 35. [medium·confirmed·bug·tasks-board] Vendor tracker master cards go permanently stale: rollup refreshes only when a child is linked, never when a child's status changes
- **Files:** app/services/tasks/vendor_card.rb:164; app/services/tasks/vendor_card.rb:142; app/models/task.rb:82
- **Value/failure:** The whole point of the master tracker (PR #237's per-event-per-category grouping) is a one-glance status rollup for an event's vendors. Today that rollup is only correct at the instant of filing; a week into event prep every label is wrong (approved/answered vendors still show 'a
- **Fix:** In Task, add an after_commit (on update) hook: if saved_change_to_status? && linkable_type == 'Task', load the parent; if parent.body.to_s.include?(Tasks::VendorCard::MANAGED_MARKER), call Tasks::VendorCard.refresh_master!(parent) (rescue/log so a rollup failu

### 36. [medium·confirmed·upgrade·tasks-board] 🔒client-email(OFF) The sweep's resolved=pending poll can hand out a card the Rails send job is actively sending (cross-sender double-send window)
- **Files:** app/controllers/api/v1/tasks_controller.rb:24; app/jobs/send_approved_drafts_job.rb:91
- **Value/failure:** If the sweep polls during the job's send window and decides to execute the same approved decision (the job's own header comment says it exists so sends don't 'depend on the agent's sweep parsing and sending it' — i.e. both know how), the sponsor gets the email twice: once from th
- **Fix:** Extend the resolved=pending filter to also exclude cards with a fresh in-flight claim: .where("(resolution_payload->>'send_started_at') IS NULL OR (resolution_payload->>'send_started_at')::timestamptz < ?", SendApprovedDraftsJob::UNCONFIRMED_SEND_GRACE.ago). P

### 37. [medium·confirmed·bug·crm-pipeline] Quick-add create_sponsor can regress an advanced deal back to qualified and double its package value
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:400-424
- **Value/failure:** Concrete failure: Brian opens the board quick-add modal, picks a sponsor from a stale search result (or the deal was advanced by an agent/another tab between search and submit), submits -- a deal sitting in negotiation or even closed_won is silently regressed to 'qualified', stag
- **Fix:** Scope the lookup to leads (@event.deals.sponsorship.by_stage(:lead).find(...)) or add the same guard the other actions use: unless @deal.lead? -> redirect with 'already on the pipeline board' notice and skip selections/stage move. One conditional, mirrors prom

### 38. [medium·confirmed·bug·crm-pipeline] GET /api/v1/renewals fires 2-4 extra queries per deal (fulfillment N+1) and is unpaginated
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/api/v1/renewals_controller.rb:31-41; /Users/brianderario/Projects/kerrihq-rails/app/models/deal.rb:191-211
- **Value/failure:** Agents poll this endpoint around the clock for Renewal Command. With N won deals carrying contract_end_dates and M placements each, every poll costs roughly N*(2 + M) queries instead of ~8; as the renewal book grows through the $1M push this endpoint gets linearly slower and heav
- **Fix:** Add :contract_deliverables and newsletter_placements: [:sponsor_commitment, :newsletter_issue] to the includes at api/v1/renewals_controller.rb:34-35 (copy the web controller's list). Optionally add opt-in pagination via the existing paginate() helper with a h

### 39. [medium·confirmed·upgrade·crm-pipeline] No way to retire a dead renewal: ended contracts flag 'renewal needs action' and sit on the worklist forever
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/models/deal.rb:143-150; /Users/brianderario/Projects/kerrihq-rails/app/services/crm/deal_health.rb:142-146; /Users/brianderario/Projects/kerrihq-rails/app/services/crm/hygiene_scorer.rb:146-150
- **Value/failure:** Concrete value: keeps the renewal book workable as it grows -- today a sponsor who declined renewal in January still shows 'RENEWAL OVERDUE 150D' and drags a permanent 14-point health penalty in every agent brief and API payload, drowning the renewals that actually need action.
- **Fix:** Additive migration: renewal_closed_at (datetime) + renewal_outcome (string: renewed/churned/one_off) on deals. Add a 'Close out renewal' action on the deal page + renewals worklist row. Web worklist and the health/hygiene renewal_needs_action? checks skip deal

### 40. [medium·confirmed·bug·crm-pipeline] Brand-wall gaps: companies autocomplete search and deal form dropdowns are not brand-scoped
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/companies_controller.rb:6-20; /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:626-630
- **Value/failure:** Concrete failure once enforcement flips: Benji opens the new-deal form or hits /organizations/:id/companies/search?q=a and sees Kinetic/S&W-adjacent companies, events, and people that the deals board correctly hides from him -- the wall leaks through autocomplete and form options
- **Fix:** In companies#search, wrap the base scope with BrandScope.wall_companies(@organization.companies, current_user) to match index. In load_form_options, use brand_scoped(@organization.events, @organization) for events and the wall_companies/wall_people equivalents

### 41. [medium·confirmed·upgrade·crm-pipeline] Pipeline board renders every deal ever created -- closed columns are unbounded
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:28-51; /Users/brianderario/Projects/kerrihq-rails/app/views/deals/_closed_column.html.erb:24-25
- **Value/failure:** Concrete value: board load time and phone scroll performance stay flat as the CRM grows instead of degrading a little every week. Today a year of closed deals means hundreds of hidden cards parsed, rendered, and shipped to a phone on each board visit.
- **Fix:** In #index, query open deals in full but restrict closed cards to a window (e.g. closed_at >= 90.days.ago) with a ?closed=all escape hatch link in the closed column header. Compute the header counts and won_total via SQL aggregates over the unrestricted scope (

### 42. [medium·confirmed·upgrade·crm-pipeline] Three uncoordinated company-matching paths create duplicate companies (case-sensitive name match, raw website string match, or no match at all)
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:403-407; /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:491-497; /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:632-639
- **Value/failure:** Concrete value: duplicate companies fragment CRM history -- deals, people, account signals, and sponsor commitments split across twins, and the agents' inbound-email-to-account matching (by_domain) picks whichever twin holds the domain. As the cold queue and CSV imports scale (Ma
- **Fix:** Add a Companies::Matcher service: derive a normalized domain from any website/email input (strip scheme/www, downcase), then match in order domain -> aliases -> case-insensitive trimmed name (LOWER(TRIM(name)) = ?); create only on miss, stamping the derived do

### 43. [medium·confirmed·upgrade·sponsor-hub] 🔒client-email(OFF) Make the client-email ban executable: SponsorPortalMailer enforces internal-only recipients in code, not comments
- **Files:** app/mailers/sponsor_portal_mailer.rb:1-9; app/mailers/sponsor_portal_mailer.rb:19-22; app/services/sponsor_inventory_notification_service.rb:52-57
- **Value/failure:** Value: converts Brian's hard rule from prose into a tripwire. Any future regression that would email a sponsor (a re-added chase, a mis-resolved reviewer, an agent-driven mailer call) raises before delivery instead of leaking a client email. This explicitly keeps client email OFF
- **Fix:** In SponsorPortalMailer add an after_action (or override mail()) that collects to+cc+bcc and raises SponsorPortalMailer::ExternalRecipientError unless every address is on an internal allowlist (e.g. ENV-configurable INTERNAL_MAIL_DOMAINS defaulting to hardwaref

### 44. [medium·confirmed·bug·sponsor-hub] Newsletter import: the shared `status` row key crashes placement upserts and rolls back the whole import
- **Files:** app/services/newsletter_inventory_import_service.rb:63; app/services/newsletter_inventory_import_service.rb:126; app/services/newsletter_inventory_import_service.rb:18-34
- **Value/failure:** An import row like { sponsor_name: "Quilter", status: "active", issue_date: "2026-07-14" } — a perfectly natural way for an agent to express commitment status — raises ArgumentError ("'active' is not a valid status") in upsert_placement and rolls back every row in the batch. Conv
- **Fix:** In upsert_placement drop the attrs[:status] fallback: status: attrs[:placement_status].presence || "reserved". If back-compat with existing agent payloads matters, keep the fallback but only when the value is a valid NewsletterPlacement status (NewsletterPlace

### 45. [medium·confirmed·bug·sponsor-hub] Import money parsing is type-dependent: integer contract_value/price are read as cents, strings as dollars
- **Files:** app/services/newsletter_inventory_import_service.rb:181-186; app/services/newsletter_inventory_import_service.rb:64; app/services/newsletter_inventory_import_service.rb:138-140
- **Value/failure:** Agent posts { contract_value: 5000 } (dollars) → stored as 5000 cents = $50.00; { contract_value: "5000" } → $5,000.00. Or { contract_value_cents: "500000" } (string cents) → 50,000,000 cents = $500,000 instead of $5,000. Revenue-of-record numbers on the CRM sell-through and owed
- **Fix:** Split the semantics: if attrs[:contract_value_cents].present?, use Integer(attrs[:contract_value_cents]) (accepting numeric strings); otherwise parse attrs[:contract_value] as dollars via a dollars_to_cents() that removes the `return value if value.is_a?(Integ

### 46. [medium·confirmed·upgrade·sponsor-hub] Sponsor portal contradicts itself: checklist says assets received while the Submitted assets panel says none submitted
- **Files:** app/controllers/sponsor_portal_controller.rb:14; app/views/sponsor_portal/show.html.erb:29; app/views/sponsor_portal/show.html.erb:131-152
- **Value/failure:** A sponsor whose logo/copy were filed from email onto their company page (the normal agent path) opens their portal: the top says 'Assets complete' with four green checks, while the Submitted assets panel says 'No assets submitted yet.' That reads as a broken or untrustworthy port
- **Fix:** In SponsorPortalController#show set @assets to the union the checklist uses: @commitment.held_assets (submitted_or_approved, commitment OR matched-company anchored) merged with the commitment's own non-archived rows so pending/rejected uploads still show, orde

### 47. [medium·confirmed·bug·mail] 🔒client-email(OFF) Ambiguous transport failures (ECONNRESET/EPIPE) clear the send claim and can double-send an approved email
- **Files:** app/jobs/send_approved_drafts_job.rb:235; app/services/microsoft_graph_client.rb:233; app/services/gmail_mailbox_client.rb:172
- **Value/failure:** Sequence: sweep N sends an approved sponsor email via Graph; the TLS connection resets after the POST /sendMail body is transmitted but before the 202 arrives; Faraday raises ConnectionFailed; record_send_failure! clears send_started_at (cause is not TimeoutError); sweep N+1 (2 m
- **Fix:** Invert to a whitelist of provably-pre-send failures. In both clients, raise a distinct subclass for HTTP-status rejections (e.g. class RequestRejected < Error around the 'API error <status>' raise; keep AuthError). In record_send_failure!, only clear send_star

### 48. [medium·confirmed·bug·mail] 🔒client-email(OFF) resolve_mailbox misses 'From: Name <addr>' headers, silently sending from the wrong mailbox
- **Files:** app/jobs/send_approved_drafts_job.rb:174; app/jobs/send_approved_drafts_job.rb:20
- **Value/failure:** A card whose draft header reads 'From: Brian <brian@hardwarefyi.com>' is approved; the email goes out from brian@kerrihq.com instead of brian@hardwarefyi.com. The sign-off check cannot catch it (both mailboxes sign 'Brian' per Outbound::PreSendCheck::EXPECTED_SIGNERS), so a clien
- **Fix:** In resolve_mailbox, after the bare-address attempt, also try body[/^\s*From:[^\n<]*<([^\s<>]+@[^\s<>]+)>/i, 1] and use whichever hits (still validated against GRAPH_MAILBOXES/GMAIL_MAILBOXES, still routing standardandworks to nil). Add a spec for the display-n

### 49. [medium·confirmed·upgrade·mail] Gmail sweep/list is a sequential N+1 fetching full MIME payloads it discards
- **Files:** app/services/gmail_mailbox_client.rb:33; app/services/gmail_mailbox_client.rb:58; app/services/gmail_mailbox_client.rb:231
- **Value/failure:** Concrete value: the brian@kerrihq.com inbox sweep (which runs on a schedule and blocks the agent turn) currently spends roughly 100-250ms per message — 20-50 seconds and ~1000 quota units for a busy 200-message window — to build previews it could get from headers+snippet. Switchi
- **Fix:** Add full_message(message_id, format: "full") and have search_messages/messages_since request format: "metadata", metadataHeaders: MESSAGE_HEADERS. normalize_message already works from headers/snippet/labelIds, all present in metadata format; has_attachments (d

### 50. [medium·confirmed·upgrade·mail] 🔒client-email(OFF) Outreach send path bypasses the em-dash scrub and GroundTruthGuard that every other send path has
- **Files:** app/mailers/outreach_mailer.rb:15; app/jobs/send_outreach_email_job.rb:13; app/services/outbound/ground_truth_guard.rb:52
- **Value/failure:** Concrete value: closes the last gap in two of Brian's hard rules. An outreach body generated with '$15,000 — our top package' currently goes to a sponsor with the em dash intact and, if the CRM deal says $12,000, with the wrong figure unchecked. After the fix, the same guarantees
- **Fix:** In OutreachMailer#outreach_email set @body = OutboundText.without_em_dashes(outbound_email.body_plain) and pass subject through the same scrub. In SendOutreachEmailJob#perform, after claim_for_sending and before deliver_now, run Outbound::GroundTruthGuard.chec

### 51. [medium·confirmed·upgrade·mail] 🔒client-email(OFF) OutboundEmail.message_id is a phantom; real Graph/Gmail message ids are discarded at delivery
- **Files:** app/services/mailbox_mail_delivery.rb:44; app/models/outbound_email.rb:59; app/jobs/send_outreach_email_job.rb:13
- **Value/failure:** Concrete value: reply detection and thread correlation for sponsor outreach become possible (today, answering 'did Acme reply to our outreach?' requires a manual mailbox search because the stored message_id matches nothing in the mailbox). Also powers the check-email-before-cold 
- **Fix:** In MailboxMailDelivery#deliver!, capture result = client.send_message(...) and stash it on the in-memory mail object after the send (e.g. mail.header['X-Savant-Provider-Message-Id'] = result[:id].to_s and 'X-Savant-Provider-Thread-Id' = result[:conversation_id

### 52. [medium·confirmed·bug·agents-infra] ScheduledAgentRunJob never advances agent.last_run_at, so schedule-driven agents with a report interval permanently trip 'Agent overdue' cards and drift signals
- **Files:** app/jobs/scheduled_agent_run_job.rb:71-83; app/models/agent.rb:56-59; app/jobs/agent_health_check_job.rb:11-27
- **Value/failure:** An agent like kerri-inbox-sweep with report_interval_hours=24 runs green every hour via its AgentSchedule, yet once last_run_at (or created_at) ages past 24h it enters Agent.overdue forever: AgentHealthCheckJob files a fresh 'Agent overdue: ...' action_needed card on Brian's boar
- **Fix:** In ScheduledAgentRunJob#perform, after the successful run.update! (line ~82), add `schedule.agent.update!(last_run_at: finished_at)` (and optionally in record_failure, mirroring event_processor which advances it on failures too so 'reported' means 'ran'). One-

### 53. [medium·confirmed·bug·agents-infra] Rejecting an approval configured with on_reject=skip still fails the whole flow when the next step is a consequential tool
- **Files:** app/services/agents/flow_executor.rb:90-103; app/services/agents/flow_executor.rb:250-255; app/services/agents/flow_executor.rb:384-387
- **Value/failure:** Flow: [step1 approval(on_reject=skip) 'ok to email X?', step2 tool send_mail, step3 agent_prompt 'summarize + file report']. Brian rejects step1 expecting the send to be skipped and the summary to still run (as the card text told him). Instead: step1 skipped -> step2 policy-viola
- **Fix:** In resolve_rejected_step, after skipping the approval step, cascade-skip the immediately following step when it is a tool step whose tool is in CONSEQUENTIAL_TOOLS (record output {'skipped_because' => 'authorizing approval was rejected'} and an agent_task even

### 54. [medium·confirmed·upgrade·agents-infra] Upgrade: stale-flow sweeper cannot recover flows wedged in waiting_approval after the approval was already decided
- **Files:** app/jobs/agent_schedule_dispatcher_job.rb:26-32; app/models/approval_request.rb:54; app/models/approval_request.rb:110-117
- **Value/failure:** Concrete value: closes the one unrecoverable wedge state in an otherwise self-healing engine. Today the failure looks like 'I approved the flow step yesterday and the flow is still paused' with no card, no log, and no sweeper coverage; the flow silently never completes and its Ag
- **Fix:** Extend resume_stale_agent_flows with a second query: `AgentFlow.waiting_approval.where(updated_at: ..(now - 10.minutes)).joins(agent_flow_steps: :approval_request).where(agent_flow_steps: { status: :waiting_approval }).where.not(approval_requests: { status: :p

### 55. [medium·confirmed·upgrade·agents-infra] Upgrade: no overlap guard on AgentSchedule - a run that outlasts its cadence gets a second concurrent run of the same routine
- **Files:** app/models/agent_schedule.rb:43-57; app/jobs/scheduled_agent_run_job.rb:43-51
- **Value/failure:** Two overlapping inbox-sweep runs both compute the same 'since last successful run' watermark (previous_run_line reads only succeeded runs, and neither in-flight run has finished), so both process the identical mail window and both deliver: duplicate Slack DMs to Brian, duplicate 
- **Fix:** In ScheduledAgentRunJob#perform, after loading the schedule, add a skip-if-running guard: `in_flight = schedule.agent.runs.where('external_id LIKE ?', "agent-schedule:#{schedule.id}:%").where(status: :running).where(started_at: 2.hours.ago..).where.not(externa

### 56. [medium·confirmed·bug·brain-perms] Archived agent memories keep surfacing through the QMD index (and lookup is unscoped by org/active)
- **Files:** app/services/agent_memory_store.rb:108-114; app/services/agent_memory_store.rb:235-247; app/models/agent_memory.rb:41-43
- **Value/failure:** Brian tells Kerri to forget a wrong operating rule; the copilot archives the AgentMemory row. Next `search_agent_memory` call still returns the archived rule via QMD (backend 'qmd'), and Kerri keeps following guidance that was explicitly retracted — the exact memory-poisoning fai
- **Fix:** (1) In serialize_qmd_row, scope the lookup: `AgentMemory.active.find_by(id: id, organization_id: organization.id)` (pass organization into search_qmd) and return nil when not found so .compact drops it. (2) Add a forget!/archive path in the store that deletes 

### 57. [medium·confirmed·upgrade·brain-perms] AgentMemoryStore rewrites the entire markdown corpus on every search (O(N) disk writes per query)
- **Files:** app/services/agent_memory_store.rb:82-88; app/services/agent_memory_store.rb:103-106
- **Value/failure:** Concrete value: with a few hundred memories this is hundreds of synchronous File.write calls per copilot turn / Slack agent memory lookup — pure latency and disk churn ahead of a phone-facing response. Making export incremental turns every agent memory search from O(N) writes to 
- **Fix:** Track an export watermark: store the max(updated_at)+count of active memories in a stamp file (e.g. `.qmd/export_stamp`); in export_organization, return early when the stamp matches the DB (`organization.agent_memories.active.pick(Arel.sql('max(updated_at), co

### 58. [medium·confirmed·upgrade·brain-perms] Add updated_since delta polling + property/last_verified_at fields to GET /api/v1/knowledge_records
- **Files:** app/controllers/api/v1/knowledge_records_controller.rb:19-28; app/controllers/api/v1/knowledge_records_controller.rb:104-114
- **Value/failure:** Concrete value: a `?updated_since=` filter lets Kerri/Oliver/Vaughn fetch only records changed since their last sync — typically one page instead of the full corpus — cutting scheduled-routine latency, rate-limit pressure, and Ollama context waste. Exposing `property` and `last_v
- **Fix:** In #index add `scope = scope.where(updated_at: Time.iso8601(params[:updated_since])..) if params[:updated_since].present?` (Time.iso8601 raises ArgumentError → existing 400 rescue). In serialize_record, merge additive keys: `"property" => record.property&.slug

### 59. [medium·confirmed·upgrade·brain-perms] No dedup on agent candidate writes — repeated runs pile duplicate candidates into the promotion queue
- **Files:** app/controllers/api/v1/knowledge_records_controller.rb:34-56; app/models/agent_memory.rb:22-24
- **Value/failure:** Concrete value: Brian's /brain promotion queue is the human bottleneck (4 candidates already awaiting promotion per the ops notes; the June cleanup deduped operations 128→59 by hand). Hash-dedup at write time keeps the queue one-row-per-fact permanently, making 'promote candidate
- **Fix:** In #create, before create!: compute `hash = Digest::SHA256.hexdigest([title, body, kind].to_json)`; look up `current_organization.knowledge_records.where(content_hash: hash, status: ALLOWED_CREATE_STATUSES).first` and, when found, return it with 200 and an add

### 60. [medium·confirmed·upgrade·external-clients] CompanyEnrichmentJob calls Apollo find_sponsor_contacts uncached, spending up to ~30 email-reveal credits per company every run
- **Files:** app/jobs/company_enrichment_job.rb:90; app/services/apollo_client.rb:213; app/services/apollo_client.rb:353
- **Value/failure:** Re-enriching a sponsor pipeline of N companies burns ~N x (company enrich + up to 30 contact reveals) Apollo credits each pass, with no dedupe against a recent identical pull. Wiring the existing Apollo::Cache in (as the tool path already does) makes re-enrich and near-duplicate 
- **Fix:** In company_enrichment_job.rb wrap both calls in Apollo::Cache.fetch (company + sponsor_contacts:limit keys, same as tool_executor.rb:2229/2243). Add a lightweight per-job/day credit budget check before find_sponsor_contacts and emit a metric/log of reveal coun

### 61. [medium·confirmed·bug·external-clients] Apollo 429 retry ignores Retry-After and blocks a Puma thread with a fixed sleep
- **Files:** app/services/apollo_client.rb:449; app/services/apollo_client.rb:455; app/services/apollo_client.rb:500
- **Value/failure:** Under Apollo rate limiting, a single apollo_find_sponsor_contacts fans out to 6+ requests; each 429 sleeps exactly 1s x2 then fails, tying up the Puma thread for seconds and returning 'Rate limit exceeded' to Brian on his phone even though a slightly longer wait would have succee
- **Fix:** Read response.headers['retry-after'] (seconds or HTTP-date), clamp to a sane max (e.g. 10s), add exponential backoff + jitter across the retries, and raise attempts modestly. Longer-term, run Apollo lookups in a background job rather than inline in the request

### 62. [medium·confirmed·bug·contracts] document_hash stamped at signing does not match the body actually stored (sign-date substitution happens after hashing)
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/contract_signing_controller.rb:57; /Users/brianderario/Projects/kerrihq-rails/app/controllers/contract_signing_controller.rb:58; /Users/brianderario/Projects/kerrihq-rails/app/models/contract.rb:89
- **Value/failure:** For any contract signed but not yet countersigned (or where countersign happens days later), Digest::SHA256.hexdigest(contract.body) != contract.document_hash. If Don or a counterparty ever audits 'this hash proves what the sponsor signed', the verification fails; after countersi
- **Fix:** Compute the final body first, hash that, and consider preserving both ceremony hashes: signed_body = @contract.body.gsub(ContractRenderer::SIGN_DATE_PLACEHOLDER, signed_at.strftime('%-m/%-d/%y')); @contract.update!(..., body: signed_body, document_hash: Digest

### 63. [medium·confirmed·bug·contracts] 🔒client-email(OFF) Public /contracts/:token/forward is an unthrottled outbound-mail relay from a real HWFYI mailbox
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/contract_signing_controller.rb:90; /Users/brianderario/Projects/kerrihq-rails/app/services/mailbox_mail_delivery.rb:28
- **Value/failure:** Anyone who receives (or leaks) a signing link can script POST /contracts/<token>/forward in a loop to spam arbitrary addresses from info@hardwarefyi.com, torching the domain's sender reputation that all of HWFYI's sponsor outreach depends on. It also silently widens who can legal
- **Fix:** Add Rails 8 controller rate limiting: rate_limit to: 3, within: 1.hour, only: :forward, with: -> { redirect_to sign_contract_path(token: @contract.signing_token), alert: 'Too many forwards; try later.' } plus a hard per-contract lifetime cap (count 'contract_f

### 64. [medium·confirmed·bug·contracts] 🔒client-email(OFF) Signing links are generated as http:// and fall back to localhost:3000 when APP_HOST is unset
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/mailers/account_management_mailer.rb:127; /Users/brianderario/Projects/kerrihq-rails/app/mailers/account_management_mailer.rb:135; /Users/brianderario/Projects/kerrihq-rails/app/models/contract.rb:53
- **Value/failure:** Concrete failure modes: (a) every signing/download link in client email is http:// today, relying on the force_ssl redirect and tripping corporate link scanners that downgrade-flag http links in contracts; (b) one env-var slip on a new Render service = sponsors receive dead local
- **Fix:** In one shared helper (e.g. Contract#default_host or a ContractUrls module): host = ENV['APP_HOST'].presence || Rails.application.config.action_mailer.default_url_options&.dig(:host); raise in production if blank instead of defaulting to localhost; pass protoco

### 65. [medium·confirmed·upgrade·contracts] Contract 'viewed' status and activity log are polluted by email link-scanner GETs
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/contract_signing_controller.rb:9
- **Value/failure:** The viewed signal is one of the few pipeline tells Brian gets on his phone ('they opened the contract, chase now'), and today it is effectively always-on noise: a scanner GET makes an unopened contract indistinguishable from an engaged sponsor, and the activity feed accumulates d
- **Fix:** Make the GET side-effect-free and record the view from a browser beacon: add a tiny Stimulus controller on the signing page that POSTs to a new mark_viewed member route (post :viewed under the existing token-scoped routes at routes.rb:135-142) after DOMContent

### 66. [medium·confirmed·upgrade·api-v1] Invalid-API-key requests are never rate limited (auth halts before the limiter)
- **Files:** app/controllers/api/v1/base_controller.rb:4-8
- **Value/failure:** Token brute-forcing/credential-stuffing against the production Render app is completely unthrottled, and a misconfigured agent stuck in a retry loop with an expired key (a real failure mode: keys have expires_at) hammers the DB with authenticate lookups at full speed with zero ba
- **Fix:** Add a second, generous IP-keyed limiter declared BEFORE the authenticate before_action so it runs first: move `rate_limit to: 300, within: 1.minute, by: -> { request.remote_ip }, name: "pre_auth", with: -> {...}` above line 4, and keep the existing per-key lim

### 67. [medium·confirmed·bug·api-v1] KnowledgeRecords#update skips the agent write-grant check that #create enforces
- **Files:** app/controllers/api/v1/knowledge_records_controller.rb:58-69; app/controllers/api/v1/knowledge_records_controller.rb:45-50
- **Value/failure:** Agent with read-only grants on the operations domain PATCHes /api/v1/knowledge_records/:id with a new body -> the candidate a human is about to promote now contains content the agent was never allowed to write, with no grant check and no trace beyond updated_at. Undermines the ca
- **Fix:** Mirror the create check in #update: if acting_agent && !agent_scope_resolver.allowed?(action: :update (or :create), domain: record.domain, sensitivity: record.sensitivity, kind: record.kind) -> 403 'Agent grants do not cover this write'. Optionally stamp last_

### 68. [medium·confirmed·bug·api-v1] WorkspaceRuns#index embeds every event's full stdout/stderr per run (N+1 + unbounded payload)
- **Files:** app/controllers/api/v1/workspace_runs_controller.rb:9; app/controllers/api/v1/workspace_runs_controller.rb:114; app/controllers/api/v1/workspace_runs_controller.rb:118-122
- **Value/failure:** Agents polling GET /api/v1/workspace_runs for status burn a page-of-25 x (1 query + full log payload) on every poll; response times and Render bandwidth degrade linearly with run history and log size, and Ollama-side agents waste context ingesting logs they didn't ask for.
- **Fix:** Two-part, both backward compatible: (1) add .includes(:events) to the index scope and sort the preloaded array in Ruby (record.events.sort_by(&:created_at)) to kill the N+1 without changing output; (2) add an additive opt-down param ?events=none|summary that o

### 69. [medium·confirmed·bug·jobs] 🔒client-email(OFF) SendOutreachEmailJob marks ambiguous timeouts :failed (double-send risk) and a crash mid-send strands the email in :sending with zero surfacing or recovery path
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_outreach_email_job.rb:27-36; /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_outreach_email_job.rb:43-53; /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_approved_drafts_job.rb:235
- **Value/failure:** Failure (1): Graph times out after actually delivering a sponsor outreach email; record shows 'failed'; Brian (or an agent reading /api/v1) composes and sends again → the sponsor contact gets the same cold email twice. Failure (2): a deploy restart mid-delivery leaves the email :
- **Fix:** (1) In the delivery rescue, branch on `e.cause.is_a?(Faraday::TimeoutError)`: keep delivery_status :sending (or a new additive enum value like `unconfirmed: 7` — append-only, never renumber per the model comment) and set delivery_error to an 'ambiguous timeout

### 70. [medium·confirmed·bug·jobs] 🔒client-email(OFF) SendFullyExecutedContractEmailJob has no durable once-only marker — any duplicate enqueue or Mission Control retry re-emails the sponsor the executed contract
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_fully_executed_contract_email_job.rb:12-27; /Users/brianderario/Projects/kerrihq-rails/app/controllers/contract_signing_controller.rb:79; /Users/brianderario/Projects/kerrihq-rails/app/controllers/contracts_controller.rb:183
- **Value/failure:** Failure: post-send bookkeeping raises (deal validation, stage-transition guard), job shows failed, operator retries it (or a future dev adds a retry_on) → the sponsor receives the 'fully executed contract' email twice. This is an existing, legally-necessary transactional client e
- **Fix:** Additive migration: `add_column :contracts, :executed_email_enqueued_at, :datetime`. In the job, inside `contract.with_lock`: return if the column is set; set it and save BEFORE the deliver_later calls (mirroring SendApprovedDraftsJob's claim-before-send patte

### 71. [medium·confirmed·upgrade·jobs] Permanently failed Solid Queue jobs are invisible: no drift signal watches the failed set, and ApplicationJob keeps DeserializationError failures forever
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/application_job.rb:1-8; /Users/brianderario/Projects/kerrihq-rails/app/jobs/ticket_search_result_enrichment_job.rb:14; /Users/brianderario/Projects/kerrihq-rails/app/services/agent_drift_monitor.rb:1-20
- **Value/failure:** Value: today a contract signing email that fails all 5 retries, or an unrouted inbound email crash, dies silently in a dashboard nobody watches. A drift signal turns 'failed jobs exist' into a Kerri DM within 24h — the same channel every other fleet problem already uses. The disc
- **Fix:** (1) In ApplicationJob: `discard_on ActiveJob::DeserializationError` and `retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3`. (2) Add a signal to AgentDriftMonitor: count `SolidQueue::FailedExecution.where(created_at: 24.hours.ago..)`, group by jo

### 72. [medium·confirmed·bug·frontend] XSS: autocomplete renders remote suggestion text/subtitle/badge into innerHTML unescaped
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:634; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:637; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:698
- **Value/failure:** A contact or company whose name contains `<img src=x onerror=...>` (imported from an external feed or set by any org member) executes script in the searcher's session as soon as it appears in autocomplete results — i.e., typing in the search box triggers the payload. Same stored-
- **Fix:** Escape before highlighting: in renderSuggestions compute `const safeText = this.escapeHtml(text)` (helper already exists at line ~1078) and pass that to highlightText; in highlightText escape the input first, then wrap matches in <mark> (match on the escaped s

### 73. [medium·confirmed·bug·frontend] Kanban drag failures are silent: showError dispatches 'toast:show' but the toast system listens for 'toast-show'
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/kanban_controller.js:217; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/toast_controller.js:42
- **Value/failure:** Brian drags a task or deal to a new column on his phone, the PATCH fails (flaky mobile network, 422, expired session): revertDrag() snaps the card back with zero user-visible feedback. On the approval board this reads as 'the drag didn't take' or worse, he doesn't notice the reve
- **Fix:** Replace showError with `if (window.toast) window.toast(message, { type: "error" }); else window.dispatchEvent(new CustomEvent("toast-show", { detail: { message, type: "error" } }))`. Two-line change; verify by killing the network in devtools and dragging a car

### 74. [medium·confirmed·bug·frontend] Memory leak: dropdown_popover and context_menu leak document-level listeners on every Turbo navigation
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/dropdown_popover_controller.js:44; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/context_menu_controller.js:39
- **Value/failure:** dropdown-popover is the RailsBlocks dropdown used on nearly every page, often several per page. In the installed PWA that Brian keeps open for days, every Turbo visit permanently adds N document keydown/click handlers and pins N detached DOM trees. After a day of navigation that'
- **Fix:** dropdown_popover: store `this.escHandler = (e) => {...}` in connect, `document.removeEventListener("keydown", this.escHandler)` in disconnect. context_menu: bind once in connect (`this.boundCloseMenu = this.closeMenu.bind(this)` etc.), pass the same reference 

### 75. [medium·confirmed·bug·frontend] select_controller (TomSelect) leaks listeners/observers on clearInput and observes document.body per instance
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:1689; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:513; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:552
- **Value/failure:** On a form with 5+ selects, every Turbo Stream update or morph triggers 5+ mutation callbacks each calling computePosition; clicking the clear button 10 times leaves 10 window scroll listeners repositioning a destroyed dropdown on every scroll frame — measurable jank on phone. The
- **Fix:** (1) Extract a #teardownPositioning() and call it at the top of #setupPositioning (or from clearInput before re-setup). (2) Store the bound handler once (`this.infiniteScrollHandler ||= this.#handleScroll.bind(this)`) and add/remove that reference. (3) Store th

### 76. [medium·confirmed·upgrade·frontend] Upgrade: vendor the four CDN stylesheets so the console works offline and on flaky mobile networks
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/views/layouts/application.html.erb:28; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/lightbox_controller.js:21
- **Value/failure:** Concrete value: (a) On Brian's phone with a weak signal or in the installed PWA when jsdelivr is slow/unreachable, every select, date picker, and lightbox renders unstyled/broken while the rest of the app works — currently the single biggest reliability gap for the mobile approva
- **Fix:** Copy tom-select.css, air-datepicker.min.css, photoswipe.css from node_modules into app/assets/stylesheets/vendor/ (or @import them in application.tailwind.css since the packages are already in package.json), delete the four <link>/<script> CDN tags and the loa

### 77. [medium·confirmed·upgrade·frontend] Upgrade: Ask Savant copilot loses the whole conversation on every page navigation
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/ask_savant_controller.js:10; /Users/brianderario/Projects/kerrihq-rails/app/views/layouts/application.html.erb:83
- **Value/failure:** Concrete value: the in-app agent becomes usable as an actual working companion instead of a single-page Q&A box. On phone, where Brian constantly hops between board, task, and deal pages, this is the difference between the copilot being used and being abandoned. Also unlocks slic
- **Fix:** Persist `this.history` (and rendered messages) to sessionStorage keyed per-user (e.g. `askSavant.history`), write-through in send(), and in connect() rehydrate + re-render via the existing appendMessage(). Cap at ~30 messages and clear on logout (hook devise s

### 78. [medium·confirmed·bug·self-upgrade] Sandbox edit engine uses 2-arg String#sub/gsub, so it tests different bytes than CodeShippingClient ships
- **Files:** app/services/workspace_runner/runner.rb:94
- **Value/failure:** An autonomous self-upgrade edits system_prompt.rb with a new_string containing `\1`; the sandbox eval runs against text where `\1` was replaced by the empty capture group (silently deleting it) and passes, but CodeShippingClient ships the literal `\1`. The 'verified in sandbox' g
- **Fix:** Change line 94 to the block form matching CodeShippingClient: `updated = replace_all ? content.gsub(old_string) { new_string } : content.sub(old_string) { new_string }`.

### 79. [medium·confirmed·bug·self-upgrade] Failed `git clone` stderr is stored and returned unsanitized, leaking the tokenized clone URL
- **Files:** app/services/workspace_runner/runner.rb:61; app/services/workspace_runner/repository_source.rb:19
- **Value/failure:** A transient 403 or DNS failure on clone produces `fatal: unable to access 'https://x-access-token:ghs_xxx@github.com/kerrihq/kerrihq-rails.git/'` in stderr; that token string is written to workspace_run_events.stderr and returned to the agent/logs.
- **Fix:** Run result[:stdout]/result[:stderr] through sanitize_source (or a shared redactor covering x-access-token:...@ and any Bearer tokens) before storing on the event and before interpolating into the raised Error. Consider using a git credential helper / GIT_ASKPA

### 80. [medium·confirmed·bug·self-upgrade] Tier classifier and edit path handling can be fooled by `..` traversal, mislabeling a protected file as autonomous
- **Files:** app/models/self_upgrade.rb:85; app/services/workspace_runner/runner.rb:163
- **Value/failure:** self_upgrade with edit path `docs/../app/services/ask_savant/access_policy.rb` is classified `autonomous`, no approval is filed, the sandbox checks out and applies the edit to the real access_policy.rb and runs the eval; only the later `..` rejection in CodeShippingClient stops t
- **Fix:** Normalize each edit path (reject any containing `..` or leading `/`, then Pathname#cleanpath) in SelfUpgrade#touched_paths / classify_tier before prefix matching, and add the same `..` rejection to WorkspaceRunner (UNSAFE_PATH_PATTERN) and self_upgrade tool in

### 81. [medium·confirmed·upgrade·self-upgrade] Successful autonomous self-upgrades deploy to production with no owner notification
- **Files:** app/jobs/self_upgrade_canary_job.rb:48; app/services/self_upgrades/runner.rb:210
- **Value/failure:** Every green autonomous self-upgrade changes live agent behavior with no task, Slack, or email to the owner — Brian has no timeline of what Kerri changed about herself unless he polls self_upgrade_status. Adding a success notification gives him an auditable, phone-visible record o
- **Fix:** In SelfUpgradeCanaryJob when transitioning to :verified (line 48), call a notify! with a non-urgent status (e.g. informational task and/or Slack DM) summarizing reason, paths, PR number, and merge sha. Optionally gate autonomous-tier merges behind a lightweigh

### 82. [low·confirmed·bug·slack] AgentRun started_at is stamped after the agent finishes — every Slack run records ~0 duration
- **Files:** app/services/slack/event_processor.rb:401; app/services/slack/event_processor.rb:412; app/services/slack/event_processor.rb:433
- **Value/failure:** Latency observability for the Slack agents is fiction: the AgentRun audit trail (the thing Don or drift monitoring would inspect to spot slow turns or Ollama degradation) says every run took ~0s. Any future 'Kerri feels slow' investigation has no data.
- **Fix:** Capture `@run_started_at = Time.current` at the top of EventProcessor#call (right after the actionable checks), and use it for started_at in both record_run! and record_run_failure, keeping finished_at: Time.current. One-line spec: run duration equals the stub

### 83. [low·confirmed·bug·slack] A failed enqueue in handle_envelope tears down the whole Socket Mode connection
- **Files:** app/services/slack/socket_mode_connection.rb:65; app/services/slack/socket_mode_connection.rb:74
- **Value/failure:** A 2-second Postgres hiccup while Brian is actively chatting: instead of one message being retried by Slack, the socket drops, the workspace reconnects, and several seconds of messages stall — visible as the bot 'freezing' mid-conversation.
- **Fix:** In handle_envelope, wrap `dispatch.call` in `begin ... rescue => e` for the events_api branch: log the failure and return :dispatch_failed WITHOUT acking (so Slack redelivers just that envelope) and without letting the exception reach driver.parse. Keep the co

### 84. [low·confirmed·bug·tasks-board] update_status accepts 'done' for a sendable needs_approval card: the decision is silently dropped and on_complete fires with nothing sent
- **Files:** app/controllers/tasks_controller.rb:125; app/models/task.rb:159; app/services/task_completion_action.rb:86
- **Value/failure:** Concrete: a card 'Send sponsorship proposal to Acme' with on_complete create_deal gets PATCHed to done (automation glue, a replayed request, or a future done drop-target). Result: no email sent, no skip recorded for the agent, and a phantom 'Acme sponsorship' deal appears in the 
- **Fix:** In update_status, before move_to_status!: if new_status == 'done' && @task.resolution.nil? && TaskNotes.parse(@task.body, title: @task.title).sendable?, reject with 422 and message 'Use Approve or Skip on sendable cards' (turbo_stream + json branches already e

### 85. [low·confirmed·bug·crm-pipeline] Web update_stage error branch is dead code: move_to_stage! raises, so a validation failure 500s the kanban drag instead of showing the error
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/deals_controller.rb:210-222; /Users/brianderario/Projects/kerrihq-rails/app/models/deal.rb:112-116
- **Value/failure:** Concrete failure: dragging a card whose record is invalid for any pre-existing reason crashes with a 500 on Brian's phone instead of the friendly per-format error responses already written at lines 216-222; the carefully-built else branch never executes for anyone.
- **Fix:** Wrap the move in begin/rescue ActiveRecord::RecordInvalid and route the rescue to the existing else-branch responses (the error messages are already on @deal.errors). Alternatively give Deal a non-bang move_to_stage returning save's boolean and call that here.

### 86. [low·confirmed·bug·sponsor-hub] Console/API asset creation accepts a newsletter_placement_id from any commitment in the org
- **Files:** app/controllers/sponsor_assets_controller.rb:62-72; app/controllers/api/v1/sponsor_assets_controller.rb:47-56; app/controllers/sponsor_portal_controller.rb:69-72
- **Value/failure:** Kerri (or a console user) files an asset with a stale/wrong placement id: the asset saves anchored to commitment A but placement belonging to commitment B. The asset then shows on sponsor B's placement in issue views and portal placement groupings while counting toward sponsor A'
- **Fix:** In both controllers, mirror the portal: if params include newsletter_placement_id, resolve it via @commitment.newsletter_placements.find_by(id: ...) and 422/alert when absent. Better: move it into the model — validate that newsletter_placement.sponsor_commitme

### 87. [low·confirmed·bug·sponsor-hub] Manual 'send asset reminder' tells Brian a reminder went out when the service no-opped
- **Files:** app/controllers/sponsor_commitments_controller.rb:44-47; app/services/sponsor_asset_reminder_service.rb:15-20
- **Value/failure:** Brian taps the reminder button on a commitment whose assets are already complete (e.g. company-page assets satisfied the checklist): the console confirms a send that never occurred. For a non-technical operator who judges the system by its own reporting, that's a false 'done' — t
- **Fix:** Have #call return a symbol (:sent vs :assets_complete) or a small Result. In the controller branch the flash: assets complete → notice: 'Assets are already complete for <sponsor> — no reminder needed.'; sent → the current message. One-line service change, two-

### 88. [low·confirmed·bug·mail] 🔒client-email(OFF) SendApprovedDraftsJob strips em dashes from the body but not the subject
- **Files:** app/jobs/send_approved_drafts_job.rb:166; app/jobs/send_approved_drafts_job.rb:167
- **Value/failure:** An approved draft whose subject line is 'Q3 partnership — next steps' sends with the em dash intact, violating Brian's hard no-em-dash rule in the most visible part of the email (the recipient's inbox list) despite the rule being 'code-enforced'.
- **Fix:** Change line 166 to subject: OutboundText.without_em_dashes(subject.to_s). Note OutboundText replaces an em dash with ', ' which reads fine in subjects ('Q3 partnership, next steps'). Add a one-line spec beside the existing body-scrub spec.

### 89. [low·confirmed·bug·mail] Failed outreach emails keep a populated sent_at (stamped at claim time, never cleared)
- **Files:** app/jobs/send_outreach_email_job.rb:47; app/jobs/send_outreach_email_job.rb:54
- **Value/failure:** Concrete failure: OutreachMailer raises (template bug or Graph/Gmail error) after the claim; the record ends delivery_status: failed with sent_at set. Any query, CSV export, or agent reading /api/v1 data that treats sent_at presence as 'this email was sent' (a natural reading) co
- **Fix:** Move the sent_at stamp to the success update (outbound_email.update!(delivery_status: :sent, sent_at: Time.current) at line 15) and have claim_for_sending set only delivery_status: :sending; in mark_failed also clear it (sent_at: nil) for rows failing after a 

### 90. [low·confirmed·bug·agents-infra] NO_UPDATES quiet sentinel is ignored for task-delivery schedules - an all-quiet run still files an action_needed card
- **Files:** app/jobs/scheduled_agent_run_job.rb:165-170; app/jobs/scheduled_agent_run_job.rb:189-191
- **Value/failure:** Any task-delivery routine adopting the prod-prompt NO_UPDATES convention (live per the inbox-sweep run-scoping work) generates a recurring do-nothing card on Brian's approval board - e.g. an hourly schedule adds up to 24 junk cards/day he has to swipe away on his phone, exactly t
- **Fix:** Move the sentinel check first in deliver_result: `return true if no_updates_verdict?(run.output)` before the `schedule.task?` branch. The AgentRun row still records the NO_UPDATES output for audit, and returning true keeps surface_unfiled_output from filing it

### 91. [low·confirmed·upgrade·agents-infra] Upgrade: VoiceCalibration.gather_edits loads every org task from the last 30 days and samples an arbitrary (not newest) 25 edits
- **Files:** app/services/voice_calibration.rb:59-69
- **Value/failure:** Concrete value: the weekly voice loop reliably trains on Brian's LATEST 25 edits instead of a stale arbitrary sample, and the job stops loading/parsing the full 30-day task table (memory + latency win on the Render worker running inside Puma).
- **Fix:** Push filtering and ordering into SQL: `organization.tasks.where("updated_at > ?", window_days.days.ago).where("COALESCE(resolution_payload ->> 'edited_body', '') <> ''").order(updated_at: :desc).limit(limit * 4).filter_map { ... }.first(limit)` (the 4x headroo

### 92. [low·confirmed·upgrade·agents-infra] Upgrade: AgentRuntimeHealth snapshot has no visibility into AgentFlows (wedged/waiting/failed flows are invisible to the health endpoint and QUEUE badge)
- **Files:** app/services/agent_runtime_health.rb:12-23; app/services/agent_runtime_health.rb:97-111
- **Value/failure:** Concrete value: `GET /api/v1` runtime health (and anything built on it, like the Savant QUEUE badge diagnosis flow) can name a wedged flow the same way it names a lagging schedule. A flow stuck 45 minutes in running, or waiting_approval for 3 days, becomes a visible counter inste
- **Fix:** Add a `flows:` key to #snapshot (additive - API consumers only gain a field): counts of running / waiting_approval / failed_last_24h, plus `stale_running` (running with updated_at older than AgentScheduleDispatcherJob::STALE_FLOW_AFTER) and `oldest_waiting_app

### 93. [low·confirmed·bug·api-v1] Concurrent idempotent replays 500 with unhandled RecordNotUnique instead of returning the existing record
- **Files:** app/controllers/api/v1/agent_runs_controller.rb:17-27; app/controllers/api/v1/tasks_controller.rb:40-58; app/controllers/api/v1/base_controller.rb:10-32
- **Value/failure:** A routine that times out and retries its POST /api/v1/agent_runs while the first attempt is still committing gets a 500; its own error handling then re-retries or reports the run as failed even though it was recorded — exactly the flaky-agent noise the idempotency contract exists
- **Fix:** Add rescue_from ActiveRecord::RecordNotUnique in Api::V1::BaseController that retries the lookup once (retry the action) or renders 409 with the existing record; simplest targeted fix: wrap the create! in each controller with rescue ActiveRecord::RecordNotUniq

### 94. [low·confirmed·upgrade·api-v1] Every API request writes an UPDATE to api_keys via touch_last_used!
- **Files:** app/controllers/api/v1/base_controller.rb:45; app/models/api_key.rb:61-63
- **Value/failure:** Concrete value: cuts a hot, contended write path from every API call to at most one write per key per minute — lower WAL volume, less autovacuum pressure on Render Postgres, and one less lock point if two polls for the same key overlap. Zero behavior change for anything reading l
- **Fix:** In touch_last_used!, skip the write when fresh: `return if last_used_at && last_used_at > 1.minute.ago; update_column(:last_used_at, Time.current)`. One-line change, covered by a model spec asserting no write within the window and a write after it.

### 95. [low·confirmed·upgrade·api-v1] Renewals and nested list endpoints return unbounded, unpaginated arrays
- **Files:** app/controllers/api/v1/renewals_controller.rb:38-41; app/controllers/api/v1/deals/contracts_controller.rb:24; app/controllers/api/v1/deal_stakeholders_controller.rb:10-12
- **Value/failure:** Concrete value: keeps the renewal book endpoint fast and cheap as the won-deal count grows past a few hundred, and gives agents the same meta.page/has_more contract they already implement everywhere else instead of a payload that silently grows unbounded. Also removes the ?within
- **Fix:** Additive only: route renewals through the existing render_many/paginate helper (keep the meta.within_days and count keys, add page/per_page/has_more/total_count alongside), and cap within_days at e.g. 730 with a 400 above it. Nested per-deal indexes are natura

### 96. [low·confirmed·bug·jobs] 🔒client-email(OFF) SendContractForSigningJob flips the contract to 'sent' before delivery with no post-hoc confirmation marker — a crash in the window shows 'sent' while the client never got the signing link
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_contract_for_signing_job.rb:27-35
- **Value/failure:** Failure: deploy restart lands mid-job; Brian sees the contract as 'sent for signing', waits days for a signature that can never come because the client never received the email. The deal stalls silently — the worst kind of pipeline bug for a sales-driven business.
- **Fix:** Additive column `delivery_confirmed_at` on contracts, stamped immediately after `deliver_now` succeeds. Add a check (fits naturally in AgentDriftMonitor or the AgentHealthCheckJob daily pass) for contracts `sent` with `delivery_confirmed_at` nil older than ~15

### 97. [low·confirmed·upgrade·frontend] Upgrade: companies index renders the entire unpaginated company table
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/controllers/companies_controller.rb:25; /Users/brianderario/Projects/kerrihq-rails/app/views/companies/index.html.erb:66
- **Value/failure:** Concrete value: keeps the CRM company list fast on mobile as imports scale — today a 2,000-company org would ship ~2MB of table HTML and lock the main thread for seconds on an iPhone; after pagination it's a constant ~50-row page. Also caps memory for the Turbo page cache, which 
- **Fix:** Add Pagy (or `.limit(100).offset(...)` with simple prev/next links) in #index, defaulting to ~100 rows, preserving the existing q/event_id filter params; keep the search box as the primary access path. Purely additive to the HTML page — the /api/v1 companies e

### 98. [low·plausible·upgrade·external-clients] SafeHttp validates a resolved IP but Faraday re-resolves and connects (DNS-rebinding TOCTOU)
- **Files:** app/services/safe_http.rb:29; app/services/rest_api_client.rb:31; app/services/generic_mcp_client.rb:52
- **Value/failure:** A malicious connector host with 1s TTL DNS answers public on the validation resolve, then flips to 169.254.169.254 before Faraday connects, reaching internal/metadata services despite the guard. Closing this removes the residual SSRF path that the mapped-IPv6 fix alone doesn't co
- **Fix:** Have SafeHttp.check! return the validated IP, then connect to that IP directly while sending the original Host header (and SNI) — e.g. resolve once, build the Faraday URL against the pinned IP, or install a custom resolver/socket that pins the checked address.

### 99. [low·plausible·bug·external-clients] MCP token pre-refresh fails open when expires_at is missing/malformed, defeating proactive refresh
- **Files:** app/services/superhuman_mcp_client.rb:144; app/services/reclaim_mcp_client.rb:135
- **Value/failure:** When Superhuman/Reclaim returns a token without expires_in (so expires_at is nil), every MCP call issues one doomed request, refreshes, and retries — extra latency on Brian-facing Superhuman/Reclaim tool calls and needless refresh churn; and if the reactive refresh path ever regr
- **Fix:** In token_expiring? rescue ArgumentError -> return true (treat unknown expiry as expiring, forcing a refresh) rather than false; missing-expiry should refresh, not skip.

### 100. [low·plausible·bug·contracts] Nil-deal crash across the post-signing pipeline for event_sponsor-only contracts
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/jobs/generate_deliverables_job.rb:8; /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_fully_executed_contract_email_job.rb:27; /Users/brianderario/Projects/kerrihq-rails/app/mailers/account_management_mailer.rb:48
- **Value/failure:** A sponsor signs a legacy event_sponsor contract: GenerateDeliverablesJob raises NoMethodError forever; contract_signed_notification (admin email) fails in the mailer job so the team is never told; on countersign, SendFullyExecutedContractEmailJob crashes at line 27 AFTER the spon
- **Fix:** Guard each: GenerateDeliverablesJob#perform: return if contract.deal.nil? (there are no sponsorship_selections without a deal anyway). SendFullyExecutedContractEmailJob:27: contract.deal&.move_to_stage!(:closed_won). Mailer: build @contract_url only when contr

### 101. [low·plausible·bug·contracts] Template-defined variables silently override built-in contract data in ContractRenderer
- **Files:** /Users/brianderario/Projects/kerrihq-rails/app/services/contract_renderer.rb:31; /Users/brianderario/Projects/kerrihq-rails/app/services/contract_renderer.rb:63
- **Value/failure:** One innocuous template edit produces legal contracts carrying the wrong company name or wrong total value, and nothing errors — the wrong value is rendered, sent, signed, and hashed. Non-technical Brian would not catch it until a sponsor does.
- **Fix:** Flip precedence so live deal data always wins: custom_variables.merge(built_ins) i.e. change line 31 to start from custom_variables and merge the built-in hash over it (or use built_ins.reverse_merge only for keys not already built-in). Add a ContractTemplate 
