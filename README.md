<div align="center">

<img src="assets/logo.png" alt="Skillr" width="420">

**Write AI instructions once. Sync to every tool you use.**

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)
[![npm](https://img.shields.io/npm/v/%40eooo/skillr?style=for-the-badge&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/@eooo/skillr)
[![Node 18+](https://img.shields.io/badge/node-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

</div>

---

Every AI coding tool has its own config format. Claude uses `CLAUDE.md`. Cursor uses `.cursor/rules/`. Copilot uses `.github/copilot-instructions.md`. Codex uses `AGENTS.md`. Windsurf, Cline, Zed — all different.

**Skillr** gives you one canonical format (`.skillr/`) and compiles it to all of them. No Docker, no database, no web browser. Just a CLI.

```
.skillr/skills/
    ├── code-review.md
    ├── testing-strategy.md
    └── api-standards.md
          │
          ▼  skillr sync
    ┌─────┼─────┬─────┬─────┬─────┐
    ▼     ▼     ▼     ▼     ▼     ▼
 CLAUDE  .cursor  copilot  .windsurf  .clinerules  AGENTS
  .md    /rules   .md      /rules                  .md
```

## Install

```bash
npm install -g @eooo/skillr
```

Or use directly with `npx`:

```bash
npx @eooo/skillr <command>
```

## Quick Start

```bash
skillr init
skillr add "Code Review Standards"
# edit .skillr/skills/code-review-standards.md
skillr sync
```

That's it. Here's what just happened:

**Your skill** (`.skillr/skills/code-review-standards.md`):

```markdown
---
id: code-review-standards
name: Code Review Standards
description: Enforce team code review conventions
tags: [code-quality]
---

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.
```

**Generated output** after `skillr sync`:

`.claude/CLAUDE.md`:
```markdown
## Code Review Standards

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.

---
```

`.cursor/rules/code-review-standards.mdc`:
```yaml
---
description: Enforce team code review conventions
alwaysApply: true
tags:
  - code-quality
---

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.
```

`.github/copilot-instructions.md`:
```markdown
## Code Review Standards

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.

---
```

Same instructions, every tool's native format, from one source file.

### Already have AI instructions?

Import them from existing provider configs:

```bash
skillr import
# Detected 3 skills in .claude/CLAUDE.md
# Detected 2 skills in .cursor/rules/
# Imported 5 skills → .skillr/skills/
```

## Commands

| Command | Description |
|---|---|
| `skillr init` | Initialize `.skillr/` in the current directory |
| `skillr add <name>` | Create a new skill from a template |
| `skillr sync` | Compile skills to all enabled provider configs |
| `skillr diff` | Preview what sync would change |
| `skillr lint [slug]` | Run prompt quality checks (11 rules) |
| `skillr import` | Import skills from existing provider configs |
| `skillr test <slug>` | Test a skill against an LLM (Anthropic or OpenAI) |

```bash
skillr init --name "My Project" --providers claude,cursor
skillr sync --provider claude          # sync one provider only
skillr sync --dry-run                  # preview without writing
skillr lint --json                     # machine-readable output
skillr test my-skill --model gpt-4o   # override the skill's model
```

## Supported Providers

| Provider | Output | Format |
|---|---|---|
| **Claude** | `.claude/CLAUDE.md` | All skills under H2 headings |
| **Cursor** | `.cursor/rules/{slug}.mdc` | One MDC file per skill |
| **GitHub Copilot** | `.github/copilot-instructions.md` | All skills concatenated |
| **Windsurf** | `.windsurf/rules/{slug}.md` | One file per skill |
| **Cline** | `.clinerules` | Single flat file |
| **OpenAI Codex** (CLI / macOS / IDE) | `AGENTS.md` | All skills concatenated at project root |
| **OpenAI** *(deprecated, removed in v1.2.0)* | `.openai/instructions.md` | Use `codex` instead |
| **Zed** | `.rules` | Single flat file |
| **Aider** | `CONVENTIONS.md` + `.aider.conf.yml` | Aggregated conventions referenced by config |
| **Continue** | `.continue/rules/{slug}.md` | One file per skill |
| **JetBrains AI (Junie)** | `.junie/guidelines.md` | Single flat file |

## How It Works

A **skill** is a Markdown file with YAML frontmatter:

```markdown
---
id: code-review
name: Code Review Standards
description: Enforce team code review conventions
tags: [code-quality, review]
includes: [base-instructions]
template_variables:
  - name: language
    default: TypeScript
---

You are a senior code reviewer. All code must be written in {{language}}.

## Rules
- No `any` types
- All public functions must have JSDoc
- Prefer composition over inheritance

## Output Format
Return a structured review with severity levels: critical, warning, suggestion.
```

**Required fields:** `id`, `name`. Everything else is optional.

### Composition

Skills can include other skills via `includes`. Resolved recursively at sync time with circular dependency detection (max depth 5):

```yaml
includes: [base-instructions, typescript-conventions]
```

### Template Variables

`{{variable}}` placeholders with defaults, resolved per-project at sync time:

```yaml
template_variables:
  - name: language
    default: TypeScript
```

### Prompt Linting

11 built-in quality rules catch vague instructions, weak constraints, conflicting directives, missing output formats, role confusion, and more:

```bash
skillr lint                  # lint all skills
skillr lint code-review      # lint one skill
```

### Skill Format

Simple skills are flat Markdown files. Complex skills use folder format:

```
.skillr/skills/api-standards/
    ├── skill.md           # main skill file
    ├── gotchas.md         # common pitfalls
    └── examples/
        └── response.json  # supplementary files
```

### Frontmatter Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | **Required.** Unique identifier (kebab-case) |
| `name` | `string` | **Required.** Display name |
| `description` | `string` | When this skill applies |
| `category` | `string` | One of 10 predefined categories |
| `skill_type` | `string` | `capability-uplift` or `encoded-preference` |
| `model` | `string` | Target model (e.g., `claude-sonnet-4-6`) |
| `max_tokens` | `number` | Max output tokens |
| `tags` | `string[]` | Organizational tags |
| `tools` | `object[]` | Tool/function definitions |
| `includes` | `string[]` | Skill slugs to compose with |
| `template_variables` | `object[]` | `{{variable}}` definitions with defaults |
| `gotchas` | `string` | Common pitfalls and edge cases |
| `conditions` | `object` | `file_patterns` and `path_prefixes` for conditional application |

## Development

```bash
cd cli
npm install
npm run build          # compile TypeScript
npm run dev -- init    # run commands during development
npm test               # run tests (109 tests, vitest)
```

## Web Dashboard

This repo also contains a web-based dashboard for teams that want a GUI. It's a separate application built on Laravel + React — see [docs/guide/getting-started.md](docs/guide/getting-started.md) for setup instructions.

The CLI does not depend on the web dashboard. They share the same `.skillr/` format.

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## Security

If you discover a security vulnerability, please see [SECURITY.md](SECURITY.md) for responsible disclosure instructions. **Do not open a public issue.**

## License

[MIT](LICENSE) — Copyright 2026 [eooo.io](https://eooo.io)
