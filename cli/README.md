# @eooo/skillr

**Write AI instructions once. Sync to every tool you use.**

Every AI coding tool has its own config format. Claude uses `CLAUDE.md`. Cursor uses `.cursor/rules/`. Copilot uses `.github/copilot-instructions.md`. Windsurf, Cline, OpenAI — all different.

Skillr gives you one canonical format (`.skillr/`) and compiles it to all of them.

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
npx @eooo/skillr init
npx @eooo/skillr add "Code Review Standards"
# edit .skillr/skills/code-review-standards.md
npx @eooo/skillr sync
```

Or install globally:

```bash
npm install -g @eooo/skillr
skillr init
skillr add "Code Review Standards"
skillr sync
```

## What It Does

**Input** — you write one skill file (`.skillr/skills/code-review.md`):

```markdown
---
id: code-review
name: Code Review Standards
description: Enforce team code review conventions
tags: [code-quality]
---

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.
```

**Output** — `skillr sync` generates each provider's native format:

`.claude/CLAUDE.md`:
```markdown
## Code Review Standards

All public functions must have JSDoc.
Prefer composition over inheritance.
No `any` types in TypeScript.

---
```

`.cursor/rules/code-review.mdc`:
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

Same instructions, every tool's native format, from one source file.

## Skill Format

A skill is a Markdown file with YAML frontmatter:

```markdown
---
id: code-review
name: Code Review Standards
description: Enforce team code review conventions
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
```

Required fields: `id`, `name`. Everything else is optional.

## Commands

| Command | Description |
|---|---|
| `skillr init` | Initialize `.skillr/` in the current directory |
| `skillr add <name>` | Create a new skill from a template |
| `skillr sync` | Compile skills to all enabled provider configs |
| `skillr diff` | Preview what sync would change |
| `skillr lint [slug]` | Run prompt quality checks (11 rules) |
| `skillr import` | Import skills from existing provider configs |
| `skillr test <slug>` | Test a skill against an LLM |

### Options

```bash
skillr init --name "My Project" --providers claude,cursor
skillr sync --provider claude       # sync one provider only
skillr sync --dry-run               # preview without writing
skillr lint --json                  # machine-readable output
skillr test my-skill --model gpt-4o # override the skill's model
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

## Features

- **Composition** — skills can include other skills via `includes:` with recursive resolution (max depth 5, circular dependency detection)
- **Template variables** — `{{variable}}` placeholders with defaults, resolved at sync time
- **Prompt linting** — 11 quality rules catching vague instructions, weak constraints, conflicting directives, missing output formats, and more
- **Reverse import** — pull existing instructions from provider configs into `.skillr/`
- **Diff preview** — see exactly what `sync` will change before writing
- **LLM testing** — test skills against Anthropic or OpenAI models with streaming output

## Programmatic API

```typescript
import {
  SkillFileParser,
  SkillCompositionService,
  TemplateResolver,
  PromptLinter,
  ManifestService,
  SyncService,
} from '@eooo/skillr';
```

## License

[MIT](https://github.com/eooo-io/skillr/blob/main/LICENSE) — Copyright 2026 [eooo.io](https://eooo.io)
