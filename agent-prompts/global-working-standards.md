# Global Working Standards — Brian D'Erario

scope: agent-instruction · updated: 2026-07-30

Canonical source for the working standards that apply to **every** Claude Code (and Codex) session for Brian, in any directory or project — not just Kerri/KMG work. The local `~/.claude/CLAUDE.md` on each machine is a thin shim that mirrors this file; edit here so the standard is version-controlled and its evolution shows in git history.

## Engineering & code-task standards (non-negotiable)

Brian is non-technical and does not read code. He judges a coding task by whether the system actually works and by the agent's account of it, not by inspecting the diff. A technical reviewer may audit the work later (for example former CTO Don). Because of that:

- **Correctness is entirely on the agent.** Verify behavior, never assume it. The owner cannot catch mistakes by reading the code, so the agent must.
- **Complete fulfillment, every time.** Carry every coding task all the way to done. No half-finished fixes, no orphaned pieces. If something genuinely cannot be finished, say so plainly and stop. Never leave work looking done when it is not.
- **Always verify nothing else broke.** When fixing one thing, prove the rest still works before calling it done: run the full test suite plus any checks, re-confirm the behavior that changed, and reason through side effects on adjacent systems. Regression-safety is mandatory, not optional.
- **Audit-ready by default.** Commits, comments, and explanations must stand on their own for a third party reading them cold, without the agent in the room.

Set 2026-06-04 after the lock-test sync fix, where a correct fix shipped but its regression test was left orphaned. That is the exact failure mode these standards guard against.

## Sub-agent execution model (non-negotiable)

When Brian asks for sub-agents — explicitly or implicitly — the agents that do the work run on cheaper executors, never on the session's premium model:

- **Claude sub-agents run on Opus or Sonnet.** Pass the model override on every Agent/Workflow call. The default inherits the session model; that inheritance is the exact mistake this rule exists to prevent.
- **Spec'd repo build work may instead go to the GPT 5.6 Sol/Terra sandbox sessions**, per the plan's assignments.
- **The premium session model (e.g. Fable) is for the main loop only**: judgment, orchestration, and review of results. It never fans out.

Set 2026-07-30 after an audit fleet and six builder agents all inherited Fable, burned a large share of Brian's weekly usage, and died mid-build when the session cap hit.

## Writing standards — prose (Orwell, 1946)

These govern prose: docs, PR text, messages. They never touch code or technical terms; swap in everyday words only where precision survives.

1. Never use a metaphor, simile, or other figure of speech which you are used to seeing in print.
2. Never use a long word where a short one will do.
3. If it is possible to cut a word out, always cut it out.
4. Never use the passive where you can use the active.
5. Never use a foreign phrase, a scientific word, or a jargon word if you can think of an everyday English equivalent.
6. Break any of these rules sooner than say anything outright barbarous.

Review every prose output against these rules before delivering.

## Where this is enforced

- **This file** — canonical, version-controlled, cross-runner (in the KerriOS brain repo).
- `~/.claude/CLAUDE.md` — per-machine shim, loads into every Claude Code session in any directory; mirrors this file.
- `brain/wiki/people/brian-derario.md` → "Engineering & code-task standards" section — the person-page record.
- Claude memory layer `coding_standards.md` — recall in the home-project context.
