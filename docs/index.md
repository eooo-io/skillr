---
layout: home

hero:
  name: Skillr
  text: Portable AI instruction format
  tagline: Write AI instructions once. Sync them to Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, Zed, Aider, Continue, and JetBrains AI — from one CLI.
  actions:
    - theme: brand
      text: CLI Quickstart
      link: /guide/cli-quickstart
    - theme: alt
      text: How It Works
      link: /guide/how-it-works
    - theme: alt
      text: GitHub
      link: https://github.com/eooo-io/skillr

features:
  - title: One source of truth
    details: Define skills in .skillr/ once. Skillr compiles to 10 native provider configs (CLAUDE.md, .cursor/rules/, .github/copilot-instructions.md, and more).
    icon: 📦
  - title: Zero config churn
    details: npx @eooo/skillr init && skillr sync — two commands, no Docker, no database, no web UI. Works in any repo.
    icon: ⚡
  - title: Provider-aware
    details: Single-file providers get concatenated output. Multi-file providers (Cursor, Windsurf, Continue) get one rule file per skill. Supplementary files flow through as companion files or appended sections.
    icon: 🎯
  - title: Composition & templates
    details: Skills can include other skills. Template variables with defaults. Conditional skills that only ship when the target project actually has the relevant files.
    icon: 🧩
  - title: Pluggable providers
    details: Drop a JS file into .skillr/plugins/ to add support for any new AI tool. Built-in drivers use the same interface — no special internal APIs.
    icon: 🔌
  - title: Watch mode & linting
    details: skillr sync --watch rebuilds on every save. skillr lint catches vague instructions, weak constraints, and missing output formats before they ship.
    icon: 🔍
---

## Install

```bash
npx @eooo/skillr init
```

Or globally:

```bash
npm install -g @eooo/skillr
skillr init
```

Then follow the [CLI Quickstart](/guide/cli-quickstart).
