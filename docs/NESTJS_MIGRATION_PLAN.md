# NestJS Migration Plan

> Migrate Skillr's backend from Laravel/PHP to NestJS/TypeScript, unifying the stack around Node.js and enabling a self-contained Tauri desktop app.

## Motivation

| Goal | Why NestJS |
|---|---|
| Unified stack | TypeScript end-to-end (React SPA + API + Tauri) |
| Desktop embedding | NestJS can run as a Tauri sidecar — no Docker required for end users |
| npm ecosystem | Share validation schemas, types, and utilities between frontend and backend |
| Developer familiarity | NestJS mirrors Laravel's architecture (modules ≈ service providers, guards ≈ middleware, pipes ≈ form requests) |
| Open source appeal | Lower barrier to contribute — one language, one package manager |

## Tech Stack Mapping

| Laravel | NestJS Equivalent |
|---|---|
| Eloquent ORM | Prisma (schema-first, migrations, type-safe) |
| MariaDB | SQLite (desktop) / PostgreSQL (hosted) |
| Form Requests / Validation | class-validator + class-transformer (via ValidationPipe) |
| Middleware | NestJS Guards, Interceptors, Middleware |
| Jobs / Queues | BullMQ (Redis-backed) or in-process for desktop |
| Events / Listeners | NestJS EventEmitter2 module |
| Session Auth | Passport.js with express-session (or JWT for API-first) |
| Cashier (Stripe) | stripe-node SDK directly |
| SSE Streaming | NestJS `@Sse()` decorator (built-in) |
| File I/O (Storage) | Node fs/promises + path module |
| YAML parsing | js-yaml package |
| HTTP client | axios or undici |
| Encryption | Node crypto module |

## Project Structure

```
api/                              # NestJS backend (replaces Laravel app/)
├── prisma/
│   ├── schema.prisma             # Database schema (replaces migrations/)
│   └── seed.ts                   # Seeder (replaces database/seeders/)
├── src/
│   ├── main.ts                   # Bootstrap
│   ├── app.module.ts             # Root module
│   │
│   ├── auth/                     # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts    # login, register, logout, me, OAuth
│   │   ├── auth.service.ts       # session/JWT logic
│   │   ├── auth.guard.ts         # replaces auth:web middleware
│   │   ├── github.strategy.ts    # GitHub OAuth
│   │   ├── apple.strategy.ts     # Apple Sign In
│   │   └── dto/                  # RegisterDto, LoginDto
│   │
│   ├── organizations/            # Multi-tenancy module
│   │   ├── organizations.module.ts
│   │   ├── organizations.service.ts
│   │   ├── resolve-org.guard.ts  # replaces ResolveOrganization middleware
│   │   ├── plan-feature.guard.ts # replaces CheckPlanFeature
│   │   ├── plan-limit.guard.ts   # replaces CheckPlanLimit
│   │   └── usage-budget.guard.ts # replaces CheckUsageBudget
│   │
│   ├── projects/                 # Projects module
│   │   ├── projects.module.ts
│   │   ├── projects.controller.ts  # CRUD + scan + sync + git-log/diff
│   │   ├── projects.service.ts
│   │   ├── dto/                  # CreateProjectDto, UpdateProjectDto
│   │   └── validators/
│   │       └── safe-path.validator.ts  # replaces SafeProjectPath rule
│   │
│   ├── skills/                   # Skills module
│   │   ├── skills.module.ts
│   │   ├── skills.controller.ts      # CRUD + duplicate + lint
│   │   ├── skills.service.ts
│   │   ├── bulk-skills.controller.ts  # bulk-tag, bulk-assign, bulk-delete, bulk-move
│   │   ├── skill-test.controller.ts   # SSE streaming test runner
│   │   ├── skill-generate.controller.ts
│   │   ├── versions.controller.ts     # version history + restore
│   │   ├── variables.controller.ts    # template variables
│   │   └── dto/
│   │
│   ├── tags/                     # Tags module
│   │   ├── tags.module.ts
│   │   ├── tags.controller.ts
│   │   └── tags.service.ts
│   │
│   ├── agents/                   # Agents module
│   │   ├── agents.module.ts
│   │   ├── agents.controller.ts  # global list + project agents + compose
│   │   ├── agents.service.ts
│   │   └── agent-compose.service.ts  # replaces AgentComposeService
│   │
│   ├── library/                  # Library module
│   │   ├── library.module.ts
│   │   ├── library.controller.ts
│   │   └── library.service.ts
│   │
│   ├── marketplace/              # Marketplace module
│   │   ├── marketplace.module.ts
│   │   ├── marketplace.controller.ts  # list, show, publish, install, vote
│   │   └── marketplace.service.ts
│   │
│   ├── webhooks/                 # Webhooks module
│   │   ├── webhooks.module.ts
│   │   ├── webhooks.controller.ts
│   │   ├── webhook-dispatcher.service.ts
│   │   └── inbound-webhook.controller.ts  # GitHub push events
│   │
│   ├── billing/                  # Billing module
│   │   ├── billing.module.ts
│   │   ├── billing.controller.ts     # subscribe, cancel, resume, usage, invoices
│   │   ├── billing.service.ts
│   │   ├── stripe-webhook.controller.ts
│   │   └── stripe-connect.service.ts  # marketplace payouts
│   │
│   ├── repositories/             # Git repository module
│   │   ├── repositories.module.ts
│   │   ├── repositories.controller.ts  # connect, pull, push, branches
│   │   ├── repository-connection.service.ts
│   │   └── repository-file.service.ts
│   │
│   ├── search/                   # Search module
│   │   ├── search.module.ts
│   │   └── search.controller.ts
│   │
│   ├── import/                   # Import (reverse-sync) module
│   │   ├── import.module.ts
│   │   ├── import.controller.ts
│   │   └── provider-import.service.ts
│   │
│   ├── visualization/            # Graph visualization module
│   │   ├── visualization.module.ts
│   │   └── visualization.controller.ts
│   │
│   ├── settings/                 # App settings module
│   │   ├── settings.module.ts
│   │   ├── settings.controller.ts
│   │   └── settings.service.ts   # replaces AppSetting model helpers
│   │
│   ├── llm/                      # LLM provider module
│   │   ├── llm.module.ts
│   │   ├── llm-provider.factory.ts
│   │   ├── llm-provider.interface.ts
│   │   ├── anthropic.provider.ts
│   │   ├── openai.provider.ts
│   │   ├── gemini.provider.ts
│   │   └── ollama.provider.ts
│   │
│   ├── sync/                     # Provider sync module
│   │   ├── sync.module.ts
│   │   ├── provider-sync.service.ts
│   │   ├── driver.interface.ts
│   │   ├── drivers/
│   │   │   ├── claude.driver.ts
│   │   │   ├── cursor.driver.ts
│   │   │   ├── copilot.driver.ts
│   │   │   ├── windsurf.driver.ts
│   │   │   ├── cline.driver.ts
│   │   │   ├── openai.driver.ts
│   │   │   └── openclaw.driver.ts
│   │   └── mcp-config.generator.ts
│   │
│   ├── manifest/                 # .skillr/ file management
│   │   ├── manifest.module.ts
│   │   ├── manifest.service.ts       # replaces SkillrManifestService
│   │   ├── skill-file-parser.ts      # YAML frontmatter + MD parser
│   │   ├── skill-composition.service.ts  # recursive includes
│   │   └── template-resolver.ts      # {{variable}} substitution
│   │
│   ├── git/                      # Git operations
│   │   ├── git.module.ts
│   │   └── git.service.ts           # log, diff, commit
│   │
│   ├── bundles/                  # Export/import bundles
│   │   ├── bundles.module.ts
│   │   ├── bundles.controller.ts
│   │   ├── bundle-export.service.ts
│   │   └── bundle-import.service.ts
│   │
│   ├── skills-sh/                # GitHub skills.sh integration
│   │   ├── skills-sh.module.ts
│   │   ├── skills-sh.controller.ts
│   │   └── skills-sh.service.ts
│   │
│   ├── mcp/                      # MCP servers config
│   │   ├── mcp.module.ts
│   │   └── mcp.controller.ts
│   │
│   ├── a2a/                      # A2A agents config
│   │   ├── a2a.module.ts
│   │   └── a2a.controller.ts
│   │
│   ├── linter/                   # Prompt quality linter
│   │   ├── linter.module.ts
│   │   └── prompt-linter.service.ts  # 8 rules
│   │
│   └── shared/                   # Shared utilities
│       ├── shared.module.ts
│       ├── types/                # Shared TypeScript types (reuse with ui/)
│       └── utils/
│
├── test/                         # E2E and unit tests (Jest)
├── package.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

## Prisma Schema (replaces 32+ migrations)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  // SQLite for desktop, PostgreSQL for hosted
  provider = env("DATABASE_PROVIDER") // "sqlite" | "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                     Int       @id @default(autoincrement())
  uuid                   String    @unique @default(uuid())
  name                   String
  email                  String    @unique
  password               String?
  avatar                 String?
  githubId               String?   @unique @map("github_id")
  appleId                String?   @unique @map("apple_id")
  authProvider           String    @default("email") @map("auth_provider")
  socialMetadata         Json?     @map("social_metadata")
  currentOrganizationId  Int?      @map("current_organization_id")
  stripeConnectId        String?   @map("stripe_connect_id")
  stripeConnectOnboarded Boolean   @default(false) @map("stripe_connect_onboarded")
  emailVerifiedAt        DateTime? @map("email_verified_at")
  createdAt              DateTime  @default(now()) @map("created_at")
  updatedAt              DateTime  @updatedAt @map("updated_at")

  organizations    OrganizationUser[]
  currentOrg       Organization?      @relation("CurrentOrg", fields: [currentOrganizationId], references: [id])
  usageRecords     UsageRecord[]
  payouts          MarketplacePayout[]

  @@map("users")
}

model Organization {
  id                 Int       @id @default(autoincrement())
  uuid               String    @unique @default(uuid())
  name               String
  slug               String    @unique
  description        String?
  plan               String    @default("free") // free, pro, teams
  trialEndsAt        DateTime? @map("trial_ends_at")
  subscriptionEndsAt DateTime? @map("subscription_ends_at")
  planLimits         Json?     @map("plan_limits")
  stripeId           String?   @map("stripe_id")
  pmType             String?   @map("pm_type")
  pmLastFour         String?   @map("pm_last_four")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  users        OrganizationUser[]
  projects     Project[]
  tags         Tag[]
  usageRecords UsageRecord[]
  currentUsers User[]             @relation("CurrentOrg")

  @@map("organizations")
}

model OrganizationUser {
  id             Int       @id @default(autoincrement())
  organizationId Int       @map("organization_id")
  userId         Int       @map("user_id")
  role           String    @default("member") // owner, admin, editor, viewer, member
  acceptedAt     DateTime? @map("accepted_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([organizationId, userId])
  @@map("organization_user")
}

model Project {
  id              Int       @id @default(autoincrement())
  uuid            String    @unique @default(uuid())
  organizationId  Int       @map("organization_id")
  name            String
  description     String?
  path            String
  syncedAt        DateTime? @map("synced_at")
  gitAutoCommit   Boolean   @default(false) @map("git_auto_commit")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  organization   Organization       @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  providers      ProjectProvider[]
  skills         Skill[]
  projectAgents  ProjectAgent[]
  variables      SkillVariable[]
  webhooks       Webhook[]
  repositories   ProjectRepository[]
  openclawConfig OpenClawConfig?
  mcpServers     ProjectMcpServer[]
  a2aAgents      ProjectA2aAgent[]

  @@map("projects")
}

model ProjectProvider {
  id           Int    @id @default(autoincrement())
  projectId    Int    @map("project_id")
  providerSlug String @map("provider_slug")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, providerSlug])
  @@map("project_providers")
}

model Skill {
  id                Int      @id @default(autoincrement())
  uuid              String   @unique @default(uuid())
  projectId         Int      @map("project_id")
  slug              String
  name              String
  description       String?
  model             String?
  maxTokens         Int?     @map("max_tokens")
  tools             Json     @default("[]")
  includes          Json     @default("[]")
  body              String   @default("")
  conditions        Json     @default("[]")
  templateVariables Json     @default("[]") @map("template_variables")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  project   Project        @relation(fields: [projectId], references: [id], onDelete: Cascade)
  versions  SkillVersion[]
  tags      SkillTag[]
  agentSkills AgentSkill[]
  variables SkillVariable[]

  @@unique([projectId, slug])
  @@map("skills")
}

model SkillVersion {
  id            Int      @id @default(autoincrement())
  skillId       Int      @map("skill_id")
  versionNumber Int      @map("version_number")
  frontmatter   Json
  body          String   @default("")
  note          String?
  savedAt       DateTime @default(now()) @map("saved_at")

  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@map("skill_versions")
}

model Tag {
  id             Int    @id @default(autoincrement())
  organizationId Int    @map("organization_id")
  name           String
  color          String @default("#6B7280")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  skills       SkillTag[]

  @@map("tags")
}

model SkillTag {
  skillId Int @map("skill_id")
  tagId   Int @map("tag_id")

  skill Skill @relation(fields: [skillId], references: [id], onDelete: Cascade)
  tag   Tag   @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([skillId, tagId])
  @@map("skill_tag")
}

model Agent {
  id               Int     @id @default(autoincrement())
  uuid             String  @unique @default(uuid())
  name             String
  slug             String  @unique
  role             String?
  description      String?
  baseInstructions String? @map("base_instructions")
  model            String?
  icon             String?
  sortOrder        Int     @default(0) @map("sort_order")
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  projectAgents ProjectAgent[]

  @@map("agents")
}

model ProjectAgent {
  id                 Int     @id @default(autoincrement())
  projectId          Int     @map("project_id")
  agentId            Int     @map("agent_id")
  customInstructions String? @map("custom_instructions")
  isEnabled          Boolean @default(true) @map("is_enabled")
  createdAt          DateTime @default(now()) @map("created_at")
  updatedAt          DateTime @updatedAt @map("updated_at")

  project     Project      @relation(fields: [projectId], references: [id], onDelete: Cascade)
  agent       Agent        @relation(fields: [agentId], references: [id], onDelete: Cascade)
  agentSkills AgentSkill[]

  @@unique([projectId, agentId])
  @@map("project_agent")
}

model AgentSkill {
  id             Int @id @default(autoincrement())
  projectAgentId Int @map("project_agent_id")
  skillId        Int @map("skill_id")

  projectAgent ProjectAgent @relation(fields: [projectAgentId], references: [id], onDelete: Cascade)
  skill        Skill        @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([projectAgentId, skillId])
  @@map("agent_skill")
}

model SkillVariable {
  id        Int    @id @default(autoincrement())
  projectId Int    @map("project_id")
  skillId   Int    @map("skill_id")
  key       String
  value     String @default("")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  skill   Skill   @relation(fields: [skillId], references: [id], onDelete: Cascade)

  @@unique([projectId, skillId, key])
  @@map("skill_variables")
}

model LibrarySkill {
  id          Int      @id @default(autoincrement())
  uuid        String   @unique @default(uuid())
  name        String
  slug        String   @unique
  description String?
  category    String?
  tags        Json     @default("[]")
  frontmatter Json     @default("{}")
  body        String   @default("")
  source      String?
  createdAt   DateTime @default(now()) @map("created_at")

  @@map("library_skills")
}

model MarketplaceSkill {
  id          Int      @id @default(autoincrement())
  uuid        String   @unique @default(uuid())
  name        String
  slug        String   @unique
  description String?
  category    String?
  tags        Json     @default("[]")
  frontmatter Json     @default("{}")
  body        String   @default("")
  author      String?
  source      String?
  downloads   Int      @default(0)
  upvotes     Int      @default(0)
  downvotes   Int      @default(0)
  version     String   @default("1.0.0")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  payouts MarketplacePayout[]

  @@map("marketplace_skills")
}

model AppSetting {
  id    Int    @id @default(autoincrement())
  key   String @unique
  value String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("app_settings")
}

model Webhook {
  id              Int       @id @default(autoincrement())
  projectId       Int       @map("project_id")
  event           String
  url             String
  secret          String?
  isActive        Boolean   @default(true) @map("is_active")
  lastTriggeredAt DateTime? @map("last_triggered_at")
  lastStatus      Int?      @map("last_status")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  project    Project           @relation(fields: [projectId], references: [id], onDelete: Cascade)
  deliveries WebhookDelivery[]

  @@map("webhooks")
}

model WebhookDelivery {
  id             Int      @id @default(autoincrement())
  webhookId      Int      @map("webhook_id")
  event          String
  payload        Json
  responseStatus Int?     @map("response_status")
  responseBody   String?  @map("response_body")
  durationMs     Int?     @map("duration_ms")
  createdAt      DateTime @default(now()) @map("created_at")

  webhook Webhook @relation(fields: [webhookId], references: [id], onDelete: Cascade)

  @@map("webhook_deliveries")
}

model ProjectRepository {
  id               Int       @id @default(autoincrement())
  projectId        Int       @map("project_id")
  provider         String    // github, gitlab
  owner            String
  name             String
  fullName         String    @map("full_name")
  defaultBranch    String    @default("main") @map("default_branch")
  url              String
  cloneUrl         String    @map("clone_url")
  accessToken      String?   @map("access_token") // encrypt at app level
  webhookSecret    String?   @map("webhook_secret")
  autoScanOnPush   Boolean   @default(false) @map("auto_scan_on_push")
  autoSyncOnPush   Boolean   @default(false) @map("auto_sync_on_push")
  lastSyncedAt     DateTime? @map("last_synced_at")
  lastCommitSha    String?   @map("last_commit_sha")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@unique([projectId, provider])
  @@map("project_repositories")
}

model Plan {
  id                      Int     @id @default(autoincrement())
  slug                    String  @unique
  name                    String
  description             String?
  priceMonthly            Int     @default(0) @map("price_monthly")
  priceYearly             Int     @default(0) @map("price_yearly")
  stripeMonthlyPriceId    String? @map("stripe_monthly_price_id")
  stripeYearlyPriceId     String? @map("stripe_yearly_price_id")
  includedTokensMonthly   Int     @default(0) @map("included_tokens_monthly")
  overagePricePer1kTokens Int     @default(0) @map("overage_price_per_1k_tokens")
  maxProjects             Int     @default(3) @map("max_projects")
  maxSkillsPerProject     Int     @default(25) @map("max_skills_per_project")
  maxProviders            Int     @default(2) @map("max_providers")
  maxMembers              Int     @default(1) @map("max_members")
  marketplacePublish      Boolean @default(false) @map("marketplace_publish")
  aiGeneration            Boolean @default(false) @map("ai_generation")
  webhookAccess           Boolean @default(false) @map("webhook_access")
  bundleExport            Boolean @default(false) @map("bundle_export")
  repositoryAccess        Boolean @default(false) @map("repository_access")
  prioritySupport         Boolean @default(false) @map("priority_support")
  isActive                Boolean @default(true) @map("is_active")
  sortOrder               Int     @default(0) @map("sort_order")

  @@map("plans")
}

model OpenClawConfig {
  id          Int    @id @default(autoincrement())
  projectId   Int    @unique @map("project_id")
  soulContent String @default("") @map("soul_content")
  tools       Json   @default("[]")
  a2aAgents   Json   @default("[]") @map("a2a_agents")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("openclaw_configs")
}

model ProjectMcpServer {
  id        Int     @id @default(autoincrement())
  projectId Int     @map("project_id")
  name      String
  transport String  @default("stdio")
  command   String?
  args      Json    @default("[]")
  url       String?
  env       Json    @default("{}")
  headers   Json    @default("{}")
  enabled   Boolean @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_mcp_servers")
}

model ProjectA2aAgent {
  id          Int     @id @default(autoincrement())
  projectId   Int     @map("project_id")
  name        String
  url         String
  description String?
  skills      Json    @default("[]")
  enabled     Boolean @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  project Project @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("project_a2a_agents")
}

model UsageRecord {
  id             Int      @id @default(autoincrement())
  organizationId Int      @map("organization_id")
  userId         Int      @map("user_id")
  type           String
  quantity       Int
  model          String?
  metadata       Json     @default("{}")
  recordedAt     DateTime @default(now()) @map("recorded_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("usage_records")
}

model MarketplacePayout {
  id                 Int       @id @default(autoincrement())
  userId             Int       @map("user_id")
  marketplaceSkillId Int       @map("marketplace_skill_id")
  stripeTransferId   String?   @map("stripe_transfer_id")
  amount             Int
  currency           String    @default("usd")
  status             String    @default("pending")
  paidAt             DateTime? @map("paid_at")
  createdAt          DateTime  @default(now()) @map("created_at")
  updatedAt          DateTime  @updatedAt @map("updated_at")

  user  User             @relation(fields: [userId], references: [id])
  skill MarketplaceSkill @relation(fields: [marketplaceSkillId], references: [id])

  @@map("marketplace_payouts")
}
```

## Migration Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Runnable NestJS app with auth, projects, and skills CRUD.

1. **Scaffold NestJS project** in `api/` directory
   ```bash
   npx @nestjs/cli new api --package-manager npm --strict
   cd api && npm install prisma @prisma/client
   npx prisma init
   ```

2. **Prisma schema** — copy schema above, run `npx prisma migrate dev`

3. **Shared module** — config service, types shared with `ui/`

4. **Auth module**
   - Passport local strategy (email/password)
   - Session store (express-session + connect-sqlite3 for desktop, Redis for hosted)
   - `AuthGuard` replacing `auth:web`
   - Register, login, logout, me endpoints

5. **Organizations module**
   - `ResolveOrgGuard` — reads `X-Organization-Id` header or user's default
   - Basic CRUD

6. **Projects module**
   - CRUD with `SafePathValidator` (cross-platform, from our earlier fix)
   - Provider association

7. **Skills module**
   - Full CRUD with slug generation, tag sync, version snapshots
   - File I/O (write to `.skillr/skills/`)

8. **Tags module** — CRUD

9. **Wire up React SPA** — update `ui/vite.config.ts` proxy to point at NestJS (same port 8000 or configurable)

**Milestone:** React SPA works against NestJS backend for project/skill management.

### Phase 2: Core Services (Week 3-4)

**Goal:** Feature parity for skill composition, sync, and testing.

10. **Manifest module**
    - `SkillFileParser` — YAML frontmatter + Markdown (using `js-yaml`)
    - `ManifestService` — scan, write, scaffold `.skillr/`
    - `SkillCompositionService` — recursive includes, max depth 5, cycle detection
    - `TemplateResolver` — `{{variable}}` substitution

11. **Sync module**
    - `ProviderSyncService` orchestrator
    - 7 drivers: Claude, Cursor, Copilot, Windsurf, Cline, OpenAI, OpenClaw
    - MCP config generation
    - Sync preview endpoint

12. **LLM module**
    - `LLMProviderFactory` routing by model prefix
    - Anthropic provider (`@anthropic-ai/sdk`)
    - OpenAI provider (`openai`)
    - Gemini provider (`@google/generative-ai`)
    - Ollama provider (HTTP)

13. **Skill test controller** — SSE streaming via `@Sse()` decorator

14. **Playground** — multi-turn SSE streaming

15. **Linter module** — 8 prompt quality rules

16. **Git module** — log, diff, commit via `simple-git`

17. **Versions** — list, show, restore

**Milestone:** Full skill editing, testing, sync, and playground work.

### Phase 3: Ecosystem (Week 5-6)

**Goal:** Library, marketplace, agents, bundles, search, webhooks.

18. **Agents module** — compose, toggle, assign skills
19. **Library module** — browse, import
20. **Marketplace module** — publish, install, vote
21. **Search module** — cross-project full-text search
22. **Bundles module** — ZIP/JSON export and import
23. **Webhooks module** — CRUD, delivery, HMAC signing, event dispatch
24. **Skills.sh module** — GitHub discovery and import
25. **Import module** — reverse-sync from provider config files

**Milestone:** All React SPA features work against NestJS backend.

### Phase 4: Platform (Week 7-8)

**Goal:** Billing, repositories, advanced features, desktop app.

26. **Billing module** — Stripe subscriptions, usage tracking, Connect
27. **Repositories module** — GitHub/GitLab connect, pull, push
28. **MCP servers** — CRUD
29. **A2A agents** — CRUD
30. **OpenClaw config** — CRUD
31. **Visualization** — dependency graph
32. **Inbound webhooks** — GitHub push handler

33. **Tauri sidecar integration**
    - NestJS boots as a sidecar process managed by Tauri
    - SQLite database (no external DB needed)
    - In-process job queue (no Redis needed)
    - Single `.dmg` / `.exe` / `.AppImage` ships everything

**Milestone:** Self-contained desktop app with no external dependencies.

### Phase 5: Polish & Cutover (Week 9-10)

34. **Seed data** — port AgentSeeder (9 agents) + LibrarySkillSeeder (25 skills)
35. **Data migration script** — MariaDB → SQLite/PostgreSQL for existing users
36. **E2E tests** — Jest + Supertest for all endpoints
37. **GitHub OAuth + Apple Sign In** — Passport strategies
38. **Remove Laravel** — delete `app/`, `routes/`, `database/`, `composer.json`, Docker PHP container
39. **Update Docker** — Node.js container replaces PHP container
40. **Update CLAUDE.md** — reflect new architecture
41. **CI/CD** — GitHub Actions for test, build, and Tauri release

## Key Dependency Mapping

```
# Core
@nestjs/core @nestjs/common @nestjs/platform-express
@nestjs/config                    # replaces .env / config/*.php
prisma @prisma/client             # replaces Eloquent

# Auth
@nestjs/passport passport passport-local
express-session connect-sqlite3   # session store (desktop)

# Validation
class-validator class-transformer # replaces Form Requests

# File & YAML
js-yaml                          # replaces symfony/yaml
archiver adm-zip                 # bundle export/import

# Git
simple-git                       # replaces shell git calls

# LLM SDKs
@anthropic-ai/sdk                # replaces mozex/anthropic-laravel
openai                           # OpenAI SDK
@google/generative-ai            # Gemini SDK

# Billing
stripe                           # replaces Laravel Cashier

# Queue (hosted mode)
@nestjs/bull bullmq              # replaces Laravel queues

# Events
@nestjs/event-emitter eventemitter2

# SSE
Built-in @Sse() decorator        # replaces manual SSE response

# HTTP
axios                            # already used by frontend
```

## Desktop App Architecture (Tauri + NestJS Sidecar)

```
┌─────────────────────────────────────────────┐
│                 Tauri Shell                  │
│  ┌────────────────┐  ┌───────────────────┐  │
│  │   React SPA    │  │  NestJS Sidecar   │  │
│  │   (WebView)    │──│  (Node.js child)  │  │
│  │   Port: —      │  │  Port: 8000       │  │
│  └────────────────┘  └───────┬───────────┘  │
│                              │              │
│                     ┌────────┴────────┐     │
│                     │  SQLite DB      │     │
│                     │  ~/.skillr/     │     │
│                     └─────────────────┘     │
└─────────────────────────────────────────────┘
```

- Tauri manages the NestJS process lifecycle (start on app launch, kill on quit)
- SQLite file stored in `~/.skillr/skillr.db`
- No Docker, no Redis, no MariaDB needed for desktop users
- Hosted/team version can still use PostgreSQL + Redis + BullMQ

## What Gets Removed

| Removed | Replacement |
|---|---|
| `app/` (Laravel PHP) | `api/src/` (NestJS TypeScript) |
| `database/migrations/` | `api/prisma/schema.prisma` |
| `database/seeders/` | `api/prisma/seed.ts` |
| `routes/api.php` | NestJS controller decorators |
| `composer.json` / `vendor/` | `api/package.json` / `node_modules/` |
| `docker/Dockerfile` (PHP) | `docker/Dockerfile` (Node) |
| Filament admin panel | Keep as separate concern or rebuild in React |
| MariaDB container | SQLite (desktop) / PostgreSQL (hosted) |

## What Stays

| Kept | Why |
|---|---|
| `ui/` React SPA | No changes needed — same API contract |
| `ui/src-tauri/` | Tauri desktop wrapper — add sidecar config |
| `docs/` VitePress | Documentation site unchanged |
| `docker-compose.yml` | Updated for Node container |
| `.skillr/` file format | Core format is language-agnostic |

## Filament Admin Replacement

Filament is PHP-only and cannot migrate. Options:

1. **Expand the React SPA** (recommended) — move project registry, library management, settings, and tag management into the existing React SPA. Most of this UI already exists.
2. **AdminJS** — Node.js admin panel generator (auto-generates CRUD from Prisma models). Good for internal use.
3. **Skip it** — the React SPA already handles most workflows. Admin-specific features (global library, app settings) can become pages in the SPA.

## Risk Mitigation

| Risk | Mitigation |
|---|---|
| API contract breaks | Write OpenAPI spec from current Laravel routes; validate NestJS output matches |
| Data migration | Build a one-time migration script (MariaDB → SQLite/PostgreSQL via Prisma) |
| SSE streaming differences | NestJS has first-class `@Sse()` support — test with existing React SSE consumers |
| OAuth complexity | Use well-tested Passport strategies; test in parallel before cutover |
| Stripe integration | stripe-node is the official SDK — actually simpler than Cashier |
| Scope creep | Phase-based approach; each phase produces a working system |
