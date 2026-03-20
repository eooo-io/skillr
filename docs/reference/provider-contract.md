# Provider Output Contract

> **Status:** Stable
> **Spec Version:** 1
> **Last Updated:** 2026-03-20

This document specifies the contract that every provider driver MUST implement. A provider driver transforms resolved skills into the native configuration format for a specific AI tool.

## 1. Interface

Every provider driver MUST implement the following interface:

```typescript
interface ProviderDriver {
  /**
   * Provider metadata.
   */
  readonly name: string;     // Human-readable name (e.g., "Claude")
  readonly slug: string;     // Machine identifier (e.g., "claude")

  /**
   * Generate output files from resolved skills.
   *
   * MUST be a pure function — no side effects, no file I/O, no network calls.
   * All file writing is handled by the sync orchestrator.
   *
   * @param skills - Array of resolved skills (includes expanded, templates substituted)
   * @param projectPath - Absolute path to the project root
   * @returns Array of file outputs to write
   */
  generate(skills: ResolvedSkill[], projectPath: string): FileOutput[];
}
```

## 2. Input: ResolvedSkill

Each skill passed to `generate()` has already been through include resolution and template variable substitution. The driver receives the final content ready for output.

```typescript
interface ResolvedSkill {
  slug: string;
  name: string;
  description: string | null;
  body: string;              // Resolved body (includes expanded, templates substituted)
  category: string;
  skill_type: string | null;
  gotchas: string | null;
  tags: string[];
  conditions: {
    file_patterns?: string[];
    path_prefixes?: string[];
  } | null;
}
```

Drivers MUST NOT perform include resolution or template substitution — that is the orchestrator's responsibility.

## 3. Output: FileOutput

```typescript
interface FileOutput {
  /** Absolute path where the file should be written. */
  path: string;
  /** File content as a UTF-8 string. */
  content: string;
}
```

The sync orchestrator handles all file I/O: creating directories, writing files, and cleaning up stale files. Drivers MUST only return the desired file state.

## 4. Built-in Provider Specifications

### 4.1 Claude

| Property | Value |
|---|---|
| Slug | `claude` |
| Output | `.claude/CLAUDE.md` |
| Format | Single file. Each skill as an H2 heading followed by its body. |

**Output structure:**

```markdown
# CLAUDE.md

## {skill.name}

{skill.body}

---

## {skill.name}

{skill.body}

---
```

Skills with `conditions.file_patterns` SHOULD include an "Applies to" note:

```markdown
> **Applies to:** `*.py, tests/**`
```

Skills with gotchas SHOULD append a `### Common Gotchas` subsection.

### 4.2 Cursor

| Property | Value |
|---|---|
| Slug | `cursor` |
| Output | `.cursor/rules/{slug}.mdc` (one file per skill) |
| Format | MDC format with YAML frontmatter. |

**Output structure per file:**

```markdown
---
description: {skill.description}
alwaysApply: true
globs: ["*.py"]     # only if conditions.file_patterns is set
---

{skill.body}
```

- `alwaysApply` MUST be `true` when the skill has no conditions, `false` otherwise.
- `globs` MUST be set only when `conditions.file_patterns` is non-empty.
- Tags SHOULD be included in frontmatter if present.

### 4.3 GitHub Copilot

| Property | Value |
|---|---|
| Slug | `copilot` |
| Output | `.github/copilot-instructions.md` |
| Format | Single file. Each skill as an H2 heading. Same structure as Claude. |

### 4.4 Windsurf

| Property | Value |
|---|---|
| Slug | `windsurf` |
| Output | `.windsurf/rules/{slug}.md` (one file per skill) |
| Format | Plain Markdown, one file per skill. |

**Output structure per file:**

```markdown
# {skill.name}

{skill.body}
```

### 4.5 Cline

| Property | Value |
|---|---|
| Slug | `cline` |
| Output | `.clinerules` |
| Format | Single flat file. Each skill as an H2 heading. |

**Output structure:**

```markdown
## {skill.name}

{skill.body}

---

## {skill.name}

{skill.body}
```

### 4.6 OpenAI

| Property | Value |
|---|---|
| Slug | `openai` |
| Output | `.openai/instructions.md` |
| Format | Single file. Each skill as an H2 heading. Same structure as Claude. |

## 5. Stale File Cleanup

When syncing, the orchestrator MUST:

1. Call `generate()` to get the proposed file list.
2. Compare against existing provider files on disk.
3. Delete any existing provider files that are NOT in the proposed list (stale files from renamed/deleted skills).

For multi-file providers (Cursor, Windsurf), this means removing `.mdc` or `.md` files that no longer correspond to a skill.

For single-file providers (Claude, Copilot, Cline, OpenAI), the file is simply overwritten.

## 6. Provider Registration

Built-in providers are registered automatically. Custom providers MAY be registered via `manifest.json`:

```json
{
  "providers": ["claude", "cursor", "./providers/my-custom-provider.js"]
}
```

Paths starting with `./` are resolved relative to the `.skillr/` directory. Custom providers MUST export an object conforming to the `ProviderDriver` interface.
