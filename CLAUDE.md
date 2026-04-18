# CLAUDE.md

This file orients Claude Code (and other agentic tools) when working in this repo.

## Project direction

Skillr is a **portable AI instruction format with cross-provider sync**. You define skills once under `.skillr/` and compile them to 10 native provider configs (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, Zed, Aider, Continue, Junie).

The primary artifact is the CLI, published to npm as `@eooo/skillr`. The Laravel web app under `app/` and React UI under `ui/` are legacy from an earlier phase and are not the current focus.

## Repo layout

```
cli/                      # The published package — TypeScript + Commander
  src/
    cli.ts                # Command entry point
    commands/             # init, add, remove, list, sync, diff, lint, import, test, providerAdd
    services/             # Manifest, SkillFileParser, SkillCompositionService,
                          # TemplateResolver, PromptLinter, SyncService,
                          # ConditionEvaluator
    drivers/              # Built-in provider drivers + registry (getDriver,
                          # registerDriver, loadPlugins)
    types.ts              # Spec v1 types (SkillFrontmatter, ResolvedSkill,
                          # ProviderPlugin, etc.)
  package.json            # Published as @eooo/skillr
docs/                     # VitePress user-facing docs
app/, ui/, database/      # Legacy Laravel/React dashboard (not active)
.github/workflows/        # CI (tests + build) and npm-publish (on v* tag)
PLAN.md                   # SemVer roadmap and milestone status
```

## Tech stack (CLI)

| Layer | Tool |
|---|---|
| Language | TypeScript 5.8, targeting ES2022 |
| CLI framework | Commander 13 |
| Parser | js-yaml (frontmatter), fast-glob (file discovery) |
| Tests | Vitest (145+ tests) |
| Build | tsc → `dist/` |

## Dev workflow

```bash
cd cli
npm install
npm run dev -- <subcommand>   # Runs src/cli.ts via tsx
npm run build                  # Emits dist/
npm test -- --run              # One-shot vitest run (CI mode)
```

The published binary is `dist/cli.js`, exposed as both `skillr` and `skills` via package.json `bin`.

## Releases

- Versions follow SemVer starting 0.1.0
- Bump `cli/package.json` version → commit → `git tag -a vX.Y.Z` → push tag
- Tag push triggers `.github/workflows/npm-publish.yml` which verifies the tag matches `package.json`, runs tests, and publishes with provenance
- `NPM_TOKEN` must be set as a repo secret

## Key contracts

- **Skill spec v1** — canonical format in `cli/src/types.ts` (SkillFrontmatter) and `docs/reference/spec-v1.md`
- **Provider plugin** — `ProviderPlugin` in `cli/src/types.ts`; built-ins under `cli/src/drivers/` are reference implementations; external plugins live in a project's `.skillr/plugins/`
- **Composition** — `SkillCompositionService` resolves `includes:` with cycle detection and a depth cap
- **Templates** — `TemplateResolver` substitutes `{{vars}}` with defaults or overrides
- **Conditions** — `ConditionEvaluator` filters skills by `file_patterns` / `path_prefixes` against the target project
