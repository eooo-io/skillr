# How It Works

Skillr's job is turning one canonical skill file into the native config every AI coding tool expects. The pipeline is deliberately simple.

## The pipeline

```mermaid
flowchart LR
  S[".skillr/skills/*.md"] --> P[SkillFileParser]
  P --> C[SkillComposition<br/>resolves includes]
  C --> T[TemplateResolver<br/>substitutes {{vars}}]
  T --> E[ConditionEvaluator<br/>filters by project state]
  E --> D{Provider<br/>Drivers}
  D --> Claude[".claude/CLAUDE.md"]
  D --> Cursor[".cursor/rules/*.mdc"]
  D --> Others["... 8 others"]
```

Every stage is a pure function except the first (reads) and the last (writes). That means you can run the whole thing against an in-memory project in tests with no mocking.

## What each stage does

### 1. Parser
`SkillFileParser` reads a skill file and splits it into YAML frontmatter and a Markdown body. Folder-based skills (`.skillr/skills/<slug>/skill.md`) also pull in `gotchas.md` and any supplementary files.

### 2. Composition
`SkillCompositionService.resolve()` walks the `includes:` array and splices in referenced skills' bodies. Cycle detection and a max-depth cap prevent runaway recursion.

### 3. Templates
`TemplateResolver.resolve()` substitutes `{{variable}}` placeholders with values from `template_variables` defaults, overridable per-sync.

### 4. Conditions
`ConditionEvaluator` filters out skills whose `conditions.file_patterns` or `conditions.path_prefixes` don't match the target project. A skill targeting `**/*.tsx` won't be shipped to a project with no TSX files (unless you pass `--force`).

### 5. Providers
Each registered driver implements `generate(skills, projectPath) → FileOutput[]`. The built-in drivers output native formats for Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, Zed, Aider, Continue, and Junie. Custom plugins in `.skillr/plugins/` use the same interface.

### 6. Writer
`sync()` writes the returned files. `preview()` compares against what's on disk and returns an added/modified/unchanged diff — that's what `skillr diff` shows.

Partial failures are contained: one driver throwing won't block the rest, and the overall sync exits non-zero if any provider failed.

## Where to go next

- [CLI Quickstart](./cli-quickstart.md) — install and sync in under two minutes
- [Custom Providers](./custom-providers.md) — write your own provider plugin
- [Reference → Spec v1](../reference/spec-v1.md) — the canonical skill format
