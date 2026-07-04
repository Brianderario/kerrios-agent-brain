# Audit hand-off — REMAINING findings (2026-07-04)

Status: the 2026-07-03 Fable audit found 106 verified issues. All 5 I shipped (PRs #334-338) + Codex's 61 overnight PRs (#341-#399) cover EVERY critical and high finding. The items below are the ones whose cited files Codex did NOT touch, so they're the genuine remainder for the next agent. (Findings whose files WERE touched are likely-addressed but worth a spot-verify.)

## 16 remaining (all medium/low). Full detail: findings.json

### [medium · upgrade · api-v1] Invalid-API-key requests are never rate limited (auth halts before the limiter)
- Files: app/controllers/api/v1/base_controller.rb:4-8
- Fix: Add a second, generous IP-keyed limiter declared BEFORE the authenticate before_action so it runs first: move `rate_limit to: 300, within: 1.minute, by: -> { request.remote_ip }, name: "pre_auth", with: -> {...}` above line 4, and keep the 

### [medium · bug · api-v1] WorkspaceRuns#index embeds every event's full stdout/stderr per run (N+1 + unbounded payload)
- Files: app/controllers/api/v1/workspace_runs_controller.rb:9; app/controllers/api/v1/workspace_runs_controller.rb:114; app/controllers/api/v1/workspace_runs_controller.rb:118-122
- Fix: Two-part, both backward compatible: (1) add .includes(:events) to the index scope and sort the preloaded array in Ruby (record.events.sort_by(&:created_at)) to kill the N+1 without changing output; (2) add an additive opt-down param ?events

### [medium · bug · external-clients] Apollo 429 retry ignores Retry-After and blocks a Puma thread with a fixed sleep
- Files: app/services/apollo_client.rb:449; app/services/apollo_client.rb:455; app/services/apollo_client.rb:500
- Fix: Read response.headers['retry-after'] (seconds or HTTP-date), clamp to a sane max (e.g. 10s), add exponential backoff + jitter across the retries, and raise attempts modestly. Longer-term, run Apollo lookups in a background job rather than i

### [medium · bug · frontend] XSS: autocomplete renders remote suggestion text/subtitle/badge into innerHTML unescaped
- Files: /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:634; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:637; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/autocomplete_controller.js:698
- Fix: Escape before highlighting: in renderSuggestions compute `const safeText = this.escapeHtml(text)` (helper already exists at line ~1078) and pass that to highlightText; in highlightText escape the input first, then wrap matches in <mark> (ma

### [medium · bug · frontend] Kanban drag failures are silent: showError dispatches 'toast:show' but the toast system listens for 'toast-show'
- Files: /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/kanban_controller.js:217; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/toast_controller.js:42
- Fix: Replace showError with `if (window.toast) window.toast(message, { type: "error" }); else window.dispatchEvent(new CustomEvent("toast-show", { detail: { message, type: "error" } }))`. Two-line change; verify by killing the network in devtool

### [medium · bug · frontend] Memory leak: dropdown_popover and context_menu leak document-level listeners on every Turbo navigation
- Files: /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/dropdown_popover_controller.js:44; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/context_menu_controller.js:39
- Fix: dropdown_popover: store `this.escHandler = (e) => {...}` in connect, `document.removeEventListener("keydown", this.escHandler)` in disconnect. context_menu: bind once in connect (`this.boundCloseMenu = this.closeMenu.bind(this)` etc.), pass

### [medium · bug · frontend] select_controller (TomSelect) leaks listeners/observers on clearInput and observes document.body per instance
- Files: /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:1689; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:513; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/select_controller.js:552
- Fix: (1) Extract a #teardownPositioning() and call it at the top of #setupPositioning (or from clearInput before re-setup). (2) Store the bound handler once (`this.infiniteScrollHandler ||= this.#handleScroll.bind(this)`) and add/remove that ref

### [medium · upgrade · frontend] Upgrade: vendor the four CDN stylesheets so the console works offline and on flaky mobile networks
- Files: /Users/brianderario/Projects/kerrihq-rails/app/views/layouts/application.html.erb:28; /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/lightbox_controller.js:21
- Fix: Copy tom-select.css, air-datepicker.min.css, photoswipe.css from node_modules into app/assets/stylesheets/vendor/ (or @import them in application.tailwind.css since the packages are already in package.json), delete the four <link>/<script> 

### [medium · upgrade · frontend] Upgrade: Ask Savant copilot loses the whole conversation on every page navigation
- Files: /Users/brianderario/Projects/kerrihq-rails/app/javascript/controllers/ask_savant_controller.js:10; /Users/brianderario/Projects/kerrihq-rails/app/views/layouts/application.html.erb:83
- Fix: Persist `this.history` (and rendered messages) to sessionStorage keyed per-user (e.g. `askSavant.history`), write-through in send(), and in connect() rehydrate + re-render via the existing appendMessage(). Cap at ~30 messages and clear on l

### [medium · upgrade · jobs] Permanently failed Solid Queue jobs are invisible: no drift signal watches the failed set, and ApplicationJob keeps DeserializationError failures forever
- Files: /Users/brianderario/Projects/kerrihq-rails/app/jobs/application_job.rb:1-8; /Users/brianderario/Projects/kerrihq-rails/app/jobs/ticket_search_result_enrichment_job.rb:14; /Users/brianderario/Projects/kerrihq-rails/app/services/agent_drift_monitor.rb:1-20
- Fix: (1) In ApplicationJob: `discard_on ActiveJob::DeserializationError` and `retry_on ActiveRecord::Deadlocked, wait: 5.seconds, attempts: 3`. (2) Add a signal to AgentDriftMonitor: count `SolidQueue::FailedExecution.where(created_at: 24.hours.

### [low · upgrade · agents-infra] Upgrade: VoiceCalibration.gather_edits loads every org task from the last 30 days and samples an arbitrary (not newest) 25 edits
- Files: app/services/voice_calibration.rb:59-69
- Fix: Push filtering and ordering into SQL: `organization.tasks.where("updated_at > ?", window_days.days.ago).where("COALESCE(resolution_payload ->> 'edited_body', '') <> ''").order(updated_at: :desc).limit(limit * 4).filter_map { ... }.first(lim

### [low · upgrade · api-v1] Every API request writes an UPDATE to api_keys via touch_last_used!
- Files: app/controllers/api/v1/base_controller.rb:45; app/models/api_key.rb:61-63
- Fix: In touch_last_used!, skip the write when fresh: `return if last_used_at && last_used_at > 1.minute.ago; update_column(:last_used_at, Time.current)`. One-line change, covered by a model spec asserting no write within the window and a write a

### [low · upgrade · external-clients] SafeHttp validates a resolved IP but Faraday re-resolves and connects (DNS-rebinding TOCTOU)
- Files: app/services/safe_http.rb:29; app/services/rest_api_client.rb:31; app/services/generic_mcp_client.rb:52
- Fix: Have SafeHttp.check! return the validated IP, then connect to that IP directly while sending the original Host header (and SNI) — e.g. resolve once, build the Faraday URL against the pinned IP, or install a custom resolver/socket that pins 

### [low · bug · external-clients] MCP token pre-refresh fails open when expires_at is missing/malformed, defeating proactive refresh
- Files: app/services/superhuman_mcp_client.rb:144; app/services/reclaim_mcp_client.rb:135
- Fix: In token_expiring? rescue ArgumentError -> return true (treat unknown expiry as expiring, forcing a refresh) rather than false; missing-expiry should refresh, not skip.

### [low · bug · jobs] [client-email: keep OFF] SendContractForSigningJob flips the contract to 'sent' before delivery with no post-hoc confirmation marker — a crash in the window shows 'sent' while the client never got the signing link
- Files: /Users/brianderario/Projects/kerrihq-rails/app/jobs/send_contract_for_signing_job.rb:27-35
- Fix: Additive column `delivery_confirmed_at` on contracts, stamped immediately after `deliver_now` succeeds. Add a check (fits naturally in AgentDriftMonitor or the AgentHealthCheckJob daily pass) for contracts `sent` with `delivery_confirmed_at

### [low · bug · sponsor-hub] Manual 'send asset reminder' tells Brian a reminder went out when the service no-opped
- Files: app/controllers/sponsor_commitments_controller.rb:44-47; app/services/sponsor_asset_reminder_service.rb:15-20
- Fix: Have #call return a symbol (:sent vs :assets_complete) or a small Result. In the controller branch the flash: assets complete → notice: 'Assets are already complete for <sponsor> — no reminder needed.'; sent → the current message. One-line 
