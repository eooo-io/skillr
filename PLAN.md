# Skillr — Implementation Plan

> This file tracks implementation progress across sessions.

---

## Current Direction: CLI-First Open Source Tool

Skillr is a **portable AI instruction format with cross-provider sync**. Define skills once in `.skillr/`, compile to native config files for 11 providers: Claude, Cursor, Copilot, Windsurf, Cline, OpenAI Codex (CLI / macOS / IDE), Zed, Aider, Continue, JetBrains AI (Junie), plus the deprecated `openai` driver retained for backward compatibility until v1.2.0.

The CLI is the primary artifact, published as `@eooo/skillr`. No Docker, no database, no web browser required. Install with `npx @eooo/skillr` and go.

```
.skillr/skills/*.md
      │
      ▼  parse → compose → templates → conditions
      │
      ▼
  Provider drivers (built-in or plugin)
      │
      ▼
  CLAUDE.md · .cursor/rules/ · .github/copilot-instructions.md
  · .windsurf/rules/ · .clinerules · .openai/ · .rules · CONVENTIONS.md
  · .continue/rules/ · .junie/guidelines.md · (+ custom plugins)
```

---

## Phase 1: Formalize .skillr/ Spec v1 — COMPLETE

Pinned the canonical format as a stable, versioned specification.

---

## Phase 2: Standalone CLI Tool — COMPLETE

Shipped `npx @eooo/skillr` — a standalone Node.js CLI (TypeScript + Commander).

---

## Phase 3: CI/CD & Quality — COMPLETE (v0.2.0)

CI gates every push/PR on CLI tests + build. Releases auto-publish to npm on tag push.

- #92 — CLI tests job in CI
- #93 — Frontmatter validation in `add`/`import`
- #94 — `generateOutputs()` extracted from SyncService
- #105 — `npm-publish.yml` workflow + `.npmignore` (tarball 29.4 → 17.3 kB)

---

## Phase 4: Feature Completeness — COMPLETE (v0.3.0)

- #95 — Conditional skill rendering (ConditionEvaluator + `--force`)
- #96 — Supplementary files flow through every provider
- #97 — Partial sync failures tolerated (per-provider try/catch)
- #98 — `skillr remove`
- #99 — `skillr list`

---

## Phase 5: New Providers & DX — COMPLETE (v0.4.0)

- #100 — Zed, Aider, Continue, Junie drivers (10 providers total)
- #101 — `skillr sync --watch` (native fs.watch + debounce)
- #102 — `detectProvider()` priority chain for `skillr test`

---

## Phase 6: Pluggable Provider Architecture — COMPLETE

- #80 — `ProviderPlugin` interface + `registerDriver()` + `.skillr/plugins/*.js` discovery
- #81 — Built-in drivers now use the same registration path
- #82 — `skillr provider:add <name>` scaffolds a plugin template
- #83 — `docs/guide/custom-providers.md` walks the full plugin authoring flow

---

## Phase 7: Stable Release — COMPLETE (v1.0.0)

- #84 — README rewritten CLI-first (shipped earlier in v0.1.x)
- #85 — `docs/guide/cli-quickstart.md`
- #86 — VitePress homepage and sidebar restructured for CLI-first navigation
- #87 — `docs/guide/how-it-works.md` with Mermaid pipeline diagram
- #90 — Repo-root `CLAUDE.md` orients agent tools on the CLI architecture
- #103 — Stale docs (STATUS.md, NOTES.md, NESTJS_MIGRATION_PLAN.md) archived under `docs/archive/`
- #104 — FEATURE_IDEAS.md triaged; relevant ideas filed as #106–#110, rest dropped

---

## Future (post v1.1.0)

Tracked in GitHub Issues:

- [#106](https://github.com/eooo-io/skillr/issues/106) `skillr graph` — dependency tree
- [#107](https://github.com/eooo-io/skillr/issues/107) `skillr cost` — prompt cost estimator
- [#108](https://github.com/eooo-io/skillr/issues/108) Secret-scanning lint rule
- [#109](https://github.com/eooo-io/skillr/issues/109) VS Code extension
- [#110](https://github.com/eooo-io/skillr/issues/110) GitHub Action for CI sync
