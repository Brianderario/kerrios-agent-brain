#!/usr/bin/env node
// Read the KMG brain from Savant (the company hub) instead of the local git
// wiki. Durable knowledge (workflows, decisions, properties, learnings, agent
// rules, memory) is the system of record in Savant as of the 2026-06-17
// "Savant as company hub" decision; this helper is how agents read it.
//
// Reads use the brain:read agent key (KERRIHQ_AGENT_API_KEY). The local git
// wiki under brain/wiki/ remains an OFFLINE FALLBACK only: if Savant is
// unreachable, read the files directly.
//
// Usage:
//   node scripts/brain-api.mjs search "package quote playbook" [--kind workflow] [--domain hardware_fyi] [--active] [--body] [--limit 8] [--json]
//   node scripts/brain-api.mjs list --kind workflow --active [--domain operations] [--body] [--json]
//   node scripts/brain-api.mjs get <record-id> [--json]
//   common: [--agent <slug>] reads AS that agent (scoped); [--env <file>]

import {
  parseEnvText,
  loadConsoleEnv,
  DEFAULT_BASE_URL,
  DEFAULT_ENV_FILE,
  buildUrl,
  consoleRequest
} from "./console-task-api.mjs";

export function resolveBrainConfig({ env = process.env, envFile = DEFAULT_ENV_FILE } = {}) {
  const fileEnv = loadConsoleEnv(envFile);
  // brain:read lives on the agent key, not the task sync token.
  const token =
    env.KERRIHQ_BRAIN_READ_KEY ||
    fileEnv.KERRIHQ_BRAIN_READ_KEY ||
    env.KERRIHQ_AGENT_API_KEY ||
    fileEnv.KERRIHQ_AGENT_API_KEY;
  const baseUrl = env.KERRIHQ_API_BASE || fileEnv.KERRIHQ_API_BASE || DEFAULT_BASE_URL;
  if (!token) {
    throw new Error(`Missing KERRIHQ_AGENT_API_KEY (brain:read). Expected it in environment or ${envFile}`);
  }
  return { token, baseUrl: baseUrl.replace(/\/+$/, "") };
}

function parseFlags(argv) {
  const flags = {};
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--json") flags.json = true;
    else if (a === "--body") flags.body = true;
    else if (a === "--active") flags.active = true;
    else if (a.startsWith("--")) {
      flags[a.slice(2)] = argv[i + 1];
      i += 1;
    } else positionals.push(a);
  }
  return { flags, positionals };
}

function formatRecord(rec, { body = false } = {}) {
  const head = `[${rec.kind}] ${rec.title}`;
  const meta = `      ${rec.domain} · ${rec.status} · ${rec.source_path || rec.source_system || "no-path"} · id=${rec.id}`;
  const lines = [ head, meta ];
  if (rec.summary) lines.push(`      ${rec.summary}`);
  if (body && rec.body) lines.push("", rec.body, "");
  return lines.join("\n");
}

export async function run(argv = process.argv.slice(2), io = { stdout: process.stdout, stderr: process.stderr }) {
  const [command, ...rest] = argv;
  const { flags, positionals } = parseFlags(rest);
  const config = resolveBrainConfig({ envFile: flags.env || DEFAULT_ENV_FILE });

  const print = (data) => {
    if (flags.json) {
      io.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
      return;
    }
    const records = Array.isArray(data) ? data : data?.data || [ data ];
    if (!records.length) {
      io.stdout.write("No matching brain records in Savant.\n");
      return;
    }
    io.stdout.write(records.map((r) => formatRecord(r, { body: flags.body })).join("\n") + "\n");
  };

  if (command === "search" || command === "list") {
    const params = {
      q: command === "search" ? positionals.join(" ") : undefined,
      kind: flags.kind,
      domain: flags.domain,
      status: flags.status,
      active: flags.active ? "true" : undefined,
      agent_slug: flags.agent,
      per_page: flags.limit || 25
    };
    const json = await consoleRequest({ endpoint: "/knowledge_records", params, config });
    const data = json?.data || [];
    print(flags.json ? json : data.slice(0, Number(flags.limit || data.length)));
    return 0;
  }

  if (command === "get") {
    const id = positionals[0];
    if (!id) throw new Error("get requires a record id");
    const json = await consoleRequest({
      endpoint: `/knowledge_records/${encodeURIComponent(id)}`,
      params: flags.agent ? { agent_slug: flags.agent } : {},
      config
    });
    print(flags.json ? json : { ...(json?.data || json), body: (json?.data || json)?.body });
    if (!flags.json) io.stdout.write(`\n${(json?.data || json)?.body || ""}\n`);
    return 0;
  }

  io.stderr.write(
    "Usage: brain-api.mjs <search|list|get> ...\n" +
      "  search \"query\" [--kind] [--domain] [--active] [--body] [--limit n] [--json]\n" +
      "  list [--kind] [--domain] [--status] [--active] [--body] [--json]\n" +
      "  get <id> [--json]   [--agent <slug>] [--env <file>]\n"
  );
  return 1;
}

const invokedDirectly = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (invokedDirectly) {
  run()
    .then((code) => process.exit(code || 0))
    .catch((err) => {
      process.stderr.write(`${err.message}\n`);
      process.exit(1);
    });
}
