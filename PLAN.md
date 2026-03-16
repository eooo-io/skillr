# Skillr — Implementation Plan

> This file tracks implementation progress across sessions.
> See `NOTES.md` for the architecture decision rationale.
> See `CLAUDE.md` for current Laravel architecture details.

---

## Current Direction: NestJS Migration

Skillr is migrating from **Laravel/PHP** to **NestJS/TypeScript** to enable:

1. **Self-contained desktop app** — Tauri + NestJS sidecar with SQLite, no Docker/PHP/MariaDB
2. **Single language stack** — TypeScript everywhere reduces contributor friction
3. **Shared types** — Frontend and API share validation schemas and interfaces

The React SPA (`ui/`), `.skillr/` file format, and all provider sync output formats remain unchanged.

```
┌─────────────────────────────────────────────┐
│                 Tauri Shell                  │
│  ┌────────────────┐  ┌───────────────────┐  │
│  │   React SPA    │  │  NestJS Sidecar   │  │
│  │   (WebView)    │──│  (Node.js child)  │  │
│  │                │  │  Port: 8000       │  │
│  └────────────────┘  └───────┬───────────┘  │
│                              │              │
│                     ┌────────┴────────┐     │
│                     │  SQLite DB      │     │
│                     │  ~/.skillr/     │     │
│                     └─────────────────┘     │
└─────────────────────────────────────────────┘
```

### Stack Migration

| Layer | Current (Laravel) | Target (NestJS) |
|---|---|---|
| Backend | PHP 8.4 / Laravel 12 | TypeScript / NestJS |
| ORM | Eloquent | Prisma |
| Database | MariaDB 11 | SQLite (desktop) / PostgreSQL (hosted) |
| Admin UI | Filament 3 | Absorbed into React SPA |
| Auth | Laravel session | Passport.js + express-session |
| Queues | Laravel Jobs | BullMQ (hosted) / in-process (desktop) |
| Billing | Laravel Cashier | stripe-node SDK |
| YAML | symfony/yaml | js-yaml |
| Git ops | Shell commands | simple-git |
| SSE | Manual response streaming | NestJS @Sse() decorator |

---

## Migration Phases

### Phase 1: Foundation — [Milestone](https://github.com/eooo-io/skillr/milestone/1)

**Goal:** Runnable NestJS app with auth, projects, skills CRUD. React SPA works against the new backend.

| # | Issue | Status |
|---|---|---|
| #1 | Scaffold NestJS project in `api/` directory | |
| #2 | Define Prisma schema for all 24 models | |
| #3 | Auth module — Passport local strategy + sessions | |
| #4 | Organizations module — multi-tenancy + ResolveOrgGuard | |
| #5 | Projects module — CRUD with path validation | |
| #6 | Skills module — CRUD, slug generation, versions, file I/O | |
| #7 | Tags module — CRUD | |
| #8 | Wire React SPA proxy to NestJS backend | |

### Phase 2: Core Services — [Milestone](https://github.com/eooo-io/skillr/milestone/2)

**Goal:** Feature parity for skill composition, provider sync, LLM testing, and Git operations.

| # | Issue | Status |
|---|---|---|
| #9 | Manifest module — SkillFileParser, ManifestService, SkillCompositionService | |
| #10 | Sync module — ProviderSyncService + 7 provider drivers | |
| #11 | LLM module — provider factory + 4 providers | |
| #12 | Skill test controller — SSE streaming | |
| #13 | Playground — multi-turn SSE streaming | |
| #14 | Linter module — 8 prompt quality rules | |
| #15 | Git module — log, diff, commit via simple-git | |
| #16 | Versions module — list, show, restore | |

### Phase 3: Ecosystem — [Milestone](https://github.com/eooo-io/skillr/milestone/3)

**Goal:** Library, marketplace, agents, bundles, search, webhooks.

| # | Issue | Status |
|---|---|---|
| #17 | Agents module — compose, toggle, assign skills | |
| #18 | Library module — browse and import | |
| #19 | Marketplace module — publish, install, vote | |
| #20 | Search module — cross-project full-text search | |
| #21 | Bundles module — ZIP/JSON export and import | |
| #22 | Webhooks module — CRUD, HMAC delivery, event dispatch | |
| #23 | Skills.sh module — GitHub discovery and import | |
| #24 | Import module — reverse-sync from provider configs | |
| #25 | Bulk operations — tag, assign, delete, move | |

### Phase 4: Platform — [Milestone](https://github.com/eooo-io/skillr/milestone/4)

**Goal:** Billing, repositories, advanced features, self-contained desktop app.

| # | Issue | Status |
|---|---|---|
| #26 | Billing module — Stripe subscriptions, usage, Connect | |
| #27 | Repositories module — GitHub/GitLab connect, pull, push | |
| #28 | MCP servers — CRUD | |
| #29 | A2A agents — CRUD | |
| #30 | OpenClaw config — CRUD | |
| #31 | Visualization — project dependency graph API | |
| #32 | Inbound webhooks — GitHub push handler | |
| #33 | Tauri sidecar integration — NestJS as child process | |

### Phase 5: Polish & Cutover — [Milestone](https://github.com/eooo-io/skillr/milestone/5)

**Goal:** Clean transition, remove Laravel entirely.

| # | Issue | Status |
|---|---|---|
| #34 | Port seed data — agents and library skills | |
| #35 | Data migration script — MariaDB to SQLite/PostgreSQL | |
| #36 | E2E tests — Jest + Supertest for all endpoints | |
| #37 | GitHub OAuth + Apple Sign In — Passport strategies | |
| #38 | Remove Laravel — delete PHP backend | |
| #39 | Update CLAUDE.md for NestJS architecture | |
| #40 | CI/CD — GitHub Actions for test, build, Tauri releases | |

---

## Laravel Legacy (Phases 1-26) — COMPLETE

The original Laravel implementation built the full Component Layer:

- 24 Eloquent models, 28 controllers, 34 services
- 7 provider sync drivers (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, OpenClaw)
- 4 LLM providers (Anthropic, OpenAI, Gemini, Ollama) with streaming
- Multi-tenant organizations, Stripe billing, marketplace
- React SPA with 14 pages, Monaco editor, D3 visualizations
- Authorization policies, rate limiting, webhook encryption

This code serves as the reference implementation for the NestJS migration. The API contract (routes, request/response shapes) stays identical so the React SPA requires no changes.

---

## Tech Decisions

- NestJS mirrors Laravel architecture: modules = service providers, guards = middleware, pipes = form requests
- Prisma chosen over TypeORM for better type safety and migration ergonomics
- SQLite for desktop (single file, no setup), PostgreSQL for hosted/team deployments
- simple-git replaces shell-based git operations for cross-platform reliability
- BullMQ for hosted queue processing, in-process for desktop (no Redis needed)
- Strapi rejected — too opinionated for Skillr's custom logic (file I/O, YAML parsing, recursive includes, SSE streaming, Git operations)
