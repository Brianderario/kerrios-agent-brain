# MCP Tool-Add Checklist

scope: workflow · updated: 2026-05-24 · trigger: 2026-05-24 gtasks-handler bug

A tool added to an MCP server has TWO halves. Forgetting either half produces a silent-but-fatal failure pattern where the tool appears in the catalog but errors on call. This page is the prevention checklist.

## The two halves

In `@modelcontextprotocol/sdk` (Node), every tool needs:

1. **A definition** — entry in the response from `server.setRequestHandler(ListToolsRequestSchema, ...)`. Tells clients the tool exists, what its inputs are, what it does.
2. **A handler** — case branch inside `server.setRequestHandler(CallToolRequestSchema, ...)`. The actual code that executes when the tool is invoked.

If you write only (1), the tool advertises but every call falls through to the default `throw new McpError(ErrorCode.MethodNotFound, "Unknown tool: ${name}")`.

## Checklist when adding or modifying a tool

Before declaring "done":

- [ ] Tool def added to ListToolsRequestSchema response (name, description, inputSchema)
- [ ] Handler case `if (name === "<tool_name>") { ... }` added to CallToolRequestSchema handler, BEFORE the final `throw McpError(MethodNotFound)`
- [ ] Handler returns the standard MCP shape: `{ content: [{ type: "text", text: JSON.stringify(...) }] }`
- [ ] Required scopes / clients are initialized at server start (e.g. `tasksClient`, `docsClient`)
- [ ] Auth scope (OAuth) covers the API the handler calls — verify `setup-auth.mjs` SCOPES list includes the needed Google API scope, then re-run setup if a new scope was added
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] Verify dist: `grep -c 'name === "<tool_name>"' dist/index.js` returns at least 1
- [ ] Smoke test: call the tool from a fresh session and check it returns expected output (not "Unknown tool")

## Restart semantics

The dist gets read at MCP-server spawn time. Spawn happens once per parent process (Claude Code session, scheduled-task run).

- **Scheduled tasks**: each cron firing spawns a fresh Claude Code subprocess, which spawns a fresh MCP. New dist picks up automatically. No manual action needed.
- **Interactive Claude Code session**: your running session is holding the old MCP. Restart Claude Code OR `/mcp` reconnect to load the new dist.

## Authentication is orthogonal

A tool that fails with "Unknown tool" is a **code** problem, not an auth problem. Don't waste time re-running OAuth flows when the error is "Unknown tool" — that means the server received the call and didn't have a handler. OAuth handles "API returned 403 / insufficient scope" — different error class entirely.

If you see "Unknown tool", check the dist first.

## Source-code version control gap (open issue)

As of 2026-05-24, `~/.kerri-chief/kerri-gdocs-mcp/` is not under git locally. The bug that triggered this checklist (partial gtasks add, definitions without handlers) would have been caught by code review on a PR. Hardening item:

- [ ] Initialize git in `~/.kerri-chief/kerri-gdocs-mcp/` (and the email MCP directories)
- [ ] Push to a private GitHub repo
- [ ] Lock the `.env` files out via `.gitignore`
- [ ] Add a basic CI check that runs `npm run build` and verifies all advertised tool names have handler branches

## Related

- [[2026-05-24-google-tasks-approval]] — original decision to use Google Tasks
- [[2026-05-24-brain-architecture]] — why the brain catches drift like this (every fix becomes a wiki page)
