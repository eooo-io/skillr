# CLI Quickstart

Get from zero skills to a synced provider config in under two minutes.

## Install

You don't need to install anything — just use `npx`:

```bash
npx @eooo/skillr --help
```

Or install globally for a shorter command:

```bash
npm install -g @eooo/skillr
skillr --help
```

## 1. Initialize your project

```bash
cd your-project
skillr init
```

You'll get:

```
(^ ^)  Initialized .skillr/ for "your-project"
      Providers: claude, cursor, copilot, windsurf, cline, codex, openai, zed, aider, continue, junie

      Next steps:
        skillr add "My First Skill"    Create a skill
        skillr sync                    Sync to provider configs
```

This creates `.skillr/manifest.json` with every built-in provider enabled. Trim the list in the manifest if you only care about a few.

## 2. Add your first skill

```bash
skillr add "Code Review Standards"
```

Skillr writes a starter file at `.skillr/skills/code-review-standards.md`:

```markdown
---
id: code-review-standards
name: Code Review Standards
description: null
category: general
tags: []
includes: []
template_variables: []
created_at: 2026-04-17T09:00:00.000Z
updated_at: 2026-04-17T09:00:00.000Z
---

You are a helpful assistant.

## Instructions

- Replace this with your skill instructions
```

Open it in your editor and replace the body with your actual code-review instructions.

## 3. See what sync will do

```bash
skillr diff
```

You'll see per-provider previews:

```
[ADDED] .claude/CLAUDE.md
Provider: claude
+ # CLAUDE.md
+
+ ## Code Review Standards
+ ...
```

## 4. Write the provider configs

```bash
skillr sync
```

```
(^ ^)  claude: 1 file(s) written
      .claude/CLAUDE.md
(^ ^)  cursor: 1 file(s) written
      .cursor/rules/code-review-standards.mdc
... (one per enabled provider)

(^ ^)  Synced 11 file(s) across 11 provider(s).
```

## 5. Keep skills in sync while editing

```bash
skillr sync --watch
```

Leave it running while you tweak skill files. Every save re-syncs within 150ms.

## Common next steps

- **List** every skill in the project: `skillr list` (or `skillr ls`)
- **Remove** a skill: `skillr remove <slug>` (or `skillr rm <slug>`)
- **Quality-check** a skill's prompt: `skillr lint <slug>`
- **Import** existing `CLAUDE.md` / `.cursor/rules/` etc. into `.skillr/`: `skillr import`
- **Test** a skill against Claude or OpenAI: `skillr test <slug>`
- **Scaffold a custom provider plugin**: `skillr provider:add "My Tool"` → see [Custom Providers](./custom-providers.md)

## What got created on disk

```
your-project/
├── .skillr/
│   ├── manifest.json              # Project metadata + enabled providers
│   └── skills/
│       └── code-review-standards.md
├── .claude/CLAUDE.md              # Claude Code
├── .cursor/rules/                 # Cursor
│   └── code-review-standards.mdc
├── .github/copilot-instructions.md
├── .windsurf/rules/code-review-standards.md
├── .clinerules
├── AGENTS.md                      # OpenAI Codex (CLI / macOS / IDE)
├── .openai/instructions.md        # deprecated — removed in v1.2.0
├── .rules                         # Zed
├── CONVENTIONS.md + .aider.conf.yml
├── .continue/rules/code-review-standards.md
└── .junie/guidelines.md
```

`.skillr/` is your source of truth. The others are generated — regenerate them with `skillr sync` whenever the source changes.
