<div v-pre>

# Template Variable Resolution Specification

> **Status:** Stable
> **Spec Version:** 1
> **Last Updated:** 2026-03-20

This document specifies how `{{variable}}` template placeholders are resolved in skill bodies.

## 1. Syntax

Template variables use double-brace syntax:

```
{{variable_name}}
```

### 1.1 Variable Names

Variable names MUST match the regex pattern `\w+` (equivalent to `[a-zA-Z0-9_]+`).

Valid: `{{language}}`, `{{max_retries}}`, `{{API_KEY_NAME}}`

Invalid: `{{my-var}}` (hyphens not allowed), `{{my var}}` (spaces not allowed)

### 1.2 Whitespace

Whitespace inside braces is NOT supported. `{{ language }}` MUST NOT be treated as a template variable — only `{{language}}` (no spaces) is recognized.

## 2. Resolution Algorithm

```
resolve(body, variables):
  Replace every occurrence matching /\{\{(\w+)\}\}/ with:
    If the captured name exists as a key in variables:
      Replace with variables[name]
    Else:
      Leave the original placeholder unchanged ("{{name}}")
```

This is a single-pass regex substitution. Implementations MUST NOT recurse — if a variable's value contains `{{other}}`, that inner placeholder MUST NOT be resolved.

## 3. Variable Value Sources

Variables are resolved from these sources, in priority order (highest first):

| Priority | Source | Description |
|---|---|---|
| 1 | CLI flags | `--var language=Python` |
| 2 | Environment variables | `SKILLR_VAR_LANGUAGE=Python` |
| 3 | Config file | `skillr.config.js` exports `{ variables: { language: "Python" } }` |
| 4 | Frontmatter defaults | `template_variables[].default` in the skill's frontmatter |

Implementations MUST check sources in priority order and use the first match.

### 3.1 Frontmatter Defaults

Default values are defined in the skill's `template_variables` array:

```yaml
template_variables:
  - name: language
    description: Output language
    default: English
  - name: framework
    description: Backend framework
    default: Laravel
```

If no higher-priority source provides a value, the `default` is used. If no default exists, the variable is unresolved.

## 4. Unresolved Variables

When a variable has no value from any source:

1. The placeholder MUST be left as-is in the output (e.g., `{{unknown_var}}` remains `{{unknown_var}}`).
2. Implementations SHOULD emit a warning listing unresolved variables.
3. Resolution MUST NOT fail — unresolved variables are warnings, not errors.

## 5. Resolution Timing

Template resolution happens at **sync time** and **test time**, not at edit time. The raw `{{variable}}` placeholders are stored in skill files and resolved on demand.

This means:
- The skill editor shows raw `{{variable}}` placeholders.
- `skillr sync` and `skillr test` produce output with variables substituted.
- `skillr diff` shows the resolved output (after substitution).

## 6. Variable Extraction

Implementations MUST provide a function to extract all variable names from a body:

```
extractVariables(body) -> string[]:
  Match all /\{\{(\w+)\}\}/ in body
  Return unique captured names
```

This is used for:
- Displaying which variables a skill expects
- Detecting missing variable definitions
- Linting (warn if body uses `{{var}}` but `template_variables` doesn't define it)

## 7. Missing Variable Detection

Implementations SHOULD provide a function to detect variables used in the body but not defined in `template_variables` or any value source:

```
getMissing(body, variables) -> string[]:
  found = extractVariables(body)
  Return found.filter(name => name not in variables)
```

## 8. Escaping

This spec does NOT define an escaping mechanism for literal `{{` in output. If a skill body needs to contain literal `{{variable}}` text (e.g., documenting template syntax), the author should use a code block or alternative notation.

Rationale: Escaping adds parsing complexity for a rare edge case. Code blocks (`` `{{variable}}` ``) in Markdown already handle the most common case.

## 9. Scope

Template resolution applies to:
- Skill bodies (after include resolution)
- Composed agent output (after skill bodies are merged)

Template resolution does NOT apply to:
- Frontmatter fields (they are metadata, not prompt content)
- File paths
- Manifest fields

</div>
