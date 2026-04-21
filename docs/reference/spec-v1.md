<div v-pre>

# Skill Format Specification v1

> **Status:** Stable
> **Spec Version:** 1
> **Last Updated:** 2026-03-20

This document is the formal specification for the `.skillr/` skill format. Implementations MUST conform to this spec to ensure interoperability across the Skillr CLI, web UI, and third-party tools.

The key words "MUST", "MUST NOT", "SHOULD", "SHOULD NOT", and "MAY" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## 1. Directory Structure

A Skillr-managed project MUST contain a `.skillr/` directory at the project root with the following structure:

```
project-root/
  .skillr/
    manifest.json
    skills/
      simple-skill.md              # flat format
      complex-skill/               # folder format
        skill.md
        gotchas.md
        examples/
          good-output.md
```

### 1.1 Manifest

The file `.skillr/manifest.json` MUST exist and MUST be valid JSON conforming to this schema:

```json
{
  "spec_version": 1,
  "id": "uuid-string",
  "name": "project-name",
  "description": "",
  "providers": ["claude", "cursor", "copilot", "windsurf", "cline", "codex"],
  "skills": ["skill-slug-1", "skill-slug-2"],
  "created_at": "2026-03-20T10:00:00Z",
  "synced_at": "2026-03-20T10:05:00Z"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `spec_version` | integer | MUST | Format version. MUST be `1` for this spec. |
| `id` | string (UUID) | MUST | Unique identifier for the project. |
| `name` | string | MUST | Human-readable project name. |
| `description` | string | SHOULD | Short project description. |
| `providers` | string[] | MUST | Provider slugs to sync to. Valid values: `claude`, `cursor`, `copilot`, `windsurf`, `cline`, `codex`, `openai` (deprecated), `zed`, `aider`, `continue`, `junie`. |
| `skills` | string[] | SHOULD | Array of skill slugs present in `skills/`. |
| `created_at` | string (ISO 8601) | SHOULD | Creation timestamp. |
| `synced_at` | string (ISO 8601) \| null | MAY | Last sync timestamp. `null` if never synced. |

### 1.2 Skills Directory

The `skills/` directory contains skill definitions in one of two formats:

- **Flat format:** `{slug}.md` — a single Markdown file with YAML frontmatter.
- **Folder format:** `{slug}/skill.md` — a directory containing a main skill file plus optional supplementary files.

Implementations MUST support both formats. The folder format SHOULD be used when a skill has gotchas or supplementary files.

## 2. Skill File Format

A skill file consists of YAML frontmatter delimited by `---` followed by a Markdown body.

```markdown
---
id: my-skill
name: My Skill
description: What this skill does
---

The skill body in Markdown.
```

### 2.1 Frontmatter

Frontmatter MUST be valid YAML enclosed between two `---` delimiters. The opening `---` MUST be the first non-whitespace content in the file.

If the file does not start with `---`, the entire content MUST be treated as the body with an empty frontmatter object.

If the opening `---` exists but no closing `---` is found, the entire content MUST be treated as the body with an empty frontmatter object.

### 2.2 Required Fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier within the project. MUST match the filename slug. |
| `name` | string | Human-readable display name. MUST NOT be empty. |

An implementation MUST reject skill files missing `id` or `name` with a validation error.

### 2.3 Optional Fields

| Field | Type | Default | Description |
|---|---|---|---|
| `description` | string | `null` | Short summary of the skill's purpose. |
| `category` | string | `"general"` | Skill category. See [Section 3](#3-categories). |
| `skill_type` | string | `null` | `"capability-uplift"` or `"encoded-preference"`. See [Section 4](#4-skill-types). |
| `model` | string | `null` | Target LLM model (e.g., `claude-sonnet-4-6`). |
| `max_tokens` | integer | `null` | Maximum output tokens for testing. |
| `tags` | string[] | `[]` | Tags for categorization and filtering. |
| `tools` | object[] | `[]` | Tool/function definitions in JSON Schema format. |
| `includes` | string[] | `[]` | Slugs of other skills in the same project. See [Composition Spec](./composition-spec.md). |
| `template_variables` | object[] | `[]` | Template variable definitions. See [Template Spec](./template-spec.md). |
| `gotchas` | string | `null` | Common failure points and edge cases. |
| `supplementary_files` | object[] | `[]` | Additional files in folder-based skills. |
| `conditions` | object | `null` | Conditional activation rules (file patterns, path prefixes). |
| `created_at` | string (ISO 8601) | auto-set | Creation timestamp. |
| `updated_at` | string (ISO 8601) | auto-set | Last modification timestamp. |

### 2.4 Template Variable Definition

Each entry in `template_variables` MUST have:

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | MUST | Variable name. MUST match `[a-zA-Z_][a-zA-Z0-9_]*`. |
| `description` | string | SHOULD | What this variable represents. |
| `default` | string | MAY | Default value if no override is provided. |

### 2.5 Supplementary File Object

Each entry in `supplementary_files`:

| Field | Type | Required | Description |
|---|---|---|---|
| `path` | string | MUST | Relative path within the skill folder. |
| `content` | string | MUST | File content. |

### 2.6 Conditions Object

| Field | Type | Description |
|---|---|---|
| `file_patterns` | string[] | Glob patterns for file-scoped activation (e.g., `["*.py", "tests/**"]`). |
| `path_prefixes` | string[] | Directory prefixes for path-scoped activation. |

## 3. Categories

Valid category values:

| Value | Description |
|---|---|
| `library-api-reference` | API usage patterns, SDK documentation |
| `product-verification` | Testing, QA, validation |
| `data-analysis` | Data processing, analytics, reporting |
| `business-automation` | Workflow automation, integrations |
| `scaffolding-templates` | Code generation, boilerplates |
| `code-quality-review` | Code review, style enforcement |
| `ci-cd-deployment` | Build pipelines, deployment |
| `incident-runbooks` | On-call procedures, troubleshooting |
| `infrastructure-ops` | Infrastructure management, DevOps |
| `general` | Default catch-all |

Implementations SHOULD accept any string value for forward compatibility but MAY warn on unrecognized categories.

## 4. Skill Types

| Value | Description |
|---|---|
| `capability-uplift` | Teaches the AI domain knowledge it doesn't have. |
| `encoded-preference` | Captures behavioral preferences and style rules. |

The `skill_type` field is OPTIONAL. If present, it MUST be one of the two values above.

## 5. Slugs

Slugs are derived from skill names:

1. Convert to lowercase
2. Replace spaces and non-alphanumeric characters with hyphens
3. Collapse consecutive hyphens
4. Remove leading and trailing hyphens

Slugs MUST be unique within a project. The slug MUST match the filename (flat format) or directory name (folder format).

## 6. Body

Everything after the closing `---` delimiter is the skill body. The body:

- MUST be treated as Markdown.
- MAY contain `{{variable}}` template placeholders. See [Template Spec](./template-spec.md).
- MUST be passed verbatim to the model after template resolution.
- SHOULD use Markdown headings, lists, and code blocks for structure.

## 7. Folder Format

When a skill uses the folder format, the directory MUST contain `skill.md` as the main skill file. Additional files are OPTIONAL:

| File | Purpose |
|---|---|
| `skill.md` | Main skill file (frontmatter + body). REQUIRED. |
| `gotchas.md` | Common failure points. Content overwrites the `gotchas` frontmatter field. |
| Any other files | Supplementary files. Collected into `supplementary_files` array. |

The `skill.md` and `gotchas.md` filenames are reserved. All other files in the directory are treated as supplementary files.

### 7.1 Progressive Disclosure

Implementations MAY support 3 levels of skill resolution:

| Level | Content | Use Case |
|---|---|---|
| 1 | `"{name}: {description}"` (~100 tokens) | Agent skill discovery |
| 2 | Full resolved body with includes | Standard compose/sync |
| 3 | Body + gotchas + supplementary files | Deep context execution |

## 8. Backward Compatibility

This spec guarantees:

- Flat format skills (v0, pre-spec) MUST continue to work with no changes.
- The `spec_version` field in `manifest.json` is REQUIRED for new projects but OPTIONAL for existing projects (absence implies v1).
- New optional fields MUST NOT break existing parsers — unknown fields MUST be ignored.

## 9. File Encoding

All skill files MUST be encoded in UTF-8. Line endings SHOULD be LF (`\n`). Implementations MUST handle CRLF gracefully.

</div>
