# API Endpoints

All endpoints are served at `http://localhost:8000/api`. API routes are protected by session-based authentication (`auth:web` middleware). See [Authentication](../guide/authentication) for details.

## Health

```
GET /api/health
```

Returns `{ "status": "ok" }`.

---

## Projects

### List Projects

```
GET /api/projects
```

Returns an array of all projects with their provider configuration.

### Create Project

```
POST /api/projects
```

```json
{
  "name": "my-project",
  "path": "/path/to/project",
  "git_auto_commit": false
}
```

### Get Project

```
GET /api/projects/{id}
```

### Update Project

```
PUT /api/projects/{id}
```

```json
{
  "name": "new-name",
  "git_auto_commit": true
}
```

### Delete Project

```
DELETE /api/projects/{id}
```

### Scan Project

Reads `.skillr/skills/*.md` files from disk and upserts them into the database.

```
POST /api/projects/{id}/scan
```

### Sync Project

Writes skills and composed agents to all enabled provider config files.

```
POST /api/projects/{id}/sync
```

### Preview Sync

Performs a dry-run sync and returns per-provider diffs.

```
POST /api/projects/{id}/sync/preview
```

Returns diff data with `status` (added/modified/deleted/unchanged), `current_content`, and `generated_content` for each file.

### Git Log

```
GET /api/projects/{id}/git-log?file=.skillr/skills/my-skill.md
```

Returns commit history. The `file` parameter is optional -- omit it for full `.skillr/` history.

### Git Diff

```
GET /api/projects/{id}/git-diff?file=.skillr/skills/my-skill.md&ref=abc1234
```

Returns the diff of a file against a specific commit ref.

---

## Skills

### List Skills for Project

```
GET /api/projects/{id}/skills
```

### Create Skill

```
POST /api/projects/{id}/skills
```

```json
{
  "name": "Code Review",
  "description": "Reviews code for quality",
  "body": "You are a code reviewer...",
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096,
  "tags": ["review", "quality"],
  "tools": [],
  "includes": ["coding-standards"],
  "template_variables": []
}
```

### Get Skill

```
GET /api/skills/{id}
```

Returns the skill with `resolved_body` (includes expanded) and `token_estimate`.

### Update Skill

```
PUT /api/skills/{id}
```

Same body as create. Creates a new version snapshot.

### Delete Skill

```
DELETE /api/skills/{id}
```

Removes from database and deletes the `.skillr/skills/{slug}.md` file.

### Duplicate Skill

```
POST /api/skills/{id}/duplicate
```

Creates a copy with a `-copy` slug suffix.

### Lint Skill

```
GET /api/skills/{id}/lint
```

Returns an array of lint issues. See [Prompt Linting](../guide/linting).

### Generate Skill (AI)

```
POST /api/skills/generate
```

```json
{
  "description": "A skill that reviews database migrations for best practices",
  "constraints": "Focus on Laravel migrations"
}
```

Returns generated frontmatter fields and body for review before saving.

---

## Bulk Operations

### Bulk Tag

```
POST /api/skills/bulk-tag
```

```json
{
  "skill_ids": ["uuid1", "uuid2"],
  "tag_ids": ["tag-uuid"],
  "action": "add"
}
```

`action` is `"add"` or `"remove"`.

### Bulk Assign to Agent

```
POST /api/skills/bulk-assign
```

```json
{
  "skill_ids": ["uuid1", "uuid2"],
  "agent_id": "agent-uuid"
}
```

### Bulk Delete

```
POST /api/skills/bulk-delete
```

```json
{
  "skill_ids": ["uuid1", "uuid2"]
}
```

### Bulk Move

```
POST /api/skills/bulk-move
```

```json
{
  "skill_ids": ["uuid1", "uuid2"],
  "project_id": "target-project-uuid"
}
```

---

## Skill Template Variables

### Get Variable Values

```
GET /api/projects/{projectId}/skills/{skillId}/variables
```

### Set Variable Values

```
PUT /api/projects/{projectId}/skills/{skillId}/variables
```

```json
{
  "variables": {
    "language": "Python",
    "framework": "Django"
  }
}
```

---

## Versions

### List Versions

```
GET /api/skills/{id}/versions
```

### Get Version

```
GET /api/skills/{id}/versions/{versionNumber}
```

### Restore Version

```
POST /api/skills/{id}/versions/{versionNumber}/restore
```

---

## Tags

### List Tags

```
GET /api/tags
```

### Create Tag

```
POST /api/tags
```

```json
{
  "name": "security",
  "color": "#ef4444"
}
```

### Delete Tag

```
DELETE /api/tags/{id}
```

---

## Search

### Full-Text Search

```
GET /api/search?q=review&tags=security&project_id=uuid&model=claude-sonnet-4-6
```

All parameters are optional. Returns skills matching the query, grouped by project.

---

## Library

### Browse Library

```
GET /api/library?category=Laravel&tags=testing&q=pest
```

All parameters are optional.

### Import Library Skill

```
POST /api/library/{librarySkillId}/import
```

```json
{
  "project_id": "target-project-uuid"
}
```

---

## Skills.sh (GitHub Import)

### Discover Skills in a Repository

```
POST /api/skills-sh/discover
```

```json
{
  "repo": "owner/repo-name"
}
```

Returns a list of skill file paths found in the repository.

### Preview Skills

Fetch content for a batch of discovered skill files (up to 30).

```
POST /api/skills-sh/preview
```

```json
{
  "repo": "owner/repo-name",
  "paths": [".curated/code-review.md", ".curated/testing.md"]
}
```

### Import a Skill

```
POST /api/skills-sh/import
```

```json
{
  "repo": "owner/repo-name",
  "path": ".curated/code-review.md",
  "target": "project",
  "project_id": "target-project-uuid"
}
```

`target` is `"library"` or `"project"`. When targeting a project, `project_id` is required.

---

## Marketplace

### Browse Marketplace

```
GET /api/marketplace?category=Laravel&q=testing&sort=popular&page=1
```

### Get Marketplace Skill

```
GET /api/marketplace/{id}
```

### Publish to Marketplace

```
POST /api/marketplace/publish
```

```json
{
  "skill_id": "uuid",
  "category": "Laravel",
  "description": "Optional override"
}
```

### Install from Marketplace

```
POST /api/marketplace/{id}/install
```

```json
{
  "project_id": "target-project-uuid"
}
```

### Vote

```
POST /api/marketplace/{id}/vote
```

```json
{
  "vote": 1
}
```

`1` for upvote, `-1` for downvote.

---

## Agents

### List All Agents

```
GET /api/agents
```

### List Project Agents

```
GET /api/projects/{id}/agents
```

Returns all 9 agents with their per-project state (enabled, custom instructions, assigned skills).

### Toggle Agent

```
PUT /api/projects/{id}/agents/{agentId}/toggle
```

Toggles the agent's enabled state for the project.

### Update Custom Instructions

```
PUT /api/projects/{id}/agents/{agentId}/instructions
```

```json
{
  "custom_instructions": "## Project Rules\n\n- Use Pest PHP for all tests..."
}
```

### Assign Skills to Agent

```
PUT /api/projects/{id}/agents/{agentId}/skills
```

```json
{
  "skill_ids": ["uuid1", "uuid2"]
}
```

### Compose Single Agent

```
GET /api/projects/{id}/agents/{agentId}/compose
```

Returns the composed Markdown output and token estimate.

### Compose All Agents

```
GET /api/projects/{id}/agents/compose
```

Returns composed output for all enabled agents.

---

## Bundles

### Export Bundle

```
POST /api/projects/{id}/export
```

```json
{
  "skill_ids": ["uuid1", "uuid2"],
  "agent_ids": ["agent-uuid"],
  "format": "zip"
}
```

`format` is `"zip"` or `"json"`. Returns the file as a download.

### Import Bundle

```
POST /api/projects/{id}/import-bundle
```

Multipart form upload with:
- `file` -- The bundle file (ZIP or JSON)
- `conflict_mode` -- `"skip"`, `"overwrite"`, or `"rename"`

---

## Webhooks

### List Webhooks

```
GET /api/projects/{id}/webhooks
```

### Create Webhook

```
POST /api/projects/{id}/webhooks
```

```json
{
  "url": "https://example.com/webhook",
  "events": ["skill.created", "skill.updated"],
  "secret": "your-shared-secret"
}
```

### Update Webhook

```
PUT /api/webhooks/{id}
```

### Delete Webhook

```
DELETE /api/webhooks/{id}
```

### View Delivery Log

```
GET /api/webhooks/{id}/deliveries
```

### Test Webhook

```
POST /api/webhooks/{id}/test
```

### GitHub Inbound Webhook

```
POST /api/webhooks/github/{projectId}
```

Receives GitHub push events and triggers a project scan.

---

## Models

### List Available Models

```
GET /api/models
```

Returns models grouped by provider with configuration status.

---

## Test Runner

### Test a Skill (SSE)

```
POST /api/skills/{id}/test
```

```json
{
  "message": "Review this code for bugs..."
}
```

Returns an SSE stream. Events contain token chunks, and a final event with usage stats.

### Playground (SSE)

```
POST /api/playground
```

```json
{
  "system_prompt": "You are a helpful assistant...",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi there!" },
    { "role": "user", "content": "What can you do?" }
  ],
  "model": "claude-sonnet-4-6",
  "max_tokens": 4096
}
```

Returns an SSE stream.

---

## Settings

### Get Settings

```
GET /api/settings
```

### Update Settings

```
PUT /api/settings
```

```json
{
  "anthropic_api_key": "sk-ant-...",
  "openai_api_key": "sk-...",
  "gemini_api_key": "AIza...",
  "ollama_url": "http://localhost:11434",
  "default_model": "claude-sonnet-4-6"
}
```

---

## Repositories

### List Repository Connections

```
GET /api/projects/{id}/repositories
```

### Connect Repository

```
POST /api/projects/{id}/repositories
```

```json
{
  "provider": "github",
  "owner": "your-org",
  "name": "your-repo",
  "default_branch": "main",
  "access_token": "ghp_...",
  "auto_scan_on_push": true,
  "auto_sync_on_push": false
}
```

### Update Repository Config

```
PUT /api/projects/{id}/repositories/{provider}
```

### Disconnect Repository

```
DELETE /api/projects/{id}/repositories/{provider}
```

### Repository Status

```
GET /api/projects/{id}/repositories/{provider}/status
```

### List Branches

```
GET /api/projects/{id}/repositories/{provider}/branches
```

### Latest Commit

```
GET /api/projects/{id}/repositories/{provider}/latest-commit
```

### Browse Files

```
GET /api/projects/{id}/repositories/{provider}/files
```

### Pull from Remote

```
POST /api/projects/{id}/repositories/{provider}/pull
```

### Push to Remote

```
POST /api/projects/{id}/repositories/{provider}/push
```

### Allowed Paths

```
GET /api/repositories/allowed-paths
```

---

## MCP Servers

### List MCP Servers

```
GET /api/projects/{id}/mcp-servers
```

### Add MCP Server

```
POST /api/projects/{id}/mcp-servers
```

```json
{
  "name": "PostgreSQL",
  "transport": "stdio",
  "config": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-postgres"],
    "env": { "DATABASE_URL": "postgresql://localhost:5432/mydb" }
  }
}
```

### Update MCP Server

```
PUT /api/mcp-servers/{id}
```

### Delete MCP Server

```
DELETE /api/mcp-servers/{id}
```

---

## A2A Agents

### List A2A Agents

```
GET /api/projects/{id}/a2a-agents
```

### Create A2A Agent

```
POST /api/projects/{id}/a2a-agents
```

```json
{
  "name": "Code Review Agent",
  "provider": "custom",
  "config": {
    "endpoint": "https://agent.example.com/a2a",
    "capabilities": ["code-review"]
  }
}
```

### Update A2A Agent

```
PUT /api/a2a-agents/{id}
```

### Delete A2A Agent

```
DELETE /api/a2a-agents/{id}
```

---

## OpenClaw Config

### Get OpenClaw Config

```
GET /api/projects/{id}/openclaw
```

### Update OpenClaw Config

```
PUT /api/projects/{id}/openclaw
```

---

## Visualization

### Project Graph

```
GET /api/projects/{id}/graph
```

Returns nodes (skills, agents), edges (includes, assignments), and detected circular dependencies.

---

## Reverse Import

### Detect Skills in Provider Configs

```
POST /api/import/detect
```

```json
{
  "path": "/path/to/project"
}
```

### Import Detected Skills

```
POST /api/projects/{id}/import
```

---

## Desktop Config Sync

### List Synced Desktop Apps

```
GET /api/desktop-configs
```

### Detect Installed Apps

```
GET /api/desktop-configs/detect
```

### Register App

```
POST /api/desktop-configs
```

### Unregister App

```
DELETE /api/desktop-configs/{appSlug}
```

### Sync All Apps

```
POST /api/desktop-configs/sync
```

### Sync Single App

```
POST /api/desktop-configs/{appSlug}/sync
```

### Preview Sync

```
GET /api/desktop-configs/{appSlug}/preview
```

### Import MCP Servers from App

```
POST /api/desktop-configs/import-mcp
```

---

## Authentication

### Register

```
POST /api/auth/register
```

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

### Login

```
POST /api/auth/login
```

```json
{
  "email": "jane@example.com",
  "password": "password"
}
```

### Logout

```
POST /api/auth/logout
```

### Current User

```
GET /api/auth/me
```

---

## Billing

### Subscription Status

```
GET /api/billing/status
```

### Available Plans

```
GET /api/billing/plans
```

### Subscribe

```
POST /api/billing/subscribe
```

```json
{
  "plan": "pro"
}
```

### Change Plan

```
POST /api/billing/change-plan
```

### Cancel Subscription

```
POST /api/billing/cancel
```

### Resume Subscription

```
POST /api/billing/resume
```

### Setup Payment Intent

```
POST /api/billing/setup-intent
```

### Update Payment Method

```
PUT /api/billing/payment-method
```

### Invoice History

```
GET /api/billing/invoices
```

### Usage Breakdown

```
GET /api/billing/usage
```

### Stripe Connect (Marketplace Sellers)

```
POST /api/billing/connect
GET  /api/billing/connect/status
GET  /api/billing/earnings
```
