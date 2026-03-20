# Skillr — Implementation Plan

> This file tracks implementation progress across sessions.
> See `CLAUDE.md` for current Laravel architecture details.

---

## Current Direction: CLI-First Open Source Tool

Skillr is a **portable AI instruction format with cross-provider sync**. The core value is: define skills once in `.skillr/`, compile to native config files for Claude, Cursor, Copilot, Windsurf, Cline, and OpenAI.

The strategic priority is shipping a standalone CLI (`npx skillr`) that works without Docker, databases, or a web browser. The Laravel web app continues as an optional power-user dashboard.

```
.skillr/skills/
    ├── code-review.md
    ├── testing-strategy.md
    └── api-standards.md
          │
          ▼
   ┌──────────────┐
   │  Composition  │  ← resolve includes, substitute templates
   │    Engine     │
   └──────┬───────┘
          │
          ▼
   ┌──────────────┐
   │   Provider    │  ← pure transform: skills → native format
   │   Drivers     │
   └──────┬───────┘
          │
    ┌─────┼─────┬─────┬─────┬─────┐
    ▼     ▼     ▼     ▼     ▼     ▼
 CLAUDE  .cursor  copilot  .windsurf  .clinerules  .openai
  .md    /rules   .md      /rules                  .md
```

---

## Phase 1: Formalize .skillr/ Spec v1 — [Milestone 9](https://github.com/eooo-io/skillr/milestone/9)

**Goal:** Pin the canonical format as a stable, versioned specification. Everything else (CLI, plugins, community adoption) depends on this.

| # | Issue | Status |
|---|---|---|
| #62 | Define Skill Format Spec v1 with versioning | |
| #63 | Define provider output contract | |
| #64 | Define composition and include resolution spec | |
| #65 | Define template variable resolution spec | |

**Deliverables:** `docs/reference/spec-v1.md`, `provider-contract.md`, `composition-spec.md`, `template-spec.md`

---

## Phase 2: Standalone CLI Tool — [Milestone 10](https://github.com/eooo-io/skillr/milestone/10)

**Goal:** Ship `npx skillr` — a standalone Node.js CLI that works without Docker, MariaDB, or a browser.

| # | Issue | Status |
|---|---|---|
| #66 | Scaffold CLI package with TypeScript + Commander.js | |
| #67 | Port SkillFileParser to TypeScript | |
| #68 | Port SkillCompositionService to TypeScript | |
| #69 | Port TemplateResolver to TypeScript | |
| #70 | Port PromptLinter to TypeScript | |
| #71 | Port 6 provider drivers to TypeScript | |
| #72 | `skillr init` command | |
| #73 | `skillr add <name>` command | |
| #74 | `skillr sync` command | |
| #75 | `skillr diff` command | |
| #76 | `skillr lint` command | |
| #77 | `skillr import` command | |
| #78 | `skillr test <skill>` command | |
| #79 | Publish to npm as `skillr` | |

**Deliverables:** `cli/` directory, npm package, working `skillr init && skillr sync` flow.

---

## Phase 3: Pluggable Provider Architecture — [Milestone 11](https://github.com/eooo-io/skillr/milestone/11)

**Goal:** Make it trivial for the community to add new AI tool support.

| # | Issue | Status |
|---|---|---|
| #80 | Define ProviderPlugin interface and discovery | |
| #81 | Extract built-in providers as reference implementations | |
| #82 | `skillr provider:add <name>` command | |
| #83 | Document "How to write a provider" guide | |

---

## Phase 4: README & Positioning Overhaul — [Milestone 12](https://github.com/eooo-io/skillr/milestone/12)

**Goal:** Reposition as CLI-first. README should make someone go "oh damn" in 30 seconds.

| # | Issue | Status |
|---|---|---|
| #84 | Rewrite README for CLI-first positioning | |
| #85 | Add CLI quickstart guide to docs | |
| #86 | Update docs homepage and navigation | |
| #87 | Add "How it works" architecture diagram | |

---

## Phase 5: Roadmap Realignment — [Milestone 13](https://github.com/eooo-io/skillr/milestone/13)

**Goal:** Clean up planning artifacts from the NestJS migration era.

| # | Issue | Status |
|---|---|---|
| #88 | Close NestJS migration milestones and issues | DONE |
| #89 | Update PLAN.md with CLI-first roadmap | DONE |
| #90 | Update CLAUDE.md with CLI architecture | |

---

## Laravel Web App — COMPLETE (reference implementation)

The Laravel app is feature-complete and continues to run as an optional dashboard:

- 24 Eloquent models, 28 controllers, 34 services
- 7 provider sync drivers (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, OpenClaw)
- 4 LLM providers (Anthropic, OpenAI, Gemini, Ollama) with streaming
- Multi-tenant organizations with role-based access
- React SPA with 14 pages, Monaco editor, D3 visualizations
- Skill taxonomy (categories, types, gotchas, supplementary files)
- Desktop app config sync for MCP servers

The Laravel codebase serves as the reference implementation for the CLI port. The CLI does NOT depend on Laravel — it reads `.skillr/` directly from the filesystem.

---

## Future (post-CLI adoption)

These are deferred until CLI adoption validates demand:

- Desktop app (Tauri + embedded backend)
- Team collaboration features
- Plugin registry
- CI/CD integrations (GitHub Actions, pre-commit hooks)
