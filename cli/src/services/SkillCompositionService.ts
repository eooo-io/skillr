import type { ParsedSkill } from '../types.js';

const MAX_DEPTH = 5;

/**
 * Resolve a skill's full body by prepending included skill bodies.
 * Uses filesystem-based skill lookup (no database).
 */
export function resolve(
  skill: ParsedSkill,
  allSkills: Map<string, ParsedSkill>,
  visited: string[] = [],
  depth: number = 0,
): string {
  if (depth > MAX_DEPTH) {
    return `<!-- Include depth limit exceeded -->\n\n${skill.body}`;
  }

  const includes = skill.frontmatter.includes ?? [];

  if (includes.length === 0) {
    return skill.body;
  }

  const currentVisited = [...visited, skill.slug];
  const sections: string[] = [];

  for (const slug of includes) {
    if (currentVisited.includes(slug)) {
      sections.push(`<!-- Circular include skipped: ${slug} -->`);
      continue;
    }

    const included = allSkills.get(slug);

    if (!included) {
      sections.push(`<!-- Include not found: ${slug} -->`);
      continue;
    }

    sections.push(resolve(included, allSkills, currentVisited, depth + 1));
  }

  sections.push(skill.body);

  return sections.filter(Boolean).join('\n\n');
}

/**
 * Validate includes for a skill and return errors.
 */
export function validateIncludes(
  skill: ParsedSkill,
  allSkills: Map<string, ParsedSkill>,
): string[] {
  const errors: string[] = [];
  const includes = skill.frontmatter.includes ?? [];

  for (const slug of includes) {
    if (slug === skill.slug) {
      errors.push(`Skill cannot include itself: ${slug}`);
      continue;
    }

    if (!allSkills.has(slug)) {
      errors.push(`Included skill not found: ${slug}`);
    }
  }

  if (errors.length === 0) {
    detectCycles(skill, [skill.slug], allSkills, errors);
  }

  return errors;
}

function detectCycles(
  skill: ParsedSkill,
  path: string[],
  allSkills: Map<string, ParsedSkill>,
  errors: string[],
  depth: number = 0,
): void {
  if (depth > MAX_DEPTH) return;

  for (const slug of skill.frontmatter.includes ?? []) {
    if (path.includes(slug)) {
      errors.push(`Circular dependency detected: ${[...path, slug].join(' -> ')}`);
      continue;
    }

    const included = allSkills.get(slug);
    if (included && (included.frontmatter.includes?.length ?? 0) > 0) {
      detectCycles(included, [...path, slug], allSkills, errors, depth + 1);
    }
  }
}
