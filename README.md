<div align="center">

<img src="assets/logo.png" alt="Skillr" width="420">

**Write AI instructions once. Sync to every tool you use.**

[![MIT License](https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge)](LICENSE)
[![npm](https://img.shields.io/badge/npm-skillr-cb3837?style=for-the-badge&logo=npm&logoColor=white)](https://www.npmjs.com/package/skillr)
[![Node 18+](https://img.shields.io/badge/node-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)

[Quick Start](#quick-start) · [How It Works](#how-it-works) · [Commands](#commands) · [Providers](#supported-providers) · [Web Dashboard](#web-dashboard) · [Docs](https://eooo-io.github.io/skillr)

</div>

---

Every AI coding tool has its own config format. Claude uses `CLAUDE.md`. Cursor uses `.cursor/rules/`. Copilot uses `.github/copilot-instructions.md`. Windsurf, Cline, OpenAI — all different.

**Skillr** gives you one canonical format (`.skillr/`) and compiles it to all of them.

```
.skillr/skills/
    ├── code-review.md
    ├── testing-strategy.md
    └── api-standards.md
          │
          ▼  skillr sync
    ┌─────┼─────┬─────┬─────┬─────┐
    ▼     ▼     ▼     ▼     ▼     ▼
 CLAUDE  .cursor  copilot  .windsurf  .clinerules  .openai
  .md    /rules   .md      /rules                  .md
```

## Quick Start

```bash
npx skillr init
npx skillr add "Code Review Standards"
# edit .skillr/skills/code-review-standards.md
npx skillr sync
```

That's it. Your skill is now in `.claude/CLAUDE.md`, `.cursor/rules/code-review-standards.mdc`, `.github/copilot-instructions.md`, and every other provider you've enabled.

## How It Works

A **skill** is a Markdown file with YAML frontmatter:

```markdown
---
id: code-review
name: Code Review Standards
description: Enforce team code review conventions during AI-assisted development
tags: [code-quality, review]
model: claude-sonnet-4-6
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

Skills can include other skills. Skillr resolves `includes` recursively (max depth 5, circular dependency detection):

```yaml
includes: [base-instructions, typescript-conventions]
```

### Template Variables

Use `{{variable}}` placeholders that resolve at sync time:

```yaml
template_variables:
  - name: language
    description: Primary programming language
    default: TypeScript
```

### Prompt Linting

Built-in quality checks catch vague instructions, weak constraints, conflicting directives, missing output formats, and more:

```bash
npx skillr lint                  # lint all skills
npx skillr lint code-review      # lint one skill
```

## Commands

| Command | Description |
|---|---|
| `skillr init` | Initialize `.skillr/` in the current directory |
| `skillr add <name>` | Create a new skill from a template |
| `skillr sync` | Compile skills to all enabled provider configs |
| `skillr diff` | Preview what sync would change |
| `skillr lint [slug]` | Run prompt quality checks |
| `skillr import` | Reverse-sync: import skills from existing provider configs |
| `skillr test <slug>` | Test a skill against an LLM (Anthropic or OpenAI) |

### Options

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
| **OpenAI** | `.openai/instructions.md` | All skills concatenated |

### Reverse Import

Already have AI instructions scattered across provider configs? Import them into `.skillr/` as the single source of truth:

```bash
npx skillr import
# Detected 3 skills in .claude/CLAUDE.md
# Detected 2 skills in .cursor/rules/
# Imported 5 skills → .skillr/skills/
```

## Skill Format Reference

### Flat Files

Simple skills live as single Markdown files in `.skillr/skills/`:

```
.skillr/skills/code-review.md
```

### Folder Format

Complex skills with gotchas and supplementary files use folder format:

```
.skillr/skills/api-standards/
    ├── skill.md           # main skill file
    ├── gotchas.md         # common pitfalls (highest-signal content)
    └── examples/
        └── response.json  # supplementary files
```

### Frontmatter Fields

| Field | Type | Description |
|---|---|---|
| `id` | `string` | **Required.** Unique identifier (kebab-case) |
| `name` | `string` | **Required.** Display name |
| `description` | `string` | When this skill applies (used for agent triggering) |
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

## Web Dashboard

Skillr also ships a full-featured web app for teams that want a GUI:

- **Monaco editor** with syntax highlighting and diff viewer
- **Version history** with one-click restore
- **Multi-model test runner** — stream from Claude, GPT, Gemini, Ollama
- **Playground** — multi-turn chat with per-turn stats
- **Cross-project search**, bulk operations, tag management
- **Bundle export/import** as ZIP or JSON
- **Agent composition** — merge base instructions + skills per provider

### Running the Web Dashboard

```bash
# With Docker
git clone https://github.com/eooo-io/skillr.git && cd skillr
cp .env.example .env
make build && make up && make migrate
cd ui && npm install && npm run dev

# Without Docker
composer install && cp .env.example .env && php artisan key:generate
php artisan migrate --seed
cd ui && npm install && cd ..
composer dev
```

| Interface | URL |
|---|---|
| React SPA | http://localhost:5173 |
| Filament Admin | http://localhost:8000/admin |
| API | http://localhost:8000/api |

Default login: `admin@admin.com` / `password`

### Web Dashboard Tech Stack

| Layer | Technology |
|---|---|
| Runtime | PHP 8.4 |
| Framework | Laravel 12 + Filament 3 |
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | MariaDB 11 |
| LLM Providers | Anthropic, OpenAI, Gemini, Ollama |

## Development

```bash
# CLI
cd cli
npm install
npm run build          # compile TypeScript
npm run dev -- init    # run commands during development
npm test               # run tests (109 tests, vitest)

# Web Dashboard
make up                # start Docker containers
make migrate           # run migrations + seed
make test              # run PHP tests
make fresh             # reset database
cd ui && npx tsc --noEmit   # type check frontend
```

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions and guidelines.

## Security

If you discover a security vulnerability, please see [SECURITY.md](SECURITY.md) for responsible disclosure instructions. **Do not open a public issue.**

## License

[MIT](LICENSE) — Copyright 2026 [eooo.io](https://eooo.io)
