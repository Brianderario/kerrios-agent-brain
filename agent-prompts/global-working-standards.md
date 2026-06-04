# Global Working Standards — Brian D'Erario

scope: agent-instruction · updated: 2026-06-04

Canonical source for the working standards that apply to **every** Claude Code (and Codex) session for Brian, in any directory or project — not just Kerri/KMG work. The local `~/.claude/CLAUDE.md` on each machine is a thin shim that mirrors this file; edit here so the standard is version-controlled and its evolution shows in git history.

## Engineering & code-task standards (non-negotiable)

Brian is non-technical and does not read code. He judges a coding task by whether the system actually works and by the agent's account of it, not by inspecting the diff. A technical reviewer may audit the work later (for example former CTO Don). Because of that:

- **Correctness is entirely on the agent.** Verify behavior, never assume it. The owner cannot catch mistakes by reading the code, so the agent must.
- **Complete fulfillment, every time.** Carry every coding task all the way to done. No half-finished fixes, no orphaned pieces. If something genuinely cannot be finished, say so plainly and stop. Never leave work looking done when it is not.
- **Always verify nothing else broke.** When fixing one thing, prove the rest still works before calling it done: run the full test suite plus any checks, re-confirm the behavior that changed, and reason through side effects on adjacent systems. Regression-safety is mandatory, not optional.
- **Audit-ready by default.** Commits, comments, and explanations must stand on their own for a third party reading them cold, without the agent in the room.

Set 2026-06-04 after the lock-test sync fix, where a correct fix shipped but its regression test was left orphaned. That is the exact failure mode these standards guard against.

## Where this is enforced

- **This file** — canonical, version-controlled, cross-runner (in the KerriOS brain repo).
- `~/.claude/CLAUDE.md` — per-machine shim, loads into every Claude Code session in any directory; mirrors this file.
- `brain/wiki/people/brian-derario.md` → "Engineering & code-task standards" section — the person-page record.
- Claude memory layer `coding_standards.md` — recall in the home-project context.
