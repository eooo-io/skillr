# Composition & Include Resolution Specification

> **Status:** Stable
> **Spec Version:** 1
> **Last Updated:** 2026-03-20

This document specifies how skill includes are resolved during composition.

## 1. Include Syntax

Skills declare dependencies via the `includes` frontmatter field:

```yaml
includes: [base-instructions, coding-standards]
```

Each entry is a slug referencing another skill in the same project.

## 2. Resolution Algorithm

When a skill is resolved, its includes are processed **in array order**:

```
resolve(skill, visited=[], depth=0):
  1. If depth > MAX_DEPTH (5):
       Return "<!-- Include depth limit exceeded -->\n\n" + skill.body
  2. If skill.includes is empty:
       Return skill.body
  3. Add skill.slug to visited
  4. For each slug in skill.includes:
     a. If slug is in visited:
          Append "<!-- Circular include skipped: {slug} -->"
          Continue to next
     b. Look up skill by slug in the same project
     c. If not found:
          Append "<!-- Include not found: {slug} -->"
          Continue to next
     d. Recursively resolve the included skill:
          Append resolve(included_skill, visited, depth + 1)
  5. Append skill.body
  6. Join all sections with "\n\n", filtering empty strings
  7. Return joined result
```

## 3. Resolution Order

Included content is **prepended** before the skill's own body. Given:

```
skill A includes [B, C]
```

The resolved output is:

```
{resolved body of B}

{resolved body of C}

{body of A}
```

This means base/shared instructions come first, and the skill's specific instructions come last — allowing the skill to override or specialize shared rules.

## 4. Max Depth

Implementations MUST enforce a maximum include depth of **5 levels**. When the depth limit is exceeded, implementations MUST:

1. Stop recursing.
2. Include the current skill's body without further resolution.
3. Insert a comment: `<!-- Include depth limit exceeded -->`.

## 5. Circular Dependency Detection

Circular dependencies occur when skill A includes B, which includes C, which includes A.

Implementations MUST detect circular dependencies by tracking visited slugs during resolution. When a circular dependency is detected:

1. The circular include MUST be skipped.
2. A comment MUST be inserted: `<!-- Circular include skipped: {slug} -->`.
3. Resolution MUST continue with remaining includes (do not abort).

### 5.1 Validation

Implementations SHOULD provide a validation function that detects cycles before resolution:

```
detectCycles(skill, path=[skill.slug], errors=[]):
  For each slug in skill.includes:
    If slug is in path:
      errors.push("Circular dependency: " + path.join(" -> ") + " -> " + slug)
      Continue
    Look up included skill
    If found and included.includes is non-empty:
      detectCycles(included, [...path, slug], errors)
```

## 6. Missing Includes

When a referenced slug does not exist in the project:

1. The missing include MUST be skipped.
2. A comment MUST be inserted: `<!-- Include not found: {slug} -->`.
3. Implementations SHOULD emit a warning to stderr or the lint output.
4. Resolution MUST continue with remaining includes.

## 7. Self-Include

A skill MUST NOT include itself. If `skill.includes` contains the skill's own slug:

1. Implementations MUST treat it as a circular dependency.
2. The self-include MUST be skipped with the circular include comment.

## 8. Diamond Dependencies

If skill A includes B and C, and both B and C include D, then D's body appears twice in the resolved output. This is the expected behavior — implementations MUST NOT deduplicate included content.

Rationale: Deduplication would require tracking content identity across the resolution tree, adding complexity without clear benefit. Skill authors should structure includes to avoid unintended duplication.

## 9. Cross-Project Includes

Includes MUST be resolved within the same project only. Cross-project references are NOT supported. An include slug that does not match any skill in the current project MUST be treated as a missing include (Section 6).

## 10. Include Resolution Timing

Include resolution happens at **sync time** and **test time**, not at edit time. The raw `includes` array is stored in frontmatter and resolved on demand.
