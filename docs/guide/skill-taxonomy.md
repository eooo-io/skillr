# Skill Taxonomy

Skillr supports a structured taxonomy for organizing and classifying skills based on Anthropic's best practices for AI skill design. This system helps agents discover the right skill at the right time.

## Categories

Every skill can be assigned to one of 10 categories. Categories describe what domain the skill operates in and are used to group skills in the project detail view.

| Category | Description |
|---|---|
| `library-api-reference` | API usage patterns, SDK documentation, library guides |
| `product-verification` | Testing, QA, validation, acceptance criteria |
| `data-analysis` | Data processing, analytics, reporting, visualization |
| `business-automation` | Workflow automation, integrations, business rules |
| `scaffolding-templates` | Code generation, project scaffolding, boilerplates |
| `code-quality-review` | Code review, linting rules, style enforcement |
| `ci-cd-deployment` | Build pipelines, deployment scripts, release automation |
| `incident-runbooks` | On-call procedures, incident response, troubleshooting |
| `infrastructure-ops` | Infrastructure management, monitoring, DevOps |
| `general` | Catch-all for skills that don't fit a specific category |

Set the category in the **Frontmatter Form** using the category dropdown. When no category is selected, the skill defaults to `general`.

### Grouped View

On the project detail page, skills are grouped by category in collapsible sections. Each section shows the category name, icon, and skill count. This makes it easy to scan a project with dozens of skills and find what you need.

## Skill Types

Skills fall into two fundamental types that describe _how_ they help the AI:

### Capability Uplift

A **capability uplift** skill teaches the AI something it cannot do on its own. These skills provide domain knowledge, API references, or specialized procedures that go beyond the model's training data.

Examples:
- Internal API reference documentation
- Company-specific deployment procedures
- Proprietary data format specifications

### Encoded Preference

An **encoded preference** skill captures how you want the AI to behave -- coding style, output format, tone, or decision-making rules. The AI _could_ produce valid output without the skill, but the skill ensures it matches your preferences.

Examples:
- Code style guidelines (naming conventions, patterns)
- Output format templates (always use bullet points, include examples)
- Decision rules (prefer composition over inheritance)

Set the skill type in the Frontmatter Form using the radio toggle. The linter will suggest setting a type if one is not specified.

::: tip
Understanding the distinction helps with skill design: capability uplift skills should focus on _what_ (knowledge), while encoded preference skills should focus on _how_ (behavior rules).
:::

## Gotchas

The gotchas field captures common failure points, edge cases, and warnings for a skill. According to Anthropic's research, gotcha sections are the **highest-signal content** in any skill -- they prevent the AI from making mistakes it would otherwise repeat.

### Writing Good Gotchas

Gotchas should be specific and actionable:

```markdown
- Never use `rm -rf` without confirming the target path first
- The payments API returns amounts in cents, not dollars -- always divide by 100 for display
- PostgreSQL JSONB operators differ from MySQL JSON functions -- don't assume syntax compatibility
- Rate limits on the staging API are 10x lower than production -- tests may fail if run too fast
```

Avoid vague gotchas like "be careful with edge cases" -- these don't help the AI avoid specific mistakes.

### Gotchas in the Editor

The gotchas field appears as a collapsible textarea in the Frontmatter Form. It supports plain text or Markdown. Gotchas are included in the skill's sync output and composed agent output.

### Linting for Gotchas

The [prompt linter](./linting) warns when a complex skill (over 500 tokens) has no gotchas. This is a suggestion, not a hard error -- but adding gotchas to substantial skills significantly improves output quality.

## Supplementary Files

Skills can include additional files beyond the main Markdown body. When a skill has supplementary files, it is stored as a folder rather than a flat file:

```
.skillr/skills/
├── api-client/              # Folder-based skill
│   ├── skill.md             # Main skill file
│   ├── gotchas.md           # Extracted gotchas
│   └── examples/
│       └── good-output.md   # Example outputs
├── simple-rule.md           # Flat file skill (still supported)
```

### Progressive Disclosure

Skills with supplementary files support 3 levels of detail for agent discovery:

1. **Level 1** (~100 tokens) -- Name and description only. Used for agent skill discovery when scanning available skills.
2. **Level 2** (~500 tokens) -- Name, description, gotchas, and key rules. Used when the agent is considering whether to apply the skill.
3. **Level 3** (full) -- Complete skill body with all supplementary files. Used when the agent is actively executing the skill.

This allows agents to efficiently triage which skills are relevant without loading every full skill body into context.

### Backward Compatibility

Flat-file skills (a single `.md` file per skill) continue to work exactly as before. The folder format is only used when a skill has gotchas or supplementary files. Skillr detects both formats automatically during project scans.
