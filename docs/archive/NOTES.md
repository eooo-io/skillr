# Skillr — Architecture Decision Notes

## Background

Skillr's original backend is built on Laravel 12 (PHP 8.4) with MariaDB, Filament admin, and a separate React + Vite + TypeScript SPA in `ui/`. The project also has a Tauri v2 desktop app scaffold wrapping the React SPA.

### Why Change

- **Two language stacks** — PHP backend + TypeScript frontend increases contributor friction and maintenance burden for an open source project.
- **Desktop app limitation** — Laravel requires Docker or a local PHP/MariaDB setup. This makes the Tauri desktop app unable to be self-contained — users still need to run a separate backend.
- **npm ecosystem alignment** — The frontend already uses npm. A Node.js backend lets us share types, validation schemas, and utilities between frontend and API.
- **Strapi was considered** but rejected — it's a headless CMS optimized for content modeling, not the heavy custom logic Skillr needs (file I/O, YAML parsing, provider sync drivers, SSE streaming, recursive includes, Git operations, LLM routing).
- **NestJS was chosen** because it mirrors Laravel's architecture (modules ≈ service providers, guards ≈ middleware, pipes ≈ form requests), has first-class TypeScript support, and can run as a Tauri sidecar with SQLite — no Docker needed for end users.

### Current Stack vs Target Stack

| Layer | Current | Target |
|---|---|---|
| Backend | Laravel 12 / PHP 8.4 | NestJS / TypeScript |
| ORM | Eloquent | Prisma |
| Database | MariaDB 11.x | SQLite (desktop) / PostgreSQL (hosted) |
| Admin UI | Filament 3.x | Absorbed into React SPA |
| Auth | Laravel session (auth:web) | Passport.js + express-session |
| Queues | Laravel Jobs | BullMQ (hosted) / in-process (desktop) |
| Billing | Laravel Cashier | stripe-node SDK |
| YAML | symfony/yaml | js-yaml |
| Git ops | Shell commands | simple-git |
| SSE | Manual response streaming | NestJS @Sse() decorator |
| Desktop | Tauri wrapping SPA + external Docker backend | Tauri + NestJS sidecar (self-contained) |

### What Stays Unchanged

- `ui/` — React SPA (same API contract, no changes needed)
- `ui/src-tauri/` — Tauri desktop wrapper (add sidecar config)
- `docs/` — VitePress documentation site
- `.skillr/` file format — language-agnostic, core to the project
- All provider sync output formats (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI)

### Scope of the Laravel Backend

Inventoried before migration decision:

- 24 Eloquent models
- 28 controllers (~70+ API endpoints)
- 16 services (sync drivers, LLM providers, file parsing, composition, Git, webhooks, bundles)
- 32+ database migrations
- 4 custom middleware (ResolveOrganization, CheckPlanFeature, CheckPlanLimit, CheckUsageBudget)
- 2 queued jobs (ProjectScanJob, DispatchWebhookJob)
- Filament admin panel (project registry, library, settings, tags)

---

## Migration Phase Plan

### Phase 1: Foundation (Week 1-2)

**Goal:** Runnable NestJS app with auth, projects, and skills CRUD. React SPA works against the new backend.

- Scaffold NestJS project in `api/` directory
- Define full Prisma schema (all 24 models, relations, JSON columns)
- Auth module — Passport local strategy, session store, register/login/logout/me
- Organizations module — multi-tenancy, ResolveOrgGuard
- Projects module — CRUD with cross-platform path validation
- Skills module — CRUD with slug generation, tag sync, version snapshots, file I/O
- Tags module — CRUD
- Wire React SPA proxy to NestJS

### Phase 2: Core Services (Week 3-4)

**Goal:** Feature parity for skill composition, sync, and testing.

- Manifest module — SkillFileParser (YAML frontmatter + Markdown), ManifestService (scan/write/scaffold .skillr/), SkillCompositionService (recursive includes, cycle detection), TemplateResolver
- Sync module — ProviderSyncService orchestrator + 7 drivers (Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, OpenClaw) + MCP config generation + sync preview
- LLM module — LLMProviderFactory + Anthropic/OpenAI/Gemini/Ollama providers
- Skill test controller — SSE streaming
- Playground — multi-turn SSE streaming
- Linter module — 8 prompt quality rules
- Git module — log, diff, commit via simple-git
- Versions — list, show, restore

### Phase 3: Ecosystem (Week 5-6)

**Goal:** Library, marketplace, agents, bundles, search, webhooks.

- Agents module — compose, toggle, assign skills
- Library module — browse, import
- Marketplace module — publish, install, vote
- Search module — cross-project full-text search
- Bundles module — ZIP/JSON export and import
- Webhooks module — CRUD, HMAC-SHA256 delivery, event dispatch
- Skills.sh module — GitHub discovery and import
- Import module — reverse-sync from provider config files

### Phase 4: Platform (Week 7-8)

**Goal:** Billing, repositories, advanced features, self-contained desktop app.

- Billing module — Stripe subscriptions, usage tracking, Connect for marketplace payouts
- Repositories module — GitHub/GitLab connect, pull, push
- MCP servers — CRUD
- A2A agents — CRUD
- OpenClaw config — CRUD
- Visualization — dependency graph
- Inbound webhooks — GitHub push handler
- Tauri sidecar integration — NestJS boots as child process, SQLite DB in ~/.skillr/, no external dependencies

### Phase 5: Polish & Cutover (Week 9-10)

**Goal:** Clean transition, remove Laravel entirely.

- Port seed data — AgentSeeder (9 agents) + LibrarySkillSeeder (25 skills)
- Data migration script — MariaDB to SQLite/PostgreSQL for existing users
- E2E tests — Jest + Supertest for all endpoints
- GitHub OAuth + Apple Sign In — Passport strategies
- Remove Laravel — delete app/, routes/, database/, composer.json, Docker PHP container
- Update Docker — Node.js container replaces PHP
- Update CLAUDE.md — reflect new architecture
- CI/CD — GitHub Actions for test, build, and Tauri release (.dmg, .exe, .AppImage)

---

## Desktop App Architecture

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

- Tauri manages the NestJS process lifecycle (start on launch, kill on quit)
- SQLite stored in ~/.skillr/skillr.db — no external database
- No Docker, no Redis, no MariaDB needed for desktop users
- Hosted/team deployment can still use PostgreSQL + Redis + BullMQ
