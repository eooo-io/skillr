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

## Phase 3: CI/CD & Quality — [v0.2.0](https://github.com/eooo-io/skillr/milestone/14)

**Goal:** Harden the CLI for reliable releases. Gate PRs on tests and type-checking.

| # | Issue | Status |
|---|---|---|
| [#92](https://github.com/eooo-io/skillr/issues/92) | Add CLI tests to GitHub Actions CI pipeline | |
| [#93](https://github.com/eooo-io/skillr/issues/93) | Validate required frontmatter fields during `add` and `import` | |
| [#94](https://github.com/eooo-io/skillr/issues/94) | Extract shared resolution logic from SyncService | |

---

## Phase 4: Feature Completeness — [v0.3.0](https://github.com/eooo-io/skillr/milestone/15)

**Goal:** Implement parsed-but-unused features and fill CLI command gaps.

| # | Issue | Status |
|---|---|---|
| [#95](https://github.com/eooo-io/skillr/issues/95) | Implement conditional skill rendering (`conditions` frontmatter) | |
| [#96](https://github.com/eooo-io/skillr/issues/96) | Sync supplementary files to provider outputs | |
| [#97](https://github.com/eooo-io/skillr/issues/97) | Handle partial sync failures gracefully | |
| [#98](https://github.com/eooo-io/skillr/issues/98) | Add `skillr remove <slug>` command | |
| [#99](https://github.com/eooo-io/skillr/issues/99) | Add `skillr list` command | |

---

## Phase 5: New Providers & DX — [v0.4.0](https://github.com/eooo-io/skillr/milestone/16)

**Goal:** Broaden tool coverage and improve the development workflow.

| # | Issue | Status |
|---|---|---|
| [#100](https://github.com/eooo-io/skillr/issues/100) | Add provider drivers for Zed, Aider, Continue, JetBrains AI | |
| [#101](https://github.com/eooo-io/skillr/issues/101) | Add `skillr sync --watch` for auto-sync on file changes | |
| [#102](https://github.com/eooo-io/skillr/issues/102) | Improve model detection in `skillr test` command | |

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
