# Skillr — Implementation Plan

> This file tracks implementation progress across sessions.

---

## Current Direction: CLI-First Open Source Tool

Skillr is a **portable AI instruction format with cross-provider sync**. The core value is: define skills once in `.skillr/`, compile to native config files for Claude, Cursor, Copilot, Windsurf, Cline, and OpenAI.

The strategic priority is shipping a standalone CLI (`npx @eooo/skillr`) that works without Docker, databases, or a web browser.

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

## Phase 1: Formalize .skillr/ Spec v1 — COMPLETE

Pinned the canonical format as a stable, versioned specification.

**Deliverables:** Spec v1 defined in types, frontmatter schema, provider output contracts, composition/template resolution specs all implemented and tested.

---

## Phase 2: Standalone CLI Tool — COMPLETE

Shipped `npx @eooo/skillr` — a standalone Node.js CLI (TypeScript + Commander.js).

All core services ported and tested (109 tests passing):
- SkillFileParser, SkillCompositionService, TemplateResolver, PromptLinter
- 6 provider drivers (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI)
- 7 commands: `init`, `add`, `sync`, `diff`, `lint`, `import`, `test`

Published to npm as `@eooo/skillr` (v0.1.8).

---

## Phase 3: CI/CD & Quality — COMPLETE (v0.2.0)

Hardened the CLI for reliable releases. CI now gates every push/PR on CLI tests + build, and releases auto-publish to npm on tag push.

- #92 — CLI tests job added to CI workflow
- #93 — `add`/`import` validate frontmatter before writing
- #94 — Shared `generateOutputs()` extracted from SyncService
- #105 — `npm-publish.yml` workflow publishes on `v*` tag, `.npmignore` added, sourcemaps disabled (tarball 29.4 kB → 17.3 kB)

---

## Phase 4: Feature Completeness — COMPLETE (v0.3.0)

Filled parsed-but-unused features and CLI command gaps.

- #95 — Conditional skill rendering via ConditionEvaluator + `--force` flag
- #96 — Supplementary files flow through to every provider (inline sections or companion files)
- #97 — Per-provider try/catch so partial sync failures don't block others
- #98 — `skillr remove` command
- #99 — `skillr list` command (with `--json`)

---

## Phase 5: New Providers & DX — COMPLETE (v0.4.0)

- #100 — Zed, Aider, Continue, Junie drivers (10 providers total)
- #101 — `skillr sync --watch` with native fs.watch + debounce
- #102 — `detectProvider()` priority chain for `skillr test`

---

## Phase 6: Pluggable Provider Architecture — [Milestone 11](https://github.com/eooo-io/skillr/milestone/11)

**Goal:** Make it trivial for the community to add new AI tool support.

| # | Issue | Status |
|---|---|---|
| [#80](https://github.com/eooo-io/skillr/issues/80) | Define ProviderPlugin interface and discovery mechanism | |
| [#81](https://github.com/eooo-io/skillr/issues/81) | Extract built-in providers as reference implementations | |
| [#82](https://github.com/eooo-io/skillr/issues/82) | `skillr provider:add <name>` command | |
| [#83](https://github.com/eooo-io/skillr/issues/83) | Document "How to write a provider" guide | |

---

## Phase 7: Stable Release — [v1.0.0](https://github.com/eooo-io/skillr/milestone/17)

**Goal:** All core features complete, docs current, ready for broader adoption.

| # | Issue | Status |
|---|---|---|
| [#103](https://github.com/eooo-io/skillr/issues/103) | Clean up stale documentation (STATUS.md, NOTES.md, PLAN.md) | |
| [#104](https://github.com/eooo-io/skillr/issues/104) | Triage FEATURE_IDEAS.md into GitHub issues | |

---

## Open Documentation Issues

| # | Issue | Milestone |
|---|---|---|
| [#84](https://github.com/eooo-io/skillr/issues/84) | Rewrite README for CLI-first positioning | [Milestone 12](https://github.com/eooo-io/skillr/milestone/12) |
| [#85](https://github.com/eooo-io/skillr/issues/85) | Add CLI quickstart guide to docs | [Milestone 12](https://github.com/eooo-io/skillr/milestone/12) |
| [#86](https://github.com/eooo-io/skillr/issues/86) | Update docs homepage and navigation | [Milestone 12](https://github.com/eooo-io/skillr/milestone/12) |
| [#87](https://github.com/eooo-io/skillr/issues/87) | Add "How it works" architecture diagram | [Milestone 12](https://github.com/eooo-io/skillr/milestone/12) |
| [#90](https://github.com/eooo-io/skillr/issues/90) | Update CLAUDE.md with CLI architecture | [Milestone 13](https://github.com/eooo-io/skillr/milestone/13) |

---

## Future (post v1.0.0 adoption)

These are deferred until CLI adoption validates demand:

- Desktop app (Tauri + embedded backend)
- Team collaboration features
- Plugin registry / marketplace
- CI/CD integrations (GitHub Actions, pre-commit hooks)
- Skill versioning and history
