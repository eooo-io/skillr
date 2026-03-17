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

So what if you wrote your instructions once, in a single canonical format, and then generated each tool's native config from that source?

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

This one file becomes:
- An H2 section in `.claude/CLAUDE.md` for Claude Code users
- A `.cursor/rules/error-handling.mdc` file for Cursor users
- A section in `.github/copilot-instructions.md` for Copilot users
- A `.windsurf/rules/error-handling.md` for Windsurf users
- A section in `.clinerules` for Cline users
- A section in `.openai/instructions.md` for OpenAI users

One source, every tool synchronized. When you update the skill, every provider config regenerates. When a new developer joins the team — regardless of which AI tool they prefer — they get the full set of team instructions on their first sync.

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

AI instructions are only as good as their clarity. Skillr includes a built-in prompt linter with eight quality rules that catch common issues: vague instructions ("do your best"), weak constraints ("you should" vs "you must"), conflicting directives (asking for both concise and detailed output), missing output format specs, and more.

It's a small thing, but it pushes the team toward writing better prompts — which directly translates to better AI-generated code.

---

## Reverse-Sync: Meeting Teams Where They Are

One of the most important features came from a practical realization: teams don't start from zero. They already have `.claude/CLAUDE.md` files, Cursor rules, and Copilot instructions scattered across their repositories.

Skillr can scan a project directory, detect all existing provider config files, and reverse-import them into the canonical `.skillr/` format. It parses each provider's native format — H2 headings from Claude, MDC frontmatter from Cursor, flat files from Cline — and converts them into portable skills.

This means adoption doesn't require throwing away existing work. Point Skillr at your repo, scan, and your existing instructions become the starting point for a unified skill library.

We recently expanded this to automatically detect provider configs whenever you scan a project. No separate import step needed — it finds everything and brings it in, tagging each imported skill with its source provider for traceability.

---

## The Skill Library: Institutional Knowledge as Code

The second-order effect I didn't anticipate was how Skillr changed the way teams think about their coding standards.

When your instructions are scattered across tool-specific config files that only one person maintains, they're effectively invisible. Nobody browses `.cursor/rules/` to see what conventions exist. Nobody reads through a 500-line `CLAUDE.md` to find the authentication patterns.

But when those instructions are organized as a browsable, searchable library of named skills with descriptions and tags — suddenly they become discoverable. New developers can browse the skill library to understand "how we do things here." Senior developers can see gaps in coverage. The team can discuss and iterate on skills in pull requests, just like code.

We ship 25 pre-built skills covering common patterns: Laravel best practices, React conventions, security rules, documentation standards, code review guidelines. Teams can import these as starting points and customize them.

---

## Multi-Model Testing

Having skills in a structured format opened another door: you can test them. Skillr includes a live test runner that streams responses from any supported LLM provider — Anthropic, OpenAI, Gemini, or local Ollama models.

Write a skill, then immediately test it by sending a prompt and watching the streamed response. Try it against different models. Compare how Claude interprets your instructions versus GPT. This tight feedback loop makes it practical to iterate on prompt quality in a way that copying text between config files never allowed.

---

## The Architecture Choice: Why Laravel (For Now)

Skillr is built on Laravel 12 with a React + TypeScript SPA. The backend handles skill file I/O, YAML parsing, provider sync, Git operations, and LLM streaming. The frontend gives you a Monaco editor for writing skills, a visual dependency graph, and a playground for testing.

For a tool that does heavy file system operations, YAML parsing, recursive template resolution, and manages seven different provider output formats, a batteries-included framework like Laravel was the right starting point. The service layer maps cleanly to the domain: a `ProviderSyncService` orchestrates seven provider drivers, a `SkillCompositionService` handles recursive includes, a `TemplateResolver` processes variables.

The long-term plan is to migrate to NestJS/TypeScript so we can ship a self-contained desktop app via Tauri — no Docker, no PHP, no database server needed. But the Laravel version gave us the fastest path to a working product, and we're using it to prove out the feature set before investing in the platform change. Features first, architecture second.

---

## What's Next

The direction I'm most excited about is turning Skillr from a skill sync tool into an agent configuration platform. Today, you define individual skills. Tomorrow, you define complete agent personas — with goals, tool access, memory strategies, and delegation chains — and export them to frameworks like Claude Agent SDK, LangGraph, or CrewAI.

The `.skillr/` directory becomes the canonical definition of how AI operates in your project: what it knows, what it can do, how it should behave. Provider sync becomes one output target among many.

But that's Phase A. Right now, the immediate value is simpler: write your AI instructions once, and every tool on your team stays synchronized.

---

## Try It

Skillr is open source under the MIT license.

**GitHub:** [github.com/eooo-io/skillr](https://github.com/eooo-io/skillr)

```bash
git clone https://github.com/eooo-io/skillr.git
cd skillr
make build && make up && make migrate
cd ui && npm install && npm run dev
```

If your team uses more than one AI coding tool — and most do — I'd love to hear how you're handling the synchronization problem today. Open an issue, start a discussion, or contribute a new provider driver. The format is intentionally simple, and adding a new provider is a single class that reads skills and writes files.

---

*Ezra Terlinden is the creator of Skillr and founder of [eooo.io](https://eooo.io). He builds tools for development teams navigating the AI-assisted coding landscape.*
