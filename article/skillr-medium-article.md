# The AI Tool Fragmentation Problem Nobody Talks About

## How managing prompts across Claude, Codex, Cursor, Windsurf, and Copilot led me to build Skillr

---

Your senior backend engineer swears by Claude Code in the terminal. Your frontend lead lives in Cursor. The mobile developer just switched to Windsurf. Someone on the team still uses Copilot in VS Code, and your DevOps person just discovered Codex CLI.

Every one of them has carefully crafted instructions telling their AI assistant how to work with your codebase. Coding standards. Framework conventions. Testing patterns. Security rules. Architecture decisions.

And none of those instructions are the same.

Welcome to the AI tool fragmentation problem.

---

## The Hidden Cost of "Use Whatever Works for You"

Most engineering teams today have adopted a pragmatic stance toward AI coding assistants: use what makes you productive. It's a reasonable position. These tools are evolving fast, developers have strong preferences, and forcing everyone onto one platform creates friction.

But there's an unspoken cost to this freedom.

When your Claude user has a `.claude/CLAUDE.md` file that says "always use repository pattern for data access," and your Cursor user has a `.cursor/rules/architecture.mdc` file that says "keep controllers thin, put logic in services," and your Copilot user has a `.github/copilot-instructions.md` that says nothing about architecture at all — you don't have a team coding standard. You have three different AI assistants with three different understandings of how your codebase should work.

The AI writes code that reflects whatever instructions it was given. If those instructions diverge across your team, the AI-assisted code diverges too. Code reviews catch some of this, but not all. And certainly not the subtle drift in style, naming, and structural decisions that accumulates over weeks and months.

I hit this problem firsthand managing a team where every developer used a different AI tool. We'd agree on conventions in a meeting, and then each person would go update their own tool's config file — if they remembered to. There was no single source of truth. No way to know if everyone's AI assistant was actually aligned. No way to share a well-crafted prompt across tools without manually reformatting it for each provider's config format.

That's when I started building Skillr.

---

## What If Prompts Were Portable?

The core insight was simple: **the instructions you give an AI coding assistant are not tool-specific.** Whether you're telling Claude, Cursor, Copilot, or Windsurf to "use TypeScript strict mode" or "follow our error handling patterns," the intent is the same. The only thing that differs is the file format and location where each tool expects to find those instructions.

So what if you wrote your instructions once, in a single canonical format, and then compiled each tool's native config from that source?

That's the fundamental idea behind Skillr. You define "skills" — reusable prompt + configuration blocks — in a provider-agnostic format. Each skill is a Markdown file with YAML frontmatter, stored in a `.skillr/` directory:

```markdown
---
id: error-handling
name: Error Handling Standards
description: Consistent error handling across the codebase
tags: [standards, errors]
---

Always use custom exception classes that extend the base AppException.
Never catch generic \Exception unless re-throwing.
Log errors with structured context: user_id, request_id, operation name.
Return consistent error response shapes from API endpoints:
{ "error": { "code": "...", "message": "..." } }
```

One command compiles this into every provider's native format:

```bash
npx @eooo/skillr sync
```

That single file becomes:
- An H2 section in `.claude/CLAUDE.md` for Claude Code users
- A `.cursor/rules/error-handling.mdc` file for Cursor users
- A section in `.github/copilot-instructions.md` for Copilot users
- A `.windsurf/rules/error-handling.md` for Windsurf users
- A section in `.clinerules` for Cline users
- A section in `.openai/instructions.md` for OpenAI users

One source, every tool synchronized. When you update the skill, every provider config regenerates. When a new developer joins the team — regardless of which AI tool they prefer — they get the full set of team instructions on their first sync.

---

## Getting Started in 30 Seconds

Skillr is a CLI tool. No Docker, no database, no web browser required.

```bash
npx @eooo/skillr init
npx @eooo/skillr add "Error Handling Standards"
# edit .skillr/skills/error-handling-standards.md
npx @eooo/skillr sync
```

That's it. Four commands, and your instructions are compiled to every AI tool your team uses.

Already have existing instructions scattered across provider configs? Skillr can reverse-import them:

```bash
npx @eooo/skillr import
# Detected 3 skills in .claude/CLAUDE.md
# Detected 2 skills in .cursor/rules/
# Imported 5 skills → .skillr/skills/
```

No throwing away existing work. Your current instructions become the starting point for a unified skill library.

---

## Going Beyond Copy-Paste: Composition, Variables, and Intelligence

Once I had the basic sync working, the real possibilities opened up.

### Skill Composition

In any mature codebase, instructions build on each other. Your "API endpoint" skill might reference your "error handling" skill, which references your "logging" skill. Skillr supports this through an `includes` field — skills can reference other skills by slug, and they're resolved recursively (with circular dependency detection) at sync time.

```yaml
---
id: api-endpoint
name: API Endpoint Standards
includes: [error-handling, logging, validation]
---

When creating a new API endpoint, follow these patterns...
```

This means you can compose complex instruction sets from small, reusable building blocks rather than duplicating content across skills.

### Template Variables

Different projects or environments might need slightly different instructions. Template variables let you parameterize skills:

```markdown
Use {{framework}} conventions for routing.
Write tests using {{test_runner}}.
Database queries should use {{orm}}.
```

The variables resolve per-project at sync time. Your Laravel project fills in `Laravel`, `Pest`, `Eloquent`. Your Node project fills in `Express`, `Jest`, `Prisma`. Same skill, different contexts.

### Prompt Linting

AI instructions are only as good as their clarity. Skillr includes a built-in prompt linter with eleven quality rules that catch common issues: vague instructions ("do your best"), weak constraints ("you should" vs "you must"), conflicting directives (asking for both concise and detailed output), missing output format specs, role confusion, redundant sections, and more.

```bash
npx @eooo/skillr lint                  # lint all skills
npx @eooo/skillr lint error-handling   # lint one skill
npx @eooo/skillr lint --json           # machine-readable output
```

It's a small thing, but it pushes the team toward writing better prompts — which directly translates to better AI-generated code.

### Diff Preview

Before writing anything to disk, you can see exactly what would change:

```bash
npx @eooo/skillr diff
```

This shows added and modified files across all providers, so you always know what sync will do before it does it.

---

## The Skill Library: Institutional Knowledge as Code

The second-order effect I didn't anticipate was how Skillr changed the way teams think about their coding standards.

When your instructions are scattered across tool-specific config files that only one person maintains, they're effectively invisible. Nobody browses `.cursor/rules/` to see what conventions exist. Nobody reads through a 500-line `CLAUDE.md` to find the authentication patterns.

But when those instructions are organized as a browsable, searchable library of named skills with descriptions and tags — suddenly they become discoverable. New developers can browse the skill library to understand "how we do things here." Senior developers can see gaps in coverage. The team can discuss and iterate on skills in pull requests, just like code.

Skills live in `.skillr/skills/` as plain Markdown files — they're version-controlled, diffable, and reviewable in any code review tool. Your team's coding standards become a first-class part of the codebase.

---

## Multi-Model Testing

Having skills in a structured format opened another door: you can test them. Skillr includes a test command that streams responses from Anthropic or OpenAI:

```bash
npx @eooo/skillr test error-handling --message "Write a file upload endpoint"
npx @eooo/skillr test error-handling --model gpt-4o
```

Write a skill, then immediately test it by sending a prompt and watching the streamed response. Try it against different models. Compare how Claude interprets your instructions versus GPT. This tight feedback loop makes it practical to iterate on prompt quality in a way that copying text between config files never allowed.

---

## The Architecture: CLI-First, Web Dashboard Optional

Skillr started as a Laravel web app — a full-featured dashboard with Monaco editor, version history, visual dependency graphs, and a multi-model playground. That version still exists and works well for teams that want a GUI.

But the real unlock was extracting the core engine into a standalone CLI. The CLI reads `.skillr/` directly from the filesystem. No Docker, no database, no PHP runtime. Just `npx @eooo/skillr` and you're running.

The CLI covers the essential workflow:

| Command | What it does |
|---|---|
| `skillr init` | Initialize `.skillr/` in any project |
| `skillr add <name>` | Create a new skill from a template |
| `skillr sync` | Compile to all provider configs |
| `skillr diff` | Preview what sync would change |
| `skillr lint` | Run prompt quality checks |
| `skillr import` | Reverse-import from existing configs |
| `skillr test` | Test against an LLM |

The web dashboard adds power-user features — version history with diff viewer, multi-turn playground, cross-project search, bundle export/import, agent composition — but the CLI is the primary interface. It's what you commit to your repo, what runs in CI, and what new team members use on day one.

---

## The Next Frontier: Desktop App Configs

There's a layer of fragmentation that goes beyond project-level instruction files.

Claude Desktop, ChatGPT Desktop, Claude Code, Codex CLI, Cursor, and Windsurf all maintain their own user-level config files that control MCP server connections, model preferences, permission rules, and approval modes. And predictably, every app stores these in a different location with a different schema.

Claude Desktop keeps its MCP servers in `~/.config/claude/claude_desktop_config.json`. Claude Code uses `~/.claude/settings.json` and per-project `.mcp.json` files. Cursor has `~/.cursor/mcp.json`. Same MCP server, same intent — three different files, three different places.

If your team has standardized on a set of MCP servers — a database connector, a documentation search tool, a deployment helper — every developer currently has to manually configure those servers in every desktop app they use. Making Skillr the single source of truth for tool configurations, not just project instructions, is the natural next step.

---

## What's Next: From Skills to Agents

The direction I'm most excited about is turning Skillr from a skill sync tool into an agent configuration platform. Today, you define individual skills. Tomorrow, you define complete agent personas — with goals, tool access (including MCP servers and A2A connections), memory strategies, and delegation chains — and export them to frameworks like Claude Agent SDK, LangGraph, or CrewAI.

The `.skillr/` directory becomes the canonical definition of how AI operates in your project and across your team's tools: what it knows, what it can do, how it should behave, and what it can connect to. Provider sync and desktop config sync become two output channels from the same source of truth.

But that's further out. Right now, the immediate value is simpler: write your AI instructions once, and everything stays synchronized.

---

## Try It

Skillr is open source under the MIT license.

```bash
npx @eooo/skillr init
npx @eooo/skillr add "My First Skill"
npx @eooo/skillr sync
```

**npm:** [@eooo/skillr](https://www.npmjs.com/package/@eooo/skillr)
**GitHub:** [github.com/eooo-io/skillr](https://github.com/eooo-io/skillr)

If your team uses more than one AI coding tool — and most do — I'd love to hear how you're handling the synchronization problem today. Open an issue, start a discussion, or contribute a new provider driver. The format is intentionally simple, and adding a new provider is a single TypeScript file that reads skills and writes files.

---

*Ezra Terlinden is the creator of Skillr and founder of [eooo.io](https://eooo.io). He builds tools for development teams navigating the AI-assisted coding landscape.*
