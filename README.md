<div align="center">

```
  ███████╗██╗  ██╗██╗██╗     ██╗     ██████╗
  ██╔════╝██║ ██╔╝██║██║     ██║     ██╔══██╗
  ███████╗█████╔╝ ██║██║     ██║     ██████╔╝
  ╚════██║██╔═██╗ ██║██║     ██║     ██╔══██╗
  ███████║██║  ██╗██║███████╗███████╗██║  ██║
  ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚══════╝╚═╝  ╚═╝
```

**Universal AI skill & prompt manager — write once, sync everywhere.**

</div>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/PHP-8.4-777BB4?style=flat-square&logo=php&logoColor=white" alt="PHP 8.4">
  <img src="https://img.shields.io/badge/Laravel-12-FF2D20?style=flat-square&logo=laravel&logoColor=white" alt="Laravel 12">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

---

<!-- Screenshot placeholder: add a screenshot of the UI here -->
<!-- ![Skillr Screenshot](docs/screenshot.png) -->

## What It Does

- **Write skills once** in a portable YAML + Markdown format, stored in `.skillr/skills/`
- **Sync everywhere** — generate native config files for Claude, Cursor, Copilot, Windsurf, Cline, and OpenAI with one click
- **Test against any model** — stream responses from Anthropic, OpenAI, Gemini, and local Ollama models
- **Version everything** — every save creates a snapshot with full diff history and one-click restore

## Supported Providers

| Provider | Output Path | Format |
|---|---|---|
| Claude | `.claude/CLAUDE.md` | All skills under H2 headings |
| Cursor | `.cursor/rules/{slug}.mdc` | One MDC file per skill |
| GitHub Copilot | `.github/copilot-instructions.md` | All skills concatenated |
| Windsurf | `.windsurf/rules/{slug}.md` | One file per skill |
| Cline | `.clinerules` | Single flat file |
| OpenAI | `.openai/instructions.md` | All skills concatenated |

## Quick Start

### With Docker

```bash
git clone https://github.com/eooo-io/skillr.git
cd skillr
cp .env.example .env
# Edit .env — set PROJECTS_HOST_PATH to your local dev directory

make build
make up
make migrate

# Start the React SPA
cd ui && npm install && npm run dev
```

### Without Docker

```bash
git clone https://github.com/eooo-io/skillr.git
cd skillr
composer install
cp .env.example .env
php artisan key:generate

# Configure DB_HOST=127.0.0.1 and DB credentials in .env
php artisan migrate --seed
cd ui && npm install && cd ..

# Start everything (server, queue, logs, vite)
composer dev
```

### Access Points

| Interface | URL |
|---|---|
| React SPA | http://localhost:5173 |
| Filament Admin | http://localhost:8000/admin |
| API | http://localhost:8000/api |

Default login: `admin@admin.com` / `password`

## Features

### Skill Management
- **Monaco Editor** with Markdown syntax highlighting
- **YAML frontmatter** — model, tags, tools, max_tokens, template variables
- **Version history** with Monaco diff viewer and one-click restore
- **Skill composition** via `includes:` references with recursive resolution
- **Template variables** — `{{variable}}` placeholders resolved per-project at sync time
- **Prompt linting** — 8 quality rules (vague instructions, missing output format, etc.)
- **Token estimation** with model-specific context limit warnings

### Provider Sync
- **6 providers** with format-specific output drivers
- **Diff preview** before writing — see exactly what changes
- **Git auto-commit** on skill save (optional)

### AI-Powered
- **Skill generation** — describe what you want, get a complete skill
- **Multi-model test runner** — stream from Claude, GPT, Gemini, Ollama
- **Playground** — multi-turn chat with per-turn stats

### Organization
- **Command palette** (`Ctrl+K` / `Cmd+K`) for instant fuzzy search
- **Tags** with color-coded filtering
- **Cross-project search** with FULLTEXT
- **Bulk operations** — batch tag, move, delete

### Sharing
- **25 pre-built skills** across 6 categories
- **Bundle export/import** as ZIP or JSON
- **Marketplace** for publishing and installing community skills

## Skill Format

Skills are stored as YAML frontmatter + Markdown in `.skillr/skills/`:

```markdown
---
id: summarize-doc
name: Summarize Document
description: Summarizes any document to key bullet points
tags: [summarization, documents]
model: claude-sonnet-4-6
max_tokens: 1000
includes: [base-instructions]
template_variables: [language, tone]
---

You are a precise document summarizer.
Write in {{language}} with a {{tone}} tone.
```

Required fields: `id`, `name`. Everything else is optional.

## Development

```bash
# Docker
make up          # start containers
make down        # stop containers
make migrate     # run migrations + seed
make fresh       # reset database
make test        # run tests
make shell       # bash into PHP container

# Local
composer dev     # server + queue + logs + vite
composer test    # run test suite

# Type checking
cd ui && npx tsc --noEmit
```

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | PHP 8.4 |
| Framework | Laravel 12 + Filament 3 |
| Frontend | React 19 + Vite + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Editor | Monaco Editor |
| Database | MariaDB 11 |
| LLM Providers | Anthropic, OpenAI, Gemini, Ollama |

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

## License

[MIT](LICENSE) -- Copyright 2026 [eooo.io](https://eooo.io)
