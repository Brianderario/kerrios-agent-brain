# Setting up your Claude writing agent

How to load the two files in this pack, plus the skills and connectors we use on the KMG side that map to your workflow.

## 1. Load the pack

**If you use the Claude apps (claude.ai or desktop):**
- Create a Project called "Standard & Works".
- Paste `standard-and-works-context.md` into the project's custom instructions.
- Add `SKILL.md` as a project file and tell Claude "follow SKILL.md for any writing task", or paste its body below the context in the instructions.

**If you use Claude Code (CLI or desktop app, strongest option):**
- Make a working folder for S&W writing and drop `standard-and-works-context.md` in it renamed to `CLAUDE.md`. It loads automatically every session.
- Install the skill: copy `SKILL.md` to `~/.claude/skills/sw-article-writer/SKILL.md`. It then triggers automatically whenever you ask for a draft, headline options, or a research pool.

## 2. Skills worth copying from our setup

These are skill patterns we run daily on the KMG side. All are built with Claude Code's built-in `skill-creator` (just ask Claude "create a skill that...").

- **Deep research harness.** Fan-out web searches, fetch sources, verify claims, synthesize a cited report. This is the engine for the rankings franchise: one research run per state or sector, with publication-dated sources. Claude Code ships a `deep-research` skill; in the web app, the Research button does a lighter version.
- **Scheduled runs.** Claude Code can run a prompt on a schedule. We run a twice-weekly issue-drafting job that builds the candidate pool and stages a review draft before a human touches it. The same pattern gives you a Monday-morning "everything published in defense/aerospace/maritime since Thursday" sweep waiting in your inbox.
- **Spreadsheet skill (xlsx).** Built in. For the rankings: keep the data spine (facilities, awards, capex, workforce) in one sheet per sector and have the agent read and update it.
- **Document skills (docx/pdf).** Built in. For turning a rankings piece into the polished PDF you send to the 500 seed readers.
- **skill-creator.** The meta-skill. Once you notice yourself giving the same instructions twice, turn them into a skill.

## 3. Connectors (MCP) to wire up

Connectors let the agent act in your tools instead of just chatting. Suggested order:

1. **Web search** comes built in with Claude Code and the apps. Day one, nothing to set up.
2. **Gmail / your mailbox.** Lets the agent triage, draft replies, and search old threads. Keep it read-and-draft only at first; approve every send yourself.
3. **Google Drive.** Agent reads your docs and data sheets directly.
4. **beehiiv API.** Once an API key exists for the S&W beehiiv, a beehiiv connector makes staging drafts and pulling subscriber stats hands-off. This pairs with the access request already in flight on the other thread.
5. **A contact-data tool (we use Apollo).** For the 500-decision-maker seed list: enrich names, titles, and emails for Pentagon-adjacent, economic-development, and CEO targets, then track who got which piece. Apollo has a ready MCP connector.
6. **Calendar** (Google Calendar or whatever you use), once the agent is triaging mail.

## 4. Ground rules that saved us pain

- **Approval-gate external sends.** The agent drafts; you send. Promote it to autonomous sending only after weeks of clean drafts.
- **Give it one source of truth.** A folder of markdown files the agent reads and updates beats scattered chats. Ours is a git repo; a Drive folder works too.
- **Make it verify dates.** The freshness gate in the skill exists because linked stale stories is the fastest way to lose a serious reader. Make the agent prove publication dates, every piece.
